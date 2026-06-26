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

  /* ── Info modals ── */
  const MODAL_CONTENT = {
    leadership: {
      title: 'Leadership',
      body: 'The California Cadet Corps builds leadership skills through its progressive rank structure, where cadets advance from Recruit to officer by demonstrating command presence and sound decision-making. At events like the Leadership Development Conference (LDC) and Summer Encampment, cadets lead real teams through high-pressure challenges, earning authority by earning trust. The habits developed — accountability, initiative, and team-first thinking — transfer directly to military service, college, and civilian careers.',
      sourceHref: 'https://www.cacadets.org',
      sourceLabel: 'cacadets.org',
    },
    citizenship: {
      title: 'Citizenship',
      body: 'Citizenship is one of CACC\'s five core curriculum strands, emphasizing civic responsibility, community service, and a sense of duty to California and the nation. Cadets are expected to participate in service events and demonstrate exemplary conduct in and out of uniform. The Citizenship ribbon is awarded to cadets whose unit commander assesses them as contributing outstanding civic service — one of the most meaningful early awards a new cadet can earn.',
      sourceHref: 'https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en',
      sourceLabel: 'cacadets.org — Ribbon Chart',
    },
    'military-subjects': {
      title: 'Military Subjects',
      body: 'The Military Subjects strand covers drill & ceremonies, land navigation with map and compass, marksmanship safety on the Engagement Skills Trainer (EST), and military courtesies and protocol aligned with U.S. Armed Forces standards. These skills are tested at unit meetings, Annual General Inspections (AGI), promotion board assessments, and major training events throughout the year. Mastering military subjects is required for advancement beyond Recruit.',
      sourceHref: 'https://www.cacadets.org',
      sourceLabel: 'cacadets.org',
    },
    'healthy-living': {
      title: 'Healthy Living',
      body: 'The Healthy Living strand builds physical fitness, nutrition awareness, and mental resilience. Cadets are assessed against Army Physical Fitness Test (APFT) standards for their age and gender, and those who meet or exceed the benchmark earn the Physical Fitness ribbon. Physical Training (PT) is integrated into unit meetings and major events including Summer Encampment, where daily PT and obstacle courses are part of the schedule.',
      sourceHref: 'https://www.cacadets.org',
      sourceLabel: 'cacadets.org',
    },
    academics: {
      title: 'Academics',
      body: 'The Academics strand reinforces classroom achievement alongside cadet skills. CACC\'s curriculum is A-G certified, meaning participation can count toward California\'s college preparatory course requirements. Study habits, goal-setting, and academic performance factor into a cadet\'s overall advancement and leadership profile — demonstrating that the corps expects well-rounded development, not just military bearing.',
      sourceHref: 'https://www.cacadets.org',
      sourceLabel: 'cacadets.org',
    },
    'summer-encampment': {
      title: 'Summer Encampment',
      body: 'Summer Encampment is CACC\'s flagship annual training event, held at Camp San Luis Obispo. Cadets spend approximately two weeks in intensive training that includes physical fitness assessments, drill & ceremonies, barracks inspections, land navigation, leadership reaction courses, and corps-wide competition. It is the single best opportunity for a new cadet to earn multiple ribbons, accelerate rank advancement, and build bonds with cadets from across the state.',
      sourceHref: 'https://www.cacadets.org/Events',
      sourceLabel: 'cacadets.org — Events',
    },
    'drill-competition': {
      title: 'Drill Competition',
      body: 'CACC Drill Competitions are held at both regional and statewide levels, where cadet units compete in armed drill, unarmed drill, color guard, and individual events before a panel of military judges. Competing sharpens precision, discipline, and unit teamwork. Drill Competition is one of the most visible ways a cadet unit earns recognition across the corps, and placing well is a point of pride for both cadets and their commanders.',
      sourceHref: 'https://www.cacadets.org/Events',
      sourceLabel: 'cacadets.org — Events',
    },
    'grizzly-adventure': {
      title: 'Grizzly Adventure / Summer Camp',
      body: 'Grizzly Adventure is an outdoor leadership camp that focuses on experiential challenges including high-ropes courses, team-building exercises, and wilderness survival skills. It complements the Summer Encampment offering for cadets seeking a more outdoor-adventure-oriented CACC-sponsored experience. Participation builds confidence, resilience, and the kind of peer trust that carries over into unit leadership.',
      sourceHref: 'https://www.cacadets.org/Events',
      sourceLabel: 'cacadets.org — Events',
    },
    'wilderness-survival': {
      title: 'Wilderness & Survival Training',
      body: 'CACC\'s Wilderness & Survival Training is a multi-day field course covering land navigation with map and compass, overnight bivouac setup, shelter construction, and backcountry survival skills. Participating cadets are typically eligible to earn the Bivouac ribbon, one of the accessible early awards for new cadets. The course develops the self-reliance and adaptability that the Healthy Living and Military Subjects strands target.',
      sourceHref: 'https://www.cacadets.org/Events',
      sourceLabel: 'cacadets.org — Events',
    },
    marksmanship: {
      title: 'Marksmanship Competition',
      body: 'CACC Marksmanship Competitions are open to cadets of all skill levels who have completed the required safety training. Cadets compete on a live-fire range or the Engagement Skills Trainer (EST) — a virtual marksmanship system that simulates real range conditions. The Marksmanship Training ribbon is one of the more accessible early achievements: complete the safety training and qualify, and it is yours.',
      sourceHref: 'https://www.cacadets.org/Events',
      sourceLabel: 'cacadets.org — Events',
    },
  };

  const overlay = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalAttribution = document.getElementById('modal-attribution');
  const modalClose = document.getElementById('modal-close');

  if (overlay && modalTitle && modalBody && modalAttribution && modalClose) {
    let previousFocus = null;

    function openModal(key) {
      const content = MODAL_CONTENT[key];
      if (!content) return;

      modalTitle.textContent = content.title;
      modalBody.textContent = content.body;
      modalAttribution.innerHTML = 'Source: <a href="' + content.sourceHref + '" target="_blank" rel="noopener">' + content.sourceLabel + '</a>';

      previousFocus = document.activeElement;
      overlay.hidden = false;
      overlay.removeAttribute('aria-hidden');
      modalClose.focus();
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      overlay.hidden = true;
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (previousFocus) {
        previousFocus.focus();
        previousFocus = null;
      }
    }

    document.querySelectorAll('[data-modal]').forEach((btn) => {
      btn.addEventListener('click', () => openModal(btn.getAttribute('data-modal')));
    });

    modalClose.addEventListener('click', closeModal);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay.hidden) closeModal();
    });
  }
})();
