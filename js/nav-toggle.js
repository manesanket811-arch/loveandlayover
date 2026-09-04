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
    var menu = document.querySelector('.nav-links') || document.getElementById('navMenu');
    if (!toggle || !menu) return;

    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', menu.id || 'navMenu');

    function setOpen(open) {
      menu.classList.toggle('active', open);
      toggle.classList.toggle('active', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    toggle.addEventListener('click', function() {
      setOpen(!menu.classList.contains('active'));
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && menu.classList.contains('active')) {
        setOpen(false);
        toggle.focus();
      }
    });

    menu.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        setOpen(false);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
