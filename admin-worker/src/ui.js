export const ADMIN_HTML = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>Programme Admin | Hollybush RFC</title>
  <link rel="stylesheet" href="/admin.css">
  <script src="/admin.js" defer></script>
</head>
<body>
  <header class="site-header">
    <a class="brand" href="/" aria-label="Hollybush programme admin home">
      <span class="brand-mark" aria-hidden="true">HB</span>
      <span><strong>Hollybush RFC</strong><small>Programme admin</small></span>
    </a>
    <a class="logout" href="/cdn-cgi/access/logout">Sign out</a>
  </header>

  <main>
    <section class="intro">
      <p class="eyebrow">Matchday publishing</p>
      <h1>Put the latest programme online.</h1>
      <p>Select the finished PDF, check the preview and publish. The current programme stays live unless the new file builds successfully.</p>
    </section>

    <section class="panel" aria-labelledby="upload-title">
      <div class="panel-heading">
        <div>
          <p class="step">Step 1</p>
          <h2 id="upload-title">Choose the PDF</h2>
        </div>
        <span class="limit">PDF · max 15 MB</span>
      </div>

      <label class="drop-zone" id="drop-zone" for="programme-file">
        <input id="programme-file" name="programme" type="file" accept="application/pdf,.pdf">
        <span class="upload-icon" aria-hidden="true">↑</span>
        <strong>Drop the programme here</strong>
        <span>or tap to choose it from your device</span>
      </label>

      <div class="selection" id="selection" hidden>
        <div>
          <strong id="file-name"></strong>
          <span id="file-size"></span>
        </div>
        <button class="text-button" id="change-file" type="button">Change</button>
      </div>
    </section>

    <section class="panel preview-panel" id="preview-panel" hidden aria-labelledby="preview-title">
      <div class="panel-heading">
        <div>
          <p class="step">Step 2</p>
          <h2 id="preview-title">Check the preview</h2>
        </div>
      </div>
      <iframe id="pdf-preview" title="Selected programme PDF preview"></iframe>
    </section>

    <section class="publish-panel">
      <div>
        <p class="step">Step 3</p>
        <h2>Publish when ready</h2>
        <p>The conversion normally takes one or two minutes. If it fails, the previous programme remains untouched.</p>
      </div>
      <button class="publish-button" id="publish-button" type="button" disabled>
        <span>Publish programme</span>
      </button>
    </section>

    <section class="status" id="status" aria-live="polite" hidden>
      <span class="status-dot" aria-hidden="true"></span>
      <div>
        <strong id="status-title"></strong>
        <p id="status-message"></p>
        <a id="programme-link" href="https://hollybush-rugby.co.uk/programme.html" target="_blank" rel="noopener" hidden>Open the live programme</a>
      </div>
    </section>
  </main>

  <footer>Hollybush RFC · authorised users only</footer>
