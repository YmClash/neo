import { useState, useEffect, useCallback } from 'react';

// ─── FNV-1a hash (mirrors service-worker + host.py) ───────────────────────────
// Used client-side to compute the storage key for a given URL's analysis.
function fnv1aHash(text: string): string {
  const FNV_OFFSET = BigInt('0xcbf29ce484222325');
  const FNV_PRIME  = BigInt('0x00000100000001B3');
  const MASK64     = BigInt('0xFFFFFFFFFFFFFFFF');
  let h = FNV_OFFSET;
  const encoded = new TextEncoder().encode(text);
  for (const byte of encoded) {
    h = (h ^ BigInt(byte)) & MASK64;
    h = (h * FNV_PRIME) & MASK64;
  }
  return h.toString(16).padStart(16, '0');
}

// Keep fnv1aHash available for direct use but avoid unused-variable TS error
void fnv1aHash;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SemanticAnalysis {
  theme: string;
  summary: string;
  entities: string[];
  themes: string[];
  relevance_score: number;
  relevance_label: 'High' | 'Medium' | 'Low';
  sentiment: { score: number; label: 'positive' | 'negative' | 'neutral' };
  codex_worthy: boolean;
  codex_saved: boolean;
  codex_id?: string;
  method: 'ollama' | 'nano';
  model?: string;
  /** True while the service worker is waiting for host.py response */
  analyzing?: boolean;
  error?: string;
}

export interface ProbeConfig {
  selectors: { [key: string]: string };
  extract_text: boolean;
  extract_links: boolean;
  extract_images: boolean;
}

export interface ExtractionResult {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  data: Record<string, string | string[]>;
  success: boolean;
  error?: string;
  /** Semantic analysis — populated asynchronously after the probe completes */
  semantic?: SemanticAnalysis;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProbes() {
  const [results, setResults] = useState<ExtractionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProbing, setIsProbing] = useState(false);

  // Merge a SemanticAnalysis into the matching result by URL
  const mergeAnalysis = useCallback((url: string, analysis: SemanticAnalysis) => {
    setResults((prev) =>
      prev.map((r) => (r.url === url ? { ...r, semantic: analysis } : r))
    );
  }, []);

  // Load probe history and listen to live updates (results + analyses)
  useEffect(() => {
    chrome.storage.local.get('neo_probes', (storageResult) => {
      if (storageResult.neo_probes) {
        setResults(storageResult.neo_probes);
      }
      setLoading(false);
    });

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      // Main probe history update
      if (changes.neo_probes) {
        setResults(changes.neo_probes.newValue || []);
      }
      // Semantic analysis result (keyed by URL hash: neo_probe_analysis_<hash>)
      for (const [key, change] of Object.entries(changes)) {
        if (key.startsWith('neo_probe_analysis_') && change.newValue) {
          const analysis = change.newValue as SemanticAnalysis & { url?: string };
          if (analysis.url) {
            mergeAnalysis(analysis.url, analysis);
          }
        }
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [mergeAnalysis]);

  const clearResults = async () => {
    await chrome.storage.local.set({ neo_probes: [] });
    setResults([]);
  };

  const executeProbe = async (config: ProbeConfig) => {
    setIsProbing(true);
    try {
      let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length === 0 || !tabs[0].id) {
        throw new Error('No active tab found.');
      }

      let activeTab = tabs[0];

      if (
        !activeTab.url ||
        activeTab.url.startsWith('chrome://') ||
        activeTab.url.startsWith('edge://') ||
        activeTab.url.startsWith('chrome-extension://')
      ) {
        const allTabs = await chrome.tabs.query({ currentWindow: true });
        const validTabs = allTabs.filter(
          (t) => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://'))
        );

        if (validTabs.length === 0) {
          throw new Error(
            'No standard website found to probe. Please open a web page (http/https) in another tab.'
          );
        }

        activeTab = validTabs.reduce((prev, curr) => {
          return Math.abs(curr.index - activeTab.index) < Math.abs(prev.index - activeTab.index)
            ? curr
            : prev;
        });
      }

      // Ensure content script is injected
      try {
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id! },
          files: ['dist/content-script.js'],
        });
      } catch (injectionError) {
        console.warn('[Neo Probe] Injection warning:', injectionError);
      }

      const response = await new Promise<any>((resolve, reject) => {
        chrome.tabs.sendMessage(
          activeTab.id!,
          { type: 'PROBE_EXECUTE', payload: config },
          (res) => {
            if (chrome.runtime.lastError) {
              reject(
                new Error(
                  'Cannot connect to page. Try refreshing the tab. (' +
                    chrome.runtime.lastError.message +
                    ')'
                )
              );
            } else {
              resolve(res);
            }
          }
        );
      });

      if (!response || !response.success || !response.data) {
        throw new Error(response?.error || 'Extraction failed');
      }

      const newResult: ExtractionResult = {
        id: `probe-${Date.now()}`,
        ...response.data,
        // Attach an "analyzing" placeholder immediately so the UI shows the badge
        semantic: {
          analyzing: true,
          theme: '',
          summary: '',
          entities: [],
          themes: [],
          relevance_score: 0,
          relevance_label: 'Low',
          sentiment: { score: 0, label: 'neutral' },
          codex_worthy: false,
          codex_saved: false,
          method: 'ollama',
        },
      };

      const updatedResults = [newResult, ...results].slice(0, 50);
      await chrome.storage.local.set({ neo_probes: updatedResults });

      // Notify service worker → triggers fire-and-forget semantic analysis (Phase 6D)
      chrome.runtime.sendMessage({
        type: 'PROBE_COMPLETE',
        source: 'dashboard',
        timestamp: Date.now(),
        payload: {
          url:              newResult.url,
          itemCount:        Object.keys(newResult.data).length,
          title:            newResult.title ?? '',
          meta_description: (response.data.meta_description as string) ?? '',
          text_preview:     (response.data.text_preview as string) ?? '',
        },
      });
    } catch (err) {
      console.error('[Neo Probe] Execution failed:', err);
      const errorResult: ExtractionResult = {
        id: `probe-err-${Date.now()}`,
        url: 'Unknown',
        title: 'Error',
        timestamp: Date.now(),
        data: {},
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
      const updatedResults = [errorResult, ...results].slice(0, 50);
      await chrome.storage.local.set({ neo_probes: updatedResults });
    } finally {
      setIsProbing(false);
    }
  };

  /** Re-trigger semantic analysis manually for a specific result */
  const reAnalyze = useCallback(
    (result: ExtractionResult) => {
      mergeAnalysis(result.url, {
        analyzing: true,
        theme: '',
        summary: '',
        entities: [],
        themes: [],
        relevance_score: 0,
        relevance_label: 'Low',
        sentiment: { score: 0, label: 'neutral' },
        codex_worthy: false,
        codex_saved: false,
        method: 'ollama',
      });
      chrome.runtime.sendMessage({
        type: 'PROBE_ANALYZE',
        source: 'dashboard',
        timestamp: Date.now(),
        payload: {
          probeId:          result.id,
          url:              result.url,
          title:            result.title,
          meta_description: (result.data['meta_description'] as string) ?? '',
          text:             (result.data['_body_text'] as string) ?? '',
        },
      });
    },
    [mergeAnalysis]
  );

  return {
    results,
    loading,
    isProbing,
    executeProbe,
    clearResults,
    reAnalyze,
  };
}
