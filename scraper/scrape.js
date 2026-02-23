// scraper/scrape.js
// Fetches fixtures, results and league table from allwalessport.co.uk
// and writes them to fixtures.json in the repo root.

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const URL = 'https://www.allwalessport.co.uk/rugby-union.aspx?cid=16455';
const CLUB = 'Hollybush';
const OUTPUT = resolve(__dirname, '../fixtures.json');

async function scrape() {
  console.log('Fetching allwalessport...');
  const res = await fetch(URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HollybushRFC-bot/1.0)' }
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const fixtures = [];
  const results = [];
  const table = [];

  // ── Parse fixtures and results ──────────────────────────────────────────────
  // The page renders each date block as a table. Rows with scores are results,
  // rows without scores are fixtures.

  let currentDate = null;

  $('table').each((_, tbl) => {
    const rows = $(tbl).find('tr');

    rows.each((_, row) => {
      const cells = $(row).find('td');
      if (!cells.length) return;

      const text = cells.map((_, c) => $(c).text().trim()).get();

      // Date row — single cell containing a date string
      if (cells.length === 1) {
        const dateCandidate = text[0];
        if (/\d{1,2}\s+\w+\s+\d{4}/.test(dateCandidate)) {
          currentDate = dateCandidate;
        }
        return;
      }

      // Result row: [home, homeScore, awayScore, away] (4-5 cells with numbers)
      if (cells.length >= 4) {
        const home = text[0];
        const sc1  = text[1];
        const sc2  = text[2];
        const away = text[3];
        const note = text[4] || '';

        const isResult = /^\d+$/.test(sc1) && /^\d+$/.test(sc2);
        const isFixture = home && away && !isResult && home !== away;

        if (!currentDate) return;

        if (isResult) {
          results.push({
            date: currentDate,
            home,
            homeScore: parseInt(sc1),
            awayScore: parseInt(sc2),
            away,
            hollybushPlaying: home.includes(CLUB) || away.includes(CLUB)
          });
        } else if (isFixture && home.trim() && away.trim()) {
          fixtures.push({
            date: currentDate,
            home,
            away,
            note: note || null,
            hollybushPlaying: home.includes(CLUB) || away.includes(CLUB)
          });
        }
      }
    });
  });

  // ── Parse league table ──────────────────────────────────────────────────────
  // The table section contains rows with: Team, P, W, D, L, Pts
  // Promotion/relegation divider rows are labelled accordingly.

  let inTable = false;

  $('table tr').each((_, row) => {
    const cells = $(row).find('td');
    const text = cells.map((_, c) => $(c).text().trim()).get();

    // Detect the table header row
    if (text.includes('Teams') && text.includes('Pts')) {
      inTable = true;
      return;
    }

    if (!inTable) return;

    // Promotion/relegation divider rows
    if (text.join('').includes('Promotion') || text.join('').includes('Relegation')) {
      return;
    }

    // Data row: [marker?, team, P, W, D, L, Pts]
    // Marker (*) may appear as first cell for points-deducted teams
    if (cells.length >= 6) {
      const hasMarker = /^\*/.test(text[0]) || (text[0] === '*');
      const offset = hasMarker ? 1 : 0;
      const team = text[offset];
      const P    = parseInt(text[offset + 1]);
      const W    = parseInt(text[offset + 2]);
      const D    = parseInt(text[offset + 3]);
      const L    = parseInt(text[offset + 4]);
      const Pts  = parseInt(text[offset + 5]);

      if (team && !isNaN(P)) {
        table.push({
          team,
          played: P,
          won: W,
          drawn: D,
          lost: L,
          points: Pts,
          deducted: hasMarker,
          isHollybush: team.includes(CLUB)
        });
      }
    }
  });

  // ── Filter to only Hollybush fixtures/results for next/last 5 ──────────────
  const hollybushFixtures = fixtures
    .filter(f => f.hollybushPlaying)
    .slice(0, 10);

  const hollybushResults = results
    .filter(r => r.hollybushPlaying)
    .slice(0, 10);

  const output = {
    updatedAt: new Date().toISOString(),
    fixtures: hollybushFixtures,
    allFixtures: fixtures,
    results: hollybushResults,
    allResults: results,
    table
  };

  writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
  console.log(`✓ Written to fixtures.json`);
  console.log(`  ${hollybushFixtures.length} Hollybush fixtures`);
  console.log(`  ${hollybushResults.length} Hollybush results`);
  console.log(`  ${table.length} teams in table`);
}

scrape().catch(err => {
  console.error('Scrape failed:', err);
  process.exit(1);
});
