# Design System Components — Copy-Paste Reference

All components use `/css/theme.css`. Include this in your page `<head>`:

```html
<link rel="stylesheet" href="/css/theme.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## 1. BUTTONS

### Primary Button (Accent Orange)
```html
<a href="#" class="btn btn--primary">Build Your Itinerary</a>
```

### Primary with Icon
```html
<a href="#" class="btn btn--primary">
  ▶ Watch Our Latest Video
</a>
```

### Ghost Button (Outline)
```html
<a href="#" class="btn btn--ghost">Learn More</a>
```

### YouTube Subscribe Button (Red)
```html
<a href="https://www.youtube.com/@channelhandle?sub_confirmation=1" class="btn btn--yt">Subscribe to Channel</a>
```

### Secondary Button (Sea Blue)
```html
<a href="#" class="btn btn--secondary">Explore Guides</a>
```

---

## 2. BADGES & CHIPS

### Default Badge
```html
<span class="badge">3 Days</span>
```

### Accent Badge (Orange)
```html
<span class="badge badge--accent">New</span>
```

### Success Badge (Green)
```html
<span class="badge badge--success">Free</span>
```

### Sea Badge (Blue)
```html
<span class="badge badge--sea">Featured</span>
```

### Badge Row (in cards)
```html
<div class="badge-row">
  <span class="badge">Budget from S$95/day</span>
  <span class="badge">3–10 day plans</span>
  <span class="badge">Visa required</span>
</div>
```

---

## 3. DESTINATION CARD

```html
<a href="/destinations/singapore.html" class="card card--destination">
  <img 
    src="/images/singapore-hero.webp" 
    alt="Singapore skyline at night"
    width="900" 
    height="600"
    loading="lazy">
  <div class="card-overlay">
    <h3>Singapore</h3>
    <div class="badge-row">
      <span class="badge">Budget from S$95/day</span>
      <span class="badge">3–10 day plans</span>
    </div>
  </div>
</a>
```

### Destination Card Grid (homepage)
```html
<div class="card-grid">
  <!-- Repeat destination card above 3-4 times -->
</div>
```

---

## 4. VIDEO CARD

```html
<div class="card card--video">
  <div class="card--video-thumb">
    <img 
      src="/images/video-thumb-singapore.webp" 
      alt="Singapore 5-day vlog thumbnail"
      width="1280"
      height="720"
      loading="lazy">
    <div class="card--video-play">▶</div>
    <span class="card--video-duration">18:42</span>
  </div>
  <div class="card--video-info">
    <h3>Singapore in 5 Days (2026)</h3>
    <p>Temple-hopping, food markets, and Gardens by the Bay — what $95/day buys you.</p>
    <a href="https://www.youtube.com/watch?v=VIDEO_ID" class="btn btn--yt">Watch on YouTube</a>
  </div>
</div>
```

---

## 5. NEWSLETTER CARD

### Standalone (footer, end of article)
```html
<div class="card card--newsletter">
  <div class="card--newsletter-inner">
    <h3>Free weekly tips</h3>
    <p>One honest travel guide every month. No spam.</p>
    <form>
      <input 
        type="email" 
        placeholder="your@email.com" 
        required 
        aria-label="Email address">
      <button type="submit" class="btn btn--primary" style="width: 100%; margin-top: 8px;">
        Subscribe
      </button>
    </form>
  </div>
</div>
```

### Inline Newsletter (one-liner footer)
```html
<p class="text-small text-soft">
  <strong>Get tips:</strong> 
  <input type="email" placeholder="your@email.com" style="width: 200px; padding: 8px 12px; border: 1px solid var(--ink); border-radius: 6px;">
  <button type="submit" class="btn btn--primary" style="padding: 8px 16px; font-size: 0.9rem;">
    Subscribe
  </button>
</p>
```

---

## 6. BREADCRUMB

```html
<nav aria-label="Breadcrumb">
  <ul class="breadcrumb">
    <li><a href="/">Home</a></li>
    <li><a href="/destinations/">Destinations</a></li>
    <li>Singapore</li>
  </ul>
</nav>
```

---

## 7. TABLE OF CONTENTS (STICKY SIDEBAR)

```html
<aside class="toc">
  <h3>In this guide</h3>
  <ul>
    <li><a href="#why-visit">Why Visit</a></li>
    <li><a href="#itineraries">Free Itineraries</a></li>
    <li><a href="#food">Food Guide</a></li>
    <li><a href="#neighborhoods">Neighborhoods</a></li>
    <li><a href="#getting-around">Getting Around</a></li>
    <li><a href="#essentials">Travel Essentials</a></li>
  </ul>
</aside>
```

---

## 8. ACCORDION / FAQ

```html
<div class="accordion">
  <div class="accordion-item">
    <button class="accordion-trigger" aria-expanded="false">
      Do I need a visa to visit Singapore?
    </button>
    <div class="accordion-content">
      <p>Indian passport holders need an e-visa (S$25-50) at ica.gov.sg. Processing: 1-2 days. Valid for 90 days.</p>
    </div>
  </div>

  <div class="accordion-item">
    <button class="accordion-trigger" aria-expanded="false">
      Best time to visit?
    </button>
    <div class="accordion-content">
      <p>February-April (dry season, 24-31°C). Avoid monsoon (Nov-Jan, May-Sep). Peak crowds: Chinese New Year.</p>
    </div>
  </div>
