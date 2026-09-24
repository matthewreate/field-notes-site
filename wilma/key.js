/* Type w-i-l-m-a anywhere on the site to meet Wilma.
   Every page loads this (build_site.py adds it to the shell). Letters typed
   into a form field don't count, and neither do shortcuts like ⌘W. */
(() => {
  const here = document.currentScript.src;
  const door = new URL(location.protocol === "file:" ? "index.html" : "./", here).href;
  const word = "wilma";
  let typed = "";
  addEventListener("keydown", event => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.key.length !== 1) return;
    const el = event.target;
    if (el.isContentEditable || (el.closest && el.closest("input, textarea, select"))) {
      typed = "";
      return;
    }
    typed = (typed + event.key.toLowerCase()).slice(-word.length);
    if (typed === word) location.href = door;
  });
})();
