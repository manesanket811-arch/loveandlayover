// Live weather and rupee exchange rate box on destination guides (#live).
// Weather: Open-Meteo (free, no key, CC BY 4.0). Rates: ExchangeRate-API open access.
// The box stays hidden unless at least one of the two loads, and results are cached
// for the browser session so moving between guides doesn't refetch.
(function () {
  var box = document.getElementById('live');
  if (!box || !window.fetch) return;
  var d = box.dataset;

  function get(key, ttl, url) {
    try {
      var c = JSON.parse(sessionStorage.getItem(key));
      if (c && Date.now() - c.t < ttl) return Promise.resolve(c.v);
    } catch (e) {}
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (v) { try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v: v })); } catch (e) {} return v; });
  }
  function show(sel, html) { var el = box.querySelector(sel); if (el) el.innerHTML = html; }
  function reveal(part) { box.hidden = false; box.querySelector(part).hidden = false; }

  // WMO weather codes → words
  function sky(c) {
    if (c === 0) return ['☀️', 'Clear sky'];
    if (c <= 2) return ['🌤️', 'Partly cloudy'];
    if (c === 3) return ['☁️', 'Cloudy'];
    if (c === 45 || c === 48) return ['🌫️', 'Foggy'];
    if (c >= 51 && c <= 57) return ['🌦️', 'Drizzle'];
    if ((c >= 61 && c <= 67) || (c >= 80 && c <= 82)) return ['🌧️', 'Rain'];
    if ((c >= 71 && c <= 77) || c === 85 || c === 86) return ['❄️', 'Snow'];
    if (c >= 95) return ['⛈️', 'Thunderstorms'];
    return ['🌡️', ''];
  }

  get('wx:' + d.lat + ',' + d.lon, 30 * 60e3, 'https://api.open-meteo.com/v1/forecast?latitude=' + d.lat + '&longitude=' + d.lon +
      '&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto')
    .then(function (w) {
      var cur = w.current, day = w.daily;
      if (!cur || typeof cur.temperature_2m !== 'number') return;
      var s = sky(cur.weather_code);
      var local = new Date(Date.now() + (w.utc_offset_seconds || 0) * 1000);
      var hh = local.getUTCHours(), mm = ('0' + local.getUTCMinutes()).slice(-2);
      var time = (hh % 12 || 12) + ':' + mm + (hh < 12 ? ' am' : ' pm');
      show('[data-w]', '<span aria-hidden="true">' + s[0] + '</span> ' + Math.round(cur.temperature_2m) + '°C' + (s[1] ? ', ' + s[1].toLowerCase() : ''));
      var range = day && day.temperature_2m_min ? 'Today ' + Math.round(day.temperature_2m_min[0]) + '–' + Math.round(day.temperature_2m_max[0]) + '°C · ' : '';
      show('[data-w2]', range + 'local time ' + time);
      reveal('.live-w');
    }).catch(function () {});

  if (d.cur) {
    get('fx:INR', 6 * 3600e3, 'https://open.er-api.com/v6/latest/INR')
      .then(function (r) {
        var rate = r && r.rates && r.rates[d.cur];
        if (!rate) return;
        var perUnit = 1 / rate; // rupees for one unit of the local currency
        var k = Math.max(1, Math.pow(10, Math.ceil(Math.log10(10 / perUnit))));
        var money = function (n, cur, dp) {
          try { return new Intl.NumberFormat(cur === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: cur, maximumFractionDigits: dp, minimumFractionDigits: 0 }).format(n); }
          catch (e) { return cur + ' ' + Math.round(n); }
        };
        var inr = k * perUnit;
        show('[data-r]', money(k, d.cur, 0) + ' = ' + money(inr, 'INR', inr < 100 ? 1 : 0));
        show('[data-r2]', money(1000, 'INR', 0) + ' = ' + money(1000 * rate, d.cur, 1000 * rate < 100 ? 2 : 0) + ' · updated daily');
        reveal('.live-r');
        box.querySelector('[data-fx-src]').hidden = false;
      }).catch(function () {});
  }
})();
