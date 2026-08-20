/* Hollybush RFC - coaches' playbook access
 *
 * Load with a single line placed just above </body> in index.html:
 *     <script src="playbook-nav.js"></script>
 *
 * Five taps on the crest within 3 seconds reveals a Playbook link in the nav.
 * Visiting /#coaches reveals it too. Once revealed it stays revealed on that
 * device; clearing site data hides it again.
 *
 * This is a curtain, not a lock. Anyone who types playbook.html gets in, which
 * is fine - no plays or clips are ever stored on the site.
 */
(function () {
  var KEY       = 'hb_playbook';
  var TAPS      = 5;      // taps on the crest
  var WINDOW_MS = 3000;   // ...within this many ms
  var taps      = [];

  function addLink() {
    if (document.getElementById('nav-playbook')) return;
    var ul = document.getElementById('nav-links');
    if (!ul) return;
    var li = document.createElement('li');
    li.id = 'nav-playbook';
    li.innerHTML = '<a href="playbook.html">Playbook</a>';
    ul.appendChild(li);
  }

  function unlock() {
    try { localStorage.setItem(KEY, '1'); } catch (e) { /* private mode */ }
    addLink();
  }

  // Already unlocked on this device?
  try { if (localStorage.getItem(KEY) === '1') addLink(); } catch (e) {}

  // Direct route, for sending to a coach who cannot be doing with tapping.
  if (location.hash === '#coaches') unlock();

  // Tap the crest five times.
  var crest = document.querySelector('.nav-logo img');
  if (crest) {
    crest.addEventListener('click', function () {
      var now = Date.now();
      taps = taps.filter(function (t) { return now - t < WINDOW_MS; });
      taps.push(now);
      if (taps.length >= TAPS) { taps = []; unlock(); }
    });
  }
})();
