var THEMES = [
  { id: 'light', name: 'Light', color: '#f5f5f5', border: '#ccc' },
  { id: 'dark', name: 'Dark', color: '#0f1117', border: '#444' },
  { id: 'dracula', name: 'Dracula', color: '#bd93f9', border: null },
  { id: 'catppuccin', name: 'Catppuccin', color: '#89b4fa', border: null },
  { id: 'sepia', name: 'Sepia', color: '#d4c5a9', border: null },
  { id: 'kanagawa', name: 'Kanagawa', color: '#7e9cd8', border: null }
];

function renderNav() {
  const links = document.querySelectorAll('.nav-link');
  const hash = window.location.hash || '#/';

  const authContainer = document.getElementById('nav-auth');
  if (authContainer) {
    if (isLoggedIn()) {
      authContainer.innerHTML = `<button class="btn btn-secondary btn-sm" onclick="logout()">Log Out</button>`;
    } else {
      authContainer.innerHTML = '';
    }
  }
  
  links.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === hash || (hash.startsWith('#/edit') && link.getAttribute('href') === '#/history')) {
      link.classList.add('active');
    }
  });
}

function initTheme() {
  var saved = localStorage.getItem('theme') || 'light';
  applyTheme(saved);
}

function applyTheme(themeId) {
  if (themeId !== 'light') {
    document.documentElement.setAttribute('data-theme', themeId);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  updateThemePickerUI(themeId);
}

function setTheme(themeId) {
  localStorage.setItem('theme', themeId);
  applyTheme(themeId);
  closeThemePicker();
}

function updateThemePickerUI(themeId) {
  var theme = THEMES.find(function(t) { return t.id === themeId; }) || THEMES[0];
  var label = document.getElementById('theme-picker-label');
  var dot = document.getElementById('theme-picker-dot');
  if (label) label.textContent = theme.name;
  if (dot) {
    dot.style.background = theme.color;
    dot.style.border = theme.border ? '1px solid ' + theme.border : 'none';
  }
  var options = document.querySelectorAll('.theme-picker-option');
  options.forEach(function(opt) {
    opt.classList.toggle('active', opt.dataset.theme === themeId);
  });
}

function toggleThemePicker() {
  var menu = document.getElementById('theme-picker-menu');
  if (!menu) return;
  menu.classList.toggle('open');
}

function closeThemePicker() {
  var menu = document.getElementById('theme-picker-menu');
  if (menu) menu.classList.remove('open');
}

document.addEventListener('DOMContentLoaded', function() {
  initTheme();
});

document.addEventListener('click', function(e) {
  var picker = document.getElementById('theme-picker');
  if (picker && !picker.contains(e.target)) {
    closeThemePicker();
  }
});
