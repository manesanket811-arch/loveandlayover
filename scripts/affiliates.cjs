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
const STYLE = `<style>.klook-box{margin:32px 0;padding:22px;border:1px solid #e8e2d9;border-radius:20px;background:#fffaf3}.klook-box h2{margin-top:0!important}.klook-note{font-size:.86rem;color:#5b6472;margin:4px 0 16px!important}.klook-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}.klook-item{display:flex;flex-direction:column;gap:6px;padding:16px;border-radius:14px;background:#fff;border:1px solid #e8e2d9;color:#0a1628!important;text-decoration:none!important;transition:transform .2s,box-shadow .2s}.klook-item:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(10,22,40,.1)}.klook-item b{font-size:1rem;font-weight:700;line-height:1.35}.klook-grid.n4{grid-template-columns:repeat(2,minmax(0,1fr))}@media (max-width:560px){.klook-grid.n4{grid-template-columns:minmax(0,1fr)}}.klook-item span{font-size:.88rem;font-weight:400;line-height:1.5;color:#5b6472}.klook-item em{margin-top:auto;padding-top:4px;font-style:normal;font-weight:700;font-size:.88rem;color:#b5561a}</style>`;

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

// Official Klook mark (via Simple Icons, sourced from Klook's newsroom)
const LOGO = '<svg class="klook-logo" viewBox="0 0 24 24" width="44" height="44" role="img" aria-label="Klook"><path fill="#FF5722" d="M4.8 0A4.79 4.79 0 0 0 0 4.8v14.4C0 21.86 2.14 24 4.8 24h14.4c2.66 0 4.8-2.14 4.8-4.8V4.8C24 2.14 21.86 0 19.2 0H4.8zM12 3.449v.001c4.242 0 7.833 1.904 7.833 6.17 0 2.932-3.86 7.815-6.164 10.164-.99 1.008-2.32 1.036-3.338 0-2.303-2.349-6.164-7.232-6.164-10.164 0-4.162 3.476-6.171 7.833-6.171zm3.54 2.155l-5.05 4.96 5.05 4.956a1.84 1.84 0 0 0 0-2.634v-.001l-2.366-2.323 2.366-2.323a1.84 1.84 0 0 0 0-2.635zm-7.349.144v9.772a1.86 1.86 0 0 0 1.868-1.852V7.602a1.86 1.86 0 0 0-1.866-1.854h-.002z"/></svg>';

// Homepage section: Klook logo, a short pitch, our top picks and a link to browse all of Klook
function klookHome() {
  const items = (DATA.home || []).map(k => [k, DATA.products[k]]).filter(([, p]) => p);
  if (!DATA.aid || !items.length) return '';
  return `<section class="section klook-home" id="book" aria-labelledby="bookTitle">
  <style>.kh-copy h2{font-size:clamp(1.9rem,3.6vw,2.6rem);font-weight:900;line-height:1.15;margin:0}.klook-home .kh-grid{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:40px;align-items:center}.kh-brand{display:flex;align-items:center;gap:12px;margin-bottom:14px}.kh-brand b{font-size:1.5rem;font-weight:800;letter-spacing:-.01em;color:#FF5722}.kh-brand span{font-size:.72rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#5b6472;border-left:1px solid #e8e2d9;padding-left:12px}.kh-copy p{margin:12px 0 0}.kh-cta{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}.kh-cta .btn-klook{background:#c9410f;color:#fff}.kh-cta .btn-klook:hover{background:#a93a0d}.kh-note{font-size:.8rem;color:#5b6472;margin-top:14px!important}.kh-picks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.kh-pick{display:flex;flex-direction:column;gap:4px;padding:16px 18px;border-radius:16px;background:#fff;border:1px solid #e8e2d9;color:#0a1628;text-decoration:none;transition:transform .2s,box-shadow .2s}.kh-pick:hover{transform:translateY(-3px);box-shadow:0 12px 26px rgba(10,22,40,.1)}.kh-pick small{font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#c9410f}.kh-pick b{font-size:.98rem;line-height:1.35}.kh-pick em{margin-top:auto;padding-top:6px;font-style:normal;font-weight:700;font-size:.84rem;color:#b5561a}@media (max-width:900px){.klook-home .kh-grid{grid-template-columns:minmax(0,1fr);gap:28px}}@media (max-width:480px){.kh-picks{grid-template-columns:minmax(0,1fr)}.kh-cta .btn{flex:1 1 100%;justify-content:center}}</style>
  <div class="wrap kh-grid">
    <div class="kh-copy reveal">
      <div class="kh-brand">${LOGO}<b>klook</b><span>How we book</span></div>
      <h2 id="bookTitle">Book your tickets &amp; tours the way we do.</h2>
      <p>Theme parks, attraction passes, day trips, airport transfers and cross-border buses: we book most of ours on Klook. Mobile tickets, quick confirmation and prices you can compare before you go.</p>
      <div class="kh-cta">
        <a class="btn btn-klook" href="${esc(klookUrl(DATA.homeLink || 'https://www.klook.com/'))}" target="_blank" rel="sponsored noopener" data-klook="homepage">Browse Klook <span aria-hidden="true">→</span></a>
        <a class="btn btn-ghost" href="/destinations/">Plan with our guides</a>
      </div>
      <p class="kh-note">Affiliate links: if you book through them we earn a small commission, at no extra cost to you.</p>
    </div>
    <div class="kh-picks reveal">
${items.map(([k, p]) => `      <a class="kh-pick" href="${esc(klookUrl(p.url))}" target="_blank" rel="sponsored noopener" data-klook="${esc(k)}"><small>${esc(PLACE[k.split('-')[0]] || 'Top pick')}</small><b>${esc(p.name)}</b><em>Check prices →</em></a>`).join('\n')}
    </div>
  </div>
</section>`;
}
const PLACE = { sg: 'Singapore', my: 'Malaysia', th: 'Thailand', jp: 'Japan', bali: 'Bali', id: 'Indonesia', vn: 'Vietnam', kr: 'South Korea', hk: 'Hong Kong', ae: 'Dubai', tr: 'Turkey', lk: 'Sri Lanka', ph: 'Philippines', kh: 'Cambodia', tw: 'Taiwan', qa: 'Qatar', ge: 'Georgia', mo: 'Macau' };

module.exports = { DATA, klookBox, klookHome, klookUrl };
