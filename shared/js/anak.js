/*
 * Children's names, kept on this device only (no account).
 * Stored as localStorage "ds_anak" = { names: ["Aisyah", "Adam"], active: "Aisyah" }.
 * The games read `active` to greet the child on their front screen; setting a name also fills the
 * name the Kenal Jawi and Kenal ABC certificates use.
 */
(function (global) {
  const KEY = 'ds_anak';
  const MAX = 30;

  function read() {
    try {
      const d = JSON.parse(global.localStorage.getItem(KEY) || '{}');
      const names = Array.isArray(d.names) ? d.names.filter((n) => typeof n === 'string' && n.trim()) : [];
      return { names, active: names.includes(d.active) ? d.active : names[0] || '' };
    } catch (e) {
      return { names: [], active: '' };
    }
  }

  function write(d) {
    try { global.localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* private mode */ }
    syncGames(d.active);
  }

  // Certificates in Kenal Jawi (plain text) and Kenal ABC (JSON text) read their own keys
  function syncGames(name) {
    if (!name) return;
    try {
      global.localStorage.setItem('kj_name', name);
      global.localStorage.setItem('kj_student_name', name);
      global.localStorage.setItem('abc_name', JSON.stringify(name));
    } catch (e) { /* private mode */ }
  }

  const clean = (n) => String(n || '').replace(/\s+/g, ' ').trim().slice(0, MAX);

  function add(name) {
    const n = clean(name);
    if (!n) return read();
    const d = read();
    if (!d.names.includes(n)) d.names.push(n);
    d.active = n;
    write(d);
    return d;
  }

  function choose(name) {
    const d = read();
    if (d.names.includes(name)) { d.active = name; write(d); }
    return d;
  }

  function rename(from, to) {
    const n = clean(to);
    const d = read();
    const i = d.names.indexOf(from);
    if (i < 0 || !n) return d;
    if (d.names.includes(n) && n !== from) d.names.splice(i, 1);
    else d.names[i] = n;
    if (d.active === from) d.active = n;
    write(d);
    return d;
  }

  function remove(name) {
    const d = read();
    d.names = d.names.filter((x) => x !== name);
    if (d.active === name) d.active = d.names[0] || '';
    write(d);
    return d;
  }

  // A family that typed a name in Kenal Jawi before Dunia Sai had names keeps it
  function adoptExisting() {
    const d = read();
    if (d.names.length) return d;
    let old = '';
    try { old = clean(global.localStorage.getItem('kj_name')); } catch (e) { /* none */ }
    return old ? add(old) : d;
  }

  global.DSAnak = { read, add, choose, rename, remove, adoptExisting, MAX };
})(typeof window !== 'undefined' ? window : globalThis);
