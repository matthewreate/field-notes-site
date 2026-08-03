(() => {
  const core = window.FNCore;
  if (!core) {
    return;
  }

  const {
    asText,
    fetchJson,
    setText,
    toMailto,
    normalizeIssues,
  } = core;

  const body = document.body;
  const page = body?.dataset?.page;
  const HOME_RECORD_FOCUS_COUNT = 3;
  const HOME_RECORD_DISCOVERY_COUNT = 1;
  const RECORDS_SALE_FOCUS_COUNT = 7;
  const RECORDS_SALE_DISCOVERY_COUNT = 3;
  const RECORDS_ARCHIVE_FOCUS_COUNT = 6;
  const RECORDS_ARCHIVE_DISCOVERY_COUNT = 2;

  const siteTitleNodes = [...document.querySelectorAll("[data-site-title]")];
  const ecosystemNodes = [...document.querySelectorAll("[data-ecosystem-statement]")];

  const issueHref = (issue, hash = "") => {
    const slug = asText(issue?.slug);
    const suffix = hash ? `${hash}` : "";
    if (slug) {
      return `./issues/${encodeURIComponent(slug)}/${suffix}`;
    }
    const id = asText(issue?.id);
    return `./issue.html?id=${encodeURIComponent(id)}${suffix}`;
  };

  const fetchImageMap = async () => {
    try {
      return await fetchJson("./data/images.json");
    } catch (error) {
      console.warn("[Field Notes] images.json unavailable:", error);
      return {};
    }
  };

  const getByPath = (target, pathRaw) => {
    const path = asText(pathRaw);
    if (!path) {
      return undefined;
    }
    return path.split(".").reduce((acc, key) => {
      if (!acc || typeof acc !== "object") {
        return undefined;
      }
      return acc[key];
    }, target);
  };

  const normalizeRatio = (ratioRaw) => {
    const ratio = asText(ratioRaw).toLowerCase();
    if (ratio === "square" || ratio === "1:1") {
      return "square";
    }
    if (ratio === "16:9") {
      return "16:9";
    }
    return "4:3";
  };

  const ratioClassName = (ratioRaw) => {
    const ratio = normalizeRatio(ratioRaw);
    if (ratio === "square") {
      return "is-square";
    }
    if (ratio === "16:9") {
      return "is-16x9";
    }
    return "is-4x3";
  };

  const defaultSizes = (ratioRaw) => {
    const ratio = normalizeRatio(ratioRaw);
    if (ratio === "square") {
      return "(min-width: 1040px) 300px, (min-width: 760px) 34vw, 92vw";
    }
    if (ratio === "16:9") {
      return "(min-width: 1040px) 760px, 100vw";
    }
    return "(min-width: 1040px) 520px, 100vw";
  };

  const renderPlaceholder = (frameNode, labelRaw) => {
    const placeholder = document.createElement("div");
    placeholder.className = "media-placeholder";

    const label = document.createElement("span");
    label.className = "media-placeholder-label";
    label.textContent = asText(labelRaw) || "Detail image";

    placeholder.appendChild(label);
    frameNode.appendChild(placeholder);
  };

  const mountMediaFigure = (figureNode, options = {}) => {
    if (!figureNode) {
      return;
    }

    const ratio = normalizeRatio(options?.ratio);
    const label = asText(options?.label) || "Detail image";
    const src = asText(options?.src);
    const alt = asText(options?.alt) || label;
    const caption = asText(options?.caption);
    const isHero = Boolean(options?.hero);

    figureNode.innerHTML = "";

    const frame = document.createElement("div");
    frame.className = `media-frame ${ratioClassName(ratio)}`;

    if (src) {
      const image = document.createElement("img");
      image.className = "media-img";
      image.src = src;
      const srcset = asText(options?.srcset);
      if (srcset) {
        image.srcset = srcset;
      }
      image.alt = alt;
      image.sizes = asText(options?.sizes) || defaultSizes(ratio);
      if (!isHero) {
        image.loading = "lazy";
      }
      image.decoding = "async";
      image.addEventListener("error", () => {
        image.remove();
        renderPlaceholder(frame, label);
      });
      frame.appendChild(image);
    } else {
      renderPlaceholder(frame, label);
    }

    figureNode.appendChild(frame);

    if (caption) {
      const captionNode = document.createElement("figcaption");
      captionNode.className = "media-caption";
      captionNode.textContent = caption;
      figureNode.appendChild(captionNode);
    }
  };

  const normalizeHeroPrints = (printsRaw, labelFallback) =>
    (Array.isArray(printsRaw) ? printsRaw : [])
      .map((print, index) => ({
        index,
        src: asText(print?.src),
        alt: asText(print?.alt) || labelFallback,
      }))
      .filter((print) => print.src);

  const mountHomeHeroPrintStack = (figureNode, options = {}) => {
    if (!figureNode) {
      return;
    }

    const ratio = normalizeRatio(options?.ratio);
    const label = asText(options?.label) || "Hero image";
    const sizes = asText(options?.sizes) || defaultSizes(ratio);
    const controlLabel = asText(options?.controlLabel) || "next room";
    const prints = normalizeHeroPrints(options?.prints, label);
    const fallbackSrc = asText(options?.src);
    const fallbackAlt = asText(options?.alt) || label;
    const fallbackCaption = asText(options?.caption);
    const fallbackPrint =
      prints[0] ||
      (fallbackSrc
        ? {
            index: 0,
            src: fallbackSrc,
            alt: fallbackAlt,
          }
        : null);

    if (!fallbackPrint?.src) {
      console.warn("[Field Notes] home.hero has no valid image source; using generic figure fallback.");
      mountMediaFigure(figureNode, options);
      return;
    }

    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let currentIndex = Number.isFinite(Number(options?.initialIndex))
      ? Number(options.initialIndex)
      : 0;
    const stackPrints = prints.length ? prints : [fallbackPrint];
    currentIndex = ((currentIndex % stackPrints.length) + stackPrints.length) % stackPrints.length;

    let activeLayer = 0;
    let isAnimating = false;

    figureNode.innerHTML = "";
    figureNode.classList.add("media-slot-hero-stack");

    const stack = document.createElement("div");
    stack.className = "hero-print-stack";

    const backPrintOne = document.createElement("span");
    backPrintOne.className = "hero-print-back is-back-one";
    backPrintOne.setAttribute("aria-hidden", "true");

    const backPrintTwo = document.createElement("span");
    backPrintTwo.className = "hero-print-back is-back-two";
    backPrintTwo.setAttribute("aria-hidden", "true");

    const surface = document.createElement("div");
    surface.className = "hero-print-surface";

    const frame = document.createElement("div");
    frame.className = `media-frame hero-print-frame ${ratioClassName(ratio)}`;

    const imageLayers = [0, 1].map(() => {
      const image = document.createElement("img");
      image.className = "media-img hero-print-image";
      image.sizes = sizes;
      image.decoding = "async";
      image.loading = "eager";
      return image;
    });

    const applyPrintToLayer = (image, print, isActive) => {
      image.src = print.src;
      image.alt = print.alt;
      image.dataset.printIndex = String(print.index);
      image.classList.remove("is-entering", "is-exit", "is-ready");
      if (isActive) {
        image.classList.add("is-active");
        image.removeAttribute("aria-hidden");
      } else {
        image.classList.remove("is-active");
        image.setAttribute("aria-hidden", "true");
      }
    };

    applyPrintToLayer(imageLayers[0], stackPrints[currentIndex], true);
    applyPrintToLayer(imageLayers[1], stackPrints[(currentIndex + 1) % stackPrints.length], false);

    imageLayers.forEach((image) => {
      image.addEventListener(
        "error",
        () => {
          if (image.classList.contains("is-active") && fallbackSrc) {
            image.src = fallbackSrc;
            image.alt = fallbackAlt;
            return;
          }

          if (image.classList.contains("is-active")) {
            console.warn("[Field Notes] hero print failed to load; falling back to static hero image.");
            figureNode.classList.remove("media-slot-hero-stack");
            mountMediaFigure(figureNode, {
              src: fallbackSrc,
              alt: fallbackAlt,
              caption: fallbackCaption,
              ratio,
              label,
              hero: true,
              sizes,
            });
          }
        },
        { once: true }
      );
    });

    imageLayers.forEach((image) => frame.appendChild(image));
    surface.appendChild(frame);
    stack.append(backPrintTwo, backPrintOne, surface);
    figureNode.appendChild(stack);

    const controls = document.createElement("div");
    controls.className = "hero-print-controls";

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "hero-print-next";
    nextButton.textContent = controlLabel;
    nextButton.setAttribute("aria-label", "Show the next room photograph");
    nextButton.disabled = stackPrints.length < 2;
    controls.appendChild(nextButton);
    figureNode.appendChild(controls);

    stackPrints.forEach((print) => {
      if (!print.src) {
        return;
      }
      const preload = new Image();
      preload.src = print.src;
    });

    nextButton.addEventListener("click", () => {
      if (isAnimating || stackPrints.length < 2) {
        return;
      }

      const nextIndex = (currentIndex + 1) % stackPrints.length;
      const currentImage = imageLayers[activeLayer];
      const nextLayer = activeLayer === 0 ? 1 : 0;
      const nextImage = imageLayers[nextLayer];

      applyPrintToLayer(nextImage, stackPrints[nextIndex], false);

      if (prefersReducedMotion) {
        currentImage.classList.remove("is-active");
        currentImage.setAttribute("aria-hidden", "true");
        nextImage.classList.add("is-active");
        nextImage.removeAttribute("aria-hidden");
        currentIndex = nextIndex;
        activeLayer = nextLayer;
        return;
      }

      isAnimating = true;
      stack.classList.add("is-swapping");
      nextImage.classList.add("is-ready");
      nextImage.removeAttribute("aria-hidden");
      void nextImage.offsetWidth;
      nextImage.classList.add("is-active", "is-entering");
      currentImage.classList.add("is-exit");

      window.setTimeout(() => {
        currentImage.classList.remove("is-active", "is-exit", "is-entering", "is-ready");
        currentImage.setAttribute("aria-hidden", "true");
        nextImage.classList.remove("is-entering", "is-ready");
        stack.classList.remove("is-swapping");
        currentIndex = nextIndex;
        activeLayer = nextLayer;
        isAnimating = false;
      }, 320);
    });

    // Arrow key navigation when the button is focused
    nextButton.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        nextButton.click();
      }
    });

    // Touch swipe: left swipe advances the carousel
    let touchStartX = 0;
    surface.addEventListener("touchstart", (event) => {
      touchStartX = event.touches[0].clientX;
    }, { passive: true });
    surface.addEventListener("touchend", (event) => {
      if (event.changedTouches[0].clientX - touchStartX < -40) {
        nextButton.click();
      }
    }, { passive: true });
  };

  const recordYear = (record) => asText(record?.release_year) || asText(record?.year);

  const recordLabel = (record) => asText(record?.label);

  const normalizeGrade = (gradeRaw) => {
    const clean = asText(gradeRaw);
    if (!clean) {
      return "";
    }

    if (clean === "Generic") {
      return "Generic";
    }

    const compact = clean.replace(/\s+/g, " ").trim();
    const explicitMatch = compact.match(/\(([^)]+)\)/);
    if (explicitMatch) {
      const normalized = explicitMatch[1].replace(/\s+/g, "").toUpperCase();
      if (normalized === "NMORM-") {
        return "NM";
      }
      return normalized;
    }

    const upper = compact.toUpperCase();
    if (upper === "NM OR M-") {
      return "NM";
    }
    if (["VG+", "VG", "G+", "G", "NM", "M-", "GENERIC"].includes(upper)) {
      return upper === "GENERIC" ? "Generic" : upper === "M-" ? "NM" : upper;
    }

    const tokenMatch = upper.match(/\b(VG\+|VG|G\+|G|NM|M-)\b/);
    if (tokenMatch) {
      return tokenMatch[1] === "M-" ? "NM" : tokenMatch[1];
    }

    return compact;
  };

  const RECORD_GRADE_RANK = {
    NM: 8,
    "VG+": 7,
    VG: 6,
    "G+": 5,
    G: 4,
    F: 3,
    P: 2,
    GENERIC: 1,
    "": 0,
  };

  const gradeRank = (gradeRaw) => RECORD_GRADE_RANK[normalizeGrade(gradeRaw).toUpperCase()] ?? 0;

  const normalizeDuplicatePart = (valueRaw) =>
    asText(valueRaw)
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const recordDuplicateKey = (record) => {
    const artist = normalizeDuplicatePart(record?.artist);
    const title = normalizeDuplicatePart(record?.title);
    if (!artist || !title) {
      return "";
    }
    return `${artist}::${title}`;
  };

  const hashSeed = (text) => {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  const mulberry32 = (seed) => {
    let t = seed >>> 0;
    return () => {
      t += 0x6d2b79f5;
      let n = Math.imul(t ^ (t >>> 15), t | 1);
      n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
      return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
    };
  };

  const shuffled = (items, seedText) => {
    const arr = [...items];
    const rand = mulberry32(hashSeed(seedText));
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const createRandomSeedText = (label) => {
    if (window.crypto && typeof window.crypto.getRandomValues === "function") {
      const values = new Uint32Array(2);
      window.crypto.getRandomValues(values);
      return `${label}|${Date.now()}|${values[0]}|${values[1]}`;
    }
    return `${label}|${Date.now()}|${Math.random()}|${Math.random()}`;
  };

  const recordInstanceHash = (record) =>
    hashSeed(
      [
        asText(record?.discogs_release_id),
        asText(record?.artist),
        asText(record?.title),
        asText(record?.format),
        asText(record?.condition_media),
        asText(record?.condition_sleeve),
        asText(record?.price),
      ].join("|")
    );

  const recordShelfScore = (record) => {
    const parsed = Number.parseInt(asText(record?.shelf_score), 10);
    if (!Number.isFinite(parsed)) {
      return 0;
    }
    return Math.max(0, Math.min(5, parsed));
  };

  const hasTinyReview = (record) => Boolean(asText(record?.tiny_review));
  const hasCoverArt = (record) => Boolean(asText(record?.cover_src));

  const recordSelectionWeight = (record) =>
    1 +
    (recordShelfScore(record) * 1.25) +
    (hasTinyReview(record) ? 0.75 : 0) +
    (hasCoverArt(record) ? 1.5 : 0);

  const isBetterRecord = (candidate, current) => {
    const candidateMedia = gradeRank(candidate?.condition_media);
    const currentMedia = gradeRank(current?.condition_media);
    if (candidateMedia !== currentMedia) {
      return candidateMedia > currentMedia;
    }

    const candidateSleeve = gradeRank(candidate?.condition_sleeve);
    const currentSleeve = gradeRank(current?.condition_sleeve);
    if (candidateSleeve !== currentSleeve) {
      return candidateSleeve > currentSleeve;
    }

    return recordInstanceHash(candidate) < recordInstanceHash(current);
  };

  const dedupeRecordPool = (records) => {
    const deduped = new Map();
    records.forEach((record) => {
      const key = recordDuplicateKey(record);
      if (!key) {
        return;
      }
      const current = deduped.get(key);
      if (!current || isBetterRecord(record, current)) {
        deduped.set(key, record);
      }
    });
    return [...deduped.values()];
  };

  const takeWeightedRecordSet = (records, seedText, targetCount, excludedKeys = new Set()) => {
    const selected = [];
    const usedKeys = new Set(excludedKeys);
    const rand = mulberry32(hashSeed(seedText));
    const available = records.filter((record) => {
      const key = recordDuplicateKey(record);
      return Boolean(key) && !usedKeys.has(key);
    });

    while (selected.length < targetCount && available.length) {
      let totalWeight = 0;
      available.forEach((record) => {
        totalWeight += recordSelectionWeight(record);
      });

      if (!(totalWeight > 0)) {
        break;
      }

      let threshold = rand() * totalWeight;
      let chosenIndex = available.length - 1;

      for (let index = 0; index < available.length; index += 1) {
        threshold -= recordSelectionWeight(available[index]);
        if (threshold <= 0) {
          chosenIndex = index;
          break;
        }
      }

      const [chosen] = available.splice(chosenIndex, 1);
      const key = recordDuplicateKey(chosen);
      if (!key || usedKeys.has(key)) {
        continue;
      }
      usedKeys.add(key);
      selected.push(chosen);
    }

    return { selected, usedKeys };
  };

  const selectRecordShelfMix = ({
    records,
    seedText,
    focusCount,
    discoveryCount,
    excludedKeys = new Set(),
  }) => {
    const deduped = dedupeRecordPool(records);
    const focusPools = [
      deduped.filter((record) => recordShelfScore(record) >= 4),
      deduped.filter((record) => recordShelfScore(record) >= 3),
      deduped,
    ];

    let usedKeys = new Set(excludedKeys);
    let selected = [];

    focusPools.forEach((pool, index) => {
      if (selected.length >= focusCount) {
        return;
      }

      const focusSelection = takeWeightedRecordSet(
        pool,
        `${seedText}|focus-${index}`,
        focusCount - selected.length,
        usedKeys
      );
      selected = [...selected, ...focusSelection.selected];
      usedKeys = focusSelection.usedKeys;
    });

    const discoverySelection = takeWeightedRecordSet(
      deduped,
      `${seedText}|discovery`,
      discoveryCount,
      usedKeys
    );

    selected = [...selected, ...discoverySelection.selected];
    usedKeys = discoverySelection.usedKeys;

    return {
      selected: shuffled(selected, `${seedText}|display`),
      usedKeys,
    };
  };

  const selectCoverWeightedRecordShelfMix = ({
    records,
    seedText,
    focusCount,
    discoveryCount,
    excludedKeys = new Set(),
    maxUncovered = 2,
  }) => {
    const totalTarget = Math.max(focusCount + discoveryCount, 0);
    const coveredRecords = records.filter((record) => hasCoverArt(record));
    const preferredCoveredTarget = Math.min(
      Math.max(totalTarget - maxUncovered, 0),
      dedupeRecordPool(coveredRecords).length
    );
    const coveredFocusCount = Math.min(focusCount, preferredCoveredTarget);
    const coveredDiscoveryCount = Math.max(preferredCoveredTarget - coveredFocusCount, 0);

    const coveredSelection = preferredCoveredTarget
      ? selectRecordShelfMix({
          records: coveredRecords,
          seedText: `${seedText}|covered`,
          focusCount: coveredFocusCount,
          discoveryCount: coveredDiscoveryCount,
          excludedKeys,
        })
      : { selected: [], usedKeys: new Set(excludedKeys) };

    const remainingFocusCount = Math.max(focusCount - coveredFocusCount, 0);
    const remainingDiscoveryCount = Math.max(discoveryCount - coveredDiscoveryCount, 0);

    const fallbackSelection =
      remainingFocusCount || remainingDiscoveryCount
        ? selectRecordShelfMix({
            records,
            seedText: `${seedText}|fallback`,
            focusCount: remainingFocusCount,
            discoveryCount: remainingDiscoveryCount,
            excludedKeys: coveredSelection.usedKeys,
          })
        : { selected: [], usedKeys: coveredSelection.usedKeys };

    return {
      selected: shuffled(
        [...coveredSelection.selected, ...fallbackSelection.selected],
        `${seedText}|display`
      ),
      usedKeys: fallbackSelection.usedKeys,
    };
  };

  const resolveForSaleCandidates = (payload) =>
    Array.isArray(payload?.for_sale_candidates)
      ? payload.for_sale_candidates
      : (Array.isArray(payload?.for_sale_records)
          ? payload.for_sale_records
          : (Array.isArray(payload?.records) ? payload.records.filter((record) => resolveAvailability(record) !== "ARCHIVE") : []));

  const resolveArchiveCandidates = (payload) =>
    Array.isArray(payload?.archive_candidates)
      ? payload.archive_candidates
      : (Array.isArray(payload?.archive_records)
          ? payload.archive_records
          : (Array.isArray(payload?.records) ? payload.records.filter((record) => resolveAvailability(record) === "ARCHIVE") : []));

  const selectPublishedRecordShelves = (payload, seedText) => {
    const saleCandidates = resolveForSaleCandidates(payload);
    const archiveCandidates = resolveArchiveCandidates(payload);
    const saleSelection = selectCoverWeightedRecordShelfMix({
      records: saleCandidates,
      seedText: `${seedText}|sale`,
      focusCount: RECORDS_SALE_FOCUS_COUNT,
      discoveryCount: RECORDS_SALE_DISCOVERY_COUNT,
      maxUncovered: 2,
    });
    const archiveSelection = selectCoverWeightedRecordShelfMix({
      records: archiveCandidates,
      seedText: `${seedText}|archive`,
      focusCount: RECORDS_ARCHIVE_FOCUS_COUNT,
      discoveryCount: RECORDS_ARCHIVE_DISCOVERY_COUNT,
      excludedKeys: saleSelection.usedKeys,
      maxUncovered: 2,
    });

    return {
      currentRecords: saleSelection.selected,
      archiveRecords: archiveSelection.selected,
    };
  };

  const resolveRecordConditions = (record) => {
    const media = normalizeGrade(record?.condition_media);
    const sleeve = normalizeGrade(record?.condition_sleeve);
    if (media || sleeve) {
      return { media, sleeve };
    }

    const combined = asText(record?.condition);
    if (!combined) {
      return { media: "", sleeve: "" };
    }

    const parts = combined.split(/\s*\/\s*/).map((part) => normalizeGrade(part)).filter(Boolean);
    if (parts.length >= 2) {
      return { media: parts[0], sleeve: parts[1] };
    }

    return { media: parts[0] || "", sleeve: "" };
  };

  const recordMetaLine = (record) =>
    [recordYear(record), asText(record?.format), recordLabel(record)]
      .filter(Boolean)
      .join(" · ");

  const resolveCoverCaption = (record) => {
    const explicitCaption = asText(record?.cover_caption);
    if (explicitCaption) {
      return explicitCaption;
    }

    const pressingNote = asText(record?.pressing_note);
    if (pressingNote) {
      return `${pressingNote} cover`;
    }

    return "Cover shown";
  };

  const linesToMailBody = (lines) => lines.join("\r\n");

  const formatDate = (dateRaw) => {
    const clean = asText(dateRaw);
    if (!clean) {
      return "";
    }

    const parsed = new Date(`${clean}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return clean;
    }

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(parsed);
  };

  const noteHref = (note) => {
    const canonical = asText(note?.canonical_path) || asText(note?.url);
    if (canonical.startsWith("/notes/")) {
      return `.${canonical}`;
    }
    const slug = asText(note?.slug);
    return `./notes/${encodeURIComponent(slug)}.html`;
  };

  const isPublishedNote = (note) => {
    if (typeof note?.draft === "boolean") {
      return !note.draft;
    }
    const clean = asText(note?.draft).toLowerCase();
    return !["true", "1", "yes", "draft"].includes(clean);
  };

  const noteDate = (note) => asText(note?.publish_date) || asText(note?.date);

  const noteExcerpt = (note) => asText(note?.excerpt) || asText(note?.summary);

  const buildNoteTagList = (tagsRaw, limit = 4) => {
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

  const buildArchiveDrawer = ({ summaryText = "Filed under", tags = null }) => {
    if (!tags) {
      return null;
    }

    const drawer = document.createElement("details");
    drawer.className = "archive-drawer";

    const summary = document.createElement("summary");
    summary.textContent = summaryText;
    drawer.appendChild(summary);

    const body = document.createElement("div");
    body.className = "archive-drawer-body";
    body.appendChild(tags);
    drawer.appendChild(body);

    return drawer;
  };

  const orderedNotesFromPayload = (payload) =>
    (Array.isArray(payload?.notes) ? payload.notes : [])
      .filter((note) => isPublishedNote(note))
      .slice()
      .sort((left, right) => noteDate(right).localeCompare(noteDate(left)));

  // sort_date is month-precision by design (anonymity), so pad with sort_index
  // to keep the true chronological order without exposing a day.
  const issueSortKey = (issue) =>
    `${asText(issue?.sort_date) || asText(issue?.date_label) || asText(issue?.id)}` +
    `#${String(Number(issue?.sort_index) || 0).padStart(4, "0")}`;

  const orderedIssuesFromPayload = (payload) => normalizeIssues(payload);

  const orderedMixesFromPayload = (payload, issues = []) => {
    const issueById = new Map(
      issues.map((issue) => [asText(issue?.id), issue])
    );

    const allMixes = Array.isArray(payload?.mixes) ? payload.mixes : [];

    // Standalone mixes (no issue_id) appear first — most directly listenable
    const standaloneMixes = allMixes.filter((mix) => !asText(mix?.issue_id));

    // Issue-linked mixes sorted by issue date
    const issueMixes = allMixes
      .filter((mix) => issueById.has(asText(mix?.issue_id)))
      .slice()
      .sort((left, right) => {
        const leftIssue = issueById.get(asText(left?.issue_id));
        const rightIssue = issueById.get(asText(right?.issue_id));
        return issueSortKey(rightIssue).localeCompare(issueSortKey(leftIssue));
      });

    return [...standaloneMixes, ...issueMixes];
  };

  const selectNotesBySlug = (notes, slugsRaw) => {
    const slugs = Array.isArray(slugsRaw) ? slugsRaw.map((slug) => asText(slug)).filter(Boolean) : [];
    if (!slugs.length) {
      return notes.slice(0, 3);
    }

    const selected = slugs
      .map((slug) => notes.find((note) => asText(note?.slug) === slug))
      .filter(Boolean);

    return selected.length ? selected : notes.slice(0, 3);
  };

  const renderHubNotes = (container, notes, slugsRaw, options = {}) => {
    if (!container) {
      return;
    }

    const selected = options?.showAll ? notes.slice() : selectNotesBySlug(notes, slugsRaw);
    container.innerHTML = "";

    if (!selected.length) {
      container.innerHTML = '<p class="status-line">Notes unavailable.</p>';
      return;
    }

    selected.forEach((note) => {
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

      const meta = document.createElement("p");
      meta.className = "card-meta";
      meta.textContent = formatDate(noteDate(note));

      const copy = document.createElement("p");
      copy.className = "card-copy hub-note-copy";
      copy.textContent = noteExcerpt(note);

      article.append(kicker, title);
      if (meta.textContent) {
        article.appendChild(meta);
      }
      article.appendChild(copy);

      const filing = buildArchiveDrawer({
        summaryText: "Filed under",
        tags: buildNoteTagList(note?.tags, 4),
      });
      if (filing) {
        article.appendChild(filing);
      }

      container.appendChild(article);
    });
  };

  const buildDJProofEntry = ({ kickerText, title, href, metaText, copyText, actionText }) => {
    const article = document.createElement("article");
    article.className = "editorial-card dj-proof-entry";

    const kicker = document.createElement("p");
    kicker.className = "card-kicker";
    kicker.textContent = asText(kickerText);

    const heading = document.createElement("h3");
    heading.className = "card-title dj-proof-title";
    const link = document.createElement("a");
    link.href = href;
    link.textContent = asText(title);
    heading.appendChild(link);

    article.append(kicker, heading);

    if (asText(metaText)) {
      const meta = document.createElement("p");
      meta.className = "card-meta dj-proof-meta";
      meta.textContent = asText(metaText);
      article.appendChild(meta);
    }

    if (asText(copyText)) {
      const copy = document.createElement("p");
      copy.className = "card-copy dj-proof-copy";
      copy.textContent = asText(copyText);
      article.appendChild(copy);
    }

    const action = document.createElement("p");
    action.className = "card-action";
    action.innerHTML = `<a href="${href}">${asText(actionText)}</a>`;
    article.appendChild(action);

    return article;
  };

  const mountRecordArtFigure = (figureNode, options = {}) => {
    if (!figureNode) {
      return;
    }

    const coverSrc = asText(options?.coverSrc);
    const fallbackSrc = asText(options?.fallbackSrc);
    const alt = asText(options?.alt) || "Record cover";
    const caption = asText(options?.caption);
    const label = asText(options?.label) || "Record cover";

    figureNode.innerHTML = "";

    const frame = document.createElement("div");
    frame.className = "media-frame is-square";
    const art = document.createElement("div");
    art.className = "record-art";

    if (coverSrc || fallbackSrc) {
      const artImage = document.createElement("img");
      artImage.className = "art";
      artImage.src = coverSrc || fallbackSrc;
      artImage.alt = alt;
      artImage.loading = "lazy";
      artImage.decoding = "async";
      artImage.addEventListener("error", () => {
        if (
          fallbackSrc &&
          artImage.dataset.fallbackApplied !== "true" &&
          artImage.getAttribute("src") !== fallbackSrc
        ) {
          artImage.dataset.fallbackApplied = "true";
          artImage.src = fallbackSrc;
          return;
        }
        artImage.remove();
        renderPlaceholder(art, label);
      });
      art.appendChild(artImage);
    } else {
      renderPlaceholder(art, label);
    }

    frame.appendChild(art);
    figureNode.appendChild(frame);

    if (caption) {
      const captionNode = document.createElement("figcaption");
      captionNode.className = "media-caption";
      captionNode.textContent = caption;
      figureNode.appendChild(captionNode);
    }
  };

  const applyPageImageSlots = (imageMap) => {
    const slots = [...document.querySelectorAll("[data-image-slot]")];
    slots.forEach((slotNode) => {
      const slotPath = asText(slotNode?.dataset?.imageSlot);
      const slotConfig = getByPath(imageMap, slotPath) || {};

      if (
        page === "home" &&
        slotPath === "home.hero" &&
        Array.isArray(slotConfig?.prints) &&
        slotConfig.prints.length
      ) {
        mountHomeHeroPrintStack(slotNode, {
          src: asText(slotConfig?.src),
          alt: asText(slotConfig?.alt),
          caption: asText(slotConfig?.caption),
          ratio: asText(slotConfig?.ratio) || asText(slotNode?.dataset?.imageRatio),
          label: asText(slotConfig?.label) || asText(slotNode?.dataset?.imageLabel),
          sizes: asText(slotConfig?.sizes),
          prints: slotConfig.prints,
          initialIndex: slotConfig?.initial_index,
          controlLabel: asText(slotConfig?.control_label),
        });
        return;
      }

      mountMediaFigure(slotNode, {
        src: asText(slotConfig?.src),
        alt: asText(slotConfig?.alt),
        caption: asText(slotConfig?.caption),
        ratio: asText(slotConfig?.ratio) || asText(slotNode?.dataset?.imageRatio),
        label: asText(slotConfig?.label) || asText(slotNode?.dataset?.imageLabel),
        hero:
          typeof slotConfig?.hero === "boolean"
            ? slotConfig.hero
            : asText(slotNode?.dataset?.imageHero) === "true",
        sizes: asText(slotConfig?.sizes),
      });
    });
  };

  const setInquiryLink = (element, email, subject, bodyText) => {
    if (!element) {
      return;
    }

    element.setAttribute(
      "href",
      toMailto({
        email,
        subject,
        body: bodyText,
      })
    );
  };

  const attachInquiryForm = (formNode, email, subjectFallback) => {
    if (!formNode) {
      return;
    }

    formNode.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(formNode);
      const lines = [
        `Name: ${asText(formData.get("name"))}`,
        `Email: ${asText(formData.get("email"))}`,
        `Event date: ${asText(formData.get("event_date"))}`,
        `City: ${asText(formData.get("city"))}`,
        `Venue: ${asText(formData.get("venue"))}`,
        `Music direction: ${asText(formData.get("music_direction"))}`,
        "",
        "What kind of room are you trying to build?",
        asText(formData.get("room_goal")),
      ];

      window.location.href = toMailto({
        email,
        subject: subjectFallback || "DJ Inquiry",
        body: lines.join("\n"),
      });
    });
  };

  const createPlaylistPanel = () => {
    const panel = document.createElement("div");
    panel.className = "playlist-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "playlist-panel-title");

    const backdrop = document.createElement("div");
    backdrop.className = "playlist-panel-backdrop";

    const drawer = document.createElement("div");
    drawer.className = "playlist-panel-drawer";

    const head = document.createElement("div");
    head.className = "playlist-panel-head";

    const kicker = document.createElement("p");
    kicker.className = "playlist-panel-kicker";
    kicker.textContent = "Listening Notes";

    const titleEl = document.createElement("h2");
    titleEl.className = "playlist-panel-title";
    titleEl.id = "playlist-panel-title";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "playlist-panel-close";
    closeBtn.setAttribute("aria-label", "Close panel");
    closeBtn.textContent = "✕";

    head.append(kicker, titleEl, closeBtn);

    const body = document.createElement("div");
    body.className = "playlist-panel-body";

    const iframe = document.createElement("iframe");
    iframe.className = "playlist-panel-embed";
    iframe.loading = "lazy";
    iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    iframe.setAttribute("allowfullscreen", "");

    body.appendChild(iframe);

    const foot = document.createElement("div");
    foot.className = "playlist-panel-foot";

    const spotifyLink = document.createElement("a");
    spotifyLink.className = "playlist-panel-spotify-link";
    spotifyLink.target = "_blank";
    spotifyLink.rel = "noreferrer";
    spotifyLink.textContent = "Open on Spotify ↗";

    foot.appendChild(spotifyLink);
    drawer.append(head, body, foot);
    panel.append(backdrop, drawer);
    document.body.appendChild(panel);

    let isOpen = false;
    let returnFocusTo = null;

    const open = (playlist) => {
      titleEl.textContent = asText(playlist?.title) || "Untitled";
      iframe.title = `${asText(playlist?.title) || "Playlist"} Spotify embed`;
      iframe.src = asText(playlist?.embed_url);
      spotifyLink.href = asText(playlist?.spotify_url) || "#";

      returnFocusTo = document.activeElement;
      panel.classList.add("is-open");
      document.body.classList.add("playlist-panel-open");
      isOpen = true;

      setTimeout(() => closeBtn.focus(), 50);
    };

    const close = () => {
      if (!isOpen) return;
      panel.classList.remove("is-open");
      document.body.classList.remove("playlist-panel-open");
      isOpen = false;
      iframe.src = "";

      if (returnFocusTo && typeof returnFocusTo.focus === "function") {
        returnFocusTo.focus();
        returnFocusTo = null;
      }
    };

    closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) close();
    });

    return { open, close };
  };

  const renderDJPlaylists = async () => {
    const statusNode = document.querySelector("[data-dj-playlists-status]");
    const listNode = document.querySelector("[data-dj-playlists]");

    if (!listNode || !statusNode) {
      return;
    }

    listNode.innerHTML = "";
    statusNode.hidden = true;
    statusNode.textContent = "";

    let payload;
    try {
      payload = await fetchJson("./data/playlists.json");
    } catch (error) {
      console.warn("[Field Notes] playlists.json unavailable:", error);
      statusNode.hidden = false;
      statusNode.textContent = "Listening notes unavailable.";
      return;
    }

    const playlists = Array.isArray(payload?.playlists) ? payload.playlists : [];
    if (!playlists.length) {
      statusNode.hidden = false;
      statusNode.textContent = "No listening notes listed.";
      return;
    }

    const panel = createPlaylistPanel();

    playlists.forEach((playlist) => {
      const card = document.createElement("article");
      card.className = "editorial-card playlist-card";
      card.dataset.playlistCard = asText(playlist?.id);

      const title = document.createElement("h3");
      title.className = "card-title playlist-card-title";
      title.textContent = asText(playlist?.title) || "Untitled playlist";

      const blurb = document.createElement("p");
      blurb.className = "card-copy";
      blurb.textContent = asText(playlist?.blurb);

      const actions = document.createElement("div");
      actions.className = "playlist-card-actions";

      const playButton = document.createElement("button");
      playButton.type = "button";
      playButton.className = "playlist-card-play";
      playButton.setAttribute("aria-haspopup", "dialog");
      playButton.textContent = "Listen";
      playButton.addEventListener("click", () => panel.open(playlist));

      const openLink = document.createElement("a");
      openLink.className = "playlist-card-link";
      openLink.href = asText(playlist?.spotify_url) || "#";
      openLink.target = "_blank";
      openLink.rel = "noreferrer";
      openLink.textContent = "Open Spotify";

      actions.append(playButton, openLink);

      const publicUrl = asText(playlist?.url);
      if (publicUrl) {
        const readLink = document.createElement("a");
        readLink.className = "playlist-card-link";
        readLink.href = publicUrl.startsWith("/") ? `.${publicUrl}` : publicUrl;
        readLink.textContent = "Open file";
        actions.appendChild(readLink);
      }

      card.append(title, blurb, actions);
      listNode.appendChild(card);
    });
  };


  const fetchReviews = async () => {
    try {
      return await fetchJson("./data/reviews.json");
    } catch (error) {
      console.warn("[Field Notes] reviews.json unavailable:", error);
      return {};
    }
  };

  const renderReviewSection = async ({ listSelector, statusSelector, linkSelector, linkWrapSelector, limit = 3 }) => {
    const listNode = document.querySelector(listSelector);
    const statusNode = document.querySelector(statusSelector);
    const linkNode = document.querySelector(linkSelector);
    const linkWrapNode = document.querySelector(linkWrapSelector);

    if (!listNode || !statusNode) {
      return;
    }

    listNode.innerHTML = "";
    statusNode.hidden = true;
    statusNode.textContent = "";
    if (linkWrapNode) {
      linkWrapNode.hidden = true;
    }

    const payload = await fetchReviews();
    const reviews = Array.isArray(payload?.reviews) ? payload.reviews.slice(0, limit) : [];
    const googleUrl = asText(payload?.google_reviews_url);

    if (!reviews.length) {
      statusNode.hidden = false;
      statusNode.textContent = "Review excerpts forthcoming.";
      return;
    }

    reviews.forEach((review) => {
      const item = document.createElement("article");
      item.className = "review-item";

      const quote = document.createElement("p");
      quote.className = "review-copy";
      quote.textContent = asText(review?.quote);

      const attribution = document.createElement("p");
      attribution.className = "review-attribution";
      attribution.textContent = asText(review?.attribution);

      item.append(quote, attribution);
      listNode.appendChild(item);
    });

    if (linkNode && linkWrapNode && /^https?:\/\//.test(googleUrl)) {
      linkNode.href = googleUrl;
      linkWrapNode.hidden = false;
    }
  };

  const applySiteChrome = (site) => {
    const title = asText(site?.site_title) || "Field Notes";
    siteTitleNodes.forEach((node) => {
      node.textContent = title;
    });

    const ecosystem =
      asText(site?.ecosystem_statement) ||
      "DJ work, records, and field notes in conversation.";
    ecosystemNodes.forEach((node) => {
      node.textContent = ecosystem;
    });
  };

  const applyHomeLead = (site) => {
    setInquiryLink(
      document.querySelector("[data-home-inquiry]"),
      asText(site?.booking_email) || site?.contact_email,
      asText(site?.dj_inquiry_subject) || "DJ Inquiry",
      asText(site?.dj_inquiry_body_template)
    );
  };

  const renderHomeLatestNote = (notesPayload) => {
    const notes = orderedNotesFromPayload(notesPayload);
    const latestNote = notes[0];
    const noteNode = document.querySelector("[data-home-latest-note]");

    if (!noteNode) {
      return;
    }

    noteNode.innerHTML = "";
    if (!latestNote) {
      noteNode.innerHTML = '<p class="status-line">No note available.</p>';
      return;
    }

    const kicker = document.createElement("p");
    kicker.className = "card-kicker";
    kicker.textContent = "Doc File";

    const title = document.createElement("h3");
    title.className = "card-title";

    const link = document.createElement("a");
    link.href = noteHref(latestNote);
    link.textContent = asText(latestNote?.title) || asText(latestNote?.slug);
    title.appendChild(link);

    const meta = document.createElement("p");
    meta.className = "card-meta";
    meta.textContent = [formatDate(noteDate(latestNote)), asText(latestNote?.category)]
      .filter(Boolean)
      .join(" · ");

    const copy = document.createElement("p");
    copy.className = "card-copy";
    copy.textContent = noteExcerpt(latestNote);

    const action = document.createElement("p");
    action.className = "card-action";
    action.innerHTML = `<a href="${noteHref(latestNote)}">Open file</a>`;

    noteNode.append(kicker, title);
    if (meta.textContent) {
      noteNode.appendChild(meta);
    }
    if (copy.textContent) {
      noteNode.appendChild(copy);
    }
    noteNode.appendChild(action);
  };

  const renderHomeLatestIssue = (issuesPayload) => {
    const issues = orderedIssuesFromPayload(issuesPayload);
    const latestIssue = issues[0];
    const issueNode = document.querySelector("[data-home-latest-issue]");

    if (!issueNode) {
      return;
    }

    issueNode.innerHTML = "";
    if (!latestIssue) {
      issueNode.innerHTML = '<p class="status-line">No issue available.</p>';
      return;
    }

    const kicker = document.createElement("p");
    kicker.className = "card-kicker";
    kicker.textContent = "Issue Log";

    const title = document.createElement("h3");
    title.className = "card-title";
    const link = document.createElement("a");
    link.href = issueHref(latestIssue);
    link.textContent = latestIssue.title || latestIssue.id;
    title.appendChild(link);

    const meta = document.createElement("p");
    meta.className = "card-meta";
    meta.textContent = [asText(latestIssue?.date_label) || asText(latestIssue?.date), asText(latestIssue?.id)]
      .filter(Boolean)
      .join(" · ");

    const copy = document.createElement("p");
    copy.className = "card-copy";
    copy.textContent = asText(latestIssue?.excerpt) || asText(latestIssue?.description);

    const action = document.createElement("p");
    action.className = "card-action";
    action.innerHTML = `<a href="${issueHref(latestIssue)}">Load issue</a>`;

    issueNode.append(kicker, title);
    if (meta.textContent) {
      issueNode.appendChild(meta);
    }
    if (copy.textContent) {
      issueNode.appendChild(copy);
    }
    issueNode.appendChild(action);
  };

  const renderHomeLatestMix = (mixesPayload, issues = []) => {
    const mixes = orderedMixesFromPayload(mixesPayload, issues);
    const latestMix = mixes[0];
    const mixNode = document.querySelector("[data-home-latest-mix]");

    if (!mixNode) {
      return;
    }

    mixNode.innerHTML = "";
    if (!latestMix) {
      mixNode.innerHTML = '<p class="status-line">No tape available.</p>';
      return;
    }

    const kicker = document.createElement("p");
    kicker.className = "card-kicker";
    kicker.textContent = asText(latestMix.genre) || "Player";

    const title = document.createElement("h3");
    title.className = "card-title";
    title.textContent = asText(latestMix.title) || "Untitled mix";

    const note = document.createElement("p");
    note.className = "card-copy";
    note.textContent = asText(latestMix.note);

    const meta = document.createElement("p");
    meta.className = "card-meta";
    meta.textContent = [asText(latestMix.runtime), asText(latestMix.issue_id)]
      .filter(Boolean)
      .join(" · ");

    const action = document.createElement("p");
    action.className = "card-action";
    const issueId = asText(latestMix.issue_id);
    if (issueId) {
      const issue = issues.find((entry) => asText(entry?.id) === issueId);
      action.innerHTML = `<a href="${issueHref(issue || { id: issueId }, "#audio")}">Open player</a>`;
    } else {
      action.innerHTML = `<a href="./mixes.html">Listen</a>`;
    }

    mixNode.appendChild(kicker);
    mixNode.appendChild(title);
    mixNode.appendChild(note);
    if (meta.textContent) {
      mixNode.appendChild(meta);
    }
    if (action.innerHTML) {
      mixNode.appendChild(action);
    }
  };

  const renderHomeRecordPreview = (site, recordsPayload) => {
    const recordsNode = document.querySelector("[data-home-records]");
    if (!recordsNode) {
      return;
    }

    recordsNode.innerHTML = "";

    const previewRecords = selectCoverWeightedRecordShelfMix({
      records: resolveForSaleCandidates(recordsPayload),
      seedText: createRandomSeedText("home-records"),
      focusCount: HOME_RECORD_FOCUS_COUNT,
      discoveryCount: HOME_RECORD_DISCOVERY_COUNT,
      maxUncovered: 1,
    }).selected;
    if (!previewRecords.length) {
      recordsNode.innerHTML = '<li class="status-line">No selected copies listed.</li>';
      return;
    }

    previewRecords.forEach((record) => {
      const item = document.createElement("li");
      item.className = "home-copy-item";

      const title = document.createElement("h3");
      title.className = "copy-title";
      title.textContent = `${asText(record.artist)} · ${asText(record.title)}`;

      const meta = document.createElement("p");
      meta.className = "copy-meta";
      meta.textContent = recordMetaLine(record);

      item.appendChild(title);
      if (meta.textContent) {
        item.appendChild(meta);
      }
      recordsNode.appendChild(item);
    });
  };

  const renderHome = async (site) => {
    applyHomeLead(site);
    attachInquiryForm(
      document.querySelector("[data-home-inquiry-form]"),
      asText(site?.booking_email) || asText(site?.contact_email),
      asText(site?.dj_inquiry_subject) || "DJ Inquiry"
    );

    const [issuesPayload, mixesPayload, recordsPayload, notesPayload] = await Promise.all([
      fetchJson("./issues/index.json"),
      fetchJson("./data/mixes.json"),
      fetchJson("./data/records_catalog.json").catch(() => fetchJson("./data/daily_records.json")),
      fetchJson("./data/notes.json"),
    ]);

    const issues = orderedIssuesFromPayload(issuesPayload);

    renderHomeLatestNote(notesPayload);
    renderHomeLatestIssue(issuesPayload);
    renderHomeLatestMix(mixesPayload, issues);
    renderHomeRecordPreview(site, recordsPayload);
    await renderReviewSection({
      listSelector: "[data-home-reviews]",
      statusSelector: "[data-home-reviews-status]",
      linkSelector: "[data-home-reviews-link]",
      linkWrapSelector: "[data-home-reviews-link-wrap]",
      limit: 4,
    });
  };

  const renderFieldNotes = async (site) => {
    const statusNode = document.querySelector("[data-fieldnotes-status]");
    const listNode = document.querySelector("[data-fieldnotes-list]");
    const issuesPayload = await fetchJson("./issues/index.json");
    const issues = normalizeIssues(issuesPayload);

    if (!listNode || !statusNode) {
      return;
    }

    listNode.innerHTML = "";
    if (!issues.length) {
      statusNode.hidden = false;
      statusNode.textContent = "No issues listed.";
      listNode.hidden = true;
      return;
    }

    issues.forEach((issue) => {
      const item = document.createElement("li");
      item.className = "issue-item";

      const article = document.createElement("article");
      article.className = "issue-ledger-entry";

      // Stamp line: issue ID + short date
      const stamp = document.createElement("p");
      stamp.className = "issue-ledger-stamp";
      // Anonymity rule: never render a day-precision event date. sort_date is
      // month-precision ("2026-04"); anything finer gets truncated here too.
      const rawDate = asText(issue?.sort_date);
      let shortDate = asText(issue?.date_label);
      if (!shortDate && rawDate) {
        const [year, month] = rawDate.split("-");
        if (year && month) {
          const d = new Date(Number(year), Number(month) - 1, 1);
          shortDate = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        }
      }
      stamp.textContent = shortDate
        ? `${issue.id} — ${shortDate}`
        : issue.id;

      // Title: the link is the action, no separate CTA
      const title = document.createElement("h3");
      title.className = "issue-ledger-title";
      const titleLink = document.createElement("a");
      titleLink.href = issueHref(issue);
      titleLink.textContent = issue.title || issue.id;
      title.appendChild(titleLink);

      // Room note: excerpt only, no room_context metadata line
      const noteText = asText(issue?.excerpt) || asText(issue?.description);
      const note = document.createElement("p");
      note.className = "issue-ledger-note";
      note.textContent = noteText;

      article.appendChild(stamp);
      article.appendChild(title);
      if (noteText) {
        article.appendChild(note);
      }
      item.appendChild(article);
      listNode.appendChild(item);
    });

    statusNode.hidden = true;
    listNode.hidden = false;
  };

  const resolveAvailability = (record) => {
    const availability = asText(record?.availability).toUpperCase();
    if (["FOR_SALE", "ARCHIVE", "SOLD", "RESERVED"].includes(availability)) {
      return availability;
    }
    if (availability === "NOT_FOR_SALE") {
      return "ARCHIVE";
    }
    if (availability === "AVAILABLE") {
      return "FOR_SALE";
    }
    if (availability === "ARCHIVED") {
      return "ARCHIVE";
    }
    if (typeof record?.for_sale === "boolean") {
      return record.for_sale ? "FOR_SALE" : "ARCHIVE";
    }
    const status = asText(record?.status).toLowerCase();
    if (["for sale", "available", "listed", "active", "inventory", "in stock"].includes(status)) {
      return "FOR_SALE";
    }
    if (["placed", "kept", "archive", "archived", "personal", "not for sale"].includes(status)) {
      return "ARCHIVE";
    }
    if (["sold", "shipped", "gone"].includes(status)) {
      return "SOLD";
    }
    if (["reserved", "hold"].includes(status)) {
      return "RESERVED";
    }
    return "ARCHIVE";
  };

  const recordStatusLabel = (availability) => {
    if (availability === "FOR_SALE") return "FOR SALE";
    if (availability === "SOLD") return "SOLD";
    if (availability === "RESERVED") return "RESERVED";
    return "ARCHIVE";
  };

  const recordStatusTone = (availability) => {
    if (availability === "FOR_SALE") return "available";
    if (availability === "SOLD") return "sold";
    if (availability === "RESERVED") return "reserved";
    return "archive";
  };

  const formatRecordPrice = (priceRaw) => {
    const clean = asText(priceRaw);
    if (!clean) {
      return "";
    }

    const amount = Number.parseFloat(clean);
    if (Number.isFinite(amount)) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    }

    return clean;
  };

  const appendCopyFact = (facts, label, value) => {
    const cleanValue = asText(value);
    if (!cleanValue) {
      return;
    }

    const term = document.createElement("dt");
    term.textContent = label;
    const detail = document.createElement("dd");
    detail.textContent = cleanValue;
    facts.append(term, detail);
  };

  const buildRecordCard = (record, site) => {
    const entry = document.createElement("article");
    entry.className = "copy-entry";

    const availability = resolveAvailability(record);
    const tone = recordStatusTone(availability);
    const isForSale = availability === "FOR_SALE";
    const isArchive = availability === "ARCHIVE";
    entry.classList.add(`status-${tone}`);

    const imageWrap = document.createElement("figure");
    imageWrap.className = "copy-image-wrap";
    const releaseId = asText(record?.discogs_release_id);
    const fallbackSrc = "./assets/img/records/green_sleeve.png";
    const coverSrc = asText(record?.cover_src);
    const coverAlt = `${asText(record.artist)} ${asText(record.title)} cover image`;
    mountRecordArtFigure(imageWrap, {
      coverSrc,
      fallbackSrc,
      alt: coverAlt,
      caption: resolveCoverCaption(record),
      label: "Record cover",
    });

    const body = document.createElement("div");
    body.className = "copy-body";

    const head = document.createElement("div");
    head.className = "copy-entry-head";

    const title = document.createElement("h2");
    title.className = "copy-entry-title";
    title.textContent = `${asText(record.artist)} · ${asText(record.title)}`;

    const meta = document.createElement("p");
    meta.className = "copy-entry-meta";
    meta.textContent = recordMetaLine(record);

    const market = document.createElement("p");
    market.className = "copy-entry-market";
    const statusNode = document.createElement("span");
    statusNode.className = `copy-status-chip is-${tone}`;
    statusNode.textContent = recordStatusLabel(availability);
    market.appendChild(statusNode);

    const price = isForSale ? formatRecordPrice(record?.price) : "";
    if (price) {
      const priceNode = document.createElement("span");
      priceNode.className = "copy-entry-price";
      priceNode.textContent = price;
      market.appendChild(priceNode);
    }

    const why = document.createElement("p");
    why.className = "copy-entry-note";
    why.textContent = asText(record?.tiny_review) || asText(record?.why_it_matters);

    const facts = document.createElement("dl");
    facts.className = "copy-facts";
    const conditions = resolveRecordConditions(record);

    appendCopyFact(facts, "Format", asText(record?.format));
    appendCopyFact(facts, "Year", recordYear(record));
    appendCopyFact(facts, "Media", conditions.media);
    appendCopyFact(facts, "Sleeve", conditions.sleeve);
    appendCopyFact(facts, "Discogs ID", releaseId);

    const ctaWrap = document.createElement("div");
    ctaWrap.className = "copy-entry-cta";

    head.appendChild(title);
    if (meta.textContent) {
      head.appendChild(meta);
    }
    head.appendChild(market);
    body.appendChild(head);
    if (facts.children.length) {
      body.appendChild(facts);
    }
    if (why.textContent) {
      body.appendChild(why);
    }

    if (isForSale || isArchive) {
      const inquire = document.createElement("a");
      inquire.className = "copy-entry-inquire is-static";
      inquire.textContent = isForSale ? "Request copy" : "Ask about this record";
      setInquiryLink(
        inquire,
        site?.contact_email,
        `${isForSale ? "Selected Copy Request" : "Selected Copy Reference"}: ${asText(record.title)}`,
        linesToMailBody(
          isForSale
            ? [
                "Hi Matt,",
                "",
                "I'm interested in this record:",
                "",
                `Artist: ${asText(record.artist)}`,
                `Title: ${asText(record.title)}`,
                `Discogs ID: ${releaseId || "N/A"}`,
                ...(price ? [`Price: ${price}`] : []),
                "",
                "Is this copy still available?",
                "",
                "Thanks",
              ]
            : [
                "Hi Matt,",
                "",
                "I'm writing about this record:",
                "",
                `Artist: ${asText(record.artist)}`,
                `Title: ${asText(record.title)}`,
                `Discogs ID: ${releaseId || "N/A"}`,
                "",
                "I know it's listed as archive/reference only, but I wanted to ask about it.",
                "",
                "Thanks",
              ]
        )
      );
      ctaWrap.appendChild(inquire);
    } else {
      const disabled = document.createElement("button");
      disabled.type = "button";
      disabled.className = "copy-entry-inquire is-static";
      disabled.disabled = true;
      disabled.textContent = availability === "SOLD" ? "Sold" : "Reserved";
      ctaWrap.appendChild(disabled);
    }

    body.appendChild(ctaWrap);
    entry.append(imageWrap, body);

    return { entry, availability };
  };

  const renderRecordLists = ({
    currentRecords,
    archiveRecords,
    site,
    statusNode,
    listNode,
    archiveSection,
    archiveListNode,
  }) => {
    listNode.innerHTML = "";
    archiveListNode.innerHTML = "";
    archiveSection.hidden = true;

    if (!currentRecords.length && !archiveRecords.length) {
      statusNode.hidden = false;
      statusNode.textContent = "No selected copies are listed right now.";
      return;
    }

    statusNode.hidden = currentRecords.length > 0;
    statusNode.textContent = currentRecords.length ? "" : "No current shelf copies are listed right now.";

    currentRecords.forEach((record) => {
      const { entry } = buildRecordCard(record, site);
      listNode.appendChild(entry);
    });

    if (archiveRecords.length) {
      archiveSection.hidden = false;
      archiveRecords.forEach((record) => {
        const { entry } = buildRecordCard(record, site);
        archiveListNode.appendChild(entry);
      });
    }
  };

  const renderRecords = async (site, imageMap) => {
    const statusNode = document.querySelector("[data-records-status]");
    const listNode = document.querySelector("[data-records-list]");
    const archiveSection = document.querySelector("[data-records-archive-section]");
    const archiveListNode = document.querySelector("[data-records-archive-list]");
    const refreshButton = document.querySelector("[data-records-refresh]");
    if (!statusNode || !listNode || !archiveSection || !archiveListNode) {
      return;
    }

    const [recordsPayload, notesPayload] = await Promise.all([
      fetchJson("./data/records_catalog.json").catch(() => fetchJson("./data/daily_records.json")),
      fetchJson("./data/notes.json").catch(() => ({ notes: [] })),
    ]);
    const notes = orderedNotesFromPayload(notesPayload);

    renderHubNotes(
      document.querySelector("[data-records-related-notes]"),
      notes,
      site?.records_related_note_slugs
    );

    if (refreshButton) {
      let isRefreshing = false;
      const defaultLabel = "Refresh crate";

      const renderRandomizedShelf = (seedText) => {
        const shelves = selectPublishedRecordShelves(recordsPayload, seedText);
        renderRecordLists({
          currentRecords: shelves.currentRecords,
          archiveRecords: shelves.archiveRecords,
          site,
          statusNode,
          listNode,
          archiveSection,
          archiveListNode,
        });
      };

      const refreshFromCatalog = async () => {
        if (isRefreshing) {
          return;
        }

        isRefreshing = true;
        refreshButton.disabled = true;
        refreshButton.textContent = "Refreshing...";

        try {
          renderRandomizedShelf(createRandomSeedText("records-refresh"));
        } catch (error) {
          console.warn("[Field Notes] records catalog unavailable:", error);
        } finally {
          isRefreshing = false;
          refreshButton.disabled = false;
          refreshButton.textContent = defaultLabel;
        }
      };

      refreshButton.addEventListener("click", refreshFromCatalog);
      renderRandomizedShelf(createRandomSeedText("records-initial"));
      return;
    }

    renderRecordLists({
      currentRecords: resolveForSaleCandidates(recordsPayload),
      archiveRecords: resolveArchiveCandidates(recordsPayload),
      site,
      statusNode,
      listNode,
      archiveSection,
      archiveListNode,
    });
  };

  const renderDJ = async (site) => {
    const proofList = document.querySelector("[data-dj-proof-items]");
    if (proofList) {
      proofList.innerHTML = "";
      try {
        const [issuesPayload, notesPayload] = await Promise.all([
          fetchJson("./issues/index.json"),
          fetchJson("./data/notes.json"),
        ]);
        const issues = normalizeIssues(issuesPayload);
        const notes = Array.isArray(notesPayload?.notes)
          ? notesPayload.notes.filter((note) => isPublishedNote(note))
          : [];
        const issueId = asText(site?.dj_proof_issue_id);
        const noteSlug = asText(site?.dj_proof_note_slug);
        const issue = issues.find((entry) => asText(entry?.id) === issueId) || issues[0];
        const note =
          notes.find((entry) => asText(entry?.slug) === noteSlug) ||
          notes.find((entry) => asText(entry?.featured) === "true") ||
          notes[0];

        if (issue) {
          const metaBits = [asText(issue?.date_label) || asText(issue?.date), asText(issue?.room_context)].filter(Boolean);
          proofList.appendChild(
            buildDJProofEntry({
              kickerText: "Archive issue",
              title: asText(issue?.title) || asText(issue?.id),
              href: issueHref(issue),
              metaText: metaBits.join(" · "),
              copyText: asText(issue?.excerpt) || asText(issue?.description),
              actionText: "Open issue",
            })
          );
        }

        if (note) {
          proofList.appendChild(
            buildDJProofEntry({
              kickerText: "Field guide",
              title: asText(note?.title) || asText(note?.slug),
              href: noteHref(note),
              metaText: formatDate(noteDate(note)),
              copyText: noteExcerpt(note),
              actionText: "Read note",
            })
          );
        }
      } catch (error) {
        console.warn("[Field Notes] DJ proof unavailable:", error);
        const fallback = document.createElement("p");
        fallback.className = "status-line";
        fallback.textContent = "Archive proof unavailable.";
        proofList.appendChild(fallback);
      }
    }

    attachInquiryForm(
      document.querySelector("[data-dj-inquiry-form]"),
      asText(site?.booking_email) || asText(site?.contact_email),
      asText(site?.dj_inquiry_subject) || "DJ Inquiry"
    );

    await renderReviewSection({
      listSelector: "[data-dj-reviews]",
      statusSelector: "[data-dj-reviews-status]",
      linkSelector: "[data-dj-reviews-link]",
      linkWrapSelector: "[data-dj-reviews-link-wrap]",
      limit: 2,
    });

    await renderDJPlaylists();
  };

  const renderAbout = () => {};

  const render = async () => {
    const [site, imageMap] = await Promise.all([fetchJson("./data/site.json"), fetchImageMap()]);
    applySiteChrome(site);
    applyPageImageSlots(imageMap);

    if (page === "home") {
      await renderHome(site);
      return;
    }

    if (page === "field-notes") {
      await renderFieldNotes(site);
      return;
    }

    if (page === "records") {
      await renderRecords(site, imageMap);
      return;
    }

    if (page === "dj") {
      await renderDJ(site);
      return;
    }

    if (page === "about") {
      renderAbout(site);
    }
  };

  render().catch((error) => {
    console.error("[Field Notes] Page rendering failed:", error);
    const statusNodes = [...document.querySelectorAll(".status-line")];
    statusNodes.forEach((node) => {
      node.textContent = "Content unavailable.";
      node.hidden = false;
    });
  });
})();
