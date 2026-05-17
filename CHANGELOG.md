# Changelog - Milwaukee Municipal ID Wizard

All notable changes are documented here in reverse chronological order.

---
## [0.7.19] - 2026-05-16 - Fix identity B _none to cover both document groups

### Fix: "I don't have any" warning now triggers from either identity B group

The previous implementation only added a `_none` radio to the photo-only fieldset.
A `_none` radio is now present in both the photo-only and DOB-only fieldsets. Selecting
`_none` in either group immediately shows the warning panel and blocks Next, regardless
of what the other group has selected - a valid photo doc does not override a DOB `_none`,
and vice versa. A new `isIdbNone()` helper centralizes this check across
`onIdentityBRadioChange()`, `nextFromIdentityB()`, `renderIdentityBDocs()`, and the
`validateIdentityBDocs()` guard.

**Files changed:** `wizard.js` (`isIdbNone()`, `onIdentityBRadioChange()`,
`nextFromIdentityB()`, `validateIdentityBDocs()`, `renderIdentityBDocs()`,
`prepareStep()`)

---
## [0.7.18] - 2026-05-16 - Identity B no-documents inline warning

### Add "I don't have any of the following items" option to Identity Documents Step B

Mirrors the pattern added to the residency step. A `_none` radio (styled with
`.radio-item-none`) is appended to the photo-only fieldset in `step-identity_b`.
Selecting it immediately clears the DOB group selection, shows an inline warning panel
(`#idb-none-panel`, reusing `.not-eligible-panel` styles), and hides the Next button and
the `id_call_help` paragraph. Switching to any real document hides the panel and restores
both instantly. `validateIdentityBDocs()` updated to treat `_none` as no selection so all
existing test assertions continue to pass.

Root cause / motivation: No guidance existed for Option B users without any identity
documents. Forward navigation is blocked, not redirected.

**Files changed:** `index.html` (new `#idb-none-panel`, id added to `id_call_help`
paragraph in `step-identity_b`), `wizard.js` (`showIdbNonePanel()`,
`hideIdbNonePanel()`, `onIdentityBRadioChange()`, `nextFromIdentityB()`,
`validateIdentityBDocs()`, `renderIdentityBDocs()`, `prepareStep()`),
`translations.json` (new `idb_no_docs`, `idb_none_heading`, `idb_none_call` in all 5
languages)

---
## [0.7.17] - 2026-05-16 - Fix res_none_call copy to name the License Division

Updated `res_none_call` in all five languages to include "License Division" / equivalent
so the call-to-action identifies the office, not just the phone number.

**Files changed:** `translations.json`

---
## [0.7.16] - 2026-05-16 - Residency no-documents inline warning

### Add "I don't have any of the following items" option to Proof of Residency step

Users who lack any qualifying residency document previously saw a generic error on Next
with no guidance. A `_none` radio (styled with `.radio-item-none`, matching the
identity_a pattern) is now appended to the residency fieldset. Selecting it immediately
shows an inline warning panel (`#res-none-panel`, reusing `.not-eligible-panel` styles)
and hides the Next button and the redundant `res_call_help` line - mirroring the live
not-eligible behavior in the eligibility step. Switching back to a real document restores
all three instantly. Forward navigation is blocked, not redirected.

Root cause / motivation: No guidance existed for users without residency documents.

**Files changed:** `index.html` (new `#res-none-panel`, id added to `res_call_help`
paragraph), `wizard.js` (`showResNonePanel()`, `hideResNonePanel()`,
`onResidencyRadioChange()`, `nextFromResidency()`, `renderResidencyDocs()`,
`prepareStep()`), `translations.json` (new `res_no_docs`, `res_none_heading`,
`res_none_call` in all 5 languages)

---
## [0.7.15] - 2026-05-16 - Clarify residency requirement is current, not historical

**Root cause:** `el_res_q` and `el_not_elig_res` said "at least 15 days" without specifying that the residency must be continuous and current. An applicant who lived in Milwaukee in the past but no longer does could misread the question as satisfied.

**Fix:** Updated both keys in all five languages to say "at least the last 15 days." Spanish adds "los ultimos"; Hmong adds "dhau los no" (these past days); Burmese adds "lwn cahaw" (the past/recent); Arabic restructures to "khilal al-15 yawman al-akhira" (during the last 15 days). The ineligibility message shown on "No" was updated identically in each language.

**Files changed:** `translations.json`

---
## [0.7.14] - 2026-05-16 - Replace header logo placeholder with official PNG

- Replaced `.city-logo-placeholder` div and `.logo-placeholder-text` span in `index.html` with an `<img class="city-logo">` element pointing to the official City of Milwaukee logo file (`CCCC Logo.png`)
- Removed `.city-logo-placeholder` and `.logo-placeholder-text` CSS rules from `styles.css`
- Added `.city-logo` rule with responsive sizing; updated mobile breakpoint rule from placeholder size to `width: 40px`
- Removed `aria-hidden` from `.city-badge` div so the logo alt text is available to assistive technology

**Files changed:** `index.html`, `styles.css`, `CHANGELOG.md`

---
## [0.7.13] - 2026-05-03 - Fix eligibility dead space and doc group heading size

### Bug 1 - Eligibility step dead space on mobile

**Root cause:** `main { flex: 1; }` causes main to expand to fill all remaining
height in the flex `.wizard-container`. On short steps like eligibility (two radio
questions and two nav buttons), this pushes the nav buttons high and leaves a large
blank gap between them and the help footer. Previous patches reduced padding-bottom
and added dvh support but did not address the flex growth itself.

**Fix:** Added `main { flex: initial; }` inside `@media (max-width: 480px)`. This
stops main from stretching on mobile so content height drives layout and no dead
space appears below the nav buttons. The `.help-footer` with `position: sticky;
bottom: 0` handles staying visible while scrolling.

Also added `.step-language { min-height: 60vh; }` in the same mobile block. Without
it, removing flex growth from main would collapse the language step to the height of
its content, breaking the `justify-content: center` vertical centering on the
language selection grid. The 60vh floor gives enough room for centering at all
common phone sizes while leaving the footer near the bottom of the screen.

### Bug 2 - Doc group legend heading undersized

**Root cause:** `.doc-group legend` had `font-size: var(--font-size-base)` (16px),
the same size as body text. The legend appears as a full-width colored banner heading
that introduces the document checklist, so it needs more visual weight.

**Fix:** Changed `.doc-group legend` font-size to `var(--font-size-lg)` (18px)
globally. Added a mobile override inside `@media (max-width: 480px)` that resets it
back to `var(--font-size-base)` (16px). Longer translated headings (Burmese, Arabic)
at 18px would wrap to 3+ lines inside the 280px banner on 320px screens, so the
override keeps them legible. The `.group-note` span inside the legend already has
`font-size: var(--font-size-sm)` and lower weight, so it remains visually subordinate
at both sizes.

