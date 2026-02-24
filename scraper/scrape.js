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

const DATE_RE = /^\d{1,2}\s+\w+\s+\d{4}$/;

function isTeamName(str) {
  if (!str || str.length < 3) return false;
  return /^[A-Z][a-zA-Z\s\-]+$/.test(str);
}

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

  let currentDate = null;

  $('table').each((_, tbl) => {
    const rows = $(tbl).find('tr');

    // Check if this is the league table
    let isLeagueTable = false;
    rows.each((_, row) => {
      const text = $(row).find('td').map((_, c) => $(c).text().trim()).get();
      if (text.includes('Teams') && text.includes('Pts')) isLeagueTable = true;
    });

    if (isLeagueTable) {
      let pastHeader = false;
      rows.each((_, row) => {
        const cells = $(row).find('td');
        const text = cells.map((_, c) => $(c).text().trim()).get();

        if (text.includes('Teams') && text.includes('Pts')) { pastHeader = true; return; }
        if (!pastHeader) return;

        const joined = text.join(' ');
        if (joined.includes('Promotion') || joined.includes('Relegation')) return;
        if (joined.includes('Denotes') || joined.includes('deducted')) return;

        // Check for points-deducted marker — may appear as first cell
        const hasMarker = text[0] === '*';
        const offset = hasMarker ? 1 : 0;

        const team = text[offset];
        const P    = parseInt(text[offset + 1]);
        const W    = parseInt(text[offset + 2]);
        const D    = parseInt(text[offset + 3]);
        const L    = parseInt(text[offset + 4]);
        const Pts  = parseInt(text[offset + 5]);

        if (team && isTeamName(team) && !isNaN(P) && !isNaN(Pts)) {
          table.push({
            team, played: P, won: W, drawn: D, lost: L, points: Pts,
            deducted: hasMarker,
            isHollybush: team.includes(CLUB)
          });
        }
      });
      return;
    }

    // Fixtures / results table
    rows.each((_, row) => {
      const cells = $(row).find('td');
      if (!cells.length) return;
      const text = cells.map((_, c) => $(c).text().trim()).get();
      const nonEmpty = text.filter(t => t.length > 0);

      // Date row
      if (nonEmpty.length >= 1 && DATE_RE.test(nonEmpty[0])) {
        currentDate = nonEmpty[0];
        return;
      }

      if (!currentDate) return;
      if (cells.length < 4) return;

      const home = text[0];
      const sc1  = text[1];
      const sc2  = text[2];
      const away = text[3];
      const note = text[4] || null;

      const isResult = /^\d+$/.test(sc1) && /^\d+$/.test(sc2);

      if (isResult && isTeamName(home) && isTeamName(away)) {
        results.push({
          date: currentDate, home,
          homeScore: parseInt(sc1), awayScore: parseInt(sc2),
          away, hollybushPlaying: home.includes(CLUB) || away.includes(CLUB)
        });
        return;
      }

      // Fixture row — home and away must be real team names, scores must be absent
      if (isTeamName(home) && isTeamName(away) && !isResult) {
        fixtures.push({
          date: currentDate, home, away,
          note: note && note.toLowerCase().includes('ko') ? note : null,
          hollybushPlaying: home.includes(CLUB) || away.includes(CLUB)
        });
      }
    });
  });

  const hollybushFixtures = fixtures.filter(f => f.hollybushPlaying);
  const hollybushResults  = results.filter(r => r.hollybushPlaying);

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
  console.log(`  ${fixtures.length} total fixtures, ${hollybushFixtures.length} Hollybush`);
  console.log(`  ${results.length} total results, ${hollybushResults.length} Hollybush`);
  console.log(`  ${table.length} teams in table`);
}

scrape().catch(err => {
  console.error('Scrape failed:', err);
  process.exit(1);
});
