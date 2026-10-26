/*
 * Dunia Sai — root service worker (scope: /)
 * Precaches every module so the whole bundle plays offline after the
 * first visit. Bump VERSION on every deploy that changes a file below.
 */
const VERSION = 'v1.0.0';
const CORE = `eduplay-core-${VERSION}`;
const RUNTIME = 'eduplay-runtime';
const FONTS = 'eduplay-fonts';

// Paths as Cloudflare Pages serves them (folders end in /, .html is dropped)
const PRECACHE = [
  '/',
  '/app/',
  '/app/jawi/',
  '/app/matematik/',
  '/app/abc/',
  '/app/kembara/',
  '/promo/template',
  '/manifest.json',
  '/shared/css/theme.css',
  '/shared/js/config.js',
  '/shared/js/storage.js',
  '/shared/js/ui.js',
  '/shared/audio/correct.mp3',
  '/shared/audio/wrong.mp3',
  '/shared/audio/click.mp3',
  '/shared/icons/icon-192.png',
  '/shared/icons/icon-512.png',
  '/shared/icons/maskable-512.png',
  '/shared/icons/apple-touch-icon.png',
  '/shared/icons/favicon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CORE);
    // `cache: 'reload'` skips the HTTP cache so a new VERSION gets fresh files
    await Promise.all(PRECACHE.map(async (url) => {
      try {
        const res = await fetch(new Request(url, { cache: 'reload' }));
        if (res.ok) await cache.put(url, res);
      } catch (e) { /* one missing file must not block install */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((k) => k.startsWith('eduplay-core-') && k !== CORE)
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Normalise a navigation URL to the key it was precached under
function pageKey(url) {
  let p = url.pathname;
  if (p.endsWith('/index.html')) p = p.slice(0, -10);
  else if (p.endsWith('.html')) p = p.slice(0, -5);
  if (p.startsWith('/promo/')) return '/promo/template'; // every campaign uses one template
  if (!p.endsWith('/') && PRECACHE.includes(p + '/')) p += '/';
  return p;
}

async function fromNetworkThenCache(request, key) {
  const cache = await caches.open(CORE);
  try {
    const res = await fetch(request);
    if (res.ok && res.type === 'basic' && !res.redirected) cache.put(key, res.clone());
    return res;
  } catch (e) {
    return (await cache.match(key)) ||
           (await cache.match('/app/')) ||
           new Response('<h1>Tiada sambungan internet</h1><p>Buka semula apabila anda dalam talian.</p>',
             { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch: true }) ||
                 await caches.match(new URL(request.url).pathname);
  const network = fetch(request).then((res) => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone());
    return res;
  }).catch(() => cached || Response.error());
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Google Fonts: CSS and font files, cached once and kept
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request, FONTS));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Pages: network first so updates show, cached copy when offline
  if (request.mode === 'navigate') {
    event.respondWith(fromNetworkThenCache(request, pageKey(url)));
    return;
  }

  // Assets: instant from cache, refreshed in the background
  event.respondWith(staleWhileRevalidate(request, request.url.includes('/shared/') ? CORE : RUNTIME));
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
