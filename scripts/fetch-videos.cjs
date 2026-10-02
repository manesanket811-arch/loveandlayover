// Refresh videos-data.json from the channel's YouTube RSS feed.
// The feed only carries the latest 15 uploads, so new entries are merged into
// the existing file (keyed by video id) to keep the full history on the site.
// Run by .github/workflows/update-videos.yml; FEED_FILE=<path> reads a local
// feed instead of fetching it (for testing).
const https = require('https');
const fs = require('fs');
const path = require('path');

const CHANNEL_ID = 'UCUABrODa0CNF5zgkesAlYeA';
// The channel feed sometimes returns 404 for hours at a time; the channel's
// uploads playlist (UC… → UU…) carries the same entries and is tried next.
const FEED_URLS = [
  `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,
  `https://www.youtube.com/feeds/videos.xml?playlist_id=UU${CHANNEL_ID.slice(2)}`,
];
const UA = 'Mozilla/5.0 (compatible; LoveAndLayoversBot/1.0; +https://www.loveandlayover.in)';
const DATA_FILE = path.join(__dirname, '..', 'videos-data.json');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

// /shorts/<id> answers 200 for a Short and redirects to /watch for a regular video.
async function checkIsShort(id) {
  try {
    const { status } = await get(`https://www.youtube.com/shorts/${id}`);
    if (status === 200) return true;
    if (status >= 300 && status < 400) return false;
  } catch (e) {
    // fall through to the title heuristic
  }
  return null;
}

function decodeEntities(str) {
  return str
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function tag(entry, name) {
  const m = entry.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decodeEntities(m[1].trim()) : '';
}

function determineSeries(title) {
  const t = title.toLowerCase();
  if (t.includes('guide')) return 'Destination Guide';
  if (t.includes('food')) return 'Food Tour';
  if (t.includes('short')) return 'Travel Shorts';
  if (t.includes('vlog')) return 'Travel Vlog';
  if (t.includes('itinerary')) return 'Itinerary';
  if (t.includes('day')) return 'Day Trip';
  if (t.includes('budget')) return 'Budget Travel';
  if (t.includes('adventure')) return 'Adventure';
  if (t.includes('culture') || t.includes('local')) return 'Local Culture';
  return 'Travel';
}

function extractKeywords(title) {
  const travelKeywords = [
    'travel', 'guide', 'vlog', 'trip', 'adventure', 'destination', 'explore',
    'journey', 'vacation', 'tourism', 'tour', 'backpacking', 'wanderlust',
    'itinerary', 'shorts', 'moments', 'tips', 'food', 'culture', 'experience'
  ];
  const t = title.toLowerCase();
  const keywords = t.split(/[\s\-,:()#|<>/]+/)
    .filter(word => word.length > 3)
    .filter(word => travelKeywords.some(kw => word.includes(kw) || kw.includes(word)));
  if (t.includes('food')) keywords.push('food tour', 'culinary');
  if (t.includes('budget')) keywords.push('budget travel');
  if (t.includes('day')) keywords.push('itinerary');
  if (t.includes('guide')) keywords.push('travel guide');
  return [...new Set([...keywords, 'adventure'])].slice(0, 6);
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Try each feed URL a few times with backoff; null if YouTube never answers.
async function fetchFeed() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    for (const url of FEED_URLS) {
      try {
        const { status, body } = await get(url);
        if (status === 200 && body.includes('<feed')) return body;
        console.log(`Attempt ${attempt}: HTTP ${status} from ${url}`);
      } catch (e) {
        console.log(`Attempt ${attempt}: ${e.message} from ${url}`);
      }
    }
    if (attempt < 3) await sleep(attempt * 15000);
  }
  return null;
}

async function main() {
  const xml = process.env.FEED_FILE ? fs.readFileSync(process.env.FEED_FILE, 'utf8') : await fetchFeed();
  if (!xml) {
    // A YouTube outage shouldn't fail the run: keep the current videos and let
    // the next scheduled run pick up anything new.
    console.log('::warning::YouTube feed unavailable; keeping existing videos-data.json');
    return;
  }

  const existing = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) : [];
  const byId = new Map(existing.map(v => [v.id, v]));

  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => m[1]);
  let fresh = 0;
  for (const entry of entries) {
    const id = tag(entry, 'yt:videoId');
    if (!id) continue;
    const title = tag(entry, 'title') || 'Untitled video';
    const series = determineSeries(title);

    let isShort = await checkIsShort(id);
    if (isShort === null) isShort = byId.has(id) ? byId.get(id).duration === '< 1 min' : /#?shorts?\b/i.test(title);

    if (!byId.has(id)) fresh++;
    byId.set(id, {
      id,
      title,
      category: 'Travel',
      type: series,
      published: tag(entry, 'published') || new Date().toISOString(),
      description: tag(entry, 'media:description').substring(0, 150),
      fullDescription: tag(entry, 'media:description'),
      duration: isShort ? '< 1 min' : '5-15 min',
      keywords: extractKeywords(title),
      series
    });
  }

  if (entries.length === 0) {
    console.log('No entries in feed, keeping existing data');
    return;
  }

  const videos = [...byId.values()].sort((a, b) => b.published.localeCompare(a.published));
  fs.writeFileSync(DATA_FILE, JSON.stringify(videos, null, 2) + '\n');
  console.log(`Feed had ${entries.length} entries (${fresh} new); videos-data.json now holds ${videos.length} videos`);
}

main().catch(err => {
  console.error('Error updating videos:', err);
  process.exit(1);
});
