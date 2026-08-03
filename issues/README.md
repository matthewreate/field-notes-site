# Field Notes Issue Pages

Field Notes issues now have two layers:

- Source data: `/<ISSUE_ID>/issue.json` plus any issue media in that source folder
- Stable public output: `/issues/<issue-slug>/index.html`

## Source Of Truth

Issue-level editorial metadata lives in [`/issues/index.json`](/Users/matthewreate/Desktop/Field%20Notes/issues/index.json).

Each issue entry should include:

- `id`
- `slug`
- `title`
- `description`
- `excerpt`
- `related_note_slugs`

Room and session data lives in `/<ISSUE_ID>/issue.json`.

That file should contain:

- `venue`
- `city`
- `date`
- `set_type`
- `crowd_note`
- `notes_to_self`
- `audio_url`
- `audio_placeholder_url`
- `highlights`
- `privacy_default`

## Build Step

Run:

```bash
npm run build:issues
```

This reads the issue manifest, reads each issue source folder, scans media files, resolves related notes from `data/notes.json`, and writes a stable HTML page to:

```text
/issues/<issue-slug>/index.html
```

## Normalized Payload

Both generated issue pages and the legacy `issue.html?id=...` fallback use the same normalized issue payload shape.

That payload includes:

- identity: `id`, `slug`, `title`, `canonical_path`
- editorial metadata: `description`, `excerpt`, `ai_summary`, `related_note_slugs`
- room data: `venue`, `city`, `date`, `set_type`, `crowd_note`, `notes_to_self`, `highlights`, `privacy_default`
- media: `audio_url`, `audio_placeholder_url`, `media_files`, `cover_image`, `photo_views`
- resolved note cards: `related_notes`

## Metadata Rules

- Stable issue pages under `/issues/<issue-slug>/` are the indexed public destinations.
- `issue.html` remains a fallback bridge and should stay `noindex,follow`.
- Canonical URLs for issue pages point to the stable issue path.
- Related notes are attached through `related_note_slugs` in the issue manifest.

## Adding A New Issue

1. Add a new source folder such as `/<ISSUE_ID>/`
2. Put `issue.json` and any issue media inside that source folder
3. Add a matching entry to `issues/index.json`
4. Run `npm run build:issues`
5. Add the new stable issue URL to `sitemap.xml`
