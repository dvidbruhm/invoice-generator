# UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce repetition and improve the invoice form UX with preset chips, collapsed template/color, smart pre-fill, and autosave.

**Architecture:** Four independent features added to the existing vanilla JS SPA. All data stored in the existing `settings` table as JSONB. No new backend endpoints or schema changes.

**Tech Stack:** Vanilla JS (no build step), Express/PostgreSQL backend, existing CSS custom properties for theming.

**Spec:** `docs/superpowers/specs/2026-05-31-ux-improvements-design.md`

---

## File Map

| File | Changes |
|---|---|
| `js/templates.js` | Add `lineItemPresets: []` to defaults |
| `js/utils.js` | Add `parsePaymentTerms()` function |
| `js/components/form.js` | Preset chips bar, collapsed template/color, "Reuse last invoice", autosave |
| `js/components/settings.js` | New "Line Item Presets" collapsible section |
| `css/styles.css` | Preset chips, collapsed template row, autosave indicator, popover styles |

---

### Task 1: Add `lineItemPresets` to default settings

**Files:**
- Modify: `js/templates.js:130-171` (the `getDefaultSettings()` function)

- [ ] **Step 1: Add the new default setting**

Add `lineItemPresets: []` to the return object in `getDefaultSettings()`, after the `defaultClient: null` line (line 163):

```js
    defaultClient: null,
    lineItemPresets: [],
```

- [ ] **Step 2: Commit**

```bash
git add js/templates.js
git commit -m "feat: add lineItemPresets to default settings"
```

---

### Task 2: Add `parsePaymentTerms()` utility function

**Files:**
- Modify: `js/utils.js` (append after line 213, before end of file)

- [ ] **Step 1: Add the function**

Add at the end of `js/utils.js`:

```js
function parsePaymentTerms(terms) {
  if (!terms) return 30;
  var lower = terms.toLowerCase().trim();
  if (lower === 'due on receipt' || lower === 'due upon receipt' || lower === 'cod') return 0;
  var match = lower.match(/net\s+(\d+)/);
  if (match) return parseInt(match[1], 10);
  var numMatch = lower.match(/(\d+)/);
  if (numMatch) return parseInt(numMatch[1], 10);
  return 30;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/utils.js
git commit -m "feat: add parsePaymentTerms utility function"
```

---

### Task 3: Use smart due date in invoice form

**Files:**
- Modify: `js/components/form.js:39-40` (due date calculation in `renderInvoiceForm`)

- [ ] **Step 1: Replace hardcoded 30-day due date**

In `js/components/form.js`, find this line (around line 40):

```js
    const dueDate = getLocalDateString(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
```

Replace with:

```js
    const dueDate = editId ? getLocalDateString(new Date(Date.now() + parsePaymentTerms(mergedSettings.paymentTerms) * 24 * 60 * 60 * 1000)) : getLocalDateString(new Date(Date.now() + parsePaymentTerms(mergedSettings.paymentTerms) * 24 * 60 * 60 * 1000));
```

Actually this simplifies — both branches are the same. Replace with:

```js
    const dueDate = getLocalDateString(new Date(Date.now() + parsePaymentTerms(mergedSettings.paymentTerms) * 24 * 60 * 60 * 1000));
```

- [ ] **Step 2: Commit**

```bash
git add js/components/form.js
git commit -m "feat: calculate due date from payment terms setting"
```

---

### Task 4: Add preset chips bar to the invoice form

**Files:**
- Modify: `js/components/form.js` (the `renderInvoiceForm` function, around line 116-136 — the Line Items card)

- [ ] **Step 1: Add preset chips HTML above the line items table**

In `renderInvoiceForm()`, find the Line Items card that starts with:

```html
          <div class="card">
            <div class="card-title">Line Items</div>
```

Replace the `<div class="card-title">Line Items</div>` line with:

```html
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div class="card-title" style="margin-bottom:0;">Line Items</div>
              <a href="#/settings" class="preset-manage-link" onclick="document.getElementById('clients-card').open=true;">Manage Presets</a>
            </div>
```

Then add the preset chips bar immediately after the closing `</div>` of the header row and before `<div class="table-wrapper">`. Insert before the `<div class="table-wrapper">` line:

```html
            ${mergedSettings.lineItemPresets && mergedSettings.lineItemPresets.length > 0 ? `
            <div class="preset-chips">
              ${mergedSettings.lineItemPresets.map(p => `
                <button type="button" class="preset-chip" data-preset-id="${escapeHTML(p.id)}" onclick="addPresetLineItem('${escapeHTML(p.id)}')" title="${escapeHTML(p.description || p.name)} &mdash; ${formatCurrency(p.rate, mergedSettings.currency)}/hr">+ ${escapeHTML(p.name)} &mdash; ${formatCurrency(p.rate, mergedSettings.currency)}/hr</button>
              `).join('')}
              <button type="button" class="preset-chip preset-chip-add" onclick="showInlinePresetForm()">+ Add preset...</button>
            </div>
            ` : ''}
```

- [ ] **Step 2: Add `addPresetLineItem()` function**

Add this function in `js/components/form.js` (after the `addLineItem` function, around line 359):

