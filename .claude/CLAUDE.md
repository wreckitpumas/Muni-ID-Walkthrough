# Milwaukee Municipal ID Wizard

## Project Overview

Static web wizard for the City of Milwaukee License Division. Guides residents through obtaining, replacing, or renewing a Municipal ID. Five languages, full RTL support for Arabic, WCAG 2.1 AA accessibility, zero data collection.

No framework, no build step, no server-side code.

## Files

| File | Purpose |
|---|---|
| `index.html` | All HTML markup; step sections with `id="step-{name}"` |
| `wizard.js` | All logic (IIFE): navigation, validation, i18n, summary, progress bar |
| `styles.css` | All styling: Milwaukee branding, responsive, RTL, print |
| `translations.json` | All UI strings in 5 languages, keyed by language code (en/es/hmn/my/ar) |
| `tests.js` | 34 Node.js unit tests for pure functions + translation completeness |
| `dom-tests.html` | Browser DOM simulation tests (11 paths, CSS checks, edge cases) |
| `launch.sh` | Local HTTP server launcher |
| `CHANGELOG.md` | Reverse-chronological change history |
| `README.md` | Project documentation |

## Automatic Actions

**After every change, always do both of these without being asked:**

1. Run `node tests.js` and verify all 34 tests pass. If any fail, fix them before finishing.
2. Add a dated entry to the top of CHANGELOG.md (below the `# Changelog` header) with: a short title, what changed, why, and which files were modified. Follow the existing entry format.

## Guardrails

- Edit existing files freely.
- **Ask before creating any new file.** The production deliverable is four files (index.html, wizard.js, styles.css, translations.json) and that should rarely change.
- Never delete translation keys from translations.json. Other files reference them by name.
- Never remove the `[hidden] { display: none !important; }` rule from styles.css.

## Coding Rules

- No frameworks or external dependencies. Plain HTML, CSS, vanilla JS only.
- No em dashes anywhere (code, comments, strings, translations). Use hyphens.
- No data persistence. No cookies, localStorage, sessionStorage, network writes. All state lives in the `state` object in memory.
- All UI text goes through the i18n system: `data-i18n` attributes in HTML or `t('key')` calls in JS.
- New translation keys must be added to ALL five languages: en, es, hmn, my, ar.
- Use CSS custom properties for colors and spacing. Never hardcode hex values outside `:root`.
- `esc()` is required for any string interpolated into HTML via innerHTML.
- New interactive elements need: keyboard support (Enter/Space handlers), ARIA attributes, visible focus indicators.

## Architecture

### Step Sequences

Determined dynamically by `getSteps()` based on `state.scenario`, `state.subScenario`, and `state.skipIdentityB`:

```js
FULL_STEPS_WITH_B    = ['language','scenario','eligibility','identity_a','identity_b','residency','visit','summary']  // 8 steps
FULL_STEPS_WITHOUT_B = ['language','scenario','eligibility','identity_a','residency','visit','summary']               // 7 steps
ADDRESS_STEPS        = ['language','scenario','confirm_id','residency','visit','summary']                              // 6 steps
```

- New ID, lost/stolen/damaged, expired: full path (7 or 8 steps depending on Option A selection)
- Address change with old ID: ADDRESS_STEPS
- Address change without old ID: redirected to full path via lost_stolen_damaged

### State Object

All fields inside the IIFE. Reset by `startOver()`.

```
lang              - 'en' | 'es' | 'hmn' | 'my' | 'ar'
scenario          - 'new' | 'already_have' | null
subScenario       - 'address_change' | 'lost_stolen_damaged' | 'expired' | null
confirmId         - 'yes' | null
eligRes           - 'yes' | 'no' | null
eligOver18        - 'yes' | 'no' | null
eligOver14        - 'yes' | 'no' | null
under18           - true | false | null
skipIdentityB     - true (Option A satisfied) | false (needs Stage 2) | null
selectedPhotoAndDob - doc ID string | null
selectedPhotoOnly   - doc ID string | null
selectedDobOnly     - doc ID string | null
selectedResidency   - doc ID string | null
currentStep       - step ID string
```

### Key Functions

| Function | Returns / Does |
|---|---|
| `getSteps()` | Step ID array for current scenario |
| `isFullPath()` | true for new / lost-stolen-damaged / expired |
| `situationKey()` | Translation key: su_sc_new, su_sc_address, su_sc_lost_damaged, su_sc_expired |
| `validateIdentityBDocs()` | `{ valid: bool, msgKey: string }` |
| `goToStep(stepId)` | Hides current step, shows target, calls prepareStep, updateProgress, applyTranslations, manages focus |
| `handleNext()` | Dispatches to step-specific next handler |
| `handleBack()` | Goes to previous step in current sequence |
| `renderSummary()` | Builds checklist using DOM API (createElement/textContent, no innerHTML) |
| `renderIdentityADocs()` | Renders Option A doc radios using innerHTML + esc() |
| `renderIdentityBDocs()` | Renders Option B doc radios (photo-only + DOB-only) using innerHTML + esc() |
| `renderResidencyDocs()` | Renders residency doc radios using innerHTML + esc() |
| `applyTranslations()` | Sets all data-i18n text, re-renders dynamic sections, updates PDF links |
| `updateProgress()` | Redraws progress dots/labels/fill using innerHTML + esc(), binds click/keyboard on completed steps |
| `startOver()` | Resets all state, clears all inputs, returns to language step |
| `bindEvents()` | Wires up all event handlers (called once on init) |

