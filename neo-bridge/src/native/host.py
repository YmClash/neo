#!/usr/bin/env python3
"""
Neo Native Messaging Host — v0.2.0 (Phase 3)
Bridges the Chrome extension with the local operating system.

Features:
  - System metrics (CPU, RAM, Disk, Network, Top Processes)
  - Panic Mode detector (CPU/RAM surge protection)
  - Nano Sentiment Engine (zero-dependency keyword analysis)
  - Sandboxed command executor
  - Context logger (Prompt Buffer preparation for Phase 4 AI)

Protocol: stdin/stdout with 32-bit length header (Chrome Native Messaging).
Logs:     %~dp0neo-bridge.log (stderr never used — reserved by Chrome protocol)
"""

import sys
import json
import struct
import subprocess
import platform
import os
import logging
from datetime import datetime
from pathlib import Path

# ─── Logging Setup ─────────────────────────────────────────────────────────────
# CRITICAL: stdout is reserved for the Chrome NativeMessaging protocol.
# ALL debug output MUST go to a log file, never to stdout/stderr directly.

LOG_PATH = Path(__file__).parent / "neo-bridge.log"
logging.basicConfig(
    filename=str(LOG_PATH),
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("neo-bridge")

# ─── Nano Sentiment Engine ─────────────────────────────────────────────────────
# Zero-dependency keyword-based sentiment analysis (FR + EN bilingual).
# Score range: -1.0 (very negative) → 0.0 (neutral) → +1.0 (very positive)

_POSITIVE_WORDS = {
    # English — Tech/General
    "excellent", "fast", "performant", "stable", "reliable", "innovative",
    "efficient", "powerful", "elegant", "clean", "robust", "secure", "safe",
    "success", "solved", "fixed", "optimized", "improved", "great", "best",
    "modern", "advanced", "lightweight", "scalable", "flexible", "smart",
    "intuitive", "seamless", "solid", "accurate", "precise", "useful",
    "recommended", "popular", "trusted", "proven", "complete", "beautiful",
    "awesome", "impressive", "outstanding", "remarkable", "brilliant",
    # French — Tech/General
    "excellent", "rapide", "performant", "stable", "fiable", "innovant",
    "efficace", "puissant", "élégant", "propre", "robuste", "sécurisé", "sûr",
    "succès", "résolu", "corrigé", "optimisé", "amélioré", "génial", "meilleur",
    "moderne", "avancé", "léger", "évolutif", "flexible", "intelligent",
    "intuitif", "fluide", "solide", "précis", "utile", "recommandé",
    "populaire", "fiable", "complet", "magnifique", "incroyable", "impressionnant",
}

_NEGATIVE_WORDS = {
    # English — Tech/General
    "slow", "bug", "crash", "deprecated", "broken", "fail", "failed", "error",
    "issue", "problem", "vulnerability", "insecure", "unsafe", "unstable",
    "bloated", "complex", "difficult", "laggy", "memory", "leak", "overflow",
    "exploit", "attack", "malware", "virus", "backdoor", "outdated", "legacy",
    "abandoned", "unmaintained", "dangerous", "critical", "severe", "worst",
    "terrible", "awful", "horrible", "useless", "broken", "dead", "toxic",
    "harmful", "risky", "flawed", "corrupted", "freeze", "hang", "timeout",
    # French — Tech/General
    "lent", "bogue", "plantage", "déprécié", "cassé", "échec", "erreur",
    "problème", "vulnérabilité", "non-sécurisé", "instable", "lourd",
    "complexe", "difficile", "lenteur", "fuite", "débordement", "exploit",
    "attaque", "malware", "virus", "obsolète", "abandonné", "dangereux",
    "critique", "grave", "terrible", "inutile", "mort", "toxique", "risqué",
    "défaillant", "corrompu", "gel", "blocage", "timeout",
}


def analyze_sentiment(text: str) -> dict:
    """
    Analyze sentiment of text using keyword matching.
    Returns score (-1.0 to 1.0), label, and word counts.
    """
    if not text or not text.strip():
        return {"score": 0.0, "label": "neutral", "positive_hits": 0, "negative_hits": 0}

    words = text.lower().split()
    total_words = max(len(words), 1)

    pos_hits = sum(1 for w in words if w.strip(".,!?;:\"'()[]{}") in _POSITIVE_WORDS)
    neg_hits = sum(1 for w in words if w.strip(".,!?;:\"'()[]{}") in _NEGATIVE_WORDS)

    raw_score = (pos_hits - neg_hits) / total_words
    # Amplify and clamp to [-1.0, 1.0]
    score = max(-1.0, min(1.0, raw_score * 15))

    if score > 0.08:
        label = "positive"
    elif score < -0.08:
        label = "negative"
    else:
        label = "neutral"

    return {
        "score": round(score, 3),
        "label": label,
        "positive_hits": pos_hits,
        "negative_hits": neg_hits,
        "word_count": total_words,
    }


# ─── Panic Detector ────────────────────────────────────────────────────────────
# Tracks consecutive polls exceeding thresholds to avoid false positives.

class PanicDetector:
    CPU_CRITICAL    = 90.0   # % — sustained high CPU
    RAM_CRITICAL    = 95.0   # % — very high RAM
    CPU_DUAL        = 85.0   # % — CPU + RAM combo
    RAM_DUAL        = 85.0   # % — CPU + RAM combo
    CPU_RECOVERY    = 70.0   # % — back to normal
    CONSECUTIVE_REQ = 3      # polls needed to confirm panic

    def __init__(self):
        self._consecutive_high = 0
        self._in_panic = False

    def evaluate(self, cpu: float, ram: float) -> dict:
        """
        Evaluate current metrics and return panic status.
        Returns: {panic: bool, level: str, reason: str, recovering: bool}
        """
        is_critical = (
            cpu >= self.CPU_CRITICAL
            or ram >= self.RAM_CRITICAL
            or (cpu >= self.CPU_DUAL and ram >= self.RAM_DUAL)
        )

        if is_critical:
            self._consecutive_high += 1
        else:
            self._consecutive_high = max(0, self._consecutive_high - 1)

        # Determine level
        if self._consecutive_high >= self.CONSECUTIVE_REQ:
            self._in_panic = True
            if ram >= self.RAM_CRITICAL:
                level = "CRITICAL"
                reason = f"RAM critique : {ram:.1f}%"
            elif cpu >= self.CPU_CRITICAL:
                level = "CRITICAL"
                reason = f"CPU critique : {cpu:.1f}%"
            else:
                level = "HIGH"
                reason = f"Surcharge combinée CPU {cpu:.1f}% + RAM {ram:.1f}%"
        elif self._in_panic and cpu < self.CPU_RECOVERY:
            self._in_panic = False
            self._consecutive_high = 0
            return {
                "panic": False,
                "level": "RECOVERY",
                "reason": f"Système stabilisé — CPU {cpu:.1f}%",
                "recovering": True,
                "consecutive": self._consecutive_high,
            }
        else:
            level = "NORMAL"
            reason = "Nominal"

        return {
            "panic": self._in_panic,
            "level": level,
            "reason": reason,
            "recovering": False,
            "consecutive": self._consecutive_high,
        }


# Singleton panic detector (persists across messages within one process instance)
_panic_detector = PanicDetector()


# ─── Native Messaging Protocol ─────────────────────────────────────────────────

def read_message() -> dict | None:
    """Read a message from Chrome (stdin) using the native messaging protocol."""
    try:
        raw_length = sys.stdin.buffer.read(4)
        if not raw_length or len(raw_length) < 4:
            return None
        message_length = struct.unpack("@I", raw_length)[0]
        if message_length == 0 or message_length > 1_048_576:  # 1MB max
            log.warning(f"Invalid message length: {message_length}")
            return None
        message_data = sys.stdin.buffer.read(message_length).decode("utf-8")
        return json.loads(message_data)
    except Exception as e:
        log.error(f"read_message error: {e}")
        return None


def send_message(message: dict) -> None:
    """Send a message to Chrome (stdout) using the native messaging protocol."""
    try:
        encoded = json.dumps(message, ensure_ascii=False).encode("utf-8")
        sys.stdout.buffer.write(struct.pack("@I", len(encoded)))
        sys.stdout.buffer.write(encoded)
        sys.stdout.buffer.flush()
    except Exception as e:
        log.error(f"send_message error: {e}")


# ─── Command Handlers ──────────────────────────────────────────────────────────

def handle_ping() -> dict:
    return {
        "type": "pong",
        "data": {
            "status": "alive",
            "version": "0.2.0",
            "python": platform.python_version(),
            "timestamp": datetime.now().isoformat(),
        },
    }


def handle_system_info() -> dict:
    return {
        "type": "system_info",
        "data": {
            "platform": platform.system(),
            "platform_version": platform.version(),
            "architecture": platform.machine(),
            "processor": platform.processor(),
            "hostname": platform.node(),
            "python_version": platform.python_version(),
        },
    }


def handle_system_metrics() -> dict:
    """Return system metrics with Panic evaluation and top processes."""
    try:
        import psutil

        t_start = datetime.now()
        cpu = psutil.cpu_percent(interval=0.3)
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage("/")
        net = psutil.net_io_counters()

        # Top 5 processes by CPU usage
        top_procs = []
        try:
            procs = []
            for p in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent"]):
                try:
                    procs.append(p.info)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
            top_procs = sorted(procs, key=lambda x: x.get("cpu_percent", 0), reverse=True)[:5]
        except Exception as e:
            log.warning(f"top_processes error: {e}")

        # Panic evaluation
        panic_status = _panic_detector.evaluate(cpu, mem.percent)

        latency_ms = round((datetime.now() - t_start).total_seconds() * 1000, 1)

        return {
            "type": "system_metrics",
            "data": {
                "cpu_percent": cpu,
                "memory_percent": mem.percent,
                "memory_used_mb": round(mem.used / (1024 ** 2), 1),
                "memory_total_mb": round(mem.total / (1024 ** 2), 1),
                "disk_percent": disk.percent,
                "disk_used_gb": round(disk.used / (1024 ** 3), 1),
                "disk_total_gb": round(disk.total / (1024 ** 3), 1),
                "network_sent_mb": round(net.bytes_sent / (1024 ** 2), 1),
                "network_recv_mb": round(net.bytes_recv / (1024 ** 2), 1),
                "top_processes": top_procs,
                "panic": panic_status,
                "latency_ms": latency_ms,
                "timestamp": datetime.now().isoformat(),
            },
        }
    except ImportError:
        return {"type": "error", "message": "psutil not installed. Run: py -3.13 -m pip install psutil"}
    except Exception as e:
        log.error(f"handle_system_metrics error: {e}")
        return {"type": "error", "message": str(e)}


def handle_execute_command(command: str, timeout: int = 10) -> dict:
    """Execute a sandboxed terminal command and return output."""
    # Extended security blacklist
    BLOCKED_PATTERNS = [
        "rm -rf", "format", "del /f", "del /q", "shutdown", "mkfs",
        "reg delete", "reg add", "regedit", "netsh firewall",
        "net user", "net localgroup", "bcdedit", "diskpart",
        "cipher /w", "sfc /scannow", "attrib -r -s -h",
        "taskkill /f", "wmic process delete",
    ]

    cmd_lower = command.lower()
    for pattern in BLOCKED_PATTERNS:
        if pattern in cmd_lower:
            log.warning(f"Blocked dangerous command: {command}")
            return {"type": "error", "message": f"Commande bloquée par la sandbox Neo : '{pattern}'"}

    try:
        log.info(f"Executing command: {command}")
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=os.path.expanduser("~"),
            encoding="utf-8",
            errors="replace",
        )
        log.info(f"Command returncode: {result.returncode}")
        return {
            "type": "command_result",
            "data": {
                "command": command,
                "stdout": result.stdout[:5000],
                "stderr": result.stderr[:2000],
                "returncode": result.returncode,
                "timestamp": datetime.now().isoformat(),
            },
        }
    except subprocess.TimeoutExpired:
        log.warning(f"Command timed out ({timeout}s): {command}")
        return {"type": "error", "message": f"Timeout ({timeout}s) — commande trop longue : {command}"}
    except Exception as e:
        log.error(f"execute_command error: {e}")
        return {"type": "error", "message": str(e)}


