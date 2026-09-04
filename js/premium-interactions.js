/**
 * Premium Interactions
 * Advanced scroll animations, parallax effects, and micro-interactions
 */

(function() {
  'use strict';

  // ============================================
  // Header scroll effect
  // ============================================
  const header = document.querySelector('header');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  }, { passive: true });

  // ============================================
  // Intersection Observer for scroll animations
  // ============================================
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.1
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('[data-reveal]').forEach(el => {
    revealObserver.observe(el);
  });

  // ============================================
  // Stagger animation for grid items
  // ============================================
  const staggerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const items = entry.target.children;
        Array.from(items).forEach((item, index) => {
          setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
          }, index * 80);
        });
        staggerObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('[data-stagger]').forEach(el => {
    Array.from(el.children).forEach(item => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(30px)';
      item.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    });
    staggerObserver.observe(el);
  });

  // ============================================
  // Smooth counter animation
  // ============================================
  function animateCounter(el, target, duration = 2000) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = target.toLocaleString();
      return;
    }
    let start = 0;
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(easeOutQuart * target);

      el.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        el.textContent = target.toLocaleString();
      }
    }

    requestAnimationFrame(updateCounter);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.counter);
        animateCounter(entry.target, target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-counter]').forEach(el => {
    counterObserver.observe(el);
  });

  // ============================================
  // Magnetic button effect
  // ============================================
  document.querySelectorAll('.btn-magnetic').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
    });
  });

  // ============================================
  // Parallax effect for hero elements
  // ============================================
  const parallaxElements = document.querySelectorAll('[data-parallax]');

  if (parallaxElements.length > 0) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;

      parallaxElements.forEach(el => {
        const speed = el.dataset.parallax || 0.5;
        const yPos = -(scrolled * speed);
        el.style.transform = `translateY(${yPos}px)`;
      });
    }, { passive: true });
  }

  // ============================================
  // Mobile navigation toggle
  // ============================================
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  if (navToggle && navMenu) {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-controls', 'navMenu');

    const setOpen = (open) => {
      navMenu.classList.toggle('active', open);
      navToggle.classList.toggle('active', open);
      document.body.classList.toggle('nav-open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    navToggle.addEventListener('click', () => {
      setOpen(!navMenu.classList.contains('active'));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        setOpen(false);
        navToggle.focus();
      }
    });

    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => setOpen(false));
    });
  }

  // ============================================
  // Cursor trail effect (premium touch)
  // ============================================
  if (window.innerWidth > 1024 && !('ontouchstart' in window) &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const cursor = document.createElement('div');
    cursor.className = 'cursor-glow';
    cursor.style.cssText = `
      position: fixed;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(212, 105, 29, 0.06) 0%, transparent 70%);
      pointer-events: none;
      z-index: 1;
      transform: translate(-50%, -50%);
      transition: opacity 0.3s ease;
      opacity: 0;
    `;
    document.body.appendChild(cursor);

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.opacity = '1';
    });

    function animateCursor() {
      cursorX += (mouseX - cursorX) * 0.1;
      cursorY += (mouseY - cursorY) * 0.1;
      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
      requestAnimationFrame(animateCursor);
    }
    animateCursor();
  }

  // ============================================
  // Smooth scroll for anchor links
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // ============================================
  // Image lazy load with fade-in
  // ============================================
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.6s ease';

        if (img.complete) {
          img.style.opacity = '1';
        } else {
          img.addEventListener('load', () => {
            img.style.opacity = '1';
          });
        }

        imageObserver.unobserve(img);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    imageObserver.observe(img);
  });

  console.log('%c✨ Love and Layovers', 'font-size: 20px; font-weight: bold; color: #d4691d;');
  console.log('%cPremium design system loaded', 'color: #1a9b8e;');

})();
