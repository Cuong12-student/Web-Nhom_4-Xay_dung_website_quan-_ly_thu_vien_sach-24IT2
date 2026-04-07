// js/settings.js
let currentSettings = { maxBorrowDays: 14, finePerDay: 5000, maxStudentBooks: 5, maxTeacherBooks: 10, darkMode: false };

function showToast(msg, isErr = false) {
    let toast = document.createElement('div');
    toast.className = `toast-notification ${isErr ? 'error' : ''}`;
    toast.innerHTML = `<i class="fas ${isErr ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function loadSettings() {
    let saved = localStorage.getItem('library_settings');
    if (saved) currentSettings = JSON.parse(saved);
    if (typeof currentSettings.darkMode !== 'boolean') {
        currentSettings.darkMode = localStorage.getItem('darkMode') === 'true';
    }
    document.getElementById('maxBorrowDays').value = currentSettings.maxBorrowDays;
    document.getElementById('finePerDay').value = currentSettings.finePerDay;
    document.getElementById('maxStudentBooks').value = currentSettings.maxStudentBooks;
    document.getElementById('maxTeacherBooks').value = currentSettings.maxTeacherBooks;
    document.getElementById('darkModeToggleSwitch').checked = currentSettings.darkMode;
    if (typeof authService !== 'undefined' && typeof authService.setDarkMode === 'function') {
        authService.setDarkMode(currentSettings.darkMode, false);
    } else {
        document.body.classList.toggle('dark-mode', !!currentSettings.darkMode);
    }
}

function saveGeneralSettings() {
    currentSettings = {
        maxBorrowDays: parseInt(document.getElementById('maxBorrowDays').value),
        finePerDay: parseInt(document.getElementById('finePerDay').value),
        maxStudentBooks: parseInt(document.getElementById('maxStudentBooks').value),
        maxTeacherBooks: parseInt(document.getElementById('maxTeacherBooks').value),
        darkMode: document.getElementById('darkModeToggleSwitch').checked
    };
    localStorage.setItem('library_settings', JSON.stringify(currentSettings));
    localStorage.setItem('darkMode', String(currentSettings.darkMode));
    if (typeof authService !== 'undefined' && typeof authService.setDarkMode === 'function') {
        authService.setDarkMode(currentSettings.darkMode, false);
    } else {
        document.body.classList.toggle('dark-mode', !!currentSettings.darkMode);
    }
    showToast('Đã lưu cài đặt!');
}

function clearAllData() {
    if (confirm('⚠️ Xóa TOÀN BỘ dữ liệu? Không thể hoàn tác!')) {
        localStorage.removeItem('library_books');
        localStorage.removeItem('library_readers');
        localStorage.removeItem('library_borrows');
        showToast('Đã xóa dữ liệu! Trang sẽ tải lại.');
        setTimeout(() => location.reload(), 1500);
    }
}

function resetSampleData() {
    if (confirm('Khôi phục dữ liệu mẫu? Dữ liệu hiện tại sẽ mất!')) {
        localStorage.removeItem('library_books');
        localStorage.removeItem('library_readers');
        localStorage.removeItem('library_borrows');
        showToast('Đã khôi phục dữ liệu mẫu! Trang sẽ tải lại.');
        setTimeout(() => location.reload(), 1500);
    }
}

function changePassword() {
    let newPass = prompt('Nhập mật khẩu mới (tối thiểu 6 ký tự):');
    if (newPass && newPass.length >= 6) {
        let users = JSON.parse(localStorage.getItem('library_users') || '[]');
        let currentUser = authService.getCurrentUser();
        let userIndex = users.findIndex(u => u.username === currentUser.username);
        if (userIndex !== -1) { users[userIndex].password = newPass; localStorage.setItem('library_users', JSON.stringify(users)); showToast('Đổi mật khẩu thành công!'); setTimeout(() => { authService.logout(); window.location.href = 'login.html'; }, 1500); }
        else showToast('Lỗi: Không tìm thấy user', true);
    } else if (newPass) showToast('Mật khẩu phải có ít nhất 6 ký tự', true);
}

function updateSystemInfo() {
    document.getElementById('totalBooks').textContent = bookService.getAllBooks().length;
    document.getElementById('totalReaders').textContent = readerService.getAllReaders().length;
    document.getElementById('totalBorrows').textContent = borrowService.getAllBorrowRecords().length;
}

function updateUserInfo() {
    let user = authService.getCurrentUser();
    if (user) {
        document.getElementById('currentUsername').textContent = user.username;
        document.getElementById('currentEmail').textContent = user.email || 'Chưa cập nhật';
        document.getElementById('currentRole').textContent = user.role === 'admin' ? 'Quản trị viên' : 'Thủ thư';
        document.getElementById('userName').textContent = user.fullName || user.username;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!authService.getCurrentUser()) { window.location.href = 'login.html'; return; }
    loadSettings();
    updateSystemInfo();
    updateUserInfo();
    authService.initTheme?.();
    document.getElementById('logoutBtn')?.addEventListener('click', e => { e.preventDefault(); authService.logout(); window.location.href = 'login.html'; });
});