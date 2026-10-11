// Fill in empty alt="" on hand-written pages using scripts/image-alts.cjs; for video
// thumbnails and post images, use the title text that follows the image in its card.
// Idempotent. Usage: node scripts/fix-alts.cjs [files…]   (default: every page)
const fs = require('fs');
const path = require('path');
const { altFor } = require('./image-alts.cjs');

const ROOT = path.join(__dirname, '..');
const unescape = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function pages() {
  const list = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
  for (const dir of ['destinations', 'blog', 'videos']) {
    for (const f of fs.readdirSync(path.join(ROOT, dir))) if (f.endsWith('.html')) list.push(`${dir}/${f}`);
  }
  return list;
}

let total = 0;
const files = process.argv.slice(2).length ? process.argv.slice(2) : pages();
for (const file of files) {
  const full = path.join(ROOT, file);
  const html = fs.readFileSync(full, 'utf8');
  let count = 0;
  const out = html.replace(/<img\b[^>]*>/g, (tag, offset) => {
    if (!/\salt=""/.test(tag)) return tag;
    const src = (tag.match(/\ssrc="([^"]+)"/) || [])[1] || '';
    let alt = altFor(src);
    if (!alt) {
      // Title text in the same card: the next <h3>, <b> or <span> after the image
      const after = html.slice(offset + tag.length, offset + tag.length + 600);
      const m = after.match(/<(?:h3|b|span)\b[^>]*>([^<]{3,})</);
      if (m) alt = unescape(m[1]).trim();
    }
    if (!alt) return tag;
    count++;
    return tag.replace(/\salt=""/, ` alt="${attr(alt)}"`);
  });
  if (count) { fs.writeFileSync(full, out); total += count; }
}
console.log(`alt text added to ${total} images`);
