# Love and Layovers — Implementation Spec for Claude Code
**Re-verified against live site:** July 3, 2026. All issues below are confirmed present in production.
**Stack assumption:** static HTML site deployed to S3 bucket `loveandlayover-website-604218333793` (us-east-1), domain `www.loveandlayover.in`.

> **How to use this file:** Work through tasks in order (P0 → P1 → P2). Each task lists affected files, the exact offending strings (greppable), and the required change. Run the Verification section at the end before deploying, then follow the Deployment checklist — the previous round of edits never appeared on the live site, so deployment/cache invalidation must be part of the definition of done.

---

## IMPORTANT GLOBAL RULES FOR ALL EDITS

1. **Never invent facts.** Where this spec says `[VERIFY]`, check the official source listed before writing a number. If it can't be verified, write "Check [official source link] for current pricing" instead of a number.
2. **Every visa section** must end with: a link to the official immigration authority + a line `Last verified: July 2026` (update the date to the actual verification date).
3. **Currency discipline:** each destination page uses its local currency only (optionally with ≈INR in parentheses). No ₹ in Mexico, no € in Bali/Peru/Iceland, no $ in Japan prose except explicit conversions.
4. **The true destination count is 16 live guides** (or 18 if Task P0-1 builds Malaysia + Sri Lanka). Replace every instance of "54", "19", and "15+" with the real count — including `<title>`, meta descriptions, OG tags, and body copy.
5. All pages must share ONE header component and ONE footer component (Task P1-1).

---

# P0 — CRITICAL (dangerous, broken, or trust-destroying)

## P0-1 · Fix the three dead destination guides (404s)
**Broken URLs linked from `/destinations/` and homepage:**
- `/destinations/indonesia.html` → 404
- `/destinations/malaysia.html` → 404
- `/destinations/srilanka.html` → 404

**Action (choose per page):**
- **Malaysia & Sri Lanka:** build these guides using the existing destination template (high value for the Indian audience). Follow Global Rules; visas: Malaysia currently offers Indian nationals visa-free entry (30 days, MDAC arrival card required) `[VERIFY: imi.gov.my]`; Sri Lanka offers free ETA/visa for Indians under its current scheme `[VERIFY: eta.gov.lk]`.
- **Indonesia:** the site already has a Bali guide. Remove the separate Indonesia card from `/destinations/` and homepage, OR redirect `indonesia.html` → `bali.html`.
- Update destination counts everywhere after this decision (Global Rule 4).
- Remove "Malaysia" from the homepage contact-form dropdown if the guide isn't built; add all live destinations to that dropdown either way.

## P0-2 · Iceland: wrong driving side (SAFETY)
**File:** `destinations/iceland.html`
- FIND: `Drive on LEFT side` → REPLACE with: `Drive on the RIGHT side of the road. Headlights must be on at all times, year-round.`
- Also in this file (hallucinated Icelandic — replace all):
  - `Rugnúbaugur` → `Rúgbrauð (dark rye bread)`
  - `Yfirlit` (listed as fish soup) → `Plokkfiskur (fish stew)` or `fiskisúpa (fish soup)`
  - `Kambar` (listed as scallops) → `Hörpuskel (scallops)`
  - `FlixBus` → `Strætó public buses and airport coaches (Flybus)` (FlixBus does not operate in Iceland)
  - `Air Iceland Express` → `Icelandair (domestic routes)`
  - `Bláfell` (ski season) → `Bláfjöll`
- Remove all `€` and `$` prices; use ISK with ≈ conversions `[VERIFY current ISK rates]`.

## P0-3 · Visa corrections (wrong for the site's own Indian audience)
Apply to BOTH the destination guide and the matching FAQ tab (`faq.html`). Every corrected block needs the official link + "Last verified" line (Global Rule 2).

