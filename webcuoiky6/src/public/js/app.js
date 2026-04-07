// App.js - Các hàm chung cho toàn bộ trang web

// Dark Mode Toggle
function initDarkMode() {
    if (typeof authService !== 'undefined' && typeof authService.initTheme === 'function') {
        authService.initTheme();
        return;
    }
}

// Hamburger Menu for Mobile
function initHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (!hamburger || !navMenu) return;
    
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('show');
    });
}

// Update user info in navigation
function updateUserInfoNav() {
    const user = authService?.getCurrentUser();
    const authNav = document.getElementById('authNav');
    
    if (authNav) {
        if (user) {
            authNav.innerHTML = '<a href="#" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a>';
        } else {
            authNav.innerHTML = '<a href="login.html"><i class="fas fa-sign-in-alt"></i> Đăng nhập</a>';
        }
    }
}

// Global logout function
window.logout = function() {
    if (authService) {
        authService.logout();
    }
    showToast('Đã đăng xuất!');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
};

// Show toast notification
window.showToast = function(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${isError ? 'error' : ''}`;
    toast.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initHamburgerMenu();
    updateUserInfoNav();
});

// Toggle menu function for inline onclick
window.toggleMenu = function() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.toggle('show');
    }
};