async function renderInvoiceForm(editId = null) {
  const app = document.getElementById('app');
  showLoading();
  
  const settings = await getAllSettings();
  const defaults = getDefaultSettings();
  const mergedSettings = { ...defaults, ...settings };
  
  let invoice = null;
  if (editId) {
    invoice = await getInvoice(editId);
  }
  
  const nextNum = editId ? { num: 0 } : await getNextInvoiceNumber();
  const formattedNum = editId ? invoice.number : await formatInvoiceNumber(nextNum.num);
  const today = new Date().toISOString().split('T')[0];
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const lineItems = invoice ? invoice.lineItems : [{ description: '', rate: '', hours: '' }];
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
            <div class="card-title">Line Items</div>
            <div class="table-wrapper">
              <table class="line-items" id="line-items-table">
                <thead>
                  <tr>
                    <th style="width: 40%;">${escapeHTML(mergedSettings.labelDescription || 'Description')}</th>
                    <th style="width: 15%;">${escapeHTML(mergedSettings.labelRate || 'Rate')} (${currencySymbol})</th>
                    <th style="width: 15%;">${escapeHTML(mergedSettings.labelHours || 'Hours')}</th>
                    <th style="width: 20%;">${escapeHTML(mergedSettings.labelAmount || 'Amount')}</th>
                    <th style="width: 10%;"></th>
                  </tr>
                </thead>
                <tbody id="line-items-body">
                  ${lineItems.map((item, i) => renderLineItemRow(item, i, mergedSettings)).join('')}
                </tbody>
              </table>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="addLineItem()" style="margin-top: 1rem;">+ Add Item</button>
            
            <div class="totals" id="totals">
              ${renderTotalsHTML(lineItems, mergedSettings)}
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
            <span class="preview-template-label" id="preview-template-label">${escapeHTML(mergedSettings.template)}</span>
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
}

