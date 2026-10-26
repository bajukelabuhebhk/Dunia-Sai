#!/usr/bin/env node
/*
 * Run after adding or changing any file:  node tools/kemas-kini.mjs
 *
 * 1. Adds the Dunia Sai home button and app manifest to every game in /app/<id>/index.html (once).
 * 2. Writes /files.json: every published file with a short hash, grouped into "core" and one group per game.
 *    The service worker uses it to cache games for offline play and to refetch only files that changed.
 * 3. Sets VERSION in /sw.js from that list, so installed apps pick up the new files.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MARK = '<!-- dunia-sai -->';
const SNIPPET = `${MARK}<link rel="manifest" href="/manifest.json"><script src="/shared/js/balik.js" defer></script>`;

// Same list as .assetsignore, plus files the service worker handles itself
const ignore = new Set(
  readFileSync(join(ROOT, '.assetsignore'), 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
);
for (const f of ['files.json', 'sw.js', '_headers', '_redirects', '.assetsignore', 'package.json']) ignore.add(f);

function walk(dir, out = []) {
  for (const name of readdirSync(dir).sort()) {
    const abs = join(dir, name);
    const rel = relative(ROOT, abs).split(sep).join('/');
    if (ignore.has(rel) || ignore.has(name) || name === '.DS_Store') continue;
    if (statSync(abs).isDirectory()) walk(abs, out);
    else out.push(rel);
  }
  return out;
}

// The URL Cloudflare serves a file at: folders end in /, .html is dropped
function urlOf(rel) {
  let p = '/' + rel.split('/').map(encodeURIComponent).join('/');
  if (p.endsWith('/index.html')) return p.slice(0, -10);
  if (p.endsWith('.html')) return p.slice(0, -5);
  return p;
}

// 1. Home button in each game
const games = readdirSync(join(ROOT, 'app')).filter((d) => existsSync(join(ROOT, 'app', d, 'index.html'))).sort();
for (const id of games) {
  const file = join(ROOT, 'app', id, 'index.html');
  const html = readFileSync(file, 'utf8');
  if (html.includes(MARK)) continue;
  const at = html.search(/<\/head>/i);
  if (at < 0) throw new Error(`app/${id}/index.html has no </head>`);
  writeFileSync(file, html.slice(0, at) + SNIPPET + html.slice(at));
  console.log(`+ butang 🏠 ditambah: app/${id}/`);
}

// 2. files.json
const list = { core: { files: {}, bytes: 0 }, games: {} };
for (const id of games) list.games[id] = { files: {}, bytes: 0 };
for (const rel of walk(ROOT)) {
  const buf = readFileSync(join(ROOT, rel));
  const hash = createHash('sha256').update(buf).digest('hex').slice(0, 12);
  const m = rel.match(/^app\/([^/]+)\//);
  const group = m && list.games[m[1]] ? list.games[m[1]] : list.core;
  group.files[urlOf(rel)] = hash;
  group.bytes += buf.length;
}
// The version covers every file and the service worker's own code
const swPath = join(ROOT, 'sw.js');
const sw = readFileSync(swPath, 'utf8');
const swCode = sw.replace(/const VERSION = '[^']*';/, '');
const version = createHash('sha256').update(JSON.stringify(list) + swCode).digest('hex').slice(0, 10);
writeFileSync(join(ROOT, 'files.json'), JSON.stringify({ version, ...list }, null, 1) + '\n');

// 3. Service worker version
const next = sw.replace(/const VERSION = '[^']*';/, `const VERSION = '${version}';`);
if (next === sw && !sw.includes(`'${version}'`)) throw new Error('VERSION line not found in sw.js');
writeFileSync(swPath, next);

const mb = (n) => (n / 1048576).toFixed(1) + ' MB';
console.log(`files.json: core ${Object.keys(list.core.files).length} fail (${mb(list.core.bytes)})`);
for (const id of games) console.log(`  ${id}: ${Object.keys(list.games[id].files).length} fail (${mb(list.games[id].bytes)})`);
console.log(`sw.js VERSION = ${version}`);