### Files changed
- styles.css

---
## [0.7.12] - 2026-05-03 - Mobile UI bug sweep: 9 CSS fixes

### Bugs fixed

**Bug 1 - Viewport height instability (body):** Added `min-height: 100dvh` after
`min-height: 100vh` on `body`. Previously only `.wizard-container` had the dvh
fallback (added in 0.7.11). Dynamic viewport height prevents layout recalculation
when the mobile browser chrome shows/hides.

**Bug 2 - Dead space below nav buttons:** Increased `main` padding-bottom from
`var(--space-4)` to `var(--space-6)` (24px). The previous session set 16px; 24px
gives a bit more breathing room without re-introducing the 100px reserve.

**Bug 3 - Progress dots hidden on mobile:** Removed `.step-dots { display: none; }`
from the <=480px media query. Dots are now visible on mobile so users can see their
position and tap completed steps to navigate back. Dot size reduced to 12x12px at
this breakpoint so 8 dots fit comfortably at 320px width. Labels stay hidden.

**Bug 4 - Touch targets below WCAG minimum on Yes/No radios:** Added
`min-height: 48px` to `.radio-label` inside the <=480px block. Eligibility and
confirm_id radio buttons now meet the 44px WCAG 2.1 AA touch target minimum.

**Bug 5 - Help footer too tall on narrow phones:** Added `padding: var(--space-2)
var(--space-4)` to `.help-footer` and `justify-content: center; gap: var(--space-2)
var(--space-4)` to `.help-footer-inner` at <=480px. Changed `.help-label` font-size
to `var(--font-size-xs)` so all three footer items fit in a single row at 320px.

**Bug 6 - Sub-scenario cards cramped in 2-column grid:** Changed `.sub-options`
grid from `1fr 1fr` to `1fr` at <=480px. All three sub-scenario cards (lost/stolen/
damaged, expired, address change) are now full-width and easier to tap.

**Bug 7 - Scenario cards insufficient tap area:** Updated `.scenario-card` at
<=480px to `padding: var(--space-4) var(--space-5)` and added `min-height: 64px`
to ensure the entire card is a large, obvious tap target.

**Bug 8 - Options banner pushes doc list below fold:** Added `padding: var(--space-3)`
and `gap: var(--space-3)` to `.options-banner` at <=480px. Reduced `.option-badge`
to 28x28px and `.option-divider` to `font-size: var(--font-size-xs)` to compress
the explanation block so the document radio list is closer to the top of the screen.

**Bug 9 - Doc radio buttons misaligned on wrapping labels:** Added
`.doc-group .radio-item { align-items: flex-start; }` and `margin-top: 2px` on
`.doc-group input[type="radio"]` (both at all breakpoints). Long translated document
names that wrap to multiple lines now keep the radio button anchored to the first
line of text instead of floating to the vertical center of the block.

### Root cause summary
All were mobile CSS oversights: excessive reserved space, hidden navigation elements,
insufficient touch targets, and alignment defaults that only look correct with single-
line labels.

### Files changed
- styles.css

---
## [0.7.11] - 2026-05-03 - Fix mobile layout jump on eligibility step

### Problem
On mobile, the eligibility step showed ~100px of blank space below the nav buttons, and
scrolling caused the layout to jump as the address bar appeared/disappeared.

### Root Cause
Two combined issues:
1. `main` had `padding-bottom: calc(var(--footer-height) + var(--space-8))` (~100px).
   The sticky `.help-footer` occupies its own space in the flex column, so content does
   not need a large padding to clear it. The excess padding created dead whitespace that
   was especially visible on short steps like eligibility.
2. `.wizard-container` used `min-height: 100vh` only. On mobile browsers, `100vh` is the
   maximum viewport height (address bar hidden), so the container recalculated and jumped
   whenever the address bar showed or hid.

### Fix
- Changed `main` padding-bottom from `calc(var(--footer-height) + var(--space-8))` to
  `var(--space-4)` (16px minimal breathing room).
- Added `min-height: 100dvh` after `min-height: 100vh` on `.wizard-container` so
  browsers that support the dynamic viewport unit use it, eliminating the jump. Older
  browsers fall back to the 100vh line.

### Files changed
- styles.css

---
## [0.7.10] - 2026-05-01 - Add semantic versioning to changelog

### Versioning system added

Applied `0.MINOR.PATCH` semantic version numbers to all 27 changelog entries.
MINOR bumps for features and overhauls, PATCH bumps for fixes and improvements.
All `[Unreleased]` tags replaced with version numbers. Heading format standardized
to `[version] - date - title`.

Files changed: CHANGELOG.md

---

## [0.7.9] - 2026-05-01 - Bug fix: summary persists after Start Over

### Problem
Summary step remained visible alongside the language step after clicking "Start Over."

### Root Cause
`startOver()` resets `state.currentStep` to `'language'` via `Object.assign(state, DEFAULT_STATE)` before calling `goToStep('language')`. Since `goToStep()` hides `step-{state.currentStep}` (already reset to `'language'`), it hid and immediately re-showed the language step while never hiding the summary step.

### Fix
Added `document.querySelectorAll('.step').forEach(el => { el.hidden = true; })` as the first line of `startOver()`, hiding all step sections before the state reset. `goToStep('language')` then cleanly shows only the language step.

### Files changed
- `wizard.js` - one line added at the top of `startOver()`
- `CHANGELOG.md`

---

## [0.7.8] - 2026-05-01 - Cleanup: stale references and orphaned keys

### Updated stale HTML fallback text
- Changed hardcoded fallback text in three `<p class="doc-instruction">` elements in index.html
  from "Check every document you plan to bring:" to "Select the document you plan to bring:"
  to match the current `id_instruction` and `res_instruction` translation values

### Removed orphaned translation keys
- Removed 7 orphaned keys from all 5 languages in translations.json: `sc_lost`, `sc_damaged`,
  `su_sc_lost`, `su_sc_damaged`, `el_age_q`, `el_under18_q`, `prog_identity`
- These were left over from the lost/stolen/damaged consolidation, eligibility rewrite,
  and identity step split

### Updated stale DOM tests
- Updated dom-tests.html to reflect the checkbox-to-radio conversion: all `#chk-*` selectors
  replaced with `selectRadio()` calls using radio `name` and `value` attributes
- Updated `#btn-no-option-a` references to `#radio-none-option-a` (now a radio input)
- Updated CSS tests C1/C4/C5/C6 to test `.radio-item-none` instead of the removed
  `.btn-text-link` and `.no-option-a-wrap` elements
- Updated Path 2 doc-group assertions from `.doc-checkbox[data-group=*]` to
  `input[name=*]` selectors
