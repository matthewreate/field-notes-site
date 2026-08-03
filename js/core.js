(() => {
  const jsonCache = new Map();

  const asText = (value) => (typeof value === "string" ? value.trim() : "");

  const fetchJson = async (path) => {
    const url = new URL(path, window.location.href).href;
    if (jsonCache.has(url)) {
      return jsonCache.get(url);
    }

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Request failed (${response.status}) for ${url}`);
    }

    const payload = await response.json();
    jsonCache.set(url, payload);
    return payload;
  };

  const setText = (element, value) => {
    if (!element) {
      return;
    }
    element.textContent = asText(value);
  };

  const tierPrice = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) {
      return null;
    }
    const step = 20;
    return Math.max(step, Math.round(amount / step) * step);
  };

  const currencyUSD = (value) => {
    const tier = tierPrice(value);
    if (!Number.isFinite(tier)) {
      return "";
    }
    return `$${tier}`;
  };

  const compactMeta = (record) => {
    const year = record?.year ? String(record.year) : "";
    const format = asText(record?.format);
    const media = asText(record?.condition_media);
    const sleeve = asText(record?.condition_sleeve);
    const condition = media || sleeve ? `${media || "?"}/${sleeve || "?"}` : "";
    return [year, format, condition].filter(Boolean).join(" · ");
  };

  const encodeMailtoValue = (value) =>
    encodeURIComponent(value)
      .replace(/%0A/g, "%0D%0A");

  const toMailto = ({ email, subject, body }) => {
    const cleanEmail = asText(email);
    if (!cleanEmail) {
      return "#";
    }

    const queryParts = [];
    const cleanSubject = asText(subject);
    const cleanBody = asText(body);

    if (cleanSubject) {
      queryParts.push(`subject=${encodeMailtoValue(cleanSubject)}`);
    }
    if (cleanBody) {
      const normalizedBody = cleanBody.replace(/\r?\n/g, "\r\n");
      queryParts.push(`body=${encodeMailtoValue(normalizedBody)}`);
    }

    const query = queryParts.join("&");
    return query ? `mailto:${cleanEmail}?${query}` : `mailto:${cleanEmail}`;
  };

  const byPriorityDesc = (items) =>
    [...items].sort((a, b) => Number(b?.display_priority || 0) - Number(a?.display_priority || 0));

  const normalizeIssues = (payload) => {
    if (!Array.isArray(payload?.issues)) {
      return [];
    }

    return payload.issues
      .map((entry) => ({
        id: asText(entry?.id),
        slug: asText(entry?.slug),
        title: asText(entry?.title),
        date: asText(entry?.date),
        date_label: asText(entry?.date_label),
        sort_date: asText(entry?.sort_date),
        sort_index: Number(entry?.sort_index) || 0,
        room_context: asText(entry?.room_context),
        description: asText(entry?.description),
        excerpt: asText(entry?.excerpt),
        related_note_slugs: Array.isArray(entry?.related_note_slugs)
          ? entry.related_note_slugs.map((slug) => asText(slug)).filter(Boolean)
          : [],
      }))
      .filter((entry) => entry.id)
      .sort((left, right) => {
        // sort_date is month-precision by design (anonymity), so it ties often.
        // sort_index carries the true chronological order without exposing a day.
        const indexDelta = (Number(right?.sort_index) || 0) - (Number(left?.sort_index) || 0);
        if (indexDelta) {
          return indexDelta;
        }
        const leftKey = asText(left?.sort_date) || asText(left?.date_label) || asText(left?.date) || asText(left?.id);
        const rightKey = asText(right?.sort_date) || asText(right?.date_label) || asText(right?.date) || asText(right?.id);
        return rightKey.localeCompare(leftKey);
      });
  };

  const siblingHref = (hrefRaw, sibling) => {
    const href = asText(hrefRaw);
    if (!href) {
      return sibling;
    }
    if (href === "./" || href === ".") {
      return `./${sibling}`;
    }
    if (href.endsWith("/")) {
      return `${href}${sibling}`;
    }
    if (href.endsWith("/index.html")) {
      return href.replace(/index\.html$/, sibling);
    }
    return href.replace(/\/?$/, `/${sibling}`);
  };

  const closePrimaryNavMenus = (exceptGroup = null) => {
    document.querySelectorAll(".site-nav-group.is-open").forEach((group) => {
      if (group === exceptGroup) {
        return;
      }

      group.classList.remove("is-open");
      const toggle = group.querySelector(".site-nav-toggle");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  };

  const enhanceSectionReveal = () => {
    if (typeof IntersectionObserver === "undefined") return;

    document.body.classList.add("js-reveal-ready");

    const elements = [...document.querySelectorAll(".site-section, .hero-block")];
    const viewportHeight = window.innerHeight;

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < viewportHeight) {
        el.classList.add("is-prevealed");
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );

    elements.forEach((el) => {
      if (!el.classList.contains("is-prevealed")) {
        observer.observe(el);
      }
    });
  };

  const enhanceHeaderScroll = () => {
    const header = document.querySelector(".site-header");
    if (!header) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        header.classList.toggle("is-scrolled", window.scrollY > 60);
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  };

  const enhancePrimaryNav = () => {
    const currentPath = window.location.pathname;
    const page = document.body?.dataset?.page;

    document.querySelectorAll(".site-nav").forEach((nav) => {
      if (nav.querySelector(".site-nav-group")) {
        return;
      }

      const links = [...nav.querySelectorAll(":scope > a")];
      const notesLink = links.find((link) => {
        const href = asText(link.getAttribute("href"));
        return href === "./notes/" || href === "../notes/" || href === "./" || href === "../";
      });

      if (!notesLink) {
        return;
      }

      const originalHref = asText(notesLink.getAttribute("href"));
      const listeningHref = siblingHref(originalHref, "listening-notes.html");

      const group = document.createElement("div");
      group.className = "site-nav-group";

      nav.insertBefore(group, notesLink);
      group.appendChild(notesLink);
      notesLink.removeAttribute("aria-current");

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "site-nav-toggle";
      toggle.setAttribute("aria-label", "Toggle Notes submenu");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-haspopup", "true");
      group.appendChild(toggle);

      const submenu = document.createElement("div");
      submenu.className = "site-nav-submenu";
      submenu.id = `site-nav-submenu-${Math.random().toString(36).slice(2, 8)}`;
      toggle.setAttribute("aria-controls", submenu.id);

      const listeningLink = document.createElement("a");
      listeningLink.href = listeningHref;
      listeningLink.textContent = "Listening Notes";
      submenu.appendChild(listeningLink);

      group.appendChild(submenu);

      const isNotesPage =
        currentPath.includes("/notes/") || page === "notes-index" || page === "listening-notes";
      const isPlaylistArticle = page === "playlist-article";
      const listeningPath = new URL(listeningLink.href, window.location.href).pathname;
      const isListeningPage = currentPath === listeningPath || page === "listening-notes";

      if (isNotesPage || isPlaylistArticle) {
        notesLink.classList.add("is-active");
      }

      if (isListeningPage) {
        listeningLink.classList.add("is-active");
        listeningLink.setAttribute("aria-current", "page");
      }

      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const willOpen = !group.classList.contains("is-open");
        closePrimaryNavMenus(willOpen ? group : null);
        group.classList.toggle("is-open", willOpen);
        toggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
      });

      group.addEventListener("focusout", (event) => {
        const nextFocused = event.relatedTarget;
        if (nextFocused instanceof Node && group.contains(nextFocused)) {
          return;
        }

        group.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  };

  const enhancePlaylistArticleEmbeds = () => {
    if (document.body?.dataset?.page !== "playlist-article") {
      return;
    }

    const sections = [...document.querySelectorAll("[data-playlist-article-module]")];
    sections.forEach((section) => {
      const toggle = section.querySelector("[data-playlist-article-toggle]");
      const embedWrap = section.querySelector("[data-playlist-article-embed]");
      const iframe = section.querySelector("iframe");

      if (!(toggle instanceof HTMLButtonElement) || !(embedWrap instanceof HTMLElement) || !(iframe instanceof HTMLIFrameElement)) {
        return;
      }

      const updateOpenState = (isOpen) => {
        section.classList.toggle("is-open", isOpen);
        toggle.textContent = isOpen ? "Close" : "Listen";
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        embedWrap.hidden = !isOpen;

        if (isOpen && !iframe.getAttribute("src")) {
          iframe.setAttribute("src", asText(iframe.dataset.src));
        }

        if (!isOpen && iframe.getAttribute("src")) {
          iframe.setAttribute("src", "");
        }
      };

      updateOpenState(false);
      toggle.addEventListener("click", () => {
        const isOpen = toggle.getAttribute("aria-expanded") === "true";
        updateOpenState(!isOpen);
      });
    });
  };

  const enhanceReadingProgress = () => {
    const isLongForm =
      document.querySelector(".note-prose") !== null ||
      document.querySelector(".issue-main") !== null;
    if (!isLongForm) return;

    const bar = document.createElement("div");
    bar.className = "reading-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.prepend(bar);

    if (!CSS.supports("animation-timeline", "scroll()")) {
      let ticking = false;
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const max = document.documentElement.scrollHeight - window.innerHeight;
          bar.style.transform = max > 0 ? `scaleX(${Math.min(window.scrollY / max, 1)})` : "scaleX(0)";
          ticking = false;
        });
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  };

  const enhanceSidenotes = () => {
    const prose = document.querySelector(".note-prose");
    if (!prose) return;

    const mq = window.matchMedia("(min-width: 1080px)");
    if (!mq.matches) return;

    const sidenotes = [...prose.querySelectorAll(".sidenote")];
    sidenotes.forEach((sidenote) => {
      const parentPara = sidenote.closest("p");
      if (!parentPara) return;

      const proseRect = prose.getBoundingClientRect();
      const paraRect = parentPara.getBoundingClientRect();
      const topOffset = paraRect.top - proseRect.top;

      const anchor = document.createElement("div");
      anchor.className = "note-sidenote-anchor";
      anchor.style.top = `${topOffset}px`;
      anchor.textContent = sidenote.textContent;

      prose.appendChild(anchor);
      sidenote.remove();
    });
  };

  enhanceSectionReveal();
  enhanceHeaderScroll();
  enhancePrimaryNav();
  enhancePlaylistArticleEmbeds();
  enhanceReadingProgress();
  enhanceSidenotes();

  document.addEventListener("click", (event) => {
    if (event.target.closest(".site-nav-group")) {
      return;
    }
    closePrimaryNavMenus();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    const openToggle = document.querySelector(".site-nav-group.is-open .site-nav-toggle");
    closePrimaryNavMenus();
    if (openToggle instanceof HTMLElement) {
      openToggle.focus();
    }
  });

  window.FNCore = {
    asText,
    fetchJson,
    setText,
    tierPrice,
    currencyUSD,
    compactMeta,
    toMailto,
    byPriorityDesc,
    normalizeIssues,
  };
})();
