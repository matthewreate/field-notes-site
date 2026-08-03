(() => {
  const STORAGE_KEY = "field-notes-post-gig-intake-draft";
  const SETTINGS_KEY = "field-notes-post-gig-intake-settings";

  const form = document.querySelector("[data-intake-form]");
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  const statusShell = document.querySelector("[data-intake-status]");
  const statusText = document.querySelector("[data-intake-status-text]");
  const objectKeyLine = document.querySelector("[data-intake-object-key]");
  const objectKeyCode = objectKeyLine?.querySelector("code");
  const downloadLine = document.querySelector("[data-intake-download]");
  const downloadLink = document.querySelector("[data-intake-download-link]");
  const downloadDraftButton = document.querySelector("[data-download-draft]");
  const clearDraftButton = document.querySelector("[data-clear-draft]");

  const asText = (value) => (typeof value === "string" ? value.trim() : "");

  const listFromTextarea = (value) =>
    String(value || "")
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);

  const monthYearLabel = (value) => {
    const parsed = new Date(`${value}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "America/New_York",
    }).format(parsed);
  };

  const slugify = (value) =>
    asText(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

  const setStatus = (message, { key = "", downloadUrl = "", filename = "" } = {}) => {
    if (statusShell) {
      statusShell.hidden = false;
    }
    if (statusText) {
      statusText.textContent = message;
    }
    if (objectKeyLine && objectKeyCode) {
      const cleanKey = asText(key);
      objectKeyLine.hidden = !cleanKey;
      objectKeyCode.textContent = cleanKey;
    }
    if (downloadLine && downloadLink) {
      const hasDownload = asText(downloadUrl);
      downloadLine.hidden = !hasDownload;
      if (hasDownload) {
        downloadLink.href = hasDownload;
        downloadLink.download = filename || "field-notes-intake.json";
      } else {
        downloadLink.removeAttribute("href");
        downloadLink.removeAttribute("download");
      }
    }
  };

  const makeDownload = (payload, filename) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setStatus("Draft ready to download.", {
      downloadUrl: url,
      filename,
    });
    return url;
  };

  const formDataObject = () => Object.fromEntries(new FormData(form).entries());

  const serializeDraft = () => {
    const raw = formDataObject();
    return {
      schema_version: "1.0",
      captured_at: new Date().toISOString(),
      exact_event_date: asText(raw.exact_event_date),
      public_date_label: asText(raw.public_date_label) || monthYearLabel(raw.exact_event_date),
      public_title: asText(raw.public_title),
      venue_name: asText(raw.venue_name),
      city: asText(raw.city),
      room_type: asText(raw.room_type),
      guest_count_band: asText(raw.guest_count_band),
      crowd_type: asText(raw.crowd_type),
      room_summary: asText(raw.room_summary),
      flow_of_night: asText(raw.flow_of_night),
      room_shift: asText(raw.room_shift),
      near_fail: asText(raw.near_fail),
      key_tracks: listFromTextarea(raw.key_tracks),
      dance_sequence: listFromTextarea(raw.dance_sequence),
      audio_url: asText(raw.audio_url),
      media_note: asText(raw.media_note),
      privacy_note: asText(raw.privacy_note),
      related_note_slugs: listFromTextarea(raw.related_note_slugs),
      publish_state: asText(raw.publish_state) || "public issue",
    };
  };

  const persistDraft = () => {
    const raw = formDataObject();
    const settings = {
      worker_url: asText(raw.worker_url),
      intake_key: asText(raw.intake_key),
    };
    const draft = {
      ...raw,
      key_tracks: raw.key_tracks || "",
      dance_sequence: raw.dance_sequence || "",
      related_note_slugs: raw.related_note_slugs || "",
    };
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  };

  const hydrate = () => {
    let settings = {};
    let draft = {};
    try {
      settings = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}");
      draft = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
      console.warn("[Field Notes] Could not read intake draft from localStorage.", error);
    }

    [...form.elements].forEach((element) => {
      if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) {
        return;
      }

      const key = element.name;
      if (!key) {
        return;
      }

      if (key === "worker_url" && asText(settings.worker_url)) {
        element.value = settings.worker_url;
        return;
      }

      if (key === "intake_key" && asText(settings.intake_key)) {
        element.value = settings.intake_key;
        return;
      }

      if (typeof draft[key] === "string") {
        element.value = draft[key];
      }
    });
  };

  const validateDraft = (payload) => {
    const missing = [];
    const requiredKeys = [
      ["exact_event_date", "exact event date"],
      ["venue_name", "venue name"],
      ["city", "city"],
      ["room_type", "room type"],
      ["guest_count_band", "guest count band"],
      ["crowd_type", "crowd type"],
      ["room_summary", "room summary"],
      ["flow_of_night", "flow of the night"],
      ["room_shift", "what changed the room"],
      ["near_fail", "what nearly failed"],
      ["media_note", "photo / media note"],
      ["privacy_note", "privacy note"],
    ];

    requiredKeys.forEach(([key, label]) => {
      if (!asText(payload[key])) {
        missing.push(label);
      }
    });

    if (payload.key_tracks.length < 3) {
      missing.push("at least 3 key tracks");
    }

    return missing;
  };

  form.addEventListener("input", persistDraft);
  form.addEventListener("change", persistDraft);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    persistDraft();

    const raw = formDataObject();
    const payload = serializeDraft();
    const missing = validateDraft(payload);
    const workerUrl = asText(raw.worker_url);
    const intakeKey = asText(raw.intake_key);

    if (!workerUrl) {
      setStatus("Add the Worker URL first.");
      return;
    }
    if (!intakeKey) {
      setStatus("Add the shared intake key first.");
      return;
    }
    if (missing.length) {
      setStatus(`Missing: ${missing.join(", ")}.`);
      return;
    }

    setStatus("Submitting intake...");

    try {
      const response = await fetch(workerUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-intake-key": intakeKey,
        },
        body: JSON.stringify(payload),
      });

      const responseBody = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(asText(responseBody?.error) || `Request failed (${response.status})`);
      }

      const filenameStem =
        slugify(payload.public_title || payload.venue_name || payload.room_type || "field-notes-intake") ||
        "field-notes-intake";
      const downloadUrl = makeDownload(
        responseBody?.payload || payload,
        `${filenameStem}.json`
      );

      setStatus("Intake saved to the private archive.", {
        key: asText(responseBody?.key),
        downloadUrl,
        filename: `${filenameStem}.json`,
      });
    } catch (error) {
      console.error("[Field Notes] intake submit failed", error);
      setStatus(`Submit failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  if (downloadDraftButton instanceof HTMLButtonElement) {
    downloadDraftButton.addEventListener("click", () => {
      const payload = serializeDraft();
      const filenameStem =
        slugify(payload.public_title || payload.venue_name || payload.room_type || "field-notes-intake") ||
        "field-notes-intake";
      makeDownload(payload, `${filenameStem}.json`);
    });
  }

  if (clearDraftButton instanceof HTMLButtonElement) {
    clearDraftButton.addEventListener("click", () => {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(SETTINGS_KEY);
      form.reset();
      setStatus("Local draft cleared.");
    });
  }

  hydrate();
})();
