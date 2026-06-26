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
  assert.match(text, /logo\.png/);
  assert.match(text, /cacadets\.org\/Cadet\/Ribbon%20Chart\?lang=en/);
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
