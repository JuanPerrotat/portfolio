(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* iOS Safari only fires :active/:hover styles on elements once a touch
     listener exists somewhere on the page — this no-op enables them globally. */
  document.addEventListener('touchstart', function () {}, { passive: true });

  /* ---- Mobile nav toggle ---- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('nav-menu');
  var main = document.getElementById('main');

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    menu.setAttribute('data-open', String(open));
    if (open) {
      main.setAttribute('inert', '');
    } else {
      main.removeAttribute('inert');
    }
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var isOpen = toggle.getAttribute('aria-expanded') === 'true';
      setMenu(!isOpen);
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.matchMedia('(max-width: 960px)').matches) setMenu(false);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  /* ---- Active section highlighting ---- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = '#' + entry.target.id;
          navLinks.forEach(function (link) {
            var match = link.getAttribute('href') === id;
            if (match) {
              link.setAttribute('aria-current', 'true');
            } else {
              link.removeAttribute('aria-current');
            }
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach(function (s) { sectionObserver.observe(s); });
  }

  /* ---- Scroll reveal ---- */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    document.querySelectorAll('[data-reveal-group]').forEach(function (group) {
      Array.prototype.slice.call(group.children).forEach(function (child, i) {
        child.style.setProperty('--i', i);
      });
    });

    var revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  /* ---- Tech carousels: center slide + 2 peeking neighbors on each side ---- */
  document.querySelectorAll('[data-carousel]').forEach(function (carousel) {
    var viewport = carousel.querySelector('.tech-carousel-viewport');
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.tech-slide'));
    var prevBtn = carousel.querySelector('[data-carousel-prev]');
    var nextBtn = carousel.querySelector('[data-carousel-next]');
    var pauseBtn = carousel.querySelector('[data-carousel-pause]');
    var counter = carousel.querySelector('[data-carousel-counter]');
    var delay = parseInt(carousel.getAttribute('data-autoplay'), 10) || 3000;
    var current = slides.findIndex(function (s) { return s.classList.contains('is-active'); });
    if (current < 0) current = 0;
    var timer = null;
    var userPaused = false;

    var SCALE = [1, 0.8, 0.62];
    var OPACITY = [1, 0.55, 0.28];

    function wrappedDistance(i) {
      var d = i - current;
      var half = slides.length / 2;
      if (d > half) d -= slides.length;
      if (d < -half) d += slides.length;
      return d;
    }

    function render() {
      var gap = parseFloat(getComputedStyle(viewport).getPropertyValue('--slide-gap')) || 112;
      slides.forEach(function (slide, i) {
        var d = wrappedDistance(i);
        var absD = Math.abs(d);
        var isActive = absD === 0;
        var visible = absD <= 2;
        slide.style.setProperty('--slide-x', (d * gap) + 'px');
        slide.style.setProperty('--slide-scale', visible ? SCALE[absD] : 0.5);
        slide.style.setProperty('--slide-opacity', visible ? OPACITY[absD] : 0);
        slide.classList.toggle('is-active', isActive);
        slide.dataset.active = String(isActive);
        slide.dataset.visible = String(visible);
        slide.tabIndex = visible ? 0 : -1;
        if (visible) slide.removeAttribute('aria-hidden'); else slide.setAttribute('aria-hidden', 'true');
      });
      if (counter) counter.textContent = (current + 1) + ' / ' + slides.length;
    }

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      render();
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    function start() {
      if (reduceMotion || userPaused || document.hidden || slides.length < 2) return;
      stop();
      timer = setInterval(next, delay);
    }

    slides.forEach(function (slide, i) {
      slide.addEventListener('click', function () {
        if (i === current) return;
        goTo(i);
        start();
      });
    });

    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); start(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { next(); start(); });

    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); start(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); start(); }
    });

    if (pauseBtn) {
      if (reduceMotion) {
        pauseBtn.hidden = true;
      } else {
        pauseBtn.addEventListener('click', function () {
          userPaused = !userPaused;
          pauseBtn.setAttribute('aria-pressed', String(userPaused));
          pauseBtn.textContent = userPaused ? 'Reanudar' : 'Pausar';
          if (userPaused) stop(); else start();
        });
      }
    }

    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    carousel.addEventListener('focusin', stop);
    carousel.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    render();
    start();
  });

  /* ---- Sticky nav shadow on scroll ---- */
  var nav = document.querySelector('.site-nav');
  if (nav) {
    var lastState = false;
    window.addEventListener(
      'scroll',
      function () {
        var scrolled = window.scrollY > 4;
        if (scrolled !== lastState) {
          nav.style.boxShadow = scrolled ? '0 8px 24px -16px rgb(0 0 0 / 0.18)' : 'none';
          lastState = scrolled;
        }
      },
      { passive: true }
    );
  }
})();
