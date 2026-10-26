/*
 * Dunia Sai — shared UI helpers used by every app
 * sound, speech, toast, tabs, results, licence dialog, service worker
 */
(function (global) {
  const S = () => global.EduStore;

  // ---------- Sound ----------
  const sounds = {};
  function sound(name) {
    if (!S().settings().sound) return;
    try {
      if (!sounds[name]) sounds[name] = new Audio(`/shared/audio/${name}.mp3`);
      const a = sounds[name];
      a.currentTime = 0;
      a.play().catch(() => {});
    } catch (e) {}
  }

  // ---------- Speech (uses the device's Malay voice when available) ----------
  let voice = null;
  function pickVoice() {
    if (!('speechSynthesis' in global)) return;
    const voices = speechSynthesis.getVoices();
    voice = voices.find((v) => /^ms(-|_)?/i.test(v.lang)) ||
            voices.find((v) => /^id(-|_)?/i.test(v.lang)) || null;
  }
  if ('speechSynthesis' in global) {
    pickVoice();
    speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
  }
  function speak(text, lang) {
    if (!S().settings().speech || !('speechSynthesis' in global)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang || (voice ? voice.lang : 'ms-MY');
      if (voice && !lang) u.voice = voice;
      u.rate = 0.85;
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  // ---------- Toast ----------
  let toastEl, toastTimer;
  function toast(msg, ms = 1800) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('tunjuk');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('tunjuk'), ms);
  }

  const PUJIAN = ['Bagus!', 'Hebat!', 'Pandai!', 'Syabas!', 'Betul!', 'Tahniah!'];
  const pujian = () => PUJIAN[Math.floor(Math.random() * PUJIAN.length)];

  // ---------- Small utils ----------
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  // `n` random items from `pool`, always including `must`
  function choices(pool, must, n = 4, eq = (a, b) => a === b) {
    const others = shuffle(pool.filter((x) => !eq(x, must))).slice(0, n - 1);
    return shuffle([must, ...others]);
  }
  const el = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Colour a Latin word: consonants blue, vowels red
  function colourWord(word) {
    return [...word].map((ch) => /[aeiou]/i.test(ch)
      ? `<span class="v">${esc(ch)}</span>`
      : /[a-z]/i.test(ch) ? `<span class="k">${esc(ch)}</span>` : esc(ch)).join('');
  }

  // ---------- Tabs ----------
  function tabs(root = document) {
    const bar = root.querySelector('.tab-bar');
    if (!bar) return;
    const btns = [...bar.querySelectorAll('button[aria-controls]')];
    function show(id) {
      btns.forEach((b) => {
        const on = b.getAttribute('aria-controls') === id;
        b.setAttribute('aria-selected', on);
        document.getElementById(b.getAttribute('aria-controls')).hidden = !on;
      });
      sound('click');
      if (history.replaceState) history.replaceState(null, '', '#' + id);
      document.dispatchEvent(new CustomEvent('tab:show', { detail: id }));
    }
    btns.forEach((b) => b.addEventListener('click', () => show(b.getAttribute('aria-controls'))));
    const fromHash = location.hash.slice(1);
    show(btns.some((b) => b.getAttribute('aria-controls') === fromHash) ? fromHash : btns[0].getAttribute('aria-controls'));
    return show;
  }

  // ---------- Stars ----------
  function starsFor(correct, total) {
    const r = total ? correct / total : 0;
    return r >= 0.9 ? 3 : r >= 0.7 ? 2 : r >= 0.4 ? 1 : 0;
  }
  function refreshStarCount(moduleId) {
    document.querySelectorAll('[data-bintang]').forEach((n) => {
      n.textContent = S().totalStars(moduleId);
    });
  }

  // Result screen rendered into `container`
  function showResult(container, { moduleId, activityId, correct, total, onAgain, onNext }) {
    const stars = starsFor(correct, total);
    S().recordStars(moduleId, activityId, stars);
    refreshStarCount(moduleId);
    sound(stars >= 2 ? 'correct' : 'click');
    const msg = stars === 3 ? 'Cemerlang!' : stars === 2 ? 'Bagus sekali!' : stars === 1 ? 'Boleh, cuba lagi!' : 'Jom cuba sekali lagi';
    container.innerHTML = `
      <div class="keputusan">
        <div class="bintang" aria-label="${stars} bintang daripada 3">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
        <h2>${msg}</h2>
        <p style="margin-inline:auto">Betul ${correct} daripada ${total}</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-garis" data-ulang>Main lagi</button>
          ${onNext ? '<button class="btn" data-seterus>Seterusnya</button>' : ''}
        </div>
      </div>`;
    container.querySelector('[data-ulang]').onclick = onAgain;
    if (onNext) container.querySelector('[data-seterus]').onclick = onNext;
    speak(msg);
  }

  // ---------- Licence dialog ----------
  let dlg;
  function licenceDialog(moduleId, onUnlocked) {
    const mod = (global.EDU_CONFIG.MODULES || []).find((m) => m.id === moduleId);
    if (!dlg) {
      dlg = el(`
        <dialog aria-labelledby="lesen-tajuk">
          <form method="dialog" novalidate>
            <h2 id="lesen-tajuk">Buka semua kandungan</h2>
            <p data-teks></p>
            <label for="lesen-kod" style="font-weight:700">Kod lesen</label>
            <input id="lesen-kod" class="medan" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="SAI-FULL-XXXX-XX" style="margin:6px 0 4px">
            <p data-ralat role="alert" style="color:var(--merah);min-height:1.5em;font-size:var(--t-sm);margin:0 0 12px"></p>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <button class="btn btn-hijau" value="aktif" data-aktif>Aktifkan</button>
              <a class="btn btn-garis" href="/#pakej">Beli kod lesen</a>
              <button class="btn btn-garis" value="tutup" formnovalidate>Tutup</button>
            </div>
          </form>
        </dialog>`);
      document.body.appendChild(dlg);
    }
    dlg.querySelector('[data-teks]').textContent = mod
      ? `Versi percubaan ${mod.name} merangkumi: ${mod.trial}. Masukkan kod lesen untuk membuka semuanya.`
      : 'Masukkan kod lesen yang anda terima melalui WhatsApp.';
    const input = dlg.querySelector('#lesen-kod');
    const err = dlg.querySelector('[data-ralat]');
    input.value = '';
    err.textContent = '';
    dlg.querySelector('[data-aktif]').onclick = (e) => {
      e.preventDefault();
      const res = S().activate(input.value);
      if (!res.ok) { err.textContent = res.error; sound('wrong'); input.focus(); return; }
      if (moduleId && !S().hasAccess(moduleId)) {
        err.textContent = `Kod ini untuk ${res.package.name}, yang tidak termasuk aplikasi ini.`;
        sound('wrong');
        return;
      }
      sound('correct');
      dlg.close();
      toast(res.already ? 'Lesen ini sudah aktif' : `${res.package.name} diaktifkan`);
      onUnlocked && onUnlocked(res);
    };
    dlg.showModal();
    setTimeout(() => input.focus(), 50);
  }

  // Guard for locked content. Returns true if allowed.
  function gate(moduleId, isFree, onUnlocked) {
    if (isFree || S().hasAccess(moduleId)) return true;
    sound('click');
    licenceDialog(moduleId, onUnlocked);
    return false;
  }

  // ---------- Service worker ----------
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    if (location.hostname === 'localhost' && new URLSearchParams(location.search).has('nosw')) return;
    global.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((reg) => {
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          sw && sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              toast('Versi baharu sedia. Buka semula aplikasi untuk mengemas kini.', 4000);
            }
          });
        });
      }).catch(() => {});
    });
  }

  // ---------- Install prompt ----------
  let deferredPrompt = null;
  global.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.querySelectorAll('[data-pasang]').forEach((b) => (b.hidden = false));
  });
  function installApp() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(() => { deferredPrompt = null; });
      return true;
    }
    return false;
  }
  const isStandalone = () =>
    global.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

  // ---------- Module bootstrap ----------
  function initModule(moduleId) {
    document.documentElement.style.setProperty('--accent', `var(${
      (global.EDU_CONFIG.MODULES.find((m) => m.id === moduleId) || {}).color || '--biru'})`);
    refreshStarCount(moduleId);
    tabs();
    registerSW();
  }

  global.EduUI = {
    sound, speak, toast, pujian, shuffle, choices, el, esc, colourWord,
    tabs, starsFor, showResult, refreshStarCount,
    licenceDialog, gate, registerSW, installApp, isStandalone, initModule,
  };
})(window);
