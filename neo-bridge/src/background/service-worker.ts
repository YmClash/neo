// ═══════════════════════════════════════════════════════════════════════════════
// Neo Service Worker — The Central Brain v0.3.0 (Phase 4 — AI)
// ═══════════════════════════════════════════════════════════════════════════════
// Manages: module lifecycle, message routing, WASM bridge, alarms, notifications,
//          native messaging polling, panic detection, context buffer, Ollama AI.
// Manifest V3 — event-driven, stateless between wake-ups.

import { handleAlarms, registerAlarms } from './alarms';
import { showNotification } from './notifications';
import { ModuleManager } from './moduleManager';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NeoMessage {
  type: string;
  source: string;
  payload?: unknown;
  timestamp: number;
}

interface NeoResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

interface ContextEvent {
  ts: number;
  type: string;
  data: Record<string, unknown>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NATIVE_HOST_NAME = 'com.neo.bridge';
const METRICS_ALARM = 'neo-metrics-poll';
const BUFFER_MAX_SIZE = 50;
const DEFAULT_AI_MODEL = 'llama3.2:3b';
const DEFAULT_PROVIDER = 'ollama'; // 'ollama' | 'gemini' | 'openai' | 'claude'

// ─── Ollama Direct API (fetch — no Native Messaging timeout) ─────────────────

const OLLAMA_URL = 'http://localhost:11434';

const NEO_SYSTEM_PROMPT = `Tu es Neo, l'IA intégrée au laboratoire Egghead du Docteur Y_MC.
Tu es son assistant personnel de monitoring et d'analyse avancée.

STYLE DE COMMUNICATION :
- Tutoie l'utilisateur et appelle-le "Docteur Ymc " à l'occasion
- Sois concis, technique et direct — pas de bavardage
- Utilise des termes comme "Analyse en cours", "Séquence synchronisée", "Diagnostic validé"
- Termine souvent par une action concrète proposée (surtout si tu vois un problème)
- Tu peux proposer des commandes Kernel si pertinent

CONTEXTE SYSTÈME ACTUEL :
{system_context}

JOURNAL D'ACTIVITÉ :
{activity_context}

DONNÉES WEB RÉCENTES :
{probe_context}

Réponds en français. Sois proactif — si tu vois un problème dans le contexte, signale-le.`;

function buildSystemPrompt(metrics: Record<string, unknown> | null, events: Array<Record<string, unknown>>): string {
  const sysCtx = metrics
    ? `CPU: ${metrics.cpu_percent}% | RAM: ${metrics.memory_percent}% | Disque: ${metrics.disk_percent}%`
    : 'Métriques non disponibles';

  const recentEvents = events.slice(-15);
  const actCtx = recentEvents.length
    ? recentEvents.map((ev) => {
      const ts = new Date(Number(ev.ts ?? 0)).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      return `[${ts}] ${String(ev.type).replace(/_/g, ' ')}`;
    }).join('\n')
    : 'Aucun événement récent';

  const probes = events.filter((ev) => ev.type === 'probe_executed').slice(-3);
  const probeCtx = probes.length
    ? probes.map((ev) => {
      const d = (ev.data ?? {}) as Record<string, unknown>;
      return `URL: ${String(d.url ?? '').slice(0, 60)}\nTitre: ${String(d.title ?? '').slice(0, 80)}`;
    }).join('\n---\n')
    : 'Aucune probe récente';

  return NEO_SYSTEM_PROMPT
    .replace('{system_context}', sysCtx)
    .replace('{activity_context}', actCtx)
    .replace('{probe_context}', probeCtx);
}

async function ollamaStatus(): Promise<{ available: boolean; models: unknown[] }> {
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) return { available: false, models: [] };
    const data = await r.json() as { models: Array<{ name: string; size: number; details: { parameter_size: string; family: string } }> };
    const models = (data.models ?? []).map((m) => ({
      name: m.name,
      size_gb: Math.round(m.size / (1024 ** 3) * 10) / 10,
      params: m.details?.parameter_size ?? '?',
      family: m.details?.family ?? '?',
    }));
    return { available: true, models };
  } catch {
    return { available: false, models: [] };
  }
}

