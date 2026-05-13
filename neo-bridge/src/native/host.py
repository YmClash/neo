#!/usr/bin/env python3
"""
Neo Native Messaging Host — v0.3.0 (Phase 4 — AI)
Bridges the Chrome extension with the local OS and Ollama LLM.

New in v0.3.0:
  - ollama_query   : Send a prompt to a local Ollama model with Neo context
  - ollama_status  : Check Ollama availability and list models
  - sentiment_deep : Deep semantic analysis via Ollama (replaces Nano Engine for probes)

Protocol: stdin/stdout with 32-bit length header (Chrome Native Messaging).
Logs:     neo-bridge.log (file, NOT stderr)
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
LOG_PATH = Path(__file__).parent / "neo-bridge.log"
logging.basicConfig(
    filename=str(LOG_PATH),
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("neo-bridge")

OLLAMA_BASE_URL = "http://localhost:11434"

# ─── Nano Sentiment Engine (fast fallback, zero-dependency) ───────────────────

_POSITIVE_WORDS = {
    "excellent","fast","performant","stable","reliable","innovative","efficient",
    "powerful","elegant","clean","robust","secure","safe","success","solved",
    "fixed","optimized","improved","great","best","modern","advanced","lightweight",
    "scalable","flexible","smart","intuitive","seamless","solid","accurate","useful",
    "recommended","popular","trusted","proven","complete","beautiful","awesome",
    "impressive","outstanding","remarkable","brilliant",
    "rapide","performant","stable","fiable","innovant","efficace","puissant",
    "elegante","propre","robuste","securise","succes","resolu","corrige",
    "optimise","ameliore","genial","meilleur","moderne","avance","leger",
    "evolutif","flexible","intelligent","intuitif","fluide","solide","precis",
    "utile","recommande","populaire","complet","magnifique","incroyable",
}

_NEGATIVE_WORDS = {
    "slow","bug","crash","deprecated","broken","fail","failed","error","issue",
    "problem","vulnerability","insecure","unsafe","unstable","bloated","complex",
    "difficult","laggy","leak","overflow","exploit","attack","malware","virus",
    "backdoor","outdated","legacy","abandoned","unmaintained","dangerous","critical",
    "severe","worst","terrible","awful","horrible","useless","dead","toxic",
    "harmful","risky","flawed","corrupted","freeze","hang","timeout",
    "lent","bogue","plantage","deprecie","casse","echec","erreur","probleme",
    "vulnerabilite","instable","lourd","complexe","difficile","fuite",
    "debordement","exploit","attaque","malware","virus","obsolete","abandonne",
    "dangereux","critique","grave","terrible","inutile","mort","toxique",
    "risque","defaillant","corrompu","gel","blocage",
}

def analyze_sentiment_nano(text: str) -> dict:
    if not text or not text.strip():
        return {"score": 0.0, "label": "neutral", "positive_hits": 0, "negative_hits": 0, "method": "nano"}
    words = text.lower().split()
    total = max(len(words), 1)
    pos = sum(1 for w in words if w.strip(".,!?;:\"'()[]{}") in _POSITIVE_WORDS)
    neg = sum(1 for w in words if w.strip(".,!?;:\"'()[]{}") in _NEGATIVE_WORDS)
    score = max(-1.0, min(1.0, (pos - neg) / total * 15))
    label = "positive" if score > 0.08 else "negative" if score < -0.08 else "neutral"
    return {"score": round(score, 3), "label": label, "positive_hits": pos, "negative_hits": neg, "method": "nano"}


# ─── Panic Detector ────────────────────────────────────────────────────────────

class PanicDetector:
    CPU_CRITICAL = 90.0
    RAM_CRITICAL = 95.0
    CPU_DUAL     = 85.0
    RAM_DUAL     = 85.0
    CPU_RECOVERY = 70.0
    CONSECUTIVE_REQ = 3

    def __init__(self):
        self._consecutive_high = 0
        self._in_panic = False

    def evaluate(self, cpu: float, ram: float) -> dict:
        is_critical = (
            cpu >= self.CPU_CRITICAL
            or ram >= self.RAM_CRITICAL
            or (cpu >= self.CPU_DUAL and ram >= self.RAM_DUAL)
        )
        if is_critical:
            self._consecutive_high += 1
        else:
            self._consecutive_high = max(0, self._consecutive_high - 1)

        if self._consecutive_high >= self.CONSECUTIVE_REQ:
            self._in_panic = True
            if ram >= self.RAM_CRITICAL:
                level, reason = "CRITICAL", f"RAM critique : {ram:.1f}%"
            elif cpu >= self.CPU_CRITICAL:
                level, reason = "CRITICAL", f"CPU critique : {cpu:.1f}%"
            else:
                level, reason = "HIGH", f"Surcharge combinee CPU {cpu:.1f}% + RAM {ram:.1f}%"
        elif self._in_panic and cpu < self.CPU_RECOVERY:
            self._in_panic = False
            self._consecutive_high = 0
            return {"panic": False, "level": "RECOVERY", "reason": f"Systeme stabilise — CPU {cpu:.1f}%", "recovering": True, "consecutive": 0}
        else:
            level, reason = "NORMAL", "Nominal"

        return {"panic": self._in_panic, "level": level, "reason": reason, "recovering": False, "consecutive": self._consecutive_high}

_panic_detector = PanicDetector()


# ─── Native Messaging Protocol ─────────────────────────────────────────────────

def read_message() -> dict | None:
    try:
        raw_length = sys.stdin.buffer.read(4)
        if not raw_length or len(raw_length) < 4:
            return None
        message_length = struct.unpack("@I", raw_length)[0]
        if message_length == 0 or message_length > 1_048_576:
            log.warning(f"Invalid message length: {message_length}")
            return None
        return json.loads(sys.stdin.buffer.read(message_length).decode("utf-8"))
    except Exception as e:
        log.error(f"read_message error: {e}")
        return None

def send_message(message: dict) -> None:
    try:
        encoded = json.dumps(message, ensure_ascii=False).encode("utf-8")
        sys.stdout.buffer.write(struct.pack("@I", len(encoded)))
        sys.stdout.buffer.write(encoded)
        sys.stdout.buffer.flush()
    except Exception as e:
        log.error(f"send_message error: {e}")


# ─── System Handlers ───────────────────────────────────────────────────────────

def handle_ping() -> dict:
    return {"type": "pong", "data": {"status": "alive", "version": "0.3.0", "python": platform.python_version(), "timestamp": datetime.now().isoformat()}}

def handle_system_info() -> dict:
    return {"type": "system_info", "data": {"platform": platform.system(), "platform_version": platform.version(), "architecture": platform.machine(), "processor": platform.processor(), "hostname": platform.node(), "python_version": platform.python_version()}}

def handle_system_metrics() -> dict:
    try:
        import psutil
        t_start = datetime.now()
        cpu = psutil.cpu_percent(interval=0.3)
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage("/")
        net = psutil.net_io_counters()

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
    BLOCKED_PATTERNS = [
        "rm -rf","format","del /f","del /q","shutdown","mkfs","reg delete",
        "reg add","regedit","netsh firewall","net user","net localgroup",
        "bcdedit","diskpart","cipher /w","attrib -r -s -h","taskkill /f",
        "wmic process delete",
    ]
    cmd_lower = command.lower()
    for pattern in BLOCKED_PATTERNS:
        if pattern in cmd_lower:
            log.warning(f"Blocked dangerous command: {command}")
            return {"type": "error", "message": f"Commande bloquee par la sandbox Neo : '{pattern}'"}
    try:
        log.info(f"Executing command: {command}")
        result = subprocess.run(
            command, shell=True, capture_output=True, text=True, timeout=timeout,
            cwd=os.path.expanduser("~"), encoding="utf-8", errors="replace",
        )
        return {
            "type": "command_result",
            "data": {"command": command, "stdout": result.stdout[:5000], "stderr": result.stderr[:2000], "returncode": result.returncode, "timestamp": datetime.now().isoformat()},
        }
    except subprocess.TimeoutExpired:
        return {"type": "error", "message": f"Timeout ({timeout}s) : {command}"}
    except Exception as e:
        log.error(f"execute_command error: {e}")
        return {"type": "error", "message": str(e)}

def handle_sentiment(text: str) -> dict:
    result = analyze_sentiment_nano(text)
    return {"type": "sentiment_result", "data": result}


# ─── Ollama Handlers ───────────────────────────────────────────────────────────

NEO_SYSTEM_PROMPT = """Tu es Neo, l'IA intégrée au laboratoire Egghead du Docteur Y_MC.
Tu es son assistant personnel de monitoring et d'analyse avancée.

