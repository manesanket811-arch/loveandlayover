// Build the destination guides (destinations/<slug>.html) from data/guides/<slug>.json.
// One template for every country: hero, at-a-glance facts, our videos, a day-by-day
// itinerary, food, best time, getting around, essentials, FAQs and related places.
// Usage: node scripts/build-guides.cjs [slug…]   (default: every data file)
const fs = require('fs');
const path = require('path');
const { header, footer, HEAD_LINKS, SCRIPT } = require('./site-chrome.cjs');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.loveandlayover.in';
const SUBSCRIBE = 'https://www.youtube.com/@nikita_sanket_mane?sub_confirmation=1';
const CHANNEL_SEARCH = (q) => `https://www.youtube.com/@nikita_sanket_mane/search?query=${encodeURIComponent(q)}`;
const DATA = path.join(ROOT, 'data', 'guides');
const credits = JSON.parse(fs.readFileSync(path.join(ROOT, 'images', 'destinations', 'credits.json'), 'utf8'));

// Rough rupee rates for the "≈ ₹" budget hints. Update now and then; shown as approximate.
const INR = { 'A$': 55, 'S$': 65, RM: 19.5, EUR: 95, '€': 95, IDR: 0.0053, EGP: 1.75, ISK: 0.62, '¥': 0.57, MXN: 4.5, PEN: 23, '₩': 0.062, '฿': 2.5, TRY: 2.1, '₫': 0.0034, LKR: 0.28, 'US$': 85, AED: 23, '₹': 1 };

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fixAmp = (h = '') => h.replace(/&(?![a-zA-Z]+;|#\d+;|#x[0-9a-f]+;)/gi, '&amp;');
const plain = (h = '') => h.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const ld = (o) => `<script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n</script>`;

// Flags and one-line descriptions come from the homepage destination cards
const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const CARD = {};
for (const m of home.matchAll(/<a class="dest"[^>]*href="\/destinations\/([\w-]+)\.html"[^>]*>[\s\S]*?<img class="flag" src="([^"]+)"[\s\S]*?<h3>([^<]+)<\/h3><p>([^<]*)<\/p>/g)) {
  CARD[m[1]] = { flag: m[2], name: m[3], line: m[4] };
}

function rupees(budget) {
  const m = budget.match(/^\s*(A\$|S\$|US\$|RM|EUR|€|IDR|EGP|ISK|¥|MXN|PEN|₩|฿|TRY|₫|LKR|AED|₹)?\s*([\d.,]+)\s*([kKmM])?\s*[–-]\s*([\d.,]+)\s*([kKmM])?/);
  if (!m) return null;
  const cur = m[1] || '₹';
  const num = (n, s) => parseFloat(n.replace(/,/g, '')) * (s ? (/k/i.test(s) ? 1e3 : 1e6) : 1);
  const lo = num(m[2], m[3] || m[5]), hi = num(m[4], m[5]);
  if (cur === '₹') return null;
  const r = (v) => { const x = v * INR[cur]; const step = x >= 10000 ? 500 : 100; return Math.round(x / step) * step; };
  const f = (v) => '₹' + r(v).toLocaleString('en-IN');
  return `≈ ${f(lo)}–${f(hi).slice(1)}`;
}

function credit(key) {
  const c = credits[key];
  return c ? `<a href="${esc(c.page)}" rel="noopener" target="_blank">${esc(c.artist.slice(0, 60))}</a> (${esc(c.license)})` : '';
}

function autoFaq(g) {
  const out = [];
  const es = g.sections.find(s => s.id === 'essentials');
  const visa = es && (es.html.match(/<p><strong>(?:Visa for Indians|Indian citizens)[\s\S]*?<\/p>(?:\s*<p><strong>Foreign visitors[\s\S]*?<\/p>)?/) || [])[0];
  if (visa) out.push([g.slug === 'india' ? 'Do I need a visa for India?' : `Do Indians need a visa for ${g.country}?`,
    plain(visa).replace(/^Visa for Indians:\s*/, '').replace(/^./, c => c.toUpperCase())]);
  const b = g.badges.budget;
  if (b) {
    const inr = rupees(b);
    out.push([`How much does a ${g.country} trip cost per day?`, `Plan for roughly ${b.replace(/\/day$/, '')} per person per day${inr ? ` (${inr.replace('≈ ', 'about ')})` : ''} for a mid-range trip, covering accommodation, food, local transport and sightseeing. Prices are approximate as of October 2026.`]);
  }
  const it = g.sections.find(s => s.id === 'itineraries');
  if (it && it.plans && it.plans.length > 1) {
    const span = (a, b) => {
      const t = it.days.slice(a, b).map(d => d.title.replace(/ & departure$/, ''));
      return t.length > 1 ? `${t.slice(0, -1).join(', ')} and ${t[t.length - 1]}` : t[0];
    };
    const [p1, p2, p3] = it.plans;
    out.push([`How many days do you need in ${g.country}?`, `${p1} days covers the highlights: ${span(0, p1)}. With ${p2} days you can add ${span(p1, p2)}${p3 ? `, and a full week adds ${span(p2, p3)}` : ''}. Our ${it.plans.join(', ').replace(/, (\d+)$/, ' and $1')}-day itineraries build on each other, so you can stop at any point.`]);
  }
  const bt = g.sections.find(s => s.id === 'best-time');
  if (g.badges.best) out.push([`When is the best time to visit ${g.country}?`, `${g.badges.best}.${bt ? ' ' + plain((bt.html.match(/<p>[\s\S]*?<\/p>/) || [''])[0]) : ''}`.trim()]);
  return out;
}

// Which plan a day first appears in, for guides with several trip lengths (e.g. [3, 5, 7])
const planOf = (plans, i) => (plans || []).find(n => i < n);

function dayCard(d, i, plans) {
  const rows = d.periods.map(([when, what]) => `<div class="day-row"><div class="when">${esc(when)}</div><div class="what">${fixAmp(what)}</div></div>`).join('\n');
  const first = planOf(plans, i);
  const tag = plans && first !== plans[0] ? `<span class="day-plan">${first}-day plan</span>` : '';
  return `<div class="day">
  <div class="day-head"><span class="n">${i + 1}</span><h3>${esc(d.title)}</h3>${tag}</div>
${rows}
  <div class="day-foot"><span class="cost">${esc(d.cost)}</span>${d.note ? fixAmp(d.note) : ''}</div>
</div>`;
}

function build(g) {
  const url = `${SITE}/destinations/${g.slug}.html`;
  const hero = `/images/destinations/${g.slug}-hero.webp`;
  const og = fs.existsSync(path.join(ROOT, 'images', 'og', `${g.slug}.jpg`)) ? `${SITE}/images/og/${g.slug}.jpg` : SITE + hero;
  const why = g.sections.find(s => s.id === 'why-visit');
  // First sentence of "Why visit", or the first ~180 characters cut at a word
  const whyText = plain(why ? why.html : '');
  const dek = (whyText.match(/^.{40,200}?[.!?](?=\s|$)/) || [whyText.slice(0, 180).replace(/\s+\S*$/, '') + '…'])[0];
  const inr = g.badges.budget ? rupees(g.badges.budget) : null;
  const faq = g.faq && g.faq.length ? g.faq : autoFaq(g);
  const days = g.sections.find(s => s.id === 'itineraries');

  const toc = [];
  const body = [];

  body.push(`<div class="glance">
  <div><small>Daily budget</small><b>${esc(g.badges.budget || '—')}</b>${inr ? `<span>${esc(inr)} per person</span>` : ''}</div>
  <div><small>Best time</small><b>${esc(g.badges.best || 'Year-round')}</b></div>
  <div><small>Visa for Indians</small><b>${esc(g.badges.visa || 'Check before travel')}</b></div>
  <div><small>Itinerary</small><b>${days && days.plans ? days.plans.join(', ').replace(/, (\d+)$/, ' or $1') + ' days' : `${days ? days.days.length : 0}-day plan`}</b><span>Day by day, with costs</span></div>
</div>`);

  for (const s of g.sections) {
    if (s.id === 'itineraries') {
      // Our videos sit just before the itinerary
      toc.push(['watch', g.filmed ? `Our ${g.country} videos` : 'Our travel films']);
      const fallback = g.video
        ? `<a class="trip-video" href="https://www.youtube.com/watch?v=${g.video.id}" target="_blank" rel="noopener"><div class="trip-video-thumb"><img src="https://i.ytimg.com/vi/${g.video.id}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360"><span class="tv-play" aria-hidden="true">▶</span></div><div class="trip-video-body"><b>${esc(g.video.name)}</b><span>Watch on YouTube →</span></div></a>`
        : `<div class="watch-empty">${g.filmed ? `We film ${esc(g.country)} regularly. Browse the latest on our channel.` : `New travel films every week. Search our channel for ${esc(g.country)} or subscribe so you don't miss the next trip.`}</div>`;
      body.push(`<h2 id="watch">${g.filmed ? `Watch Our ${esc(g.country)} Videos` : 'Watch Our Travel Films'}</h2>
<div class="watch-box">
  <p>${g.watchIntro ? fixAmp(g.watchIntro) : g.filmed
    ? `We filmed ${esc(g.country)} so you can see the places in this guide before you go: how busy they get, what they cost and what they really look like.`
    : `We turn our trips into films and Reels. Watching is the easiest way to get a feel for a place before you plan.`}</p>
  <div class="trip-videos-grid" data-keywords="${esc(g.videoKeywords)}">${fallback}</div>
  <div class="row">
    <a class="btn btn-yt" href="${CHANNEL_SEARCH(g.country)}" target="_blank" rel="noopener"><span aria-hidden="true">▶</span> ${g.filmed ? `All our ${esc(g.country)} videos` : `Search our channel for ${esc(g.country)}`}</a>
    <a class="btn btn-ghost" href="${SUBSCRIBE}" target="_blank" rel="noopener">Subscribe</a>
  </div>
</div>`);
      toc.push([s.id, s.title.replace(/^Free\s+/, '')]);
      const tabs = s.plans && s.plans.length > 1
        ? `<div class="plan-tabs" role="tablist" aria-label="Trip length">${s.plans.map((n, i) => `<button type="button" role="tab" id="itinerary-${n}" data-plan="${n}" aria-selected="${i === 0}">${n} days</button>`).join('')}</div>`
        : '';
      body.push(`<h2 id="${s.id}">${esc(s.title)}</h2>\n${fixAmp(s.html)}\n${tabs}<div class="days"${s.plans ? ` data-plans="${s.plans.join(',')}"` : ''}>\n${s.days.map((d, i) => dayCard(d, i, s.plans)).join('\n')}\n</div>${s.after ? '\n' + fixAmp(s.after) : ''}`);
      continue;
    }
    toc.push([s.id, s.title.replace(/\?$/, '').replace(/^Why Visit .*/, 'Why visit')]);
    let html = fixAmp(s.html);
    if (s.id === 'food' && g.foodImage) {
      html = `<figure class="guide-figure"><img src="${g.foodImage.src}" alt="${esc(g.foodImage.alt)}" width="1000" height="625" loading="lazy">${g.foodImage.caption ? `<figcaption>${esc(g.foodImage.caption)}</figcaption>` : ''}</figure>\n` + html;
    }
    body.push(`<h2 id="${s.id}">${esc(s.title)}</h2>\n${html}`);
  }

  if (faq.length) {
    toc.push(['faq', 'FAQs']);
    body.push(`<h2 id="faq">${esc(g.country)} FAQs</h2>\n<div class="post-faq">\n${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}\n</div>`);
  }
  body.push(`<div class="post-follow">
  <h2>Never miss a trip</h2>
  <p>New travel films every week on YouTube, plus daily stories, Reels and food finds on Instagram.</p>
  <div class="row">
    <a class="btn btn-yt" href="${SUBSCRIBE}" target="_blank" rel="noopener"><span aria-hidden="true">▶</span> Subscribe on YouTube</a>
    <a class="btn btn-ig" href="https://www.instagram.com/loveandlayover" target="_blank" rel="noopener">Follow on Instagram</a>
  </div>
</div>
<p class="updated">Prices, visa rules and opening details change often. Figures here are approximate as of October 2026, so please check official websites before you book.</p>`);

  const readNext = (g.readNext || []).map(href => {
    const file = path.join(ROOT, href);
    if (!fs.existsSync(file)) return '';
    const t = (fs.readFileSync(file, 'utf8').match(/<title>([^<]+)<\/title>/) || [, href])[1].split(/\s[-—|:]\s|:\s/)[0];
    const og2 = (fs.readFileSync(file, 'utf8').match(/<meta property="og:image" content="https:\/\/www\.loveandlayover\.in([^"]+)"/) || [])[1];
    return `<a class="post" href="${href}"><div class="post-img">${og2 ? `<img src="${og2}" alt="" loading="lazy" width="640" height="400">` : ''}</div><div class="post-body"><h3>${t}</h3></div></a>`;
  }).join('');

  const related = g.related.filter(s => CARD[s]).map(s => `<a class="dest-card" href="/destinations/${s}.html"><img class="photo" src="/images/destinations/thumbs/${s}-hero.webp" alt="" loading="lazy" width="640" height="800"><div class="txt"><img class="flag" src="${CARD[s].flag}" alt="" width="28" height="21" loading="lazy"><h3>${esc(CARD[s].name)}</h3><p>${CARD[s].line}</p></div></a>`).join('\n');

  const creditKeys = [`${g.slug}-hero`, g.foodImage ? g.foodImage.src.split('/').pop().replace('.webp', '') : null].filter(Boolean);
  const creditLine = creditKeys.map(credit).filter(Boolean).join(' · ');

  const schema = [
    ld({ '@context': 'https://schema.org', '@type': 'Article', '@id': url, headline: g.h1, description: g.description, image: og,
      datePublished: g.datePublished, dateModified: g.dateModified, inLanguage: 'en',
      author: { '@type': 'Organization', '@id': SITE + '/#organization', name: 'Love and Layovers' },
      publisher: { '@type': 'Organization', '@id': SITE + '/#organization', name: 'Love and Layovers', logo: { '@type': 'ImageObject', url: SITE + '/public/images/brand/logo-512.png' } },
      about: { '@type': 'Country', name: g.country }, mainEntityOfPage: url }),
    ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Destinations', item: SITE + '/destinations/' },
      { '@type': 'ListItem', position: 3, name: g.country, item: url }] }),
    faq.length ? ld({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }) : '',
    g.video ? ld({ '@context': 'https://schema.org', '@type': 'VideoObject', name: g.video.name, description: g.video.description,
      thumbnailUrl: `https://i.ytimg.com/vi/${g.video.id}/hqdefault.jpg`, uploadDate: g.video.uploadDate,
      contentUrl: `https://www.youtube.com/watch?v=${g.video.id}`, embedUrl: `https://www.youtube.com/embed/${g.video.id}` }) : '',
  ].filter(Boolean).join('\n');

  const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(g.title)}</title>
