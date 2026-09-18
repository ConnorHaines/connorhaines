export const ADMIN_HTML = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>Club Admin | Hollybush RFC</title>
  <link rel="stylesheet" href="/admin.css">
  <script src="/admin.js" defer></script>
</head>
<body>
  <header class="site-header">
    <a class="brand" href="#dashboard" aria-label="Hollybush RFC admin home">
      <span class="brand-mark" aria-hidden="true">HB</span>
      <span><strong>Hollybush RFC</strong><small>Club admin</small></span>
    </a>
    <div class="session">
      <span id="session-email">Secure session</span>
      <a class="logout" href="/cdn-cgi/access/logout">Sign out</a>
    </div>
  </header>

  <div class="portal-shell">
    <aside class="sidebar" aria-label="Admin sections">
      <p class="sidebar-label">Manage</p>
      <a class="nav-item is-active" href="#dashboard" data-view-link="dashboard">
        <span class="nav-icon" aria-hidden="true">⌂</span><span>Dashboard</span>
      </a>
      <a class="nav-item" href="#programme" data-view-link="programme">
        <span class="nav-icon" aria-hidden="true">▤</span><span>Programme</span>
      </a>
      <a class="nav-item" href="#latest" data-view-link="latest">
        <span class="nav-icon" aria-hidden="true">↗</span><span>Latest From the Bush</span>
      </a>
      <a class="nav-item" href="#availability" data-view-link="availability">
        <span class="nav-icon" aria-hidden="true">✓</span><span>Availability</span>
      </a>
      <a class="nav-item" href="#players" data-view-link="players"><span class="nav-icon" aria-hidden="true">#</span><span>Player PINs</span></a>
      <div class="sidebar-footer">
        <span class="secure-dot" aria-hidden="true"></span>
        Protected by Cloudflare Access
      </div>
    </aside>

    <main>
      <section class="portal-view is-active" id="view-dashboard" data-view="dashboard">
        <div class="page-heading">
          <div>
            <p class="eyebrow">Club control room</p>
            <h1>Everything that needs keeping fresh.</h1>
            <p>Publish the matchday programme and point supporters towards the latest from the club.</p>
          </div>
          <a class="site-button secondary-button" href="https://hollybush-rugby.co.uk" target="_blank" rel="noopener">View website ↗</a>
        </div>

        <div class="dashboard-grid" id="dashboard-grid" aria-live="polite">
          <article class="summary-card feature-card">
            <p class="card-label">Live programme</p>
            <h2 id="dashboard-programme-title">Loading…</h2>
            <p id="dashboard-programme-meta">Checking the current edition.</p>
            <a href="#programme">Manage programme <span>→</span></a>
          </article>
          <article class="summary-card">
            <p class="card-label">Archive</p>
            <strong class="big-number" id="dashboard-archive-count">—</strong>
            <p>Past programmes safely retained</p>
            <a href="https://hollybush-rugby.co.uk/programme.html#archive" target="_blank" rel="noopener">View archive <span>↗</span></a>
          </article>
          <article class="summary-card social-summary facebook-summary">
            <p class="card-label">Facebook</p>
            <h2 id="dashboard-facebook-title">Latest card</h2>
            <p id="dashboard-facebook-meta">Loading…</p>
            <a href="#latest">Edit card <span>→</span></a>
          </article>
          <article class="summary-card social-summary tiktok-summary">
            <p class="card-label">TikTok</p>
            <h2 id="dashboard-tiktok-title">Latest card</h2>
            <p id="dashboard-tiktok-meta">Loading…</p>
            <a href="#latest">Edit card <span>→</span></a>
          </article>
          <article class="summary-card availability-summary">
            <p class="card-label">Squad availability</p>
            <strong class="big-number" id="dashboard-available-count">—</strong>
            <p id="dashboard-availability-meta">Checking the next fixture.</p>
            <a href="#availability">Open coach view <span>→</span></a>
          </article>
        </div>

        <section class="quick-actions" aria-labelledby="quick-actions-title">
          <div>
            <p class="eyebrow">Quick actions</p>
            <h2 id="quick-actions-title">What are we updating?</h2>
          </div>
          <div class="action-row">
            <a class="action-button" href="#programme"><span class="action-icon">＋</span><span><strong>New programme</strong><small>Upload the next home edition</small></span></a>
            <a class="action-button" href="#latest"><span class="action-icon">↗</span><span><strong>Social cards</strong><small>Change the Facebook and TikTok links</small></span></a>
            <a class="action-button" href="#availability"><span class="action-icon">✓</span><span><strong>Player availability</strong><small>See replies and chase the missing names</small></span></a>
          </div>
        </section>
      </section>

      <section class="portal-view" id="view-programme" data-view="programme" hidden>
        <div class="page-heading compact-heading">
          <div>
            <p class="eyebrow">Matchday publishing</p>
            <h1>Programme</h1>
            <p>The current programme remains live until the replacement has converted successfully.</p>
          </div>
          <a class="site-button secondary-button" href="https://hollybush-rugby.co.uk/programme.html" target="_blank" rel="noopener">Open reader ↗</a>
        </div>

        <section class="panel" aria-labelledby="upload-title">
          <div class="panel-heading">
            <div><p class="step">Step 1</p><h2 id="upload-title">Choose the PDF</h2></div>
            <span class="limit">PDF · max 15 MB</span>
          </div>
          <label class="drop-zone" id="drop-zone" for="programme-file">
            <input id="programme-file" name="programme" type="file" accept="application/pdf,.pdf">
            <span class="upload-icon" aria-hidden="true">↑</span>
            <strong>Drop the programme here</strong>
            <span>or tap to choose it from your device</span>
          </label>
          <div class="selection" id="selection" hidden>
            <div><strong id="file-name"></strong><span id="file-size"></span></div>
            <button class="text-button" id="change-file" type="button">Change</button>
          </div>
        </section>

        <section class="panel" aria-labelledby="details-title">
          <div class="panel-heading"><div><p class="step">Step 2</p><h2 id="details-title">Add the match details</h2></div></div>
          <div class="details-grid">
            <label><span>Opposition</span><input id="opponent" name="opponent" type="text" maxlength="80" placeholder="e.g. Hafodyrynys RFC" autocomplete="off" required></label>
            <label><span>Match date</span><input id="match-date" name="matchDate" type="date" required></label>
            <label><span>Season</span><select id="season" name="season" required></select></label>
          </div>
          <p class="details-help">These details create the archive card automatically when the programme is replaced.</p>
        </section>

        <section class="panel preview-panel" id="preview-panel" hidden aria-labelledby="preview-title">
          <div class="panel-heading"><div><p class="step">Step 3</p><h2 id="preview-title">Check the preview</h2></div></div>
          <iframe id="pdf-preview" title="Selected programme PDF preview"></iframe>
        </section>

        <section class="publish-panel">
          <div><p class="step">Step 4</p><h2>Publish when ready</h2><p>The conversion normally takes one or two minutes. If it fails, the previous programme remains untouched.</p></div>
          <button class="primary-button" id="publish-button" type="button" disabled><span>Publish programme</span></button>
        </section>

        <section class="status" id="status" aria-live="polite" hidden>
          <span class="status-dot" aria-hidden="true"></span>
          <div><strong id="status-title"></strong><p id="status-message"></p><a id="programme-link" href="https://hollybush-rugby.co.uk/programme.html" target="_blank" rel="noopener" hidden>Open the live programme</a></div>
        </section>
      </section>


      <section class="portal-view" id="view-availability" data-view="availability" hidden>
        <div class="page-heading compact-heading">
          <div>
            <p class="eyebrow">Coach tools</p>
            <h1>Player availability</h1>
            <p id="availability-fixture">Loading the next Hollybush fixture…</p>
          </div>
          <a class="site-button secondary-button" id="availability-public-link" href="#" target="_blank" rel="noopener" hidden>Open player form ↗</a>
        </div>

        <div class="availability-counts" aria-live="polite">
          <article><span class="count-dot available-dot"></span><strong id="available-count">—</strong><small>Available</small></article>
          <article><span class="count-dot maybe-dot"></span><strong id="maybe-count">—</strong><small>Maybe</small></article>
          <article><span class="count-dot unavailable-dot"></span><strong id="unavailable-count">—</strong><small>Unavailable</small></article>
          <article><span class="count-dot pending-dot"></span><strong id="pending-count">—</strong><small>No reply</small></article>
        </div>

        <section class="panel availability-toolbar">
          <div>
            <p class="step">Responses</p>
            <h2 id="availability-state">Loading…</h2>
            <p id="availability-state-help">Checking whether players can still respond.</p>
          </div>
          <div class="toolbar-actions">
            <button class="site-button secondary-button button-reset" id="copy-summary" type="button">Copy full list</button>
            <button class="site-button secondary-button button-reset" id="copy-chase" type="button">Copy chase list</button>
            <button class="primary-button compact-button" id="toggle-lock" type="button" disabled>Lock responses</button>
          </div>
        </section>

        <div class="availability-groups">
          <section class="response-group available-group"><div><span class="count-dot available-dot"></span><h2>Available</h2></div><ul id="available-list"></ul></section>
          <section class="response-group maybe-group"><div><span class="count-dot maybe-dot"></span><h2>Maybe</h2></div><ul id="maybe-list"></ul></section>
          <section class="response-group unavailable-group"><div><span class="count-dot unavailable-dot"></span><h2>Unavailable</h2></div><ul id="unavailable-list"></ul></section>
          <section class="response-group pending-group"><div><span class="count-dot pending-dot"></span><h2>No reply</h2></div><ul id="pending-list"></ul></section>
        </div>
        <section class="status" id="availability-status" aria-live="polite" hidden><span class="status-dot" aria-hidden="true"></span><div><strong id="availability-status-title"></strong><p id="availability-status-message"></p></div></section>
      </section>

      <section class="portal-view" id="view-players" data-view="players" hidden>
        <div class="page-heading compact-heading"><div><p class="eyebrow">Squad access</p><h1>Player PINs</h1><p>Set a different four-digit PIN for each player and send it privately. Existing PINs cannot be revealed.</p></div></div>
        <form class="panel" id="player-pin-form">
          <div class="field"><label for="pin-player">Player</label><select id="pin-player" required><option value="">Loading players…</option></select></div>
          <div class="field"><label for="new-player-pin">New four-digit PIN</label><input id="new-player-pin" type="password" inputmode="numeric" autocomplete="new-password" pattern="[0-9]{4}" minlength="4" maxlength="4" required></div>
          <button class="primary-button" id="save-player-pin" type="submit" disabled>Set / reset PIN</button>
          <p id="pin-save-message" role="status">Loading players…</p>
          <p>Keep a note of the PIN before saving so you can send it to the player. Saving replaces their old PIN and clears any attempt lockout.</p>
        </form>
      </section>

      <section class="portal-view" id="view-latest" data-view="latest" hidden>
        <div class="page-heading compact-heading">
          <div>
            <p class="eyebrow">Homepage content</p>
            <h1>Latest From the Bush</h1>
            <p>Paste the exact public post or video links. The programme card is filled in automatically.</p>
          </div>
          <a class="site-button secondary-button" href="https://hollybush-rugby.co.uk/#latest" target="_blank" rel="noopener">View section ↗</a>
        </div>

        <div class="editor-grid">
          <section class="editor-panel facebook-panel" aria-labelledby="facebook-editor-title">
            <div class="platform-heading"><span class="platform-badge facebook-badge">f</span><div><p class="step">Social card</p><h2 id="facebook-editor-title">Facebook</h2></div></div>
            <label><span>Post link</span><input id="facebook-url" type="url" inputmode="url" placeholder="https://www.facebook.com/…"></label>
            <label><span>Card title</span><input id="facebook-title" type="text" maxlength="90"></label>
            <label><span>Short summary</span><textarea id="facebook-summary" maxlength="180" rows="4"></textarea><small><span id="facebook-count">0</span>/180</small></label>
          </section>

          <section class="editor-panel tiktok-panel" aria-labelledby="tiktok-editor-title">
            <div class="platform-heading"><span class="platform-badge tiktok-badge">♪</span><div><p class="step">Social card</p><h2 id="tiktok-editor-title">TikTok</h2></div></div>
            <label><span>Video link</span><input id="tiktok-url" type="url" inputmode="url" placeholder="https://www.tiktok.com/@…/video/…"></label>
            <label><span>Card title</span><input id="tiktok-title" type="text" maxlength="90"></label>
            <label><span>Short summary</span><textarea id="tiktok-summary" maxlength="180" rows="4"></textarea><small><span id="tiktok-count">0</span>/180</small></label>
          </section>
        </div>

        <section class="preview-section" aria-labelledby="social-preview-title">
          <div class="panel-heading"><div><p class="step">Live preview</p><h2 id="social-preview-title">How it will look</h2></div><span class="limit">Programme updates itself</span></div>
          <div class="social-preview-grid">
            <article class="public-card facebook-preview"><div class="public-card-media"><span>f</span><small>Facebook</small></div><div class="public-card-body"><p>Facebook · Latest post</p><h3 id="facebook-preview-title">Facebook title</h3><span id="facebook-preview-summary">Facebook summary</span><strong>Open on Facebook ↗</strong></div></article>
            <article class="public-card tiktok-preview"><div class="public-card-media"><span>♪</span><small>TikTok</small></div><div class="public-card-body"><p>TikTok · Latest video</p><h3 id="tiktok-preview-title">TikTok title</h3><span id="tiktok-preview-summary">TikTok summary</span><strong>Watch on TikTok ↗</strong></div></article>
            <article class="public-card programme-preview"><div class="public-card-media programme-cover"><span>HB</span><small>Matchday</small></div><div class="public-card-body"><p>Matchday · Latest edition</p><h3 id="programme-preview-title">Latest matchday programme</h3><span id="programme-preview-summary">Filled from the current programme automatically.</span><strong>Open the programme →</strong></div></article>
          </div>
        </section>

        <section class="publish-panel social-publish-panel">
          <div><p class="step">Publish</p><h2>Send both cards live</h2><p>A small website build starts automatically. The new links normally appear within a minute or two.</p></div>
          <button class="primary-button" id="social-publish-button" type="button" disabled><span>Publish social cards</span></button>
        </section>
        <section class="status" id="social-status" aria-live="polite" hidden><span class="status-dot" aria-hidden="true"></span><div><strong id="social-status-title"></strong><p id="social-status-message"></p></div></section>
      </section>
    </main>
  </div>

  <footer>Hollybush RFC · authorised users only</footer>