STYLE DE COMMUNICATION :
- Tutoie l'utilisateur et appelle-le "Docteur" à l'occasion
- Sois concis, technique et direct — pas de bavardage
- Utilise des termes comme "Analyse en cours", "Séquence synchronisée", "Diagnostic validé"
- Termine souvent par une action concrète proposée (surtout si tu vois un problème)
- Tu peux proposer des commandes Kernel si pertinent (ex: "Veux-tu que je lance tasklist ?")

CONTEXTE SYSTÈME ACTUEL :
{system_context}

JOURNAL D'ACTIVITÉ (50 derniers événements) :
{activity_context}

DONNÉES WEB RÉCENTES (Probes) :
{probe_context}

Réponds en français. Sois proactif — si tu vois un problème dans le contexte, signale-le sans attendre qu'on te le demande."""


def _build_system_prompt(context: dict) -> str:
    """Build the enriched system prompt with all available Neo context."""
    # System metrics
    metrics = context.get("metrics", {})
    if metrics:
        system_ctx = (
            f"CPU: {metrics.get('cpu_percent', '?')}% | "
            f"RAM: {metrics.get('memory_percent', '?')}% "
            f"({metrics.get('memory_used_mb', '?')}/{metrics.get('memory_total_mb', '?')} MB) | "
            f"Disque: {metrics.get('disk_percent', '?')}%"
        )
        panic = metrics.get("panic", {})
        if panic.get("panic"):
            system_ctx += f"\n⚠ PANIC ACTIF: {panic.get('reason', '')}"
    else:
        system_ctx = "Métriques non disponibles"

    # Activity buffer
    events = context.get("events", [])
    if events:
        lines = []
        for ev in events[-20:]:  # last 20 events
            ts = datetime.fromtimestamp(ev.get("ts", 0) / 1000).strftime("%H:%M")
            ev_type = ev.get("type", "").replace("_", " ")
            data = ev.get("data", {})
            # Format by type
            if ev["type"] == "task_completed":
                detail = f"Tache: \"{data.get('text', '')}\" ({data.get('quadrant', '')})"
            elif ev["type"] == "focus_session_completed":
                detail = f"Focus {data.get('duration_minutes', '?')}min"
            elif ev["type"] == "probe_executed":
                detail = f"Probe: {str(data.get('url', ''))[:50]}"
            elif ev["type"] == "panic_triggered":
                detail = f"PANIC CPU={data.get('cpu', '?')}% RAM={data.get('ram', '?')}%"
            else:
                detail = str(data)[:60]
            lines.append(f"  [{ts}] {ev_type}: {detail}")
        activity_ctx = "\n".join(lines)
    else:
        activity_ctx = "  Aucun événement enregistré"

    # Probe semantic context (titles, meta, text preview)
    probe_events = [ev for ev in events if ev.get("type") == "probe_executed"]
    if probe_events:
        lines = []
        for ev in probe_events[-5:]:  # last 5 probes
            d = ev.get("data", {})
            url = str(d.get("url", ""))[:60]
            title = str(d.get("title", ""))[:80]
            meta = str(d.get("meta_description", ""))[:120]
            preview = str(d.get("text_preview", ""))[:200]
            sentiment = d.get("sentiment", {})
            s_label = sentiment.get("label", "?") if isinstance(sentiment, dict) else "?"
            lines.append(f"  URL: {url}\n  Titre: {title}\n  Meta: {meta}\n  Apercu: {preview}\n  Sentiment: {s_label}")
        probe_ctx = "\n---\n".join(lines)
    else:
        probe_ctx = "  Aucune probe récente"

    return NEO_SYSTEM_PROMPT.format(
        system_context=system_ctx,
        activity_context=activity_ctx,
        probe_context=probe_ctx,
    )


