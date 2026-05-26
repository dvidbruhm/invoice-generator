function initApp() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function handleRoute() {
  const hash = window.location.hash || '#/';
  
  if (hash === '#/' || hash === '') {
    renderDashboard();
  } else if (hash === '#/create') {
    renderInvoiceForm();
  } else if (hash.startsWith('#/edit/')) {
    const id = hash.replace('#/edit/', '');
    renderInvoiceForm(id);
  } else if (hash === '#/history') {
    renderHistory();
  } else if (hash === '#/settings') {
    renderSettings();
  } else {
    renderDashboard();
  }
}

document.addEventListener('DOMContentLoaded', initApp);