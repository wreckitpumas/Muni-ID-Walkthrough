/* ═══════════════════════════════════════════════════════════════
   Milwaukee Municipal ID Wizard – tests.js
   ---------------------------------------------------------------
   Node.js unit tests for pure logic functions and translation
   completeness. Run with: node tests.js
   (No browser required — tests pure functions and JSON data only.)
═══════════════════════════════════════════════════════════════ */

'use strict';

const fs   = require('fs');
const path = require('path');

/* ── Step sequences (copied from wizard.js) ── */
const FULL_STEPS_WITH_B    = ['language','scenario','eligibility','identity_a','identity_b','residency','visit','summary'];
const FULL_STEPS_WITHOUT_B = ['language','scenario','eligibility','identity_a','residency','visit','summary'];
const ADDRESS_STEPS        = ['language','scenario','confirm_id','residency','visit','summary'];

/* ── Mock state ── */
let state = {};

function resetState(overrides) {
  state = {
    lang:                'en',
    scenario:            null,
    subScenario:         null,
    confirmId:           null,
    skipIdentityB:       null,
    selectedPhotoAndDob: null,
    selectedPhotoOnly:   null,
    selectedDobOnly:     null,
    selectedResidency:   null,
    ...overrides
  };
}

/* ── Pure functions (copied from wizard.js) ── */
function getSteps() {
  if (state.scenario === 'already_have' && state.subScenario === 'address_change') {
    return ADDRESS_STEPS;
  }
  return (state.skipIdentityB === true) ? FULL_STEPS_WITHOUT_B : FULL_STEPS_WITH_B;
}

function isFullPath() {
  if (state.scenario === 'new') return true;
  if (state.scenario === 'already_have') {
    return state.subScenario === 'lost_stolen_damaged' || state.subScenario === 'expired';
  }
  return false;
}

function situationKey() {
  if (state.scenario === 'new') return 'su_sc_new';
  const map = {
    address_change:      'su_sc_address',
    lost_stolen_damaged: 'su_sc_lost_damaged',
    expired:             'su_sc_expired'
  };
  return map[state.subScenario] || 'su_sc_new';
}

function validateIdentityBDocs() {
  const hasPhoto = state.selectedPhotoOnly !== null;
  const hasDob   = state.selectedDobOnly !== null;

  if (!hasPhoto && !hasDob) return { valid: false, msgKey: 'id_none_selected' };
  if (hasPhoto && hasDob)   return { valid: true,  msgKey: 'id_valid_b' };
  if (hasPhoto)             return { valid: false, msgKey: 'id_missing_dob' };
  return                           { valid: false, msgKey: 'id_missing_photo' };
}

