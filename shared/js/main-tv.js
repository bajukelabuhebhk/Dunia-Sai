/*
 * "Main di TV": show a Dunia Sai game on a TV or monitor, wirelessly.
 *
 *   DSMainTV.buka()   opens a short guide for the device in hand, with the other devices folded below
 *
 * Games run in the browser, so the device's own screen mirroring is the way to put them on a TV:
 * the child keeps playing by touch on the phone or tablet and the TV shows the same screen (sound too).
 * Browsers have no API that starts screen mirroring from a page (the Presentation API opens a second,
 * non-interactive copy of the page instead), so this guide only explains the steps and offers full screen.
 * Works offline. Built in a shadow root so no page CSS can change how it looks.
 */
(function () {
  if (window.DSMainTV) return;
  const ua = navigator.userAgent || '';
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const samsung = /SamsungBrowser|SM-[A-Z0-9]/.test(ua);
  const windows = /Windows/.test(ua);
  const mac = !ios && /Macintosh/.test(ua);
  const chrome = /Chrome\//.test(ua) && !/Edg\/|OPR\/|SamsungBrowser/.test(ua);
  const edge = /Edg\//.test(ua);

  const PERANTI = [
    {
      id: 'android', ikon: '🤖', nama: 'Telefon atau tablet Android',
      tv: 'Chromecast, Google TV, Android TV atau smart TV yang ada Cast / Screen Mirroring',
      langkah: [
        'Pastikan telefon dan TV guna <b>Wi-Fi yang sama</b>.',
        samsung
          ? 'Tarik turun panel atas skrin dua kali, tekan <b>Smart View</b>.'
          : 'Tarik turun panel atas skrin, tekan <b>Cast</b>, <b>Screen Cast</b> atau <b>Smart View</b> (Samsung). Jika tiada, buka apps <b>Google Home</b> dan pilih <b>Cast my screen</b>.',
        'Pilih nama TV anda, kemudian tekan <b>Mula sekarang</b>.',
      ],
    },
    {
      id: 'ios', ikon: '🍎', nama: 'iPhone atau iPad',
      tv: 'Apple TV atau smart TV yang ada AirPlay (banyak TV Samsung, LG dan Sony)',
      langkah: [
        'Pastikan iPhone/iPad dan TV guna <b>Wi-Fi yang sama</b>.',
        'Buka <b>Pusat Kawalan</b>: leret ke bawah dari bucu kanan atas (iPhone lama: leret ke atas dari bawah).',
        'Tekan <b>Screen Mirroring</b> (dua petak bertindih), pilih TV anda. Masukkan kod yang keluar di TV jika diminta.',
      ],
    },
    {
      id: 'windows', ikon: '💻', nama: 'Laptop Windows',
      tv: 'Smart TV atau dongle yang ada Miracast (Screen Mirroring)',
      langkah: [
        'Hidupkan <b>Screen Mirroring</b> atau <b>Miracast</b> pada TV.',
        'Tekan kekunci <b>Windows + K</b> serentak.',
        'Pilih nama TV anda. Tekan <b>Windows + P</b> dan pilih <b>Duplicate</b> jika skrin TV kosong.',
      ],
    },
    {
      id: 'chrome', ikon: '🌐', nama: 'Google Chrome atau Edge di komputer',
      tv: 'Chromecast, Google TV atau TV yang ada Chromecast built-in',
      langkah: [
        'Pastikan komputer dan TV guna <b>Wi-Fi yang sama</b>.',
        'Tekan menu <b>⋮</b> di bucu kanan atas Chrome, pilih <b>Cast…</b> (Edge: <b>⋯</b> > <b>Lagi alat</b> > <b>Cast media to device</b>).',
        'Pilih <b>Cast tab</b> di bahagian Sumber, kemudian pilih TV anda.',
      ],
    },
    {
      id: 'mac', ikon: '🖥️', nama: 'MacBook atau iMac',
      tv: 'Apple TV atau smart TV yang ada AirPlay',
      langkah: [
        'Pastikan Mac dan TV guna <b>Wi-Fi yang sama</b>.',
        'Klik <b>Pusat Kawalan</b> di bar menu atas, kemudian <b>Screen Mirroring</b>.',
        'Pilih TV anda.',
      ],
    },
    {
      id: 'kabel', ikon: '🔌', nama: 'Tiada Wi-Fi atau TV lama?',
      tv: 'Mana-mana TV atau monitor yang ada port HDMI',
      langkah: [
        'Guna kabel <b>HDMI</b> (laptop) atau penyesuai <b>USB-C ke HDMI</b> / <b>Lightning ke HDMI</b> (telefon dan tablet).',
        'Tukar input TV ke <b>HDMI</b> yang betul dengan remote.',
      ],
    },
  ];
  const utama = ios ? 'ios' : android ? 'android' : (chrome || edge) && !windows && !mac ? 'chrome' : windows ? 'windows' : mac ? 'mac' : null;
  // On a computer, casting one browser tab is easiest; show the system option right after it
  const susunan = (() => {
    const ids = PERANTI.map((p) => p.id);
    let depan = utama ? [utama] : [];
    if ((windows || mac) && (chrome || edge)) depan = ['chrome', windows ? 'windows' : 'mac'];
    return depan.concat(ids.filter((i) => !depan.includes(i))).map((i) => PERANTI.find((p) => p.id === i));
  })();

  const CSS = `
  :host { all: initial; }
  * { box-sizing: border-box; }
  .lapik { position: fixed; inset: 0; z-index: 2147483600; background: rgb(20 26 36 / .55); display: flex; align-items: center; justify-content: center;
    padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom)); font: 16px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif; color: #23314a; }
  .kad { background: #fff8ec; width: 100%; max-width: 480px; max-height: 100%; overflow: auto; border-radius: 22px; padding: 20px 18px 18px; box-shadow: 0 18px 50px rgb(0 0 0 / .35); position: relative; }
  h2 { margin: 0 0 4px; padding: 0 34px; font-size: 1.2rem; text-align: center; }
  p { margin: 0; }
  .redup { color: #5f6b80; font-size: .9rem; text-align: center; }
  .tutup { position: absolute; top: 10px; right: 10px; border: 0; background: #f0e6d4; color: #23314a; width: 36px; height: 36px; border-radius: 50%; font-size: 18px; cursor: pointer; }
  button { font: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .peranti { background: #fff; border-radius: 16px; margin-top: 12px; box-shadow: 0 2px 10px rgb(35 49 74 / .08); }
  .peranti summary { list-style: none; cursor: pointer; padding: 12px 14px; font-weight: 700; display: flex; gap: 10px; align-items: center; }
  .peranti summary::-webkit-details-marker { display: none; }
  .peranti summary::after { content: '▾'; margin-left: auto; color: #5f6b80; transition: transform .15s; }
  .peranti[open] summary::after { transform: rotate(180deg); }
  .peranti .isi { padding: 0 14px 14px; }
  .peranti .tv { font-size: .85rem; color: #5f6b80; margin-bottom: 8px; }
  .peranti ol { margin: 0; padding-left: 22px; }
  .peranti li { margin: 4px 0; }
  .ini { white-space: nowrap; background: #dcf5ea; color: #0a5a44; font-size: .72rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
  .tip { margin-top: 14px; background: #fff1c7; border-radius: 14px; padding: 10px 14px; font-size: .9rem; }
  .tip ul { margin: 4px 0 0; padding-left: 20px; }
  .penuh { border: 0; background: #0f7a5c; color: #fff; font-weight: 700; padding: 12px 22px; border-radius: 999px; margin: 14px auto 0; display: block; box-shadow: 0 4px 0 #0a5a44; }
  .penuh[hidden] { display: none; }
  `;

  function kadPeranti(p, buka) {
    return `<details class="peranti"${buka ? ' open' : ''}><summary><span aria-hidden="true">${p.ikon}</span><span>${p.nama}</span>${buka && p.id === utama ? '<span class="ini">Peranti ini</span>' : ''}</summary>
      <div class="isi"><p class="tv">Untuk: ${p.tv}</p><ol>${p.langkah.map((l) => `<li>${l}</li>`).join('')}</ol></div></details>`;
  }

  let host = null;
  let fokusLama = null;
  function kekunci(e) { if (e.key === 'Escape') { e.stopPropagation(); tutup(); } }
  function tutup() {
    if (!host) return;
    host.remove();
    host = null;
    document.removeEventListener('keydown', kekunci, true);
    if (fokusLama && fokusLama.focus) try { fokusLama.focus(); } catch (e) { /* gone */ }
  }

  function bolehPenuh() {
    const d = document.documentElement;
    return !!(d.requestFullscreen || d.webkitRequestFullscreen) && !document.fullscreenElement && !document.webkitFullscreenElement;
  }
  function skrinPenuh() {
    const d = document.documentElement;
    const p = d.requestFullscreen ? d.requestFullscreen() : d.webkitRequestFullscreen && d.webkitRequestFullscreen();
    if (p && p.catch) p.catch(() => {});
  }

  function buka() {
    if (host) return;
    fokusLama = document.activeElement;
    host = document.createElement('div');
    host.id = 'ds-main-tv';
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${CSS}</style><div class="lapik"><div class="kad" role="dialog" aria-modal="true" aria-labelledby="tj">
      <button class="tutup" type="button" aria-label="Tutup">✕</button>
      <h2 id="tj">📺 Main di TV</h2>
      <p class="redup">Paparkan game di TV atau monitor tanpa wayar. Anak terus main dengan sentuh di telefon atau tablet, TV tunjuk skrin yang sama, dengan bunyi sekali.</p>
      ${susunan.map((p, i) => kadPeranti(p, i === 0 && !!utama)).join('')}
      <div class="tip"><b>Tip:</b><ul>
        <li>Pusingkan telefon atau tablet <b>melintang</b> supaya gambar penuh di TV.</li>
        <li>Kuatkan bunyi dengan remote TV. Game yang sudah disimpan boleh dimain tanpa internet, tetapi TV dan peranti mesti guna Wi-Fi yang sama.</li>
        <li>Untuk berhenti, buka semula menu yang sama dan tekan <b>Stop</b> / <b>Disconnect</b>.</li>
      </ul></div>
      <button class="penuh" type="button" hidden>⛶ Skrin penuh</button>
    </div></div>`;
    const lapik = root.querySelector('.lapik');
    lapik.addEventListener('click', (e) => { if (e.target === lapik) tutup(); });
    // Keep taps inside the guide from reaching a game underneath
    ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'keyup'].forEach((ev) => lapik.addEventListener(ev, (e) => e.stopPropagation()));
    root.querySelector('.tutup').addEventListener('click', tutup);
    const penuh = root.querySelector('.penuh');
    penuh.hidden = !bolehPenuh();
    penuh.addEventListener('click', () => { skrinPenuh(); tutup(); });
    document.body.appendChild(host);
    document.addEventListener('keydown', kekunci, true);
    root.querySelector('.tutup').focus();
  }

  window.DSMainTV = { buka, tutup };
})();
