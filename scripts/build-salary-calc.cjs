// Build singapore-salary-calculator.html: Singapore salary, Employment Pass and take-home
// calculator for Indians. Figures match our job and salary guides (as of November 2026).
// Update the RULES block when MOM changes the tables, then run:
//   node scripts/build-salary-calc.cjs
const fs = require('fs');
const path = require('path');
const { header, footer, HEAD_LINKS, SCRIPT, GA, FONTS } = require('./site-chrome.cjs');

const { REPO, SITE_DIR: ROOT } = require('./paths.cjs');  // ROOT = the published site folder
const SITE = 'https://www.loveandlayover.in';
const URL_ = `${SITE}/singapore-salary-calculator.html`;
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---- Rules (MOM / IRAS, as of November 2026) ----
const RULES = {
  // Employment Pass minimum qualifying salary: [youngest band (age 23 and below), age 45+]
  ep: { now: { gen: [5600, 10700], fin: [6200, 11800] }, y2027: { gen: [6000, 11500], fin: [6600, 12700] } },
  // S Pass: current table [youngest, 45+]; 2027 only the starting figure is announced
  sp: { now: { gen: [3300, 4800], fin: [3800, 5650] }, y2027: { gen: [3600, null], fin: [4000, null] } },
  dp: 6000, ltvpParents: 12000, compassExempt: 22500, onePass: 30000,
  // Resident income tax (YA2024 onwards): [upper bound of band, rate]
  tax: [[20000, 0], [30000, .02], [40000, .035], [80000, .07], [120000, .115], [160000, .15], [200000, .18], [240000, .19], [280000, .195], [320000, .2], [500000, .22], [1000000, .23], [1e15, .24]],
  inr: 70,
  // Monthly costs (S$ low–high), from our living and salary guides
  rent: { room: [900, 2000], hdb: [2800, 4000], condo: [3200, 5500], none: [0, 0] },
  living: { single: [700, 1400], couple: [1100, 2300], family: [1500, 2800] },
  extraChild: [400, 700],
  school: { none: [0, 0], local: [1000, 1000], intl: [1700, 3300] },
};

const title = 'Singapore Salary & EP Calculator 2026–27 for Indians';
const desc = 'Check Employment Pass eligibility for 2026 and 2027, take-home pay after tax, family passes and how much you can save in Singapore, in S$ and rupees.';
const faq = [
  ['What is the minimum salary for an Employment Pass in 2026?', 'S$5,600 a month for the youngest applicants (S$6,200 in financial services), rising with age to S$10,700 (S$11,800) at 45 and above. From 1 January 2027 it rises to S$6,000 (S$6,600), up to S$11,500 (S$12,700) at 45+.'],
  ['How accurate is this calculator?', 'The Employment Pass and S Pass minimums are MOM figures at the youngest band and at 45+; for ages in between we estimate a straight line, so confirm with MOM\'s Self-Assessment Tool. Tax uses resident rates before reliefs. Living costs are our estimates from life in Singapore.'],
  ['How much tax will I pay on my Singapore salary?', 'Tax residents pay progressive rates from 0% to 24%. On S$6,000 a month with no bonus, that\'s roughly S$2,800 a year before reliefs, so take-home is about S$5,770 a month. Foreigners don\'t contribute to CPF.'],
  ['What salary do I need to bring my family to Singapore?', 'A fixed monthly salary of at least S$6,000 for a Dependant\'s Pass for your spouse and children, and about S$12,000 to sponsor your parents on a Long-Term Visit Pass.'],
  ['Does the calculator include COMPASS?', 'Not fully. COMPASS also scores your salary against local benchmarks for your sector and age, your qualifications and the employer\'s workforce, which we can\'t see. The calculator tells you if you\'re exempt (S$22,500 a month or more).'],
];
const ld = (o) => `<script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n</script>`;

const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${URL_}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${URL_}">
<meta property="og:site_name" content="Love and Layovers">
<meta property="og:image" content="${SITE}/images/og/blog-good-salary-in-singapore.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/images/og/blog-good-salary-in-singapore.jpg">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${FONTS}
${ld({ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Singapore Salary & Employment Pass Calculator', url: URL_, applicationCategory: 'FinanceApplication', operatingSystem: 'Any', description: desc, offers: { '@type': 'Offer', price: '0', priceCurrency: 'SGD' }, publisher: { '@id': `${SITE}/#organization` } })}
${ld({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) })}
${ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
  { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
  { '@type': 'ListItem', position: 2, name: 'Salary & EP calculator', item: URL_ }] })}
