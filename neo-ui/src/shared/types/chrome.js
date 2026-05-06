// ─── Chrome Extension Type Declarations ───────────────────────────────────────
// Augments @types/chrome with Neo-specific message types.
/** Helper to create a Neo message */
export function createNeoMessage(type, source, payload) {
    return {
        type,
        source,
        payload,
        timestamp: Date.now(),
    };
}
//# sourceMappingURL=chrome.js.map