def handle_ollama_query(prompt: str, model: str, context: dict, timeout: int = 120) -> dict:
    """Send a prompt to Ollama and return the complete response."""
    try:
        import requests as req

        system_prompt = _build_system_prompt(context)
        log.info(f"ollama_query | model={model} | prompt={prompt[:80]}")

        t_start = datetime.now()
        response = req.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "system": system_prompt,
                "stream": False,
                "keep_alive": -1,  # Keep model in VRAM permanently
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "num_predict": 512,
                },
            },
            timeout=timeout,
        )
        response.raise_for_status()
        result = response.json()
        duration_ms = round((datetime.now() - t_start).total_seconds() * 1000)

        log.info(f"ollama_query done | duration={duration_ms}ms | tokens={result.get('eval_count', '?')}")

        return {
            "type": "ai_response",
            "data": {
                "response": result.get("response", ""),
                "model": model,
                "prompt_eval_count": result.get("prompt_eval_count", 0),
                "eval_count": result.get("eval_count", 0),
                "duration_ms": duration_ms,
                "timestamp": datetime.now().isoformat(),
            },
        }

    except ImportError:
        return {"type": "error", "message": "requests not installed. Run: py -3.13 -m pip install requests"}
    except Exception as e:
        log.error(f"ollama_query error: {e}")
        return {"type": "error", "message": f"Ollama error: {str(e)}"}


