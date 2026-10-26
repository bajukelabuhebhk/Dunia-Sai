/*
 * GET /api/pantau?hari=7: numbers for the owner's dashboard app (folder /pantau-app).
 * Only answers with the header  Authorization: Bearer <PANTAU_KUNCI>.
 * The app lives on its own address, so any origin may ask; the key is what protects the data.
 */
import { sediakan, hariMYT } from './jejak.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};
const H = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...CORS };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: H });
const KEEP_DAYS = 400;

async function sha(s) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
}
// Compare hashes so the time taken says nothing about the key
async function sama(a, b) {
  const [x, y] = await Promise.all([sha(a), sha(b)]);
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
}

export const onRequestOptions = () => new Response(null, { status: 204, headers: CORS });

export async function onRequestGet({ request, env }) {
  if (!env.PANTAU_KUNCI) return json({ ralat: 'PANTAU_KUNCI belum ditetapkan dalam tetapan Cloudflare Pages.' }, 503);
  const auth = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!(await sama(auth, env.PANTAU_KUNCI))) return json({ ralat: 'Kunci salah.' }, 401);
  if (!env.DB) return json({ ralat: 'Pangkalan data D1 (binding DB) belum disambung.' }, 503);

  const db = env.DB;
  await sediakan(db);
  const url = new URL(request.url);
  const hari = [1, 7, 30, 90].includes(Number(url.searchParams.get('hari'))) ? Number(url.searchParams.get('hari')) : 7;
  const now = Date.now();
  const dari = hariMYT(now - (hari - 1) * 864e5);
  const q = (sql, ...args) => db.prepare(sql).bind(...args);

  // Daily views by hour for "today", by day otherwise (Malaysia time)
  const siri = hari === 1
    ? q(`SELECT CAST(((ts + 28800000) / 3600000) % 24 AS INTEGER) AS k, SUM(type='lawat') AS lawat,
           COUNT(DISTINCT visitor) AS pelawat, SUM(type='main') AS main
         FROM events WHERE day >= ? GROUP BY k ORDER BY k`, dari)
    : q(`SELECT day AS k, SUM(type='lawat') AS lawat, COUNT(DISTINCT visitor) AS pelawat, SUM(type='main') AS main
         FROM events WHERE day >= ? GROUP BY day ORDER BY day`, dari);

  const res = await db.batch([
    q(`SELECT COALESCE(SUM(type='lawat'),0) AS lawat, COUNT(DISTINCT visitor || day) AS pelawat,
          COALESCE(SUM(type='main'),0) AS main, COALESCE(SUM(CASE WHEN type='tempoh' THEN secs END),0) AS saat,
          COALESCE(SUM(type='wa'),0) AS wa
        FROM events WHERE day >= ?`, dari),
    siri,
    q(`SELECT game, SUM(type='lawat') AS buka, COUNT(DISTINCT CASE WHEN type='lawat' THEN visitor || day END) AS orang,
          SUM(type='main') AS main, COALESCE(SUM(CASE WHEN type='tempoh' THEN secs END),0) AS saat
        FROM events WHERE day >= ? AND game IS NOT NULL GROUP BY game ORDER BY buka DESC`, dari),
    q(`SELECT page AS k, COUNT(*) AS n FROM events WHERE day >= ? AND type='lawat' AND game IS NULL
        GROUP BY page ORDER BY n DESC LIMIT 10`, dari),
    q(`SELECT ref AS k, COUNT(*) AS n FROM events WHERE day >= ? AND type='lawat' AND ref IS NOT NULL
        GROUP BY ref ORDER BY n DESC LIMIT 10`, dari),
    q(`SELECT COALESCE(country,'?') AS k, COUNT(DISTINCT visitor) AS n FROM events WHERE day >= ?
        GROUP BY k ORDER BY n DESC LIMIT 8`, dari),
    q(`SELECT device AS k, COUNT(DISTINCT visitor) AS n FROM events WHERE day >= ? GROUP BY device ORDER BY n DESC`, dari),
    q(`SELECT app AS k, COUNT(*) AS n FROM events WHERE day >= ? AND type='lawat' GROUP BY app`, dari),
    q(`SELECT COUNT(DISTINCT visitor) AS n, GROUP_CONCAT(DISTINCT game) AS games FROM events WHERE ts > ?`, now - 5 * 60e3),
    q(`SELECT ts, type, page, game, secs, country, device, app FROM events ORDER BY ts DESC LIMIT 30`),
  ]);
  const r = res.map((x) => x.results || []);

  // Keep the table small: drop events older than KEEP_DAYS, at most once in a while
  if (Math.random() < 0.05) await q('DELETE FROM events WHERE ts < ?', now - KEEP_DAYS * 864e5).run();

  return json({
    hari, dari, kini: now,
    jumlah: r[0][0],
    siri: r[1],
    game: r[2],
    halaman: r[3],
    rujukan: r[4],
    negara: r[5],
    peranti: r[6],
    apps: r[7],
    langsung: { pelawat: r[8][0].n, game: r[8][0].games ? r[8][0].games.split(',') : [] },
    terkini: r[9],
  });
}
