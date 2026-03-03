// scraper/scrape.js
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

function isTeam(str) {
  return str && str.length >= 3 && /^[A-Z][a-zA-Z\s\-]+$/.test(str.trim());
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
  const results  = [];
  const table    = [];
  let currentDate = null;

  $('table').each((_, tbl) => {
    const rows = $(tbl).find('tr');
    const allText = rows.map((_, r) =>
      $(r).find('td').map((_, c) => $(c).text().trim()).get()
    ).get();

    // ── League table: 7-cell rows, first cell blank or "*", second cell is "Teams" header
    const isLeagueTable = allText.some(t => t.includes('Teams') && t.includes('Pts'));

    if (isLeagueTable) {
      let pastHeader = false;
      rows.each((_, row) => {
        const t = $(row).find('td').map((_, c) => $(c).text().trim()).get();
        if (t.includes('Teams') && t.includes('Pts')) { pastHeader = true; return; }
        if (!pastHeader) return;
        // Skip divider/footnote rows
        if (t.join('').match(/Promotion|Relegation|Denotes|deducted/i)) return;
        // 7 cells: [marker, team, P, W, D, L, Pts]
        // marker is '' for normal rows, '*' for deducted
        if (t.length < 7) return;
        const deducted = t[0] === '*';
        const team = t[1];
        const P   = parseInt(t[2]);
        const W   = parseInt(t[3]);
        const D   = parseInt(t[4]);
        const L   = parseInt(t[5]);
        const Pts = parseInt(t[6]);
        if (isTeam(team) && !isNaN(P) && !isNaN(Pts)) {
          table.push({ team, played: P, won: W, drawn: D, lost: L, points: Pts, deducted, isHollybush: team.includes(CLUB) });
        }
      });
      return;
    }

    // ── Fixtures / Results tables ─────────────────────────────────────────
    rows.each((_, row) => {
      const t = $(row).find('td').map((_, c) => $(c).text().trim()).get();
      if (!t.length) return;

      // Date row: single cell matching date pattern
      if (t.length === 1 && DATE_RE.test(t[0])) { currentDate = t[0]; return; }
      // Date row with trailing empty cells
      if (DATE_RE.test(t[0])) { currentDate = t[0]; return; }

      if (!currentDate) return;

      // Result row: 4 cells [home, homeScore, awayScore, away]
      if (t.length === 4 && /^\d+$/.test(t[1]) && /^\d+$/.test(t[2]) && isTeam(t[0]) && isTeam(t[3])) {
        results.push({
          date: currentDate,
          home: t[0], homeScore: parseInt(t[1]), awayScore: parseInt(t[2]), away: t[3],
          hollybushPlaying: t[0].includes(CLUB) || t[3].includes(CLUB)
        });
        return;
      }

      // Fixture row: 5 cells [home, '', 'v', away, ''] 
      if (t.length === 5 && isTeam(t[0]) && isTeam(t[3]) && !(/^\d+$/.test(t[1]))) {
        fixtures.push({
          date: currentDate,
          home: t[0], away: t[3],
          note: null,
          hollybushPlaying: t[0].includes(CLUB) || t[3].includes(CLUB)
        });
        return;
      }

      // KO note row: 5 cells where second cell has a time e.g. "1pm KO"
      // Attach to last fixture of same date
      if (t.length >= 2 && t[1] && t[1].toLowerCase().includes('ko')) {
        const last = fixtures[fixtures.length - 1];
        if (last && last.date === currentDate) last.note = t[1];
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
scrape().catch(err => { console.error('Scrape failed:', err); process.exit(1); });
