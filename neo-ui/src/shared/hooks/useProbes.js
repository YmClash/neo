import { useState, useEffect } from 'react';
export function useProbes() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isProbing, setIsProbing] = useState(false);
    // Load initial results
    useEffect(() => {
        chrome.storage.local.get('neo_probes', (storageResult) => {
            if (storageResult.neo_probes) {
                setResults(storageResult.neo_probes);
            }
            setLoading(false);
        });
        // Listen for storage changes
        const listener = (changes) => {
            if (changes.neo_probes) {
                setResults(changes.neo_probes.newValue || []);
            }
        };
        chrome.storage.onChanged.addListener(listener);
        return () => chrome.storage.onChanged.removeListener(listener);
    }, []);
    const clearResults = async () => {
        await chrome.storage.local.set({ neo_probes: [] });
        setResults([]);
    };
    const executeProbe = async (config) => {
        setIsProbing(true);
        try {
            // Get the active tab in the current window
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs.length === 0 || !tabs[0].id) {
                throw new Error('No active tab found.');
            }
            const activeTab = tabs[0];
            // Inject content script if not already there (Manifest V3 approach)
            // Usually it's declared in manifest, but we can ensure it runs via messaging
            const response = await new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(activeTab.id, { type: 'PROBE_EXECUTE', payload: config }, (res) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    }
                    else {
                        resolve(res);
                    }
                });
            });
            if (!response || !response.success || !response.data) {
                throw new Error(response?.error || 'Extraction failed');
            }
            const newResult = {
                id: `probe-${Date.now()}`,
                ...response.data
            };
            // Save to storage
            const updatedResults = [newResult, ...results].slice(0, 50); // Keep last 50
            await chrome.storage.local.set({ neo_probes: updatedResults });
            // We can also trigger a background notification
            chrome.runtime.sendMessage({
                type: 'PROBE_COMPLETE',
                payload: {
                    url: newResult.url,
                    itemCount: Object.keys(newResult.data).length
                }
            });
        }
        catch (err) {
            console.error('[Neo Probe] Execution failed:', err);
            // We could add an error result to the history if needed
            const errorResult = {
                id: `probe-err-${Date.now()}`,
                url: 'Unknown',
                title: 'Error',
                timestamp: Date.now(),
                data: {},
                success: false,
                error: err instanceof Error ? err.message : String(err)
            };
            const updatedResults = [errorResult, ...results].slice(0, 50);
            await chrome.storage.local.set({ neo_probes: updatedResults });
        }
        finally {
            setIsProbing(false);
        }
    };
    return {
        results,
        loading,
        isProbing,
        executeProbe,
        clearResults
    };
}
//# sourceMappingURL=useProbes.js.map