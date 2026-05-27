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
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
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
            <div class="form-grid">
              <div class="form-group">
                <label for="client-name">Client Name</label>
                <input type="text" id="client-name" value="${invoice ? escapeHTML(invoice.clientName) : ''}" required list="client-datalist">
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
            <div class="card-title">Line Items</div>
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
            <button type="submit" class="btn btn-primary">${editId ? 'Update & Generate PDF' : 'Save & Generate PDF'}</button>
            <button type="button" class="btn btn-secondary" onclick="saveDraft()">Save Draft</button>
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
  
  setupClientAutocomplete();
  setupFormKeyboardShortcuts();
  
  } catch (err) {
    console.error('Error rendering invoice form:', err);
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
          <button type="button" class="reorder-btn reorder-up" onclick="moveLineItem(this, -1)" title="Move up" ${index === 0 ? 'disabled' : ''}>&#8593;</button>
          <button type="button" class="reorder-btn reorder-down" onclick="moveLineItem(this, 1)" title="Move down" ${index === totalItems - 1 ? 'disabled' : ''}>&#8595;</button>
          <button type="button" class="remove-btn" onclick="removeLineItem(this)" ${index === 0 ? 'disabled' : ''}>&times;</button>
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
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const date = new Date(dateStr + 'T00:00:00');
  do {
    date.setDate(date.getDate() + 1);
  } while (date.getDay() === 0 || date.getDay() === 6);
  return date.toISOString().split('T')[0];
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
    : (document.getElementById('invoice-date')?.value || new Date().toISOString().split('T')[0]);

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
        <button type="button" class="reorder-btn reorder-up" onclick="moveLineItem(this, -1)" title="Move up" disabled>&#8593;</button>
        <button type="button" class="reorder-btn reorder-down" onclick="moveLineItem(this, 1)" title="Move down" disabled>&#8595;</button>
        <button type="button" class="remove-btn" onclick="removeLineItem(this)">&times;</button>
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
      ? (document.getElementById('invoice-date')?.value || new Date().toISOString().split('T')[0])
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
          <button type="button" class="reorder-btn reorder-up" onclick="moveLineItem(this, -1)" title="Move up" ${i === 0 ? 'disabled' : ''}>&#8593;</button>
          <button type="button" class="reorder-btn reorder-down" onclick="moveLineItem(this, 1)" title="Move down" ${i === allItems.length - 1 ? 'disabled' : ''}>&#8595;</button>
          <button type="button" class="remove-btn" onclick="removeLineItem(this)" ${i === 0 ? 'disabled' : ''}>&times;</button>
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
    await saveInvoice(invoice);
    
    if (!editId) {
      const nextNum = await getNextInvoiceNumber();
      await updateInvoiceNumberCounter(nextNum.num);
    }
    
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

async function setupClientAutocomplete() {
  const clients = await getClientList();
  if (!clients.length) return;
  let datalist = document.getElementById('client-datalist');
  if (!datalist) {
    datalist = document.createElement('datalist');
    datalist.id = 'client-datalist';
    document.body.appendChild(datalist);
  }
  datalist.innerHTML = clients.map(c => `<option value="${escapeHTML(c)}">`).join('');
}

function setupFormKeyboardShortcuts() {
  document.addEventListener('keydown', function formKeyHandler(e) {
    if (!document.getElementById('invoice-form')) {
      document.removeEventListener('keydown', formKeyHandler);
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
  });
}

function renderLivePreview(settings, invoice) {
  const { subtotal, tps, tvq, total } = calculateTotals(invoice.lineItems, settings);
  const accent = settings.accentColor;
  const companyName = settings.companyName || 'Your Company';
  
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
          ${settings.logo ? `<img src="${settings.logo}" class="preview-logo">` : ''}
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

    default:
      return `<div class="preview-accent-bar preview-rounded-bottom" style="background:${a};"></div>`;
  }
}
