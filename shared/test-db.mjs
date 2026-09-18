import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
export function testDatabase() {
  const sqlite = new DatabaseSync(':memory:');
  for (const file of ['0001_availability.sql', '0002_player_pins.sql', '0002_player_pins.sql']) {
    sqlite.exec(readFileSync(new URL('../availability-worker/migrations/' + file, import.meta.url), 'utf8'));
  }
  const db = {
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      let args = [];
      return {
        bind(...values) { args = values; return this; },
        async first() { return statement.get(...args) || null; },
        async all() { return { results: statement.all(...args) }; },
        async run() { return statement.run(...args); }
      };
    },
    async batch(statements) { return Promise.all(statements.map(statement => statement.run())); }
  };
  return db;
}
