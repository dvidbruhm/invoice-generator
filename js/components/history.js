async function renderHistory() {
  const app = document.getElementById('app');
  showLoading();
  
  try {
    const invoices = await getAllInvoices();
    const settings = await getAllSettings();
    const defaults = getDefaultSettings();
    const mergedSettings = { ...defaults, ...settings };
    
    app.innerHTML = `
      <div class="page-header">
        <h1>Invoice History</h1>
        <p>${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}</p>
      </div>
      
      <div class="search-bar">
        <input type="text" id="search-input" placeholder="Search by client, invoice number, or date...">
        <select id="history-sort" style="padding:0.625rem 0.75rem;border:1px solid var(--border);border-radius:var(--radius);font-size:0.875rem;font-family:inherit;background:var(--surface);color:var(--text);">
          <option value="date-desc">Date: Newest First</option>
          <option value="date-asc">Date: Oldest First</option>
          <option value="amount-desc">Amount: High to Low</option>
          <option value="amount-asc">Amount: Low to High</option>
        </select>
        <select id="history-status" style="padding:0.625rem 0.75rem;border:1px solid var(--border);border-radius:var(--radius);font-size:0.875rem;font-family:inherit;background:var(--surface);color:var(--text);">
          <option value="">All Statuses</option>
          ${INVOICE_STATUSES.map(s => `<option value="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
        </select>
        <a href="#/create" class="btn btn-primary">New Invoice</a>
      </div>
      
      <div style="display:flex;gap:0.75rem;margin-bottom:1.5rem;flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" onclick="exportInvoices()">Export JSON</button>
        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('import-file').click()">Import JSON</button>
        <input type="file" id="import-file" accept=".json" style="display:none;" onchange="handleImportInvoices(event)">
      </div>
      
      <div id="history-content">
        ${invoices.length > 0 ? renderHistoryTable(invoices, mergedSettings) : renderEmptyState()}
      </div>
    `;
    
    document.getElementById('search-input').addEventListener('input', () => {
      refreshHistoryView(mergedSettings);
    });
    document.getElementById('history-sort').addEventListener('change', () => {
      refreshHistoryView(mergedSettings);
    });
    document.getElementById('history-status').addEventListener('change', () => {
      refreshHistoryView(mergedSettings);
    });
    
    renderNav();
  } catch (err) {
    console.error('Error rendering history:', err);
    app.innerHTML = `
      <div class="page-header">
        <h1>Error</h1>
        <p>Failed to load invoice history. Please try again.</p>
      </div>
      <div class="card">
        <p style="color: var(--danger);">${escapeHTML(err.message)}</p>
        <button class="btn btn-primary" onclick="location.reload()">Reload</button>
      </div>
    `;
  }
}

function renderHistoryTable(invoices, settings) {
  return `
    <div class="card" style="padding: 0; overflow: hidden;">
      <div class="table-wrapper">
        <table class="history-table">
          <thead>
            <tr>
              <th>Number</th>
              <th>Client</th>
              <th>Status</th>
              <th>Date</th>
              <th>Due Date</th>
              <th>${escapeHTML(settings.labelTotal || 'Total')}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="history-tbody">
            ${invoices.map(inv => {
              const { total } = calculateTotals(inv.lineItems, { taxTPS: settings.taxTPS, taxTVQ: settings.taxTVQ, tpsRate: settings.tpsRate, tvqRate: settings.tvqRate });
              return `
                <tr data-id="${escapeHTML(inv.id)}" data-search="${escapeHTML(inv.number.toLowerCase())} ${escapeHTML(inv.clientName.toLowerCase())} ${escapeHTML(inv.date)}">
                  <td><strong>${escapeHTML(inv.number)}</strong></td>
                  <td>${escapeHTML(inv.clientName)}</td>
                  <td>${getStatusBadge(inv.status)}</td>
                  <td>${escapeHTML(formatDate(inv.date))}</td>
                  <td>${escapeHTML(formatDate(inv.dueDate))}</td>
                  <td>${formatCurrency(total, settings.currency)}</td>
                  <td>
                    <div class="history-actions">
                      <a href="#/edit/${escapeHTML(inv.id)}" class="btn btn-sm btn-secondary">Edit</a>
                      <button class="btn btn-sm btn-secondary" onclick="downloadPDF('${escapeHTML(inv.id)}')">PDF</button>
                      <button class="btn btn-sm btn-secondary" onclick="downloadVisualPDF('${escapeHTML(inv.id)}')">Visual PDF</button>
                      <button class="btn btn-sm btn-secondary" onclick="duplicateInvoice('${escapeHTML(inv.id)}')">Duplicate</button>
                      ${inv.status !== 'paid' ? `<button class="btn btn-sm btn-secondary" onclick="updateInvoiceStatus('${escapeHTML(inv.id)}', 'paid')">Mark Paid</button>` : ''}
                      <button class="btn btn-sm btn-danger" onclick="deleteInvoiceConfirm('${escapeHTML(inv.id)}')">Delete</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderEmptyState() {
  return `
    <div class="empty-state">
      <svg class="empty-icon" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="8" width="60" height="64" rx="4" stroke="currentColor" stroke-width="2.5" fill="none"/>
        <line x1="22" y1="24" x2="58" y2="24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="22" y1="36" x2="48" y2="36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="22" y1="48" x2="42" y2="48" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="56" cy="56" r="16" fill="currentColor" opacity="0.1"/>
        <line x1="50" y1="56" x2="62" y2="56" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="56" y1="50" x2="56" y2="62" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <h3>No invoices yet</h3>
      <p>Create your first invoice to get started.</p>
      <a href="#/create" class="btn btn-primary" style="margin-top: 1rem;">Create Invoice</a>
    </div>
  `;
}

async function refreshHistoryView(settings) {
  const query = document.getElementById('search-input').value;
  const sort = document.getElementById('history-sort').value;
  const statusFilter = document.getElementById('history-status').value;
  
  let invoices = await getAllInvoices();
  
  if (query) {
    const q = query.toLowerCase();
    invoices = invoices.filter(inv => {
      return `${inv.number} ${inv.clientName} ${inv.date}`.toLowerCase().includes(q);
    });
  }
  
  if (statusFilter) {
    invoices = invoices.filter(inv => inv.status === statusFilter);
  }
  
  invoices.sort((a, b) => {
    switch (sort) {
      case 'date-asc': return new Date(a.date) - new Date(b.date);
      case 'date-desc': return new Date(b.date) - new Date(a.date);
      case 'amount-asc': {
        const ta = calculateTotals(a.lineItems, settings).total;
        const tb = calculateTotals(b.lineItems, settings).total;
        return ta - tb;
      }
      case 'amount-desc': {
        const ta = calculateTotals(a.lineItems, settings).total;
        const tb = calculateTotals(b.lineItems, settings).total;
        return tb - ta;
      }
      default: return new Date(b.date) - new Date(a.date);
    }
  });
  
  const content = document.getElementById('history-content');
  content.innerHTML = invoices.length > 0 ? renderHistoryTable(invoices, settings) : `
    <div class="empty-state">
      <h3>No matching invoices</h3>
      <p>Try a different search term or filter.</p>
    </div>
  `;
}

async function downloadPDF(id) {
  try {
    const invoice = await getInvoice(id);
    const settings = await getAllSettings();
    const defaults = getDefaultSettings();
    const mergedSettings = { ...defaults, ...settings };
    if (invoice.template) mergedSettings.template = invoice.template;
    if (invoice.accentColor) mergedSettings.accentColor = invoice.accentColor;
    await generatePDF(invoice, mergedSettings);
    showToast('PDF downloaded!', 'success');
  } catch (err) {
    showToast('Error generating PDF.', 'error');
    console.error(err);
  }
}

async function downloadVisualPDF(id) {
  try {
    const invoice = await getInvoice(id);
    const settings = await getAllSettings();
    const defaults = getDefaultSettings();
    const mergedSettings = { ...defaults, ...settings };
    if (invoice.template) mergedSettings.template = invoice.template;
    if (invoice.accentColor) mergedSettings.accentColor = invoice.accentColor;

    const previewHTML = renderLivePreview(mergedSettings, invoice);
    const tempDiv = document.createElement('div');
    tempDiv.id = 'visual-pdf-temp';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '794px';
    tempDiv.style.background = 'white';
    tempDiv.innerHTML = previewHTML;
    document.body.appendChild(tempDiv);

    const invoiceWrapper = tempDiv.querySelector('.preview-invoice');
    if (!invoiceWrapper) {
      tempDiv.remove();
      showToast('Error rendering preview.', 'error');
      return;
    }

    invoiceWrapper.id = 'visual-pdf-capture';
    invoiceWrapper.style.padding = '40px';
    invoiceWrapper.style.color = '#111';
    
    await generatePDFFromHTML('visual-pdf-capture', invoice.number || 'invoice');
    tempDiv.remove();
    showToast('Visual PDF downloaded!', 'success');
  } catch (err) {
    const tempDiv = document.getElementById('visual-pdf-temp');
    if (tempDiv) tempDiv.remove();
    showToast('Error generating visual PDF.', 'error');
    console.error(err);
  }
}

async function duplicateInvoice(id) {
  try {
    const invoice = await getInvoice(id);
    const settings = await getAllSettings();
    const defaults = getDefaultSettings();
    const mergedSettings = { ...defaults, ...settings };
    const nextNum = await getNextInvoiceNumber();
    const newNumber = await formatInvoiceNumber(nextNum.num);
    
    const newInvoice = {
      ...invoice,
      id: Date.now().toString(),
      number: newNumber,
      date: getLocalDateString(),
      dueDate: getLocalDateString(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await saveInvoice(newInvoice);
    showToast('Invoice duplicated!', 'success');
    renderHistory();
  } catch (err) {
    showToast('Error duplicating invoice.', 'error');
    console.error(err);
  }
}

async function deleteInvoiceConfirm(id) {
  showConfirmModal('Are you sure you want to delete this invoice? This action cannot be undone.', async () => {
    try {
      await deleteInvoice(id);
      showToast('Invoice deleted.', 'success');
      renderHistory();
    } catch (err) {
      showToast('Error deleting invoice.', 'error');
      console.error(err);
    }
  });
}

async function updateInvoiceStatus(id, status) {
  try {
    const invoice = await getInvoice(id);
    if (!invoice) throw new Error('Invoice not found');
    invoice.status = status;
    invoice.updatedAt = new Date().toISOString();
    await saveInvoice(invoice);
    showToast(`Invoice marked as ${status}.`, 'success');
    renderHistory();
  } catch (err) {
    showToast('Error updating status.', 'error');
    console.error(err);
  }
}

async function exportInvoices() {
  try {
    const invoices = await getAllInvoices();
    const blob = new Blob([JSON.stringify(invoices, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Invoices exported!', 'success');
  } catch (err) {
    showToast('Export failed.', 'error');
    console.error(err);
  }
}

function handleImportInvoices(event) {
  const file = event.target.files[0];
  if (!file) return;
  event.target.value = '';
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error('Invalid file format: expected an array');
      let count = 0;
      for (const inv of data) {
        if (inv.id && inv.number) {
          await saveInvoice(inv);
          count++;
        }
      }
      showToast(`Imported ${count} invoice${count !== 1 ? 's' : ''}!`, 'success');
      renderHistory();
    } catch (err) {
      showToast('Import failed: ' + err.message, 'error');
      console.error(err);
    }
  };
  reader.readAsText(file);
}
