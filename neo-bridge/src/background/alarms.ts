// ─── Neo Alarm Manager ────────────────────────────────────────────────────────
// Chrome Alarms for periodic tasks: monitoring, focus timer, tech watch.

const ALARMS = {
  HEARTBEAT: 'neo-heartbeat',          // 1 min — keep-alive & status check
  METRICS_COLLECT: 'neo-metrics',      // 5 min — collect system metrics
  TECH_WATCH: 'neo-tech-watch',        // 60 min — check tech news
} as const;

/**
 * Register all Neo alarms.
 * Called on install and browser startup.
 */
export function registerAlarms(): void {
  // Heartbeat — 1 minute
  chrome.alarms.create(ALARMS.HEARTBEAT, {
    periodInMinutes: 1,
  });

  // Metrics collection — 5 minutes
  chrome.alarms.create(ALARMS.METRICS_COLLECT, {
    periodInMinutes: 5,
  });

  // Tech watch — 60 minutes
  chrome.alarms.create(ALARMS.TECH_WATCH, {
    periodInMinutes: 60,
  });

  console.log('[Neo Alarms] ⏰ Alarms registered.');
}

/**
 * Handle alarm events.
 */
export function handleAlarms(alarm: chrome.alarms.Alarm): void {
  switch (alarm.name) {
    case ALARMS.HEARTBEAT:
      handleHeartbeat();
      break;

    case ALARMS.METRICS_COLLECT:
      handleMetricsCollection();
      break;

    case ALARMS.TECH_WATCH:
      handleTechWatch();
      break;

    default:
      // Check for dynamic alarm names (e.g., focus timer)
      if (alarm.name.startsWith('neo-focus-')) {
        handleFocusAlarm(alarm.name);
      }
      break;
  }
}

// ─── Alarm Handlers ───────────────────────────────────────────────────────────

function handleHeartbeat(): void {
  // Update session timestamp
  chrome.storage.session.set({
    neo_last_heartbeat: Date.now(),
  });
}

async function handleMetricsCollection(): Promise<void> {
  // Check if system-monitor module is enabled
  const result = await chrome.storage.local.get('neo_modules');
  const modules = result.neo_modules || [];
  const sysMonitor = modules.find(
    (m: { id: string; enabled: boolean }) => m.id === 'system-monitor' && m.enabled
  );

  if (!sysMonitor) return;

  console.log('[Neo Alarms] 📊 Collecting system metrics...');
  // TODO: Phase 3 — Trigger native messaging to collect system metrics
}

async function handleTechWatch(): Promise<void> {
  // Check if tech-watch module is enabled
  const result = await chrome.storage.local.get('neo_modules');
  const modules = result.neo_modules || [];
  const techWatch = modules.find(
    (m: { id: string; enabled: boolean }) => m.id === 'tech-watch' && m.enabled
  );

  if (!techWatch) return;

  console.log('[Neo Alarms] 📰 Checking tech news...');
  // TODO: Phase 4 — Fetch tech news from configured sources
}

function handleFocusAlarm(alarmName: string): void {
  console.log(`[Neo Alarms] ⏱️ Focus alarm: ${alarmName}`);
  // TODO: Phase 2 — Handle focus timer notifications
}

// ─── Focus Timer Alarm Helpers ────────────────────────────────────────────────

export function createFocusAlarm(
  sessionId: string,
  durationMinutes: number
): void {
  chrome.alarms.create(`neo-focus-${sessionId}`, {
    delayInMinutes: durationMinutes,
  });
}

export function cancelFocusAlarm(sessionId: string): void {
  chrome.alarms.clear(`neo-focus-${sessionId}`);
}
