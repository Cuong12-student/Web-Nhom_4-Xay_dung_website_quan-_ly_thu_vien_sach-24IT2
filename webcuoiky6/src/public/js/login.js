// ========== LOGIN.JS - CẬP NHẬT ==========

const loginInput = document.getElementById('login');
const passwordInput = document.getElementById('password');
const rememberCheckbox = document.getElementById('rememberMe');
const loginForm = document.getElementById('loginForm');
const statusBox = document.getElementById('status');

const SESSION_KEY = 'library_current_user';

function setStatus(message, isError = false) {
  if (statusBox) {
    statusBox.textContent = message;
    statusBox.className = isError ? 'error' : 'ok';
  }
}

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = `toast-notification ${isError ? 'error' : ''}`;
  toast.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Load saved login info from localStorage
function loadSavedLogin() {
  const saved = localStorage.getItem('library_remembered_login');
  if (saved && loginInput) {
    try {
      const { login, rememberMe } = JSON.parse(saved);
      loginInput.value = login;
      if (rememberCheckbox) rememberCheckbox.checked = rememberMe;
    } catch (e) {
      // Ignore parse errors
    }
  }
}

// Save login info to localStorage if checkbox is checked
function saveLogin() {
  if (rememberCheckbox && rememberCheckbox.checked && loginInput) {
    localStorage.setItem('library_remembered_login', JSON.stringify({
      login: loginInput.value,
      rememberMe: true
    }));
  } else {
    localStorage.removeItem('library_remembered_login');
  }
}

// Handle form submit
if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('Đang đăng nhập...');

    const username = loginInput.value.trim();
    const password = passwordInput.value;

    // Sử dụng authService đã có
    const user = authService.login(username, password);
    
    if (!user) {
      setStatus('Sai tài khoản hoặc mật khẩu', true);
      showToast('Sai tài khoản hoặc mật khẩu', true);
      return;
    }

    // Save login if checkbox is checked
    saveLogin();

    setStatus('Đăng nhập thành công, đang chuyển trang...');
    showToast(`Chào mừng ${user.fullName || user.username}!`);

    // 🔥 QUAN TRỌNG: Chuyển hướng đến DASHBOARD thay vì tasks.html
    setTimeout(() => {
      window.location.href = 'dashboard.html';  // ĐÃ SỬA: từ tasks.html thành dashboard.html
    }, 500);
  });
}

// Load saved login on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Đảm bảo authService đã được tải
  if (typeof authService !== 'undefined') {
    await authService.init?.();
    await authService.seedDefaultAccount?.();
  }
  loadSavedLogin();
});