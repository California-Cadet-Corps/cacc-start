import { test } from 'node:test';
import assert from 'node:assert/strict';
import server from '../src/server.js';

test('GET /healthz returns ok', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/healthz`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.status, 'ok');
  await new Promise((resolve) => server.close(resolve));
});

test('GET / serves the landing page', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/`);
  const text = await res.text();
  assert.equal(res.status, 200);
  assert.match(text, /California Cadet Corps/);
  assert.match(text, /California Cadet Corp/);
  assert.doesNotMatch(text, /<h1>California Cadet Corps<\/h1>/, 'h1 heading text must not appear on page');
  assert.match(text, /logo\.png/);
  assert.match(text, /cacadets\.org\/Cadet\/Ribbon%20Chart\?lang=en/);
  assert.match(text, /rel="icon"/, 'page must declare a favicon link');
  assert.doesNotMatch(text, /cyber unit 2026 was here/i, 'cyber unit footer must be removed');
  await new Promise((resolve) => server.close(resolve));
});

test('GET /logo.png serves the logo as PNG', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/logo.png`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /image\/png/);
  await new Promise((resolve) => server.close(resolve));
});

test('GET / served HTML has no border on hero or navbar logo image', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/`);
  const text = await res.text();
  assert.doesNotMatch(text, /\.navbar-brand\s+img\s*\{[^}]*border\s*:/);
  assert.doesNotMatch(text, /\.hero-logo\s*\{[^}]*border\s*:/);
  await new Promise((resolve) => server.close(resolve));
});

test('GET / contains all required section anchors', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/`);
  const text = await res.text();
  assert.equal(res.status, 200);
  assert.match(text, /id="about"/);
  assert.match(text, /id="ranks"/);
  assert.match(text, /id="ribbons"/);
  assert.match(text, /id="events"/);
  assert.match(text, /id="new-cadet"/);
  await new Promise((resolve) => server.close(resolve));
});

test('GET /styles.css returns 200 with text/css content-type', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/styles.css`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/css/);
  await new Promise((resolve) => server.close(resolve));
});

test('GET /app.js returns 200 with text/javascript content-type', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/app.js`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/javascript/);
  await new Promise((resolve) => server.close(resolve));
});

test('GET / Rank Structure links use the corrected canonical URL', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/`);
  const text = await res.text();
  assert.match(text, /cacadets\.org\/Cadet\/Rank%20Structure\?lang=en/, 'corrected Rank Structure URL must be present');
  assert.doesNotMatch(text, /cacadets\.org\/Cadet\/Rank-Structure/, 'old hyphenated Rank-Structure URL must not appear');
  await new Promise((resolve) => server.close(resolve));
});

test('responsive contract: viewport meta and @media rule present', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const [htmlRes, cssRes] = await Promise.all([
    fetch(`http://localhost:${port}/`),
    fetch(`http://localhost:${port}/styles.css`),
  ]);
  const html = await htmlRes.text();
  const css = await cssRes.text();
  assert.match(html, /width=device-width/, 'viewport meta must be present');
  assert.match(css, /@media/, 'at least one @media rule must be present in styles.css');
  await new Promise((resolve) => server.close(resolve));
});

test('GET /ribbons/perfect-attendance.png serves a ribbon image with 200 and image/png content-type', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/ribbons/perfect-attendance.png`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /image\/png/);
  await new Promise((resolve) => server.close(resolve));
});

test('GET / contains ribbon <img> elements sourced from /ribbons/', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/`);
  const text = await res.text();
  assert.equal(res.status, 200);
  assert.match(text, /ribbons\//, 'page must reference a file under /ribbons/');
  assert.match(text, /<img[^>]+src="\/ribbons\/[^"]+\.png"/, 'page must contain an <img> with a ribbons/ src');
  await new Promise((resolve) => server.close(resolve));
});


test('GET / contains official cacadets.org links and no bare placeholder href', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/`);
  const text = await res.text();
  assert.equal(res.status, 200);
  assert.match(text, /href="https:\/\/cacadets\.org\/"/, 'page must link to https://cacadets.org/');
  assert.doesNotMatch(text, /href="#"/, 'page must not contain bare placeholder href="#"');
  assert.doesNotMatch(text, /href="https?:\/\/example\.com/, 'page must not contain example.com links');
  await new Promise((resolve) => server.close(resolve));
});

test('GET / removed sections are gone and the main-site CTA button is present', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/`);
  const text = await res.text();
  assert.equal(res.status, 200);
  assert.doesNotMatch(text, /Quick Links/, 'Quick Links section must be removed');
  assert.doesNotMatch(text, /What You.?ll Do at an Event/, 'What You\'ll Do at an Event section must be removed');
  assert.doesNotMatch(text, /id="official-links"/, 'official-links section id must be removed');
  assert.doesNotMatch(text, /id="at-event"/, 'at-event section id must be removed');
  assert.doesNotMatch(text, /href="https:\/\/cacadets\.org\/Commandant\/HowtoJoin"/, 'the removed How to Join link must not remain');
  assert.match(text, /<a[^>]+class="[^"]*cta-btn-lg[^"]*"[^>]+href="https:\/\/cacadets\.org\/"/, 'a big CTA button must link to https://cacadets.org/');
  await new Promise((resolve) => server.close(resolve));
});

