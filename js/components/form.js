let formCachedSettings = null;
let formDirty = false;

function setFormDirty() {
  if (!formDirty) {
    formDirty = true;
  }
}

function clearFormDirty() {
  formDirty = false;
}

window.addEventListener('beforeunload', (e) => {
  if (formDirty) {
    e.preventDefault();
    e.returnValue = '';
  }
});

async function renderInvoiceForm(editId = null) {
  const app = document.getElementById('app');
  showLoading();
  clearFormDirty();
  
  try {
    const settings = await getAllSettings();
    const defaults = getDefaultSettings();
    formCachedSettings = { ...defaults, ...settings };
    const mergedSettings = formCachedSettings;
    
    let invoice = null;
    if (editId) {
      invoice = await getInvoice(editId);
    }
    
    const nextNum = editId ? { num: 0 } : await getNextInvoiceNumber();
    const formattedNum = editId ? invoice.number : await formatInvoiceNumber(nextNum.num);
    const today = getLocalDateString();
    const dueDate = getLocalDateString(new Date(Date.now() + parsePaymentTerms(mergedSettings.paymentTerms) * 24 * 60 * 60 * 1000));
    
    const lineItems = (invoice ? invoice.lineItems : [{ description: '', rate: '', hours: '' }]).map((item, i) => ({
      ...item,
      date: item.date || (i === 0 ? (invoice?.date || today) : '')
    }));
    const status = invoice ? (invoice.status || 'draft') : 'draft';
    const currencySymbol = getCurrencySymbol(mergedSettings.currency);
    
    app.innerHTML = `
    <div class="page-header">
      <h1>${editId ? 'Edit Invoice' : 'New Invoice'}</h1>
      <p>${editId ? 'Update invoice details' : 'Fill in the details below'}</p>
    </div>
    
    <div class="form-layout">
      <div class="form-column">
        <form id="invoice-form">
          <input type="hidden" id="edit-id" value="${editId || ''}">
            <input type="hidden" id="invoice-template" value="${escapeHTML(invoice?.template || mergedSettings.template)}">
            <input type="hidden" id="invoice-accent-color" value="${escapeHTML(invoice?.accentColor || mergedSettings.accentColor)}">
          
          <div class="card">
            <div class="card-title">Invoice Details</div>
            <div class="form-grid">
              <div class="form-group">
                <label for="invoice-number">Invoice Number</label>
                <input type="text" id="invoice-number" value="${escapeHTML(formattedNum)}" required>
              </div>
              <div class="form-group">
                <label for="invoice-date">Date</label>
                <input type="date" id="invoice-date" value="${invoice ? escapeHTML(invoice.date) : today}" required>
              </div>
              <div class="form-group">
                <label for="invoice-due-date">Due Date</label>
                <input type="date" id="invoice-due-date" value="${invoice ? escapeHTML(invoice.dueDate) : dueDate}" required>
              </div>
              <div class="form-group">
                <label for="invoice-status">Status</label>
                <select id="invoice-status">
                  ${INVOICE_STATUSES.map(s => `<option value="${s}" ${status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="card-title">Client Information</div>
            <div class="client-selector-wrapper">
              <div class="form-group">
                <label for="client-select">Select Client</label>
                <select id="client-select">
                  <option value="">-- Select a client --</option>
                </select>
              </div>
              <div class="form-group">
                <label>&nbsp;</label>
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.location.hash='#/settings';document.getElementById('clients-card').open=true;" title="Manage clients in settings">Manage Clients</button>
              </div>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label for="client-name">Client Name</label>
                <input type="text" id="client-name" value="${invoice ? escapeHTML(invoice.clientName) : ''}" required>
              </div>
              <div class="form-group">
                <label for="client-email">Client Email</label>
                <input type="email" id="client-email" value="${invoice ? escapeHTML(invoice.clientEmail || '') : ''}">
              </div>
              <div class="form-group" style="grid-column: 1 / -1;">
                <label for="client-address">Client Address</label>
                <input type="text" id="client-address" value="${invoice ? escapeHTML(invoice.clientAddress || '') : ''}">
              </div>
            </div>
          </div>

          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div class="card-title" style="margin-bottom:0;">Line Items</div>
              <a href="#/settings" class="preset-manage-link">Manage Presets</a>
            </div>
            ${mergedSettings.lineItemPresets && mergedSettings.lineItemPresets.length > 0 ? `
            <div class="preset-chips">
              ${mergedSettings.lineItemPresets.map(p => `
                <button type="button" class="preset-chip" onclick="addPresetLineItem('${escapeHTML(p.id)}')" title="${escapeHTML(p.description || p.name)}">${escapeHTML(p.name)} &mdash; ${formatCurrency(p.rate, mergedSettings.currency)}/hr</button>
              `).join('')}
              <button type="button" class="preset-chip preset-chip-add" onclick="showInlinePresetForm()">+ Add preset...</button>
            </div>
            ` : ''}
            <div class="table-wrapper">
              <table class="line-items" id="line-items-table">
                <thead>
                  <tr>
                    <th style="width: 15%;">Date</th>
                    <th style="width: 22%;">${escapeHTML(mergedSettings.labelRate || 'Rate')}</th>
                    <th style="width: 22%;">${escapeHTML(mergedSettings.labelHours || 'Hours')}</th>
                    <th style="width: 31%;">${escapeHTML(mergedSettings.labelAmount || 'Amount')}</th>
                    <th style="width: 10%;"></th>
                  </tr>
                </thead>
                <tbody id="line-items-body">
                  ${lineItems.map((item, i) => renderLineItemRow(item, i, mergedSettings, currencySymbol, lineItems.length)).join('')}
                </tbody>
              </table>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="addLineItem()">+ Add Item</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="openCSVImport()" style="margin-left: 0.5rem;">Import CSV</button>
            <input type="file" id="csv-file-input" accept=".csv,.tsv,.txt" style="display:none;" onchange="handleCSVFileSelect(event)">
            
            <div class="totals sticky-totals" id="totals">
              ${renderTotalsHTML(lineItems, mergedSettings)}
            </div>
          </div>
          
          <div class="card">
            <div class="card-title">Template & Color</div>
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
          
          <div class="card">
            <div class="card-title">Notes & Terms</div>
            <div class="form-group">
              <label for="invoice-notes">Notes</label>
              <textarea id="invoice-notes" rows="3">${invoice ? escapeHTML(invoice.notes || '') : escapeHTML(mergedSettings.notes || '')}</textarea>
            </div>
          </div>
          
          <div class="btn-group">
            <button type="submit" class="btn btn-primary" id="btn-generate-pdf">${editId ? 'Update & Generate PDF' : 'Save & Generate PDF'}</button>
            <button type="button" class="btn btn-secondary" onclick="saveDraft()" id="btn-save-draft">Save Draft <span style="font-size:0.7rem;opacity:0.7;">Ctrl+S</span></button>
            <button type="button" class="btn btn-secondary" onclick="saveAndDownloadVisualPDF()" title="PDF that looks exactly like the preview" id="btn-visual-pdf">Visual PDF</button>
            <a href="#/history" class="btn btn-secondary">Cancel</a>
          </div>
        </form>
      </div>
      
      <div class="preview-column">
        <div class="preview-sticky">
          <div class="preview-header">
            <span>Live Preview</span>
            <span class="preview-template-label" id="preview-template-label">${escapeHTML(TEMPLATES.find(t => t.id === (invoice?.template || mergedSettings.template))?.name || mergedSettings.template)}</span>
          </div>
          <div class="preview-container" id="live-preview">
            ${renderLivePreview(mergedSettings, {
              number: formattedNum,
              date: invoice ? invoice.date : today,
              dueDate: invoice ? invoice.dueDate : dueDate,
              clientName: invoice ? invoice.clientName : '',
              clientEmail: invoice ? invoice.clientEmail : '',
              clientAddress: invoice ? invoice.clientAddress : '',
              lineItems: lineItems,
              notes: invoice ? invoice.notes || '' : mergedSettings.notes || ''
            })}
          </div>
        </div>
      </div>
    </div>
    
    <button class="preview-toggle-btn" onclick="toggleMobilePreview()">Preview Invoice</button>
    <div class="mobile-preview-overlay" id="mobile-preview-overlay" onclick="closeMobilePreview(event)">
      <div class="mobile-preview-modal">
        <div class="mobile-preview-header">
          <span>Invoice Preview</span>
          <button class="btn btn-secondary btn-sm" onclick="closeMobilePreview()">Close</button>
        </div>
        <div id="mobile-preview-content"></div>
      </div>
    </div>
  `;
  
  document.getElementById('invoice-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleFormSubmit(false);
  });
  
  attachFormListeners();
  renderNav();
  
  if (!editId) {
    setTimeout(() => {
      const clientInput = document.getElementById('client-name');
      if (clientInput) clientInput.focus();
    }, 50);
  }
  
  await setupClientDropdown(editId, invoice);
  setupFormKeyboardShortcuts();
  
  } catch (err) {
    console.error('Error rendering invoice form:', err);
    if (isSessionExpired()) return;
    app.innerHTML = `
      <div class="page-header">
        <h1>Error</h1>
        <p>Failed to load the invoice form. Please try again.</p>
      </div>
      <div class="card">
        <p style="color: var(--danger);">${escapeHTML(err.message)}</p>
        <button class="btn btn-primary" onclick="location.reload()">Reload</button>
      </div>
    `;
  }
}

function renderLineItemRow(item, index, settings, currencySymbol, totalItems) {
  const amount = (parseFloat(item.rate) || 0) * (parseFloat(item.hours) || 0);
  return `
    <tr data-item-index="${index}" class="item-row-inputs">
      <td rowspan="2"><input type="date" class="item-date" value="${escapeHTML(item.date || '')}"></td>
      <td>
        <div style="position:relative;">
          <span style="position:absolute;left:0.5rem;top:50%;transform:translateY(-50%);color:var(--text-secondary);font-size:0.8125rem;pointer-events:none;">${currencySymbol}</span>
          <input type="number" class="item-rate" value="${escapeHTML(String(item.rate))}" placeholder="0.00" step="0.01" min="0" required style="padding-left:1.5rem;">
        </div>
      </td>
      <td><input type="number" class="item-hours" value="${escapeHTML(String(item.hours))}" placeholder="0" step="0.5" min="0" required></td>
      <td class="amount-cell">${formatCurrency(amount, settings.currency)}</td>
      <td rowspan="2">
        <div style="display:flex;gap:0.25rem;justify-content:flex-end;">
          <button type="button" class="reorder-btn reorder-up" onclick="moveLineItem(this, -1)" title="Move up" aria-label="Move item up" ${index === 0 ? 'disabled' : ''}>&#8593;</button>
          <button type="button" class="reorder-btn reorder-down" onclick="moveLineItem(this, 1)" title="Move down" aria-label="Move item down" ${index === totalItems - 1 ? 'disabled' : ''}>&#8595;</button>
          <button type="button" class="remove-btn" onclick="removeLineItem(this)" aria-label="Remove item" ${index === 0 ? 'disabled' : ''}>&times;</button>
        </div>
      </td>
    </tr>
    <tr data-item-index="${index}" class="item-row-desc">
      <td colspan="3"><textarea class="item-description" placeholder="Description of work" required rows="1">${escapeHTML(item.description)}</textarea></td>
    </tr>
  `;
}

function renderTotalsHTML(lineItems, settings) {
  const subtotal = lineItems.reduce((sum, item) => sum + ((parseFloat(item.rate) || 0) * (parseFloat(item.hours) || 0)), 0);
  const tps = settings.taxTPS ? subtotal * settings.tpsRate : 0;
  const tvq = settings.taxTVQ ? (subtotal + tps) * settings.tvqRate : 0;
  const total = subtotal + tps + tvq;
  
  return `
    <div class="totals-row">
      <span>${escapeHTML(settings.labelSubtotal || 'Subtotal')}</span>
      <span>${formatCurrency(subtotal, settings.currency)}</span>
    </div>
    ${settings.taxTPS ? `<div class="totals-row"><span>${escapeHTML(settings.labelTPS || 'TPS')} (${(settings.tpsRate * 100).toFixed(1)}%)</span><span>${formatCurrency(tps, settings.currency)}</span></div>` : ''}
    ${settings.taxTVQ ? `<div class="totals-row"><span>${escapeHTML(settings.labelTVQ || 'TVQ')} (${(settings.tvqRate * 100).toFixed(2)}%)</span><span>${formatCurrency(tvq, settings.currency)}</span></div>` : ''}
    <div class="totals-row total">
      <span>${escapeHTML(settings.labelTotal || 'Total')}</span>
      <span>${formatCurrency(total, settings.currency)}</span>
    </div>
  `;
}

function getNextWeekday(dateStr) {
  if (!dateStr) return getLocalDateString();
  const date = new Date(dateStr + 'T00:00:00');
  do {
    date.setDate(date.getDate() + 1);
  } while (date.getDay() === 0 || date.getDay() === 6);
  return getLocalDateString(date);
}

function addLineItem() {
  const tbody = document.getElementById('line-items-body');
  const inputRows = tbody.querySelectorAll('tr.item-row-inputs');
  const index = inputRows.length;
  const settings = formCachedSettings || getDefaultSettings();
  const currencySymbol = getCurrencySymbol(settings.currency);
  const lastInputRow = inputRows[inputRows.length - 1];
  const defaultDate = lastInputRow
    ? getNextWeekday(lastInputRow.querySelector('.item-date')?.value)
    : (document.getElementById('invoice-date')?.value || getLocalDateString());

  const inputRow = document.createElement('tr');
  inputRow.dataset.itemIndex = index;
  inputRow.className = 'item-row-inputs';
  inputRow.innerHTML = `
    <td rowspan="2"><input type="date" class="item-date" value="${escapeHTML(defaultDate)}"></td>
    <td>
      <div style="position:relative;">
        <span style="position:absolute;left:0.5rem;top:50%;transform:translateY(-50%);color:var(--text-secondary);font-size:0.8125rem;pointer-events:none;">${currencySymbol}</span>
        <input type="number" class="item-rate" placeholder="0.00" step="0.01" min="0" required style="padding-left:1.5rem;">
      </div>
    </td>
    <td><input type="number" class="item-hours" placeholder="0" step="0.5" min="0" required></td>
    <td class="amount-cell">${formatCurrency(0, settings.currency)}</td>
    <td rowspan="2">
      <div style="display:flex;gap:0.25rem;justify-content:flex-end;">
        <button type="button" class="reorder-btn reorder-up" onclick="moveLineItem(this, -1)" title="Move up" aria-label="Move item up" disabled>&#8593;</button>
        <button type="button" class="reorder-btn reorder-down" onclick="moveLineItem(this, 1)" title="Move down" aria-label="Move item down" disabled>&#8595;</button>
        <button type="button" class="remove-btn" onclick="removeLineItem(this)" aria-label="Remove item">&times;</button>
      </div>
    </td>
  `;

  const descRow = document.createElement('tr');
  descRow.dataset.itemIndex = index;
  descRow.className = 'item-row-desc';
  descRow.innerHTML = `
    <td colspan="3"><textarea class="item-description" placeholder="Description of work" required rows="1"></textarea></td>
  `;

  tbody.appendChild(inputRow);
  tbody.appendChild(descRow);
  updateReorderButtonsState();

  const descInput = descRow.querySelector('.item-description');
  if (descInput) descInput.focus();
}

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

  var hoursInput = inputRow.querySelector('.item-hours');
  if (hoursInput && !hours) hoursInput.focus();
}

function showInlinePresetForm() {
  var existing = document.getElementById('inline-preset-form');
  if (existing) { document.getElementById('inline-preset-name').focus(); return; }

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

function updatePresetChips() {
  var settings = formCachedSettings || getDefaultSettings();
  var presets = settings.lineItemPresets || [];
  var chipsBar = document.querySelector('.preset-chips');
  if (!chipsBar) return;

  chipsBar.innerHTML = presets.map(function(p) {
    return '<button type="button" class="preset-chip" onclick="addPresetLineItem(\'' + escapeHTML(p.id) + '\')" title="' + escapeHTML(p.description || p.name) + '">' + escapeHTML(p.name) + ' &mdash; ' + formatCurrency(p.rate, settings.currency) + '/hr</button>';
  }).join('') + '<button type="button" class="preset-chip preset-chip-add" onclick="showInlinePresetForm()">+ Add preset...</button>';
}

function removeLineItem(btn) {
  const tbody = document.getElementById('line-items-body');
  if (tbody.querySelectorAll('tr.item-row-inputs').length > 1) {
    const row = btn.closest('tr');
    const itemIndex = row.dataset.itemIndex;
    tbody.querySelectorAll(`tr[data-item-index="${itemIndex}"]`).forEach(r => r.remove());
    updateReorderButtonsState();
    updateTotals();
  }
}

function moveLineItem(btn, direction) {
  const row = btn.closest('tr');
  const itemIndex = row.dataset.itemIndex;
  const rows = Array.from(document.querySelectorAll(`#line-items-body tr[data-item-index="${itemIndex}"]`));

  if (direction === -1) {
    const prevItemFirstRow = rows[0].previousElementSibling?.previousElementSibling;
    if (prevItemFirstRow) {
      rows.forEach(r => prevItemFirstRow.before(r));
    }
  } else if (direction === 1) {
    const nextItemFirstRow = rows[rows.length - 1].nextElementSibling;
    if (nextItemFirstRow) {
      const nextIndex = nextItemFirstRow.dataset.itemIndex;
      const nextRows = Array.from(document.querySelectorAll(`#line-items-body tr[data-item-index="${nextIndex}"]`));
      nextRows.forEach(r => rows[0].before(r));
    }
  }
  updateReorderButtonsState();
  updateTotals();
}

function updateReorderButtonsState() {
  const tbody = document.getElementById('line-items-body');
  const inputRows = tbody.querySelectorAll('tr.item-row-inputs');
  const total = inputRows.length;
  inputRows.forEach((row, i) => {
    const up = row.querySelector('.reorder-up');
    const down = row.querySelector('.reorder-down');
    if (up) up.disabled = i === 0;
    if (down) down.disabled = i === total - 1;
  });
}

let csvImportData = null;

function openCSVImport() {
  const input = document.getElementById('csv-file-input');
  if (input) input.click();
}

function handleCSVFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  event.target.value = '';

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const { headers, rows } = parseCSV(text);
    if (headers.length === 0 || rows.length === 0) {
      showToast('No data found in CSV file.', 'error');
      return;
    }

    const autoMapping = guessCSVMapping(headers);
    csvImportData = { headers, rows, mapping: autoMapping };
    showCSVImportModal();
  };
  reader.readAsText(file);
}

