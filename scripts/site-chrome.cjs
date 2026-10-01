// Shared site header and footer markup (styled by css/chrome.css, behaviour in js/site.js).
// Used by the page generators and by scripts/apply-site-chrome.cjs.
//   header(current, { cta })  current: 'destinations' | 'videos' | 'blog' | 'about' | ''
//   footer()
//   HEAD_LINKS: stylesheet tags to put in <head>
//   SCRIPT: script tag to put before </body>

const NAV = [
  ['destinations', '/destinations/', 'Destinations'],
  ['videos', '/videos.html', 'Videos'],
  ['blog', '/blog.html', 'Blog'],
  ['about', '/about.html', 'About'],
];

function header(current = '', { cta = '/work-with-us.html' } = {}) {
  const links = NAV.map(([key, href, label]) =>
    `      <a href="${href}"${key === current ? ' aria-current="page"' : ''}>${label}</a>`).join('\n');
  return `<header class="hdr" id="hdr">
  <div class="hdr-wrap hdr-in">
    <a href="/" class="site-brand" aria-label="Love and Layovers home"><img src="/public/images/brand/logo-mark.svg" alt="" width="36" height="36">Love &amp; Layovers</a>
    <button class="menu-btn" id="menuBtn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="siteNav"><span></span><span></span><span></span></button>
    <nav class="site-nav" id="siteNav" aria-label="Main navigation">
${links}
      <a href="${cta}" class="site-cta"${current === 'work' ? ' aria-current="page"' : ''}>Work with us</a>
    </nav>
  </div>
</header>`;
}

function footer() {
  return `<footer class="ftr">
  <div class="ftr-wrap">
    <div class="ftr-top">
      <a href="/" class="site-brand"><img src="/public/images/brand/logo-mark-light.svg" alt="" width="30" height="30">Love &amp; Layovers</a>
      <nav class="ftr-links" aria-label="Footer">
        <a href="/destinations/">Destinations</a><a href="/blog.html">Blog</a><a href="/videos.html">Videos</a><a href="/videos/life-in-singapore.html">Life in Singapore</a><a href="/work-with-us.html">Work with us</a><a href="/about.html">About</a>
      </nav>
      <div class="ftr-social">
        <a href="https://www.youtube.com/@nikita_sanket_mane?sub_confirmation=1" target="_blank" rel="noopener" aria-label="YouTube">▶ YouTube</a>
        <a href="https://www.instagram.com/loveandlayover" target="_blank" rel="noopener" aria-label="Instagram">◎ Instagram</a>
      </div>
    </div>
    <div class="ftr-bottom">
      <span>&copy; <span id="year">${new Date().getUTCFullYear()}</span> Love and Layovers · Sanket &amp; Nikita · <a href="/credits.html">Photo credits</a></span>
      <a class="mail" href="mailto:theloveandlayover@gmail.com">theloveandlayover@gmail.com</a>
    </div>
  </div>
</footer>`;
}

const HEAD_LINKS = '<link rel="stylesheet" href="/css/chrome.css?v=3">';
const SCRIPT = '<script src="/js/site.js?v=2"></script>';

module.exports = { header, footer, HEAD_LINKS, SCRIPT };

// CLI: node scripts/site-chrome.cjs header <current> [cta] | footer
if (require.main === module) {
  const [what, current, cta] = process.argv.slice(2);
  process.stdout.write(what === 'footer' ? footer() : header(current || '', cta ? { cta } : {}));
}
