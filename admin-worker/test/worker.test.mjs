import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import test from 'node:test';
import { testDatabase } from '../../shared/test-db.mjs';
import { pinHash } from '../../shared/player-pins.mjs';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const issuer = 'https://hollybush.cloudflareaccess.com';
const audience = 'test-access-audience';
const env = {
  ACCESS_TEAM_DOMAIN: issuer,
  ACCESS_AUD: audience,
  GITHUB_OWNER: 'ConnorHaines',
  GITHUB_REPO: 'connorhaines',
  GITHUB_BRANCH: 'main',
  GITHUB_PENDING_PATH: 'programmes/pending.pdf',
  GITHUB_LATEST_PATH: 'content/latest.json',
  GITHUB_TOKEN: 'test-token',
  PUBLIC_PROGRAMME_URL: 'https://hollybush-rugby.co.uk/programme.html',
  MAX_UPLOAD_BYTES: String(15 * 1024 * 1024)
};

const keyPair = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true,
  ['sign', 'verify']
);
const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
Object.assign(publicJwk, { alg: 'RS256', kid: 'test-key', use: 'sig' });

function base64Url(value) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function accessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', kid: 'test-key', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    aud: [audience],
    email: 'player@example.com',
    exp: now + 300,
    iat: now,
    iss: issuer,
    nbf: now - 5
  }));
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    keyPair.privateKey,
    new TextEncoder().encode(`${header}.${payload}`)
  );
  return `${header}.${payload}.${base64Url(signature)}`;
}

let uploadedBody = null;
let uploadedMetadataBody = null;
let uploadedSocialBody = null;
let publishedVersion = '000000000000';
let latestContent = {
  schemaVersion: 1,
  updatedAt: '',
  facebook: { url: 'https://www.facebook.com/HollybushRfc', title: 'Facebook card', summary: 'Facebook summary' },
  tiktok: { url: 'https://www.tiktok.com/@hollybushrfc/video/123456789', title: 'TikTok card', summary: 'TikTok summary' }
};
const originalFetch = globalThis.fetch;

