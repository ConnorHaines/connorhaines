#!/usr/bin/env node

import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, 'programme.html'), 'utf8');
const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1]);
const readerScript = inlineScripts.find(script => script.includes("const mobileQuery = window.matchMedia"));
assert(readerScript, 'Could not find the programme reader script.');

const manifest = JSON.parse(readFileSync(resolve(root, 'programmes/programme.json'), 'utf8'));
assert.equal(manifest.pageCount, 17);
assert.equal(manifest.pages.length, manifest.pageCount);
assert.equal(manifest.displayMode, 'trimmed-square');

for (const page of manifest.pages) {
  const relativePage = page.src.split('?')[0];
  const pagePath = resolve(root, relativePage);
  assert(existsSync(pagePath), `Missing ${relativePage}`);
  assert(statSync(pagePath).size > 0, `Empty ${relativePage}`);
}

class MockClassList {
  constructor() { this.values = new Set(); }
  add(value) { this.values.add(value); }
  toggle(value, force) {
    if (force) this.values.add(value);
    else this.values.delete(value);
  }
}

class MockElement {
  constructor(id = '') {
    this.id = id;
    this.hidden = false;
    this.disabled = false;
    this.open = false;
    this.value = '';
    this.max = '';
    this.href = '';
    this.innerHTML = '';
    this.textContent = '';
    this.listeners = new Map();
    this.children = [];
    this.classList = new MockClassList();
    this.style = { setProperty() {} };
  }

  addEventListener(type, handler) {
    const handlers = this.listeners.get(type) || [];
    handlers.push(handler);
    this.listeners.set(type, handlers);
  }

  dispatch(type, event = {}) {
    for (const handler of this.listeners.get(type) || []) handler(event);
  }

  setAttribute(name, value) { this[name] = value; }
  replaceChildren(...children) { this.children = children; }
  querySelectorAll() { return []; }
  getBoundingClientRect() { return { left: 0, width: 1000 }; }
  requestFullscreen() {}
  showModal() { this.open = true; }
  close() { this.open = false; }
}

function createHarness() {
  const ids = [
    'reader-status', 'reader-content', 'error-card', 'reader-stage', 'book-viewport',
    'book', 'turn-layer', 'previous-button', 'next-button', 'mobile-previous',
    'mobile-next', 'page-range', 'page-label', 'programme-title', 'edition-label',
    'download-button', 'share-button', 'fullscreen-button', 'zoom-button',
    'zoom-dialog', 'zoom-image', 'zoom-label', 'zoom-close', 'latest-button',
    'archive-section', 'archive-list'
  ];
  const elements = Object.fromEntries(ids.map(id => [id, new MockElement(id)]));
  elements['reader-content'].hidden = true;
  elements['error-card'].hidden = true;

  const mediaQuery = {
    matches: false,
    listeners: [],
    addEventListener(type, handler) {
      if (type === 'change') this.listeners.push(handler);
    },
    change(matches) {
      this.matches = matches;
      this.listeners.forEach(handler => handler({ matches }));
    }
  };
  const reducedMotion = {
    matches: true,
    addEventListener() {}
  };

  const documentListeners = new Map();
  const localValues = new Map();
  const document = {
    documentElement: new MockElement('document-element'),
    fullscreenElement: null,
    getElementById(id) { return elements[id]; },
    createElement() { return new MockElement(); },
    exitFullscreen() {},
    addEventListener(type, handler) { documentListeners.set(type, handler); }
  };

  const windowListeners = new Map();
  const window = {
    location: { href: 'https://example.test/programme.html', search: '' },
    matchMedia(query) {
      return query.includes('prefers-reduced-motion') ? reducedMotion : mediaQuery;
    },
    addEventListener(type, handler) { windowListeners.set(type, handler); },
    setTimeout(handler) { handler(); return 1; }
  };

  class MockImage {
    constructor() { this.complete = true; this.src = ''; }
    addEventListener() {}
  }

  const context = vm.createContext({
    console,
    document,
    window,
    location: window.location,
    history: { replaceState() {} },
    localStorage: {
      getItem(key) { return localValues.get(key) ?? null; },
      setItem(key, value) { localValues.set(key, value); }
    },
    navigator: {
      clipboard: { async writeText() {} }
    },
    fetch: async url => {
      if (String(url).includes('archive.json')) {
        return {
          ok: true,
          async json() {
            return {
              editions: [{
                version: 'archive-version',
                title: 'Hollybush RFC v Archive RFC',
                opponent: 'Archive RFC',
                matchDate: '2025-01-01',
                season: '2024/25',
                pageCount: 10,
                cover: 'archive-cover.jpg',
                manifest: 'archive-manifest.json'
              }]
            };
          }
        };
      }
      return { ok: true, async json() { return manifest; } };
    },
    Image: MockImage,
    URL,
    URLSearchParams,
    requestAnimationFrame(handler) { handler(); }
  });

  return { context, elements, mediaQuery, windowListeners };
}