function showCSVImportModal() {
  if (!csvImportData) return;
  const { headers, rows, mapping } = csvImportData;

  const previewRows = rows.slice(0, 5);

  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.id = 'csv-import-overlay';
  overlay.innerHTML = `
    <div class="csv-import-modal">
      <h3 style="font-size:1.125rem;font-weight:600;margin-bottom:0.5rem;">Import Line Items from CSV</h3>
      <p style="color:var(--text-secondary);font-size:0.875rem;margin-bottom:1rem;">
        Map your CSV columns to invoice fields. ${escapeHTML(rows.length)} row${rows.length !== 1 ? 's' : ''} found.
      </p>

      <div class="csv-mapping-grid">
        ${headers.map((header, i) => {
          const auto = mapping[header] || '_skip';
          return `
            <div class="csv-mapping-row">
              <div class="csv-mapping-header">${escapeHTML(header)}</div>
              <select class="csv-mapping-select" data-column="${escapeHTML(header)}">
                ${CSV_FIELD_OPTIONS.map(opt =>
                  `<option value="${opt.value}" ${auto === opt.value ? 'selected' : ''}>${escapeHTML(opt.label)}</option>`
                ).join('')}
              </select>
            </div>
          `;
        }).join('')}
      </div>

      <div class="csv-preview-section">
        <div style="font-size:0.75rem;font-weight:600;margin-bottom:0.5rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em;">Preview (first ${previewRows.length} row${previewRows.length !== 1 ? 's' : ''})</div>
        <div class="csv-preview-table-wrapper">
          <table class="csv-preview-table">
            <thead>
              <tr>
                ${headers.map(h => `<th>${escapeHTML(h)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${previewRows.map(row => `
                <tr>${headers.map(h => `<td>${escapeHTML(row[h] || '')}</td>`).join('')}</tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div style="font-size:0.8125rem;color:var(--text-secondary);margin-top:0.75rem;">
        Only mapped columns will be imported. Unmapped columns are skipped. Rows with empty description are excluded.
      </div>

      <div class="confirm-actions" style="margin-top:1.25rem;">
        <button class="btn btn-secondary" id="csv-cancel-btn">Cancel</button>
        <button class="btn btn-primary" id="csv-import-btn">Import ${rows.length} Item${rows.length !== 1 ? 's' : ''}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#csv-cancel-btn').addEventListener('click', () => {
    csvImportData = null;
    overlay.remove();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      csvImportData = null;
      overlay.remove();
    }
  });
  overlay.querySelector('#csv-import-btn').addEventListener('click', () => {
    applyCSVImport();
    overlay.remove();
  });
}

function applyCSVImport() {
  if (!csvImportData) return;

  const selects = document.querySelectorAll('.csv-mapping-select');
  const mapping = {};
  selects.forEach(sel => {
    mapping[sel.dataset.column] = sel.value;
  });

  const { rows } = csvImportData;
  csvImportData = null;

  const newItems = [];
  for (const row of rows) {
    const item = { description: '', rate: '', hours: '' };
    let hasData = false;

    for (const [column, field] of Object.entries(mapping)) {
      if (field === '_skip') continue;
      const value = (row[column] || '').trim();
      if (field === 'description' && value) hasData = true;
      if (field === 'rate') {
        const num = parseFloat(value.replace(/[,$]/g, ''));
        item[field] = isNaN(num) ? value : String(num);
        if (value) hasData = true;
      } else if (field === 'hours') {
        const num = parseFloat(value.replace(/[,$]/g, ''));
        item[field] = isNaN(num) ? value : String(num);
        if (value) hasData = true;
      } else {
        item[field] = value;
        if (value) hasData = true;
      }
    }

    if (hasData) newItems.push(item);
  }

  if (newItems.length === 0) {
    showToast('No valid rows to import.', 'error');
    return;
  }

  const tbody = document.getElementById('line-items-body');
  const existingItems = [];
  tbody.querySelectorAll('tr.item-row-inputs').forEach(row => {
    const descRow = row.nextElementSibling;
    const desc = descRow?.querySelector('.item-description')?.value;
    const rate = row.querySelector('.item-rate')?.value;
    const hours = row.querySelector('.item-hours')?.value;
    const date = row.querySelector('.item-date')?.value;
    if (desc || rate || hours) {
      existingItems.push({ date: date || '', description: desc || '', rate: rate || '', hours: hours || '' });
    }
  });

  const allItems = existingItems.length > 0 ? [...existingItems, ...newItems] : newItems;

  tbody.innerHTML = '';
  const settings = formCachedSettings || getDefaultSettings();
  const currencySymbol = getCurrencySymbol(settings.currency);
  allItems.forEach((item, i) => {
    const amount = (parseFloat(item.rate) || 0) * (parseFloat(item.hours) || 0);
    const defaultDate = i === 0
      ? (document.getElementById('invoice-date')?.value || getLocalDateString())
      : getNextWeekday(allItems[i - 1].date || '');

    const inputRow = document.createElement('tr');
    inputRow.dataset.itemIndex = i;
    inputRow.className = 'item-row-inputs';
    inputRow.innerHTML = `
      <td rowspan="2"><input type="date" class="item-date" value="${escapeHTML(item.date || defaultDate)}"></td>
      <td>
        <div style="position:relative;">
          <span style="position:absolute;left:0.5rem;top:50%;transform:translateY(-50%);color:var(--text-secondary);font-size:0.8125rem;pointer-events:none;">${currencySymbol}</span>
          <input type="number" class="item-rate" value="${escapeHTML(item.rate)}" placeholder="0.00" step="0.01" min="0" required style="padding-left:1.5rem;">
        </div>
      </td>
      <td><input type="number" class="item-hours" value="${escapeHTML(item.hours)}" placeholder="0" step="0.5" min="0" required></td>
      <td class="amount-cell">${formatCurrency(amount, settings.currency)}</td>
      <td rowspan="2">
        <div style="display:flex;gap:0.25rem;justify-content:flex-end;">
          <button type="button" class="reorder-btn reorder-up" onclick="moveLineItem(this, -1)" title="Move up" aria-label="Move item up" ${i === 0 ? 'disabled' : ''}>&#8593;</button>
          <button type="button" class="reorder-btn reorder-down" onclick="moveLineItem(this, 1)" title="Move down" aria-label="Move item down" ${i === allItems.length - 1 ? 'disabled' : ''}>&#8595;</button>
          <button type="button" class="remove-btn" onclick="removeLineItem(this)" aria-label="Remove item" ${i === 0 ? 'disabled' : ''}>&times;</button>
        </div>
      </td>
    `;

    const descRow = document.createElement('tr');
    descRow.dataset.itemIndex = i;
    descRow.className = 'item-row-desc';
    descRow.innerHTML = `
      <td colspan="3"><textarea class="item-description" placeholder="Description of work" required rows="1">${escapeHTML(item.description)}</textarea></td>
    `;

    tbody.appendChild(inputRow);
    tbody.appendChild(descRow);
  });

  updateTotals();
  updateReorderButtonsState();
  showToast(`Imported ${newItems.length} line item${newItems.length !== 1 ? 's' : ''}!`, 'success');
}

function attachLineItemListeners() {
  const tbody = document.getElementById('line-items-body');
  if (!tbody) return;
  tbody.addEventListener('input', (e) => {
    if (e.target.classList.contains('item-rate') || e.target.classList.contains('item-hours')) {
      const row = e.target.closest('tr');
      const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
      const hours = parseFloat(row.querySelector('.item-hours').value) || 0;
      row.querySelector('.amount-cell').textContent = formatCurrency(rate * hours, (formCachedSettings || {}).currency);
      updateTotals();
    }
  });
  tbody.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      const row = e.target.closest('tr');
      const itemIndex = parseInt(row.dataset.itemIndex, 10);
      const allIndices = Array.from(tbody.querySelectorAll('tr[data-item-index]')).map(r => parseInt(r.dataset.itemIndex, 10));
      const maxIndex = Math.max(...allIndices);
      if (itemIndex === maxIndex) {
        e.preventDefault();
        addLineItem();
      }
    }
  });
}

function attachFormListeners() {
  attachLineItemListeners();
  
  const form = document.getElementById('invoice-form');
  if (!form) return;
  form.addEventListener('input', () => {
    setFormDirty();
    debouncedUpdatePreview();
  });
  form.addEventListener('change', () => {
    setFormDirty();
    debouncedUpdatePreview();
  });
  
  document.querySelectorAll('#form-template-grid .template-option').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('#form-template-grid .template-option').forEach(t => t.classList.remove('selected'));
      el.classList.add('selected');
      document.getElementById('invoice-template').value = el.dataset.template;
      setFormDirty();
      debouncedUpdatePreview();
    });
  });
  
  document.querySelectorAll('#form-color-grid .color-option').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('#form-color-grid .color-option').forEach(c => c.classList.remove('selected'));
      document.querySelectorAll('#form-color-grid .color-option-custom').forEach(c => c.classList.remove('selected'));
      el.classList.add('selected');
      document.getElementById('invoice-accent-color').value = el.dataset.color;
      setFormDirty();
      debouncedUpdatePreview();
    });
  });
  
  const customPicker = document.getElementById('form-custom-color');
  if (customPicker) {
    customPicker.addEventListener('input', (e) => {
      document.querySelectorAll('#form-color-grid .color-option').forEach(c => c.classList.remove('selected'));
      document.querySelectorAll('#form-color-grid .color-option-custom').forEach(c => c.classList.add('selected'));
      document.getElementById('invoice-accent-color').value = e.target.value;
      setFormDirty();
      debouncedUpdatePreview();
    });
  }
}

const debouncedUpdatePreview = debounce(updatePreview, 150);

function updatePreview() {
  if (!formCachedSettings) return;
  const merged = { ...formCachedSettings };
  
  const templateEl = document.getElementById('invoice-template');
  const accentEl = document.getElementById('invoice-accent-color');
  if (templateEl) merged.template = templateEl.value;
  if (accentEl) merged.accentColor = accentEl.value;
  
  const inputRows = document.querySelectorAll('#line-items-body tr.item-row-inputs');
  const lineItems = [];
  inputRows.forEach(row => {
    const descRow = row.nextElementSibling;
    lineItems.push({
      date: row.querySelector('.item-date')?.value || '',
      description: descRow?.querySelector('.item-description')?.value || '',
      rate: row.querySelector('.item-rate')?.value || '',
      hours: row.querySelector('.item-hours')?.value || ''
    });
  });

  const invoiceData = {
    number: document.getElementById('invoice-number').value,
    date: document.getElementById('invoice-date').value,
    dueDate: document.getElementById('invoice-due-date').value,
    clientName: document.getElementById('client-name').value,
    clientEmail: document.getElementById('client-email').value,
    clientAddress: document.getElementById('client-address').value,
    lineItems,
    notes: document.getElementById('invoice-notes').value
  };
  
  const previewEl = document.getElementById('live-preview');
  if (previewEl) previewEl.innerHTML = renderLivePreview(merged, invoiceData);
  const labelEl = document.getElementById('preview-template-label');
  if (labelEl) {
    const tpl = TEMPLATES.find(t => t.id === merged.template);
    labelEl.textContent = tpl ? tpl.name : merged.template;
  }
  const totalsEl = document.getElementById('totals');
  if (totalsEl) totalsEl.innerHTML = renderTotalsHTML(lineItems, merged);
  
  const mobileEl = document.getElementById('mobile-preview-content');
  if (mobileEl) mobileEl.innerHTML = renderLivePreview(merged, invoiceData);
}

function updateTotals() {
  debouncedUpdatePreview();
}

async function handleFormSubmit(isDraft) {
  clearFormDirty();
  const editId = document.getElementById('edit-id').value;
  const number = document.getElementById('invoice-number').value;
  const date = document.getElementById('invoice-date').value;
  const dueDate = document.getElementById('invoice-due-date').value;
  const clientName = document.getElementById('client-name').value;
  const clientEmail = document.getElementById('client-email').value;
  const clientAddress = document.getElementById('client-address').value;
  const notes = document.getElementById('invoice-notes').value;
  const status = document.getElementById('invoice-status').value;
  
  const inputRows = document.querySelectorAll('#line-items-body tr.item-row-inputs');
  const lineItems = [];
  inputRows.forEach(row => {
    const descRow = row.nextElementSibling;
    lineItems.push({
      date: row.querySelector('.item-date')?.value || '',
      description: descRow?.querySelector('.item-description')?.value || '',
      rate: row.querySelector('.item-rate')?.value || '',
      hours: row.querySelector('.item-hours')?.value || ''
    });
  });

  const invoice = {
    id: editId || Date.now().toString(),
    number,
    date,
    dueDate,
    clientName,
    clientEmail,
    clientAddress,
    lineItems,
    notes,
    template: document.getElementById('invoice-template')?.value || undefined,
    accentColor: document.getElementById('invoice-accent-color')?.value || undefined,
    status: status || 'draft',
    createdAt: editId ? (await getInvoice(editId)).createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  try {
    const btn = document.getElementById('btn-generate-pdf');
    const draftBtn = document.getElementById('btn-save-draft');
    const visualBtn = document.getElementById('btn-visual-pdf');
    if (btn) { btn.disabled = true; btn.textContent = 'Generating...'; }
    if (draftBtn) draftBtn.disabled = true;
    if (visualBtn) visualBtn.disabled = true;

    await saveInvoice(invoice);
    
    if (!isDraft) {
      const settings = await getAllSettings();
      const defaults = getDefaultSettings();
      const mergedSettings = { ...defaults, ...settings };
      if (invoice.template) mergedSettings.template = invoice.template;
      if (invoice.accentColor) mergedSettings.accentColor = invoice.accentColor;
      await generatePDF(invoice, mergedSettings);
      showToast('Invoice saved and PDF downloaded!', 'success');
    } else {
      showToast('Draft saved!', 'success');
    }
    
    window.location.hash = '#/history';
  } catch (err) {
    showToast('Error saving invoice. Please try again.', 'error');
    console.error(err);
  }
}

function saveDraft() {
  handleFormSubmit(true);
}

async function saveAndDownloadVisualPDF() {
  const visualBtn = document.getElementById('btn-visual-pdf');
  if (visualBtn) { visualBtn.disabled = true; visualBtn.textContent = 'Generating...'; }
  const previewEl = document.getElementById('live-preview');
  if (!previewEl) {
    showToast('Preview not found.', 'error');
    if (visualBtn) { visualBtn.disabled = false; visualBtn.textContent = 'Visual PDF'; }
    return;
  }
  const invoiceWrapper = previewEl.querySelector('.preview-invoice');
  if (!invoiceWrapper) {
    showToast('Preview not rendered yet.', 'error');
    if (visualBtn) { visualBtn.disabled = false; visualBtn.textContent = 'Visual PDF'; }
    return;
  }
  const invoiceNumber = document.getElementById('invoice-number')?.value || 'invoice';
  const prevId = invoiceWrapper.id;
  invoiceWrapper.id = 'visual-pdf-capture';
  try {
    await generatePDFFromHTML('visual-pdf-capture', invoiceNumber);
    showToast('Visual PDF downloaded!', 'success');
  } catch (err) {
    showToast('Error generating visual PDF.', 'error');
    console.error(err);
  } finally {
    invoiceWrapper.id = prevId || '';
    if (visualBtn) { visualBtn.disabled = false; visualBtn.textContent = 'Visual PDF'; }
  }
}

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${escapeHTML(message)}</span><div class="toast-progress"></div>`;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, 2700);
}

function toggleMobilePreview() {
  const overlay = document.getElementById('mobile-preview-overlay');
  if (overlay) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    updatePreview();
  }
}

function closeMobilePreview(e) {
  if (e && e.target !== e.currentTarget) return;
  const overlay = document.getElementById('mobile-preview-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function showConfirmModal(message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-modal">
      <p>${escapeHTML(message)}</p>
      <div class="confirm-actions">
        <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
        <button class="btn btn-danger" id="confirm-ok">Delete</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  
  overlay.querySelector('#confirm-cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#confirm-ok').addEventListener('click', () => {
    overlay.remove();
    onConfirm();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function fillClientFields(client) {
  document.getElementById('client-name').value = client.name || '';
  document.getElementById('client-email').value = client.email || '';
  document.getElementById('client-address').value = client.address || '';
  updatePreview();
}

async function setupClientDropdown(editId, invoice) {
  const clientSelect = document.getElementById('client-select');
  if (!clientSelect) return;

  try {
    const clients = await getAllClients();

    // Clear existing options except the default one
    clientSelect.innerHTML = '<option value="">-- Select a client --</option>';

    // Add client options
    clients.forEach(client => {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = escapeHTML(client.name);
      clientSelect.appendChild(option);
    });

    // Determine which client to auto-select
    let selectedClient = null;

    if (editId) {
      // Editing: match by saved invoice client name
      selectedClient = clients.find(c => c.name === invoice?.clientName) || null;
    } else {
      // New invoice: use default client from settings
      const defaultId = formCachedSettings?.defaultClient;
      if (defaultId) {
        selectedClient = clients.find(c => String(c.id) === String(defaultId)) || null;
      }
    }

    if (selectedClient) {
      clientSelect.value = selectedClient.id;
      fillClientFields(selectedClient);
    }

    // Add event listener for client selection — uses cached list, no extra API call
    clientSelect.addEventListener('change', (e) => {
      const clientId = e.target.value;
      if (!clientId) {
        document.getElementById('client-name').value = '';
        document.getElementById('client-email').value = '';
        document.getElementById('client-address').value = '';
        updatePreview();
        return;
      }
      const client = clients.find(c => String(c.id) === String(clientId));
      if (client) {
        fillClientFields(client);
      }
    });
  } catch (err) {
    console.error('Error loading clients:', err);
  }
}

let _formKeyHandler = null;

function setupFormKeyboardShortcuts() {
  if (_formKeyHandler) {
    document.removeEventListener('keydown', _formKeyHandler);
    _formKeyHandler = null;
  }
  _formKeyHandler = function formKeyHandler(e) {
    if (!document.getElementById('invoice-form')) {
      document.removeEventListener('keydown', _formKeyHandler);
      _formKeyHandler = null;
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveDraft();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleFormSubmit(false);
    }
  };
  document.addEventListener('keydown', _formKeyHandler);
}

function renderLivePreview(settings, invoice) {
  const { subtotal, tps, tvq, total } = calculateTotals(invoice.lineItems, settings);
  const accent = settings.accentColor;
  const companyName = settings.companyName || 'Your Company';

  // --- Progiciels template: custom layout ---
  if (settings.template === 'progiciels') {
    return renderProgicielsPreview(settings, invoice, accent, companyName, subtotal, tps, tvq, total);
  }

  const lineItemsHTML = invoice.lineItems.length > 0 && invoice.lineItems.some(i => i.description) ?
    invoice.lineItems.map((item, i) => {
      const amount = (parseFloat(item.rate) || 0) * (parseFloat(item.hours) || 0);
      const bg = i % 2 === 0 ? '' : `style="background:#f8f8f8;"`;
      const descHtml = escapeHTML(item.description).replace(/\n/g, '<br>');
      const dateLabel = item.date ? `<span style="font-size:0.75rem;color:var(--text-secondary);white-space:nowrap;">${escapeHTML(formatLineItemDate(item.date, settings.dateFormat || 'default'))}</span>` : '';
      return `<tr ${bg}>
        <td>${dateLabel}${dateLabel ? '<br>' : ''}${descHtml || '—'}</td>
        <td>${item.rate ? formatCurrency(parseFloat(item.rate), settings.currency) : '—'}</td>
        <td>${escapeHTML(item.hours) || '—'}</td>
        <td class="preview-amount">${amount > 0 ? formatCurrency(amount, settings.currency) : '—'}</td>
      </tr>`;
    }).join('') :
    `<tr style="color:#aaa;"><td colspan="4" style="text-align:center;padding:1rem;">Add line items to see preview</td></tr>`;

  const totalsHTML = `
    <div class="preview-totals">
      <div class="preview-total-row"><span>${escapeHTML(settings.labelSubtotal || 'Subtotal')}</span><span>${formatCurrency(subtotal, settings.currency)}</span></div>
      ${settings.taxTPS ? `<div class="preview-total-row"><span>${escapeHTML(settings.labelTPS || 'TPS')} (${(settings.tpsRate * 100).toFixed(1)}%)</span><span>${formatCurrency(tps, settings.currency)}</span></div>` : ''}
      ${settings.taxTVQ ? `<div class="preview-total-row"><span>${escapeHTML(settings.labelTVQ || 'TVQ')} (${(settings.tvqRate * 100).toFixed(2)}%)</span><span>${formatCurrency(tvq, settings.currency)}</span></div>` : ''}
      <div class="preview-total-row preview-total-final">
        <span>${escapeHTML(settings.labelTotal || 'Total')}</span><span style="color:${accent};">${formatCurrency(total, settings.currency)}</span>
      </div>
    </div>
  `;

  const headerStyle = getTemplatePreviewStyle(settings.template, accent, companyName, invoice, settings);
  const tplClass = `preview-template-${settings.template || 'modern'}`;

  return `
    <div class="preview-invoice ${tplClass}" style="--accent:${accent}; --accent-light:${accent}10; --accent-med:${accent}20;">
      ${headerStyle}

      <div class="preview-meta">
        <div class="preview-meta-left">
          ${settings.logo ? `<img src="${safeLogoSrc(settings.logo)}" class="preview-logo">` : ''}
          <div class="preview-company" style="color:${accent};">${escapeHTML(companyName)}</div>
          ${settings.companyAddress ? `<div class="preview-info">${escapeHTML(settings.companyAddress)}</div>` : ''}
          ${settings.companyEmail ? `<div class="preview-info">${escapeHTML(settings.companyEmail)}</div>` : ''}
          ${settings.companyPhone ? `<div class="preview-info">${escapeHTML(settings.companyPhone)}</div>` : ''}
          ${settings.companyWebsite ? `<div class="preview-info">${escapeHTML(settings.companyWebsite)}</div>` : ''}
        </div>
        <div class="preview-meta-right">
          <div class="preview-invoice-title">${escapeHTML(settings.labelInvoice || 'INVOICE')}</div>
          <div class="preview-info">${escapeHTML(settings.labelInvoiceNumber || 'Invoice #')} ${escapeHTML(invoice.number || '—')}</div>
          <div class="preview-info">${escapeHTML(settings.labelDate || 'Date')}: ${escapeHTML(invoice.date ? formatDate(invoice.date) : '—')}</div>
          <div class="preview-info">${escapeHTML(settings.labelDueDate || 'Due')}: ${escapeHTML(invoice.dueDate ? formatDate(invoice.dueDate) : '—')}</div>
        </div>
      </div>

      <div class="preview-client">
        <div class="preview-client-label" style="color:${accent};">${escapeHTML(settings.labelBillTo || 'Bill To:')}</div>
        <div class="preview-client-name">${escapeHTML(invoice.clientName) || '—'}</div>
        ${invoice.clientAddress ? `<div class="preview-info">${escapeHTML(invoice.clientAddress)}</div>` : ''}
        ${invoice.clientEmail ? `<div class="preview-info">${escapeHTML(invoice.clientEmail)}</div>` : ''}
      </div>

      <table class="preview-table">
        <thead>
          <tr style="background:${accent};">
            <th style="width:${settings.colDescription || 35}%">${escapeHTML(settings.labelDescription || 'Description')}</th>
            <th style="width:${settings.colRate || 15}%">${escapeHTML(settings.labelRate || 'Rate')}</th>
            <th style="width:${settings.colHours || 15}%">${escapeHTML(settings.labelHours || 'Hours')}</th>
            <th style="width:${settings.colAmount || 20}%">${escapeHTML(settings.labelAmount || 'Amount')}</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHTML}
        </tbody>
      </table>

      ${totalsHTML}

      ${invoice.notes ? `
        <div class="preview-notes">
          <div class="preview-notes-label" style="color:${accent};">${escapeHTML(settings.labelNotes || 'Notes')}</div>
          <div class="preview-info">${escapeHTML(invoice.notes)}</div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderProgicielsPreview(settings, invoice, accent, companyName, subtotal, tps, tvq, total) {
  const titleSpaced = (settings.labelInvoice || 'FACTURE').split('').join(' ');
  const labelInvoice = settings.labelInvoice || 'FACTURE';
  const labelInvoiceNum = settings.labelInvoiceNumber || 'Facture #';
  const labelDate = settings.labelDate || 'Date';
  const labelDueDate = settings.labelDueDate || 'Échéance';
  const labelTotal = settings.labelTotal || 'TOTAL';
  const labelSubtotal = settings.labelSubtotal || 'SOUS-TOTAL';
  const labelBillTo = settings.labelBillTo || 'FACTURÉ À:';
  const labelDesc = settings.labelDescription || 'Description';
  const labelHours = settings.labelHours || "Nombre d'heures";
  const labelRate = settings.labelRate || 'Taux';
  const labelAmount = settings.labelAmount || 'Montant';
  const labelNotes = settings.labelNotes || 'NOTES';

  // Line items (columns: Description | Hours | Rate | Amount)
  const lineItemsHTML = invoice.lineItems.length > 0 && invoice.lineItems.some(i => i.description) ?
    invoice.lineItems.map((item, i) => {
      const amount = (parseFloat(item.rate) || 0) * (parseFloat(item.hours) || 0);
      const bg = i % 2 === 0 ? '' : `style="background:#f8f8f8;"`;
      const descHtml = escapeHTML(item.description).replace(/\n/g, '<br>');
      const dateLabel = item.date ? `<span style="font-size:0.75rem;color:var(--text-secondary);white-space:nowrap;">${escapeHTML(formatLineItemDate(item.date, settings.dateFormat || 'default'))}</span>` : '';
      return `<tr ${bg}>
        <td>${dateLabel}${dateLabel ? '<br>' : ''}${descHtml || '—'}</td>
        <td style="text-align:center;">${escapeHTML(item.hours) || '—'}</td>
        <td style="text-align:center;">${item.rate ? formatCurrency(parseFloat(item.rate), settings.currency) : '—'}</td>
        <td class="preview-amount">${amount > 0 ? formatCurrency(amount, settings.currency) : '—'}</td>
      </tr>`;
    }).join('') :
    `<tr style="color:#aaa;"><td colspan="4" style="text-align:center;padding:1rem;">Add line items to see preview</td></tr>`;

  // Notes with ">" prefix
  const notesHTML = invoice.notes ? `
    <div class="preview-notes">
      <div class="preview-notes-label" style="color:#111;">${escapeHTML(labelNotes)}</div>
      ${invoice.notes.split('\n').map(line => `<div class="preview-info"><span style="color:#999;">&gt;</span> ${escapeHTML(line)}</div>`).join('')}
    </div>
  ` : '';

  return `
    <div class="preview-invoice preview-template-progiciels" style="--accent:${accent}; --accent-light:${accent}10; --accent-med:${accent}20;">
      <!-- Left sidebar -->
      <div class="preview-progiciels-sidebar" style="background:${accent};"></div>

      <!-- Centered title -->
      <div class="preview-progiciels-title" style="color:#000;">${escapeHTML(titleSpaced)}</div>
      <div class="preview-progiciels-title-line" style="background:#888;"></div>

      <!-- Two-column header: company left, client box right -->
      <div class="preview-meta" style="align-items:flex-start;">
        <div class="preview-meta-left" style="color:#1c252c;">
          ${settings.logo ? `<img src="${safeLogoSrc(settings.logo)}" class="preview-logo">` : ''}
          <div class="preview-company" style="color:#1c252c;font-size:1.1rem;">${escapeHTML(companyName)}</div>
          ${settings.companyPhone ? `<div class="preview-info">${escapeHTML(settings.companyPhone)}</div>` : ''}
          ${settings.companyEmail ? `<div class="preview-info">${escapeHTML(settings.companyEmail)}</div>` : ''}
          ${settings.companyWebsite ? `<div class="preview-info">${escapeHTML(settings.companyWebsite)}</div>` : ''}
          ${settings.companyAddress ? `<div class="preview-info">${escapeHTML(settings.companyAddress)}</div>` : ''}
        </div>
        <div class="preview-progiciels-client-box" style="background:${hexToRgba(accent, 0.12)};border-radius:4px;padding:0.6rem 0.8rem;">
          <div class="preview-client-label" style="color:${accent};font-size:0.7rem;font-weight:700;">${escapeHTML(labelBillTo)}</div>
          <div class="preview-client-name" style="font-size:0.95rem;">${escapeHTML(invoice.clientName) || '—'}</div>
          ${invoice.clientEmail ? `<div class="preview-info" style="font-size:0.7rem;">${escapeHTML(invoice.clientEmail)}</div>` : ''}
          ${invoice.clientAddress ? `<div class="preview-info" style="font-size:0.7rem;">${escapeHTML(invoice.clientAddress)}</div>` : ''}
        </div>
      </div>

      <!-- Details bar -->
      <div class="preview-progiciels-details-bar">
        <div class="preview-progiciels-details-left">
          <div class="preview-progiciels-detail-item">
            <span class="preview-progiciels-detail-label">${escapeHTML(labelInvoiceNum)}:</span>
            <span class="preview-progiciels-detail-value">${escapeHTML(invoice.number || '—')}</span>
          </div>
          <div class="preview-progiciels-detail-item">
            <span class="preview-progiciels-detail-label">${escapeHTML(labelDate)}:</span>
            <span class="preview-progiciels-detail-value">${escapeHTML(invoice.date ? formatDate(invoice.date) : '—')}</span>
          </div>
          <div class="preview-progiciels-detail-item">
            <span class="preview-progiciels-detail-label">${escapeHTML(labelDueDate)}:</span>
            <span class="preview-progiciels-detail-value">${escapeHTML(invoice.dueDate ? formatDate(invoice.dueDate) : '—')}</span>
          </div>
        </div>
        <div class="preview-progiciels-amount-box" style="background:${hexToRgba(accent, 0.12)};border-radius:4px;">
          <span class="preview-progiciels-detail-label">${escapeHTML(labelTotal)}:</span>
          <span class="preview-progiciels-detail-value" style="color:${accent};font-weight:700;">${formatCurrency(total, settings.currency)}</span>
        </div>
      </div>

      <!-- Table -->
      <table class="preview-table">
        <thead>
          <tr style="background:none;">
            <th style="width:${settings.colDescription || 50}%;color:#111;">${escapeHTML(labelDesc)}</th>
            <th style="width:${settings.colHours || 15}%;color:#111;text-align:center;">${escapeHTML(labelHours)}</th>
            <th style="width:${settings.colRate || 15}%;color:#111;text-align:center;">${escapeHTML(labelRate)}</th>
            <th style="width:${settings.colAmount || 20}%;color:#111;text-align:right;">${escapeHTML(labelAmount)}</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHTML}
        </tbody>
      </table>

      <!-- Totals -->
      <div class="preview-totals">
        <div class="preview-total-row"><span style="font-weight:700;">${escapeHTML(labelSubtotal)}</span><span>${formatCurrency(subtotal, settings.currency)}</span></div>
        ${settings.taxTPS ? `<div class="preview-total-row"><span>${escapeHTML(settings.labelTPS || 'TPS')} (${(settings.tpsRate * 100).toFixed(1)}%)</span><span>${formatCurrency(tps, settings.currency)}</span></div>` : ''}
        ${settings.taxTVQ ? `<div class="preview-total-row"><span>${escapeHTML(settings.labelTVQ || 'TVQ')} (${(settings.tvqRate * 100).toFixed(2)}%)</span><span>${formatCurrency(tvq, settings.currency)}</span></div>` : ''}
        <div class="preview-total-row preview-total-final">
          <span style="font-weight:700;">${escapeHTML(labelTotal)}</span><span style="color:${accent};font-weight:700;">${formatCurrency(total, settings.currency)}</span>
        </div>
      </div>

      ${notesHTML}
    </div>
  `;
}

function getTemplatePreviewStyle(template, accent, companyName, invoice, settings) {
  const labelInvoice = settings?.labelInvoice || 'INVOICE';
  const labelInvoiceNum = settings?.labelInvoiceNumber || 'Invoice #';
  const invNum = escapeHTML(invoice.number || '');
  const comp = escapeHTML(companyName);
  const a = accent;

  switch (template) {
    case 'modern':
      return `<div class="preview-accent-bar preview-rounded-bottom" style="background:${a};"></div>`;

    case 'bold':
      return `<div class="preview-bold-header preview-rounded" style="background:${a};">
        <span class="preview-bold-title">${comp}</span>
        <span class="preview-bold-num">${escapeHTML(labelInvoiceNum)} ${invNum}</span>
      </div>`;

    case 'clean':
      return `<div class="preview-clean-wrap">
        <div class="preview-clean-dot" style="background:${a};"></div>
      </div>`;

    case 'elegant':
      return `<div class="preview-elegant-wrap">
        <div class="preview-elegant-line" style="background:${a};"></div>
        <div class="preview-elegant-diamond" style="background:${a};"></div>
        <div class="preview-elegant-line" style="background:${a};"></div>
      </div>`;

    case 'compact':
      return `<div class="preview-compact-bar" style="border-bottom-color:${a};">
        <span>${comp}</span>
        <span class="preview-compact-pill" style="background:${a};">${escapeHTML(labelInvoice)}</span>
      </div>`;

    case 'sidebar':
      return `<div class="preview-sidebar-bar" style="background:${a};">
        <div class="preview-sidebar-text">${comp.charAt(0)}</div>
      </div>`;

    case 'stripe':
      return `<div class="preview-stripe-wrap">
        <div class="preview-stripe-bar" style="background:${a};"></div>
        <div class="preview-stripe-thin" style="background:${a};"></div>
      </div>`;

    case 'corner':
      return `<div class="preview-corner-triangle" style="background:${a};"></div>
      <div class="preview-corner-triangle-secondary" style="background:${a}33;"></div>`;

    case 'bordered':
      return `<div class="preview-border-frame" style="border-color:${a};">
        <div class="preview-corner-dot" style="background:${a};top:10px;left:10px;"></div>
        <div class="preview-corner-dot" style="background:${a};top:10px;right:10px;"></div>
        <div class="preview-corner-dot" style="background:${a};bottom:10px;left:10px;"></div>
        <div class="preview-corner-dot" style="background:${a};bottom:10px;right:10px;"></div>
      </div>`;

    case 'subtle':
      return `<div class="preview-subtle-wrap">
        <div class="preview-subtle-underline" style="background:${a};"></div>
        <div class="preview-subtle-fade" style="background:linear-gradient(to right,${a},transparent);"></div>
      </div>`;

    case 'grid':
      return `<div class="preview-grid-header" style="background:${a};"><span>${comp}</span></div>`;

    case 'classic':
      return `<div class="preview-classic-wrap">
        <div class="preview-classic-line" style="background:${a};"></div>
        <div class="preview-classic-line-thin" style="background:${a};"></div>
      </div>`;

    case 'executive':
      return `<div class="preview-executive-bar" style="background:${a};"></div>`;

    case 'minimal':
      return `<div class="preview-minimal-block" style="background:${a};"></div>`;

    case 'divider':
      return `<div class="preview-divider-line" style="background:${a};"></div>
      <div class="preview-divider-line-thin" style="background:${a};"></div>`;

    case 'dash':
      return `<div class="preview-dash-bar" style="background:${a};"></div>`;

    case 'swiss':
      return `<div class="preview-swiss-square" style="background:${a};"></div>
      <div class="preview-swiss-line" style="background:${a};"></div>`;

    case 'progiciels':
      return `<div class="preview-progiciels-sidebar" style="background:${a};"></div>
<div class="preview-progiciels-title" style="color:#000;">${escapeHTML(labelInvoice.split('').join(' '))}</div>
<div class="preview-progiciels-title-line" style="background:#888;"></div>`;

    default:
      return `<div class="preview-accent-bar preview-rounded-bottom" style="background:${a};"></div>`;
  }
}
