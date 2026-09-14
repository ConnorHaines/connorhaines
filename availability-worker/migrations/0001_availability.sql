PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS fixtures (
  id TEXT PRIMARY KEY,
  match_date TEXT NOT NULL,
  kickoff TEXT NOT NULL,
  competition TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  locked INTEGER NOT NULL DEFAULT 0 CHECK (locked IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS availability (
  fixture_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'maybe', 'unavailable')),
  note TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (fixture_id, player_id),
  FOREIGN KEY (fixture_id) REFERENCES fixtures(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_availability_fixture ON availability(fixture_id);
CREATE INDEX IF NOT EXISTS idx_players_active_name ON players(active, name);

INSERT OR IGNORE INTO players (id, name) VALUES
  ('alexander-jay', 'Alexander Jay'),
  ('ashley-smith', 'Ashley Smith'),
  ('ashley-trow', 'Ashley Trow'),
  ('bailey-quinton', 'Bailey Quinton'),
  ('ben-jones', 'Ben Jones'),
  ('ben-nash', 'Ben Nash'),
  ('ben-watkins-smith', 'Ben Watkins-Smith'),
  ('cailib-williams', 'Cailib Williams'),
  ('cameron-price', 'Cameron Price'),
  ('connor-haines', 'Connor Haines'),
  ('darren-gould', 'Darren Gould'),
  ('david-reynolds', 'David Reynolds'),
  ('dylan-major', 'Dylan Major'),
  ('ethan-hackland', 'Ethan Hackland'),
  ('gareth-fleet', 'Gareth Fleet'),
  ('geraint-conlon', 'Geraint Conlon'),
  ('harrison-kerby', 'Harrison Kerby'),
  ('ivan-hutchinson', 'Ivan Hutchinson'),
  ('jake-laddychuk', 'Jake Laddychuk'),
  ('john-williams', 'John Williams'),
  ('kieran-lee-edwards', 'Kieran-Lee Edwards'),
  ('lewis-davies', 'Lewis Davies'),
  ('liam-morgan', 'Liam Morgan'),
  ('lloyd-english', 'Lloyd English'),
  ('luke-harper', 'Luke Harper'),
  ('marcus-stevens', 'Marcus Stevens'),
  ('mason-williams', 'Mason Williams'),
  ('matt-tucker', 'Matt Tucker'),
  ('matteo-sidoli', 'Matteo Sidoli'),
  ('regan-greening', 'Regan Greening'),
  ('richard-hext', 'Richard Hext'),
  ('robert-mays', 'Robert Mays'),
  ('stefan-andrews', 'Stefan Andrews'),
  ('tom-hancock', 'Tom Hancock'),
  ('tom-rees', 'Tom Rees'),
  ('zach-kettle', 'Zach Kettle');
