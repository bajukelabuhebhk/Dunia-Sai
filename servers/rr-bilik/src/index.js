// Robot Rumble 3D · Server Bilik Multiplayer (rr-bilik)
// Satu Durable Object setiap bilik (kod 4 huruf). Server hanya kongsi kedudukan robot;
// fizik dikira di peranti setiap pemain. Tiada chat teks: nama ditapis, reaksi emoji sahaja.

const CODE_CHARS = 'BCDFGHJKLMNPQRSTVWXZ'; // tiada vokal: elak perkataan tidak sesuai
const MAX_PLAYERS = 8;
const COLOURS = ['#f59e0b', '#38bdf8', '#34d399', '#f472b6', '#a78bfa', '#f87171', '#facc15', '#2dd4bf'];
const EMOJI = ['👍', '😄', '😮', '🔥', '🏁', '👋'];
const MISSION_RE = /^M\d{2}$/;
const RACE_TIMEOUT_MS = 240000;   // had masa lumba
const AFTER_FIRST_MS = 45000;     // selepas orang pertama tamat, tunggu lagi 45 s

const json = (o, status = 200) => new Response(JSON.stringify(o), {
  status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
});

function newCode() {
  let c = '';
  const b = crypto.getRandomValues(new Uint8Array(4));
  for (const x of b) c += CODE_CHARS[x % CODE_CHARS.length];
  return c;
}
function cleanName(n) {
  n = String(n || '').normalize('NFKC').replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 12);
  return n || 'Jurutera';
}
const PART_KEYS = ['chassis', 'wheels', 'motor', 'battery', 'drive', 'steer', 'cargo', 'tool', 'paint'];
function cleanBuild(b) {
  const o = {};
  if (b && typeof b === 'object') for (const k of PART_KEYS) if (typeof b[k] === 'string' && /^[a-z0-9]{1,12}$/.test(b[k])) o[k] = b[k];
  for (const k of ['ir', 'sonar', 'gyro', 'solar']) if (b && b[k] === true) o[k] = true;
  return o;
}
const num = (v, lo, hi) => (typeof v === 'number' && isFinite(v)) ? Math.max(lo, Math.min(hi, v)) : 0;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST', 'access-control-allow-headers': 'content-type' } });
    if (url.pathname === '/') return json({ ok: true, nama: 'rr-bilik' });
    if (url.pathname === '/bilik/baru') {
      // cari kod yang belum digunakan
      for (let i = 0; i < 6; i++) {
        const code = newCode();
        const stub = env.BILIK.get(env.BILIK.idFromName(code));
        const r = await stub.fetch('https://bilik/status');
        const s = await r.json();
        if (!s.used) return json({ code });
      }
      return json({ error: 'sibuk' }, 503);
    }
    const m = url.pathname.match(/^\/bilik\/([A-Z]{4})\/ws$/);
    if (m) {
      if (req.headers.get('Upgrade') !== 'websocket') return new Response('perlu websocket', { status: 426 });
      const stub = env.BILIK.get(env.BILIK.idFromName(m[1]));
      return stub.fetch(new Request('https://bilik/ws?code=' + m[1], req));
    }
    return json({ error: 'tiada' }, 404);
  }
};

