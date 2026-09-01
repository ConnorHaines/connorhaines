import * as cheerio from 'cheerio';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE_URL = 'https://www.allwalessport.co.uk/rugby-union.aspx?cid=19787';
const CLUB = 'Hollybush';
const SEASON = '2026/27';
const COMPETITION = 'WRU Admiral National League 5 East';
const DEFAULT_KICKOFF = '14:30';
const OUTPUT = resolve(__dirname, '../fixtures.json');
const ICS_OUTPUT = resolve(__dirname, '../fixtures.ics');
const DATE_RE = /^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/;

const MONTHS = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
};

const TEAM_NAMES = new Map([
  ['Hollybush', 'Hollybush RFC'],
  ['Abertysswg', 'Abertysswg Falcons RFC'],
  ['Abersychan', 'Abersychan Alexanders RFC'],
  ['Bettws', 'Bettws RFC'],
  ['Brynithel', 'Brynithel RFC'],
  ['Hafodyrynys', 'Hafodyrynys RFC'],
  ['New Tredegar', 'New Tredegar RFC'],
  ['Penallta Athletic', 'Penallta RFC Athletic'],
  ['St Julians HSOB', 'St Julians HSOB RFC']
]);

function canonicalTeam(name) {
  const clean = name.replace(/\s+/g, ' ').trim();
  return TEAM_NAMES.get(clean) || clean;
}

function isHollybush(name) {
  return name.toLowerCase().includes(CLUB.toLowerCase());
}

function toIsoDate(label) {
  const [day, month, year] = label.trim().split(/\s+/);
  const monthNumber = MONTHS[month.toLowerCase()];
  if (!monthNumber) throw new Error(`Unrecognised date: ${label}`);
  return `${year}-${monthNumber}-${day.padStart(2, '0')}`;
}

function slug(value) {
  return value.toLowerCase().replace(/\brfc\b/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function matchId(date, home, away) {
  return `${date}-${slug(home)}-${slug(away)}`;
}

function sortByDate(items, direction = 1) {
  return items.slice().sort((a, b) => direction * a.date.localeCompare(b.date));
}

function dedupeMatches(items) {
  const matches = new Map();
  for (const item of items) matches.set(item.id || matchId(item.date, item.home, item.away), item);
  return [...matches.values()];
}

function withoutVolatileFields(data) {
  const copy = { ...data };
  delete copy.updatedAt;
  delete copy.lastSuccessfulScrape;
  return copy;
}

function escapeICS(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function calendarDateTime(date, time, extraMinutes = 0) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day, hour, minute + extraMinutes));
  const pad = number => String(number).padStart(2, '0');
  return `${value.getUTCFullYear()}${pad(value.getUTCMonth() + 1)}${pad(value.getUTCDate())}T${pad(value.getUTCHours())}${pad(value.getUTCMinutes())}00`;
}

