// Build "Things to do in Singapore this month":
//   singapore-this-month.html          always the current month (Singapore time)
//   singapore-events/YYYY-MM.html      one archive page per month with a data file
// from data/singapore-months/YYYY-MM.json (dated events, researched monthly) and
// data/singapore-months/_baseline.json (weather and typical festivals per month, used
// on its own if a month has no data file yet).
// Run automatically on the 1st of each month by .github/workflows/monthly-events.yml, and
// after the monthly research task adds the next month's file.
// Usage: node scripts/build-month-events.cjs   (MONTH=2027-01 to preview another month)
const fs = require('fs');
const path = require('path');
const { header, footer, HEAD_LINKS, SCRIPT, GA, FONTS, waChannelBtn } = require('./site-chrome.cjs');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.loveandlayover.in';
const DIR = path.join(ROOT, 'data', 'singapore-months');
const OUT = path.join(ROOT, 'singapore-events');
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT = MONTHS.map(m => m.slice(0, 3));
const baseline = JSON.parse(fs.readFileSync(path.join(DIR, '_baseline.json'), 'utf8'));

// Current month in Singapore (UTC+8)
const sgNow = new Date(Date.now() + 8 * 3600e3);
const CURRENT = process.env.MONTH || `${sgNow.getUTCFullYear()}-${String(sgNow.getUTCMonth() + 1).padStart(2, '0')}`;
const addMonth = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`; };
const label = (ym) => { const [y, m] = ym.split('-'); return `${MONTHS[+m - 1]} ${y}`; };
const dayStr = (iso) => { const [, m, d] = iso.split('-'); return `${+d} ${SHORT[+m - 1]}`; };
const range = (e) => e.start === e.end ? dayStr(e.start) : `${dayStr(e.start)} – ${dayStr(e.end)}`;

function load(ym) {
  const f = path.join(DIR, `${ym}.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
}
const files = fs.readdirSync(DIR).filter(f => /^\d{4}-\d{2}\.json$/.test(f)).map(f => f.slice(0, 7)).sort();
for (const ym of files) {
  const d = load(ym);
  for (const e of d.events || []) for (const k of ['name', 'start', 'end', 'where', 'desc']) if (!e[k]) throw new Error(`${ym}: event missing ${k}`);
}