```js
function addPresetLineItem(presetId) {
  var presets = (formCachedSettings && formCachedSettings.lineItemPresets) || [];
  var preset = presets.find(function(p) { return p.id === presetId; });
  if (!preset) return;

  var tbody = document.getElementById('line-items-body');
  var settings = formCachedSettings || getDefaultSettings();
  var currencySymbol = getCurrencySymbol(settings.currency);
  var inputRows = tbody.querySelectorAll('tr.item-row-inputs');
  var index = inputRows.length;
  var lastInputRow = inputRows[inputRows.length - 1];
  var defaultDate = lastInputRow
    ? getNextWeekday(lastInputRow.querySelector('.item-date') ? lastInputRow.querySelector('.item-date').value : '')
    : (document.getElementById('invoice-date') ? document.getElementById('invoice-date').value : getLocalDateString());

  var rate = preset.rate || '';
  var hours = preset.hours || '';
  var amount = (parseFloat(rate) || 0) * (parseFloat(hours) || 0);

  var inputRow = document.createElement('tr');
  inputRow.dataset.itemIndex = index;
  inputRow.className = 'item-row-inputs';
  inputRow.innerHTML =
    '<td rowspan="2"><input type="date" class="item-date" value="' + escapeHTML(defaultDate) + '"></td>' +
    '<td><div style="position:relative;">' +
    '<span style="position:absolute;left:0.5rem;top:50%;transform:translateY(-50%);color:var(--text-secondary);font-size:0.8125rem;pointer-events:none;">' + currencySymbol + '</span>' +
    '<input type="number" class="item-rate" value="' + escapeHTML(String(rate)) + '" placeholder="0.00" step="0.01" min="0" required style="padding-left:1.5rem;">' +
    '</div></td>' +
    '<td><input type="number" class="item-hours" value="' + escapeHTML(String(hours)) + '" placeholder="0" step="0.5" min="0" required></td>' +
    '<td class="amount-cell">' + formatCurrency(amount, settings.currency) + '</td>' +
    '<td rowspan="2">' +
    '<div style="display:flex;gap:0.25rem;justify-content:flex-end;">' +
    '<button type="button" class="reorder-btn reorder-up" onclick="moveLineItem(this, -1)" title="Move up" aria-label="Move item up">&#8593;</button>' +
    '<button type="button" class="reorder-btn reorder-down" onclick="moveLineItem(this, 1)" title="Move down" aria-label="Move item down">&#8595;</button>' +
    '<button type="button" class="remove-btn" onclick="removeLineItem(this)" aria-label="Remove item">&times;</button>' +
    '</div></td>';

  var descRow = document.createElement('tr');
  descRow.dataset.itemIndex = index;
  descRow.className = 'item-row-desc';
  descRow.innerHTML = '<td colspan="3"><textarea class="item-description" placeholder="Description of work" required rows="1">' + escapeHTML(preset.description || '') + '</textarea></td>';

  tbody.appendChild(inputRow);
  tbody.appendChild(descRow);
  updateReorderButtonsState();
  updateTotals();

  var hoursInput = descRow.previousElementSibling.querySelector('.item-hours');
  if (hoursInput && !hours) hoursInput.focus();
}
```

- [ ] **Step 3: Add `showInlinePresetForm()` function**

Add after `addPresetLineItem`:

```js
function showInlinePresetForm() {
  var existing = document.getElementById('inline-preset-form');
  if (existing) { existing.focus(); return; }

  var container = document.createElement('div');
  container.id = 'inline-preset-form';
  container.className = 'inline-preset-form';
  container.innerHTML =
    '<div class="inline-preset-form-row">' +
    '<input type="text" id="inline-preset-name" placeholder="Name (e.g. Dev)" required>' +
    '<input type="text" id="inline-preset-desc" placeholder="Description">' +
    '<div style="position:relative;">' +
    '<span style="position:absolute;left:0.5rem;top:50%;transform:translateY(-50%);color:var(--text-secondary);font-size:0.8125rem;pointer-events:none;">$</span>' +
    '<input type="number" id="inline-preset-rate" placeholder="Rate" step="0.01" min="0" required style="padding-left:1.25rem;">' +
    '</div>' +
    '<input type="number" id="inline-preset-hours" placeholder="Hrs (opt)" step="0.5" min="0">' +
    '<button type="button" class="btn btn-primary btn-sm" onclick="saveInlinePreset()">Save</button>' +
    '<button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById(\'inline-preset-form\').remove()">Cancel</button>' +
    '</div>';

  var chipsBar = document.querySelector('.preset-chips');
  if (chipsBar) {
    chipsBar.after(container);
  }
  document.getElementById('inline-preset-name').focus();
}
```

- [ ] **Step 4: Add `saveInlinePreset()` function**

```js
async function saveInlinePreset() {
  var name = document.getElementById('inline-preset-name').value.trim();
  var desc = document.getElementById('inline-preset-desc').value.trim();
  var rate = document.getElementById('inline-preset-rate').value;
  var hours = document.getElementById('inline-preset-hours').value;

  if (!name || !rate) {
    showToast('Name and rate are required.', 'error');
    return;
  }

  var presets = (formCachedSettings && formCachedSettings.lineItemPresets) || [];
  var newPreset = {
    id: 'p' + Date.now(),
    name: name,
    description: desc,
    rate: parseFloat(rate),
    hours: hours ? parseFloat(hours) : undefined
  };
  presets.push(newPreset);

  if (formCachedSettings) formCachedSettings.lineItemPresets = presets;
  await saveSetting('lineItemPresets', presets);

  var form = document.getElementById('inline-preset-form');
  if (form) form.remove();
  showToast('Preset "' + escapeHTML(name) + '" saved!', 'success');

  addPresetLineItem(newPreset.id);

  updatePresetChips();
}
```

- [ ] **Step 5: Add `updatePresetChips()` function**

