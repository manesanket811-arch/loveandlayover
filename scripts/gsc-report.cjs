// Monthly Google Search Console report, run by the scheduled "Search Console monthly
// report" Claude task. Search data is private: this script never writes into the
// repository. It prints a Markdown report and saves the raw numbers to a temp file.
//
// Needs a Google service account with read access to the Search Console property:
//   GSC_SERVICE_ACCOUNT_JSON  the service account's JSON key (raw JSON or base64), set as
//                             an environment variable in the Claude cloud environment
//   GSC_SITE (optional)       property, e.g. sc-domain:loveandlayover.in (auto-detected)
// Usage: node scripts/gsc-report.cjs [output.json]   (default: <tmp>/gsc-report.json)
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const OUT = process.argv[2] || path.join(os.tmpdir(), 'gsc-report.json');
if (path.resolve(OUT).startsWith(path.resolve(__dirname, '..') + path.sep)) {
  console.error('Refusing to write Search Console data inside the repository (it is public).');
  process.exit(2);
}

function key() {
  let raw = process.env.GSC_SERVICE_ACCOUNT_JSON || '';
  if (!raw && process.env.GSC_KEY_FILE) raw = fs.readFileSync(process.env.GSC_KEY_FILE, 'utf8');
  if (!raw.trim()) return null;
  raw = raw.trim();
  if (!raw.startsWith('{')) raw = Buffer.from(raw, 'base64').toString('utf8');
  const k = JSON.parse(raw);
  if (!k.client_email || !k.private_key) throw new Error('GSC_SERVICE_ACCOUNT_JSON is not a service account key (missing client_email or private_key)');
  k.private_key = k.private_key.replace(/\\n/g, '\n');
  return k;
}

