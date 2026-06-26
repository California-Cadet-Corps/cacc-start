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
  assert.match(text, /logo\.png/);
  assert.match(text, /cacadets\.org\/Cadet\/Ribbon%20Chart\?lang=en/);
  assert.match(text, /rel="icon"/, 'page must declare a favicon link');
  assert.match(text, /cacc-logo\.svg/, 'page must reference cacc-logo.svg');
  await new Promise((resolve) => server.close(resolve));
});

test('GET /logo.svg serves the logo as SVG', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/logo.svg`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /image\/svg\+xml/);
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

test('GET /cacc-logo.svg returns 200 with image/svg+xml content-type', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/cacc-logo.svg`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /image\/svg\+xml/);
  await new Promise((resolve) => server.close(resolve));
});

test('GET / contains official cacadets.org links and no bare placeholder href', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://localhost:${port}/`);
  const text = await res.text();
  assert.equal(res.status, 200);
  assert.match(text, /href="https:\/\/cacadets\.org\/"/, 'page must link to https://cacadets.org/');
  assert.match(text, /href="https:\/\/cacadets\.org\/Commandant\/HowtoJoin"/, 'page must link to How to Join');
  assert.doesNotMatch(text, /href="#"/, 'page must not contain bare placeholder href="#"');
  assert.doesNotMatch(text, /href="https?:\/\/example\.com/, 'page must not contain example.com links');
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
