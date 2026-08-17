(function () {
  'use strict';

  var config = window.CMD_TRACKING_CONFIG || {};
  var consentKey = 'cmd_consent_v1';
  var attributionKey = 'cmd_tracking';
  var policyVersion = '2026-08-15';
  var currentConsent = readConsent();
  var gaLoaded = false;
  var metaLoaded = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  });

  function storageAvailable(type) {
    try {
      var storage = window[type];
      var testKey = '__cmd_storage_test__';
      storage.setItem(testKey, testKey);
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  function readConsent() {
    if (!storageAvailable('localStorage')) return null;
    try {
      var stored = JSON.parse(window.localStorage.getItem(consentKey) || 'null');
      if (!stored || stored.policyVersion !== policyVersion) return null;
      return {
        analytics: stored.analytics === true,
        marketing: stored.marketing === true,
        policyVersion: stored.policyVersion,
        timestamp: stored.timestamp
      };
    } catch (error) {
      return null;
    }
  }

  function saveConsent(analytics, marketing) {
    currentConsent = {
      analytics: analytics === true,
      marketing: marketing === true,
      policyVersion: policyVersion,
      timestamp: new Date().toISOString()
    };
    if (storageAvailable('localStorage')) {
      window.localStorage.setItem(consentKey, JSON.stringify(currentConsent));
    }
    return currentConsent;
  }

  function deleteCookie(name) {
    var hostParts = window.location.hostname.split('.');
    var domains = ['', window.location.hostname];
    if (hostParts.length > 1) domains.push('.' + hostParts.slice(-2).join('.'));
    domains.forEach(function (domain) {
      var domainPart = domain ? '; domain=' + domain : '';
      document.cookie = name + '=; Max-Age=0; path=/' + domainPart + '; SameSite=Lax';
    });
  }

  function clearOptionalStorage() {
    document.cookie.split(';').forEach(function (item) {
      var name = item.split('=')[0].trim();
      if (/^(_ga|_gid|_gat|_fbp|_fbc)/.test(name)) deleteCookie(name);
    });
    if (storageAvailable('sessionStorage')) window.sessionStorage.removeItem(attributionKey);
  }

  function applyGoogleConsent(consent) {
    window.gtag('consent', 'update', {
      ad_storage: consent.marketing ? 'granted' : 'denied',
      analytics_storage: consent.analytics ? 'granted' : 'denied',
      ad_user_data: consent.marketing ? 'granted' : 'denied',
      ad_personalization: consent.marketing ? 'granted' : 'denied'
    });
  }

  function loadGoogleAnalytics() {
    var measurementId = String(config.googleAnalyticsId || '').trim();
    if (gaLoaded || !/^G-[A-Z0-9]+$/i.test(measurementId)) return;
    gaLoaded = true;
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
    document.head.appendChild(script);
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      anonymize_ip: true,
      allow_google_signals: currentConsent && currentConsent.marketing === true,
      send_page_view: true
    });
  }

  function loadMetaPixel() {
    var pixelId = String(config.metaPixelId || '').trim();
    if (metaLoaded || !/^\d{10,20}$/.test(pixelId)) return;
    metaLoaded = true;
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
  }

  function captureAttribution() {
    if (!currentConsent || !currentConsent.analytics || !storageAvailable('sessionStorage')) return {};
    var existing = {};
    try {
      existing = JSON.parse(window.sessionStorage.getItem(attributionKey) || '{}');
    } catch (error) {
      existing = {};
    }
    if (existing.first_touch_ts) return existing;

    var params = new URLSearchParams(window.location.search);
    var data = {
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_content: params.get('utm_content') || '',
      utm_term: params.get('utm_term') || '',
      gclid: params.get('gclid') || '',
      fbclid: params.get('fbclid') || '',
      referrer: document.referrer || '',
      landing_page: window.location.href,
      first_touch_ts: new Date().toISOString()
    };
    window.sessionStorage.setItem(attributionKey, JSON.stringify(data));
    return data;
  }

  function activateAllowedTags() {
    if (!currentConsent) return;
    applyGoogleConsent(currentConsent);
    if (currentConsent.analytics) {
      captureAttribution();
      loadGoogleAnalytics();
    }
    if (currentConsent.marketing) loadMetaPixel();
  }

  function getAttribution() {
    if (!currentConsent || !currentConsent.analytics || !storageAvailable('sessionStorage')) return {};
    try {
      return JSON.parse(window.sessionStorage.getItem(attributionKey) || '{}');
    } catch (error) {
      return {};
    }
  }

  function trackLead() {
    if (currentConsent && currentConsent.analytics && gaLoaded) {
      window.gtag('event', 'generate_lead', { event_category: 'contact_form' });
    }
    if (currentConsent && currentConsent.marketing && metaLoaded && window.fbq) {
      window.fbq('track', 'Lead');
    }
  }

  function consentMarkup() {
    return '' +
      '<div class="cmd-consent__inner">' +
        '<div class="cmd-consent__copy">' +
          '<h2 id="cmd-consent-title">Your privacy choices</h2>' +
          '<p>We use optional analytics to understand site performance and optional marketing tools to measure campaigns. Required site storage always stays on. See our <a href="/cmd-website-staging/privacy-policy">Privacy Policy</a>.</p>' +
        '</div>' +
        '<div class="cmd-consent__actions">' +
          '<button type="button" class="cmd-consent__button cmd-consent__button--primary" data-cmd-consent="accept">Accept all</button>' +
          '<button type="button" class="cmd-consent__button" data-cmd-consent="reject">Reject non-essential</button>' +
          '<button type="button" class="cmd-consent__link" data-cmd-consent="manage" aria-expanded="false">Manage preferences</button>' +
        '</div>' +
      '</div>' +
      '<form class="cmd-consent__preferences" data-cmd-preferences hidden>' +
        '<div><strong>Required</strong><span>Always on — remembers privacy choices and supports core site functions.</span></div>' +
        '<label><span><strong>Analytics</strong><span>Helps us understand visits and successful inquiries.</span></span><input type="checkbox" name="analytics"></label>' +
        '<label><span><strong>Marketing</strong><span>Measures advertising performance with Meta Pixel.</span></span><input type="checkbox" name="marketing"></label>' +
        '<button type="submit" class="cmd-consent__button cmd-consent__button--primary">Save preferences</button>' +
      '</form>';
  }

  function buildConsentUi() {
    document.querySelectorAll('.fs-cc-banner_component').forEach(function (node) { node.remove(); });

    var banner = document.createElement('section');
    banner.className = 'cmd-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-labelledby', 'cmd-consent-title');
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML = consentMarkup();
    document.body.appendChild(banner);

    var preferences = banner.querySelector('[data-cmd-preferences]');
    var analyticsInput = preferences.elements.analytics;
    var marketingInput = preferences.elements.marketing;
    var manageButton = banner.querySelector('[data-cmd-consent="manage"]');

    function hideBanner() {
      banner.classList.remove('is-visible');
      banner.setAttribute('aria-hidden', 'true');
    }

    function showBanner(focusFirst) {
      analyticsInput.checked = !!(currentConsent && currentConsent.analytics);
      marketingInput.checked = !!(currentConsent && currentConsent.marketing);
      banner.classList.add('is-visible');
      banner.removeAttribute('aria-hidden');
      if (focusFirst) banner.querySelector('button').focus();
    }

    function commit(analytics, marketing) {
      var wasLoaded = gaLoaded || metaLoaded;
      var previous = currentConsent;
      saveConsent(analytics, marketing);
      hideBanner();
      if ((previous && previous.analytics && !analytics) || (previous && previous.marketing && !marketing)) {
        clearOptionalStorage();
      }
      activateAllowedTags();
      if (wasLoaded && ((!analytics && previous && previous.analytics) || (!marketing && previous && previous.marketing))) {
        window.location.reload();
      }
    }

    banner.addEventListener('click', function (event) {
      var action = event.target.closest('[data-cmd-consent]');
      if (!action) return;
      var value = action.getAttribute('data-cmd-consent');
      if (value === 'accept') commit(true, true);
      if (value === 'reject') commit(false, false);
      if (value === 'manage') {
        var opening = preferences.hidden;
        preferences.hidden = !opening;
        manageButton.setAttribute('aria-expanded', String(opening));
        if (opening) analyticsInput.focus();
      }
    });

    preferences.addEventListener('submit', function (event) {
      event.preventDefault();
      commit(analyticsInput.checked, marketingInput.checked);
    });

    var settings = document.createElement('button');
    settings.type = 'button';
    settings.className = 'cmd-cookie-settings';
    settings.textContent = 'Cookie settings';
    settings.addEventListener('click', function () { showBanner(true); });

    var privacy = document.createElement('a');
    privacy.className = 'cmd-privacy-link';
    privacy.href = '/privacy-policy';
    privacy.textContent = 'Privacy policy';

    var footerTarget = document.querySelector('.footer_bottom') || document.querySelector('footer') || document.body;
    var controls = document.createElement('span');
    controls.className = 'cmd-privacy-controls';
    controls.appendChild(privacy);
    controls.appendChild(settings);
    footerTarget.appendChild(controls);

    if (!currentConsent) showBanner(false);
    else hideBanner();

    window.CMDTechnical.openCookieSettings = function () { showBanner(true); };
  }

  window.CMDTechnical = {
    getConsent: function () { return currentConsent; },
    getAttribution: getAttribution,
    trackLead: trackLead,
    openCookieSettings: function () {}
  };

  if (currentConsent) activateAllowedTags();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildConsentUi);
  } else {
    buildConsentUi();
  }
})();