| File(s) | FIND (current claim) | REPLACE WITH (verified reality) | Official source |
|---|---|---|---|
| `destinations/japan.html`, `faq.html` | `90-day tourist visa exemption` / `Indians get visa-free entry - just present a valid passport` | Indian passport holders REQUIRE a visa for Japan. eVisa available for tourism (single entry, up to 90 days); apply ~2–4 weeks ahead. `[VERIFY: mofa.go.jp / Japan eVisa portal]` | mofa.go.jp |
| `destinations/mexico.html`, `faq.html` | `180 days visa-free on arrival ... including Indians` / `No visa pre-application needed` | Indian passport holders REQUIRE a Mexican visitor visa — unless holding a valid US visa or permanent residency of US/Canada/UK/Japan/Schengen, which permits visa-free entry. `[VERIFY: consulmex / INM]` | gob.mx/inm |
| `destinations/australia.html`, `faq.html` | `eVisa (ETA)` / `ETA required, AUD 20` | Indian passports are NOT eligible for the ETA (subclass 601). Apply for a Visitor visa (subclass 600) online via ImmiAccount; fee from AUD 200 `[VERIFY: immi.homeaffairs.gov.au]`; allow several weeks. | immi.homeaffairs.gov.au |
| `destinations/vietnam.html` | `VND 25,000-35,000 (about USD 1-1.50)` | Vietnam e-visa: USD 25, valid 90 days, single or multiple entry, apply at evisa.gov.vn (official site only). | evisa.gov.vn |
| `blog/vietnam-travel-guide.html`, `faq.html` | `Visa on arrival` framing / `US citizens get 90-day visa on arrival` | All nationalities including Indians and US citizens use the 90-day e-visa; there is no walk-up visa on arrival without pre-approval. | evisa.gov.vn |
| `destinations/italy.html` | `Schengen visa for stays over 90 days` | Indian nationals need a Schengen (Type C) visa for ANY tourist visit; 90 days is the maximum stay per 180-day period, not a visa-free allowance. | vfsglobal / schengen info |
| `destinations/peru.html`, hub card | `Tourist card, no visa` | Indians are visa-exempt in Peru ONLY if holding a valid visa or residence of US/UK/Canada/Australia/Schengen; otherwise a consular visa is required. `[VERIFY: gob.pe / Peruvian consulate]` | gob.pe |
| `faq.html` (Turkey) | `e-Visa ... (3 minutes, ~$20) ... No pre-approval needed` | Turkey e-Visa for Indians is conditional (requires valid visa/residence from Schengen/US/UK/Ireland, or use of the sticker-visa route). State the conditions. `[VERIFY: evisa.gov.tr]` | evisa.gov.tr |
| `faq.html` (Egypt) | `Visa on arrival at airport (recommended) ... Easy process - no pre-approval needed` | Egypt visa-on-arrival is NOT generally available to Indian passports without conditions; Indians should apply for the consular visa or check current e-visa eligibility. `[VERIFY: visa2egypt.gov.eg]` | visa2egypt.gov.eg |
| `destinations/singapore.html`, `faq.html`, `blog/singapore-layover-guide.html` | `Indians: 30-day visa-free entry on arrival` | Indian passport holders REQUIRE a visa for Singapore (e-visa via authorized agents, ~SGD 30). Cover the 96-hour Visa-Free Transit Facility (VFTF) rules in the layover guide. `[VERIFY: ica.gov.sg]` | ica.gov.sg |
| `destinations/thailand.html` | `proof of funds THB 250,000` and `TM.82 form` | Visa-exempt entry for Indians: 60 days `[VERIFY: thaievisa.go.th]`; funds requirement is THB 20,000/person (rarely checked). Complete the TDAC digital arrival card; delete the "TM.82" reference. | thaievisa.go.th |
| `destinations/india.html` | Visa section congratulating Indians on entering India | Rewrite for foreign visitors (e-Visa for 170+ nationalities, ~USD 25–80 by duration, apply at indianvisaonline.gov.in) or reframe the page as a domestic-travel guide. | indianvisaonline.gov.in |