<meta name="description" content="${esc(g.description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(g.title)}">
<meta property="og:description" content="${esc(g.description)}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="Love and Layovers">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(g.title)}">
<meta name="twitter:description" content="${esc(g.description)}">
<meta name="twitter:image" content="${og}">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" as="image" href="${hero}" type="image/webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,900;1,9..144,600&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
${schema}
<script defer src="https://www.googletagmanager.com/gtag/js?id=G-5D7GNE6JQL"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-5D7GNE6JQL');
</script>
<link rel="stylesheet" href="/css/site.css?v=1">
<link rel="stylesheet" href="/css/article.css?v=2">
<link rel="stylesheet" href="/css/guide.css?v=3">
${HEAD_LINKS}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>

${header('destinations')}

<main id="main">
<section class="post-hero guide-hero" style="background-image: url('${hero}')">
  <div class="wrap">
    <nav class="post-crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/destinations/">Destinations</a> › ${esc(g.country)}</nav>
    <h1>${esc(g.h1)}</h1>
    <p class="dek">${esc(dek)}</p>
    <div class="post-meta-row"><span>Budget: ${esc(g.badges.budget || '')}</span><span>Best: ${esc(g.badges.best || '')}</span><span>Visa: ${esc(g.badges.visa || '')}</span></div>
    <div class="guide-cta">
      ${g.filmed ? `<a class="btn btn-yt" href="#watch"><span aria-hidden="true">▶</span> Watch our ${esc(g.country)} videos</a>` : `<a class="btn btn-yt" href="${SUBSCRIBE}" target="_blank" rel="noopener"><span aria-hidden="true">▶</span> Subscribe for new trips</a>`}
      <a class="btn btn-outline-light" href="#itineraries">${days && days.plans ? `See the ${days.plans.join(', ').replace(/, (\d+)$/, ' &amp; $1')}-day plans` : `See the ${days ? days.days.length : 3}-day plan`} ↓</a>
    </div>
  </div>
