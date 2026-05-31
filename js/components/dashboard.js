async function renderDashboard() {
  const app = document.getElementById('app');
  showLoading();
  
  try {
    const invoices = await getAllInvoices();
    const settings = await getAllSettings();
    const defaults = getDefaultSettings();
    const mergedSettings = { ...defaults, ...settings };
    
    const totalRevenue = invoices.reduce((sum, inv) => {
      const { total } = calculateTotals(inv.lineItems, mergedSettings);
      return sum + total;
    }, 0);
    
    const paidCount = invoices.filter(inv => inv.status === 'paid').length;
    const overdueCount = invoices.filter(inv => {
      if (inv.status === 'paid') return false;
      return inv.dueDate && new Date(inv.dueDate) < new Date();
    }).length;
    
    app.innerHTML = `
      <div class="page-header">
        <h1>Dashboard</h1>
        <p>Manage your invoices</p>
      </div>
      
      <div class="dashboard-stats">
        <div class="stat-card">
          <div class="stat-value">${invoices.length}</div>
          <div class="stat-label">Total Invoices</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatCurrency(totalRevenue, mergedSettings.currency)}</div>
          <div class="stat-label">Total Revenue</div>
        </div>
        <div class="stat-card stat-card-success">
          <div class="stat-value">${paidCount}</div>
          <div class="stat-label">Paid</div>
        </div>
        <div class="stat-card stat-card-danger">
          <div class="stat-value">${overdueCount}</div>
          <div class="stat-label">Overdue</div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-title">Quick Actions</div>
        <div class="btn-group" style="margin-top: 0;">
          <a href="#/create" class="btn btn-primary">Create New Invoice</a>
          <a href="#/history" class="btn btn-secondary">View History</a>
          <a href="#/settings" class="btn btn-secondary">Settings</a>
        </div>
      </div>
      
      ${invoices.length > 0 ? `
        <div class="card">
          <div class="card-title">Recent Invoices</div>
          <div class="table-wrapper">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>${escapeHTML(mergedSettings.labelTotal || 'Total')}</th>
                </tr>
              </thead>
              <tbody>
                ${invoices.slice(0, 5).map(inv => {
                  const { total } = calculateTotals(inv.lineItems, mergedSettings);
                  return `
                    <tr>
                      <td><a href="#/edit/${escapeHTML(inv.id)}" style="color: var(--accent); text-decoration: none;">${escapeHTML(inv.number)}</a></td>
                      <td>${escapeHTML(inv.clientName)}</td>
                      <td>${getStatusBadge(inv.status)}</td>
                      <td>${escapeHTML(formatDate(inv.date))}</td>
                      <td>${formatCurrency(total, mergedSettings.currency)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
    `;
    
    renderNav();
  } catch (err) {
    console.error('Error rendering dashboard:', err);
    if (isSessionExpired()) return;
    app.innerHTML = `
      <div class="page-header">
        <h1>Error</h1>
        <p>Failed to load the dashboard. Please try again.</p>
      </div>
      <div class="card">
        <p style="color: var(--danger);">${escapeHTML(err.message)}</p>
        <button class="btn btn-primary" onclick="location.reload()">Reload</button>
      </div>
    `;
  }
}