```js
function updatePresetChips() {
  var settings = formCachedSettings || getDefaultSettings();
  var presets = settings.lineItemPresets || [];
  var chipsBar = document.querySelector('.preset-chips');
  if (!chipsBar) return;

  chipsBar.innerHTML = presets.map(function(p) {
    return '<button type="button" class="preset-chip" data-preset-id="' + escapeHTML(p.id) + '" onclick="addPresetLineItem(\'' + escapeHTML(p.id) + '\')" title="' + escapeHTML(p.description || p.name) + ' &mdash; ' + formatCurrency(p.rate, settings.currency) + '/hr">+ ' + escapeHTML(p.name) + ' &mdash; ' + formatCurrency(p.rate, settings.currency) + '/hr</button>';
  }).join('') + '<button type="button" class="preset-chip preset-chip-add" onclick="showInlinePresetForm()">+ Add preset...</button>';
}
```

- [ ] **Step 6: Commit**

```bash
git add js/components/form.js
git commit -m "feat: add preset chips bar to invoice form"
```

---

### Task 5: Add preset chips CSS styles

**Files:**
- Modify: `css/styles.css` (append new styles)

- [ ] **Step 1: Add preset chip styles**

Append to `css/styles.css`:

```css
.preset-manage-link {
  font-size: 0.7rem;
  color: var(--accent);
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
}
.preset-manage-link:hover {
  text-decoration: underline;
}
.preset-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: var(--surface);
  border-radius: 6px;
  border: 1px solid var(--border);
}
.preset-chip {
  display: inline-flex;
  align-items: center;
  background: var(--accent-light);
  color: var(--accent);
  border: 1px solid var(--accent-med, rgba(37,99,235,0.2));
  border-radius: 20px;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--transition), box-shadow var(--transition);
}
.preset-chip:hover {
  background: var(--accent-med, rgba(37,99,235,0.15));
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.preset-chip-add {
  background: var(--bg);
  color: var(--text-secondary);
  border: 1px dashed var(--border);
}
.preset-chip-add:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-light);
}
.inline-preset-form {
  margin-bottom: 0.75rem;
  padding: 0.625rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
}
.inline-preset-form-row {
  display: flex;
  gap: 0.375rem;
  align-items: center;
  flex-wrap: wrap;
}
.inline-preset-form-row input {
  flex: 1;
  min-width: 80px;
  padding: 0.375rem 0.5rem;
  font-size: 0.8125rem;
  font-family: inherit;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
}
.inline-preset-form-row input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-light);
}
```

- [ ] **Step 2: Commit**

```bash
git add css/styles.css
git commit -m "feat: add preset chips CSS styles"
```

---

### Task 6: Add preset management to Settings page

**Files:**
- Modify: `js/components/settings.js` (add new collapsible section, CRUD functions)

- [ ] **Step 1: Add the "Line Item Presets" collapsible section to the settings form**

In `renderSettings()`, find the first `<details>` element (the Client Management card, around line 17). Insert a new `<details>` block immediately **before** the "Your Information" `<details>` (around line 34):

```html
      <details class="card collapsible" open>
        <summary class="card-title collapsible-toggle">Line Item Presets</summary>
        <div class="collapsible-content">
          <p style="font-size:0.8125rem;color:var(--text-secondary);margin-bottom:1rem;">Save frequently used line items for quick access when creating invoices.</p>
          <div id="presets-list"></div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="openPresetEditor()" style="margin-top:1rem;">+ Add Preset</button>
        </div>
      </details>
```

- [ ] **Step 2: Add preset list rendering function**

Add these functions to `js/components/settings.js`:

```js
function renderPresetsList(presets) {
  var listEl = document.getElementById('presets-list');
  if (!listEl) return;
  var settings = formCachedSettings || getDefaultSettings();

  if (!presets || presets.length === 0) {
    listEl.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:1rem;">No presets yet. Add your first preset to get started!</div>';
    return;
  }

  listEl.innerHTML = '<div class="presets-grid">' + presets.map(function(p, i) {
    return '<div class="preset-card" data-preset-id="' + escapeHTML(p.id) + '">' +
      '<div class="preset-card-header">' +
      '<strong>' + escapeHTML(p.name) + '</strong>' +
      '<span style="color:var(--text-secondary);font-size:0.875rem;margin-left:0.5rem;">' + formatCurrency(p.rate, settings.currency) + '/hr</span>' +
      '</div>' +
      (p.description ? '<div style="font-size:0.8125rem;color:var(--text-secondary);">' + escapeHTML(p.description) + '</div>' : '') +
      (p.hours ? '<div style="font-size:0.75rem;color:var(--text-secondary);">Default hours: ' + escapeHTML(String(p.hours)) + '</div>' : '') +
      '<div class="preset-card-actions">' +
      '<button type="button" class="btn btn-secondary btn-sm" onclick="openPresetEditor(\'' + escapeHTML(p.id) + '\')">Edit</button>' +
      (i > 0 ? '<button type="button" class="btn btn-secondary btn-sm" onclick="movePreset(\'' + escapeHTML(p.id) + '\', -1)">&uarr;</button>' : '') +
      (i < presets.length - 1 ? '<button type="button" class="btn btn-secondary btn-sm" onclick="movePreset(\'' + escapeHTML(p.id) + '\', 1)">&darr;</button>' : '') +
      '<button type="button" class="btn btn-danger btn-sm" onclick="deletePreset(\'' + escapeHTML(p.id) + '\')">Delete</button>' +
      '</div></div>';
  }).join('') + '</div>';
}
```

- [ ] **Step 3: Add preset editor modal**