globalThis.fetch = async (input, options = {}) => {
  const url = String(input);
  if (url === `${issuer}/cdn-cgi/access/certs`) {
    return new Response(JSON.stringify({ keys: [publicJwk] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  if (url.includes('/contents/programmes/pending.pdf')) {
    if ((options.method || 'GET') === 'PUT') {
      uploadedBody = JSON.parse(options.body);
      return new Response(JSON.stringify({ commit: { sha: 'commit-sha' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ message: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  if (url.includes('/contents/programmes/pending.json')) {
    if ((options.method || 'GET') === 'PUT') {
      uploadedMetadataBody = JSON.parse(options.body);
      return new Response(JSON.stringify({ commit: { sha: 'metadata-commit-sha' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ message: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  if (url.includes('/contents/programmes/programme.json')) {
    const manifest = JSON.stringify({ version: publishedVersion, pageCount: 17, title: 'Hollybush RFC v Test RFC', edition: '10 September 2026 · 2026/27' });
    return new Response(JSON.stringify({ content: btoa(manifest) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  if (url.includes('/contents/programmes/archive.json')) {
    const archive = JSON.stringify({ editions: [{ version: 'one' }, { version: 'two' }] });
    return new Response(JSON.stringify({ content: btoa(archive) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  if (url.includes('/contents/content/latest.json')) {
    if ((options.method || 'GET') === 'PUT') {
      uploadedSocialBody = JSON.parse(options.body);
      latestContent = JSON.parse(atob(uploadedSocialBody.content));
      return new Response(JSON.stringify({ commit: { sha: 'social-commit-sha' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ content: btoa(JSON.stringify(latestContent)), sha: 'latest-sha' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  throw new Error(`Unexpected fetch: ${url}`);
};

const worker = (await import('../src/index.js')).default;

async function adminRequest(path, options = {}) {
  const token = await accessToken();
  return new Request(`https://admin.example.workers.dev${path}`, {
    ...options,
    headers: {
      'Cf-Access-Jwt-Assertion': token,
      ...(options.headers || {})
    }
  });
}

test('rejects requests without a Cloudflare Access token', async () => {
  const response = await worker.fetch(new Request('https://admin.example.workers.dev/'), env);
  assert.equal(response.status, 401);
});

test('serves the admin page after validating the Access JWT', async () => {
  const response = await worker.fetch(await adminRequest('/'), env);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Everything that needs keeping fresh/);
  assert.match(html, /Latest From the Bush/);
  assert.match(response.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
});

test('rejects cross-origin uploads', async () => {
  const form = new FormData();
  form.append('programme', new Blob(['%PDF-1.7\n'], { type: 'application/pdf' }), 'programme.pdf');
  form.append('opponent', 'Hafodyrynys RFC');
  form.append('matchDate', '2026-10-31');
  form.append('season', '2026/27');
  const response = await worker.fetch(await adminRequest('/api/programme', {
    method: 'POST',
    headers: { Origin: 'https://example.com' },
    body: form
  }), env);
  assert.equal(response.status, 403);
});

test('stages a validated PDF without exposing the uploader email in GitHub', async () => {
  uploadedBody = null;
  uploadedMetadataBody = null;
  const form = new FormData();
  form.append('programme', new Blob(['%PDF-1.7\n1 0 obj\n'], { type: 'application/pdf' }), 'home-match.pdf');
  form.append('opponent', 'Hafodyrynys RFC');
  form.append('matchDate', '2026-10-31');
  form.append('season', '2026/27');
  const response = await worker.fetch(await adminRequest('/api/programme', {
    method: 'POST',
    headers: { Origin: 'https://admin.example.workers.dev' },
    body: form
  }), env);

  assert.equal(response.status, 202);
  const result = await response.json();
  assert.match(result.version, /^[a-f0-9]{12}$/);
  assert.equal(uploadedBody.branch, 'main');
  assert.doesNotMatch(uploadedBody.message, /player@example\.com/);
  assert.match(atob(uploadedBody.content), /^%PDF-1\.7/);
  const metadata = JSON.parse(atob(uploadedMetadataBody.content));
  assert.equal(metadata.title, 'Hollybush RFC v Hafodyrynys RFC');
  assert.equal(metadata.matchDate, '2026-10-31');
  assert.equal(metadata.season, '2026/27');
  publishedVersion = result.version;
});

test('reports when the generated programme version is live', async () => {
  const response = await worker.fetch(await adminRequest(`/api/status?version=${publishedVersion}`), env);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.ready, true);
  assert.equal(result.pageCount, 17);
});

test('loads the dashboard summary for the signed-in user', async () => {
  const response = await worker.fetch(await adminRequest('/api/dashboard'), env);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.identity, 'player@example.com');
  assert.equal(result.programme.pageCount, 17);
  assert.equal(result.archiveCount, 2);
  assert.equal(result.latest.facebook.title, 'Facebook card');
});

test('publishes validated Facebook and TikTok card links', async () => {
  uploadedSocialBody = null;
  const response = await worker.fetch(await adminRequest('/api/social', {
    method: 'POST',
    headers: { Origin: 'https://admin.example.workers.dev', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      facebook: { url: 'https://www.facebook.com/HollybushRfc/posts/123', title: 'New Facebook post', summary: 'A new result from the weekend.' },
      tiktok: { url: 'https://www.tiktok.com/@hollybushrfc/video/999', title: 'New TikTok clip', summary: 'A quick look behind the scenes.' }
    })
  }), env);

  assert.equal(response.status, 200);
  assert.equal(uploadedSocialBody.sha, 'latest-sha');
  assert.doesNotMatch(uploadedSocialBody.message, /player@example\.com/);
  const written = JSON.parse(atob(uploadedSocialBody.content));
  assert.equal(written.facebook.title, 'New Facebook post');
  assert.equal(written.tiktok.url, 'https://www.tiktok.com/@hollybushrfc/video/999');
  assert.match(written.updatedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('rejects social links from the wrong platform', async () => {
  const response = await worker.fetch(await adminRequest('/api/social', {
    method: 'POST',
    headers: { Origin: 'https://admin.example.workers.dev', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      facebook: { url: 'https://example.com/not-facebook', title: 'Nope', summary: 'This should not publish.' },
      tiktok: { url: 'https://www.tiktok.com/@hollybushrfc/video/999', title: 'TikTok', summary: 'A valid TikTok item.' }
    })
  }), env);
  assert.equal(response.status, 400);
});

test('PIN endpoints require Access and same-origin; reset stores hash only and clears limits', async () => {
  const DB = testDatabase();
  const settings = { ...env, DB, PIN_PEPPER: 'test-only-pepper-at-least-32-characters' };
  const options = {
    method: 'POST', headers: { Origin: 'https://admin.example.workers.dev', 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId: 'connor-haines', pin: '0123' })
  };
  assert.equal((await worker.fetch(new Request('https://admin.example.workers.dev/api/players/pin', options), settings)).status, 401);
  assert.equal((await worker.fetch(await adminRequest('/api/players/pin', { ...options, headers: { Origin: 'https://wrong.example' } }), settings)).status, 403);
  const response = await worker.fetch(await adminRequest('/api/players/pin', options), settings);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, player: 'Connor Haines' });
  const stored = await DB.prepare('SELECT * FROM player_pins').first();
  assert.equal(stored.pin_hash, await pinHash('connor-haines', '0123', stored.pin_salt, settings.PIN_PEPPER));
  await DB.prepare('INSERT INTO player_pin_attempts VALUES (?, 5, 123)').bind('connor-haines').run();
  const reset = await worker.fetch(await adminRequest('/api/players/pin', { ...options, body: JSON.stringify({ playerId: 'connor-haines', pin: '4567' }) }), settings);
  assert.equal(reset.status, 200);
  const updated = await DB.prepare('SELECT * FROM player_pins').first();
  assert.notEqual(updated.pin_hash, stored.pin_hash);
  assert.notEqual(updated.pin_salt, stored.pin_salt);
  assert.equal(await DB.prepare('SELECT * FROM player_pin_attempts').first(), null);
  const list = await worker.fetch(await adminRequest('/api/players/pins'), settings);
  const body = await list.json();
  assert.equal(body.players.find(p => p.id === 'connor-haines').pinSet, 1);
  assert.deepEqual(Object.keys(body.players[0]).sort(), ['id', 'name', 'pinSet']);
  for (const pin of ['123', '12345', 'abcd', 1234]) {
    assert.equal((await worker.fetch(await adminRequest('/api/players/pin', { ...options, body: JSON.stringify({ playerId: 'connor-haines', pin }) }), settings)).status, 400);
  }
});

test.after(() => {
  globalThis.fetch = originalFetch;
});