## P0-4 · Demolished/wrong attractions & safety omissions
| File | FIND | ACTION |
|---|---|---|
| `blog/singapore-5-day-itinerary.html` | `Merlion statue ($12)` (Sentosa, Day 4) | DELETE — the Sentosa Merlion was demolished in 2019. Substitute: Skyline Luge, Wings of Time, or SkyHelix Sentosa `[VERIFY prices]`. |
| `blog/singapore-5-day-itinerary.html`, `blog/singapore-budget-travel.html` | `8:45 PM & 10:45 PM` (Supertree/Garden Rhapsody) | REPLACE: shows at 7:45 PM & 8:45 PM nightly (matches the destination guide). |
| `blog/japan-5-day-itinerary.html` | Mt. Fuji 5th Station day (no season warning) | ADD warning: official climbing season is early July–early September only; outside it, trails above the 5th Station are closed and dangerous. Off-season alternative: Kawaguchiko/Hakone viewpoints. |
| `blog/japan-5-day-itinerary.html` | `N'EX` to `Haneda` | Narita Express serves Narita only; for Haneda use the Tokyo Monorail or Keikyu Line. |
| `destinations/thailand.html` | `Yaowarat Road` described as `famous red light district turned night food market` | REPLACE: Yaowarat is Bangkok's Chinatown — one of the world's great street-food streets. (Never was a red-light district.) |
| `destinations/germany.html` | `Berlin to Munich: 10 hours by day train` | REPLACE: ~4 hours by ICE Sprinter (book ahead for €17.99+ saver fares `[VERIFY: bahn.de]`). |
| `destinations/mexico.html` | `Cancun to Playa del Carmen (30 min fly)` | REPLACE: ~45–60 min by ADO bus or car; no commercial flights on this route. |
| `destinations/mexico.html` | `Interjet`, `AirAsia Mexico` | REPLACE with: Volaris, Viva Aerobus, Aeroméxico. (Interjet ceased 2020; AirAsia Mexico doesn't exist.) |
| `destinations/italy.html` | `Alitalia`, `GoEuro`, `Italia Pass` | REPLACE: ITA Airways; Omio; Trenitalia passes / Eurail Italy Pass. |
| `destinations/australia.html` | `Budget airlines (Qantas, Jetstar, Virgin Australia)`; `Local Pubs (Pokies)`; Sydney–Uluru routing | Qantas is full-service (budget: Jetstar). Delete "(Pokies)" — those are slot machines. Note Uluru has its own airport (AYQ) with direct ~3.5h flights from Sydney. |

## P0-5 · Replace ALL picsum placeholder images
**Files:** `blog.html` + all 6 files in `blog/`.
- FIND (grep): `picsum.photos` — every occurrence must go.
- REPLACE with real destination images: use the owner's own photos/video stills placed in an `/images/` directory (preferred), named `singapore-marina-bay.jpg` etc., with descriptive alt text. If real photos aren't available yet, use destination-accurate licensed images as a stopgap — never random placeholders.
- Add `loading="lazy"`, `width`, `height` attributes.

## P0-6 · Currency-symbol template bugs
- `destinations/mexico.html`: FIND all `₹` → local `MXN $` (e.g., `resorts ₹1,200-2,500` → `resorts MXN 1,200–2,500 [VERIFY realistic range]`).
- `destinations/bali.html`: FIND all `€` (e.g., `€1.50-3` at Ubud Market) → IDR with ≈USD/INR.
- `destinations/peru.html`: FIND all `€` (e.g., `Cevicheria ... €8-20`) → PEN (soles) with ≈USD.
- `destinations/iceland.html`: standardize to ISK (see P0-2).
- Grep the whole repo afterwards: `₹` should only exist on India-related or explicitly INR-conversion content; `€` only on Eurozone pages (Italy, France, Spain, Greece, Portugal, Germany).

## P0-7 · Wire (or remove) all forms
- Blog posts' "Send me the guide" email capture and the homepage contact form appear to have no backend.
- Integrate a real handler: Formspree/Getform for the contact form; an ESP (Brevo/Mailchimp/ConvertKit) for email captures, delivering an actual PDF lead magnet (see P2-3).
- Homepage contact dropdown: list ALL live destinations (currently only 5, one of which 404s).
- Fix the Pinterest share stub in blog posts: `pinterest.com/pin/create/button/` must include `url`, `media`, `description` params — or remove the button.

## P0-8 · The destination-count lie
Grep and fix everywhere: `54 Countries`, `54 countries`, `54 destinations`, `19 Destination`, `19 destination`, `15+ destinations`.
**Files confirmed containing them:** `faq.html` (title, meta, body ×3), `blog.html` (title, meta, body), `itinerary-builder.html` (title vs H1 "Plan Your Asia Itinerary" vs "15+"), `destinations/index`, homepage, `destinations/singapore.html` footer ("Browse 54 Countries").
Use the single true count (Global Rule 4) and make the itinerary-builder title/H1/subtitle agree.

---

# P1 — HIGH (consistency, trust, technical SEO)

## P1-1 · One shared header + footer
Currently ~4 nav variants and ~4 footer variants. Standardize across all pages:
- Nav: `Home · Destinations · Itinerary Builder · Blog · Videos · FAQ · About` (About = new page, P1-2). Logo links to `/` (currently `#` on homepage).
- Footer: identical everywhere; fix `©  Love and Layovers` (year missing on homepage, faq, blog, videos) → `© 2026 Love and Layovers`; remove dead anchor links (`#videos`, `#guides`) on subpages; add newsletter block (P2-3) and affiliate-disclosure link.
- If staying with static HTML, either use a build step (11ty/Astro include) or a documented copy-paste block — but it must be byte-identical across pages.

## P1-2 · Create missing pages
1. **`about.html`** — the site's #1 missing trust page: who you are, photos, travel history, link to YouTube/Instagram, why the guides exist. Link from nav + blog bylines.
2. **`404.html`** — custom error page with search-back links to top guides; configure as the S3/CloudFront error document.
3. **`affiliate-disclosure.html`** (needed once P2-4 ships).

## P1-3 · Homepage restructure
**File:** `index.html`
- ADD an `<h1>` hero (none exists; first heading is an `<h2>`): e.g., `<h1>Real travel itineraries from real trips — free.</h1>` + primary CTA button → `/itinerary-builder.html`.
- Ensure the hero's rotating fragments ("Sunrise hikes / Mountain mornings / ...") degrade to a static headline without JS.
- Embed 3 latest YouTube videos (iframe, `loading="lazy"`).
- Show destinations ONCE (single grid; remove the duplicate featured+grid listing).
- Replace the 4 testimonials (Sarah Chen / Marco Silva / Aisha Patel / James Murphy — unverifiable, all 5★) with embedded/screenshotted real YouTube comments or delete the section.
- Move email capture above the contact form.

## P1-4 · `videos.html` must contain videos
Embed the channel's latest uploads (YouTube playlist embed of the uploads playlist keeps it auto-fresh) + an Instagram embed. Currently the page is headings + outbound links only.

## P1-5 · Structured data (JSON-LD) — add to `<head>`
- `faq.html` and per-guide FAQ sections → `FAQPage` (only after P0-3 corrections — do not mark up wrong answers).
- All `blog/*.html` → `Article` with `author` (link to about.html), `datePublished`, `dateModified`, real `image`.
- All `destinations/*.html` → `Article` + `BreadcrumbList` (Home › Destinations › X).
- Homepage → `Organization` with `sameAs`: [YouTube URL, Instagram URL].

## P1-6 · Meta/OG cleanup
- DELETE all `<meta name="keywords">` (present sitewide).
- Per-page OG images: create 1200×630 per destination/blog post; replace the single shared `preview.jpg`; serve from the site domain/CDN, not the raw S3 URL.
- Verify `sitemap.xml` exists, lists only live URLs (no indonesia/malaysia/srilanka until built), and is referenced in `robots.txt`; submit in Google Search Console.

## P1-7 · Itinerary builder: pre-render + de-contradict
**File:** `itinerary-builder.html`
- Content currently loads only via JS ("Loading itineraries…") — invisible to crawlers. Generate static pages per country+duration (e.g., `/itineraries/singapore-5-days.html`) from the same data, each with title/meta/schema; the interactive builder can stay as the picker on top.
- Make title ("54 Countries"), H1 ("Plan Your Asia Itinerary"), and subtitle ("15+ destinations") agree with reality.
- Verify deep links from guides (`?country=X&duration=N`) actually pre-select in the builder.
- Add "Email me this itinerary as PDF" capture (ties into P0-7/P2-3).
- Label or make selectable the INR-hardcoded currency converter.

## P1-8 · Internal consistency (single source of truth for repeated facts)
Reconcile these currently-contradicting values (one value, used everywhere, `[VERIFY]` each):
- JR Pass 7-day: `¥280-320` (faq) vs `¥29,650` (japan guide) → correct: ¥50,000 `[VERIFY: japanrailpass.net]`.
- Singapore Tourist Pass: `SGD 11` (guide) vs `$15` (faq, blog) `[VERIFY: simplygo / STP site]`; also replace EZ-Link references with SimplyGo guidance.
- Chili crab: `$15-25 per crab` (food blog) vs `SGD 25-50` (guide) → realistic: SGD 60–100+/kg at seafood restaurants.
- Australia daily budget: `$50-75/day` (hub card) vs `AUD 150-250/day` (guide/faq) → use the guide's figure on the card.
- Singapore best-time-to-visit: guide says Nov–Mar best weather; faq/blog say avoid Nov–Jan monsoon → pick one narrative (suggested: Feb–Apr driest; Nov–Jan is the wetter NE monsoon; hot year-round) and apply to guide + faq + both blog posts.
- Newton Food Centre: budget blog says avoid, food blog recommends → unify framing ("iconic but pricier — go for atmosphere, not value").
- FAQ destination tabs (currently include Egypt/Turkey which have no guides) → align tabs with live guides, or clearly mark Egypt/Turkey as "guide coming soon" after fixing their visa answers.

## P1-9 · Remaining page-specific factual fixes
- `destinations/singapore.html`: `Thean Hou Temple` (it's in KL) → `Thian Hock Keng Temple`; move Peranakan Museum out of "Orchard" (it's on Armenian St) and National Museum out of "Marina Bay"; `Chicken Rice Balls` (Malacca dish) → replace with kaya toast or carrot cake (chai tow kway); `Singapore Fest` → `Great Singapore Sale` or `Singapore Food Festival` `[VERIFY current names/dates]`; `Zion Road Hawker Centre` → `Zion Riverside Food Centre`; fix "Sentosa connected by MRT and monorail" → the Sentosa Express monorail from VivoCity (HarbourFront MRT), plus boardwalk/cable car; delete the confused `Puteri Harbour ferry` line.
- `destinations/vietnam.html`: `Banh Hoai` (×2, not a dish) → `Bánh xèo` / `Bánh vạc (white rose)`; `Cà Phê Đen` described as condensed-milk iced coffee → cà phê đen = black; the milk one is `cà phê sữa đá`; `Hanoi to Halong by bus or train (3-4 hours)` → ~2.5h by expressway bus/limousine van (no practical train); dedupe `Water Puppet Theatre, Thang Long Water Puppet Theater`.
- `destinations/bali.html`: VOA `250,000 IDR (~$15)` → IDR 500,000 (~USD 32) + Bali tourist levy IDR 150,000 `[VERIFY]`; `Hindu-Buddhist heritage` → Hindu; fast boats depart Padang Bai/Serangan (not `Seminyak`); remove `Tinutuan` (Manado) and `Soto Banjar` (Kalimantan) from Bali dishes.
- `destinations/japan.html`: `1 USD ≈ ¥130-140` → `[VERIFY current]` (~¥150 range recently); daily budget `¥5,000-8,000` incl. accommodation → raise to a defensible ¥10,000–15,000 budget tier `[VERIFY]`; `Ramen Alley ... Shinjuku` → name it correctly (Omoide Yokocho) or cite Tokyo Ramen Street (Tokyo Station).
- `destinations/france.html`: Museum Pass `includes ... unlimited metro` → it does NOT include transit; `Marché aux Fleurs` as food stop → it's a flower market (suggest Marché d'Aligre); metro fares → 2025 flat-fare reform `[VERIFY: ratp.fr]`.
- `destinations/germany.html`: Oktoberfest dates `September 21-October 6 2026` → `[VERIFY: oktoberfest.de]` (official 2026 dates: Sep 19–Oct 4); reframe `Apfelstrudel — Vienna's famous export` for a Germany list.
- `destinations/india.html`: `Gandh Jayanti` → `Gandhi Jayanti`; explain or drop `Nepal gateway` in the 10-day plan.
- `blog/singapore-food-guide.html`: fix restaurant table — Burnt Ends = modern Australian BBQ, one Michelin star, $$$$, book weeks ahead (NOT "Modern Asian $$ hip fun"); Chatterbox = famous premium chicken rice (NOT "$$ casual"); `nasi kuning` in Kampong Glam → `nasi padang`.
- `blog/singapore-5-day-itinerary.html`: remove duplicate Singapore Flyer (Days 2 AND 3); `[VERIFY]` all entry prices (MBS SkyPark, GBTB conservatories, cable car).
- `blog/japan-5-day-itinerary.html`: teamLab Borderless price `¥3,200` → `[VERIFY]` (moved to Azabudai Hills 2024; ¥3,800–5,000 range); accommodation `¥12,000 ($80) for 4 nights` → unrealistic; use ¥4,000–8,000/night hostel-to-budget range `[VERIFY]`; add India-specific visa note.
- `blog/vietnam-travel-guide.html`: `My Khe Beach - 15 minutes` from Hoi An → An Bang/Cua Dai are Hoi An's beaches; My Khe is Da Nang's (~30–40 min).
- `destinations/` hub: move Iceland card to Europe; rename `Americas & Others` → `Americas & Oceania` (or `Rest of World`); sync every card's budget with its guide.
- `destinations/thailand.html`: delete garbled sentence `Flights are usually cheaper than flights found 2-3 days in advance`; remove/verify `Sukhothai Food Centre (Bangkok)`.

