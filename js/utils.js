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
  if (currency === 'CAD') {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);
  }
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'CAD' }).format(amount);
  } catch (_) {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);
  }
}

function getCurrencySymbol(currency) {
  if (currency === 'EUR') return '\u20AC';
  if (currency === 'USD') return '$';
  return '$';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatLineItemDate(dateStr, format) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');

  switch (format) {
    case 'YYYY/MM/DD': return `${yyyy}/${mm}/${dd}`;
    case 'YYYY-MM-DD': return `${yyyy}-${mm}-${dd}`;
    case 'DD-MM-YYYY': return `${dd}-${mm}-${yyyy}`;
    case 'DD/MM/YYYY': return `${dd}/${mm}/${yyyy}`;
    case 'DD-MM': return `${dd}-${mm}`;
    case 'DD/MM': return `${dd}/${mm}`;
    default: return formatDate(dateStr);
  }
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
  const label = (status || 'draft').charAt(0).toUpperCase() + (status || 'draft').slice(1);
  return `<span class="status-badge" style="color:${color};background:${bg};">${escapeHTML(label)}</span>`;
}

function debounce(fn, ms) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), ms);
  };
}

function safeLogoSrc(logo) {
  if (!logo) return '';
  if (typeof logo === 'string' && logo.startsWith('data:image/')) return logo;
  return '';
}

function getLocalDateString(date) {
  const d = date || new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  function parseLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          result.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseLine(lines[0]);
  let delimiter = ',';
  if (headers.length === 1) {
    const sepCounts = { ';': 0, '\t': 0 };
    for (const sep of [';', '\t']) {
      sepCounts[sep] = lines[0].split(sep).length - 1;
    }
    if (sepCounts[';'] > sepCounts['\t'] && sepCounts[';'] > 0) delimiter = ';';
    else if (sepCounts['\t'] > 0) delimiter = '\t';
    if (delimiter !== ',') {
      const reparse = (line) => line.split(delimiter).map(c => c.trim());
      const newHeaders = reparse(lines[0]);
      const rows = lines.slice(1).map(line => {
        const vals = reparse(line);
        const obj = {};
        newHeaders.forEach((h, i) => { obj[h] = vals[i] || ''; });
        return obj;
      });
      return { headers: newHeaders, rows };
    }
  }

  const rows = lines.slice(1).map(line => {
    const vals = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });

  return { headers, rows };
}

const CSV_FIELD_OPTIONS = [
  { value: 'description', label: 'Description' },
  { value: 'rate', label: 'Rate / Price' },
  { value: 'hours', label: 'Hours / Quantity' },
  { value: '_skip', label: '(Skip this column)' }
];

function guessCSVMapping(headers) {
  const descriptionKeys = ['description', 'desc', 'item', 'task', 'service', 'work', 'detail', 'product', 'name'];
  const rateKeys = ['rate', 'price', 'unit price', 'unitprice', 'amount', 'cost', 'fee', 'hourly', 'hourly rate'];
  const hoursKeys = ['hours', 'qty', 'quantity', 'time', 'duration', 'count', 'units', 'hrs'];

  const lowerHeaders = headers.map(h => h.toLowerCase().trim());

  const mapping = {};
  const used = new Set();

  lowerHeaders.forEach((h, i) => {
    if (!used.has('description') && descriptionKeys.some(k => h.includes(k))) {
      mapping[headers[i]] = 'description';
      used.add('description');
    } else if (!used.has('rate') && rateKeys.some(k => h.includes(k))) {
      mapping[headers[i]] = 'rate';
      used.add('rate');
    } else if (!used.has('hours') && hoursKeys.some(k => h.includes(k))) {
      mapping[headers[i]] = 'hours';
      used.add('hours');
    } else {
      mapping[headers[i]] = '_skip';
    }
  });

  return mapping;
}

function hexToRgba(hex, alpha) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  var r = parseInt(hex.substring(0, 2), 16);
  var g = parseInt(hex.substring(2, 4), 16);
  var b = parseInt(hex.substring(4, 6), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

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
