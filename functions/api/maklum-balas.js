/*
 * Private feedback for the games (borang from /shared/js/maklum-balas.js).
 *
 *   POST   /api/maklum-balas            anyone: { game, bintang 1-5, teks?, siapa? }
 *   GET    /api/maklum-balas?hari=90    owner only (Bearer PANTAU_KUNCI): list + average per game
 *   DELETE /api/maklum-balas?id=12      owner only: remove one entry (spam, rude words)
 *
 * Nothing is ever shown to other visitors: there is no public comment wall, so a bad review
 * cannot sit in front of buyers. Kids use this site, so no name, e-mail, phone, IP or cookie is kept;
 * e-mail addresses, phone numbers and links typed into the text are blanked before saving.
 * Needs the same D1 binding (DB) and secret (PANTAU_KUNCI) as /api/jejak.
 */
import { sediakan as sediakanJejak, hariMYT, had, hashIP } from './jejak.js';
import { semakKunci } from './pantau.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};
const H = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...CORS };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: H });

const TEKS_MAX = 600;
const SIAPA = new Set(['ibubapa', 'cikgu', 'anak', 'lain']);
// Feedback one internet connection may send in a day. A family with a few children sends a handful.
const HAD_SEHARI = 8;
const KEEP_DAYS = 730;
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit/i;

const SKEMA = [
  `CREATE TABLE IF NOT EXISTS maklum_balas (
    id INTEGER PRIMARY KEY,
    ts INTEGER NOT NULL,
    day TEXT NOT NULL,
    game TEXT NOT NULL,
    bintang INTEGER NOT NULL,
    teks TEXT,
    siapa TEXT,
    device TEXT,
    country TEXT,
    app INTEGER NOT NULL DEFAULT 0
  )`,
  'CREATE INDEX IF NOT EXISTS maklum_balas_ts ON maklum_balas (ts)',
];
let ready = false;
async function sediakan(db) {
  await sediakanJejak(db);
  if (ready) return;
  await db.batch(SKEMA.map((q) => db.prepare(q)));
  ready = true;
}

/*
 * Blank out anything that could identify a child or carry spam: e-mail, phone numbers, links.
 * Also drops control characters and squeezes long runs of the same character ("bestttttttt").
 */
export function bersihkan(teks) {
  if (typeof teks !== 'string') return null;
  let t = teks
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F​-‏‪-‮⁦-⁩]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, TEKS_MAX);
  t = t
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[dibuang]')
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, '[dibuang]')
    .replace(/\b[\w-]+\.(?:com|my|net|org|io|xyz|ly|gg|me|link|site|top|info|biz)(?:\/\S*)?/gi, '[dibuang]')
    .replace(/(?:\+?6?0)[\s-]?1\d(?:[\s-]?\d){7,8}/g, '[dibuang]')
    .replace(/\d(?:[\s-]?\d){8,}/g, '[dibuang]')
    .replace(/(.)\1{5,}/gu, '$1$1$1');
  return t || null;
}

function peranti(ua) {
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
  if (/Mobi|iPhone|Android/i.test(ua)) return 'telefon';
  return 'komputer';
}

export const onRequestOptions = () => new Response(null, { status: 204, headers: CORS });

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ralat: 'Belum disediakan.' }, 503);
  const ua = request.headers.get('user-agent') || '';
  if (BOT.test(ua)) return json({ ok: true });
  const raw = await request.text();
  if (raw.length > 4000) return json({ ralat: 'Terlalu panjang.' }, 413);
  let b;
  try { b = JSON.parse(raw); } catch (e) { return json({ ralat: 'bad json' }, 400); }
  if (!b || typeof b !== 'object') return json({ ralat: 'bad json' }, 400);

  // Hidden field only bots fill in: pretend it worked, keep nothing
  if (b.laman) return json({ ok: true });

  const game = typeof b.game === 'string' && /^[a-z0-9-]{1,40}$/.test(b.game) ? b.game : null;
  const bintang = Number(b.bintang);
  if (!game || !Number.isInteger(bintang) || bintang < 1 || bintang > 5) return json({ ralat: 'Pilih bintang 1 hingga 5.' }, 400);
  const teks = bersihkan(b.teks);
  const siapa = SIAPA.has(b.siapa) ? b.siapa : null;

  const now = Date.now();
  // Sent later from the offline queue: keep the time it was written, up to 14 days back
  const ts = Number.isFinite(b.ts) && b.ts <= now && b.ts > now - 14 * 864e5 ? Math.floor(b.ts) : now;
  const db = env.DB;
  await sediakan(db);
  const salt = env.PANTAU_KUNCI || 'dunia-sai';
  const dipakai = await had(db, 'm:' + (await hashIP(request, hariMYT(now), salt)), 1, 864e5, now);
  if (dipakai > HAD_SEHARI) return json({ ralat: 'Terima kasih! Anda sudah hantar banyak maklum balas hari ini. Cuba lagi esok.' }, 429);

  await db.prepare(
    'INSERT INTO maklum_balas (ts, day, game, bintang, teks, siapa, device, country, app) VALUES (?,?,?,?,?,?,?,?,?)'
  ).bind(ts, hariMYT(ts), game, bintang, teks, siapa, peranti(ua), (request.cf && request.cf.country) || null, b.app ? 1 : 0).run();
  if (Math.random() < 0.02) await db.prepare('DELETE FROM maklum_balas WHERE ts < ?').bind(now - KEEP_DAYS * 864e5).run();
  return json({ ok: true }, 201);
}

async function pemilik(request, env) {
  if (!env.PANTAU_KUNCI) return json({ ralat: 'PANTAU_KUNCI belum ditetapkan dalam tetapan Cloudflare Pages.' }, 503);
  if (!env.DB) return json({ ralat: 'Pangkalan data D1 (binding DB) belum disambung.' }, 503);
  await sediakan(env.DB);
  const tolak = await semakKunci(request, env);
  return tolak ? json(tolak.body, tolak.status) : null;
}

export async function onRequestGet({ request, env }) {
  const tolak = await pemilik(request, env);
  if (tolak) return tolak;
  const url = new URL(request.url);
  const hari = [7, 30, 90, 365].includes(Number(url.searchParams.get('hari'))) ? Number(url.searchParams.get('hari')) : 90;
  const dari = Date.now() - hari * 864e5;
  const db = env.DB;
  const [ringkas, senarai] = await db.batch([
    db.prepare(`SELECT game, COUNT(*) AS n, ROUND(AVG(bintang), 2) AS purata,
        SUM(bintang <= 2) AS rendah, SUM(teks IS NOT NULL) AS bertulis
      FROM maklum_balas WHERE ts >= ? GROUP BY game ORDER BY n DESC`).bind(dari),
    db.prepare(`SELECT id, ts, game, bintang, teks, siapa, device, country, app
      FROM maklum_balas WHERE ts >= ? ORDER BY ts DESC LIMIT 300`).bind(dari),
  ]);
  return json({ hari, kini: Date.now(), game: ringkas.results || [], senarai: senarai.results || [] });
}

export async function onRequestDelete({ request, env }) {
  const tolak = await pemilik(request, env);
  if (tolak) return tolak;
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id < 1) return json({ ralat: 'id tidak sah' }, 400);
  await env.DB.prepare('DELETE FROM maklum_balas WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
