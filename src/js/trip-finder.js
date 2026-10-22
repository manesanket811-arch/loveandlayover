/**
 * Trip finder quiz (trip-finder.html). Six questions, then the three best-matched
 * destinations from the data built into the page (#tf-data). Answers live in the
 * URL (?who=couple&days=6&…) so results can be shared and reopened.
 */
(function () {
  'use strict';
  var box = document.getElementById('tf');
  var dataEl = document.getElementById('tf-data');
  if (!box || !dataEl) return;
  var DEST = JSON.parse(dataEl.textContent);
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  var Q = [
    { key: 'who', title: 'Who are you travelling with?', opts: [
      ['couple', '💑', 'My partner', 'Couple trip or honeymoon'], ['family', '👨‍👩‍👧', 'Family with kids', 'Easy, safe and fun'],
      ['seniors', '👵', 'With parents', 'Comfortable, not too rushed'], ['friends', '🎉', 'Friends', 'Fun, food and nightlife'], ['solo', '🎒', 'Just me', 'Solo adventure']] },
    { key: 'days', title: 'How many days do you have?', opts: [
      ['4', '⚡', '3–4 days', 'A long weekend'], ['6', '🗓️', '5–6 days', 'The classic trip'], ['8', '✈️', '7–9 days', 'Time for 2 places'], ['12', '🌍', '10+ days', 'The big one']] },
    { key: 'budget', title: 'Budget per person, including flights?', hint: 'A rough idea is enough.', opts: [
      ['50', '🪙', 'Under ₹50,000', 'Smart and simple'], ['100', '💵', '₹50k – 1 lakh', 'Comfortable mid-range'], ['150', '💳', '₹1 – 1.5 lakh', 'A bit of a splurge'],
      ['250', '💎', '₹1.5 – 2.5 lakh', 'Treat yourselves'], ['0', '🤷', 'No fixed budget', 'Show me the best fit']] },
    { key: 'month', title: 'When are you planning to go?', months: true, opts: MONTHS.map(function (m, i) { return [String(i + 1), '', m.slice(0, 3), '']; }).concat([['0', '', 'Not sure', '']]) },
    { key: 'vibe', title: 'What kind of trip do you want?', opts: [
      ['beach', '🏝️', 'Beaches & islands', 'Sea, sand and sunsets'], ['city', '🌆', 'Cities & food', 'Skylines, markets, cafés'], ['theme', '🎢', 'Theme parks & fun', 'Rides, shows, attractions'],
      ['nature', '🏔️', 'Nature & adventure', 'Mountains, treks, safaris'], ['culture', '🛕', 'Culture & history', 'Temples, ruins, old towns'], ['luxury', '✨', 'Luxury & shopping', 'Resorts, malls, spas']] },
    { key: 'visa', title: 'How do you feel about visas?', opts: [
      ['easy', '🛂', 'Keep it easy', 'Visa-free, on arrival or quick online'], ['any', '📄', 'Happy to apply', 'Visa paperwork is fine']] }
  ];
  var WHO = { couple: 'couples', family: 'families', seniors: 'travelling with parents', friends: 'friends', solo: 'solo travellers' };
  var VIBE = { beach: 'beaches', city: 'cities & food', theme: 'theme parks', nature: 'nature', culture: 'culture', luxury: 'luxury' };

  var ans = {}, step = 0, started = false;
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var track = function (name, params) { if (window.gtag) window.gtag('event', name, params || {}); };
  var num = function (x) { return x >= 100000 ? (Math.round(x / 10000) / 10) + ' lakh' : Math.round(x / 1000) + 'k'; };
  var range = function (lo, hi) {
    if (lo >= 100000) return '₹' + (Math.round(lo / 10000) / 10) + '–' + num(hi);
    return '₹' + num(lo) + '–' + num(hi);
  };

  function cost(d, days) {
    var lo = d.flights[0] + d.daily[0] * days, hi = d.flights[1] + d.daily[1] * days;
    return { lo: Math.round(lo / 5000) * 5000, hi: Math.round(hi / 5000) * 5000, mid: (lo + hi) / 2 };
  }

  function score(d) {
    var s = 0, why = [], warn = [];
    var days = +ans.days, month = +ans.month, budget = +ans.budget * 1000;
    if (d.vibes[0] === ans.vibe) { s += 5; why.push('Perfect for ' + VIBE[ans.vibe]); }
    else if (d.vibes.indexOf(ans.vibe) !== -1) { s += 4; why.push('Great for ' + VIBE[ans.vibe]); }
    else s -= 2;
    if (d.who.indexOf(ans.who) !== -1) { s += 3; why.push('Ideal for ' + WHO[ans.who]); }
    if (month) {
      if (d.best.indexOf(month) !== -1) { s += 4; why.push('Lovely in ' + MONTHS[month - 1]); }
      else if (d.avoid.indexOf(month) !== -1) { s -= 5; warn.push('Not the best weather in ' + MONTHS[month - 1].slice(0, 3)); }
    }
    var reachPts = { short: { 4: 2, 6: 1, 8: 0, 12: -1 }, medium: { 4: -2, 6: 0, 8: 1, 12: 1 }, long: { 4: -8, 6: -4, 8: 0, 12: 2 } }[d.reach][days] || 0;
    s += reachPts;
    if (d.reach === 'short' && days <= 4) why.push('Short flight from India');
    if (d.reach === 'long' && days <= 6) warn.push('Long flights for a short trip');
    var c = cost(d, days);
    if (budget) {
      if (c.mid <= budget) { s += 4; why.push('Fits your budget'); }
      else if (c.lo <= budget) { s -= 1; warn.push('Tight on budget'); }
      else { s -= 7; warn.push('Over your budget'); }
    }
    if (ans.visa === 'easy') {
      if (d.visa === 'easy') { s += 3; why.push('Easy visa'); }
      else if (d.visa === 'evisa') s += 1;
      else { s -= 3; warn.push('Visa needed in advance'); }
    }
    if (ans.who === 'couple' && d.who[0] === 'couple') s += 1;   // honeymoon-style places
    if (d.filmed) s += 0.5;                                      // tie-breaker: we've been there
    return { d: d, s: s, why: why, warn: warn, c: c };
  }

  function planLink(d, days) {
    if (!d.plans) return '/destinations/' + d.s + '.html#itineraries';
    var n = d.plans.filter(function (p) { return p <= days; }).pop() || d.plans[0];
    return '/destinations/' + d.s + '.html#itinerary-' + n;
  }
  function planDays(d, days) {
    if (!d.plans) return d.days;
    return d.plans.filter(function (p) { return p <= days; }).pop() || d.plans[0];
  }

  function shareUrl() {
    var q = Q.map(function (x) { return x.key + '=' + encodeURIComponent(ans[x.key]); }).join('&');
    return location.origin + location.pathname + '?' + q;
  }

  function renderQuestion() {
    var q = Q[step];
    var html = '<div class="tf-top"><span class="tf-step">Question ' + (step + 1) + ' of ' + Q.length + '</span>' +
      '<button type="button" class="tf-back"' + (step ? '' : ' hidden') + '>← Back</button></div>' +
      '<div class="tf-bar" aria-hidden="true"><i style="width:' + Math.round(step / Q.length * 100) + '%"></i></div>' +
      '<div class="tf-q"><h2 tabindex="-1">' + esc(q.title) + '</h2>' + (q.hint ? '<p class="hint">' + esc(q.hint) + '</p>' : '') +
      '<div class="tf-opts' + (q.months ? ' months' : '') + '">' + q.opts.map(function (o) {
        return '<button type="button" class="tf-opt" data-v="' + esc(o[0]) + '" aria-pressed="' + (ans[q.key] === o[0]) + '">' +
          (o[1] ? '<span class="e" aria-hidden="true">' + o[1] + '</span>' : '') + '<b>' + esc(o[2]) + '</b>' + (o[3] ? '<small>' + esc(o[3]) + '</small>' : '') + '</button>';
      }).join('') + '</div></div>';
    box.innerHTML = html;
    var h = box.querySelector('h2');
    if (started) h.focus({ preventScroll: true });
  }

  function renderResults(fromLink) {
    var days = +ans.days;
    var ranked = DEST.map(score).sort(function (a, b) { return b.s - a.s; });
    var top = ranked.slice(0, 3), rest = ranked.slice(3, 9);
    var max = 22;
    var html = '<div class="tf-results"><div class="tf-top"><span class="tf-step">Your matches</span><button type="button" class="tf-restart tf-back">↺ Start over</button></div>' +
      '<h2>Your top pick: ' + esc(top[0].d.n) + '</h2>' +
      '<p class="tf-sum">For ' + esc(WHO[ans.who]) + ', ' + esc(Q[1].opts.filter(function (o) { return o[0] === ans.days; })[0][2]) +
      (+ans.month ? ' in ' + MONTHS[+ans.month - 1] : '') + (+ans.budget ? ', ' + esc(Q[2].opts.filter(function (o) { return o[0] === ans.budget; })[0][2]) + ' each' : '') +
      ', with ' + esc(VIBE[ans.vibe]) + '.</p><div class="tf-list">' +
      top.map(function (r, i) {
        var d = r.d, pct = Math.max(55, Math.min(98, Math.round(60 + (r.s / max) * 40)));
        return '<article class="tf-res' + (i ? '' : ' top') + '">' +
          '<div class="tf-img" style="background-image:url(\'' + esc(d.img) + '\')"><span class="tf-rank">' + (i ? '#' + (i + 1) + ' match' : 'Best match') + '</span></div>' +
          '<div class="tf-body"><div class="tf-name">' + (d.f ? '<img src="' + esc(d.f) + '" alt="" width="30" height="22">' : '') + '<h3>' + esc(d.n) + '</h3><span class="tf-match">' + pct + '% match</span></div>' +
          '<p class="tf-line">' + esc(d.line) + '</p>' +
          '<div class="tf-why">' + r.why.map(function (w) { return '<span>✓ ' + esc(w) + '</span>'; }).join('') + r.warn.map(function (w) { return '<span class="warn">! ' + esc(w) + '</span>'; }).join('') + '</div>' +
          '<div class="tf-facts"><div><small>Rough cost</small><b>' + range(r.c.lo, r.c.hi) + '</b><span class="sr-only"> per person</span></div>' +
          '<div><small>Best time</small><b>' + esc(d.bt) + '</b></div><div><small>Visa for Indians</small><b>' + esc(d.v) + '</b></div></div>' +
          '<div class="tf-cta"><a class="btn btn-primary" data-tf="plan" data-d="' + esc(d.s) + '" href="' + esc(planLink(d, days)) + '">See the ' + planDays(d, days) + '-day plan →</a>' +
          (d.k ? '<a class="btn btn-klook" href="' + esc(d.k.u) + '" target="_blank" rel="sponsored noopener" data-klook="' + esc(d.k.id) + '" data-tf="klook" data-d="' + esc(d.s) + '" title="' + esc(d.k.n) + '">Tickets &amp; tours on Klook</a>' : '') +
          (d.filmed ? '<a class="btn btn-ghost" data-tf="videos" data-d="' + esc(d.s) + '" href="/destinations/' + esc(d.s) + '.html#watch">Watch our videos</a>' : '') +
          '</div></div></article>';
      }).join('') + '</div>' +
      '<div class="tf-share"><p>Planning with someone? Send them your match.</p><div class="row">' +
      '<a class="btn btn-wa" data-share="whatsapp" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent('Our trip match is ' + top[0].d.n + '! 🌏 Find yours in 6 quick questions: ' + shareUrl()) + '">Share on WhatsApp</a>' +
      '<button type="button" class="btn btn-light2" data-share="copy">Copy link</button></div></div>' +
      '<div class="tf-more"><h3>Also worth a look</h3><ul>' + rest.map(function (r) { return '<li><a href="/destinations/' + esc(r.d.s) + '.html" data-tf="more" data-d="' + esc(r.d.s) + '">' + esc(r.d.n) + '</a></li>'; }).join('') + '</ul></div>' +
      '<p class="tf-note">Costs are rough per-person estimates for a mid-range trip: return economy flights from a major Indian city, a hotel shared by two, food, transport and a few paid sights. Prices and visa rules change, so check before you book. Some links are affiliate links; we may earn a small commission at no extra cost to you.</p></div>';
    box.innerHTML = html;
    try { history.replaceState(null, '', shareUrl()); } catch (e) {}
    track('trip_finder_complete', { destination: top[0].d.s, who: ans.who, days: +ans.days, budget: +ans.budget, month: +ans.month, vibe: ans.vibe, visa: ans.visa, from_link: !!fromLink });
    var h = box.querySelector('h2'); h.setAttribute('tabindex', '-1');
    if (!fromLink) { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); h.focus({ preventScroll: true }); }
  }

  box.addEventListener('click', function (e) {
    var opt = e.target.closest('.tf-opt');
    if (opt) {
      if (!started) { started = true; track('trip_finder_start'); }
      ans[Q[step].key] = opt.getAttribute('data-v');
      [].forEach.call(box.querySelectorAll('.tf-opt'), function (b) { b.setAttribute('aria-pressed', b === opt); });
      setTimeout(function () { step++; if (step < Q.length) renderQuestion(); else renderResults(false); }, 180);
      return;
    }
    if (e.target.closest('.tf-restart')) { ans = {}; step = 0; started = true; try { history.replaceState(null, '', location.pathname); } catch (err) {} renderQuestion(); return; }
    if (e.target.closest('.tf-back')) { if (step > 0) { step--; renderQuestion(); } return; }
    var share = e.target.closest('[data-share]');
    if (share) {
      var method = share.getAttribute('data-share');
      if (method === 'copy') {
        var url = shareUrl();
        var done = function () { share.textContent = 'Link copied ✓'; setTimeout(function () { share.textContent = 'Copy link'; }, 2000); };
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt('Copy this link:', url); });
        else prompt('Copy this link:', url);
      }
      track('trip_finder_share', { method: method });
      return;
    }
    var link = e.target.closest('[data-tf]');
    if (link) track('trip_finder_click', { destination: link.getAttribute('data-d'), link_type: link.getAttribute('data-tf') });
  });

  // Opened from a shared link: show the results straight away
  var params = new URLSearchParams(location.search);
  var valid = Q.every(function (q) { return q.opts.some(function (o) { return o[0] === params.get(q.key); }); });
  if (valid) { Q.forEach(function (q) { ans[q.key] = params.get(q.key); }); step = Q.length; renderResults(true); }
  else renderQuestion();
})();
