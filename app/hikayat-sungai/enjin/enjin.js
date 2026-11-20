/* Hikayat Sungai Ilmu: enjin bersama untuk peta besar (Fasa 1, Nov 2026).
   Satu peta = satu fail HTML. Setiap fail muat enjin/enjin.css, enjin/lesen.js dan fail ini,
   kemudian panggil HS.mula({...}) dengan data petanya (petak, watak, misi, cerita).
   Simpanan dikongsi dengan Bandar 1 (index.html) melalui kunci localStorage 'hikayat-sungai-3':
   XP, bintang, watak wira dan bendera Bandar 1 kekal di tempat asal; data peta besar di st.dunia. */
(() => {
  'use strict';
  const HS = window.HS = {};
  const $ = id => document.getElementById(id);
  const L = (ms, en) => ({ ms, en });
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = ms => new Promise(r => setTimeout(r, reduce ? Math.min(ms, 120) : ms));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  let lang = 'ms'; try { lang = sessionStorage.getItem('hs-lang') || 'ms'; } catch {}
  const tx = o => (o && typeof o === 'object') ? (o[lang] ?? o.ms) : o;
  const isMs = () => lang === 'ms';

  // ===================== mod uji (pratonton sahaja) =====================
  // Pada pautan pratonton (*.dunia-sai.pages.dev) dan komputer sendiri, Afiq boleh buka semua peta tanpa lesen.
  // Laman live (dunia-sai.pages.dev) tidak pernah ada mod ini.
  const UJI_HOST = /\.dunia-sai\.pages\.dev$/.test(location.hostname) || ['localhost', '127.0.0.1', ''].includes(location.hostname);
  try { if (UJI_HOST && /[?&]uji=1/.test(location.search)) sessionStorage.setItem('hs-uji', '1'); } catch {}
  const uji = () => { try { return UJI_HOST && sessionStorage.getItem('hs-uji') === '1'; } catch { return false; } };
  HS.UJI_HOST = UJI_HOST; HS.uji = uji;
  HS.setUji = on => { try { on ? sessionStorage.setItem('hs-uji', '1') : sessionStorage.removeItem('hs-uji'); } catch {} };

  // ===================== simpanan =====================
  const SAVE = 'hikayat-sungai-3';
  const load = () => { try { return JSON.parse(localStorage.getItem(SAVE) || '{}') || {}; } catch { return {}; } };
  let st = Object.assign({ xp: 0, stars: 0, f: {}, raft: [], gone: [], chests: [], arcade: {}, items: [] }, load());
  st.f = st.f || {};
  const D = st.dunia = Object.assign({ at: null, from: null, visited: [], mutiara: [], f: {}, gone: [], pos: {} }, st.dunia || {});
  const save = () => { try { const now = load(); localStorage.setItem(SAVE, JSON.stringify(Object.assign(now, st))); } catch {} };
  const level = () => 1 + Math.floor(st.xp / 100);
  const maxH = () => Math.min(5, 2 + level());
  let hearts = maxH();
  // Mutiara Sungai: no. 1 ialah dari Sang Buaya di Bandar 1
  const mutiaraOf = () => { const m = new Set(D.mutiara); if (st.f.buaya) m.add(1); return [...m].sort(); };
  HS.st = () => st; HS.D = D; HS.save = save; HS.mutiara = mutiaraOf;

  // ===================== lesen =====================
  const PRODUCT = 4, PUBLIC_KEYS = { 2: 'QVgEegZrfviPeApvWbbbkzk3xI6ZKX0zKd2wEfy9pS0=' }, BLOCKED = [];
  let full = false;
  try {
    const s = localStorage.getItem('hikayat_licence');
    if (s) { const b = KJL2.find(s); const r = b ? KJL2.verify(b, PRODUCT, PUBLIC_KEYS, BLOCKED, nacl) : KJL.verify(s, PRODUCT, PUBLIC_KEYS, BLOCKED, nacl); full = !!(r && r.ok); }
  } catch {}
  if (uji()) full = true;
  HS.full = () => full;

  // ===================== bunyi =====================
  let actx = null, muted = false; try { muted = sessionStorage.getItem('hs-mute') === '1'; } catch {}
  function tone(f, d, type = 'sine', vol = 0.08, when = 0, slide = 0) {
    if (muted) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = actx.currentTime + when, o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + d);
      g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + d + 0.02);
    } catch {}
  }
  const SFX = HS.SFX = {
    talk: () => tone(660, 0.04, 'square', 0.025),
    pick: () => { tone(660, 0.08, 'triangle'); tone(990, 0.12, 'triangle', 0.08, 0.07); },
    good: () => { tone(523, 0.1, 'triangle'); tone(784, 0.16, 'triangle', 0.08, 0.08); },
    bad: () => tone(180, 0.3, 'sawtooth', 0.05, 0, 90),
    hit: () => tone(300, 0.15, 'square', 0.06, 0, 80),
    splash: () => tone(900, 0.25, 'sine', 0.05, 0, 200),
    win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'triangle', 0.08, i * 0.1)),
    step: () => tone(120, 0.03, 'sine', 0.02),
    warp: () => { tone(880, 0.5, 'sine', 0.05, 0, 220); tone(440, 0.6, 'triangle', 0.04, 0.1, 110); },
    zap: () => { tone(1200, 0.08, 'square', 0.04); tone(1800, 0.12, 'square', 0.03, 0.06); },
    clunk: () => { tone(140, 0.2, 'square', 0.06, 0, 70); tone(90, 0.3, 'triangle', 0.06, 0.08); },
  };

  // Muzik latar: gelung chiptune asli (sama gaya dengan Bandar 1), ditambah 'town' dan 'fog'.
  const MUSIC = (() => {
    const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
    const hz = n => { const m = /^([A-G][b#]?)(\d)$/.exec(n); return 440 * Math.pow(2, (NOTE[m[1]] + (+m[2] + 1) * 12 - 69) / 12); };
    const CH = { F: ['F', 'A', 'C'], Dm: ['D', 'F', 'A'], Bb: ['Bb', 'D', 'F'], C: ['C', 'E', 'G'], Am: ['A', 'C', 'E'], G: ['G', 'B', 'D'], Em: ['E', 'G', 'B'], A: ['A', 'C#', 'E'], D: ['D', 'F#', 'A'], Bm: ['B', 'D', 'F#'], E: ['E', 'G#', 'B'] };
    const T = {
      field: { bpm: 84, lead: 0.05, echo: 0.18, chords: 'F Dm Bb C F Am Bb C Dm Bb F C Bb C F F',
        mel: 'A4 - C5 - F5 - E5 D5 | D5 - - C5 A4 - - . | Bb4 - D5 - F5 - D5 C5 | C5 - - - G4 - - . | A4 - C5 - F5 - G5 A5 | E5 - - D5 C5 - A4 . | D5 - C5 Bb4 A4 - G4 - | G4 - - - - - . . | F5 - E5 - D5 - A4 - | Bb4 - C5 D5 F5 - - . | A5 - G5 F5 E5 - C5 - | D5 - - E5 C5 - - . | D5 - F5 - Bb5 - A5 G5 | G5 - - F5 E5 - D5 E5 | F5 - - - C5 - A4 - | F4 - - - - - . .' },
      cave: { bpm: 66, lead: 0.04, echo: 0.38, chords: 'Am F G Em Am F G Am',
        mel: 'E5 - - - . . . . | C5 - - - A4 - - - | D5 - - - B4 - G4 - | E4 - - - - - - . | A4 - C5 - E5 - - - | F5 - E5 - C5 - - - | D5 - - B4 G4 - - - | A4 - - - - - - .' },
      battle: { bpm: 126, lead: 0.045, echo: 0.12, pump: true, chords: 'Dm Dm Bb C Dm Dm Bb A',
        mel: 'D5 . D5 F5 A5 - G5 F5 | E5 - F5 - D5 - - . | D5 - F5 - Bb5 - A5 G5 | G5 - E5 - C5 - - . | D5 . D5 F5 A5 - C6 Bb5 | A5 - G5 - F5 - E5 - | F5 - D5 - Bb4 - D5 F5 | E5 - - - C#5 - - .' },
      town: { bpm: 96, lead: 0.045, echo: 0.16, chords: 'D Bm G A D Bm G A',
        mel: 'F#5 - A5 - D6 - A5 F#5 | D5 - - E5 F#5 - - . | G5 - F#5 - E5 - D5 - | E5 - - - A4 - - . | F#5 - A5 - B5 - A5 F#5 | G5 - - F#5 E5 - D5 . | E5 - F#5 E5 D5 - C#5 - | D5 - - - - - . .' },
      fog: { bpm: 60, lead: 0.035, echo: 0.45, chords: 'Em C Am Bm Em C D Em',
        mel: 'B4 - - - E5 - - - | G5 - - - . . . . | A4 - - - C5 - E5 - | F#5 - - - - - . . | B4 - - - G5 - F#5 - | E5 - - - C5 - - - | D5 - - - F#5 - A5 - | G5 - - - E5 - - .' },
    };
    for (const k in T) { const t = T[k]; t.c = t.chords.split(' '); t.m = t.mel.replace(/\|/g, ' ').trim().split(/\s+/); }
    let ctx = null, out = null, wet = null, cur = null, step = 0, next = 0, timer = null;
    function init() {
      if (ctx) return true;
      try { ctx = actx = actx || new (window.AudioContext || window.webkitAudioContext)(); } catch { return false; }
      out = ctx.createGain(); out.gain.value = 0; out.connect(ctx.destination);
      const d = ctx.createDelay(1); d.delayTime.value = 0.32; const fb = ctx.createGain(); fb.gain.value = 0.3; wet = ctx.createGain(); wet.gain.value = 0.2;
      wet.connect(d); d.connect(fb); fb.connect(d); d.connect(out); return true;
    }
    function note(type, f, t0, dur, vol, cut, echo) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      let n = o; if (cut) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut; o.connect(lp); n = lp; }
      n.connect(g); g.connect(out); if (echo) g.connect(wet); o.start(t0); o.stop(t0 + dur + 0.05);
    }
    function tick() {
      if (!cur) return; const t = T[cur], e = 60 / t.bpm / 2;
      while (next < ctx.currentTime + 0.25) {
        const i = step % t.m.length, bar = Math.floor(i / 8), pos = i % 8, ch = CH[t.c[bar % t.c.length]];
        const m = t.m[i];
        if (m !== '-' && m !== '.') { let len = 1; while (t.m[(i + len) % t.m.length] === '-' && len < 8) len++; note('square', hz(m), next, e * len * 0.95, t.lead, 1800, true); }
        const arp = [0, 1, 2, 1, 0, 1, 2, 1][pos], oct = pos >= 2 && pos <= 4 && arp === 2 ? 5 : 4;
        note('triangle', hz(ch[arp] + oct), next, e * 1.6, 0.03, 0, true);
        if (t.pump || pos % 4 === 0) note('triangle', hz(ch[0] + (t.pump && pos % 2 ? 3 : 2)), next, e * (t.pump ? 0.9 : 3.5), 0.07, 0, false);
        next += e; step++;
      }
    }
    function play(name) {
      if (name === cur) return; if (!init()) return;
      const n0 = ctx.currentTime; out.gain.cancelScheduledValues(n0); out.gain.setValueAtTime(out.gain.value, n0); out.gain.linearRampToValueAtTime(0, n0 + 0.4);
      setTimeout(() => { cur = name; step = 0; next = ctx.currentTime + 0.05; if (!name) return; wet.gain.value = T[name].echo;
        out.gain.setValueAtTime(0, ctx.currentTime); out.gain.linearRampToValueAtTime(muted ? 0 : 1, ctx.currentTime + 1.2); }, 450);
      if (!timer) timer = setInterval(() => { if (ctx && ctx.state === 'suspended') ctx.resume(); tick(); }, 60);
    }
    function setMuted(m) { if (!ctx) return; out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setValueAtTime(m ? 0 : 1, ctx.currentTime); }
    function fadeOut() { if (!ctx) return; out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setValueAtTime(out.gain.value, ctx.currentTime); out.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5); }
    return { play, setMuted, fadeOut };
  })();
  let musicOn = false, musicBattle = false;

  // ===================== watak =====================
  const HSW = {};
  const wLoad = k => { if (HSW[k]) return HSW[k]; const i = new Image(); i.decoding = 'async'; i.src = 'watak/' + k + '.webp'; HSW[k] = i; return i; };
  const hswOk = k => !!(HSW[k] && HSW[k].complete && HSW[k].naturalWidth);
  const wImg = (k, cls = '') => `<img class="hsw ${cls}" src="watak/${k}.webp" alt="">`;
  function drawHsw(c, k, x, feetY, h, flip) {
    const im = HSW[k], w = h * im.naturalWidth / im.naturalHeight;
    c.save(); c.translate(x, feetY); if (flip) c.scale(-1, 1); c.drawImage(im, -w / 2, -h, w, h); c.restore();
  }
  const heroKey = () => st.av && st.av.g === 'g' ? 'adik-p' : 'adik-l';
  ['adik-l', 'adik-p', 'kancil'].forEach(wLoad);
  const WHO = {
    narr: { face: '📜', name: L('Pencerita', 'Narrator') },
    kancil: { face: wImg('kancil'), name: L('Sang Kancil', 'Sang Kancil') },
    adik: { face: wImg(heroKey()), name: st.av && st.av.name ? L(st.av.name, st.av.name) : L('Adik Saintis', 'Little Scientist') },
    sign: { face: '🪧', name: L('Papan tanda', 'Signpost') },
    peti: { face: '🎁', name: L('Peti harta', 'Treasure chest') },
  };
  HS.WHO = WHO; HS.wImg = wImg; HS.L = L; HS.tx = tx; HS.esc = esc; HS.lang = () => lang; HS.wait = wait; HS.shuffle = shuffle;
  const S = (who, ms, en) => ({ who, text: L(ms, en) });
  HS.S = S;

  // ===================== susun atur halaman =====================
  function buildDom() {
    document.body.insertAdjacentHTML('afterbegin', `
<div class="wrap">
  <div class="hud">
    <span class="title"><span class="brand-emoji" id="hsBrand">🦌</span><span>Hikayat <strong>Sungai Ilmu</strong><small id="hsPlace">SCIENCE ADVENTURE</small></span></span>
    <span class="chip" id="hearts"></span>
    <span class="chip"><span id="lvl"></span><span class="xpbar"><i id="xp"></i></span></span>
    <span class="chip" id="stars"></span>
    <span class="chip mut-chip" id="mut"></span>
    <button class="icon-btn arcade-head" id="petaBtn" type="button">🗺️ <span id="petaLabel">Peta Wilayah</span></button>
    <button class="icon-btn" id="mute" type="button" aria-label="Sound">🔊</button>
    <button class="icon-btn" id="lang" type="button">EN</button>
  </div>
  <div class="quest" id="quest"></div>
  <div class="stage" id="stage">
    <canvas id="world" aria-label="Game world"></canvas>
    <div class="touch-tip" id="touchTip" aria-live="off">👆 Ketuk atau leret pada peta</div>
    <div class="swipe-ring" id="swipeRing" hidden aria-hidden="true"><span class="swipe-thumb" id="swipeThumb">➜</span></div>
    <button class="touch-action" id="touchAction" type="button" hidden>🗣️ Berbual</button>
    <div class="overlay" id="ov" hidden></div>
  </div>
  <div class="below" id="below" hidden></div>
  <div class="controls touch-controls" id="controls">
    <div class="touch-guide-heading"><span class="touch-guide-icon">👆</span><div><strong id="touchGuideTitle"></strong><p id="touchGuideText"></p></div></div>
    <div class="touch-guide-chips"><span id="touchGuideTap"></span><span id="touchGuideSwipe"></span><span id="touchGuideAct"></span></div>
    <p class="keyboard-guide" id="keyboardGuide"></p>
  </div>
</div>
<div class="muat" id="muat"><div class="muat-card"><div class="muat-art" id="muatArt">🗺️</div><div class="muat-eyebrow" id="muatEye"></div><h2 id="muatName"></h2><p class="muat-sub" id="muatSub"></p>
  <div class="muat-bar"><i id="muatBar"></i></div><p class="muat-tip" id="muatTip"></p><div class="muat-go" id="muatGo"></div></div></div>`);
  }

  // ===================== keadaan peta =====================
  const TS = 16; let COLS = 0, ROWS = 0, VW = 12, VH = 9;
  let cfg = null, map = [], ENT = [], POOLS = {}, FOES = {};
  const P = { x: 0, y: 0, px: 0, py: 0, from: null, t: 0, moving: false, face: 1 };
  let mode = 'load', held = null, path = [], afterPath = null, now = 0, shakeT = 0, invulnUntil = 0;
  const particles = [];
  const tileAt = (x, y) => (x < 0 || y < 0 || x >= COLS || y >= ROWS) ? 'T' : map[y][x];
  const goneSet = () => new Set(D.gone);
  const alive = e => !(e.hidden && e.hidden()) && !D.gone.includes(cfg.id + ':' + e.id);
  const entAt = (x, y) => ENT.find(e => alive(e) && e.x === x && e.y === y);
  const SOLID = new Set(['T', 'P', '~', 'H', 'R', 'r', 'k', 'F', 'W']);
  const solidTile = c => SOLID.has(c);
  function passable(x, y) { if (solidTile(tileAt(x, y))) return false; const e = entAt(x, y); return !(e && e.solid); }
  HS.tileAt = tileAt; HS.setTile = (x, y, c) => { if (map[y]) map[y][x] = c; };
  HS.ent = id => ENT.find(e => e.id === id);
  HS.P = P;
  HS.buang = id => { const k = cfg.id + ':' + id; if (!D.gone.includes(k)) D.gone.push(k); save(); };
  HS.ada = id => { const e = HS.ent(id); return !!e && alive(e); };
  HS.f = (k, v) => { const key = cfg.id + ':' + k; if (v === undefined) return D.f[key]; D.f[key] = v; save(); hud(); return v; };
  HS.fOf = (map_, k) => D.f[map_ + ':' + k];

  // ===================== input =====================
  function tryMove(dx, dy) {
    if (dx) P.face = dx;
    const nx = P.x + dx, ny = P.y + dy;
    if (cfg.tolak) { const r = cfg.tolak(nx, ny, dx, dy); if (r === true) { P.from = [P.x, P.y]; P.x = nx; P.y = ny; P.t = 0; P.moving = true; return true; } if (r === false) return false; }
    if (!passable(nx, ny)) { const e = entAt(nx, ny); if (e && !path.length) interact(e); return false; }
    P.from = [P.x, P.y]; P.x = nx; P.y = ny; P.t = 0; P.moving = true;
    return true;
  }
  function bfs(tx_, ty_) {
    const key = (x, y) => y * COLS + x, prev = new Map([[key(P.x, P.y), null]]), q = [[P.x, P.y]];
    while (q.length) {
      const [x, y] = q.shift();
      if (x === tx_ && y === ty_) { const out = []; let k = key(x, y); while (prev.get(k) !== null) { out.unshift([k % COLS, Math.floor(k / COLS)]); k = prev.get(k); } return out; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = key(nx, ny);
        if (prev.has(k) || !passable(nx, ny)) continue;
        if (cfg.elak && cfg.elak(nx, ny) && !(nx === tx_ && ny === ty_)) continue;   // tap-to-walk avoids warp tiles unless tapped
        const it = entAt(nx, ny); if (it && (it.kind === 'item' || it.kind === 'exit') && !(nx === tx_ && ny === ty_)) continue;
        prev.set(k, key(x, y)); q.push([nx, ny]);
      }
    }
    return null;
  }
  function walkTo(tx_, ty_) {
    const e = entAt(tx_, ty_);
    if (e && e.solid) {
      if (Math.abs(e.x - P.x) + Math.abs(e.y - P.y) === 1) return interact(e);
      let best = null;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const p = bfs(e.x + dx, e.y + dy); if (p && (!best || p.length < best.length)) best = p; }
      if (best) { path = best; afterPath = e; }
      return;
    }
    const p = bfs(tx_, ty_); if (p) { path = p; afterPath = null; }
  }
  function nearby() {
    const fx = P.x + P.face, cand = [[fx, P.y], [P.x, P.y - 1], [P.x, P.y + 1], [P.x - 1, P.y], [P.x + 1, P.y]];
    for (const [x, y] of cand) { const e = entAt(x, y); if (e && e.solid) return e; }
    return null;
  }
  async function onEnter() {
    const e = entAt(P.x, P.y);
    SFX.step();
    if (!reduce && Math.random() < 0.5) particles.push({ x: P.x * TS + 8, y: P.y * TS + 15, vx: (Math.random() - .5) * .4, vy: -.2, life: 18, c: 'rgba(255,255,255,.6)', r: 1.5 });
    D.pos[cfg.id] = [P.x, P.y];
    if (e && e.kind === 'item') { path = []; held = null; await interact(e); }
    else if (e && e.kind === 'exit') { path = []; held = null; await interact(e); }
    if (cfg.langkah) cfg.langkah(P.x, P.y);
    refreshTouchAction();
  }
  const KEYS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
  addEventListener('keydown', e => {
    if (mode === 'busy' || mode === 'load') { if (e.key === ' ' || e.key === 'Enter') { const adv = document.querySelector('[data-adv]'); if (adv) { e.preventDefault(); adv.click(); } } return; }
    if (mode !== 'world') return;
    if (KEYS[e.key]) { e.preventDefault(); held = KEYS[e.key]; path = []; }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); actBtn(); }
  });
  addEventListener('keyup', e => { if (KEYS[e.key] && held === KEYS[e.key]) held = null; });
  function actBtn() { if (mode !== 'world') return; const e = nearby(); if (e) interact(e); }
  const ACT = { ms: { npc: '🗣️ Berbual', foe: '⚡ Cabar', chest: '🎁 Buka peti', sign: '🪧 Baca', lab: '🔬 Cuba', lampu: '💡 Baiki lampu', block: '👆 Periksa' },
                en: { npc: '🗣️ Talk', foe: '⚡ Challenge', chest: '🎁 Open chest', sign: '🪧 Read', lab: '🔬 Try it', lampu: '💡 Fix the lamp', block: '👆 Look' } };
  function refreshTouchAction() {
    const b = $('touchAction'); if (!b) return;
    if (mode !== 'world' || !$('ov').hidden) { b.hidden = true; return; }
    const e = nearby(); if (!e) { b.hidden = true; return; }
    b.textContent = e.aksi ? tx(typeof e.aksi === 'function' ? e.aksi() : e.aksi) : (ACT[lang][e.kind] || (isMs() ? '👆 Interaksi' : '👆 Interact')); b.hidden = false;
  }

  let cv, ctx, scale = 1, dpr = 1; const cam = { x: 0, y: 0 };
  function bindPointer() {
    let finger = null; const ring = $('swipeRing'), thumb = $('swipeThumb');
    const clear = () => { if (finger && finger.dragging && held === finger.direction) held = null; finger = null; ring.hidden = true; };
    const cell = (cx, cy) => { const r = cv.getBoundingClientRect(); return [Math.floor(((cx - r.left) / scale + cam.x) / TS), Math.floor(((cy - r.top) / scale + cam.y) / TS)]; };
    cv.addEventListener('pointerdown', e => { if (mode !== 'world' || finger || (e.pointerType === 'mouse' && e.button !== 0)) return; e.preventDefault(); finger = { id: e.pointerId, x: e.clientX, y: e.clientY, dragging: false, direction: null }; try { cv.setPointerCapture(e.pointerId); } catch {} });
    cv.addEventListener('pointermove', e => {
      if (mode !== 'world' || !finger || e.pointerId !== finger.id) return;
      const dx = e.clientX - finger.x, dy = e.clientY - finger.y;
      if (!finger.dragging && Math.hypot(dx, dy) < 13) return;
      if (!finger.dragging) { finger.dragging = true; path = []; afterPath = null; }
      const d = Math.abs(dx) >= Math.abs(dy) ? [dx < 0 ? -1 : 1, 0] : [0, dy < 0 ? -1 : 1];
      finger.direction = d; held = d;
      const r = cv.getBoundingClientRect(); ring.style.left = (e.clientX - r.left) + 'px'; ring.style.top = (e.clientY - r.top) + 'px';
      const mag = Math.hypot(dx, dy) || 1, dis = Math.min(26, mag / 2), a = Math.atan2(dy, dx);
      thumb.style.transform = `translate(calc(-50% + ${dx / mag * dis}px),calc(-50% + ${dy / mag * dis}px)) rotate(${a}rad)`; ring.hidden = false;
      if (!P.moving) tryMove(d[0], d[1]);
      $('touchTip').hidden = true;
    });
    cv.addEventListener('pointerup', e => { if (!finger || finger.id !== e.pointerId) return; const wasDrag = finger.dragging; clear(); if (!wasDrag && mode === 'world') { const [x, y] = cell(e.clientX, e.clientY); walkTo(x, y); $('touchTip').hidden = true; } });
    cv.addEventListener('pointercancel', e => { if (finger && finger.id === e.pointerId) clear(); });
    cv.addEventListener('lostpointercapture', e => { if (finger && finger.id === e.pointerId) clear(); });
    HS._clearTouch = clear;
  }
  function fit() {
    const r = cv.getBoundingClientRect(); if (!r.width) return;
    const tall = r.height / r.width > .8; VW = Math.min(COLS, tall ? 10 : 12); VH = Math.min(ROWS, tall ? VW * r.height / r.width : VW * .75);
    dpr = Math.min(2, devicePixelRatio || 1); scale = r.width / (VW * TS); cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  }

  // ===================== lukis dunia =====================
  const hash = (x, y) => { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; };
  const isW = c => c === '~' || c === 'b';
  const isRoad = c => c === '=' || c === 'b' || c === 'a';
  const TH = { grass: ['#74c460', '#6abc57', '#62b250'], blade: '#4c983f', roofs: ['#8a4530', '#3f6f9a', '#6b4f8a', '#4f7f3a', '#9a6a2a'] };
  function drawTile(c, x, y, time) {
    const X = x * TS, Y = y * TS, h = hash(x, y), G = cfg.warna || TH;
    const grass = () => {
      const p = hash(x >> 2, y >> 2), g = G.grass || TH.grass;
      ctx.fillStyle = p > .66 ? g[0] : p > .33 ? g[1] : g[2]; ctx.fillRect(X, Y, TS, TS);
      if (h > .45) { ctx.fillStyle = G.blade || TH.blade; const bx = X + 2 + h * 9; ctx.fillRect(bx, Y + 8, 1, 3); ctx.fillRect(bx + 1, Y + 6, 1, 5); ctx.fillRect(bx + 2, Y + 8, 1, 3); }
      if (h < .1) { ctx.fillStyle = '#9fdc8c'; ctx.fillRect(X + 11, Y + 3, 2, 1); }
    };
    const water = still => {
      const nL = isW(tileAt(x - 1, y)), nR = isW(tileAt(x + 1, y)), nU = isW(tileAt(x, y - 1)), nD = isW(tileAt(x, y + 1));
      ctx.fillStyle = nL && nR ? '#1f8fc5' : '#35b2e0'; ctx.fillRect(X, Y, TS, TS);
      if (!still && !reduce) { ctx.fillStyle = 'rgba(255,255,255,.4)'; for (const o of [0, 8]) { const sy = (time / 55 + h * 16 + o) % 16; ctx.fillRect(X + 3 + ((h * 37 + o) % 9), Y + sy, 1, Math.min(4, 16 - sy)); } }
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      const w = i => reduce ? 0 : Math.sin(time / 280 + (i + X + Y) / 3) * .9;
      for (let i = 0; i < 16; i += 2) { if (!nL) ctx.fillRect(X + 1 + w(i), Y + i, 2, 2); if (!nR) ctx.fillRect(X + 13 + w(i), Y + i, 2, 2); if (!nU) ctx.fillRect(X + i, Y + 1 + w(i), 2, 2); if (!nD) ctx.fillRect(X + i, Y + 13 + w(i), 2, 2); }
    };
    switch (c) {
      case '.': case 'w': grass(); break;
      case ',': grass(); ctx.fillStyle = ['#ff7eb6', '#ffe14d', '#ffffff', '#b28dff'][(h * 4) | 0]; for (const [a, b] of [[5, 5], [10, 10]]) { ctx.fillRect(X + a - 1, Y + b, 3, 1); ctx.fillRect(X + a, Y + b - 1, 1, 3); } ctx.fillStyle = '#ffd23f'; ctx.fillRect(X + 5, Y + 5, 1, 1); ctx.fillRect(X + 10, Y + 10, 1, 1); break;
      case '=': {
        grass();
        const u = isRoad(tileAt(x, y - 1)), r = isRoad(tileAt(x + 1, y)), d = isRoad(tileAt(x, y + 1)), l = isRoad(tileAt(x - 1, y));
        const it = u ? 0 : 2, ir = r ? 0 : 2, id = d ? 0 : 2, il = l ? 0 : 2;
        ctx.fillStyle = '#b8925a'; ctx.fillRect(X + il, Y + it, TS - il - ir, TS - it - id);
        ctx.fillStyle = '#e6c890'; ctx.fillRect(X + il + (l ? 0 : 1), Y + it + (u ? 0 : 1), TS - il - ir - (l ? 0 : 1) - (r ? 0 : 1), TS - it - id - (u ? 0 : 1) - (d ? 0 : 1));
        ctx.fillStyle = '#c9a66b'; ctx.fillRect(X + 3 + h * 9, Y + 4, 2, 2); ctx.fillRect(X + 4, Y + 11, 2, 1); ctx.fillRect(X + 11, Y + 8 + h * 4, 1, 1);
        break; }
      case 'a': {   // batu jalan pekan
        ctx.fillStyle = '#b9b2a4'; ctx.fillRect(X, Y, TS, TS);
        ctx.fillStyle = '#d6cfbf';
        for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) { const off = j % 2 ? 4 : 0; ctx.fillRect(X + i * 8 + off - (off && i ? 8 : 0) + 1, Y + j * 4 + 1, 6, 2); }
        if (h > .7) { ctx.fillStyle = '#9d9585'; ctx.fillRect(X + 5, Y + 7, 2, 1); }
        break; }
      case '~': water(false); break;
      case 'b': water(true); ctx.fillStyle = '#3a2412'; ctx.fillRect(X, Y + 1, TS, 14); ctx.fillStyle = '#b5803f'; ctx.fillRect(X, Y + 2, TS, 12); ctx.fillStyle = '#8a5a2b'; for (let i = 0; i < 4; i++) ctx.fillRect(X + i * 4, Y + 2, 1, 12); break;
      case 'T': case 'P': case 'r': case 'F': case 'k': grass(); if (c !== 'F') { ctx.fillStyle = 'rgba(0,40,10,.28)'; ctx.beginPath(); ctx.ellipse(X + 9, Y + 14, 7, 3, 0, 0, 7); ctx.fill(); } break;
      case 'H': {
        grass();
        if (tileAt(x - 1, y) !== 'H' && tileAt(x, y - 1) !== 'H') {
          const roof = (G.roofs || TH.roofs)[(h * 5) | 0], wall = G.wall || '#c98a4b';
          ctx.fillStyle = 'rgba(0,30,10,.3)'; ctx.fillRect(X + 2, Y + 28, 30, 4);
          ctx.fillStyle = '#3a2412'; for (const sx of [3, 14, 25]) ctx.fillRect(X + sx, Y + 22, 3, 9);
          ctx.fillStyle = '#2a170a'; ctx.fillRect(X + 1, Y + 11, 30, 13);
          ctx.fillStyle = wall; ctx.fillRect(X + 2, Y + 12, 28, 11);
          ctx.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 28; i += 3) ctx.fillRect(X + 2 + i, Y + 12, 1, 11);
          ctx.fillStyle = '#2a170a'; ctx.beginPath(); ctx.moveTo(X - 2, Y + 14); ctx.lineTo(X + 16, Y); ctx.lineTo(X + 34, Y + 14); ctx.fill();
          ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(X, Y + 13); ctx.lineTo(X + 16, Y + 1.5); ctx.lineTo(X + 32, Y + 13); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.15)'; for (let i = 1; i < 4; i++) ctx.fillRect(X + 16 - i * 4, Y + 1.5 + i * 3, i * 8, 1);
          ctx.fillStyle = '#3b2412'; ctx.fillRect(X + 13, Y + 15, 6, 8);
          const lit = !cfg.malam || !cfg.malam() ? .75 + .25 * Math.sin(time / 700 + h * 9) : .25;
          ctx.fillStyle = `rgba(255,214,120,${lit})`; ctx.fillRect(X + 5, Y + 15, 5, 4); ctx.fillRect(X + 22, Y + 15, 5, 4);
          ctx.fillStyle = '#2a170a'; ctx.fillRect(X + 7, Y + 15, 1, 4); ctx.fillRect(X + 24, Y + 15, 1, 4);
        }
        break; }
      case 'R': {
        const front = tileAt(x, y + 1) !== 'R';
        ctx.fillStyle = G.rock || '#545a66'; ctx.fillRect(X, Y, TS, TS);
        ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.arc(X + 5 + h * 6, Y + 6, 4 + h * 2, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(X + 2 + h * 9, Y + 9, 4, 1);
        if (h > .8 && G.ore) { ctx.fillStyle = G.ore; ctx.fillRect(X + 4 + h * 5, Y + 4, 2, 2); ctx.fillRect(X + 9, Y + 7, 1, 1); }
        if (front) { ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(X, Y + 9, TS, 7); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(X + 5, Y + 10, 1, 6); ctx.fillRect(X + 11, Y + 11, 1, 5); ctx.fillStyle = '#1b1d22'; ctx.fillRect(X, Y + 15, TS, 1); }
        if (tileAt(x, y - 1) !== 'R') { ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(X, Y, TS, 1); }
        break; }
      case 'c': case 'O': {
        ctx.fillStyle = h > .5 ? '#4e4033' : '#4a3c2f'; ctx.fillRect(X, Y, TS, TS);
        if (h > .55) { ctx.fillStyle = '#5e4e3e'; ctx.fillRect(X + 3 + h * 6, Y + 9, 3, 2); }
        if (tileAt(x, y - 1) === 'R') { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(X, Y, TS, 4); }
        if (c === 'O') { ctx.fillStyle = '#1b1d22'; ctx.fillRect(X + 1, Y + 1, 14, 14); ctx.fillStyle = '#7a7f8a'; ctx.fillRect(X + 2, Y + 2, 12, 12); }
        break; }
      case 'm': { ctx.fillStyle = h > .5 ? '#6f7a3f' : '#68733a'; ctx.fillRect(X, Y, TS, TS); ctx.fillStyle = '#5a6331'; ctx.beginPath(); ctx.ellipse(X + 4 + h * 8, Y + 6 + h * 5, 4, 2.2, 0, 0, 7); ctx.fill(); break; }
      case 'W': {   // dinding bengkel / kedai
        ctx.fillStyle = '#7d5a3c'; ctx.fillRect(X, Y, TS, TS); ctx.fillStyle = '#6a4a30'; for (let i = 0; i < 16; i += 4) ctx.fillRect(X, Y + i, TS, 1);
        if (tileAt(x, y - 1) !== 'W') { ctx.fillStyle = '#4a5560'; ctx.fillRect(X - 1, Y, TS + 2, 5); ctx.fillStyle = '#6c7a86'; ctx.fillRect(X - 1, Y, TS + 2, 2); }
        break; }
      default: grass();
    }
    if (c === 'F') {   // pagar
      ctx.fillStyle = '#3a2412'; ctx.fillRect(X, Y + 7, TS, 2); ctx.fillRect(X, Y + 11, TS, 2);
      ctx.fillStyle = '#e8d2a8'; ctx.fillRect(X + 2, Y + 4, 3, 11); ctx.fillRect(X + 11, Y + 4, 3, 11); ctx.fillStyle = '#3a2412'; ctx.fillRect(X + 2, Y + 14, 3, 1); ctx.fillRect(X + 11, Y + 14, 3, 1);
    }
  }
  function drawTall(c, x, y, time) {
    const X = x * TS, Y = y * TS, h = hash(x, y);
    if (c === 'T') {
      const sw = reduce ? 0 : Math.sin(time / 900 + h * 6) * .8;
      ctx.fillStyle = '#2a170a'; ctx.fillRect(X + 6, Y + 7, 5, 9); ctx.fillStyle = '#7a4e28'; ctx.fillRect(X + 7, Y + 8, 3, 7);
      const cx = X + 8 + sw, cy = Y + 3;
      ctx.fillStyle = '#0f2e1a'; ctx.beginPath(); ctx.arc(cx, cy, 9.5, 0, 7); ctx.arc(cx - 5, cy + 3, 6.5, 0, 7); ctx.arc(cx + 5, cy + 3, 6.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#1f6b3a'; ctx.beginPath(); ctx.arc(cx, cy, 8.5, 0, 7); ctx.arc(cx - 5, cy + 3, 5.5, 0, 7); ctx.arc(cx + 5, cy + 3, 5.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#2f8a4a'; ctx.beginPath(); ctx.arc(cx - 2, cy - 2, 5, 0, 7); ctx.fill();
      ctx.fillStyle = '#56b36a'; ctx.beginPath(); ctx.arc(cx - 3, cy - 4, 2, 0, 7); ctx.fill();
    } else if (c === 'r') {   // rumput tinggi / mensiang: dinding maze Laluan Kompas
      const sw = reduce ? 0 : Math.sin(time / 600 + h * 6);
      for (let i = 0; i < 6; i++) {
        const bx = X + 1 + i * 2.6 + (hash(x + i, y) - .5) * 2, top = Y - 6 - hash(x, y + i) * 6;
        ctx.strokeStyle = '#2c4f2a'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(bx, Y + 15); ctx.quadraticCurveTo(bx + sw * 1.5, Y + 4, bx + sw * 3, top); ctx.stroke();
        ctx.strokeStyle = i % 2 ? '#7fae58' : '#9cc56a'; ctx.lineWidth = 1.4; ctx.stroke();
        if (h > .55 && i % 3 === 1) { ctx.fillStyle = '#c9a46a'; ctx.beginPath(); ctx.ellipse(bx + sw * 3, top, 1.4, 3, 0, 0, 7); ctx.fill(); }
      }
    } else if (c === 'k') {   // bongkah bijih besi: dua batu bulat kelabu-biru dengan kilauan logam
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(X + 8, Y + 14, 8, 2.6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#2b2f38'; ctx.beginPath(); ctx.ellipse(X + 6, Y + 9, 6.5, 5.6, 0, 0, 7); ctx.ellipse(X + 11.5, Y + 11, 4.6, 3.8, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#6b7689'; ctx.beginPath(); ctx.ellipse(X + 6, Y + 9, 5.5, 4.6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#5a6577'; ctx.beginPath(); ctx.ellipse(X + 11.5, Y + 11, 3.7, 2.9, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#8d99ad'; ctx.beginPath(); ctx.ellipse(X + 4.5, Y + 7, 2.4, 1.6, -.4, 0, 7); ctx.fill();
      ctx.fillStyle = '#b9cbe6'; ctx.fillRect(X + 7, Y + 9, 2, 1.5); ctx.fillRect(X + 11, Y + 10.5, 1.5, 1.5); ctx.fillRect(X + 3.5, Y + 10.5, 1.2, 1.2);
      if (!reduce && ((time / 700 + h * 7) % 3) < .25) { ctx.fillStyle = '#fff'; ctx.fillRect(X + 7, Y + 8.5, 1, 1); }
    }
  }
  const SPR = new Map(), OS = 4;
  function spriteImg(em, size, white) {
    const k = em + size + (white ? 'w' : ''); let c = SPR.get(k); if (c) return c;
    const w = Math.ceil(size * 1.35) + 4, a = document.createElement('canvas'); a.width = a.height = w * OS;
    const g = a.getContext('2d'); g.scale(OS, OS); g.font = `${size}px ${EMOJI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#000'; g.fillText(em, w / 2, w / 2 + size * .05);
    c = document.createElement('canvas'); c.width = c.height = w * OS; const h = c.getContext('2d'), o = 1.15 * OS;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [.7, .7], [-.7, .7], [.7, -.7], [-.7, -.7]]) h.drawImage(a, dx * o, dy * o);
    h.globalCompositeOperation = 'source-in'; h.fillStyle = '#1a120b'; h.fillRect(0, 0, c.width, c.height);
    h.globalCompositeOperation = 'source-over'; h.drawImage(a, 0, 0);
    if (white) { h.globalCompositeOperation = 'source-atop'; h.fillStyle = 'rgba(255,255,255,.8)'; h.fillRect(0, 0, c.width, c.height); }
    c.w = w; SPR.set(k, c); return c;
  }
  const drawSprite = (em, x, y, size, white) => { const c = spriteImg(em, size, white); ctx.drawImage(c, x - c.w / 2, y - c.w / 2, c.w, c.w); };
  const drawEmoji = (em, x, y, size) => { ctx.fillStyle = '#000'; ctx.font = `${size}px ${EMOJI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(em, x, y); };
  const shadow = (x, y, rx_, ry) => { ctx.fillStyle = 'rgba(0,25,10,.3)'; ctx.beginPath(); ctx.ellipse(x, y, rx_, ry, 0, 0, 7); ctx.fill(); };
  HS.drawSprite = (...a) => drawSprite(...a); HS.ctx = () => ctx; HS.TS = TS;

  let last = 0;
  function frame(time) {
    const dt = Math.min(50, time - (last || time)); last = time; now = time;
    if (mode === 'world') update(dt);
    if (cfg) render(time);
    requestAnimationFrame(frame);
  }
  function update(dt) {
    if (P.moving) { P.t += dt / (tileAt(P.x, P.y) === 'm' ? 330 : 150); if (P.t >= 1) { P.moving = false; onEnter(); } }
    if (!P.moving && mode === 'world') {
      if (path.length) {
        const [nx, ny] = path[0];
        if (tryMove(nx - P.x, ny - P.y)) path.shift(); else path = [];
        if (!path.length && afterPath && !P.moving) { const e = afterPath; afterPath = null; interact(e); }
      } else if (afterPath) { const e = afterPath; afterPath = null; interact(e); }
      else if (held) tryMove(held[0], held[1]);
    }
    const fx = P.from ? P.from[0] : P.x, fy = P.from ? P.from[1] : P.y, k = P.moving ? P.t : 1;
    P.px = (fx + (P.x - fx) * k) * TS; P.py = (fy + (P.y - fy) * k) * TS;
    if (cfg.kemas) cfg.kemas(dt, now);
  }
  function render(time) {
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    if (!P.moving && mode !== 'world') { P.px = P.x * TS; P.py = P.y * TS; }
    const VWp = VW * TS, VHp = VH * TS;
    cam.x = COLS * TS <= VWp ? (COLS * TS - VWp) / 2 : Math.max(0, Math.min(COLS * TS - VWp, P.px - VWp / 2 + TS / 2));
    cam.y = ROWS * TS <= VHp ? (ROWS * TS - VHp) / 2 : Math.max(0, Math.min(ROWS * TS - VHp, P.py - VHp / 2 + TS / 2));
    ctx.fillStyle = '#1d3b2a'; ctx.fillRect(0, 0, VWp, VHp);
    const sh = now < shakeT && !reduce ? [(Math.random() - .5) * 4, (Math.random() - .5) * 4] : [0, 0];
    ctx.save(); ctx.translate(-Math.round(cam.x) + sh[0], -Math.round(cam.y) + sh[1]);
    const x0 = Math.floor(cam.x / TS) - 1, y0 = Math.floor(cam.y / TS) - 1, x1 = x0 + VW + 2, y1 = y0 + Math.ceil(VH) + 2;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && y >= 0 && x < COLS && y < ROWS) drawTile(map[y][x], x, y, time);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (tileAt(x, y) === 'H' && tileAt(x - 1, y) !== 'H' && tileAt(x, y - 1) !== 'H') drawTile('H', x, y, time);
    if (cfg.lukisBawah) cfg.lukisBawah(ctx, time);
    const list = [];
    for (const e of ENT) if (alive(e) && e.x >= x0 - 1 && e.x <= x1 + 1 && e.y >= y0 - 1 && e.y <= y1 + 2) list.push({ y: e.y + (e.kind === 'exit' ? -.5 : 0), f: () => drawEnt(e, time) });
    for (let y = y0; y <= y1 + 1; y++) for (let x = x0; x <= x1; x++) { const c = tileAt(x, y); if ((c === 'T' || c === 'P' || c === 'r' || c === 'k') && x >= 0 && y >= 0 && x < COLS && y < ROWS) list.push({ y, f: () => drawTall(c, x, y, time) }); }
    list.push({ y: P.py / TS + .01, f: () => drawPlayer(time) });
    list.sort((a, b) => a.y - b.y).forEach(d => d.f());
    const near = mode === 'world' ? nearby() : null;
    if (near) { const X = near.x * TS + 8, Y = near.y * TS - 9 - (near.tinggi || 0) + (reduce ? 0 : Math.sin(time / 200) * 1.2); ctx.fillStyle = '#ffc94a'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(X - 6, Y - 7, 12, 11, 3) : ctx.rect(X - 6, Y - 7, 12, 11); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#000'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', X, Y - 1.5); }
    if (path.length) { const [tx_, ty_] = path[path.length - 1]; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1; const k = reduce ? 0 : Math.sin(time / 150); ctx.strokeRect(tx_ * TS + 2 - k, ty_ * TS + 2 - k, TS - 4 + 2 * k, TS - 4 + 2 * k); }
    if (!reduce && cfg.daun !== false && Math.random() < .04) particles.push({ x: cam.x + Math.random() * VWp, y: cam.y - 4, vx: .25 + Math.random() * .3, vy: .35, life: 220, c: Math.random() < .5 ? '#3f9a50' : '#d9a13b', r: 1.4, leaf: Math.random() * 6 });
    for (const p of particles) { p.x += p.vx + (p.leaf ? Math.sin(time / 300 + p.leaf) * .3 : 0); p.y += p.vy; if (p.g) p.vy += p.g; p.life--; ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 20)); ctx.fillStyle = p.c; if (p.leaf) ctx.fillRect(p.x, p.y, 2.5, 1.5); else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); } }
    ctx.globalAlpha = 1;
    for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);
    if (cfg.lukisAtas) cfg.lukisAtas(ctx, time);
    ctx.restore();
    const cx = P.px - cam.x + 8, cy = P.py - cam.y + 8;
    // gua / lombong gelap
    if (cfg.gelap && cfg.gelap(P.x, P.y)) {
      const fl = reduce ? 0 : Math.sin(time / 90) * 2, g = ctx.createRadialGradient(cx, cy, 16 + fl, cx, cy, 78 + fl);
      g.addColorStop(0, 'rgba(255,190,90,.08)'); g.addColorStop(.35, 'rgba(10,8,20,.25)'); g.addColorStop(1, 'rgba(5,5,15,.9)'); ctx.fillStyle = g; ctx.fillRect(0, 0, VWp, VHp);
    }
    // malam: pekan gelap, lampu yang dibaiki bercahaya
    if (cfg.malam && cfg.malam()) {
      ctx.fillStyle = 'rgba(12,18,52,.55)'; ctx.fillRect(0, 0, VWp, VHp);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const glow = (wx, wy, r, a) => { const sx = wx - cam.x, sy = wy - cam.y, g = ctx.createRadialGradient(sx, sy, 2, sx, sy, r); g.addColorStop(0, `rgba(255,214,120,${a})`); g.addColorStop(1, 'rgba(255,214,120,0)'); ctx.fillStyle = g; ctx.fillRect(sx - r, sy - r, r * 2, r * 2); };
      glow(P.px + 8, P.py + 6, 34, .22);
      (cfg.cahaya ? cfg.cahaya() : []).forEach(([wx, wy, r]) => glow(wx, wy, r || 46, .38 + (reduce ? 0 : Math.sin(time / 300 + wx) * .04)));
      ctx.restore();
    }
    // kabus: Laluan Kompas
    const kb = cfg.kabus ? cfg.kabus() : 0;
    if (kb) {
      const r0 = kb * TS * .55, r1 = kb * TS, fl = reduce ? 0 : Math.sin(time / 700) * 3;
      const g = ctx.createRadialGradient(cx, cy, r0 + fl, cx, cy, r1 + fl);
      g.addColorStop(0, 'rgba(232,238,240,0)'); g.addColorStop(.6, 'rgba(226,233,236,.75)'); g.addColorStop(1, 'rgba(222,230,234,.97)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, VWp, VHp);
      if (!reduce) { ctx.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 5; i++) { const fx = ((time / 40 + i * 97) % (VWp + 80)) - 40, fy = (i * 53) % VHp; ctx.beginPath(); ctx.ellipse(fx, fy, 40, 12, 0, 0, 7); ctx.fill(); } }
    }
    if (cfg.lukisSkrin) cfg.lukisSkrin(ctx, time, VWp, VHp);
    ctx.fillStyle = 'rgba(255,170,90,.05)'; ctx.fillRect(0, 0, VWp, VHp);
    const vg = ctx.createRadialGradient(VWp / 2, VHp / 2, VHp * .35, VWp / 2, VHp / 2, VWp * .72);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,15,10,.35)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, VWp, VHp);
  }
  HS.cam = cam;
  function drawPlayer(time) {
    const step = P.moving && !reduce ? Math.sin(P.t * Math.PI) : 0;
    shadow(P.px + 8, P.py + 14, 6 - step, 2.5);
    if (now < invulnUntil && Math.floor(now / 90) % 2) return;
    const breathe = reduce ? 0 : Math.sin(time / 350) * .03, walk = P.moving && !reduce ? Math.sin(P.t * Math.PI * 2) : 0;
    ctx.save(); ctx.translate(P.px + 8, P.py + 15 - step * 1.5); ctx.scale(-P.face * (1 - breathe * .5), 1 + breathe * .5);
    const hk = heroKey();
    if (hswOk(hk)) { ctx.rotate(walk * .06); drawHsw(ctx, hk, 0, 1, 33, true); }
    else drawSprite(st.av && st.av.g === 'g' ? '🧕' : '👦', 0, -8, 16);
    ctx.restore();
  }
  function drawEnt(e, time) {
    const X = e.x * TS + 8, Y = e.y * TS + 8, b = reduce ? 0 : Math.sin(time / 400 + e.x) * 1;
    if (e.lukis) return e.lukis(ctx, X, Y, time, { drawSprite, shadow, drawEmoji });
    if (e.kind === 'item') {
      const tw = reduce ? 0 : Math.sin(time / 300 + e.x) * 1.5;
      ctx.fillStyle = `rgba(255,240,150,${.25 + .15 * Math.sin(time / 250 + e.x)})`; ctx.beginPath(); ctx.arc(X, Y + 2, 7, 0, 7); ctx.fill();
      shadow(X, Y + 6, 4, 1.5); drawSprite(e.em, X, Y - 1 + tw, e.size || 12);
      ctx.globalAlpha = .6 + .4 * Math.sin(time / 200 + e.y); drawEmoji('✨', X + 6, Y - 7, 8); ctx.globalAlpha = 1; return;
    }
    if (e.kind === 'exit') {
      const pulse = reduce ? .5 : .5 + .5 * Math.sin(time / 260);
      ctx.fillStyle = `rgba(255,214,110,${.25 + .25 * pulse})`; ctx.beginPath(); ctx.ellipse(X, Y + 4, 9, 4.5, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(X, Y + 1 + (reduce ? 0 : Math.sin(time / 260) * 1.2));
      const dir = e.arah || [1, 0]; ctx.rotate(Math.atan2(dir[1], dir[0]));
      ctx.fillStyle = '#1a120b'; ctx.beginPath(); ctx.moveTo(-6, -3.5); ctx.lineTo(1, -3.5); ctx.lineTo(1, -7); ctx.lineTo(8, 0); ctx.lineTo(1, 7); ctx.lineTo(1, 3.5); ctx.lineTo(-6, 3.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = e.tutup && e.tutup() ? '#c9ced6' : '#ffd76f'; ctx.beginPath(); ctx.moveTo(-5, -2.3); ctx.lineTo(2.2, -2.3); ctx.lineTo(2.2, -5); ctx.lineTo(6.6, 0); ctx.lineTo(2.2, 5); ctx.lineTo(2.2, 2.3); ctx.lineTo(-5, 2.3); ctx.closePath(); ctx.fill();
      ctx.restore(); return;
    }
    if (e.kind === 'sign') {
      shadow(X, Y + 6, 5, 1.8);
      ctx.fillStyle = '#2a170a'; ctx.fillRect(X - 1.5, Y - 2, 3, 9); ctx.fillStyle = '#7a4e28'; ctx.fillRect(X - .8, Y - 2, 1.6, 9);
      ctx.fillStyle = '#2a170a'; ctx.fillRect(X - 8, Y - 10, 16, 9); ctx.fillStyle = e.warna || '#e6c890'; ctx.fillRect(X - 7, Y - 9, 14, 7);
      ctx.fillStyle = '#8a5a2b'; ctx.fillRect(X - 5, Y - 7, 10, 1); ctx.fillRect(X - 5, Y - 5, 7, 1);
      if (e.huruf) { ctx.fillStyle = '#2a170a'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = e.warna ? '#fff' : '#2a170a'; ctx.fillRect(X - 7, Y - 9, 14, 7); ctx.fillStyle = e.warna || '#e6c890'; ctx.fillText(e.huruf, X, Y - 5.4); }
      return;
    }
    const big = e.size || (e.kind === 'chest' ? 15 : 18);
    shadow(X, Y + 6, big / 2.6, 2.5);
    if (e.kind === 'chest') { ctx.fillStyle = `rgba(255,201,74,${.25 + .2 * Math.sin(time / 250)})`; ctx.beginPath(); ctx.arc(X, Y, 11, 0, 7); ctx.fill(); }
    if (e.kind === 'lab' || e.kind === 'lampu') { ctx.fillStyle = `rgba(150,220,255,${.25 + .2 * Math.sin(time / 300)})`; ctx.beginPath(); ctx.arc(X, Y, 11, 0, 7); ctx.fill(); }
    if (e.img && hswOk(e.img)) {
      const hh = e.h || 30, top = Y + 7 - hh + b * .6;
      drawHsw(ctx, e.img, X, Y + 7, hh + (reduce ? 0 : Math.sin(time / 400 + e.x) * .5), e.x > P.x);
      if (e.kind === 'foe' && !reduce) { ctx.globalAlpha = .5 + .5 * Math.sin(time / 250); drawEmoji('💢', X + 9, top + 2, 8); ctx.globalAlpha = 1; }
      if (e.seru && e.seru()) drawSprite('❗', X, top - 4, 9);
      return;
    }
    drawSprite(e.em, X, Y - 3 + b - (big - 18) / 2, big);
    if (e.kind === 'foe' && !reduce) { ctx.globalAlpha = .5 + .5 * Math.sin(time / 250); drawEmoji('💢', X + 9, Y - 12 - (big - 18) / 2, 8); ctx.globalAlpha = 1; }
    if (e.seru && e.seru()) drawSprite('❗', X, Y - 17 + b - (big - 18) / 2, 9);
  }

  // ===================== HUD =====================
  function hud() {
    if (!cfg) return;
    $('hearts').textContent = '❤️'.repeat(hearts) + '🤍'.repeat(Math.max(0, maxH() - hearts));
    $('lvl').textContent = `${isMs() ? 'Tahap' : 'Lv'} ${level()}`;
    $('xp').style.width = (st.xp % 100) + '%';
    $('stars').textContent = `⭐ ${st.stars}`;
    $('mut').textContent = `💎 ${mutiaraOf().length}/6`; $('mut').title = isMs() ? 'Mutiara Sungai' : 'River Pearls';
    $('lang').textContent = isMs() ? 'EN' : 'BM';
    $('mute').textContent = muted ? '🔇' : '🔊';
    $('petaLabel').textContent = isMs() ? 'Peta Wilayah' : 'Region Map';
    $('hsPlace').textContent = tx(cfg.nama).toUpperCase();
    $('hsBrand').textContent = cfg.ikon || '🦌';
    $('touchGuideTitle').textContent = isMs() ? 'Main dengan sentuhan!' : 'Play with your fingers!';
    $('touchGuideText').textContent = isMs() ? 'Jelajah peta tanpa butang A atau anak panah.' : 'Explore the map without an A button or D-pad.';
    $('touchGuideTap').textContent = isMs() ? '📍 Ketuk = pergi' : '📍 Tap = go';
    $('touchGuideSwipe').textContent = isMs() ? '↔️ Leret = jalan' : '↔️ Swipe = move';
    $('touchGuideAct').textContent = isMs() ? '✨ Ketuk = interaksi' : '✨ Tap = interact';
    $('keyboardGuide').textContent = isMs() ? '⌨️ PC: kekunci anak panah / WASD, Enter untuk interaksi.' : '⌨️ PC: arrow keys / WASD, Enter to interact.';
    $('touchTip').textContent = isMs() ? '👆 Ketuk atau leret pada peta' : '👆 Tap or swipe on the map';
    const q = cfg.misi ? cfg.misi() : null;
    if (q) $('quest').innerHTML = `<div class="quest-heading"><span>🧭 ${esc(isMs() ? 'Misi' : 'Quest')} ${Math.min(q.n + 1, q.jumlah)}/${q.jumlah}</span><span>${esc(tx(cfg.nama))}</span></div><div class="quest-text">${esc(tx(q.teks))}</div><div class="quest-progress"><i style="width:${q.n / q.jumlah * 100}%"></i></div>`;
    refreshTouchAction();
  }
  HS.hud = hud;
  function gainXP(n) { const b = level(); st.xp += n; save(); hud(); if (level() > b) { toast(isMs() ? `Naik ke Tahap ${level()}!` : `Level up to ${level()}!`); SFX.win(); hearts = maxH(); hud(); } }
  function toast(msg, cls = '') { const d = document.createElement('div'); d.className = 'toast ' + cls; d.textContent = msg; $('stage').appendChild(d); setTimeout(() => d.remove(), 2000); }
  HS.gainXP = gainXP; HS.toast = toast;
  HS.bintang = n => { st.stars += n; save(); hud(); };
  HS.beriMutiara = n => { if (!D.mutiara.includes(n)) D.mutiara.push(n); save(); hud(); };
  HS.goyang = ms => { shakeT = now + (ms || 400); };
  HS.percik = (wx, wy, c, n = 18) => { if (reduce) return; for (let i = 0; i < n; i++) particles.push({ x: wx, y: wy, vx: (Math.random() - .5) * 2.4, vy: -Math.random() * 2, g: .05, life: 34, c, r: 1.6 }); };

  // ===================== tindanan =====================
  function openOv(cls, html, below) {
    const o = $('ov'); o.className = 'overlay ' + (cls || ''); o.style.removeProperty('--bbg'); o.innerHTML = html; o.hidden = false; mode = 'busy';
    if (HS._clearTouch) HS._clearTouch(); held = null; path = []; $('touchAction').hidden = true; setBelow(below); return o;
  }
  function setBelow(html) { const b = $('below'); if (html == null) { b.hidden = true; b.innerHTML = ''; $('controls').hidden = false; } else { b.innerHTML = html; b.hidden = false; $('controls').hidden = true; } }
  function closeOv() { const o = $('ov'); o.hidden = true; o.innerHTML = ''; setBelow(null); mode = 'world'; hud(); }
  HS.openOv = openOv; HS.closeOv = closeOv; HS.setBelow = setBelow;

  function dialog(lines) {
    return new Promise(res => {
      let i = 0, timer = null, done = false;
      const show = () => {
        const ln = lines[i], w = WHO[ln.who] || WHO.narr, text = tx(ln.text);
        const o = openOv('', `<div class="dlg" data-adv role="button" tabindex="0"><span class="face">${w.face}</span><div class="body"><b>${esc(tx(w.name))}</b><p id="dl"></p></div><span class="more">▼</span></div>`);
        const el = $('dl'); let k = 0; done = false; clearInterval(timer);
        if (reduce) { el.textContent = text; done = true; }
        else timer = setInterval(() => { k += 2; el.textContent = text.slice(0, k); if (k % 6 === 0) SFX.talk(); if (k >= text.length) { clearInterval(timer); done = true; } }, 24);
        o.querySelector('.dlg').onclick = () => {
          if (!done) { clearInterval(timer); el.textContent = text; done = true; return; }
          i++; if (i < lines.length) show(); else { closeOv(); res(); }
        };
        o.querySelector('.dlg').focus();
      };
      show();
    });
  }
  HS.dialog = dialog;

  // Soalan pilihan: { q: L(), o: [[emoji, ms, en], ...], a: indeks jawapan betul, why: L() }
  function battle(id) {
    musicBattle = true;
    return new Promise(res0 => {
      const res = v => { musicBattle = false; res0(v); };
      const foe = FOES[id], who = WHO[id];
      let hp = foe.hp, combo = 0, deck = shuffle(POOLS[foe.pool]), qi = 0, timerAnim = null, tmo = null, raged = false, limit = foe.time;
      hearts = maxH(); hud();
      const o = openOv('battle', '');
      for (const k of ['bg', 'hills', 'pt', 'pb', 'mote']) if (foe[k]) o.style.setProperty(k === 'bg' ? '--bbg' : '--' + k, foe[k]);
      const motes = reduce ? '' : Array.from({ length: 9 }, (_, i) => `<i class="mote" style="left:${8 + i * 10}%;top:${40 + (i * 37) % 50}%;animation-delay:${-i * 0.45}s"></i>`).join('');
      o.innerHTML = `<div class="hills"></div>${motes}<div class="ground"></div>
        <div class="ftr foe" id="foe"><div class="bar"><div class="nm"><span>${esc(tx(who.name))}</span><span id="fhp"></span></div><div class="hpw${foe.rage ? ' boss' : ''}"><i id="fbar"></i></div></div><div class="sprite" id="fs">${who.face}</div><div class="plat"></div></div>
        <div class="ftr me" id="me"><div class="sprite" id="ms">${WHO.adik.face}</div><div class="plat"></div><div class="bar"><div class="nm"><span>${esc(tx(WHO.adik.name))}</span><span id="mhp"></span></div></div></div>`;
      setBelow('');
      const bars = () => { $('fhp').textContent = `${hp}/${foe.hp}`; const w = hp / foe.hp * 100; $('fbar').style.width = w + '%'; $('fbar').classList.toggle('low', w <= 34); $('mhp').textContent = '❤️'.repeat(hearts) + '🤍'.repeat(Math.max(0, maxH() - hearts)); hud(); };
      const rel = el => { const r = $(el).getBoundingClientRect(), s = o.getBoundingClientRect(); return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 3 }; };
      const pop = (anchor, txt, bad) => { const { x, y } = rel(anchor); const d = document.createElement('div'); d.className = 'dmg' + (bad ? ' bad' : ''); d.textContent = txt; d.style.left = (x - 14) + 'px'; d.style.top = (y - 30) + 'px'; o.appendChild(d); setTimeout(() => d.remove(), 900); };
      const sparks = (anchor, colors) => { if (reduce) return; const { x, y } = rel(anchor); for (let i = 0; i < 14; i++) { const s = document.createElement('i'); s.className = 'spark'; s.style.background = colors[i % colors.length]; s.style.left = x + 'px'; s.style.top = y + 'px'; o.appendChild(s); const a = Math.random() * 6.28, d = 40 + Math.random() * 50; s.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(.2)`, opacity: 0 }], { duration: 550, easing: 'cubic-bezier(.2,.8,.3,1)' }).finished.then(() => s.remove(), () => s.remove()); } };
      const banner = txt => { const d = document.createElement('div'); d.className = 'banner'; d.textContent = txt; o.appendChild(d); setTimeout(() => d.remove(), 1800); };
      const taunt = () => { const ts = foe.ejek; if (!ts || Math.random() < .5) return; const d = document.createElement('div'); d.className = 'taunt'; d.textContent = tx(ts[Math.floor(Math.random() * ts.length)]); o.appendChild(d); setTimeout(() => d.remove(), 2000); };
      const fly = async (fromEl, toEl, em, big) => { const a = rel(fromEl), b = rel(toEl); const p = document.createElement('div'); p.className = 'proj'; p.textContent = em; o.appendChild(p); if (p.animate && !reduce) await p.animate([{ transform: `translate(${a.x - 16}px,${a.y}px) scale(.6)` }, { transform: `translate(${(a.x + b.x) / 2 - 16}px,${Math.min(a.y, b.y) - 50}px) scale(1.2) rotate(180deg)` }, { transform: `translate(${b.x - 16}px,${b.y}px) scale(${big ? 2 : 1.4}) rotate(360deg)` }], { duration: 420, easing: 'ease-in' }).finished.catch(() => {}); p.remove(); };
      const fx = (elId, cls) => { const el = $(elId); el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
      const enrage = async () => { raged = true; o.classList.add('rage'); deck = shuffle(POOLS[foe.ragePool || foe.pool]); qi = 0; limit = foe.rageTime || limit; SFX.bad(); fx('stage', 'shake'); banner(isMs() ? (foe.rageMs || 'Mengamuk!') : (foe.rageEn || 'Enraged!')); await wait(1500); };
      const T = isMs() ? { turn: 'Jawab untuk menyerang!', rage: 'Mengamuk!', combo: n => `Kombo x${n}!`, hurt: 'Aduh! Kamu terkena.', timeout: 'Masa tamat!', go: 'Teruskan ▶', retry: 'Cuba lagi', know: 'Tahukah kamu?', lose: 'Hati habis! Rehat sekejap, kemudian cuba lagi.', win: 'Menang!', heal: '+1 HP', ok: 'OK ▶' }
                       : { turn: 'Answer to attack!', rage: 'Enraged!', combo: n => `Combo x${n}!`, hurt: 'Ouch! You got hit.', timeout: 'Time\'s up!', go: 'Continue ▶', retry: 'Try again', know: 'Did you know?', lose: 'Out of hearts! Take a breath, then try again.', win: 'Victory!', heal: '+1 HP', ok: 'OK ▶' };
      const ask = () => {
        if (qi >= deck.length) { deck = shuffle(POOLS[raged ? (foe.ragePool || foe.pool) : foe.pool]); qi = 0; }
        const q = deck[qi++], opts = q.keep ? q.o.map((x, i) => ({ x, i })) : shuffle(q.o.map((x, i) => ({ x, i })));
        $('below').innerHTML = `<div class="row" style="justify-content:space-between"><small>${esc(T.turn)}${raged ? ' · 🔥 ' + esc(T.rage) : ''}</small><span class="combo">${combo >= 2 ? esc(T.combo(combo)) : ''}</span></div>
          <div class="timer"><i id="tm"></i></div><p class="q">${esc(tx(q.q))}</p>
          <div class="opts">${opts.map(({ x }, k) => `<button class="opt" type="button" id="o${k}"><span class="em">${x[0]}</span><span>${esc(isMs() ? x[1] : x[2])}</span></button>`).join('')}</div>`;
        const tm = $('tm'); if (tm.animate) timerAnim = tm.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: limit, fill: 'forwards' });
        clearTimeout(tmo); tmo = setTimeout(() => choose(q, -1, -1, opts), limit);
        opts.forEach(({ i }, k) => { $('o' + k).onclick = () => choose(q, i, k, opts); });
        taunt();
      };
      const choose = async (q, i, k, opts) => {
        clearTimeout(tmo); if (timerAnim) timerAnim.pause();
        $('below').querySelectorAll('.opt').forEach(b => b.disabled = true);
        const ok = i === q.a;
        if (k >= 0) $('o' + k).classList.add(ok ? 'right' : 'wrong');
        if (ok) {
          combo++; const big = combo >= 3, dmg = big ? 2 : 1;
          SFX.good(); gainXP(10);
          await fly('ms', 'fs', big ? '💥' : foe.proj, big);
          hp = Math.max(0, hp - dmg); SFX.hit(); fx('fs', 'hitfx'); fx('stage', 'shake'); pop('fs', '-' + dmg); sparks('fs', ['#ffc94a', '#fff', '#ff8a3d']); bars();
          if (big) toast(T.combo(combo));
          await wait(500);
          if (hp <= 0) return victory();
          if (foe.rage && !raged && hp <= foe.rage) await enrage();
          ask();
        } else {
          combo = 0; opts.forEach(({ i: j }, kk) => { if (j === q.a) $('o' + kk).classList.add('right'); });
          SFX.bad(); fx('fs', 'lunge'); await fly('fs', 'ms', foe.atk, false);
          hearts = Math.max(0, hearts - 1); SFX.hit(); fx('ms', 'hitfx'); fx('stage', 'shake'); pop('ms', '-❤️', true); sparks('ms', ['#ff5a5f', '#fff']);
          const fl = document.createElement('div'); fl.className = 'flash'; o.appendChild(fl); setTimeout(() => fl.remove(), 500);
          if (raged && hp < foe.hp) { hp++; setTimeout(() => pop('fs', T.heal), 250); }
          bars(); await wait(400);
          $('below').insertAdjacentHTML('beforeend', `<div class="why"><b>${esc(i === -1 ? T.timeout : T.hurt)}</b> ${esc(T.know)} ${esc(tx(q.why))}</div><div class="row"><button class="btn" id="cn" type="button" data-adv>${esc(hearts ? T.go : T.retry)}</button></div>`);
          $('cn').focus();
          $('cn').onclick = () => {
            if (hearts > 0) return ask();
            $('below').innerHTML = `<p class="q">${esc(T.lose)}</p><div class="row"><button class="btn" id="rt" type="button" data-adv>${esc(T.retry)}</button></div>`;
            $('rt').focus(); $('rt').onclick = () => { hearts = maxH(); hp = foe.hp; combo = 0; raged = false; limit = foe.time; o.classList.remove('rage'); deck = shuffle(POOLS[foe.pool]); qi = 0; bars(); ask(); };
          };
        }
      };
      const victory = async () => {
        SFX.win(); const fs = $('fs'); sparks('fs', ['#ffc94a', '#7df9ff', '#fff', '#ff7eb6']);
        if (fs.animate && !reduce) await fs.animate([{ transform: 'scale(1) rotate(0)', opacity: 1 }, { transform: 'scale(.2) rotate(540deg)', opacity: 0 }], { duration: 700, fill: 'forwards' }).finished.catch(() => {}); else fs.style.opacity = 0;
        o.classList.remove('rage');
        const xp = foe.xp || 40, bt = foe.bintang || 5;
        gainXP(xp); st.stars += bt; hearts = maxH(); save();
        $('below').innerHTML = `<p class="q">🏆 ${esc(T.win)} +${xp} XP · +${bt} ⭐</p><div class="row"><button class="btn" id="vb" type="button" data-adv>${esc(T.ok)}</button></div>`;
        $('vb').focus(); $('vb').onclick = () => { closeOv(); res(true); };
      };
      bars(); ask();
    });
  }
  HS.battle = battle;

  function chest(e) {
    return new Promise(res => {
      const pool = POOLS[e.pool || cfg.petiPool || Object.keys(POOLS)[0]], q = pool[Math.floor(Math.random() * pool.length)];
      const opts = q.keep ? q.o.map((x, i) => ({ x, i })) : shuffle(q.o.map((x, i) => ({ x, i })));
      openOv('', `<div class="title-screen" style="background:rgba(0,0,0,.45)"><div class="art">🎁</div></div>`, `<p class="q">🎁 ${esc(tx(q.q))}</p><div class="opts">${opts.map(({ x }, k) => `<button class="opt" type="button" id="o${k}"><span class="em">${x[0]}</span><span>${esc(isMs() ? x[1] : x[2])}</span></button>`).join('')}</div>`);
      opts.forEach(({ i }, k) => { $('o' + k).onclick = () => {
        $('below').querySelectorAll('.opt').forEach(b => b.disabled = true);
        const ok = i === q.a; $('o' + k).classList.add(ok ? 'right' : 'wrong');
        if (ok) { SFX.win(); HS.buang(e.id); st.stars += 3; gainXP(15); save(); }
        else { SFX.bad(); opts.forEach(({ i: j }, kk) => { if (j === q.a) $('o' + kk).classList.add('right'); }); }
        $('below').insertAdjacentHTML('beforeend', `<div class="why"><b>${esc(ok ? (isMs() ? 'Peti terbuka! +3 ⭐' : 'Chest opened! +3 ⭐') : (isMs() ? 'Peti masih berkunci. Cuba lagi nanti.' : 'Still locked. Try again later.'))}</b> ${esc(tx(q.why))}</div><div class="row"><button class="btn" id="cb" type="button" data-adv>OK ▶</button></div>`);
        $('cb').focus(); $('cb').onclick = () => { closeOv(); res(ok); };
      }; });
    });
  }

  // Skrin mini game (gaya Makmal Mini). bina(el, selesai) melukis isi; panggil selesai(true) bila menang.
  HS.mini = ({ tajuk, sub, bina }) => new Promise(res => {
    openOv('arcade', `<div class="arcade-screen"><div class="arcade-top"><button class="back" type="button" id="miniBack">← ${esc(isMs() ? 'Kembali' : 'Back')}</button><span class="counter" id="miniCount"></span></div>
      <div class="mini-head"><h2>${esc(tx(tajuk))}</h2>${sub ? `<p class="arcade-sub">${esc(tx(sub))}</p>` : ''}</div><div class="mini-scene" id="miniScene"></div></div>`);
    $('controls').hidden = true;
    const done = ok => { closeOv(); res(!!ok); };
    $('miniBack').onclick = () => done(false);
    bina($('miniScene'), done, t => { $('miniCount').textContent = t; });
  });

  // ===================== interaksi =====================
  let acting = false;
  async function interact(e) {
    if (acting || mode !== 'world') return; acting = true; held = null; path = [];
    if (e.x !== P.x) P.face = e.x > P.x ? 1 : -1;
    try {
      if (cfg.bual) { const r = await cfg.bual(e); if (r !== false) return; }
      if (e.kind === 'sign') await dialog(typeof e.teks === 'function' ? e.teks() : e.teks);
      else if (e.kind === 'chest') { await dialog([S('peti', 'Sebuah peti harta! Jawab soalan untuk membukanya.', 'A treasure chest! Answer the question to open it.')]); await chest(e); }
      else if (e.kind === 'exit') await keluar(e);
      else if (e.teks) await dialog(typeof e.teks === 'function' ? e.teks() : e.teks);
    } finally { acting = false; hud(); }
  }
  HS.interact = interact;
  HS.bualTerus = async e => { if (cfg.bual) await cfg.bual(e); };   // dari dalam bual(): terus ke watak lain
  async function keluar(e) {
    if (e.tutup && e.tutup()) { await dialog(typeof e.tutupTeks === 'function' ? e.tutupTeks() : e.tutupTeks); P.from = [P.x, P.y]; const b = e.balik || [-(e.arah || [1, 0])[0], -(e.arah || [1, 0])[1]]; if (passable(P.x + b[0], P.y + b[1])) { P.x += b[0]; P.y += b[1]; P.t = 0; P.moving = true; } return; }
    pergi(e.ke, e.nama);
  }
  HS.lompat = (x, y) => { P.x = x; P.y = y; P.from = null; P.moving = false; P.px = x * TS; P.py = y * TS; path = []; held = null; D.pos[cfg.id] = [x, y]; save(); };

  // ===================== pindah peta + skrin muat =====================
  const TIPS = [
    L('Magnet menarik besi dan keluli, tetapi tidak menarik kayu atau plastik.', 'Magnets pull iron and steel, but not wood or plastic.'),
    L('Jarum kompas ialah magnet kecil. Ia sentiasa menuding ke arah Utara.', 'A compass needle is a tiny magnet. It always points North.'),
    L('Matahari terbit di Timur dan terbenam di Barat.', 'The Sun rises in the East and sets in the West.'),
    L('Bahan yang kurang tumpat daripada air akan terapung.', 'Things less dense than water float.'),
    L('Litar elektrik mesti lengkap supaya mentol menyala.', 'A circuit must be complete for the bulb to light.'),
    L('Logam ialah konduktor. Arus elektrik boleh mengalir melaluinya.', 'Metals are conductors. Electric current can flow through them.'),
    L('Kutub sama menolak, kutub berlainan menarik.', 'Like poles push apart, unlike poles pull together.'),
    L('Tumbuhan memerlukan air, udara dan cahaya matahari untuk hidup.', 'Plants need water, air and sunlight to live.'),
  ];
  function muat(show, info) {
    const m = $('muat'); if (!m) return;
    if (!show) { m.classList.add('pergi'); setTimeout(() => { m.hidden = true; m.classList.remove('pergi'); }, 380); return; }
    m.hidden = false; m.classList.remove('pergi');
    $('muatArt').textContent = info.ikon || '🗺️'; $('muatEye').textContent = info.eyebrow || '';
    $('muatName').textContent = info.nama || ''; $('muatSub').textContent = info.sub || '';
    $('muatTip').textContent = '💡 ' + tx(TIPS[Math.floor(Math.random() * TIPS.length)]);
    $('muatGo').innerHTML = ''; $('muatBar').style.width = '0%';
  }
  function bar(p) { const b = $('muatBar'); if (b) b.style.width = Math.round(p * 100) + '%'; }
  function pergi(ke, nama) {
    if (mode === 'leaving') return; mode = 'leaving';
    D.from = cfg ? cfg.id : null; save();
    if (musicOn) MUSIC.fadeOut();
    muat(true, { ikon: '🧭', eyebrow: isMs() ? 'MENUJU KE' : 'HEADING TO', nama: nama ? tx(nama) : '', sub: isMs() ? 'Sang Kancil menunjuk jalan...' : 'Sang Kancil leads the way...' });
    let p = 0; const iv = setInterval(() => { p = Math.min(1, p + .12); bar(p); }, 60);
    setTimeout(() => { clearInterval(iv); location.href = ke; }, reduce ? 150 : 650);
  }
  HS.pergi = pergi;

  // ===================== mula =====================
  HS.mula = async c => {
    cfg = c; buildDom();
    cv = $('world'); ctx = cv.getContext('2d');
    document.title = `${tx(c.nama)} · Hikayat Sungai Ilmu`;
    // peta
    const rows = typeof c.peta === 'function' ? c.peta() : c.peta;
    ROWS = rows.length; COLS = Math.max(...rows.map(r => r.length));
    map = rows.map(r => r.padEnd(COLS, 'T').split(''));
    ENT = (c.ents || []).map(e => Object.assign({ solid: e.kind !== 'item' && e.kind !== 'exit' }, e));
    (c.ents || []).forEach(e => { if (e.img) wLoad(e.img); });
    Object.assign(WHO, c.watak || {});
    POOLS = c.soalan || {}; FOES = c.musuh || {};
    // muat skrin
    muat(true, { ikon: c.ikon || '🗺️', eyebrow: tx(c.jenis || L('HIKAYAT SUNGAI ILMU', 'HIKAYAT SUNGAI ILMU')), nama: tx(c.nama), sub: tx(c.sub || '') });
    hud(); bindPointer(); new ResizeObserver(fit).observe(cv); fit();
    $('mute').onclick = () => { muted = !muted; try { sessionStorage.setItem('hs-mute', muted ? '1' : '0'); } catch {} MUSIC.setMuted(muted); hud(); };
    $('lang').onclick = () => { lang = isMs() ? 'en' : 'ms'; try { sessionStorage.setItem('hs-lang', lang); } catch {} hud(); };
    $('petaBtn').onclick = () => { if (mode === 'world' || mode === 'load') pergi('peta-wilayah.html', L('Peta Wilayah', 'Region Map')); };
    $('touchAction').onclick = actBtn;
    requestAnimationFrame(frame);
    // tunggu gambar watak (paling lama 2.5 s) sambil bar bergerak
    const imgs = Object.values(HSW), t0 = performance.now();
    await new Promise(r => { const iv = setInterval(() => { const ready = imgs.filter(i => i.complete).length / Math.max(1, imgs.length), tm = (performance.now() - t0) / 900; bar(Math.min(1, Math.min(ready, tm))); if ((ready >= 1 && tm >= 1) || performance.now() - t0 > 2500) { clearInterval(iv); bar(1); r(); } }, 50); });
    // lesen dan urutan cerita
    const go = $('muatGo');
    const btn = (label, fn, cls = '') => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.type = 'button'; b.textContent = label; b.onclick = fn; go.appendChild(b); return b; };
    if (!full) {
      $('muatArt').textContent = '🔒'; $('muatName').textContent = isMs() ? 'Dalam versi penuh' : 'In the full version';
      $('muatSub').textContent = isMs() ? 'Peta baharu ini dibuka dengan lesen versi penuh Hikayat Sungai Ilmu.' : 'This new map opens with the Hikayat Sungai Ilmu full version licence.';
      btn(isMs() ? '🏠 Kembali ke Kampung' : '🏠 Back to the village', () => location.href = 'index.html');
      return;
    }
    if (c.perlu && !c.perlu() && !uji()) {
      const p = c.perluInfo || {};
      $('muatArt').textContent = '🧭'; $('muatName').textContent = tx(p.tajuk || L('Belum boleh ke sini', 'Not yet'));
      $('muatSub').textContent = tx(p.teks || L('Selesaikan misi sebelum ini dahulu.', 'Finish the earlier quest first.'));
      btn(tx(p.butang || L('🗺️ Peta Wilayah', '🗺️ Region Map')), () => location.href = p.ke || 'peta-wilayah.html');
      return;
    }
    // kedudukan pemain
    const from = D.from, sp = c.spawn || {};
    let pos = (from && sp[from]) || D.pos[c.id] || sp.mula;
    if (!pos || solidTile(tileAt(pos[0], pos[1]))) pos = sp.mula;
    P.x = pos[0]; P.y = pos[1]; P.px = P.x * TS; P.py = P.y * TS; if (sp.hadap) P.face = sp.hadap;
    D.at = c.id; D.from = null; if (!D.visited.includes(c.id)) D.visited.push(c.id); D.pos[c.id] = [P.x, P.y]; save();
    btn(isMs() ? '▶ Masuk' : '▶ Enter', async () => {
      musicOn = true; muat(false); mode = 'world'; hud();
      if (c.masuk) { await c.masuk(); hud(); }
    }).setAttribute('data-adv', '');
    setInterval(() => { if (!musicOn || mode === 'leaving') return; MUSIC.play(musicBattle ? 'battle' : (c.muzikDi ? c.muzikDi(P.x, P.y) : c.muzik || 'field')); }, 400);
  };
})();
