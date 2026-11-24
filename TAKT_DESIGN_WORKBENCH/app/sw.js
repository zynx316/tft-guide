// Service Worker des Demo-Launchers: offline nutzbar (nur in sicheren Kontexten: localhost/HTTPS).
// Statische Dateien: zuerst Cache, im Hintergrund aktualisieren. /api: zuerst Netz, sonst Cache.
const CACHE = 'takt-launcher-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./launcher.html', './preview.html', './manifest.webmanifest', './icon.svg']).catch(() => {}))); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(e.request).then((r) => { if (r.ok && url.pathname === '/api/state') { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c)); } return r; }).catch(() => caches.match(e.request).then((r) => r || new Response('{"error":"offline"}', { status: 503, headers: { 'Content-Type': 'application/json' } }))));
    return;
  }
  e.respondWith(caches.match(e.request).then((cached) => {
    const net = fetch(e.request).then((r) => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c)); } return r; }).catch(() => cached);
    return cached || net;
  }));
});