test('GET / Ribbon Chart link uses the corrected URL with %20 and no hyphenated Ribbon-Chart link remains', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/`);
  const text = await res.text();
  assert.match(text, /href="https:\/\/www\.cacadets\.org\/Cadet\/Ribbon%20Chart\?lang=en"/, 'Ribbon Chart href must be exactly https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en');
  assert.doesNotMatch(text, /cacadets\.org\/Cadet\/Ribbon-Chart/, 'old hyphenated Ribbon-Chart URL must not appear');
  await new Promise((resolve) => server.close(resolve));
});

test('GET / contains the Spanish/English language toggle button', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/`);
  const text = await res.text();
  assert.equal(res.status, 200);
  assert.match(text, /<button[^>]+id="lang-toggle"[^>]*>Español<\/button>/, 'page must contain the lang-toggle button with label Español');
  await new Promise((resolve) => server.close(resolve));
});

test('GET / contains buttons with data-modal attribute', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/`);
  const text = await res.text();
  assert.equal(res.status, 200);
  assert.match(text, /<button[^>]+data-modal=/, 'page must contain a button with a data-modal attribute');
  await new Promise((resolve) => server.close(resolve));
});

test('ribbon box layout: cards are flex columns with sized images and wrapping descriptions', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const [htmlRes, cssRes] = await Promise.all([
    fetch(`http://localhost:${port}/`),
    fetch(`http://localhost:${port}/styles.css`),
  ]);
  const html = await htmlRes.text();
  const css = await cssRes.text();
  assert.match(html, /class="ribbon-grid"/, 'page must contain a ribbon-grid container');
  assert.match(html, /class="ribbon-card[^"]*"/, 'page must contain ribbon-card elements');
  assert.match(html, /class="ribbon-img"/, 'page must contain ribbon-img elements');
  assert.match(html, /class="ribbon-body"/, 'page must contain ribbon-body elements');
  assert.match(css, /\.ribbon-card\s*\{[^}]*flex-direction\s*:\s*column/, 'ribbon-card must use flex-direction: column');
  assert.match(css, /\.ribbon-img\s*\{[^}]*object-fit\s*:/, 'ribbon-img must use object-fit to constrain the image');
  await new Promise((resolve) => server.close(resolve));
});

test('ribbon chart button: legible resting state and centered reference block', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const [htmlRes, cssRes] = await Promise.all([
    fetch(`http://localhost:${port}/`),
    fetch(`http://localhost:${port}/styles.css`),
  ]);
  const html = await htmlRes.text();
  const css = await cssRes.text();
  assert.match(
    html,
    /<a class="ribbon-chart-btn" href="https:\/\/www\.cacadets\.org\/Cadet\/Ribbon%20Chart\?lang=en" target="_blank" rel="noopener noreferrer" data-i18n="ribbon-chart-link">/,
    'ribbon chart link must carry the ribbon-chart-btn class with its href/target/rel/data-i18n unchanged'
  );
  assert.match(css, /\.ribbon-ref\s*\{[^}]*text-align\s*:\s*center/, '.ribbon-ref must center its content');
  assert.match(css, /\.ribbon-chart-btn\s*\{[^}]*color\s*:\s*var\(--gold\)/, '.ribbon-chart-btn must use legible gold text at rest');
  assert.match(css, /\.ribbon-chart-btn\s*\{[^}]*border\s*:/, '.ribbon-chart-btn must have a visible border at rest');
  assert.match(css, /\.ribbon-chart-btn:hover\s*\{[^}]*background\s*:\s*var\(--gold\)/, '.ribbon-chart-btn must fill on hover');
  await new Promise((resolve) => server.close(resolve));
});


test('GET / does not contain barracks inspection or alpine tower content', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/`);
  const text = await res.text();
  assert.doesNotMatch(text, /barracks\s+inspection/i, 'page must not mention barracks inspection');
  assert.doesNotMatch(text, /alpine\s+tower/i, 'page must not mention alpine tower');
  assert.doesNotMatch(text, /tower\s+climb/i, 'page must not mention tower climbing');
  await new Promise((resolve) => server.close(resolve));
});

test('GET / events section: titles link to cacadets.org and disclaimer is present', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/`);
  const text = await res.text();
  assert.equal(res.status, 200);
  assert.match(text, /Events NOT guaranteed/, 'events disclaimer must be present');
  assert.match(text, /<em>Events NOT guaranteed<\/em>/, 'disclaimer must be italicized with <em>');
  assert.match(text, /href="https:\/\/cacadets\.org\/Events\/SummerCamp"/, 'Summer Encampment must link to SummerCamp page');
  assert.match(text, /href="https:\/\/cacadets\.org\/Events\/DrillCompetition"/, 'Drill Competition must link to DrillCompetition page');
  assert.match(text, /href="https:\/\/cacadets\.org\/Events\/WSC"/, 'Wilderness Skills must link to WSC page');
  assert.match(text, /XTC/, 'XTC must be present');
  assert.match(text, /Individual Major Awards/, 'Individual Major Awards must be present');
  assert.match(text, /Survival Training/, 'Survival Training must be present');
  assert.doesNotMatch(text, /Grizzly Adventure/, 'Grizzly Adventure card must be removed');
  assert.match(text, /cacadets\.org\/Events\/YTC/, 'full events calendar must point to /Events/YTC');
  await new Promise((resolve) => server.close(resolve));
});