/* ── Test runner ── */
let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, name, detail) {
  const label = detail ? `${name} (${detail})` : name;
  if (condition) {
    passed++;
    console.log(`  ✓  ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.log(`  ✗  ${label}`);
  }
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/* ══════════════════════════════════════════════
   getSteps()
══════════════════════════════════════════════ */
console.log('\n=== getSteps() ===');

resetState({ scenario: 'new', skipIdentityB: null });
assert(deepEqual(getSteps(), FULL_STEPS_WITH_B), 'Test 1: scenario=new, skipIdentityB=null → FULL_STEPS_WITH_B');

resetState({ scenario: 'new', skipIdentityB: true });
assert(deepEqual(getSteps(), FULL_STEPS_WITHOUT_B), 'Test 2: scenario=new, skipIdentityB=true → FULL_STEPS_WITHOUT_B');

resetState({ scenario: 'new', skipIdentityB: false });
assert(deepEqual(getSteps(), FULL_STEPS_WITH_B), 'Test 3: scenario=new, skipIdentityB=false → FULL_STEPS_WITH_B');

resetState({ scenario: 'already_have', subScenario: 'address_change', skipIdentityB: null });
assert(deepEqual(getSteps(), ADDRESS_STEPS), 'Test 4: already_have/address_change → ADDRESS_STEPS');

resetState({ scenario: 'already_have', subScenario: 'lost_stolen_damaged', skipIdentityB: null });
assert(deepEqual(getSteps(), FULL_STEPS_WITH_B), 'Test 5: already_have/lost_stolen_damaged, skipIdentityB=null → FULL_WITH_B');

resetState({ scenario: 'already_have', subScenario: 'lost_stolen_damaged', skipIdentityB: true });
assert(deepEqual(getSteps(), FULL_STEPS_WITHOUT_B), 'Test 6: already_have/lost_stolen_damaged, skipIdentityB=true → FULL_WITHOUT_B');

resetState({ scenario: 'already_have', subScenario: 'expired', skipIdentityB: null });
assert(deepEqual(getSteps(), FULL_STEPS_WITH_B), 'Test 7: already_have/expired, skipIdentityB=null → FULL_WITH_B');

resetState({ scenario: 'already_have', subScenario: 'expired', skipIdentityB: true });
assert(deepEqual(getSteps(), FULL_STEPS_WITHOUT_B), 'Test 8: already_have/expired, skipIdentityB=true → FULL_WITHOUT_B');

/* ══════════════════════════════════════════════
   isFullPath()
══════════════════════════════════════════════ */
console.log('\n=== isFullPath() ===');

resetState({ scenario: 'new' });
assert(isFullPath() === true, 'Test 9: scenario=new → true');

resetState({ scenario: 'already_have', subScenario: 'address_change' });
assert(isFullPath() === false, 'Test 10: already_have/address_change → false');

resetState({ scenario: 'already_have', subScenario: 'lost_stolen_damaged' });
assert(isFullPath() === true, 'Test 11: already_have/lost_stolen_damaged → true');

resetState({ scenario: 'already_have', subScenario: 'expired' });
assert(isFullPath() === true, 'Test 12: already_have/expired → true');

/* ══════════════════════════════════════════════
   situationKey()
══════════════════════════════════════════════ */
console.log('\n=== situationKey() ===');

resetState({ scenario: 'new' });
assert(situationKey() === 'su_sc_new', 'Test 13: scenario=new → su_sc_new');

resetState({ scenario: 'already_have', subScenario: 'address_change' });
assert(situationKey() === 'su_sc_address', 'Test 14: address_change → su_sc_address');

resetState({ scenario: 'already_have', subScenario: 'lost_stolen_damaged' });
assert(situationKey() === 'su_sc_lost_damaged', 'Test 15: lost_stolen_damaged → su_sc_lost_damaged');

resetState({ scenario: 'already_have', subScenario: 'expired' });
assert(situationKey() === 'su_sc_expired', 'Test 16: expired → su_sc_expired');

/* ══════════════════════════════════════════════
   validateIdentityBDocs()
══════════════════════════════════════════════ */
console.log('\n=== validateIdentityBDocs() ===');

resetState({});
assert(deepEqual(validateIdentityBDocs(), { valid: false, msgKey: 'id_none_selected' }),
  'Test 17: no docs → { valid: false, id_none_selected }');

resetState({ selectedPhotoOnly: 'doc_student_id', selectedPhotoAndDob: 'doc_passport' });
assert(deepEqual(validateIdentityBDocs(), { valid: false, msgKey: 'id_missing_dob' }),
  'Test 18: photoOnly + photoAndDob (photoAndDob ignored) → { valid: false, id_missing_dob }');

resetState({ selectedPhotoOnly: 'doc_student_id' });
assert(deepEqual(validateIdentityBDocs(), { valid: false, msgKey: 'id_missing_dob' }),
  'Test 19: photoOnly only → { valid: false, id_missing_dob }');

resetState({ selectedDobOnly: 'doc_birth_cert' });
assert(deepEqual(validateIdentityBDocs(), { valid: false, msgKey: 'id_missing_photo' }),
  'Test 20: dobOnly only → { valid: false, id_missing_photo }');

resetState({ selectedPhotoOnly: 'doc_student_id', selectedDobOnly: 'doc_birth_cert' });
assert(deepEqual(validateIdentityBDocs(), { valid: true, msgKey: 'id_valid_b' }),
  'Test 21: photoOnly + dobOnly → { valid: true, id_valid_b }');

resetState({ selectedPhotoAndDob: 'doc_passport' });
assert(deepEqual(validateIdentityBDocs(), { valid: false, msgKey: 'id_none_selected' }),
  'Test 22: photoAndDob-only (Stage 2 never shows them) → { valid: false, id_none_selected }');

/* ══════════════════════════════════════════════
   Step adjacency
══════════════════════════════════════════════ */
console.log('\n=== Step adjacency ===');

assert(FULL_STEPS_WITH_B[FULL_STEPS_WITH_B.indexOf('eligibility') + 1] === 'identity_a',
  'Test 23: FULL_WITH_B: after eligibility → identity_a');

assert(FULL_STEPS_WITH_B[FULL_STEPS_WITH_B.indexOf('identity_a') + 1] === 'identity_b',
  'Test 24: FULL_WITH_B: after identity_a → identity_b');

assert(FULL_STEPS_WITH_B[FULL_STEPS_WITH_B.indexOf('identity_b') + 1] === 'residency',
  'Test 25: FULL_WITH_B: after identity_b → residency');

assert(FULL_STEPS_WITHOUT_B[FULL_STEPS_WITHOUT_B.indexOf('identity_a') + 1] === 'residency',
  'Test 26: FULL_WITHOUT_B: after identity_a → residency');

assert(ADDRESS_STEPS[ADDRESS_STEPS.indexOf('confirm_id') + 1] === 'residency',
  'Test 27: ADDRESS_STEPS: after confirm_id → residency');

assert(ADDRESS_STEPS[ADDRESS_STEPS.indexOf('residency') + 1] === 'visit',
  'Test 28: ADDRESS_STEPS: after residency → visit');

const allSeqs = [FULL_STEPS_WITH_B, FULL_STEPS_WITHOUT_B, ADDRESS_STEPS];
assert(
  allSeqs.every(s => s[0] === 'language' && s[s.length - 1] === 'summary'),
  'Test 29: all sequences start with language, end with summary'
);

/* ══════════════════════════════════════════════
   Translation key completeness
══════════════════════════════════════════════ */
console.log('\n=== Translation key completeness ===');

const T = JSON.parse(fs.readFileSync(path.join(__dirname, 'translations.json'), 'utf8'));
const LANGS = ['en', 'es', 'hmn', 'my', 'ar'];

/* Test 30: prog_ key for every step ID in every sequence, in all 5 languages */
const allStepIds = [...new Set([...FULL_STEPS_WITH_B, ...FULL_STEPS_WITHOUT_B, ...ADDRESS_STEPS])];
const t30missing = [];
for (const stepId of allStepIds) {
  const key = 'prog_' + stepId;
  for (const lang of LANGS) {
    if (!T[lang] || !(key in T[lang])) t30missing.push(`${lang}.${key}`);
  }
}
assert(t30missing.length === 0, 'Test 30: all prog_ keys in all 5 languages',
  t30missing.length ? 'missing: ' + t30missing.join(', ') : undefined);

/* Test 31: all situationKey() return values exist in all 5 languages */
const sitKeys = ['su_sc_new', 'su_sc_address', 'su_sc_lost_damaged', 'su_sc_expired'];
const t31missing = [];
for (const key of sitKeys) {
  for (const lang of LANGS) {
    if (!T[lang] || !(key in T[lang])) t31missing.push(`${lang}.${key}`);
  }
}
assert(t31missing.length === 0, 'Test 31: all situationKey() return values in all 5 languages',
  t31missing.length ? 'missing: ' + t31missing.join(', ') : undefined);

/* Test 32: all new keys from feature set 2 exist in all 5 languages */
const newKeys = [
  'sc_lost_damaged', 'su_sc_lost_damaged', 'confirm_id_q', 'confirm_id_heading',
  'prog_confirm_id', 'prog_identity_a', 'prog_identity_b', 'id_one_doc_reminder',
  'id_option_a_success', 'id_no_option_a', 'id_heading_b', 'id_two_doc_reminder',
  'res_valid', 'res_one_doc_reminder', 'vi_fee_replacement', 'vi_get_directions'
];
const t32missing = [];
for (const key of newKeys) {
  for (const lang of LANGS) {
    if (!T[lang] || !(key in T[lang])) t32missing.push(`${lang}.${key}`);
  }
}
assert(t32missing.length === 0, 'Test 32: all new feature-set-2 keys in all 5 languages',
  t32missing.length ? 'missing: ' + t32missing.join(', ') : undefined);

/* Test 33: every English key exists in every other language */
const enKeys = Object.keys(T.en);
const t33missing = {};
for (const lang of LANGS) {
  if (lang === 'en') continue;
  const miss = enKeys.filter(k => !T[lang] || !(k in T[lang]));
  if (miss.length) t33missing[lang] = miss;
}
assert(Object.keys(t33missing).length === 0, 'Test 33: all English keys exist in all other languages',
  Object.keys(t33missing).length ? JSON.stringify(t33missing) : undefined);

/* ── Translation identity scan (warnings only, no hard failure) ── */
console.log('\n=== Translation identity scan (warnings) ===');
const SKIP_IDENTITY_KEYS = new Set([
  'vi_records_detail','help_phone','vi_location_addr','vi_location_name',
  'help_web_url','help_web_display','doc_visa','doc_cid','doc_muni_id',
  'step_indicator' /* has {n} placeholders, may match */
]);
let warnCount = 0;
for (const lang of LANGS) {
  if (lang === 'en') continue;
  for (const key of enKeys) {
    if (SKIP_IDENTITY_KEYS.has(key)) continue;
    if (T[lang] && T[lang][key] === T.en[key]) {
      console.log(`  WARN: ${lang}.${key} identical to English: "${T.en[key]}"`);
      warnCount++;
    }
  }
}
if (warnCount === 0) console.log('  (no unexpected identical values found)');

/* ── data-i18n key audit (verify all HTML keys exist in translations) ── */
console.log('\n=== HTML data-i18n key audit ===');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const htmlKeys = [...new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map(m => m[1]))];
const htmlMissing = [];
for (const key of htmlKeys) {
  for (const lang of LANGS) {
    if (!T[lang] || !(key in T[lang])) {
      htmlMissing.push(`${lang}.${key}`);
    }
  }
}
assert(htmlMissing.length === 0, 'HTML data-i18n audit: all keys in all 5 languages',
  htmlMissing.length ? 'missing: ' + htmlMissing.join(', ') : undefined);

/* ── Summary ── */
const total = passed + failed;
console.log(`\n${'─'.repeat(50)}`);
console.log(`${total} tests: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.log('\nFailed:');
  failures.forEach(f => console.log(`  ✗  ${f}`));
}
process.exit(failed > 0 ? 1 : 0);
