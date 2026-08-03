/* Persistent bottom audio bar.
   Owns a single <audio> element. Inline mix buttons act as remote controls.
   Public API: window.fieldNotesAudio = { play, pause, toggle, getCurrent, isPlaying, bind, close }. */
(function () {
  'use strict';

  var STORAGE_KEY = 'mr-audio-bar-v1';
  var DISMISSED_KEY = 'mr-audio-bar-dismissed-v1';
  var SAVE_THROTTLE_MS = 2000;

  var bar = null;
  var audio = null;
  var els = {};
  var currentTrack = null;
  var dismissed = false;
  var lastSaveAt = 0;
  var isScrubbing = false;
  var pendingResumePosition = null;

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '00:00';
    var total = Math.floor(seconds);
    var m = Math.floor(total / 60);
    var s = total % 60;
    if (m >= 60) {
      var h = Math.floor(m / 60);
      var mm = m % 60;
      return h + ':' + String(mm).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function buildBar() {
    bar = document.createElement('aside');
    bar.className = 'audio-bar';
    bar.setAttribute('aria-label', 'Now playing');
    bar.dataset.state = 'hidden';
    bar.innerHTML = [
      '<div class="audio-bar-inner">',
        '<button type="button" class="audio-bar-play" data-bar-play aria-label="Play">',
          '<svg class="audio-bar-icon-play" viewBox="0 0 10 12" aria-hidden="true"><polygon points="0,0 10,6 0,12"/></svg>',
          '<svg class="audio-bar-icon-pause" viewBox="0 0 10 12" aria-hidden="true"><rect x="0" y="0" width="3" height="12"/><rect x="7" y="0" width="3" height="12"/></svg>',
        '</button>',
        '<div class="audio-bar-meta">',
          '<a class="audio-bar-title" data-bar-title href="#"></a>',
          '<span class="audio-bar-subtitle" data-bar-subtitle></span>',
        '</div>',
        '<div class="audio-bar-scrubber-wrap">',
          '<div class="audio-bar-fill-track" aria-hidden="true">',
            '<div class="audio-bar-fill" data-bar-fill></div>',
          '</div>',
          '<input type="range" min="0" max="1000" step="1" value="0" class="audio-bar-range" data-bar-scrubber aria-label="Scrub timeline">',
        '</div>',
        '<span class="audio-bar-time">',
          '<span data-bar-current>00:00</span>',
          '<span class="audio-bar-time-sep">/</span>',
          '<span data-bar-duration>00:00</span>',
        '</span>',
        '<button type="button" class="audio-bar-dismiss" data-bar-dismiss aria-label="Close player">',
          '<svg viewBox="0 0 12 12" aria-hidden="true"><line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" stroke-width="1.5"/></svg>',
        '</button>',
      '</div>',
      '<div class="audio-bar-live" data-bar-live aria-live="polite" aria-atomic="true"></div>'
    ].join('');
    document.body.appendChild(bar);

    audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.dataset.barAudio = '1';
    bar.appendChild(audio);

    els.title = bar.querySelector('[data-bar-title]');
    els.subtitle = bar.querySelector('[data-bar-subtitle]');
    els.play = bar.querySelector('[data-bar-play]');
    els.scrubber = bar.querySelector('[data-bar-scrubber]');
    els.fill = bar.querySelector('[data-bar-fill]');
    els.current = bar.querySelector('[data-bar-current]');
    els.duration = bar.querySelector('[data-bar-duration]');
    els.dismiss = bar.querySelector('[data-bar-dismiss]');
    els.live = bar.querySelector('[data-bar-live]');

    els.play.addEventListener('click', toggle);
    els.dismiss.addEventListener('click', dismiss);
    els.scrubber.addEventListener('input', onScrubInput);
    els.scrubber.addEventListener('change', onScrubCommit);
    els.scrubber.addEventListener('pointerdown', function () { isScrubbing = true; });
    els.scrubber.addEventListener('pointerup', function () { isScrubbing = false; });
    els.title.addEventListener('click', function (e) {
      if (!currentTrack || !currentTrack.href) e.preventDefault();
    });

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onMetadata);

    bar.addEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      toggle();
    } else if (e.code === 'ArrowRight') {
      if (audio && audio.duration) {
        audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
      }
    } else if (e.code === 'ArrowLeft') {
      if (audio && audio.duration) {
        audio.currentTime = Math.max(0, audio.currentTime - 5);
      }
    }
  }

  function onScrubInput() {
    if (!audio.duration) return;
    var pct = els.scrubber.valueAsNumber / 1000;
    var t = pct * audio.duration;
    els.current.textContent = formatTime(t);
    els.fill.style.width = (pct * 100) + '%';
  }

  function onScrubCommit() {
    if (!audio.duration) return;
    var pct = els.scrubber.valueAsNumber / 1000;
    audio.currentTime = pct * audio.duration;
  }

  function onPlay() {
    bar.dataset.playing = 'true';
    els.play.setAttribute('aria-label', 'Pause');
    notifyTrackButtons();
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
  }

  function onPause() {
    bar.dataset.playing = 'false';
    els.play.setAttribute('aria-label', 'Play');
    notifyTrackButtons();
    saveState();
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
  }

  function onEnded() {
    bar.dataset.playing = 'false';
    els.play.setAttribute('aria-label', 'Play');
    notifyTrackButtons();
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (_) {}
  }

  function onTimeUpdate() {
    if (isScrubbing || !audio.duration) return;
    var pct = audio.currentTime / audio.duration;
    els.scrubber.value = String(Math.round(pct * 1000));
    els.fill.style.width = (pct * 100) + '%';
    els.current.textContent = formatTime(audio.currentTime);
    if (Date.now() - lastSaveAt > SAVE_THROTTLE_MS) saveState();
  }

  function onMetadata() {
    els.duration.textContent = formatTime(audio.duration);
    if (pendingResumePosition !== null && pendingResumePosition < audio.duration) {
      try { audio.currentTime = pendingResumePosition; } catch (_) {}
      var pct = pendingResumePosition / audio.duration;
      els.scrubber.value = String(Math.round(pct * 1000));
      els.fill.style.width = (pct * 100) + '%';
      els.current.textContent = formatTime(pendingResumePosition);
      pendingResumePosition = null;
    }
  }

  function notifyTrackButtons() {
    var playing = bar.dataset.playing === 'true';
    var selectors = '[data-mix-bar-button], [data-track-preview-button]';
    document.querySelectorAll(selectors).forEach(function (btn) {
      var id = btn.dataset.trackId;
      var isCurrent = currentTrack && id === currentTrack.id;
      if (isCurrent && playing) {
        btn.classList.add('is-playing');
        btn.setAttribute('aria-label', 'Pause ' + currentTrack.title);
      } else {
        btn.classList.remove('is-playing');
        var label = btn.dataset.trackTitle ? 'Play ' + btn.dataset.trackTitle : 'Play mix';
        btn.setAttribute('aria-label', label);
      }
    });
  }

  function showBar() {
    if (!bar) return;
    bar.dataset.state = 'visible';
    document.body.classList.add('has-audio-bar');
    dismissed = false;
    try { sessionStorage.removeItem(DISMISSED_KEY); } catch (_) {}
  }

  function hideBar() {
    if (!bar) return;
    bar.dataset.state = 'hidden';
    document.body.classList.remove('has-audio-bar');
  }

  function dismiss() {
    dismissed = true;
    try { sessionStorage.setItem(DISMISSED_KEY, '1'); } catch (_) {}
    hideBar();
    if (audio) audio.pause();
    notifyTrackButtons();
  }

  function setTrack(track) {
    currentTrack = {
      id: String(track.id || ''),
      title: String(track.title || ''),
      subtitle: String(track.subtitle || ''),
      src: String(track.src || ''),
      // Resolve href to absolute now, against the page that owns this button.
      // The bar persists across SPA swaps, so a relative href captured here
      // would otherwise re-resolve against whatever URL the user navigated to.
      href: track.href ? new URL(String(track.href), document.baseURI).href : '',
      compact: !!track.compact
    };
    els.title.textContent = currentTrack.title;
    els.subtitle.textContent = currentTrack.subtitle;
    if (currentTrack.href) {
      els.title.setAttribute('href', currentTrack.href);
    } else {
      els.title.setAttribute('href', '#');
    }
    if (audio.src !== currentTrack.src) {
      audio.src = currentTrack.src;
    }
    els.duration.textContent = '00:00';
    els.current.textContent = '00:00';
    els.scrubber.value = '0';
    els.fill.style.width = '0%';
    if (els.live) els.live.textContent = 'Now playing: ' + currentTrack.title;
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: currentTrack.title,
          artist: 'Matthew Reate',
          album: currentTrack.subtitle || 'Field Notes'
        });
      } catch (_) {}
    }
  }

  function play(track) {
    if (!track || !track.src) return Promise.resolve();
    var sameTrack = currentTrack && currentTrack.id === String(track.id) && audio.src.endsWith(encodeURI(track.src.split('/').pop()));
    if (!currentTrack || currentTrack.id !== String(track.id) || audio.src !== track.src) {
      setTrack(track);
    }
    if (currentTrack && currentTrack.compact) {
      hideBar();
    } else {
      showBar();
    }
    var playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      return playPromise.catch(function (err) {
        console.warn('[audio-bar] play blocked', err);
      });
    }
    return Promise.resolve();
  }

  function pause() {
    if (audio) audio.pause();
  }

  function toggle() {
    if (!audio || !audio.src) return;
    if (audio.paused) {
      var p = audio.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    } else {
      audio.pause();
    }
  }

  function saveState() {
    lastSaveAt = Date.now();
    if (!currentTrack || !audio.src) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        track: currentTrack,
        position: audio.currentTime || 0
      }));
    } catch (_) {}
  }

  function restoreState() {
    try {
      if (sessionStorage.getItem(DISMISSED_KEY) === '1') dismissed = true;
    } catch (_) {}
    var saved = null;
    try {
      saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    } catch (_) { saved = null; }
    if (!saved || !saved.track || !saved.track.src) return;
    setTrack(saved.track);
    if (typeof saved.position === 'number' && saved.position > 0) {
      pendingResumePosition = saved.position;
    }
    if (!dismissed) showBar();
  }

  function bindInlinePlayers(root) {
    root = root || document;
    var bars = root.querySelectorAll('.entry-mix-bar[data-track-src]');
    bars.forEach(function (barEl) {
      var btn = barEl.querySelector('[data-play-toggle]');
      if (!btn || btn.dataset.barBound === '1') return;
      btn.dataset.barBound = '1';
      btn.dataset.trackId = barEl.dataset.trackId || '';
      btn.dataset.trackTitle = barEl.dataset.trackTitle || '';
      btn.setAttribute('data-mix-bar-button', '');
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var track = {
          id: barEl.dataset.trackId,
          title: barEl.dataset.trackTitle,
          subtitle: barEl.dataset.trackSubtitle || '',
          src: barEl.dataset.trackSrc,
          href: barEl.dataset.trackHref || ''
        };
        if (currentTrack && currentTrack.id === track.id && audio && !audio.paused) {
          audio.pause();
        } else {
          play(track);
        }
      });
    });
    notifyTrackButtons();
  }

  function bindSetlistPreviews(root) {
    root = root || document;
    var lists = root.querySelectorAll('.setlist-tracks');
    lists.forEach(function (list) {
      if (list.dataset.previewBound === '1') return;
      list.dataset.previewBound = '1';
      list.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-track-preview-button]');
        if (!btn || !list.contains(btn)) return;
        e.preventDefault();
        var track = {
          id: btn.dataset.trackId,
          title: btn.dataset.trackTitle,
          subtitle: btn.dataset.trackSubtitle || '',
          src: btn.dataset.previewSrc,
          compact: true
        };
        if (!track.src) return;
        if (currentTrack && currentTrack.id === track.id && audio && !audio.paused) {
          audio.pause();
        } else {
          play(track);
        }
      });
    });
    notifyTrackButtons();
  }

  function init() {
    if (bar) return;
    buildBar();
    restoreState();
    bindInlinePlayers(document);
    bindSetlistPreviews(document);

    window.fieldNotesAudio = {
      play: play,
      pause: pause,
      toggle: toggle,
      getCurrent: function () { return currentTrack ? Object.assign({}, currentTrack) : null; },
      isPlaying: function () { return !!(audio && !audio.paused); },
      bind: bindInlinePlayers,
      bindPreviews: bindSetlistPreviews,
      close: dismiss,
      _audio: audio
    };

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', function () { if (audio) audio.play(); });
        navigator.mediaSession.setActionHandler('pause', function () { if (audio) audio.pause(); });
        navigator.mediaSession.setActionHandler('seekto', function (details) {
          if (audio && typeof details.seekTime === 'number') audio.currentTime = details.seekTime;
        });
        navigator.mediaSession.setActionHandler('seekforward', function () {
          if (audio && audio.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
        });
        navigator.mediaSession.setActionHandler('seekbackward', function () {
          if (audio && audio.duration) audio.currentTime = Math.max(0, audio.currentTime - 10);
        });
      } catch (_) {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
