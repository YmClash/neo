//! # Metrics Engine
//!
//! High-performance aggregation and statistical analysis for monitoring data.
//! Handles time-series metrics for focus tracking, system monitoring, and web probes.

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// ─── Data Structures ──────────────────────────────────────────────────────────

/// A single metric data point with timestamp and value.
#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricPoint {
    timestamp: f64,
    value: f64,
    label: String,
}

#[wasm_bindgen]
impl MetricPoint {
    #[wasm_bindgen(constructor)]
    pub fn new(timestamp: f64, value: f64, label: &str) -> MetricPoint {
        MetricPoint {
            timestamp,
            value,
            label: label.to_string(),
        }
    }

    #[wasm_bindgen(getter)]
    pub fn timestamp(&self) -> f64 {
        self.timestamp
    }

    #[wasm_bindgen(getter)]
    pub fn value(&self) -> f64 {
        self.value
    }

    #[wasm_bindgen(getter)]
    pub fn label(&self) -> String {
        self.label.clone()
    }
}

// ─── Metrics Engine ───────────────────────────────────────────────────────────

/// Aggregation engine for time-series metric data.
/// Calculates statistics: mean, median, min, max, percentiles.
#[wasm_bindgen]
pub struct MetricsEngine {
    data: Vec<f64>,
    capacity: usize,
}

#[wasm_bindgen]
impl MetricsEngine {
    /// Create a new MetricsEngine with a specified capacity (ring buffer behavior).
    #[wasm_bindgen(constructor)]
    pub fn new(capacity: usize) -> MetricsEngine {
        MetricsEngine {
            data: Vec::with_capacity(capacity),
            capacity,
        }
    }

    /// Push a new value into the engine. If capacity is reached, the oldest value is removed.
    pub fn push(&mut self, value: f64) {
        if self.data.len() >= self.capacity {
            self.data.remove(0);
        }
        self.data.push(value);
    }

    /// Push multiple values at once (from a JSON array string).
    pub fn push_batch(&mut self, json_values: &str) -> Result<usize, JsValue> {
        let values: Vec<f64> = serde_json::from_str(json_values)
            .map_err(|e| JsValue::from_str(&format!("Parse error: {}", e)))?;

        let count = values.len();
        for v in values {
            self.push(v);
        }
        Ok(count)
    }

    /// Returns the number of data points currently stored.
    pub fn count(&self) -> usize {
        self.data.len()
    }

    /// Calculate the arithmetic mean of all stored values.
    pub fn mean(&self) -> f64 {
        if self.data.is_empty() {
            return 0.0;
        }
        self.data.iter().sum::<f64>() / self.data.len() as f64
    }

    /// Calculate the median value.
    pub fn median(&self) -> f64 {
        if self.data.is_empty() {
            return 0.0;
        }
        let mut sorted = self.data.clone();
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
        let mid = sorted.len() / 2;
        if sorted.len() % 2 == 0 {
            (sorted[mid - 1] + sorted[mid]) / 2.0
        } else {
            sorted[mid]
        }
    }

    /// Returns the minimum value.
    pub fn min(&self) -> f64 {
        self.data.iter().cloned().fold(f64::INFINITY, f64::min)
    }

    /// Returns the maximum value.
    pub fn max(&self) -> f64 {
        self.data
            .iter()
            .cloned()
            .fold(f64::NEG_INFINITY, f64::max)
    }

    /// Calculate the standard deviation.
    pub fn std_dev(&self) -> f64 {
        if self.data.len() < 2 {
            return 0.0;
        }
        let mean = self.mean();
        let variance =
            self.data.iter().map(|v| (v - mean).powi(2)).sum::<f64>() / self.data.len() as f64;
        variance.sqrt()
    }

    /// Calculate a specific percentile (0-100).
    pub fn percentile(&self, p: f64) -> f64 {
        if self.data.is_empty() || p < 0.0 || p > 100.0 {
            return 0.0;
        }
        let mut sorted = self.data.clone();
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
        let index = (p / 100.0 * (sorted.len() - 1) as f64).round() as usize;
        sorted[index.min(sorted.len() - 1)]
    }

    /// Export all current statistics as a JSON string.
    pub fn summary_json(&self) -> String {
        serde_json::json!({
            "count": self.count(),
            "mean": self.mean(),
            "median": self.median(),
            "min": self.min(),
            "max": self.max(),
            "std_dev": self.std_dev(),
            "p95": self.percentile(95.0),
            "p99": self.percentile(99.0),
        })
        .to_string()
    }

    /// Clear all stored data.
    pub fn clear(&mut self) {
        self.data.clear();
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_metrics_engine_basic() {
        let mut engine = MetricsEngine::new(100);
        engine.push(10.0);
        engine.push(20.0);
        engine.push(30.0);

        assert_eq!(engine.count(), 3);
        assert!((engine.mean() - 20.0).abs() < f64::EPSILON);
        assert!((engine.median() - 20.0).abs() < f64::EPSILON);
        assert!((engine.min() - 10.0).abs() < f64::EPSILON);
        assert!((engine.max() - 30.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_metrics_engine_capacity() {
        let mut engine = MetricsEngine::new(3);
        engine.push(1.0);
        engine.push(2.0);
        engine.push(3.0);
        engine.push(4.0); // Should evict 1.0

        assert_eq!(engine.count(), 3);
        assert!((engine.min() - 2.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_batch_push() {
        let mut engine = MetricsEngine::new(100);
        let result = engine.push_batch("[1.0, 2.0, 3.0, 4.0, 5.0]");
        assert!(result.is_ok());
        assert_eq!(engine.count(), 5);
    }
}
