const API_BASE = '';

let _sessionExpired = false;

function getToken() {
  return localStorage.getItem('token');
}

function isSessionExpired() {
  return _sessionExpired;
}

async function apiFetch(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      'Authorization': `Bearer ${getToken()}`,
      ...(options.headers || {})
    }
  });

  if (res.status === 401) {
    _sessionExpired = true;
    localStorage.removeItem('token');
    window.location.hash = '#/login';
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

async function register(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  localStorage.setItem('token', data.token);
  _sessionExpired = false;
  return data;
}

async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  localStorage.setItem('token', data.token);
  _sessionExpired = false;
  return data;
}

function logout() {
  localStorage.removeItem('token');
  window.location.hash = '#/login';
}

function isLoggedIn() {
  return !!getToken();
}

async function getAllInvoices() {
  return apiFetch('/api/invoices');
}

async function getInvoice(id) {
  return apiFetch(`/api/invoices/${id}`);
}

async function saveInvoice(invoice) {
  return apiFetch('/api/invoices', {
    method: 'POST',
    body: JSON.stringify(invoice)
  });
}

async function deleteInvoice(id) {
  return apiFetch(`/api/invoices/${id}`, { method: 'DELETE' });
}

async function getAllSettings() {
  return apiFetch('/api/settings');
}

async function getSetting(key) {
  return apiFetch(`/api/settings/${encodeURIComponent(key)}`);
}

async function saveSetting(key, value) {
  return apiFetch(`/api/settings/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify({ value })
  });
}

async function saveSettingsBulk(settings) {
  return apiFetch('/api/settings/bulk', {
    method: 'PUT',
    body: JSON.stringify(settings)
  });
}

async function clearSettings() {
  return apiFetch('/api/settings', { method: 'DELETE' });
}

async function getNextInvoiceNumber() {
  return apiFetch('/api/settings/next-invoice-number');
}

async function formatInvoiceNumber(num) {
  const settings = await getSetting('invoicePattern') || { prefix: 'INV' };
  const year = new Date().getFullYear();
  const padded = String(num).padStart(3, '0');
  return `${settings.prefix}-${year}-${padded}`;
}

async function getAllClients() {
  return apiFetch('/api/clients');
}

async function getClient(id) {
  return apiFetch(`/api/clients/${id}`);
}

async function saveClient(client) {
  if (client.id) {
    return apiFetch(`/api/clients/${client.id}`, {
      method: 'PUT',
      body: JSON.stringify(client)
    });
  }
  return apiFetch('/api/clients', {
    method: 'POST',
    body: JSON.stringify(client)
  });
}

async function deleteClient(id) {
  return apiFetch(`/api/clients/${id}`, { method: 'DELETE' });
}

async function getClientList() {
  try {
    const clients = await getAllClients();
    return clients.map(c => c.name);
  } catch (err) {
    console.error('Failed to get client list:', err);
    return [];
  }
}
