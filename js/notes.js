(() => {
  const core = window.FNCore;
  if (!core) {
    return;
  }

  const { asText, fetchJson } = core;
  const body = document.body;

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

  const noteDate = (note) => asText(note?.publish_date) || asText(note?.date);

  const isPublishedNote = (note) => {
    if (typeof note?.draft === "boolean") {
      return !note.draft;
    }
    const clean = asText(note?.draft).toLowerCase();
    return !["true", "1", "yes", "draft"].includes(clean);
  };

  const sortNotes = (notes) =>
    [...notes.filter((note) => isPublishedNote(note))].sort((left, right) =>
      noteDate(right).localeCompare(noteDate(left))
    );

  const noteHref = (note) => {
    const canonical = asText(note?.canonical_path) || asText(note?.url);
    if (canonical.startsWith("/notes/")) {
      return `.${canonical.replace(/^\/notes/, "")}`;
    }
    const slug = asText(note?.slug);
    return `./${encodeURIComponent(slug)}.html`;
  };

  const noteExcerpt = (note) => asText(note?.excerpt) || asText(note?.summary);

  const playlistHref = (playlist) => {
    const publicUrl = asText(playlist?.url);
    if (publicUrl.startsWith("/playlists/")) {
      return `..${publicUrl}`;
    }
    const slug = asText(playlist?.slug);
    if (slug) {
      return `../${slug.replace(/^\/+/, "")}.html`;
    }
    return "#";
  };

  const playlistExcerpt = (playlist) => asText(playlist?.excerpt) || asText(playlist?.blurb);

  const buildTagList = (tagsRaw, { limit = 4 } = {}) => {
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

  const buildRelatedLine = (notes, note) => {
    const related = Array.isArray(note?.related_slugs)
      ? note.related_slugs
          .map((slug) => notes.find((entry) => asText(entry?.slug) === asText(slug)))
          .filter(Boolean)
      : [];

    if (!related.length) {
      return null;
    }

    const line = document.createElement("p");
    line.className = "note-index-related";
    line.append("Related: ");

    related.forEach((entry, index) => {
      const link = document.createElement("a");
      link.href = noteHref(entry);
      link.textContent = asText(entry?.title) || asText(entry?.slug);
      line.appendChild(link);

      if (index < related.length - 1) {
        line.append(", ");
      }
    });

    return line;
  };

  const buildArchiveDrawer = ({ summaryText = "Filed under", tags = null, related = null }) => {
    if (!tags && !related) {
      return null;
    }

    const drawer = document.createElement("details");
    drawer.className = "archive-drawer";

    const summary = document.createElement("summary");
    summary.textContent = summaryText;
    drawer.appendChild(summary);

    const body = document.createElement("div");
    body.className = "archive-drawer-body";

    if (tags) {
      body.appendChild(tags);
    }

    if (related) {
      body.appendChild(related);
    }

    drawer.appendChild(body);
    return drawer;
  };

  const applySiteChrome = (site) => {
    const title = asText(site?.site_title) || "Field Notes";
    document.querySelectorAll("[data-site-title]").forEach((node) => {
      node.textContent = title;
    });

    const ecosystem =
      asText(site?.ecosystem_statement) ||
      "DJ work, records, and field notes in conversation.";
    document.querySelectorAll("[data-ecosystem-statement]").forEach((node) => {
      node.textContent = ecosystem;
    });
  };

  const renderNotesIndex = (notes) => {
    const featuredNode = document.querySelector("[data-notes-featured]");
    const listNode = document.querySelector("[data-notes-list]");
    const statusNode = document.querySelector("[data-notes-status]");

    if (!listNode || !statusNode) {
      return;
    }

    const ordered = sortNotes(notes);
    if (!ordered.length) {
      statusNode.hidden = false;
      statusNode.textContent = "No notes published yet.";
      listNode.hidden = true;
      return;
    }

    const archiveNotes = [...ordered];

    listNode.innerHTML = "";
    archiveNotes.forEach((note) => {
      const item = document.createElement("li");
      item.className = "note-index-item";

      const article = document.createElement("article");
      article.className = "note-index-entry";

      const articleMeta = document.createElement("p");
      articleMeta.className = "note-index-meta";
      articleMeta.textContent = [formatDate(noteDate(note)), asText(note.category)]
        .filter(Boolean)
        .join(" · ");

      const articleTitle = document.createElement("h3");
      articleTitle.className = "note-index-title";
      const articleLink = document.createElement("a");
      articleLink.href = noteHref(note);
      articleLink.textContent = asText(note.title) || asText(note.slug);
      articleTitle.appendChild(articleLink);

      const articleSummary = document.createElement("p");
      articleSummary.className = "editorial-paragraph quiet";
      articleSummary.textContent = noteExcerpt(note);

      const articleTags = buildTagList(note.tags);
      const articleRelated = buildRelatedLine(ordered, note);
      const articleFiling = buildArchiveDrawer({
        summaryText: "Filed under / related",
        tags: articleTags,
        related: articleRelated,
      });

      article.append(articleMeta, articleTitle, articleSummary);
      if (articleFiling) {
        article.appendChild(articleFiling);
      }
      item.appendChild(article);
      listNode.appendChild(item);
    });

    statusNode.hidden = true;
    listNode.hidden = archiveNotes.length === 0;
  };

  const renderPlaylists = (playlists, options = {}) => {
    const listNode = document.querySelector(options.listSelector || "");
    const statusNode = document.querySelector(options.statusSelector || "");
    const sectionNode = options.sectionSelector
      ? document.querySelector(options.sectionSelector)
      : null;
    const drawerNode = options.drawerSelector
      ? document.querySelector(options.drawerSelector)
      : null;

    if (!listNode || !statusNode) {
      return;
    }

    const published = playlists.filter((playlist) => asText(playlist?.url));
    if (!published.length) {
      if (sectionNode) {
        sectionNode.hidden = true;
      }
      statusNode.hidden = false;
      statusNode.textContent = options.emptyMessage || "No listening notes listed.";
      return;
    }

    listNode.innerHTML = "";

    published.forEach((playlist) => {
      const card = document.createElement("article");
      card.className = "editorial-card playlist-card";

      const kicker = document.createElement("p");
      kicker.className = "card-kicker";
      kicker.textContent = asText(playlist?.category) || "Playlists";

      const title = document.createElement("h3");
      title.className = "card-title playlist-card-title";
      const titleLink = document.createElement("a");
      titleLink.href = playlistHref(playlist);
      titleLink.textContent = asText(playlist?.title) || asText(playlist?.slug);
      title.appendChild(titleLink);

      const summary = document.createElement("p");
      summary.className = "card-copy";
      summary.textContent = playlistExcerpt(playlist);

      const filing = buildArchiveDrawer({
        summaryText: "Filed under",
        tags: buildTagList(playlist?.tags, { limit: 5 }),
      });

      const actions = document.createElement("p");
      actions.className = "playlist-card-actions";

      const readLink = document.createElement("a");
      readLink.className = "playlist-card-link";
      readLink.href = playlistHref(playlist);
      readLink.textContent = "Read playlist";
      actions.appendChild(readLink);

      const spotifyUrl = asText(playlist?.spotify_url);
      if (spotifyUrl) {
        const openLink = document.createElement("a");
        openLink.className = "playlist-card-link";
        openLink.href = spotifyUrl;
        openLink.target = "_blank";
        openLink.rel = "noreferrer";
        openLink.textContent = "Open in Spotify";
        actions.appendChild(openLink);
      }

      card.append(kicker, title, summary);
      if (filing) {
        card.appendChild(filing);
      }
      card.appendChild(actions);
      listNode.appendChild(card);
    });

    statusNode.hidden = true;
    listNode.hidden = false;
    if (sectionNode) {
      sectionNode.hidden = false;
    }
    if (drawerNode) {
      drawerNode.hidden = false;
    }
  };

  const renderPlaylistLauncher = (playlists, options = {}) => {
    const listNode = document.querySelector(options.listSelector || "");
    const statusNode = document.querySelector(options.statusSelector || "");
    const sectionNode = options.sectionSelector
      ? document.querySelector(options.sectionSelector)
      : null;
    const panelNode = options.panelSelector
      ? document.querySelector(options.panelSelector)
      : null;

    if (!listNode || !statusNode) {
      return;
    }

    const published = playlists.filter((playlist) => asText(playlist?.url));
    if (!published.length) {
      if (sectionNode) {
        sectionNode.hidden = true;
      }
      if (panelNode) {
        panelNode.hidden = true;
      }
      statusNode.hidden = false;
      statusNode.textContent = options.emptyMessage || "No listening notes listed.";
      return;
    }

    listNode.innerHTML = "";

    published.slice(0, options.limit || 3).forEach((playlist) => {
      const entry = document.createElement("article");
      entry.className = "notes-launcher-entry";

      const kicker = document.createElement("p");
      kicker.className = "notes-launcher-kicker";
      kicker.textContent = "Playlist file";

      const title = document.createElement("h3");
      title.className = "notes-launcher-title";
      const titleLink = document.createElement("a");
      titleLink.href = playlistHref(playlist);
      titleLink.textContent = asText(playlist?.title) || asText(playlist?.slug);
      title.appendChild(titleLink);

      const summary = document.createElement("p");
      summary.className = "notes-launcher-summary";
      summary.textContent = playlistExcerpt(playlist);

      entry.append(kicker, title);
      if (summary.textContent) {
        entry.appendChild(summary);
      }

      listNode.appendChild(entry);
    });

    statusNode.hidden = true;
    listNode.hidden = false;
    if (sectionNode) {
      sectionNode.hidden = false;
    }
    if (panelNode) {
      panelNode.hidden = false;
    }
  };

  const render = async () => {
    const [site, notesPayload, playlistsPayload] = await Promise.all([
      fetchJson("../data/site.json"),
      fetchJson("../data/notes.json"),
      fetchJson("../data/playlists.json").catch((error) => {
        console.warn("[Field Notes] playlists.json unavailable:", error);
        return { playlists: [] };
      }),
    ]);

    applySiteChrome(site);

    if (body?.dataset?.page === "notes-index") {
      renderNotesIndex(Array.isArray(notesPayload?.notes) ? notesPayload.notes : []);
      renderPlaylistLauncher(Array.isArray(playlistsPayload?.playlists) ? playlistsPayload.playlists : [], {
        sectionSelector: "[data-playlist-index-section]",
        panelSelector: "[data-playlist-index-panel]",
        listSelector: "[data-playlist-index-list]",
        statusSelector: "[data-playlists-status]",
        limit: 3,
      });
    }

    if (body?.dataset?.page === "listening-notes") {
      renderPlaylists(Array.isArray(playlistsPayload?.playlists) ? playlistsPayload.playlists : [], {
        listSelector: "[data-listening-notes-list]",
        statusSelector: "[data-listening-notes-status]",
      });
    }
  };

  render().catch((error) => {
    console.error("[Field Notes] Notes rendering failed:", error);
    const statusNode = document.querySelector("[data-notes-status]");
    if (statusNode) {
      statusNode.hidden = false;
      statusNode.textContent = "Notes unavailable.";
    }
  });
})();
