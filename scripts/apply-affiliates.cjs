// Add (or refresh) the Klook "Tickets & tours" box in the blog posts listed in data/klook.json.
// Safe to re-run: the box sits between <!-- klook:start --> and <!-- klook:end --> markers
// and is replaced each time. Posts no longer listed (or an empty aid) get the box removed.
// Usage: node scripts/apply-affiliates.cjs
const fs = require('fs');
const path = require('path');
const { DATA, klookBox, klookHome } = require('./affiliates.cjs');

const BLOG = path.join(__dirname, '..', 'blog');
const MARKED = /\n?<!-- klook:start -->[\s\S]*?<!-- klook:end -->\n?/g;
// Where the box goes when a post doesn't say: before the FAQs, else the follow box,
// else the closing call-to-action, else the end of the article.
const ANCHORS = ['<h2 id="faq"', '<div class="post-follow">', '<div class="cta-box">', '</article>', '</main>'];

let added = 0, removed = 0;
for (const f of fs.readdirSync(BLOG).filter(f => f.endsWith('.html'))) {
  const file = path.join(BLOG, f);
  const before = fs.readFileSync(file, 'utf8');
  let html = before.replace(MARKED, '\n');
  const cfg = DATA.posts[f.replace(/\.html$/, '')];
  const box = cfg ? klookBox(cfg.items, { id: 'book-tickets' }) : '';
  if (box) {
    const anchor = [cfg.before, ...ANCHORS].find(a => a && html.includes(a));
    if (!anchor) throw new Error(`${f}: no place to put the Klook box`);
    const i = html.indexOf(anchor);
    html = html.slice(0, i) + `<!-- klook:start -->\n${box}\n<!-- klook:end -->\n` + html.slice(i);
    added++;
  } else if (html !== before) removed++;
  if (html !== before) fs.writeFileSync(file, html);
}
// Homepage: refresh the Klook section in place (it lives between the markers)
const INDEX = path.join(__dirname, '..', 'index.html');
const home = fs.readFileSync(INDEX, 'utf8');
const homeOut = home.replace(/<!-- klook:start -->[\s\S]*?<!-- klook:end -->/, () => `<!-- klook:start -->\n${klookHome()}\n<!-- klook:end -->`);
if (homeOut !== home) fs.writeFileSync(INDEX, homeOut);

// Other partners (data/partners.json): refresh every link marked data-partner="<key>"
const PARTNERS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'partners.json'), 'utf8'));
const ROOT = path.join(__dirname, '..');
const pages = ['links.html', 'index.html', 'about.html', ...fs.readdirSync(BLOG).map(f => 'blog/' + f)].filter(f => f.endsWith('.html'));
let partnerLinks = 0;
for (const f of pages) {
  const file = path.join(ROOT, f);
  const html = fs.readFileSync(file, 'utf8');
  const out = html.replace(/<a href="[^"]*"(\s+data-partner="([\w-]+)")/g, (m, attr, key) => {
    if (!PARTNERS[key] || key.startsWith('_')) return m;
    partnerLinks++;
    return `<a href="${PARTNERS[key]}"${attr}`;
  });
  if (out !== html) fs.writeFileSync(file, out);
}
console.log(`partner links: ${partnerLinks}`);
console.log(`klook boxes: ${added} posts${removed ? `, removed from ${removed}` : ''}`);
