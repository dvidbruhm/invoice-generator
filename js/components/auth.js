function renderAuth() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-header">
      <h1>Invoice Generator</h1>
      <p>Log in or create an account to manage your invoices</p>
    </div>

    <div class="card" style="max-width: 400px; margin: 0 auto;">
      <div style="display:flex;gap:0.5rem;margin-bottom:1.5rem;border-bottom:1px solid var(--border);">
        <button class="btn btn-sm" id="tab-login" onclick="showAuthTab('login')" style="flex:1;border-radius:0;border:none;background:transparent;color:var(--text);border-bottom:2px solid var(--accent);font-weight:500;">Log In</button>
        <button class="btn btn-sm" id="tab-register" onclick="showAuthTab('register')" style="flex:1;border-radius:0;border:none;background:transparent;color:var(--text-secondary);border-bottom:2px solid transparent;font-weight:500;">Register</button>
      </div>

      <form id="login-form">
        <div class="form-group">
          <label for="auth-email">Email</label>
          <input type="email" id="auth-email" required placeholder="you@example.com">
        </div>
        <div class="form-group">
          <label for="auth-password">Password</label>
          <input type="password" id="auth-password" required placeholder="••••••••">
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;">Log In</button>
        <p id="auth-error" style="color:var(--danger);margin-top:0.75rem;font-size:0.875rem;text-align:center;"></p>
      </form>

      <form id="register-form" style="display:none;">
        <div class="form-group">
          <label for="reg-email">Email</label>
          <input type="email" id="reg-email" required placeholder="you@example.com">
        </div>
        <div class="form-group">
          <label for="reg-password">Password</label>
          <input type="password" id="reg-password" required minlength="6" placeholder="••••••••">
        </div>
        <div class="form-group">
          <label for="reg-password-confirm">Confirm Password</label>
          <input type="password" id="reg-password-confirm" required placeholder="••••••••">
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;">Create Account</button>
        <p id="reg-error" style="color:var(--danger);margin-top:0.75rem;font-size:0.875rem;text-align:center;"></p>
      </form>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    try {
      await login(email, password);
      window.location.hash = '#/';
    } catch (err) {
      document.getElementById('auth-error').textContent = err.message;
    }
  });

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-password-confirm').value;

    if (password !== confirm) {
      document.getElementById('reg-error').textContent = 'Passwords do not match';
      return;
    }

    try {
      await register(email, password);
      window.location.hash = '#/';
    } catch (err) {
      document.getElementById('reg-error').textContent = err.message;
    }
  });

  if (window.location.hash === '#/register') {
    showAuthTab('register');
  }

  renderNav();
}

function showAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  const loginTab = document.getElementById('tab-login');
  const regTab = document.getElementById('tab-register');

  if (tab === 'login') {
    loginForm.style.display = '';
    regForm.style.display = 'none';
    loginTab.style.color = 'var(--text)';
    loginTab.style.borderBottomColor = 'var(--accent)';
    regTab.style.color = 'var(--text-secondary)';
    regTab.style.borderBottomColor = 'transparent';
    setTimeout(() => document.getElementById('auth-email')?.focus(), 50);
  } else {
    loginForm.style.display = 'none';
    regForm.style.display = '';
    regTab.style.color = 'var(--text)';
    regTab.style.borderBottomColor = 'var(--accent)';
    loginTab.style.color = 'var(--text-secondary)';
    loginTab.style.borderBottomColor = 'transparent';
    setTimeout(() => document.getElementById('reg-email')?.focus(), 50);
  }
}
