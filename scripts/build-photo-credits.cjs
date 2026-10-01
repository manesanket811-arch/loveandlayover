// Generate credits.html (photo attribution for the Wikimedia Commons images in
// images/destinations/) from images/destinations/credits.json.
// Run by .github/workflows/fetch-destination-images.yml after fetching.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const credits = JSON.parse(fs.readFileSync(path.join(ROOT, 'images', 'destinations', 'credits.json'), 'utf8'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const label = (key) => {
  const [place, kind] = [key.replace(/-(hero|food)$/, ''), key.endsWith('-food') ? 'food' : 'cover'];
  const name = place.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  return `${name} — ${kind}`;
};

const rows = Object.keys(credits).sort().map(key => {
  const c = credits[key];
  const license = c.licenseUrl ? `<a href="${esc(c.licenseUrl)}" rel="license noopener" target="_blank">${esc(c.license)}</a>` : esc(c.license);
  return `      <li>
        <img src="/images/destinations/${esc(key)}.webp" alt="" loading="lazy" width="160" height="100">
        <div><strong>${esc(label(key))}</strong><br>
        <a href="${esc(c.page)}" rel="noopener" target="_blank">${esc(c.title)}</a> by ${esc(c.artist)}, ${license}, via Wikimedia Commons</div>
      </li>`;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Photo Credits | Love and Layovers</title>
<meta name="description" content="Attribution for the destination photographs used on Love and Layovers.">
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="https://www.loveandlayover.in/credits.html">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/css/modern-theme.css">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,900&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>
  .credits { max-width: 900px; margin: 0 auto; padding: 40px 24px 72px; }
  .credits h1 { font-size: clamp(1.8rem, 4vw, 2.6rem); margin-bottom: 12px; }
  .credits > p { color: var(--grey-500, #6b7280); margin-bottom: 28px; }
  .credits ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 14px; }
  .credits li { display: flex; gap: 16px; align-items: center; padding: 12px; background: #fff; border: 1px solid #ece4d9; border-radius: 12px; font-size: .92rem; line-height: 1.5; }
  .credits li img { width: 120px; height: 75px; object-fit: cover; border-radius: 8px; flex: none; }
  .credits a { color: var(--accent, #d4691d); overflow-wrap: anywhere; }
  @media (max-width: 520px) { .credits li { flex-direction: column; align-items: flex-start; } .credits li img { width: 100%; height: 140px; } }
</style>
</head>
<body>
<header>
  <nav class="wrap nav" aria-label="Main navigation">
    <a href="/" class="logo"><img src="/public/images/brand/logo-mark.svg" alt="" width="34" height="34" style="vertical-align:-0.55em; margin-right:0.4em;">Love and Layovers</a>
    <div class="nav-links">
      <a href="/about.html">About Us</a>
      <a href="/destinations/">Destinations</a>
      <a href="/blog.html">Blog</a>
      <a href="/videos.html">Videos</a>
    </div>
    <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation"><span></span><span></span><span></span></button>
  </nav>
</header>
<main class="credits">
  <h1>Photo credits</h1>
  <p>Destination photos on this site come from Wikimedia Commons and are used under the free licences listed below. Thank you to every photographer.</p>
  <ul>
${rows}
  </ul>
</main>
<script src="/js/nav-toggle.js"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, 'credits.html'), html);
console.log(`credits.html: ${Object.keys(credits).length} photos`);
