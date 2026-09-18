import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { newPinRecord, pinHash, equalHash, takePinAttempt } from '../../shared/player-pins.mjs';
import { testDatabase } from '../../shared/test-db.mjs';

const pepper = 'test-only-secret-that-is-at-least-32-characters';
const id = 'connor-haines';
async function setup() {
  const DB = testDatabase();
  const record = await newPinRecord(id, '0123', pepper);
  await DB.prepare('INSERT INTO player_pins (player_id, pin_hash, pin_salt) VALUES (?, ?, ?)').bind(id, record.hash, record.salt).run();
  return { DB, PIN_PEPPER: pepper, SQUAD_PIN: '1901' };
}
function request(pin, playerId = id, origin = 'https://players.example') {
  return new Request('https://players.example/api/respond', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin, playerId, fixtureId: 'future-match', status: 'available', note: '' })
  });
}
test('salt, player identity and pepper all affect the hash; leading zeros work', async () => {
  const one = await newPinRecord(id, '0123', pepper);
  const two = await newPinRecord(id, '0123', pepper);
  assert.notEqual(one.hash, two.hash);
  assert.equal(equalHash(one.hash, await pinHash(id, '0123', one.salt, pepper)), true);
  assert.notEqual(one.hash, await pinHash('ben-nash', '0123', one.salt, pepper));
  assert.notEqual(one.hash, await pinHash(id, '0123', one.salt, pepper + 'x'));
});
test('persistent attempt limit allows five reservations, including concurrent calls, then expires', async () => {
  const db = testDatabase();
  const attempts = await Promise.all(Array.from({ length: 12 }, () => takePinAttempt(db, id, 1000)));
  assert.equal(attempts.filter(Boolean).length, 5);
  assert.equal(await takePinAttempt(db, id, 1899), false);
  assert.equal(await takePinAttempt(db, id, 1900), true);
});
test('wrong, unset and old shared PINs cannot save responses; cross-origin rejected', async () => {
  const env = await setup();
  for (const pin of ['1901', '9999', 123, '12345']) {
    assert.equal((await worker.fetch(request(pin), env)).status, 401);
  }
  assert.equal((await worker.fetch(request('0123', 'ben-nash'), env)).status, 401);
  assert.equal((await worker.fetch(request('0123', id, 'https://elsewhere.example'), env)).status, 403);
  assert.equal((await env.DB.prepare('SELECT * FROM availability').all()).results.length, 0);
});
test('correct personal PIN saves; wrong pepper fails; public API never returns hashes', async () => {
  const env = await setup();
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ fixtures: [{ id: 'future-match', date: '2999-01-01', hollybushPlaying: true, home: 'Hollybush RFC', away: 'Visitors' }] });
  try {
    assert.equal((await worker.fetch(request('0123'), env)).status, 200);
    assert.equal((await env.DB.prepare('SELECT * FROM availability').all()).results.length, 1);
    assert.equal((await worker.fetch(request('0123'), { ...env, PIN_PEPPER: pepper + 'wrong' })).status, 401);
    const form = await worker.fetch(new Request('https://players.example/api/form'), env);
    const body = await form.json();
    assert.deepEqual(Object.keys(body.players[0]).sort(), ['id', 'name']);
    await env.DB.prepare('UPDATE fixtures SET locked = 1').run();
    assert.equal((await worker.fetch(request('0123'), env)).status, 423);
  } finally { globalThis.fetch = original; }
});
