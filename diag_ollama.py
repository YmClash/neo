#!/usr/bin/env python3
"""Test direct Ollama generate avec debug."""
import requests
import json

print("Test 1: generate simple sans system prompt...")
try:
    r = requests.post(
        "http://localhost:11434/api/generate",
        json={"model": "llama3.2:3b", "prompt": "Bonjour", "stream": False, "options": {"num_predict": 20}},
        timeout=60,
    )
    print(f"  Status: {r.status_code}")
    print(f"  Body: {r.text[:500]}")
except Exception as e:
    print(f"  FAIL: {e}")

print("\nTest 2: generate avec system prompt court...")
try:
    r = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3.2:3b",
            "prompt": "Dis bonjour en 5 mots.",
            "system": "Tu es Neo, un assistant IA.",
            "stream": False,
            "options": {"num_predict": 50, "temperature": 0.7},
        },
        timeout=60,
    )
    print(f"  Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"  Response: {data.get('response', '')[:200]}")
    else:
        print(f"  Error body: {r.text[:500]}")
except Exception as e:
    print(f"  FAIL: {e}")

print("\nTest 3: check running models...")
try:
    r = requests.get("http://localhost:11434/api/ps", timeout=5)
    print(f"  Status: {r.status_code}")
    print(f"  Running: {r.text[:300]}")
except Exception as e:
    print(f"  FAIL: {e}")
