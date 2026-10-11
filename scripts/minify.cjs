// Minify the site's stylesheets and scripts: src/css/*.css → css/*.css and
// src/js/*.js → js/*.js. Edit the files in src/, then run:
//   node scripts/minify.cjs        (needs esbuild: npm install --no-save esbuild)
// Run automatically by .github/workflows/minify.yml when src/ changes.
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const JOBS = [['src/css', 'css', '.css', 'css'], ['src/js', 'js', '.js', 'js']];

let before = 0, after = 0;
for (const [from, to, ext, loader] of JOBS) {
  fs.mkdirSync(path.join(ROOT, to), { recursive: true });
  for (const f of fs.readdirSync(path.join(ROOT, from)).filter(f => f.endsWith(ext))) {
    const source = fs.readFileSync(path.join(ROOT, from, f), 'utf8');
    const { code } = esbuild.transformSync(source, { loader, minify: true, legalComments: 'none', charset: 'utf8' });
    const banner = loader === 'css' ? `/* Minified from ${from}/${f}: edit that file, then run node scripts/minify.cjs */\n`
                                    : `/* Minified from ${from}/${f}: edit that file, then run node scripts/minify.cjs */\n`;
    fs.writeFileSync(path.join(ROOT, to, f), banner + code);
    before += Buffer.byteLength(source); after += Buffer.byteLength(banner + code);
  }
}
console.log(`minified: ${(before / 1024).toFixed(1)} KB → ${(after / 1024).toFixed(1)} KB`);