async function ollamaWarmup(model: string): Promise<boolean> {
  try {
    // Empty prompt with keep_alive=-1 loads the model into VRAM and keeps it there
    const r = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: '', stream: false, keep_alive: -1 }),
      signal: AbortSignal.timeout(300_000), // 5 min — ample time for first load
    });
    return r.ok;
  } catch {
    return false;
  }
}

async function ollamaQuery(
  prompt: string, model: string,
  metrics: Record<string, unknown> | null,
  events: Array<Record<string, unknown>>
): Promise<{ response: string; eval_count: number; duration_ms: number }> {
  const t0 = Date.now();
  const system = buildSystemPrompt(metrics, events);
  const r = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      system,
      stream: false,
      keep_alive: -1,
      options: { temperature: 0.7, top_p: 0.9, num_predict: 512 },
    }),
    signal: AbortSignal.timeout(300_000),
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`${r.status} ${r.statusText}: ${body.slice(0, 200)}`);
  }
  const data = await r.json() as { response: string; eval_count: number };
  return { response: data.response ?? '', eval_count: data.eval_count ?? 0, duration_ms: Date.now() - t0 };
}

// ─── Cloud Provider Queries ──────────────────────────────────────────────────

async function geminiQuery(
  prompt: string, model: string, apiKey: string,
  system: string
): Promise<{ response: string; eval_count: number; duration_ms: number }> {
  const t0 = Date.now();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ parts: [{ text: prompt }], role: 'user' }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`Gemini ${r.status}: ${body.slice(0, 300)}`);
  }
  const data = await r.json() as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    usageMetadata?: { candidatesTokenCount?: number };
  };
  const response = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return { response, eval_count: data.usageMetadata?.candidatesTokenCount ?? 0, duration_ms: Date.now() - t0 };
}

async function openaiQuery(
  prompt: string, model: string, apiKey: string,
  system: string
): Promise<{ response: string; eval_count: number; duration_ms: number }> {
  const t0 = Date.now();
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`OpenAI ${r.status}: ${body.slice(0, 300)}`);
  }
  const data = await r.json() as {
    choices: Array<{ message: { content: string } }>;
    usage?: { completion_tokens?: number };
  };
  return {
    response: data.choices?.[0]?.message?.content ?? '',
    eval_count: data.usage?.completion_tokens ?? 0,
    duration_ms: Date.now() - t0,
  };
}

async function claudeQuery(
  prompt: string, model: string, apiKey: string,
  system: string
): Promise<{ response: string; eval_count: number; duration_ms: number }> {
  const t0 = Date.now();
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`Claude ${r.status}: ${body.slice(0, 300)}`);
  }
  const data = await r.json() as {
    content: Array<{ text: string }>;
    usage?: { output_tokens?: number };
  };
  return {
    response: data.content?.[0]?.text ?? '',
    eval_count: data.usage?.output_tokens ?? 0,
    duration_ms: Date.now() - t0,
  };
}

// Route query to the correct provider
async function routeQuery(
  prompt: string,
  model: string,
  provider: string,
  apiKey: string,
  metrics: Record<string, unknown> | null,
  events: Array<Record<string, unknown>>
): Promise<{ response: string; eval_count: number; duration_ms: number }> {
  const system = buildSystemPrompt(metrics, events);
  switch (provider) {
    case 'gemini': return geminiQuery(prompt, model, apiKey, system);
    case 'openai': return openaiQuery(prompt, model, apiKey, system);
    case 'claude': return claudeQuery(prompt, model, apiKey, system);
    default: return ollamaQuery(prompt, model, metrics, events);
  }
}

// ─── Module Manager Instance ──────────────────────────────────────────────────

const moduleManager = new ModuleManager();

// ─── Lifecycle Events ─────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Neo SW] 🧬 Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    await chrome.storage.local.set({
      neo_theme: 'egghead',
      neo_modules: getDefaultModules(),
      neo_tasks: [],
      neo_settings: { notifications: true, autoStart: false },
      neo_system_metrics: null,
      neo_metrics_history: [],
      neo_context_buffer: [],
      neo_bridge_connected: false,
      neo_panic_state: { panic: false, level: 'NORMAL', reason: '' },
      neo_ai_model: DEFAULT_AI_MODEL,
      neo_ai_connected: false,
      neo_ai_thinking: false,
      neo_ai_warming: false,
      neo_ai_provider: DEFAULT_PROVIDER,
      neo_ai_keys: { gemini: '', openai: '', claude: '' },
    });

    showNotification(
      'neo-welcome',
      'Neo — Online',
      '🧬 Systèmes initialisés. Extension prête.',
      'normal'
    );
  }

  registerAlarms();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[Neo SW] 🔄 Browser startup detected.');
  registerAlarms();
});

