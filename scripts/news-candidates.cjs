// Daily news leads for the "Today's Singapore briefing": reads the public RSS feeds of
// Singapore news outlets, keeps stories from the last ~30 hours, and ranks them by how
// useful they are to Indians living in, moving to or visiting Singapore.
// Prints a Markdown list; writes nothing to the repo. Used by the daily news task, which
// then reads the articles and writes its own short summaries with source links.
// Usage: node scripts/news-candidates.cjs [hours=30]
const HOURS = +process.argv[2] || 30;
const FEEDS = [
  ['CNA', 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=10416'],
  ['The Straits Times', 'https://www.straitstimes.com/news/singapore/rss.xml'],
  ['Mothership', 'https://mothership.sg/feed/'],
  ['The Business Times', 'https://www.businesstimes.com.sg/rss/singapore'],
];

// Higher weight = more relevant to our readers. Matched case-insensitively against title + summary.
const GOOD = [
  [5, /\bindia|indian|deepavali|diwali|pongal|thaipusam|holi\b|little india/],
  [4, /\bvisa|work pass|employment pass|\bs pass|dependant|\bltvp|\bmom\b|manpower|\bica\b|immigration|passport|\bpr\b|permanent resident|citizenship|compass|one pass/],
  [3, /changi|airport|airline|flight|scoot|singapore airlines|indigo|air india|\bmrt\b|\blrt\b|\bbus\b|fare|rts link|johor|causeway|woodlands|tuas|malaysia/],
  [3, /\bcpf\b|\bgst\b|\bcoe\b|\bhdb\b|rent|salary|wage|jobs?\b|hiring|layoff|retrench|cost of living|budget 20|tax|levy|electricity|water price/],
  [2, /festival|concert|event|exhibition|attraction|opening|opens|reopen|closure|closing|sentosa|gardens by the bay|marina bay|zoo|museum|countdown|fireworks|light-up|holiday|long weekend/],
  [2, /\brules?\b|\bban\b|\bfine[sd]?\b|penalt|new law|regulation|e-scooter|smoking|vape|littering|weather|haze|heatwave|monsoon|dengue/],
];
const BAD = /\bcourt|jail|sentenc|charged|accused|murder|molest|remanded|trial|convicted|obituary|dies\b|died\b|stabb|assault|drug|etomidate|scam victim|sexual|voyeur|crash kills/;

const decode = (s = '') => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&#8217;|&rsquo;/g, '’')
  .replace(/&#8216;|&lsquo;/g, '‘').replace(/&#822[01];|&[lr]dquo;/g, '"').replace(/&#8211;|&ndash;/g, '–').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const tag = (xml, t) => { const m = xml.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return m ? decode(m[1]) : ''; };

// curl rather than fetch(): some outlets block Node's built-in client but allow curl.
const { execFile } = require('child_process');
const get = (url) => new Promise((ok, fail) => execFile('curl', ['-sSL', '--max-time', '20', '-A', 'Mozilla/5.0 (compatible; LoveAndLayoversNews/1.0)', '-w', '\n%{http_code}', url],
  { maxBuffer: 8e6 }, (err, out) => { if (err) return fail(err); const i = out.lastIndexOf('\n'); const code = out.slice(i + 1); code === '200' ? ok(out.slice(0, i)) : fail(new Error(`HTTP ${code}`)); }));

async function feed(name, url) {
  try {
    const xml = await get(url);
    return [...xml.matchAll(/<item\b[\s\S]*?<\/item>/g)].map(([it]) => ({
      source: name, title: tag(it, 'title'), link: tag(it, 'link'), date: new Date(tag(it, 'pubDate') || tag(it, 'dc:date')),
      summary: tag(it, 'description').slice(0, 300),
    }));
  } catch (e) { console.error(`! ${name}: ${e.message.split('\n')[0]}`); return []; }
}

(async () => {
  const cutoff = Date.now() - HOURS * 36e5;
  const all = (await Promise.all(FEEDS.map(([n, u]) => feed(n, u)))).flat()
    .filter(s => s.title && s.link && !(s.date < cutoff));
  const seen = new Set();
  const ranked = all.map(s => {
    const text = `${s.title} ${s.summary}`.toLowerCase();
    const score = GOOD.reduce((t, [w, re]) => t + (re.test(text) ? w : 0), 0) - (BAD.test(text) ? 6 : 0);
    return { ...s, score };
  }).filter(s => {
    const k = s.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').slice(0, 7).join(' ');
    if (seen.has(k)) return false; seen.add(k); return true;
  }).sort((a, b) => b.score - a.score || b.date - a.date);

  const sgt = (d) => isNaN(d) ? '' : new Date(d.getTime() + 8 * 36e5).toISOString().slice(5, 16).replace('T', ' ');
  console.log(`# News leads: last ${HOURS} hours (${all.length} stories from ${FEEDS.length} feeds, best first)\n`);
  for (const s of ranked.slice(0, 30)) {
    console.log(`- [${s.score}] ${s.title} (${s.source}, ${sgt(s.date)} SGT)\n  ${s.link}${s.summary ? `\n  ${s.summary.slice(0, 200)}` : ''}`);
  }
})();