```js
function openPresetEditor(presetId) {
  var presets = formCachedSettings.lineItemPresets || [];
  var preset = presetId ? presets.find(function(p) { return p.id === presetId; }) : null;

  var overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.id = 'preset-editor-overlay';
  overlay.innerHTML =
    '<div class="client-modal">' +
    '<h3 style="font-size:1.125rem;font-weight:600;margin-bottom:0.5rem;">' + (presetId ? 'Edit Preset' : 'Add New Preset') + '</h3>' +
    '<form id="preset-form">' +
    '<div class="form-group">' +
    '<label for="preset-name-input">Name *</label>' +
    '<input type="text" id="preset-name-input" required placeholder="e.g. Software Dev">' +
    '</div>' +
    '<div class="form-group">' +
    '<label for="preset-desc-input">Description</label>' +
    '<input type="text" id="preset-desc-input" placeholder="e.g. Software development services">' +
    '</div>' +
    '<div class="form-grid">' +
    '<div class="form-group">' +
    '<label for="preset-rate-input">Rate *</label>' +
    '<input type="number" id="preset-rate-input" required placeholder="85" step="0.01" min="0">' +
    '</div>' +
    '<div class="form-group">' +
    '<label for="preset-hours-input">Default Hours</label>' +
    '<input type="number" id="preset-hours-input" placeholder="8" step="0.5" min="0">' +
    '</div>' +
    '</div>' +
    '<div class="confirm-actions" style="margin-top:1.25rem;">' +
    '<button type="button" class="btn btn-secondary" id="preset-cancel-btn">Cancel</button>' +
    '<button type="submit" class="btn btn-primary">' + (presetId ? 'Update' : 'Add') + ' Preset</button>' +
    '</div>' +
    '</form></div>';

  document.body.appendChild(overlay);

  if (preset) {
    document.getElementById('preset-name-input').value = preset.name || '';
    document.getElementById('preset-desc-input').value = preset.description || '';
    document.getElementById('preset-rate-input').value = preset.rate || '';
    document.getElementById('preset-hours-input').value = preset.hours || '';
  }

  var form = overlay.querySelector('#preset-form');
  var cancelBtn = overlay.querySelector('#preset-cancel-btn');
  cancelBtn.addEventListener('click', function() { overlay.remove(); });
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    var name = document.getElementById('preset-name-input').value.trim();
    var desc = document.getElementById('preset-desc-input').value.trim();
    var rate = parseFloat(document.getElementById('preset-rate-input').value);
    var hours = document.getElementById('preset-hours-input').value ? parseFloat(document.getElementById('preset-hours-input').value) : undefined;

    if (!name || isNaN(rate)) {
      showToast('Name and rate are required.', 'error');
      return;
    }

    var presets = formCachedSettings.lineItemPresets || [];
    if (presetId) {
      var idx = presets.findIndex(function(p) { return p.id === presetId; });
      if (idx >= 0) {
        presets[idx] = { id: presetId, name: name, description: desc, rate: rate, hours: hours };
      }
    } else {
      presets.push({ id: 'p' + Date.now(), name: name, description: desc, rate: rate, hours: hours });
    }

    try {
      await saveSetting('lineItemPresets', presets);
      formCachedSettings.lineItemPresets = presets;
      showToast(presetId ? 'Preset updated!' : 'Preset added!', 'success');
      overlay.remove();
      renderPresetsList(presets);
    } catch (err) {
      showToast('Error saving preset.', 'error');
    }
  });
}
```

- [ ] **Step 4: Add `movePreset()` and `deletePreset()` functions**

```js
async function movePreset(presetId, direction) {
  var presets = formCachedSettings.lineItemPresets || [];
  var idx = presets.findIndex(function(p) { return p.id === presetId; });
  if (idx < 0) return;
  var newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= presets.length) return;
  var temp = presets[newIdx];
  presets[newIdx] = presets[idx];
  presets[idx] = temp;
  try {
    await saveSetting('lineItemPresets', presets);
    formCachedSettings.lineItemPresets = presets;
    renderPresetsList(presets);
  } catch (err) {
    showToast('Error reordering preset.', 'error');
  }
}

async function deletePreset(presetId) {
  showConfirmModal('Delete this preset? This action cannot be undone.', async function() {
    var presets = formCachedSettings.lineItemPresets || [];
    presets = presets.filter(function(p) { return p.id !== presetId; });
    try {
      await saveSetting('lineItemPresets', presets);
      formCachedSettings.lineItemPresets = presets;
      showToast('Preset deleted.', 'success');
      renderPresetsList(presets);
    } catch (err) {
      showToast('Error deleting preset.', 'error');
    }
  });
}
```

- [ ] **Step 5: Call `renderPresetsList()` from `renderSettings()`**

In `renderSettings()`, find the line `loadClients(merged);` (around line 334). Add after it:

```js
    formCachedSettings = merged;
    renderPresetsList(merged.lineItemPresets || []);
```

Note: `formCachedSettings` is defined in `form.js` as a global variable. The settings page needs access to it. If `formCachedSettings` is not set when entering settings, initialize it with the merged settings. Add this line **before** `renderPresetsList`:

```js
    if (!formCachedSettings) formCachedSettings = merged;
```

- [ ] **Step 6: Add preset-card CSS (reuses existing client-card pattern)**

Append to `css/styles.css`:

```css
.presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 0.75rem;
}
.preset-card {
  padding: 0.75rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.preset-card-header {
  margin-bottom: 0.25rem;
}
.preset-card-actions {
  display: flex;
  gap: 0.375rem;
  margin-top: 0.5rem;
}
```

- [ ] **Step 7: Commit**

```bash
git add js/components/settings.js css/styles.css
git commit -m "feat: add Line Item Presets management to Settings"
```

---

### Task 7: Collapse the Template & Color picker in the invoice form

**Files:**
- Modify: `js/components/form.js` (replace the Template & Color card, around lines 143-170)
- Modify: `css/styles.css` (add collapsed row and popover styles)

