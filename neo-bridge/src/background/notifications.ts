// ─── Neo Notification System ──────────────────────────────────────────────────
// Chrome notifications with priority levels and grouping.

type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

const PRIORITY_MAP: Record<NotificationPriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  critical: 2,
};

/**
 * Show a Chrome notification.
 */
export function showNotification(
  id: string,
  title: string,
  message: string,
  priority: NotificationPriority = 'normal',
  buttons?: chrome.notifications.ButtonOptions[]
): void {
  const options: chrome.notifications.NotificationOptions<true> = {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('neo-assets/icons/icon-128.png'),
    title: `[Neo] ${title}`,
    message,
    priority: PRIORITY_MAP[priority],
    silent: priority === 'low',
    requireInteraction: priority === 'critical',
  };

  if (buttons) {
    options.buttons = buttons;
  }

  chrome.notifications.create(id, options, (notifId) => {
    console.log(`[Neo Notifications] 🔔 Created: ${notifId} (${priority})`);
  });
}

/**
 * Clear a notification by ID.
 */
export function clearNotification(id: string): void {
  chrome.notifications.clear(id);
}

/**
 * Listen for notification button clicks.
 */
export function onNotificationClick(
  handler: (notifId: string, buttonIndex?: number) => void
): void {
  chrome.notifications.onClicked.addListener(handler);
  chrome.notifications.onButtonClicked.addListener(handler);
}

// ─── Pre-built Notification Templates ─────────────────────────────────────────

export function notifyFocusComplete(sessionLabel: string, duration: number): void {
  showNotification(
    'neo-focus-complete',
    'Focus Session Complete! ⏱️',
    `"${sessionLabel}" — ${duration} minutes of focus. Time for a break!`,
    'high',
    [{ title: '🔄 Start New Session' }, { title: '✓ Done' }]
  );
}

export function notifyProbeResult(url: string, itemCount: number): void {
  showNotification(
    `neo-probe-${Date.now()}`,
    'Web Probe Result 🕷️',
    `Extracted ${itemCount} items from ${url}`,
    'normal'
  );
}

export function notifySystemAlert(metric: string, value: number, threshold: number): void {
  showNotification(
    `neo-system-${metric}`,
    `System Alert: ${metric} ⚠️`,
    `${metric} is at ${value}% (threshold: ${threshold}%)`,
    'critical'
  );
}
