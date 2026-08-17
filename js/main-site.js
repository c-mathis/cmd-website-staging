(function () {
  'use strict';

  if (!document.documentElement.classList.contains('has-main-site')) return;

  var trigger = document.querySelector('.nav-menu');
  var menu = document.querySelector('.mega-menu_component');

  if (trigger && menu) {
    var menuId = menu.id || 'main-site-menu';
    menu.id = menuId;
    trigger.setAttribute('role', 'button');
    trigger.setAttribute('tabindex', '0');
    trigger.setAttribute('aria-controls', menuId);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', 'Open navigation menu');
    menu.setAttribute('aria-hidden', 'true');

    function isOpen() {
      return menu.classList.contains('is-menu-open');
    }

    function setOpen(open, returnFocus) {
      menu.classList.toggle('is-menu-open', open);
      document.body.classList.toggle('no-scroll', open);
      document.body.classList.toggle('menu-is-open', open);
      var contactButton = document.querySelector('.button.is-nav-button');
      if (contactButton) contactButton.classList.toggle('clickable-off', open);
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      trigger.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');

      if (open) {
        var firstLink = menu.querySelector('a[href]');
        if (firstLink) window.setTimeout(function () { firstLink.focus(); }, 0);
      } else if (returnFocus) {
        trigger.focus();
      }
    }

    function toggleMenu(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setOpen(!isOpen(), false);
    }

    trigger.addEventListener('click', toggleMenu, true);
    trigger.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') toggleMenu(event);
    }, true);

    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false, false);
    });

    document.addEventListener('keydown', function (event) {
      if (!isOpen()) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false, true);
        return;
      }

      if (event.key !== 'Tab') return;
      var focusable = Array.prototype.slice.call(menu.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]'));
      focusable.push(trigger);
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[fs-copyclip-element="click"]'), function (control) {
    control.setAttribute('role', 'button');
    control.setAttribute('tabindex', '0');
    control.setAttribute('aria-label', 'Copy email address to clipboard');

    var announcement = document.createElement('span');
    announcement.className = 'u-visually-hidden';
    announcement.setAttribute('aria-live', 'polite');
    control.appendChild(announcement);

    function copyEmail(event) {
      event.preventDefault();
      var wrapper = control.parentElement;
      var source = wrapper && wrapper.querySelector('[fs-copyclip-element="copy-sibling"]');
      if (!source) return;

      var text = source.textContent.trim();
      var copyPromise = navigator.clipboard && window.isSecureContext
        ? navigator.clipboard.writeText(text)
        : Promise.reject(new Error('Clipboard API unavailable'));

      copyPromise.then(function () {
        announcement.textContent = 'Email address copied.';
        control.setAttribute('aria-label', 'Email address copied');
        window.setTimeout(function () {
          announcement.textContent = '';
          control.setAttribute('aria-label', 'Copy email address to clipboard');
        }, 2000);
      }).catch(function () {
        announcement.textContent = 'Copy failed. Select the email address manually.';
      });
    }

    control.addEventListener('click', copyEmail);
    control.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') copyEmail(event);
    });
  });
})();
