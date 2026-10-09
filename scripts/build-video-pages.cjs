// Generate the static video pages from videos-data.json:
//   videos/<id>.html              one indexable page per video
//   videos/life-in-singapore.html the 30-day "Life in Singapore" vlog series
//   sitemap_videos.xml            Google video sitemap pointing at those pages
// Run by .github/workflows/update-videos.yml after fetch-videos.cjs; safe to re-run.
const fs = require('fs');
const path = require('path');
const chrome = require('./site-chrome.cjs');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.loveandlayover.in';
const CHANNEL = 'https://www.youtube.com/@nikita_sanket_mane';
const SUBSCRIBE = `${CHANNEL}?sub_confirmation=1`;
const OUT_DIR = path.join(ROOT, 'videos');
const SERIES_SLUG = 'life-in-singapore';

const videos = JSON.parse(fs.readFileSync(path.join(ROOT, 'videos-data.json'), 'utf8'));

// ---------- helpers ----------
const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const isShort = (v) => v.duration === '< 1 min';
const pageUrl = (v) => `/videos/${v.id}.html`;
const thumb = (v) => `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
const watchUrl = (v) => isShort(v) ? `https://www.youtube.com/shorts/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`;
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

// Hashtags stripped, for headings and meta tags
const cleanTitle = (t) => t.replace(/#[\p{L}\p{N}_]+/gu, '').replace(/\s*\|\s*$/, '').replace(/\s{2,}/g, ' ').trim() || t;

// <title> within ~60 chars: keep the brand suffix when it fits, else trim the title at a word
function pageTitle(t) {
  const full = `${t} | Love and Layovers`;
  if (full.length <= 60) return full;
  if (t.length <= 60) return t;
  return t.slice(0, 58).replace(/\s+\S*$/, '').replace(/[\s|,:;—-]+$/, '') + '…';
}

// Chapters from description timestamps ("00:00 – Intro", "1:02:03 Finale"). Like YouTube,
// only counted when they start at 0:00 and there are at least three.
const STAMP = /^\(?((?:\d{1,2}:)?\d{1,2}:\d{2})\)?\s*[-–—:|]?\s*(.+)$/;
const toSeconds = (t) => t.split(':').reduce((acc, n) => acc * 60 + parseInt(n, 10), 0);
function chapters(v) {
  if (isShort(v)) return [];
  const list = (v.fullDescription || '').split(/\n/).map(l => l.trim().match(STAMP)).filter(Boolean)
    .map(m => ({ stamp: m[1], start: toSeconds(m[1]), label: m[2].trim() }));
  if (list.length < 3 || list[0].start !== 0) return [];
  return list.filter((c, i) => i === 0 || c.start > list[i - 1].start);
}

// Description lines minus comma-separated tag dumps ("reach, feed, foryoupage, ...") and,
// when the video has chapters, minus the timestamp lines (shown as a chapter list instead)
function descriptionLines(v) {
  const text = v.fullDescription || v.description || '';
  const hasChapters = chapters(v).length > 0;
  return text.split(/\n+/).map(l => l.trim()).filter(l => l && (l.match(/,/g) || []).length < 6)
    .filter(l => !hasChapters || (!STAMP.test(l) && !/^timestamps?:?$/i.test(l)));
}

// Day number in the 30-day series ("day 19/30", "Vlog 14/30", "9/30")
function seriesDay(v) {
  const m = v.title.match(/\b(\d{1,2})\s*\/\s*30\b/)
    || `${v.fullDescription || v.description || ''}`.match(/\bday (\d{1,2}) of (?:my|our) daily vlog series/i);
  return m ? parseInt(m[1], 10) : null;
}

// ---------- guide catalog (for "related guides" links) ----------
const STOP = new Set(['guide', 'itinerary', 'food', 'budget', 'travel', 'day', 'tips', 'first', 'timer', 'layover', 'index']);
const ALIASES = {
  singapore: ['singapore', 'marina bay', 'sentosa', 'changi', 'hawker'],
  malaysia: ['malaysia', 'genting', 'kuala lumpur', 'penang', 'langkawi', 'malacca', 'batu caves'],
  'south korea': ['korea', 'seoul'],
  'southeast asia': ['southeast asia', 'singapore', 'malaysia', 'genting', 'thailand', 'vietnam', 'bali'],
  india: ['india', 'marathi', 'ganpati', 'mumbai', 'pune'],
  japan: ['japan', 'tokyo', 'kyoto'],
};

function readTitle(file) {
  const m = fs.readFileSync(file, 'utf8').match(/<title>([^<]+)<\/title>/);
  return m ? m[1].split(/\s[-—|]\s/)[0].replace(/&amp;/g, '&').trim() : path.basename(file, '.html');
}

const guides = [];
for (const dir of ['destinations', 'blog']) {
  for (const f of fs.readdirSync(path.join(ROOT, dir)).filter(f => f.endsWith('.html') && f !== 'index.html')) {
    const slug = f.replace('.html', '');
    const place = slug.split('-').filter(w => !STOP.has(w) && !/^\d+$/.test(w)).join(' ');
    guides.push({
      url: `/${dir}/${f}`,
      place,
      title: readTitle(path.join(ROOT, dir, f)),
      terms: ALIASES[place] || [place],
      isDestination: dir === 'destinations',
    });
  }
}

function relatedGuides(v, limit = 4) {
  // Series episodes are filmed in Singapore even when the title doesn't say so
  const text = `${v.title} ${v.fullDescription || v.description || ''} ${seriesDay(v) !== null ? 'singapore' : ''}`.toLowerCase();
  return guides
    .map(g => ({ g, score: g.terms.filter(t => text.includes(t)).length + (g.isDestination ? 0.5 : 0) }))
    .filter(x => x.score >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.g);
}

// ---------- shared layout ----------
function layout({ title, description, canonical, image, head = '', body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${canonical}">
<meta property="og:type" content="video.other">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${image}">
<meta property="og:url" content="${SITE}${canonical}">
<meta property="og:site_name" content="Love and Layovers">
<meta name="twitter:card" content="summary_large_image">
<meta name="robots" content="index, follow">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/css/modern-theme.css">
${chrome.HEAD_LINKS}
<link rel="stylesheet" href="/css/refresh.css?v=5">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script defer src="https://www.googletagmanager.com/gtag/js?id=G-5D7GNE6JQL"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-5D7GNE6JQL');
</script>
<style>
  .vp { max-width: 980px; margin: 0 auto; padding: 32px 24px 64px; }
  .vp-crumbs { font-size: .85rem; color: var(--grey-500, #6b7280); margin-bottom: 16px; }
  .vp-crumbs a { color: inherit; }
  .vp h1 { font-size: clamp(1.5rem, 3vw, 2.2rem); line-height: 1.25; margin: 0 0 8px; }
  .vp-meta { color: var(--grey-500, #6b7280); font-size: .9rem; margin-bottom: 20px; }
  .vp-player { position: relative; width: 100%; aspect-ratio: 16 / 9; border-radius: 14px; overflow: hidden; background: #000; box-shadow: 0 12px 32px rgba(10,22,40,.18); }
  .vp-player.is-short { aspect-ratio: 9 / 16; max-width: 380px; margin: 0 auto; }
  .vp-player iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
  .vp-actions { display: flex; flex-wrap: wrap; gap: 12px; margin: 20px 0 28px; }
  .vp-desc p { margin: 0 0 12px; line-height: 1.7; overflow-wrap: anywhere; }
  .vp h2 { font-size: 1.3rem; margin: 36px 0 14px; }
  .vp-guides { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; padding: 0; list-style: none; }
  .vp-guides a { display: block; padding: 14px 16px; border: 1px solid var(--grey-200, #e5e7eb); border-radius: 10px; background: #fff; font-weight: 600; color: var(--primary, #0a1628); }
  .vp-guides a:hover { border-color: var(--accent); color: var(--accent); }
  .vp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
  .vp-card { display: block; background: #fff; border: 1px solid var(--grey-200, #e5e7eb); border-radius: 12px; overflow: hidden; color: var(--primary, #0a1628); transition: transform .2s, border-color .2s; }
  .vp-card:hover { transform: translateY(-3px); border-color: var(--accent); }
  .vp-card img { width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; display: block; background: #eee; }
  .vp-card span { display: block; padding: 10px 12px 12px; font-size: .88rem; font-weight: 600; line-height: 1.35; }
  .vp-card small { display: block; color: var(--grey-500, #6b7280); font-weight: 500; margin-top: 4px; }
  .vp-chapters { list-style: none; padding: 0; margin: 0 0 8px; display: grid; gap: 6px; }
  .vp-chapters a { display: flex; gap: 14px; align-items: baseline; padding: 10px 14px; border: 1px solid var(--grey-200, #e5e7eb); border-radius: 10px; background: #fff; color: var(--primary, #0a1628); font-weight: 600; font-size: .95rem; }
  .vp-chapters a:hover { border-color: var(--accent); color: var(--accent); }
  .vp-stamp { flex: none; min-width: 52px; font-variant-numeric: tabular-nums; color: var(--accent); font-weight: 700; }
  .vp-series-note { background: var(--sky, #fff4ea); border-left: 4px solid var(--accent); padding: 14px 16px; border-radius: 8px; margin-bottom: 24px; }
</style>
${head}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
${chrome.header('videos')}
<main id="main" class="vp">
${body}
</main>
${chrome.footer()}
${chrome.SCRIPT}
</body>
</html>
`;
}

function card(v) {
  return `<a class="vp-card" href="${pageUrl(v)}"><img src="${thumb(v)}" alt="" loading="lazy" width="480" height="270"><span>${esc(cleanTitle(v.title))}<small>${isShort(v) ? 'Short' : 'Video'} · ${esc(fmtDate(v.published))}</small></span></a>`;
}

function videoLd(v, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: v.title,
    description: (descriptionLines(v).join(' ') || v.title).slice(0, 500),
    thumbnailUrl: [thumb(v)],
    uploadDate: v.published,
    contentUrl: watchUrl(v),
    embedUrl: `https://www.youtube.com/embed/${v.id}`,
    url,
    // Google needs an endOffset on every Clip. We don't know the video's exact length,
    // so the last chapter (usually the outro) stays on the page but not in the Clip list.
    ...(chapters(v).length ? { hasPart: chapters(v).slice(0, -1).map((c, i, all) => ({
      '@type': 'Clip',
      name: c.label,
      startOffset: c.start,
      endOffset: chapters(v)[i + 1].start,
      url: `https://www.youtube.com/watch?v=${v.id}&t=${c.start}s`,
    })) } : {}),
    publisher: { '@type': 'Organization', name: 'Love and Layovers', logo: { '@type': 'ImageObject', url: `${SITE}/public/images/brand/logo-512.png` } },
  };
}

const ldScript = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

// ---------- per-video pages ----------
const series = videos.filter(v => seriesDay(v) !== null).sort((a, b) => seriesDay(a) - seriesDay(b));

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const v of videos) {
  const title = cleanTitle(v.title);
  const lines = descriptionLines(v);
  const metaDesc = (lines.join(' ') || `Watch "${title}" by Love and Layovers.`).slice(0, 155);
  const related = relatedGuides(v);
  const more = videos.filter(o => o.id !== v.id && isShort(o) === isShort(v)).slice(0, 6);
  const day = seriesDay(v);

  const body = `
<nav class="vp-crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/videos.html">Videos</a> › ${esc(title)}</nav>
<h1>${esc(title)}</h1>
<p class="vp-meta">${isShort(v) ? 'YouTube Short' : esc(v.type)} · ${esc(fmtDate(v.published))}</p>
${day !== null ? `<p class="vp-series-note">Day ${day} of our 30-day <a href="/videos/${SERIES_SLUG}.html">Life in Singapore</a> vlog series — watch every episode in order.</p>` : ''}
<div class="vp-player${isShort(v) ? ' is-short' : ''}">
  <iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}" title="${esc(v.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
</div>
<div class="vp-actions">
  <a class="btn btn-primary" href="${SUBSCRIBE}" target="_blank" rel="noopener">▶ Subscribe on YouTube</a>
  <a class="btn btn-secondary" href="${watchUrl(v)}" target="_blank" rel="noopener">Watch on YouTube</a>
</div>
${chapters(v).length ? `<h2>Chapters</h2>
<ol class="vp-chapters">${chapters(v).map(c => `<li><a href="https://www.youtube.com/watch?v=${v.id}&amp;t=${c.start}s" data-t="${c.start}" target="_blank" rel="noopener"><span class="vp-stamp">${esc(c.stamp)}</span>${esc(c.label)}</a></li>`).join('')}</ol>
<script>
  // Jump the embedded player to a chapter instead of leaving the page
  document.querySelector('.vp-chapters').addEventListener('click', function (e) {
    var a = e.target.closest('a[data-t]'); if (!a) return;
    var f = document.querySelector('.vp-player iframe'); if (!f) return;
    e.preventDefault();
    f.src = f.src.split('?')[0] + '?start=' + a.dataset.t + '&autoplay=1';
    f.closest('.vp-player').scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (window.gtag) window.gtag('event', 'chapter_click', { video_id: '${v.id}', start: +a.dataset.t });
  });
</script>` : ''}
${lines.length ? `<div class="vp-desc">${lines.map(l => `<p>${esc(l)}</p>`).join('\n')}</div>` : ''}
${related.length ? `<h2>Plan your own trip</h2>
<ul class="vp-guides">${related.map(g => `<li><a href="${g.url}">${esc(g.title)} →</a></li>`).join('')}</ul>` : `<h2>Plan your own trip</h2>
<ul class="vp-guides"><li><a href="/destinations/">Browse all destination guides →</a></li><li><a href="/blog.html">Read the travel blog →</a></li></ul>`}
${more.length ? `<h2>More ${isShort(v) ? 'Shorts' : 'videos'}</h2>
<div class="vp-grid">${more.map(card).join('\n')}</div>` : ''}
`;

  const html = layout({
    title: pageTitle(title),
    description: metaDesc,
    canonical: pageUrl(v),
    image: thumb(v),
    head: ldScript(videoLd(v, `${SITE}${pageUrl(v)}`)),
    body,
  });
  fs.writeFileSync(path.join(OUT_DIR, `${v.id}.html`), html);
}

// ---------- series page ----------
{
  const latest = series[series.length - 1];
  const body = `
<nav class="vp-crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/videos.html">Videos</a> › Life in Singapore</nav>
<h1>Life in Singapore — Our 30-Day Vlog Series</h1>
<p class="vp-meta">${series.length} episode${series.length === 1 ? '' : 's'} so far · a new one every day</p>
<p>Our everyday life as an Indian couple living in Singapore — morning routines, small dates, rainy chai evenings, festivals and weekend plans. Start from the latest episode or binge them in order below.</p>
${latest ? `<div class="vp-player${isShort(latest) ? ' is-short' : ''}" style="margin-top:20px">
  <iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(latest.id)}" title="${esc(latest.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
</div>` : ''}
<div class="vp-actions">
  <a class="btn btn-primary" href="${SUBSCRIBE}" target="_blank" rel="noopener">▶ Subscribe for daily episodes</a>
  <a class="btn btn-secondary" href="/destinations/singapore.html">Singapore travel guide</a>
</div>
<h2>All episodes</h2>
<div class="vp-grid">${series.map(v => card(v).replace('<small>', `<small>Day ${seriesDay(v)} · `)).join('\n')}</div>
<h2>Visiting Singapore?</h2>
<ul class="vp-guides">${guides.filter(g => g.place === 'singapore').map(g => `<li><a href="${g.url}">${esc(g.title)} →</a></li>`).join('')}</ul>
`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Life in Singapore — 30-Day Vlog Series',
    itemListElement: series.map((v, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}${pageUrl(v)}` })),
  };
  fs.writeFileSync(path.join(OUT_DIR, `${SERIES_SLUG}.html`), layout({
    title: 'Life in Singapore: 30-Day Couple Vlog | Love and Layovers',
    description: 'Daily vlogs of an Indian couple living in Singapore: routines, dates, food and festivals. Watch all episodes of our 30-day series in order.',
    canonical: `/videos/${SERIES_SLUG}.html`,
    image: latest ? thumb(latest) : `${SITE}/public/images/banner.png`,
    head: ldScript(ld),
    body,
  }));
}

// ---------- video sitemap ----------
const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  <url>
    <loc>${SITE}/videos/${SERIES_SLUG}.html</loc>
  </url>
${videos.map(v => `  <url>
    <loc>${SITE}${pageUrl(v)}</loc>
    <video:video>
      <video:thumbnail_loc>${thumb(v)}</video:thumbnail_loc>
      <video:title>${xmlEsc(v.title)}</video:title>
      <video:description>${xmlEsc((descriptionLines(v).join(' ') || v.title).slice(0, 2000))}</video:description>
      <video:player_loc>https://www.youtube.com/embed/${v.id}</video:player_loc>
      <video:publication_date>${v.published}</video:publication_date>
    </video:video>
  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, 'sitemap_videos.xml'), sitemap);

console.log(`Built ${videos.length} video pages, series page (${series.length} episodes), and sitemap_videos.xml`);
