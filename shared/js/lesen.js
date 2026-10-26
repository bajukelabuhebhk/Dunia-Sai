/*
 * One paste unlocks every game a code is good for.
 * Each game still checks its own licence when it opens; this file only checks the code the same way
 * the game would and saves it under that game's localStorage key. Needs lesen-lib.js and config.js.
 */
(function (global) {
  const DS = global.DS;

  // The licence text in a paste (the code alone, or a whole WhatsApp message)
  function pick(text) {
    return global.KJL2.find(text) || global.KJL.extract(text) || String(text || '').trim();
  }

  // Same rules as the game's own checkLicence()
  function checkFor(game, text) {
    const L = game.lic;
    try {
      const pk2 = global.KJL2.find(text);
      if (pk2) {
        if (!L.pk2) return { ok: false, reason: 'not-in-bundle' };
        return global.KJL2.verify(pk2, L.pk2, DS.LICENCE_KEYS, [], global.nacl);
      }
      if (!L.v1) return { ok: false, reason: 'other-game' };
      return global.KJL.verify(text, L.v1, DS.LICENCE_KEYS, [], global.nacl, !!L.pk1);
    } catch (e) {
      return { ok: false, reason: 'error' };
    }
  }

  function read(key) { try { return global.localStorage.getItem(key); } catch (e) { return null; } }
  function write(key, v) { try { global.localStorage.setItem(key, v); return true; } catch (e) { return false; } }

  // Is this game's full version open on this device?
  function isFull(game) {
    const t = read(game.lic.store);
    return !!t && checkFor(game, t).ok;
  }

  // Returns { unlocked: [game], already: [game], reason } ; reason is set when the code opened nothing
  function activate(text) {
    const code = pick(text);
    const out = { unlocked: [], already: [], reason: null };
    let firstFail = null;
    for (const g of DS.GAMES) {
      const r = checkFor(g, code);
      if (!r.ok) { if (!firstFail || r.reason === 'signature' || r.reason === 'blocked') firstFail = r.reason; continue; }
      if (isFull(g)) { out.already.push(g); continue; }
      if (write(g.lic.store, r.text)) out.unlocked.push(g);
    }
    if (!out.unlocked.length && !out.already.length) out.reason = firstFail || 'format';
    return out;
  }

  global.DSLesen = { pick, checkFor, isFull, activate };
})(typeof window !== 'undefined' ? window : globalThis);
