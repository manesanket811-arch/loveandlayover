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

// ---------- fallback: read the channel pages when the feed is down ----------
const PAGE_HEADERS = { 'Accept-Language': 'en-US,en;q=0.9', Cookie: 'CONSENT=YES+1; SOCS=CAI' };

function getPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', ...PAGE_HEADERS } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(getPage(new URL(res.headers.location, url).href));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

// Pull the JSON object assigned after `marker` out of a page's inline script.
function extractJson(html, marker) {
  const at = html.indexOf(marker);
  if (at === -1) return null;
  const start = html.indexOf('{', at);
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) {
      try { return JSON.parse(html.slice(start, i + 1)); } catch (e) { return null; }
    }
  }
  return null;
}

// Videos in page order (newest first) from the channel's Videos or Shorts tab,
// with whatever the tab shows: title, "3 days ago" and a description snippet.
async function channelTab(tab) {
  const { status, body } = await getPage(`https://www.youtube.com/channel/${CHANNEL_ID}/${tab}`);
  if (status !== 200) { console.log(`Channel ${tab} page: HTTP ${status}`); return []; }
  const data = extractJson(body, 'ytInitialData');
  if (!data) { console.log(`Channel ${tab} page: no ytInitialData`); return []; }
  const items = [];
  const seen = new Set();
  const text = (t) => t && (t.simpleText || t.content || (t.runs || []).map(r => r.text).join('')) || '';
  (function walk(o) {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) { o.forEach(walk); return; }
    let item = null;
    if (o.videoRenderer) {
      const v = o.videoRenderer;
      item = { id: v.videoId, title: text(v.title), ago: text(v.publishedTimeText), snippet: text(v.descriptionSnippet) };
    } else if (o.reelItemRenderer) {
      const v = o.reelItemRenderer;
      item = { id: v.videoId, title: text(v.headline) };
    } else if (o.shortsLockupViewModel) {
      const v = o.shortsLockupViewModel;
      const ep = v.onTap && v.onTap.innertubeCommand && v.onTap.innertubeCommand.reelWatchEndpoint;
      item = { id: ep && ep.videoId, title: text(v.overlayMetadata && v.overlayMetadata.primaryText) };
    } else if (o.lockupViewModel) {
      const v = o.lockupViewModel;
      const md = v.metadata && v.metadata.lockupMetadataViewModel;
      const rows = JSON.stringify((md && md.metadata) || {});
      const ago = (rows.match(/"content":"([^"]*\bago)"/) || [])[1] || '';
      item = { id: v.contentId, title: text(md && md.title), ago };
    }
    if (item) {
      if (item.id && /^[\w-]{11}$/.test(item.id) && !seen.has(item.id)) { seen.add(item.id); items.push(item); }
      return;
    }
    Object.values(o).forEach(walk);
  })(data);
  return items;
}

// "3 days ago" → an approximate ISO date (now when the tab shows no date)
function fromAgo(ago) {
  const m = (ago || '').match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/);
  const ms = { second: 1e3, minute: 6e4, hour: 36e5, day: 864e5, week: 6048e5, month: 2592e6, year: 31536e6 };
  return new Date(Date.now() - (m ? Number(m[1]) * ms[m[2]] : 0)).toISOString();
}

// Title, exact date and full description from a video's watch page.
async function watchDetails(id) {
  const { status, body } = await getPage(`https://www.youtube.com/watch?v=${id}`);
  if (status !== 200) return { why: `HTTP ${status}` };
  const pr = extractJson(body, 'ytInitialPlayerResponse');
  if (!pr) return { why: 'no player data' };
  const vd = pr.videoDetails;
  const ps = pr.playabilityStatus || {};
  if (!vd) return { why: `no videoDetails (${ps.status || '?'}: ${ps.reason || ''})` };
  if (vd.channelId !== CHANNEL_ID) return { why: `other channel ${vd.channelId}` };
  const mf = (pr.microformat && pr.microformat.playerMicroformatRenderer) || {};
  const date = mf.publishDate || mf.uploadDate;
  return {
    id,
    title: vd.title,
    published: date ? new Date(date).toISOString() : null,
    description: vd.shortDescription || '',
  };
}

