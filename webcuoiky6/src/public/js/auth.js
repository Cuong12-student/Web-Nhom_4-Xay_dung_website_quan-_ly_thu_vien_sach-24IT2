// ========== AUTH.JS - CẬP NHẬT ĐẦY ĐỦ ==========

const AUTH_KEY = 'library_current_user';
const USERS_KEY = 'library_users';

class AuthService {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = this.getCurrentUser();
    }
    
    loadUsers() {
        const usersJson = localStorage.getItem(USERS_KEY);
        if (usersJson) {
            try {
                const parsedUsers = JSON.parse(usersJson);
                const normalizedUsers = this.normalizeUsers(parsedUsers);
                if (JSON.stringify(parsedUsers) !== JSON.stringify(normalizedUsers)) {
                    localStorage.setItem(USERS_KEY, JSON.stringify(normalizedUsers));
                }
                return normalizedUsers;
            } catch (e) {
                return this.getDefaultUsers();
            }
        }
        return this.getDefaultUsers();
    }

    normalizeUsers(users) {
        if (!Array.isArray(users)) {
            return this.getDefaultUsers();
        }

        return users.map((user) => {
            const isLegacyDefaultUser = user.username === 'user' && user.email === 'user@library.com';
            const normalizedRole = user.role === 'admin' ? 'admin' : 'staff';

            if (isLegacyDefaultUser) {
                return {
                    ...user,
                    username: 'staff',
                    password: 'staff123',
                    email: 'staff@library.com',
                    fullName: 'Nhân viên thư viện',
                    role: 'staff'
                };
            }

            return {
                ...user,
                role: normalizedRole
            };
        });
    }
    
    getDefaultUsers() {
        return [
            {
                id: '1',
                username: 'admin',
                password: 'admin123',
                email: 'admin@library.com',
                fullName: 'Quản trị viên',
                role: 'admin',
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                username: 'staff',
                password: 'staff123',
                email: 'staff@library.com',
                fullName: 'Nhân viên thư viện',
                role: 'staff',
                createdAt: new Date().toISOString()
            }
        ];
    }
    
    saveUsers() {
        localStorage.setItem(USERS_KEY, JSON.stringify(this.users));
    }
    
    init() {
        // Đảm bảo users đã được load
        return Promise.resolve();
    }
    
    seedDefaultAccount() {
        if (this.users.length === 0) {
            this.users = this.getDefaultUsers();
            this.saveUsers();
        }
        return Promise.resolve();
    }
    
    login(username, password) {
        const user = this.users.find(u => 
            (u.username === username || u.email === username) && 
            u.password === password
        );
        
        if (user) {
            const { password, ...userWithoutPassword } = user;
            sessionStorage.setItem(AUTH_KEY, JSON.stringify(userWithoutPassword));
            this.currentUser = userWithoutPassword;
            return userWithoutPassword;
        }
        return null;
    }
    
    logout() {
        sessionStorage.removeItem(AUTH_KEY);
        this.currentUser = null;
    }
    
    getCurrentUser() {
        const userJson = sessionStorage.getItem(AUTH_KEY);
        if (userJson) {
            try {
                return JSON.parse(userJson);
            } catch (e) {
                return null;
            }
        }
        return null;
    }
    
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    }
    
    register(userData) {
        const existingUser = this.users.find(u => 
            u.username === userData.username || u.email === userData.email
        );
        
        if (existingUser) {
            throw new Error('Tên đăng nhập hoặc email đã tồn tại');
        }
        
        const newUser = {
            id: Date.now().toString(),
            ...userData,
            role: 'staff',
            createdAt: new Date().toISOString()
        };
        
        this.users.push(newUser);
        this.saveUsers();
        
        const { password, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    }

    isAdmin(user = this.getCurrentUser()) {
        return user?.role === 'admin';
    }

    canViewReports(user = this.getCurrentUser()) {
        return this.isAdmin(user);
    }

    applyRoleBasedUI() {
        const user = this.getCurrentUser();
        if (!user) return;

        if (!this.canViewReports(user)) {
            document.querySelectorAll('a[href="reports.html"]').forEach((link) => {
                link.style.display = 'none';
            });
        }
    }

    getThemePreference() {
        const settingsJson = localStorage.getItem('library_settings');
        if (settingsJson) {
            try {
                const settings = JSON.parse(settingsJson);
                if (typeof settings.darkMode === 'boolean') {
                    return settings.darkMode;
                }
            } catch (e) {
                // Fallback to legacy key
            }
        }
        return localStorage.getItem('darkMode') === 'true';
    }

    syncThemePreference(isDark) {
        localStorage.setItem('darkMode', String(isDark));

        const settingsJson = localStorage.getItem('library_settings');
        if (settingsJson) {
            try {
                const settings = JSON.parse(settingsJson);
                settings.darkMode = isDark;
                localStorage.setItem('library_settings', JSON.stringify(settings));
            } catch (e) {
                // Ignore invalid settings payload
            }
        }
    }

    ensureDarkThemeStyles() {
        if (document.getElementById('library-dark-theme-style')) return;

        const style = document.createElement('style');
        style.id = 'library-dark-theme-style';
        style.textContent = `
            body.dark-mode {
                background: radial-gradient(circle at top right, #1f2a3a 0%, #0f1724 45%, #0b1220 100%) !important;
                color: #d9e2ef !important;
            }
            body.dark-mode .sidebar {
                background: linear-gradient(180deg, #101a28 0%, #0a131f 100%) !important;
                border-right: 1px solid #223247;
            }
            body.dark-mode .sidebar-header,
            body.dark-mode .menu-divider {
                border-color: rgba(142, 164, 189, 0.2) !important;
            }
            body.dark-mode .menu-item {
                color: rgba(211, 224, 240, 0.82) !important;
            }
            body.dark-mode .menu-item:hover,
            body.dark-mode .menu-item.active {
                background: rgba(102, 126, 234, 0.2) !important;
                color: #f1f6ff !important;
            }
            body.dark-mode .top-bar,
            body.dark-mode .card,
            body.dark-mode .stat-card,
            body.dark-mode .chart-card,
            body.dark-mode .top-list,
            body.dark-mode .filter-bar,
            body.dark-mode .search-card,
            body.dark-mode .tab-container,
            body.dark-mode .tab-pane,
            body.dark-mode .settings-card,
            body.dark-mode .reader-detail-card,
            body.dark-mode .pagination-container,
            body.dark-mode .modal-content,
            body.dark-mode .danger-zone,
            body.dark-mode .history-table,
            body.dark-mode .book-table,
            body.dark-mode .reader-table,
            body.dark-mode .borrow-table {
                background: #132033 !important;
                color: #dbe7f5 !important;
                box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22) !important;
                border-color: #2a3a4f !important;
            }
            body.dark-mode .page-title h1,
            body.dark-mode .user-name,
            body.dark-mode .card-header h3,
            body.dark-mode .stat-info h3,
            body.dark-mode h3,
            body.dark-mode h4,
            body.dark-mode p,
            body.dark-mode label,
            body.dark-mode small,
            body.dark-mode span,
            body.dark-mode td,
            body.dark-mode th {
                color: #dbe7f5 !important;
            }
            body.dark-mode .card-header,
            body.dark-mode .history-table td,
            body.dark-mode .history-table th,
            body.dark-mode .book-table td,
            body.dark-mode .book-table th,
            body.dark-mode .reader-table td,
            body.dark-mode .reader-table th,
            body.dark-mode .borrow-table td,
            body.dark-mode .borrow-table th,
            body.dark-mode .setting-item,
            body.dark-mode .list-item {
                border-color: #2a3a4f !important;
            }
            body.dark-mode .history-table th,
            body.dark-mode .book-table th,
            body.dark-mode .reader-table th,
            body.dark-mode .borrow-table th {
                background: #1b2a3f !important;
                color: #9fb4ce !important;
            }
            body.dark-mode .status-badge,
            body.dark-mode .member-badge {
                border: 1px solid rgba(255, 255, 255, 0.08) !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18) !important;
                font-weight: 700 !important;
            }
            body.dark-mode .status-available,
            body.dark-mode .status-active {
                background: linear-gradient(135deg, #1f6f43, #2c8a57) !important;
                color: #eafff2 !important;
            }
            body.dark-mode .status-borrowed,
            body.dark-mode .status-expired {
                background: linear-gradient(135deg, #7a5a14, #9b7420) !important;
                color: #fff7db !important;
            }
            body.dark-mode .status-damaged,
            body.dark-mode .status-blocked,
            body.dark-mode .status-overdue {
                background: linear-gradient(135deg, #7a2730, #9a3340) !important;
                color: #ffe7ea !important;
            }
            body.dark-mode .member-student {
                background: linear-gradient(135deg, #163a63, #22578f) !important;
                color: #dbeafe !important;
            }
            body.dark-mode .member-teacher {
                background: linear-gradient(135deg, #1f6f43, #2f8f58) !important;
                color: #eafff2 !important;
            }
            body.dark-mode .member-external {
                background: linear-gradient(135deg, #7a5a14, #9b7420) !important;
                color: #fff7db !important;
            }
            body.dark-mode .filter-bar input,
            body.dark-mode .filter-bar select,
            body.dark-mode .form-group input,
            body.dark-mode .form-group select,
            body.dark-mode .form-group textarea {
                background: #0e1726 !important;
                color: #e8f0fb !important;
                border-color: #31445d !important;
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
            }
            body.dark-mode .filter-bar input::placeholder,
            body.dark-mode .form-group input::placeholder,
            body.dark-mode .form-group textarea::placeholder {
                color: #7f93aa !important;
            }
            body.dark-mode .filter-bar select option,
            body.dark-mode .form-group select option {
                background: #0f1a2a !important;
                color: #e8f0fb !important;
            }
            body.dark-mode input,
            body.dark-mode select,
            body.dark-mode textarea,
            body.dark-mode .setting-input,
            body.dark-mode .page-btn {
                background: #0f1a2a !important;
                color: #dbe7f5 !important;
                border-color: #2a3a4f !important;
            }
            body.dark-mode .page-btn:hover:not(:disabled) {
                background: #304f76 !important;
            }
            body.dark-mode .news-item:hover {
                background: #1b2a3f !important;
            }
            body.dark-mode footer {
                background: #0e1b2d !important;
                color: #b9cbe1 !important;
            }
        `;
        document.head.appendChild(style);
    }

    updateDarkToggleIcon() {
        const toggle = document.getElementById('darkModeToggle');
        if (!toggle) return;

        const isDark = document.body.classList.contains('dark-mode');
        toggle.innerHTML = `<i class="fas ${isDark ? 'fa-sun' : 'fa-moon'}"></i>`;
    }

    setDarkMode(isDark, shouldSync = true) {
        document.body.classList.toggle('dark-mode', !!isDark);
        this.updateDarkToggleIcon();

        const switchInput = document.getElementById('darkModeToggleSwitch');
        if (switchInput) switchInput.checked = !!isDark;

        if (shouldSync) {
            this.syncThemePreference(!!isDark);
        }
    }

    bindDarkModeToggle() {
        const toggle = document.getElementById('darkModeToggle');
        if (!toggle || toggle.dataset.themeBound === '1') return;

        toggle.dataset.themeBound = '1';
        toggle.addEventListener('click', () => {
            const isDarkNow = !document.body.classList.contains('dark-mode');
            this.setDarkMode(isDarkNow, true);
        });
    }

    initTheme() {
        this.ensureDarkThemeStyles();
        this.setDarkMode(this.getThemePreference(), false);
        this.bindDarkModeToggle();
    }
}

const authService = new AuthService();

document.addEventListener('DOMContentLoaded', () => {
    authService.applyRoleBasedUI();
    authService.initTheme();

    const currentPage = window.location.pathname.split('/').pop().toLowerCase();
    if (currentPage === 'reports.html' && authService.isLoggedIn() && !authService.canViewReports()) {
        window.location.href = 'dashboard.html';
    }
});