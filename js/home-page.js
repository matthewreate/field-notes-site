/* Home-page interactions: feed filter.
   Uses event delegation so the same listeners survive SPA swaps. */
(function () {
  'use strict';

  document.addEventListener('click', function (e) {
    var span = e.target.closest('.filter-bar > span');
    if (!span) return;
    var filterBar = span.closest('.filter-bar');
    if (!filterBar) return;
    filterBar.querySelectorAll('span').forEach(function (s) {
      s.classList.remove('is-active');
    });
    span.classList.add('is-active');

    var label = span.textContent.trim().toLowerCase();
    var typeMap = { gigs: 'gig', notes: 'note', mixes: 'mix' };
    var filter = typeMap[label] || label;

    var entries = document.querySelectorAll('.feed .entry');
    entries.forEach(function (entry) {
      entry.classList.add('is-fading');
    });

    setTimeout(function () {
      entries.forEach(function (entry) {
        var type = entry.dataset.type || '';
        var show = filter === 'all' || type === filter;
        entry.style.display = show ? '' : 'none';
        if (show) {
          entry.classList.add('is-fading');
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              entry.classList.remove('is-fading');
            });
          });
        }
      });
    }, 180);
  });
}());
