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
