// Shared site header and footer markup (styled by css/chrome.css, behaviour in js/site.js).
// Used by the page generators and by scripts/apply-site-chrome.cjs.
//   header(current, { cta })  current: 'destinations' | 'videos' | 'blog' | 'about' | ''
//   footer()
//   HEAD_LINKS: stylesheet tags to put in <head>
//   SCRIPT: script tag to put before </body>

// Opens a WhatsApp chat with us (+65 8896 4156) with a short greeting filled in
const WHATSAPP = 'https://wa.me/6588964156?text=Hi%20Sanket%20%26%20Nikita%21%20I%20found%20you%20on%20loveandlayover.in%20and%20wanted%20to%20get%20in%20touch.';

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
        <a href="${WHATSAPP}" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="vertical-align:-2px"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-.9 1.2-.3.2-.6.1a8.2 8.2 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.6l.5-.5.3-.5a.6.6 0 0 0 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1 2.5 5.9 5.9 0 0 0 1.2 3.1 13.5 13.5 0 0 0 5.2 4.6c1.9.8 2.7.9 3.6.7a3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.1-.3-.2-.6-.4M12 21.8a9.9 9.9 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.9 9.9 0 1 1 12 21.8m8.4-18.3A11.8 11.8 0 0 0 1.8 17.7L.1 24l6.4-1.7A11.8 11.8 0 0 0 12 23.7 11.8 11.8 0 0 0 20.4 3.5"/></svg> WhatsApp</a>
      </div>
    </div>
    <div class="ftr-bottom">
      <span>&copy; <span id="year">${new Date().getUTCFullYear()}</span> Love and Layovers · Sanket &amp; Nikita · <a href="/credits.html">Photo credits</a></span>
      <a class="mail" href="mailto:theloveandlayover@gmail.com">theloveandlayover@gmail.com</a>
    </div>
  </div>
</footer>`;
}

const HEAD_LINKS = '<link rel="stylesheet" href="/css/chrome.css?v=4">';
const SCRIPT = '<script src="/js/site.js?v=3"></script>';

module.exports = { header, footer, HEAD_LINKS, SCRIPT, WHATSAPP };

// CLI: node scripts/site-chrome.cjs header <current> [cta] | footer
if (require.main === module) {
  const [what, current, cta] = process.argv.slice(2);
  process.stdout.write(what === 'footer' ? footer() : header(current || '', cta ? { cta } : {}));
}
