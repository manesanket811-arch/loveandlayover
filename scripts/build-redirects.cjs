// Forwarding page for the retired Itinerary Builder (removed August 2026).
// Google and old links still request /itinerary-builder.html?country=Greece&duration=7,
// so this page sends visitors to the matching destination guide (and itinerary tab)
// instead of a dead end. GitHub Pages can't do server redirects, so it uses an
// immediate JavaScript redirect with a meta-refresh fallback.
// Usage: node scripts/build-redirects.cjs   (re-run after adding guides)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data', 'guides');

// slug -> itinerary lengths offered (null when the guide has a single plan)
const guides = {};
for (const f of fs.readdirSync(DATA).filter(f => f.endsWith('.json'))) {
  const g = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
  const it = (g.sections || []).find(s => s.id === 'itineraries') || {};
  guides[g.slug] = it.plans || null;
}

const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Itinerary Builder has moved | Love and Layovers</title>
<link rel="canonical" href="https://www.loveandlayover.in/destinations/">
<script>
  // The old builder lived here; forward to the destination guide it would have shown.
  (function () {
    var G = ${JSON.stringify(guides)};
    var q = new URLSearchParams(location.search);
    var slug = (q.get('country') || '').trim().toLowerCase().replace(/&/g, 'and').replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
    var target = '/destinations/';
    if (slug && Object.prototype.hasOwnProperty.call(G, slug)) {
      target = '/destinations/' + slug + '.html';
      var plans = G[slug], days = parseInt(q.get('duration'), 10);
      if (plans && days) {
        var pick = plans.filter(function (p) { return p <= days; }).pop() || plans[0];
        target += '#itinerary-' + pick;
      } else {
        target += '#itineraries';
      }
    }
    location.replace(target);
  })();
</script>
<meta http-equiv="refresh" content="1; url=/destinations/">
<style>body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#fefaf5;color:#0a1628;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center}a{color:#b5561a;font-weight:700}</style>
</head>
<body>
<p>Our Itinerary Builder has moved into our free destination guides.<br>
Taking you there now… If nothing happens, <a href="/destinations/">browse all destination guides</a>.</p>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'itinerary-builder.html'), page);
console.log(`itinerary-builder.html: forwards to ${Object.keys(guides).length} guides`);
