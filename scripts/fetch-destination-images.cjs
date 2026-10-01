// Download hero and food photos for the destination guides from Wikimedia Commons
// (replacing the retired S3 bucket) and save them as optimized WebP in
// images/destinations/, with attribution in images/destinations/credits.json.
//
// Only freely licensed files are used (CC0, CC BY, CC BY-SA, public domain), and
// curated categories are searched first: Featured pictures, then Quality images.
// Existing images are kept; delete a file (and its credits entry) to re-fetch it,
// or set ONLY=slug-kind[,slug-kind] to re-fetch specific ones.
// Run by .github/workflows/fetch-destination-images.yml (needs `sharp`).
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.join(__dirname, '..', 'images', 'destinations');
const CREDITS = path.join(OUT, 'credits.json');
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'LoveAndLayoversSite/1.0 (https://www.loveandlayover.in; theloveandlayover@gmail.com)';

// Search terms per image, best first
const WANT = {
  'singapore-hero': ['Marina Bay Sands skyline', 'Singapore skyline night', 'Gardens by the Bay'],
  'singapore-food': ['Hainanese chicken rice', 'Chicken rice', 'Laksa', 'Satay'],
  'japan-hero': ['Chureito Pagoda', 'Kiyomizu-dera', 'Fushimi Inari', 'Mount Fuji'],
  'thailand-hero': ['Wat Arun', 'Phi Phi islands', 'Bangkok temple'],
  'vietnam-hero': ['Ha Long Bay', 'Halong Bay', 'Hoi An'],
  'south-korea-hero': ['Gyeongbokgung', 'Seoul skyline', 'Bukchon Hanok Village'],
  'india-hero': ['Taj Mahal', 'Hawa Mahal', 'Jaipur'],
  'india-food': ['Thali', 'Indian cuisine', 'Masala dosa'],
  'indonesia-hero': ['Borobudur', 'Mount Bromo', 'Prambanan'],
  'indonesia-food': ['Nasi goreng', 'Rendang', 'Gado-gado'],
  'bali-hero': ['Tegallalang rice terrace', 'Pura Ulun Danu Bratan', 'Bali rice terraces'],
  'bali-food': ['Babi guling', 'Balinese cuisine', 'Nasi campur'],
  'turkey-hero': ['Göreme', 'Cappadocia', 'Hagia Sophia'],
  'turkey-food': ['Baklava', 'Turkish breakfast', 'Kebab'],
  'italy-hero': ['Colosseum Rome', 'Venice Grand Canal', 'Florence cathedral'],
  'italy-food': ['Pizza Margherita', 'Pizza', 'Spaghetti', 'Gelato'],
  'greece-hero': ['Oia Santorini', 'Acropolis of Athens', 'Santorini'],
  'greece-food': ['Greek salad', 'Souvlaki', 'Moussaka'],
  'france-hero': ['Eiffel Tower', 'Paris skyline', 'Mont Saint-Michel'],
  'france-food': ['Croissant', 'Macarons', 'Crêpe'],
  'spain-hero': ['Sagrada Familia', 'Alhambra', 'Plaza de España'],
  'spain-food': ['Paella', 'Tapas', 'Churros'],
  'portugal-hero': ['Lisbon tram', 'Porto Ribeira', 'Belém Tower'],
  'portugal-food': ['Pastel de nata', 'Pastéis de nata', 'Francesinha'],
  'germany-hero': ['Neuschwanstein Castle', 'Brandenburg Gate', 'Rothenburg ob der Tauber'],
  'germany-food': ['Bratwurst', 'Pretzel', 'Brezel'],
  'iceland-hero': ['Skógafoss', 'Seljalandsfoss', 'Kirkjufell'],
  'iceland-food': ['Skyr', 'Plokkfiskur', 'Icelandic lamb soup', 'Pylsur'],
  'mexico-hero': ['Chichen Itza', 'Teotihuacan', 'Mexico City Zocalo'],
  'mexico-food': ['Tacos al pastor', 'Tacos', 'Guacamole'],
  'peru-hero': ['Machu Picchu', 'Rainbow Mountain Peru', 'Cusco'],
  'peru-food': ['Ceviche', 'Peruvian cuisine', 'Lomo saltado'],
  'egypt-hero': ['Giza pyramids', 'Pyramids of Giza', 'Abu Simbel'],
  'egypt-food': ['Koshary', 'Egyptian cuisine', 'Ful medames'],
  'australia-hero': ['Sydney Opera House', 'Uluru', 'Twelve Apostles'],
  'australia-food': ['Pavlova dessert', 'Pavlova (food)', 'Meat pie', 'Lamington'],
};