// Only what's listed above the newest video we already have is new.
function newOnes(items, known) {
  const firstKnown = items.findIndex(it => known.has(it.id));
  return firstKnown === -1 ? items.slice(0, 5) : items.slice(0, firstKnown);
}

async function scrapeChannel(known) {
  const longs = await channelTab('videos');
  const shorts = await channelTab('shorts');
  console.log(`Channel pages list ${longs.length} videos and ${shorts.length} Shorts`);
  const fresh = [
    ...newOnes(longs, known).map(it => ({ ...it, isShort: false })),
    ...newOnes(shorts, known).map(it => ({ ...it, isShort: true })),
  ];
  const out = [];
  for (const it of fresh) {
    const d = await watchDetails(it.id).catch(e => ({ why: e.message }));
    if (d.why) console.log(`${it.id}: watch page unusable (${d.why}); using the channel listing`);
    const title = (!d.why && d.title) || it.title;
    if (!title) { console.log(`Skipped ${it.id}: no title`); continue; }
    out.push({
      id: it.id,
      title,
      published: (!d.why && d.published) || fromAgo(it.ago),
      description: (!d.why && d.description) || it.snippet || '',
      isShort: it.isShort,
    });
    await sleep(500);
  }
  return { listed: longs.length + shorts.length, entries: out };
}

async function main() {
  const existing = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) : [];
  const byId = new Map(existing.map(v => [v.id, v]));

  // Normalise both sources to { id, title, published, description, isShort? }
  let entries;
  const xml = process.env.FEED_FILE ? fs.readFileSync(process.env.FEED_FILE, 'utf8') : await fetchFeed();
  if (xml) {
    entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => m[1]).map(e => ({
      id: tag(e, 'yt:videoId'),
      title: tag(e, 'title'),
      published: tag(e, 'published'),
      description: tag(e, 'media:description'),
    })).filter(e => e.id);
    if (!entries.length) { console.log('No entries in feed, keeping existing data'); return; }
  } else {
    console.log('Feed unavailable; reading the channel pages instead');
    const scraped = await scrapeChannel(byId).catch(err => { console.log(`Channel pages failed: ${err.message}`); return null; });
    if (!scraped || !scraped.listed) {
      // A YouTube outage shouldn't fail the run: keep the current videos and let
      // the next scheduled run pick up anything new.
      console.log('::warning::YouTube feed and channel pages unavailable; keeping existing videos-data.json');
      return;
    }
    entries = scraped.entries;
  }

  let fresh = 0;
  for (const e of entries) {
    const id = e.id;
    const title = e.title || 'Untitled video';
    const series = determineSeries(title);

    let isShort = e.isShort != null ? e.isShort : await checkIsShort(id);
    if (isShort === null) isShort = byId.has(id) ? byId.get(id).duration === '< 1 min' : /#?shorts?\b/i.test(title);

    if (!byId.has(id)) fresh++;
    byId.set(id, {
      id,
      title,
      category: 'Travel',
      type: series,
      published: e.published || new Date().toISOString(),
      description: e.description.substring(0, 150),
      fullDescription: e.description,
      duration: isShort ? '< 1 min' : '5-15 min',
      keywords: extractKeywords(title),
      series
    });
  }

  const videos = [...byId.values()].sort((a, b) => b.published.localeCompare(a.published));
  fs.writeFileSync(DATA_FILE, JSON.stringify(videos, null, 2) + '\n');
  console.log(`${xml ? 'Feed' : 'Channel pages'} gave ${entries.length} entries (${fresh} new); videos-data.json now holds ${videos.length} videos`);
}

main().catch(err => {
  console.error('Error updating videos:', err);
  process.exit(1);
});
