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
  await new Promise((resolve) => server.close(resolve));
});
