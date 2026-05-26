function escapeHTML(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function formatCurrency(amount, currency) {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }
  if (currency === 'EUR') {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  }
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);
}

function getCurrencySymbol(currency) {
  if (currency === 'EUR') return '€';
  if (currency === 'USD') return '$';
  return '$';
}

function showLoading() {
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading...</p></div>';
  }
}

const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue'];

function getStatusBadge(status) {
  const colors = {
    draft: 'var(--text-secondary)',
    sent: 'var(--accent)',
    paid: 'var(--success)',
    overdue: 'var(--danger)'
  };
  const bgColors = {
    draft: 'rgba(100,100,100,0.1)',
    sent: 'rgba(37,99,235,0.1)',
    paid: 'rgba(22,163,74,0.1)',
    overdue: 'rgba(220,38,38,0.1)'
  };
  const color = colors[status] || colors.draft;
  const bg = bgColors[status] || bgColors.draft;
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return `<span class="status-badge" style="color:${color};background:${bg};">${escapeHTML(label)}</span>`;
}