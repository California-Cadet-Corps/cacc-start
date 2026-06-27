import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

/* Load translations.js by running it with a fake `window` object. */
function loadTranslations() {
  const src = readFileSync(join(ROOT, 'src/public/i18n/translations.js'), 'utf-8');
  const fakeWindow = {};
  const fn = new Function('window', 'globalThis', src);
  fn(fakeWindow, fakeWindow);
  return fakeWindow.CACC_TRANSLATIONS;
}

/* Parse every data-i18n="<key>" value from index.html. */
function extractI18nKeys() {
  const html = readFileSync(join(ROOT, 'src/public/index.html'), 'utf-8');
  const keys = new Set();
  const re = /data-i18n="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    keys.add(m[1]);
  }
  return keys;
}

const translations = loadTranslations();
const htmlKeys = extractI18nKeys();
const languages = Object.keys(translations);

test('translations.js defines at least en and es', () => {
  assert.ok(translations['en'], 'en language must be present');
  assert.ok(translations['es'], 'es language must be present');
});

test('translations.js defines zh and de', () => {
  assert.ok(translations['zh'], 'zh language must be present');
  assert.ok(translations['de'], 'de language must be present');
});

test('index.html has at least one data-i18n attribute', () => {
  assert.ok(htmlKeys.size > 0, 'index.html must contain data-i18n attributes');
});

test('every data-i18n key in index.html exists in all languages', () => {
  const missing = [];
  for (const key of htmlKeys) {
    for (const lang of languages) {
      if (translations[lang][key] === undefined) {
        missing.push(`${lang}["${key}"]`);
      }
    }
  }
  assert.deepEqual(
    missing,
    [],
    `Missing translation keys:\n  ${missing.join('\n  ')}`
  );
});

test('every key in en exists in every other language (no missing keys per language)', () => {
  const enKeys = Object.keys(translations['en']);
  const missing = [];
  for (const lang of languages) {
    if (lang === 'en') continue;
    for (const key of enKeys) {
      if (translations[lang][key] === undefined) {
        missing.push(`${lang}["${key}"]`);
      }
    }
  }
  assert.deepEqual(
    missing,
    [],
    `Keys present in en but missing from other languages:\n  ${missing.join('\n  ')}`
  );
});

test('no language has keys that en does not have (symmetric coverage)', () => {
  const enKeys = new Set(Object.keys(translations['en']));
  const extras = [];
  for (const lang of languages) {
    if (lang === 'en') continue;
    for (const key of Object.keys(translations[lang])) {
      if (!enKeys.has(key)) {
        extras.push(`${lang}["${key}"] (not in en)`);
      }
    }
  }
  assert.deepEqual(
    extras,
    [],
    `Extra keys found in non-en languages that en does not have:\n  ${extras.join('\n  ')}`
  );
});

test('all translation values are non-empty strings', () => {
  const bad = [];
  for (const lang of languages) {
    for (const [key, val] of Object.entries(translations[lang])) {
      if (typeof val !== 'string' || val.trim() === '') {
        bad.push(`${lang}["${key}"] = ${JSON.stringify(val)}`);
      }
    }
  }
  assert.deepEqual(bad, [], `Empty or non-string translation values:\n  ${bad.join('\n  ')}`);
});
