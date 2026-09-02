# Hollybush RFC website

Static GitHub Pages website for `hollybush-rugby.co.uk`, including the public club site and the coaches' Playbook.

## Fixtures and results

`fixtures.json` is the website's fixture, result and league-table source. The GitHub Actions workflow runs at midnight and midday, with extra Saturday checks at 18:00 and 21:00 UTC so results appear sooner. It scrapes the current WRU Division 5 East page on All Wales Sport and commits changes only when the data has actually changed.

League kick-offs default to `14:30`. A different time returned by the source is retained.

Cup, friendly or tournament fixtures can be added to `manualFixtures` in `fixtures.json`. These entries are preserved when the league scraper runs. Use ISO dates and state the real kick-off explicitly:

```json
{
  "id": "2026-11-07-hollybush-example-cup",
  "date": "2026-11-07",
  "kickoff": "13:00",
  "competition": "WRU Division 5 Cup",
  "home": "Hollybush RFC",
  "away": "Example RFC",
  "hollybushPlaying": true,
  "source": "manual"
}
```

The website and downloadable calendar both read the same data, so a fixture only needs to be changed once. `fixtures.ics` has a stable URL for calendar subscriptions and is refreshed by the same workflow.

To run the update locally:

```sh
npm ci --prefix scraper
node scraper/scrape.js
```

## Squad photos

Player image paths are set in the `squad` array in `index.html`. Missing images automatically display the generic player silhouette.

## Matchday programme

The public programme reader is available at `/programme.html`. It shows one swipeable page on mobile and a two-page book with physical controls on larger screens.

The recommended publishing route is the protected admin page at `admin.hollybush-rugby.co.uk`. An approved user selects a PDF and the uploader writes it to `programmes/pending.pdf`. The **Build Matchday Programme** GitHub Action validates and converts that staged file before promoting it to `programmes/current.pdf`; the old programme remains live if the build fails. Approved publishers do not need GitHub accounts.

The Cloudflare Access and Worker setup is documented in [`ADMIN-SETUP.md`](ADMIN-SETUP.md). The GitHub token is stored only as a Cloudflare Worker secret and is restricted to repository contents.

As a manual fallback, replace `programmes/current.pdf` and commit it. The same Action creates the optimised reader pages and updates `programmes/programme.json`; generated files inside `programmes/pages` should not be edited by hand.

The importer preserves genuine portrait pages, but automatically removes the blank A4 bands when the PDF contains square programme artwork. To test the conversion locally, install Poppler and ImageMagick, then run:

```sh
node scripts/build-programme.mjs
```

## Coaches' Playbook

The Playbook is available directly at `/playbook.html`. Five taps on the navbar crest within three seconds, or visiting `/#coaches`, reveals its navigation link. This is intentionally a hidden entrance rather than authentication; plays remain on the coach's device unless exported.
