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
            let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs.length === 0 || !tabs[0].id) {
                throw new Error('No active tab found.');
            }
            let activeTab = tabs[0];
            // If the user runs this from the Dashboard, the active tab IS the dashboard (chrome-extension://)
            if (!activeTab.url || activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('edge://') || activeTab.url.startsWith('chrome-extension://')) {
                const allTabs = await chrome.tabs.query({ currentWindow: true });
                const validTabs = allTabs.filter(t => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')));
                if (validTabs.length === 0) {
                    throw new Error('No standard website found to probe. Please open a web page (http/https) in another tab.');
                }
                // Smart fallback: pick the valid tab closest to the dashboard's index
                activeTab = validTabs.reduce((prev, curr) => {
                    return Math.abs(curr.index - activeTab.index) < Math.abs(prev.index - activeTab.index) ? curr : prev;
                });
            }
            // Ensure the content script is injected
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: activeTab.id },
                    files: ['dist/content-script.js']
                });
            }
            catch (injectionError) {
                // Might fail if already injected or due to permissions, we continue and try sendMessage anyway
                console.warn('[Neo Probe] Injection warning:', injectionError);
            }
            const response = await new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(activeTab.id, { type: 'PROBE_EXECUTE', payload: config }, (res) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error("Cannot connect to page. Try refreshing the tab. (" + chrome.runtime.lastError.message + ")"));
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