const harness = createHarness();
vm.runInContext(readerScript, harness.context, { filename: 'programme-reader-inline.js' });
await new Promise(resolvePromise => setImmediate(resolvePromise));
await new Promise(resolvePromise => setImmediate(resolvePromise));

const el = harness.elements;
assert.equal(el['reader-status'].hidden, true, 'Loading status should hide after startup.');
assert.equal(el['reader-content'].hidden, false, 'Reader should display after startup.');
assert.match(el.book.innerHTML, /Programme page 1/);
assert.equal(el['page-label'].textContent, 'Page 1 of 17');
assert.equal(el['previous-button'].disabled, true);
assert.equal(el['next-button'].disabled, false);
assert.equal(el['archive-section'].hidden, false, 'Archive should display when editions are available.');
assert.match(el['archive-list'].innerHTML, /Archive RFC/);

el['next-button'].dispatch('click');
assert.match(el.book.innerHTML, /Programme page 2/);
assert.match(el.book.innerHTML, /Programme page 3/);
assert.equal(el['page-label'].textContent, 'Pages 2–3 of 17');

el['previous-button'].dispatch('click');
assert.equal(el['page-label'].textContent, 'Page 1 of 17');

el['page-range'].value = '5';
el['page-range'].dispatch('input', { target: el['page-range'] });
assert.equal(el['page-label'].textContent, 'Pages 4–5 of 17');

harness.mediaQuery.change(true);
assert.equal(el['page-label'].textContent, 'Page 4 of 17');
assert.doesNotMatch(el.book.innerHTML, /class="page left"/);

el['mobile-next'].dispatch('click');
assert.equal(el['page-label'].textContent, 'Page 5 of 17');
assert.match(el.book.innerHTML, /Programme page 5/);

const indexHtml = readFileSync(resolve(root, 'index.html'), 'utf8');
assert(indexHtml.includes('href="programme.html"'), 'Homepage should link to the programme.');
assert(indexHtml.indexOf('class="sponsor-strip"') < indexHtml.indexOf('<section id="fixtures">'), 'Sponsor strip should sit above Fixtures.');

const sponsorFiles = [
  'lectogic.png', 'jim-davies.png', 'celtic-lining.png', 'idm.png',
  'specialised-systems.jpg', 'trusted-data-solutions.jpg', 'klo-electrical.png'
];
for (const sponsor of sponsorFiles) {
  assert(existsSync(resolve(root, 'img/sponsors', sponsor)), `Missing sponsor logo ${sponsor}`);
}

const archive = JSON.parse(readFileSync(resolve(root, 'programmes/archive.json'), 'utf8'));
assert.equal(archive.editions.length, 5);
for (const edition of archive.editions) {
  const archivedManifest = JSON.parse(readFileSync(resolve(root, edition.manifest), 'utf8'));
  assert.equal(archivedManifest.version, edition.version);
  assert.equal(archivedManifest.pages.length, archivedManifest.pageCount);
  assert(existsSync(resolve(root, archivedManifest.pdf.split('?')[0])), `Missing archived PDF ${archivedManifest.pdf}`);
  for (const archivedPage of archivedManifest.pages) {
    assert(existsSync(resolve(root, archivedPage.src.split('?')[0])), `Missing archived page ${archivedPage.src}`);
  }
}

console.log('Programme reader tests passed: current reader, season archive, sponsor strip and mobile paging.');
