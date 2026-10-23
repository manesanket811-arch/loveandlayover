// Build trip-finder.html: the "Where should you go?" quiz.
// Destination traits live in data/trip-finder.json; names, visa notes and itinerary
// lengths come from data/guides/*.json; Klook picks from data/klook.json.
// The quiz logic is in src/js/trip-finder.js (minified to js/trip-finder.js).
// Usage: node scripts/build-trip-finder.cjs
const fs = require('fs');
const path = require('path');
const { header, footer, HEAD_LINKS, SCRIPT, GA, FONTS } = require('./site-chrome.cjs');
const { DATA: KLOOK, klookUrl } = require('./affiliates.cjs');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.loveandlayover.in';
const URL_ = `${SITE}/trip-finder.html`;
const TRAITS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'trip-finder.json'), 'utf8')).destinations;
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Flags come from the homepage destination cards (same as the guides)
const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FLAG = {};
for (const m of home.matchAll(/<a class="dest"[^>]*href="\/destinations\/([\w-]+)\.html"[^>]*>[\s\S]*?<img class="flag" src="([^"]+)"/g)) FLAG[m[1]] = m[2];

const dests = [];
for (const [slug, t] of Object.entries(TRAITS)) {
  const g = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'guides', `${slug}.json`), 'utf8'));
  const it = g.sections.find(s => s.id === 'itineraries') || {};
  const visa = g.badges.visa || '';
  const k = (KLOOK.guides[slug] || [])[0];
  const product = k && KLOOK.aid ? KLOOK.products[k] : null;
  dests.push({
    s: slug, n: g.country, f: FLAG[slug] || '', img: `/images/destinations/thumbs/${slug}-hero.webp`,
    bt: g.badges.best || '', v: visa.charAt(0).toUpperCase() + visa.slice(1),
    plans: it.plans || null, days: (it.days || []).length, filmed: !!g.filmed,
    k: product ? { n: product.name, u: klookUrl(product.url), id: k } : null,
    ...t,
  });
}

const title = 'Where Should I Travel? Trip Finder Quiz for Indians';
const desc = 'Answer 6 quick questions on budget, days, month and travel style, and get your best-matched destinations with a rough cost in rupees and a ready itinerary.';
const ld = (o) => `<script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n</script>`;

