/*
 * Service worker for the owner's dashboard only (scope /pantau/), so it installs as its own app.
 * The page always tries the network first; the cached copy is used only when offline.
 * Numbers from /api/pantau are never cached here.
 */
const CACHE = 'pantau-1';
const SHELL = ['/pantau/', '/pantau/manifest.json', '/shared/js/config.js', '/shared/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('pantau-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  const key = event.request.mode === 'navigate' ? '/pantau/' : url.pathname;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok && SHELL.includes(key)) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(key, copy)); }
        return res;
      })
      .catch(() => caches.match(key).then((hit) => hit || Response.error()))
  );
});
