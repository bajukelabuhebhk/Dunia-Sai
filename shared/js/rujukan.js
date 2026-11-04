/*
 * Affiliate (promoter) referral codes.
 *
 * A promoter shares a link like https://dunia-sai.pages.dev/?ref=AINA. This page remembers the code
 * for 30 days (the last promoter's link wins) and adds "Kod rujukan: AINA" to every WhatsApp buy
 * message, so the owner sees in the chat who brought the buyer. The licence system is not touched.
 *
 * Works on the landing, launcher and promo pages (DS.waLink) and inside games (wa.me links and
 * window.open are rewritten as they are used). Load it right after config.js on pages that use
 * DS.waLink. Share links without a number (wa.me/?text=...) are left alone: those are a player
 * sharing with a friend, not a buyer.
 */
(function () {
  if (window.DSRujukan) return;
  const KEY = 'ds_rujukan';
  const HARI = 30;
  const store = (() => { try { return window.localStorage; } catch (e) { return null; } })();
  const sah = (k) => (typeof k === 'string' && /^[A-Z0-9]{2,12}$/.test(k) ? k : null);

  // A new ?ref= in the address always replaces the remembered code
  let baru = null;
  try {
    const p = new URLSearchParams(location.search);
    baru = sah(String(p.get('ref') || '').trim().toUpperCase());
    if (baru && store) store.setItem(KEY, JSON.stringify({ k: baru, ts: Date.now() }));
  } catch (e) { /* storage blocked */ }

  function kod() {
    try {
      const s = JSON.parse((store && store.getItem(KEY)) || 'null');
      if (s && sah(s.k) && Date.now() - s.ts < HARI * 864e5) return s.k;
    } catch (e) { /* bad value */ }
    return baru;
  }

  const LABEL = 'Kod rujukan: ';
  // Adds the code to a wa.me/<number> link's message. Any other URL comes back unchanged.
  function tambah(url) {
    const k = kod();
    if (!k || typeof url !== 'string' || !/wa\.me\/\d/.test(url)) return url;
    try {
      // Built by hand with encodeURIComponent: URLSearchParams would turn spaces into "+"
      const u = new URL(url, location.href);
      const t = u.searchParams.get('text') || '';
      if (t.includes(LABEL)) return url;
      const rest = [...u.searchParams].filter(([n]) => n !== 'text')
        .map(([n, v]) => `&${encodeURIComponent(n)}=${encodeURIComponent(v)}`).join('');
      return `${u.origin}${u.pathname}?text=${encodeURIComponent((t ? t + '\n\n' : '') + LABEL + k)}${rest}${u.hash}`;
    } catch (e) { return url; }
  }

  window.DSRujukan = { kod, tambah, baru: () => baru };

  // Pages that build their buy links with DS.waLink
  if (window.DS && typeof DS.waLink === 'function' && !DS.waLink.__ref) {
    const asal = DS.waLink;
    DS.waLink = function (text) { return tambah(asal(text)); };
    DS.waLink.__ref = true;
  }

  // Links in games and pages: fix the address just before the tap opens it
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest && ev.target.closest('a[href*="wa.me/"]');
    if (a) { const h = tambah(a.href); if (h !== a.href) a.href = h; }
  }, true);

  // Games that open WhatsApp with window.open
  const buka = window.open;
  if (typeof buka === 'function') window.open = function (url, ...rest) { return buka.call(this, tambah(url), ...rest); };
})();