</section>

<div class="wrap post-layout">
  <article class="post-body">
${body.join('\n\n')}
  </article>
  <aside class="toc" aria-label="On this page">
    <h2>In this guide</h2>
    <ol>${toc.map(([id, t]) => `<li><a href="#${id}">${esc(t)}</a></li>`).join('')}</ol>
  </aside>
</div>
${readNext ? `
<section class="guide-more">
  <div class="wrap">
    <h2>Read next</h2>
    <div class="posts">${readNext}</div>
  </div>
</section>` : ''}
<section class="guide-more">
  <div class="wrap">
    <h2>Explore related destinations</h2>
    <div class="dest-cards">
${related}
    </div>
  </div>
</section>
${creditLine ? `<div class="wrap"><p class="photo-credit">Photos via Wikimedia Commons: ${creditLine} — <a href="/credits.html">all photo credits</a></p></div>` : ''}
</main>

${footer()}

<div class="action-bar">
  <a class="btn btn-yt" href="${g.filmed ? CHANNEL_SEARCH(g.country) : SUBSCRIBE}" target="_blank" rel="noopener"><span aria-hidden="true">▶</span> ${g.filmed ? `Watch our ${esc(g.country)} videos` : 'Subscribe on YouTube'}</a>
</div>

${SCRIPT}
<script src="/js/trip-videos.js" defer></script>
${days && days.plans && days.plans.length > 1 ? `<script>
  // Trip-length tabs: show the first N days (all days stay in the page for readers without JS)
  (function () {
    var box = document.querySelector('.days[data-plans]'); if (!box) return;
    var tabs = [].slice.call(document.querySelectorAll('.plan-tabs [data-plan]'));
    function pick(n, scroll) {
      box.setAttribute('data-show', n);
      [].forEach.call(box.children, function (d, i) { d.hidden = i >= n; });
      tabs.forEach(function (t) { t.setAttribute('aria-selected', t.dataset.plan === String(n)); });
      if (scroll) document.getElementById('itineraries').scrollIntoView({ behavior: 'smooth' });
    }
    tabs.forEach(function (t) { t.addEventListener('click', function () {
      pick(+t.dataset.plan);
      try { history.replaceState(null, '', '#itinerary-' + t.dataset.plan); } catch (e) {}
      if (window.gtag) window.gtag('event', 'itinerary_tab', { days: +t.dataset.plan });
    }); });
    var m = location.hash.match(/^#itinerary-(\\d+)$/);
    pick(m ? +m[1] : +tabs[0].dataset.plan, !!m);
  })();
</script>` : ''}
</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, 'destinations', `${g.slug}.html`), page);
  return page.length;
}

const only = process.argv.slice(2);
const files = fs.readdirSync(DATA).filter(f => f.endsWith('.json') && (!only.length || only.includes(f.slice(0, -5))));
for (const f of files) {
  const g = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
  for (const k of ['slug', 'title', 'description', 'h1', 'country', 'badges', 'sections', 'related']) if (!g[k]) throw new Error(`${f}: missing ${k}`);
  if (g.title.length > 60 || g.description.length > 160) console.warn(`! ${g.slug}: title ${g.title.length} / description ${g.description.length} chars`);
  build(g);
}
console.log(`Built ${files.length} destination guides`);
