# Love and Layovers

Source of **[www.loveandlayover.in](https://www.loveandlayover.in)**, the travel and Singapore-life site by Sanket & Nikita: destination guides, blog posts, Singapore news, tools (trip finder, visa checker, salary calculator) and our YouTube videos.

It's a static site hosted on GitHub Pages. Most pages are generated from data files by small Node.js scripts, and GitHub Actions keep it up to date automatically.

## Repository layout

```
site/        Everything that is published (only this folder goes live)
  blog/          blog posts and news stories
  destinations/  destination guides
  videos/        a page per YouTube video
  singapore-events/  monthly events archive
  images/ assets/ public/ fonts/ css/ js/
  *.html, sitemap.xml, feed.xml, search-index.json, videos-data.json, CNAME …
data/        Content the pages are built from
  posts/         blog posts and news stories (one JSON file each)
  guides/        destination guides (one JSON file each)
  singapore-months/  events for each month
  blog.json, destinations.json, partners.json, klook.json, trip-finder.json
scripts/     Build, check and fetch scripts (Node.js; the main build needs no packages)
src/         Readable CSS and JavaScript (minified into site/css and site/js)
.github/workflows/  Automations (see below)
```

## Common tasks

| Task | Command |
|---|---|
| Rebuild every generated page | `node scripts/build-all.cjs` |
| Check links, images and anchors | `node scripts/check-site.cjs` |
| Preview locally | `cd site && python3 -m http.server 8765`, then open http://localhost:8765 |
| Minify CSS and JS after editing `src/` | `node scripts/minify.cjs` (needs `npm i esbuild`) |

To add or edit a blog post, change its file in `data/posts/` (not the HTML in `site/blog/`), then run `build-all`. Some older posts in `site/blog/` are hand-written HTML and are edited directly.

## Automations

| Workflow | When | What it does |
|---|---|---|
| Deploy site | every change to `main` | publishes `site/` to GitHub Pages |
| Rebuild site | changes to `data/` or `scripts/` | regenerates all pages |
| Update YouTube Videos | every 6 hours | fetches new videos and builds their pages |
| Minify CSS and JS | changes to `src/` | refreshes `site/css` and `site/js` |
| Monthly Singapore events page | daily | switches the "this month" page on the 1st |
| Site health check | Mondays | opens an issue if links, images or pages break |
| Fetch Destination Images | manual | downloads freely licensed photos from Wikimedia Commons |

## License

© 2026 Love and Layovers. All rights reserved. See [LICENSE](LICENSE) for details and third-party exceptions.