function renderLineItemRow(item, index, settings) {
  const amount = (parseFloat(item.rate) || 0) * (parseFloat(item.hours) || 0);
  return `
    <tr data-index="${index}">
      <td><input type="text" class="item-description" value="${escapeHTML(item.description)}" placeholder="Description of work" required></td>
      <td><input type="number" class="item-rate" value="${escapeHTML(String(item.rate))}" placeholder="0.00" step="0.01" min="0" required></td>
      <td><input type="number" class="item-hours" value="${escapeHTML(String(item.hours))}" placeholder="0" step="0.5" min="0" required></td>
      <td class="amount-cell">${formatCurrency(amount, settings.currency)}</td>
      <td><button type="button" class="remove-btn" onclick="removeLineItem(this)" ${index === 0 ? 'disabled' : ''}>&times;</button></td>
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

function addLineItem() {
  const tbody = document.getElementById('line-items-body');
  const index = tbody.children.length;
  const row = document.createElement('tr');
  row.dataset.index = index;
  row.innerHTML = `
    <td><input type="text" class="item-description" placeholder="Description of work" required></td>
    <td><input type="number" class="item-rate" placeholder="0.00" step="0.01" min="0" required></td>
    <td><input type="number" class="item-hours" placeholder="0" step="0.5" min="0" required></td>
    <td class="amount-cell">${formatCurrency(0)}</td>
    <td><button type="button" class="remove-btn" onclick="removeLineItem(this)">&times;</button></td>
  `;
  tbody.appendChild(row);
}

function removeLineItem(btn) {
  const tbody = document.getElementById('line-items-body');
  if (tbody.children.length > 1) {
    btn.closest('tr').remove();
    updateTotals();
  }
}

function attachLineItemListeners() {
  const tbody = document.getElementById('line-items-body');
  if (!tbody) return;
  tbody.addEventListener('input', (e) => {
    if (e.target.classList.contains('item-rate') || e.target.classList.contains('item-hours')) {
      const row = e.target.closest('tr');
      const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
      const hours = parseFloat(row.querySelector('.item-hours').value) || 0;
      row.querySelector('.amount-cell').textContent = formatCurrency(rate * hours);
      updateTotals();
    }
  });
}

function attachFormListeners() {
  attachLineItemListeners();
  
  const form = document.getElementById('invoice-form');
  if (!form) return;
  form.addEventListener('input', () => updatePreview());
  form.addEventListener('change', () => updatePreview());
}

function updatePreview() {
  getAllSettings().then(settings => {
    const defaults = getDefaultSettings();
    const merged = { ...defaults, ...settings };
    
    const rows = document.querySelectorAll('#line-items-body tr');
    const lineItems = [];
    rows.forEach(row => {
      lineItems.push({
        description: row.querySelector('.item-description').value,
        rate: row.querySelector('.item-rate').value,
        hours: row.querySelector('.item-hours').value
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
    if (labelEl) labelEl.textContent = merged.template;
    const totalsEl = document.getElementById('totals');
    if (totalsEl) totalsEl.innerHTML = renderTotalsHTML(lineItems, merged);
    
    const mobileEl = document.getElementById('mobile-preview-content');
    if (mobileEl) mobileEl.innerHTML = renderLivePreview(merged, invoiceData);
  });
}

function updateTotals() {
  updatePreview();
}

async function handleFormSubmit(isDraft) {
  const editId = document.getElementById('edit-id').value;
  const number = document.getElementById('invoice-number').value;
  const date = document.getElementById('invoice-date').value;
  const dueDate = document.getElementById('invoice-due-date').value;
  const clientName = document.getElementById('client-name').value;
  const clientEmail = document.getElementById('client-email').value;
  const clientAddress = document.getElementById('client-address').value;
  const notes = document.getElementById('invoice-notes').value;
  const status = document.getElementById('invoice-status').value;
  
  const rows = document.querySelectorAll('#line-items-body tr');
  const lineItems = [];
  rows.forEach(row => {
    lineItems.push({
      description: row.querySelector('.item-description').value,
      rate: row.querySelector('.item-rate').value,
      hours: row.querySelector('.item-hours').value
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

function renderLivePreview(settings, invoice) {
  const { subtotal, tps, tvq, total } = calculateTotals(invoice.lineItems, settings);
  const accent = settings.accentColor;
  const companyName = settings.companyName || 'Your Company';
  
  const lineItemsHTML = invoice.lineItems.length > 0 && invoice.lineItems.some(i => i.description) ? 
    invoice.lineItems.map((item, i) => {
      const amount = (parseFloat(item.rate) || 0) * (parseFloat(item.hours) || 0);
      const bg = i % 2 === 0 ? '' : `style="background:#f8f8f8;"`;
      return `<tr ${bg}>
        <td>${escapeHTML(item.description) || '—'}</td>
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
  
  return `
    <div class="preview-invoice" style="--accent:${accent}; --accent-light:${accent}10; --accent-med:${accent}20;">
      ${headerStyle}
      
      <div class="preview-meta">
        <div class="preview-meta-left">
          ${settings.logo ? `<img src="${settings.logo}" class="preview-logo">` : ''}
          <div class="preview-company" style="color:${accent};">${escapeHTML(companyName)}</div>
          ${settings.companyAddress ? `<div class="preview-info">${escapeHTML(settings.companyAddress)}</div>` : ''}
          ${settings.companyEmail ? `<div class="preview-info">${escapeHTML(settings.companyEmail)}</div>` : ''}
          ${settings.companyPhone ? `<div class="preview-info">${escapeHTML(settings.companyPhone)}</div>` : ''}
        </div>
        <div class="preview-meta-right">
          <div class="preview-invoice-title">${escapeHTML(settings.labelInvoice || 'INVOICE')}</div>
          <div class="preview-info">${escapeHTML(settings.labelInvoiceNumber || 'Invoice #')} ${escapeHTML(invoice.number || '—')}</div>
          <div class="preview-info">${escapeHTML(settings.labelDate || 'Date')}: ${escapeHTML(invoice.date || '—')}</div>
          <div class="preview-info">${escapeHTML(settings.labelDueDate || 'Due')}: ${escapeHTML(invoice.dueDate || '—')}</div>
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
            <th>${escapeHTML(settings.labelDescription || 'Description')}</th>
            <th>${escapeHTML(settings.labelRate || 'Rate')}</th>
            <th>${escapeHTML(settings.labelHours || 'Hours')}</th>
            <th>${escapeHTML(settings.labelAmount || 'Amount')}</th>
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
  
  switch (template) {
    case 'modern':
      return `<div class="preview-accent-bar" style="background:${accent};"></div>`;
    case 'bold':
      return `<div class="preview-bold-header" style="background:${accent};">
        <span class="preview-bold-title">${escapeHTML(companyName)}</span>
        <span class="preview-bold-num">${escapeHTML(labelInvoiceNum)} ${escapeHTML(invoice.number || '')}</span>
      </div>`;
    case 'sidebar':
      return `<div class="preview-sidebar-bar" style="background:${accent};"></div>`;
    case 'stripe':
      return `<div class="preview-stripe-bar" style="background:${accent};"></div>`;
    case 'corner':
      return `<div class="preview-corner-triangle" style="background:${accent};"></div>`;
    case 'bordered':
      return `<div class="preview-border-frame" style="border-color:${accent};"></div>`;
    case 'elegant':
      return `<div class="preview-elegant-line" style="background:${accent};"></div>`;
    case 'grid':
      return `<div class="preview-grid-header" style="background:${accent};"><span>${escapeHTML(companyName)}</span></div>`;
    case 'subtle':
      return `<div class="preview-subtle-underline" style="background:${accent};"></div>`;
    case 'clean':
      return `<div class="preview-clean-spacer"></div>`;
    case 'classic':
      return `<div class="preview-classic-line" style="background:${accent};"></div>`;
    case 'compact':
      return `<div class="preview-compact-bar" style="border-bottom-color:${accent};"><span>${escapeHTML(companyName)}</span><div class="preview-compact-meta"></div></div>`;
    default:
      return `<div class="preview-accent-bar" style="background:${accent};"></div>`;
  }
}