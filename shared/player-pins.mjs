// Keyed, salted SHA-256 hashes: the secret pepper stays outside D1.
// Low-entropy PINs also require the persistent attempt limit below.
const encoder = new TextEncoder();
export function validPin(pin) {
  return typeof pin === 'string' && /^[0-9]{4}$/.test(pin);
}
export function requirePepper(env) {
  if (typeof env.PIN_PEPPER !== 'string' || env.PIN_PEPPER.length < 32) {
    throw new Error('PIN_PEPPER must be a secret of at least 32 characters on both Workers.');
  }
  return env.PIN_PEPPER;
}
export async function pinHash(playerId, pin, salt, pepper) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key,
    encoder.encode(JSON.stringify(['player-pin-v1', playerId, salt, pin])));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}
export async function newPinRecord(playerId, pin, pepper) {
  if (!validPin(pin)) throw new Error('Enter exactly four digits.');
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
  return { salt, hash: await pinHash(playerId, pin, salt, pepper) };
}
export function equalHash(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== 64 || right.length !== 64) return false;
  let difference = 0;
  for (let i = 0; i < 64; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}
export async function takePinAttempt(db, playerId, now = Math.floor(Date.now() / 1000)) {
  // Atomic reservation BEFORE verification prevents concurrent guess bypasses.
  const row = await db.prepare(
    'INSERT INTO player_pin_attempts (player_id, attempts, window_start) VALUES (?, 1, ?) '
    + 'ON CONFLICT(player_id) DO UPDATE SET '
    + 'attempts = CASE WHEN window_start <= ? THEN 1 ELSE attempts + 1 END, '
    + 'window_start = CASE WHEN window_start <= ? THEN excluded.window_start ELSE window_start END '
    + 'WHERE window_start <= ? OR attempts < 5 RETURNING attempts'
  ).bind(playerId, now, now - 900, now - 900, now - 900).first();
  return Boolean(row);
}