</div>

<script>
  // Accordion toggle
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.parentElement;
      item.classList.toggle('open');
      trigger.setAttribute('aria-expanded', item.classList.contains('open'));
    });
  });
</script>
```

---

## 9. STICKY MOBILE ACTION BAR

Place at the end of `<body>` on article/guide pages:

```html
<div class="sticky-action-bar">
  <a href="https://www.youtube.com/watch?v=VIDEO_ID" class="btn btn--yt" style="flex: 1;">
    Watch Trip
  </a>
  <a href="/itinerary-builder.html?country=Singapore" class="btn btn--primary" style="flex: 1;">
    Build Plan
  </a>
</div>

<script>
  // Add padding to body when bar is visible
  if (window.innerWidth <= 768) {
    document.body.classList.add('has-sticky-bar');
  }
</script>
```

---

## 10. HERO SECTION (Homepage)

### Split Hero (Content + Embedded Video)
```html
<section class="hero">
  <div class="wrap">
    <div class="hero--split">
      <div class="hero--split-content">
        <p style="font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-soft); margin-bottom: 12px;">
          Travel Vloggers · 16 Guides
        </p>
        <h1>We film the trip.<br>You get the plan.</h1>
        <p>Free itineraries from real trips. No fluff, no affiliate links.</p>
        <div class="hero-buttons">
          <a href="/itinerary-builder.html" class="btn btn--primary">Build Your Free Itinerary</a>
          <a href="https://www.youtube.com/watch?v=LATEST_VIDEO" class="btn btn--ghost">▶ Watch Our Latest Video</a>
        </div>
      </div>
      <div>
        <script type="module" src="https://cdn.jsdelivr.net/npm/@justinribeiro/lite-youtube@1/lite-youtube.js"></script>
        <lite-youtube videoid="LATEST_VIDEO_ID" playlabel="Singapore in 5 days — watch"></lite-youtube>
      </div>
    </div>
  </div>
</section>
```

---

## 11. SECTION WITH BACKGROUND ALTERNATION

```html
<!-- Odd section: default background -->
<section class="section">
  <div class="wrap">
    <h2>Free Itineraries</h2>
    <div class="card-grid">
      <!-- Cards go here -->
    </div>
  </div>
</section>

<!-- Even section: sand background -->
<section class="section section--alt">
  <div class="wrap">
    <h2>YouTube Channel</h2>
    <!-- Content -->
  </div>
</section>
```

---

## 12. "READ NEXT" TRIO (end of article)

```html
<section class="section">
  <div class="wrap">
    <h2>Read Next</h2>
    <div class="card-grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
      <div class="card">
        <img src="/images/japan-blog.webp" alt="Japan blog" width="400" height="240" loading="lazy" style="width: 100%; height: 240px; object-fit: cover; border-radius: 14px 14px 0 0;">
        <div style="padding: 20px;">
          <span class="badge">Itinerary</span>
          <h3 style="margin-top: 12px; margin-bottom: 8px;">Japan 7-Day Itinerary</h3>
          <p style="font-size: 0.9rem; color: var(--ink-soft); margin: 0;">Tokyo, Kyoto, Mount Fuji in a week.</p>
          <a href="/blog/japan-7-day.html" class="btn btn--primary" style="margin-top: 16px; width: 100%; text-align: center;">Read Guide →</a>
        </div>
      </div>
      <!-- Repeat 2 more times -->
    </div>
  </div>
</section>
```

---

## 13. LITE-YOUTUBE EMBED (performance-safe video embeds)

Include this once per page (before closing `</body>`):

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@justinribeiro/lite-youtube@1/lite-youtube.js"></script>
```

Then embed videos with:

```html
<lite-youtube videoid="VIDEO_ID" playlabel="Singapore in 5 days — watch"></lite-youtube>
```

Styled container:
```html
<div style="max-width: 100%; margin: 30px 0; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 30px rgba(31,27,22,0.08);">
  <lite-youtube videoid="VIDEO_ID" playlabel="Your video title"></lite-youtube>
</div>
```

---

## 14. QUICK ACCESSIBILITY NOTES

- All clickable elements use semantic `<a>` or `<button>`
- Images have alt text
- Color is never the only indicator (text + icon)
- Form inputs have labels
- Accordion triggers have `aria-expanded`

---

## 15. FONT LOADING (Global)

Add to every page `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## IMPLEMENTATION CHECKLIST

- [ ] Stylesheet linked: `<link rel="stylesheet" href="/css/theme.css">`
- [ ] Google Fonts preconnected
- [ ] All buttons use `.btn` + variant class (`.btn--primary`, `.btn--yt`, etc.)
- [ ] Cards use `.card` + variant (`.card--destination`, `.card--video`, etc.)
- [ ] Sections alternate background (`.section--alt`)
- [ ] Images: WebP format, `loading="lazy"`, width/height specified
- [ ] lite-youtube script included for video embeds
- [ ] Mobile breakpoint test at 768px
- [ ] Buttons min 48px height on desktop, 44px on mobile (touch-safe)