</body>
</html>`;

export const ADMIN_CSS = String.raw`:root {
  color-scheme: dark;
  --black: #090a0b;
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

body {
  min-height: 100vh;
  margin: 0;
  color: var(--text);
  background:
    radial-gradient(circle at 15% 0%, rgba(242, 195, 0, .09), transparent 28rem),
    linear-gradient(135deg, #0d0e10, var(--black));
}

body::before {
  position: fixed;
  inset: 0;
  z-index: -1;
  content: "";
  opacity: .18;
  background-image: repeating-linear-gradient(125deg, transparent 0 18px, rgba(255,255,255,.03) 19px 20px);
}

button, input { font: inherit; }

.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 76px;
  padding: 12px max(20px, calc((100vw - 980px) / 2));
  border-bottom: 1px solid var(--line);
  background: rgba(9, 10, 11, .88);
  backdrop-filter: blur(16px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--text);
  text-decoration: none;
}

.brand-mark {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  color: var(--black);
  background: var(--yellow);
  border: 2px solid var(--yellow-soft);
  font-weight: 950;
  transform: skew(-5deg);
}

.brand strong, .brand small { display: block; }
.brand strong { letter-spacing: .03em; text-transform: uppercase; }
.brand small { margin-top: 2px; color: var(--muted); }

.logout {
  color: var(--muted);
  font-size: .9rem;
  text-underline-offset: 4px;
}

main {
  width: min(940px, calc(100% - 32px));
  margin: 0 auto;
  padding: 64px 0 80px;
}

.intro { max-width: 720px; margin-bottom: 36px; }
.eyebrow, .step {
  margin: 0 0 8px;
  color: var(--yellow);
  font-size: .74rem;
  font-weight: 850;
  letter-spacing: .18em;
  text-transform: uppercase;
}

h1, h2 { margin: 0; line-height: 1.05; }
h1 { max-width: 760px; font-size: clamp(2.4rem, 7vw, 5rem); letter-spacing: -.055em; }
h2 { font-size: clamp(1.35rem, 3vw, 1.8rem); }
.intro > p:last-child, .publish-panel p, .status p { color: var(--muted); line-height: 1.65; }
.intro > p:last-child { max-width: 660px; margin: 20px 0 0; font-size: 1.05rem; }

.panel, .publish-panel, .status {
  margin-top: 18px;
  border: 1px solid var(--line);
  background: linear-gradient(145deg, rgba(27,30,33,.98), rgba(16,18,20,.98));
  box-shadow: 0 18px 55px rgba(0,0,0,.28);
}

.panel { padding: clamp(20px, 4vw, 34px); }
.panel-heading, .selection, .publish-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.limit {
  color: var(--muted);
  font-size: .78rem;
  letter-spacing: .1em;
  text-transform: uppercase;
}

.drop-zone {
  display: grid;
  min-height: 230px;
  margin-top: 24px;
  padding: 28px;
  place-items: center;
  align-content: center;
  text-align: center;
  border: 2px dashed #545960;
  background: rgba(255,255,255,.018);
  cursor: pointer;
  transition: border-color .2s, background .2s, transform .2s;
}

.drop-zone:hover, .drop-zone.is-dragging {
  border-color: var(--yellow);
  background: rgba(242,195,0,.06);
  transform: translateY(-2px);
}

.drop-zone input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.drop-zone strong { margin-top: 14px; font-size: 1.2rem; }
.drop-zone span:last-child { margin-top: 7px; color: var(--muted); }
.upload-icon { color: var(--yellow); font-size: 3.5rem; font-weight: 250; line-height: 1; }

.selection {
  margin-top: 18px;
  padding: 17px 18px;
  border-left: 4px solid var(--yellow);
  background: var(--panel-soft);
}

.selection strong, .selection span { display: block; overflow-wrap: anywhere; }
.selection span { margin-top: 4px; color: var(--muted); font-size: .9rem; }
.text-button { padding: 8px; color: var(--yellow); border: 0; background: transparent; cursor: pointer; }

.preview-panel iframe {
  width: 100%;
  height: min(74vh, 760px);
  margin-top: 24px;
  border: 1px solid var(--line);
  background: #fff;
}

.publish-panel { padding: clamp(22px, 4vw, 34px); }
.publish-panel p:last-child { max-width: 560px; margin: 10px 0 0; }

.publish-button {
  flex: 0 0 auto;
  min-width: 210px;
  padding: 17px 24px;
  color: #070707;
  border: 1px solid var(--yellow-soft);
  background: var(--yellow);
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 8px 28px rgba(242,195,0,.18);
}

.publish-button:hover:not(:disabled) { background: var(--yellow-soft); transform: translateY(-1px); }
.publish-button:disabled { opacity: .35; cursor: not-allowed; box-shadow: none; }

.status {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 22px;
}

.status-dot { flex: 0 0 auto; width: 13px; height: 13px; margin-top: 5px; border-radius: 50%; background: var(--yellow); box-shadow: 0 0 0 6px rgba(242,195,0,.12); }
.status.is-success .status-dot { background: var(--success); box-shadow: 0 0 0 6px rgba(88,207,131,.12); }
.status.is-error .status-dot { background: var(--danger); box-shadow: 0 0 0 6px rgba(255,116,108,.12); }
.status p { margin: 5px 0 0; }
.status a { display: inline-block; margin-top: 12px; color: var(--yellow); font-weight: 750; text-underline-offset: 4px; }

footer { padding: 24px; color: #777b7f; text-align: center; font-size: .82rem; }

@media (max-width: 680px) {
  .site-header { min-height: 66px; }
  .brand small { display: none; }
  main { padding-top: 44px; }
  .panel-heading { align-items: flex-start; }
  .limit { max-width: 100px; text-align: right; }
  .drop-zone { min-height: 190px; }
  .preview-panel iframe { height: 62vh; }
  .publish-panel { align-items: stretch; flex-direction: column; }
  .publish-button { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; }
}`;

export const ADMIN_JS = String.raw`(() => {
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

  let selectedFile = null;
  let previewUrl = null;
  let pollTimer = null;

  function formatBytes(bytes) {
    if (bytes < 1024 * 1024) return Math.ceil(bytes / 1024) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

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
    if (!/\.pdf$/i.test(file.name)) {
      showStatus('error', 'That is not a PDF', 'Choose a file ending in .pdf.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      showStatus('error', 'That PDF is too large', 'The maximum upload size is 15 MB.');
      return;
    }

    selectedFile = file;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    fileName.textContent = file.name;
    fileSize.textContent = formatBytes(file.size);
    preview.src = previewUrl;
    selection.hidden = false;
    previewPanel.hidden = false;
    publishButton.disabled = false;
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
        publishButton.disabled = false;
        publishButton.querySelector('span').textContent = 'Publish programme';
        return;
      }
    } catch (error) {
      if (tries > 3) {
        showStatus('error', 'Still processing', 'The upload was accepted, but its status could not be checked. The old programme is still safe.');
        publishButton.disabled = false;
        publishButton.querySelector('span').textContent = 'Publish programme';
        return;
      }
    }

    if (tries >= 48) {
      showStatus('error', 'Taking longer than expected', 'The old programme is still live. Ask Connor to check the GitHub build before trying again.');
      publishButton.disabled = false;
      publishButton.querySelector('span').textContent = 'Publish programme';
      return;
    }

    pollTimer = window.setTimeout(() => pollUntilPublished(version, publicUrl, tries + 1), 5000);
  }

  async function publish() {
    if (!selectedFile) return;
    const confirmed = window.confirm('Publish "' + selectedFile.name + '" as the latest matchday programme?');
    if (!confirmed) return;

    if (pollTimer) window.clearTimeout(pollTimer);
    publishButton.disabled = true;
    publishButton.querySelector('span').textContent = 'Uploading…';
    showStatus('', 'Uploading programme', 'Keep this page open while the PDF is sent securely.');

    const form = new FormData();
    form.append('programme', selectedFile, selectedFile.name);

    try {
      const response = await fetch('/api/programme', { method: 'POST', body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'The upload failed.');

      publishButton.querySelector('span').textContent = 'Building…';
      showStatus('', 'Building the reader', 'The upload is safe. The pages are now being checked and converted.');
      pollUntilPublished(body.version, body.publicUrl, 0);
    } catch (error) {
      showStatus('error', 'Could not publish', error.message || 'Try again in a moment.');
      publishButton.disabled = false;
      publishButton.querySelector('span').textContent = 'Publish programme';
    }
  }

  input.addEventListener('change', () => chooseFile(input.files[0]));
  changeButton.addEventListener('click', resetFile);
  publishButton.addEventListener('click', publish);

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, event => {
      event.preventDefault();
      dropZone.classList.add('is-dragging');
    });
  });
  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, event => {
      event.preventDefault();
      dropZone.classList.remove('is-dragging');
    });
  });
  dropZone.addEventListener('drop', event => chooseFile(event.dataTransfer.files[0]));
  window.addEventListener('beforeunload', () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (pollTimer) window.clearTimeout(pollTimer);
  });
})();`;
