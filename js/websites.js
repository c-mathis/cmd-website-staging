(function () {
  'use strict';

  var stage = document.querySelector('[data-hero-work-slider]');
  if (!stage) return;

  var slides = Array.prototype.slice.call(stage.querySelectorAll('[data-hero-work-slide]'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-work-dot]'));
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobile = window.matchMedia('(max-width: 767px)');
  var activeIndex = 0;
  var autoplay = null;
  var pointerStartX = null;
  var swipeDistance = 40;

  function wrapIndex(index) {
    return (index + slides.length) % slides.length;
  }

  function setActive(index) {
    activeIndex = wrapIndex(index);

    slides.forEach(function (slide, slideIndex) {
      var active = slideIndex === activeIndex;
      slide.classList.toggle('is-active', active);
      if (active) slide.removeAttribute('aria-hidden');
      else slide.setAttribute('aria-hidden', 'true');
    });

    dots.forEach(function (dot, dotIndex) {
      var active = dotIndex === activeIndex;
      dot.classList.toggle('is-active', active);
      if (active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  function stopAutoplay() {
    if (autoplay === null) return;
    window.clearInterval(autoplay);
    autoplay = null;
  }

  function startAutoplay() {
    stopAutoplay();
    if (!mobile.matches || reduceMotion.matches || document.hidden || slides.length < 2) return;
    autoplay = window.setInterval(function () {
      setActive(activeIndex + 1);
    }, 2000);
  }

  function selectSlide(index) {
    setActive(index);
    startAutoplay();
  }

  stage.addEventListener('keydown', function (event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    var direction = event.key === 'ArrowRight' ? 1 : -1;
    selectSlide(activeIndex + direction);
  });

  dots.forEach(function (dot, index) {
    dot.addEventListener('click', function () {
      selectSlide(index);
    });
  });

  stage.addEventListener('pointerdown', function (event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerStartX = event.clientX;
    stopAutoplay();
    try {
      stage.setPointerCapture(event.pointerId);
    } catch (error) {
      // Pointer capture is optional; the swipe still works when it is unavailable.
    }
  });

  stage.addEventListener('pointerup', function (event) {
    if (pointerStartX === null) return;
    var distance = event.clientX - pointerStartX;
    pointerStartX = null;

    if (Math.abs(distance) >= swipeDistance) {
      selectSlide(activeIndex + (distance < 0 ? 1 : -1));
    } else {
      startAutoplay();
    }
  });

  stage.addEventListener('pointercancel', function () {
    pointerStartX = null;
    startAutoplay();
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  if (typeof mobile.addEventListener === 'function') {
    mobile.addEventListener('change', startAutoplay);
    reduceMotion.addEventListener('change', startAutoplay);
  }

  setActive(0);
  startAutoplay();
})();

(function () {
  'use strict';

  var layers = Array.prototype.slice.call(document.querySelectorAll(
    '.section-home-header, .wsvc-proof-section, a.button:not(.is-alternate)'
  ));
  if (!layers.length) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobile = window.matchMedia('(max-width: 767px)');
  var tablet = window.matchMedia('(max-width: 991px)');
  var frame = null;

  function motionRange(element) {
    var isWideLayer = element.classList.contains('section-home-header') ||
      element.classList.contains('wsvc-proof-section');

    if (mobile.matches) return isWideLayer ? 150 : 52;
    if (tablet.matches) return isWideLayer ? 150 : 48;
    return isWideLayer ? 220 : 68;
  }

  function clearMotion() {
    layers.forEach(function (element) {
      element.style.setProperty('--wsvc-holo-parallax-y', '0px');
    });
  }

  function updateMotion() {
    frame = null;

    if (reduceMotion.matches) {
      clearMotion();
      return;
    }

    var viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    layers.forEach(function (element) {
      var rect = element.getBoundingClientRect();
      if (rect.bottom < -rect.height || rect.top > viewportHeight + rect.height) return;

      var travel = (viewportHeight + rect.height) / 2;
      var distanceFromCenter = rect.top + (rect.height / 2) - (viewportHeight / 2);
      var progress = Math.max(-1, Math.min(1, distanceFromCenter / travel));
      var offset = -progress * motionRange(element);

      element.style.setProperty('--wsvc-holo-parallax-y', offset.toFixed(2) + 'px');
    });
  }

  function requestUpdate() {
    if (frame !== null) return;
    frame = window.requestAnimationFrame(updateMotion);
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);

  if (typeof reduceMotion.addEventListener === 'function') {
    reduceMotion.addEventListener('change', requestUpdate);
    mobile.addEventListener('change', requestUpdate);
    tablet.addEventListener('change', requestUpdate);
  }

  updateMotion();
})();
