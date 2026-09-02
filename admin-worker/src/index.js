import { ADMIN_CSS, ADMIN_HTML, ADMIN_JS } from './ui.js';

const DEFAULT_MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const GITHUB_API_VERSION = '2022-11-28';
const JWKS_TTL_MS = 10 * 60 * 1000;

let jwksCache = null;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function securityHeaders(contentType) {
  const headers = new Headers({
    'Cache-Control': 'no-store, max-age=0',
    'Content-Type': contentType,
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  });

  headers.set(
    'Content-Security-Policy',
    "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; "
      + "frame-src blob:; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"
  );
  return headers;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: securityHeaders('application/json; charset=utf-8')
  });
}

function textAsset(body, contentType) {
  return new Response(body, { headers: securityHeaders(contentType) });
}

function normalizeIssuer(value) {
  if (!value) return '';
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, '');
}

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function decodeJwtJson(value) {
  try {
    return JSON.parse(new TextDecoder().decode(base64UrlToBytes(value)));
  } catch {
    throw new HttpError(401, 'Your admin session is invalid. Please sign in again.');
  }
}

async function getJwks(issuer) {
  if (jwksCache?.issuer === issuer && jwksCache.expiresAt > Date.now()) {
    return jwksCache.keys;
  }

  const response = await fetch(`${issuer}/cdn-cgi/access/certs`, {
    headers: { Accept: 'application/json' }
  });
  if (!response.ok) throw new HttpError(503, 'The admin login service is temporarily unavailable.');

  const body = await response.json();
  if (!Array.isArray(body.keys) || body.keys.length === 0) {
    throw new HttpError(503, 'The admin login service returned no signing keys.');
  }

  jwksCache = { issuer, keys: body.keys, expiresAt: Date.now() + JWKS_TTL_MS };
  return body.keys;
}

async function verifyAccess(request, env) {
  const issuer = normalizeIssuer(env.ACCESS_TEAM_DOMAIN);
  const expectedAudience = String(env.ACCESS_AUD || '').trim();
  if (!issuer || !expectedAudience) {
    throw new HttpError(503, 'The admin login has not been configured yet.');
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) throw new HttpError(401, 'Please sign in through the Hollybush admin login.');

  const parts = token.split('.');
  if (parts.length !== 3) throw new HttpError(401, 'Your admin session is invalid. Please sign in again.');

  const header = decodeJwtJson(parts[0]);
  const payload = decodeJwtJson(parts[1]);
  if (header.alg !== 'RS256' || !header.kid) {
    throw new HttpError(401, 'Your admin session uses an unsupported signature.');
  }

  const keys = await getJwks(issuer);
  const jwk = keys.find(key => key.kid === header.kid && key.kty === 'RSA');
  if (!jwk) throw new HttpError(401, 'Your admin session signing key was not recognised.');

  const publicKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const validSignature = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    publicKey,
    base64UrlToBytes(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
  );
  if (!validSignature) throw new HttpError(401, 'Your admin session signature is invalid.');

  const now = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (normalizeIssuer(payload.iss) !== issuer) throw new HttpError(401, 'Your admin session came from the wrong login service.');
  if (!audiences.includes(expectedAudience)) throw new HttpError(401, 'Your admin session is not valid for this application.');
  if (!Number.isFinite(payload.exp) || payload.exp <= now) throw new HttpError(401, 'Your admin session has expired.');
  if (Number.isFinite(payload.nbf) && payload.nbf > now + 60) throw new HttpError(401, 'Your admin session is not active yet.');
  if (!payload.email || typeof payload.email !== 'string') throw new HttpError(401, 'Your admin login has no email address.');

  return { email: payload.email.toLowerCase() };
}

function githubConfig(env) {
  const owner = String(env.GITHUB_OWNER || '').trim();
  const repo = String(env.GITHUB_REPO || '').trim();
  const branch = String(env.GITHUB_BRANCH || 'main').trim();
  const token = String(env.GITHUB_TOKEN || '').trim();
  const pendingPath = String(env.GITHUB_PENDING_PATH || 'programmes/pending.pdf').trim();

  if (!owner || !repo || !branch || !token) {
    throw new HttpError(503, 'GitHub publishing has not been configured yet.');
  }
  if (pendingPath.startsWith('/') || pendingPath.split('/').includes('..')) {
    throw new HttpError(503, 'The configured staging path is invalid.');
  }

  return { owner, repo, branch, token, pendingPath };
}

function githubHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'User-Agent': 'Hollybush-RFC-programme-admin',
    'X-GitHub-Api-Version': GITHUB_API_VERSION
  };
}

function encodePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

