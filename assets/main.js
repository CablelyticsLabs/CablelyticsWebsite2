/* ============================================================================
   CABLELYTICS — MAIN JAVASCRIPT  (intentionally minimal)
   ----------------------------------------------------------------------------
   Four small features, each in its own block so you can edit or remove one
   without touching the others:
     A. Mobile menu open/close (hamburger)
     B. Customer Success carousel (arrows, dots, slow autoplay)
     C. Scroll-reveal animation for elements with class "reveal"
     D. Animated number count-up for the stats section
   No frameworks, no libraries.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ---- A. MOBILE MENU ---------------------------------------------------- */
  var toggle = document.querySelector('.nav__toggle');
  var links  = document.querySelector('.nav__links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Close the menu after tapping any link. "Solutions" is included here on
    // purpose: on mobile it is a plain link to solutions.html, not a submenu
    // toggle, so it should close the menu and navigate like every other item.
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---- B. CUSTOMER SUCCESS CAROUSEL ------------------------------------- */
  // Native horizontal scrolling + arrows + dots. Auto-advances slowly and
  // pauses whenever the user hovers, focuses, or touches it.
  //
  // ┌─ TO CHANGE THE SPEED: edit AUTOPLAY_MS below. Higher = slower. ─┐
  var AUTOPLAY_MS = 5000;   // 5 seconds per card
  // └─────────────────────────────────────────────────────────────────┘

  (function initCarousel() {
    var root = document.querySelector('[data-carousel]');
    if (!root) return;

    var viewport = root.querySelector('[data-carousel-viewport]');
    var track    = root.querySelector('[data-carousel-track]');
    var prevBtn  = root.querySelector('[data-carousel-prev]');
    var nextBtn  = root.querySelector('[data-carousel-next]');
    var dotsWrap = document.querySelector('[data-carousel-dots]');
    if (!viewport || !track) return;

    var cards = Array.prototype.slice.call(track.querySelectorAll('.sector-card'));
    if (!cards.length) return;

    var timer = null;
    var paused = false;

    // Distance from one card to the next, including the gap.
    function step() {
      if (cards.length < 2) return cards[0].offsetWidth;
      return cards[1].offsetLeft - cards[0].offsetLeft;
    }
    function maxScroll() {
      return viewport.scrollWidth - viewport.clientWidth;
    }
    function currentIndex() {
      var s = step();
      return s ? Math.round(viewport.scrollLeft / s) : 0;
    }

    function goTo(i) {
      var s = step();
      var target = Math.max(0, Math.min(i * s, maxScroll()));
      viewport.scrollTo({ left: target, behavior: 'smooth' });
    }

    function next() {
      // If we're at (or very near) the end, loop back to the start.
      if (viewport.scrollLeft >= maxScroll() - 2) goTo(0);
      else goTo(currentIndex() + 1);
    }
    function prev() {
      if (viewport.scrollLeft <= 2) goTo(cards.length - 1);
      else goTo(currentIndex() - 1);
    }

    /* ---- Dots ---- */
    var dots = [];
    if (dotsWrap) {
      cards.forEach(function (c, i) {
        var b = document.createElement('button');
        b.className = 'carousel__dot';
        b.type = 'button';
        b.setAttribute('aria-label', 'Go to project ' + (i + 1));
        b.addEventListener('click', function () { goTo(i); restart(); });
        dotsWrap.appendChild(b);
        dots.push(b);
      });
    }

    /* ---- Reflect scroll position in arrows + dots ---- */
    function sync() {
      var i = currentIndex();
      dots.forEach(function (d, di) {
        d.setAttribute('aria-current', di === i ? 'true' : 'false');
      });
      // Arrows stay enabled because the carousel wraps around.
      if (prevBtn) prevBtn.disabled = false;
      if (nextBtn) nextBtn.disabled = false;
    }

    var scrollTick;
    viewport.addEventListener('scroll', function () {
      clearTimeout(scrollTick);
      scrollTick = setTimeout(sync, 90);
    }, { passive: true });

    /* ---- Autoplay ---- */
    function start() {
      // Respect users who ask for reduced motion — no auto-advance for them.
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      stop();
      timer = setInterval(function () { if (!paused) next(); }, AUTOPLAY_MS);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); restart(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { next(); restart(); });

    ['mouseenter', 'focusin', 'touchstart', 'pointerdown'].forEach(function (ev) {
      root.addEventListener(ev, function () { paused = true; }, { passive: true });
    });
    ['mouseleave', 'focusout', 'touchend', 'pointerup'].forEach(function (ev) {
      root.addEventListener(ev, function () { paused = false; }, { passive: true });
    });

    // Pause entirely when the tab is hidden (saves battery on mobile).
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    // Keyboard support on the viewport
    viewport.setAttribute('tabindex', '0');
    viewport.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); restart(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); restart(); }
    });

    window.addEventListener('resize', function () { sync(); });

    sync();
    start();
  })();

  /* ---- C. SCROLL REVEAL -------------------------------------------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    // Fallback: just show everything
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---- D. STAT COUNTERS -------------------------------------------------- */
  // Any element with data-count="587" will count up to that number when seen.
  var counters = document.querySelectorAll('[data-count]');
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var dur = 1400, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      // easeOutCubic
      var eased = 1 - Math.pow(1 - p, 3);
      el.firstChild.nodeValue = Math.floor(eased * target).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
      else el.firstChild.nodeValue = target.toLocaleString();
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && counters.length) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCount(entry.target); io2.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { io2.observe(el); });
  }

});