## P1-10 · Add to every destination guide
- `Last verified: <Month Year>` line under Budget and Visa sections.
- Table of contents (blog posts have one; guides don't).
- Breadcrumbs (visual + BreadcrumbList schema).
- "Read next" internal links: Singapore guide ↔ 4 Singapore blog posts; Japan guide ↔ Japan blog; Vietnam guide ↔ Vietnam blog; every guide → builder deep link.
- 4–8 real images with alt text (once P0-5 assets exist).

---

# P2 — GROWTH (after correctness)

## P2-1 · Performance
CloudFront (or Cloudflare) in front of S3 for the India/SEA audience; WebP/AVIF; cache headers; `width`/`height` + lazy-load on all images; then a Core Web Vitals pass (PageSpeed Insights).

## P2-2 · Clean URLs (optional, do once)
Drop `.html` via CloudFront function/redirects with 301s + canonical updates. Skip if it risks churn; never change URLs twice.

## P2-3 · Email engine
ESP wired to all captures (P0-7); 3 PDF lead magnets (Singapore 5-day, Japan 5-day, Layover checklist — export the corrected pages); footer newsletter block sitewide; "email me this itinerary" on builder pages.

## P2-4 · Monetization
Affiliate links in existing sections: hotels (Booking/Agoda) in Budget/Neighborhood blocks; tours (Klook/GetYourGuide) on attractions; 12Go for SE-Asia transport; insurance block partners; eSIM (site already recommends Airalo unlinked — link it). Add `affiliate-disclosure.html` + inline disclosure line. `rel="sponsored"` on affiliate links.

## P2-5 · Analytics
GA4 or Plausible + Search Console; events: builder usage, email signup, outbound YouTube clicks, affiliate clicks; monitor 404s → 0.

## P2-6 · Content ops
Tier guides (Tier 1 = personally verified w/ video: Singapore, Japan, Vietnam, Bali, Thailand; Tier 2 = labeled research guides); 2 posts/month tied to video releases; priority posts: "Singapore visa for Indians (actual process)", "Japan visa for Indians step-by-step"; quarterly re-verify Tier 1 prices/visas and bump `dateModified`.

---

# VERIFICATION — run before deploy (grep from repo root)

Every command below must return **zero matches** (or only intentional ones):

```bash
grep -rn "picsum.photos" .                        # P0-5: zero
grep -rn "Drive on LEFT" .                        # P0-2: zero
grep -rni "54 countries\|54 destinations" .       # P0-8: zero
grep -rn "15+ destinations" .                     # P0-8: zero
grep -rn "Merlion statue" blog/                   # P0-4: zero
grep -rn "10:45 PM" blog/                         # P0-4: zero
grep -rn "visa-free" destinations/japan.html destinations/mexico.html   # P0-3: zero (or only inside a negation)
grep -rn "ETA" destinations/australia.html        # P0-3: only in "not eligible for ETA" context
grep -rn "₹" destinations/mexico.html             # P0-6: zero
grep -rn "€" destinations/bali.html destinations/peru.html destinations/iceland.html  # P0-6: zero
grep -rn "Rugnúbaugur\|Yfirlit\|Kambar\|FlixBus" destinations/iceland.html  # P0-2: zero
grep -rn "Interjet\|AirAsia Mexico" .             # P0-4: zero
grep -rn "Alitalia\|GoEuro" .                     # P0-4: zero
grep -rn "Thean Hou\|Chicken Rice Balls\|Singapore Fest\|Puteri Harbour" destinations/singapore.html  # P1-9: zero
grep -rn "Banh Hoai" .                            # P1-9: zero
grep -rn "red light" destinations/thailand.html   # P0-4: zero
grep -rn "10 hours" destinations/germany.html     # P0-4: zero
grep -rn "¥280\|29,650" .                         # P1-8: zero
grep -rn "Gandh Jayanti" .                        # P1-9: zero
grep -rn 'name="keywords"' .                      # P1-6: zero
grep -rLn "<h1" index.html                        # P1-3: index.html must contain an h1
grep -rn "Sarah Chen\|Marco Silva" index.html     # P1-3: zero
grep -rn "©  Love" .                              # P1-1: zero (double-space/no-year variant)
grep -rn 'href="#"' index.html                    # P1-1: zero (logo link)
```

Then functional checks:
1. Open every URL in the sitemap — all 200, no picsum images, no console errors.
2. `indonesia.html` / `malaysia.html` / `srilanka.html`: 200 with real content, or removed from all listings + 404 page shows the custom template.
3. Submit contact form + one email capture with a test address — confirm delivery.
4. Validate JSON-LD with Google's Rich Results Test on faq.html, one guide, one blog post.
5. View-source (not rendered DOM) of itinerary pages — content must be present without JS.

# DEPLOYMENT — the step that failed last time
The previous edits never appeared on the live site. Definition of done includes:
1. `aws s3 sync ./ s3://loveandlayover-website-604218333793 --delete --exclude ".git/*"` (confirm the bucket + correct prefix; watch for a `/staging` or wrong-folder upload).
2. If CloudFront is in front: create invalidation `/*` and wait for Completed status.
3. Verify from a clean client: incognito window AND `curl -s https://www.loveandlayover.in/destinations/iceland.html | grep -i "drive on"` must show the RIGHT-side text.
4. Re-submit sitemap in Search Console; request re-indexing of the worst pages (japan, mexico, australia, faq).
