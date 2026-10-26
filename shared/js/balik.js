/*
 * A small "back to Dunia Sai" button on every game page.
 * Installed apps have no browser back button, so children need a way back to the game list.
 * Added to each game by tools/kemas-kini.mjs; the game files themselves stay unchanged otherwise.
 */
(function () {
  if (window.top !== window.self) return;
  function add() {
    if (document.getElementById('ds-balik')) return;
    const a = document.createElement('a');
    a.id = 'ds-balik';
    a.href = '/app/';
    a.setAttribute('aria-label', 'Kembali ke senarai game Dunia Sai');
    a.title = 'Senarai game';
    a.textContent = '🏠';
    a.style.cssText = [
      'position:fixed', 'z-index:2147483000',
      // A small tab on the left edge, mid-height: game menus sit at the top and bottom, rarely here
      'left:0', 'top:50%', 'transform:translateY(-50%)',
      'width:34px', 'height:46px', 'padding-left:env(safe-area-inset-left)', 'border-radius:0 14px 14px 0',
      'display:flex', 'align-items:center', 'justify-content:center',
      'font:18px/1 system-ui,sans-serif', 'text-decoration:none', 'background:rgba(255,255,255,.9)',
      'box-shadow:0 2px 8px rgba(0,0,0,.25)', 'opacity:.8', '-webkit-tap-highlight-color:transparent',
    ].join(';');
    document.body.appendChild(a);
  }
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);

  // Games opened directly (not from the launcher) still get offline support
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {});

  // Anonymous open/play counts for the owner's dashboard (/pantau/)
  const j = document.createElement('script');
  j.src = '/shared/js/jejak.js';
  j.defer = true;
  document.head.appendChild(j);
})();