// ─── Message Router ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: NeoMessage, sender, sendResponse: (response: NeoResponse) => void) => {
    console.log(`[Neo SW] 📨 Message: ${message.type} from ${message.source}`);

    handleMessage(message, sender)
      .then((response) => sendResponse(response))
      .catch((error) => {
        console.error('[Neo SW] Message handler error:', error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        });
      });

    return true; // async response
  }
);

async function handleMessage(
  message: NeoMessage,
  _sender: chrome.runtime.MessageSender
): Promise<NeoResponse> {
  switch (message.type) {

    // ─── System ───────────────────────────────────────────────
    case 'NEO_INIT':
      return {
        success: true,
        data: {
          version: '0.2.0',
          modules: await moduleManager.getModules(),
        },
        timestamp: Date.now(),
      };

    // ─── Modules ──────────────────────────────────────────────
    case 'GET_MODULES':
      return {
        success: true,
        data: await moduleManager.getModules(),
        timestamp: Date.now(),
      };

    case 'MODULE_TOGGLE': {
      const { moduleId, enabled } = message.payload as {
        moduleId: string;
        enabled: boolean;
      };
      await moduleManager.toggleModule(moduleId, enabled);
      return { success: true, data: { moduleId, enabled }, timestamp: Date.now() };
    }

    case 'MODULE_CONFIG': {
      const { moduleId: configModuleId, config } = message.payload as {
        moduleId: string;
        config: Record<string, unknown>;
      };
      await moduleManager.updateConfig(configModuleId, config);
      return { success: true, data: { moduleId: configModuleId }, timestamp: Date.now() };
    }

    // ─── Theme ────────────────────────────────────────────────
    case 'THEME_CHANGE': {
      const { theme } = message.payload as { theme: string };
      await chrome.storage.local.set({ neo_theme: theme });
      return { success: true, data: { theme }, timestamp: Date.now() };
    }

    case 'THEME_GET': {
      const result = await chrome.storage.local.get('neo_theme');
      return {
        success: true,
        data: { theme: result.neo_theme || 'egghead' },
        timestamp: Date.now(),
      };
    }

    // ─── Bridge / Native Messaging ────────────────────────────
    case 'BRIDGE_COMMAND': {
      try {
        const response = await sendNativeMessage(message.payload);
        return { success: true, data: response, timestamp: Date.now() };
      } catch (error) {
        await chrome.storage.local.set({ neo_bridge_connected: false });
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Bridge error',
          timestamp: Date.now(),
        };
      }
    }

    case 'BRIDGE_PING': {
      try {
        const response = await sendNativeMessage({ action: 'ping' });
        await chrome.storage.local.set({ neo_bridge_connected: true });
        return { success: true, data: response, timestamp: Date.now() };
      } catch (error) {
        await chrome.storage.local.set({ neo_bridge_connected: false });
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Bridge unreachable',
          timestamp: Date.now(),
        };
      }
    }

    // ─── Metrics Subscription (real-time polling) ─────────────
    case 'METRICS_SUBSCRIBE': {
      // Start polling alarm (Chrome alarm minimum is 1 minute,
      // so we use a 1-minute alarm but also do an immediate poll)
      chrome.alarms.create(METRICS_ALARM, { periodInMinutes: 1 });
      // Immediate first poll
      await pollSystemMetrics();
      return { success: true, data: { polling: true }, timestamp: Date.now() };
    }

    case 'METRICS_UNSUBSCRIBE': {
      chrome.alarms.clear(METRICS_ALARM);
      return { success: true, data: { polling: false }, timestamp: Date.now() };
    }

    case 'METRICS_POLL': {
      // Manual poll request from the UI (called by the hook every 3s via setInterval)
      await pollSystemMetrics();
      const result = await chrome.storage.local.get([
        'neo_system_metrics',
        'neo_metrics_history',
        'neo_bridge_connected',
        'neo_panic_state',
      ]);
      return { success: true, data: result, timestamp: Date.now() };
    }

    // ─── Focus Timer ──────────────────────────────────────────
    case 'FOCUS_START': {
      const { minutes } = message.payload as { minutes: number };
      const sessionId = Date.now().toString();
      import('./alarms').then(({ createFocusAlarm }) => {
        createFocusAlarm(sessionId, minutes);
      });
      await appendToContextBuffer('focus_started', { minutes, sessionId });
      return { success: true, data: { sessionId, minutes }, timestamp: Date.now() };
    }

    case 'FOCUS_STOP': {
      chrome.alarms.getAll((alarms) => {
        alarms.forEach((alarm) => {
          if (alarm.name.startsWith('neo-focus-')) {
            chrome.alarms.clear(alarm.name);
          }
        });
      });
      return { success: true, timestamp: Date.now() };
    }

    case 'FOCUS_COMPLETE': {
      const { duration } = message.payload as { duration: number };
      await appendToContextBuffer('focus_session_completed', { duration_minutes: duration });
      return { success: true, timestamp: Date.now() };
    }

    // ─── Web Probes ───────────────────────────────────────────
    case 'PROBE_COMPLETE': {
      const { url, itemCount, sentiment, title, meta_description, text_preview } = message.payload as {
        url: string;
        itemCount: number;
        sentiment?: { score: number; label: string };
        title?: string;
        meta_description?: string;
        text_preview?: string;
      };
      import('./notifications').then(({ notifyProbeResult }) => {
        notifyProbeResult(url, itemCount);
      });
      await appendToContextBuffer('probe_executed', {
        url, items: itemCount, sentiment,
        title: title ?? '',
        meta_description: meta_description ?? '',
        text_preview: text_preview ?? '',
      });
      return { success: true, timestamp: Date.now() };
    }

    // ─── Tasks ────────────────────────────────────────────────
    case 'TASK_COMPLETED': {
      const { text, quadrant } = message.payload as { text: string; quadrant: string };
      await appendToContextBuffer('task_completed', { text, quadrant });
      return { success: true, timestamp: Date.now() };
    }

    // ─── Context Buffer ───────────────────────────────────────
    case 'CONTEXT_BUFFER_GET': {
      const result = await chrome.storage.local.get('neo_context_buffer');
      return { success: true, data: result.neo_context_buffer || [], timestamp: Date.now() };
    }

    case 'CONTEXT_BUFFER_CLEAR': {
      await chrome.storage.local.set({ neo_context_buffer: [] });
      return { success: true, timestamp: Date.now() };
    }

    // ─── AI (Multi-Provider) ───────────────────────────────────
    case 'AI_STATUS': {
      const stored = await chrome.storage.local.get('neo_ai_provider');
      const provider = (stored.neo_ai_provider ?? DEFAULT_PROVIDER) as string;
      // Cloud providers are always "connected" if they have a key
      if (provider !== 'ollama') {
        const keysStore = await chrome.storage.local.get('neo_ai_keys');
        const keys = keysStore.neo_ai_keys ?? {};
        const hasKey = !!keys[provider];
        await chrome.storage.local.set({ neo_ai_connected: hasKey });
        return { success: true, data: { available: hasKey, models: [], provider }, timestamp: Date.now() };
      }
      const status = await ollamaStatus();
      await chrome.storage.local.set({ neo_ai_connected: status.available });
      return { success: true, data: { ...status, provider: 'ollama' }, timestamp: Date.now() };
    }

    case 'AI_PROVIDER_SET': {
      const { provider } = message.payload as { provider: string };
      await chrome.storage.local.set({ neo_ai_provider: provider });
      // For cloud providers, auto-connect if key exists; for ollama, check status
      if (provider !== 'ollama') {
        const keysStore = await chrome.storage.local.get('neo_ai_keys');
        const hasKey = !!(keysStore.neo_ai_keys ?? {})[provider];
        await chrome.storage.local.set({ neo_ai_connected: hasKey, neo_ai_warming: false });
      }
      return { success: true, data: { provider }, timestamp: Date.now() };
    }

    case 'AI_KEY_SET': {
      const { provider: keyProvider, key } = message.payload as { provider: string; key: string };
      const keysStore = await chrome.storage.local.get('neo_ai_keys');
      const keys = { ...(keysStore.neo_ai_keys ?? {}), [keyProvider]: key };
      await chrome.storage.local.set({ neo_ai_keys: keys });
      // Immediately mark as connected if key is non-empty
      const currentProvider = (await chrome.storage.local.get('neo_ai_provider')).neo_ai_provider;
      if (currentProvider === keyProvider) {
        await chrome.storage.local.set({ neo_ai_connected: !!key });
      }
      return { success: true, timestamp: Date.now() };
    }

    case 'AI_MODEL_SET': {
      const { model } = message.payload as { model: string };
      await chrome.storage.local.set({ neo_ai_model: model });
      return { success: true, data: { model }, timestamp: Date.now() };
    }

    case 'AI_WARMUP': {
      const { model: warmModel } = message.payload as { model: string };
      await chrome.storage.local.set({ neo_ai_warming: true });
      try {
        const ready = await ollamaWarmup(warmModel);
        await chrome.storage.local.set({ neo_ai_warming: false, neo_ai_connected: ready });
        return { success: ready, data: { model: warmModel, ready }, timestamp: Date.now() };
      } catch (e) {
        await chrome.storage.local.set({ neo_ai_warming: false });
        return { success: false, error: String(e), timestamp: Date.now() };
      }
    }

    case 'AI_QUERY': {
      const { prompt, model, provider: payloadProvider } = message.payload as {
        prompt: string; model: string; provider?: string;
      };
      await chrome.storage.local.set({ neo_ai_thinking: true });
      try {
        const stored = await chrome.storage.local.get([
          'neo_system_metrics', 'neo_context_buffer',
          'neo_ai_provider', 'neo_ai_keys',
        ]);
        const provider = payloadProvider ?? (stored.neo_ai_provider as string | undefined) ?? DEFAULT_PROVIDER;
        const apiKey = ((stored.neo_ai_keys ?? {}) as Record<string, string>)[provider] ?? '';
        const result = await routeQuery(
          prompt, model, provider, apiKey,
          stored.neo_system_metrics ?? null,
          stored.neo_context_buffer ?? []
        );
        await appendToContextBuffer('ai_query', { prompt: prompt.slice(0, 100), model, provider, response_length: result.response.length });
        return { success: true, data: { ...result, model, provider }, timestamp: Date.now() };
      } catch (e) {
        return { success: false, error: String(e), data: null, timestamp: Date.now() };
      } finally {
        await chrome.storage.local.set({ neo_ai_thinking: false });
      }
    }

    // ─── Default ──────────────────────────────────────────────
    default:
      return {
        success: false,
        error: `Unknown message type: ${message.type}`,
        timestamp: Date.now(),
      };
  }
}

