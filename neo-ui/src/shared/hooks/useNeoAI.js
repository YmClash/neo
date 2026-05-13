import { useState, useEffect, useCallback, useRef } from 'react';
export const PROVIDERS = [
    {
        id: 'ollama',
        label: 'Ollama Local',
        icon: '🖥',
        models: [], // populated from /api/tags
        requiresKey: false,
        keyPlaceholder: '',
        keyUrl: 'https://ollama.com',
    },
    {
        id: 'gemini',
        label: 'Google Gemini',
        icon: '✦',
        models: [
            { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (rapide)' },
            { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (puissant)' },
            { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (gratuit)' },
        ],
        requiresKey: true,
        keyPlaceholder: 'AIzaSy...',
        keyUrl: 'https://aistudio.google.com/app/apikey',
    },
    {
        id: 'openai',
        label: 'OpenAI GPT',
        icon: '🤖',
        models: [
            { id: 'gpt-4o-mini', label: 'GPT-4o Mini (rapide)' },
            { id: 'gpt-4o', label: 'GPT-4o (puissant)' },
        ],
        requiresKey: true,
        keyPlaceholder: 'sk-...',
        keyUrl: 'https://platform.openai.com/api-keys',
    },
    {
        id: 'claude',
        label: 'Anthropic Claude',
        icon: '🟣',
        models: [
            { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (rapide)' },
            { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
        ],
        requiresKey: true,
        keyPlaceholder: 'sk-ant-...',
        keyUrl: 'https://console.anthropic.com/settings/keys',
    },
];
export const NEO_SUGGESTIONS = [
    { label: '📊 Analyse CPU', prompt: 'Analyse l\'état actuel de mon système et donne-moi un diagnostic.' },
    { label: '📋 Résume mes tâches', prompt: 'Résume mes tâches récentes et dis-moi lesquelles méritent une attention urgente.' },
    { label: '🌐 Analyse ma dernière probe', prompt: 'Analyse la dernière page web que j\'ai scannée et donne-moi ton avis.' },
    { label: '⏱️ Bilan focus', prompt: 'Quel est mon niveau de productivité aujourd\'hui d\'après mes sessions focus ?' },
    { label: '💡 Conseils', prompt: 'Qu\'est-ce que tu me conseilles de faire maintenant d\'après mon activité récente ?' },
];
export function useNeoAI() {
    const [messages, setMessages] = useState([]);
    const [isThinking, setThinking] = useState(false);
    const [isWarming, setWarming] = useState(false);
    const [isConnected, setConnected] = useState(false);
    const [provider, setProviderState] = useState('ollama');
    const [model, setModelState] = useState('llama3.2:3b');
    const [availableModels, setModels] = useState([]);
    const [apiKeys, setApiKeys] = useState({});
    const mountedRef = useRef(true);
    const sendMessage = useCallback((type, payload) => new Promise((resolve) => {
        chrome.runtime.sendMessage({ type, source: 'dashboard', payload, timestamp: Date.now() }, (r) => resolve(r ?? { success: false, error: 'No response' }));
    }), []);
    // Sync persisted state on mount
    useEffect(() => {
        mountedRef.current = true;
        chrome.storage.local.get(['neo_ai_model', 'neo_ai_connected', 'neo_ai_warming', 'neo_ai_provider', 'neo_ai_keys'], (result) => {
            if (!mountedRef.current)
                return;
            if (result.neo_ai_model)
                setModelState(result.neo_ai_model);
            if (result.neo_ai_provider)
                setProviderState(result.neo_ai_provider);
            if (result.neo_ai_keys)
                setApiKeys(result.neo_ai_keys);
            setConnected(result.neo_ai_connected ?? false);
            setWarming(result.neo_ai_warming ?? false);
        });
        const listener = (changes) => {
            if (changes.neo_ai_thinking !== undefined)
                setThinking(changes.neo_ai_thinking.newValue ?? false);
            if (changes.neo_ai_warming !== undefined)
                setWarming(changes.neo_ai_warming.newValue ?? false);
            if (changes.neo_ai_connected !== undefined)
                setConnected(changes.neo_ai_connected.newValue ?? false);
            if (changes.neo_ai_model !== undefined)
                setModelState(changes.neo_ai_model.newValue ?? 'llama3.2:3b');
            if (changes.neo_ai_provider !== undefined)
                setProviderState(changes.neo_ai_provider.newValue ?? 'ollama');
            if (changes.neo_ai_keys !== undefined)
                setApiKeys(changes.neo_ai_keys.newValue ?? {});
        };
        chrome.storage.onChanged.addListener(listener);
        return () => { mountedRef.current = false; chrome.storage.onChanged.removeListener(listener); };
    }, []);
    const checkStatus = useCallback(async () => {
        const resp = (await sendMessage('AI_STATUS'));
        if (resp.success && resp.data) {
            setConnected(resp.data.available);
            if (resp.data.models?.length)
                setModels(resp.data.models);
        }
        else {
            setConnected(false);
        }
    }, [sendMessage]);
    const warmup = useCallback(async (modelName) => {
        const target = modelName ?? model;
        if (mountedRef.current)
            setWarming(true);
        try {
            await sendMessage('AI_WARMUP', { model: target });
        }
        finally {
            if (mountedRef.current)
                setWarming(false);
        }
    }, [model, sendMessage]);
    // On mount: check status, warmup only for Ollama
    useEffect(() => {
        checkStatus().then(async () => {
            const stored = await new Promise((res) => chrome.storage.local.get('neo_ai_provider', res));
            if ((stored.neo_ai_provider ?? 'ollama') === 'ollama') {
                warmup('llama3.2:3b');
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const setProvider = useCallback((p) => {
        setProviderState(p);
        // Write directly to storage for immediate UI update
        chrome.storage.local.get('neo_ai_keys', (stored) => {
            const keys = stored.neo_ai_keys ?? {};
            const hasKey = p !== 'ollama' ? !!keys[p] : false;
            chrome.storage.local.set({
                neo_ai_provider: p,
                neo_ai_warming: false,
                // Cloud providers are connected if they have a key; Ollama needs warmup
                ...(p !== 'ollama' ? { neo_ai_connected: hasKey } : {}),
            });
        });
        sendMessage('AI_PROVIDER_SET', { provider: p });
        if (p === 'ollama')
            warmup('llama3.2:3b');
    }, [sendMessage, warmup]);
    const setModel = useCallback((name) => {
        setModelState(name);
        sendMessage('AI_MODEL_SET', { model: name });
        if (provider === 'ollama')
            warmup(name);
    }, [provider, sendMessage, warmup]);
    const setApiKey = useCallback((prov, key) => {
        // Write directly to storage — triggers onChanged listener immediately
        // so apiKeys React state updates before the panel closes
        chrome.storage.local.get('neo_ai_keys', (stored) => {
            const merged = { ...(stored.neo_ai_keys ?? {}), [prov]: key };
            const updates = { neo_ai_keys: merged };
            // Auto-connect if the saved key is for the active provider
            chrome.storage.local.get('neo_ai_provider', (p) => {
                if ((p.neo_ai_provider ?? 'ollama') === prov) {
                    updates.neo_ai_connected = !!key;
                }
                chrome.storage.local.set(updates);
            });
        });
        // Also notify SW (best-effort, not relied upon for UI state)
        sendMessage('AI_KEY_SET', { provider: prov, key }).catch(() => { });
    }, [sendMessage]);
    const sendQuery = useCallback(async (prompt) => {
        if (!prompt.trim() || isThinking || isWarming)
            return;
        setMessages((prev) => [...prev, {
                id: `u-${Date.now()}`, role: 'user', content: prompt, timestamp: Date.now(),
            }]);
        setThinking(true);
        try {
            const resp = (await sendMessage('AI_QUERY', { prompt, model, provider }));
            if (mountedRef.current) {
                setMessages((prev) => [...prev, {
                        id: `a-${Date.now()}`,
                        role: 'assistant',
                        content: resp.success && resp.data?.response
                            ? resp.data.response
                            : `⚠ ${resp.error ?? 'Erreur — réessaie dans quelques secondes.'}`,
                        model: resp.data?.model ?? model,
                        provider: (resp.data?.provider ?? provider),
                        tokens: resp.data?.eval_count,
                        duration_ms: resp.data?.duration_ms,
                        timestamp: Date.now(),
                    }]);
            }
        }
        catch (err) {
            if (mountedRef.current) {
                setMessages((prev) => [...prev, {
                        id: `e-${Date.now()}`, role: 'assistant',
                        content: `⚠ ${err instanceof Error ? err.message : String(err)}`,
                        timestamp: Date.now(),
                    }]);
            }
        }
        finally {
            if (mountedRef.current)
                setThinking(false);
        }
    }, [isThinking, isWarming, model, provider, sendMessage]);
    return {
        messages, isThinking, isWarming, isConnected,
        provider, model, availableModels, apiKeys,
        sendQuery, setModel, setProvider, setApiKey,
        clearMessages: useCallback(() => setMessages([]), []),
        checkStatus, warmup,
    };
}
//# sourceMappingURL=useNeoAI.js.map