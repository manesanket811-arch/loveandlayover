/**
 * Mobile Nav Toggle
 * Shared hamburger-menu behavior for pages using the .nav-links pattern
 * (destination guides, blog index, 404 page). Pages that already ship
 * their own toggle logic (index.html, about.html, videos.html via
 * premium-interactions.js) do not need this file.
 */
(function() {
  'use strict';

  function init() {
    var toggle = document.getElementById('navToggle');
    var menu = document.querySelector('.nav-links');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', function() {
      menu.classList.toggle('active');
      toggle.classList.toggle('active');
    });

    menu.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        menu.classList.remove('active');
        toggle.classList.remove('active');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
