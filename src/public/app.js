// Sticky nav active-state tracking + reveal-on-scroll via IntersectionObserver.
// Degrades gracefully when JS is disabled.

(function () {
  'use strict';

  /* ── Mobile nav toggle ── */
  const toggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── Active nav link on scroll ── */
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

  if (sections.length && navAnchors.length && 'IntersectionObserver' in window) {
    const active = new Set();

    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            active.add(entry.target.id);
          } else {
            active.delete(entry.target.id);
          }
        });

        navAnchors.forEach((a) => {
          const id = a.getAttribute('href').slice(1);
          a.classList.toggle('active', active.has(id));
        });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );

    sections.forEach((s) => navObserver.observe(s));
  }

  /* ── Reveal on scroll ── */
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
  } else {
    // No IntersectionObserver — make everything visible immediately.
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
  }
})();
