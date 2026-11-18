// Build blog.html (the blog listing) from data/blog.json: "Start here" cards, a sticky
// section menu and one card grid per section (Moving to Singapore, Singapore travel,
// Asia & beyond, Visas & tools). Long sections show the first few cards with a
// "Show all" button; every card stays in the HTML for search engines.
// Usage: node scripts/build-blog.cjs   (after adding a post to data/blog.json)
const fs = require('fs');
const path = require('path');
const { header, footer, HEAD_LINKS, SCRIPT, GA, FONTS } = require('./site-chrome.cjs');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.loveandlayover.in';
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'blog.json'), 'utf8'));
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SHOW = 6; // cards shown before "Show all"

for (const s of data.sections) for (const h of s.posts) if (!data.posts[h]) throw new Error(`blog.json: no card for ${h}`);

function card(href, i, total) {
  const p = data.posts[href];
  const chips = [p.date === 'Nov 2026' ? 'New' : null, ...(p.chips || [])].filter(Boolean);
  const hidden = total > SHOW + 1 && i >= SHOW ? ' data-more' : '';
  return `      <a class="post" href="${href}"${hidden}>
        <div class="post-img"><img src="${p.img}" alt="${esc(p.alt)}" loading="lazy" width="640" height="400"${p.pos ? ` style="object-position:${p.pos}"` : ''}></div>
        <div class="post-body"><div class="chips">${chips.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p><div class="post-meta"><span>${esc(p.meta)}</span><span>${esc(p.date)}</span></div></div>
      </a>`;
}

function startCard(href, big) {
  const p = data.posts[href];
  return `    <a class="start${big ? ' start-main' : ''}" href="${href}">
      <img src="${p.img.replace('/thumbs/', '/')}" alt="${esc(p.alt)}" loading="${big ? 'eager' : 'lazy'}" width="1200" height="700">
      <span class="start-body"><span class="chip">${big ? 'Moving to Singapore' : 'Visiting Singapore'}</span><b>${esc(p.title)}</b><span>${esc(p.desc)}</span><span class="start-go">${big ? 'Start the guide' : 'Plan your trip'} →</span></span>
    </a>`;
}

const sections = data.sections.map(s => `<section class="bsec" id="${s.id}" aria-labelledby="${s.id}-title">
  <div class="wrap">
    <div class="bsec-head">
      <div><span class="kicker">${esc(s.kicker)}</span><h2 id="${s.id}-title">${esc(s.title)}</h2><p>${esc(s.intro)}</p></div>
      <span class="bsec-count">${s.posts.length} ${s.posts.length === 1 ? 'guide' : 'guides'}</span>
    </div>
    <div class="posts">
${s.posts.map((h, i) => card(h, i, s.posts.length)).join('\n')}
    </div>${s.posts.length > SHOW + 1 ? `
    <div class="more-row"><button class="btn btn-ghost more-btn" type="button" aria-expanded="false">Show all ${s.posts.length} ${esc(s.kicker.toLowerCase())} guides</button></div>` : ''}
  </div>
</section>`).join('\n\n');

const title = 'Blog: Moving to Singapore & Travel Guides | Love and Layovers';
const desc = 'Moving to Singapore from India: jobs, salary, renting and your first month. Plus Singapore travel guides, Asia itineraries and visa tips with costs in rupees.';
const all = data.sections.flatMap(s => s.posts);
const ld = (o) => `<script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n</script>`;

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
${FONTS}
${ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
  { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
  { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog.html` }] })}
${ld({ '@context': 'https://schema.org', '@type': 'Blog', '@id': `${SITE}/blog.html#blog`, name: 'Love and Layovers Blog', url: `${SITE}/blog.html`, description: desc,
  publisher: { '@id': `${SITE}/#organization` },
  blogPost: all.filter(h => h.startsWith('/blog/')).map(h => ({ '@type': 'BlogPosting', headline: data.posts[h].title, url: SITE + h })) })}
