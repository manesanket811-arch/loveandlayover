// Klook affiliate boxes ("Tickets & tours we'd book"), built from data/klook.json.
// Used by build-guides.cjs (destination guides) and apply-affiliates.cjs (blog posts).
const fs = require('fs');
const path = require('path');

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'klook.json'), 'utf8'));
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function klookUrl(url) {
  const u = new URL(url);
  u.searchParams.set('aid', DATA.aid);
  return u.toString();
}

// Self-contained styles so the box looks the same on every page template
const STYLE = `<style>.klook-box{margin:32px 0;padding:22px;border:1px solid #e8e2d9;border-radius:20px;background:#fffaf3}.klook-box h2{margin-top:0!important}.klook-note{font-size:.86rem;color:#5b6472;margin:4px 0 16px!important}.klook-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}.klook-item{display:flex;flex-direction:column;gap:6px;padding:16px;border-radius:14px;background:#fff;border:1px solid #e8e2d9;color:#0a1628!important;text-decoration:none!important;transition:transform .2s,box-shadow .2s}.klook-item:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(10,22,40,.1)}.klook-item b{font-size:1rem;font-weight:700;line-height:1.35}.klook-grid.n4{grid-template-columns:repeat(2,minmax(0,1fr))}@media (max-width:560px){.klook-grid.n4{grid-template-columns:minmax(0,1fr)}}.klook-item span{font-size:.88rem;font-weight:400;line-height:1.5;color:#5b6472}.klook-item em{margin-top:auto;padding-top:4px;font-style:normal;font-weight:700;font-size:.88rem;color:#d4691d}</style>`;

// Returns '' when there is no affiliate ID or no products, so nothing renders
function klookBox(keys, { id = 'book', heading = 'Tickets & tours we’d book' } = {}) {
  const items = (keys || []).map(k => [k, DATA.products[k]]).filter(([, p]) => p);
  if (!DATA.aid || !items.length) return '';
  return `${STYLE}
<section class="klook-box" aria-labelledby="${id}">
  <h2 id="${id}">${esc(heading)}</h2>
  <p class="klook-note">These are Klook affiliate links: if you book through them we earn a small commission, at no extra cost to you. It helps keep these guides free.</p>
  <div class="klook-grid${items.length === 4 ? ' n4' : ''}">
${items.map(([k, p]) => `    <a class="klook-item" href="${esc(klookUrl(p.url))}" target="_blank" rel="sponsored noopener" data-klook="${esc(k)}"><b>${esc(p.name)}</b><span>${esc(p.blurb)}</span><em>Check prices on Klook →</em></a>`).join('\n')}
  </div>
</section>`;
}

module.exports = { DATA, klookBox, klookUrl };
