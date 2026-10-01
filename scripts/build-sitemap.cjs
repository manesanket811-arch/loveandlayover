// Generate sitemap.xml for the hand-written pages, with <lastmod> taken from
// each file's last git commit (so Google sees real update dates).
// Video pages live in sitemap_videos.xml (scripts/build-video-pages.cjs).
// Pages with <meta name="robots" content="noindex…"> are left out.
// Run by .github/workflows/update-videos.yml (checkout needs full history).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.loveandlayover.in';
const SKIP = new Set(['404.html']);

function pages() {
  const list = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
  for (const dir of ['destinations', 'blog']) {
    for (const f of fs.readdirSync(path.join(ROOT, dir))) if (f.endsWith('.html')) list.push(`${dir}/${f}`);
  }
  return list.filter(f => !SKIP.has(f) && !/<meta name="robots" content="noindex/i.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
}

function lastmod(file) {
  try {
    const d = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], { cwd: ROOT, encoding: 'utf8' }).trim();
    if (d) return d;
  } catch (e) { /* not a git checkout */ }
  return fs.statSync(path.join(ROOT, file)).mtime.toISOString().slice(0, 10);
}

function url(file) {
  if (file === 'index.html') return `${SITE}/`;
  if (file.endsWith('/index.html')) return `${SITE}/${file.slice(0, -'index.html'.length)}`;
  return `${SITE}/${file}`;
}

function priority(file) {
  if (file === 'index.html') return '1.0';
  if (file === 'destinations/index.html' || file === 'work-with-us.html') return '0.9';
  if (file.startsWith('destinations/') || file.startsWith('blog/')) return '0.8';
  return '0.7';
}

const order = (f) => (f === 'index.html' ? 0 : f.startsWith('destinations/') ? 1 : f.startsWith('blog') ? 2 : 3);
const entries = pages()
  .sort((a, b) => order(a) - order(b) || (a.endsWith('index.html') ? -1 : b.endsWith('index.html') ? 1 : a.localeCompare(b)))
  .map(f => `  <url>\n    <loc>${url(f)}</loc>\n    <lastmod>${lastmod(f)}</lastmod>\n    <priority>${priority(f)}</priority>\n  </url>`);

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`);
console.log(`sitemap.xml: ${entries.length} pages`);
