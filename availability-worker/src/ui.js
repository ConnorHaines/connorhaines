export const PLAYER_HTML = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>Player Availability | Hollybush RFC</title>
  <link rel="stylesheet" href="/app.css">
  <script src="/app.js" defer></script>
</head>
<body>
  <header>
    <a class="brand" href="https://hollybush-rugby.co.uk" aria-label="Hollybush RFC website"><span>HB</span><strong>Hollybush RFC</strong></a>
    <small>Squad availability</small>
  </header>
  <main>
    <section class="fixture-card">
      <p class="eyebrow">Next match</p>
      <h1 id="fixture-title">Loading fixture…</h1>
      <p id="fixture-meta">Checking the latest club fixtures.</p>
      <span class="venue" id="fixture-venue"></span>
    </section>

    <form id="availability-form" hidden>
      <div class="field">
        <label for="player">Your name</label>
        <select id="player" required><option value="">Choose your name…</option></select>
      </div>

      <fieldset>
        <legend>Can you play?</legend>
        <div class="status-grid">
          <label class="status-choice available"><input type="radio" name="status" value="available" required><span><strong>Available</strong><small>I'm in</small></span></label>
          <label class="status-choice maybe"><input type="radio" name="status" value="maybe"><span><strong>Maybe</strong><small>Not certain yet</small></span></label>
          <label class="status-choice unavailable"><input type="radio" name="status" value="unavailable"><span><strong>Unavailable</strong><small>Can't make it</small></span></label>
        </div>
      </fieldset>

      <div class="field">
        <label for="note">Note <span>optional</span></label>
        <textarea id="note" maxlength="200" rows="3" placeholder="Injury, work, arriving late…"></textarea>
      </div>
      <div class="field pin-field">
        <label for="pin">Squad PIN</label>
        <input id="pin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="16" required placeholder="Enter the shared PIN">
      </div>
      <button id="submit-button" type="submit">Save my availability</button>
    </form>

    <section class="message" id="message" aria-live="polite" hidden><strong id="message-title"></strong><p id="message-text"></p></section>
    <p class="privacy">Your response is only visible to authorised club admins. You can return and submit again to change it while responses are open.</p>
  </main>
  <footer><a href="https://hollybush-rugby.co.uk">hollybush-rugby.co.uk</a></footer>
