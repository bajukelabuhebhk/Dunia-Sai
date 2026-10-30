/*
 * Dunia Sai service worker (scope /).
 *
 * - The landing page, launcher and shared files are cached on install.
 * - A game is saved for offline play the first time it is opened (or from the launcher's
 *   "Simpan untuk offline" button), then always loads from the cache, even with internet.
 * - On update, only files whose hash changed in /files.json are downloaded again.
 *
 * VERSION is set by `node tools/kemas-kini.mjs`; do not edit it by hand.
 */
const VERSION = '7a19681979';
const CORE = `ds-core-${VERSION}`;
const GAMES = 'ds-games';
const LIST = '/files.json';

let listPromise = null;
function getList() {
  if (!listPromise) {
    listPromise = caches.open(CORE)
      .then((c) => c.match(LIST))
      .then((r) => (r ? r.json() : fetch(LIST).then((x) => x.json())))
      .catch(() => { listPromise = null; return null; });
  }
  return listPromise;
}

// Cache a response without its "redirected" flag, which navigations refuse
async function clean(res) {
  if (!res.redirected) return res;
  return new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: res.headers });
}

async function fetchFresh(url) {
  const res = await fetch(new Request(url, { cache: 'reload' }));
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return clean(res);
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const res = await fetchFresh(LIST);
    const list = await res.clone().json();
    const cache = await caches.open(CORE);
    await cache.put(LIST, res);
    await Promise.all(Object.keys(list.core.files).map(async (url) => {
      try { await cache.put(url, await fetchFresh(url)); } catch (e) { /* one missing file must not block install */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const oldNames = (await caches.keys()).filter((k) => k.startsWith('ds-core-') && k !== CORE);
    let oldList = null;
    for (const name of oldNames) {
      const r = await (await caches.open(name)).match(LIST);
      if (r) { oldList = await r.json(); break; }
    }
    await self.clients.claim();
    const list = await getList();
    if (list) await refreshGames(oldList, list);
    await Promise.all(oldNames.map((k) => caches.delete(k)));
  })());
});

// Refetch changed files of games already saved; drop files that no longer exist
async function refreshGames(oldList, list) {
  const cache = await caches.open(GAMES);
  const cached = new Set((await cache.keys()).map((r) => new URL(r.url).pathname));
  const now = {};
  for (const g of Object.values(list.games)) Object.assign(now, g.files);
  const before = {};
  if (oldList) for (const g of Object.values(oldList.games)) Object.assign(before, g.files);
  for (const url of cached) {
    if (!(url in now)) { await cache.delete(url); continue; }
    if (before[url] !== now[url]) {
      try { await cache.put(url, await fetchFresh(url)); } catch (e) { /* try again next update */ }
    }
  }
}

function gameOf(list, path) {
  for (const [id, g] of Object.entries(list.games)) if (path in g.files) return id;
  return null;
}

const saving = new Map();
// Download every file of a game that is not cached yet. Reports progress to open pages.
function saveGame(id) {
  if (saving.has(id)) return saving.get(id);
  const job = (async () => {
    const list = await getList();
    const files = Object.keys(list.games[id].files);
    const cache = await caches.open(GAMES);
    const have = new Set((await cache.keys()).map((r) => new URL(r.url).pathname));
    const todo = files.filter((u) => !have.has(u));
    let done = files.length - todo.length, failed = 0;
    const tell = async (final) => {
      for (const c of await self.clients.matchAll()) c.postMessage({ type: 'ds-save', id, done, total: files.length, failed, final });
    };
    const queue = todo.slice();
    async function worker() {
      while (queue.length) {
        const url = queue.shift();
        try { await cache.put(url, await fetchFresh(url)); done++; } catch (e) { failed++; }
        if ((done + failed) % 10 === 0) await tell(false);
      }
    }
    await Promise.all([worker(), worker(), worker(), worker()]);
    await tell(true);
    return failed === 0;
  })().finally(() => saving.delete(id));
  saving.set(id, job);
  return job;
}

// Audio elements (Safari especially) ask for byte ranges; answer them from the cached file
async function withRange(request, res) {
  const range = request.headers.get('range');
  if (!range || res.status !== 200) return res;
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  if (!m) return res;
  const buf = await res.arrayBuffer();
  const size = buf.byteLength;
  let start = m[1] === '' ? size - Number(m[2]) : Number(m[1]);
  let end = m[1] !== '' && m[2] !== '' ? Number(m[2]) : size - 1;
  start = Math.max(0, start); end = Math.min(end, size - 1);
  if (start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  const headers = new Headers(res.headers);
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(end - start + 1));
  return new Response(buf.slice(start, end + 1), { status: 206, headers });
}

async function fromCacheFirst(event, cacheName, key) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(key);
  if (hit) return withRange(event.request, hit);
  let res;
  try { res = await fetch(key); } catch (e) {
    if (event.request.mode !== 'navigate') throw e;
    return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tiada internet</title><body style="font-family:system-ui,sans-serif;background:#fff8ec;color:#23314a;text-align:center;padding:48px 20px">
<div style="font-size:48px">📶</div><h1>Tiada internet</h1><p>Game ini belum disimpan untuk main tanpa internet.<br>Buka sekali semasa ada internet, selepas itu ia boleh dimainkan bila-bila masa.</p>
<p><a href="/app/" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#0f7a5c;color:#fff;font-weight:700;text-decoration:none">Kembali ke senarai game</a></p>`,
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
  if (res.ok) {
    const copy = await clean(res);
    await cache.put(key, copy.clone());
    return withRange(event.request, copy);
  }
  return res;
}

// Small pages: try the network briefly so updates show, else the cached copy
async function fromNetworkFirst(event, key) {
  const cache = await caches.open(CORE);
  try {
    const res = await Promise.race([
      fetch(event.request),
      new Promise((_, no) => setTimeout(() => no(new Error('slow')), 4000)),
    ]);
    if (res.ok && !res.redirected) cache.put(key, res.clone());
    return res;
  } catch (e) {
    return (await cache.match(key)) || (await cache.match('/app/')) ||
      new Response('<meta name="viewport" content="width=device-width"><h1>Tiada internet</h1><p>Buka semula apabila dalam talian.</p>',
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname === LIST || url.pathname === '/sw.js') return;

  event.respondWith((async () => {
    const list = await getList();
    if (!list) return fetch(req);
    let path = url.pathname;
    if (path.endsWith('/index.html')) path = path.slice(0, -10);
    else if (path.endsWith('.html')) path = path.slice(0, -5);
    if (path.startsWith('/promo/') || path === '/promo') path = '/promo/template';

    // /app/kenal-jawi -> /app/kenal-jawi/ so the game's relative audio paths resolve
    if (req.mode === 'navigate' && !path.endsWith('/') && (gameOf(list, path + '/') || (path + '/') in list.core.files)) {
      return Response.redirect(path + '/' + url.search, 301);
    }

    const game = gameOf(list, path);
    if (game) {
      if (req.mode === 'navigate') event.waitUntil(saveGame(game).catch(() => {}));
      return fromCacheFirst(event, GAMES, path);
    }
    if (path in list.core.files) {
      if (req.mode === 'navigate') return fromNetworkFirst(event, path);
      return fromCacheFirst(event, CORE, path);
    }
    return fetch(req);
  })());
});

self.addEventListener('message', (event) => {
  const d = event.data || {};
  if (d.type === 'ds-save' && d.id) event.waitUntil(saveGame(d.id).catch(() => {}));
});