const CATEGORIES = ['Featured_pictures_on_Wikimedia_Commons', 'Quality_images', null];
const FREE = /^(CC0( 1\.0)?|CC BY(-SA)?( \d\.\d)?( [a-z]{2,3})?|Public domain|PD\b.*)$/i;

// Titles that make poor hero/food shots
const SKIP = /interior|ceiling|nave|vault|inflating|aircraft|grumman|hawkeye|portrait|map\b|diagram|logo|stamp|coin/i;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const stripHtml = (s = '') => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Commons API ${res.status}`);
  return res.json();
}

async function search(term, category, kind) {
  // Match the file title, not just its description text
  const q = `intitle:"${term}"` + (category ? ` incategory:${category}` : '');
  const data = await api({
    action: 'query', generator: 'search', gsrnamespace: '6', gsrsearch: q, gsrlimit: '25',
    prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: kind === 'hero' ? '2000' : '1200',
  });
  const pages = Object.values((data.query && data.query.pages) || {}).sort((a, b) => a.index - b.index);
  for (const p of pages) {
    const ii = p.imageinfo && p.imageinfo[0];
    if (!ii || !/image\/(jpeg|png)/.test(ii.mime)) continue;
    if (SKIP.test(p.title)) continue;
    const meta = ii.extmetadata || {};
    const license = (meta.LicenseShortName && meta.LicenseShortName.value) || '';
    if (!FREE.test(license.trim()) || /NC|ND/.test(license)) continue;
    const ratio = ii.width / ii.height;
    if (kind === 'hero' && (ratio < 1.3 || ii.width < 1800)) continue;
    if (kind === 'food' && (ratio < 1.0 || ii.width < 900)) continue;
    return {
      title: p.title.replace(/^File:/, ''),
      thumb: ii.thumburl || ii.url,
      page: ii.descriptionurl,
      artist: stripHtml(meta.Artist && meta.Artist.value) || 'Unknown',
      license,
      licenseUrl: (meta.LicenseUrl && meta.LicenseUrl.value) || '',
      query: q,
    };
  }
  return null;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const credits = fs.existsSync(CREDITS) ? JSON.parse(fs.readFileSync(CREDITS, 'utf8')) : {};
  const only = process.env.ONLY ? process.env.ONLY.split(',').map(s => s.trim()) : null;
  const missing = [];

  for (const [key, terms] of Object.entries(WANT)) {
    const file = path.join(OUT, `${key}.webp`);
    if (only ? !only.includes(key) : fs.existsSync(file)) continue;
    const kind = key.endsWith('-hero') ? 'hero' : 'food';

    let pick = null;
    outer: for (const cat of CATEGORIES) {
      for (const term of terms) {
        pick = await search(term, cat, kind);
        await sleep(300);
        if (pick) break outer;
      }
    }
    if (!pick) { missing.push(key); console.log(`✗ ${key}: nothing suitable`); continue; }

    const res = await fetch(pick.thumb, { headers: { 'User-Agent': UA } });
    if (!res.ok) { missing.push(key); console.log(`✗ ${key}: download ${res.status}`); continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    await sharp(buf)
      .rotate()
      .resize({ width: kind === 'hero' ? 1800 : 1000, withoutEnlargement: true })
      .webp({ quality: kind === 'hero' ? 72 : 75 })
      .toFile(file);

    const { thumb, ...credit } = pick;
    credits[key] = credit;
    console.log(`✓ ${key}: ${pick.title} — ${pick.artist} (${pick.license})`);
    await sleep(500);
  }

  fs.writeFileSync(CREDITS, JSON.stringify(credits, null, 2) + '\n');
  if (missing.length) console.log(`Missing: ${missing.join(', ')}`);
}

main().catch(err => { console.error(err); process.exit(1); });
