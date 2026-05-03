//! # Data Parser
//!
//! High-performance parsing module for data extracted by web probes.
//! Handles JSON transformation, text extraction, and pattern matching.

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// ─── Data Structures ──────────────────────────────────────────────────────────

/// Result of a parsing operation.
#[derive(Debug, Serialize, Deserialize)]
struct ParseResult {
    success: bool,
    data: serde_json::Value,
    items_count: usize,
    parse_time_ms: f64,
}

// ─── Parser ───────────────────────────────────────────────────────────────────

/// High-performance data parser for web probe results.
#[wasm_bindgen]
pub struct DataParser;

#[wasm_bindgen]
impl DataParser {
    /// Create a new DataParser instance.
    #[wasm_bindgen(constructor)]
    pub fn new() -> DataParser {
        DataParser
    }

    /// Parse a JSON string and extract values at specified keys.
    /// `json_input` — The raw JSON string to parse.
    /// `keys_json` — A JSON array of key paths to extract (e.g., `["title", "price", "url"]`).
    /// Returns a JSON string of extracted key-value pairs.
    pub fn extract_keys(&self, json_input: &str, keys_json: &str) -> Result<String, JsValue> {
        let data: serde_json::Value = serde_json::from_str(json_input)
            .map_err(|e| JsValue::from_str(&format!("JSON parse error: {}", e)))?;

        let keys: Vec<String> = serde_json::from_str(keys_json)
            .map_err(|e| JsValue::from_str(&format!("Keys parse error: {}", e)))?;

        let mut result = serde_json::Map::new();

        for key in &keys {
            if let Some(value) = self.deep_get(&data, key) {
                result.insert(key.clone(), value.clone());
            }
        }

        serde_json::to_string(&result)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }

    /// Filter an array of JSON objects by a condition.
    /// `json_array` — JSON string of an array of objects.
    /// `field` — The field to filter on.
    /// `contains` — The substring to match.
    /// Returns a filtered JSON array string.
    pub fn filter_array(
        &self,
        json_array: &str,
        field: &str,
        contains: &str,
    ) -> Result<String, JsValue> {
        let arr: Vec<serde_json::Value> = serde_json::from_str(json_array)
            .map_err(|e| JsValue::from_str(&format!("Parse error: {}", e)))?;

        let filtered: Vec<&serde_json::Value> = arr
            .iter()
            .filter(|item| {
                item.get(field)
                    .and_then(|v| v.as_str())
                    .map(|s| s.contains(contains))
                    .unwrap_or(false)
            })
            .collect();

        serde_json::to_string(&filtered)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }

    /// Transform a flat array of values into structured metric points.
    /// `values_json` — JSON array of numbers.
    /// `label` — Label for the metric series.
    /// Returns a JSON array of `{ timestamp, value, label }` objects.
    pub fn to_metric_series(&self, values_json: &str, label: &str) -> Result<String, JsValue> {
        let values: Vec<f64> = serde_json::from_str(values_json)
            .map_err(|e| JsValue::from_str(&format!("Parse error: {}", e)))?;

        let series: Vec<serde_json::Value> = values
            .iter()
            .enumerate()
            .map(|(i, &v)| {
                serde_json::json!({
                    "timestamp": i as f64,
                    "value": v,
                    "label": label
                })
            })
            .collect();

        serde_json::to_string(&series)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }

    /// Count occurrences of a substring in a text body.
    /// Useful for keyword frequency analysis on extracted web content.
    pub fn count_occurrences(&self, text: &str, pattern: &str) -> usize {
        if pattern.is_empty() {
            return 0;
        }
        text.matches(pattern).count()
    }

    /// Split text into word tokens and return their frequency as JSON.
    pub fn word_frequency(&self, text: &str) -> String {
        let mut freq = std::collections::HashMap::new();
        for word in text.split_whitespace() {
            let clean = word
                .to_lowercase()
                .chars()
                .filter(|c| c.is_alphanumeric())
                .collect::<String>();
            if !clean.is_empty() {
                *freq.entry(clean).or_insert(0u32) += 1;
            }
        }
        serde_json::to_string(&freq).unwrap_or_default()
    }
}

impl DataParser {
    /// Deep-get a value from nested JSON using dot-notation keys.
    fn deep_get<'a>(&self, data: &'a serde_json::Value, key: &str) -> Option<&'a serde_json::Value> {
        let parts: Vec<&str> = key.split('.').collect();
        let mut current = data;

        for part in parts {
            match current {
                serde_json::Value::Object(map) => {
                    current = map.get(part)?;
                }
                serde_json::Value::Array(arr) => {
                    let index: usize = part.parse().ok()?;
                    current = arr.get(index)?;
                }
                _ => return None,
            }
        }

        Some(current)
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_keys() {
        let parser = DataParser::new();
        let json = r#"{"title": "Neo", "version": "0.1.0", "author": "Vegapunk"}"#;
        let keys = r#"["title", "version"]"#;
        let result = parser.extract_keys(json, keys).unwrap();
        assert!(result.contains("Neo"));
        assert!(result.contains("0.1.0"));
        assert!(!result.contains("Vegapunk"));
    }

    #[test]
    fn test_filter_array() {
        let parser = DataParser::new();
        let arr = r#"[{"name": "Rust"}, {"name": "Python"}, {"name": "TypeScript"}]"#;
        let result = parser.filter_array(arr, "name", "Rust").unwrap();
        let parsed: Vec<serde_json::Value> = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed.len(), 1);
    }

    #[test]
    fn test_word_frequency() {
        let parser = DataParser::new();
        let text = "rust is fast rust is safe";
        let result = parser.word_frequency(text);
        assert!(result.contains("\"rust\":2"));
    }

    #[test]
    fn test_count_occurrences() {
        let parser = DataParser::new();
        assert_eq!(parser.count_occurrences("abcabcabc", "abc"), 3);
        assert_eq!(parser.count_occurrences("hello", "xyz"), 0);
    }
}