- [ ] **Step 1: Replace the Template & Color card with a collapsed row**

In `renderInvoiceForm()`, find the Template & Color card block starting with:

```html
          <div class="card">
            <div class="card-title">Template & Color</div>
            <div class="template-grid" id="form-template-grid">
```

Replace the entire card (from `<div class="card">` to its closing `</div>`, which ends just before the Notes & Terms card) with:

```html
          <div class="card">
            <div class="card-title">Template & Color</div>
            <div class="template-collapsed" id="template-collapsed" onclick="toggleTemplatePopover()">
              <div class="template-collapsed-thumb" id="template-collapsed-thumb">
                ${getTemplatePreviewHTML(invoice?.template || mergedSettings.template, invoice?.accentColor || mergedSettings.accentColor)}
              </div>
              <div class="template-collapsed-info">
                <div class="template-collapsed-name" id="template-collapsed-name">${escapeHTML(TEMPLATES.find(t => t.id === (invoice?.template || mergedSettings.template))?.name || 'Modern')}</div>
                <div class="template-collapsed-hint">Click to change template & color</div>
              </div>
              <div class="template-collapsed-color" id="template-collapsed-color" style="background:${escapeHTML(invoice?.accentColor || mergedSettings.accentColor)};"></div>
              <svg class="template-collapsed-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div class="template-popover" id="template-popover" style="display:none;">
              <div class="template-grid" id="form-template-grid">
                ${TEMPLATES.map(t => `
                  <div class="template-option ${t.id === (invoice?.template || mergedSettings.template) ? 'selected' : ''}" data-template="${t.id}">
                    <div class="template-preview-card">
                      ${getTemplatePreviewHTML(t.id, invoice?.accentColor || mergedSettings.accentColor)}
                    </div>
                    <div class="template-name">${escapeHTML(t.name)}</div>
                  </div>
                `).join('')}
              </div>
              <div style="margin-top:1rem;">
                <label style="font-size:0.8125rem;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:0.5rem;">Accent Color</label>
                <div class="color-grid" id="form-color-grid">
                  ${ACCENT_COLORS.map(c => `
                    <div class="color-option ${c.value === (invoice?.accentColor || mergedSettings.accentColor) ? 'selected' : ''}" 
                         data-color="${c.value}" 
                         style="background: ${c.value};" 
                         title="${escapeHTML(c.name)}"></div>
                  `).join('')}
                  <div class="color-option-custom ${ACCENT_COLORS.every(c => c.value !== (invoice?.accentColor || mergedSettings.accentColor)) ? 'selected' : ''}">
                    <input type="color" id="form-custom-color" value="${escapeHTML(invoice?.accentColor || mergedSettings.accentColor)}" title="Choose custom color">
                    <span>Custom</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
```

- [ ] **Step 2: Add `toggleTemplatePopover()` and popover dismiss handler**

Add these functions to `js/components/form.js`:

```js
function toggleTemplatePopover() {
  var popover = document.getElementById('template-popover');
  if (!popover) return;
  if (popover.style.display === 'none') {
    popover.style.display = 'block';
    setTimeout(function() {
      document.addEventListener('click', closeTemplatePopoverOutside);
    }, 0);
  } else {
    popover.style.display = 'none';
    document.removeEventListener('click', closeTemplatePopoverOutside);
  }
}

function closeTemplatePopoverOutside(e) {
  var popover = document.getElementById('template-popover');
  var collapsed = document.getElementById('template-collapsed');
  if (!popover || !collapsed) return;
  if (!popover.contains(e.target) && !collapsed.contains(e.target)) {
    popover.style.display = 'none';
    document.removeEventListener('click', closeTemplatePopoverOutside);
  }
}
```

- [ ] **Step 3: Update template/color click handlers to refresh the collapsed row**

In `attachFormListeners()`, find the template option click handler and the color option click handler. After each selection, add a call to update the collapsed row. In the template click handler (inside the `el.addEventListener('click', ...)` block), add at the end:

```js
      var thumbEl = document.getElementById('template-collapsed-thumb');
      var nameEl = document.getElementById('template-collapsed-name');
      var accent = document.getElementById('invoice-accent-color').value;
      if (thumbEl) thumbEl.innerHTML = getTemplatePreviewHTML(el.dataset.template, accent);
      if (nameEl) {
        var tpl = TEMPLATES.find(function(t) { return t.id === el.dataset.template; });
        nameEl.textContent = tpl ? tpl.name : el.dataset.template;
      }
```

In the color option click handler, add at the end:

```js
      var colorDot = document.getElementById('template-collapsed-color');
      if (colorDot) colorDot.style.background = el.dataset.color;
      var thumbEl = document.getElementById('template-collapsed-thumb');
      var tplVal = document.getElementById('invoice-template').value;
      if (thumbEl) thumbEl.innerHTML = getTemplatePreviewHTML(tplVal, el.dataset.color);
```

In the custom color picker handler, add at the end:

```js
      var colorDot = document.getElementById('template-collapsed-color');
      if (colorDot) colorDot.style.background = e.target.value;
      var thumbEl = document.getElementById('template-collapsed-thumb');
      var tplVal = document.getElementById('invoice-template').value;
      if (thumbEl) thumbEl.innerHTML = getTemplatePreviewHTML(tplVal, e.target.value);
```

- [ ] **Step 4: Add collapsed row and popover CSS**

Append to `css/styles.css`:

