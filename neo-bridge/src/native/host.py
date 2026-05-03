#!/usr/bin/env python3
"""
Neo Native Messaging Host
Bridges the Chrome extension with the local operating system.
Handles: system metrics, terminal commands, file operations.
Protocol: stdin/stdout with 32-bit length header (Chrome Native Messaging).
"""

import sys
import json
import struct
import subprocess
import platform
import os
from datetime import datetime

# ─── Protocol ─────────────────────────────────────────────────────────────────

def read_message():
    """Read a message from Chrome (stdin) using the native messaging protocol."""
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length:
        return None
    message_length = struct.unpack('@I', raw_length)[0]
    message_data = sys.stdin.buffer.read(message_length).decode('utf-8')
    return json.loads(message_data)


def send_message(message: dict):
    """Send a message to Chrome (stdout) using the native messaging protocol."""
    encoded = json.dumps(message).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('@I', len(encoded)))
    sys.stdout.buffer.write(encoded)
    sys.stdout.buffer.flush()


# ─── Command Handlers ─────────────────────────────────────────────────────────

def handle_system_info():
    """Return basic system information."""
    return {
        "type": "system_info",
        "data": {
            "platform": platform.system(),
            "platform_version": platform.version(),
            "architecture": platform.machine(),
            "processor": platform.processor(),
            "hostname": platform.node(),
            "python_version": platform.python_version(),
        }
    }


def handle_system_metrics():
    """Return system metrics (CPU, RAM, Disk)."""
    try:
        import psutil
        cpu = psutil.cpu_percent(interval=0.5)
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        net = psutil.net_io_counters()
        return {
            "type": "system_metrics",
            "data": {
                "cpu_percent": cpu,
                "memory_percent": mem.percent,
                "memory_used_mb": round(mem.used / (1024**2), 1),
                "memory_total_mb": round(mem.total / (1024**2), 1),
                "disk_percent": disk.percent,
                "disk_used_gb": round(disk.used / (1024**3), 1),
                "disk_total_gb": round(disk.total / (1024**3), 1),
                "network_sent_mb": round(net.bytes_sent / (1024**2), 1),
                "network_recv_mb": round(net.bytes_recv / (1024**2), 1),
                "timestamp": datetime.now().isoformat(),
            }
        }
    except ImportError:
        return {"type": "error", "message": "psutil not installed. Run: pip install psutil"}


def handle_execute_command(command: str, timeout: int = 10):
    """Execute a terminal command and return the output."""
    # Security: block dangerous commands
    blocked = ['rm -rf', 'format', 'del /f', 'shutdown', 'mkfs']
    if any(b in command.lower() for b in blocked):
        return {"type": "error", "message": f"Blocked dangerous command: {command}"}

    try:
        result = subprocess.run(
            command, shell=True, capture_output=True, text=True, timeout=timeout,
            cwd=os.path.expanduser('~')
        )
        return {
            "type": "command_result",
            "data": {
                "command": command,
                "stdout": result.stdout[:5000],
                "stderr": result.stderr[:2000],
                "returncode": result.returncode,
                "timestamp": datetime.now().isoformat(),
            }
        }
    except subprocess.TimeoutExpired:
        return {"type": "error", "message": f"Command timed out ({timeout}s): {command}"}
    except Exception as e:
        return {"type": "error", "message": str(e)}


# ─── Main Loop ─────────────────────────────────────────────────────────────────

def main():
    """Main message processing loop."""
    while True:
        message = read_message()
        if message is None:
            break

        action = message.get("action", "")
        response = {"type": "error", "message": f"Unknown action: {action}"}

        if action == "ping":
            response = {"type": "pong", "data": {"status": "alive", "timestamp": datetime.now().isoformat()}}
        elif action == "system_info":
            response = handle_system_info()
        elif action == "system_metrics":
            response = handle_system_metrics()
        elif action == "execute":
            cmd = message.get("command", "")
            timeout = message.get("timeout", 10)
            response = handle_execute_command(cmd, timeout)
        elif action == "version":
            response = {"type": "version", "data": {"version": "0.1.0", "name": "Neo Bridge Host"}}

        send_message(response)


if __name__ == '__main__':
    main()
