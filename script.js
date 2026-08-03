(() => {
  const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif|avif|heic)$/i;
  const SITE_BASE_URL = "https://matthewreate.github.io/field-notes/";

  // DOM refs are re-cached on each load() so the issue page works after an SPA swap.
  let body;
  let siteRootRaw;
  let siteRootUrl;

  let loadingShell, protocolWarning, page, issueTitle, issueIdMeta, canonicalLink;
  let metaDescription, metaExcerpt, metaRobots;
  let ogTitle, ogDescription, ogUrl, twitterTitle, twitterDescription;
  let issueSchema, issueAiSummary, embeddedPayloadNode, legacyIssueNote;
  let defaultIssueId, issueIndexUrl, reelSvgUrl;

  let contextFields, highlightsList, notesToSelf, notesShell;
  let reviewSection, reviewQuote, reviewLinkWrap, reviewLink;
  let privacyToggle, coverImage, issueCover, issueCard;
  let catalogIssue, catalogDate, catalogSetType, catalogPrivacy;
  let cardDate, cardSetType, cardPrivacy;
  let latestNoteLabel, latestNoteLink, latestNoteExcerpt;
  let issueRelatedNotes, archiveContext, archiveLatestIssue, archiveRelatedNotes;
  let danceSequenceShell, danceSequenceList;

  let audioHost, audioHostCopy, audioSection, audioElement, audioSource;
  let nativeFallbackPlayer, nativeFallbackSource, audioOpenLink;
  let audioFallbackNote, audioFallbackLink;
  let reelPlayer, reelMachine;
  let audioMuteButton, audioScrubber, audioCurrent, audioDuration;
  let audioRateDisplay, playPauseButton, audioFill;

  let photoSection, photoCollection, photoStage, fileList, filesCard;
  let lightbox, lightboxImage, lightboxCaption, lightboxClose, lightboxPrev, lightboxNext;

  const cacheDom = () => {
    body = document.body;
    siteRootRaw = body?.dataset.siteRoot || "./";
    siteRootUrl = new URL(siteRootRaw, window.location.href);

    loadingShell = document.querySelector("[data-loading]");
    protocolWarning = document.querySelector("[data-protocol-warning]");
    page = document.querySelector(".page");
    issueTitle = document.querySelector("[data-issue-title]");
    issueIdMeta = document.querySelector("[data-issue-id-meta]");
    canonicalLink = document.querySelector("[data-page-canonical]");
    metaDescription = document.querySelector('meta[name="description"]');
    metaExcerpt = document.querySelector('meta[name="excerpt"]');
    metaRobots = document.querySelector('meta[name="robots"]');
    ogTitle = document.querySelector('meta[property="og:title"]');
    ogDescription = document.querySelector('meta[property="og:description"]');
    ogUrl = document.querySelector('meta[property="og:url"]');
    twitterTitle = document.querySelector('meta[name="twitter:title"]');
    twitterDescription = document.querySelector('meta[name="twitter:description"]');
    issueSchema = document.querySelector("#issue-schema");
    issueAiSummary = document.querySelector("[data-issue-ai-summary]");
    embeddedPayloadNode = document.querySelector("#issue-payload");
    legacyIssueNote = document.querySelector("[data-legacy-issue-note]");
    defaultIssueId = page?.dataset.defaultIssueId || "BW_ISSUE_001";
    issueIndexUrl = new URL("issues/index.json", siteRootUrl).href;
    reelSvgUrl = new URL("assets/ui/reel_player.svg", siteRootUrl).href;

    contextFields = [...document.querySelectorAll("[data-context-field]")];
    highlightsList = document.querySelector("[data-highlights]");
    notesToSelf = document.querySelector("[data-notes-to-self]");
    notesShell = document.querySelector("[data-notes-shell]");
    reviewSection = document.querySelector("[data-review-section]");
    reviewQuote = document.querySelector("[data-review-quote]");
    reviewLinkWrap = document.querySelector("[data-review-link-wrap]");
    reviewLink = document.querySelector("[data-review-link]");
    privacyToggle = document.querySelector("[data-privacy-toggle]");
    coverImage = document.querySelector("[data-cover-image]");
    issueCover = document.querySelector("[data-issue-cover]");
    issueCard = document.querySelector("[data-issue-card]");
    catalogIssue = document.querySelector("[data-catalog-issue]");
    catalogDate = document.querySelector("[data-catalog-date]");
    catalogSetType = document.querySelector("[data-catalog-set-type]");
    catalogPrivacy = document.querySelector("[data-catalog-privacy]");
    cardDate = document.querySelector("[data-card-date]");
    cardSetType = document.querySelector("[data-card-set-type]");
    cardPrivacy = document.querySelector("[data-card-privacy]");
    latestNoteLabel = document.querySelector("[data-latest-note-label]");
    latestNoteLink = document.querySelector("[data-latest-note-link]");
    latestNoteExcerpt = document.querySelector("[data-latest-note-excerpt]");
    issueRelatedNotes = document.querySelector("[data-issue-related-notes]");
    archiveContext = document.querySelector("[data-archive-context]");
    archiveLatestIssue = document.querySelector("[data-archive-latest-issue]");
    archiveRelatedNotes = document.querySelector("[data-archive-related-notes]");
    danceSequenceShell = document.querySelector("[data-dance-sequence-shell]");
    danceSequenceList = document.querySelector("[data-dance-sequence-list]");

    audioHost = document.querySelector("[data-audio-host]");
    audioHostCopy = document.querySelector("[data-audio-host-copy]");
    audioSection = document.querySelector("#audio");
    audioElement = document.querySelector("[data-audio-element]");
    audioSource = document.querySelector("[data-audio-source]");
    nativeFallbackPlayer = document.querySelector("[data-native-fallback-player]");
    nativeFallbackSource = document.querySelector("[data-native-fallback-source]");
    audioOpenLink = document.querySelector("[data-audio-open]");
    audioFallbackNote = document.querySelector("[data-audio-fallback]");
    audioFallbackLink = document.querySelector("[data-audio-fallback-link]");
    reelPlayer = document.querySelector("[data-reel-player]");
    reelMachine = document.querySelector("[data-reel-machine]");
    audioMuteButton = document.querySelector("[data-audio-mute]");
    audioScrubber = document.querySelector("[data-audio-scrubber]");
    audioCurrent = document.querySelector("[data-audio-current]");
    audioDuration = document.querySelector("[data-audio-duration]");
    audioRateDisplay = document.querySelector("[data-audio-rate-display]");
    playPauseButton = document.querySelector("[data-audio-play-pause]");
    audioFill = document.querySelector("[data-audio-fill]");

    photoSection = document.querySelector("#photo-evidence");
    photoCollection = document.querySelector("[data-photo-collection]");
    photoStage = document.querySelector("[data-photo-stage]");
    fileList = document.querySelector("[data-file-list]");
    filesCard = document.querySelector("[data-files-card]");

    lightbox = document.querySelector("[data-lightbox]");
    lightboxImage = document.querySelector("[data-lightbox-image]");
    lightboxCaption = document.querySelector("[data-lightbox-caption]");
    lightboxClose = document.querySelector("[data-lightbox-close]");
    lightboxPrev = document.querySelector("[data-lightbox-prev]");
    lightboxNext = document.querySelector("[data-lightbox-next]");
  };

  // Document-level keydown listener — bound once across the IIFE's lifetime.
  let kbBound = false;

  const loadingStart = Date.now();
  const privateValue = "Private";
  const unloggedValue = "Not logged";
  const logPrefix = "[Field Notes]";

  let issueEntries = [];
  let siteConfig = {};
  let activePayload = null;
  let renderedPhotos = [];
  let activePhotoIndex = 0;
  let privacyMode = false;  // retired — see currentIssueView()
  let audioReady = false;
  let isScrubbing = false;
  let reelActionNodes = [];
  let currentPlaybackRate = 1;

  const asText = (value) => (typeof value === "string" ? value.trim() : "");

  const stripLeadingSlash = (value) => String(value || "").replace(/^\/+/, "");

  const resolveSiteUrl = (pathRaw) => new URL(stripLeadingSlash(pathRaw), siteRootUrl).href;

  const fetchJson = async (url) => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Request failed (${response.status}) for ${url}`);
    }
    return response.json();
  };

  const fetchText = async (url) => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Request failed (${response.status}) for ${url}`);
    }
    return response.text();
  };

  const setMetaContent = (node, value) => {
    if (node && value) {
      node.setAttribute("content", value);
    }
  };

  const issuePublicPath = (entry) => `issues/${asText(entry?.slug)}/`;

  const issuePublicHref = (entry, hash = "") => {
    const slug = asText(entry?.slug);
    if (slug) {
      return `${resolveSiteUrl(issuePublicPath(entry))}${hash}`;
    }
    const id = asText(entry?.id);
    return `${resolveSiteUrl(`issue.html?id=${encodeURIComponent(id)}`)}${hash}`;
  };

  const issueCanonicalUrl = (payload) => `${SITE_BASE_URL}${stripLeadingSlash(payload?.canonical_path)}`;

  const issueCanonicalPath = (entry) => `/${issuePublicPath(entry)}`;

  const noteHref = (note) => {
    const canonical = asText(note?.canonical_path);
    if (canonical) {
      return resolveSiteUrl(canonical);
    }
    const slug = asText(note?.slug);
    return resolveSiteUrl(`notes/${encodeURIComponent(slug)}.html`);
  };

  const noteExcerpt = (note) => asText(note?.excerpt) || asText(note?.summary);

  const buildTagList = (tagsRaw, limit = 4) => {
    const tags = Array.isArray(tagsRaw)
      ? tagsRaw.map((tag) => asText(tag)).filter(Boolean).slice(0, limit)
      : [];

    if (!tags.length) {
      return null;
    }

    const list = document.createElement("ul");
    list.className = "note-tag-list";

    tags.forEach((tag) => {
      const item = document.createElement("li");
      item.className = "note-tag";
      item.textContent = tag;
      list.appendChild(item);
    });

    return list;
  };

  const asHighlights = (value) =>
    Array.isArray(value) ? value.map((item) => asText(item)).filter(Boolean) : [];

  const normalizeIssueEntries = (payload) => {
    if (!Array.isArray(payload?.issues)) {
      return [];
    }

    return payload.issues
      .map((entry) => ({
        id: asText(entry?.id),
        slug: asText(entry?.slug),
        title: asText(entry?.title),
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
        const leftKey = asText(left?.sort_date) || asText(left?.date_label) || asText(left?.id);
        const rightKey = asText(right?.sort_date) || asText(right?.date_label) || asText(right?.id);
        return rightKey.localeCompare(leftKey);
      });
  };

  const normalizeIssueData = (payload) => ({
    venue: asText(payload?.venue),
    city: asText(payload?.city),
    date: asText(payload?.date),
    set_type: asText(payload?.set_type),
    crowd_note: asText(payload?.crowd_note),
    notes_to_self: asText(payload?.notes_to_self),
    review_quote: asText(payload?.review_quote),
    review_url: asText(payload?.review_url),
    audio_url: asText(payload?.audio_url),
    audio_placeholder_url: asText(payload?.audio_placeholder_url),
    dance_sequence: Array.isArray(payload?.dance_sequence)
      ? payload.dance_sequence.map((item) => asText(item)).filter(Boolean)
      : [],
    highlights: asHighlights(payload?.highlights),
    privacy_default: typeof payload?.privacy_default === "boolean" ? payload.privacy_default : true,
  });

  const deriveIssueDescription = (entry, issueData) => {
    const explicit = asText(entry?.description);
    if (explicit) {
      return explicit;
    }

    const setType = asText(issueData?.set_type);
    const date = asText(issueData?.date);
    if (setType && date && issueData?.privacy_default === false) {
      return `${asText(entry?.title) || "This issue"} documents a ${setType.toLowerCase()} from ${date}, with live set audio, highlights, photos, and room notes from the event.`;
    }

    if (setType) {
      return `${asText(entry?.title) || "This issue"} centers on ${setType.toLowerCase()}, with live set evidence, highlights, photos, and notes from the room.`;
    }

    return (
      asText(siteConfig?.issue_page_description) ||
      "A Field Notes issue page with live set recording, room context, highlights, photos, and notes from a real event."
    );
  };

  const deriveIssueExcerpt = (entry, issueData) => {
    const explicit = asText(entry?.excerpt);
    if (explicit) {
      return explicit;
    }

    const highlight = asHighlights(issueData?.highlights)[0];
    if (highlight) {
      return highlight;
    }

    const notes = asText(issueData?.notes_to_self);
    if (notes) {
      return notes.length > 180 ? `${notes.slice(0, 177)}...` : notes;
    }

    return "A room log from the Field Notes archive, pairing live set evidence with context from the event.";
  };

  const deriveAiSummary = (entry, issueData) => {
    const setType = asText(issueData?.set_type);
    const date = asText(issueData?.date);
    const highlights = asHighlights(issueData?.highlights);
    const base = setType
      ? `This issue documents a real ${setType.toLowerCase()} inside the Field Notes archive, pairing room context, live set evidence, highlights, photos, and post-set notes.`
      : "This issue documents a real room inside the Field Notes archive, pairing room context, live set evidence, highlights, photos, and post-set notes.";

    if (date && issueData?.privacy_default === false) {
      return `${base} The session took place on ${date}.`;
    }

    if (highlights[0]) {
      return `${base} One notable moment from the session: ${highlights[0]}`;
    }

    return base;
  };

  const pathToSitePath = (pathname) => {
    const decoded = decodeURIComponent(pathname || "");
    const rootPath = decodeURIComponent(siteRootUrl.pathname || "/");

    if (rootPath !== "/" && decoded.startsWith(rootPath)) {
      return decoded.slice(rootPath.length);
    }

    if (decoded.startsWith("/")) {
      return decoded.slice(1);
    }

    return decoded;
  };

  const buildSinglePhotoViews = (photo) => [
    {
      path: photo.path,
      name: photo.name,
      frameLabel: "FRAME 01 / WIDE",
      sourceName: photo.name,
      lightboxCaption: `${photo.name} / Wide`,
      cropPosition: "50% 34%",
      frameClass: "is-wide",
    },
    {
      path: photo.path,
      name: photo.name,
      frameLabel: "FRAME 02 / DETAIL",
      sourceName: photo.name,
      lightboxCaption: `${photo.name} / Detail`,
      cropPosition: "42% 54%",
      frameClass: "is-detail",
    },
    {
      path: photo.path,
      name: photo.name,
      frameLabel: "FRAME 03 / BOOTH",
      sourceName: photo.name,
      lightboxCaption: `${photo.name} / Booth`,
      cropPosition: "63% 58%",
      frameClass: "is-booth",
    },
  ];

  const buildPhotoViews = (photoFiles) => {
    if (photoFiles.length === 1) {
      return buildSinglePhotoViews(photoFiles[0]);
    }

    return photoFiles.map((photo, index) => ({
      path: photo.path,
      name: photo.name,
      frameLabel: `FRAME ${String(index + 1).padStart(2, "0")}`,
      sourceName: photo.name,
      lightboxCaption: photo.name,
      frameClass: "",
    }));
  };

  const resolveRelatedNotes = (notesPayload, slugs) => {
    const notes = Array.isArray(notesPayload?.notes) ? notesPayload.notes : [];

    return (Array.isArray(slugs) ? slugs : [])
      .map((slug) => notes.find((note) => asText(note?.slug) === asText(slug)))
      .filter(Boolean)
      .map((note) => ({
        title: asText(note?.title),
        slug: asText(note?.slug),
        canonical_path: asText(note?.canonical_path),
        category: asText(note?.category),
        excerpt: noteExcerpt(note),
        tags: Array.isArray(note?.tags) ? note.tags.map((tag) => asText(tag)).filter(Boolean) : [],
      }));
  };

  const buildPayload = ({ entry, issueData, mediaFiles, notesPayload }) => {
    const imageFiles = mediaFiles.filter((file) => IMAGE_EXTENSIONS.test(file.name));
    const photoViews = buildPhotoViews(imageFiles);
    const coverImage = imageFiles[0]
      ? {
          path: imageFiles[0].path,
          alt: `${asText(entry?.title) || asText(entry?.id)} cover image`,
        }
      : null;

    return {
      id: asText(entry?.id),
      slug: asText(entry?.slug),
      title: asText(entry?.title) || asText(entry?.id),
      canonical_path: issueCanonicalPath(entry),
      description: deriveIssueDescription(entry, issueData),
      excerpt: deriveIssueExcerpt(entry, issueData),
      ai_summary: deriveAiSummary(entry, issueData),
      related_note_slugs: Array.isArray(entry?.related_note_slugs) ? entry.related_note_slugs : [],
      related_notes: resolveRelatedNotes(notesPayload, entry?.related_note_slugs),
      venue: asText(issueData?.venue),
      city: asText(issueData?.city),
      date: asText(issueData?.date),
      set_type: asText(issueData?.set_type),
      crowd_note: asText(issueData?.crowd_note),
      notes_to_self: asText(issueData?.notes_to_self),
      dance_sequence: Array.isArray(issueData?.dance_sequence)
        ? issueData.dance_sequence.map((item) => asText(item)).filter(Boolean)
        : [],
      highlights: asHighlights(issueData?.highlights),
      privacy_default: typeof issueData?.privacy_default === "boolean" ? issueData.privacy_default : true,
      audio_url: asText(issueData?.audio_url),
      audio_placeholder_url: asText(issueData?.audio_placeholder_url),
      media_files: mediaFiles,
      cover_image: coverImage,
      photo_views: photoViews,
    };
  };

  const readEmbeddedPayload = () => {
    const raw = embeddedPayloadNode?.textContent;
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error(`${logPrefix} Embedded issue payload parse error.`, error);
      return null;
    }
  };

  const updateProtocolWarning = () => {
    if (!protocolWarning) {
      return;
    }

    const isFileProtocol = window.location.protocol === "file:";
    protocolWarning.hidden = !isFileProtocol;
    if (isFileProtocol) {
      console.warn(
        `${logPrefix} file:// detected. Run python3 -m http.server 8000 to enable media loading.`
      );
    }
  };

  const isSafeIssueId = (value) => /^[A-Za-z0-9_-]+$/.test(value);

  const loadManifest = async () => {
    try {
      return normalizeIssueEntries(await fetchJson(issueIndexUrl));
    } catch (error) {
      console.error(`${logPrefix} Issue index load error: ${issueIndexUrl}`, error);
      return [];
    }
  };

  const updateHistoryForFallback = (issueId) => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("id") !== issueId) {
      url.searchParams.set("id", issueId);
      window.history.replaceState({}, "", `${url.pathname}?${url.searchParams.toString()}`);
    }
  };

  const findMediaFiles = async (rootPath) => {
    const parser = new DOMParser();
    const queue = [new URL(stripLeadingSlash(rootPath), siteRootUrl)];
    const visitedDirectories = new Set();
    const discoveredFiles = [];

    while (queue.length) {
      const directoryUrl = queue.shift();
      if (!directoryUrl || visitedDirectories.has(directoryUrl.href)) {
        continue;
      }
      visitedDirectories.add(directoryUrl.href);

      let html = "";
      try {
        const response = await fetch(directoryUrl.href, { cache: "no-store" });
        if (!response.ok) {
          console.error(
            `${logPrefix} Media scan request failed: ${directoryUrl.href} (${response.status})`
          );
          continue;
        }
        html = await response.text();
      } catch (error) {
        console.error(`${logPrefix} Media scan fetch error: ${directoryUrl.href}`, error);
        continue;
      }

      const doc = parser.parseFromString(html, "text/html");
      const links = [...doc.querySelectorAll("a[href]")];

      links.forEach((link) => {
        const href = link.getAttribute("href");
        if (!href || href === "../" || href.startsWith("?") || href.startsWith("#")) {
          return;
        }

        const resolved = new URL(href, directoryUrl.href);
        if (resolved.origin !== window.location.origin) {
          return;
        }

        const pathname = decodeURIComponent(resolved.pathname);
        const filename = pathname.split("/").filter(Boolean).pop() || "";

        if (filename.startsWith(".") || filename === ".DS_Store") {
          return;
        }

        if (pathname.endsWith("/")) {
          queue.push(resolved);
          return;
        }

        if (filename.toLowerCase() === "issue.json") {
          return;
        }

        discoveredFiles.push({
          name: filename,
          path: pathToSitePath(pathname),
        });
      });
    }

    const uniqueByPath = new Map();
    discoveredFiles.forEach((file) => {
      const key = file.path.toLowerCase();
      if (!uniqueByPath.has(key)) {
        uniqueByPath.set(key, file);
      }
    });

    return [...uniqueByPath.values()].sort((left, right) => left.path.localeCompare(right.path));
  };

  const loadSiteConfig = async () => {
    try {
      siteConfig = await fetchJson(resolveSiteUrl("data/site.json"));
      if (latestNoteLabel && asText(siteConfig?.issue_latest_note_label)) {
        latestNoteLabel.textContent = asText(siteConfig.issue_latest_note_label);
      }
    } catch (error) {
      console.warn(`${logPrefix} Site config load failed.`, error);
      siteConfig = {};
    }
  };

  const buildLegacyPayload = async () => {
    const requestedId = asText(new URLSearchParams(window.location.search).get("id"));
    const selected =
      (requestedId && isSafeIssueId(requestedId)
        ? issueEntries.find((entry) => entry.id === requestedId)
        : null) || issueEntries[0] || { id: defaultIssueId, slug: "", title: defaultIssueId, related_note_slugs: [] };

    const issueConfigUrl = resolveSiteUrl(`${selected.id}/issue.json`);
    const [issueJson, notesPayload, mediaFiles] = await Promise.all([
      fetchJson(issueConfigUrl).catch(() => ({})),
      fetchJson(resolveSiteUrl("data/notes.json")).catch(() => ({ notes: [] })),
      findMediaFiles(`${selected.id}/`).catch(() => []),
    ]);

    updateHistoryForFallback(selected.id);
    return buildPayload({
      entry: selected,
      issueData: normalizeIssueData(issueJson),
      mediaFiles,
      notesPayload,
    });
  };

  const updateIssueMetadata = (payload, { legacyMode }) => {
    const pageTitle = `${asText(payload?.title) || "Issue"} | Field Notes`;
    const description = asText(payload?.description);
    const canonical = issueCanonicalUrl(payload);

    document.title = pageTitle;
    setMetaContent(metaDescription, description);
    setMetaContent(metaExcerpt, asText(payload?.excerpt) || description);
    setMetaContent(metaRobots, legacyMode ? "noindex,follow" : "index,follow");
    setMetaContent(ogTitle, pageTitle);
    setMetaContent(ogDescription, description);
    setMetaContent(ogUrl, canonical);
    setMetaContent(twitterTitle, pageTitle);
    setMetaContent(twitterDescription, description);

    if (canonicalLink) {
      canonicalLink.setAttribute("href", canonical);
    }

    if (issueAiSummary) {
      issueAiSummary.textContent = asText(payload?.ai_summary);
    }

    if (issueSchema) {
      issueSchema.textContent = JSON.stringify(
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: asText(payload?.title),
          description,
          url: canonical,
          isPartOf: {
            "@type": "WebSite",
            name: "Field Notes",
            url: SITE_BASE_URL,
          },
          about: [
            "issue archive",
            "room notes",
            "live set recording",
            asText(payload?.set_type) || "DJ practice",
          ].filter(Boolean),
          inLanguage: "en-US",
        },
        null,
        2
      );
    }
  };

  const displayValue = (value) => value || unloggedValue;

  const currentIssueView = () => {
    if (!activePayload) {
      return {
        venue: "",
        city: "",
        date: "",
        set_type: "",
      crowd_note: "",
      notes_to_self: "",
      review_quote: "",
      review_url: "",
      dance_sequence: [],
      highlights: [],
    };
    }

    // Privacy mode retired 2026-08-03. Issues carry no couple identity any
    // more, so there is nothing to mask — a page either publishes a field or
    // omits it. Blanking rows to "Private" just made the page look broken.
    return activePayload;

    /* eslint-disable no-unreachable */
    return {
      ...activePayload,
      venue: privateValue,
      city: privateValue,
      crowd_note: privateValue,
      notes_to_self: privateValue,
      review_quote: activePayload.review_quote ? privateValue : "",
      review_url: activePayload.review_url,
      dance_sequence: activePayload.dance_sequence.length ? [privateValue] : [],
      highlights: activePayload.highlights.length
        ? activePayload.highlights.map(() => privateValue)
        : [privateValue],
    };
  };

  const issueCatalogLabel = (issueId) => {
    const match = String(issueId).match(/(\d{1,4})(?!.*\d)/);
    if (!match) {
      return String(issueId || "ISSUE").replace(/_/g, " ").toUpperCase();
    }
    return `ISSUE ${match[1].padStart(3, "0")}`;
  };

  const renderHighlights = (items) => {
    if (!highlightsList) {
      return;
    }

    highlightsList.innerHTML = "";
    const content = items.length ? items : [unloggedValue];

    content.forEach((entry) => {
      const item = document.createElement("li");
      item.textContent = displayValue(entry);
      item.classList.toggle("is-private", item.textContent === privateValue);
      highlightsList.appendChild(item);
    });
  };

  const renderDanceSequence = (items) => {
    if (!danceSequenceShell || !danceSequenceList) {
      return;
    }

    danceSequenceList.innerHTML = "";
    const sequence = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!sequence.length) {
      danceSequenceShell.hidden = true;
      return;
    }

    danceSequenceShell.hidden = false;
    sequence.forEach((entry) => {
      const item = document.createElement("li");
      item.textContent = displayValue(entry);
      item.classList.toggle("is-private", item.textContent === privateValue);
      danceSequenceList.appendChild(item);
    });
  };

  const renderIssueText = () => {
    const data = currentIssueView();

    if (issueTitle) {
      issueTitle.textContent = asText(activePayload?.title) || "Issue";
    }

    if (issueIdMeta) {
      issueIdMeta.textContent = asText(activePayload?.id) || defaultIssueId;
    }

    contextFields.forEach((field) => {
      const key = field.dataset.contextField;
      const value = key ? displayValue(data[key]) : unloggedValue;
      field.textContent = value;
      const isPrivate = value === privateValue;
      field.classList.toggle("is-private", isPrivate);
      const contextRow = field.closest(".liner-row");
      if (contextRow) {
        contextRow.classList.toggle("is-private-row", isPrivate);
      }
    });

    if (notesToSelf) {
      const notesValue = displayValue(data.notes_to_self);
      notesToSelf.textContent = notesValue;
      const notesPrivate = notesValue === privateValue;
      notesToSelf.classList.toggle("is-private", notesPrivate);
      if (notesShell) {
        notesShell.classList.toggle("is-private", notesPrivate);
      }
    }

    if (reviewSection && reviewQuote) {
      const quoteValue = asText(data.review_quote);
      reviewSection.hidden = !quoteValue;
      reviewQuote.textContent = quoteValue ? `"${quoteValue}"` : "";
      reviewQuote.classList.toggle("is-private", quoteValue === privateValue);
      if (reviewLinkWrap && reviewLink) {
        const reviewUrl = asText(activePayload?.review_url);
        const showReviewLink = Boolean(quoteValue && quoteValue !== privateValue && /^https?:\/\//.test(reviewUrl));
        reviewLinkWrap.hidden = !showReviewLink;
        if (showReviewLink) {
          reviewLink.href = reviewUrl;
        }
      }
    }

    if (catalogIssue) {
      catalogIssue.textContent = issueCatalogLabel(activePayload?.id);
    }
    if (catalogDate) {
      catalogDate.textContent = displayValue(data.date);
    }
    if (cardDate) {
      cardDate.textContent = displayValue(data.date);
    }
    if (catalogSetType) {
      catalogSetType.textContent = displayValue(data.set_type);
    }
    if (cardSetType) {
      cardSetType.textContent = displayValue(data.set_type);
    }
    // The PRIVACY chip is retired along with privacy mode — hide the whole row.
    if (catalogPrivacy) {
      const privacyRow = catalogPrivacy.closest(".catalog-privacy");
      if (privacyRow) {
        privacyRow.hidden = true;
      }
    }
    if (cardPrivacy) {
      const privacyRow = cardPrivacy.closest(".issue-card-privacy");
      if (privacyRow) {
        privacyRow.hidden = true;
      }
    }

    renderHighlights(data.highlights);
    renderDanceSequence(data.dance_sequence);
  };

  const syncPrivacyToggle = () => {
    document.body.classList.toggle("is-private-mode", privacyMode);

    if (!privacyToggle) {
      return;
    }

    // Retired: the control has nothing left to toggle.
    privacyToggle.hidden = true;
    return;

    privacyToggle.textContent = `Privacy: ${privacyMode ? "ON" : "OFF"}`;
    privacyToggle.setAttribute("aria-pressed", privacyMode ? "true" : "false");
    privacyToggle.setAttribute(
      "aria-label",
      privacyMode ? "Disable privacy mode" : "Enable privacy mode"
    );
  };

  const applyPrivacyMode = (value) => {
    privacyMode = Boolean(value);
    syncPrivacyToggle();
    renderIssueText();
  };

  const bindPrivacyToggle = () => {
    if (!privacyToggle) {
      return;
    }

    privacyToggle.addEventListener("click", () => {
      const nextValue = !privacyMode;
      applyPrivacyMode(nextValue);
      console.log(`${logPrefix} Privacy mode: ${nextValue ? "ON" : "OFF"}`);
    });
  };

  const setAudioLink = (linkNode, url, label) => {
    if (!linkNode) {
      return;
    }

    const cleanUrl = asText(url);
    if (cleanUrl) {
      linkNode.textContent = label;
      linkNode.setAttribute("href", cleanUrl);
      linkNode.setAttribute("aria-disabled", "false");
      linkNode.setAttribute("target", "_blank");
      linkNode.setAttribute("rel", "noopener noreferrer");
      return;
    }

    linkNode.textContent = "Link coming soon";
    linkNode.setAttribute("href", "#");
    linkNode.setAttribute("aria-disabled", "true");
    linkNode.removeAttribute("target");
    linkNode.removeAttribute("rel");
  };

  const formatClock = (secondsValue) => {
    if (!Number.isFinite(secondsValue) || secondsValue < 0) {
      return "00:00";
    }

    const total = Math.floor(secondsValue);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const setAudioFallback = (visible, url) => {
    if (!audioFallbackNote) {
      return;
    }
    audioFallbackNote.hidden = !visible;
    setAudioLink(audioFallbackLink, url, "Open audio in a new tab");
  };

  const toggleNativeFallbackPlayer = (url, visible) => {
    if (!nativeFallbackPlayer || !nativeFallbackSource) {
      return;
    }

    const cleanUrl = asText(url);
    if (!visible || !cleanUrl) {
      nativeFallbackPlayer.hidden = true;
      nativeFallbackSource.removeAttribute("src");
      nativeFallbackPlayer.load();
      return;
    }

    nativeFallbackSource.src = cleanUrl;
    nativeFallbackPlayer.hidden = false;
    nativeFallbackPlayer.load();
  };

  const syncAudioUi = () => {
    if (!audioElement) {
      return;
    }

    if (audioMuteButton) {
      const isMuted = audioElement.muted;
      audioMuteButton.textContent = isMuted ? "Unmute" : "Mute";
      audioMuteButton.setAttribute("aria-label", isMuted ? "Unmute audio" : "Mute audio");
      audioMuteButton.setAttribute("aria-pressed", String(isMuted));
    }

    if (audioCurrent) {
      audioCurrent.textContent = formatClock(audioElement.currentTime || 0);
    }

    if (audioDuration) {
      audioDuration.textContent = formatClock(audioElement.duration || 0);
    }

    if (audioScrubber && !isScrubbing) {
      const duration = Number.isFinite(audioElement.duration) && audioElement.duration > 0
        ? audioElement.duration
        : 0;
      const nextValue = duration ? Math.round((audioElement.currentTime / duration) * 1000) : 0;
      audioScrubber.value = String(nextValue);
    }

    const isPlaying = !audioElement.paused && !audioElement.ended;
    if (reelPlayer) {
      reelPlayer.classList.toggle("is-playing", isPlaying);
    }

    if (playPauseButton) {
      playPauseButton.textContent = isPlaying ? "Pause" : "Play";
      playPauseButton.setAttribute("aria-label", isPlaying ? "Pause audio" : "Play audio");
      playPauseButton.setAttribute("aria-pressed", String(isPlaying));
    }

    if (audioFill && audioElement.duration) {
      const pct = (audioElement.currentTime / audioElement.duration) * 100;
      audioFill.style.width = `${isNaN(pct) ? 0 : pct}%`;
    }
  };

  const setPlaybackRate = (rate) => {
    if (!audioElement) {
      return;
    }
    currentPlaybackRate = rate;
    audioElement.playbackRate = rate;
    syncAudioUi();
  };

  const runAudioAction = async (action) => {
    if (!audioElement) {
      return;
    }

    if (action === "play") {
      try {
        await audioElement.play();
      } catch (error) {
        console.warn(`${logPrefix} Audio play blocked.`, error);
      }
      return;
    }

    if (action === "pause") {
      audioElement.pause();
      return;
    }

    if (action === "stop") {
      audioElement.pause();
      audioElement.currentTime = 0;
      syncAudioUi();
      return;
    }

    if (action === "rpm33") {
      setPlaybackRate(1);
      return;
    }

    if (action === "rpm45") {
      setPlaybackRate(1.3636);
    }
  };

  const loadReelSvg = async () => {
    if (!reelMachine) {
      return false;
    }

    try {
      const svgText = await fetchText(reelSvgUrl);
      reelMachine.innerHTML = svgText;
    } catch (error) {
      console.error(`${logPrefix} Reel SVG load error: ${reelSvgUrl}`, error);
      reelMachine.innerHTML = "";
      return false;
    }

    const svgRoot = reelMachine.querySelector("svg");
    if (!(svgRoot instanceof SVGSVGElement)) {
      reelMachine.innerHTML = "";
      return false;
    }

    svgRoot.classList.add("reel-machine-svg");
    reelActionNodes = [...svgRoot.querySelectorAll("[data-action]")];
    if (!reelActionNodes.length) {
      reelMachine.innerHTML = "";
      return false;
    }

    reelActionNodes.forEach((node) => {
      node.setAttribute("role", "button");
      node.setAttribute("tabindex", "0");
      node.addEventListener("click", () => {
        const action = node.getAttribute("data-action");
        if (action) {
          void runAudioAction(action);
        }
      });
      node.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }
        event.preventDefault();
        const action = node.getAttribute("data-action");
        if (action) {
          void runAudioAction(action);
        }
      });
    });

    return true;
  };

  const bindAudioControls = () => {
    if (!audioElement || audioReady) {
      return;
    }

    if (audioMuteButton) {
      audioMuteButton.addEventListener("click", () => {
        audioElement.muted = !audioElement.muted;
        syncAudioUi();
      });
    }

    if (playPauseButton) {
      playPauseButton.addEventListener("click", async () => {
        if (audioElement.paused) {
          await audioElement.play();
        } else {
          audioElement.pause();
        }
      });
    }

    if (audioScrubber) {
      audioScrubber.addEventListener("input", () => {
        isScrubbing = true;
        const duration = Number.isFinite(audioElement.duration) && audioElement.duration > 0
          ? audioElement.duration
          : 0;
        const ratio = Number(audioScrubber.value) / 1000;
        const previewTime = duration * ratio;
        if (audioCurrent) {
          audioCurrent.textContent = formatClock(previewTime);
        }
        if (audioFill && duration) {
          audioFill.style.width = `${ratio * 100}%`;
        }
      });

      audioScrubber.addEventListener("change", () => {
        const duration = Number.isFinite(audioElement.duration) && audioElement.duration > 0
          ? audioElement.duration
          : 0;
        const ratio = Number(audioScrubber.value) / 1000;
        audioElement.currentTime = duration * ratio;
        isScrubbing = false;
        syncAudioUi();
      });
    }

    audioElement.addEventListener("loadedmetadata", () => {
      setAudioFallback(false, audioElement.currentSrc);
      syncAudioUi();
    });
    audioElement.addEventListener("timeupdate", syncAudioUi);
    audioElement.addEventListener("play", syncAudioUi);
    audioElement.addEventListener("pause", syncAudioUi);
    audioElement.addEventListener("ended", syncAudioUi);
    audioElement.addEventListener("volumechange", syncAudioUi);
    audioElement.addEventListener("ratechange", syncAudioUi);
    audioElement.addEventListener("error", () => {
      setAudioFallback(Boolean(audioElement.currentSrc), audioElement.currentSrc);
      if (audioHostCopy) {
        audioHostCopy.textContent = "Playback blocked in this browser. Use the direct link below.";
      }
      if (reelPlayer) {
        reelPlayer.hidden = true;
      }
      toggleNativeFallbackPlayer(audioElement.currentSrc, Boolean(audioElement.currentSrc));
    });

    setPlaybackRate(1);
    syncAudioUi();
    audioReady = true;
  };

  const renderAudioHost = async () => {
    if (!audioHost) {
      return;
    }

    const directUrl = asText(activePayload?.audio_url);
    if (!directUrl) {
      if (audioSection) {
        audioSection.hidden = true;
      }
      return;
    }
    if (audioSection) {
      audioSection.hidden = false;
    }

    if (audioHostCopy) {
      audioHostCopy.textContent = "A single pass from the room.";
    }

    if (audioSource && audioElement) {
      audioSource.src = directUrl;
      audioElement.load();
    }
    if (nativeFallbackSource && nativeFallbackPlayer) {
      nativeFallbackSource.src = directUrl;
      nativeFallbackPlayer.hidden = true;
      nativeFallbackPlayer.load();
    }

    if (reelPlayer) {
      reelPlayer.hidden = false;
    }

    setAudioLink(audioOpenLink, directUrl, "Open audio in a new tab");
    setAudioFallback(false, directUrl);

    bindAudioControls();
    syncAudioUi();
  };

  const renderLatestIssue = () => {
    if (!latestNoteLink || !latestNoteExcerpt) {
      if (archiveLatestIssue) {
        archiveLatestIssue.hidden = true;
      }
      syncArchiveContext();
      return;
    }

    const latest = issueEntries[0];
    if (!latest) {
      if (archiveLatestIssue) {
        archiveLatestIssue.hidden = true;
      }
      latestNoteLink.textContent = "Open Field Notes";
      latestNoteLink.href = resolveSiteUrl("field-notes.html");
      latestNoteExcerpt.textContent = "No issue index available yet.";
      syncArchiveContext();
      return;
    }

    if (archiveLatestIssue) {
      archiveLatestIssue.hidden = false;
    }
    latestNoteLink.textContent = asText(latest.title) || asText(latest.id);
    latestNoteLink.href = issuePublicHref(latest);
    latestNoteExcerpt.textContent =
      asText(latest.excerpt) || asText(latest.description) || "Latest issue excerpt unavailable.";
    syncArchiveContext();
  };

  const renderRelatedNotes = () => {
    if (!issueRelatedNotes) {
      if (archiveRelatedNotes) {
        archiveRelatedNotes.hidden = true;
      }
      syncArchiveContext();
      return;
    }

    issueRelatedNotes.innerHTML = "";
    const notes = Array.isArray(activePayload?.related_notes) ? activePayload.related_notes : [];

    if (!notes.length) {
      if (archiveRelatedNotes) {
        archiveRelatedNotes.hidden = true;
      }
      issueRelatedNotes.innerHTML = "";
      syncArchiveContext();
      return;
    }

    if (archiveRelatedNotes) {
      archiveRelatedNotes.hidden = false;
    }
    notes.forEach((note) => {
      const article = document.createElement("article");
      article.className = "editorial-card hub-note-card";

      const kicker = document.createElement("p");
      kicker.className = "card-kicker";
      kicker.textContent = asText(note?.category) || "Note";

      const title = document.createElement("h3");
      title.className = "card-title hub-note-title";
      const link = document.createElement("a");
      link.href = noteHref(note);
      link.textContent = asText(note?.title) || asText(note?.slug);
      title.appendChild(link);

      const copy = document.createElement("p");
      copy.className = "card-copy hub-note-copy";
      copy.textContent = noteExcerpt(note);

      article.append(kicker, title, copy);

      const tags = buildTagList(note?.tags, 4);
      if (tags) {
        article.appendChild(tags);
      }

      issueRelatedNotes.appendChild(article);
    });
    syncArchiveContext();
  };

  const syncArchiveContext = () => {
    if (!archiveContext) {
      return;
    }

    const latestHidden = archiveLatestIssue ? archiveLatestIssue.hidden : true;
    const relatedHidden = archiveRelatedNotes ? archiveRelatedNotes.hidden : true;
    archiveContext.hidden = latestHidden && relatedHidden;
  };

  const setCoverStripImage = () => {
    if (!coverImage) {
      return;
    }

    const cover = activePayload?.cover_image;
    if (!cover?.path) {
      coverImage.removeAttribute("src");
      coverImage.alt = "";
      if (issueCover) {
        issueCover.hidden = true;
      }
      if (issueCard) {
        issueCard.hidden = false;
      }
      return;
    }

    coverImage.src = resolveSiteUrl(cover.path);
    coverImage.alt = asText(cover.alt) || `${asText(activePayload?.title) || asText(activePayload?.id)} cover image`;

    if (issueCover) {
      issueCover.hidden = false;
    }
    if (issueCard) {
      issueCard.hidden = true;
    }
  };

  const openLightbox = (index) => {
    if (!lightbox || !lightboxImage || !lightboxCaption || !renderedPhotos.length) {
      return;
    }

    activePhotoIndex = (index + renderedPhotos.length) % renderedPhotos.length;
    const photo = renderedPhotos[activePhotoIndex];
    lightboxImage.src = resolveSiteUrl(photo.path);
    lightboxImage.alt = photo.lightboxCaption || photo.name;
    lightboxCaption.textContent = photo.lightboxCaption || photo.name;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("has-overlay");
  };

  const closeLightbox = () => {
    if (!lightbox || !lightboxImage || !lightboxCaption) {
      return;
    }

    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.src = "";
    lightboxImage.alt = "";
    lightboxCaption.textContent = "";
    document.body.classList.remove("has-overlay");
  };

  const showNextLightboxPhoto = (direction) => {
    if (!renderedPhotos.length) {
      return;
    }
    openLightbox(activePhotoIndex + direction);
  };

  const renderPhotoSection = () => {
    if (!photoCollection) {
      return;
    }

    photoCollection.innerHTML = "";
    renderedPhotos = Array.isArray(activePayload?.photo_views) ? activePayload.photo_views : [];

    if (!renderedPhotos.length) {
      if (photoSection) {
        photoSection.hidden = true;
      }
      return;
    }

    if (photoSection) {
      photoSection.hidden = false;
    }
    if (photoStage) {
      photoStage.hidden = false;
    }
    photoCollection.classList.toggle("is-single-contact", renderedPhotos.length === 3);

    const list = document.createElement("ul");
    list.className = "photo-grid";

    renderedPhotos.forEach((photo, index) => {
      const item = document.createElement("li");
      const figure = document.createElement("figure");
      figure.className = "photo-card";
      if (photo.frameClass) {
        figure.classList.add(photo.frameClass);
      }

      const button = document.createElement("button");
      button.className = "photo-button";
      button.type = "button";
      button.dataset.photoIndex = String(index);
      button.setAttribute("aria-label", `Open ${photo.lightboxCaption || photo.name} full-screen`);

      const resolvedPhotoSrc = resolveSiteUrl(photo.path);
      if (photo.cropPosition) {
        button.classList.add("is-crop");
        const crop = document.createElement("span");
        crop.className = "photo-crop";
        crop.style.backgroundImage = `url("${resolvedPhotoSrc}")`;
        crop.style.backgroundPosition = photo.cropPosition;
        button.appendChild(crop);
      } else {
        const image = document.createElement("img");
        image.src = resolvedPhotoSrc;
        image.alt = photo.lightboxCaption || photo.sourceName || photo.name;
        image.loading = "lazy";
        image.decoding = "async";
        button.appendChild(image);
      }

      const caption = document.createElement("figcaption");
      const frameMark = document.createElement("span");
      frameMark.className = "frame-mark";
      frameMark.textContent = photo.frameLabel;

      const frameSource = document.createElement("span");
      frameSource.className = "frame-source";
      frameSource.textContent = photo.sourceName;

      caption.append(frameMark, frameSource);
      figure.append(button, caption);
      item.appendChild(figure);
      list.appendChild(item);
    });

    photoCollection.appendChild(list);
  };

  const renderFileList = () => {
    if (!fileList) {
      return;
    }

    const usefulFiles = Array.isArray(activePayload?.media_files) ? activePayload.media_files : [];
    fileList.innerHTML = "";

    if (!usefulFiles.length) {
      if (filesCard) {
        filesCard.hidden = true;
      }
      return;
    }

    if (filesCard) {
      filesCard.hidden = false;
    }

    usefulFiles.forEach((file) => {
      const item = document.createElement("li");
      const code = document.createElement("code");
      code.textContent = file.path;
      item.appendChild(code);
      fileList.appendChild(item);
    });
  };

  const renderIssue = (payload, { legacyMode }) => {
    activePayload = payload;
    privacyMode = false;  // retired 2026-08-03; privacy_default no longer gates rendering
    syncPrivacyToggle();
    updateIssueMetadata(payload, { legacyMode });
    renderIssueText();
    renderRelatedNotes();
    renderLatestIssue();
    setCoverStripImage();
    renderPhotoSection();
    renderFileList();
    if (legacyIssueNote) {
      legacyIssueNote.hidden = !legacyMode;
    }
  };

  const isInteractiveElement = (target) => {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    return (
      target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(target.tagName)
    );
  };

  const bindGlobalKeyboard = () => {
    if (kbBound) return;
    kbBound = true;
    document.addEventListener("keydown", (event) => {
      if (isInteractiveElement(event.target)) {
        return;
      }

      const lightboxOpen = Boolean(lightbox && lightbox.classList.contains("is-open"));
      if (!lightboxOpen) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextLightboxPhoto(1);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showNextLightboxPhoto(-1);
      }
    });
  };

  const bindLightboxEvents = () => {
    if (photoCollection) {
      photoCollection.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }

        const button = target.closest("[data-photo-index]");
        if (!(button instanceof HTMLElement)) {
          return;
        }

        openLightbox(Number(button.dataset.photoIndex || "0"));
      });
    }

    if (lightboxClose) {
      lightboxClose.addEventListener("click", closeLightbox);
    }
    if (lightboxPrev) {
      lightboxPrev.addEventListener("click", () => showNextLightboxPhoto(-1));
    }
    if (lightboxNext) {
      lightboxNext.addEventListener("click", () => showNextLightboxPhoto(1));
    }
    if (lightbox) {
      lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) {
          closeLightbox();
        }
      });
    }
  };

  const finishLoadingState = () => {
    if (!loadingShell) {
      return;
    }

    const elapsed = Date.now() - loadingStart;
    const delay = Math.max(40 - elapsed, 0);

    window.setTimeout(() => {
      loadingShell.classList.add("is-hidden");
      loadingShell.setAttribute("aria-hidden", "true");
      window.setTimeout(() => {
        loadingShell.hidden = true;
      }, 180);
    }, delay);
  };

  const initialize = async () => {
    cacheDom();
    updateProtocolWarning();
    bindGlobalKeyboard();
    bindLightboxEvents();
    bindPrivacyToggle();

    await loadSiteConfig();
    issueEntries = await loadManifest();

    const embeddedPayload = readEmbeddedPayload();
    const legacyMode = !embeddedPayload;
    const payload = embeddedPayload || (await buildLegacyPayload());

    renderIssue(payload, { legacyMode });
    await renderAudioHost();
  };

  const runInitialize = () => initialize()
    .catch((error) => {
      console.error(`${logPrefix} Initialization error.`, error);
      if (photoSection) {
        photoSection.hidden = true;
      }
      if (filesCard) {
        filesCard.hidden = true;
      }
      void renderAudioHost();
    })
    .finally(() => {
      finishLoadingState();
    });

  // Public API: SPA shim calls window.fieldNotesIssue.load() after swapping to an issue page.
  window.fieldNotesIssue = { load: runInitialize };

  // Auto-run only on pages that have the issue payload host. Non-issue pages
  // load script.js too (it's deferred globally via the page wiring) but should
  // be inert — there's no #issue-payload to render on home/notes/etc.
  if (document.querySelector("#issue-payload") || document.querySelector("[data-audio-host]")) {
    runInitialize();
  }
})();