function buildCalendar(data) {
  const fixtures = dedupeMatches([...(data.fixtures || []), ...(data.manualFixtures || [])]);
  const stampSource = data.updatedAt || data.lastSuccessfulScrape || new Date().toISOString();
  const stamp = new Date(stampSource).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hollybush RFC//2026-27 Fixtures//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Hollybush RFC 2026/27',
    'X-WR-TIMEZONE:Europe/London'
  ];

  sortByDate(fixtures).forEach(fixture => {
    const kickoff = fixture.kickoff || data.defaultKickoff || DEFAULT_KICKOFF;
    const isHome = isHollybush(fixture.home);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${fixture.id || matchId(fixture.date, fixture.home, fixture.away)}@hollybush-rugby.co.uk`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Europe/London:${calendarDateTime(fixture.date, kickoff)}`,
      `DTEND;TZID=Europe/London:${calendarDateTime(fixture.date, kickoff, 120)}`,
      `SUMMARY:${escapeICS(`${fixture.home} v ${fixture.away} (${isHome ? 'H' : 'A'})`)}`,
      `DESCRIPTION:${escapeICS(`${fixture.competition || data.competition}\n${isHome ? 'Home' : 'Away'} fixture`)}`,
      `LOCATION:${escapeICS(isHome ? 'Hollybush Field' : fixture.home)}`,
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}

async function scrape() {
  console.log(`Fetching ${PAGE_URL}...`);
  const res = await fetch(PAGE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HollybushRFC-bot/2.0)' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const fixtures = [];
  const results = [];
  const table = [];
  let currentDate = null;
  let inTableSection = false;

  $('table tr').each((_, row) => {
    const cells = $(row).find('td').map((__, cell) => $(cell).text().trim()).get();
    if (!cells.length) return;

    if (cells.length >= 7 && cells[1] === 'Teams' && cells[6] === 'Pts') {
      inTableSection = true;
      return;
    }

    if (inTableSection) {
      if (DATE_RE.test(cells[0])) {
        inTableSection = false;
        currentDate = toIsoDate(cells[0]);
        return;
      }
      if (cells.length < 7 || cells[1].includes('---') || cells[0].includes('Denotes')) return;

      const played = Number.parseInt(cells[2], 10);
      const won = Number.parseInt(cells[3], 10);
      const drawn = Number.parseInt(cells[4], 10);
      const lost = Number.parseInt(cells[5], 10);
      const points = Number.parseInt(cells[6], 10);
      const team = canonicalTeam(cells[1]);
      if (team.length > 2 && Number.isFinite(played) && Number.isFinite(points)) {
        table.push({
          team, played, won, drawn, lost, points,
          deducted: cells[0] === '*',
          isHollybush: isHollybush(team)
        });
      }
      return;
    }

    if (DATE_RE.test(cells[0])) {
      currentDate = toIsoDate(cells[0]);
      return;
    }
    if (!currentDate) return;

    if (cells.length >= 4 && /^\d+$/.test(cells[1]) && /^\d+$/.test(cells[2])) {
      const home = canonicalTeam(cells[0]);
      const away = canonicalTeam(cells[3]);
      if (home.length < 2 || away.length < 2) return;
      results.push({
        id: matchId(currentDate, home, away),
        date: currentDate,
        kickoff: DEFAULT_KICKOFF,
        competition: 'League',
        home,
        homeScore: Number.parseInt(cells[1], 10),
        awayScore: Number.parseInt(cells[2], 10),
        away,
        hollybushPlaying: isHollybush(home) || isHollybush(away),
        source: 'allwalessport'
      });
      return;
    }

    if (cells.length >= 4 && /^\d{1,2}:\d{2}/.test(cells[0]) && cells[2] === 'v') {
      const home = canonicalTeam(cells[1]);
      const away = canonicalTeam(cells[3]);
      const kickoff = cells[0].match(/\d{1,2}:\d{2}/)[0];
      fixtures.push({
        id: matchId(currentDate, home, away),
        date: currentDate,
        kickoff,
        competition: 'League',
        home,
        away,
        hollybushPlaying: isHollybush(home) || isHollybush(away),
        source: 'allwalessport'
      });
      return;
    }

    const versusIndex = cells.indexOf('v');
    if (versusIndex < 1 || versusIndex > 3 || cells.length < versusIndex + 2) return;
    const home = canonicalTeam(cells.slice(0, versusIndex).find(cell => cell.length > 1) || '');
    const away = canonicalTeam(cells[versusIndex + 1] || '');
    if (home.length < 2 || away.length < 2 || /^\d+$/.test(home) || /^\d+$/.test(away)) return;

    fixtures.push({
      id: matchId(currentDate, home, away),
      date: currentDate,
      kickoff: DEFAULT_KICKOFF,
      competition: 'League',
      home,
      away,
      hollybushPlaying: isHollybush(home) || isHollybush(away),
      source: 'allwalessport'
    });
  });

  if (!fixtures.length && !results.length) {
    console.log('No current-season competition data found; keeping the existing fallback data unchanged.');
    return;
  }

  const existing = existsSync(OUTPUT) ? JSON.parse(readFileSync(OUTPUT, 'utf8')) : {};
  const allResults = sortByDate(dedupeMatches(results), -1);
  const completedAsFixtures = allResults.map(({ homeScore, awayScore, ...result }) => result);
  const allFixtures = sortByDate(dedupeMatches([...fixtures, ...completedAsFixtures]));
  const hollybushFixtures = allFixtures.filter(item => item.hollybushPlaying);
  const hollybushResults = allResults.filter(item => item.hollybushPlaying);
  const now = new Date().toISOString();

  const output = {
    schemaVersion: 2,
    season: SEASON,
    competition: COMPETITION,
    defaultKickoff: DEFAULT_KICKOFF,
    sourceUrl: PAGE_URL,
    sourceStatus: 'live',
    updatedAt: now,
    lastSuccessfulScrape: now,
    fixtures: hollybushFixtures,
    manualFixtures: Array.isArray(existing.manualFixtures) ? existing.manualFixtures : [],
    allFixtures,
    results: hollybushResults,
    allResults,
    table: table.length ? table : (Array.isArray(existing.table) ? existing.table : [])
  };

  const dataChanged = JSON.stringify(withoutVolatileFields(output)) !== JSON.stringify(withoutVolatileFields(existing));
  if (!dataChanged) {
    output.updatedAt = existing.updatedAt || now;
    output.lastSuccessfulScrape = existing.lastSuccessfulScrape || existing.updatedAt || now;
  }
  const calendar = buildCalendar(output);
  const calendarChanged = !existsSync(ICS_OUTPUT) || readFileSync(ICS_OUTPUT, 'utf8') !== calendar;
  if (!dataChanged && !calendarChanged) {
    console.log('No fixture, result, table or calendar changes detected.');
    return;
  }

  if (dataChanged) writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
  if (calendarChanged) writeFileSync(ICS_OUTPUT, calendar);
  console.log(`${dataChanged ? 'Fixture data' : 'Calendar'} updated.`);
  console.log(`  ${allFixtures.length} scheduled matches (${hollybushFixtures.length} Hollybush)`);
  console.log(`  ${allResults.length} results (${hollybushResults.length} Hollybush)`);
  console.log(`  ${output.table.length} teams in table`);
}

scrape().catch(error => {
  console.error('Scrape failed:', error);
  process.exit(1);
});