// ─── Alarm Handler ────────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === METRICS_ALARM) {
    await pollSystemMetrics();
  } else {
    handleAlarms(alarm);
  }
});

// ─── System Metrics Polling ───────────────────────────────────────────────────

async function pollSystemMetrics(): Promise<void> {
  try {
    const raw = await sendNativeMessage({ action: 'system_metrics' }) as {
      type: string;
      data: Record<string, unknown>;
    };

    if (raw.type !== 'system_metrics') return;

    const metrics = raw.data;

    // Update bridge connected status
    await chrome.storage.local.set({ neo_bridge_connected: true });

    // Update rolling history (max 60 points ≈ 3 minutes at 3s interval)
    const histResult = await chrome.storage.local.get('neo_metrics_history');
    const history: unknown[] = histResult.neo_metrics_history || [];
    history.push({
      ts: Date.now(),
      cpu: metrics.cpu_percent,
      ram: metrics.memory_percent,
      disk: metrics.disk_percent,
    });
    if (history.length > 60) history.shift();

    // Handle Panic Mode
    const panicData = metrics.panic as {
      panic: boolean;
      level: string;
      reason: string;
      recovering: boolean;
    } | undefined;

    if (panicData) {
      const prevResult = await chrome.storage.local.get('neo_panic_state');
      const prevPanic = prevResult.neo_panic_state?.panic ?? false;

      await chrome.storage.local.set({ neo_panic_state: panicData });

      if (panicData.panic && !prevPanic) {
        // PANIC TRIGGERED → Switch to Punk Hazard theme
        const themeResult = await chrome.storage.local.get('neo_theme');
        await chrome.storage.local.set({
          neo_theme: 'punk-hazard',
          neo_theme_before_panic: themeResult.neo_theme || 'egghead',
        });
        showNotification(
          'neo-panic',
          '⚠️ Neo — Surcharge Système',
          `🔴 ${panicData.reason} — Fermeture des processus non essentiels recommandée.`,
          'high'
        );
        await appendToContextBuffer('panic_triggered', {
          cpu: metrics.cpu_percent,
          ram: metrics.memory_percent,
          level: panicData.level,
          reason: panicData.reason,
        });
      } else if (panicData.recovering && prevPanic) {
        // PANIC RECOVERY → Restore previous theme
        const savedResult = await chrome.storage.local.get('neo_theme_before_panic');
        const prevTheme = savedResult.neo_theme_before_panic || 'egghead';
        await chrome.storage.local.set({ neo_theme: prevTheme });
        showNotification(
          'neo-recovery',
          '✅ Neo — Système Stabilisé',
          `Le système est revenu à un état normal. Thème restauré.`,
          'normal'
        );
        await appendToContextBuffer('panic_recovered', {
          cpu: metrics.cpu_percent,
          ram: metrics.memory_percent,
        });
      }
    }

    // Persist metrics + history
    await chrome.storage.local.set({
      neo_system_metrics: metrics,
      neo_metrics_history: history,
    });

  } catch (error) {
    console.warn('[Neo SW] Metrics poll failed (bridge offline?):', error);
    await chrome.storage.local.set({ neo_bridge_connected: false });
  }
}

