# Destination guide data

Each `<slug>.json` file holds one country's guide. The pages in `destinations/<slug>.html`
are generated from these files, so edit the JSON here, not the HTML:

```
node scripts/build-guides.cjs            # rebuild every guide
node scripts/build-guides.cjs japan      # rebuild one
```

Main fields:

- `title`, `description`: search result title (≤ 60 chars) and description (≤ 155)
- `h1`, `country`, `badges` (`budget`, `best`, `visa`): shown in the header and "At a glance";
  the budget gets an approximate rupee figure from the rates in `scripts/build-guides.cjs`
- `sections`: in page order. `itineraries` has `days`, each with `periods` of `[label, html]`
  and a `cost`; other sections hold simple HTML (`p`, `ul`, `h3`, `strong`, `a`)
- `foodImage`: photo, alt text and caption for the food section
- `faq`: optional `[question, answer]` pairs; if empty, visa, budget and best-time FAQs are generated
- `filmed`: `true` only for countries we've actually filmed (changes the video buttons);
  `video` adds a specific YouTube video; `videoKeywords` match our videos for the "Watch" block
- `related`: four destination slugs; `readNext`: blog or guide paths

Photos come from `images/destinations/<slug>-hero.webp` and the food image; credits are read
from `images/destinations/credits.json`.