export class Bilik {
  constructor(state, env) {
    this.state = state;
    this.players = new Map(); // ws -> pemain
    this.code = '';
    this.mission = 'M26';
    this.phase = 'lobi'; // lobi | lumba | keputusan
    this.raceId = 0;
    this.results = [];
    this.lastActive = Date.now();
  }
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/status') return json({ used: this.players.size > 0 });
    this.code = url.searchParams.get('code') || this.code;
    if (this.players.size >= MAX_PLAYERS) return json({ error: 'penuh' }, 409);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    this.attach(server);
    return new Response(null, { status: 101, webSocket: client });
  }
  usedColours() { return new Set([...this.players.values()].map(p => p.col)); }
  attach(ws) {
    const used = this.usedColours();
    const p = { id: crypto.randomUUID().slice(0, 8), name: 'Jurutera', col: COLOURS.find(c => !used.has(c)) || COLOURS[0],
      ready: false, build: {}, joined: false, host: this.players.size === 0, lastEmo: 0, lastPos: 0, done: null };
    this.players.set(ws, p);
    ws.addEventListener('message', ev => this.onMsg(ws, ev.data));
    const bye = () => this.leave(ws);
    ws.addEventListener('close', bye); ws.addEventListener('error', bye);
  }
  leave(ws) {
    const p = this.players.get(ws); if (!p) return;
    this.players.delete(ws);
    if (p.host && this.players.size) [...this.players.values()][0].host = true;
    this.broadcast({ t: 'keluar', id: p.id });
    if (this.phase === 'lumba') this.checkEnd();
    this.sendRoom();
  }
  send(ws, o) { try { ws.send(JSON.stringify(o)); } catch (e) { } }
  broadcast(o, except) { const s = JSON.stringify(o); for (const ws of this.players.keys()) if (ws !== except) { try { ws.send(s); } catch (e) { } } }
  roomInfo() {
    return { t: 'bilik', code: this.code, misi: this.mission, fasa: this.phase,
      pemain: [...this.players.values()].filter(p => p.joined).map(p => ({ id: p.id, nama: p.name, warna: p.col, sedia: p.ready, hos: p.host, binaan: p.build, tamat: p.done })) };
  }
  sendRoom() { for (const [ws, p] of this.players) this.send(ws, Object.assign(this.roomInfo(), { anda: p.id })); }
  onMsg(ws, data) {
    const p = this.players.get(ws); if (!p) return;
    if (typeof data !== 'string' || data.length > 2000) return;
    let m; try { m = JSON.parse(data); } catch (e) { return; }
    this.lastActive = Date.now();
    switch (m.t) {
      case 'masuk':
        p.name = cleanName(m.nama); p.build = cleanBuild(m.binaan); p.joined = true; this.sendRoom(); break;
      case 'binaan':
        p.build = cleanBuild(m.binaan); this.sendRoom(); break;
      case 'misi':
        if (p.host && this.phase !== 'lumba' && MISSION_RE.test(m.misi)) { this.mission = m.misi; for (const q of this.players.values()) q.ready = false; this.sendRoom(); }
        break;
      case 'sedia':
        if (this.phase !== 'lumba') { p.ready = !!m.v; this.sendRoom(); } break;
      case 'mula': {
        if (!p.host || this.phase === 'lumba') break;
        const list = [...this.players.values()].filter(q => q.joined);
        if (!list.every(q => q.ready || q.host)) { this.send(ws, { t: 'ralat', kod: 'belum_sedia' }); break; }
        this.phase = 'lumba'; this.raceId++; this.results = []; this.firstDone = 0;
        for (const q of list) { q.done = null; q.ready = false; }
        this.raceStart = Date.now();
        this.broadcast({ t: 'mula', misi: this.mission, lumba: this.raceId, dalam: 3000 });
        this.sendRoom();
        const rid = this.raceId;
        setTimeout(() => { if (this.raceId === rid && this.phase === 'lumba') this.endRace(); }, RACE_TIMEOUT_MS);
        break;
      }
      case 'pos': {
        if (this.phase !== 'lumba' || p.done) break;
        const now = Date.now(); if (now - p.lastPos < 60) break; p.lastPos = now; // had ~16 mesej/s
        this.broadcast({ t: 'pos', id: p.id, s: num(m.s, -5, 2000), d: num(m.d, -20, 20), w: num(m.w, -7, 7), y: m.y == null ? null : num(m.y, -500, 500), v: num(m.v, -30, 30) }, ws);
        break;
      }
      case 'tamat': {
        if (this.phase !== 'lumba' || p.done || m.lumba !== this.raceId) break;
        const win = m.hasil === 'win';
        p.done = { menang: win, masa: win ? num(m.masa, 0, 999) : null, sebab: win ? '' : String(m.hasil || '').slice(0, 16) };
        this.broadcast({ t: 'tamat', id: p.id, menang: win, masa: p.done.masa });
        if (win && !this.firstDone) {
          this.firstDone = Date.now(); const rid = this.raceId;
          setTimeout(() => { if (this.raceId === rid && this.phase === 'lumba') this.endRace(); }, AFTER_FIRST_MS);
        }
        this.checkEnd();
        break;
      }
      case 'emo': {
        const now = Date.now(); if (now - p.lastEmo < 1500) break; p.lastEmo = now;
        const i = m.i | 0; if (i >= 0 && i < EMOJI.length) this.broadcast({ t: 'emo', id: p.id, i });
        break;
      }
      case 'ping': this.send(ws, { t: 'pong', c: m.c }); break;
    }
  }
  checkEnd() {
    const list = [...this.players.values()].filter(q => q.joined);
    if (list.length && list.every(q => q.done)) this.endRace();
  }
  endRace() {
    const list = [...this.players.values()].filter(q => q.joined);
    const rank = list.map(q => ({ id: q.id, nama: q.name, warna: q.col, menang: !!(q.done && q.done.menang), masa: q.done && q.done.masa, sebab: q.done ? q.done.sebab : 'belum' }))
      .sort((a, b) => (b.menang - a.menang) || ((a.masa ?? 1e9) - (b.masa ?? 1e9)));
    this.phase = 'lobi';
    this.broadcast({ t: 'keputusan', lumba: this.raceId, kedudukan: rank });
    this.sendRoom();
  }
}
