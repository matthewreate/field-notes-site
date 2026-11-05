/* Counts page views on www.matthewreate.com, so a quiet month can be told apart from a
   month nobody saw. No cookies. Sends the page, whether it's the first page of this tab's
   visit, and the site you came from; nothing about you is stored. The worker is in
   workers/site-count. Open any page once with ?nocount to stop counting that browser. */
(() => {
  if (!/(^|\.)matthewreate\.com$/.test(location.hostname)) return;
  try {
    if (/[?&]nocount\b/.test(location.search)) localStorage.setItem("nocount", "1");
    if (localStorage.getItem("nocount")) return;
    const first = !sessionStorage.getItem("seen");
    sessionStorage.setItem("seen", "1");
    let ref = "";
    if (document.referrer) {
      const host = new URL(document.referrer).hostname;
      if (host !== location.hostname) ref = host;
    }
    navigator.sendBeacon(
      "https://site-count.matthewreate.workers.dev/hit",
      new Blob([JSON.stringify({ p: location.pathname, first, ref })], { type: "text/plain" })
    );
  } catch (e) {}
})();