def handle_sentiment(text: str) -> dict:
    """Run Nano Sentiment Engine on provided text."""
    result = analyze_sentiment(text)
    return {"type": "sentiment_result", "data": result}


def handle_version() -> dict:
    return {
        "type": "version",
        "data": {
            "version": "0.2.0",
            "name": "Neo Bridge Host",
            "features": ["system_metrics", "panic_detector", "sentiment", "execute", "system_info"],
        },
    }


# ─── Main Loop ─────────────────────────────────────────────────────────────────

def main() -> None:
    log.info("=" * 60)
    log.info("Neo Bridge Host v0.2.0 started")
    log.info(f"Python: {platform.python_version()} | Platform: {platform.system()}")
    log.info("=" * 60)

    while True:
        try:
            message = read_message()
            if message is None:
                log.info("EOF received — shutting down.")
                break

            action = message.get("action", "")
            log.info(f"Received action: {action}")

            if action == "ping":
                response = handle_ping()
            elif action == "system_info":
                response = handle_system_info()
            elif action == "system_metrics":
                response = handle_system_metrics()
            elif action == "execute":
                cmd = message.get("command", "")
                timeout = int(message.get("timeout", 10))
                response = handle_execute_command(cmd, timeout)
            elif action == "sentiment":
                text = message.get("text", "")
                response = handle_sentiment(text)
            elif action == "version":
                response = handle_version()
            else:
                log.warning(f"Unknown action: {action}")
                response = {"type": "error", "message": f"Action inconnue : '{action}'"}

            send_message(response)

        except KeyboardInterrupt:
            log.info("KeyboardInterrupt — shutting down.")
            break
        except Exception as e:
            log.error(f"Main loop error: {e}", exc_info=True)
            try:
                send_message({"type": "error", "message": f"Internal host error: {str(e)}"})
            except Exception:
                pass


if __name__ == "__main__":
    main()
