import { useState, useEffect, useCallback } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CodexEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  ts: number;
  // From ChromaDB (Tier-2) — optional
  distance?: number;
  embed_model?: string;
}

export interface CodexStatus {
  available: boolean;
  chroma_installed: boolean;
  n_entries: number;
  embed_model: string;
  db_path?: string;
}

export interface UseNeoCodexReturn {
  entries: CodexEntry[];
  searchResults: CodexEntry[];
  status: CodexStatus | null;
  isLoading: boolean;
  isSearching: boolean;
  chromaAvailable: boolean;
  addEntry: (title: string, content: string, tags?: string[]) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  searchEntries: (query: string) => Promise<void>;
  clearSearch: () => void;
  clearAll: () => Promise<void>;
  reindex: () => Promise<void>;
  checkStatus: () => Promise<void>;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function sendMessage(type: string, payload?: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type, source: 'dashboard', payload, timestamp: Date.now() },
      (r) => resolve(r ?? { success: false, error: 'No response' })
    );
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNeoCodex(): UseNeoCodexReturn {
  const [entries, setEntries]           = useState<CodexEntry[]>([]);
  const [searchResults, setSearch]      = useState<CodexEntry[]>([]);
  const [status, setStatus]             = useState<CodexStatus | null>(null);
  const [isLoading, setLoading]         = useState(false);
  const [isSearching, setSearching]     = useState(false);
  const [chromaAvailable, setChromaOk]  = useState(false);

  // Load entries from Tier-1 chrome.storage on mount + live sync
  useEffect(() => {
    chrome.storage.local.get(['neo_codex_entries', 'neo_codex_chroma_available'], (result) => {
      setEntries((result.neo_codex_entries as CodexEntry[]) ?? []);
      setChromaOk(result.neo_codex_chroma_available ?? false);
    });

    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.neo_codex_entries !== undefined) {
        setEntries((changes.neo_codex_entries.newValue as CodexEntry[]) ?? []);
      }
      if (changes.neo_codex_chroma_available !== undefined) {
        setChromaOk(changes.neo_codex_chroma_available.newValue ?? false);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // Check ChromaDB status on mount
  useEffect(() => {
    checkStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkStatus = useCallback(async () => {
    const resp = (await sendMessage('CODEX_STATUS')) as {
      success: boolean;
      data?: CodexStatus;
    };
    if (resp.success && resp.data) {
      setStatus(resp.data);
      setChromaOk(resp.data.available);
    }
  }, []);

  const addEntry = useCallback(async (title: string, content: string, tags: string[] = []) => {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      const id = `codex_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await sendMessage('CODEX_ADD', { id, title: title.trim().slice(0, 60), content: content.trim().slice(0, 500), tags });
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    await sendMessage('CODEX_DELETE', { id });
  }, []);

  const searchEntries = useCallback(async (query: string) => {
    if (!query.trim()) { setSearch([]); return; }
    setSearching(true);
    try {
      const resp = (await sendMessage('CODEX_SEARCH', { query, n_results: 5 })) as {
        success: boolean;
        data?: { results: CodexEntry[] };
      };
      if (resp.success && resp.data?.results) {
        setSearch(resp.data.results);
      } else {
        setSearch([]);
      }
    } finally {
      setSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => setSearch([]), []);

  const clearAll = useCallback(async () => {
    setLoading(true);
    try {
      await sendMessage('CODEX_CLEAR');
    } finally {
      setLoading(false);
    }
  }, []);

  const reindex = useCallback(async () => {
    setLoading(true);
    try {
      await sendMessage('CODEX_REINDEX');
    } finally {
      setLoading(false);
      await checkStatus();
    }
  }, [checkStatus]);

  return {
    entries, searchResults, status, isLoading, isSearching, chromaAvailable,
    addEntry, deleteEntry, searchEntries, clearSearch, clearAll, reindex, checkStatus,
  };
}
