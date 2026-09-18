# Individual player PINs

The protected admin dashboard now has a **Player PINs** section. Pick a player,
enter four digits (leading zeros are allowed), and save. Send the PIN privately.
The list marks each player as PIN set or needs PIN. Resetting immediately replaces
the previous PIN and clears the attempt limit. There is no reveal/export endpoint.

## Before merging / deploying

1. In Cloudflare D1, open the existing **hollybush-club** database and run
   `availability-worker/migrations/0002_player_pins.sql` in its console.
   This creates two new tables without changing players or existing replies.
   The SQL is safe to run again. Do not re-create the database or re-run a destructive seed.
2. Generate a long random secret in a password manager (at least 32 characters).
3. On BOTH **admin** and **availability** Workers, open Settings → Variables and
   Secrets. Add a runtime **Secret** named `PIN_PEPPER` with the EXACT SAME value.
   This is not a build variable. Keep it out of GitHub and retain it securely.
4. Merge and deploy both Workers. Existing `DB`, Access settings and publishing
   secrets must remain in place. The new shared module lives in `shared/` at the
   repository root, so pull the whole repository before a local deployment.
   For local deployment, from `admin-worker` run `npx wrangler deploy`, then from
   `availability-worker` run `npx wrangler deploy`.
5. Open the admin dashboard → Player PINs and set each player's PIN. Use different
   PINs, distribute privately, then test one correct and one incorrect submission.

For a staged rollout, deploy admin first, set all PINs, then deploy availability.
If Git-connected Workers deploy automatically on merge, use a short announced
maintenance window: players without assigned PINs cannot submit until assigned.
Never fall back to the shared squad PIN for players whose PIN is unset.

## Security / limits

- The old shared `SQUAD_PIN` is no longer accepted and there is no public coach
  override. Remove the unused old secret after the rollout. A hidden shared
  override would undermine individual player identity, especially if already known.
- Each record is a random-salted, player-bound HMAC-SHA-256 keyed hash. The pepper
  lives only in Worker secrets, so a database dump alone cannot enumerate the
  10,000 possible PINs. Treat the pepper as sensitive; changing it invalidates all
  existing PINs and requires resetting them. Do not rotate it casually.
- Five submission attempts per player per 15-minute window, including successful
  attempts; persisted in D1 and reserved atomically before checking the PIN.
  An admin reset clears the limit. Someone can deliberately exhaust another
  player's attempts, so this is lightweight protection, not full account security.
- Wrong and unset PINs receive the same message. PIN values, salts and hashes
  are never returned in API responses or written to application logs.
- A four-digit PIN can still be shared or guessed. This reduces impersonation;
  it cannot make it impossible. Do not reuse a banking or phone-unlock PIN.

## Checks

With Node 24+, run from the repository root:

`node --test admin-worker/test/worker.test.mjs availability-worker/test/pins.test.mjs`

Tests use an in-memory SQLite database, not production D1.
