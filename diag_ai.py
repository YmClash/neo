#!/usr/bin/env python3
"""Diagnostic script — tests all components of the Neo AI pipeline."""
import sys
import struct
import json
import subprocess

HOST_PY = r"neo-bridge\src\native\host.py"

def send_to_host(payload: dict) -> dict | None:
    msg = json.dumps(payload).encode("utf-8")
    data = struct.pack("@I", len(msg)) + msg
    try:
        proc = subprocess.run(
            ["py", "-3.13", HOST_PY],
            input=data,
            capture_output=True,
            timeout=15,
        )
        if len(proc.stdout) < 4:
            print(f"  [!] No stdout from host. stderr: {proc.stderr.decode(errors='replace')[:300]}")
            return None
        length = struct.unpack("@I", proc.stdout[:4])[0]
        return json.loads(proc.stdout[4:4+length])
    except Exception as e:
        print(f"  [!] Exception: {e}")
        return None


print("=" * 60)
print("  Neo AI Pipeline Diagnostic")
print("=" * 60)

# 1. Python requests
print("\n[1] Testing Python requests module...")
try:
    import requests
    print(f"  OK: requests {requests.__version__} installed")
except ImportError:
    print("  FAIL: requests not installed — run: py -3.13 -m pip install requests")
    sys.exit(1)

# 2. Ollama HTTP directly
print("\n[2] Testing Ollama HTTP API (localhost:11434)...")
try:
    r = requests.get("http://localhost:11434/api/tags", timeout=3)
    models = r.json().get("models", [])
    print(f"  OK: Ollama reachable, {len(models)} models:")
    for m in models:
        print(f"    - {m['name']} ({round(m['size']/(1024**3), 1)} GB)")
except Exception as e:
    print(f"  FAIL: {e}")
    print("  -> Is Ollama running? Try: ollama serve")

# 3. Bridge ping
print("\n[3] Testing host.py ping...")
resp = send_to_host({"action": "ping"})
if resp:
    print(f"  OK: {resp}")
else:
    print("  FAIL: No response from host.py")

# 4. Bridge ollama_status
print("\n[4] Testing host.py ollama_status...")
resp = send_to_host({"action": "ollama_status"})
if resp:
    print(f"  Response type: {resp.get('type')}")
    data = resp.get("data", {})
    print(f"  Available: {data.get('available')}")
    print(f"  Models: {[m['name'] for m in data.get('models', [])]}")
    if not data.get("available"):
        print(f"  Error: {data.get('error')}")
else:
    print("  FAIL: No response from host.py")

# 5. Quick AI query test
print("\n[5] Testing host.py ollama_query (llama3.2:3b)...")
resp = send_to_host({
    "action": "ollama_query",
    "prompt": "Dis bonjour en 5 mots.",
    "model": "llama3.2:3b",
    "context": {},
    "timeout": 60,
})
if resp:
    print(f"  Response type: {resp.get('type')}")
    if resp.get("type") == "ai_response":
        data = resp.get("data", {})
        print(f"  Response: {data.get('response', '')[:200]}")
        print(f"  Tokens: {data.get('eval_count')} | Duration: {data.get('duration_ms')}ms")
    else:
        print(f"  Error: {resp}")
else:
    print("  FAIL: No response from host.py")

print("\n" + "=" * 60)
print("  Diagnostic complete.")
print("=" * 60)