</body>
</html>`;

export const PLAYER_CSS = String.raw`:root{color-scheme:dark;--black:#090a0b;--panel:#151719;--line:#373b3e;--yellow:#f2c300;--soft:#ffe36d;--text:#f7f4ea;--muted:#aaa89f;--green:#59cf83;--red:#ff746c;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
*{box-sizing:border-box}body{min-height:100vh;margin:0;color:var(--text);background:radial-gradient(circle at 10% 0,rgba(242,195,0,.13),transparent 30rem),repeating-linear-gradient(125deg,transparent 0 22px,rgba(255,255,255,.018) 23px 24px),var(--black)}
header{display:flex;align-items:center;justify-content:space-between;padding:16px max(18px,calc((100vw - 680px)/2));border-bottom:1px solid var(--line);background:rgba(9,10,11,.92)}
.brand{display:flex;align-items:center;gap:11px;color:var(--text);text-decoration:none;text-transform:uppercase;letter-spacing:.04em}.brand span{display:grid;width:42px;height:42px;place-items:center;color:#070707;background:var(--yellow);border:2px solid var(--soft);font-weight:950;transform:skew(-5deg)}header small{color:var(--muted)}
main{width:min(100% - 32px,680px);margin:0 auto;padding:38px 0 60px}.fixture-card,form,.message{border:1px solid var(--line);background:linear-gradient(145deg,rgba(28,31,33,.98),rgba(15,17,18,.98));box-shadow:0 20px 60px rgba(0,0,0,.25)}
.fixture-card{position:relative;padding:28px;border-top:4px solid var(--yellow);overflow:hidden}.fixture-card:after{position:absolute;right:-40px;top:-60px;width:180px;height:180px;content:"";border:1px solid rgba(255,255,255,.06);border-radius:50%}
.eyebrow{margin:0 0 9px;color:var(--yellow);font-size:.72rem;font-weight:900;letter-spacing:.17em;text-transform:uppercase}h1{max-width:540px;margin:0;font-size:clamp(2rem,8vw,3.7rem);line-height:1;letter-spacing:-.05em}.fixture-card>p:not(.eyebrow){margin:15px 0 0;color:var(--muted);line-height:1.5}.venue{display:inline-block;margin-top:18px;padding:7px 10px;color:#070707;background:var(--yellow);font-size:.72rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
form{display:grid;gap:25px;margin-top:16px;padding:28px}.field{display:grid;gap:9px}label,legend{font-weight:850}label span,legend{color:var(--muted)}select,input,textarea,button{font:inherit}select,.pin-field input,textarea{width:100%;min-height:52px;padding:12px 14px;color:var(--text);border:1px solid #50555a;border-radius:0;background:#0c0e0f}textarea{resize:vertical;line-height:1.45}select:focus,input:focus,textarea:focus{outline:2px solid var(--yellow);outline-offset:1px}
fieldset{min-width:0;margin:0;padding:0;border:0}legend{margin-bottom:11px}.status-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.status-choice{position:relative;min-width:0;cursor:pointer}.status-choice input{position:absolute;opacity:0}.status-choice>span{display:block;height:100%;padding:15px 12px;border:1px solid var(--line);background:#0c0e0f}.status-choice strong,.status-choice small{display:block}.status-choice small{margin-top:5px;font-size:.78rem;font-weight:500}.status-choice input:focus+span{outline:2px solid var(--yellow)}.status-choice input:checked+span{color:#070707;border-color:var(--soft);background:var(--yellow)}.status-choice input:checked+span small{color:#292300}
button{min-height:56px;padding:14px 20px;color:#070707;border:1px solid var(--soft);background:var(--yellow);font-weight:950;cursor:pointer;box-shadow:0 8px 28px rgba(242,195,0,.16)}button:disabled{opacity:.45;cursor:not-allowed}.message{margin-top:16px;padding:20px;border-left:4px solid var(--yellow)}.message.success{border-left-color:var(--green)}.message.error{border-left-color:var(--red)}.message p{margin:6px 0 0;color:var(--muted);line-height:1.5}.privacy{margin:18px 8px 0;color:#7f817d;font-size:.78rem;line-height:1.5}footer{padding:22px;text-align:center;border-top:1px solid var(--line)}footer a{color:var(--muted);text-underline-offset:4px}
@media(max-width:560px){header small{display:none}main{padding-top:22px}.fixture-card,form{padding:22px}.status-grid{grid-template-columns:1fr}.status-choice>span{display:flex;align-items:center;justify-content:space-between}.status-choice small{margin:0}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}`;

export const PLAYER_JS = String.raw`(() => {
  const form = document.getElementById('availability-form');
  const playerSelect = document.getElementById('player');
  const submitButton = document.getElementById('submit-button');
  const message = document.getElementById('message');
  let fixtureId = '';

  function showMessage(kind, title, text) {
    message.hidden = false;
    message.className = 'message ' + kind;
    document.getElementById('message-title').textContent = title;
    document.getElementById('message-text').textContent = text;
  }

  function fixtureLabel(fixture) {
    const date = new Date(fixture.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    return date + ' · ' + fixture.kickoff + ' kick-off · ' + fixture.competition;
  }

  async function load() {
    try {
      const response = await fetch('/api/form', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not load availability.');
      fixtureId = body.fixture.id;
      document.getElementById('fixture-title').textContent = 'Hollybush v ' + body.fixture.opponent;
      document.getElementById('fixture-meta').textContent = fixtureLabel(body.fixture);
      document.getElementById('fixture-venue').textContent = body.fixture.venue;
      body.players.forEach(player => {
        const option = document.createElement('option');
        option.value = player.id;
        option.textContent = player.name;
        playerSelect.appendChild(option);
      });
      const remembered = window.localStorage.getItem('hollybush-player');
      if (remembered && Array.from(playerSelect.options).some(option => option.value === remembered)) playerSelect.value = remembered;
      form.hidden = body.locked;
      if (body.locked) showMessage('', 'Responses are locked', 'The coaches have closed availability for this fixture.');
    } catch (error) {
      showMessage('error', 'Could not load the form', error.message || 'Try again in a moment.');
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const selectedStatus = form.querySelector('input[name="status"]:checked');
    if (!playerSelect.value || !selectedStatus) return showMessage('error', 'Complete the form', 'Choose your name and availability.');
    submitButton.disabled = true;
    submitButton.textContent = 'Saving…';
    try {
      const response = await fetch('/api/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fixtureId,
          playerId: playerSelect.value,
          status: selectedStatus.value,
          note: document.getElementById('note').value.trim(),
          pin: document.getElementById('pin').value
        })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Your availability could not be saved.');
      window.localStorage.setItem('hollybush-player', playerSelect.value);
      document.getElementById('pin').value = '';
      showMessage('success', 'Saved — cheers, ' + body.player, 'Your answer is with the coaches. Submit again if it changes.');
    } catch (error) {
      showMessage('error', 'Could not save', error.message || 'Try again in a moment.');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Save my availability';
    }
  });

  load();
})();`;
