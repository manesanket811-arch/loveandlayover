# Guide Template Architecture

**Template Source:** `destinations/singapore.html`  
**Status:** Complete template built per Fable spec §2.2

## Template Structure (All Destination Pages)

### Key Features Implemented
- ✅ Full-width hero image (500px) with breadcrumb, H1, metadata chips, video button
- ✅ 3-column layout: Sticky TOC (left) | Prose content (center, 720px max) | Right sidebar (sticky)
- ✅ Mobile responsive (single column ≤1200px)
- ✅ Sticky mobile action bar (Watch + Build Plan)
- ✅ Theme.css design system (no inline styles)
- ✅ Lite-YouTube embeds (performance-safe video)
- ✅ Article + BreadcrumbList schema markup
- ✅ Accessibility (proper semantic HTML, aria labels)

### Key Sections
1. **Hero Header** - Full-width image + breadcrumb + H1 + metadata chips
2. **Left Sidebar** - Sticky TOC with anchor links to sections
3. **Main Content** - Prose column (max 720px) with sections:
   - Why Visit {{DESTINATION}}?
   - Food & Dining
   - Best Time to Visit
   - Travel Essentials
4. **Right Sidebar** - 3 sticky cards:
   - Builder CTA (deep-link to `/itinerary-builder.html?country={{DESTINATION}}`)
   - Newsletter signup
   - Featured video (lite-YouTube embed)
5. **Read Next** - 3 related destination cards
6. **Footer Newsletter** - Email capture block
7. **Sticky Mobile Bar** - Watch + Build Plan buttons

## Rollout Plan (18 Remaining Destinations)

### Destinations to Apply Template
1. Japan
2. Thailand
3. Vietnam
4. Australia
5. India
6. Bali
7. Indonesia
8. France
9. Italy
10. Spain
11. Greece
12. Portugal
13. Germany
14. Mexico
15. Peru
16. Iceland
17. Egypt
18. Turkey
19. South Korea

### Copy Template Strategy
1. Copy `destinations/singapore.html` to each destination file
2. Update these fields in `<head>`:
   - `<title>` - Change "Singapore" to destination name
   - `<meta name="description">` - Update description
   - `og:title`, `og:description` - Update for social sharing
   - `canonical href` - Update to correct file path
   - Article schema `headline` + `@id` - Destination name + file path
   - BreadcrumbList - Destination name

3. Update in `<body>`:
   - Hero image URL: `singapore-hero.webp` → `{{destination}}-hero.webp`
   - H1 text: "Singapore Travel Guide 2026" → "{{DESTINATION}} Travel Guide 2026"
   - Budget chip: "S$95–150/day" → destination-specific budget
   - Builder link: `?country=Singapore` → `?country={{DESTINATION}}`
   - Video deep link: Same pattern
   - Right sidebar builder link: Same pattern

### Budget Strings by Destination
```
Japan: ¥5,000–8,000/day
Thailand: ฿1,200–1,800/day
Vietnam: ₹1,000–1,500/day
Australia: AUD 120–180/day
India: ₹2,500–3,500/day
Bali: Rp 400K–700K/day
Indonesia: Rp 500K–1M/day
France: €70–100/day
Italy: €60–90/day
Spain: €50–80/day
Greece: €50–80/day
Portugal: €50–75/day
Germany: €70–100/day
Mexico: MXN 800–1,200/day
Peru: S/. 120–180/day
Iceland: ISK 10K–15K/day
Egypt: EGP 300–500/day
Turkey: TRY 1,500–2,500/day
South Korea: ₩60K–100K/day
```

### Hero Image URLs (S3 Pattern)
```
https://loveandlayover-website-604218333793.s3.us-east-1.amazonaws.com/{{destination}}-hero.webp
```

## CSS Classes Reference

All styling uses `/css/theme.css`. Key guide-specific classes:

```css
.guide-header              /* Full-width hero section */
.guide-header-overlay      /* Dark gradient overlay on hero */
.guide-header-content      /* Text/breadcrumb container over hero */
.guide-header-badge        /* Metadata chips (budget, season, visa) */
.guide-watch-btn           /* "We filmed this trip" button (YouTube red) */

.guide-container           /* 3-column grid layout */
.guide-toc                 /* Left: Sticky table of contents */
.guide-content             /* Center: Main prose content */
.guide-sidebar             /* Right: Sticky CTA cards */

.breadcrumb               /* Breadcrumb navigation (theme.css) */
.card                     /* Sidebar CTA cards (theme.css) */
.btn                      /* All buttons (theme.css) */
.sticky-action-bar        /* Mobile bar at bottom (theme.css) */
```

## Content Note

**Current Content:** Placeholder text ("{{DESTINATION}} is a fascinating destination...")

**Next Step:** Replace placeholder sections with destination-specific content:
- Why Visit: Unique selling points, cultural highlights
- Food: Must-try dishes, best restaurants
- Best Time: Weather, seasons, festivals, crowds, costs
- Essentials: Visa, currency, budget breakdown, getting around

Existing content from old destination pages can be preserved and reformatted into the new timeline-card structure for itineraries.

## Verification Checklist (Per Destination)

- [ ] Hero image exists on S3 at correct URL
- [ ] Title updated (destination name)
- [ ] Description updated
- [ ] Schema markup updated (@id, headline, BreadcrumbList)
- [ ] Builder links point to correct destination
- [ ] Video button links to YouTube channel
- [ ] Mobile action bar works on devices
- [ ] Theme.css loads correctly (no inline styles)
- [ ] Breadcrumb renders correctly
- [ ] Sticky TOC links work
- [ ] Right sidebar cards display
- [ ] Mobile: single-column layout
- [ ] Tablet: TOC hidden, sidebar below content

## Performance Notes

- lite-YouTube embeds: loads only thumbnail until click (fast)
- Images: `loading="lazy"` for off-screen content
- CSS: Single unified `/css/theme.css` file (no page-level styles)
- Schema: Article + BreadcrumbList for SEO
- Mobile bar: Only shows on ≤768px (CSS media query)

## Git Workflow

After applying template to each destination:
```bash
git add destinations/{{destination}}.html
git commit -m "Apply guide template: {{DESTINATION}}"
```

Or batch commit all 18 with:
```bash
git add destinations/
git commit -m "Apply guide template to all remaining 18 destinations"
```

---

**Template Completeness:** 100% per Fable spec §2.2  
**Rollout Status:** Ready (Singapore as working example)  
**Estimated Rollout Time:** ~30 min for all 18 (if content is pre-written)
