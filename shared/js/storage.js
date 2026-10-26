/*
 * Dunia Sai — licence & progress engine (localStorage)
 * ---------------------------------------------------------------
 * Everything lives on the device, so the apps work fully offline.
 *
 * Licence key format:  SAI-<PACKAGE>-<XXXX>-<CC>
 *   PACKAGE  a package code from EDU_CONFIG.PACKAGES (FULL, JAWI, ...)
 *   XXXX     4 random characters (A-Z, 2-9)
 *   CC       2-character checksum (see checksum())
 * Generate keys for buyers with:  node tools/keygen.mjs FULL 5
 *
 * Note: client-side keys deter casual sharing; they are not DRM.
 * Anyone who reads this file can work out the scheme.
 */
(function (global) {
  const NS = 'sgield:';
  const KEY_LICENCES = NS + 'licences';
  const KEY_PROFILE = NS + 'profile';
  const KEY_SETTINGS = NS + 'settings';
  const progressKey = (m) => NS + 'progress:' + m;

  // Storage that survives private mode / blocked storage
  const mem = {};
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) {
      return key in mem ? mem[key] : fallback;
    }
  }
  function write(key, value) {
    mem[key] = value;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* in-memory only */ }
    try { global.dispatchEvent(new CustomEvent('sgield:change', { detail: { key } })); } catch (e) {}
  }

  // ---------- Licence ----------
  const SALT = 'sgield-eduplay-2026';
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  function checksum(pkg, body) {
    // FNV-1a 32-bit
    let h = 0x811c9dc5;
    const s = SALT + '|' + pkg + '|' + body;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return ALPHABET[h % 32] + ALPHABET[(h >>> 5) % 32];
  }

  function normalise(key) {
    return String(key || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  // Returns { pkg, key } for a valid key, otherwise null
  function parseKey(input) {
    const flat = normalise(input);
    const m = flat.match(/^SAI([A-Z]{3,4})([A-Z2-9]{4})([A-Z2-9]{2})$/);
    if (!m) return null;
    const [, pkg, body, cc] = m;
    const conf = global.EDU_CONFIG;
    if (!conf || !conf.PACKAGES.some((p) => p.code === pkg)) return null;
    if (checksum(pkg, body) !== cc) return null;
    return { pkg, key: `SAI-${pkg}-${body}-${cc}` };
  }

  function generateKey(pkg) {
    let body = '';
    const rnd = new Uint32Array(4);
    (global.crypto || require('crypto').webcrypto).getRandomValues(rnd);
    for (let i = 0; i < 4; i++) body += ALPHABET[rnd[i] % ALPHABET.length];
    return `SAI-${pkg}-${body}-${checksum(pkg, body)}`;
  }

  function licences() { return read(KEY_LICENCES, []); }

  function activate(input) {
    const parsed = parseKey(input);
    if (!parsed) return { ok: false, error: 'Kod lesen tidak sah. Semak semula huruf dan nombornya.' };
    const list = licences();
    if (list.some((l) => l.key === parsed.key)) {
      return { ok: true, already: true, pkg: parsed.pkg, package: packageInfo(parsed.pkg) };
    }
    list.push({ key: parsed.key, pkg: parsed.pkg, activatedAt: new Date().toISOString() });
    write(KEY_LICENCES, list);
    return { ok: true, pkg: parsed.pkg, package: packageInfo(parsed.pkg) };
  }

  function packageInfo(code) {
    return (global.EDU_CONFIG?.PACKAGES || []).find((p) => p.code === code) || null;
  }

  function unlockedModules() {
    const set = new Set();
    for (const l of licences()) {
      const p = packageInfo(l.pkg);
      if (p) p.modules.forEach((m) => set.add(m));
    }
    return set;
  }

  function hasAccess(moduleId) { return unlockedModules().has(moduleId); }

  function removeLicence(key) {
    write(KEY_LICENCES, licences().filter((l) => l.key !== key));
  }

  // ---------- Progress ----------
  // Shape per module: { stars: {activityId: best}, seen: {itemId: true}, plays: n, lastPlayed }
  function getProgress(moduleId) {
    return read(progressKey(moduleId), { stars: {}, seen: {}, plays: 0, lastPlayed: null });
  }

  function saveProgress(moduleId, data) { write(progressKey(moduleId), data); }

  function update(moduleId, fn) {
    const p = getProgress(moduleId);
    fn(p);
    p.lastPlayed = new Date().toISOString();
    saveProgress(moduleId, p);
    return p;
  }

  // Keep the best score for an activity (0–3 stars)
  function recordStars(moduleId, activityId, stars) {
    return update(moduleId, (p) => {
      p.plays = (p.plays || 0) + 1;
      p.stars[activityId] = Math.max(p.stars[activityId] || 0, stars);
    });
  }

  function markSeen(moduleId, itemId) {
    return update(moduleId, (p) => { p.seen[itemId] = true; });
  }

  function totalStars(moduleId) {
    const ids = moduleId ? [moduleId] : (global.EDU_CONFIG?.MODULES || []).map((m) => m.id);
    return ids.reduce((sum, id) => sum + Object.values(getProgress(id).stars).reduce((a, b) => a + b, 0), 0);
  }

  // 0–1 completion, given how many activities/items a module has
  function completion(moduleId, totalActivities) {
    const p = getProgress(moduleId);
    const earned = Object.values(p.stars).reduce((a, b) => a + b, 0);
    return totalActivities ? Math.min(1, earned / (totalActivities * 3)) : 0;
  }

  function resetProgress(moduleId) {
    const ids = moduleId ? [moduleId] : (global.EDU_CONFIG?.MODULES || []).map((m) => m.id);
    ids.forEach((id) => write(progressKey(id), { stars: {}, seen: {}, plays: 0, lastPlayed: null }));
  }

  // ---------- Profile & settings ----------
  function profile() { return read(KEY_PROFILE, { name: '' }); }
  function setProfile(p) { write(KEY_PROFILE, { ...profile(), ...p }); }
  function settings() { return read(KEY_SETTINGS, { sound: true, speech: true }); }
  function setSettings(s) { write(KEY_SETTINGS, { ...settings(), ...s }); }

  // ---------- Backup (move progress to a new device) ----------
  function exportAll() {
    const out = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith(NS)) out[k] = localStorage.getItem(k);
      }
    } catch (e) {}
    return JSON.stringify({ app: 'sgield-eduplay', v: 1, data: out });
  }

  function importAll(json) {
    const parsed = JSON.parse(json);
    if (parsed.app !== 'sgield-eduplay') throw new Error('Fail sandaran tidak dikenali');
    for (const [k, v] of Object.entries(parsed.data || {})) {
      if (k.startsWith(NS)) { try { localStorage.setItem(k, v); } catch (e) {} }
    }
  }

  global.EduStore = {
    // licence
    activate, parseKey, generateKey, checksum, licences, removeLicence,
    hasAccess, unlockedModules, packageInfo,
    // progress
    getProgress, saveProgress, recordStars, markSeen, totalStars, completion, resetProgress,
    // profile & settings
    profile, setProfile, settings, setSettings,
    // backup
    exportAll, importAll,
  };
})(typeof window !== 'undefined' ? window : globalThis);
