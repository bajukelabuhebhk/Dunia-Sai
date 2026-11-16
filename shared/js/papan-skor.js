/*
 * Dunia Sai: Papan Skor (score sheet) for families who share one phone or tablet.
 * Shown as a tab in /app/. Everything stays on this device; nothing is sent anywhere.
 *
 * Two kinds of score:
 * 1. Automatic: games with Ruang Ibu Bapa (shared/js/ruang-ibubapa.js) already save every session under the
 *    child picked in Dunia Sai (localStorage ds_ruang_<id>, Wonder Island wi_ruang_v1; record field `a`).
 *    This page only reads them. A new game that installs DSRuang shows up here by itself.
 * 2. Typed in: a quick round sheet ("Skor pertandingan") for any game, saved in localStorage ds_skor
 *    = { v:1, rounds:[{ t, g, s:{ name: score } }] }.
 * Choosing "Giliran siapa?" sets the active child (ds_anak), so the next game is recorded under that name.
 */
(function (global) {
  'use strict';
  const KEY = 'ds_skor';
  const MAX_ROUNDS = 300;
  const DAY = 86400000;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const NONAME = '(tanpa nama)';
  const RANGES = [['hari', 'Hari ini'], ['minggu', '7 hari'], ['semua', 'Semua']];

  let el = null, opt = {}, range = 'hari', tambah = false, gameSel = '';

  const ruangKey = (id) => (id === 'wonder-island' ? 'wi_ruang_v1' : 'ds_ruang_' + id);
  function readJSON(k) { try { return JSON.parse(global.localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function since() {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    if (range === 'hari') return d.getTime();
    if (range === 'minggu') return d.getTime() - 6 * DAY;
    return 0;
  }

  /* ---------- Automatic scores from the games ---------- */
  // { gameId: { name: { main, betul, saat } } } for the chosen time range
  function autoScores() {
    const from = since(), out = {};
    for (const g of global.DS.GAMES) {
      const d = readJSON(ruangKey(g.id));
      if (!d || !Array.isArray(d.ev)) continue;
      const box = {};
      for (const x of d.ev) {
        if (!x || !(x.r || x.x || x.d) || !(x.t >= from)) continue;
        const a = String(x.a || '').trim() || NONAME;
        const p = box[a] || (box[a] = { main: 0, betul: 0, saat: 0 });
        p.main++; p.betul += x.f || 0; p.saat += x.s || 0;
      }
      if (Object.keys(box).length) out[g.id] = box;
    }
    return out;
  }
  // Games that can record by themselves (they have Ruang Ibu Bapa data on this device, or are known to)
  const AUTO_IDS = ['kenal-jawi', 'nakhoda-jawi', 'wonder-island', 'robot-rumble', 'boss-gerai', 'ember-code'];

  /* ---------- Typed-in rounds ---------- */
  function rounds() { const d = readJSON(KEY); return d && Array.isArray(d.rounds) ? d.rounds : []; }
  function saveRounds(r) { try { global.localStorage.setItem(KEY, JSON.stringify({ v: 1, rounds: r.slice(-MAX_ROUNDS) })); } catch (e) { /* private mode */ } }

  /* ---------- Players ---------- */
  function players(auto) {
    const n = global.DSAnak.read().names.slice();
    for (const box of Object.values(auto)) for (const a of Object.keys(box)) if (a !== NONAME && !n.includes(a)) n.push(a);
    for (const r of rounds()) for (const a of Object.keys(r.s || {})) if (!n.includes(a)) n.push(a);
    return n;
  }
  const gameName = (id) => { const g = global.DS.GAMES.find((x) => x.id === id); return g ? g.name : id === 'lain' ? 'Permainan lain' : id; };
  const mins = (s) => { const m = Math.round(s / 60); return m < 1 && s > 0 ? '<1' : String(m); };
  // The best name(s) in a {name: number} map, only when someone actually scored and more than one played
  function best(map) {
    const e = Object.entries(map).filter(([, v]) => v > 0);
    if (e.length < 2) return [];
    const top = Math.max(...e.map(([, v]) => v));
    return e.filter(([, v]) => v === top).map(([k]) => k);
  }

  /* ---------- Drawing ---------- */
  function draw() {
    if (!el) return;
    const anak = global.DSAnak.read();
    const auto = autoScores();
    const names = players(auto);
    const cols = names.slice();
    if (Object.values(auto).some((b) => b[NONAME])) cols.push(NONAME);
    const total = {};
    cols.forEach((n) => { total[n] = { main: 0, betul: 0, saat: 0 }; });
    for (const box of Object.values(auto)) for (const [a, p] of Object.entries(box)) { const t = total[a]; if (t) { t.main += p.main; t.betul += p.betul; t.saat += p.saat; } }
    const gamesWith = global.DS.GAMES.filter((g) => auto[g.id]);
    const bila = { hari: 'hari ini', minggu: 'dalam 7 hari ini', semua: 'lagi' }[range];

    const giliran = `<div class="kotak sk-giliran">
      <h2>🎮 Giliran siapa sekarang?</h2>
      <p class="sk-kecil">Tekan nama sebelum main. Skor game akan masuk ke nama itu. <i lang="en">Whose turn is it?</i></p>
      <div class="sk-nama">
        ${names.map((n) => `<button type="button" class="${n === anak.active ? 'aktif' : ''}" data-sk-pilih="${esc(n)}" aria-pressed="${n === anak.active}">${n === anak.active ? '⭐ ' : ''}${esc(n)}</button>`).join('')}
        <button type="button" class="tambah" data-sk-tambah>＋ Tambah pemain</button>
      </div>
      <form data-sk-form ${tambah ? '' : 'hidden'}><label class="sr" for="skBaru">Nama pemain</label><input id="skBaru" maxlength="${global.DSAnak.MAX}" placeholder="Nama pemain" autocomplete="off"><button class="btn kecil">Tambah</button></form>
      ${anak.active ? `<p class="sk-sedia">Sekarang: <b>${esc(anak.active)}</b>. Pilih game di tab 🎮 Game dan mula main!</p>` : ''}
    </div>`;

    const masa = `<div class="sk-masa" role="group" aria-label="Tempoh">${RANGES.map(([k, l]) => `<button type="button" class="${range === k ? 'aktif' : ''}" data-sk-masa="${k}" aria-pressed="${range === k}">${l}</button>`).join('')}</div>`;

    const topBetul = best(Object.fromEntries(cols.map((n) => [n, total[n].betul])));
    const ringkas = cols.length ? `<div class="sk-pemain">${cols.map((n) => `<div class="sk-kad ${n === anak.active ? 'aktif' : ''}">
        <div class="sk-kad-nama">${topBetul.includes(n) ? '👑 ' : ''}${esc(n)}</div>
        <div class="sk-bintang">⭐ ${total[n].betul}</div>
        <div class="sk-kecil">jawapan betul</div>
        <div class="sk-kecil">🎮 ${total[n].main} main · ⏱ ${mins(total[n].saat)} min</div>
      </div>`).join('')}</div>` : '';

    const jadual = gamesWith.length ? `<div class="sk-skrol"><table class="sk-jadual">
        <thead><tr><th scope="col">Game</th>${cols.map((n) => `<th scope="col">${esc(n)}</th>`).join('')}</tr></thead>
        <tbody>${gamesWith.map((g) => {
          const box = auto[g.id];
          const top = best(Object.fromEntries(cols.map((n) => [n, box[n] ? box[n].betul : 0])));
          return `<tr><th scope="row">${esc(g.name)}</th>${cols.map((n) => {
            const p = box[n];
            return p ? `<td class="${top.includes(n) ? 'atas' : ''}"><b>${top.includes(n) ? '👑 ' : ''}⭐ ${p.betul}</b><small>${p.main} main · ${mins(p.saat)} min</small></td>` : '<td class="kosong">–</td>';
          }).join('')}</tr>`;
        }).join('')}</tbody></table></div>`
      : `<p class="sk-nota">Belum ada skor ${bila}. Pilih nama di atas, kemudian main ${AUTO_IDS.map(gameName).join(', ')}. Skor akan keluar di sini.</p>`;

    const auto_ = `<div class="kotak">
      <h2>🏆 Papan skor <span class="sk-en" lang="en">Score sheet</span></h2>
      ${masa}
      ${ringkas}
      ${jadual}
      <p class="sk-kecil" style="margin-top:10px">⭐ = soalan dijawab betul pada cubaan pertama. Skor direkod sendiri oleh ${AUTO_IDS.map(gameName).join(', ')}. Untuk game lain, guna <b>Skor pertandingan</b> di bawah.</p>
    </div>`;

    const R = rounds();
    const pilihan = global.DS.GAMES.map((g) => `<option value="${esc(g.id)}" ${gameSel === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('') + `<option value="lain" ${gameSel === 'lain' ? 'selected' : ''}>Permainan lain</option>`;
    const sejarah = R.slice(-8).reverse().map((r) => {
      const top = best(r.s || {}), d = new Date(r.t);
      return `<li><div><b>${esc(gameName(r.g))}</b> <small>${d.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })} ${d.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}</small></div>
        <div class="sk-pusingan">${Object.entries(r.s || {}).map(([n, v]) => `<span class="${top.includes(n) ? 'atas' : ''}">${top.includes(n) ? '👑 ' : ''}${esc(n)} <b>${v}</b></span>`).join('')}</div></li>`;
    }).join('');
    const manual = `<div class="kotak">
      <h2>✍️ Skor pertandingan <span class="sk-en" lang="en">Match scores</span></h2>
      <p class="sk-kecil">Main bergilir-gilir, kemudian tulis skor setiap pemain (contoh: bintang, mata atau duit yang dikumpul).</p>
      ${names.length ? `<form data-sk-pusingan>
        <label for="skGame" class="sk-label">Game</label>
        <select id="skGame">${pilihan}</select>
        <div class="sk-isi">${names.map((n, i) => `<label for="skN${i}"><span>${esc(n)}</span><input id="skN${i}" data-sk-nama="${esc(n)}" type="number" inputmode="numeric" min="0" max="999999" placeholder="0"></label>`).join('')}</div>
        <button class="btn kecil">💾 Simpan skor</button>
        <span class="sk-mesej" role="status" aria-live="polite"></span>
      </form>` : '<p class="sk-nota">Tambah nama pemain di atas dahulu.</p>'}
      ${R.length ? `<h3 style="margin-top:16px">Pusingan terkini</h3><ul class="sk-sejarah">${sejarah}</ul>
        <button type="button" class="sk-padam" data-sk-padam>🗑 Padam semua skor pertandingan</button>` : ''}
    </div>`;

    el.innerHTML = giliran + auto_ + manual + `<p class="sk-privasi">🔐 Semua skor disimpan dalam peranti ini sahaja. Tiada akaun dan tiada data dihantar keluar.</p>`;
  }

  /* ---------- Events ---------- */
  function onClick(e) {
    const b = e.target.closest('button');
    if (!b || !el.contains(b)) return;
    if (b.dataset.skPilih) { global.DSAnak.choose(b.dataset.skPilih); draw(); if (opt.onPilih) opt.onPilih(); }
    else if ('skTambah' in b.dataset) { tambah = true; draw(); const i = el.querySelector('#skBaru'); if (i) i.focus(); }
    else if (b.dataset.skMasa) { range = b.dataset.skMasa; draw(); }
    else if ('skPadam' in b.dataset) { if (global.confirm('Padam semua skor pertandingan? Skor dalam game tidak terjejas.')) { saveRounds([]); draw(); } }
  }
  function onSubmit(e) {
    e.preventDefault();
    const f = e.target;
    if (f.matches('[data-sk-form]')) {
      const v = f.querySelector('#skBaru').value;
      if (v.trim()) { global.DSAnak.add(v); tambah = false; draw(); if (opt.onPilih) opt.onPilih(); }
      return;
    }
    if (f.matches('[data-sk-pusingan]')) {
      const s = {};
      f.querySelectorAll('[data-sk-nama]').forEach((i) => {
        if (i.value === '') return;
        const n = Math.max(0, Math.min(999999, Math.round(Number(i.value))));
        if (Number.isFinite(n)) s[i.dataset.skNama] = n;
      });
      const m = f.querySelector('.sk-mesej');
      if (!Object.keys(s).length) { m.textContent = 'Tulis skor sekurang-kurangnya seorang pemain.'; return; }
      gameSel = f.querySelector('#skGame').value;
      const r = rounds(); r.push({ t: Date.now(), g: gameSel, s }); saveRounds(r);
      draw();
      const m2 = el.querySelector('.sk-mesej'); if (m2) m2.textContent = '✅ Skor disimpan!';
    }
  }
  function onChange(e) { if (e.target.id === 'skGame') gameSel = e.target.value; }

  function css() {
    if (document.getElementById('skCss')) return;
    const st = document.createElement('style'); st.id = 'skCss';
    st.textContent = `
#paneSkor { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; }
#paneSkor > * { min-width: 0; }
#paneSkor h2 { font-size: 1.25rem; }
.sk-en { font-size: .8rem; font-weight: 600; color: var(--muted); }
.sk-kecil { margin: 0; color: var(--muted); font-size: .9rem; }
.sk-nama, .sk-masa { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.sk-nama button { min-height: 52px; padding: 8px 18px; border-radius: 16px; border: 2px solid var(--garis); background: #fff; color: var(--ink); font: 800 1.05rem var(--font); cursor: pointer; }
.sk-nama button.aktif { background: var(--hijau); border-color: var(--hijau); color: #fff; box-shadow: 0 3px 0 var(--hijau-gelap); }
.sk-nama button.tambah { border-style: dashed; color: var(--hijau); font-size: .95rem; }
.sk-giliran form { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.sk-giliran form[hidden] { display: none; }
#paneSkor input, #paneSkor select { min-height: 44px; padding: 8px 12px; border: 2px solid var(--garis); border-radius: 12px; font: 600 1rem var(--font); color: var(--ink); background: #fff; }
#paneSkor input:focus, #paneSkor select:focus { outline: 3px solid var(--kuning); border-color: transparent; }
.sk-giliran input { flex: 1 1 160px; }
.sk-sedia { margin: 10px 0 0; padding: 8px 12px; border-radius: 12px; background: #dcf5ea; color: var(--hijau-gelap); font-size: .93rem; }
.sk-masa { margin: 4px 0 12px; }
.sk-masa button { min-height: 38px; padding: 6px 14px; border-radius: 999px; border: 2px solid var(--garis); background: #fff; color: var(--ink); font: 700 .92rem var(--font); cursor: pointer; }
.sk-masa button.aktif { background: var(--kuning); border-color: var(--kuning); }
.sk-pemain { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 140px), 1fr)); gap: 10px; margin-bottom: 12px; }
.sk-kad { border: 2px solid var(--garis); border-radius: 16px; padding: 10px 12px; text-align: center; background: #fffdf8; }
.sk-kad.aktif { border-color: var(--hijau); }
.sk-kad-nama { font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sk-bintang { font-size: 1.7rem; font-weight: 900; color: var(--hijau); line-height: 1.2; }
.sk-skrol { overflow-x: auto; -webkit-overflow-scrolling: touch; border: 1px solid var(--garis); border-radius: 14px; }
.sk-jadual { border-collapse: collapse; width: 100%; font-size: .93rem; }
.sk-jadual th, .sk-jadual td { padding: 8px 10px; border-bottom: 1px solid var(--garis); text-align: center; vertical-align: top; }
.sk-jadual tr:last-child > * { border-bottom: 0; }
.sk-jadual thead th { background: var(--kuning-muda); font-weight: 800; white-space: nowrap; }
.sk-jadual tbody th { text-align: left; font-weight: 700; min-width: 110px; }
.sk-jadual td b { display: block; white-space: nowrap; }
.sk-jadual td small { color: var(--muted); white-space: nowrap; }
.sk-jadual td.atas { background: #dcf5ea; }
.sk-jadual td.kosong { color: var(--muted); }
.sk-nota { margin: 0; padding: 10px 12px; border-radius: 12px; background: #eef0f4; font-size: .93rem; }
.sk-label { display: block; font-weight: 700; margin: 10px 0 4px; }
#skGame { width: 100%; max-width: 360px; }
.sk-isi { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 150px), 1fr)); gap: 10px; margin: 12px 0; }
.sk-isi label { display: grid; gap: 4px; font-weight: 700; }
.sk-isi label span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sk-isi input { width: 100%; font-size: 1.2rem; text-align: center; }
.sk-mesej { margin-left: 8px; font-weight: 700; color: var(--hijau-gelap); }
.sk-sejarah { list-style: none; margin: 0; padding: 0; }
.sk-sejarah li { padding: 8px 0; border-bottom: 1px dashed var(--garis); }
.sk-sejarah li:last-child { border-bottom: 0; }
.sk-sejarah small { color: var(--muted); }
.sk-pusingan { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.sk-pusingan span { padding: 3px 10px; border-radius: 999px; background: #eef0f4; font-size: .9rem; }
.sk-pusingan span.atas { background: #dcf5ea; color: var(--hijau-gelap); }
.sk-padam { margin-top: 10px; border: 0; background: none; color: #b4232a; font: 600 .88rem var(--font); cursor: pointer; text-decoration: underline; padding: 4px 0; }
.sk-privasi { margin: 0; padding: 10px 14px; border-radius: 14px; background: #eaf3fb; color: #3b5068; font-size: .88rem; }`;
    document.head.append(st);
  }

  function pasang(node, o) {
    el = node; opt = o || {};
    css();
    el.addEventListener('click', onClick);
    el.addEventListener('submit', onSubmit);
    el.addEventListener('change', onChange);
    draw();
  }

  global.DSSkor = { pasang, draw };
})(typeof window !== 'undefined' ? window : globalThis);
