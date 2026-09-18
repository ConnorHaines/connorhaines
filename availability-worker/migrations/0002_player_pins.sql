-- Additive and safe to re-run in the D1 console. Existing responses are untouched.
CREATE TABLE IF NOT EXISTS player_pins (
  player_id TEXT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS player_pin_attempts (
  player_id TEXT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  attempts INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);
