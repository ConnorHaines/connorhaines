import { PLAYER_CSS, PLAYER_HTML, PLAYER_JS } from './ui.js';

const FIXTURES_URL = 'https://hollybush-rugby.co.uk/fixtures.json';

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function headers(contentType) {
  const value = new Headers({
    'Cache-Control': 'no-store, max-age=0',
    'Content-Type': contentType,
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  });
  value.set(
    'Content-Security-Policy',
    "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; "
      + "img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"
  );
  return value;
}

function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: headers('application/json; charset=utf-8') });
}

function asset(value, contentType) {
  return new Response(value, { headers: headers(contentType) });
}

function database(env) {
  if (!env.DB) throw new HttpError(503, 'Availability storage has not been connected yet.');
  return env.DB;
}

function londonDate() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return values.year + '-' + values.month + '-' + values.day;
}

async function nextFixture() {
  const response = await fetch(FIXTURES_URL, {
    headers: { Accept: 'application/json' },
    cf: { cacheTtl: 300, cacheEverything: true }
  });
  if (!response.ok) throw new HttpError(502, 'The next fixture could not be loaded.');
  const data = await response.json();
  const today = londonDate();
  const fixture = (Array.isArray(data.fixtures) ? data.fixtures : [])
    .filter(item => item.hollybushPlaying && item.date >= today)
    .sort((a, b) => (a.date + (a.kickoff || '')).localeCompare(b.date + (b.kickoff || '')))[0];
  if (!fixture) throw new HttpError(404, 'There is no upcoming Hollybush fixture listed yet.');
  const home = String(fixture.home);
  const away = String(fixture.away);
  return {
    id: String(fixture.id),
    date: String(fixture.date),
    kickoff: String(fixture.kickoff || '14:30'),
    competition: String(fixture.competition || 'Fixture'),
    home,
    away,
    opponent: home.toLowerCase().includes('hollybush') ? away : home,
    venue: home.toLowerCase().includes('hollybush') ? 'Home' : 'Away'
  };
}

async function saveFixture(db, fixture) {
  await db.prepare(
    'INSERT INTO fixtures (id, match_date, kickoff, competition, home_team, away_team, locked) VALUES (?, ?, ?, ?, ?, ?, 0) '
      + 'ON CONFLICT(id) DO UPDATE SET match_date = excluded.match_date, kickoff = excluded.kickoff, competition = excluded.competition, home_team = excluded.home_team, away_team = excluded.away_team'
  ).bind(fixture.id, fixture.date, fixture.kickoff, fixture.competition, fixture.home, fixture.away).run();
}

async function formData(env) {
  const db = database(env);
  const fixture = await nextFixture();
  await saveFixture(db, fixture);
  const [fixtureRow, playerRows] = await Promise.all([
    db.prepare('SELECT locked FROM fixtures WHERE id = ?').bind(fixture.id).first(),
    db.prepare('SELECT id, name FROM players WHERE active = 1 ORDER BY name COLLATE NOCASE').all()
  ]);
  return json({
    ok: true,
    fixture,
    locked: Boolean(fixtureRow?.locked),
    players: playerRows.results || []
  });
}

function sameOrigin(request) {
  const url = new URL(request.url);
  if (request.headers.get('Origin') !== url.origin) {
    throw new HttpError(403, 'Please submit availability from the Hollybush form.');
  }
}

function safeEqual(left, right) {
  const a = String(left || '');
  const b = String(right || '');
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (a.charCodeAt(index % Math.max(a.length, 1)) || 0)
      ^ (b.charCodeAt(index % Math.max(b.length, 1)) || 0);
  }
  return difference === 0;
}

async function respond(request, env) {
  sameOrigin(request);
  let body;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, 'Your response could not be read.');
  }

  const expectedPin = String(env.SQUAD_PIN || '');
  if (!expectedPin) throw new HttpError(503, 'The squad PIN has not been configured yet.');
  if (!safeEqual(body?.pin, expectedPin)) throw new HttpError(401, 'That squad PIN is not correct.');

  const fixture = await nextFixture();
  if (body?.fixtureId !== fixture.id) throw new HttpError(409, 'The next fixture has changed. Refresh and try again.');

  const playerId = String(body?.playerId || '');
  const status = String(body?.status || '');
  const note = String(body?.note || '').trim();
  if (!['available', 'maybe', 'unavailable'].includes(status)) throw new HttpError(400, 'Choose Available, Maybe or Unavailable.');
  if (note.length > 200) throw new HttpError(400, 'Keep the note to 200 characters or fewer.');

  const db = database(env);
  await saveFixture(db, fixture);
  const fixtureRow = await db.prepare('SELECT locked FROM fixtures WHERE id = ?').bind(fixture.id).first();
  if (fixtureRow?.locked) throw new HttpError(423, 'Responses have been locked for this fixture.');

  const player = await db.prepare('SELECT id, name FROM players WHERE id = ? AND active = 1').bind(playerId).first();
  if (!player) throw new HttpError(400, 'Choose your name from the squad list.');

  await db.prepare(
    'INSERT INTO availability (fixture_id, player_id, status, note, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) '
      + 'ON CONFLICT(fixture_id, player_id) DO UPDATE SET status = excluded.status, note = excluded.note, updated_at = CURRENT_TIMESTAMP'
  ).bind(fixture.id, player.id, status, note || null).run();

  console.log(JSON.stringify({ event: 'availability_response', fixture: fixture.id, player: player.id, status }));
  return json({ ok: true, player: player.name, status, fixture });
}

async function handle(request, env) {
  const url = new URL(request.url);
  if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    return asset(PLAYER_HTML, 'text/html; charset=utf-8');
  }
  if (request.method === 'GET' && url.pathname === '/app.css') return asset(PLAYER_CSS, 'text/css; charset=utf-8');
  if (request.method === 'GET' && url.pathname === '/app.js') return asset(PLAYER_JS, 'text/javascript; charset=utf-8');
  if (request.method === 'GET' && url.pathname === '/api/form') return formData(env);
  if (request.method === 'POST' && url.pathname === '/api/respond') return respond(request, env);
  return json({ ok: false, error: 'Not found.' }, 404);
}

export default {
  async fetch(request, env) {
    try {
      return await handle(request, env);
    } catch (error) {
      if (error instanceof HttpError) return json({ ok: false, error: error.message }, error.status);
      console.error(error);
      return json({ ok: false, error: 'Something went wrong. Please try again.' }, 500);
    }
  }
};
