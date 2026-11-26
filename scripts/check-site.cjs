// Site health check: broken internal links, missing anchors and images, partner links
// that stop working, and (with a browser) JavaScript errors and failed requests.
// Writes a Markdown report to site-health-report.md and exits 1 if anything is broken.
// Run weekly by .github/workflows/site-health.yml.
// Usage: node scripts/check-site.cjs            (static checks + partner links)
//        CHECK_BROWSER=1 node scripts/check-site.cjs   (also loads every page in Chromium)
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const SITE = 'www.loveandlayover.in';
const REDIRECT_PAGES = new Set(['itinerary-builder.html', 'faq.html', 'resources.html', 'newsletter.html', 'testimonials.html', 'googlea392d90b0eaf0e6a.html']);
const errors = [], warnings = [];

const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
for (const dir of ['destinations', 'blog', 'videos', 'singapore-events']) {
  if (fs.existsSync(path.join(ROOT, dir))) for (const f of fs.readdirSync(path.join(ROOT, dir))) if (f.endsWith('.html')) pages.push(`${dir}/${f}`);
}

const idCache = {};
const idsOf = (file) => idCache[file] || (idCache[file] = new Set([...fs.readFileSync(file, 'utf8').matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1])));
function resolve(from, ref) {
  let u = ref.replace(/^https?:\/\/(www\.)?loveandlayover\.in/, '');
  const hash = u.includes('#') ? decodeURIComponent(u.split('#')[1]) : '';
  u = u.split('#')[0].split('?')[0];
  if (!u) return { file: path.join(ROOT, from), hash };
  let p = u.startsWith('/') ? u : path.posix.join(path.posix.dirname('/' + from), u);
  p = decodeURIComponent(p);
  if (p.endsWith('/')) p += 'index.html';
  return { file: path.join(ROOT, p), hash };
}

// 1. Static checks: links, anchors, images
const external = new Map();
let linkCount = 0;
for (const page of pages) {
  if (REDIRECT_PAGES.has(page)) continue;
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8').replace(/<script\b[\s\S]*?<\/script>/gi, '');
  for (const m of html.matchAll(/\s(href|src)="([^"]+)"/g)) {
    const [, attr, ref] = m;
    if (/^(mailto:|tel:|data:|javascript:)/.test(ref) || ref.startsWith('#') && attr === 'href' && ref.length === 1) continue;
    if (/^https?:\/\//.test(ref) && !ref.includes(SITE)) {
      if (/klook\.com|wise\.com|whatsapp\.com\/channel|youtube\.com\/@|instagram\.com\/loveandlayover/.test(ref)) {
        if (!external.has(ref)) external.set(ref, page);
      }
      continue;
    }
    if (/^\/\//.test(ref)) continue;
    linkCount++;
    const { file, hash } = resolve(page, ref);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { errors.push(`Broken ${attr === 'src' ? 'image/file' : 'link'} \`${ref}\` on \`/${page}\``); continue; }
    if (hash && file.endsWith('.html') && !idsOf(file).has(hash) && !/^itinerary-\d+$/.test(hash)) errors.push(`Missing anchor \`${ref}\` on \`/${page}\``);
  }
}

async function checkExternal() {
  for (const [url, page] of external) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LoveAndLayoversLinkCheck/1.0)' } });
      clearTimeout(t);
      if (res.status === 404 || res.status === 410) errors.push(`Partner link returns ${res.status}: ${url} (on \`/${page}\`)`);
      else if (res.status >= 400 && ![403, 429, 999].includes(res.status)) warnings.push(`Partner link returned ${res.status}: ${url} (on \`/${page}\`)`);
    } catch (e) {
      warnings.push(`Couldn't reach ${url} (${e.name === 'AbortError' ? 'timeout' : e.message})`);
    }
  }
}

async function checkBrowser() {
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (e) { warnings.push('Browser check skipped: Playwright not installed'); return; }
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.xml': 'application/xml' };
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  }).listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  // Third-party requests (analytics, YouTube, weather/rates APIs) are blocked: we only test our own pages
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  for (const page of pages) {
    if (REDIRECT_PAGES.has(page)) continue;
    const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(`JavaScript error on \`/${page}\`: ${e.message.slice(0, 140)}`));
    p.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400) errors.push(`Failed request ${r.url().replace(base, '')} (${r.status()}) on \`/${page}\``); });
    try { await p.goto(base + '/' + page, { waitUntil: 'load', timeout: 30000 }); await p.waitForTimeout(250); }
    catch (e) { errors.push(`Page didn't load: \`/${page}\` (${e.message.slice(0, 80)})`); }
    await p.close();
  }
  await browser.close();
  server.close();
}

(async () => {
  await checkExternal();
  if (process.env.CHECK_BROWSER) await checkBrowser();
  const uniq = (a) => [...new Set(a)];
  const E = uniq(errors), W = uniq(warnings);
  const report = [
    `## Site health check: ${E.length ? `${E.length} problem${E.length === 1 ? '' : 's'} found` : 'all good'}`,
    '',
    `Checked ${pages.length} pages, ${linkCount} internal links and images, ${external.size} partner links${process.env.CHECK_BROWSER ? ', and loaded every page in a browser' : ''}.`,
    '',
    ...(E.length ? ['### Problems', ...E.slice(0, 100).map(e => `- ${e}`), E.length > 100 ? `- …and ${E.length - 100} more` : '', ''] : []),
    ...(W.length ? ['### Warnings (often temporary or bot-blocking)', ...W.slice(0, 30).map(w => `- ${w}`), ''] : []),
  ].filter(l => l !== undefined).join('\n');
  fs.writeFileSync(path.join(ROOT, 'site-health-report.md'), report + '\n');
  console.log(report);
  process.exit(E.length ? 1 : 0);
})();
