/* ═══════════════════════════════════════════════════════════════
   Milwaukee Municipal ID Wizard – wizard.js
   ---------------------------------------------------------------
   All wizard logic: step navigation, eligibility validation,
   identity/residency doc checkers, i18n, summary generation,
   clickable progress bar, two-stage identity flow.

   Step sequences:
     Full path (new / lost-stolen-damaged / expired):
       language → scenario → eligibility → identity_a → [identity_b] → residency → visit → summary
       identity_b is included unless state.skipIdentityB === true
     Address Change path:
       language → scenario → confirm_id → residency → visit → summary
       If confirm_id = "no", redirect to full path via lost_stolen_damaged.

   Eligibility flow:
     Q1 – 15+ days Milwaukee residency (elig_res)
     Q2 – Age 18 or older (elig_over18)
     Q3 – Age 14+ (elig_over14), revealed only when Q2 = No
   Guardian notice shown when Q3 = Yes (applicant is 14–17).

   Privacy: zero data collection, storage, or transmission.
   All state lives in memory only; nothing persists on close.
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Step sequences ── */
  const FULL_STEPS_WITH_B    = ['language','scenario','eligibility','identity_a','identity_b','residency','visit','summary'];
  const FULL_STEPS_WITHOUT_B = ['language','scenario','eligibility','identity_a','residency','visit','summary'];
  const ADDRESS_STEPS        = ['language','scenario','confirm_id','residency','visit','summary'];

  /* ── Document groups ── */
  const PHOTO_AND_DOB = [
    'doc_passport','doc_dl','doc_state_id',
    'doc_green_card','doc_cid','doc_muni_id','doc_national_id'
  ];
  const PHOTO_ONLY = ['doc_foreign_dl','doc_foreign_mil','doc_student_id'];
  const DOB_ONLY   = ['doc_birth_cert','doc_ssn','doc_visa','doc_itin'];
  const RESIDENCY_DOCS = [
    'rdoc_utility','rdoc_property','rdoc_bank','rdoc_school',
    'rdoc_paystub','rdoc_jury','rdoc_insurance','rdoc_hospital',
    'rdoc_care','rdoc_gov','rdoc_college'
  ];

  /* ── Language-specific application PDF URLs ── */
  const PDF_URLS = {
    en:  'https://city.milwaukee.gov/ImageLibrary/Groups/ccLicenses/Applications/Muni_ID_Application_English.pdf',
    es:  'https://city.milwaukee.gov/ImageLibrary/Groups/ccClerk/LD/PDFs/Muni_ID_InfoSheet_w_Application_Spanish.pdf',
    hmn: 'https://city.milwaukee.gov/ImageLibrary/Groups/ccClerk/LD/PDFs/Muni_ID_InfoSheet_w_Application_Hmong.pdf',
    my:  'https://city.milwaukee.gov/ImageLibrary/Groups/ccLicenses/Applications/Muni_ID_Application_English.pdf',
    ar:  'https://city.milwaukee.gov/ImageLibrary/Groups/ccLicenses/Applications/Muni_ID_Application_English.pdf'
  };

  /* ── In-memory state (never persisted) ── */
  const DEFAULT_STATE = Object.freeze({
    lang:              'en',
    scenario:          null,
    subScenario:       null,
    confirmId:         null,
    eligRes:           null,
    eligOver18:        null,
    eligOver14:        null,
    under18:           null,
    skipIdentityB:     null,
    selectedPhotoAndDob: null,
    selectedPhotoOnly:   null,
    selectedDobOnly:     null,
    selectedResidency:   null,
    currentStep:       'language'
  });
  const state = Object.assign({}, DEFAULT_STATE);

  /* ── Translations ── */
  let T = {};

  function t(key) {
    return (T[state.lang] && T[state.lang][key] !== undefined)
      ? T[state.lang][key]
      : (T['en'] && T['en'][key] !== undefined ? T['en'][key] : key);
  }

  /* ── Step helpers ── */
  function getSteps() {
    if (state.scenario === 'already_have' && state.subScenario === 'address_change') {
      return ADDRESS_STEPS;
    }
    /* Full path: new ID, lost/stolen/damaged, expired */
    return (state.skipIdentityB === true) ? FULL_STEPS_WITHOUT_B : FULL_STEPS_WITH_B;
  }

  function currentIndex() {
    return getSteps().indexOf(state.currentStep);
  }

  function goToNextStepFrom(stepId) {
    const steps = getSteps();
    goToStep(steps[steps.indexOf(stepId) + 1]);
  }

  /* ══════════════════════════════════════════════
     NAVIGATION
  ══════════════════════════════════════════════ */
  function goToStep(stepId) {
    const cur = document.getElementById('step-' + state.currentStep);
    if (cur) cur.hidden = true;

    const next = document.getElementById('step-' + stepId);
    if (next) next.hidden = false;

    state.currentStep = stepId;

    prepareStep(stepId);
    updateProgress();
    applyTranslations();

    if (next) {
      const heading = next.querySelector('h1, h2, [id$="-heading"]');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }

    const container = document.getElementById('wizard-container');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    announceStep(stepId);
  }

  function prepareStep(stepId) {
    switch (stepId) {
      case 'identity_a':
        renderIdentityADocs();
        setFeedback('ida-feedback', null);
        break;
      case 'identity_b':
        renderIdentityBDocs();
        setFeedback('idb-feedback', null);
        hideIdbNonePanel();
        break;
      case 'residency':
        renderResidencyDocs();
        setFeedback('res-feedback', null);
        hideResNonePanel();
        break;
      case 'visit':
        updateVisitGuardianNotice();
        updateVisitFee();
        updateRecordsText();
        break;
      case 'summary':
        renderSummary();
        break;
    }
  }

  /* ── Next handlers ── */
  function handleNext() {
    switch (state.currentStep) {
      case 'scenario':    return nextFromScenario();
      case 'eligibility': return nextFromEligibility();
      case 'confirm_id':  return nextFromConfirmId();
      case 'identity_a':  return nextFromIdentityA();
      case 'identity_b':  return nextFromIdentityB();
      case 'residency':   return nextFromResidency();
      default:
        goToNextStepFrom(state.currentStep);
    }
  }

  function handleBack() {
    const steps = getSteps();
    const idx = steps.indexOf(state.currentStep);
    if (idx > 0) goToStep(steps[idx - 1]);
  }

  /* ── Scenario step ── */
  function nextFromScenario() {
    const scenarioRadio = document.querySelector('input[name="scenario"]:checked');
    if (!scenarioRadio) {
      showError('sc-error', t('sc_error'));
      return;
    }

    if (scenarioRadio.value === 'already_have') {
      const subRadio = document.querySelector('input[name="sub_scenario"]:checked');
      if (!subRadio) {
        showError('sc-error', t('sc_sub_error'));
        return;
      }
      state.subScenario = subRadio.value;
    }

    hideError('sc-error');
    state.scenario = scenarioRadio.value;

    /* Reset identity path state when scenario changes */
    state.skipIdentityB = null;

    goToNextStepFrom('scenario');
  }

  /* ── Eligibility step ── */
  function nextFromEligibility() {
    hideError('el-error');

    const resRadio = document.querySelector('input[name="elig_res"]:checked');
    if (!resRadio) {
      showError('el-error', t('el_answer_both'));
      return;
    }
    if (resRadio.value === 'no') {
      showNotEligible(t('el_not_elig_res'));
      return;
    }

    const over18Radio = document.querySelector('input[name="elig_over18"]:checked');
    if (!over18Radio) {
      showError('el-error', t('el_answer_both'));
      return;
    }

    if (over18Radio.value === 'yes') {
      state.eligRes    = 'yes';
      state.eligOver18 = 'yes';
      state.eligOver14 = null;
      state.under18    = false;
      hideNotEligible();
      goToNextStepFrom('eligibility');
      return;
    }

    const over14Wrap  = document.getElementById('over14-question-wrap');
    const over14Radio = document.querySelector('input[name="elig_over14"]:checked');
    if (!over14Radio) {
      if (over14Wrap) over14Wrap.hidden = false;
      showError('el-error', t('el_answer_both'));
      return;
    }

    if (over14Radio.value === 'no') {
      showNotEligible(t('el_not_elig_age'));
      return;
    }

    state.eligRes    = 'yes';
    state.eligOver18 = 'no';
    state.eligOver14 = 'yes';
    state.under18    = true;
    hideNotEligible();
    goToNextStepFrom('eligibility');
  }

  /* ── Confirm ID step (address change path) ── */
  function nextFromConfirmId() {
    const radio = document.querySelector('input[name="confirm_id"]:checked');
    if (!radio) {
      showError('ci-error', t('sc_error'));
      return;
    }
    hideError('ci-error');

    if (radio.value === 'yes') {
      state.confirmId = 'yes';
      goToNextStepFrom('confirm_id');
    } else {
      /* No old ID — switch to full lost/stolen/damaged path */
      state.subScenario = 'lost_stolen_damaged';
      state.confirmId = null;
      state.skipIdentityB = null;
      /* Clear radio so confirm_id step is clean if user navigates back here */
      document.querySelectorAll('input[name="confirm_id"]').forEach(r => { r.checked = false; });
      goToStep('eligibility');
    }
  }

  /* ── Identity A step ── */
  function nextFromIdentityA() {
    if (state.selectedPhotoAndDob) {
      state.skipIdentityB = true;
      setFeedback('ida-feedback', { success: true, text: t('id_option_a_success') });
    } else {
      state.skipIdentityB = false;
    }
    goToNextStepFrom('identity_a');
  }

  /* ── Identity B step ── */
  function nextFromIdentityB() {
    if (isIdbNone()) {
      setFeedback('idb-feedback', { success: false, text: t('id_none_selected') });
      return;
    }
    const result = validateIdentityBDocs();
    if (!result.valid) {
      setFeedback('idb-feedback', { success: false, text: t(result.msgKey) });
      return;
    }
    setFeedback('idb-feedback', { success: true, text: t(result.msgKey) });
    goToNextStepFrom('identity_b');
  }

  function isIdbNone() {
    return state.selectedPhotoOnly === '_none' || state.selectedDobOnly === '_none';
  }

  function validateIdentityBDocs() {
    const hasPhoto = state.selectedPhotoOnly !== null && state.selectedPhotoOnly !== '_none';
    const hasDob   = state.selectedDobOnly   !== null && state.selectedDobOnly   !== '_none';

    if (!hasPhoto && !hasDob) return { valid: false, msgKey: 'id_none_selected' };
    if (hasPhoto && hasDob)   return { valid: true,  msgKey: 'id_valid_b' };
    if (hasPhoto)             return { valid: false, msgKey: 'id_missing_dob' };
    return                           { valid: false, msgKey: 'id_missing_photo' };
  }

  /* ── Residency step ── */
  function nextFromResidency() {
    if (!state.selectedResidency || state.selectedResidency === '_none') {
      setFeedback('res-feedback', { success: false, text: t('res_none_error') });
      return;
    }
    setFeedback('res-feedback', null);
    goToNextStepFrom('residency');
  }

  function showNotEligible(reason) {
    const panel   = document.getElementById('not-eligible-panel');
    const text    = document.getElementById('not-elig-reason');
    const nextBtn = document.getElementById('el-next');
    if (text)    text.textContent  = reason;
    if (panel)   panel.hidden      = false;
    if (nextBtn) nextBtn.hidden    = true;
  }

  function hideNotEligible() {
    const panel   = document.getElementById('not-eligible-panel');
    const nextBtn = document.getElementById('el-next');
    if (panel)   panel.hidden   = true;
    if (nextBtn) nextBtn.hidden = false;
  }

  function showResNonePanel() {
    const panel    = document.getElementById('res-none-panel');
    const nextBtn  = document.getElementById('res-next');
    const callHelp = document.getElementById('res-call-help-p');
    if (panel)    panel.hidden    = false;
    if (nextBtn)  nextBtn.hidden  = true;
    if (callHelp) callHelp.hidden = true;
    setFeedback('res-feedback', null);
  }

  function hideResNonePanel() {
    const panel    = document.getElementById('res-none-panel');
    const nextBtn  = document.getElementById('res-next');
    const callHelp = document.getElementById('res-call-help-p');
    if (panel)    panel.hidden    = true;
    if (nextBtn)  nextBtn.hidden  = false;
    if (callHelp) callHelp.hidden = false;
  }

  function showIdbNonePanel() {
    const panel    = document.getElementById('idb-none-panel');
    const nextBtn  = document.getElementById('idb-next');
    const callHelp = document.getElementById('idb-call-help-p');
    if (panel)    panel.hidden    = false;
    if (nextBtn)  nextBtn.hidden  = true;
    if (callHelp) callHelp.hidden = true;
    setFeedback('idb-feedback', null);
  }

  function hideIdbNonePanel() {
    const panel    = document.getElementById('idb-none-panel');
    const nextBtn  = document.getElementById('idb-next');
    const callHelp = document.getElementById('idb-call-help-p');
    if (panel)    panel.hidden    = true;
    if (nextBtn)  nextBtn.hidden  = false;
    if (callHelp) callHelp.hidden = false;
  }

  /* ══════════════════════════════════════════════
     DOCUMENT RENDERING
  ══════════════════════════════════════════════ */

  function docRadio(docId, selected, groupName) {
    return `
    <div class="radio-item">
      <input
        type="radio"
        id="radio-${esc(docId)}"
        name="${esc(groupName)}"
        value="${esc(docId)}"
        class="doc-radio"
        ${selected ? 'checked' : ''}
      >
      <label for="radio-${esc(docId)}">${esc(t(docId))}</label>
    </div>`;
  }

  /* Identity Step A — Option A docs only */
  function renderIdentityADocs() {
    const container = document.getElementById('identity-a-docs-container');
    if (!container) return;

    container.innerHTML = `
      <fieldset class="doc-group doc-group-both">
        <legend>
          <span class="group-name">${esc(t('id_group_both_h'))}</span>
          <span class="group-note">${esc(t('id_group_both_note'))}</span>
        </legend>
        ${PHOTO_AND_DOB.map(id => docRadio(id, state.selectedPhotoAndDob === id, 'identity_a_doc')).join('')}
        <div class="radio-item radio-item-none">
          <input
            type="radio"
            id="radio-none-option-a"
            name="identity_a_doc"
            value="_none"
            class="doc-radio"
            ${state.selectedPhotoAndDob === null && state.skipIdentityB === false ? 'checked' : ''}
          >
          <label for="radio-none-option-a">${esc(t('id_no_option_a'))}</label>
        </div>
      </fieldset>`;

    container.querySelectorAll('.doc-radio').forEach(radio => {
      radio.addEventListener('change', onIdentityARadioChange);
    });

    if (state.selectedPhotoAndDob) {
      setFeedback('ida-feedback', { success: true, text: t('id_option_a_success') });
    }
  }

  /* Identity Step B — Option B docs only (photo-only + DOB-only) */
  function renderIdentityBDocs() {
    const container = document.getElementById('identity-b-docs-container');
    if (!container) return;

    state.selectedPhotoAndDob = null;

    container.innerHTML = `
      <fieldset class="doc-group doc-group-option-b">
        <legend>
          <span class="group-name">${esc(t('id_group_photo_h'))}</span>
        </legend>
        ${PHOTO_ONLY.map(id => docRadio(id, state.selectedPhotoOnly === id, 'identity_b_photo')).join('')}
        <div class="radio-item radio-item-none">
          <input
            type="radio"
            id="radio-none-identity-b"
            name="identity_b_photo"
            value="_none"
            class="doc-radio"
            ${state.selectedPhotoOnly === '_none' ? 'checked' : ''}
          >
          <label for="radio-none-identity-b">${esc(t('idb_no_docs'))}</label>
        </div>
      </fieldset>

      <fieldset class="doc-group doc-group-dob">
        <legend>
          <span class="group-name">${esc(t('id_group_dob_h'))}</span>
        </legend>
        ${DOB_ONLY.map(id => docRadio(id, state.selectedDobOnly === id, 'identity_b_dob')).join('')}
        <div class="radio-item radio-item-none">
          <input
            type="radio"
            id="radio-none-identity-b-dob"
            name="identity_b_dob"
            value="_none"
            class="doc-radio"
            ${state.selectedDobOnly === '_none' ? 'checked' : ''}
          >
          <label for="radio-none-identity-b-dob">${esc(t('idb_no_docs'))}</label>
        </div>
      </fieldset>`;

    container.querySelectorAll('.doc-radio').forEach(radio => {
      radio.addEventListener('change', onIdentityBRadioChange);
    });

    if (isIdbNone()) {
      showIdbNonePanel();
    } else {
      const result = validateIdentityBDocs();
      if (result.valid) {
        setFeedback('idb-feedback', { success: true, text: t(result.msgKey) });
      }
    }
  }

  function renderResidencyDocs() {
    const container = document.getElementById('residency-docs-container');
    if (!container) return;

    container.innerHTML = `
      <fieldset class="doc-group doc-group-res">
        <legend>
          <span class="group-name">${esc(t('res_heading'))}</span>
        </legend>
        ${RESIDENCY_DOCS.map(id => docRadio(id, state.selectedResidency === id, 'residency_doc')).join('')}
        <div class="radio-item radio-item-none">
          <input
            type="radio"
            id="radio-none-residency"
            name="residency_doc"
            value="_none"
            class="doc-radio"
            ${state.selectedResidency === '_none' ? 'checked' : ''}
          >
          <label for="radio-none-residency">${esc(t('res_no_docs'))}</label>
        </div>
      </fieldset>`;

    container.querySelectorAll('.doc-radio').forEach(radio => {
      radio.addEventListener('change', onResidencyRadioChange);
    });

    if (state.selectedResidency === '_none') {
      showResNonePanel();
    } else if (state.selectedResidency) {
      setFeedback('res-feedback', { success: true, text: t('res_valid') });
    }
  }

  /* Live change handler for identity_a radios */
  function onIdentityARadioChange(e) {
    const value = e.target.value;
    if (value === '_none') {
      state.selectedPhotoAndDob = null;
      setFeedback('ida-feedback', null);
    } else {
      state.selectedPhotoAndDob = value;
      setFeedback('ida-feedback', { success: true, text: t('id_option_a_success') });
    }
  }

  /* Live change handler for identity_b radios */
  function onIdentityBRadioChange(e) {
    const { value, name } = e.target;

    if (name === 'identity_b_photo') {
      state.selectedPhotoOnly = value;
    } else if (name === 'identity_b_dob') {
      state.selectedDobOnly = value;
    }

    if (isIdbNone()) {
      showIdbNonePanel();
      return;
    }

    hideIdbNonePanel();

    const result = validateIdentityBDocs();
    if (result.valid) {
      setFeedback('idb-feedback', { success: true, text: t(result.msgKey) });
    } else {
      const fb = document.getElementById('idb-feedback');
      if (fb && !fb.hidden) {
        setFeedback('idb-feedback', { success: false, text: t(result.msgKey) });
      }
    }
  }

  /* Live change handler for residency radios */
  function onResidencyRadioChange(e) {
    state.selectedResidency = e.target.value;
    if (e.target.value === '_none') {
      showResNonePanel();
    } else {
      hideResNonePanel();
      setFeedback('res-feedback', { success: true, text: t('res_valid') });
    }
  }

  /* ══════════════════════════════════════════════
     SUMMARY GENERATION
  ══════════════════════════════════════════════ */
  function saveAsPdf() {
    document.body.classList.add('pdf-save-mode');
    const cleanup = () => document.body.classList.remove('pdf-save-mode');
    window.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(cleanup, 3000);
    window.print();
  }

  function renderSummary() {
    const container = document.getElementById('summary-content');
    if (!container) return;

    const needsFullPath = isFullPath();
    const nodes = [];

    function makeSection(headingKey) {
      const sec = document.createElement('div');
      sec.className = 'summary-section';
      const h3 = document.createElement('h3');
      h3.className = 'summary-section-heading';
      h3.textContent = t(headingKey);
      sec.appendChild(h3);
      return sec;
    }

    /* 1 – Situation */
    const secSit = makeSection('su_situation_h');
    const pSit = document.createElement('p');
    pSit.className = 'summary-situation-value';
    pSit.textContent = t(situationKey());
    secSit.appendChild(pSit);
    nodes.push(secSit);

    /* 2 – Documents to bring */
    const idDocIds = needsFullPath
      ? [state.selectedPhotoAndDob, state.selectedPhotoOnly, state.selectedDobOnly].filter(Boolean)
      : [];
    const resDocIds = state.selectedResidency ? [state.selectedResidency] : [];

    if (idDocIds.length || resDocIds.length) {
      const secDocs = makeSection('su_docs_h');

      if (idDocIds.length) {
        const pId = document.createElement('p');
        pId.className = 'docs-sub-heading';
        pId.textContent = t('su_identity_h');
        secDocs.appendChild(pId);
        const ulId = document.createElement('ul');
        ulId.className = 'summary-list';
        idDocIds.forEach(id => {
          const li = document.createElement('li');
          li.className = 'summary-doc-item';
          li.textContent = t(id);
          ulId.appendChild(li);
        });
        secDocs.appendChild(ulId);
      }

      if (resDocIds.length) {
        const pRes = document.createElement('p');
        pRes.className = 'docs-sub-heading';
        if (idDocIds.length) pRes.style.marginTop = 'var(--space-4)';
        pRes.textContent = t('su_residency_h');
        secDocs.appendChild(pRes);
        const ulRes = document.createElement('ul');
        ulRes.className = 'summary-list';
        resDocIds.forEach(id => {
          const li = document.createElement('li');
          li.className = 'summary-doc-item';
          li.textContent = t(id);
          ulRes.appendChild(li);
        });
        secDocs.appendChild(ulRes);
      }

      nodes.push(secDocs);
    }

    /* 3 – Reminders */
    const secRem = makeSection('su_reminders_h');
    const ulRem = document.createElement('ul');
    ulRem.className = 'summary-list';
    const addReminder = key => {
      const li = document.createElement('li');
      li.className = 'summary-reminder-item';
      li.textContent = t(key);
      ulRem.appendChild(li);
    };
    addReminder('su_rem_originals');
    addReminder('su_rem_fee');
    if (needsFullPath) addReminder('su_rem_60days');
    if (state.scenario === 'already_have' && state.subScenario === 'address_change') {
      addReminder('su_rem_bring_old_id');
    }
    if (state.under18 === true) addReminder('su_rem_guardian');
    secRem.appendChild(ulRem);
    nodes.push(secRem);

    container.replaceChildren(...nodes);
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
      address_change:    'su_sc_address',
      lost_stolen_damaged: 'su_sc_lost_damaged',
      expired:           'su_sc_expired'
    };
    return map[state.subScenario] || 'su_sc_new';
  }

  /* ══════════════════════════════════════════════
     PROGRESS BAR
  ══════════════════════════════════════════════ */
  function updateProgress() {
    const nav = document.getElementById('progress-nav');
    if (!nav) return;

    if (state.currentStep === 'language') {
      nav.hidden = true;
      return;
    }
    nav.hidden = false;

    const steps = getSteps();
    const idx   = currentIndex();
    const total = steps.length;

    /* ARIA progressbar */
    const bar = document.getElementById('progress-bar');
    if (bar) {
      bar.setAttribute('aria-valuenow', idx + 1);
      bar.setAttribute('aria-valuemin', 1);
      bar.setAttribute('aria-valuemax', total);
      bar.setAttribute('aria-label', t('step_indicator').replace('{n}', idx + 1).replace('{total}', total));
    }

    /* Fill width */
    const fill = document.getElementById('progress-fill');
    if (fill) {
      const pct = total <= 1 ? 100 : Math.round((idx / (total - 1)) * 100);
      fill.style.width = Math.max(pct, 4) + '%';
    }

    /* Step dots — clickable for completed steps */
    const dotsEl = document.getElementById('step-dots');
    if (dotsEl) {
      dotsEl.innerHTML = steps.map((stepId, i) => {
        if (i < idx) {
          /* Completed — clickable */
          const label = esc(t('prog_' + stepId));
          return `<span
            class="step-dot done step-dot-clickable"
            role="button"
            tabindex="0"
            data-step="${esc(stepId)}"
            aria-label="${label}"
            title="${label}"
          ></span>`;
        } else if (i === idx) {
          return `<span class="step-dot current" aria-current="step"></span>`;
        } else {
          return `<span class="step-dot"></span>`;
        }
      }).join('');

      /* Bind click/keyboard on clickable dots */
      dotsEl.querySelectorAll('.step-dot-clickable').forEach(dot => {
        bindClickAndKey(dot, () => goToStep(dot.dataset.step));
      });
    }

    /* Step labels — clickable for completed steps */
    const labelsEl = document.getElementById('step-labels');
    if (labelsEl) {
      labelsEl.innerHTML = steps.map((stepId, i) => {
        if (i < idx) {
          const label = esc(t('prog_' + stepId));
          return `<li
            class="step-label-item done step-label-clickable"
            role="button"
            tabindex="0"
            data-step="${esc(stepId)}"
            aria-label="${label}"
            title="${label}"
          >${label}</li>`;
        } else if (i === idx) {
          return `<li class="step-label-item current" aria-current="step">${esc(t('prog_' + stepId))}</li>`;
        } else {
          return `<li class="step-label-item">${esc(t('prog_' + stepId))}</li>`;
        }
      }).join('');

      labelsEl.querySelectorAll('.step-label-clickable').forEach(lbl => {
        bindClickAndKey(lbl, () => goToStep(lbl.dataset.step));
      });
    }

    /* Counter */
    const counter = document.getElementById('step-counter');
    if (counter) {
      counter.textContent = t('step_indicator').replace('{n}', idx + 1).replace('{total}', total);
    }
  }

  /* ══════════════════════════════════════════════
     INTERNATIONALISATION
  ══════════════════════════════════════════════ */
  function applyTranslations() {
    document.documentElement.lang = state.lang;

    const container = document.getElementById('wizard-container');
    if (container) {
      container.dir = (state.lang === 'ar') ? 'rtl' : 'ltr';
    }

    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });

    /* Translate aria-labels that are keyed via data-i18n-aria-label */
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
      const key = el.dataset.i18nAriaLabel;
      el.setAttribute('aria-label', t(key) + ' (opens in new tab)');
    });

    document.title = t('wizard_title');

    /* Re-render doc lists on language change */
    if (state.currentStep === 'identity_a')  renderIdentityADocs();
    if (state.currentStep === 'identity_b')  renderIdentityBDocs();
    if (state.currentStep === 'residency')   renderResidencyDocs();
    if (state.currentStep === 'summary')     renderSummary();

    /* Under-18 notice text */
    const u18Notice = document.getElementById('under18-notice');
    if (u18Notice && !u18Notice.hidden) {
      const span = u18Notice.querySelector('[data-i18n="el_under18"]');
      if (span) span.textContent = t('el_under18');
    }

    /* Records toggle label sync */
    const toggle = document.getElementById('records-toggle');
    if (toggle) {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      const span = toggle.querySelector('[data-i18n]');
      if (span) {
        span.dataset.i18n = expanded ? 'vi_show_less' : 'vi_learn_more';
        span.textContent  = expanded ? t('vi_show_less') : t('vi_learn_more');
      }
    }

    updatePdfLinks();
    updateProgress();
  }

  function updatePdfLinks() {
    const url = PDF_URLS[state.lang] || PDF_URLS['en'];
    document.querySelectorAll('[data-pdf-link]').forEach(a => { a.href = url; });
    const showNotice = PDF_URLS[state.lang] === PDF_URLS['en'] && state.lang !== 'en';
    ['pdf-english-notice-visit', 'pdf-english-notice-summary'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.hidden = !showNotice;
    });
  }

  /* ══════════════════════════════════════════════
     VISIT STEP HELPERS
  ══════════════════════════════════════════════ */
  function updateVisitGuardianNotice() {
    const notice = document.getElementById('vi-guardian-notice');
    if (!notice) return;
    notice.hidden = !(state.under18 === true);
    if (!notice.hidden) {
      const span = notice.querySelector('[data-i18n="vi_guardian"]');
      if (span) span.textContent = t('vi_guardian');
    }
  }

  /* Show replacement fee text for existing-ID paths */
  function updateVisitFee() {
    const feeEl = document.getElementById('vi-fee-display');
    if (!feeEl) return;
    if (state.scenario === 'already_have') {
      feeEl.dataset.i18n = 'vi_fee_replacement';
      feeEl.textContent = t('vi_fee_replacement');
    } else {
      feeEl.dataset.i18n = 'vi_fee';
      feeEl.textContent = t('vi_fee');
    }
  }

  function updateRecordsText() {
    const toggle = document.getElementById('records-toggle');
    if (toggle) {
      const span = toggle.querySelector('[data-i18n]');
      if (span) span.textContent = t('vi_learn_more');
      toggle.setAttribute('aria-expanded', 'false');
    }
    const detail = document.getElementById('records-detail');
    if (detail) detail.hidden = true;
  }

  /* ══════════════════════════════════════════════
     SCREEN READER ANNOUNCEMENTS
  ══════════════════════════════════════════════ */
  function announceStep(stepId) {
    const region = document.getElementById('sr-announce');
    if (!region) return;
    const steps = getSteps();
    const idx   = steps.indexOf(stepId);
    const msg   = t('step_indicator').replace('{n}', idx + 1).replace('{total}', steps.length)
                + ' - ' + t('prog_' + stepId);
    region.textContent = '';
    requestAnimationFrame(() => { region.textContent = msg; });
  }

  /* ══════════════════════════════════════════════
     START OVER
  ══════════════════════════════════════════════ */
  function startOver() {
    document.querySelectorAll('.step').forEach(el => { el.hidden = true; });
    Object.assign(state, DEFAULT_STATE);

    document.querySelectorAll('input[type="radio"], input[type="checkbox"]')
      .forEach(el => { el.checked = false; });

    const subPanel = document.getElementById('sub-scenario-panel');
    if (subPanel) subPanel.hidden = true;

    hideError('sc-error');
    hideError('el-error');
    hideError('ci-error');
    hideNotEligible();

    const over14Wrap = document.getElementById('over14-question-wrap');
    if (over14Wrap) over14Wrap.hidden = true;

    const u18Notice = document.getElementById('under18-notice');
    if (u18Notice) u18Notice.hidden = true;

    setFeedback('ida-feedback', null);
    setFeedback('idb-feedback', null);
    setFeedback('res-feedback', null);

    updateRecordsText();

    goToStep('language');
  }

  /* ══════════════════════════════════════════════
     UI UTILITIES
  ══════════════════════════════════════════════ */
  function showError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
  }

  function hideError(id) {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  }

  function setFeedback(id, opt) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!opt) { el.hidden = true; return; }
    el.hidden    = false;
    el.className = 'doc-feedback ' + (opt.success ? 'feedback-success' : 'feedback-error');
    el.setAttribute('role', opt.success ? 'status' : 'alert');
    el.textContent = opt.text;
  }

  function esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function bindClickAndKey(el, fn) {
    el.addEventListener('click', fn);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn.call(this, e); }
    });
  }

  /* ══════════════════════════════════════════════
     EVENT BINDING
  ══════════════════════════════════════════════ */
  function bindEvents() {

    /* Language buttons */
    document.querySelectorAll('.lang-btn').forEach(btn => {
      bindClickAndKey(btn, () => {
        state.lang = btn.dataset.lang;
        applyTranslations();
        goToStep('scenario');
      });
    });

    /* Scenario radios: show/hide sub-panel */
    document.querySelectorAll('input[name="scenario"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const subPanel = document.getElementById('sub-scenario-panel');
        if (subPanel) {
          subPanel.hidden = (radio.value !== 'already_have');
          if (radio.value === 'new') {
            document.querySelectorAll('input[name="sub_scenario"]')
              .forEach(r => { r.checked = false; });
          }
        }
        hideError('sc-error');
      });
    });

    /* Eligibility radios */
    document.querySelectorAll('input[name="elig_res"]').forEach(r => {
      r.addEventListener('change', onEligResChange);
    });
    document.querySelectorAll('input[name="elig_over18"]').forEach(r => {
      r.addEventListener('change', onEligOver18Change);
    });
    document.querySelectorAll('input[name="elig_over14"]').forEach(r => {
      r.addEventListener('change', onEligOver14Change);
    });

    /* Nav buttons */
    function on(id, fn) {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    }

    on('sc-next',        handleNext);
    on('sc-back',        handleBack);
    on('el-next',        handleNext);
    on('el-back',        handleBack);
    on('ci-next',        handleNext);
    on('ci-back',        handleBack);
    on('ida-next',       handleNext);
    on('ida-back',       handleBack);
    on('idb-next',       handleNext);
    on('idb-back',       handleBack);
    on('res-next',       handleNext);
    on('res-back',       handleBack);
    on('vi-next',        handleNext);
    on('vi-back',        handleBack);
    on('su-back',        handleBack);
    on('su-start-over',  startOver);
    on('btn-print',      () => window.print());
    on('btn-save',       saveAsPdf);

    /* Public records accordion */
    on('records-toggle', () => {
      const toggle  = document.getElementById('records-toggle');
      const detail  = document.getElementById('records-detail');
      if (!toggle || !detail) return;

      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      detail.hidden = expanded;

      const span = toggle.querySelector('[data-i18n]');
      if (span) {
        span.dataset.i18n = !expanded ? 'vi_show_less' : 'vi_learn_more';
        span.textContent  = !expanded ? t('vi_show_less') : t('vi_learn_more');
      }
    });
  }

  /* ── Live eligibility handlers ── */
  function onEligResChange() {
    hideError('el-error');
    const val = document.querySelector('input[name="elig_res"]:checked');
    if (val && val.value === 'no') showNotEligible(t('el_not_elig_res'));
    else hideNotEligible();
  }

  function onEligOver18Change() {
    hideError('el-error');
    const val        = document.querySelector('input[name="elig_over18"]:checked');
    const over14Wrap = document.getElementById('over14-question-wrap');
    const u18Notice  = document.getElementById('under18-notice');

    if (!val) return;

    if (val.value === 'yes') {
      if (over14Wrap) over14Wrap.hidden = true;
      document.querySelectorAll('input[name="elig_over14"]').forEach(r => { r.checked = false; });
      if (u18Notice) u18Notice.hidden = true;
      hideNotEligible();
    } else {
      if (over14Wrap) {
        over14Wrap.hidden = false;
        const legend = over14Wrap.querySelector('legend');
        if (legend) { legend.setAttribute('tabindex', '-1'); legend.focus(); }
      }
      if (u18Notice) u18Notice.hidden = true;
      hideNotEligible();
    }
  }

  function onEligOver14Change() {
    hideError('el-error');
    const val       = document.querySelector('input[name="elig_over14"]:checked');
    const u18Notice = document.getElementById('under18-notice');

    if (!val) return;

    if (val.value === 'yes') {
      hideNotEligible();
      if (u18Notice) {
        u18Notice.hidden = false;
        const span = u18Notice.querySelector('[data-i18n="el_under18"]');
        if (span) span.textContent = t('el_under18');
      }
    } else {
      if (u18Notice) u18Notice.hidden = true;
      showNotEligible(t('el_not_elig_age'));
    }
  }

  /* ══════════════════════════════════════════════
     INITIALISATION
  ══════════════════════════════════════════════ */
  async function loadTranslations() {
    try {
      const res = await fetch('translations.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      T = await res.json();
    } catch (err) {
      console.warn('Milwaukee ID Wizard: could not load translations.json —', err.message);
      T = {};
    }
  }

  async function init() {
    await loadTranslations();
    bindEvents();
    applyTranslations();
    updateProgress();

    document.querySelectorAll('.step').forEach(s => {
      s.hidden = (s.id !== 'step-language');
    });
    const langStep = document.getElementById('step-language');
    if (langStep) langStep.hidden = false;

    const langHeading = document.getElementById('lang-heading');
    if (langHeading) {
      langHeading.setAttribute('tabindex', '-1');
      langHeading.focus();
    }
  }

  document.addEventListener('DOMContentLoaded', init);

})();
