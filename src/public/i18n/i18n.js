/* i18n runtime — reads window.CACC_TRANSLATIONS (set by translations.js).
   Applies translations to all [data-i18n] elements, updates document title and
   <html lang>, persists choice to localStorage, wires switcher + toggle button. */
(function () {
  var SUPPORTED = ['en', 'es', 'zh', 'de'];

  function getTranslations() {
    return (typeof window !== 'undefined' && window.CACC_TRANSLATIONS) || {};
  }

  function resolveLanguage(preferred) {
    var t = getTranslations();
    if (preferred && t[preferred]) return preferred;
    var nav = (typeof navigator !== 'undefined' && navigator.language || '').substring(0, 2);
    if (t[nav]) return nav;
    return 'en';
  }

  function applyLanguage(lang) {
    var t = getTranslations();
    lang = resolveLanguage(lang);
    var dict = t[lang] || t['en'] || {};

    document.documentElement.lang = lang;

    if (dict['title']) document.title = dict['title'];

    var elements = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) {
        el.innerHTML = dict[key];
      }
    }

    /* lang-toggle: quick en ↔ es flip; show the other language as label */
    var toggle = document.getElementById('lang-toggle');
    if (toggle) {
      if (lang === 'es') {
        toggle.textContent = 'English';
        toggle.setAttribute('aria-label', 'Switch to English');
      } else {
        toggle.textContent = 'Español';
        toggle.setAttribute('aria-label', 'Switch to Spanish');
      }
    }

    var sel = document.getElementById('lang-switcher');
    if (sel) sel.value = lang;

    try { localStorage.setItem('cacc-lang', lang); } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', function () {
    var saved;
    try { saved = localStorage.getItem('cacc-lang'); } catch (e) {}
    var lang = resolveLanguage(saved);
    applyLanguage(lang);

    var sel = document.getElementById('lang-switcher');
    if (sel) {
      sel.addEventListener('change', function () { applyLanguage(sel.value); });
    }

    var toggle = document.getElementById('lang-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        applyLanguage(document.documentElement.lang === 'es' ? 'en' : 'es');
      });
    }
  });
})();
