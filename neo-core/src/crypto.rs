//! # Crypto Module
//!
//! Lightweight hashing and data integrity verification.
//! No heavy cryptographic dependencies — uses a fast, simple hash algorithm (FNV-1a variant)
//! suitable for data fingerprinting and integrity checks within the extension.

use wasm_bindgen::prelude::*;

// ─── Hash Functions ───────────────────────────────────────────────────────────

/// Hash a string input using a fast FNV-1a-inspired algorithm.
/// Returns a hex-encoded hash string.
///
/// Note: This is NOT cryptographically secure. It's designed for fast
/// data fingerprinting, deduplication, and integrity verification.
#[wasm_bindgen]
pub fn neo_hash(input: &str) -> String {
    let hash = fnv1a_hash(input.as_bytes());
    format!("{:016x}", hash)
}

/// Verify that a given input matches an expected hash.
#[wasm_bindgen]
pub fn neo_verify(input: &str, expected_hash: &str) -> bool {
    neo_hash(input) == expected_hash
}

/// Hash multiple inputs and return a combined fingerprint.
/// `inputs_json` — A JSON array of strings to hash.
/// Returns a single combined hash string.
#[wasm_bindgen]
pub fn neo_hash_batch(inputs_json: &str) -> Result<String, JsValue> {
    let inputs: Vec<String> = serde_json::from_str(inputs_json)
        .map_err(|e| JsValue::from_str(&format!("Parse error: {}", e)))?;

    let combined: String = inputs.iter().map(|s| neo_hash(s)).collect();
    Ok(neo_hash(&combined))
}

/// Generate a unique fingerprint for a data object.
/// Useful for change detection in monitored data.
#[wasm_bindgen]
pub fn neo_fingerprint(data: &str) -> String {
    // Normalize: remove whitespace variations for consistent fingerprinting
    let normalized: String = data.split_whitespace().collect::<Vec<&str>>().join(" ");
    neo_hash(&normalized)
}

// ─── Internal Implementation ──────────────────────────────────────────────────

/// FNV-1a hash implementation (64-bit).
/// Fast, well-distributed hash suitable for non-cryptographic purposes.
fn fnv1a_hash(data: &[u8]) -> u64 {
    const FNV_OFFSET_BASIS: u64 = 0xcbf29ce484222325;
    const FNV_PRIME: u64 = 0x00000100000001B3;

    let mut hash = FNV_OFFSET_BASIS;
    for &byte in data {
        hash ^= byte as u64;
        hash = hash.wrapping_mul(FNV_PRIME);
    }
    hash
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_deterministic() {
        let h1 = neo_hash("hello neo");
        let h2 = neo_hash("hello neo");
        assert_eq!(h1, h2);
    }

    #[test]
    fn test_hash_different_inputs() {
        let h1 = neo_hash("hello");
        let h2 = neo_hash("world");
        assert_ne!(h1, h2);
    }

    #[test]
    fn test_verify() {
        let hash = neo_hash("test data");
        assert!(neo_verify("test data", &hash));
        assert!(!neo_verify("wrong data", &hash));
    }

    #[test]
    fn test_fingerprint_normalized() {
        let f1 = neo_fingerprint("hello   world");
        let f2 = neo_fingerprint("hello world");
        assert_eq!(f1, f2); // Whitespace normalized
    }

    #[test]
    fn test_hash_format() {
        let h = neo_hash("test");
        assert_eq!(h.len(), 16); // 64-bit = 16 hex chars
    }
}
