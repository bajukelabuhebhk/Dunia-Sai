/*
 * Private feedback form ("Maklum balas") for every Dunia Sai game.
 *
 *   DSMaklumBalas.buka()                 opens the form for the game this page belongs to
 *   DSMaklumBalas.buka({ game: 'id' })   opens it for a chosen game (launcher /app/)
 *
 * Parents rate a game (1-5 stars) and may write a suggestion. It goes to /api/maklum-balas and only the
 * owner sees it, in the Pantau app. Nothing appears on the site, so there is no public comment wall.
 * A hold-for-3-seconds gate (same as Ruang Ibu Bapa) keeps small children from sending by accident.
 * Written while offline, it waits in localStorage (ds_mb_tunggu) and is sent when the internet is back.
 * Built in a shadow root so no game's CSS can change how it looks.
 */
(function () {
  if (window.DSMaklumBalas) return;
  const Q = 'ds_mb_tunggu';
  const store = (() => { try { return window.localStorage; } catch (e) { return null; } })();
  const m = /^\/app\/([a-z0-9-]+)\//.exec(location.pathname);
  const gameIni = m ? m[1] : null;
  const app = !!(navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Sending, with an offline queue ---------- */
  function tunggu() { try { return JSON.parse((store && store.getItem(Q)) || '[]'); } catch (e) { return []; } }
  function simpanTunggu(list) { try { if (store) list.length ? store.setItem(Q, JSON.stringify(list.slice(-10))) : store.removeItem(Q); } catch (e) { /* blocked */ } }

  async function hantarSatu(item) {
    const r = await fetch('/api/maklum-balas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
    if (r.ok || (r.status >= 400 && r.status < 500 && r.status !== 408)) {
      const b = await r.json().catch(() => ({}));
      return { hantar: true, ok: r.ok, ralat: b.ralat };
    }
    return { hantar: false };
  }
  let sibuk = false;
  async function hantarTunggu() {
    if (sibuk || navigator.onLine === false) return;
    const list = tunggu();
    if (!list.length) return;
    sibuk = true;
    try {
      const baki = [];
      for (const it of list) {
        try { if (!(await hantarSatu(it)).hantar) baki.push(it); } catch (e) { baki.push(it); }
      }
      simpanTunggu(baki);
    } finally { sibuk = false; }
  }
  window.addEventListener('online', hantarTunggu);
  setTimeout(hantarTunggu, 4000);

  /* ---------- Game names (config.js is loaded on the launcher, fetched on game pages) ---------- */
  function senaraiGame() {
    if (window.DS && DS.GAMES) return Promise.resolve(DS.GAMES);
    return new Promise((ok) => {
      const s = document.createElement('script');
      s.src = '/shared/js/config.js';
      s.onload = () => ok((window.DS && DS.GAMES) || []);
      s.onerror = () => ok([]);
      document.head.appendChild(s);
    });
  }

  /* ---------- The form ---------- */
  const CSS = `
  :host { all: initial; }
  * { box-sizing: border-box; }
  .lapik { position: fixed; inset: 0; z-index: 2147483600; background: rgb(20 26 36 / .55); display: flex; align-items: center; justify-content: center;
    padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom)); font: 16px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif; color: #23314a; }
  .kad { background: #fff8ec; width: 100%; max-width: 440px; max-height: 100%; overflow: auto; border-radius: 22px; padding: 20px 18px 18px; box-shadow: 0 18px 50px rgb(0 0 0 / .35); position: relative; }
  h2 { margin: 0 0 4px; padding: 0 34px; font-size: 1.2rem; text-align: center; }
  p { margin: 0; }
  .redup { color: #5f6b80; font-size: .9rem; }
  .tengah { text-align: center; }
  .tutup { position: absolute; top: 10px; right: 10px; border: 0; background: #f0e6d4; color: #23314a; width: 36px; height: 36px; border-radius: 50%; font-size: 18px; cursor: pointer; }
  button { font: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .tahan { position: relative; overflow: hidden; border: 0; background: #23314a; color: #fff; font-weight: 700; padding: 16px 30px; border-radius: 999px; margin: 18px auto 6px; display: block;
    user-select: none; -webkit-user-select: none; touch-action: none; }
  .tahan i { position: absolute; inset: 0; width: 0; background: #0f7a5c; }
  .tahan span { position: relative; }
  label.t { display: block; font-weight: 700; margin: 16px 0 6px; font-size: .95rem; }
  select, textarea { width: 100%; font: inherit; color: #23314a; background: #fff; border: 2px solid #ead9bd; border-radius: 12px; padding: 10px 12px; }
  textarea { min-height: 110px; resize: vertical; }
  select:focus, textarea:focus, button:focus-visible { outline: 3px solid #f2b13a; outline-offset: 1px; }
  .bintang { display: flex; justify-content: center; gap: 4px; margin-top: 4px; }
  .bintang button { border: 0; background: none; font-size: 40px; line-height: 1; padding: 4px; filter: grayscale(1); opacity: .35; transition: transform .1s; }
  .bintang button.on { filter: none; opacity: 1; }
  .bintang button:active { transform: scale(.9); }
  .makna { text-align: center; min-height: 1.4em; font-weight: 600; color: #0f7a5c; }
  .cip { display: flex; flex-wrap: wrap; gap: 6px; }
  .cip button { border: 2px solid #ead9bd; background: #fff; color: #23314a; padding: 6px 12px; border-radius: 999px; font-size: .9rem; }
  .cip button[aria-pressed="true"] { border-color: #0f7a5c; background: #e3f3ec; font-weight: 700; }
  .kira { text-align: right; font-size: .78rem; color: #5f6b80; margin-top: 2px; }
  .nota { background: #f0e6d4; border-radius: 12px; padding: 10px 12px; font-size: .84rem; color: #4b5568; margin-top: 14px; }
  .hantar { width: 100%; border: 0; background: #0f7a5c; color: #fff; font-weight: 700; padding: 14px; border-radius: 999px; margin-top: 16px; font-size: 1rem; }
  .hantar:disabled { opacity: .5; cursor: default; }
  .ralat { color: #c03a3f; font-weight: 600; text-align: center; margin-top: 10px; min-height: 1.2em; font-size: .9rem; }
  .sorok { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
  .besar { font-size: 56px; text-align: center; line-height: 1.2; }
  `;
  const MAKNA = ['', 'Tidak suka', 'Kurang suka', 'Boleh tahan', 'Suka', 'Sangat suka!'];
  const SIAPA = [['ibubapa', 'Ibu / bapa'], ['cikgu', 'Cikgu'], ['anak', 'Anak sendiri'], ['lain', 'Lain-lain']];

  let host = null, lepas = false;

  function tutup() {
    if (host) { host.remove(); host = null; }
    // Ruang Ibu Bapa may still be open underneath; it shows the tabs again when it closes
    if (!document.getElementById('dsr')) {
      const b = document.getElementById('ds-balik'), k = document.getElementById('ds-komen');
      if (b) b.style.visibility = '';
      if (k) k.style.visibility = '';
    }
    document.removeEventListener('keydown', kekunci, true);
  }
  function kekunci(e) { if (e.key === 'Escape') { e.stopPropagation(); tutup(); } }

  function bina(inner) {
    const root = host.shadowRoot;
    root.innerHTML = `<style>${CSS}</style><div class="lapik" part="lapik"><div class="kad" role="dialog" aria-modal="true" aria-labelledby="tj">
      <button type="button" class="tutup" aria-label="Tutup">✕</button>${inner}</div></div>`;
    root.querySelector('.tutup').onclick = tutup;
    root.querySelector('.lapik').addEventListener('click', (e) => { if (e.target.classList.contains('lapik')) tutup(); });
    // Keep taps inside the form from reaching the game underneath
    ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'keyup'].forEach((ev) => root.querySelector('.lapik').addEventListener(ev, (e) => e.stopPropagation()));
    return root;
  }

  function gate(pilihan) {
    const root = bina(`<div class="besar">👨‍👩‍👧</div><h2 id="tj">Untuk ibu bapa</h2>
      <p class="redup tengah">Beritahu kami pendapat anda tentang game ini. Tekan dan tahan butang di bawah selama 3 saat.</p>
      <button type="button" class="tahan"><i></i><span>Tahan di sini</span></button>`);
    const btn = root.querySelector('.tahan'), fill = btn.querySelector('i');
    let t0 = 0, raf = 0;
    const henti = () => { cancelAnimationFrame(raf); t0 = 0; fill.style.width = '0'; };
    const jalan = () => {
      const p = Math.min(1, (performance.now() - t0) / 3000);
      fill.style.width = p * 100 + '%';
      if (p >= 1) { lepas = true; borang(pilihan); return; }
      raf = requestAnimationFrame(jalan);
    };
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); t0 = performance.now(); raf = requestAnimationFrame(jalan); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, henti));
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  async function borang(pilihan) {
    const games = await senaraiGame();
    if (!host) return;
    let game = pilihan.game || gameIni || '';
    const satu = !!(pilihan.game || gameIni) && games.some((g) => g.id === game);
    let bintang = 0, siapa = 'ibubapa';
    const namaGame = (games.find((g) => g.id === game) || {}).name;
    const root = bina(`<h2 id="tj">💬 Maklum balas${satu && namaGame ? `: ${esc(namaGame)}` : ''}</h2>
      <p class="redup tengah">Hanya pembuat game akan baca. Ia tidak dipaparkan kepada orang lain.</p>
      <form novalidate>
        ${satu ? '' : `<label class="t" for="mbGame">Game</label><select id="mbGame" required><option value="">Pilih game</option>${games.map((g) => `<option value="${esc(g.id)}"${g.id === game ? ' selected' : ''}>${esc(g.name)}</option>`).join('')}</select>`}
        <label class="t" id="lbB">Berapa bintang?</label>
        <div class="bintang" role="radiogroup" aria-labelledby="lbB">${[1, 2, 3, 4, 5].map((n) => `<button type="button" role="radio" aria-checked="false" aria-label="${n} bintang, ${MAKNA[n]}" data-n="${n}">⭐</button>`).join('')}</div>
        <div class="makna" aria-live="polite"></div>
        <label class="t" for="mbTeks">Apa yang anak suka? Apa yang boleh ditambah baik? <span class="redup">(pilihan)</span></label>
        <textarea id="mbTeks" maxlength="600" placeholder="Contoh: Anak suka bahagian kapal. Harap ada lebih banyak soalan tahap susah."></textarea>
        <div class="kira">0 / 600</div>
        <label class="t" id="lbS">Siapa yang menulis?</label>
        <div class="cip" role="group" aria-labelledby="lbS">${SIAPA.map(([k, v]) => `<button type="button" data-s="${k}" aria-pressed="${k === siapa}">${v}</button>`).join('')}</div>
        <div class="sorok" aria-hidden="true"><label>Laman web <input name="laman" tabindex="-1" autocomplete="off"></label></div>
        <div class="nota">🔒 Tolong jangan tulis nama penuh anak, nombor telefon atau alamat. Untuk pertanyaan lesen atau bayaran, sila WhatsApp kami.</div>
        <button class="hantar" type="submit" disabled>Hantar maklum balas</button>
        <div class="ralat" role="alert"></div>
      </form>`);
    const f = root.querySelector('form'), teks = root.querySelector('#mbTeks'), btn = root.querySelector('.hantar'), ralat = root.querySelector('.ralat');
    const sel = root.querySelector('#mbGame');
    const sedia = () => { btn.disabled = !(bintang && game); };
    if (sel) sel.onchange = () => { game = sel.value; sedia(); };
    root.querySelectorAll('.bintang button').forEach((b) => b.onclick = () => {
      bintang = Number(b.dataset.n);
      root.querySelectorAll('.bintang button').forEach((x) => { const on = Number(x.dataset.n) <= bintang; x.classList.toggle('on', on); x.setAttribute('aria-checked', String(Number(x.dataset.n) === bintang)); });
      root.querySelector('.makna').textContent = MAKNA[bintang];
      sedia();
    });
    root.querySelectorAll('.cip button').forEach((b) => b.onclick = () => {
      siapa = b.dataset.s;
      root.querySelectorAll('.cip button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
    teks.oninput = () => { root.querySelector('.kira').textContent = `${teks.value.length} / 600`; };
    f.onsubmit = async (e) => {
      e.preventDefault();
      if (!bintang || !game) return;
      const item = { game, bintang, teks: teks.value.trim().slice(0, 600), siapa, app, ts: Date.now(), laman: f.laman.value };
      btn.disabled = true; ralat.textContent = '';
      let r;
      try { r = navigator.onLine === false ? { hantar: false } : await hantarSatu(item); } catch (er) { r = { hantar: false }; }
      if (!r.hantar) { simpanTunggu(tunggu().concat(item)); return terima(true); }
      if (!r.ok) { ralat.textContent = r.ralat || 'Maaf, tidak dapat dihantar. Cuba lagi.'; btn.disabled = false; return; }
      terima(false);
    };
    root.querySelector('.bintang button').focus();
  }

  function terima(offline) {
    const root = bina(`<div class="besar">💛</div><h2 id="tj">Terima kasih!</h2>
      <p class="redup tengah">${offline ? 'Tiada internet sekarang. Maklum balas anda disimpan dan akan dihantar sendiri bila internet ada.' : 'Maklum balas anda sudah sampai. Kami baca setiap satu untuk tambah baik game.'}</p>
      <button type="button" class="hantar">Kembali bermain</button>`);
    root.querySelector('.hantar').onclick = tutup;
    root.querySelector('.hantar').focus();
  }

  function buka(pilihan) {
    pilihan = pilihan || {};
    tutup();
    host = document.createElement('div');
    host.id = 'ds-maklum-balas';
    host.attachShadow({ mode: 'open' });
    document.body.appendChild(host);
    const b = document.getElementById('ds-balik'), k = document.getElementById('ds-komen');
    if (b) b.style.visibility = 'hidden';
    if (k) k.style.visibility = 'hidden';
    document.addEventListener('keydown', kekunci, true);
    if (lepas || pilihan.gate === false) borang(pilihan); else gate(pilihan);
  }

  window.DSMaklumBalas = { buka, tutup };
})();
