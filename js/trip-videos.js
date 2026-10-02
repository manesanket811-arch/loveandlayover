/**
 * Trip Videos
 * Fills <div class="trip-videos-grid" data-keywords="malaysia,genting"> with every
 * video from /videos-data.json whose title or opening paragraph mentions one of
 * the keywords, oldest first so the episodes read in trip order. Each card opens
 * the video on YouTube. The server-rendered cards stay if nothing matches or the
 * data can't be loaded.
 */
(function() {
  'use strict';

  var CSS = '' +
    '.trip-videos-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px;margin:20px 0}' +
    '.trip-video{display:flex;flex-direction:column;background:#fff;border:1px solid #e8e2d9;border-radius:14px;overflow:hidden;text-decoration:none;color:#0a1628;transition:transform .2s,box-shadow .2s}' +
    '.trip-video:hover{transform:translateY(-3px);box-shadow:0 10px 26px rgba(10,22,40,.12)}' +
    '.trip-video-thumb{position:relative;aspect-ratio:16/9;background:#0a1628;overflow:hidden}' +
    '.trip-video-thumb img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.trip-video-thumb .tv-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:54px;height:38px;border-radius:10px;background:#ff0000;color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center}' +
    '.trip-video-thumb .tv-len{position:absolute;right:8px;bottom:8px;background:rgba(10,22,40,.85);color:#fff;font-size:.72rem;font-weight:700;padding:3px 7px;border-radius:6px}' +
    '.trip-video-body{padding:12px 14px 14px}' +
    '.trip-video-body b{display:block;font-size:.95rem;line-height:1.35}' +
    '.trip-video-body span{display:block;margin-top:6px;font-size:.82rem;font-weight:600;color:#d4691d}';

  function isShort(v) { return v.duration === '< 1 min'; }
  function cleanTitle(t) {
    return t.replace(/#[\p{L}\p{N}_]+/gu, '').replace(/\s*\|\s*$/, '').replace(/\s{2,}/g, ' ').trim() || t;
  }
  // Title plus the first paragraph only: the footer of every description links
  // to shared playlists, which would match unrelated videos.
  function about(v) {
    var d = (v.fullDescription || v.description || '').split(/\n\s*\n/)[0];
    return (v.title + ' ' + d).toLowerCase();
  }

  function card(v) {
    var short = isShort(v);
    var a = document.createElement('a');
    a.className = 'trip-video';
    a.href = short ? 'https://www.youtube.com/shorts/' + encodeURIComponent(v.id) : 'https://www.youtube.com/watch?v=' + encodeURIComponent(v.id);
    a.target = '_blank';
    a.rel = 'noopener';
    var thumb = document.createElement('div');
    thumb.className = 'trip-video-thumb';
    var img = document.createElement('img');
    img.src = 'https://i.ytimg.com/vi/' + encodeURIComponent(v.id) + '/hqdefault.jpg';
    img.alt = '';
    img.loading = 'lazy';
    thumb.appendChild(img);
    var play = document.createElement('span');
    play.className = 'tv-play';
    play.setAttribute('aria-hidden', 'true');
    play.textContent = '▶';
    thumb.appendChild(play);
    var len = document.createElement('span');
    len.className = 'tv-len';
    len.textContent = short ? 'Short' : v.duration;
    thumb.appendChild(len);
    var body = document.createElement('div');
    body.className = 'trip-video-body';
    var b = document.createElement('b');
    b.textContent = cleanTitle(v.title);
    var s = document.createElement('span');
    s.textContent = 'Watch on YouTube →';
    body.appendChild(b);
    body.appendChild(s);
    a.appendChild(thumb);
    a.appendChild(body);
    a.addEventListener('click', function() {
      if (window.gtag) window.gtag('event', 'trip_video_click', { video_id: v.id });
    });
    return a;
  }

  function init() {
    var grids = document.querySelectorAll('.trip-videos-grid[data-keywords]');
    if (!grids.length) return;
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    fetch('/videos-data.json').then(function(r) { return r.json(); }).then(function(videos) {
      grids.forEach(function(grid) {
        var keys = grid.getAttribute('data-keywords').toLowerCase().split(',').map(function(k) { return k.trim(); }).filter(Boolean);
        var list = videos.filter(function(v) {
          var text = about(v);
          return keys.some(function(k) { return text.indexOf(k) !== -1; });
        }).sort(function(a, b) { return new Date(a.published) - new Date(b.published); });
        if (!list.length) return;
        grid.textContent = '';
        list.forEach(function(v) { grid.appendChild(card(v)); });
      });
    }).catch(function() {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
