// ========== REGISTER.JS - CẬP NHẬT ==========

const registerForm = document.getElementById('registerForm');
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

// Handle form submit
if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const fullName = document.getElementById('fullName').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Client-side validation
    if (password.length < 6) {
      setStatus('Mật khẩu phải có ít nhất 6 ký tự', true);
      showToast('Mật khẩu phải có ít nhất 6 ký tự', true);
      return;
    }

    if (password !== confirmPassword) {
      setStatus('Mật khẩu xác nhận không khớp', true);
      showToast('Mật khẩu xác nhận không khớp', true);
      return;
    }

    try {
      // Sử dụng authService để đăng ký
      const newUser = authService.register({ username, email, fullName, password });
      
      // Đăng nhập tự động sau khi đăng ký
      authService.login(username, password);

      setStatus('Đăng ký thành công! Đang chuyển trang...');
      showToast('Đăng ký thành công! Chào mừng bạn đến với thư viện!');

      // 🔥 QUAN TRỌNG: Chuyển hướng đến DASHBOARD
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 800);
      
    } catch (error) {
      setStatus(error.message, true);
      showToast(error.message, true);
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof authService !== 'undefined') {
    await authService.init?.();
    await authService.seedDefaultAccount?.();
  }
});