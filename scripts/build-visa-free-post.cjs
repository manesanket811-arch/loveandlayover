// Generate data/posts/visa-free-countries-for-indians.json from the destination guides'
// visa notes (badges.visaType + the "Visa for Indians" line in each guide's essentials),
// so the post always matches the guides and the visa checker. Keeps the existing
// "modified" date unless the content changed. Run by scripts/build-all.cjs.
const fs=require('fs');const path=require('path');const {loadGuides,fmt}=require('./guide-data.cjs');
const G=loadGuides().filter(d=>d.slug!=='india'&&d.slug!=='indonesia');
function visaText(d){const es=(d.g.sections.find(s=>s.id==='essentials')||{}).html||'';
 const m=es.match(/<(p|li)>\s*<strong>[^<]*(?:Entry|Visa|visa)[^<]*<\/strong>:?\s*([\s\S]*?)<\/\1>/);
 let t=m?m[2].trim():'';t=t.charAt(0).toUpperCase()+t.slice(1);
 return t.replace(/\s*Rules as of [^.]*\.?\s*(always|Always)[^.]*\./,'').replace(/\s*(Rules|Requirements) (change|can change)[^.]*\./i,'').replace(/<a [^>]*>([^<]*)<\/a>/g,'$1').trim();}
const sec=(type)=>G.filter(d=>d.visaType===type).sort((a,b)=>a.name.localeCompare(b.name)).map(d=>
 `<div class="place"><h3>${d.name} <small>Best ${d.best.replace(/-/g,'–')}</small></h3><p>${visaText(d)}</p><div class="facts"><span>About ₹${fmt(d.inr.lo)}–${fmt(d.inr.hi)} a day</span><span><a href="/destinations/${d.slug}.html">${d.name} guide</a></span></div></div>`).join('\n');
const names=t=>G.filter(d=>d.visaType===t).map(d=>d.name).sort();
const list=a=>a.slice(0,-1).join(', ')+' and '+a.at(-1);
const body=`<p class="lead">An Indian passport opens more doors than many people think. Across the countries we cover, a good number let Indians in without arranging a visa in advance, a few give a visa on arrival, and many others offer an online e-visa. Here's the full list, with what each one actually needs.</p>
<div class="tip"><b>Check before you book</b>Visa rules change, sometimes with little notice. Everything here was reviewed in ${'November 2026'}, but always confirm on the official government or embassy website before you pay for flights.</div>

<h2>The quick list</h2>
<div class="table-wrap">
<table>
<tr><th>Entry type</th><th>Countries</th></tr>
<tr><td><strong>Visa-free</strong></td><td>${list(names('free'))}</td></tr>
<tr><td><strong>Visa on arrival</strong></td><td>${list(names('arrival'))}</td></tr>
<tr><td><strong>e-Visa online</strong></td><td>${list(names('evisa'))}</td></tr>
</table>
</div>
<p>Want to check a specific country, including the ones that need a visa in advance? Use our <a href="/visa-checker.html">visa checker</a>.</p>
<div class="tip"><b>Malaysia change</b>Malaysia's visa-free entry for Indians ends on 31 December 2026. From 1 January 2027 you need a visa before arrival, applied for on the MyVISA portal from 1 December 2026. Details in our <a href="/blog/malaysia-visa-for-indians-2027.html">Malaysia visa guide for 2027</a>.</div>

<h2>Visa-free countries for Indians</h2>
<p>No visa to arrange before you fly, though some ask for a free online form or a permit on arrival.</p>
${sec('free')}

<h2>Visa on arrival for Indians</h2>
<p>You get the visa at the airport when you land, usually for a fee. Carry your return ticket, hotel booking and some cash in US dollars or the local currency.</p>
${sec('arrival')}

<h2>Countries with an online e-visa</h2>
<p>Apply online before you travel. Many are quick and simple, like Vietnam, Sri Lanka and Azerbaijan. Others are stricter: Japan asks for the same documents as a regular visa, and Turkey's e-visa is only for Indians who hold certain other visas. Always use the official government website, as many look-alike sites charge extra.</p>
${sec('evisa')}

<h2>Tips for smooth entry</h2>
<ul>
<li>Your passport should be valid for at least 6 months from your arrival date, with blank pages.</li>
<li>Carry printed copies of your return ticket, hotel bookings and any e-visa or arrival card.</li>
<li>"Visa-free" still means immigration can ask how long you're staying and where. Have your plans ready.</li>
<li>Some countries need a free online arrival card before you land (Thailand's TDAC, for example). Do it a day or two before.</li>
<li>Travel insurance is wise everywhere, and required for some visas.</li>
</ul>

<h2>Which one should you pick?</h2>
<p>For a first trip abroad with no visa fuss, Thailand, Nepal and Hong Kong are easy wins. For a short luxury trip, Qatar and the Maldives are close to home. Not sure? Try our <a href="/trip-finder.html">trip finder quiz</a> or browse every <a href="/destinations/">destination guide</a>, where you can filter by easy visa and the best time to go.</p>`;
const free=names('free'),arr=names('arrival'),ev=names('evisa');
const p={slug:'visa-free-countries-for-indians',title:'Visa-Free Countries for Indians: Easy Trips in 2026',
description:'Which countries can Indians visit without a visa, with a visa on arrival or a quick e-visa? Full list with entry rules, best time and daily costs.',
h1:'Visa-Free and Visa-on-Arrival Countries for Indians',h1Html:'<em style="font-style:italic;color:#f0a559">Visa-Free</em> and Visa-on-Arrival Countries for Indians',
crumb:'Visa-free countries',dek:'Where an Indian passport can take you with little or no paperwork, with entry rules, the best months and costs in rupees.',
read:9,hero:'maldives-hero',videoKeywords:'travel,trip,visa,thailand,malaysia',about:[{'@type':'Thing',name:'Visa requirements for Indian citizens'}],
related:['singapore-visa-for-indians','bali-vs-thailand','southeast-asia-budget-tips'],published:'2026-11-16',modified:'2026-11-19',body,
faq:[['Which countries can Indians visit without a visa?',`From the countries we cover, Indians can currently visit ${list(free)} without arranging a visa in advance. Some ask for a free online registration or a permit, so check each country's details.`],
['Which countries give Indians a visa on arrival?',`${list(arr)} offer a visa on arrival for Indian tourists, usually for a fee paid when you land.`],
['Which countries offer Indians an online e-visa?',`${list(ev)} offer an online e-visa or travel authorisation. Requirements vary: some are quick, while Japan needs full documents and Turkey's e-visa depends on holding another visa. Always apply on the official government website.`],
['Is Dubai visa-free for Indians?','No. Most Indians need a UAE tourist e-visa, applied for online. Indians with a valid US visa or green card, or a UK or EU residence permit or visa, may be eligible for a visa on arrival.']]};
const OUT=path.join(__dirname,'..','data','posts','visa-free-countries-for-indians.json');
const old=fs.existsSync(OUT)?JSON.parse(fs.readFileSync(OUT,'utf8')):null;
const today=new Date(Date.now()+8*3600e3).toISOString().slice(0,10);
p.modified=old&&old.body===p.body&&JSON.stringify(old.faq)===JSON.stringify(p.faq)?old.modified:today;
if(old&&old.published)p.published=old.published;
const out=JSON.stringify(p,null,2)+'\n';
if(!old||fs.readFileSync(OUT,'utf8')!==out)fs.writeFileSync(OUT,out);
console.log(`visa-free-countries-for-indians.json: ${free.length} visa-free, ${arr.length} on arrival, ${ev.length} e-visa (modified ${p.modified})`);