// ─── Native Messaging ─────────────────────────────────────────────────────────

function sendNativeMessage(payload: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendNativeMessage(
        NATIVE_HOST_NAME,
        payload as object,
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

// ─── Context Buffer ───────────────────────────────────────────────────────────

async function appendToContextBuffer(
  type: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const result = await chrome.storage.local.get('neo_context_buffer');
    const buffer: ContextEvent[] = result.neo_context_buffer || [];

    buffer.push({ ts: Date.now(), type, data });

    // Keep only the last BUFFER_MAX_SIZE entries (FIFO)
    if (buffer.length > BUFFER_MAX_SIZE) {
      buffer.splice(0, buffer.length - BUFFER_MAX_SIZE);
    }

    await chrome.storage.local.set({ neo_context_buffer: buffer });
  } catch (error) {
    console.warn('[Neo SW] appendToContextBuffer error:', error);
  }
}

// ─── Default Module Definitions ───────────────────────────────────────────────

function getDefaultModules() {
  return [
    {
      id: 'focus-timer',
      name: 'Focus Timer',
      description: 'Pomodoro avancé avec tracking du temps de concentration',
      icon: '⏱️',
      status: 'inactive',
      enabled: false,
      version: '0.2.0',
    },
    {
      id: 'system-monitor',
      name: 'System Monitor',
      description: 'Monitoring CPU, RAM, disque via le bridge Python',
      icon: '📊',
      status: 'inactive',
      enabled: false,
      version: '0.2.0',
    },
    {
      id: 'web-probes',
      name: 'Web Probes',
      description: 'Extraction de données web configurables',
      icon: '🕷️',
      status: 'inactive',
      enabled: false,
      version: '0.2.0',
    },
    {
      id: 'task-manager',
      name: 'Task Manager',
      description: 'Gestion de tâches avec matrice Eisenhower',
      icon: '📋',
      status: 'inactive',
      enabled: false,
      version: '0.2.0',
    },
    {
      id: 'kernel',
      name: 'Kernel Terminal',
      description: 'Terminal sandboxé pour diagnostics système',
      icon: '💻',
      status: 'inactive',
      enabled: false,
      version: '0.2.0',
    },
  ];
}

console.log('[Neo SW] 🧬 Service Worker v0.2.0 loaded.');
