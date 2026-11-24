// ============================================================================
// Server-Aufrufe mit WLAN-PIN.
// Im WLAN-Modus (`npm run lan`) verlangt der Server für /api/* von anderen Geräten eine PIN. Sie steht im QR-Link des
// Launchers als `?k=…`, wird pro Gerät gemerkt (localStorage, gilt auch für die Vorschau-Iframes) und als Header
// `X-Takt-Pin` mitgesendet. Auf dem eigenen Rechner (127.0.0.1) ist keine PIN nötig.
// ============================================================================
const KEY = 'takt-lan-pin';

/** PIN aus dem Link übernehmen (und merken) oder die gemerkte PIN liefern; leer, wenn keine bekannt ist. */
export function lanPin() {
  try {
    const k = new URLSearchParams(globalThis.location?.search || '').get('k');
    if (k && /^[0-9]{4,12}$/.test(k)) { globalThis.localStorage?.setItem(KEY, k); return k; }
    return globalThis.localStorage?.getItem(KEY) || '';
  } catch { return ''; }
}

/** fetch() für /api/* – hängt die PIN an, falls bekannt. */
export function apiFetch(url, opts = {}) {
  const pin = lanPin();
  if (!pin) return fetch(url, opts);
  const headers = new Headers(opts.headers || {});
  headers.set('X-Takt-Pin', pin);
  return fetch(url, { ...opts, headers });
}
