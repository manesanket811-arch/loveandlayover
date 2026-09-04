// Build Love & Layovers logo assets.
// Renders wordmark text to SVG paths with opentype.js (so no font deps at render time),
// composes logo SVGs, and exports PNGs with sharp.
const opentype = require('opentype.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const REPO = 'C:/Users/T0282643/Repositories/website';
const OUT = path.join(REPO, 'public/images/brand');
fs.mkdirSync(OUT, { recursive: true });

const NAVY = '#0a1628';
const ORANGE = '#d4691d';
const ORANGE_LIGHT = '#e07c2e';
const CREAM = '#fefaf5';

// ---------- The mark: heart drawn as a dashed flight path, plane completing it ----------
// Heart path in a 100x100 box, drawn as one open stroke starting at bottom tip,
// going up the LEFT lobe, over, down the right side... leaving a gap near the
// right lobe where the plane "flies in" to complete it.
const HEART_STROKE = `M50 88
  C 22 66, 8 48, 8 32
  C 8 18, 19 10, 30 10
  C 40 10, 47 17, 50 24
  C 53 17, 60 10, 70 10
  C 81 10, 92 18, 92 32
  C 92 40, 88 48, 80 57`;

// Small plane at the gap end of the flight path, nose pointing along the path
// direction (roughly toward 50 88, i.e. down-left).
function planeGroup(x, y, rotate, scale, fill) {
  // Material "flight" icon, 24x24, nose pointing up; centered on origin.
  return `<g transform="translate(${x} ${y}) rotate(${rotate}) scale(${scale}) translate(-12 -12)">
    <path d="M21,16v-2l-8-5V3.5C13,2.67,12.33,2,11.5,2S10,2.67,10,3.5V9l-8,5v2l8-2.5V19l-2,1.5V22l3.5-1L15,22v-1.5L13,19v-5.5L21,16z" fill="${fill}"/>
  </g>`;
}

function markSvg({ stroke = NAVY, plane = ORANGE, strokeWidth = 5.5, dash = '0.1 10', size = 100 } = {}) {
  return `<g>
  <path d="${HEART_STROKE}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}"
        stroke-linecap="round" stroke-dasharray="${dash}"/>
  ${planeGroup(73, 67, 224, 1.35, plane)}
</g>`;
}

// ---------- Wordmark: "Love & Layovers" in Fraunces, & in orange ----------
const fraunces = opentype.parse(new Uint8Array(fs.readFileSync(path.join(REPO, 'fonts/fraunces-600.ttf'))).buffer);

function pathData(p) {
  const r = v => Math.round(v * 100) / 100;
  return p.commands.map(c => {
    switch (c.type) {
      case 'M': return 'M' + r(c.x) + ' ' + r(c.y);
      case 'L': return 'L' + r(c.x) + ' ' + r(c.y);
      case 'C': return 'C' + r(c.x1) + ' ' + r(c.y1) + ' ' + r(c.x2) + ' ' + r(c.y2) + ' ' + r(c.x) + ' ' + r(c.y);
      case 'Q': return 'Q' + r(c.x1) + ' ' + r(c.y1) + ' ' + r(c.x) + ' ' + r(c.y);
      case 'Z': return 'Z';
    }
  }).join('');
}
function textPath(text, x, y, fontSize, fill) {
  const p = fraunces.getPath(text, x, y, fontSize);
  return `<path d="${pathData(p)}" fill="${fill}"/>`;
}
function textWidth(text, fontSize) {
  return fraunces.getAdvanceWidth(text, fontSize);
}

// ---------- Compose: horizontal lockup (mark + wordmark) ----------
function horizontalLogo({ fg = NAVY, accent = ORANGE, bg = null } = {}) {
  const FS = 64;
  const sp = textWidth('N N', 1) - textWidth('NN', 1); // space advance per unit
  const w1 = textWidth('Love', FS) + sp * FS, wa = textWidth('&', FS), w2 = sp * FS + textWidth('Layovers', FS);
  const markW = 110, gap = 26, padX = 30, padY = 28;
  const textY = 96; // baseline
  const totalW = padX + markW + gap + w1 + wa + w2 + padX;
  const totalH = 150;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(totalW)} ${totalH}" width="${Math.ceil(totalW)}" height="${totalH}">`;
  if (bg) svg += `<rect width="100%" height="100%" fill="${bg}" rx="0"/>`;
  svg += `<g transform="translate(${padX} ${padY}) scale(1.0)">${markSvg({ stroke: fg, plane: accent })}</g>`;
  let tx = padX + markW + gap;
  svg += textPath('Love', tx, textY, FS, fg);
  svg += textPath('&', tx + w1, textY, FS, accent);
  svg += textPath('Layovers', tx + w1 + wa + sp * FS, textY, FS, fg);
  svg += `</svg>`;
  return svg;
}