```css
.template-collapsed {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.template-collapsed:hover {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-light);
}
.template-collapsed-thumb {
  width: 48px;
  height: 32px;
  border-radius: 4px;
  background: var(--bg);
  flex-shrink: 0;
  overflow: hidden;
}
.template-collapsed-thumb .tp-body,
.template-collapsed-thumb .tp-total,
.template-collapsed-thumb .tp-meta {
  display: none;
}
.template-collapsed-info {
  flex: 1;
  min-width: 0;
}
.template-collapsed-name {
  font-weight: 500;
  font-size: 0.8125rem;
  color: var(--text);
}
.template-collapsed-hint {
  color: var(--text-secondary);
  font-size: 0.6875rem;
}
.template-collapsed-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--surface);
  box-shadow: 0 0 0 1px var(--border);
  flex-shrink: 0;
}
.template-collapsed-chevron {
  flex-shrink: 0;
  color: var(--text-secondary);
}
.template-popover {
  margin-top: 0.75rem;
  padding: 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

- [ ] **Step 5: Commit**

```bash
git add js/components/form.js css/styles.css
git commit -m "feat: collapse template & color picker into compact row"
```

---

### Task 8: Add "Reuse last invoice" button

**Files:**
- Modify: `js/components/form.js` (add button in Line Items section, add popover and import logic)

- [ ] **Step 1: Add the "Reuse last invoice" button**

In `renderInvoiceForm()`, find the line items button row (around line 134-136):

```html
            <button type="button" class="btn btn-secondary btn-sm" onclick="addLineItem()">+ Add Item</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="openCSVImport()" style="margin-left: 0.5rem;">Import CSV</button>
```

Add after the CSV button:

```html
            <button type="button" class="btn btn-secondary btn-sm reuse-last-btn" onclick="showReuseLastInvoice()" style="margin-left: 0.5rem;">&#8635; Reuse last invoice</button>
