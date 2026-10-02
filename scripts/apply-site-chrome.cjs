// Put the shared site header/footer (scripts/site-chrome.cjs) on hand-written pages.
// Replaces each page's <header>…</header> and <footer>…</footer>, links
// css/chrome.css (and css/refresh.css on older-style pages), and swaps the old
// nav-toggle.js for js/site.js. Idempotent — safe to re-run after editing the chrome.
// Usage: node scripts/apply-site-chrome.cjs [files…]   (default: all hand-written pages)
const fs = require('fs');
const path = require('path');
const { header, footer, HEAD_LINKS, SCRIPT } = require('./site-chrome.cjs');

const ROOT = path.join(__dirname, '..');
const REFRESH = '<link rel="stylesheet" href="/css/refresh.css?v=5">';
// Pages already built on css/site.css don't need the refresh layer
const MODERN = new Set(['index.html', 'about.html', 'videos.html', 'blog.html', 'work-with-us.html', 'singapore-trip-cost-calculator.html']);

function defaultFiles() {
  const list = ['index.html', 'about.html', 'videos.html', 'blog.html', 'work-with-us.html', '404.html', 'singapore-trip-cost-calculator.html'];
  for (const dir of ['destinations', 'blog']) {
    for (const f of fs.readdirSync(path.join(ROOT, dir))) if (f.endsWith('.html')) list.push(`${dir}/${f}`);
  }
  return list;
}

function section(file) {
  if (file.startsWith('destinations/')) return 'destinations';
  if (file.startsWith('blog')) return 'blog';
  if (file.startsWith('videos')) return 'videos';
  if (file === 'about.html') return 'about';
  if (file === 'work-with-us.html') return 'work';
  return '';
}

function apply(file) {
  const full = path.join(ROOT, file);
  const raw = fs.readFileSync(full);
  const bom = raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf;
  let s = raw.toString('utf8').replace(/^﻿/, '');
  const before = s;

  s = s.replace(/<header\b[^>]*>[\s\S]*?<\/header>/, header(section(file)));
  if (/<footer\b/.test(s)) s = s.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/, footer());
  else s = s.replace(/<\/main>/, `</main>\n\n${footer()}`);

  const links = (MODERN.has(file) || s.includes('/css/site.css')) ? HEAD_LINKS : `${HEAD_LINKS}\n${REFRESH}`;
  if (!s.includes('/css/chrome.css')) s = s.replace(/<\/head>/, `${links}\n</head>`);

  s = s.replace(/<script src="\/js\/nav-toggle\.js"[^>]*><\/script>\n?/g, '');
  s = s.replace(/<script src="\/js\/datadog\.js" defer><\/script>\n?/g, '');
  s = s.replace(/<script src="\/js\/site\.js(\?v=\d+)?"><\/script>/, SCRIPT);
  if (!s.includes('/js/site.js')) s = s.replace(/<\/body>/, `${SCRIPT}\n</body>`);

  if (s !== before) {
    fs.writeFileSync(full, (bom ? '﻿' : '') + s);
    return true;
  }
  return false;
}

const files = process.argv.slice(2).length ? process.argv.slice(2) : defaultFiles();
let changed = 0;
for (const f of files) if (apply(f)) changed++;
console.log(`site chrome applied: ${changed}/${files.length} pages changed`);
