// ========== REPORTS.JS - BÁO CÁO THỐNG KÊ ==========

let categoryChart = null;
let monthlyChart = null;

function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${isError ? 'error' : ''}`;
    toast.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function refreshReports() {
    updateStatisticsCards();
    updateCategoryChart();
    updateMonthlyChart();
    updateTopBooks();
    updateTopReaders();
    updateOverdueList();
}

function updateStatisticsCards() {
    const stats = reportService.getStatistics();
    const statsGrid = document.getElementById('statsGrid');
    
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon books"><i class="fas fa-book"></i></div>
            <div class="stat-info">
                <h3>${stats.books.totalBooks}</h3>
                <p>Tổng số sách</p>
                <small>Có sẵn: ${stats.books.availableBooks}</small>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon readers"><i class="fas fa-users"></i></div>
            <div class="stat-info">
                <h3>${stats.readers.totalReaders}</h3>
                <p>Tổng độc giả</p>
                <small>Đang hoạt động: ${stats.readers.activeReaders}</small>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon borrow"><i class="fas fa-hand-holding-heart"></i></div>
            <div class="stat-info">
                <h3>${stats.borrows.currentBorrows}</h3>
                <p>Đang mượn</p>
                <small>Quá hạn: ${stats.borrows.overdueBorrows}</small>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon fine"><i class="fas fa-coins"></i></div>
            <div class="stat-info">
                <h3>${stats.fines.toLocaleString()}đ</h3>
                <p>Tổng tiền phạt</p>
            </div>
        </div>
    `;
}

function updateCategoryChart() {
    const categoryStats = reportService.getStatisticsByCategory();
    const categories = Object.keys(categoryStats);
    const totals = categories.map(cat => categoryStats[cat].total);
    
    const ctx = document.getElementById('categoryChart').getContext('2d');
    if (categoryChart) categoryChart.destroy();
    
    categoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: totals,
                backgroundColor: ['#667eea', '#f093fb', '#4facfe', '#fa709a', '#43e97b', '#f9c74f', '#f9844a', '#577590'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function updateMonthlyChart() {
    const monthlyStats = reportService.getMonthlyBorrowStats();
    const months = Object.keys(monthlyStats).sort();
    const borrowsData = months.map(m => monthlyStats[m].borrows);
    const returnsData = months.map(m => monthlyStats[m].returns);
    
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    if (monthlyChart) monthlyChart.destroy();
    
    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Số lượt mượn',
                    data: borrowsData,
                    borderColor: '#4facfe',
                    backgroundColor: 'rgba(79, 172, 254, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Số lượt trả',
                    data: returnsData,
                    borderColor: '#43e97b',
                    backgroundColor: 'rgba(67, 233, 123, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top' }
            }
        }
    });
}

function updateTopBooks() {
    const topBooks = reportService.getTopBooks(10);
    const container = document.getElementById('topBooksList');
    
    if (!topBooks || topBooks.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #718096;">Chưa có dữ liệu</p>';
        return;
    }
    
    container.innerHTML = topBooks.map((book, index) => `
        <div class="list-item">
            <div>
                <span class="rank">${index + 1}.</span>
                <strong>${escapeHtml(book.title)}</strong>
                <br><small style="color: #718096;">${book.author}</small>
            </div>
            <div style="text-align: right;">
                <span style="color: #27ae60; font-weight: bold;">${book.borrowedCount}</span>
                <small> lượt mượn</small>
            </div>
        </div>
    `).join('');
}

function updateTopReaders() {
    const topReaders = reportService.getTopReaders(10);
    const container = document.getElementById('topReadersList');
    
    if (!topReaders || topReaders.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #718096;">Chưa có dữ liệu</p>';
        return;
    }
    
    container.innerHTML = topReaders.map((reader, index) => `
        <div class="list-item">
            <div>
                <span class="rank">${index + 1}.</span>
                <strong>${escapeHtml(reader.fullName)}</strong>
                <br><small style="color: #718096;">${reader.cardId}</small>
            </div>
            <div style="text-align: right;">
                <span style="color: #f39c12; font-weight: bold;">${reader.borrowedCount}</span>
                <small> lượt mượn</small>
                ${reader.totalFines > 0 ? `<br><small style="color: #e74c3c;">Phạt: ${reader.totalFines.toLocaleString()}đ</small>` : ''}
            </div>
        </div>
    `).join('');
}

function updateOverdueList() {
    const overdueList = reportService.getOverdueList();
    const container = document.getElementById('overdueList');
    const section = document.getElementById('overdueSection');
    
    if (!overdueList || overdueList.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #27ae60;"><i class="fas fa-check-circle"></i> Không có sách quá hạn</p>';
        section.style.borderLeft = '4px solid #27ae60';
        return;
    }
    
    section.style.borderLeft = '4px solid #e74c3c';
    
    container.innerHTML = overdueList.map(borrow => {
        const daysOverdue = Math.ceil((new Date() - new Date(borrow.dueDate)) / (1000 * 60 * 60 * 24));
        const fine = daysOverdue * 5000;
        
        return `
            <div class="list-item">
                <div>
                    <strong>${escapeHtml(borrow.bookTitle)}</strong>
                    <br><small>Độc giả: ${escapeHtml(borrow.readerName)} (${borrow.readerCardId})</small>
                </div>
                <div style="text-align: right;">
                    <span style="color: #e74c3c; font-weight: bold;">Quá hạn ${daysOverdue} ngày</span>
                    <br><small>Phạt: ${fine.toLocaleString()}đ</small>
                </div>
            </div>
        `;
    }).join('');
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    const user = authService.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    if (!authService.canViewReports(user)) {
        showToast('Bạn không có quyền xem báo cáo', true);
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
        return;
    }

    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = user.fullName || user.username;
    }
    
    refreshReports();
    
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        authService.logout();
        window.location.href = 'login.html';
    });
});