// Build singapore-news.html (the Singapore News section) from posts in data/posts that
// have "news": true, newest first, and the "Latest Singapore news" strip on the
// homepage (between <!-- news:start --> and <!-- news:end --> in index.html).
// A news post is an ordinary post (scripts/build-posts.cjs) with:
//   "news": true, "newsTopic": "Visas & passes" | "Transport" | "Events" | "Jobs & money" | …
//   "priority": n (optional; higher comes first among stories updated the same day)
// Usage: node scripts/build-news.cjs   (after build-posts)
const fs = require('fs');
const path = require('path');
const { header, footer, HEAD_LINKS, SCRIPT, GA, FONTS, waChannelBtn } = require('./site-chrome.cjs');
const { altFor } = require('./image-alts.cjs');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.loveandlayover.in';
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const day = (iso) => { const [y, m, d] = iso.split('-'); return `${+d} ${MONTHS[+m - 1]} ${y}`; };

const dir = path.join(ROOT, 'data', 'posts');
const news = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
  .filter(p => p.news)
  .map(p => ({ ...p, url: `/blog/${p.slug}.html`, updated: p.modified || p.published, thumb: `/images/destinations/thumbs/${p.hero}.webp`, big: `/images/destinations/${p.hero}.webp` }))
  .sort((a, b) => b.updated.localeCompare(a.updated) || (b.priority || 0) - (a.priority || 0) || b.published.localeCompare(a.published));
if (!news.length) throw new Error('no news posts (set "news": true in data/posts/*.json)');
const topics = [...new Set(news.map(n => n.newsTopic || 'Singapore'))];
const updatedTag = (n) => n.modified && n.modified !== n.published ? `Updated ${day(n.modified)}` : day(n.published);

const [lead, ...rest] = news;
const item = (n) => `      <a class="nitem" href="${n.url}" data-topic="${esc(n.newsTopic || 'Singapore')}">
        <img src="${n.thumb}" alt="${esc(altFor(n.thumb))}" loading="lazy" width="320" height="200">
        <span class="nitem-body"><span class="nmeta"><span class="ntopic">${esc(n.newsTopic || 'Singapore')}</span><time datetime="${n.updated}">${updatedTag(n)}</time></span><b>${esc(n.h1)}</b><span class="ndek">${esc(n.dek)}</span></span>
      </a>`;

const title = 'Singapore News for Indians: Visa, Jobs & Travel Updates';
const desc = 'Latest Singapore news for Indians: visa and work pass changes, Malaysia and JB travel updates, transport, events and what they mean for you.';
const ld = (o) => `<script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n</script>`;

const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}/singapore-news.html">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}/singapore-news.html">
<meta property="og:site_name" content="Love and Layovers">
<meta property="og:image" content="${SITE}/images/og/blog-${lead.slug}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/images/og/blog-${lead.slug}.jpg">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" as="image" href="${lead.big}" type="image/webp">
${FONTS}
${ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
  { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
  { '@type': 'ListItem', position: 2, name: 'Singapore News', item: `${SITE}/singapore-news.html` }] })}
${ld({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Singapore News', url: `${SITE}/singapore-news.html`, description: desc,
  mainEntity: { '@type': 'ItemList', itemListElement: news.map((n, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + n.url, name: n.h1 })) } })}
