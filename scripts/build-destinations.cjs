// Builds three things from the guide data (scripts/guide-data.cjs):
//   destinations/index.html   photo cards with rupee budgets and filters
//   visa-checker.html         visa rules for Indian passport holders, by country
//   index.html                the "Where to go this month" section (between markers)
// Usage: node scripts/build-destinations.cjs   (re-run after adding or editing guides)
const fs = require('fs');
const path = require('path');
const { header, footer, HEAD_LINKS, SCRIPT, GA, FONTS } = require('./site-chrome.cjs');
const { ROOT, loadGuides, fmt, VISA, REGION } = require('./guide-data.cjs');
const { altFor } = require('./image-alts.cjs');

const SITE = 'https://www.loveandlayover.in';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ld = (o) => `<script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n</script>`;
const ROBOTS = '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">';
const guides = loadGuides();
const budgetText = (d) => d.inr ? `${fmt(d.inr.lo)}–${fmt(d.inr.hi).slice(1)}` : d.budget;

function head({ title, desc, url, ogTitle, image, extra = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
${ROBOTS}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(ogTitle || title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="Love and Layovers">
<meta property="og:image" content="${SITE}${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(ogTitle || title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}${image}">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${FONTS}
${extra}
${GA}
<link rel="stylesheet" href="/css/site.css?v=1">
${HEAD_LINKS}`;
}

const HERO_CSS = `
  .pg-hero { background: var(--navy) center / cover; position: relative; color: #fff; }
  .pg-hero::before { content: ''; position: absolute; inset: 0; background: linear-gradient(100deg, rgba(10,22,40,.95) 0%, rgba(10,22,40,.8) 55%, rgba(10,22,40,.45) 100%); }
  .pg-hero .wrap { position: relative; padding-top: 52px; padding-bottom: 44px; }
  .pg-hero h1 { font-size: clamp(2rem, 4.4vw, 3.2rem); font-weight: 900; max-width: 780px; }
  .pg-hero h1 em { font-style: italic; color: #f0a559; }
  .pg-hero p { margin-top: 12px; max-width: 660px; font-size: 1.08rem; color: rgba(255,255,255,.86); }
  .pg-hero .row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }
  .crumbs { font-size: .85rem; color: rgba(255,255,255,.75); margin-bottom: 14px; }
  .crumbs a { color: #fff; font-weight: 600; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .chipbtn { border: 1px solid var(--line); background: #fff; color: var(--ink); font: 600 .9rem var(--sans); padding: 9px 16px; border-radius: 999px; cursor: pointer; transition: border-color .15s ease, background .15s ease; }
  .chipbtn:hover { border-color: var(--accent); }
  .chipbtn[aria-pressed="true"] { background: var(--navy); border-color: var(--navy); color: #fff; }
  .chipbtn:focus-visible { outline: 3px solid rgba(181,86,26,.45); outline-offset: 2px; }
  .vtag { display: inline-block; font-size: .72rem; font-weight: 700; letter-spacing: .04em; padding: 4px 9px; border-radius: 999px; white-space: nowrap; }
  .vtag.free { background: #dcf5e6; color: #0b5d2e; }
  .vtag.arrival { background: #e0f0fb; color: #0b4a75; }
  .vtag.evisa { background: #fdf0d5; color: #7a4a00; }
  .vtag.visa { background: #f3e8e2; color: #7a2e12; }`;

// ------------------------------------------------------------------ destinations/index.html
function destinationsPage() {
  const url = `${SITE}/destinations/`;
  const title = 'Free Destination Guides: Asia, Europe & Americas';
  const desc = 'Free destination guides across Asia, Europe and the Americas: day-by-day itineraries, budgets in rupees, best time to visit and visa rules for Indians.';
  const list = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Destination Travel Guides', description: desc, url,
    mainEntity: { '@type': 'ItemList', numberOfItems: guides.length, itemListElement: guides.map((d, i) => ({ '@type': 'ListItem', position: i + 1, name: `${d.name} Travel Guide`, url: `${SITE}/destinations/${d.slug}.html` })) } };
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: 'Destinations', item: url }] };
  const regions = [...new Set(guides.map(d => d.region))];
  const cards = guides.map((d, i) => `      <a class="dcard" href="/destinations/${d.slug}.html" data-region="${d.region}" data-visa="${d.visaType}" data-best="${d.months.join(',')}">
        <div class="dcard-img"><img src="${d.thumb}" alt="${esc(altFor(d.thumb) || d.name)}" width="640" height="400"${i < 4 ? ' fetchpriority="high"' : ' loading="lazy"'}>${d.filmed ? '<span class="dcard-film">▶ We filmed here</span>' : ''}<span class="dcard-now" hidden>Great this month</span></div>
        <div class="dcard-body">
          <h3><img src="${d.flag}" alt="" width="28" height="21">${esc(d.name)}</h3>
          <p>${d.line}</p>
          <dl>
            <div><dt>Daily budget</dt><dd>${esc(budgetText(d))}</dd></div>
            <div><dt>Best time</dt><dd>${esc(d.best.replace(/\s*\(.*\)/, ''))}</dd></div>
          </dl>
          <div class="dcard-foot"><span class="vtag ${d.visaType}">${VISA[d.visaType].label}</span><span class="go">${d.plans ? d.plans.join(', ').replace(/, (\d+)$/, ' & $1') + '-day plans' : `${d.days}-day plan`} →</span></div>
        </div>
      </a>`).join('\n');

  return `${head({ title, desc, url, image: '/images/og/default.jpg', extra: `<link rel="preload" as="image" href="/images/destinations/thumbs/bali-hero.webp" type="image/webp">\n${ld(list)}\n${ld(crumbs)}` })}
<style>${HERO_CSS}
  .pg-hero { background-image: url('/images/destinations/thumbs/bali-hero.webp'); }
  .dfilters { position: sticky; top: 72px; z-index: 20; background: rgba(254,250,245,.94); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
  .dfilters .wrap { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; padding-top: 14px; padding-bottom: 14px; }
  .dfilters .sep { width: 1px; height: 26px; background: var(--line); }
  .dcount { margin-left: auto; font-size: .88rem; color: var(--muted); font-weight: 600; }
  .dgrid-wrap { padding-top: 28px; padding-bottom: 72px; }
  .dgrid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
  .dcard { display: flex; flex-direction: column; background: #fff; border: 1px solid var(--line); border-radius: 20px; overflow: hidden; color: var(--ink); transition: transform .25s ease, box-shadow .25s ease; }
  .dcard:hover { transform: translateY(-5px); box-shadow: var(--shadow); }
  .dcard[hidden] { display: none; }
  .dcard-img { position: relative; aspect-ratio: 16 / 10; background: var(--sand); overflow: hidden; }
  .dcard-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .6s ease; }
  .dcard:hover .dcard-img img { transform: scale(1.05); }
  .dcard-film, .dcard-now { position: absolute; left: 10px; font-size: .7rem; font-weight: 800; letter-spacing: .04em; padding: 5px 10px; border-radius: 999px; }
  .dcard-film { top: 10px; background: #ff0033; color: #fff; }
  .dcard-now { bottom: 10px; background: #fff; color: #0b5d2e; }
  .dcard-now[hidden] { display: none; }
  .dcard-body { display: flex; flex-direction: column; flex: 1; padding: 16px 18px 18px; }
  .dcard-body h3 { display: flex; align-items: center; gap: 10px; font-size: 1.25rem; font-weight: 900; }
  .dcard-body h3 img { width: 28px; height: 21px; border-radius: 3px; box-shadow: 0 1px 4px rgba(0,0,0,.2); flex: none; }
  .dcard-body p { margin-top: 6px; font-size: .92rem; color: var(--ink-soft); line-height: 1.45; }
  .dcard-body dl { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 14px 0 0; padding-top: 12px; border-top: 1px dashed var(--line); }
  .dcard-body dt { font-size: .66rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
  .dcard-body dd { margin: 2px 0 0; font-size: .88rem; font-weight: 700; line-height: 1.3; }
  .dcard-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; padding-top: 14px; }
  .dcard-foot .go { font-size: .82rem; font-weight: 700; color: var(--accent); text-align: right; }
  .dempty { display: none; padding: 40px 0; text-align: center; color: var(--ink-soft); }
  .dnote { margin-top: 28px; font-size: .84rem; color: var(--muted); max-width: 760px; }
  @media (max-width: 1100px) { .dgrid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @media (max-width: 820px) { .dgrid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; } .dfilters { position: static; } .dfilters .sep { display: none; } .dcount { margin-left: 0; width: 100%; } }
  @media (max-width: 520px) { .dgrid { grid-template-columns: minmax(0, 1fr); } }
</style>
</head>
<body>
<a class="skip-link" href="#guides">Skip to guides</a>
${header('destinations')}

<main id="main">
<section class="pg-hero">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › Destinations</nav>
    <h1>Explore our <em>destination guides</em></h1>
    <p>Day-by-day itineraries with real costs in rupees, the best months to go, food to try and visa rules for Indian travellers. All free.</p>
    <div class="row">
      <a class="btn btn-primary" href="/trip-finder.html">Not sure where to go? Take the quiz →</a>
      <a class="btn btn-outline-light" href="/visa-checker.html">Visa checker for Indians</a>
    </div>
  </div>
</section>

<div class="dfilters" id="guides">
  <div class="wrap">
    <div class="chips" role="group" aria-label="Filter by region">
      <button class="chipbtn" type="button" data-region="all" aria-pressed="true">All</button>
${regions.map(r => `      <button class="chipbtn" type="button" data-region="${r}" aria-pressed="false">${esc(REGION[r])}</button>`).join('\n')}
    </div>
    <span class="sep" aria-hidden="true"></span>
    <div class="chips" role="group" aria-label="More filters">
      <button class="chipbtn" type="button" data-toggle="easy" aria-pressed="false">Visa-free or on arrival</button>
      <button class="chipbtn" type="button" data-toggle="best" aria-pressed="false">Best <span id="bestMonth">this month</span></button>
    </div>
    <span class="dcount" id="dcount" aria-live="polite">${guides.length} guides</span>
  </div>
</div>

<section class="wrap dgrid-wrap">
  <div class="dgrid" id="dgrid">
${cards}
  </div>
  <p class="dempty" id="dempty">No guides match those filters yet. <button class="chipbtn" type="button" id="dreset">Show all guides</button></p>
  <p class="dnote">Daily budgets are rough mid-range costs per person in rupees (a hotel shared by two, food, local transport and sightseeing), excluding flights. Visa labels are for Indian passport holders and can change, so check our <a href="/visa-checker.html">visa checker</a> and the official website before you book.</p>
</section>
</main>

${footer()}

${SCRIPT}
<script>
  // Region, visa and "best this month" filters; the choice is kept in the address so it can be shared
  (function () {
    var MONTHS = ${JSON.stringify(MONTHS)};
    var month = new Date().getMonth() + 1;
    var cards = [].slice.call(document.querySelectorAll('.dcard'));
    var state = { region: 'all', easy: false, best: false };
    var q = new URLSearchParams(location.search);
    if (q.get('region')) state.region = q.get('region');
    state.easy = q.get('visa') === 'easy'; state.best = q.get('best') === '1';
    document.getElementById('bestMonth').textContent = 'in ' + MONTHS[month - 1];
    cards.forEach(function (c) {
      c._best = c.getAttribute('data-best').split(',').indexOf(String(month)) !== -1;
      if (c._best) c.querySelector('.dcard-now').hidden = false;
    });
    function apply(push) {
      var n = 0;
      cards.forEach(function (c) {
        var ok = (state.region === 'all' || c.getAttribute('data-region') === state.region) &&
          (!state.easy || /^(free|arrival)$/.test(c.getAttribute('data-visa'))) && (!state.best || c._best);
        c.hidden = !ok; if (ok) n++;
      });
      [].forEach.call(document.querySelectorAll('[data-region].chipbtn'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-region') === state.region); });
      document.querySelector('[data-toggle="easy"]').setAttribute('aria-pressed', state.easy);
      document.querySelector('[data-toggle="best"]').setAttribute('aria-pressed', state.best);
      document.getElementById('dcount').textContent = n + (n === 1 ? ' guide' : ' guides');
      document.getElementById('dempty').style.display = n ? 'none' : 'block';
      if (push) {
        var p = [];
        if (state.region !== 'all') p.push('region=' + state.region);
        if (state.easy) p.push('visa=easy');
        if (state.best) p.push('best=1');
        try { history.replaceState(null, '', location.pathname + (p.length ? '?' + p.join('&') : '')); } catch (e) {}
        if (window.gtag) window.gtag('event', 'destination_filter', { region: state.region, easy_visa: state.easy, best_now: state.best });
      }
    }
    document.querySelector('.dfilters').addEventListener('click', function (e) {
      var b = e.target.closest('.chipbtn'); if (!b) return;
      if (b.hasAttribute('data-region')) state.region = b.getAttribute('data-region');
      else state[b.getAttribute('data-toggle')] = !state[b.getAttribute('data-toggle')];
      apply(true);
    });
    document.getElementById('dreset').addEventListener('click', function () { state = { region: 'all', easy: false, best: false }; apply(true); });
    apply(false);
  })();
</script>
</body>
</html>
`;
}

// ------------------------------------------------------------------ visa-checker.html
function visaText(d) {
  const es = (d.g.sections.find(s => s.id === 'essentials') || {}).html || '';
  const m = es.match(/<(p|li)>\s*<strong>[^<]*(?:Entry|Visa|visa)[^<]*<\/strong>:?\s*([\s\S]*?)<\/\1>/);
  const EXTRA = {
    singapore: 'Indian passport holders need a visa, applied for through an authorised visa agent (no interview; usually 3 to 5 working days, about ₹2,500–3,500 in total). Everyone must also submit the free SG Arrival Card within 3 days before arrival. See our <a href="/blog/singapore-visa-for-indians.html">step-by-step Singapore visa guide</a>.',
    india: 'Indian citizens don\'t need a visa to travel within India. Most foreign visitors need an e-Visa.',
  };
  let t = EXTRA[d.slug] || (m ? m[2].trim() : esc(d.visa));
  t = t.charAt(0).toUpperCase() + t.slice(1);
  return t.replace(/\s*Rules as of [^.]*\.?\s*(always|Always)[^.]*\./, '').replace(/\s*(Rules|Requirements) (change|can change)[^.]*\./i, '').trim();
}

function visaPage() {
  const url = `${SITE}/visa-checker.html`;
  const title = 'Visa Checker for Indians: Visa-Free & e-Visa Countries';
  const desc = 'Check visa rules for Indian passport holders: which countries are visa-free, visa on arrival, e-visa or need a visa in advance, with links to full guides.';
  const list = guides.filter(d => d.slug !== 'india').sort((a, b) => a.name.localeCompare(b.name));
  const groups = ['free', 'arrival', 'evisa', 'visa'];
  const count = (t) => list.filter(d => d.visaType === t).length;
  const faq = [
    ['Which countries can Indians visit without a visa?', `From our guides, Indian passport holders can currently visit ${list.filter(d => d.visaType === 'free').map(d => d.name).join(', ')} without arranging a visa in advance. Some need a free online registration or permit, so check each country's details.`],
    ['Which countries give Indians a visa on arrival?', `${list.filter(d => d.visaType === 'arrival').map(d => d.name).join(', ')} offer a visa on arrival for Indian tourists, usually for a fee paid at the airport.`],
    ['Where can Indians get an e-visa online?', `${list.filter(d => d.visaType === 'evisa').map(d => d.name).join(', ')} offer an online e-visa or travel authorisation. Always apply on the official government website.`],
    ['How current are these visa rules?', 'We review them regularly, but visa rules change without notice. Always confirm on the official government or embassy website before you book.'],
  ];
  const rows = list.map(d => `      <details class="vrow" data-visa="${d.visaType}" data-name="${esc(d.name.toLowerCase())}" id="${d.slug}">
        <summary><img src="${d.flag}" alt="" width="32" height="24" loading="lazy"><span class="vname">${esc(d.name)}</span><span class="vshort">${esc(d.visa.charAt(0).toUpperCase() + d.visa.slice(1))}</span><span class="vtag ${d.visaType}">${VISA[d.visaType].label}</span></summary>
        <div class="vbody"><p>${visaText(d)}</p><p class="vlinks"><a class="btn btn-primary" href="/destinations/${d.slug}.html">${esc(d.name)} guide &amp; itinerary →</a></p></div>
      </details>`).join('\n');

  return `${head({ title, desc, url, ogTitle: 'Visa checker for Indian passport holders', image: '/images/og/default.jpg', extra: [
    ld({ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Visa Checker for Indians', url, description: desc, applicationCategory: 'TravelApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' }, creator: { '@type': 'Organization', '@id': `${SITE}/#organization`, name: 'Love and Layovers' } }),
    ld({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }),
    ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: 'Destinations', item: `${SITE}/destinations/` }, { '@type': 'ListItem', position: 3, name: 'Visa checker', item: url }] }),
  ].join('\n') })}
