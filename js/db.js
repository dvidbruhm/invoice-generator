const DB_NAME = 'InvoiceGeneratorDB';
const DB_VERSION = 1;
const STORE_INVOICES = 'invoices';
const STORE_SETTINGS = 'settings';

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      db.onclose = () => { db = null; };
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      
      if (!database.objectStoreNames.contains(STORE_INVOICES)) {
        const invoiceStore = database.createObjectStore(STORE_INVOICES, { keyPath: 'id' });
        invoiceStore.createIndex('date', 'date', { unique: false });
        invoiceStore.createIndex('number', 'number', { unique: true });
        invoiceStore.createIndex('clientName', 'clientName', { unique: false });
      }
      
      if (!database.objectStoreNames.contains(STORE_SETTINGS)) {
        database.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };
  });
}

async function saveInvoice(invoice) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_INVOICES, 'readwrite');
    const store = tx.objectStore(STORE_INVOICES);
    const request = store.put(invoice);
    request.onsuccess = () => resolve(invoice);
    request.onerror = () => reject(request.error);
  });
}

async function getInvoice(id) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_INVOICES, 'readonly');
    const store = tx.objectStore(STORE_INVOICES);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllInvoices() {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_INVOICES, 'readonly');
    const store = tx.objectStore(STORE_INVOICES);
    const request = store.getAll();
    request.onsuccess = () => {
      const invoices = request.result || [];
      invoices.sort((a, b) => new Date(b.date) - new Date(a.date));
      resolve(invoices);
    };
    request.onerror = () => reject(request.error);
  });
}

async function deleteInvoice(id) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_INVOICES, 'readwrite');
    const store = tx.objectStore(STORE_INVOICES);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getNextInvoiceNumber() {
  const settings = await getSetting('invoicePattern') || { prefix: 'INV', year: new Date().getFullYear(), lastNum: 0 };
  const currentYear = new Date().getFullYear();
  
  if (settings.year !== currentYear) {
    return { prefix: settings.prefix || 'INV', year: currentYear, num: 1 };
  }
  
  return { prefix: settings.prefix || 'INV', year: currentYear, num: (settings.lastNum || 0) + 1 };
}

async function formatInvoiceNumber(num) {
  const settings = await getSetting('invoicePattern') || { prefix: 'INV' };
  const year = new Date().getFullYear();
  const padded = String(num).padStart(3, '0');
  return `${settings.prefix}-${year}-${padded}`;
}

async function updateInvoiceNumberCounter(num) {
  const settings = await getSetting('invoicePattern') || { prefix: 'INV', year: new Date().getFullYear(), lastNum: 0 };
  settings.year = new Date().getFullYear();
  settings.lastNum = num;
  await saveSetting('invoicePattern', settings);
}

async function saveSetting(key, value) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_SETTINGS, 'readwrite');
    const store = tx.objectStore(STORE_SETTINGS);
    const request = store.put({ key, value });
    request.onsuccess = () => resolve(value);
    request.onerror = () => reject(request.error);
  });
}

async function getSetting(key) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_SETTINGS, 'readonly');
    const store = tx.objectStore(STORE_SETTINGS);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result?.value);
    request.onerror = () => reject(request.error);
  });
}

async function getAllSettings() {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_SETTINGS, 'readonly');
    const store = tx.objectStore(STORE_SETTINGS);
    const request = store.getAll();
    request.onsuccess = () => {
      const settings = {};
      (request.result || []).forEach(item => {
        settings[item.key] = item.value;
      });
      resolve(settings);
    };
    request.onerror = () => reject(request.error);
  });
}
