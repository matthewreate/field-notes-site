/* SPA-lite shim. Intercepts internal links, fetches the destination,
   swaps <main> and key head metadata, runs document.startViewTransition
   so existing view-transition-name styles drive the motion. The audio
   bar and shell chrome live outside <main> so audio survives navigation.

   Issue pages (/issues/*) opt out until script.js is refactored to expose
   init/teardown — those still use full-page navigation. */
(function () {
  'use strict';

  if (!window.fetch || !window.history || !window.history.pushState) return;

  // Path patterns that should fall through to a full page load.
  // Issue pages (/issues/*) opt out: their renderer reads an embedded
  // <script type="application/json" id="issue-payload"> from <head>, which
  // the shim doesn't sync across swaps. Forcing full-page nav guarantees the
  // payload (and the per-issue meta tags) come from the destination doc.
  var SPA_SKIP_PATTERNS = [/^\/issues\//];

  var ASSET_RE = /\.(png|jpe?g|webp|gif|svg|pdf|zip|m4a|mp3|mp4|mov|webm|json|xml|ico|txt)$/i;

  var META_NAMES = ['description', 'theme-color', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'keywords'];
  var META_PROPS = ['og:type', 'og:title', 'og:description', 'og:url', 'og:image', 'og:site_name', 'article:section', 'article:tag'];

  function isInternal(url) {
    return url.origin === window.location.origin;
  }

  function isSpaCandidate(href, link) {
    if (!href) return false;
    if (link.target && link.target !== '' && link.target !== '_self') return false;
    if (link.hasAttribute('download')) return false;
    if (link.hasAttribute('data-no-spa')) return false;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;
    var url;
    try { url = new URL(href, document.baseURI); } catch (_) { return false; }
    if (!isInternal(url)) return false;
    if (ASSET_RE.test(url.pathname)) return false;
    for (var i = 0; i < SPA_SKIP_PATTERNS.length; i++) {
      if (SPA_SKIP_PATTERNS[i].test(url.pathname)) return false;
    }
    return true;
  }

  function syncMeta(doc) {
    META_NAMES.forEach(function (name) {
      var newM = doc.querySelector('meta[name="' + name + '"]');
      var oldM = document.querySelector('meta[name="' + name + '"]');
      if (newM && oldM) {
        oldM.setAttribute('content', newM.getAttribute('content') || '');
      } else if (newM && !oldM) {
        var clone = newM.cloneNode(true);
        document.head.appendChild(clone);
      }
    });
    META_PROPS.forEach(function (prop) {
      var newM = doc.querySelector('meta[property="' + prop + '"]');
      var oldM = document.querySelector('meta[property="' + prop + '"]');
      if (newM && oldM) {
        oldM.setAttribute('content', newM.getAttribute('content') || '');
      } else if (newM && !oldM) {
        document.head.appendChild(newM.cloneNode(true));
      }
    });
    var newCanon = doc.querySelector('link[rel="canonical"]');
    var oldCanon = document.querySelector('link[rel="canonical"]');
    if (newCanon && oldCanon) {
      oldCanon.setAttribute('href', newCanon.getAttribute('href') || '');
    }
  }

  function syncJsonLd(doc) {
    var oldScripts = Array.from(document.head.querySelectorAll('script[type="application/ld+json"]'));
    var newScripts = Array.from(doc.head.querySelectorAll('script[type="application/ld+json"]'));
    oldScripts.forEach(function (s) { s.remove(); });
    newScripts.forEach(function (s) {
      var clone = document.createElement('script');
      clone.type = 'application/ld+json';
      if (s.id) clone.id = s.id;
      clone.textContent = s.textContent;
      document.head.appendChild(clone);
    });
  }

  function syncBodyAttrs(doc) {
    var newBody = doc.body;
    if (!newBody) return;
    // Mirror every data-* attribute from the new body (data-page, data-site-root, etc.)
    var newKeys = Object.keys(newBody.dataset);
    Object.keys(document.body.dataset).forEach(function (k) {
      if (newKeys.indexOf(k) === -1) delete document.body.dataset[k];
    });
    newKeys.forEach(function (k) {
      document.body.dataset[k] = newBody.dataset[k];
    });
    var preserveClasses = [];
    if (document.body.classList.contains('has-audio-bar')) preserveClasses.push('has-audio-bar');
    document.body.className = newBody.className;
    preserveClasses.forEach(function (c) { document.body.classList.add(c); });
  }

  function performSwap(html, url) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(html, 'text/html');

    var newMain = doc.querySelector('main');
    var oldMain = document.querySelector('main');
    if (!newMain || !oldMain) {
      window.location.href = url.href;
      return;
    }

    var apply = function () {
      oldMain.replaceWith(newMain);
      // Header and footer carry the site nav and footer links. Their hrefs are
      // written as ./relative paths, so they must come from the destination
      // page's HTML — otherwise after a swap they resolve against the new URL
      // and 404 (e.g. ./about.html under /issues/foo/ → /issues/foo/about.html).
      ['.site-header', '.site-footer'].forEach(function (sel) {
        var newEl = doc.querySelector(sel);
        var oldEl = document.querySelector(sel);
        if (newEl && oldEl) oldEl.replaceWith(newEl);
      });
      if (doc.title) document.title = doc.title;
      syncBodyAttrs(doc);
      syncMeta(doc);
      syncJsonLd(doc);

      if (window.fieldNotesAudio && typeof window.fieldNotesAudio.bind === 'function') {
        try { window.fieldNotesAudio.bind(document); } catch (_) {}
      }

      // Issue pages need their renderer to re-run against the new DOM.
      if (document.body.dataset.page === 'issue'
          && window.fieldNotesIssue
          && typeof window.fieldNotesIssue.load === 'function') {
        try { window.fieldNotesIssue.load(); } catch (err) { console.warn('[spa-shim] issue load', err); }
      }

      try {
        document.dispatchEvent(new CustomEvent('mr:pageswap', {
          detail: { url: url.href, page: document.body.dataset.page }
        }));
      } catch (_) {}

      if (url.hash) {
        var target = document.querySelector(url.hash);
        if (target && typeof target.scrollIntoView === 'function') {
          target.scrollIntoView();
          return;
        }
      }
      window.scrollTo(0, 0);
    };

    if (typeof document.startViewTransition === 'function') {
      document.startViewTransition(apply);
    } else {
      apply();
    }
  }

  function navigate(url, push) {
    fetch(url.href, { credentials: 'same-origin', headers: { 'Accept': 'text/html' } })
      .then(function (res) {
        if (!res.ok) throw new Error('SPA fetch failed: ' + res.status);
        return res.text();
      })
      .then(function (html) {
        if (push) {
          history.pushState({ spa: true, href: url.href }, '', url.href);
        }
        performSwap(html, url);
      })
      .catch(function (err) {
        console.warn('[spa-shim]', err);
        window.location.href = url.href;
      });
  }

  document.addEventListener('click', function (e) {
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!isSpaCandidate(href, link)) return;
    var url;
    try { url = new URL(href, document.baseURI); } catch (_) { return; }
    if (url.pathname === window.location.pathname && url.hash) {
      // Same-page anchor — let browser handle native scroll
      return;
    }
    e.preventDefault();
    navigate(url, true);
  });

  window.addEventListener('popstate', function () {
    var url = new URL(window.location.href);
    navigate(url, false);
  });

  history.replaceState({ spa: true, href: window.location.href }, '', window.location.href);
}());
