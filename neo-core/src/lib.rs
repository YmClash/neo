//! # Neo Core — WASM Engine
//!
//! High-performance computation module for the Neo Chrome Extension.
//! Compiled to WebAssembly via `wasm-pack`, bridged to TypeScript via `wasm-bindgen`.
//!
//! ## Modules
//! - `metrics` — Aggregation and statistical analysis of monitoring data
//! - `parser`  — High-performance data parsing (HTML/JSON extraction results)
//! - `crypto`  — Hashing and data integrity verification

mod crypto;
mod metrics;
mod parser;
mod sandbox;

use wasm_bindgen::prelude::*;

// ─── Initialization ───────────────────────────────────────────────────────────

/// Initialize the Neo WASM core module.
/// Call this once before using any other exported functions.
#[wasm_bindgen]
pub fn neo_init() -> Result<String, JsValue> {
    // Set up better panic messages in debug mode
    #[cfg(debug_assertions)]
    console_error_panic_hook::set_once();

    web_sys::console::log_1(&"[Neo Core] 🧬 WASM Engine initialized.".into());
    Ok(String::from("Neo Core v0.1.0 — Online"))
}

/// Returns the current version of the Neo Core module.
#[wasm_bindgen]
pub fn neo_version() -> String {
    String::from(env!("CARGO_PKG_VERSION"))
}

// ─── Re-exports for wasm_bindgen ──────────────────────────────────────────────

// Metrics
pub use metrics::MetricsEngine;
pub use metrics::MetricPoint;

// Parser
pub use parser::DataParser;

// Crypto
pub use crypto::neo_hash;
pub use crypto::neo_verify;

// Sandbox
pub use sandbox::neo_run_sandbox;

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version() {
        assert_eq!(neo_version(), "0.1.0");
    }
}
