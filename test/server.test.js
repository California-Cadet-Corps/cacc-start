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
