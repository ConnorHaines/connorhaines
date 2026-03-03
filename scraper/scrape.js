import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE_URL = 'https://www.allwalessport.co.uk/rugby-union.aspx?cid=16455';
const CLUB = 'Hollybush';
const OUTPUT = resolve(__dirname, '../fixtures.json');
const DATE_RE = /^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/;

async function scrape() {
  console.log('Fetching allwalessport...');
  const res = await fetch(PAGE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HollybushRFC-bot/1.0)' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const fixtures = [], results = [], table = [];
  let currentDate = null;
  let inTableSection = false;

  $('table tr').each((_, row) => {
    const t = $(row).find('td').map((_, c) => $(c).text().trim()).get();
    if (!t.length) return;

    // League table header: ['', 'Teams', 'P', 'W', 'D', 'L', 'Pts']
    if (t.length >= 7 && t[1] === 'Teams' && t[6] === 'Pts') {
      inTableSection = true;
      return;
    }

    if (inTableSection) {
      if (DATE_RE.test(t[0])) { inTableSection = false; currentDate = t[0]; return; }
      if (t.length >= 2 && t[1].includes('---')) return;
      if (t[0].includes('Denotes')) return;
      if (t.length < 7) return;
      const deducted = t[0] === '*';
      const team = t[1];
      const P = parseInt(t[2]), W = parseInt(t[3]), D = parseInt(t[4]), L = parseInt(t[5]), Pts = parseInt(t[6]);
      if (team && team.length > 2 && !isNaN(P) && !isNaN(Pts)) {
        table.push({ team, played: P, won: W, drawn: D, lost: L, points: Pts, deducted, isHollybush: team.includes(CLUB) });
      }
      return;
    }

    if (DATE_RE.test(t[0])) { currentDate = t[0]; return; }
    if (!currentDate) return;

    // Result: [home, homeScore, awayScore, away]
    if (t.length >= 4 && /^\d+$/.test(t[1]) && /^\d+$/.test(t[2]) && t[0].length > 1 && t[3].length > 1) {
      results.push({
        date: currentDate,
        home: t[0], homeScore: parseInt(t[1]), awayScore: parseInt(t[2]), away: t[3],
        hollybushPlaying: t[0].includes(CLUB) || t[3].includes(CLUB)
      });
      return;
    }

    // Fixture with KO time: [time, home, v, away]
    if (t.length >= 4 && /^\d{1,2}:\d{2}/.test(t[0]) && t[2] === 'v' && t[1].length > 1 && t[3].length > 1) {
      fixtures.push({
        date: currentDate, home: t[1], away: t[3],
        note: t[0] + ' KO',
        hollybushPlaying: t[1].includes(CLUB) || t[3].includes(CLUB)
      });
      return;
    }

    // Normal fixture: find 'v' in the row and use surrounding cells as home/away
    // Handles both 4-col [home,'',v,away] and 5-col [home,'',v,away,''] tables
    const vIdx = t.indexOf('v');
    if (vIdx >= 1 && vIdx <= 3 && t.length >= vIdx + 2) {
      const home = t.slice(0, vIdx).find(c => c.length > 1) || '';
      const away = (t[vIdx + 1] || '').trim();
      if (home.length > 1 && away.length > 1 && !/^\d+$/.test(home) && !/^\d+$/.test(away)) {
        fixtures.push({
          date: currentDate, home, away,
          note: null,
          hollybushPlaying: home.includes(CLUB) || away.includes(CLUB)
        });
      }
    }
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
  console.log('Done!');
  console.log(`  ${fixtures.length} fixtures (${hollybushFixtures.length} Hollybush)`);
  console.log(`  ${results.length} results (${hollybushResults.length} Hollybush)`);
  console.log(`  ${table.length} teams in table`);
}

scrape().catch(err => { console.error('Scrape failed:', err); process.exit(1); });
