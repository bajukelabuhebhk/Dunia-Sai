/*
 * POST /api/jejak: anonymous visit and play events from /shared/js/jejak.js.
 *
 * Kids use this site, so nothing personal is kept: no IP, no cookie, no stored device id.
 * A visitor is counted with a hash of (IP, browser, day, secret) that changes every day,
 * so one person can be counted once per day but never followed across days.
 *
 * Needs a D1 binding named DB and the secret PANTAU_KUNCI (Cloudflare Pages settings).
 */
const TYPES = new Set(['lawat', 'main', 'tempoh', 'wa']);
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp|telegram/i;
const MYT = 8 * 3600 * 1000;

export const SKEMA = [
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    ts INTEGER NOT NULL,
    day TEXT NOT NULL,
    type TEXT NOT NULL,
    page TEXT NOT NULL,
    game TEXT,
    visitor TEXT NOT NULL,
    secs INTEGER,
    ref TEXT,
    country TEXT,
    device TEXT,
    app INTEGER NOT NULL DEFAULT 0
  )`,
  'CREATE INDEX IF NOT EXISTS events_day ON events (day, type)',
  'CREATE INDEX IF NOT EXISTS events_ts ON events (ts)',
  // Counters for rate limits (see had()); rows are dropped once their window is over
  `CREATE TABLE IF NOT EXISTS had (
    kunci TEXT PRIMARY KEY,
    n INTEGER NOT NULL,
    tamat INTEGER NOT NULL
  )`,
];

let ready = false;
export async function sediakan(db) {
  if (ready) return;
  await db.batch(SKEMA.map((q) => db.prepare(q)));
  ready = true;
}

export const hariMYT = (ms) => new Date(ms + MYT).toISOString().slice(0, 10);

async function hash(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf).slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/*
 * Rate limit: adds `n` to the counter for `kunci` and returns the new total.
 * A counter starts again from zero once `ms` has passed since it began.
 * The key is a hash of the IP with a secret, so no IP is stored here either.
 */
export async function had(db, kunci, n, ms, now = Date.now()) {
  const row = await db.prepare(
    `INSERT INTO had (kunci, n, tamat) VALUES (?1, ?2, ?3)
     ON CONFLICT(kunci) DO UPDATE SET
       n = CASE WHEN tamat < ?4 THEN ?2 ELSE n + ?2 END,
       tamat = CASE WHEN tamat < ?4 THEN ?3 ELSE tamat END
     RETURNING n`
  ).bind(kunci, n, now + ms, now).first();
  if (Math.random() < 0.02) await db.prepare('DELETE FROM had WHERE tamat < ?').bind(now).run();
  return row ? row.n : n;
}

export const hashIP = (request, label, salt) =>
  hash(`${label}|${request.headers.get('cf-connecting-ip') || ''}|${salt}`);

// Most events one internet connection may send in a day. A school or a big family on one wifi
// sends a few hundred; more than this is someone filling the dashboard with fake visits.
const HAD_SEHARI = 2000;

function peranti(ua) {
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
  if (/Mobi|iPhone|Android/i.test(ua)) return 'telefon';
  return 'komputer';
}

const str = (v, max) => (typeof v === 'string' && v ? v.slice(0, max) : null);

export async function onRequestPost({ request, env }) {
  const ok = new Response(null, { status: 204 });
  const ua = request.headers.get('user-agent') || '';
  if (!env.DB || BOT.test(ua)) return ok;

  let body;
  try { body = JSON.parse(await request.text()); } catch (e) { return new Response('bad json', { status: 400 }); }
  const list = Array.isArray(body && body.e) ? body.e.slice(0, 30) : [];
  if (!list.length) return ok;

  const now = Date.now();
  const ip = request.headers.get('cf-connecting-ip') || '';
  const country = (request.cf && request.cf.country) || null;
  const device = peranti(ua);
  const salt = env.PANTAU_KUNCI || 'dunia-sai';
  const visitors = {};

  const rows = [];
  for (const e of list) {
    if (!e || !TYPES.has(e.t)) continue;
    const page = str(e.p, 120);
    if (!page || page[0] !== '/') continue;
    // Events saved while offline carry their own time; accept up to 7 days back
    const ts = Number.isFinite(e.ts) && e.ts <= now && e.ts > now - 7 * 864e5 ? Math.floor(e.ts) : now;
    const day = hariMYT(ts);
    visitors[day] = visitors[day] || (await hash(`${ip}|${ua}|${day}|${salt}`));
    const game = str(e.g, 40);
    const secs = e.t === 'tempoh' ? Math.max(0, Math.min(4 * 3600, Math.round(Number(e.s) || 0))) : null;
    if (e.t === 'tempoh' && !secs) continue;
    rows.push([ts, day, e.t, page, game && /^[a-z0-9-]+$/.test(game) ? game : null, visitors[day], secs,
      str(e.r, 80), country, device, e.a ? 1 : 0]);
  }
  if (!rows.length) return ok;

  await sediakan(env.DB);
  const dipakai = await had(env.DB, 'j:' + (await hashIP(request, hariMYT(now), salt)), rows.length, 864e5, now);
  if (dipakai > HAD_SEHARI) return new Response(null, { status: 429 });
  const stmt = env.DB.prepare(
    'INSERT INTO events (ts, day, type, page, game, visitor, secs, ref, country, device, app) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
  );
  await env.DB.batch(rows.map((r) => stmt.bind(...r)));
  return ok;
}
