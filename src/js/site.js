/**
 * Site-wide behaviour for pages using css/site.css:
 * header shadow, mobile menu, scroll reveal, footer year.
 */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Header shadow on scroll
  var hdr = document.getElementById('hdr');
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Mobile menu
  var btn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (btn && nav) {
  var setMenu = function (open) {
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  btn.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); btn.focus(); } });
  }

  // Scroll reveal
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // Count WhatsApp chats started from the site
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="wa.me/"]');
    if (a && window.gtag) window.gtag('event', 'whatsapp_click', { page_path: location.pathname });
  });

  // Count clicks on affiliate links: Klook (which product) and other partners like Wise
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-klook], a[data-partner]');
    if (a && window.gtag) window.gtag('event', 'affiliate_click', { partner: a.getAttribute('data-partner') || 'klook', affiliate_item: a.getAttribute('data-klook') || a.getAttribute('data-partner'), page_path: location.pathname });
  });

  // ---------- Reading progress bar (posts and guides) and back-to-top button ----------
  var article = document.querySelector('.post-layout, .article-wrapper, .article-content, .days, .day-box');
  var tall = function () { return document.documentElement.scrollHeight > window.innerHeight * 3; };
  if (article) {
    var bar = document.createElement('div');
    bar.className = 'read-progress'; bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
  }
  var topBtn = document.createElement('button');
  topBtn.type = 'button'; topBtn.className = 'to-top'; topBtn.setAttribute('aria-label', 'Back to top');
  topBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  topBtn.addEventListener('click', function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    var skip = document.querySelector('.skip-link'); if (skip) skip.focus({ preventScroll: true });
  });
  document.body.appendChild(topBtn);
  if (document.querySelector('.action-bar')) topBtn.classList.add('above-bar');
  var ticking = false;
  var onScrollUi = function () {
    ticking = false;
    var doc = document.documentElement, max = doc.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
    topBtn.classList.toggle('show', tall() && window.scrollY > window.innerHeight * 1.5);
  };
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScrollUi); } }, { passive: true });
  onScrollUi();

  // ---------- Site search ----------
  // The header button opens an overlay; /search-index.json is fetched the first time.
  // Shortcuts: "/" or Ctrl/Cmd+K to open, arrows to move, Enter to open, Esc to close.
  var sBtn = document.getElementById('searchBtn');
  if (sBtn) {
    var sIndex = null, sLoading = null, sBox, sInput, sBody, sItems = [], sActive = -1, sTimer, sLogged = '';
    var SUGGEST = ['Singapore visa', 'Universal Studios', 'Trip cost', 'Honeymoon', 'December', 'Japan', 'Bali', 'Malaysia', 'Vegetarian food', 'Dubai'];
    // Words people type that mean something else on our pages
    var ALIAS = { sg: 'singapore', uss: 'universal studios', kl: 'kuala lumpur', jb: 'johor', hk: 'hong kong', usj: 'universal studios japan', veg: 'vegetarian', cheap: 'budget', plan: 'itinerary', flight: 'flights', korea: 'south korea', uae: 'dubai', bkk: 'bangkok' };
    var norm = function (t) { return (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ''); };
    var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

    var load = function () {
      if (sIndex) return Promise.resolve(sIndex);
      if (!sLoading) sLoading = fetch('/search-index.json').then(function (r) { return r.json(); }).then(function (d) {
        sIndex = d.map(function (p) { p._t = norm(p.t); p._h = norm(p.h); p._d = norm(p.d); p._b = norm(p.b); return p; });
        return sIndex;
      });
      return sLoading;
    };

    var build = function () {
      sBox = document.createElement('div');
      sBox.className = 'll-search';
      sBox.setAttribute('role', 'dialog'); sBox.setAttribute('aria-modal', 'true'); sBox.setAttribute('aria-label', 'Search');
      sBox.innerHTML = '<div class="s-panel"><div class="s-bar"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>' +
        '<input class="s-input" type="search" placeholder="Search guides, visas, costs, videos…" aria-label="Search the site" autocomplete="off" spellcheck="false" enterkeyhint="search" role="combobox" aria-expanded="true" aria-controls="sResults">' +
        '<button class="s-close" type="button" aria-label="Close search">Esc</button></div><div class="s-body" id="sResults"></div>' +
        '<div class="s-foot">Not sure where to go? Try our <a href="/trip-finder.html">trip finder quiz</a>.</div></div>';
      document.body.appendChild(sBox);
      sInput = sBox.querySelector('.s-input'); sBody = sBox.querySelector('.s-body');
      sBox.addEventListener('click', function (e) {
        if (e.target === sBox || e.target.closest('.s-close')) close();
        var chip = e.target.closest('.s-chip');
        if (chip) { sInput.value = chip.textContent; run(); sInput.focus(); }
        var a = e.target.closest('a.s-item');
        if (a) log('search_select', a.getAttribute('href'));
      });
      sInput.addEventListener('input', function () { clearTimeout(sTimer); sTimer = setTimeout(run, 80); });
      sInput.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); move(e.key === 'ArrowDown' ? 1 : -1); }
        else if (e.key === 'Enter') { var a = sItems[sActive >= 0 ? sActive : 0]; if (a) { log('search_select', a.getAttribute('href')); location.href = a.getAttribute('href'); } }
      });
    };

    var log = function (name, href) {
      var q = (sInput && sInput.value || '').trim();
      if (!window.gtag || q.length < 2) return;
      if (name === 'search' && q === sLogged) return;
      if (name === 'search') sLogged = q;
      window.gtag('event', name, name === 'search' ? { search_term: q } : { search_term: q, link_url: href });
    };

    var suggestions = function () {
      sBody.innerHTML = '<p class="s-label">Popular searches</p><div class="s-chips">' + SUGGEST.map(function (t) { return '<button type="button" class="s-chip">' + esc(t) + '</button>'; }).join('') + '</div>';
      sItems = []; sActive = -1;
    };

    var score = function (p, words) {
      var total = 0;
      for (var i = 0; i < words.length; i++) {
        var w = words[i], s = 0, re = new RegExp('(^|[^a-z0-9])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        if (re.test(p._t)) s += 12; else if (p._t.indexOf(w) !== -1) s += 6;
        if (re.test(p._h)) s += 5;
        if (re.test(p._d)) s += 4;
        if (re.test(p._b)) s += 2; else if (p._b.indexOf(w) !== -1) s += 1;
        if (!s) return 0;           // every word must match somewhere
        total += s;
      }
      return total + ({ Guide: 3, Tool: 3, Post: 2, Page: 0, Video: 1 }[p.y] || 0);
    };

    var snippet = function (p, words) {
      var src = p.d || p.b, lower = norm(src), at = -1;
      for (var i = 0; i < words.length && at < 0; i++) at = lower.indexOf(words[i]);
      var start = at > 60 ? at - 50 : 0, out = (start ? '…' : '') + src.slice(start, start + 170);
      out = esc(out);
      words.forEach(function (w) { if (w.length > 1) out = out.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); });
      return out;
    };

    var run = function () {
      var q = norm(sInput.value).trim();
      if (!q) return suggestions();
      load().then(function (idx) {
        var words = q.split(/[^a-z0-9]+/).filter(Boolean).map(function (w) { return ALIAS[w] || w; }).join(' ').split(' ').filter(Boolean);
        var hits = idx.map(function (p) { return [score(p, words), p]; }).filter(function (x) { return x[0] > 0; })
          .sort(function (a, b) { return b[0] - a[0]; }).slice(0, 12);
        if (!hits.length) {
          sBody.innerHTML = '<p class="s-empty">No results for “' + esc(sInput.value.trim()) + '”. Try a country, like <b>Singapore</b> or <b>Japan</b>, or take our <a href="/trip-finder.html">trip finder quiz</a>.</p>';
          sItems = []; sActive = -1;
        } else {
          sBody.innerHTML = '<ul class="s-list">' + hits.map(function (x) {
            var p = x[1];
            return '<li><a class="s-item" href="' + esc(p.u) + '"><span class="s-thumb"' + (p.i ? ' style="background-image:url(\'' + esc(p.i) + '\')"' : '') + '></span>' +
              '<span class="s-text"><span class="s-title">' + esc(p.t) + '</span><span class="s-snip">' + snippet(p, words) + '</span></span><span class="s-type">' + esc(p.y) + '</span></a></li>';
          }).join('') + '</ul>';
          sItems = [].slice.call(sBody.querySelectorAll('a.s-item')); sActive = -1;
        }
        clearTimeout(sTimer); sTimer = setTimeout(function () { log('search'); }, 1200);
      }).catch(function () { sBody.innerHTML = '<p class="s-empty">Search is unavailable right now. Browse our <a href="/destinations/">guides</a> or <a href="/blog.html">blog</a>.</p>'; });
    };

    var move = function (d) {
      if (!sItems.length) return;
      if (sActive >= 0) sItems[sActive].classList.remove('active');
      sActive = (sActive + d + sItems.length) % sItems.length;
      sItems[sActive].classList.add('active'); sItems[sActive].scrollIntoView({ block: 'nearest' });
    };

    var open = function () {
      if (!sBox) build();
      sBox.classList.add('open'); root.classList.add('ll-search-open');
      sBtn.setAttribute('aria-expanded', 'true');
      if (!sInput.value) suggestions(); else run();
      setTimeout(function () { sInput.focus(); }, 30);
      load();
    };
    var close = function () {
      if (!sBox) return;
      log('search');
      sBox.classList.remove('open'); root.classList.remove('ll-search-open');
      sBtn.setAttribute('aria-expanded', 'false'); sBtn.focus();
    };

    sBtn.addEventListener('click', open);
    document.addEventListener('keydown', function (e) {
      var typing = /^(input|textarea|select)$/i.test((e.target.tagName || '')) || e.target.isContentEditable;
      if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K'))) { e.preventDefault(); open(); }
      else if (e.key === 'Escape' && sBox && sBox.classList.contains('open')) close();
    });
  }
})();

