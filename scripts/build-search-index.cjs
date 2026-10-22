// Build search-index.json for the site search (the magnifier button in the header).
// Indexes every page listed in sitemap.xml: title, description, headings and the start
// of the text, so search works without a server. Re-run after adding or editing pages:
//   node scripts/build-search-index.cjs   (also run by the update-videos workflow)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.loveandlayover.in';

const decode = (s = '') => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&rsquo;|&lsquo;/g, "'").replace(/&ldquo;|&rdquo;/g, '"')
  .replace(/&ndash;/g, '–').replace(/&mdash;/g, '—').replace(/&rarr;/g, '→').replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n));
const text = (h = '') => decode(h.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

// Strip things that aren't reading content
function mainText(html) {
  let m = html.match(/<main\b[\s\S]*?<\/main>/i);
  let h = m ? m[0] : html;
  h = h.replace(/<(script|style|nav|header|footer|svg|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
       .replace(/<!-- klook:start -->[\s\S]*?<!-- klook:end -->/g, ' ')
       .replace(/<aside class="toc"[\s\S]*?<\/aside>/g, ' ');
  return text(h);
}

function typeOf(url) {
  if (url.includes('/destinations/') && !url.endsWith('/destinations/')) return 'Guide';
  if (url.includes('/blog/')) return 'Post';
  if (url.includes('/videos/')) return 'Video';
  if (/calculator|trip-finder/.test(url)) return 'Tool';
  return 'Page';
}

function imageOf(url, html) {
  const g = url.match(/\/destinations\/([\w-]+)\.html$/);
  if (g && fs.existsSync(path.join(ROOT, 'images/destinations/thumbs', `${g[1]}-hero.webp`))) return `/images/destinations/thumbs/${g[1]}-hero.webp`;
  const v = url.match(/\/videos\/([\w-]{11})\.html$/);
  if (v) return `https://i.ytimg.com/vi/${v[1]}/mqdefault.jpg`;
  const pre = html.match(/<link rel="preload" as="image" href="([^"]+)"/);
  if (pre) {
    const thumb = pre[1].replace('/images/destinations/', '/images/destinations/thumbs/');
    return fs.existsSync(path.join(ROOT, thumb)) ? thumb : pre[1];
  }
  // Fall back to the page's share image when it's one of ours
  const og = (html.match(/<meta property="og:image" content="https:\/\/www\.loveandlayover\.in(\/[^"]+)"/) || [])[1];
  if (og && !og.endsWith('/default.jpg') && fs.existsSync(path.join(ROOT, og))) return og;
  return '';
}

const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
// Long videos (Shorts titles are mostly hashtags, so they'd only clutter results) and the series page
const videos = JSON.parse(fs.readFileSync(path.join(ROOT, 'videos-data.json'), 'utf8'));
for (const v of videos) if (v.duration !== '< 1 min' && fs.existsSync(path.join(ROOT, 'videos', `${v.id}.html`))) urls.push(`${SITE}/videos/${v.id}.html`);
if (fs.existsSync(path.join(ROOT, 'videos', 'life-in-singapore.html'))) urls.push(`${SITE}/videos/life-in-singapore.html`);

const index = [];
for (const url of urls) {
  let rel = url.replace(SITE, '');
  if (rel === '/' || rel === '') rel = '/index.html';
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const h1 = (html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [])[1];
  const titleTag = (html.match(/<title>([^<]+)<\/title>/) || [])[1] || '';
  const short = decode(titleTag).split(/\s[|–—]\s|\s-\s/)[0].trim();
  let title = (h1 && typeOf(url) !== 'Page') ? text(h1) : short;
  if (url === `${SITE}/`) title = 'Love & Layovers home';
  const desc = decode((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
  const heads = [...html.matchAll(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/gi)].map(m => text(m[1]))
    .filter(h => h && !/^(on this page|faqs?|keep planning|follow our|never miss|tickets & tours|watch our)/i.test(h)).slice(0, 14);
  const body = mainText(html).slice(0, 900);
  index.push({ u: url.replace(SITE, '') || '/', t: title, y: typeOf(url), d: desc, h: heads.join(' · '), b: body, i: imageOf(url, html) });
}

// Guides and tools first, then posts, then pages and videos
const order = { Guide: 0, Tool: 1, Post: 2, Page: 3, Video: 4 };
index.sort((a, b) => order[a.y] - order[b.y]);
fs.writeFileSync(path.join(ROOT, 'search-index.json'), JSON.stringify(index));
console.log(`search-index.json: ${index.length} pages, ${(JSON.stringify(index).length / 1024).toFixed(0)} KB`);
