// Neo Content Script — Probe Injector
// Injected into web pages to extract data based on configured probe rules.

interface ProbeConfig {
  selectors: { [key: string]: string };
  extract_text: boolean;
  extract_links: boolean;
  extract_images: boolean;
}

(function neoProbeInjector() {
  if (window.location.protocol === 'chrome-extension:') return;
  console.log('[Neo Probe] Content script loaded on:', window.location.href);

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'PROBE_EXECUTE') {
      const config = message.payload as ProbeConfig;
      const data: Record<string, string | string[]> = {};

      try {
        if (config.selectors) {
          for (const [key, selector] of Object.entries(config.selectors)) {
            try {
              const elements = document.querySelectorAll(selector);
              if (elements.length === 1) {
                data[key] = elements[0].textContent?.trim() || '';
              } else if (elements.length > 1) {
                data[key] = Array.from(elements).map((el) => el.textContent?.trim() || '');
              }
            } catch (selErr) {
              data[key] = `Error: Invalid selector (${selErr})`;
            }
          }
        }
        if (config.extract_text) data['_body_text'] = document.body.innerText.substring(0, 5000);
        if (config.extract_links) {
          data['_links'] = [...new Set(Array.from(document.querySelectorAll('a[href]')).map((a) => (a as HTMLAnchorElement).href))].slice(0, 100);
        }
        if (config.extract_images) {
          data['_images'] = [...new Set(Array.from(document.querySelectorAll('img[src]')).map((img) => (img as HTMLImageElement).src))].slice(0, 50);
        }

        sendResponse({ success: true, data: { url: window.location.href, title: document.title, timestamp: Date.now(), data, success: true }, timestamp: Date.now() });
      } catch (err) {
        sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
    return true;
  });
})();
