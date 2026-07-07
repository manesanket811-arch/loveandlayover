# SEO Implementation Brief — loveandlayover.in

You are working on the static site for **loveandlayover.in** (a travel site: homepage, ~16 destination guides under `/destinations/`, a videos page, a blog, an FAQ page, and an itinerary builder). Implement the tasks below. **Do not guess file paths or structure — first explore the repo, list the actual HTML files, and read the `<head>` of `index.html` and one destination page (`destinations/singapore.html`) so your changes match the real markup and existing JS.**

Work through all tasks, then give me a summary of exactly which files you changed and what you added.

---

## Task 1 — Create robots.txt and sitemap.xml

**robots.txt** (site root). If one already exists, update it — don't duplicate:

```
User-agent: *
Allow: /

Sitemap: https://www.loveandlayover.in/sitemap.xml
```

**sitemap.xml** (site root): generate a valid XML sitemap listing **every** indexable page. Discover them by scanning the repo for `.html` files (homepage, all destination pages, blog posts, videos page, FAQ, about/contact). Exclude utility pages (404, thank-you). Use this format for each entry and set `<lastmod>` to the file's actual last-modified date:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.loveandlayover.in/</loc>
    <lastmod>2026-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- ...one <url> block per page... -->
</urlset>
```

Give destination guides `priority` 0.8, blog posts 0.7, everything else 0.5. **Important:** if the site is built/deployed by a script, wire the sitemap into that build so it regenerates — otherwise note in your summary that it must be updated manually when pages are added.

---

## Task 2 — Fix the homepage social preview image

`index.html` currently uses a placeholder for `og:image` and `twitter:image` (something like `placeholder.com/1200x630`). Replace **both** with a real absolute URL to a 1200×630 branded image.

- First check `/assets` (or wherever images live) for an existing branded/hero image at or near 1200×630 and use that.
- If none exists, use the site's main hero image as an interim and **flag in your summary that I need to supply a proper 1200×630 OG image.**
- Make sure the URL is absolute (`https://www.loveandlayover.in/...`), not relative.
- While you're in the head, confirm these exist on the homepage and every page, and add any that are missing: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `twitter:card` (`summary_large_image`), a self-referencing `<link rel="canonical">`, and `<meta name="robots" content="index,follow">`.

---

## Task 3 — Add site-wide Organization + WebSite schema

Add this JSON-LD to the `<head>` of `index.html`. Replace the social URLs with the real ones (ask me if unsure — do NOT invent handles):

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Love and Layovers",
  "url": "https://www.loveandlayover.in/",
  "logo": "https://www.loveandlayover.in/assets/logo.png",
  "sameAs": [
    "https://www.youtube.com/@REPLACE_WITH_REAL_CHANNEL",
    "https://www.instagram.com/REPLACE_WITH_REAL_HANDLE"
  ]
}
</script>
```

Only add a `WebSite` + `SearchAction` block **if the site actually has a working search page**. If it doesn't, skip it and note that in your summary.

---

## Task 4 — Add schema to every destination guide

For each page under `/destinations/`, add two JSON-LD blocks to the `<head>`. Pull the real values (headline, description, image, city name, URL) from each page — don't hardcode Singapore's values across all of them.

**A) BreadcrumbList:**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type":"ListItem","position":1,"name":"Home","item":"https://www.loveandlayover.in/"},
    {"@type":"ListItem","position":2,"name":"Destinations","item":"https://www.loveandlayover.in/destinations/"},
    {"@type":"ListItem","position":3,"name":"CITY_NAME","item":"PAGE_URL"}
  ]
}
</script>
```

**B) Article:**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "PAGE_TITLE",
  "description": "PAGE_META_DESCRIPTION",
  "image": "PAGE_OG_IMAGE_ABSOLUTE_URL",
  "author": {"@type":"Organization","name":"Love and Layovers"},
  "publisher": {
    "@type":"Organization",
    "name":"Love and Layovers",
    "logo":{"@type":"ImageObject","url":"https://www.loveandlayover.in/assets/logo.png"}
  },
  "datePublished":"YYYY-MM-DD",
  "dateModified":"YYYY-MM-DD"
}
```

Use the page's actual publish date; if unknown, use the file's last-modified date for both.

---

## Task 5 — Add FAQPage schema (FAQ page + any guide with an FAQ section)

For the FAQ page, and for any destination guide that has a visible Q&A section (the Singapore page has visa/best-time-to-visit style Q&As), add `FAQPage` schema.

**Critical rule:** the question and answer text in the schema must match the visible on-page text **word for word**. Do not add questions that aren't shown on the page — Google penalizes mismatched FAQ markup. Build the JSON-LD by reading the actual on-page Q&A content.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "EXACT question text from the page",
      "acceptedAnswer": {"@type": "Answer", "text": "EXACT answer text from the page"}
    }
  ]
}
</script>
```

---

## Task 6 — Add VideoObject schema to the videos page

The videos page builds cards dynamically in JS from the YouTube API. In that **same JS**, for each video also inject a `VideoObject` JSON-LD `<script>` into the page (build the object from the data you already have, then `document.head.appendChild` it). Don't hardcode a static list — generate it from the API response so it stays in sync.

```js
// for each video object you already build:
const ld = document.createElement('script');
ld.type = 'application/ld+json';
ld.textContent = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": video.title,
  "description": video.description || video.title,
  "thumbnailUrl": `https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`,
  "uploadDate": video.publishedAt,            // ISO 8601, e.g. 2026-07-06
  "contentUrl": `https://www.youtube.com/watch?v=${video.id}`,
  "embedUrl": `https://www.youtube.com/embed/${video.id}`
});
document.head.appendChild(ld);
```

If `publishedAt` isn't available from the current API call, fetch it or note in your summary that it needs to be added (uploadDate is required for VideoObject rich results).

---

## Task 7 — Light internal linking on destination pages

On each destination guide, add a small "Related destinations" section near the bottom that links to 3–4 other destination guides by real URL. This is for crawlability and relevance — keep it simple, reuse the site's existing card/link styling, and only link to pages that actually exist.

---

## Verification before you finish

1. Validate every JSON-LD block is syntactically correct (parse it) — one broken block can invalidate the page's structured data.
2. Confirm `sitemap.xml` returns valid XML and every `<loc>` is a real, reachable page.
3. Confirm no `og:image`/`twitter:image` placeholder URLs remain anywhere.
4. Confirm you did NOT invent any social URLs, dates, or FAQ questions — flag anything you had to leave as a placeholder for me to fill in.
5. Give me: the list of files changed, what was added to each, and a short list of anything I need to provide (real OG image, social handle URLs, search page confirmation).

**Do not** touch the video thumbnail CSS/aspect-ratio logic — that's already fixed. **Do not** change page copy or content. Additive, non-destructive changes only.