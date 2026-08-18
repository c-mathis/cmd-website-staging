const slot = document.querySelector('[data-cmd-cube]');

if (slot) {
  const video = slot.querySelector('.wsvc-cube-video');
  const sources = [...video.querySelectorAll('source')];
  const poster = slot.querySelector('.wsvc-cube-poster');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let alphaSupported = false;
  let alphaChecked = false;
  let inView = true;

  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;

  const setPosterState = (state) => {
    video.pause();
    slot.classList.remove('is-video-ready');
    slot.classList.add('is-poster-only');
    slot.dataset.cubeState = state;
  };

  const alphaCornersAreTransparent = () => {
    const probe = document.createElement('canvas');
    const size = 32;
    const context = probe.getContext('2d', { willReadFrequently: true });
    if (!context) return false;

    probe.width = size;
    probe.height = size;
    context.clearRect(0, 0, size, size);
    context.drawImage(video, 0, 0, size, size);

    const pixels = context.getImageData(0, 0, size, size).data;
    const coordinates = [
      [1, 1],
      [size - 2, 1],
      [1, size - 2],
      [size - 2, size - 2]
    ];
    const averageAlpha = coordinates.reduce((total, [x, y]) => {
      return total + pixels[((y * size) + x) * 4 + 3];
    }, 0) / coordinates.length;

    return averageAlpha < 48;
  };

  const waitForPresentedFrame = () => new Promise((resolve) => {
    if ('requestVideoFrameCallback' in video) {
      video.requestVideoFrameCallback(() => resolve());
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

  const shouldAnimate = () => {
    return alphaSupported && !reducedMotion.matches && inView && !document.hidden;
  };

  const updatePlayback = async () => {
    if (!shouldAnimate()) {
      video.pause();
      return;
    }

    try {
      await video.play();
    } catch (error) {
      setPosterState('poster-fallback');
    }
  };

  const activateVideo = async () => {
    if (reducedMotion.matches) {
      setPosterState('reduced-motion');
      return;
    }

    if (!alphaChecked) {
      alphaSupported = alphaCornersAreTransparent();
      alphaChecked = true;
    }

    if (!alphaSupported) {
      setPosterState('poster-fallback');
      return;
    }

    slot.classList.remove('is-poster-only');

    try {
      await video.play();
      await waitForPresentedFrame();
      slot.classList.remove('has-error');
      slot.classList.add('is-video-ready');
      slot.dataset.cubeState = 'playing';
      slot.dispatchEvent(new CustomEvent('cmd-cube-ready', { detail: { mode: 'alpha-video' } }));
      await updatePlayback();
    } catch (error) {
      setPosterState('poster-fallback');
    }
  };

  const handleMediaReady = () => {
    activateVideo();
  };

  video.addEventListener('loadeddata', handleMediaReady, { once: true });
  video.addEventListener('error', () => setPosterState('poster-fallback'));
  let failedSources = 0;
  sources.forEach((source) => {
    source.addEventListener('error', () => {
      failedSources += 1;
      if (failedSources === sources.length && video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        setPosterState('poster-fallback');
      }
    });
  });
  if (poster) poster.addEventListener('error', () => slot.classList.add('has-error'));

  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    handleMediaReady();
  } else if (video.networkState === HTMLMediaElement.NETWORK_EMPTY) {
    video.load();
  }

  if (poster && 'decode' in poster) poster.decode().catch(() => {});

  if ('IntersectionObserver' in window) {
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updatePlayback();
    }, { rootMargin: '160px' });
    visibilityObserver.observe(slot);
  }

  document.addEventListener('visibilitychange', updatePlayback);

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      setPosterState('reduced-motion');
      return;
    }

    slot.classList.remove('is-poster-only');
    activateVideo();
  });
}