</body>
</html>`;

export const ADMIN_CSS = String.raw`:root {
  color-scheme: dark;
  --black: #08090a;
  --panel: #141618;
  --panel-soft: #1b1e21;
  --line: #34383c;
  --yellow: #f2c300;
  --yellow-soft: #ffe36d;
  --text: #f5f3eb;
  --muted: #aaa89f;
  --success: #58cf83;
  --danger: #ff746c;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { min-height: 100vh; margin: 0; color: var(--text); background: radial-gradient(circle at 15% 0%, rgba(242,195,0,.09), transparent 28rem), linear-gradient(135deg, #0d0e10, var(--black)); }
body::before { position: fixed; inset: 0; z-index: -1; content: ""; opacity: .18; background-image: repeating-linear-gradient(125deg, transparent 0 18px, rgba(255,255,255,.03) 19px 20px); }
button, input, select, textarea { font: inherit; }

.site-header { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; min-height: 72px; padding: 12px 24px; border-bottom: 1px solid var(--line); background: rgba(9,10,11,.9); backdrop-filter: blur(16px); }
.brand { display: inline-flex; align-items: center; gap: 12px; color: var(--text); text-decoration: none; }
.brand-mark { display: grid; width: 44px; height: 44px; place-items: center; color: var(--black); background: var(--yellow); border: 2px solid var(--yellow-soft); font-weight: 950; transform: skew(-5deg); }
.brand strong, .brand small { display: block; }
.brand strong { letter-spacing: .03em; text-transform: uppercase; }
.brand small { margin-top: 2px; color: var(--muted); }
.session { display: flex; align-items: center; gap: 18px; color: var(--muted); font-size: .83rem; }
.logout { color: var(--text); text-underline-offset: 4px; }

.portal-shell { display: grid; min-height: calc(100vh - 72px); grid-template-columns: 250px minmax(0,1fr); }
.sidebar { position: sticky; top: 72px; display: flex; height: calc(100vh - 72px); padding: 34px 18px 20px; flex-direction: column; border-right: 1px solid var(--line); background: rgba(11,12,13,.72); }
.sidebar-label { margin: 0 12px 12px; color: #777b7f; font-size: .7rem; font-weight: 850; letter-spacing: .16em; text-transform: uppercase; }
.nav-item { display: flex; align-items: center; gap: 12px; min-height: 48px; margin: 3px 0; padding: 10px 12px; color: var(--muted); border: 1px solid transparent; text-decoration: none; transition: .2s ease; }
.nav-item:hover { color: var(--text); background: rgba(255,255,255,.035); }
.nav-item.is-active { color: var(--black); border-color: var(--yellow-soft); background: var(--yellow); font-weight: 850; }
.nav-icon { display: grid; width: 25px; height: 25px; place-items: center; font-size: 1.15rem; }
.sidebar-footer { display: flex; align-items: center; gap: 9px; margin-top: auto; padding: 16px 12px 0; color: #777b7f; border-top: 1px solid #25282a; font-size: .72rem; line-height: 1.4; }
.secure-dot { flex: 0 0 auto; width: 8px; height: 8px; border-radius: 50%; background: var(--success); box-shadow: 0 0 0 4px rgba(88,207,131,.1); }

main { width: min(1180px, calc(100% - 64px)); margin: 0 auto; padding: 60px 0 84px; }
.portal-view[hidden] { display: none; }
.page-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; margin-bottom: 38px; }
.page-heading > div { max-width: 800px; }
.compact-heading > div { max-width: 680px; }
.eyebrow, .step, .card-label { margin: 0 0 8px; color: var(--yellow); font-size: .72rem; font-weight: 850; letter-spacing: .17em; text-transform: uppercase; }
h1, h2, h3 { margin: 0; line-height: 1.08; }
h1 { font-size: clamp(2.5rem,6vw,5rem); letter-spacing: -.055em; }
.compact-heading h1 { font-size: clamp(2.5rem,5vw,4.2rem); }
h2 { font-size: clamp(1.3rem,2.4vw,1.75rem); }
.page-heading p:last-child, .publish-panel p, .status p { color: var(--muted); line-height: 1.65; }
.page-heading p:last-child { max-width: 660px; margin: 18px 0 0; }
.site-button { flex: 0 0 auto; padding: 13px 17px; color: var(--text); border: 1px solid var(--line); text-decoration: none; font-size: .86rem; font-weight: 780; }
.secondary-button:hover { color: var(--black); border-color: var(--yellow); background: var(--yellow); }

.dashboard-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 18px; }
.summary-card { position: relative; min-height: 230px; padding: 28px; overflow: hidden; border: 1px solid var(--line); background: linear-gradient(145deg,rgba(27,30,33,.98),rgba(16,18,20,.98)); box-shadow: 0 18px 55px rgba(0,0,0,.22); }
.summary-card::after { position: absolute; right: -40px; top: -55px; width: 160px; height: 160px; content: ""; border: 1px solid rgba(255,255,255,.05); border-radius: 50%; }
.feature-card { border-top: 3px solid var(--yellow); }
.facebook-summary { border-top: 3px solid #5b8def; }
.tiktok-summary { border-top: 3px solid #25f4ee; }
.summary-card h2 { max-width: 430px; margin-top: 20px; }
.summary-card > p:not(.card-label) { color: var(--muted); line-height: 1.5; }
.summary-card > a { position: absolute; left: 28px; bottom: 24px; color: var(--yellow); text-decoration: none; font-size: .86rem; font-weight: 800; }
.summary-card > a span { margin-left: 6px; }
.big-number { display: block; margin-top: 8px; color: var(--yellow); font-size: 4rem; line-height: 1; }
.quick-actions { margin-top: 18px; padding: 30px; border: 1px solid var(--line); background: rgba(20,22,24,.8); }
.action-row { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 14px; margin-top: 24px; }
.action-button { display: flex; align-items: center; gap: 16px; min-height: 78px; padding: 16px; color: var(--text); border: 1px solid var(--line); background: #0d0f11; text-decoration: none; }
.action-button:hover { border-color: var(--yellow); }
.action-button strong, .action-button small { display: block; }
.action-button small { margin-top: 4px; color: var(--muted); }
.action-icon { display: grid; flex: 0 0 auto; width: 42px; height: 42px; place-items: center; color: var(--black); background: var(--yellow); font-size: 1.4rem; font-weight: 800; }

.panel, .publish-panel, .status, .editor-panel, .preview-section { margin-top: 18px; border: 1px solid var(--line); background: linear-gradient(145deg,rgba(27,30,33,.98),rgba(16,18,20,.98)); box-shadow: 0 18px 55px rgba(0,0,0,.22); }
.panel, .preview-section { padding: clamp(20px,4vw,34px); }
.panel-heading, .selection, .publish-panel { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.limit { color: var(--muted); font-size: .75rem; letter-spacing: .1em; text-transform: uppercase; }
.drop-zone { display: grid; min-height: 230px; margin-top: 24px; padding: 28px; place-items: center; align-content: center; text-align: center; border: 2px dashed #545960; background: rgba(255,255,255,.018); cursor: pointer; transition: .2s ease; }
.drop-zone:hover, .drop-zone.is-dragging { border-color: var(--yellow); background: rgba(242,195,0,.06); transform: translateY(-2px); }
.drop-zone input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.drop-zone strong { margin-top: 14px; font-size: 1.2rem; }
.drop-zone span:last-child { margin-top: 7px; color: var(--muted); }
.upload-icon { color: var(--yellow); font-size: 3.5rem; font-weight: 250; line-height: 1; }
.selection { margin-top: 18px; padding: 17px 18px; border-left: 4px solid var(--yellow); background: var(--panel-soft); }
.selection strong, .selection span { display: block; overflow-wrap: anywhere; }
.selection span { margin-top: 4px; color: var(--muted); font-size: .9rem; }
.text-button { padding: 8px; color: var(--yellow); border: 0; background: transparent; cursor: pointer; }
.details-grid { display: grid; grid-template-columns: minmax(220px,1.5fr) minmax(170px,1fr) minmax(150px,.8fr); gap: 16px; margin-top: 24px; }
.details-grid label, .editor-panel label { display: grid; gap: 8px; }
.details-grid label > span, .editor-panel label > span { color: var(--muted); font-size: .75rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.details-grid input, .details-grid select, .editor-panel input, .editor-panel textarea, #player-pin-form input, #player-pin-form select { width: 100%; min-height: 50px; padding: 11px 13px; color: var(--text); border: 1px solid #4a4f54; border-radius: 0; background: #0d0f11; }
#player-pin-form { display: grid; gap: 20px; max-width: 640px; }
#player-pin-form .field { display: grid; gap: 8px; }
#player-pin-form p { color: var(--muted); line-height: 1.5; }
.editor-panel textarea { min-height: 112px; resize: vertical; line-height: 1.45; }
.details-grid input:focus, .details-grid select:focus, .editor-panel input:focus, .editor-panel textarea:focus { outline: 2px solid var(--yellow); outline-offset: 1px; border-color: var(--yellow); }
.details-help { margin: 15px 0 0; color: var(--muted); font-size: .9rem; }
.preview-panel iframe { width: 100%; height: min(74vh,760px); margin-top: 24px; border: 1px solid var(--line); background: #fff; }
.publish-panel { padding: clamp(22px,4vw,34px); }
.publish-panel p:last-child { max-width: 560px; margin: 10px 0 0; }
.primary-button { flex: 0 0 auto; min-width: 210px; padding: 17px 24px; color: #070707; border: 1px solid var(--yellow-soft); background: var(--yellow); font-weight: 900; cursor: pointer; box-shadow: 0 8px 28px rgba(242,195,0,.18); }
.primary-button:hover:not(:disabled) { background: var(--yellow-soft); transform: translateY(-1px); }
.primary-button:disabled { opacity: .35; cursor: not-allowed; box-shadow: none; }
.status { display: flex; align-items: flex-start; gap: 16px; padding: 22px; }
.status-dot { flex: 0 0 auto; width: 13px; height: 13px; margin-top: 5px; border-radius: 50%; background: var(--yellow); box-shadow: 0 0 0 6px rgba(242,195,0,.12); }
.status.is-success .status-dot { background: var(--success); box-shadow: 0 0 0 6px rgba(88,207,131,.12); }
.status.is-error .status-dot { background: var(--danger); box-shadow: 0 0 0 6px rgba(255,116,108,.12); }
.status p { margin: 5px 0 0; }
.status a { display: inline-block; margin-top: 12px; color: var(--yellow); font-weight: 750; text-underline-offset: 4px; }

.editor-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 18px; }
.editor-panel { padding: 28px; }
.facebook-panel { border-top: 3px solid #5b8def; }
.tiktok-panel { border-top: 3px solid #25f4ee; }
.platform-heading { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
.platform-badge { display: grid; width: 48px; height: 48px; place-items: center; border-radius: 50%; color: white; font-size: 1.8rem; font-weight: 950; }
.facebook-badge { background: #1877f2; }
.tiktok-badge { color: #fff; background: #050505; box-shadow: -3px 0 #25f4ee, 3px 0 #fe2c55; }
.editor-panel label + label { margin-top: 18px; }
.editor-panel label small { justify-self: end; color: #777b7f; }
.preview-section { margin-top: 18px; }
.social-preview-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 16px; margin-top: 24px; }
.public-card { min-width: 0; overflow: hidden; border: 1px solid var(--line); background: #0b0c0d; }
.public-card-media { display: grid; min-height: 150px; place-items: center; align-content: center; color: #fff; background: linear-gradient(135deg,#0c51b8,#1877f2); }
.tiktok-preview .public-card-media { background: radial-gradient(circle at 30% 20%,#174b4e,transparent 35%),radial-gradient(circle at 75% 75%,#5b1020,transparent 34%),#050505; }
.programme-cover { color: var(--black); background: linear-gradient(145deg,var(--yellow),#9d7800); }
.public-card-media span { font-size: 3.7rem; font-weight: 950; line-height: 1; }
.public-card-media small { margin-top: 8px; font-weight: 850; letter-spacing: .16em; text-transform: uppercase; }
.public-card-body { padding: 20px; }
.public-card-body p { margin: 0 0 10px; color: var(--yellow); font-size: .66rem; font-weight: 850; letter-spacing: .11em; text-transform: uppercase; }
.public-card-body h3 { min-height: 2.2em; font-size: 1.15rem; }
.public-card-body > span { display: block; min-height: 4.2em; margin: 10px 0 18px; color: var(--muted); font-size: .84rem; line-height: 1.45; }
.public-card-body strong { color: var(--yellow); font-size: .78rem; }
footer { padding: 24px; color: #777b7f; border-top: 1px solid var(--line); text-align: center; font-size: .82rem; }


.availability-summary { border-top: 3px solid var(--success); }
.availability-counts { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 12px; }
.availability-counts article { display: grid; grid-template-columns: auto 1fr; gap: 2px 12px; padding: 20px; border: 1px solid var(--line); background: var(--panel); }
.availability-counts strong { font-size: 2rem; line-height: 1; }
.availability-counts small { grid-column: 2; color: var(--muted); }
.count-dot { display: inline-block; width: 10px; height: 10px; margin-top: 5px; border-radius: 50%; }
.available-dot { background: var(--success); }
.maybe-dot { background: var(--yellow); }
.unavailable-dot { background: var(--danger); }
.pending-dot { background: #767b80; }
.availability-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.availability-toolbar p:last-child { margin: 7px 0 0; color: var(--muted); }
.toolbar-actions { display: flex; align-items: center; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
.button-reset { background: transparent; cursor: pointer; }
.compact-button { min-width: 150px; padding: 13px 17px; }
.availability-groups { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 16px; margin-top: 18px; }
.response-group { min-height: 220px; padding: 24px; border: 1px solid var(--line); background: linear-gradient(145deg,rgba(27,30,33,.98),rgba(16,18,20,.98)); }
.response-group > div { display: flex; align-items: center; gap: 10px; padding-bottom: 16px; border-bottom: 1px solid var(--line); }
.response-group .count-dot { margin: 0; }
.response-group ul { display: grid; gap: 9px; margin: 18px 0 0; padding: 0; list-style: none; }
.response-group li { padding: 11px 12px; border-left: 3px solid #555b60; background: #0d0f11; }
.available-group li { border-left-color: var(--success); }
.maybe-group li { border-left-color: var(--yellow); }
.unavailable-group li { border-left-color: var(--danger); }
.response-group li strong, .response-group li small { display: block; }
.response-group li small { margin-top: 5px; color: var(--muted); line-height: 1.4; }
.empty-response { color: var(--muted); font-style: italic; }

@media (max-width: 960px) {
  .portal-shell { grid-template-columns: 1fr; }
  .sidebar { position: sticky; top: 72px; z-index: 8; height: auto; padding: 8px 16px; flex-direction: row; gap: 5px; overflow-x: auto; border-right: 0; border-bottom: 1px solid var(--line); background: rgba(9,10,11,.96); }
  .sidebar-label, .sidebar-footer, .nav-icon { display: none; }
  .nav-item { flex: 0 0 auto; min-height: 42px; padding: 8px 13px; font-size: .82rem; }
  main { width: min(100% - 36px,760px); padding-top: 42px; }
  .page-heading { align-items: flex-start; flex-direction: column; }
  .dashboard-grid, .editor-grid { grid-template-columns: 1fr; }
  .availability-toolbar { align-items: flex-start; flex-direction: column; }
  .toolbar-actions { justify-content: flex-start; }
  .social-preview-grid { display: flex; padding-bottom: 8px; overflow-x: auto; scroll-snap-type: x mandatory; }
  .public-card { flex: 0 0 min(82vw,330px); scroll-snap-align: start; }
}

@media (max-width: 680px) {
  .site-header { min-height: 66px; padding: 10px 16px; }
  .brand small, #session-email { display: none; }
  .portal-shell { min-height: calc(100vh - 66px); }
  .sidebar { top: 66px; }
  main { width: calc(100% - 28px); padding-top: 34px; }
  .page-heading { margin-bottom: 28px; }
  .details-grid, .action-row, .availability-groups { grid-template-columns: 1fr; }
  .availability-counts { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .panel-heading { align-items: flex-start; }
  .limit { max-width: 120px; text-align: right; }
  .drop-zone { min-height: 190px; }
  .preview-panel iframe { height: 62vh; }
  .publish-panel { align-items: stretch; flex-direction: column; }
  .primary-button { width: 100%; }
  .summary-card { min-height: 215px; }
}

@media (prefers-reduced-motion: reduce) { *,*::before,*::after { scroll-behavior: auto !important; transition: none !important; } }`;

export const ADMIN_JS = String.raw`(() => {
  const views = Array.from(document.querySelectorAll('[data-view]'));
  const viewLinks = Array.from(document.querySelectorAll('[data-view-link]'));
  const knownViews = ['dashboard', 'programme', 'latest', 'availability', 'players'];

  function route() {
    const requested = window.location.hash.slice(1);
    const name = knownViews.includes(requested) ? requested : 'dashboard';
    views.forEach(view => {
      const active = view.dataset.view === name;
      view.hidden = !active;
      view.classList.toggle('is-active', active);
    });
    viewLinks.forEach(link => link.classList.toggle('is-active', link.dataset.viewLink === name));
    document.title = (name === 'dashboard' ? 'Club Admin' : name.charAt(0).toUpperCase() + name.slice(1) + ' Admin') + ' | Hollybush RFC';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const input = document.getElementById('programme-file');
  const dropZone = document.getElementById('drop-zone');
  const selection = document.getElementById('selection');
  const fileName = document.getElementById('file-name');
  const fileSize = document.getElementById('file-size');
  const changeButton = document.getElementById('change-file');
  const previewPanel = document.getElementById('preview-panel');
  const preview = document.getElementById('pdf-preview');
  const publishButton = document.getElementById('publish-button');
  const status = document.getElementById('status');
  const statusTitle = document.getElementById('status-title');
  const statusMessage = document.getElementById('status-message');
  const programmeLink = document.getElementById('programme-link');
  const opponent = document.getElementById('opponent');
  const matchDate = document.getElementById('match-date');
  const season = document.getElementById('season');
  let selectedFile = null;
  let previewUrl = null;
  let pollTimer = null;

  function seasonForDate(value) {
    const parts = String(value || '').split('-').map(Number);
    if (parts.length !== 3 || !parts[0] || !parts[1]) return '';
    const start = parts[1] >= 7 ? parts[0] : parts[0] - 1;
    return start + '/' + String(start + 1).slice(-2);
  }

  function populateSeasons() {
    const year = new Date().getFullYear();
    const seasons = [];
    for (let start = year + 1; start >= year - 3; start -= 1) seasons.push(start + '/' + String(start + 1).slice(-2));
    season.innerHTML = seasons.map(value => '<option value="' + value + '">' + value + '</option>').join('');
  }

  function updatePublishState() { publishButton.disabled = !(selectedFile && opponent.value.trim() && matchDate.value && season.value); }
  function formatBytes(bytes) { return bytes < 1024 * 1024 ? Math.ceil(bytes / 1024) + ' KB' : (bytes / 1024 / 1024).toFixed(1) + ' MB'; }
  function showStatus(kind, title, message, link) {
    status.hidden = false;
    status.className = 'status' + (kind ? ' is-' + kind : '');
    statusTitle.textContent = title;
    statusMessage.textContent = message;
    programmeLink.hidden = !link;
    if (link) programmeLink.href = link;
  }

  function chooseFile(file) {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name)) return showStatus('error', 'That is not a PDF', 'Choose a file ending in .pdf.');
    if (file.size > 15 * 1024 * 1024) return showStatus('error', 'That PDF is too large', 'The maximum upload size is 15 MB.');
    selectedFile = file;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    fileName.textContent = file.name;
    fileSize.textContent = formatBytes(file.size);
    preview.src = previewUrl;
    selection.hidden = false;
    previewPanel.hidden = false;
    updatePublishState();
    status.hidden = true;
  }

  function resetFile() {
    selectedFile = null;
    input.value = '';
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    preview.removeAttribute('src');
    selection.hidden = true;
    previewPanel.hidden = true;
    publishButton.disabled = true;
    input.click();
  }

  async function pollUntilPublished(version, publicUrl, attempt) {
    const tries = attempt || 0;
    try {
      const response = await fetch('/api/status?version=' + encodeURIComponent(version), { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not check publishing status.');
      if (body.ready) {
        showStatus('success', 'Programme published', 'The new ' + body.pageCount + '-page programme is live.', body.publicUrl || publicUrl);
        updatePublishState();
        publishButton.querySelector('span').textContent = 'Publish programme';
        loadDashboard();
        return;
      }
    } catch (error) {
      if (tries > 3) {
        showStatus('error', 'Still processing', 'The upload was accepted, but its status could not be checked. The old programme is still safe.');
        updatePublishState();
        publishButton.querySelector('span').textContent = 'Publish programme';
        return;
      }
    }
    if (tries >= 48) {
      showStatus('error', 'Taking longer than expected', 'The old programme is still live. Ask Connor to check the GitHub build before trying again.');
      updatePublishState();
      publishButton.querySelector('span').textContent = 'Publish programme';
      return;
    }
    pollTimer = window.setTimeout(() => pollUntilPublished(version, publicUrl, tries + 1), 5000);
  }

  async function publishProgramme() {
    if (!selectedFile || !window.confirm('Publish "' + selectedFile.name + '" as the latest matchday programme?')) return;
    if (pollTimer) window.clearTimeout(pollTimer);
    publishButton.disabled = true;
    publishButton.querySelector('span').textContent = 'Uploading…';
    showStatus('', 'Uploading programme', 'Keep this page open while the PDF is sent securely.');
    const form = new FormData();
    form.append('programme', selectedFile, selectedFile.name);
    form.append('opponent', opponent.value.trim());
    form.append('matchDate', matchDate.value);
    form.append('season', season.value);
    try {
      const response = await fetch('/api/programme', { method: 'POST', body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'The upload failed.');
      publishButton.querySelector('span').textContent = 'Building…';
      showStatus('', 'Building the reader', 'The upload is safe. The pages are now being checked and converted.');
      pollUntilPublished(body.version, body.publicUrl, 0);
    } catch (error) {
      showStatus('error', 'Could not publish', error.message || 'Try again in a moment.');
      updatePublishState();
      publishButton.querySelector('span').textContent = 'Publish programme';
    }
  }

  const social = {
    facebook: {
      url: document.getElementById('facebook-url'), title: document.getElementById('facebook-title'), summary: document.getElementById('facebook-summary'),
      count: document.getElementById('facebook-count'), previewTitle: document.getElementById('facebook-preview-title'), previewSummary: document.getElementById('facebook-preview-summary')
    },
    tiktok: {
      url: document.getElementById('tiktok-url'), title: document.getElementById('tiktok-title'), summary: document.getElementById('tiktok-summary'),
      count: document.getElementById('tiktok-count'), previewTitle: document.getElementById('tiktok-preview-title'), previewSummary: document.getElementById('tiktok-preview-summary')
    }
  };
  const socialPublishButton = document.getElementById('social-publish-button');
  const socialStatus = document.getElementById('social-status');
  const socialStatusTitle = document.getElementById('social-status-title');
  const socialStatusMessage = document.getElementById('social-status-message');

  function showSocialStatus(kind, title, message) {
    socialStatus.hidden = false;
    socialStatus.className = 'status' + (kind ? ' is-' + kind : '');
    socialStatusTitle.textContent = title;
    socialStatusMessage.textContent = message;
  }

  function updateSocialPreview() {
    Object.keys(social).forEach(platform => {
      const fields = social[platform];
      fields.count.textContent = fields.summary.value.length;
      fields.previewTitle.textContent = fields.title.value.trim() || (platform === 'facebook' ? 'Facebook title' : 'TikTok title');
      fields.previewSummary.textContent = fields.summary.value.trim() || (platform === 'facebook' ? 'Facebook summary' : 'TikTok summary');
    });
    socialPublishButton.disabled = !Object.keys(social).every(platform => {
      const fields = social[platform];
      return fields.url.value.trim() && fields.title.value.trim() && fields.summary.value.trim();
    });
  }

  function fillSocialFields(latest) {
    if (!latest) return;
    Object.keys(social).forEach(platform => {
      const value = latest[platform] || {};
      social[platform].url.value = value.url || '';
      social[platform].title.value = value.title || '';
      social[platform].summary.value = value.summary || '';
    });
    updateSocialPreview();
  }


  let availabilityData = null;
  const availabilityStatus = document.getElementById('availability-status');
  const toggleLockButton = document.getElementById('toggle-lock');

  function fixtureLabel(fixture) {
    if (!fixture) return 'Next fixture';
    const date = new Date(fixture.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    return fixture.venue + ' v ' + fixture.opponent + ' · ' + date + ' · ' + fixture.kickoff;
  }

  function renderPlayerList(statusName, players) {
    const list = document.getElementById(statusName + '-list');
    list.replaceChildren();
    if (!players.length) {
      const empty = document.createElement('li');
      empty.className = 'empty-response';
      empty.textContent = statusName === 'pending' ? 'Everyone has replied.' : 'Nobody yet.';
      list.appendChild(empty);
      return;
    }
    players.forEach(player => {
      const item = document.createElement('li');
      const name = document.createElement('strong');
      name.textContent = player.name;
      item.appendChild(name);
      if (player.note) {
        const note = document.createElement('small');
        note.textContent = player.note;
        item.appendChild(note);
      }
      list.appendChild(item);
    });
  }

  function showAvailabilityStatus(kind, title, message) {
    availabilityStatus.hidden = false;
    availabilityStatus.className = 'status' + (kind ? ' is-' + kind : '');
    setText('availability-status-title', title);
    setText('availability-status-message', message);
  }

  function renderAvailability(body) {
    availabilityData = body;
    setText('availability-fixture', fixtureLabel(body.fixture));
    ['available', 'maybe', 'unavailable', 'pending'].forEach(statusName => {
      setText(statusName + '-count', body.counts[statusName]);
      renderPlayerList(statusName, body.players.filter(player => (player.status || 'pending') === statusName));
    });
    setText('dashboard-available-count', body.counts.available);
    setText('dashboard-availability-meta', body.fixture.opponent + ' · ' + body.counts.pending + ' awaiting reply');
    setText('availability-state', body.locked ? 'Responses are locked' : 'Responses are open');
    setText('availability-state-help', body.locked ? 'Players can see the fixture but cannot change their answer.' : 'Players can submit or update their answer.');
    toggleLockButton.disabled = false;
    toggleLockButton.textContent = body.locked ? 'Reopen responses' : 'Lock responses';
    const publicLink = document.getElementById('availability-public-link');
    publicLink.hidden = !body.publicUrl;
    if (body.publicUrl) publicLink.href = body.publicUrl;
  }

  async function loadAvailability() {
    try {
      const response = await fetch('/api/availability', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not load availability.');
      renderAvailability(body);
    } catch (error) {
      setText('dashboard-available-count', '—');
      setText('dashboard-availability-meta', 'Setup required');
      setText('availability-fixture', error.message || 'Could not load the next fixture.');
      showAvailabilityStatus('error', 'Availability is not connected', error.message || 'Check the D1 database binding.');
    }
  }

  async function toggleAvailabilityLock() {
    if (!availabilityData) return;
    const locked = !availabilityData.locked;
    if (!window.confirm((locked ? 'Lock' : 'Reopen') + ' availability for ' + availabilityData.fixture.opponent + '?')) return;
    toggleLockButton.disabled = true;
    try {
      const response = await fetch('/api/availability/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not update availability.');
      await loadAvailability();
      showAvailabilityStatus('success', locked ? 'Responses locked' : 'Responses reopened', locked ? 'The current answers are now frozen.' : 'Players can update their answers again.');
    } catch (error) {
      showAvailabilityStatus('error', 'Could not update responses', error.message || 'Try again.');
      toggleLockButton.disabled = false;
    }
  }

  async function copyAvailability(kind) {
    if (!availabilityData) return;
    let value;
    if (kind === 'chase') {
      const names = availabilityData.players.filter(player => !player.status).map(player => player.name);
      value = names.length ? 'Still waiting on: ' + names.join(', ') : 'Everyone has replied for ' + availabilityData.fixture.opponent + '.';
    } else {
      const namesFor = statusName => availabilityData.players.filter(player => (player.status || 'pending') === statusName).map(player => player.name).join(', ') || 'None';
      value = [
        fixtureLabel(availabilityData.fixture),
        'Available (' + availabilityData.counts.available + '): ' + namesFor('available'),
        'Maybe (' + availabilityData.counts.maybe + '): ' + namesFor('maybe'),
        'Unavailable (' + availabilityData.counts.unavailable + '): ' + namesFor('unavailable'),
        'No reply (' + availabilityData.counts.pending + '): ' + namesFor('pending')
      ].join('\n');
    }
    try {
      await navigator.clipboard.writeText(value);
      showAvailabilityStatus('success', 'Copied', kind === 'chase' ? 'The chase list is ready to paste into WhatsApp.' : 'The full availability list is ready to paste.');
    } catch {
      showAvailabilityStatus('error', 'Could not copy', 'Your browser blocked clipboard access.');
    }
  }

  function setText(id, value) { document.getElementById(id).textContent = value; }
  async function loadDashboard() {
    try {
      const response = await fetch('/api/dashboard', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not load the dashboard.');
      setText('session-email', body.identity || 'Secure session');
      setText('dashboard-programme-title', body.programme.title);
      const programmeMeta = [body.programme.edition, body.programme.pageCount ? body.programme.pageCount + ' pages' : ''].filter(Boolean).join(' · ');
      setText('dashboard-programme-meta', programmeMeta || 'Ready for the next home game.');
      setText('dashboard-archive-count', body.archiveCount);
      setText('dashboard-facebook-title', body.latest.facebook.title);
      setText('dashboard-facebook-meta', body.latest.facebook.url ? 'Link ready' : 'Needs a post link');
      setText('dashboard-tiktok-title', body.latest.tiktok.title);
      setText('dashboard-tiktok-meta', body.latest.tiktok.url ? 'Link ready' : 'Needs a video link');
      setText('programme-preview-title', body.programme.title);
      setText('programme-preview-summary', programmeMeta || 'Open the latest matchday programme.');
      fillSocialFields(body.latest);
    } catch (error) {
      setText('dashboard-programme-title', 'Could not load dashboard');
      setText('dashboard-programme-meta', error.message || 'Refresh and try again.');
    }
  }

  async function publishSocial() {
    socialPublishButton.disabled = true;
    socialPublishButton.querySelector('span').textContent = 'Publishing…';
    showSocialStatus('', 'Publishing social cards', 'Saving the links and starting the website build.');
    const body = {
      facebook: { url: social.facebook.url.value.trim(), title: social.facebook.title.value.trim(), summary: social.facebook.summary.value.trim() },
      tiktok: { url: social.tiktok.url.value.trim(), title: social.tiktok.title.value.trim(), summary: social.tiktok.summary.value.trim() }
    };
    try {
      const response = await fetch('/api/social', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The social cards could not be published.');
      fillSocialFields(result.latest);
      showSocialStatus('success', 'Social cards published', 'The homepage will pick up the new links as soon as GitHub Pages finishes building.');
      loadDashboard();
    } catch (error) {
      showSocialStatus('error', 'Could not publish', error.message || 'Try again in a moment.');
    } finally {
      socialPublishButton.querySelector('span').textContent = 'Publish social cards';
      updateSocialPreview();
    }
  }

  window.addEventListener('hashchange', route);
  input.addEventListener('change', () => chooseFile(input.files[0]));
  changeButton.addEventListener('click', resetFile);
  publishButton.addEventListener('click', publishProgramme);
  opponent.addEventListener('input', updatePublishState);
  matchDate.addEventListener('change', () => {
    const suggested = seasonForDate(matchDate.value);
    if (suggested && Array.from(season.options).some(option => option.value === suggested)) season.value = suggested;
    updatePublishState();
  });
  season.addEventListener('change', updatePublishState);
  Object.keys(social).forEach(platform => Object.values(social[platform]).filter(element => element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement).forEach(element => element.addEventListener('input', updateSocialPreview)));
  socialPublishButton.addEventListener('click', publishSocial);
  toggleLockButton.addEventListener('click', toggleAvailabilityLock);
  document.getElementById('copy-summary').addEventListener('click', () => copyAvailability('summary'));
  document.getElementById('copy-chase').addEventListener('click', () => copyAvailability('chase'));
  ['dragenter','dragover'].forEach(eventName => dropZone.addEventListener(eventName, event => { event.preventDefault(); dropZone.classList.add('is-dragging'); }));
  ['dragleave','drop'].forEach(eventName => dropZone.addEventListener(eventName, event => { event.preventDefault(); dropZone.classList.remove('is-dragging'); }));
  dropZone.addEventListener('drop', event => chooseFile(event.dataTransfer.files[0]));
  window.addEventListener('beforeunload', () => { if (previewUrl) URL.revokeObjectURL(previewUrl); if (pollTimer) window.clearTimeout(pollTimer); });

  const pinPlayer = document.getElementById('pin-player');
  const pinInput = document.getElementById('new-player-pin');
  const pinButton = document.getElementById('save-player-pin');
  const pinMessage = document.getElementById('pin-save-message');
  async function loadPinPlayers() {
    try {
      const response = await fetch('/api/players/pins', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not load player PIN setup.');
      const selected = pinPlayer.value;
      pinPlayer.replaceChildren(new Option('Choose a player', ''));
      body.players.forEach(player => pinPlayer.add(new Option(player.name + (player.pinSet ? ' — PIN set' : ' — needs PIN'), player.id)));
      pinPlayer.value = selected;
      pinButton.disabled = false;
      return body.players;
    } catch (error) {
      pinButton.disabled = true;
      pinMessage.textContent = error.message;
      return null;
    }
  }
  document.getElementById('player-pin-form').addEventListener('submit', async event => {
    event.preventDefault();
    const name = pinPlayer.selectedOptions[0]?.textContent;
    if (!window.confirm('Set a new PIN for ' + name + '? Their previous PIN will stop working.')) return;
    pinButton.disabled = true;
    try {
      const response = await fetch('/api/players/pin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: pinPlayer.value, pin: pinInput.value })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not save PIN.');
      pinInput.value = '';
      pinMessage.textContent = 'PIN saved for ' + body.player + '. Send it to them privately.';
      await loadPinPlayers();
    } catch (error) {
      pinMessage.textContent = error.message;
    } finally {
      pinButton.disabled = false;
    }
  });
  loadPinPlayers().then(players => {
    if (players) pinMessage.textContent = players.filter(player => !player.pinSet).length + ' players still need a PIN.';
  });

  populateSeasons();
  matchDate.value = new Date().toISOString().slice(0,10);
  season.value = seasonForDate(matchDate.value);
  route();
  loadDashboard();
  loadAvailability();
})();`;