${GA}
<link rel="stylesheet" href="/css/site.css?v=1">
<link rel="stylesheet" href="/css/article.css?v=2">
<style>
  .sh { background: var(--navy) url('/images/destinations/clarke-quay-hero.webp') center / cover; position: relative; color: #fff; }
  .sh::before { content: ''; position: absolute; inset: 0; background: linear-gradient(100deg, rgba(10,22,40,.94), rgba(10,22,40,.7) 60%, rgba(10,22,40,.45)); }
  .sh .wrap { position: relative; padding-top: 52px; padding-bottom: 44px; }
  .sh nav { font-size: .85rem; color: rgba(255,255,255,.8); }
  .sh nav a { color: #fff; font-weight: 600; }
  .sh h1 { font-size: clamp(2rem, 4.2vw, 3.1rem); font-weight: 900; margin: 12px 0 10px; max-width: 820px; }
  .sh h1 em { font-style: italic; color: #f0a559; font-weight: 600; }
  .sh p { color: rgba(255,255,255,.85); max-width: 680px; font-size: 1.05rem; }
  .sh .pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
  .sh .pills span { font-size: .82rem; font-weight: 600; padding: 6px 12px; border-radius: 999px; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.22); }
  .calc { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 28px; align-items: start; padding-top: 34px; padding-bottom: 40px; }
  .panel { background: #fff; border: 1px solid var(--line); border-radius: 22px; padding: 24px; box-shadow: var(--shadow-sm); }
  .panel h2 { font-family: var(--sans); font-size: 1.05rem; font-weight: 800; margin-bottom: 14px; }
  .f { margin-bottom: 16px; }
  .f label, .f .lbl { display: block; font-size: .85rem; font-weight: 700; color: var(--ink); margin-bottom: 6px; }
  .f small { display: block; font-size: .78rem; color: var(--muted); margin-top: 5px; }
  .f input[type=number], .f select { width: 100%; height: 46px; border: 1px solid var(--line); border-radius: 12px; padding: 0 12px; font: inherit; background: #fff; color: var(--ink); }
  .f input:focus, .f select:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(181,86,26,.12); }
  .money { position: relative; }
  .money span { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); font-weight: 600; }
  .money input { padding-left: 38px !important; font-size: 1.15rem !important; font-weight: 700; }
  .seg { display: flex; gap: 6px; flex-wrap: wrap; }
  .seg label { flex: 1; min-width: 90px; margin: 0; }
  .seg input { position: absolute; opacity: 0; pointer-events: none; }
  .seg span { display: block; text-align: center; padding: 10px 8px; border: 1px solid var(--line); border-radius: 12px; font-size: .86rem; font-weight: 600; color: var(--ink-soft); cursor: pointer; transition: all .15s; }
  .seg input:checked + span { background: var(--navy); border-color: var(--navy); color: #fff; }
  .seg input:focus-visible + span { box-shadow: 0 0 0 3px rgba(181,86,26,.25); }
  .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .res { position: sticky; top: 92px; display: flex; flex-direction: column; gap: 14px; }
  .r { background: #fff; border: 1px solid var(--line); border-radius: 18px; padding: 18px 20px; }
  .r-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
  .r-head small { font-size: .72rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
  .r b.big { display: block; font-family: var(--serif); font-size: 2rem; font-weight: 900; line-height: 1.1; margin-top: 6px; color: var(--ink); }
  .r p { font-size: .9rem; color: var(--ink-soft); margin-top: 6px; }
  .badge { font-size: .74rem; font-weight: 800; padding: 5px 10px; border-radius: 999px; white-space: nowrap; }
  .ok { background: #dcfce7; color: #166534; } .no { background: #fee2e2; color: #991b1b; } .mid { background: #fef3c7; color: #92400e; }
  .r-verdict { background: var(--navy); color: #fff; border: 0; }
  .r-verdict .r-head small { color: rgba(255,255,255,.65); }
  .r-verdict b.big { color: #fff; }
  .r-verdict p { color: rgba(255,255,255,.8); }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .fam { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; font-size: .9rem; }
  .fam div { display: flex; justify-content: space-between; gap: 10px; align-items: center; }
  .share { display: flex; gap: 10px; flex-wrap: wrap; }
  .share button, .share a { flex: 1; text-align: center; }
  .note-s { font-size: .78rem; color: var(--muted); }
  @media (max-width: 920px) { .calc { grid-template-columns: 1fr; } .res { position: static; } }
  @media (max-width: 480px) { .grid2, .row2 { grid-template-columns: 1fr; } }
  .explain { padding-bottom: 72px; }
  .explain .post-body { max-width: 820px; }
</style>
${HEAD_LINKS}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>

${header('')}

<main id="main">
<section class="sh">
  <div class="wrap">
    <nav aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/blog/moving-to-singapore-from-india.html">Moving to Singapore</a> › Salary &amp; EP calculator</nav>
    <h1>Singapore salary &amp; <em>Employment Pass</em> calculator</h1>
    <p>Check whether an offer qualifies for an Employment Pass in 2026 and 2027, what you'll take home after tax, whether you can bring your family, and how much you could save.</p>
    <div class="pills"><span>EP &amp; S Pass check</span><span>2026 and 2027 rules</span><span>Take-home in S$ and ₹</span><span>Family passes</span><span>Savings estimate</span></div>
  </div>
</section>

<div class="wrap calc">
  <form class="panel" id="calcForm" onsubmit="return false" aria-label="Your details">
    <h2>Your offer</h2>
    <div class="f">
      <label for="salary">Fixed monthly salary</label>
      <div class="money"><span>S$</span><input type="number" id="salary" name="s" min="0" max="200000" step="100" value="6000" inputmode="numeric"></div>
      <small>Basic monthly salary, before tax, excluding bonus and allowances</small>
    </div>
    <div class="row2">
      <div class="f"><label for="age">Your age</label><input type="number" id="age" name="a" min="18" max="70" value="30" inputmode="numeric"></div>
      <div class="f"><label for="bonus">Annual bonus</label><select id="bonus" name="b"><option value="0">None</option><option value="1">1 month</option><option value="2">2 months</option><option value="3">3 months</option></select></div>
    </div>
    <div class="f"><span class="lbl">Sector</span><div class="seg">
      <label><input type="radio" name="sec" value="gen" checked><span>Most sectors</span></label>
      <label><input type="radio" name="sec" value="fin"><span>Financial services</span></label>
    </div></div>
    <div class="f"><label for="when">When is the EP applied for?</label><select id="when" name="w">
      <option value="now">In 2026 (before 1 January 2027)</option>
      <option value="y2027">From 1 January 2027 (new application)</option>
      <option value="renew28">Renewal of a pass expiring from 1 January 2028</option>
      <option value="renew">Renewal of a pass expiring before 2028</option>
    </select></div>

    <h2 style="margin-top:22px">Your household</h2>
    <div class="f"><span class="lbl">Who's moving</span><div class="seg">
      <label><input type="radio" name="hh" value="single" checked><span>Just me</span></label>
      <label><input type="radio" name="hh" value="couple"><span>Couple</span></label>
      <label><input type="radio" name="hh" value="family"><span>With kids</span></label>
    </div></div>
    <div class="row2" id="kidsRow" hidden>
      <div class="f"><label for="kids">Children</label><select id="kids" name="k"><option>1</option><option>2</option><option>3</option></select></div>
      <div class="f"><label for="school">School</label><select id="school" name="sc"><option value="none">No fees yet</option><option value="local">Local school</option><option value="intl">International</option></select></div>
    </div>
    <div class="f"><label for="home">Housing</label><select id="home" name="h">
      <option value="room">Room in a shared flat</option>
      <option value="hdb">Whole HDB flat</option>
      <option value="condo">Condo</option>
      <option value="none">Paid by employer</option>
    </select></div>
  </form>

  <div class="res" aria-live="polite">
    <div class="r r-verdict"><div class="r-head"><small>Our verdict</small><span class="badge" id="vBadge"></span></div><b class="big" id="vTitle"></b><p id="vText"></p></div>
    <div class="r"><div class="r-head"><small>Employment Pass</small><span class="badge" id="epBadge"></span></div><b class="big" id="epMin"></b><p id="epText"></p></div>
    <div class="grid2">
      <div class="r"><div class="r-head"><small>Take-home / month</small></div><b class="big" id="takeHome"></b><p id="takeHomeInr"></p></div>
      <div class="r"><div class="r-head"><small>Could save / month</small></div><b class="big" id="save"></b><p id="saveInr"></p></div>
    </div>
    <div class="r"><div class="r-head"><small>Family passes</small></div><div class="fam">
      <div><span>Spouse &amp; children (Dependant's Pass)</span><span class="badge" id="dpBadge"></span></div>
      <div><span>Parents (Long-Term Visit Pass)</span><span class="badge" id="ltvpBadge"></span></div>
    </div></div>
    <div class="r"><div class="r-head"><small>Monthly costs</small></div><b class="big" id="costs" style="font-size:1.5rem"></b><p id="costText"></p></div>
    <div class="share"><button class="btn btn-ghost" type="button" id="copyLink">Copy link to these results</button><a class="btn btn-primary" id="waShare" target="_blank" rel="noopener" href="#">Share on WhatsApp</a></div>
    <p class="note-s">Estimates only, as of November 2026. Confirm work pass eligibility with MOM's <a href="https://www.mom.gov.sg/eservices/services/employment-s-pass-self-assessment-tool" target="_blank" rel="noopener">Self-Assessment Tool</a>. Tax uses resident rates before reliefs.</p>
  </div>
</div>

<section class="explain">
  <div class="wrap">
    <article class="post-body">
      <h2 id="how-it-works">How the calculator works</h2>
      <h3>Employment Pass minimum salary</h3>
      <div class="table-wrap"><table>
        <tr><th></th><th>Applying in 2026</th><th>From 1 Jan 2027</th></tr>
        <tr><td>Most sectors, youngest applicants</td><td>S$5,600</td><td>S$6,000</td></tr>
        <tr><td>Most sectors, age 45+</td><td>S$10,700</td><td>S$11,500</td></tr>
        <tr><td>Financial services, youngest</td><td>S$6,200</td><td>S$6,600</td></tr>
        <tr><td>Financial services, age 45+</td><td>S$11,800</td><td>S$12,700</td></tr>
      </table></div>
      <p>The amount rises gradually with age between those points; for ages 24–44 the calculator estimates it on a straight line. The 2027 figures apply to new applications from 1 January 2027 and renewals of passes expiring from 1 January 2028. Your application must also pass <strong>COMPASS</strong>, which scores your salary against local benchmarks, your qualifications and the employer's workforce. Salaries of S$22,500 or more are exempt. More in our <a href="/blog/how-to-get-a-job-in-singapore.html">guide to getting a job in Singapore</a>.</p>
      <h3>Take-home pay</h3>
      <p>Foreigners don't pay into CPF, so your take-home is your salary minus income tax. Once you're a tax resident (usually 183+ days in Singapore in a year), rates run from 0% on the first S$20,000 a year to 24% on income above S$1 million. Tax is paid once a year, so set it aside monthly. Reliefs such as earned income relief would lower it slightly.</p>
      <h3>Living costs</h3>
      <p>Rent and living costs are ranges from our own life in Singapore and our <a href="/blog/good-salary-in-singapore.html">salary guide</a>: a room S$900–2,000, a whole HDB flat S$2,800–4,000, a condo S$3,200–5,500, plus groceries, eating out, utilities, phone and transport. Rupee figures use about ₹70 per S$1.</p>
      <h2 id="faq">FAQs</h2>
      <div class="post-faq">
${faq.map(([q, a]) => `        <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
      </div>
      <h2 id="more">Plan your move</h2>
      <p>Next steps: <a href="/blog/moving-to-singapore-from-india.html">moving to Singapore from India</a>, <a href="/blog/renting-a-flat-in-singapore.html">renting a flat</a>, the <a href="/blog/first-30-days-in-singapore.html">first 30 days checklist</a> and <a href="/blog/singapore-changes-2027-for-indians.html">what's changing in 2027</a>.</p>
    </article>
  </div>
</section>
</main>

${footer()}

${SCRIPT}
<script>
(function () {
  var R = ${JSON.stringify(RULES)};
  var f = document.getElementById('calcForm');
  var $ = function (id) { return document.getElementById(id); };
  var sgd = function (n) { return 'S$' + Math.round(n).toLocaleString('en-US'); };
  var inr = function (n) { var v = Math.round(n * R.inr); return (v < 0 ? '−' : '') + '₹' + (Math.abs(v) >= 100000 ? (Math.abs(v) / 100000).toFixed(1) + ' lakh' : Math.abs(v).toLocaleString('en-IN')); };
  var val = function (name) { var el = f.querySelector('[name="' + name + '"]:checked') || f.elements[name]; return el ? el.value : ''; };
  function interp(range, age) {
    if (age <= 23 || range[1] == null) return range[0];
    if (age >= 45) return range[1];
    return Math.round((range[0] + (range[1] - range[0]) * (age - 23) / 22) / 10) * 10;
  }
  function tax(annual) {
    var t = 0, prev = 0;
    for (var i = 0; i < R.tax.length; i++) { var top = R.tax[i][0]; if (annual > prev) t += (Math.min(annual, top) - prev) * R.tax[i][1]; prev = top; }
    return t;
  }
  function badge(el, cls, text) { el.className = 'badge ' + cls; el.textContent = text; }

  function calc() {
    var s = Math.max(0, +$('salary').value || 0), age = Math.min(70, Math.max(18, +$('age').value || 30));
    var sec = val('sec'), when = $('when').value, bonus = +$('bonus').value, hh = val('hh');
    var table = (when === 'y2027' || when === 'renew28') ? 'y2027' : 'now';
    var label2027 = table === 'y2027' ? '2027 rules' : 'current rules';
    $('kidsRow').hidden = hh !== 'family';

    // Employment Pass
    var epMin = interp(R.ep[table][sec], age), exact = age <= 23 || age >= 45;
    $('epMin').textContent = (exact ? '' : '≈ ') + sgd(epMin) + ' minimum';
    var spMin = interp(R.sp[table][sec], age), spTop = R.sp[table][sec][1];
    var epOk = s >= epMin;
    if (epOk) badge($('epBadge'), 'ok', 'Meets EP minimum');
    else badge($('epBadge'), 'no', 'Below EP minimum');
    var t = 'For age ' + age + ' in ' + (sec === 'fin' ? 'financial services' : 'most sectors') + ' (' + label2027 + '). ';
    if (s >= R.onePass) t += 'At S$30,000+ you may also qualify for the ONE Pass. ';
    if (s >= R.compassExempt) t += 'You are exempt from COMPASS. ';
    else if (epOk) t += 'The application still has to pass COMPASS; a salary well above the minimum scores better. ';
    else if (s >= spMin) t += 'It may qualify for an S Pass instead (minimum ' + (spTop == null && age > 23 ? 'from ' : '') + sgd(spMin) + (spTop == null && age > 23 ? ', higher with age' : '') + '), subject to the employer\\'s quota. ';
    else t += 'It is also below the S Pass minimum (' + (spTop == null ? 'from ' : '') + sgd(spMin) + '). ';
    if (!exact) t += 'Age-based figure estimated; confirm with MOM.';
    $('epText').textContent = t;

    // Take-home
    var annual = s * (12 + bonus), tx = tax(annual), net = (annual - tx) / 12;
    $('takeHome').textContent = sgd(net);
    $('takeHomeInr').textContent = '≈ ' + inr(net) + ' · tax ≈ ' + sgd(tx) + '/year' + (bonus ? ' · incl. bonus, averaged' : '');

    // Family
    badge($('dpBadge'), s >= R.dp ? 'ok' : 'no', s >= R.dp ? 'Eligible' : 'Needs S$6,000');
    badge($('ltvpBadge'), s >= R.ltvpParents ? 'ok' : 'no', s >= R.ltvpParents ? 'Eligible' : 'Needs S$12,000');

    // Costs
    var home = $('home').value, kids = hh === 'family' ? +$('kids').value : 0, school = hh === 'family' ? $('school').value : 'none';
    var rent = R.rent[home], live = R.living[hh].slice();
    if (kids > 2) { live[0] += (kids - 2) * R.extraChild[0]; live[1] += (kids - 2) * R.extraChild[1]; }
    var sch = [R.school[school][0] * kids, R.school[school][1] * kids];
    var lo = rent[0] + live[0] + sch[0], hi = rent[1] + live[1] + sch[1];
    $('costs').textContent = sgd(lo) + ' – ' + sgd(hi).replace('S$', '');
    $('costText').textContent = 'Rent ' + (home === 'none' ? 'covered' : sgd(rent[0]) + '–' + sgd(rent[1]).replace('S$', '')) + ' · living ' + sgd(live[0]) + '–' + sgd(live[1]).replace('S$', '') + (sch[1] ? ' · school ' + sgd(sch[0]) + (sch[1] !== sch[0] ? '–' + sgd(sch[1]).replace('S$', '') : '') : '');

    // Savings and verdict
    var sLo = net - hi, sHi = net - lo;
    var fmtSave = function (n) { return (n < 0 ? '−' : '') + sgd(Math.abs(n)); };
    $('save').textContent = sLo < 0 ? fmtSave(sLo) + ' to ' + fmtSave(sHi) : fmtSave(sLo) + ' – ' + fmtSave(sHi).replace('S$', '');
    $('saveInr').textContent = '≈ ' + inr(sLo) + ' to ' + inr(sHi);
    var v, vt, vc, mid = (sLo + sHi) / 2, spOk = s >= spMin;
    if (sLo >= 1000 || mid >= 2000) { v = 'Comfortable'; vc = 'ok'; vt = 'You could save around ' + sgd(Math.max(sLo, 0)) + '–' + sgd(sHi).replace('S$', '') + ' a month for this household and housing.'; }
    else if (mid >= 700) { v = 'Workable'; vc = 'mid'; vt = 'Comfortable if rent and spending stay towards the lower end; tight at the top end.'; }
    else if (mid >= -500) { v = 'Tight'; vc = 'mid'; vt = 'You’d save little. Consider cheaper housing or negotiate a housing or education allowance.'; }
    else { v = 'Not enough'; vc = 'no'; vt = 'Costs are likely to be higher than your take-home pay for this household and housing.'; }
    if (!epOk && !spOk) { v = 'Doesn’t qualify for a work pass'; vc = 'no'; vt = 'The salary is below both the Employment Pass and S Pass minimums for your age. Negotiate a higher offer, or check the exact figure with MOM.'; }
    else if (!epOk) { vt = 'Below the Employment Pass minimum, so this would need an S Pass (employer quota and levy apply). Affordability: ' + v.toLowerCase() + '. ' + vt; v = 'S Pass route only'; vc = 'mid'; }
    if (hh !== 'single' && s < R.dp) { v = 'Family can’t join on a DP'; vc = 'no'; vt = 'Your spouse and children need you to earn at least S$6,000 a month fixed for a Dependant’s Pass.' + (!epOk ? ' The salary is also below the Employment Pass minimum.' : ''); }
    $('vTitle').textContent = v; $('vText').textContent = vt; badge($('vBadge'), vc, epOk ? 'EP ✓' : 'EP ✗');

    // Shareable URL
    var p = new URLSearchParams({ s: s, a: age, b: bonus, sec: sec, w: when, hh: hh, h: home });
    if (hh === 'family') { p.set('k', kids); p.set('sc', school); }
    history.replaceState(null, '', location.pathname + '?' + p.toString());
    $('waShare').href = 'https://wa.me/?text=' + encodeURIComponent('Singapore salary check: ' + sgd(s) + '/month → ' + v + ' (take-home ' + sgd(net) + '). Try it: ' + location.href);
  }

  // Restore from the URL
  var q = new URLSearchParams(location.search);
  [['s', 'salary'], ['a', 'age'], ['b', 'bonus'], ['w', 'when'], ['h', 'home'], ['k', 'kids'], ['sc', 'school']].forEach(function (m) { if (q.get(m[0]) !== null && $(m[1])) $(m[1]).value = q.get(m[0]); });
  ['sec', 'hh'].forEach(function (n) { var v = q.get(n), el = v && f.querySelector('[name="' + n + '"][value="' + v + '"]'); if (el) el.checked = true; });

  var tracked = false;
  f.addEventListener('input', function () { calc(); if (!tracked && window.gtag) { gtag('event', 'salary_calc_use'); tracked = true; } });
  f.addEventListener('change', calc);
  $('copyLink').addEventListener('click', function () {
    var b = this;
    (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject()).then(function () { b.textContent = 'Link copied ✓'; setTimeout(function () { b.textContent = 'Copy link to these results'; }, 2000); }, function () { prompt('Copy this link:', location.href); });
  });
  calc();
})();
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'singapore-salary-calculator.html'), page);
console.log('singapore-salary-calculator.html built');