${GA}
<link rel="stylesheet" href="/css/site.css?v=1">
<style>
  .bhero { padding: 52px 0 20px; position: relative; overflow: hidden; }
  .bhero::before { content: ''; position: absolute; width: 640px; height: 640px; right: -240px; top: -300px; background: radial-gradient(closest-side, rgba(240,165,89,.26), transparent); pointer-events: none; }
  .bhero .wrap { position: relative; }
  .bhero h1 { font-size: clamp(2.2rem, 4.6vw, 3.4rem); font-weight: 900; margin: 14px 0 12px; }
  .bhero h1 em { font-style: italic; font-weight: 600; color: var(--accent); }
  .bhero p { color: var(--ink-soft); max-width: 620px; font-size: 1.08rem; }
  /* Start here */
  .starts { display: grid; grid-template-columns: 1.35fr 1fr; gap: 20px; margin-top: 30px; }
  .start { position: relative; display: block; min-height: 300px; border-radius: 24px; overflow: hidden; color: #fff; background: var(--navy); box-shadow: var(--shadow-sm); transition: transform .25s ease, box-shadow .25s ease; }
  .start:hover { transform: translateY(-4px); box-shadow: var(--shadow); }
  .start img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .6s ease; }
  .start:hover img { transform: scale(1.04); }
  .start::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,22,40,.88), rgba(10,22,40,.25) 60%, rgba(10,22,40,.05)); }
  .start-body { position: absolute; left: 0; right: 0; bottom: 0; z-index: 1; padding: 26px; display: flex; flex-direction: column; gap: 6px; }
  .start-body .chip { align-self: flex-start; background: var(--accent); color: #fff; }
  .start-body b { font-family: var(--serif); font-size: clamp(1.35rem, 2.4vw, 1.9rem); font-weight: 900; line-height: 1.15; }
  .start-body > span:not(.chip) { color: rgba(255,255,255,.85); font-size: .95rem; }
  .start-body .start-go { margin-top: 4px; font-weight: 700; color: #fff !important; }
  .start-main { min-height: 340px; }
  @media (max-width: 860px) { .starts { grid-template-columns: 1fr; } .start, .start-main { min-height: 260px; } }
  /* Section menu */
  .bnav { position: sticky; top: 72px; z-index: 20; background: rgba(254,250,245,.94); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); margin-top: 36px; }
  .bnav .wrap { display: flex; gap: 8px; overflow-x: auto; padding-top: 10px; padding-bottom: 10px; scrollbar-width: none; }
  .bnav .wrap::-webkit-scrollbar { display: none; }
  .bnav a { flex: none; padding: 8px 14px; border-radius: 999px; border: 1px solid var(--line); background: #fff; font-size: .88rem; font-weight: 600; color: var(--ink-soft); white-space: nowrap; }
  .bnav a:hover, .bnav a[aria-current="true"] { background: var(--navy); border-color: var(--navy); color: #fff; }
  .bnav a small { opacity: .65; margin-left: 4px; }
  /* Sections */
  .bsec { padding: 52px 0 8px; scroll-margin-top: 130px; }
  .bsec-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 22px; }
  .bsec-head h2 { font-size: clamp(1.6rem, 3vw, 2.15rem); font-weight: 900; margin: 6px 0 6px; }
  .bsec-head p { color: var(--ink-soft); max-width: 620px; }
  .bsec-count { flex: none; font-size: .85rem; font-weight: 700; color: var(--muted); }
  .posts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
  .post { display: flex; flex-direction: column; background: #fff; border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease; }
  .post:hover { transform: translateY(-5px); box-shadow: var(--shadow); border-color: transparent; }
  .js .posts:not(.open) .post[data-more] { display: none; }
  .post-img { aspect-ratio: 16 / 10; overflow: hidden; background: var(--sand); }
  .post-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
  .post:hover .post-img img { transform: scale(1.05); }
  .post-body { padding: 18px 20px 20px; display: flex; flex-direction: column; gap: 9px; flex: 1; }
  .post-body h3 { font-family: var(--sans); font-size: 1.08rem; font-weight: 700; letter-spacing: -0.01em; line-height: 1.35; }
  .post-body p { color: var(--ink-soft); font-size: .92rem; }
  .post-meta { font-size: .84rem; color: var(--muted); display: flex; gap: 14px; flex-wrap: wrap; margin-top: auto; padding-top: 4px; }
  .chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .more-row { text-align: center; margin-top: 22px; display: none; }
  .js .more-row { display: block; }
  @media (max-width: 960px) { .posts { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 620px) { .posts { grid-template-columns: 1fr; } .bsec-head { flex-direction: column; align-items: flex-start; } .bnav { top: 64px; } }
  .guides-band { display: grid; grid-template-columns: 1fr auto; gap: 28px; align-items: center; background: var(--navy); color: #fff; border-radius: 28px; padding: 44px 48px; position: relative; overflow: hidden; margin: 56px 0 72px; }
  .guides-band::before { content: ''; position: absolute; width: 460px; height: 460px; right: -160px; top: -220px; background: radial-gradient(closest-side, rgba(212,105,29,.32), transparent); }
  .guides-band > * { position: relative; }
  .guides-band h2 { font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 900; margin: 6px 0 10px; }
  .guides-band p { color: rgba(255,255,255,.75); max-width: 560px; }
  @media (max-width: 760px) { .guides-band { grid-template-columns: 1fr; padding: 34px 24px; } }
</style>
${HEAD_LINKS}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>

${header('blog')}

<main id="main">
<section class="bhero">
  <div class="wrap">
    <span class="eyebrow"><span class="dot" aria-hidden="true"></span>The blog · from Indians living in Singapore</span>
    <h1>Moving to Singapore, and <em>travelling</em> from it</h1>
    <p>Honest guides on jobs, salaries and settling in Singapore, plus trip guides with real costs in rupees, from the trips we actually took.</p>
    <div class="starts">
${startCard(data.start[0], true)}
${startCard(data.start[1], false)}
    </div>
  </div>
</section>

<nav class="bnav" aria-label="Blog sections">
  <div class="wrap">
${data.sections.map(s => `    <a href="#${s.id}">${esc(s.kicker)}<small>${s.posts.length}</small></a>`).join('\n')}
  </div>
</nav>

${sections}

<div class="wrap">
  <div class="guides-band reveal">
    <div>
      <span class="kicker">Destination guides</span>
      <h2>Free destination guides</h2>
      <p>Day-by-day itineraries, food, best time to visit, visa tips and daily budgets in rupees, from Singapore and Japan to Iceland and Peru.</p>
    </div>
    <a href="/destinations/" class="btn btn-light">Browse all destinations <span aria-hidden="true">→</span></a>
  </div>
</div>
</main>

${footer()}

${SCRIPT}
<script>
(function () {
  // "Show all" for long sections
  document.querySelectorAll('.more-btn').forEach(function (b) {
    var grid = b.closest('.bsec').querySelector('.posts'), label = b.textContent;
    b.addEventListener('click', function () {
      var open = grid.classList.toggle('open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.textContent = open ? 'Show fewer' : label;
      if (!open) grid.closest('.bsec').scrollIntoView({ behavior: 'smooth' });
    });
  });
  // Highlight the section in view in the sticky menu
  var links = [].slice.call(document.querySelectorAll('.bnav a'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id ? 'true' : 'false'); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('.bsec').forEach(function (s) { io.observe(s); });
  }
  links.forEach(function (a) { a.addEventListener('click', function () { if (window.gtag) gtag('event', 'blog_section_click', { section: a.getAttribute('href').slice(1) }); }); });
})();
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'blog.html'), page);
console.log(`blog.html: ${data.sections.length} sections, ${all.length} cards`);