```

- [ ] **Step 2: Add `showReuseLastInvoice()` function**

```js
async function showReuseLastInvoice() {
  try {
    var invoices = await getAllInvoices();
    var lastByClient = {};
    invoices.forEach(function(inv) {
      var key = (inv.clientName || '').trim().toLowerCase();
      if (!key) return;
      if (!lastByClient[key] || new Date(inv.date || inv.createdAt) > new Date(lastByClient[key].date || lastByClient[key].createdAt)) {
        lastByClient[key] = inv;
      }
    });

    var entries = Object.values(lastByClient);
    if (entries.length === 0) {
      showToast('No previous invoices to reuse.', 'error');
      return;
    }

    if (entries.length === 1) {
      importLineItemsFromInvoice(entries[0]);
      return;
    }

    var overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.id = 'reuse-overlay';
    overlay.innerHTML =
      '<div class="client-modal">' +
      '<h3 style="font-size:1.125rem;font-weight:600;margin-bottom:0.5rem;">Import line items from:</h3>' +
      '<div style="display:flex;flex-direction:column;gap:0.375rem;margin-top:0.5rem;">' +
      entries.map(function(inv) {
        return '<div class="reuse-client-option" data-invoice-id="' + escapeHTML(inv.id) + '" style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem;border-radius:var(--radius);border:1px solid var(--border);cursor:pointer;transition:background 0.15s;">' +
          '<span style="font-size:0.875rem;font-weight:500;">' + escapeHTML(inv.clientName) + '</span>' +
          '<span style="font-size:0.75rem;color:var(--text-secondary);margin-left:auto;">' + escapeHTML(inv.number) + ' &middot; ' + (inv.lineItems ? inv.lineItems.length : 0) + ' items</span>' +
          '</div>';
      }).join('') +
      '</div>' +
      '<div class="confirm-actions" style="margin-top:1rem;"><button type="button" class="btn btn-secondary" id="reuse-cancel-btn">Cancel</button></div>' +
      '</div>';

    document.body.appendChild(overlay);
    overlay.querySelector('#reuse-cancel-btn').addEventListener('click', function() { overlay.remove(); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

    overlay.querySelectorAll('.reuse-client-option').forEach(function(el) {
      el.addEventListener('click', function() {
        var invId = el.dataset.invoiceId;
        var inv = entries.find(function(i) { return i.id === invId; });
        if (inv) importLineItemsFromInvoice(inv);
        overlay.remove();
      });
      el.addEventListener('mouseenter', function() { el.style.background = 'var(--accent-light)'; });
      el.addEventListener('mouseleave', function() { el.style.background = ''; });
    });
  } catch (err) {
    showToast('Error loading invoices.', 'error');
    console.error(err);
  }
}
```

- [ ] **Step 3: Add `importLineItemsFromInvoice()` function**

```js
function importLineItemsFromInvoice(invoice) {
  if (!invoice.lineItems || invoice.lineItems.length === 0) {
    showToast('No line items in that invoice.', 'error');
    return;
  }

  var items = invoice.lineItems.map(function(item) {
    return {
      date: '',
      description: item.description || '',
      rate: item.rate || '',
      hours: ''
    };
  });

  var tbody = document.getElementById('line-items-body');
  var settings = formCachedSettings || getDefaultSettings();
  var currencySymbol = getCurrencySymbol(settings.currency);

  var firstDate = document.getElementById('invoice-date') ? document.getElementById('invoice-date').value : getLocalDateString();
  items[0].date = firstDate;

  items.forEach(function(item, i) {
    if (i > 0) item.date = getNextWeekday(items[i - 1].date);

    var amount = (parseFloat(item.rate) || 0) * (parseFloat(item.hours) || 0);
    var index = tbody.querySelectorAll('tr.item-row-inputs').length;

    var inputRow = document.createElement('tr');
    inputRow.dataset.itemIndex = index;
    inputRow.className = 'item-row-inputs';
    inputRow.innerHTML =
      '<td rowspan="2"><input type="date" class="item-date" value="' + escapeHTML(item.date) + '"></td>' +
      '<td><div style="position:relative;">' +
      '<span style="position:absolute;left:0.5rem;top:50%;transform:translateY(-50%);color:var(--text-secondary);font-size:0.8125rem;pointer-events:none;">' + currencySymbol + '</span>' +
      '<input type="number" class="item-rate" value="' + escapeHTML(String(item.rate)) + '" placeholder="0.00" step="0.01" min="0" required style="padding-left:1.5rem;">' +
      '</div></td>' +
      '<td><input type="number" class="item-hours" value="" placeholder="0" step="0.5" min="0" required></td>' +
      '<td class="amount-cell">' + formatCurrency(0, settings.currency) + '</td>' +
      '<td rowspan="2">' +
      '<div style="display:flex;gap:0.25rem;justify-content:flex-end;">' +
      '<button type="button" class="reorder-btn reorder-up" onclick="moveLineItem(this, -1)" title="Move up" aria-label="Move item up">&#8593;</button>' +
      '<button type="button" class="reorder-btn reorder-down" onclick="moveLineItem(this, 1)" title="Move down" aria-label="Move item down">&#8595;</button>' +
      '<button type="button" class="remove-btn" onclick="removeLineItem(this)" aria-label="Remove item">&times;</button>' +
      '</div></td>';

    var descRow = document.createElement('tr');
    descRow.dataset.itemIndex = index;
    descRow.className = 'item-row-desc';
    descRow.innerHTML = '<td colspan="3"><textarea class="item-description" placeholder="Description of work" required rows="1">' + escapeHTML(item.description) + '</textarea></td>';

    tbody.appendChild(inputRow);
    tbody.appendChild(descRow);
  });

  updateReorderButtonsState();
  updateTotals();
  showToast('Imported ' + items.length + ' line item' + (items.length !== 1 ? 's' : '') + ' from ' + escapeHTML(invoice.clientName) + '!', 'success');
}
```

- [ ] **Step 4: Commit**

```bash
git add js/components/form.js
git commit -m "feat: add Reuse last invoice button to line items"
```

---

### Task 9: Add autosave to the invoice form

**Files:**
- Modify: `js/components/form.js` (add autosave logic, status indicator, remove "Save Draft" button)

- [ ] **Step 1: Add autosave state variables and function**

Near the top of `js/components/form.js` (after the existing `let formDirty = false;` on line 2), add:

```js
var autosaveState = 'idle';
var autosaveTimer = null;
var autosaveLastSaved = null;
```

Add the autosave function:

```js
function scheduleAutosave() {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  if (autosaveState !== 'saving') {
    autosaveState = 'dirty';
    updateAutosaveIndicator();
  }
  autosaveTimer = setTimeout(function() {
    performAutosave();
  }, 3000);
}

async function performAutosave() {
  var clientName = document.getElementById('client-name');
  var hasContent = (clientName && clientName.value.trim()) || hasAnyLineItemContent();
  if (!hasContent) return;

  autosaveState = 'saving';
  updateAutosaveIndicator();

  try {
    var editId = document.getElementById('edit-id').value;
    var invoice = {
      id: editId || Date.now().toString(),
      number: document.getElementById('invoice-number').value,
      date: document.getElementById('invoice-date').value,
      dueDate: document.getElementById('invoice-due-date').value,
      clientName: document.getElementById('client-name').value,
      clientEmail: document.getElementById('client-email').value,
      clientAddress: document.getElementById('client-address').value,
      lineItems: collectLineItems(),
      notes: document.getElementById('invoice-notes').value,
      template: document.getElementById('invoice-template') ? document.getElementById('invoice-template').value : undefined,
      accentColor: document.getElementById('invoice-accent-color') ? document.getElementById('invoice-accent-color').value : undefined,
      status: 'draft'
    };

    if (!editId) {
      invoice.createdAt = new Date().toISOString();
      document.getElementById('edit-id').value = invoice.id;
    }
    invoice.updatedAt = new Date().toISOString();

    await saveInvoice(invoice);
    autosaveState = 'saved';
    autosaveLastSaved = Date.now();
    updateAutosaveIndicator();
  } catch (err) {
    autosaveState = 'error';
    updateAutosaveIndicator();
    console.error('Autosave failed:', err);
  }
}

function collectLineItems() {
  var inputRows = document.querySelectorAll('#line-items-body tr.item-row-inputs');
  var items = [];
  inputRows.forEach(function(row) {
    var descRow = row.nextElementSibling;
    items.push({
      date: row.querySelector('.item-date') ? row.querySelector('.item-date').value : '',
      description: descRow && descRow.querySelector('.item-description') ? descRow.querySelector('.item-description').value : '',
      rate: row.querySelector('.item-rate') ? row.querySelector('.item-rate').value : '',
      hours: row.querySelector('.item-hours') ? row.querySelector('.item-hours').value : ''
    });
  });
  return items;
}

function hasAnyLineItemContent() {
  var inputRows = document.querySelectorAll('#line-items-body tr.item-row-inputs');
  for (var i = 0; i < inputRows.length; i++) {
    var row = inputRows[i];
    var descRow = row.nextElementSibling;
    var desc = descRow && descRow.querySelector('.item-description') ? descRow.querySelector('.item-description').value : '';
    var rate = row.querySelector('.item-rate') ? row.querySelector('.item-rate').value : '';
    if (desc.trim() || rate.trim()) return true;
  }
  return false;
}

function updateAutosaveIndicator() {
  var el = document.getElementById('autosave-indicator');
  if (!el) return;
  var html = '';
  switch (autosaveState) {
    case 'dirty':
      html = '<div style="display:flex;align-items:center;gap:0.375rem;"><div style="width:6px;height:6px;border-radius:50%;background:#f59e0b;"></div><span style="font-size:0.7rem;color:#b45309;">Unsaved changes</span></div>';
      break;
    case 'saving':
      html = '<div style="display:flex;align-items:center;gap:0.375rem;"><div style="width:12px;height:12px;border:2px solid var(--accent);border-top-color:transparent;border-radius:50%;animation:autosave-spin 0.6s linear infinite;"></div><span style="font-size:0.7rem;color:var(--accent);">Saving...</span></div>';
      break;
    case 'saved':
      var ago = autosaveLastSaved ? Math.round((Date.now() - autosaveLastSaved) / 1000) : 0;
      var timeStr = ago < 60 ? ago + 's ago' : Math.round(ago / 60) + 'm ago';
      html = '<div style="display:flex;align-items:center;gap:0.375rem;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span style="font-size:0.7rem;color:var(--success);">Draft auto-saved</span><span style="font-size:0.6rem;color:var(--text-secondary);">' + timeStr + '</span></div>';
      break;
    case 'error':
      html = '<div style="display:flex;align-items:center;gap:0.375rem;"><span style="font-size:0.7rem;color:var(--danger);">Save failed &mdash; will retry</span></div>';
      break;
    default:
      html = '';
  }
  el.innerHTML = html;
}
```

- [ ] **Step 2: Add autosave indicator HTML to the form**

In `renderInvoiceForm()`, find the page header:

```html
    <div class="page-header">
      <h1>${editId ? 'Edit Invoice' : 'New Invoice'}</h1>
      <p>${editId ? 'Update invoice details' : 'Fill in the details below'}</p>
    </div>
```

Replace with:

```html
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <h1>${editId ? 'Edit Invoice' : 'New Invoice'}</h1>
        <p>${editId ? 'Update invoice details' : 'Fill in the details below'}</p>
      </div>
      <div id="autosave-indicator"></div>
    </div>
```

- [ ] **Step 3: Wire autosave into existing form listeners**

In `attachFormListeners()`, find the existing `form.addEventListener('input', ...)` and `form.addEventListener('change', ...)` handlers. Add `scheduleAutosave()` call to each:

After the existing `debouncedUpdatePreview();` in the input handler, add:

```js
      scheduleAutosave();
```

After the existing `debouncedUpdatePreview();` in the change handler, add:

```js
      scheduleAutosave();
```

- [ ] **Step 4: Remove the "Save Draft" button and beforeunload listener**

In `renderInvoiceForm()`, find the button group (around line 180-185):

```html
            <button type="submit" class="btn btn-primary" id="btn-generate-pdf">${editId ? 'Update & Generate PDF' : 'Save & Generate PDF'}</button>
            <button type="button" class="btn btn-secondary" onclick="saveDraft()" id="btn-save-draft">Save Draft <span style="font-size:0.7rem;opacity:0.7;">Ctrl+S</span></button>
            <button type="button" class="btn btn-secondary" onclick="saveAndDownloadVisualPDF()" title="PDF that looks exactly like the preview" id="btn-visual-pdf">Visual PDF</button>
            <a href="#/history" class="btn btn-secondary">Cancel</a>
```

Replace with:

```html
            <button type="submit" class="btn btn-primary" id="btn-generate-pdf">${editId ? 'Update & Generate PDF' : 'Save & Generate PDF'}</button>
            <button type="button" class="btn btn-secondary" onclick="saveAndDownloadVisualPDF()" title="PDF that looks exactly like the preview" id="btn-visual-pdf">Visual PDF</button>
            <a href="#/history" class="btn btn-secondary">Cancel</a>
```

Remove the `beforeunload` event listener at the top of the file (lines 14-19):

```js
window.addEventListener('beforeunload', (e) => {
  if (formDirty) {
    e.preventDefault();
    e.returnValue = '';
  }
});
```

- [ ] **Step 5: Update Ctrl+S handler**

In `setupFormKeyboardShortcuts()`, find the Ctrl+S handler:

```js
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDraft();
      }
```

Replace with:

```js
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        performAutosave();
      }