function body(ym, data, { canonicalUrl, isCurrent }) {
  const [y, m] = ym.split('-');
  const base = baseline[String(+m)];
  const name = label(ym);
  const events = (data && data.events || []).slice().sort((a, b) => a.start.localeCompare(b.start));
  const top = events.filter(e => e.top);
  const next = addMonth(ym, 1), nextData = load(next);
  const title = `Things to Do in Singapore in ${name}: Events & Festivals`;
  const desc = data ? `What's on in Singapore in ${name}: ${events.slice(0, 3).map(e => e.name).join(', ')} and more, with dates, costs, weather and tips.`.slice(0, 155)
    : `What to expect in Singapore in ${name}: weather, festivals, school holidays and tips. Full event dates coming soon.`;
  const ld = (o) => `<script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n</script>`;
  const eventLd = events.slice(0, 20).map(e => ({ '@type': 'Event', name: e.name, startDate: e.start, endDate: e.end, eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode', eventStatus: 'https://schema.org/EventScheduled', location: { '@type': 'Place', name: e.where, address: { '@type': 'PostalAddress', addressLocality: 'Singapore', addressCountry: 'SG' } }, description: e.desc, ...(e.url ? { url: e.url } : {}) }));
  const archive = files.filter(f => f !== ym).slice(-12).reverse();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonicalUrl}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:site_name" content="Love and Layovers">
<meta property="og:image" content="${SITE}/images/og/singapore.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/images/og/singapore.jpg">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${FONTS}
${ld({ '@context': 'https://schema.org', '@type': 'Article', headline: title, description: desc, dateModified: (data && data.updated) || `${ym}-01`, mainEntityOfPage: canonicalUrl, author: { '@type': 'Organization', '@id': `${SITE}/#organization`, name: 'Love and Layovers' }, publisher: { '@id': `${SITE}/#organization` } })}
${eventLd.length ? ld({ '@context': 'https://schema.org', '@graph': eventLd }) : ''}
${ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
  { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
  { '@type': 'ListItem', position: 2, name: 'Singapore News', item: `${SITE}/singapore-news.html` },
  { '@type': 'ListItem', position: 3, name: `Singapore in ${name}`, item: canonicalUrl }] })}
${GA}
<link rel="stylesheet" href="/css/site.css?v=1">
<link rel="stylesheet" href="/css/article.css?v=2">
<style>
  .mh { background: var(--navy) url('/images/destinations/merlion-hero.webp') center / cover; position: relative; color: #fff; }
  .mh::before { content: ''; position: absolute; inset: 0; background: linear-gradient(100deg, rgba(10,22,40,.93), rgba(10,22,40,.6)); }
  .mh .wrap { position: relative; padding-top: 50px; padding-bottom: 42px; }
  .mh nav { font-size: .85rem; color: rgba(255,255,255,.8); } .mh nav a { color: #fff; font-weight: 600; }
  .mh .kick { display: inline-block; margin-top: 14px; font-size: .78rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #f0a559; }
  .mh h1 { font-size: clamp(2rem, 4.4vw, 3.2rem); font-weight: 900; margin: 8px 0 10px; }
  .mh p { color: rgba(255,255,255,.86); max-width: 720px; font-size: 1.05rem; }
  .mh .meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
  .mh .meta span { font-size: .82rem; font-weight: 600; padding: 6px 12px; border-radius: 999px; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.22); }
  .tops { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
  .top { background: #fff; border: 1px solid var(--line); border-radius: 18px; padding: 18px; }
  .top small { font-size: .74rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
  .top b { display: block; font-size: 1.05rem; margin: 6px 0; color: var(--ink); }
  .top p { font-size: .9rem; color: var(--ink-soft); margin: 0 !important; }
  .tag { display: inline-block; font-size: .72rem; font-weight: 700; padding: 3px 8px; border-radius: 999px; background: var(--sand); color: var(--ink-soft); margin: 2px 4px 0 0; }
  .soon { background: #fff8ec; border: 1px dashed #e9c48f; border-radius: 16px; padding: 18px; }
  .arch { display: flex; flex-wrap: wrap; gap: 8px; }
  .arch a { padding: 7px 13px; border-radius: 999px; border: 1px solid var(--line); background: #fff; font-size: .88rem; font-weight: 600; color: var(--ink-soft); text-decoration: none !important; }
  .mlayout { padding-top: 40px; padding-bottom: 72px; }
  .mlayout .post-body { max-width: 860px; }
  .mlayout .post-body > h2:first-child, .mlayout .post-body > .soon:first-child { margin-top: 0; }
</style>
${HEAD_LINKS}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>

${header('news')}

<main id="main">
<section class="mh">
  <div class="wrap">
    <nav aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/singapore-news.html">Singapore News</a> › Singapore in ${esc(name)}</nav>
    <span class="kick">${isCurrent ? 'This month in Singapore' : 'Singapore events'}</span>
    <h1>Things to do in Singapore in ${esc(name)}</h1>
    <p>${esc((data && data.intro) || `Here's what to expect in Singapore in ${MONTHS[+m - 1]}: the weather, the festivals that usually happen and our tips. We're confirming this year's exact event dates and will add them here soon.`)}</p>
    <div class="meta">${data ? `<span>${events.length} events</span><span>Updated ${dayStr(data.updated)} ${data.updated.slice(0, 4)}</span>` : '<span>Event dates coming soon</span>'}<span>By Sanket &amp; Nikita, living in Singapore</span></div>
  </div>
</section>

<div class="wrap mlayout">
  <article class="post-body">${top.length ? `<h2 id="top-picks">Our top picks for ${esc(MONTHS[+m - 1])}</h2>
<div class="tops">
${top.map(e => `  <div class="top"><small>${esc(range(e))}</small><b>${esc(e.name)}</b><p>${esc(e.desc)}</p></div>`).join('\n')}
</div>` : ''}
${events.length ? `<h2 id="whats-on">What's on in ${esc(name)}</h2>
<div class="table-wrap"><table>
<tr><th>Dates</th><th>Event</th><th>Where</th><th>Cost</th></tr>
${events.map(e => `<tr><td>${esc(range(e))}</td><td><strong>${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.name)}</a>` : esc(e.name)}</strong><br>${esc(e.desc)}${(e.tags || []).length ? `<br>${e.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}` : ''}</td><td>${esc(e.where)}</td><td>${esc(e.cost || 'Check official site')}</td></tr>`).join('\n')}
</table></div>
<p class="updated">Dates and prices are from organisers and official listings as of ${esc(dayStr(data.updated))} ${data.updated.slice(0, 4)}. Always check the official page before you go.</p>` : `<div class="soon"><b>This year's event dates are on the way.</b> We research each month's events before it starts. Meanwhile, here's what usually happens in ${esc(MONTHS[+m - 1])}.</div>`}

<h2 id="weather">Weather in ${esc(MONTHS[+m - 1])}</h2>
<p>${esc(base.weather)}</p>

<h2 id="usually">What usually happens in ${esc(MONTHS[+m - 1])}</h2>
<ul>
${base.typical.map(t => `<li>${esc(t)}</li>`).join('\n')}
</ul>
${data && (data.holidays || []).length ? `<h2 id="holidays">Public holidays</h2>
<ul>
${data.holidays.map(h => `<li><strong>${esc(dayStr(h.date))}:</strong> ${esc(h.name)}</li>`).join('\n')}
</ul>
<p>Shops and attractions are usually open on public holidays, but they're busier, and some offices and banks close.</p>` : ''}

<h2 id="tips">Tips for ${esc(MONTHS[+m - 1])}</h2>
<ul>
${[...((data && data.tips) || []), ...base.tips].map(t => `<li>${esc(t)}</li>`).join('\n')}
</ul>

${nextData ? `<h2 id="coming-up">Coming up in ${esc(label(next))}</h2>
<ul>
${nextData.events.filter(e => e.top).concat(nextData.events.filter(e => !e.top)).slice(0, 4).map(e => `<li><strong>${esc(range(e))}:</strong> ${esc(e.name)}</li>`).join('\n')}
</ul>
<p><a href="/singapore-events/${next}.html">See everything in ${esc(label(next))} →</a></p>` : ''}

${data && (data.related || []).length ? `<h2 id="more">Plan your visit</h2>
<ul>
${data.related.map(r => `<li><a href="${esc(r.url)}">${esc(r.title)}</a></li>`).join('\n')}
</ul>` : ''}

<div class="post-follow">
  <h2>Get Singapore updates on WhatsApp</h2>
  <p>We post each month's events, Singapore news and new guides on our WhatsApp Channel.</p>
  <div class="row">${waChannelBtn('Join our WhatsApp Channel') || '<a class="btn btn-yt" href="https://www.youtube.com/@LoveAndLayover?sub_confirmation=1" target="_blank" rel="noopener">Subscribe on YouTube</a>'}</div>
</div>

${archive.length ? `<h2 id="other-months">Other months</h2>
<div class="arch">
${archive.map(f => `  <a href="/singapore-events/${f}.html">${esc(label(f))}</a>`).join('\n')}
</div>` : ''}
${data && (data.sources || []).length ? `<h2 id="sources">Sources</h2>
<ul>
${data.sources.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`).join('\n')}
</ul>` : ''}
  </article>
</div>
</main>

${footer()}

${SCRIPT}
</body>
</html>
`;
}

fs.mkdirSync(OUT, { recursive: true });
for (const ym of files) fs.writeFileSync(path.join(OUT, `${ym}.html`), body(ym, load(ym), { canonicalUrl: `${SITE}/singapore-events/${ym}.html`, isCurrent: ym === CURRENT }));
// The "this month" page is canonical to itself; its content changes each month
fs.writeFileSync(path.join(ROOT, 'singapore-this-month.html'), body(CURRENT, load(CURRENT), { canonicalUrl: `${SITE}/singapore-this-month.html`, isCurrent: true }));
console.log(`singapore-this-month.html: ${label(CURRENT)} (${load(CURRENT) ? 'with events' : 'baseline only'}); archive pages: ${files.join(', ') || 'none'}`);