const b64url = (b) => Buffer.from(b).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
async function token(k) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({ iss: k.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const sig = b64url(crypto.createSign('RSA-SHA256').update(`${head}.${claims}`).sign(k.private_key));
  const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${claims}.${sig}` }) });
  const j = await res.json();
  if (!j.access_token) throw new Error(`Token request failed: ${JSON.stringify(j).slice(0, 200)}`);
  return j.access_token;
}

async function api(tok, url, body) {
  const res = await fetch(url, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const j = await res.json();
  if (!res.ok) throw new Error(`Search Console API ${res.status}: ${JSON.stringify(j.error || j).slice(0, 300)}`);
  return j;
}

const day = (d) => d.toISOString().slice(0, 10);
const pct = (x) => `${(x * 100).toFixed(1)}%`;
const n = (x) => Math.round(x).toLocaleString('en-US');
const delta = (a, b) => b ? `${a >= b ? '+' : ''}${(((a - b) / b) * 100).toFixed(0)}%` : 'new';
const shortUrl = (u) => u.replace(/^https?:\/\/(www\.)?loveandlayover\.in/, '') || '/';

(async () => {
  const k = key();
  if (!k) {
    console.log('SETUP NEEDED: GSC_SERVICE_ACCOUNT_JSON is not set in this environment. See the setup steps in scripts/gsc-report.cjs.');
    process.exit(3);
  }
  const tok = await token(k);
  let site = process.env.GSC_SITE;
  if (!site) {
    const sites = (await api(tok, 'https://www.googleapis.com/webmasters/v3/sites')).siteEntry || [];
    const mine = sites.filter(s => /loveandlayover\.in/.test(s.siteUrl) && s.permissionLevel !== 'siteUnverifiedUser');
    site = (mine.find(s => s.siteUrl.startsWith('sc-domain:')) || mine[0] || {}).siteUrl;
    if (!site) throw new Error(`The service account (${k.client_email}) has no access to a loveandlayover.in property. Add it as a user in Search Console → Settings → Users and permissions.`);
  }
  const q = (start, end, dimensions, rowLimit = 1000) => api(tok, `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, { startDate: day(start), endDate: day(end), dimensions, rowLimit, dataState: 'final' }).then(r => r.rows || []);

  // Last 28 days of final data (Search Console lags ~3 days) vs the 28 days before
  const end = new Date(Date.now() - 3 * 864e5), start = new Date(end - 27 * 864e5);
  const pEnd = new Date(start - 864e5), pStart = new Date(pEnd - 27 * 864e5);
  const [tot, ptot, queries, pqueries, pages, ppages, qp, countries, devices] = await Promise.all([
    q(start, end, []), q(pStart, pEnd, []), q(start, end, ['query']), q(pStart, pEnd, ['query']),
    q(start, end, ['page']), q(pStart, pEnd, ['page']), q(start, end, ['query', 'page'], 5000),
    q(start, end, ['country'], 10), q(start, end, ['device'], 5),
  ]);
  const T = tot[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 }, P = ptot[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const prevQ = new Map(pqueries.map(r => [r.keys[0], r])), prevP = new Map(ppages.map(r => [r.keys[0], r]));

  // Opportunities: many impressions, few clicks, ranking where a better title/content can win
  const opp = qp.filter(r => r.impressions >= 30 && r.ctr < 0.03 && r.position <= 25)
    .sort((a, b) => b.impressions - a.impressions).slice(0, 25);
  const byPage = {};
  for (const r of opp) (byPage[r.keys[1]] = byPage[r.keys[1]] || []).push(r);
  const rising = queries.filter(r => r.impressions >= 20).map(r => ({ r, prev: prevQ.get(r.keys[0]) })).filter(x => !x.prev || x.r.impressions > x.prev.impressions * 1.8).slice(0, 15);
  const falling = pages.map(r => ({ r, prev: prevP.get(r.keys[0]) })).filter(x => x.prev && x.prev.clicks >= 5 && x.r.clicks < x.prev.clicks * 0.6).slice(0, 10);

  const md = [
    `# Search Console report: ${day(start)} to ${day(end)}`,
    `Property: ${site}`, '',
    `| | Last 28 days | Previous 28 days | Change |`, `|---|---|---|---|`,
    `| Clicks | ${n(T.clicks)} | ${n(P.clicks)} | ${delta(T.clicks, P.clicks)} |`,
    `| Impressions | ${n(T.impressions)} | ${n(P.impressions)} | ${delta(T.impressions, P.impressions)} |`,
    `| CTR | ${pct(T.ctr)} | ${pct(P.ctr)} | |`,
    `| Avg position | ${T.position.toFixed(1)} | ${P.position.toFixed(1)} | |`, '',
    '## Top queries', '| Query | Clicks | Impr. | CTR | Pos. |', '|---|---|---|---|---|',
    ...queries.slice(0, 20).map(r => `| ${r.keys[0]} | ${r.clicks} | ${r.impressions} | ${pct(r.ctr)} | ${r.position.toFixed(1)} |`), '',
    '## Top pages', '| Page | Clicks | Impr. | CTR | Pos. | Clicks vs prev |', '|---|---|---|---|---|---|',
    ...pages.slice(0, 15).map(r => `| ${shortUrl(r.keys[0])} | ${r.clicks} | ${r.impressions} | ${pct(r.ctr)} | ${r.position.toFixed(1)} | ${delta(r.clicks, (prevP.get(r.keys[0]) || {}).clicks)} |`), '',
    '## Opportunities: high impressions, low clicks (by page)',
    ...Object.entries(byPage).flatMap(([pg, rows]) => [`### ${shortUrl(pg)}`, ...rows.map(r => `- "${r.keys[0]}": ${r.impressions} impressions, ${r.clicks} clicks, position ${r.position.toFixed(1)}`)]),
    '', '## Rising queries', ...rising.map(x => `- "${x.r.keys[0]}": ${x.r.impressions} impressions (was ${x.prev ? x.prev.impressions : 0})`),
    '', '## Pages losing clicks', ...(falling.length ? falling.map(x => `- ${shortUrl(x.r.keys[0])}: ${x.r.clicks} clicks (was ${x.prev.clicks})`) : ['- None']),
    '', '## Countries', ...countries.map(r => `- ${r.keys[0].toUpperCase()}: ${r.clicks} clicks, ${r.impressions} impressions`),
    '', '## Devices', ...devices.map(r => `- ${r.keys[0]}: ${r.clicks} clicks, ${r.impressions} impressions`),
  ].join('\n');

  fs.writeFileSync(OUT, JSON.stringify({ site, period: { start: day(start), end: day(end) }, totals: T, previous: P, queries, pages, opportunities: opp, rising: rising.map(x => x.r), countries, devices }, null, 2));
  console.log(md);
  console.error(`\nRaw data saved to ${OUT} (outside the repository).`);
})().catch(e => { console.error(`ERROR: ${e.message}`); process.exit(1); });