def handle_ollama_warmup(model: str) -> dict:
    """Pre-load a model into GPU VRAM using keep_alive=-1.
    Returns immediately once the model is loaded (may take 20-60s on first call)."""
    try:
        import requests as req
        log.info(f"Warming up model: {model}")
        # Empty prompt with keep_alive=-1 loads and keeps the model in VRAM
        response = req.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={"model": model, "prompt": "", "keep_alive": -1, "stream": False},
            timeout=300,  # Allow up to 5 minutes for first load
        )
        response.raise_for_status()
        log.info(f"Model {model} warmed up successfully")
        return {"type": "warmup_complete", "data": {"model": model, "ready": True}}
    except Exception as e:
        log.error(f"ollama_warmup error: {e}")
        return {"type": "warmup_complete", "data": {"model": model, "ready": False, "error": str(e)}}


def handle_ollama_status() -> dict:
    """Check Ollama availability and list available models."""
    try:
        import requests as req
        response = req.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=3)
        response.raise_for_status()
        data = response.json()
        models = [
            {
                "name": m["name"],
                "size_gb": round(m["size"] / (1024 ** 3), 1),
                "params": m.get("details", {}).get("parameter_size", "?"),
                "family": m.get("details", {}).get("family", "?"),
            }
            for m in data.get("models", [])
        ]
        return {"type": "ollama_status", "data": {"available": True, "models": models, "model_count": len(models)}}
    except Exception as e:
        log.warning(f"ollama_status: Ollama unreachable — {e}")
        return {"type": "ollama_status", "data": {"available": False, "models": [], "error": str(e)}}


def handle_sentiment_deep(text: str, model: str = "qwen3.5:latest") -> dict:
    """Deep semantic analysis via Ollama (for Web Probes)."""
    try:
        import requests as req
        prompt = f"""Analyse ce texte de manière concise et retourne un JSON avec ces champs UNIQUEMENT :
{{"score": float entre -1.0 et 1.0, "label": "positive"|"negative"|"neutral", "summary": "résumé en 1 phrase", "key_topics": ["sujet1","sujet2","sujet3"]}}

Texte à analyser:
{text[:2000]}

Réponds UNIQUEMENT avec le JSON, sans markdown ni explication."""

        response = req.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False, "options": {"temperature": 0.1, "num_predict": 200}},
            timeout=60,
        )
        response.raise_for_status()
        raw = response.json().get("response", "").strip()

        # Extract JSON from response
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start >= 0 and end > start:
            result = json.loads(raw[start:end])
            result["method"] = "ollama"
            result["model"] = model
            return {"type": "sentiment_result", "data": result}
        else:
            raise ValueError(f"No JSON found in response: {raw[:100]}")

    except Exception as e:
        log.warning(f"sentiment_deep fallback to nano: {e}")
        result = analyze_sentiment_nano(text)
        result["ollama_error"] = str(e)
        return {"type": "sentiment_result", "data": result}


# ─── Main Loop ─────────────────────────────────────────────────────────────────

def main() -> None:
    log.info("=" * 60)
    log.info("Neo Bridge Host v0.3.0 started")
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
                response = handle_execute_command(message.get("command", ""), int(message.get("timeout", 10)))
            elif action == "sentiment":
                response = handle_sentiment(message.get("text", ""))
            elif action == "sentiment_deep":
                response = handle_sentiment_deep(message.get("text", ""), message.get("model", "qwen3.5:latest"))
            elif action == "ollama_query":
                response = handle_ollama_query(
                    prompt=message.get("prompt", ""),
                    model=message.get("model", "llama3.2:3b"),
                    context=message.get("context", {}),
                    timeout=int(message.get("timeout", 120)),
                )
            elif action == "ollama_warmup":
                response = handle_ollama_warmup(message.get("model", "llama3.2:3b"))
            elif action == "ollama_status":
                response = handle_ollama_status()
            elif action == "version":
                response = {"type": "version", "data": {"version": "0.3.0", "name": "Neo Bridge Host", "features": ["system_metrics", "panic_detector", "sentiment", "sentiment_deep", "ollama_query", "ollama_status", "execute"]}}
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
