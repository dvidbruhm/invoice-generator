async function renderSettings() {
  const app = document.getElementById('app');
  showLoading();
  
  try {
    const settings = await getAllSettings();
    const defaults = getDefaultSettings();
    const merged = { ...defaults, ...settings };
    
    app.innerHTML = `
    <div class="page-header">
      <h1>Settings</h1>
      <p>Configure your invoice defaults</p>
    </div>
    
    <form id="settings-form">
      <details class="card collapsible" open>
        <summary class="card-title collapsible-toggle">Your Information</summary>
        <div class="collapsible-content">
          <div class="form-grid">
            <div class="form-group">
              <label for="company-name">Company Name</label>
              <input type="text" id="company-name" value="${escapeHTML(merged.companyName)}" placeholder="Your Company Inc.">
            </div>
            <div class="form-group">
              <label for="company-email">Email</label>
              <input type="email" id="company-email" value="${escapeHTML(merged.companyEmail)}" placeholder="you@example.com">
            </div>
            <div class="form-group">
              <label for="company-phone">Phone</label>
              <input type="tel" id="company-phone" value="${escapeHTML(merged.companyPhone)}" placeholder="(555) 123-4567">
            </div>
            <div class="form-group">
              <label for="company-website">Website</label>
              <input type="url" id="company-website" value="${escapeHTML(merged.companyWebsite)}" placeholder="https://example.com">
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label for="company-address">Address</label>
              <input type="text" id="company-address" value="${escapeHTML(merged.companyAddress)}" placeholder="123 Main St, Montreal, QC H1A 1A1">
            </div>
          </div>
        </div>
      </details>
      
      <details class="card collapsible" open>
        <summary class="card-title collapsible-toggle">Logo</summary>
        <div class="collapsible-content">
          <div class="logo-upload">
            <div class="logo-preview" id="logo-preview">
              ${merged.logo ? `<img src="${merged.logo}" alt="Logo">` : '<span style="color: var(--text-secondary); font-size: 0.75rem;">No logo</span>'}
            </div>
            <div>
              <input type="file" id="logo-upload" accept="image/*" style="display: none;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('logo-upload').click()">Upload Logo</button>
              ${merged.logo ? '<button type="button" class="btn btn-secondary btn-sm" onclick="removeLogo()" style="margin-left: 0.5rem;">Remove</button>' : ''}
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.5rem;">PNG or JPG, max 2MB</p>
            </div>
          </div>
        </div>
      </details>
      
      <details class="card collapsible" open>
        <summary class="card-title collapsible-toggle">Invoice Template</summary>
        <div class="collapsible-content">
          <div class="template-grid" id="template-grid">
            ${TEMPLATES.map(t => `
              <div class="template-option ${merged.template === t.id ? 'selected' : ''}" data-template="${t.id}">
                <div class="template-preview-card">
                  ${getTemplatePreviewHTML(t.id, merged.accentColor)}
                </div>
                <div class="template-name">${escapeHTML(t.name)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </details>
      
      <details class="card collapsible" open>
        <summary class="card-title collapsible-toggle">Accent Color</summary>
        <div class="collapsible-content">
          <div class="color-grid" id="color-grid">
            ${ACCENT_COLORS.map(c => `
              <div class="color-option ${merged.accentColor === c.value ? 'selected' : ''}" 
                   data-color="${c.value}" 
                   style="background: ${c.value};" 
                   title="${escapeHTML(c.name)}"></div>
            `).join('')}
            <div class="color-option-custom">
              <input type="color" id="custom-color-picker" value="${merged.accentColor}" title="Choose custom color">
              <span>Custom</span>
            </div>
          </div>
        </div>
      </details>
      
      <details class="card collapsible" open>
        <summary class="card-title collapsible-toggle">Invoice Numbering & Currency</summary>
        <div class="collapsible-content">
          <div class="form-grid">
            <div class="form-group">
              <label for="invoice-prefix">Prefix</label>
              <input type="text" id="invoice-prefix" value="${escapeHTML(merged.invoicePrefix)}" placeholder="INV">
            </div>
            <div class="form-group">
              <label for="currency">Currency</label>
              <select id="currency">
                <option value="CAD" ${merged.currency === 'CAD' ? 'selected' : ''}>CAD ($)</option>
                <option value="USD" ${merged.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                <option value="EUR" ${merged.currency === 'EUR' ? 'selected' : ''}>EUR (&euro;)</option>
              </select>
            </div>
          </div>
        </div>
      </details>
      
      <details class="card collapsible" open>
        <summary class="card-title collapsible-toggle">Tax Settings</summary>
        <div class="collapsible-content">
          <div class="form-grid">
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="tax-tps" ${merged.taxTPS ? 'checked' : ''}>
                <span>Apply TPS (5%)</span>
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="tax-tvq" ${merged.taxTVQ ? 'checked' : ''}>
                <span>Apply TVQ (9.975%)</span>
              </label>
            </div>
          </div>
        </div>
      </details>
      
      <details class="card collapsible" open>
        <summary class="card-title collapsible-toggle">Line Item Date Display</summary>
        <div class="collapsible-content">
          <div class="form-grid">
            <div class="form-group">
              <label for="date-format">Date Format</label>
              <select id="date-format">
                <option value="default" ${merged.dateFormat === 'default' ? 'selected' : ''}>Default (May 27, 2026)</option>
                <option value="YYYY/MM/DD" ${merged.dateFormat === 'YYYY/MM/DD' ? 'selected' : ''}>YYYY/MM/DD</option>
                <option value="YYYY-MM-DD" ${merged.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
                <option value="DD-MM-YYYY" ${merged.dateFormat === 'DD-MM-YYYY' ? 'selected' : ''}>DD-MM-YYYY</option>
                <option value="DD/MM/YYYY" ${merged.dateFormat === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY</option>
                <option value="DD-MM" ${merged.dateFormat === 'DD-MM' ? 'selected' : ''}>DD-MM</option>
                <option value="DD/MM" ${merged.dateFormat === 'DD/MM' ? 'selected' : ''}>DD/MM</option>
              </select>
            </div>
            <div class="form-group">
              <label for="date-position">Date Position (PDF)</label>
              <select id="date-position">
                <option value="rotated" ${merged.datePosition === 'rotated' ? 'selected' : ''}>Rotated in left margin</option>
                <option value="inline" ${merged.datePosition === 'inline' ? 'selected' : ''}>Above description (inline)</option>
              </select>
            </div>
          </div>
        </div>
      </details>
      
      <details class="card collapsible" open>
        <summary class="card-title collapsible-toggle">Column Widths (%)</summary>
        <div class="collapsible-content">
          <div class="form-grid">
            <div class="form-group">
              <label for="col-description">Description</label>
              <input type="number" id="col-description" value="${escapeHTML(String(merged.colDescription))}" min="5" max="80" step="1">
            </div>
            <div class="form-group">
              <label for="col-rate">Rate</label>
              <input type="number" id="col-rate" value="${escapeHTML(String(merged.colRate))}" min="5" max="40" step="1">
            </div>
            <div class="form-group">
              <label for="col-hours">Hours</label>
              <input type="number" id="col-hours" value="${escapeHTML(String(merged.colHours))}" min="5" max="40" step="1">
            </div>
            <div class="form-group">
              <label for="col-amount">Amount</label>
              <input type="number" id="col-amount" value="${escapeHTML(String(merged.colAmount))}" min="5" max="40" step="1">
            </div>
          </div>
          <p style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.5rem;">Adjust the relative widths of the four line-item columns. The date and action columns stay fixed.</p>
        </div>
      </details>
      
      <details class="card collapsible" open>
        <summary class="card-title collapsible-toggle">Defaults</summary>
        <div class="collapsible-content">
          <div class="form-grid">
            <div class="form-group">
              <label for="payment-terms">Payment Terms</label>
              <input type="text" id="payment-terms" value="${escapeHTML(merged.paymentTerms)}" placeholder="Net 30">
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label for="default-notes">Default Notes</label>
              <textarea id="default-notes" rows="3" placeholder="Thank you for your business!">${escapeHTML(merged.notes || '')}</textarea>
            </div>
          </div>
        </div>
      </details>
      
      <details class="card collapsible">
        <summary class="card-title collapsible-toggle">Custom Labels</summary>
        <div class="collapsible-content">
          <div class="form-grid">
            <div class="form-group">
              <label for="label-invoice">Invoice Title</label>
              <input type="text" id="label-invoice" value="${escapeHTML(merged.labelInvoice)}" placeholder="INVOICE">
            </div>
            <div class="form-group">
              <label for="label-bill-to">Bill To Label</label>
              <input type="text" id="label-bill-to" value="${escapeHTML(merged.labelBillTo)}" placeholder="Bill To:">
            </div>
            <div class="form-group">
              <label for="label-invoice-number">Invoice Number Label</label>
              <input type="text" id="label-invoice-number" value="${escapeHTML(merged.labelInvoiceNumber)}" placeholder="Invoice #">
            </div>
            <div class="form-group">
              <label for="label-date">Date Label</label>
              <input type="text" id="label-date" value="${escapeHTML(merged.labelDate)}" placeholder="Date">
            </div>
            <div class="form-group">
              <label for="label-due-date">Due Date Label</label>
              <input type="text" id="label-due-date" value="${escapeHTML(merged.labelDueDate)}" placeholder="Due">
            </div>
            <div class="form-group">
              <label for="label-subtotal">Subtotal Label</label>
              <input type="text" id="label-subtotal" value="${escapeHTML(merged.labelSubtotal)}" placeholder="Subtotal">
            </div>
            <div class="form-group">
              <label for="label-total">Total Label</label>
              <input type="text" id="label-total" value="${escapeHTML(merged.labelTotal)}" placeholder="Total">
            </div>
            <div class="form-group">
              <label for="label-notes">Notes Label</label>
              <input type="text" id="label-notes" value="${escapeHTML(merged.labelNotes)}" placeholder="Notes">
            </div>
            <div class="form-group">
              <label for="label-payment-terms">Payment Terms Label</label>
              <input type="text" id="label-payment-terms" value="${escapeHTML(merged.labelPaymentTerms)}" placeholder="Payment Terms">
            </div>
            <div class="form-group">
              <label for="label-tps">TPS Label</label>
              <input type="text" id="label-tps" value="${escapeHTML(merged.labelTPS)}" placeholder="TPS">
            </div>
            <div class="form-group">
              <label for="label-tvq">TVQ Label</label>
              <input type="text" id="label-tvq" value="${escapeHTML(merged.labelTVQ)}" placeholder="TVQ">
            </div>
          </div>
          <div class="card-title" style="margin-top:1rem;">Column Headers</div>
          <div class="form-grid">
            <div class="form-group">
              <label for="label-description">Description Column</label>
              <input type="text" id="label-description" value="${escapeHTML(merged.labelDescription)}" placeholder="Description">
            </div>
            <div class="form-group">
              <label for="label-rate">Rate Column</label>
              <input type="text" id="label-rate" value="${escapeHTML(merged.labelRate)}" placeholder="Rate">
            </div>
            <div class="form-group">
              <label for="label-hours">Hours Column</label>
              <input type="text" id="label-hours" value="${escapeHTML(merged.labelHours)}" placeholder="Hours">
            </div>
            <div class="form-group">
              <label for="label-amount">Amount Column</label>
              <input type="text" id="label-amount" value="${escapeHTML(merged.labelAmount)}" placeholder="Amount">
            </div>
          </div>
        </div>
      </details>
      
      <div class="btn-group">
        <button type="submit" class="btn btn-primary">Save Settings</button>
        <button type="button" class="btn btn-danger" onclick="resetSettings()">Reset to Defaults</button>
      </div>
    </form>
  `;
  
  document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveSettingsForm();
  });
  
  document.querySelectorAll('.template-option').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.template-option').forEach(t => t.classList.remove('selected'));
      el.classList.add('selected');
    });
  });
  
  document.querySelectorAll('.color-option').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.color-option').forEach(c => c.classList.remove('selected'));
      document.querySelectorAll('.color-option-custom').forEach(c => c.classList.remove('selected'));
      el.classList.add('selected');
    });
  });
  
  document.getElementById('custom-color-picker').addEventListener('input', (e) => {
    document.querySelectorAll('.color-option').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.color-option-custom').forEach(c => c.classList.add('selected'));
  });
  
  document.getElementById('logo-upload').addEventListener('change', handleLogoUpload);
  
  renderNav();
  } catch (err) {
    console.error('Error rendering settings:', err);
    app.innerHTML = `
      <div class="page-header">
        <h1>Error</h1>
        <p>Failed to load settings. Please try again.</p>
      </div>
      <div class="card">
        <p style="color: var(--danger);">${escapeHTML(err.message)}</p>
        <button class="btn btn-primary" onclick="location.reload()">Reload</button>
      </div>
    `;
  }
}

async function saveSettingsForm() {
  try {
    const template = document.querySelector('.template-option.selected')?.dataset.template || 'modern';
    const colorOption = document.querySelector('.color-option.selected');
    const customPicker = document.getElementById('custom-color-picker');
    const accentColor = (colorOption?.dataset.color) || (document.querySelector('.color-option-custom.selected') ? customPicker.value : '#2563eb');

    const settings = {
      companyName: document.getElementById('company-name').value,
      companyAddress: document.getElementById('company-address').value,
      companyEmail: document.getElementById('company-email').value,
      companyPhone: document.getElementById('company-phone').value,
      companyWebsite: document.getElementById('company-website').value,
      template: template,
      accentColor: accentColor,
      invoicePrefix: document.getElementById('invoice-prefix').value,
      currency: document.getElementById('currency').value,
      taxTPS: document.getElementById('tax-tps').checked,
      taxTVQ: document.getElementById('tax-tvq').checked,
      dateFormat: document.getElementById('date-format').value,
      datePosition: document.getElementById('date-position').value,
      paymentTerms: document.getElementById('payment-terms').value,
      notes: document.getElementById('default-notes').value,
      labelInvoice: document.getElementById('label-invoice').value,
      labelBillTo: document.getElementById('label-bill-to').value,
      labelInvoiceNumber: document.getElementById('label-invoice-number').value,
      labelDate: document.getElementById('label-date').value,
      labelDueDate: document.getElementById('label-due-date').value,
      labelSubtotal: document.getElementById('label-subtotal').value,
      labelTotal: document.getElementById('label-total').value,
      labelNotes: document.getElementById('label-notes').value,
      labelPaymentTerms: document.getElementById('label-payment-terms').value,
      labelTPS: document.getElementById('label-tps').value,
      labelTVQ: document.getElementById('label-tvq').value,
      labelDescription: document.getElementById('label-description').value,
      labelRate: document.getElementById('label-rate').value,
      labelHours: document.getElementById('label-hours').value,
      labelAmount: document.getElementById('label-amount').value,
      colDescription: parseInt(document.getElementById('col-description').value, 10) || 35,
      colRate: parseInt(document.getElementById('col-rate').value, 10) || 15,
      colHours: parseInt(document.getElementById('col-hours').value, 10) || 15,
      colAmount: parseInt(document.getElementById('col-amount').value, 10) || 20
    };

    await saveSettingsBulk(settings);
    showToast('Settings saved!', 'success');
  } catch (err) {
    showToast('Error saving settings.', 'error');
    console.error(err);
  }
}

function handleLogoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  if (file.size > 2 * 1024 * 1024) {
    showToast('File too large. Max 2MB.', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = async (event) => {
    await saveSetting('logo', event.target.result);
    document.getElementById('logo-preview').innerHTML = `<img src="${event.target.result}" alt="Logo">`;
    showToast('Logo uploaded!', 'success');
  };
  reader.readAsDataURL(file);
}

async function removeLogo() {
  await saveSetting('logo', null);
  const preview = document.getElementById('logo-preview');
  if (preview) preview.innerHTML = '<span style="color: var(--text-secondary); font-size: 0.75rem;">No logo</span>';
  const removeBtn = document.querySelector('button[onclick="removeLogo()"]');
  if (removeBtn) removeBtn.remove();
  showToast('Logo removed.', 'success');
}

async function resetSettings() {
  showConfirmModal('Reset all settings to defaults? Your invoices will not be deleted.', async () => {
    try {
      await clearSettings();
      showToast('Settings reset to defaults.', 'success');
      renderSettings();
    } catch (err) {
      showToast('Error resetting settings.', 'error');
      console.error(err);
    }
  });
}

function getTemplatePreviewHTML(templateId, accent) {
  const a = accent;
  const row = `<div class="tp-row"><div class="tp-cell"></div><div class="tp-cell"></div><div class="tp-cell"></div></div>`;
  const rowAlt = `<div class="tp-row tp-row-alt"><div class="tp-cell"></div><div class="tp-cell"></div><div class="tp-cell"></div></div>`;
  const total = `<div class="tp-total"><div class="tp-total-bar" style="background:${a};"></div></div>`;
  const metaLeft = `<div class="tp-meta"><div class="tp-meta-line"></div><div class="tp-meta-line short"></div></div>`;
  const metaRight = `<div class="tp-meta" style="justify-content:flex-end;"><div class="tp-meta-line"></div><div class="tp-meta-line short"></div></div>`;

  const previews = {
    classic: `
      <div class="tp-header-text" style="color:${a};">Your Company</div>
      ${metaLeft}
      <div class="tp-classic-double">
        <div class="tp-classic-line-thick" style="background:${a};"></div>
        <div class="tp-classic-line-thin" style="background:${a};"></div>
      </div>
      <div class="tp-body">${row}${rowAlt}${row}</div>
      ${total}
    `,
    modern: `
      <div class="tp-header tp-header-rounded" style="background:${a};"></div>
      <div class="tp-header-text" style="color:${a};">Your Company</div>
      ${metaLeft}
      <div class="tp-body">${row}${rowAlt}${row}</div>
      ${total}
    `,
    clean: `
      <div class="tp-header-text" style="color:${a};">Your Company</div>
      ${metaRight}
      <div class="tp-clean-dot" style="background:${a};"></div>
      <div class="tp-body">${row}${rowAlt}${row}</div>
      ${total}
    `,
    bold: `
      <div class="tp-bold-header" style="background:${a};">
        <div class="tp-bold-title">Your Company</div>
        <div class="tp-bold-meta"></div>
      </div>
      <div class="tp-bold-divider"></div>
      <div class="tp-body">${row}${rowAlt}${row}</div>
      ${total}
    `,
    elegant: `
      <div class="tp-elegant-header">
        <div class="tp-thin-line" style="background:${a};"></div>
        <div class="tp-elegant-diamond" style="color:${a};"></div>
        <div class="tp-header-text" style="color:${a};">Your Company</div>
        <div class="tp-elegant-diamond" style="color:${a};"></div>
        <div class="tp-thin-line" style="background:${a};"></div>
      </div>
      <div class="tp-body">${row}${rowAlt}${row}</div>
      ${total}
    `,
    compact: `
      <div class="tp-compact-header">
        <span class="tp-compact-title" style="color:${a};">Your Co.</span>
        <div class="tp-compact-pill" style="background:${a};">INV</div>
      </div>
      <div class="tp-body">${row}${rowAlt}${row}</div>
      ${total}
    `,
    sidebar: `
      <div class="tp-sidebar-wrap">
        <div class="tp-sidebar" style="background:${a};">
          <div class="tp-sidebar-dot"></div>
          <div class="tp-sidebar-dot"></div>
          <div class="tp-sidebar-dot"></div>
          <div class="tp-sidebar-accent-bar" style="background:rgba(255,255,255,0.3);"></div>
        </div>
        <div class="tp-sidebar-content">
          ${metaLeft}
          <div class="tp-body">${row}${rowAlt}${row}</div>
          ${total}
        </div>
      </div>
    `,
    bordered: `
      <div class="tp-border" style="border-color:${a};"></div>
      <div class="tp-bordered-dot tp-dot-tl" style="background:${a};"></div>
      <div class="tp-bordered-dot tp-dot-tr" style="background:${a};"></div>
      <div class="tp-bordered-dot tp-dot-bl" style="background:${a};"></div>
      <div class="tp-bordered-dot tp-dot-br" style="background:${a};"></div>
      <div class="tp-bordered-inner">
        <div class="tp-header-text" style="color:${a};">Your Company</div>
        <div class="tp-meta"><div class="tp-meta-line"></div></div>
        <div class="tp-body">${row}${rowAlt}${row}</div>
        ${total}
      </div>
    `,
    subtle: `
      <div class="tp-header-text" style="color:${a};">Your Company</div>
      <div class="tp-subtle-line" style="background:${a};"></div>
      <div class="tp-subtle-fade" style="color:${a};"></div>
      <div class="tp-meta"><div class="tp-meta-line"></div></div>
      <div class="tp-body">${row}${rowAlt}${row}</div>
      ${total}
    `,
    stripe: `
      <div class="tp-header-text" style="color:${a};">Your Company</div>
      <div class="tp-stripe" style="background:${a};"></div>
      <div class="tp-stripe-thin" style="background:${a};"></div>
      <div class="tp-meta"><div class="tp-meta-line"></div></div>
      <div class="tp-body">${row}${rowAlt}${row}</div>
      ${total}
    `,
    grid: `
      <div class="tp-grid-header" style="background:${a};">
        <div class="tp-grid-title">Your Company</div>
      </div>
      <div class="tp-body">
        <div class="tp-grid-row" style="border:1px solid #e0e0e0;border-bottom:none;">
          <div class="tp-grid-cell" style="border-right:1px solid #e0e0e0;"></div>
          <div class="tp-grid-cell" style="border-right:1px solid #e0e0e0;"></div>
          <div class="tp-grid-cell"></div>
        </div>
        <div class="tp-grid-row" style="border:1px solid #e0e0e0;border-bottom:none;background:#f5f5f5;">
          <div class="tp-grid-cell" style="border-right:1px solid #e0e0e0;"></div>
          <div class="tp-grid-cell" style="border-right:1px solid #e0e0e0;"></div>
          <div class="tp-grid-cell"></div>
        </div>
        <div class="tp-grid-row" style="border:1px solid #e0e0e0;">
          <div class="tp-grid-cell" style="border-right:1px solid #e0e0e0;"></div>
          <div class="tp-grid-cell" style="border-right:1px solid #e0e0e0;"></div>
          <div class="tp-grid-cell"></div>
        </div>
      </div>
      ${total}
    `,
    corner: `
      <div class="tp-corner" style="background:${a};"></div>
      <div class="tp-header-text" style="color:${a};">Your Company</div>
      ${metaLeft}
      <div class="tp-body">${row}${rowAlt}${row}</div>
      ${total}
    `
  };
  
  return previews[templateId] || previews.modern;
}