```

- [ ] **Step 6: Add autosave CSS animation**

Append to `css/styles.css`:

```css
@keyframes autosave-spin {
  to { transform: rotate(360deg); }
}
```

- [ ] **Step 7: Commit**

```bash
git add js/components/form.js css/styles.css
git commit -m "feat: add autosave drafts to invoice form"
```

---

### Task 10: Build, test, and verify

- [ ] **Step 1: Restart the Docker server**

```bash
docker compose up --build -d
```

- [ ] **Step 2: Manual test checklist**

Open the app in a browser and verify:

1. **Presets:** Go to Settings → "Line Item Presets" section visible at top → Add a preset (name, description, rate) → preset appears in list → Edit it → Delete it
2. **Preset chips:** Create a new invoice → preset chips bar visible above line items → Click a chip → row added with description + rate pre-filled → "Add preset..." chip opens inline form → Save creates preset and adds row
3. **Collapsed template/color:** Template section shows single compact row → Click expands popover → Select different template → collapsed row updates → Click outside closes → Select color → collapsed row dot updates
4. **Smart due date:** Set payment terms to "Net 15" in settings → New invoice → due date is +15 days
5. **Reuse last invoice:** Create a new invoice → Click "Reuse last invoice" → If one client, auto-imports → If multiple, shows client picker → Items imported with descriptions + rates, hours empty
6. **Autosave:** Fill in client name → wait 3s → green "auto-saved" indicator → refresh page → invoice appears in history as draft
7. **Dark mode:** Toggle dark mode → all new elements respect dark theme

- [ ] **Step 3: Commit any fixes if needed**