<style>${HERO_CSS}
  .pg-hero { background-image: url('/images/destinations/thumbs/jewel-changi-hero.webp'); }
  .vc { padding-top: 32px; padding-bottom: 64px; max-width: 900px; }
  .vsearch { display: flex; align-items: center; gap: 12px; background: #fff; border: 2px solid var(--line); border-radius: 16px; padding: 4px 16px; }
  .vsearch:focus-within { border-color: var(--accent); }
  .vsearch input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font: 500 1.1rem var(--sans); color: var(--ink); padding: 14px 0; }
  .vc .chips { margin-top: 14px; }
  .vsum { margin: 14px 0 0; font-size: .88rem; color: var(--muted); font-weight: 600; }
  .vlist { display: grid; gap: 10px; margin-top: 16px; }
  .vrow { background: #fff; border: 1px solid var(--line); border-radius: 16px; overflow: hidden; }
  .vrow[hidden] { display: none; }
  .vrow[open] { border-color: var(--accent); box-shadow: var(--shadow-sm); }
  .vrow summary { display: grid; grid-template-columns: auto minmax(0, 150px) minmax(0, 1fr) auto; align-items: center; gap: 14px; padding: 14px 18px; cursor: pointer; list-style: none; }
  .vrow summary::-webkit-details-marker { display: none; }
  .vrow summary img { width: 32px; height: 24px; border-radius: 3px; box-shadow: 0 1px 4px rgba(0,0,0,.2); }
  .vname { font-weight: 800; font-size: 1.02rem; }
  .vshort { font-size: .9rem; color: var(--ink-soft); }
  .vbody { padding: 0 18px 18px; border-top: 1px dashed var(--line); }
  .vbody p { margin: 14px 0 0; line-height: 1.65; }
  .vbody a:not(.btn) { color: var(--accent); font-weight: 600; text-decoration: underline; }
  .vlinks .btn { padding: 11px 18px; font-size: .9rem; }
  .vnote { margin-top: 22px; padding: 16px 18px; border-radius: 14px; background: #eef6f5; border-left: 4px solid #1f9d8f; font-size: .92rem; line-height: 1.6; }
  .vfaq { margin-top: 44px; }
  .vfaq h2 { font-size: 1.6rem; font-weight: 900; margin-bottom: 14px; }
  .vfaq details { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 14px 18px; margin-top: 10px; }
  .vfaq summary { font-weight: 700; cursor: pointer; }
  .vfaq p { margin: 10px 0 0; color: var(--ink-soft); line-height: 1.6; }
  @media (max-width: 640px) { .vrow summary { grid-template-columns: auto minmax(0, 1fr) auto; } .vshort { display: none; } }
</style>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
${header('destinations')}

<main id="main">
<section class="pg-hero">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/destinations/">Destinations</a> › Visa checker</nav>
    <h1>Visa checker for <em>Indian passports</em></h1>
    <p>Type a country to see whether Indian passport holders can go visa-free, get a visa on arrival, apply for an e-visa online or need a visa in advance.</p>
  </div>
</section>

<section class="wrap vc">
  <label class="vsearch"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg><span class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Search for a country</span><input type="search" id="vq" placeholder="Search a country, e.g. Thailand" autocomplete="off"></label>
  <div class="chips" role="group" aria-label="Filter by visa type">
    <button class="chipbtn" type="button" data-v="all" aria-pressed="true">All (${list.length})</button>
${groups.map(t => `    <button class="chipbtn" type="button" data-v="${t}" aria-pressed="false">${VISA[t].label} (${count(t)})</button>`).join('\n')}
  </div>
  <p class="vsum" id="vsum" aria-live="polite">${list.length} countries</p>
  <div class="vlist" id="vlist">
${rows}
  </div>
  <p class="vnote"><strong>Always double-check.</strong> These notes are for Indian passport holders travelling as tourists and were last reviewed in ${MONTHS[new Date().getUTCMonth()]} ${new Date().getUTCFullYear()}. Visa rules change without notice, so confirm on the official government or embassy website before you book flights. Holding a valid US, UK or Schengen visa often unlocks easier entry elsewhere. Planning by visa? Read our list of <a href="/blog/visa-free-countries-for-indians.html">visa-free and visa-on-arrival countries for Indians</a>.</p>

  <div class="vfaq">
    <h2>Visa FAQs for Indian travellers</h2>
${faq.map(([q, a]) => `    <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
  </div>
</section>
</main>

${footer()}

${SCRIPT}
<script>
  (function () {
    var rows = [].slice.call(document.querySelectorAll('.vrow')), input = document.getElementById('vq'), type = 'all', logged = '';
    function apply() {
      var q = input.value.trim().toLowerCase(), n = 0, last = null;
      rows.forEach(function (r) {
        var ok = (type === 'all' || r.getAttribute('data-visa') === type) && (!q || r.getAttribute('data-name').indexOf(q) !== -1);
        r.hidden = !ok; if (ok) { n++; last = r; }
      });
      if (q && n === 1) last.open = true;
      document.getElementById('vsum').textContent = n ? n + (n === 1 ? ' country' : ' countries') : 'No guide for that country yet. Try another, or browse all destinations.';
    }
    input.addEventListener('input', apply);
    input.addEventListener('change', function () { var q = input.value.trim(); if (q && q !== logged && window.gtag) { logged = q; window.gtag('event', 'visa_check', { search_term: q }); } });
    document.querySelector('.vc .chips').addEventListener('click', function (e) {
      var b = e.target.closest('.chipbtn'); if (!b) return;
      type = b.getAttribute('data-v');
      [].forEach.call(this.querySelectorAll('.chipbtn'), function (x) { x.setAttribute('aria-pressed', x === b); });
      apply();
    });
    document.getElementById('vlist').addEventListener('toggle', function (e) {
      if (e.target.open && window.gtag) window.gtag('event', 'visa_check', { destination: e.target.id });
    }, true);
    // Open a country from a link such as /visa-checker.html#japan
    var h = location.hash.slice(1), el = h && document.getElementById(h);
    if (el && el.classList.contains('vrow')) { el.open = true; el.scrollIntoView({ block: 'center' }); }
  })();
</script>
</body>
</html>
`;
}

// ------------------------------------------------------------------ homepage "Where to go this month"
function monthSection() {
  const data = guides.filter(d => d.slug !== 'india').map(d => ({ s: d.slug, n: d.name, f: d.flag, i: d.thumb, l: d.line, m: d.months, v: d.visaType, vl: VISA[d.visaType].label, r: d.region, b: d.inr ? `${fmt(d.inr.lo)}–${fmt(d.inr.hi).slice(1)}/day` : d.budget }));
  return `<section class="section month-picks" id="this-month" aria-labelledby="monthTitle">
  <style>.month-picks{padding-top:56px;padding-bottom:8px}.mp-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.mp-card{display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;color:var(--ink);transition:transform .25s ease,box-shadow .25s ease}.mp-card:hover{transform:translateY(-4px);box-shadow:var(--shadow)}.mp-img{aspect-ratio:16/10;background:var(--sand);overflow:hidden}.mp-img img{width:100%;height:100%;object-fit:cover}.mp-body{padding:14px 16px 16px}.mp-body h3{display:flex;align-items:center;gap:8px;font-size:1.12rem;font-weight:900}.mp-body h3 img{width:24px;height:18px;border-radius:3px;flex:none}.mp-body p{margin-top:4px;font-size:.86rem;color:var(--ink-soft);line-height:1.4}.mp-meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:10px;font-size:.8rem;font-weight:700}.mp-meta .vt{padding:3px 8px;border-radius:999px;font-size:.7rem}.vt.free{background:#dcf5e6;color:#0b5d2e}.vt.arrival{background:#e0f0fb;color:#0b4a75}.vt.evisa{background:#fdf0d5;color:#7a4a00}.vt.visa{background:#f3e8e2;color:#7a2e12}@media (max-width:1000px){.mp-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media (max-width:520px){.mp-grid{grid-template-columns:minmax(0,1fr)}}</style>
  <div class="wrap">
    <div class="sec-head reveal">
      <div>
        <span class="kicker">Updated every month</span>
        <h2 id="monthTitle">Where to go <span id="mpMonth">this month</span></h2>
        <p>Places at their best right now, with good weather and our day-by-day plans ready to use.</p>
      </div>
      <a href="/destinations/?best=1" class="link-arrow">All destinations for this month <span aria-hidden="true">→</span></a>
    </div>
    <div class="mp-grid reveal" id="mpGrid"></div>
    <noscript><p><a href="/destinations/">Browse all destination guides</a></p></noscript>
  </div>
  <script type="application/json" id="mp-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
  <script>
    (function () {
      var D = JSON.parse(document.getElementById('mp-data').textContent), now = new Date(), m = now.getMonth() + 1;
      var MONTHS = ${JSON.stringify(MONTHS)};
      var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
      // In season now; easy visas and Asia first, then rotate by day so the picks vary through the month
      var rank = { free: 0, arrival: 1, evisa: 2, visa: 3 };
      var picks = D.filter(function (d) { return d.m.indexOf(m) !== -1; }).sort(function (a, b) {
        return (rank[a.v] - rank[b.v]) || ((a.r === 'asia' ? 0 : 1) - (b.r === 'asia' ? 0 : 1)) || a.n.localeCompare(b.n);
      });
      var top = picks.slice(0, 12), start = top.length > 8 ? (now.getDate() % (top.length - 7)) : 0;
      picks = top.slice(start, start + 8);
      if (picks.length < 4) return document.getElementById('this-month').remove();
      document.getElementById('mpMonth').textContent = 'in ' + MONTHS[m - 1];
      document.getElementById('mpGrid').innerHTML = picks.map(function (d) {
        return '<a class="mp-card" href="/destinations/' + esc(d.s) + '.html" data-dest="' + esc(d.s) + '"><div class="mp-img"><img src="' + esc(d.i) + '" alt="" loading="lazy" width="640" height="400"></div>' +
          '<div class="mp-body"><h3><img src="' + esc(d.f) + '" alt="" width="24" height="18">' + esc(d.n) + '</h3><p>' + d.l + '</p>' +
          '<div class="mp-meta"><span>' + esc(d.b) + '</span><span class="vt ' + esc(d.v) + '">' + esc(d.vl) + '</span></div></div></a>';
      }).join('');
      document.getElementById('mpGrid').addEventListener('click', function (e) {
        var a = e.target.closest('.mp-card'); if (a && window.gtag) window.gtag('event', 'month_pick_click', { destination: a.getAttribute('data-dest'), month: m });
      });
    })();
  </script>
</section>`;
}

fs.writeFileSync(path.join(ROOT, 'destinations', 'index.html'), destinationsPage());
fs.writeFileSync(path.join(ROOT, 'visa-checker.html'), visaPage());
const INDEX = path.join(ROOT, 'index.html');
const home = fs.readFileSync(INDEX, 'utf8');
if (!/<!-- month:start -->[\s\S]*?<!-- month:end -->/.test(home)) throw new Error('index.html: add <!-- month:start --><!-- month:end --> where the "Where to go this month" section should go');
fs.writeFileSync(INDEX, home.replace(/<!-- month:start -->[\s\S]*?<!-- month:end -->/, () => `<!-- month:start -->\n${monthSection()}\n<!-- month:end -->`));
console.log(`destinations/index.html (${guides.length} guides), visa-checker.html, homepage month section`);