async function githubRequest(config, path, options = {}) {
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}${path}`, {
    ...options,
    headers: { ...githubHeaders(config.token), ...(options.headers || {}) }
  });
  const raw = await response.text();
  let body = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = { message: raw };
  }

  return { response, body };
}

async function getRepositoryFile(config, path) {
  const result = await githubRequest(
    config,
    `/contents/${encodePath(path)}?ref=${encodeURIComponent(config.branch)}`
  );
  if (result.response.status === 404) return null;
  if (!result.response.ok) {
    throw new HttpError(502, `GitHub could not read ${path}: ${result.body?.message || result.response.status}`);
  }
  return result.body;
}

function bytesToBase64(bytes) {
  const chunkSize = 0x8000;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToUtf8(value) {
  const bytes = Uint8Array.from(atob(value.replace(/\s/g, '')), character => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function sha256Version(bytes) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 12);
}

async function uploadProgramme(request, env, identity) {
  const requestUrl = new URL(request.url);
  if (request.headers.get('Origin') !== requestUrl.origin) {
    throw new HttpError(403, 'The upload must be started from this admin page.');
  }

  const maxBytes = Number(env.MAX_UPLOAD_BYTES || DEFAULT_MAX_UPLOAD_BYTES);
  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > maxBytes + 1024 * 1024) {
    throw new HttpError(413, `The upload is larger than ${Math.floor(maxBytes / 1024 / 1024)} MB.`);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    throw new HttpError(400, 'The upload form could not be read.');
  }

  const file = form.get('programme');
  if (!file || typeof file.arrayBuffer !== 'function') throw new HttpError(400, 'Choose a PDF before publishing.');
  if (!/\.pdf$/i.test(file.name || '')) throw new HttpError(400, 'The selected file must end in .pdf.');
  if (file.type && !['application/pdf', 'application/octet-stream'].includes(file.type)) {
    throw new HttpError(400, 'The selected file is not marked as a PDF.');
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length === 0) throw new HttpError(400, 'The selected PDF is empty.');
  if (bytes.length > maxBytes) throw new HttpError(413, `The PDF is larger than ${Math.floor(maxBytes / 1024 / 1024)} MB.`);
  const header = new TextDecoder('latin1').decode(bytes.subarray(0, Math.min(1024, bytes.length)));
  if (!header.includes('%PDF-')) throw new HttpError(400, 'The selected file does not have a valid PDF header.');

  const config = githubConfig(env);
  const version = await sha256Version(bytes);
  const existing = await getRepositoryFile(config, config.pendingPath);
  const body = {
    message: `chore: stage matchday programme (${version})`,
    content: bytesToBase64(bytes),
    branch: config.branch
  };
  if (existing?.sha) body.sha = existing.sha;

  const result = await githubRequest(config, `/contents/${encodePath(config.pendingPath)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (result.response.status === 409) throw new HttpError(409, 'Another programme was uploaded at the same time. Please try again.');
  if (!result.response.ok) {
    throw new HttpError(502, `GitHub rejected the upload: ${result.body?.message || result.response.status}`);
  }

  console.log(JSON.stringify({
    event: 'programme_upload',
    actor: identity.email,
    version,
    bytes: bytes.length,
    commit: result.body?.commit?.sha || null
  }));

  return json({
    ok: true,
    state: 'processing',
    version,
    message: 'Upload accepted. The website is building the new programme.',
    publicUrl: String(env.PUBLIC_PROGRAMME_URL || 'https://hollybush-rugby.co.uk/programme.html')
  }, 202);
}

async function programmeStatus(request, env) {
  const requestedVersion = new URL(request.url).searchParams.get('version');
  if (requestedVersion && !/^[a-f0-9]{12}$/i.test(requestedVersion)) {
    throw new HttpError(400, 'The requested programme version is invalid.');
  }

  const config = githubConfig(env);
  const manifestFile = await getRepositoryFile(config, 'programmes/programme.json');
  let manifest = null;
  if (manifestFile?.content) {
    try {
      manifest = JSON.parse(base64ToUtf8(manifestFile.content));
    } catch {
      throw new HttpError(502, 'The published programme status could not be read.');
    }
  }

  return json({
    ok: true,
    ready: Boolean(requestedVersion && manifest?.version === requestedVersion),
    currentVersion: manifest?.version || null,
    pageCount: manifest?.pageCount || null,
    publicUrl: String(env.PUBLIC_PROGRAMME_URL || 'https://hollybush-rugby.co.uk/programme.html')
  });
}

async function handle(request, env) {
  const identity = await verifyAccess(request, env);
  const url = new URL(request.url);

  if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    return textAsset(ADMIN_HTML, 'text/html; charset=utf-8');
  }
  if (request.method === 'GET' && url.pathname === '/admin.css') {
    return textAsset(ADMIN_CSS, 'text/css; charset=utf-8');
  }
  if (request.method === 'GET' && url.pathname === '/admin.js') {
    return textAsset(ADMIN_JS, 'text/javascript; charset=utf-8');
  }
  if (request.method === 'GET' && url.pathname === '/api/status') {
    return programmeStatus(request, env);
  }
  if (request.method === 'POST' && url.pathname === '/api/programme') {
    return uploadProgramme(request, env, identity);
  }

  return json({ ok: false, error: 'Not found.' }, 404);
}

export default {
  async fetch(request, env) {
    try {
      return await handle(request, env);
    } catch (error) {
      if (error instanceof HttpError) return json({ ok: false, error: error.message }, error.status);
      console.error(error);
      return json({ ok: false, error: 'Something went wrong while publishing the programme.' }, 500);
    }
  }
};
