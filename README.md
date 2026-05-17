# Milwaukee Municipal ID Wizard

A step-by-step informational wizard produced for the City of Milwaukee License Division. It guides residents through obtaining, replacing, or renewing a Municipal ID — in five languages, with full accessibility support and zero data collection.

---

## File Structure

```
Muni_ID_Walkthrough/
├── index.html          # All HTML markup; nine step sections
├── wizard.js           # All wizard logic (navigation, validation, i18n, summary)
├── styles.css          # All styling (Milwaukee branding, responsive, RTL, print)
├── translations.json   # All UI strings in five languages
├── tests.js            # 34 Node.js unit tests (run with: node tests.js)
├── dom-tests.html      # Browser DOM simulation tests (11 paths + edge cases)
├── CCCC Logo.png       # City of Milwaukee official logo (used in header)
├── launch.sh           # Local HTTP server launcher (required for fetch())
├── CHANGELOG.md        # Change history
└── README.md           # This file
```

---

## Wizard Paths

| Scenario | Steps | Path |
|----------|-------|------|
| New ID | 7 (Option A) or 8 (Option B) | language → scenario → eligibility → identity (1) → [identity (2)] → residency → visit → summary |
| Lost, Stolen, or Damaged | 7 or 8 | same as New ID |
| Expired | 7 or 8 | same as New ID |
| Address Change (has old ID) | 6 | language → scenario → confirm ID → residency → visit → summary |
| Address Change (no old ID) | 7 or 8 | redirected to full path |

The 7 vs. 8 step count for full paths depends on whether the applicant selects an Option A identity document on Stage 1 (photo + date of birth on one document). If they do, Stage 2 is skipped automatically.

---

## How to Run Locally

The wizard uses `fetch('translations.json')`, which browsers block when opened via `file://`. A local HTTP server is required.

**Option 1 – Launcher script (recommended):**

```bash
chmod +x launch.sh
./launch.sh
```

The script finds a free port near 8743, starts a Python HTTP server bound to `127.0.0.1`, and opens your default browser automatically. Press `Ctrl-C` to stop.

**Option 2 – Manual:**

```bash
python3 -m http.server 8743 --bind 127.0.0.1
# then open http://localhost:8743 in your browser
```

---

## How to Deploy

Copy the four files (`index.html`, `wizard.js`, `styles.css`, `translations.json`) to any static web host or city intranet directory. No build step, no framework, no server-side code required.

**Font dependency:** `index.html` loads Montserrat from Google Fonts. An internet connection is required on first load; subsequent visits use the browser cache. On air-gapped deployments, self-host Montserrat or remove the `<link>` tags — the wizard falls back to Arial cleanly.

The wizard can be embedded in an existing city page inside a `<div>` — `dir="rtl"` is set on `#wizard-container` only, so Arabic layout does not affect surrounding content.

---

## How to Update Translations

All UI strings live in `translations.json`. The top-level `_meta` key describes the file structure.

Each key has a value for all five language codes:

| Code | Language |
|------|----------|
| `en` | English  |
| `es` | Spanish  |
| `hmn` | Hmong   |
| `my` | Burmese  |
| `ar` | Arabic   |

To update a string, find its key and edit the value for the relevant language code. Do **not** remove keys — `wizard.js` and `index.html` reference them by name. To add a new string, add the key to all five languages and add a `data-i18n="key"` attribute to the relevant HTML element (or call `t('key')` in JS).

---

## Supported Languages

- English
- Spanish (Español)
- Hmong (Hmoob)
- Burmese (မြန်မာဘာသာ)
- Arabic (العربية) — full right-to-left layout

---

## Key Features

- **Clickable progress bar:** Completed step dots and labels are clickable to navigate back without losing selections.
- **Two-stage identity flow:** Stage 1 shows Option A documents (photo + DOB). A live green confirmation appears on selection. If the user has an Option A doc, Stage 2 is skipped. Otherwise Stage 2 presents photo-only and DOB-only documents.
- **Live document feedback:** Green success banners appear immediately when residency or identity requirements are met.
- **Combined lost/stolen/damaged:** Single sub-scenario merges what were previously two separate options.
- **Address change path:** Shorter 6-step path. If the user no longer has their old ID, they are automatically redirected to the full replacement path.
- **Full public records legal text:** The expandable legal notice contains the full official text (in English) for all five languages.
- **"I don't have any" inline warnings:** If a user has no qualifying identity (Stage 2) or residency documents, selecting the "I don't have any of the following items" radio immediately shows an inline guidance panel and blocks Next. Forward navigation is blocked, not redirected.
- **AI disclosure notice:** A small translated notice at the bottom of every page discloses that AI tools were used in development and that non-English translations may contain inaccuracies.

---

## Accessibility

- WCAG 2.1 AA target
- `role="progressbar"` with `aria-valuenow` / `aria-valuemax`
- `aria-live="polite"` on error messages; `role="alert"` on not-eligible notices
- `aria-expanded` on accordion items
- Focus moved to first interactive element on each step transition
- Print stylesheet: hides navigation, shows clean summary

---

## Privacy

**No data is collected, stored, or transmitted.** All selections live in a plain JavaScript object in memory and are discarded when the browser tab is closed. There are no cookies, no localStorage, no network requests except loading `translations.json` on startup.

---

## Contact / Maintainer

City of Milwaukee – License Division  
[https://city.milwaukee.gov/cityclerk/license/Municipal-Identification](https://city.milwaukee.gov/cityclerk/license/Municipal-Identification)
