#!/usr/bin/env node
// Generate licence keys to send to buyers after payment.
//   node tools/keygen.mjs FULL 5     -> five Pakej Lengkap keys
//   node tools/keygen.mjs check SAI-FULL-ABCD-XY
import '../shared/js/config.js';
import '../shared/js/storage.js';

const { EduStore, EDU_CONFIG } = globalThis;
const [cmd, arg] = process.argv.slice(2);
const codes = EDU_CONFIG.PACKAGES.map((p) => p.code);

if (cmd === 'check') {
  const r = EduStore.parseKey(arg);
  console.log(r ? `Valid: ${r.key} (${EduStore.packageInfo(r.pkg).name})` : 'Not a valid key');
  process.exit(r ? 0 : 1);
}

if (!codes.includes(cmd)) {
  console.log(`Usage: node tools/keygen.mjs <${codes.join('|')}> [count]\n       node tools/keygen.mjs check <key>`);
  process.exit(1);
}

const n = Math.max(1, Math.min(500, parseInt(arg || '1', 10)));
for (let i = 0; i < n; i++) console.log(EduStore.generateKey(cmd));
