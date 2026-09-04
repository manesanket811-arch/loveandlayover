// One-time migration: align the 10 inline-styled blog posts with the unified
// design system (premium palette, Inter body font, standard nav + mobile
// hamburger, skip-link styles). Idempotent — safe to re-run.
const fs = require('fs');
const path = require('path');

const BLOG = path.join(__dirname, '..', 'blog');

const STD_NAV = `<header>
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
</header>`;

// CSS appended to each post's inline <style>: skip link, standard nav bits,
// mobile collapse, focus ring, reduced motion.
const APPEND_CSS = `
/* --- unified nav & a11y (site design system) --- */
.nav { display:flex; align-items:center; justify-content:space-between; gap:24px; }
.nav-links { display:flex; gap:24px; align-items:center; }
.nav-links a { font-weight:500; color:var(--ink, #0a1628); }
.nav-links a:hover { color:var(--accent); }
.nav-toggle { display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:8px; }
.nav-toggle span { width:24px; height:2px; background:var(--ink, #0a1628); border-radius:2px; transition:all .15s ease; }
.nav-toggle.active span:nth-child(1) { transform:translateY(7px) rotate(45deg); }
.nav-toggle.active span:nth-child(2) { opacity:0; }
.nav-toggle.active span:nth-child(3) { transform:translateY(-7px) rotate(-45deg); }
@media (max-width:768px) {
  .nav-toggle { display:flex; }
  .nav-links { display:none; position:absolute; top:100%; left:0; right:0; flex-direction:column; align-items:flex-start; background:var(--paper, #fefaf5); padding:20px 24px; box-shadow:0 12px 24px rgba(0,0,0,.12); gap:16px; }
  .nav-links.active { display:flex; }
  header { position:relative; }
}
.skip-link { position:absolute; top:-48px; left:16px; z-index:2000; background:var(--ink, #0a1628); color:#fff; padding:10px 18px; border-radius:0 0 8px 8px; font-weight:600; }
.skip-link:focus { top:0; color:#fff; }
a:focus-visible, button:focus-visible { outline:3px solid var(--accent); outline-offset:2px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration:.01ms !important; transition-duration:.01ms !important; scroll-behavior:auto !important; }
}
/* --- end unified nav & a11y --- */
`;

const MARKER = 'unified nav & a11y';

for (const file of fs.readdirSync(BLOG).filter(f => f.endsWith('.html'))) {
  const p = path.join(BLOG, file);
  let html = fs.readFileSync(p, 'utf8');
  const orig = html;

  // 1. Palette: old bright palette -> premium palette
  html = html
    .replace(/#ff6b35/gi, '#d4691d')
    .replace(/#f7931e/gi, '#f0a559')
    .replace(/#e55a2b/gi, '#b8541a');

  // 2. Body font: Outfit -> Inter (font link + font-family declarations)
  html = html
    .replace(/family=Outfit:[^&"']*/g, 'family=Inter:wght@400;500;600;700')
    .replace(/'Outfit'/g, "'Inter'");

  // 3. Standardize header: replace any existing <header>...</header> block
  //    (all three variants) with the standard nav.
  html = html.replace(/<header>[\s\S]*?<\/header>/, STD_NAV);

  // 4. Append unified CSS to the first inline <style> (once)
  if (!html.includes(MARKER)) {
    html = html.replace(/<\/style>/, APPEND_CSS + '</style>');
  }

  // 5. Load the shared nav toggle script before </body> (once)
  if (!html.includes('/js/nav-toggle.js')) {
    html = html.replace(/<\/body>/, '<script src="/js/nav-toggle.js" defer></script>\n</body>');
  }

  if (html !== orig) {
    fs.writeFileSync(p, html);
    console.log('updated', file);
  } else {
    console.log('unchanged', file);
  }
}
