// Build blog.html (the blog listing) from data/blog.json.
// Magazine layout: featured lead story + side stories, instant search, topic tabs
// (All / one section), section previews with "View all", swipeable rows on phones.
// Every card is in the HTML for search engines; the script only filters what's shown.
// Usage: node scripts/build-blog.cjs   (after adding a post to data/blog.json)
const fs = require('fs');
const path = require('path');
const { header, footer, HEAD_LINKS, SCRIPT, GA, FONTS, waChannelBtn } = require('./site-chrome.cjs');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.loveandlayover.in';
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'blog.json'), 'utf8'));
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const PREVIEW = 4; // cards per section in the "All" view
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// "Singapore news" section, built from posts marked "news": true (newest first).
// News posts are removed from the other sections so each appears once.
const { altFor } = require('./image-alts.cjs');
const NEWS = fs.readdirSync(path.join(ROOT, 'data', 'posts')).filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'posts', f), 'utf8'))).filter(p => p.news)
  .sort((a, b) => (b.modified || b.published).localeCompare(a.modified || a.published) || (b.priority || 0) - (a.priority || 0));
if (NEWS.length) {
  const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hrefs = NEWS.map(p => `/blog/${p.slug}.html`);
  for (const p of NEWS) {
    const h = `/blog/${p.slug}.html`, img = `/images/destinations/thumbs/${p.hero}.webp`, [y, m] = p.published.split('-');
    data.posts[h] = Object.assign({ img, alt: altFor(img), title: p.h1, desc: p.dek, meta: `${p.read || 5} min read` }, data.posts[h] || {}, { chips: [p.newsTopic || 'News'], date: `${SHORT[+m - 1]} ${y}` });
  }
  for (const s of data.sections) s.posts = s.posts.filter(h => !hrefs.includes(h));
  data.sections.unshift({ id: 'news', kicker: 'Singapore news', title: 'Latest Singapore news', intro: 'Visa and work pass changes, Malaysia and JB travel, transport and events, and what they mean for you.', posts: hrefs, link: '/singapore-news.html' });
}
for (const s of data.sections) for (const h of s.posts) if (!data.posts[h]) throw new Error(`blog.json: no card for ${h}`);
for (const h of data.featured || []) if (!data.posts[h]) throw new Error(`blog.json: featured ${h} has no card`);

// Section of each post (first section that lists it)
const sectionOf = {};
for (const s of data.sections) for (const h of s.posts) if (!sectionOf[h]) sectionOf[h] = s;

// Sortable date: the post's published date when we build it, else its listing month
function dateOf(h) {
  const m = h.match(/^\/blog\/([\w-]+)\.html$/);
  const f = m && path.join(ROOT, 'data', 'posts', `${m[1]}.json`);
  if (f && fs.existsSync(f)) {
    const p = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (p.published) return p.published;
  }
  const [mon, yr] = String(data.posts[h].date || '').toLowerCase().split(/\s+/);
  const i = MONTHS.indexOf((mon || '').slice(0, 3));
  return i >= 0 && yr ? `${yr}-${String(i + 1).padStart(2, '0')}-01` : '2026-01-01';
}
const isNew = (h) => (Date.parse('2026-11-30') - Date.parse(dateOf(h))) / 864e5 <= 45 && data.posts[h].date === 'Nov 2026';
const trending = new Set(data.trending || []);
const text = (h) => { const p = data.posts[h]; return [p.title, p.desc, ...(p.chips || []), sectionOf[h] ? sectionOf[h].kicker : ''].join(' ').toLowerCase(); };

function badge(h) {
  if (trending.has(h)) return '<span class="tag tag-hot">Trending</span>';
  if (isNew(h)) return '<span class="tag tag-new">New</span>';
  return '';
}

function card(h, i) {
  const p = data.posts[h];
  const s = sectionOf[h];
  return `        <a class="card" href="${h}" data-i="${i}" data-q="${esc(text(h))}">
          <span class="card-img"><img src="${p.img}" alt="${esc(p.alt)}" loading="lazy" width="640" height="400"${p.pos ? ` style="object-position:${p.pos}"` : ''}>${badge(h)}</span>
          <span class="card-body"><span class="card-kicker">${esc((p.chips || [])[0] || s.kicker)}</span><b class="card-title">${esc(p.title)}</b><span class="card-desc">${esc(p.desc)}</span><span class="card-meta">${esc(p.meta)} · ${esc(p.date)}</span></span>
        </a>`;
}