### Document Groups

```js
PHOTO_AND_DOB = ['doc_passport','doc_dl','doc_state_id','doc_green_card','doc_cid','doc_muni_id','doc_national_id']
PHOTO_ONLY    = ['doc_foreign_dl','doc_foreign_mil','doc_student_id']
DOB_ONLY      = ['doc_birth_cert','doc_ssn','doc_visa','doc_itin']
RESIDENCY_DOCS = ['rdoc_utility','rdoc_property','rdoc_bank','rdoc_school','rdoc_paystub','rdoc_jury','rdoc_insurance','rdoc_hospital','rdoc_care','rdoc_gov','rdoc_college']
```

### Translation Key Prefixes

| Prefix | Domain | Examples |
|---|---|---|
| `sc_` | Scenario step | sc_heading, sc_new_title, sc_error |
| `el_` | Eligibility | el_heading, el_res_q, el_over18_q, el_under18 |
| `id_` | Identity steps | id_heading, id_instruction, id_option_a_success |
| `res_` | Residency | res_heading, res_sub, res_valid |
| `vi_` | Visit | vi_heading, vi_fee, vi_fee_replacement |
| `su_` | Summary | su_heading, su_docs_h, su_rem_fee |
| `prog_` | Progress bar labels | prog_language, prog_scenario, prog_eligibility |
| `btn_` | Buttons | btn_next, btn_back, btn_start_over |
| `doc_` | Identity doc names | doc_passport, doc_dl, doc_birth_cert |
| `rdoc_` | Residency doc names | rdoc_utility, rdoc_bank, rdoc_school |

### HTML Element ID Patterns

- Step sections: `step-{stepId}`
- Headings: `{prefix}-heading` (sc-heading, el-heading, etc.)
- Error divs: `{prefix}-error` (sc-error, el-error, ci-error)
- Next buttons: `{prefix}-next`
- Back buttons: `{prefix}-back`
- Doc containers: `identity-a-docs-container`, `identity-b-docs-container`, `residency-docs-container`
- Feedback banners: `ida-feedback`, `idb-feedback`, `res-feedback`

### CSS Architecture

- Custom properties in `:root` for all colors, spacing, radii, shadows, typography
- Brand: Main Blue #1B365D, Bright Blue #0076BE, Gold #F9B421, Red #B52B31, Green #43B02A
- Font: Montserrat from Google Fonts, fallback chain includes Myanmar and Arabic script fonts
- RTL: `[dir="rtl"]` selectors throughout styles.css
- Print: `@media print` block hides nav, styles summary for paper
- `[hidden] { display: none !important; }` in reset section prevents CSS display rules from overriding the HTML hidden attribute

### Test Coverage (tests.js)

| Tests | What they cover |
|---|---|
| 1-8 | getSteps() for all scenario/skipIdentityB combinations |
| 9-12 | isFullPath() |
| 13-16 | situationKey() |
| 17-22 | validateIdentityBDocs() |
| 23-29 | Step adjacency (ordering within sequences) |
| 30 | prog_ keys exist in all 5 languages |
| 31 | situationKey() return values exist in all 5 languages |
| 32 | Feature-set-2 keys exist in all 5 languages |
| 33 | Every English key exists in all other languages |
| Audit | Every data-i18n key in index.html exists in all 5 languages |

## Common Pitfalls

1. **[hidden] vs CSS display** - Any CSS rule setting `display` on an element overrides the browser's `[hidden]` behavior. The global `!important` override prevents this, but be careful with new display rules on elements that toggle `hidden`.

2. **Dynamic step sequences** - Never hardcode step counts. Always use `getSteps()` to find the next/previous step.

3. **Option A skips Stage 2** - Selecting an Option A doc sets `skipIdentityB = true`. The progress bar switches from 8 to 7 steps. Going back from residency returns to identity_a, not identity_b.

4. **Address change redirect** - "No" on confirm_id changes `subScenario` to `'lost_stolen_damaged'`, clears the confirm_id radios, and jumps to eligibility. The user is now on the full path.

5. **Dynamic event listeners** - Document radios are created by renderIdentityADocs/B/Residency using innerHTML. Event listeners are bound immediately after rendering inside those same functions. Adding listeners in bindEvents() would not work because the elements don't exist yet at init time.

6. **innerHTML vs DOM API** - renderSummary() uses DOM API only. The three doc rendering functions and updateProgress() use innerHTML with esc(). Don't mix patterns within a single function.

7. **PDF fallback** - Burmese and Arabic use the English PDF. updatePdfLinks() shows a notice element when this happens.

8. **Eligibility cascade** - Q3 (age 14+) is only revealed when Q2 (age 18+) is answered "No". The guardian notice appears when Q3 is "Yes". Not-eligible appears when Q3 is "No". All three handlers (onEligResChange, onEligOver18Change, onEligOver14Change) manage visibility and clear downstream state.
