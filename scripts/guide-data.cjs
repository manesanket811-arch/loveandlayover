// Shared destination data for the page builders: every guide in data/guides with its
// flag, region and one-line description (from the homepage cards), rupee budget,
// best months and visa type.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Rough rupee rates for the "≈ ₹" budget hints. Update now and then; shown as approximate.
const INR = { 'A$': 55, 'S$': 65, RM: 19.5, EUR: 95, '€': 95, IDR: 0.0053, EGP: 1.75, ISK: 0.62, '¥': 0.57, MXN: 4.5, PEN: 23, '₩': 0.062, '฿': 2.5, TRY: 2.1, '₫': 0.0034, LKR: 0.28, 'US$': 85, AED: 23, NPR: 0.625, 'HK$': 10.8, '₱': 1.5, AZN: 50, GEL: 31, KZT: 0.17, UZS: 0.0068, 'NT$': 2.7, QAR: 23, OMR: 220, MOP: 10.6, '₹': 1 };

// "S$95–150/day" -> [6200, 9800] in rupees (null if it can't be read)
function rupeeRange(budget = '') {
  const m = budget.match(/^\s*(A\$|S\$|US\$|HK\$|NT\$|NPR|₱|RM|EUR|€|IDR|EGP|ISK|¥|MXN|PEN|₩|฿|TRY|₫|LKR|AED|AZN|GEL|KZT|UZS|QAR|OMR|MOP|₹)?\s*([\d.,]+)\s*([kKmM])?\s*[–-]\s*([\d.,]+)\s*([kKmM])?/);
  if (!m) return null;
  const cur = m[1] || '₹';
  const num = (n, s) => parseFloat(n.replace(/,/g, '')) * (s ? (/k/i.test(s) ? 1e3 : 1e6) : 1);
  const lo = num(m[2], m[3] || m[5]), hi = num(m[4], m[5]);
  const r = (v) => { const x = v * INR[cur]; const step = x >= 10000 ? 500 : 100; return Math.round(x / step) * step; };
  return { cur, lo: r(lo), hi: r(hi) };
}
const fmt = (v) => '₹' + v.toLocaleString('en-IN');
// "≈ ₹6,200–9,800" for foreign-currency budgets, null for rupee ones
function rupees(budget) {
  const r = rupeeRange(budget);
  if (!r || r.cur === '₹') return null;
  return `≈ ${fmt(r.lo)}–${fmt(r.hi).slice(1)}`;
}

const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
// "Mar–May, Sep–Nov" -> [3,4,5,9,10,11]; text in brackets is ignored
function monthsOf(best = '') {
  const out = new Set();
  const text = best.replace(/\([^)]*\)/g, '').replace(/for .*/i, '');
  for (const part of text.split(',')) {
    const m = [...part.toLowerCase().matchAll(/jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/g)].map(x => MON.indexOf(x[0]) + 1);
    if (m.length === 1) out.add(m[0]);
    if (m.length >= 2) for (let i = m[0]; ; i = i % 12 + 1) { out.add(i); if (i === m[1]) break; }
  }
  return out.size ? [...out] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
}

const VISA = {
  free: { label: 'Visa-free', long: 'No visa needed in advance' },
  arrival: { label: 'Visa on arrival', long: 'Visa on arrival' },
  evisa: { label: 'e-Visa', long: 'Online e-visa before you fly' },
  visa: { label: 'Visa needed', long: 'Visa needed before you fly' },
};
const REGION = { asia: 'Asia', europe: 'Europe', americas: 'Americas', more: 'Africa & Oceania' };

function loadGuides() {
  const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const card = {};
  for (const m of home.matchAll(/<a class="dest" data-region="(\w+)" href="\/destinations\/([\w-]+)\.html"[^>]*>[\s\S]*?<img class="flag" src="([^"]+)"[\s\S]*?<h3>([^<]+)<\/h3><p>([^<]*)<\/p>/g)) {
    card[m[2]] = { region: m[1], flag: m[3], line: m[5] };
  }
  const traits = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'trip-finder.json'), 'utf8')).destinations;
  const dir = path.join(ROOT, 'data', 'guides');
  const order = ['asia', 'europe', 'americas', 'more'];
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => {
    const g = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const c = card[g.slug];
    if (!c) throw new Error(`${g.slug}: add a destination card to the homepage (index.html) first`);
    const it = (g.sections || []).find(s => s.id === 'itineraries') || {};
    const t = traits[g.slug] || {};
    return {
      g, slug: g.slug, name: g.country, ...c,
      thumb: `/images/destinations/thumbs/${g.slug}-hero.webp`,
      budget: g.badges.budget || '', inr: rupeeRange(g.badges.budget || ''),
      best: g.badges.best || 'Year-round', months: t.best || monthsOf(g.badges.best), avoid: t.avoid || [],
      visa: g.badges.visa || '', visaType: g.badges.visaType || 'visa',
      plans: it.plans || null, days: (it.days || []).length, filmed: !!g.filmed, line2: t.line || c.line,
    };
  }).sort((a, b) => order.indexOf(a.region) - order.indexOf(b.region) || (b.filmed - a.filmed) || a.name.localeCompare(b.name));
}

module.exports = { ROOT, INR, rupeeRange, rupees, fmt, monthsOf, loadGuides, VISA, REGION };