const [lead, ...side] = data.featured || [];
const big = (src) => src.replace('/thumbs/', '/');
const featured = lead ? `<section class="feat" aria-label="Featured">
  <div class="wrap feat-grid">
    <a class="feat-lead" href="${lead}">
      <img src="${big(data.posts[lead].img)}" alt="${esc(data.posts[lead].alt)}" width="1200" height="760" fetchpriority="high">
      <span class="feat-lead-body">${badge(lead) || `<span class="tag">${esc(sectionOf[lead].kicker)}</span>`}<b>${esc(data.posts[lead].title)}</b><span>${esc(data.posts[lead].desc)}</span><span class="feat-meta">${esc(data.posts[lead].meta)} · ${esc(data.posts[lead].date)}</span></span>
    </a>
    <div class="feat-side">
      <p class="feat-label">Start here</p>
${side.map(h => `      <a class="feat-item" href="${h}"><img src="${data.posts[h].img}" alt="${esc(data.posts[h].alt)}" loading="lazy" width="320" height="220"><span><span class="card-kicker">${esc(sectionOf[h].kicker)}</span><b>${esc(data.posts[h].title)}</b><span class="card-meta">${esc(data.posts[h].meta)}</span></span></a>`).join('\n')}
    </div>
  </div>
</section>` : '';

const total = new Set(data.sections.flatMap(s => s.posts)).size;
const sections = data.sections.map(s => `  <section class="sec" id="${s.id}" data-sec="${s.id}" aria-labelledby="${s.id}-t">
    <div class="sec-head">
      <div><span class="kicker">${esc(s.kicker)}</span><h2 id="${s.id}-t">${esc(s.title)}</h2><p>${esc(s.intro)}</p></div>
      ${s.link ? `<a class="sec-all sec-link" href="${s.link}">All news <span aria-hidden="true">→</span></a>` : `<a class="sec-all" href="?topic=${s.id}" data-topic="${s.id}">View all ${s.posts.length} <span aria-hidden="true">→</span></a>`}
    </div>
    <div class="cards">
${s.posts.map((h, i) => card(h, i)).join('\n')}
    </div>
  </section>`).join('\n');

const title = 'Blog: Moving to Singapore & Travel Guides | Love and Layovers';
const desc = 'Moving to Singapore from India: jobs, salary, renting and life here. Plus Singapore travel guides, Asia itineraries and visa news, with costs in rupees.';
const all = [...new Set(data.sections.flatMap(s => s.posts))];
const ld = (o) => `<script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n</script>`;
const wa = waChannelBtn('Join our WhatsApp Channel');

const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script>document.documentElement.classList.add('js')</script>
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}/blog.html">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}/blog.html">
<meta property="og:site_name" content="Love and Layovers">
<meta property="og:image" content="${SITE}/images/og/default.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/images/og/default.jpg">
<link rel="alternate" type="application/rss+xml" title="Love and Layovers Travel Blog" href="${SITE}/feed.xml">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${lead ? `<link rel="preload" as="image" href="${big(data.posts[lead].img)}" type="image/webp">` : ''}
${FONTS}
${ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
  { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
  { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog.html` }] })}
${ld({ '@context': 'https://schema.org', '@type': 'Blog', '@id': `${SITE}/blog.html#blog`, name: 'Love and Layovers Blog', url: `${SITE}/blog.html`, description: desc,
  publisher: { '@id': `${SITE}/#organization` },
  blogPost: all.filter(h => h.startsWith('/blog/')).map(h => ({ '@type': 'BlogPosting', headline: data.posts[h].title, url: SITE + h, datePublished: dateOf(h) })) })}