/* ============================================================
 * Motion kit: living header, staggered scroll reveals, card tilt, magnetic
 * buttons, counting stats, partner logo marquee and image fade-in.
 * Skipped entirely for visitors who prefer reduced motion.
 * ============================================================ */
(function () {
  'use strict';
  var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  var reduce = mq('(prefers-reduced-motion: reduce)');
  var fine = mq('(hover: hover) and (pointer: fine)');
  var root = document.documentElement;

  // Living header: compact after 80px; hides when scrolling down, returns when scrolling up
  var hdr = document.getElementById('hdr');
  if (hdr) {
    var last = window.scrollY, ticking = false;
    var update = function () {
      var y = window.scrollY, nav = document.getElementById('siteNav');
      hdr.classList.toggle('compact', y > 80);
      var busy = (nav && nav.classList.contains('open')) || root.classList.contains('ll-search-open') || hdr.contains(document.activeElement);
      if (!reduce && !busy && y > 480 && y > last + 6) hdr.classList.add('hide');
      else if (y < last - 6 || y < 480 || busy) hdr.classList.remove('hide');
      last = y; ticking = false;
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // Images fade in once loaded (only ones still loading, so nothing visible blinks)
  [].forEach.call(document.querySelectorAll('main img[loading="lazy"]'), function (img) {
    if (img.complete) return;
    img.classList.add('m-fade');
    var done = function () { img.classList.add('loaded'); };
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });

  if (reduce) return;

  // Staggered scroll reveals for common blocks below the first screen
  if ('IntersectionObserver' in window) {
    var SEL = 'main h2, main .card, main .post, main .dcard, main .mp-card, main .nitem, main .hn, main .stat, main .start-grid > a, ' +
              'main .create-mini > div, main .brief-list > li, main .cost-card, main .table-wrap, main .post-faq details, main .klook-box, main .partner, main .tile, main .step';
    var vh = window.innerHeight, seen = [], parents = [], counts = [];
    [].forEach.call(document.querySelectorAll(SEL), function (el) {
      if (el.closest('.reveal, .m-rv, .hero, .now-strip, header, footer, nav, [data-no-motion]')) return;
      if (el.getBoundingClientRect().top < vh * 0.9) return;   // already on screen: leave it alone
      var ox = getComputedStyle(el.parentNode).overflowX;
      if (ox === 'auto' || ox === 'scroll') return;            // inside a sideways swipe row: leave it alone
      var i = parents.indexOf(el.parentNode);
      if (i < 0) { parents.push(el.parentNode); counts.push(0); i = parents.length - 1; }
      el.style.setProperty('--rv-d', Math.min(counts[i]++, 7) * 75 + 'ms');
      el.classList.add('m-rv'); seen.push(el);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('m-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    seen.forEach(function (el) { io.observe(el); });
  }

  // Counting stats: "45K+", "14+" count up when they come into view (final text is unchanged)
  var counters = [].filter.call(document.querySelectorAll('.stat b, [data-count]'), function (el) { return /^\d[\d,]*(?:\.\d+)?[KkLM]?\+?$/.test(el.textContent.trim()); });
  if (counters.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return; cio.unobserve(en.target);
        var el = en.target, text = el.textContent.trim(), m = text.match(/^(\d[\d,]*(?:\.\d+)?)(.*)$/), end = parseFloat(m[1].replace(/,/g, '')), t0 = performance.now();
        el.style.fontVariantNumeric = 'tabular-nums';
        (function step(t) {
          var k = Math.min((t - t0) / 1300, 1), v = end * (1 - Math.pow(1 - k, 3));
          el.textContent = k < 1 ? Math.round(v) + m[2] : text;
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  // Partner logos: turn the logo grid into two gliding rows
  var wall = document.querySelector('.logo-wall');
  if (wall) {
    var tiles = [].slice.call(wall.querySelectorAll('.logo-tile')), more = wall.querySelector('.logo-more');
    if (tiles.length >= 4) {
      var half = Math.ceil(tiles.length / 2), box = document.createElement('div');
      box.className = 'logo-marquee';
      [tiles.slice(0, half), tiles.slice(half)].forEach(function (set, r) {
        var row = document.createElement('div'), track = document.createElement('div');
        row.className = 'lm-row' + (r ? ' rev' : ''); track.className = 'lm-track';
        track.style.setProperty('--lm-dur', (set.length * 7) + 's');
        set.concat(set.map(function (t) { var c = t.cloneNode(true); c.setAttribute('aria-hidden', 'true'); return c; })).forEach(function (t) { track.appendChild(t); });
        row.appendChild(track); box.appendChild(row);
      });
      wall.textContent = ''; wall.appendChild(box); if (more) wall.appendChild(more);
      // logos inside the moving rows load straight away and skip the fade-in
      [].forEach.call(box.querySelectorAll('img'), function (img) { img.loading = 'eager'; img.classList.remove('m-fade'); });
      wall.classList.add('is-marquee');
    }
  }

  if (!fine) return;

  // Cards tilt gently towards the cursor
  [].forEach.call(document.querySelectorAll('main .card, main .dcard, main .mp-card, main .post'), function (c) {
    c.classList.add('m-tilt');
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      c.style.setProperty('--tx', (x * 7).toFixed(2) + 'deg'); c.style.setProperty('--ty', (-y * 7).toFixed(2) + 'deg');
      c.classList.add('tilting');
    });
    c.addEventListener('pointerleave', function () { c.classList.remove('tilting'); });
  });

  // Main call-to-action buttons lean towards the cursor
  [].forEach.call(document.querySelectorAll('a.site-cta, .hero-cta .btn-primary, .btn-light'), function (b) {
    b.classList.add('m-mag');
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect();
      b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.25).toFixed(1) + 'px)';
    });
    b.addEventListener('pointerleave', function () { b.style.transform = ''; });
  });
})();