- Rewrote E4 to test valid identity_b selection (both photo and DOB groups filled) since
  radio inputs cannot be individually unchecked; E3 still tests photo-only error
- Removed untestable residency "uncheck" assertion in P9 (radios have no deselect)

Files changed: index.html, translations.json, dom-tests.html, CHANGELOG.md

---

## [0.7.7] - 2026-05-01 - AI notice wording update

### Updated AI Disclosure Notice Wording

Revised the AI disclosure notice text for a more formal, government-appropriate tone.
Removed the phone number link since the help footer already provides contact information.

Old: "This tool was developed with the assistance of AI. Translations may contain errors - for official information, please contact the License Division."
New: "AI tools were used in the development of this application. Non-English translations are machine-generated and may contain inaccuracies."

- Updated `ai_notice` translation key in all five languages (en, es, hmn, my, ar)
- Removed tel: link from the notice markup
- Removed now-unused `.ai-notice a` and `.ai-notice a:hover` CSS rules

**Files changed:** `index.html`, `styles.css`, `translations.json`, `CHANGELOG.md`

---

## [0.7.6] - 2026-05-01 - AI disclosure notice

### AI Disclosure Notice

Added a small notice at the bottom of the page disclosing that the tool was developed with AI assistance and that translations may contain errors, with the License Division phone number for official information.

- Visible on screen (small, muted, centered text below the ADA statement) and in print (8pt, gray, below the ADA statement)
- Text is translated via the i18n system: displays in English on the language selection step, then switches to the user's selected language
- Translation key `ai_notice` added to all five languages (en, es, hmn, my, ar)
- Added `--font-size-xs` (0.75rem / 12px) custom property to `:root` to support the notice's small font size

**Files changed:** `index.html`, `styles.css`, `translations.json`, `CHANGELOG.md`

---

## [0.7.5] - 2026-05-01 - Remove redundant language step subtitle

### Removed Subtitle from Language Selection Step
Removed the "Select the language you prefer" subtitle paragraph from the language selection step.
The multilingual heading already communicates the action clearly, and removing the subtitle
reduces clutter and brings the language buttons closer to the heading.

Changes:
- index.html: Deleted the `<p class="lang-sub lang-sub-multilingual">` element and all its multilingual span contents
- styles.css: Removed the `.lang-sub` and `.lang-sub-multilingual` rule blocks (now unused)
- translations.json: Removed the `lang_sub` key from all five language objects (en, es, hmn, my, ar)

---

## [0.7.4] - 2026-05-01 - Restore spacing on language step heading

### Increased Heading-to-Grid Spacing on Language Step
Increased `.lang-heading` margin-bottom from `--space-2` to `--space-8` to restore visual
balance after the subtitle paragraph was removed. The extra space prevents the heading and
button grid from feeling cramped now that there is no subtitle acting as a spacer.

Files changed: styles.css

---

## [0.7.3] - 2026-05-01 - Vertically center language step content

### Vertically Centered Language Selection Step
Replaced the top-heavy padding layout on the language step with flexbox vertical centering.
Content now sits in the middle of the available viewport area instead of being pinned to the
top with a large empty area below.

Changes:
- `.step-language`: added `display: flex`, `align-items: center`, `justify-content: center`,
  and `min-height: calc(100vh - 52px - var(--footer-height))` to center content vertically
- `.step-language-inner`: reduced padding from `var(--space-10) ... var(--space-12)` to
  `var(--space-6) var(--wizard-padding)` to let flexbox handle vertical spacing
- `.lang-heading`: reduced margin-bottom from `--space-8` to `--space-6` for tighter heading-to-grid rhythm

Files changed: styles.css

---

## [0.7.2] - 2026-05-01 - Fix language step layout

### Four layout problems fixed on the language selection step

**A. Viewport overflow (root cause: incorrect min-height calc)**
The `.step-language` min-height was `calc(100vh - 52px - var(--footer-height))`. The 52px
did not reflect the actual header height (~83px: 32px padding + 48px logo + 3px border), and
the calc ignored the 80px of body padding + container margin-block added at the 860px+ breakpoint.
Fix: replaced the explicit min-height with `flex: 1` so the step fills whatever the container's
flex column leaves after the header and footer. Added `min-height: calc(100vh - 2 * var(--space-6)
- 2 * var(--space-4))` to `.wizard-container` inside the 860px+ media query so the container
itself no longer overflows the viewport at that breakpoint.

**B. Excessive dead space (root cause: min-height forcing container growth)**
The old min-height caused the step to expand far beyond the container's 100vh, creating vast
empty areas. With `flex: 1`, the step grows to exactly fill remaining container height, and the
existing `align-items: center` centers the content naturally within that space.

**C. Asymmetric button grid (root cause: grid auto-fit with partial last row)**
`repeat(auto-fit, minmax(150px, 1fr))` produced 3 buttons on the first row and 2 left-aligned
on the second, with an empty cell on the right. Switched `.lang-grid` from `display: grid` to
`display: flex; flex-wrap: wrap; justify-content: center`. Added `flex: 0 1 180px` to `.lang-btn`
so buttons naturally arrange 3+2 and the 2-button last row is centered. At <=480px the flex
sizing naturally wraps to 2 per row (2+2+1, last centered). Removed the now-stale
`grid-template-columns` overrides from the 480px and 481-767px breakpoints.

**D. Insufficient visual mass (heading too small, buttons too short)**
Bumped `.lang-heading` clamp from `(--font-size-lg ... --font-size-2xl)` to
`(--font-size-xl ... --font-size-3xl)` (20px-30px). Increased `.lang-btn` min-height from
80px to 100px and `.lang-native` clamp upper bound from 1.4rem to 1.5rem.

Files changed: styles.css

---

## [0.7.1] - 2026-05-01 - Translation consistency fixes

### Cross-language translation discrepancies fixed

Fixed 7 translation values across 4 languages to eliminate meaning differences from English:

- vi_hours (es, hmn): corrected office closing time from 4:00 PM to 4:30 PM to match en/my/ar
- vi_payment, su_rem_fee (my): replaced non-standard Burmese word for cash with standard term
- doc_visa (ar): simplified from "entry visa" to generic "visa" to match English scope
- el_under18 (my): changed "should accompany" to "must accompany" for guardian requirement to match the obligatory tone in all other languages

**Files changed:** `translations.json`

---

## [0.7.0] - 2026-05-01 - Codebase refactor: reduce duplication

### wizard.js
- Extracted `goToNextStepFrom(stepId)` helper to replace 8 repeated two-line navigation patterns
- Extracted `bindClickAndKey(el, fn)` helper to consolidate click + keydown binding in progress bar and language buttons
- Deduplicated `nextFromIdentityA()` - moved shared navigation call after the if/else branches
- Introduced frozen `DEFAULT_STATE` object and `Object.assign()` in `startOver()` to reduce fragility
- Replaced em dash with hyphen in `announceStep()` screen reader text