${GA}
<link rel="stylesheet" href="/css/site.css?v=1">
<style>
  /* ---------- Hero ---------- */
  .bh { padding: 44px 0 26px; position: relative; overflow: hidden; }
  .bh::before { content: ''; position: absolute; width: 700px; height: 700px; right: -260px; top: -340px; background: radial-gradient(closest-side, rgba(240,165,89,.25), transparent); pointer-events: none; }
  .bh .wrap { position: relative; display: grid; grid-template-columns: 1.2fr 1fr; gap: 40px; align-items: end; }
  .bh h1 { font-size: clamp(2.2rem, 4.4vw, 3.4rem); font-weight: 900; line-height: 1.05; margin-top: 12px; }
  .bh h1 em { font-style: italic; font-weight: 600; color: var(--accent); }
  .bh p { color: var(--ink-soft); margin-top: 12px; font-size: 1.05rem; max-width: 560px; }
  .bsearch { position: relative; }
  .bsearch input { width: 100%; height: 58px; border-radius: 999px; border: 1px solid var(--line); background: #fff; padding: 0 52px 0 54px; font: inherit; font-size: 1rem; color: var(--ink); box-shadow: var(--shadow-sm); transition: border-color .2s, box-shadow .2s; }
  .bsearch input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 4px rgba(181,86,26,.12), var(--shadow-sm); }
  .bsearch input::-webkit-search-cancel-button, .bsearch input::-webkit-search-decoration { -webkit-appearance: none; appearance: none; display: none; }
  .bsearch svg { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
  .bsearch button { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 38px; height: 38px; border-radius: 50%; border: 0; background: var(--sand); color: var(--ink-soft); font-size: 1.1rem; cursor: pointer; display: none; }
  .bsearch.has-q button { display: block; }
  .bsearch-hint { margin-top: 10px; font-size: .85rem; color: var(--muted); }
  .bsearch-hint button { border: 0; background: none; color: var(--accent); font: inherit; font-weight: 600; cursor: pointer; padding: 0 2px; }
  @media (max-width: 900px) { .bh .wrap { grid-template-columns: 1fr; gap: 22px; } }
  /* ---------- Topic tabs ---------- */
  .tabs { position: sticky; top: 72px; z-index: 20; background: rgba(254,250,245,.92); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
  .tabs .wrap { display: flex; gap: 6px; overflow-x: auto; padding-top: 10px; padding-bottom: 10px; scrollbar-width: none; }
  .tabs .wrap::-webkit-scrollbar { display: none; }
  .tab { flex: none; display: inline-flex; align-items: center; gap: 8px; padding: 9px 16px; border-radius: 999px; border: 1px solid var(--line); background: #fff; font: inherit; font-size: .9rem; font-weight: 600; color: var(--ink-soft); cursor: pointer; transition: background .2s, color .2s, border-color .2s; }
  .tab small { font-size: .75rem; padding: 1px 7px; border-radius: 999px; background: var(--sand); color: var(--muted); }
  .tab:hover { border-color: var(--ink-soft); }
  .tab[aria-selected="true"] { background: var(--navy); border-color: var(--navy); color: #fff; }
  .tab[aria-selected="true"] small { background: rgba(255,255,255,.18); color: #fff; }
  /* ---------- Featured ---------- */
  .feat { padding: 28px 0 8px; }
  .feat-grid { display: grid; grid-template-columns: 1.55fr 1fr; gap: 22px; }
  .feat-lead { position: relative; display: block; min-height: 420px; border-radius: 26px; overflow: hidden; color: #fff; background: var(--navy); box-shadow: var(--shadow); }
  .feat-lead img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .8s ease; }
  .feat-lead:hover img { transform: scale(1.04); }
  .feat-lead::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,22,40,.92), rgba(10,22,40,.35) 55%, rgba(10,22,40,.05)); }
  .feat-lead-body { position: absolute; z-index: 1; left: 0; right: 0; bottom: 0; padding: 30px; display: flex; flex-direction: column; gap: 10px; }
  .feat-lead-body b { font-family: var(--serif); font-size: clamp(1.6rem, 3vw, 2.4rem); font-weight: 900; line-height: 1.1; }
  .feat-lead-body > span:not(.tag) { color: rgba(255,255,255,.86); max-width: 620px; }
  .feat-lead-body .feat-meta { font-size: .85rem; color: rgba(255,255,255,.7) !important; }
  .feat-side { display: flex; flex-direction: column; gap: 12px; }
  .feat-label { font-size: .75rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--accent); }
  .feat-item { flex: 1; display: grid; grid-template-columns: 132px 1fr; gap: 16px; align-items: center; background: #fff; border: 1px solid var(--line); border-radius: 18px; padding: 10px; transition: transform .25s, box-shadow .25s; }
  .feat-item:hover { transform: translateX(4px); box-shadow: var(--shadow); }
  .feat-item img { width: 132px; height: 100px; object-fit: cover; border-radius: 12px; }
  .feat-item b { display: block; font-size: 1rem; line-height: 1.3; margin: 3px 0 4px; color: var(--ink); }
  @media (max-width: 900px) { .feat-grid { grid-template-columns: 1fr; } .feat-lead { min-height: 340px; } .feat-item { grid-template-columns: 104px 1fr; } .feat-item img { width: 104px; height: 84px; } }
  /* ---------- Tags ---------- */
  .tag { align-self: flex-start; display: inline-block; font-size: .7rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; padding: 5px 10px; border-radius: 999px; background: var(--accent); color: #fff; }
  .tag-hot { background: #dc2626; }
  .tag-hot::before { content: ''; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #fff; margin-right: 6px; vertical-align: 1px; animation: pulse 1.6s infinite; }
  .tag-new { background: var(--teal, #1a9b8e); }
  @keyframes pulse { 50% { opacity: .3; } }
  /* ---------- Sections + cards ---------- */
  .status { padding: 22px 0 0; color: var(--muted); font-size: .92rem; min-height: 1.5em; }
  .sec { padding: 34px 0 18px; scroll-margin-top: 140px; }
  .sec-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; margin-bottom: 20px; }
  .sec-head h2 { font-size: clamp(1.5rem, 2.6vw, 2rem); font-weight: 900; margin: 6px 0 4px; }
  .sec-head p { color: var(--ink-soft); max-width: 640px; font-size: .97rem; }
  .sec-all { flex: none; font-weight: 700; color: var(--accent); white-space: nowrap; padding: 8px 0; }
  .sec-all:hover { text-decoration: underline; }
  .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
  .card { display: flex; flex-direction: column; background: #fff; border: 1px solid var(--line); border-radius: 18px; overflow: hidden; transition: transform .25s ease, box-shadow .25s ease, border-color .25s; animation: rise .35s ease both; }
  .card:hover { transform: translateY(-5px); box-shadow: var(--shadow); border-color: transparent; }
  @keyframes rise { from { opacity: 0; transform: translateY(8px); } }
  .card-img { position: relative; display: block; aspect-ratio: 16 / 10; overflow: hidden; background: var(--sand); }
  .card-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .6s ease; }
  .card:hover .card-img img { transform: scale(1.06); }
  .card-img .tag { position: absolute; left: 12px; top: 12px; }
  .card-body { padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 7px; flex: 1; }
  .card-kicker { font-size: .72rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
  .card-title { font-size: 1.04rem; line-height: 1.32; color: var(--ink); }
  .card-desc { color: var(--ink-soft); font-size: .9rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .card-meta { margin-top: auto; padding-top: 4px; font-size: .8rem; color: var(--muted); }
  /* View states (set on <main data-view>) */
  .js main[data-view="all"] .sec .card:nth-child(n+${PREVIEW + 1}) { display: none; }
  .js main[data-view="topic"] .sec:not(.on) { display: none; }
  .js main[data-view="topic"] .sec-all, .js main[data-view="search"] .sec-all { display: none; }
  .js main[data-view="topic"] .feat, .js main[data-view="search"] .feat { display: none; }
  .js main[data-view="search"] .card:not(.hit) { display: none; }
  .js main[data-view="search"] .sec:not(.has-hit) { display: none; }
  .empty { display: none; text-align: center; padding: 60px 20px; color: var(--muted); }
  .empty b { display: block; font-size: 1.2rem; color: var(--ink); margin-bottom: 6px; }
  main.no-hits .empty { display: block; }
  @media (max-width: 1100px) { .cards { grid-template-columns: repeat(3, 1fr); } .js main[data-view="all"] .sec .card:nth-child(n+${PREVIEW}) { display: none; } }
  @media (max-width: 760px) {
    .cards { grid-template-columns: repeat(2, 1fr); gap: 14px; }
    .tabs { top: 64px; }
    .sec-head { align-items: flex-start; }
    .sec-head p { display: none; }
    /* Swipeable rows in the "All" view */
    .js main[data-view="all"] .cards { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; gap: 14px; margin: 0 -16px; padding: 4px 16px 14px; scrollbar-width: none; }
    .js main[data-view="all"] .cards::-webkit-scrollbar { display: none; }
    .js main[data-view="all"] .card { flex: 0 0 74%; scroll-snap-align: start; }
    .js main[data-view="all"] .sec .card:nth-child(n) { display: flex; }
  }
  @media (max-width: 480px) { .cards { grid-template-columns: 1fr; } .card-desc { -webkit-line-clamp: 2; } }
  /* ---------- Bottom bands ---------- */
  .bands { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 48px 0 72px; }
  .band { border-radius: 26px; padding: 36px; position: relative; overflow: hidden; }
  .band h2 { font-size: clamp(1.4rem, 2.4vw, 1.8rem); font-weight: 900; margin: 6px 0 8px; }
  .band p { margin-bottom: 18px; }
  .band-dark { background: var(--navy); color: #fff; }
  .band-dark p { color: rgba(255,255,255,.75); }
  .band-dark::before { content: ''; position: absolute; width: 380px; height: 380px; right: -140px; top: -180px; background: radial-gradient(closest-side, rgba(212,105,29,.35), transparent); }
  .band-wa { background: #e8f8ee; border: 1px solid #c7ecd5; }
  .band-wa p { color: var(--ink-soft); }
  .band > * { position: relative; }
  @media (max-width: 760px) { .bands { grid-template-columns: 1fr; } .band { padding: 28px 22px; } }
  @media (prefers-reduced-motion: reduce) { .card, .tag-hot::before { animation: none; } }
</style>
${HEAD_LINKS}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>

${header('blog')}

<main id="main" data-view="all">
<section class="bh">
  <div class="wrap">
    <div>
      <span class="eyebrow"><span class="dot" aria-hidden="true"></span>The blog · from Indians living in Singapore</span>
      <h1>Moving to Singapore, and <em>travelling</em> from it</h1>
      <p>Honest guides on jobs, money and life in Singapore, plus trip guides with real costs in rupees.</p>
    </div>
    <div>
      <label class="bsearch" id="bsearch">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>
        <span class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Search the blog</span>
        <input type="search" id="bq" placeholder="Search ${total} guides: visa, salary, Japan…" autocomplete="off" enterkeyhint="search">
        <button type="button" id="bclear" aria-label="Clear search">×</button>
      </label>
      <p class="bsearch-hint">Popular: <button type="button" data-q="visa">visa</button> · <button type="button" data-q="salary">salary</button> · <button type="button" data-q="rent">rent</button> · <button type="button" data-q="japan">Japan</button> · <button type="button" data-q="malaysia">Malaysia</button></p>
    </div>
  </div>
</section>

<nav class="tabs" aria-label="Blog topics">
  <div class="wrap" role="tablist">
    <button class="tab" type="button" role="tab" data-topic="all" aria-selected="true">All<small>${total}</small></button>
${data.sections.map(s => `    <button class="tab" type="button" role="tab" data-topic="${s.id}" aria-selected="false">${esc(s.kicker)}<small>${s.posts.length}</small></button>`).join('\n')}
  </div>
</nav>

${featured}

<div class="wrap">
  <p class="status" id="bstatus" aria-live="polite"></p>
${sections}
  <div class="empty"><b>No guides match that search</b>Try another word, or <a href="/blog.html" data-reset>browse all guides</a>.</div>

  <div class="bands">
    <div class="band band-dark reveal">
      <span class="kicker">Destination guides</span>
      <h2>Free destination guides</h2>
      <p>Day-by-day itineraries, visa tips and daily budgets in rupees, from Singapore and Japan to Iceland and Peru.</p>
      <a href="/destinations/" class="btn btn-light">Browse all destinations <span aria-hidden="true">→</span></a>
    </div>
    <div class="band band-wa reveal">
      <span class="kicker">Never miss a guide</span>
      <h2>New guides and visa news on WhatsApp</h2>
      <p>We post new guides, visa updates like the Malaysia change, and Singapore tips on our WhatsApp Channel.</p>
      ${wa || '<a class="btn btn-primary" href="https://www.youtube.com/@LoveAndLayover?sub_confirmation=1" target="_blank" rel="noopener">Subscribe on YouTube</a>'}
    </div>
  </div>
</div>
</main>

${footer()}

${SCRIPT}
<script>
(function () {
  var main = document.getElementById('main');
  var q = document.getElementById('bq'), box = document.getElementById('bsearch'), status = document.getElementById('bstatus');
  var tabs = [].slice.call(document.querySelectorAll('.tab'));
  var secs = [].slice.call(document.querySelectorAll('.sec'));
  var names = {}; tabs.forEach(function (t) { names[t.dataset.topic] = t.firstChild.textContent; });
  var topic = 'all', timer;

  function setUrl() {
    var u = new URL(location.href);
    topic === 'all' ? u.searchParams.delete('topic') : u.searchParams.set('topic', topic);
    q.value.trim() ? u.searchParams.set('q', q.value.trim()) : u.searchParams.delete('q');
    history.replaceState(null, '', u.pathname + u.search + u.hash);
  }

  function render() {
    var term = q.value.trim().toLowerCase();
    box.classList.toggle('has-q', !!term);
    main.classList.remove('no-hits');
    tabs.forEach(function (t) { t.setAttribute('aria-selected', t.dataset.topic === topic && !term ? 'true' : 'false'); });
    if (term) {
      var words = term.split(/\\s+/), hits = 0, seen = {};
      secs.forEach(function (s) {
        var any = false;
        [].forEach.call(s.querySelectorAll('.card'), function (c) {
          var ok = words.every(function (w) { return c.dataset.q.indexOf(w) !== -1; }) && !seen[c.getAttribute('href')];
          c.classList.toggle('hit', ok);
          if (ok) { any = true; hits++; seen[c.getAttribute('href')] = 1; }
        });
        s.classList.toggle('has-hit', any);
      });
      main.dataset.view = 'search';
      status.textContent = hits ? hits + (hits === 1 ? ' guide' : ' guides') + ' matching “' + q.value.trim() + '”' : '';
      if (!hits) main.classList.add('no-hits');
    } else if (topic !== 'all') {
      main.dataset.view = 'topic';
      secs.forEach(function (s) { s.classList.toggle('on', s.dataset.sec === topic); });
      var n = document.querySelectorAll('.sec.on .card').length;
      status.textContent = 'Showing all ' + n + ' guides in ' + names[topic];
    } else {
      main.dataset.view = 'all';
      status.textContent = '';
    }
    setUrl();
  }

  function go(t, scroll) {
    topic = t; q.value = ''; render();
    if (scroll) document.querySelector('.tabs').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.gtag) gtag('event', 'blog_topic', { topic: t });
  }

  tabs.forEach(function (t) { t.addEventListener('click', function () { go(t.dataset.topic, true); }); });
  document.querySelectorAll('.sec-all:not(.sec-link)').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); go(a.dataset.topic, true); }); });
  q.addEventListener('input', function () {
    render();
    clearTimeout(timer);
    timer = setTimeout(function () { if (q.value.trim().length > 2 && window.gtag) gtag('event', 'blog_search', { search_term: q.value.trim() }); }, 1200);
  });
  document.getElementById('bclear').addEventListener('click', function () { q.value = ''; render(); q.focus(); });
  document.querySelectorAll('.bsearch-hint [data-q]').forEach(function (b) { b.addEventListener('click', function () { q.value = b.dataset.q; render(); }); });
  document.querySelector('[data-reset]').addEventListener('click', function (e) { e.preventDefault(); go('all', false); });

  var p = new URLSearchParams(location.search);
  if (p.get('topic') && names[p.get('topic')]) topic = p.get('topic');
  if (p.get('q')) q.value = p.get('q');
  render();
})();
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'blog.html'), page);
console.log(`blog.html: ${data.sections.length} sections, ${total} guides, featured: ${(data.featured || []).length}`);
