(function () {
  var translations = {
    en: {
      title: 'California Cadet Corps — New Cadet Start Guide',
      heading: 'California Cadet Corps',
      tagline: 'Developing Leaders Since 1911',
      welcome: 'Welcome to start.cacadets.org.',
      placeholder: 'This is the placeholder landing page for the California Cadet Corps.',
      health: 'Health check: /healthz'
    },
    es: {
      title: 'Cuerpo de Cadetes de California — Guía para Nuevos Cadetes',
      heading: 'Cuerpo de Cadetes de California',
      tagline: 'Formando Líderes Desde 1911',
      welcome: 'Bienvenido a start.cacadets.org.',
      placeholder: 'Esta es la página de inicio provisional del Cuerpo de Cadetes de California.',
      health: 'Verificación de estado: /healthz'
    },
    zh: {
      title: '加利福尼亚学员团 — 新学员入门指南',
      heading: '加利福尼亚学员团',
      tagline: '自1911年以来培养领袖',
      welcome: '欢迎访问 start.cacadets.org。',
      placeholder: '这是加利福尼亚学员团的临时登录页面。',
      health: '健康检查：/healthz'
    },
    de: {
      title: 'California Cadet Corps — Leitfaden für neue Kadetten',
      heading: 'California Cadet Corps',
      tagline: 'Führungskräfte ausbilden seit 1911',
      welcome: 'Willkommen auf start.cacadets.org.',
      placeholder: 'Dies ist die Platzhalter-Startseite des California Cadet Corps.',
      health: 'Statusprüfung: /healthz'
    }
  };

  function applyLanguage(lang) {
    var dict = translations[lang] || translations['en'];
    document.documentElement.lang = lang;
    if (dict.title) {
      document.title = dict.title;
    }
    var elements = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) {
        el.textContent = dict[key];
      }
    }
    var switcher = document.getElementById('lang-switcher');
    if (switcher) {
      switcher.value = lang;
    }
    try {
      localStorage.setItem('cacc-lang', lang);
    } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', function () {
    var saved;
    try {
      saved = localStorage.getItem('cacc-lang');
    } catch (e) {}
    var navLang = (navigator.language || '').substring(0, 2);
    var lang = saved || (translations[navLang] ? navLang : 'en');
    if (!translations[lang]) lang = 'en';
    applyLanguage(lang);

    var switcher = document.getElementById('lang-switcher');
    if (switcher) {
      switcher.addEventListener('change', function () {
        applyLanguage(switcher.value);
      });
    }
  });
})();
