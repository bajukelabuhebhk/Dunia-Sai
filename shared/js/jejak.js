/*
 * Anonymous counts for the owner's dashboard (/pantau/): page visits, games opened and played,
 * time spent in each game, and taps on WhatsApp buy links.
 *
 * Nothing personal is sent: no name, no licence code, no cookie or device id.
 * Events made while offline wait in localStorage and are sent when the internet is back.
 * The owner's own devices are skipped once /pantau/ has been opened on them (ds_jejak_off).
 */
(function () {
  if (window.top !== window.self || window.__dsJejak) return;
  window.__dsJejak = true;
  const Q = 'ds_jejak_q';
  const store = (() => { try { return window.localStorage; } catch (e) { return null; } })();
  if (store && store.getItem('ds_jejak_off')) return;

  const page = location.pathname.replace(/index\.html$/, '').slice(0, 120);
  const m = /^\/app\/([a-z0-9-]+)\//.exec(page);
  const game = m ? m[1] : null;
  const app = !!(navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches));

  function queue() {
    try { return JSON.parse((store && store.getItem(Q)) || '[]'); } catch (e) { return []; }
  }
  function keep(list) {
    try { if (store) store.setItem(Q, JSON.stringify(list.slice(-100))); } catch (e) { /* storage full or blocked */ }
  }

  let sending = false;
  function flush(beacon) {
    const list = queue();
    if (!list.length || sending || navigator.onLine === false) return;
    const batch = list.slice(0, 30);
    const body = JSON.stringify({ e: batch });
    const done = () => keep(queue().slice(batch.length));
    if (beacon && navigator.sendBeacon) {
      if (navigator.sendBeacon('/api/jejak', new Blob([body], { type: 'text/plain' }))) done();
      return;
    }
    sending = true;
    fetch('/api/jejak', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } })
      .then((r) => { if (r.ok || r.status === 400) { done(); if (list.length > batch.length) setTimeout(flush, 0); } })
      .catch(() => {})
      .finally(() => { sending = false; });
  }

  function send(e, beacon) {
    e.p = page; e.g = game; e.a = app ? 1 : 0; e.ts = Date.now();
    const list = queue(); list.push(e); keep(list);
    flush(beacon);
  }

  let ref = null;
  try { const r = document.referrer && new URL(document.referrer); if (r && r.host !== location.host) ref = r.host.replace(/^www\./, ''); } catch (e) { /* no referrer */ }
  const src = new URLSearchParams(location.search).get('utm_source') || new URLSearchParams(location.search).get('source');
  send({ t: 'lawat', r: src ? String(src).slice(0, 40) : ref });

  // WhatsApp buy links on the landing, launcher and promo pages. Only links to a number count:
  // a share link (wa.me/?text=..., like Robot Rumble's) lets the player pick a friend and is not a buyer.
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest && ev.target.closest('a[href*="wa.me/"]');
    if (a && /wa\.me\/\d/.test(a.getAttribute('href') || '')) send({ t: 'wa' }, true);
  }, true);

  if (game) {
    // "Played" = the child actually tapped or typed in the game, not just opened it
    let played = false, shown = Date.now(), secs = 0;
    const start = () => {
      if (played) return;
      played = true;
      send({ t: 'main' });
    };
    ['pointerdown', 'keydown', 'touchstart'].forEach((t) => window.addEventListener(t, start, { capture: true, passive: true }));
    const report = () => {
      if (shown) { secs += (Date.now() - shown) / 1000; shown = 0; }
      if (played && secs >= 3) { send({ t: 'tempoh', s: Math.round(secs) }, true); secs = 0; }
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') report(); else shown = Date.now();
    });
    window.addEventListener('pagehide', report);
    // Long sessions are reported every 5 minutes too, in case the tab is killed
    setInterval(() => { if (shown) { report(); shown = Date.now(); } }, 5 * 60e3);
  }

  window.addEventListener('online', () => flush());
})();