### styles.css
- Added `--color-primary-hover` (#EEF4F8) and `--color-primary-selected` (#E3EEF5) custom properties, replacing 6 hardcoded hex values
- Removed dead `.step[hidden]` rule (redundant with global `[hidden]` rule)
- Removed unnecessary `font-family` declarations from `.sub-card` and `.radio-label` (inherited from body)
- Merged duplicate `.doc-group .checkbox-item` and `.doc-group .radio-item` rule blocks

### index.html
- Added inline SVG sprite with `#icon-warning` and `#icon-info` symbols, replacing 9 duplicated inline SVGs

### Files changed
- wizard.js
- styles.css
- index.html
- CHANGELOG.md

---

## [0.6.3] - 2026-04-30 - Spanish translation refinements

### Spanish Translation Wording Updates
Refined several Spanish translation strings for naturalness and consistency with the official
City of Milwaukee Spanish-language application materials.

Changes:
- sc_existing_desc: "ID existente" changed to "ID actual"
- res_sub: "documento de residencia que planea traer" changed to "comprobante de residencia que planea presentar"
- res_instruction: "planea traer" changed to "planea presentar"
- res_one_doc_reminder, id_one_doc_reminder: "necesita traer" changed to "necesita presentar"
- vi_fee_h: "Tarifa" changed to "Cuota"
- vi_fee: added "cuota" to fee display text
- vi_fee_replacement: "tarifa de reemplazo" changed to "cuota de reemplazo"
- su_after_vote: "no puede ser utilizada para votar en Wisconsin" changed to "no es válida para votar"

**Files changed:** `translations.json`

---

## [0.6.2] - 2026-04-30 - Hmong translation alignment

### Hmong translations aligned with official application PDF

Updated 46 Hmong (`hmn`) translation values in `translations.json` to match the phrasing
used on the official City of Milwaukee Hmong application PDF
(`Muni_ID_InfoSheet_w_Application_Hmong.pdf`). The previous values were machine-translated
and diverged from the official document in vocabulary, style, and in one case a factual
detail (office closing time).

Key categories of changes:
- Identity document names switched to PDF's Hmong+English hybrid style (e.g. "Daim U.S.
  State Driver's License" instead of fully-Hmong "Ntawv Tso Cai Tsav Tsheb ntawm Xeev U.S.")
- Residency document names updated to include English parentheticals matching the PDF
- "neeg saib xyuas" changed to "muaj cai saib (legal guardian)" for legal guardian
- "tsis txhob thim" changed to "thim tsis tau" for non-refundable
- "tshev" changed to "daim check" for check payments
- Office hours corrected from 4:30 PM to 4:00 PM per the PDF
- Visit step text aligned with PDF phrasing
- Public records legal text replaced with the PDF's official version

No English, Spanish, Burmese, or Arabic translations were changed.

**Files changed:** `translations.json`

---

## [0.6.1] - 2026-04-30 - Save as PDF UX

### Improved "Save as PDF" button differentiation from "Print Checklist"

**Root cause:** Both `btn-print` and `btn-save` called `window.print()` identically, making "Save as PDF" feel like a duplicate print button. Since the project cannot use external PDF libraries, `window.print()` is the correct mechanism, but the UX gave no guidance.

**Fix:**
- Added `saveAsPdf()` function in `wizard.js` that temporarily adds a `pdf-save-mode` class to `document.body` before calling `window.print()`, removed via `afterprint` event (with setTimeout fallback)
- Added a `.pdf-save-hint` element in the summary step that only renders in print preview when the PDF save mode class is active, instructing users to select "Save as PDF" as their printer destination
- Added `su_pdf_save_hint` translation key to all 5 languages in `translations.json`

**Files changed:** `wizard.js`, `styles.css`, `index.html`, `translations.json`

---

## [0.6.0] - 2026-04-30 - Spanish translation alignment

### Spanish translations aligned with official application PDF

Updated 42 Spanish (`es`) translation values in `translations.json` to match the phrasing
used on the official City of Milwaukee Spanish application PDF
(`Muni_ID_InfoSheet_w_Application_Spanish.pdf`). The previous values were machine-translated
and diverged from the official document in vocabulary, phrasing, and in one case a factual
detail (office closing time).

Key categories of changes:
- "EE.UU." spelled out as "los Estados Unidos" throughout
- "tutor legal" changed to "guardian legal" (PDF's term)
- "ID" / "Tarjeta de ID" changed to "Identificacion" (full word)
- "Licencia de Conducir" changed to "Licencia para conducir"
- Residency document names updated to match PDF vocabulary
- "residencia" changed to "domicilio" for proof-of-address context
- Office hours corrected from 4:30 PM to 4:00 PM per the PDF
- Public records legal text replaced with the PDF's official version
- Various other phrasing aligned to match the official document

No English, Hmong, Burmese, or Arabic translations were changed.

**Files changed:** `translations.json`

---

## [0.5.2] - 2026-04-29 - Bug fix: address change bring-old-ID reminder

### Fix 1: Address change summary now shows selected residency document
- Already resolved in a prior session (see entry below)

### Fix 2: Address change summary now reminds users to bring their current Municipal ID
- Added `su_rem_bring_old_id` translation key to all five languages in `translations.json`
- In `renderSummary()` in `wizard.js`, added a conditional `addReminder('su_rem_bring_old_id')` that fires only when `state.scenario === 'already_have' && state.subScenario === 'address_change'`, alongside the existing `su_rem_60days` (full path) and `su_rem_guardian` (minors) conditional reminders

---

## [0.5.1] - 2026-04-29 - Bug fix: address change summary missing residency doc

### Fix: Address change path now shows selected residency document in summary

- **Root cause:** `renderSummary()` wrapped the entire Documents section inside `if (needsFullPath)`, and `isFullPath()` returns `false` for address change users, so their selected residency document was never rendered in the summary
- **Fix:** Removed the outer `if (needsFullPath)` guard; `idDocIds` is now conditionally populated (`needsFullPath ? [...].filter(Boolean) : []`) while `resDocIds` is always populated from `state.selectedResidency` regardless of path
- The residency subheading's `marginTop` spacing is now applied only when identity docs appear above it, so address change summaries (residency only) have correct spacing
- No change to the full path (new / lost-stolen-damaged / expired): identity and residency docs both still appear as before
- **File changed:** `wizard.js` only

---

## [0.5.0] - 2026-04-29 - Radio documents, progress labels, print fix

### Change 1: Remove underline from completed progress bar labels
- Removed `text-decoration: underline` and `text-underline-offset: 2px` from `.step-label-clickable` in `styles.css`
- Completed step labels now signal clickability through cursor and color only; underline was visually cluttered and added no semantic value beyond what the hover color change already provides

### Change 2: Convert document checkboxes to radio buttons
- Replaced all three document selection stages (Identity A, Identity B, Residency) from checkbox inputs to radio inputs, enforcing single-document selection per group
- State fields renamed from `checkedPhotoAndDob / checkedPhotoOnly / checkedDobOnly / checkedResidency` (Sets) to `selectedPhotoAndDob / selectedPhotoOnly / selectedDobOnly / selectedResidency` (string or null) in `wizard.js`
- Removed `createDocCheckbox()` helper; added `docRadio()` that renders `<input type="radio">` with a shared `name` attribute per group
- Identity Stage 1 "I don't have any of these documents" standalone button (`#btn-no-option-a`) removed from `index.html` and its `bindEvents()` binding removed from `wizard.js`; replaced with a `_none` radio option inside the same fieldset, styled with a top border separator via `.radio-item-none`
- Added `.radio-item` CSS block to `styles.css` mirroring the existing `.checkbox-item` layout
- Updated `renderIdentityADocs()`, `renderIdentityBDocs()`, `renderResidencyDocs()`, all change handlers, `nextFromIdentityA()`, `validateIdentityBDocs()`, `nextFromResidency()`, `renderSummary()`, and `startOver()` throughout `wizard.js`
- Updated `id_instruction` and `res_instruction` translation keys from "Check every document…" to "Select the document…" for all five languages in `translations.json`
- Updated `tests.js`: `resetState()` now uses null fields, `validateIdentityBDocs()` copy checks `!== null`, and all test cases replaced `new Set(['doc_…'])` with `'doc_…'` strings

### Change 3: Fix Print Checklist and Save as PDF buttons
- Changed `.btn` to `.btn:not(.btn-download)` in the `@media print` hide list in `styles.css` so download links remain visible in print output while nav buttons are still suppressed
- Added `summary-section-heading` border override (`2pt solid #000`) and `.summary-doc-item` font-size (`11pt`) to the print block for reliable black-and-white rendering

---

## [0.4.3] - 2026-04-28 - Multilingual heading, PDF notice, DOM API conversion

### Improvement 1: Multilingual language-selection heading
- The language step heading and subtitle now display all five language versions simultaneously (EN / ES / HMN / MY / AR), each in a `<span>` with the correct `lang` attribute; Arabic span includes `dir="rtl"`
- Dividers are `aria-hidden="true"` so screen readers read only the language spans
- No `data-i18n` attributes used — static text that must never be overwritten on language change
- New CSS: `.lang-heading-divider` (muted, reduced opacity), `.lang-sub-multilingual` (base font size, generous line height); `.lang-heading` font-size reduced to `clamp(lg, 3vw, 2xl)` to accommodate five languages without overflow

### Improvement 3: Warn Burmese and Arabic users about the English PDF
- New translation key `vi_pdf_english_notice` added to all 5 languages (empty for EN/ES/HMN; Burmese and Arabic text for MY/AR)
- Two notice elements added to `index.html`: `pdf-english-notice-visit` and `pdf-english-notice-summary`, each after their respective download buttons, initially `hidden`
- `updatePdfLinks()` in `wizard.js` now shows/hides the notices based on whether the current language falls back to the English PDF
- New CSS: `.pdf-notice` (small, italic, muted — hidden by `hidden` attribute when not applicable)

### Improvement 4: Print/save handlers moved into bindEvents()
- Removed `onclick="window.print()"` from both summary action buttons in `index.html`
- Added `on('btn-print', () => window.print())` and `on('btn-save', () => window.print())` inside `bindEvents()` in `wizard.js`

### Improvement 5: startOver() resets state.lang to English
- `startOver()` now sets `state.lang = 'en'` as its first action before clearing all other state, ensuring the language-selection step reappears in English after a restart

### Improvement 7: Checklist builders converted from innerHTML to DOM API
- `docCheckbox()` replaced by `createDocCheckbox()` — returns a DOM `<div>` node using `createElement`, `setAttribute`, and `textContent`; no `esc()` needed
- `renderIdentityADocs()`, `renderIdentityBDocs()`, `renderResidencyDocs()` now use `createElement`, `textContent`, and `container.replaceChildren()` instead of template literals and `innerHTML`
- `renderSummary()` converted to DOM API with a `makeSection()` helper; `textContent` handles all escaping automatically
- `esc()` retained for `updateProgress()` which still uses innerHTML for step dots/labels

---

## [0.4.2] - 2026-04-28 - Accessibility fixes: WCAG 4.1.2, 2.4.7, 4.1.3

### Fix 1 (Critical): Focusable elements no longer hidden from assistive technology — WCAG 4.1.2
- Removed `aria-hidden="true"` from `#step-dots` and `#step-labels` in `index.html`
- Both containers hold `role="button"` / `tabindex="0"` elements injected by `updateProgress()` in `wizard.js`; hiding them via `aria-hidden` left keyboard users able to tab into them but screen readers unable to announce them, causing focus to vanish silently
- The existing `#sr-announce` live region and `#step-counter` continue to provide step-position announcements to AT; no additional ARIA was needed on the containers themselves

### Fix 2 (Critical): Removed invalid role="listitem" from language-selection buttons — WCAG 4.1.2
- Removed `role="list"` from `.lang-grid` and `role="listitem"` from all five `<button class="lang-btn">` elements in `index.html`
- The ARIA `role` attribute overrides the native element role; screen readers were announcing these as "list item" rather than "button", preventing AT users from knowing the elements were interactive
- Native `<button>` semantics are sufficient; no replacement role is needed

### Fix 3 (Serious): Keyboard focus now visible on all custom radio card wrappers — WCAG 2.4.7, 2.4.11
- Added `:focus-within` rules to `.scenario-card`, `.sub-card`, and `.radio-label` in `styles.css`
- All three card types hide their native `<input type="radio">` with `opacity: 0; width: 1px; height: 1px;`; without `:focus-within`, the browser's focus ring appeared on the invisible 1×1 px input rather than the visible card
- The new rules apply the same gold focus indicator (`var(--color-gold)`, 3 px solid) already used by the global `:focus-visible` rule, maintaining visual consistency across the wizard

### Fix 4 (Serious): Resolved role="alert" / aria-live="polite" conflict on feedback banners — WCAG 4.1.3
- Changed `role="alert"` to `role="status"` and removed the redundant `aria-live="polite"` attribute from all three doc-feedback elements (`#ida-feedback`, `#idb-feedback`, `#res-feedback`) in `index.html`; `role="status"` implies `aria-live="polite"` and is correct for these elements at rest
- Updated `setFeedback()` in `wizard.js` to dynamically set `role="status"` for success messages and `role="alert"` for validation errors: success confirmations are announced politely (non-interrupting); validation errors are announced assertively (immediate attention required)
- Previously, `role="alert"` (implicit `aria-live="assertive"`) conflicted with the explicit `aria-live="polite"`, producing inconsistent behaviour across screen readers

---

## [0.4.1] - 2026-04-28 - Remove Option A docs from Stage 2

### Fix: Remove Option A documents from Identity Documents Stage 2

**Problem:** `renderIdentityBDocs()` rendered the "Documents with Photo AND Date of Birth"
fieldset (Option A docs) alongside the photo-only and DOB-only groups. Because the user
already saw and declined those exact documents on Stage 1, showing them again was redundant
and confusing.

**Changes in `wizard.js`:**

- **`renderIdentityBDocs()`:** Removed the `doc-group-both` fieldset entirely. Stage 2
  now shows only photo-only docs (foreign DL, foreign military ID, student ID) and DOB-only
  docs (birth certificate, SSN, visa, ITIN). Also calls `state.checkedPhotoAndDob.clear()`
  on entry to eliminate any stale Option A selection carried over from a previous visit to
  Stage 1 (e.g., if the user had checked a doc then clicked "I don't have any of these").

- **`validateIdentityBDocs()`:** Removed `hasPhotoAndDob` variable and the three logic
  branches that gave credit for `checkedPhotoAndDob`. Validation now only checks
  `checkedPhotoOnly` and `checkedDobOnly`. Valid when both sets are non-empty; returns
  `id_missing_dob` / `id_missing_photo` / `id_none_selected` otherwise.

- **`onIdentityBCheckboxChange()`:** Removed `photoAndDob` from the group dispatch map
  since those checkboxes are no longer rendered on Stage 2.

**Summary generation:** unchanged — `renderSummary()` still reads all three Sets, which is
correct: Option A users have docs in `checkedPhotoAndDob`; Option B users have docs in
`checkedPhotoOnly` + `checkedDobOnly`.

**Tests updated (`tests.js`):**
- `validateIdentityBDocs()` copy updated to match new logic.
- Test 18 changed: "photoOnly + photoAndDob (photoAndDob ignored) → missing_dob" to confirm
  photoAndDob docs no longer satisfy Stage 2 even when present in state.
- Test 22 changed: "photoAndDob-only → none_selected" to confirm Stage 2 treats that Set as
  invisible.
- All 34 tests pass.

**DOM tests updated (`dom-tests.html` Path 2):**
- Added assertion: `identity-b-docs-container` has zero `data-group="photoAndDob"` checkboxes.
- Added assertions: photoOnly and dobOnly checkboxes are present.
- Added assertions: summary correctly shows the two selected Option B docs (Student ID, Birth
  Certificate) after completing the path.

**Files changed:** `wizard.js`, `tests.js`, `dom-tests.html`

---

## [0.4.0] - 2026-04-28 - Phase 1 brand compliance

### Critical: Color tokens updated to official City of Milwaukee Brand Guidelines (C-03)
- All `--color-*` custom properties in `:root` updated to official values (Main Blue `#1B365D`, Bright Blue `#0076BE`, Gold `#F9B421`, Red `#B52B31`, Green `#43B02A`, White background)
- Added brand-named aliases (`--main-blue`, `--bright-blue`, `--dark-blue`, `--gold`, `--brand-red`, `--brand-green`) alongside functional tokens
- Updated all hardcoded hex/rgba color values in `styles.css` to new palette
- Updated hardcoded hex values in scenario card and header seal SVGs in `index.html`

### Critical: Font updated to Montserrat (C-02)
- Added Google Fonts preconnect and Montserrat (400/500/600/700/800) to `index.html`
- Updated `--font-family` in `styles.css` to `"Montserrat", Arial, ...` (Burmese and Arabic script fallbacks retained)
- Updated `.step-heading` weight to 800 (ExtraBold) per brand type scale
- Updated eyebrow/metadata letter-spacing to `0.1em` (`visit-card-heading`, `summary-section-heading`, `records-heading`)

### Critical: Replaced hand-drawn header seal with placeholder (C-01)
- Removed unofficial hand-drawn circle seal SVG from `index.html`
- Replaced with `.city-logo-placeholder` div with TODO comment directing the Brand Officer for official artwork
- Added `.city-logo-placeholder` and `.logo-placeholder-text` CSS rules in `styles.css`

### Critical: Replaced all emoji with two-color SVG icons (C-04)
- Sub-scenario icons: 🏠→house, 🔍→search, 📅→calendar
- Notice icons: ℹ️→info circle, ⚠️/👤→warning triangle, 📅→calendar
- Visit card icons: 📍→map pin, 🕐→clock, 💳→card, 📋→clipboard
- Download arrow: ⬇→SVG download icon
- All SVGs use `currentColor` stroke (inherits brand blue from parent) with gold accents where specified
- Updated icon container CSS (`.sub-icon`, `.notice-icon`, `.visit-card-icon`, `.not-elig-icon`) to `display: inline-flex` approach

### Major: ADA accommodation statement added to print view (W-01)
- Added `.ada-statement.print-only` element at bottom of `#wizard-container` in `index.html`
- Added `ada_statement` translation key in all 5 languages in `translations.json`
- Added `.ada-statement` print styles in `styles.css` (9pt, border-top, visible on print only)

---

## [0.3.1] - 2026-04-28 - Bug fixes: confirm_id, double-nav; test suite added

### Bug Fix 1: Address Change subScenario permanently overwritten on confirm_id=no redirect

**Root cause:** `nextFromConfirmId()` always executed `state.confirmId = radio.value` before the
if/else branch. In the "no" branch it then overwrote `state.subScenario = 'lost_stolen_damaged'`
but left `state.confirmId = 'no'` in place. If the user later navigated back to the confirm_id
step (e.g., via the Back button from eligibility) the radio appeared already answered, and the
address-change path context was silently replaced — making the summary show the wrong situation.

**Fix in `wizard.js` (`nextFromConfirmId`):**
- `state.confirmId` is only assigned for the "yes" branch (`state.confirmId = 'yes'`).
- For the "no" branch: `state.confirmId = null` is explicitly set and the `confirm_id` radios
  are cleared via `forEach(r => { r.checked = false; })` so back-navigation shows a clean state.
- Summary correctness: `situationKey()` now always reflects the final state accurately —
  "Address Change" if the user confirmed having their ID; "Lost, Stolen, or Damaged" if redirected.

**Files changed:** `wizard.js` only.

### Bug Fix 2: 400ms setTimeout in nextFromIdentityA/B caused double-navigation

**Root cause:** `nextFromIdentityA()` and `nextFromIdentityB()` used a 400ms `setTimeout` to
delay navigation after showing the success feedback. During that window a second click of Next
triggered a second `goToStep()` call, advancing the wizard one step too far (e.g., from
residency directly to visit).

**Fix in `wizard.js`:**
- Removed `setTimeout` from both `nextFromIdentityA()` and `nextFromIdentityB()`.
- Navigation now happens synchronously immediately after the feedback is set.
- The success feedback is still displayed; it just does not create a navigable delay.

**Files changed:** `wizard.js` only.

### Test Suite Added

**`tests.js`** — Node.js unit tests (run with `node tests.js`):
- 34 tests covering `getSteps()` (8), `isFullPath()` (4), `situationKey()` (4),
  `validateIdentityBDocs()` (6), step adjacency (7), and translation completeness (5).
- Translation audit: all `prog_` keys, all `situationKey()` return values, all 16 new
  feature-set-2 keys, and all English keys verified present in all 5 languages.
- HTML `data-i18n` key audit: every key referenced in `index.html` verified in all 5 languages.
- All 34 tests pass; one harmless warning (`es.el_no` = "No" matches English, expected).

**`dom-tests.html`** — Browser DOM simulation tests (serve via `launch.sh` then open
`http://localhost:PORT/dom-tests.html`):
- 11 wizard paths: New ID Option A/B, Address Change (with/without ID), Lost/Stolen/Damaged,
  Expired, Minor guardian flow, progress bar back-navigation, green feedback toggles,
  language switching mid-flow, not-eligible paths.
- CSS tests C1–C6: cursor, text-decoration, visibility, margin for new CSS classes.
- Edge cases E1–E10: double-click guard, empty-selection Next behaviour, per-group validation
  errors, residency guard, eligibility guard, scenario guard, mid-flow scenario change.
- Print layout checks F1/F2: `.print-only` and `.no-print` rules verified on screen.

**Files created:** `tests.js`, `dom-tests.html`

---

## [0.3.0] - 2026-04-27 - Feature Set 2

### Task 1: Clickable Progress Bar
Completed step dots and labels are now interactive. Clicking (or pressing Enter/Space) on any dot or label navigates back to that step while preserving all selections.
- Non-clickable (future/current) steps are unchanged.
- Accessible: `role="button"`, `tabindex="0"`, `aria-label`, keyboard support.
- CSS: `.step-dot-clickable` and `.step-label-clickable` with hover/focus styles.
**Files changed:** `wizard.js` (`updateProgress()`), `styles.css`

### Task 2: Merge Lost/Stolen and Damaged Sub-scenarios
"My ID was lost or stolen" and "My ID is damaged" are merged into a single option: **"My ID was lost, stolen, or damaged"** (value `lost_stolen_damaged`). The sub-options panel now has three choices instead of four.
**Files changed:** `index.html` (removed `sub-damaged` card, updated `sub-lost-damaged`), `wizard.js` (`situationKey()`, state handling), `translations.json` (added `sc_lost_damaged`, `su_sc_lost_damaged` in all 5 languages)

### Task 3: Redesign Existing-ID Paths
- **Lost/Stolen/Damaged and Expired:** Now follow the full standard path (eligibility + identity + residency), same as new-ID applicants.
- **Address Change:** Follows a shorter path: language → scenario → confirm_id → residency → visit → summary.
- **Confirm Old ID step** (`step-confirm_id`): Yes/No radio. If "No," user is redirected to the full path with `subScenario = 'lost_stolen_damaged'`.
- Fee display on Visit step now shows "replacement fee" text for existing-ID scenarios (`vi_fee_replacement` key).
**Files changed:** `index.html` (new `step-confirm_id` section), `wizard.js` (new `ADDRESS_STEPS`, `nextFromConfirmId()`, `updateVisitFee()`), `translations.json` (new `confirm_id_heading`, `confirm_id_q`, `vi_fee_replacement`, `prog_confirm_id` in all 5 languages)

### Task 4: Public Records Full Legal Text
The expandable public records section now shows the full official legal text in English for all five languages. The short summary line (`vi_records_short`) remains translated per language.
**Files changed:** `translations.json` (`vi_records_detail` updated in all 5 languages)

### Task 5: Two-Stage Identity Document Flow
Identity documents split into two steps:
- **Stage 1 (`step-identity_a`):** Shows Option A docs (photo + DOB). Live green success when any is checked. If Next clicked with an Option A doc selected, Stage 2 is skipped entirely (7-step path). "I don't have any of these" button advances to Stage 2 (8-step path).
- **Stage 2 (`step-identity_b`):** Shows Option A docs (any one satisfies both), photo-only docs, and DOB-only docs. Live validation requires at least one photo + one DOB doc.
- Progress bar dynamically shows 7 or 8 steps depending on Option A selection.
**Files changed:** `index.html` (new `step-identity_a`, `step-identity_b`), `wizard.js` (new rendering functions, `nextFromIdentityA()`, `nextFromIdentityB()`, dynamic `getSteps()`), `styles.css` (`.btn-text-link`, `.no-option-a-wrap`, `.doc-group-dob`), `translations.json` (new `id_one_doc_reminder`, `id_option_a_success`, `id_no_option_a`, `id_heading_b`, `id_two_doc_reminder`, `prog_identity_a`, `prog_identity_b` in all 5 languages)

### Task 6: Green Success Notification on Residency Documents
Selecting any residency document now immediately shows a green success notification ("You have valid proof of residency. Click Next to continue."). Notification disappears if all checkboxes are unchecked. A "one document needed" reminder added at the top of the step.
**Files changed:** `wizard.js` (new `onResidencyCheckboxChange()`), `index.html` (new reminder notice), `translations.json` (new `res_valid`, `res_one_doc_reminder` in all 5 languages)

### Task 7: Translation Audit and Fixes
- "Get directions" link now uses `data-i18n="vi_get_directions"` with `vi_get_directions` key in all 5 languages. `aria-label` now uses `data-i18n-aria-label` attribute handled by `applyTranslations()`.
- `data-i18n-aria-label` attribute support added to `applyTranslations()`.
- Option A/B banner dashes changed from em-dashes to hyphens in all translation strings.
- All new keys from Tasks 1–6 added in all 5 languages.
**Files changed:** `index.html`, `wizard.js`, `translations.json`

### Task 8: Prominent 5-Year Expiration Notice
Both identity steps now show the expiration notice using `.notice.notice-warning` (yellow/gold) instead of `.notice-info`, making it more visually prominent.
**Files changed:** `index.html`

---

## [0.2.2] - 2026-04-26 - PDF download links

### Language-Specific Application PDF Download Links

Both download buttons (Visit step and Summary step) now point to the correct language-specific
application PDF based on the user's language selection. URLs update immediately whenever the
language changes, including on the initial page load.

| Language | PDF |
|---|---|
| English (en) | Muni_ID_Application_English.pdf |
| Spanish (es) | Muni_ID_InfoSheet_w_Application_Spanish.pdf |
| Hmong (hmn) | Muni_ID_InfoSheet_w_Application_Hmong.pdf |
| Burmese (my) | Falls back to English PDF |
| Arabic (ar) | Falls back to English PDF |

**Implementation:**
- Added `PDF_URLS` constant to `wizard.js` keyed by language code
- Added `updatePdfLinks()` function called from `applyTranslations()` — sets `href` on all
  elements with the `data-pdf-link` attribute
- Added `data-pdf-link` attribute to both download `<a>` tags in `index.html`
- URLs are NOT hardcoded in HTML; JS sets them on every language switch

**Files changed:** `wizard.js`, `index.html`

### Summary Download Link Label

The summary/checklist step download button now shows **"Download Application Form"** (without
the "(PDF)" suffix) in all five languages. Previously the `su_download_app` translation key was
missing from `translations.json`, causing the button to display the raw key string
`"su_download_app"` after JS translations loaded.

| Language | Label |
|---|---|
| English | Download Application Form |
| Spanish | Descargar Formulario de Solicitud |
| Hmong | Rub Tawm Daim Ntawv Thov |
| Burmese | လျှောက်လွှာပုံစံ ဒေါင်းလုဒ်ဆွဲမည် |
| Arabic | تنزيل نموذج الطلب |

The Visit step button retains its existing label "Download Application Form (PDF)" which is
unchanged.

**Files changed:** `translations.json` (added `su_download_app` to all 5 languages), `index.html`
(updated fallback text from "(PDF)" to match the new key value)

---

## [0.2.1] - 2026-04-26 - Bug fixes: guardian notice, progress bar dots

### Bug Fix: Guardian Notice Incorrectly Always Visible

**Root cause:** `.notice { display: flex; }` in `styles.css` is an author-stylesheet rule, which takes
priority over the browser's user-agent `[hidden] { display: none; }` rule. As a result, every
`.notice` element was rendered regardless of the HTML `hidden` attribute — including the
`#under18-notice` guardian bubble which was supposed to be hidden until the user confirmed they
are 14–17 years old.

**Fix:** Added `[hidden] { display: none !important; }` to the Reset & Base section of `styles.css`.
This follows the HTML spec's intent and the pattern of widely-used CSS resets (normalize.css,
modern-normalize). The `!important` is required because author-level class rules (specificity 0,1,0)
otherwise win over author-level attribute rules at equal specificity.

**Files changed:** `styles.css` only. The JavaScript handlers (`onEligOver18Change`,
`onEligOver14Change`, `onEligResChange`, `nextFromEligibility`) were already correct — they set
and clear `element.hidden` on the right events. No JS changes were needed.

### Bug Fix: Progress Bar Covers Step Indicator Dots

**Root cause:** In CSS paint order, positioned elements with `z-index: auto` (step 6) render on top
of non-positioned block elements (step 3). The `.progress-bar` has `position: relative`, making it
positioned. The `.step-dots` div had no `position`, putting it in the non-positioned paint step.
Even though the dots appear later in the DOM, paint order is determined by position/z-index, not
DOM order, for mixed positioned/non-positioned siblings. The result: the fill bar painted on top of
and visually covered the step indicator dots.

**Fix:** Added `position: relative; z-index: 1;` to `.step-dots` in `styles.css`. With an explicit
positive z-index, the dots now paint in CSS step 7 (positive z-index), which is always after step 6
(z-index: auto), ensuring dots remain visible at every step on both the 7-step (new ID) and 4-step
(existing ID) paths.

**Files changed:** `styles.css` only.

---

## [0.2.0] - 2026-04-26 - Eligibility flow redesign, link fixes, documentation

### Eligibility Flow Redesign

Replaced the flat two-question eligibility panel (14+ yes/no + residency) with a
cascading three-question flow that correctly separates age thresholds and surfaces
a guardian notice for minors (ages 14–17).

**Before:**
- Q1: Are you 14 or older?
- Q2: Have you lived in Milwaukee 15+ days?
- Hidden sub-question (elig_under18): Are you under 18? — revealed by JS after Q1+Q2 both "yes"

**After:**
- Q1: Have you lived in Milwaukee 15+ days? (`elig_res`) — always visible
- Q2: Are you 18 or older? (`elig_over18`) — always visible
- Q3: Are you at least 14? (`elig_over14`) — revealed with animation only when Q2 = No

Guardian notice (parent/guardian must accompany) now shown in real time when Q3 = Yes.
Not-eligible message shown immediately when Q3 = No.

**Files changed:**
- `index.html` — eligibility section rewritten; `#under18-question-wrap` replaced with
  `#over14-question-wrap`; new radio groups `elig_over18` / `elig_over14`
- `wizard.js` — `nextFromEligibility()` rewritten; `showUnder18Question()` removed;
  three new live change handlers (`onEligResChange`, `onEligOver18Change`, `onEligOver14Change`);
  `resetEligibilityPanel()` and `startOver()` updated; state fields `eligOver18`/`eligOver14` added
- `styles.css` — added `#over14-question-wrap` reveal animation and `.elig-cascade` accent rule
- `translations.json` — added keys `el_over18_q` and `el_over14_q` in all five languages;
  updated `el_not_elig_age` text to specify "at least 14 years old"

### Link Fixes

Three URLs were broken (pointing to a decommissioned city domain):

| Location | Old URL | New URL |
|---|---|---|
| Footer "Need Help?" link (`index.html` + all lang `help_web_url`) | `https://www.milwaukee.gov/LicenseDivision/MunicipalID` | `https://city.milwaukee.gov/cityclerk/license/Municipal-Identification` |
| PDF download link – Visit step (`index.html`) | old path | `https://city.milwaukee.gov/ImageLibrary/Groups/ccLicenses/Applications/Muni_ID_Application_English.pdf` |
| PDF download link – Summary step (`index.html`) | old path | same as above |

**Files changed:** `index.html`, `translations.json` (all 5 languages, `help_web_url` key)

### Documentation Added

- Added file-purpose header comments to all four source files
  (`index.html`, `wizard.js`, `styles.css`, `translations.json`)
- Added `_meta` top-level key to `translations.json` explaining file structure
- Created `CHANGELOG.md` (this file)
- Created `README.md`

---

## [0.1.0] - 2026-04-26 - Initial multi-file build

- Full wizard with two paths: new ID (7 steps) and replacement/renewal (4 steps)
- Five languages: English, Spanish, Hmong, Burmese, Arabic (full RTL)
- Identity document checker (Option A / Option B validation)
- Residency document checker
- Printable personalized summary
- Persistent "Need Help?" footer
- WCAG 2.1 AA: progressbar, aria-live, role=alert, focus management
- `launch.sh` local HTTP server launcher
