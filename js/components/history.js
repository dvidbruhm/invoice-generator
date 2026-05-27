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
        <a href="#/create" class="btn btn-primary">New Invoice</a>
      </div>
      
      <div id="history-content">
        ${invoices.length > 0 ? renderHistoryTable(invoices, mergedSettings) : renderEmptyState()}
      </div>
    `;
    
    document.getElementById('search-input').addEventListener('input', (e) => {
      filterHistory(e.target.value, mergedSettings);
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
              const { total } = calculateTotals(inv.lineItems, { taxTPS: settings.taxTPS, taxTVQ: settings.taxTVQ, tpsRate: settings.tpsRate, tvqRate: settings.tvqRate, currency: settings.currency });
              return `
                <tr data-id="${escapeHTML(inv.id)}" data-search="${escapeHTML(inv.number.toLowerCase())} ${escapeHTML(inv.clientName.toLowerCase())} ${escapeHTML(inv.date)}">
                  <td><strong>${escapeHTML(inv.number)}</strong></td>
                  <td>${escapeHTML(inv.clientName)}</td>
                  <td>${getStatusBadge(inv.status)}</td>
                  <td>${escapeHTML(inv.date)}</td>
                  <td>${escapeHTML(inv.dueDate)}</td>
                  <td>${formatCurrency(total, settings.currency)}</td>
                  <td>
                    <div class="history-actions">
                      <a href="#/edit/${escapeHTML(inv.id)}" class="btn btn-sm btn-secondary">Edit</a>
                      <button class="btn btn-sm btn-secondary" onclick="downloadPDF('${escapeHTML(inv.id)}')">PDF</button>
                      <button class="btn btn-sm btn-secondary" onclick="duplicateInvoice('${escapeHTML(inv.id)}')">Duplicate</button>
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

async function filterHistory(query, settings) {
  const invoices = await getAllInvoices();
  const filtered = invoices.filter(inv => {
    const searchStr = `${inv.number} ${inv.clientName} ${inv.date}`.toLowerCase();
    return searchStr.includes(query.toLowerCase());
  });
  
  const content = document.getElementById('history-content');
  content.innerHTML = filtered.length > 0 ? renderHistoryTable(filtered, settings) : `
    <div class="empty-state">
      <h3>No matching invoices</h3>
      <p>Try a different search term.</p>
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
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await saveInvoice(newInvoice);
    await updateInvoiceNumberCounter(nextNum.num);
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