${GA}
<link rel="stylesheet" href="/css/site.css?v=1">
<style>
  .nh { padding: 44px 0 20px; position: relative; overflow: hidden; }
  .nh::before { content: ''; position: absolute; width: 640px; height: 640px; right: -240px; top: -320px; background: radial-gradient(closest-side, rgba(220,38,38,.12), transparent); pointer-events: none; }
  .nh .wrap { position: relative; }
  .nh h1 { font-size: clamp(2.1rem, 4.4vw, 3.3rem); font-weight: 900; line-height: 1.05; margin-top: 12px; }
  .nh h1 em { font-style: italic; font-weight: 600; color: var(--accent); }
  .nh p { color: var(--ink-soft); margin-top: 12px; max-width: 640px; font-size: 1.05rem; }
  .live { display: inline-flex; align-items: center; gap: 8px; font-size: .78rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: #dc2626; }
  .live::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #dc2626; animation: pulse 1.6s infinite; }
  @keyframes pulse { 50% { opacity: .25; } }
  .nlead { display: grid; grid-template-columns: 1.3fr 1fr; gap: 0; background: #fff; border: 1px solid var(--line); border-radius: 26px; overflow: hidden; box-shadow: var(--shadow-sm); margin-top: 26px; transition: box-shadow .25s, transform .25s; }
  .nlead:hover { box-shadow: var(--shadow); transform: translateY(-3px); }
  .nlead-img { position: relative; min-height: 340px; overflow: hidden; }
  .nlead-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .8s ease; }
  .nlead:hover .nlead-img img { transform: scale(1.04); }
  .nlead-body { padding: 34px; display: flex; flex-direction: column; justify-content: center; gap: 12px; }
  .nlead-body b { font-family: var(--serif); font-size: clamp(1.5rem, 2.6vw, 2.1rem); font-weight: 900; line-height: 1.15; color: var(--ink); }
  .nlead-body .ndek { color: var(--ink-soft); }
  .nlead-body .nread { font-weight: 700; color: var(--accent); }
  @media (max-width: 860px) { .nlead { grid-template-columns: 1fr; } .nlead-img { min-height: 220px; } .nlead-body { padding: 24px; } }
  .nmeta { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; font-size: .8rem; color: var(--muted); }
  .ntopic { font-size: .72rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #fff; background: var(--navy); padding: 4px 9px; border-radius: 999px; }
  .nmonth { display: grid; grid-template-columns: auto 1fr auto; gap: 14px; align-items: center; margin-top: 18px; background: #fff8ec; border: 1px solid #f1d7b0; border-radius: 18px; padding: 16px 20px; font-size: 1.4rem; transition: box-shadow .25s; }
  .nmonth:hover { box-shadow: var(--shadow); }
  .nmonth b { display: block; font-size: 1rem; color: var(--ink); }
  .nmonth small { display: block; font-size: .85rem; color: var(--ink-soft); }
  .nmonth > span:last-child { color: var(--accent); font-weight: 800; font-size: 1.1rem; }
  .nfilters { display: flex; gap: 8px; flex-wrap: wrap; margin: 40px 0 18px; }
  .nfilter { padding: 8px 15px; border-radius: 999px; border: 1px solid var(--line); background: #fff; font: inherit; font-size: .88rem; font-weight: 600; color: var(--ink-soft); cursor: pointer; }
  .nfilter[aria-pressed="true"] { background: var(--navy); border-color: var(--navy); color: #fff; }
  .nlist { display: flex; flex-direction: column; gap: 14px; }
  .nitem { display: grid; grid-template-columns: 220px 1fr; gap: 22px; align-items: center; background: #fff; border: 1px solid var(--line); border-radius: 20px; padding: 12px; transition: box-shadow .25s, transform .25s; }
  .nitem:hover { box-shadow: var(--shadow); transform: translateX(4px); }
  .nitem[hidden] { display: none; }
  .nitem img { width: 220px; height: 140px; object-fit: cover; border-radius: 14px; }
  .nitem-body { display: flex; flex-direction: column; gap: 8px; padding-right: 10px; }
  .nitem b { font-size: 1.15rem; line-height: 1.3; color: var(--ink); }
  .ndek { color: var(--ink-soft); font-size: .93rem; }
  @media (max-width: 640px) { .nitem { grid-template-columns: 1fr; } .nitem img { width: 100%; height: 170px; } .nitem-body { padding: 0 6px 6px; } }
  .nempty { color: var(--muted); padding: 30px 0; text-align: center; }
  .nband { background: #e8f8ee; border: 1px solid #c7ecd5; border-radius: 24px; padding: 32px; margin: 48px 0 72px; display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: center; }
  .nband h2 { font-size: clamp(1.3rem, 2.4vw, 1.7rem); font-weight: 900; margin-bottom: 6px; }
  .nband p { color: var(--ink-soft); }
  @media (max-width: 700px) { .nband { grid-template-columns: 1fr; padding: 24px; } }
  @media (prefers-reduced-motion: reduce) { .live::before { animation: none; } }
</style>
${HEAD_LINKS}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>

${header('news')}

<main id="main">
<section class="nh">
  <div class="wrap">
    <span class="live">Latest updates</span>
    <h1>Singapore <em>news</em> for Indians</h1>
    <p>Visa and work pass changes, Malaysia and Johor Bahru travel, transport and events: what's new in Singapore, and what it means for you. Updated as things change.</p>

    <a class="nlead" href="${lead.url}">
      <span class="nlead-img"><img src="${lead.big}" alt="${esc(altFor(lead.thumb))}" width="1200" height="760" fetchpriority="high"></span>
      <span class="nlead-body"><span class="nmeta"><span class="ntopic">${esc(lead.newsTopic || 'Singapore')}</span><time datetime="${lead.updated}">${updatedTag(lead)}</time></span><b>${esc(lead.h1)}</b><span class="ndek">${esc(lead.dek)}</span><span class="nread">Read the full update →</span></span>
    </a>

    <a class="nmonth" href="/singapore-this-month.html"><span>📅</span><span><b>What's on in Singapore this month</b><small>Events, festivals, holidays and tips, updated every month</small></span><span aria-hidden="true">→</span></a>

    <div class="nfilters" role="group" aria-label="Filter news by topic">
      <button class="nfilter" type="button" data-topic="all" aria-pressed="true">All news</button>
${topics.map(t => `      <button class="nfilter" type="button" data-topic="${esc(t)}" aria-pressed="false">${esc(t)}</button>`).join('\n')}
    </div>
    <div class="nlist" id="nlist">
${rest.map(item).join('\n')}
    </div>
    <p class="nempty" id="nempty" hidden>No more updates in this topic yet. Check back soon.</p>

    <div class="nband reveal">
      <div><h2>Get updates on WhatsApp</h2><p>We post Singapore news, visa changes and new guides on our WhatsApp Channel as they happen.</p></div>
      ${waChannelBtn('Join our WhatsApp Channel') || ''}
    </div>
  </div>
</section>
</main>

${footer()}

${SCRIPT}
<script>
(function () {
  var btns = [].slice.call(document.querySelectorAll('.nfilter')), items = [].slice.call(document.querySelectorAll('.nitem'));
  var lead = document.querySelector('.nlead'), empty = document.getElementById('nempty');
  var leadTopic = ${JSON.stringify(lead.newsTopic || 'Singapore')};
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.dataset.topic, shown = 0;
      btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      items.forEach(function (i) { i.hidden = t !== 'all' && i.dataset.topic !== t; if (!i.hidden) shown++; });
      lead.hidden = t !== 'all' && t !== leadTopic;
      empty.hidden = shown > 0 || !lead.hidden;
      if (window.gtag) gtag('event', 'news_filter', { topic: t });
    });
  });
})();
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'singapore-news.html'), page);

// Homepage strip: the three latest stories
const INDEX = path.join(ROOT, 'index.html');
let home = fs.readFileSync(INDEX, 'utf8');
if (/<!-- news:start -->[\s\S]*?<!-- news:end -->/.test(home)) {
  const strip = `<!-- news:start -->
<section class="home-news" aria-labelledby="homeNewsTitle">
  <style>
    .home-news { padding: 40px 0 8px; }
    .home-news .hn-head { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; margin-bottom: 16px; }
    .home-news h2 { font-size: clamp(1.4rem, 2.6vw, 1.9rem); font-weight: 900; display: flex; align-items: center; gap: 10px; }
    .home-news h2::before { content: ''; width: 9px; height: 9px; border-radius: 50%; background: #dc2626; box-shadow: 0 0 0 4px rgba(220,38,38,.15); }
    .home-news .hn-all { font-weight: 700; color: var(--accent); white-space: nowrap; }
    .home-news .hn-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .home-news .hn { display: flex; flex-direction: column; gap: 8px; background: #fff; border: 1px solid var(--line); border-radius: 18px; padding: 18px; transition: box-shadow .25s, transform .25s; }
    .home-news .hn:hover { box-shadow: var(--shadow); transform: translateY(-3px); }
    .home-news .hn small { font-size: .72rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
    .home-news .hn b { font-size: 1.02rem; line-height: 1.35; color: var(--ink); }
    .home-news .hn span { font-size: .82rem; color: var(--muted); margin-top: auto; }
    @media (max-width: 860px) { .home-news .hn-grid { grid-template-columns: 1fr; } }
  </style>
  <div class="wrap">
    <div class="hn-head"><h2 id="homeNewsTitle">Latest Singapore news</h2><span><a class="hn-all" href="/singapore-this-month.html">What's on this month</a> · <a class="hn-all" href="/singapore-news.html">All news →</a></span></div>
    <div class="hn-grid">
${news.slice(0, 3).map(n => `      <a class="hn" href="${n.url}"><small>${esc(n.newsTopic || 'Singapore')}</small><b>${esc(n.h1)}</b><span>${updatedTag(n)}</span></a>`).join('\n')}
    </div>
  </div>
</section>
<!-- news:end -->`;
  home = home.replace(/<!-- news:start -->[\s\S]*?<!-- news:end -->/, strip);
  fs.writeFileSync(INDEX, home);
}
console.log(`singapore-news.html: ${news.length} stories (${topics.join(', ')}); homepage strip ${home.includes('home-news') ? 'updated' : 'skipped (no markers)'}`);
