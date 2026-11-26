// Rebuild every generated part of the site, in dependency order. Safe to run any time:
// running it twice in a row changes nothing. Used by .github/workflows/rebuild-site.yml
// (on every push that touches data or scripts) and by the scheduled Claude tasks.
// Usage: node scripts/build-all.cjs
const { execFileSync } = require('child_process');
const path = require('path');

const STEPS = [
  'build-visa-free-post',  // data/posts/visa-free-countries-for-indians.json from the guides
  'build-posts',           // blog/*.html from data/posts
  'apply-affiliates',      // Klook boxes, partner links, WhatsApp Channel buttons
  'build-news',            // singapore-news.html + homepage news strip
  'build-salary-calc',     // singapore-salary-calculator.html
  'build-month-events',    // singapore-this-month.html + singapore-events/*
  'build-redirects',       // forwarding pages for retired URLs
  'apply-site-chrome',     // shared header/footer on hand-written pages
  'build-guides',          // destinations/<slug>.html
  'build-destinations',    // destinations/index.html, visa-checker.html, homepage month picks
  'build-trip-finder',     // trip-finder.html
  'build-photo-credits',   // credits.html
  'fix-alts',              // alt text on images
  'build-video-pages',     // videos/*.html (after fix-alts, as in update-videos.yml)
  'build-blog',            // blog.html
  'build-sitemap',         // sitemap.xml
  'build-search-index',    // search-index.json
];

for (const step of STEPS) {
  const out = execFileSync(process.execPath, [path.join(__dirname, `${step}.cjs`)], { encoding: 'utf8' }).trim().split('\n').pop();
  console.log(`✓ ${step.padEnd(22)} ${out}`);
}
