import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import test from 'node:test';

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
let publishedVersion = '000000000000';
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
  if (url.includes('/contents/programmes/programme.json')) {
    const manifest = JSON.stringify({ version: publishedVersion, pageCount: 17 });
    return new Response(JSON.stringify({ content: btoa(manifest) }), {
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
  assert.match(await response.text(), /Put the latest programme online/);
  assert.match(response.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
});

test('rejects cross-origin uploads', async () => {
  const form = new FormData();
  form.append('programme', new Blob(['%PDF-1.7\n'], { type: 'application/pdf' }), 'programme.pdf');
  const response = await worker.fetch(await adminRequest('/api/programme', {
    method: 'POST',
    headers: { Origin: 'https://example.com' },
    body: form
  }), env);
  assert.equal(response.status, 403);
});

test('stages a validated PDF without exposing the uploader email in GitHub', async () => {
  uploadedBody = null;
  const form = new FormData();
  form.append('programme', new Blob(['%PDF-1.7\n1 0 obj\n'], { type: 'application/pdf' }), 'home-match.pdf');
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
  publishedVersion = result.version;
});

test('reports when the generated programme version is live', async () => {
  const response = await worker.fetch(await adminRequest(`/api/status?version=${publishedVersion}`), env);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.ready, true);
  assert.equal(result.pageCount, 17);
});

test.after(() => {
  globalThis.fetch = originalFetch;
});
