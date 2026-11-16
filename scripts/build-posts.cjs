// Build blog posts (blog/<slug>.html) from data/posts/<slug>.json, in the same design
// as the rest of the blog: photo header, contents list, FAQs, related posts.
// Usage: node scripts/build-posts.cjs [slug…]   then: node scripts/apply-affiliates.cjs
// (apply-affiliates adds the Klook box for posts listed in data/klook.json).
//
// Post fields: slug, title (≤ 60 chars), description (≤ 155), h1, h1Html (optional, may
// hold <em>), crumb, dek, read (minutes), hero (key in images/destinations/credits.json),
// videoKeywords, about (schema.org things), related (3 post slugs), published, modified,
// body (HTML: p, h2, h3, ul, table in .table-wrap, .tip, .note, .place, .cost-cards),
// faq ([question, answer] pairs, optional).
const fs = require('fs');
const path = require('path');
const { header, footer, HEAD_LINKS, SCRIPT, GA, FONTS } = require('./site-chrome.cjs');
const { altFor } = require('./image-alts.cjs');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.loveandlayover.in';
const DATA = path.join(ROOT, 'data', 'posts');
const credits = JSON.parse(fs.readFileSync(path.join(ROOT, 'images', 'destinations', 'credits.json'), 'utf8'));

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unesc = (s = '') => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
const strip = (h = '') => unesc(h.replace(/<[^>]+>/g, '')).trim();
const slugify = (t) => strip(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const ld = (o) => `<script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n</script>`;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const posts = {};
for (const f of fs.readdirSync(DATA).filter(f => f.endsWith('.json'))) {
  const p = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
  posts[p.slug] = p;
}

// Card image and title for "Keep planning": posts built here use their own data,
// other pages are read from the blog listing.
const blog = fs.readFileSync(path.join(ROOT, 'blog.html'), 'utf8');
const LISTED = {};
for (const m of blog.matchAll(/<a class="post" href="\/blog\/([\w-]+)\.html"[^>]*>\s*<div class="post-img"><img src="([^"]+)"[\s\S]*?<h3>([^<]+)<\/h3>/g)) LISTED[m[1]] = { img: m[2], title: unesc(m[3]) };
function card(slug) {
  const p = posts[slug];
  let c = p ? { img: `/images/destinations/thumbs/${p.hero}.webp`, title: p.h1 } : LISTED[slug];
  if (!c && fs.existsSync(path.join(ROOT, 'blog', `${slug}.html`))) {
    // Not in the listing grid (e.g. the featured post): read the page itself
    const html = fs.readFileSync(path.join(ROOT, 'blog', `${slug}.html`), 'utf8');
    const pre = (html.match(/<link rel="preload" as="image" href="([^"]+)"/) || [])[1];
    const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
    if (pre && h1) c = { img: pre.replace('/images/destinations/', '/images/destinations/thumbs/'), title: strip(h1) };
  }
  if (!c) throw new Error(`related post "${slug}" not found`);
  const img = fs.existsSync(path.join(ROOT, c.img)) ? c.img : c.img.replace('/thumbs/', '/');
  return `<a class="post" href="/blog/${slug}.html"><div class="post-img"><img src="${img}" alt="${esc(altFor(img))}" loading="lazy" width="640" height="400"></div><div class="post-body"><h3>${esc(c.title)}</h3></div></a>`;
}

function build(p) {
  for (const k of ['slug', 'title', 'description', 'h1', 'dek', 'hero', 'body', 'related', 'published']) if (!p[k]) throw new Error(`${p.slug || '?'}: missing ${k}`);
  if (p.title.length > 60) throw new Error(`${p.slug}: title is ${p.title.length} chars (max 60)`);
  if (p.description.length > 155) throw new Error(`${p.slug}: description is ${p.description.length} chars (max 155)`);
  const c = credits[p.hero];
  if (!c) throw new Error(`${p.slug}: no photo credit for ${p.hero}`);

  const url = `${SITE}/blog/${p.slug}.html`;
  const img = `/images/destinations/${p.hero}.webp`;
  const ogFile = `/images/og/blog-${p.slug}.jpg`;
  const og = SITE + (fs.existsSync(path.join(ROOT, ogFile)) ? ogFile : img);
  const modified = p.modified || p.published;
  const [y, mo] = modified.split('-');
  const faq = p.faq || [];

  // ids on headings and the contents list
  const toc = [];
  const seen = new Set();
  const body = p.body.trim().replace(/<h2>([\s\S]*?)<\/h2>/g, (m, t) => {
    let id = slugify(t); while (seen.has(id)) id += '-2'; seen.add(id);
    toc.push([id, strip(t)]);
    return `<h2 id="${id}">${t}</h2>`;
  });
  if (faq.length) toc.push(['faq', 'FAQs']);

  const posting = {
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.h1, description: p.description, image: og,
    datePublished: p.published, dateModified: modified,
    author: [{ '@type': 'Person', '@id': `${SITE}/#sanket`, name: 'Sanket Mane' }, { '@type': 'Person', '@id': `${SITE}/#nikita`, name: 'Nikita' }],
    publisher: { '@type': 'Organization', '@id': `${SITE}/#organization`, name: 'Love and Layovers', logo: { '@type': 'ImageObject', url: `${SITE}/public/images/brand/logo-512.png` } },
    mainEntityOfPage: url, inLanguage: 'en', ...(p.about ? { about: p.about } : {}),
  };
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog.html` },
    { '@type': 'ListItem', position: 3, name: p.h1, item: url }] };
  const faqLd = faq.length ? ld({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: strip(a) } })) }) + '\n' : '';

  const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="Love and Layovers">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="article:published_time" content="${p.published}">
<meta property="article:modified_time" content="${modified}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.title)}">
<meta name="twitter:description" content="${esc(p.description)}">
<meta name="twitter:image" content="${og}">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" as="image" href="${img}" type="image/webp">
${FONTS}
${ld(posting)}
${faqLd}${ld(crumbs)}
${GA}
<link rel="stylesheet" href="/css/site.css?v=1">
<link rel="stylesheet" href="/css/article.css?v=2">
<style>
  .posts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .posts .post { display: flex; flex-direction: column; background: #fff; border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; transition: transform .25s ease, box-shadow .25s ease; }
  .posts .post:hover { transform: translateY(-4px); box-shadow: var(--shadow); }
  .posts .post-img { aspect-ratio: 16 / 10; overflow: hidden; background: var(--sand); }
  .posts .post-img img { width: 100%; height: 100%; object-fit: cover; }
  .posts .post-body { padding: 16px 18px 18px; }
  .posts .post-body h3 { font-family: var(--sans); font-size: 1.02rem; font-weight: 700; line-height: 1.35; }
  @media (max-width: 860px) { .posts { grid-template-columns: 1fr; } }
</style>
${HEAD_LINKS}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>

${header('blog')}

<main id="main">
<section class="post-hero" style="background-image: url('${img}')">
  <div class="wrap">
    <nav class="post-crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/blog.html">Blog</a> › ${esc(p.crumb || p.h1)}</nav>
    <h1>${p.h1Html || esc(p.h1)}</h1>
    <p class="dek">${p.dek}</p>
    <div class="post-meta-row"><span>${p.read || 5} min read</span><span>Updated ${MONTHS[+mo - 1]} ${y}</span><span>By Sanket &amp; Nikita, living in Singapore</span></div>
  </div>
  <span class="post-photo-credit">Photo: <a href="${esc(c.page)}" rel="noopener" target="_blank">${esc(String(c.artist).slice(0, 40))}</a>, ${esc(c.license)}</span>
</section>

<div class="wrap post-layout">
  <article class="post-body">
${body}
${faq.length ? `
<h2 id="faq">FAQs</h2>
<div class="post-faq">
${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${a}</p></details>`).join('\n')}
</div>
` : ''}
<aside class="ll-video" data-keywords="${esc(p.videoKeywords || '')}" aria-label="Related video"></aside>

<div class="post-follow">
  <h2>Follow our life in Singapore</h2>
  <p>We live here and film it every day: new food finds, guides and our daily vlog series.</p>
  <div class="row">
    <a class="btn btn-yt" href="https://www.youtube.com/@LoveAndLayover?sub_confirmation=1" target="_blank" rel="noopener"><span aria-hidden="true">▶</span> Subscribe on YouTube</a>
    <a class="btn btn-ig" href="https://www.instagram.com/loveandlayover" target="_blank" rel="noopener">Follow on Instagram</a>
  </div>
</div>
<p class="updated">Prices and opening details change often. Figures here are approximate as of ${MONTHS[+mo - 1]} ${y}, so please check official websites before you book.</p>
  </article>
  <aside class="toc" aria-label="On this page">
    <h2>On this page</h2>
    <ol>${toc.map(([id, t]) => `<li><a href="#${id}">${esc(t)}</a></li>`).join('')}</ol>
  </aside>
</div>

<section class="related">
  <div class="wrap">
    <h2>Keep planning</h2>
    <div class="posts">${p.related.map(card).join('')}</div>
  </div>
</section>
</main>

${footer()}

${SCRIPT}
<script src="/js/related-video.js" defer></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, 'blog', `${p.slug}.html`), page);
}

const only = process.argv.slice(2);
const list = Object.values(posts).filter(p => !only.length || only.includes(p.slug));
list.forEach(build);
console.log(`Built ${list.length} blog posts from data/posts`);
