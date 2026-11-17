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

// Region, flag, name and one-line description per guide (data/destinations.json).
// Text comes back HTML-escaped, ready to put in a page.
function destinations() {
  const h = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'destinations.json'), 'utf8')).destinations;
  const out = {};
  for (const [slug, x] of Object.entries(d)) out[slug] = { region: x.region, flag: x.flag, name: h(x.name), line: h(x.line) };
  return out;
}

function loadGuides() {
  const card = destinations();
  const traits = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'trip-finder.json'), 'utf8')).destinations;
  const dir = path.join(ROOT, 'data', 'guides');
  const order = ['asia', 'europe', 'americas', 'more'];
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => {
    const g = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const c = card[g.slug];
    if (!c) throw new Error(`${g.slug}: add an entry to data/destinations.json first`);
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


// Main city per guide for the live weather and exchange-rate box: [city, lat, lon, ISO currency]
// (no currency for India and Bhutan, whose ngultrum is pegged to the rupee)
const CITY = {
  malaysia: ['Kuala Lumpur', 3.139, 101.687, 'MYR'], singapore: ['Singapore', 1.352, 103.82, 'SGD'],
  azerbaijan: ['Baku', 40.409, 49.867, 'AZN'], bali: ['Denpasar', -8.65, 115.216, 'IDR'],
  bhutan: ['Thimphu', 27.472, 89.639, ''], cambodia: ['Siem Reap', 13.362, 103.86, 'USD'],
  dubai: ['Dubai', 25.205, 55.271, 'AED'], georgia: ['Tbilisi', 41.716, 44.783, 'GEL'],
  'hong-kong': ['Hong Kong', 22.319, 114.169, 'HKD'], india: ['New Delhi', 28.614, 77.209, ''],
  indonesia: ['Yogyakarta', -7.797, 110.37, 'IDR'], japan: ['Tokyo', 35.676, 139.65, 'JPY'],
  kazakhstan: ['Almaty', 43.238, 76.946, 'KZT'], macau: ['Macau', 22.199, 113.544, 'MOP'],
  maldives: ['Malé', 4.175, 73.509, 'USD'], nepal: ['Kathmandu', 27.717, 85.324, 'NPR'],
  oman: ['Muscat', 23.588, 58.383, 'OMR'], philippines: ['Manila', 14.599, 120.984, 'PHP'],
  qatar: ['Doha', 25.285, 51.531, 'QAR'], 'south-korea': ['Seoul', 37.567, 126.978, 'KRW'],
  'sri-lanka': ['Colombo', 6.927, 79.861, 'LKR'], taiwan: ['Taipei', 25.033, 121.565, 'TWD'],
  thailand: ['Bangkok', 13.756, 100.502, 'THB'], uzbekistan: ['Tashkent', 41.299, 69.24, 'UZS'],
  vietnam: ['Hanoi', 21.028, 105.834, 'VND'], france: ['Paris', 48.857, 2.352, 'EUR'],
  germany: ['Berlin', 52.52, 13.405, 'EUR'], greece: ['Athens', 37.984, 23.728, 'EUR'],
  iceland: ['Reykjavík', 64.147, -21.942, 'ISK'], italy: ['Rome', 41.903, 12.496, 'EUR'],
  portugal: ['Lisbon', 38.722, -9.139, 'EUR'], spain: ['Madrid', 40.417, -3.704, 'EUR'],
  mexico: ['Mexico City', 19.433, -99.133, 'MXN'], peru: ['Cusco', -13.532, -71.968, 'PEN'],
  australia: ['Sydney', -33.869, 151.209, 'AUD'], egypt: ['Cairo', 30.044, 31.236, 'EGP'],
  turkey: ['Istanbul', 41.008, 28.978, 'TRY'],
};

module.exports = { CITY, destinations, ROOT, INR, rupeeRange, rupees, fmt, monthsOf, loadGuides, VISA, REGION };
