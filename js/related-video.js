/**
 * Related Video
 * Fills <aside class="ll-video" data-keywords="singapore,marina bay"> with the
 * best-matching long-form video from /videos-data.json (falls back to the
 * latest one). The thumbnail swaps to the YouTube player on click, so the
 * page doesn't load YouTube until the reader asks for it.
 */
(function() {
  'use strict';

  var CHANNEL_SUBSCRIBE = 'https://www.youtube.com/@nikita_sanket_mane?sub_confirmation=1';

  var CSS = '' +
    '.ll-video{margin:32px 0;padding:20px;border-radius:14px;background:#fff;border:1px solid #e8e2d9;box-shadow:0 8px 24px rgba(10,22,40,.08)}' +
    '.ll-video-label{font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#d4691d;margin:0 0 6px}' +
    '.ll-video-title{font-size:1.1rem;font-weight:700;line-height:1.35;margin:0 0 14px;color:#0a1628}' +
    '.ll-video-player{position:relative;width:100%;aspect-ratio:16/9;border-radius:10px;overflow:hidden;background:#0a1628;cursor:pointer;border:0;padding:0;display:block}' +
    '.ll-video-player img{width:100%;height:100%;object-fit:cover;display:block;opacity:.92;transition:opacity .2s}' +
    '.ll-video-player:hover img{opacity:1}' +
    '.ll-video-player .ll-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:68px;height:48px;border-radius:12px;background:#ff0000;color:#fff;font-size:22px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.3)}' +
    '.ll-video-player iframe{position:absolute;inset:0;width:100%;height:100%;border:0}' +
    '.ll-video-links{display:flex;flex-wrap:wrap;gap:10px 18px;margin-top:14px;font-size:.9rem;font-weight:600}' +
    '.ll-video-links a{color:#d4691d;text-decoration:none}' +
    '.ll-video-links a.ll-sub{background:#d4691d;color:#fff;padding:8px 14px;border-radius:8px}' +
    '.ll-video-links a:hover{text-decoration:underline}';

  function isShort(v) { return v.duration === '< 1 min'; }

  function cleanTitle(t) {
    return t.replace(/#[\p{L}\p{N}_]+/gu, '').replace(/\s*\|\s*$/, '').replace(/\s{2,}/g, ' ').trim() || t;
  }

  function pick(videos, keywords) {
    var long = videos.filter(function(v) { return !isShort(v); });
    var pool = long.length ? long : videos;
    var best = null, bestScore = 0;
    pool.forEach(function(v) {
      var text = (v.title + ' ' + (v.fullDescription || v.description || '')).toLowerCase();
      var score = keywords.filter(function(k) { return k && text.indexOf(k) !== -1; }).length;
      if (score > bestScore) { best = v; bestScore = score; }
    });
    return { video: best || pool[0], matched: bestScore > 0 };
  }

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function(k) { node.setAttribute(k, attrs[k]); });
    if (text) node.textContent = text;
    return node;
  }

  function render(box, videos) {
    var keywords = (box.getAttribute('data-keywords') || '').toLowerCase().split(',').map(function(k) { return k.trim(); });
    var choice = pick(videos, keywords);
    var v = choice.video;
    if (!v) return;

    box.textContent = '';
    box.appendChild(el('p', { 'class': 'll-video-label' }, choice.matched ? '▶ Watch the video' : '▶ Our latest video'));
    box.appendChild(el('p', { 'class': 'll-video-title' }, cleanTitle(v.title)));

    var player = el('button', { 'class': 'll-video-player', type: 'button', 'aria-label': 'Play video: ' + cleanTitle(v.title) });
    var img = el('img', { src: 'https://i.ytimg.com/vi/' + encodeURIComponent(v.id) + '/hqdefault.jpg', alt: '', loading: 'lazy' });
    player.appendChild(img);
    player.appendChild(el('span', { 'class': 'll-play', 'aria-hidden': 'true' }, '▶'));
    player.addEventListener('click', function() {
      var iframe = el('iframe', {
        src: 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.id) + '?autoplay=1',
        title: v.title,
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
        allowfullscreen: ''
      });
      var frame = el('div', { 'class': 'll-video-player' });
      frame.appendChild(iframe);
      player.replaceWith(frame);
      if (window.gtag) window.gtag('event', 'video_play', { video_id: v.id, placement: 'related_video' });
    }, { once: true });
    box.appendChild(player);

    var links = el('div', { 'class': 'll-video-links' });
    links.appendChild(el('a', { 'class': 'll-sub', href: CHANNEL_SUBSCRIBE, target: '_blank', rel: 'noopener' }, 'Subscribe on YouTube'));
    links.appendChild(el('a', { href: '/videos/' + encodeURIComponent(v.id) + '.html' }, 'About this video →'));
    if (keywords.indexOf('singapore') !== -1) {
      links.appendChild(el('a', { href: '/videos/life-in-singapore.html' }, 'Our Life in Singapore series →'));
    } else {
      links.appendChild(el('a', { href: '/videos.html' }, 'All videos →'));
    }
    box.appendChild(links);
  }

  function init() {
    var boxes = document.querySelectorAll('aside.ll-video');
    if (!boxes.length) return;
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    fetch('/videos-data.json')
      .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(videos) { boxes.forEach(function(box) { render(box, videos); }); })
      .catch(function() { boxes.forEach(function(box) { box.remove(); }); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
