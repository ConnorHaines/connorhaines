-- Keep the availability roster aligned with the current playing squad.
-- Safe to re-run: existing players, PINs and responses are preserved.
INSERT INTO players (id, name, active) VALUES
  ('ben-norman-jones', 'Ben Norman-Jones', 1),
  ('morgan-spence', 'Morgan Spence', 1)
ON CONFLICT(id) DO UPDATE SET name = excluded.name, active = 1;

UPDATE players SET active = 1
WHERE id IN ('ben-watkins-smith', 'ivan-hutchinson');

UPDATE players SET name = 'Steffan Andrews'
WHERE id = 'stefan-andrews';

UPDATE players SET active = 0
WHERE id = 'darren-gould';
