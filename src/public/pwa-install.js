/*
 * pwa-install.js — device-aware "Add to Home Screen" nudge (vanilla, no framework).
 *
 * Twin of the React <PWAInstallPrompt/> used in the other CACC apps; identical behavior
 * for the static start.cacadets.org site. Load with:
 *   <script defer src="/pwa-install.js"></script>
 *
 *  - Shows on the visitor's 3rd+ visit (counted once per browser session).
 *  - Android / Chromium: real one-tap Install button via `beforeinstallprompt`.
 *  - iPhone / iPad (Safari): coachmark + arrow to the Share button (no iOS install API).
 *  - Hides when already installed (standalone) and once dismissed (persisted).
 */
(function () {
  'use strict';
  var VISITS_KEY = 'cacc_pwa_visits';
  var DISMISSED_KEY = 'cacc_pwa_dismissed';
  var SESSION_KEY = 'cacc_pwa_counted';
  var SHOW_ON_VISIT = 3;
  var NAVY = '#0d1b3e';
  var GOLD = '#C9A84C';

  function standalone() {
    var mm = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    return Boolean(mm || window.navigator.standalone === true);
  }
  function isIOS() {
    var ua = navigator.userAgent || '';
    var dev = /iphone|ipad|ipod/i.test(ua);
    var ipad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return dev || ipad;
  }

  if (standalone()) return;
  if (localStorage.getItem(DISMISSED_KEY) === '1') return;

  var visits = parseInt(localStorage.getItem(VISITS_KEY) || '0', 10) || 0;
  if (!sessionStorage.getItem(SESSION_KEY)) {
    visits += 1;
    localStorage.setItem(VISITS_KEY, String(visits));
    sessionStorage.setItem(SESSION_KEY, '1');
  }
  var reached = visits >= SHOW_ON_VISIT;
  var deferredEvt = null;

  function dismiss(card) {
    localStorage.setItem(DISMISSED_KEY, '1');
    if (card && card.parentNode) card.parentNode.removeChild(card);
  }

  function injectStyle() {
    if (document.getElementById('caccpwa-style')) return;
    var s = document.createElement('style');
    s.id = 'caccpwa-style';
    s.textContent =
      '@keyframes caccpwa-in{from{opacity:0;transform:translate(-50%,16px)}to{opacity:1;transform:translate(-50%,0)}}' +
      '@keyframes caccpwa-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}' +
      '.caccpwa-arrow{animation:caccpwa-bounce 1.4s ease-in-out infinite}' +
      '@media(prefers-reduced-motion:reduce){.caccpwa-card,.caccpwa-arrow{animation:none!important}}';
    document.head.appendChild(s);
  }

  var SHARE_SVG =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="vertical-align:text-bottom">' +
    '<path d="M12 3l3.5 3.5M12 3L8.5 6.5M12 3v11" stroke="#378ADD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M6 11H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1" stroke="#378ADD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var ARROW_SVG =
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none">' +
    '<path d="M12 4v14M6 12l6 6 6-6" stroke="' + GOLD + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function buildCard(mode) {
    injectStyle();
    var card = document.createElement('div');
    card.className = 'caccpwa-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', 'Install this app');
    card.style.cssText =
      'position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);' +
      'transform:translateX(-50%);width:min(420px,calc(100vw - 24px));background:' + NAVY + ';color:#fff;' +
      'border-radius:14px;border:1px solid ' + GOLD + ';box-shadow:0 10px 40px rgba(0,0,0,.45);' +
      'padding:16px 16px 14px;z-index:2147483000;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;' +
      'animation:caccpwa-in .28s ease-out both';

    var body =
      mode === 'android'
        ? '<p style="margin:0 0 12px;font-size:13.5px;line-height:1.45;color:rgba(255,255,255,.82)">' +
            'Open it in one tap next time — no bookmarks, no browser, and it loads faster.</p>' +
            '<div style="display:flex;gap:8px">' +
            '<button data-act="install" style="background:' + GOLD + ';color:' + NAVY + ';border:none;border-radius:9px;padding:9px 16px;font-weight:700;font-size:14px;cursor:pointer">Install app</button>' +
            '<button data-act="close" style="background:transparent;color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.25);border-radius:9px;padding:9px 14px;font-weight:600;font-size:14px;cursor:pointer">Not now</button>' +
            '</div>'
        : '<p style="margin:0 0 10px;font-size:13.5px;line-height:1.45;color:rgba(255,255,255,.82)">' +
            'Open it in one tap next time — no bookmarks, no browser. Two quick steps in Safari:</p>' +
            '<ol style="margin:0 0 6px;padding-left:18px;font-size:13.5px;line-height:1.7">' +
            '<li>Tap the <strong>Share</strong> button ' + SHARE_SVG + ' below</li>' +
            '<li>Choose <strong>&ldquo;Add to Home Screen&rdquo;</strong></li></ol>';

    card.innerHTML =
      '<button data-act="close" aria-label="Dismiss" style="position:absolute;top:8px;right:10px;background:transparent;border:none;color:rgba(255,255,255,.6);font-size:22px;line-height:1;cursor:pointer;padding:4px">&times;</button>' +
      '<div style="display:flex;gap:12px;align-items:flex-start">' +
      '<div style="font-size:26px;line-height:1;margin-top:2px" aria-hidden="true">📲</div>' +
      '<div style="flex:1;min-width:0">' +
      '<div style="font-weight:700;font-size:16px;margin-bottom:4px">Add this app to your home screen</div>' +
      body +
      '</div></div>' +
      (mode === 'ios'
        ? '<div class="caccpwa-arrow" aria-hidden="true" style="position:absolute;left:50%;bottom:-26px;transform:translateX(-50%)">' + ARROW_SVG + '</div>'
        : '');

    card.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!t) return;
      var act = t.getAttribute('data-act');
      if (act === 'close') dismiss(card);
      if (act === 'install' && deferredEvt) {
        deferredEvt.prompt();
        deferredEvt.userChoice.finally(function () { dismiss(card); });
      }
    });

    document.body.appendChild(card);
  }

  if (isIOS()) {
    if (reached) buildCard('ios');
    return;
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredEvt = e;
    if ((parseInt(localStorage.getItem(VISITS_KEY) || '0', 10) || 0) >= SHOW_ON_VISIT) {
      buildCard('android');
    }
  });
})();