const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${URL_}">
<meta name="robots" content="index, follow">
<meta property="og:type" content="website">
<meta property="og:title" content="Where should you travel next? Take the quiz">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${URL_}">
<meta property="og:site_name" content="Love and Layovers">
<meta property="og:image" content="${SITE}/images/og/trip-finder.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Where should you travel next? Take the quiz">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/images/og/trip-finder.jpg">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${FONTS}
${ld({ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Trip Finder Quiz', url: URL_, description: desc, applicationCategory: 'TravelApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' }, creator: { '@type': 'Organization', '@id': `${SITE}/#organization`, name: 'Love and Layovers' } })}
${ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: 'Destinations', item: `${SITE}/destinations/` }, { '@type': 'ListItem', position: 3, name: 'Trip finder quiz', item: URL_ }] })}
${GA}
<link rel="stylesheet" href="/css/site.css?v=1">
${HEAD_LINKS}
<style>
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .tf-hero { background: var(--navy) url('/images/destinations/thumbs/bali-hero.webp') center / cover; position: relative; color: #fff; }
  .tf-hero::before { content: ''; position: absolute; inset: 0; background: linear-gradient(100deg, rgba(10,22,40,.95) 0%, rgba(10,22,40,.8) 55%, rgba(10,22,40,.45) 100%); }
  .tf-hero .wrap { position: relative; padding-top: 52px; padding-bottom: 44px; }
  .tf-hero h1 { font-size: clamp(2rem, 4.4vw, 3.2rem); font-weight: 900; max-width: 760px; }
  .tf-hero h1 em { font-style: italic; color: #f0a559; }
  .tf-hero p { margin-top: 12px; max-width: 640px; font-size: 1.08rem; color: rgba(255,255,255,.86); }
  .post-crumbs { font-size: .85rem; color: rgba(255,255,255,.75); margin-bottom: 14px; }
  .post-crumbs a { color: #fff; font-weight: 600; }

  .tf { padding-top: 32px; padding-bottom: 64px; }
  .tf-card { max-width: 820px; margin: 0 auto; background: #fff; border: 1px solid var(--line); border-radius: 24px; padding: 28px; box-shadow: var(--shadow-sm); }
  .tf-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
  .tf-step { font-size: .78rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--accent); }
  .tf-back { border: 0; background: none; font: 600 .9rem var(--sans); color: var(--ink-soft); cursor: pointer; padding: 6px 2px; }
  .tf-back[hidden] { display: none; }
  .tf-bar { height: 6px; border-radius: 999px; background: var(--sand); overflow: hidden; margin-bottom: 22px; }
  .tf-bar i { display: block; height: 100%; width: 0; background: var(--accent); border-radius: 999px; transition: width .3s ease; }
  .tf-q h2 { font-size: clamp(1.4rem, 3vw, 1.9rem); font-weight: 900; line-height: 1.2; }
  .tf-q p.hint { margin: 6px 0 0; color: var(--muted); font-size: .95rem; }
  .tf-opts { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; margin-top: 20px; }
  .tf-opts.months { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); }
  .tf-opt { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left; padding: 16px; border: 2px solid var(--line); border-radius: 16px; background: #fffdf9; font: inherit; color: var(--ink); cursor: pointer; transition: border-color .15s ease, transform .15s ease, background .15s ease; }
  .tf-opt:hover { border-color: var(--accent); transform: translateY(-2px); }
  .tf-opt:focus-visible { outline: 3px solid rgba(212,105,29,.4); outline-offset: 2px; }
  .tf-opt[aria-pressed="true"] { border-color: var(--accent); background: var(--accent-soft); }
  .tf-opt .e { font-size: 1.5rem; line-height: 1; }
  .tf-opt b { font-size: 1rem; }
  .tf-opt small { font-size: .82rem; color: var(--muted); line-height: 1.35; }
  .months .tf-opt { align-items: center; text-align: center; padding: 14px 8px; }

  .tf-results h2 { font-size: clamp(1.6rem, 3.4vw, 2.2rem); font-weight: 900; }
  .tf-sum { margin-top: 8px; color: var(--muted); }
  .tf-list { display: grid; gap: 18px; margin-top: 22px; }
  .tf-res { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 0; border: 1px solid var(--line); border-radius: 20px; overflow: hidden; background: #fff; }
  .tf-res.top { border: 2px solid var(--accent); box-shadow: 0 16px 40px rgba(212,105,29,.14); }
  .tf-img { position: relative; background: var(--navy) center / cover; min-height: 200px; }
  .tf-rank { position: absolute; top: 12px; left: 12px; background: #fff; color: var(--ink); font-size: .74rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; padding: 5px 10px; border-radius: 999px; }
  .tf-res.top .tf-rank { background: var(--accent); color: #fff; }
  .tf-body { padding: 18px 20px 20px; }
  .tf-name { display: flex; align-items: center; gap: 10px; }
  .tf-name img { width: 30px; height: 22px; border-radius: 3px; box-shadow: 0 1px 4px rgba(0,0,0,.2); }
  .tf-name h3 { font-size: 1.4rem; font-weight: 900; margin: 0; }
  .tf-match { margin-left: auto; font-size: .8rem; font-weight: 700; color: var(--accent); white-space: nowrap; }
  .tf-line { margin: 6px 0 0; color: var(--ink-soft); }
  .tf-why { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
  .tf-why span { font-size: .78rem; font-weight: 600; padding: 5px 10px; border-radius: 999px; background: var(--sand); color: var(--ink); }
  .tf-why span.warn { background: #fff3e6; color: #9a4a12; }
  .tf-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 14px; }
  .tf-facts div { background: #fffaf3; border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px; }
  .tf-facts small { display: block; font-size: .68rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
  .tf-facts b { display: block; margin-top: 2px; font-size: .9rem; line-height: 1.35; }
  .tf-cta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
  .tf-cta .btn { padding: 11px 16px; font-size: .88rem; white-space: normal; text-align: center; }
  .btn-klook { background: #c9410f; color: #fff; }
  .btn-klook:hover { background: #a93a0d; color: #fff; }
  .tf-share { margin-top: 26px; padding: 20px; border-radius: 18px; background: var(--navy); color: #fff; display: flex; flex-wrap: wrap; align-items: center; gap: 14px; justify-content: space-between; }
  .tf-share p { margin: 0; font-weight: 600; }
  .tf-share .row { display: flex; flex-wrap: wrap; gap: 8px; }
  .btn-wa { background: #25d366; color: #fff; }
  .btn-light2 { background: #fff; color: var(--ink); }
  .tf-note { margin-top: 18px; font-size: .82rem; color: var(--muted); }
  .tf-more { margin-top: 26px; }
  .tf-more h3 { font-size: 1.1rem; font-weight: 800; }
  .tf-more ul { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; padding: 0; margin: 10px 0 0; }
  .tf-more a { display: inline-block; padding: 8px 14px; border: 1px solid var(--line); border-radius: 999px; background: #fff; font-size: .88rem; font-weight: 600; }
  .tf-more a:hover { border-color: var(--accent); }
  @media (max-width: 680px) {
    .tf-card { padding: 20px 16px; border-radius: 20px; }
    .tf-opts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .tf-opts.months { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .tf-res { grid-template-columns: minmax(0, 1fr); }
    .tf-img { min-height: 150px; }
    .tf-facts { grid-template-columns: minmax(0, 1fr); }
    .tf-cta .btn { flex: 1 1 100%; justify-content: center; }
  }
</style>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
${header('destinations')}

<main id="main">
<section class="tf-hero">
  <div class="wrap">
    <nav class="post-crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/destinations/">Destinations</a> › Trip finder</nav>
    <h1>Where should you <em>travel next?</em></h1>
    <p>Six quick questions. We'll match you with the destinations that fit your budget, dates and travel style, with a rough cost in rupees and a ready-made itinerary.</p>
  </div>
</section>

<section class="wrap tf">
  <div class="tf-card" id="tf" aria-live="polite">
    <noscript><p>The quiz needs JavaScript. Browse all <a href="/destinations/">our destination guides</a> instead.</p></noscript>
  </div>
</section>
</main>

${footer()}

<script type="application/json" id="tf-data">${JSON.stringify(dests).replace(/</g, '\\u003c')}</script>
${SCRIPT}
<script src="/js/trip-finder.js" defer></script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'trip-finder.html'), page);
console.log(`trip-finder.html: ${dests.length} destinations`);
