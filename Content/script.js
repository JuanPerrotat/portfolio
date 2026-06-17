(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
        if (window.matchMedia('(max-width: 760px)').matches) setMenu(false);
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