// ---------- Compose: stacked lockup (mark above wordmark) — good for square uses ----------
function stackedLogo({ fg = NAVY, accent = ORANGE, bg = null, tagline = true } = {}) {
  const FS = 44;
  const sp = textWidth('N N', 1) - textWidth('NN', 1); // space advance per unit
  const w1 = textWidth('Love', FS) + sp * FS, wa = textWidth('&', FS), w2 = sp * FS + textWidth('Layovers', FS);
  const textW = w1 + wa + w2;
  const W = 480, H = tagline ? 360 : 330;
  const markScale = 1.5, markW = 100 * markScale;
  const markX = (W - markW) / 2, markY = 24;
  const textX = (W - textW) / 2, textY = 232;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
  if (bg) svg += `<rect width="100%" height="100%" fill="${bg}"/>`;
  svg += `<g transform="translate(${markX} ${markY}) scale(${markScale})">${markSvg({ stroke: fg, plane: accent, strokeWidth: 5 })}</g>`;
  svg += textPath('Love', textX, textY, FS, fg);
  svg += textPath('&', textX + w1, textY, FS, accent);
  svg += textPath('Layovers', textX + w1 + wa + sp * FS, textY, FS, fg);
  if (tagline) {
    const TFS = 19;
    const opts = { kerning: true, letterSpacing: 0.24 };
    const wA = fraunces.getAdvanceWidth('TRAVEL', TFS, opts);
    const wB = fraunces.getAdvanceWidth('TOGETHER', TFS, opts);
    const dotGap = 22;
    const tagW = wA + dotGap * 2 + wB;
    const x0 = (W - tagW) / 2, ty = 287;
    const pA = fraunces.getPath('TRAVEL', x0, ty, TFS, opts);
    const pB = fraunces.getPath('TOGETHER', x0 + wA + dotGap * 2, ty, TFS, opts);
    svg += `<path d="${pathData(pA)}" fill="${accent}"/>`;
    svg += `<circle cx="${x0 + wA + dotGap}" cy="${ty - TFS * 0.32}" r="2.6" fill="${accent}"/>`;
    svg += `<path d="${pathData(pB)}" fill="${accent}"/>`;
  }
  svg += `</svg>`;
  return svg;
}

// ---------- Favicon / avatar: mark centered on cream rounded square ----------
function iconSvg({ bg = CREAM, fg = NAVY, accent = ORANGE, rounded = true } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <rect width="256" height="256" fill="${bg}" ${rounded ? 'rx="56"' : ''}/>
  <g transform="translate(38 40) scale(1.8)">${markSvg({ stroke: fg, plane: accent, strokeWidth: 6.5, dash: '0.1 10' })}</g>
</svg>`;
}

// Dark variant icon (navy bg, cream heart, orange plane) — for YouTube avatar pop
function iconDark() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <linearGradient id="bgg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#12213d"/>
      <stop offset="1" stop-color="#0a1628"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" fill="url(#bgg)" rx="56"/>
  <g transform="translate(38 40) scale(1.8)">${markSvg({ stroke: CREAM, plane: ORANGE_LIGHT, strokeWidth: 6.5, dash: '0.1 10' })}</g>
</svg>`;
}

// ---------- Write SVGs ----------
const files = {
  'logo-horizontal.svg': horizontalLogo(),
  'logo-horizontal-dark.svg': horizontalLogo({ fg: CREAM, accent: ORANGE_LIGHT, bg: NAVY }),
  'logo-stacked.svg': stackedLogo(),
  'logo-mark.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${markSvg()}</svg>`,
  'icon.svg': iconSvg(),
  'icon-dark.svg': iconDark(),
};
for (const [name, svg] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, name), svg);
  console.log('wrote', name);
}

// favicon at site root (fixes the /favicon.svg 404)
fs.writeFileSync(path.join(REPO, 'favicon.svg'), iconSvg());
console.log('wrote favicon.svg (root)');

// ---------- PNG exports ----------
(async () => {
  const jobs = [
    ['icon.svg', 'logo-512.png', 512],
    ['icon.svg', 'logo-192.png', 192],
    ['icon-dark.svg', 'youtube-avatar-800.png', 800],
    ['logo-horizontal.svg', 'logo-horizontal.png', 1200],
    ['logo-stacked.svg', 'logo-stacked.png', 960],
  ];
  for (const [src, dst, width] of jobs) {
    await sharp(Buffer.from(files[src]), { density: 300 })
      .resize({ width })
      .png()
      .toFile(path.join(OUT, dst));
    console.log('rendered', dst);
  }
  // apple-touch-icon: no transparency issues, solid bg, 180px
  await sharp(Buffer.from(iconSvg({ rounded: false })), { density: 300 })
    .resize({ width: 180 })
    .png()
    .toFile(path.join(REPO, 'apple-touch-icon.png'));
  console.log('rendered apple-touch-icon.png (root)');
})();