test('GET /i18n.js returns 200 with javascript content-type and includes language codes', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/i18n.js`);
  const text = await res.text();
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /javascript/);
  assert.match(text, /es/, 'i18n.js must include Spanish language code');
  assert.match(text, /zh/, 'i18n.js must include Chinese language code');
  assert.match(text, /de/, 'i18n.js must include German language code');
  await new Promise((resolve) => server.close(resolve));
});

test('GET / contains lang-switcher select and data-i18n attributes', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/`);
  const text = await res.text();
  assert.equal(res.status, 200);
  assert.match(text, /id="lang-switcher"/, 'page must contain lang-switcher select element');
  assert.match(text, /data-i18n=/, 'page must contain at least one data-i18n attribute');
  await new Promise((resolve) => server.close(resolve));
});

test('GET /chain-of-command.html returns 200 and contains Chain of Command', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/chain-of-command.html`);
  const text = await res.text();
  assert.equal(res.status, 200);
  assert.match(text, /Chain of Command/);
  await new Promise((resolve) => server.close(resolve));
});

test('GET / translation toggle covers whole page: Spanish dict strings embedded in HTML', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/`);
  const text = await res.text();
  assert.equal(res.status, 200);
  assert.match(text, /id="lang-toggle"/, 'page must contain lang-toggle element');
  assert.match(text, /Formando L/, 'page must embed at least one Spanish string from the translation dictionary');
  assert.match(text, /Cuerpo de Cadetes de California/, 'Spanish heading must be present in the inline script dictionary');
  assert.match(text, /Bienvenido/, 'page must embed Spanish "Bienvenido" string');
  assert.match(text, /Verificaci/, 'page must embed Spanish "Verificación" string');
  await new Promise((resolve) => server.close(resolve));
});

test('GET / served HTML does not contain class="start-here" anchor', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/`);
  const text = await res.text();
  assert.equal(res.status, 200);
  assert.doesNotMatch(text, /class="start-here"/, 'start-here anchor must not appear in served HTML');
  await new Promise((resolve) => server.close(resolve));
});

test('GET / nav bar contains CACC logo img with local src and descriptive alt text', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/`);
  const text = await res.text();
  assert.equal(res.status, 200);
  assert.match(text, /<nav/, 'page must contain a <nav> element');
  assert.match(text, /src="\/logo\.png"/, 'nav must reference local /logo.png asset');
  assert.match(text, /alt="California Cadet Corps logo"/, 'logo img must have descriptive alt text');
  await new Promise((resolve) => server.close(resolve));
});


test('GET / summer encampment description includes scholarships available', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/`);
  const text = await res.text();
  assert.equal(res.status, 200);
  assert.match(text, /scholarships available/, 'summer encampment description must include "scholarships available"');
  await new Promise((resolve) => server.close(resolve));
});

test('GET / promotion path section: rank insignia images with alt text are present', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/`);
  const text = await res.text();
  assert.equal(res.status, 200);
  assert.match(text, /class="rank-insignia"/, 'rank insignia images must be present');
  assert.match(text, /alt="Recruit rank insignia"/, 'Recruit rank image must have descriptive alt text');
  assert.match(text, /alt="Cadet rank insignia"/, 'Cadet rank image must have descriptive alt text');
  assert.match(text, /alt="Cadet First Class rank insignia"/, 'Cadet First Class rank image must have descriptive alt text');
  assert.match(text, /alt="Cadet Corporal rank insignia"/, 'Cadet Corporal rank image must have descriptive alt text');
  assert.match(text, /cacadets\.org\/files\/cacc\/Ranks\//, 'rank images must be sourced from cacadets.org Supabase-backed image storage');
  assert.doesNotMatch(text, /linodeobjects\.com/, 'rank images must not reference the retired Linode object storage');
  await new Promise((resolve) => server.close(resolve));
});

test('GET / lang-switcher select has Spanish option and dark-text styling', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const [htmlRes, cssRes] = await Promise.all([
    fetch(`http://localhost:${port}/`),
    fetch(`http://localhost:${port}/`),
  ]);
  const text = await htmlRes.text();
  assert.equal(htmlRes.status, 200);
  assert.match(text, /<select[^>]+id="lang-switcher"/, 'lang-switcher must be a <select> element');
  assert.match(text, /<option[^>]+value="es"/, 'lang-switcher must include a Spanish option');
  assert.match(text, /Espa/, 'lang-switcher Spanish option must include Español label');
  assert.match(text, /#lang-switcher\s+option\s*\{[^}]*color\s*:\s*#[0-9a-fA-F]/, 'option elements must have explicit dark text color to avoid white-on-white');
  await new Promise((resolve) => server.close(resolve));
});
