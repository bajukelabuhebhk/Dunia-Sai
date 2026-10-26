/*
 * The dashboard moved to its own app (/pantau-app). This replaces the old /pantau/ service worker
 * on phones that installed it, then removes itself.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('pantau-')) await caches.delete(k);
    await self.registration.unregister();
  })());
});
