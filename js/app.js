function initApp() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function handleRoute() {
  const hash = window.location.hash || '#/';

  if (!isLoggedIn() && hash !== '#/login' && hash !== '#/register') {
    window.location.hash = '#/login';
    return;
  }

  if (isLoggedIn() && (hash === '#/login' || hash === '#/register')) {
    window.location.hash = '#/';
    return;
  }

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
  } else if (hash === '#/login' || hash === '#/register') {
    renderAuth();
  } else {
    renderDashboard();
  }
}

document.addEventListener('DOMContentLoaded', initApp);
