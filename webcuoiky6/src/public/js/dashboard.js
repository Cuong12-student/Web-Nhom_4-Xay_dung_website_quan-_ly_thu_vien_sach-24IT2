// ========== DASHBOARD JS ==========

let categoryChart = null;
let monthlyChart = null;

function updateDashboard() {
    const stats = reportService.getStatistics();
    
    // Update stats cards
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon books"><i class="fas fa-book"></i></div>
            <div class="stat-info">
                <h3>${stats.books.totalBooks}</h3>
                <p>Tổng số sách</p>
                <small style="color: #27ae60;">Có sẵn: ${stats.books.availableBooks}</small>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon readers"><i class="fas fa-users"></i></div>
            <div class="stat-info">
                <h3>${stats.readers.totalReaders}</h3>
                <p>Tổng độc giả</p>
                <small style="color: #27ae60;">Đang hoạt động: ${stats.readers.activeReaders}</small>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon borrowing"><i class="fas fa-hand-holding-heart"></i></div>
            <div class="stat-info">
                <h3>${stats.borrows.currentBorrows}</h3>
                <p>Đang mượn sách</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon overdue"><i class="fas fa-exclamation-triangle"></i></div>
            <div class="stat-info">
                <h3>${stats.borrows.overdueBorrows}</h3>
                <p>Quá hạn trả</p>
                <small style="color: #e74c3c;">Tiền phạt: ${stats.fines.toLocaleString()}đ</small>
            </div>
        </div>
    `;
    
    // Update category chart
    const categoryStats = reportService.getStatisticsByCategory();
    const categories = Object.keys(categoryStats);
    const categoryTotals = categories.map(cat => categoryStats[cat].total);
    
    if (categoryChart) categoryChart.destroy();
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(categoryCtx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: categoryTotals,
                backgroundColor: ['#667eea', '#f093fb', '#4facfe', '#fa709a', '#43e97b', '#f9c74f'],
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
    
    // Update monthly chart
    const monthlyStats = reportService.getMonthlyBorrowStats();
    const months = Object.keys(monthlyStats).sort();
    const borrowsData = months.map(m => monthlyStats[m].borrows);
    const returnsData = months.map(m => monthlyStats[m].returns);
    
    if (monthlyChart) monthlyChart.destroy();
    const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
    monthlyChart = new Chart(monthlyCtx, {
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
    
    // Update top books
    const topBooks = reportService.getTopBooks(5);
    const topBooksList = document.getElementById('topBooksList');
    topBooksList.innerHTML = topBooks.map((book, index) => `
        <div style="display: flex; justify-content: space-between; padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">
            <div>
                <span style="font-weight: bold; color: #f39c12;">${index + 1}.</span>
                <strong>${book.title}</strong><br>
                <small style="color: #718096;">${book.author}</small>
            </div>
            <div style="text-align: right;">
                <span style="color: #27ae60; font-weight: bold;">${book.borrowedCount}</span>
                <small> lượt mượn</small>
            </div>
        </div>
    `).join('');
    
    // Update overdue warning
    const overdueList = reportService.getOverdueList();
    const overdueWarning = document.getElementById('overdueWarning');
    if (overdueList.length > 0) {
        overdueWarning.innerHTML = `
            <h3><i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i> Cảnh báo sách quá hạn</h3>
            <p>Có <strong style="color: #e74c3c;">${overdueList.length}</strong> đầu sách đang quá hạn trả. Vui lòng xử lý!</p>
            <div style="margin-top: 0.5rem;">
                ${overdueList.slice(0, 3).map(borrow => `
                    <div style="padding: 0.5rem; background: #fff; border-radius: 8px; margin-bottom: 0.5rem;">
                        <strong>${borrow.bookTitle}</strong> - 
                        <span>Độc giả: ${borrow.readerName}</span><br>
                        <small>Hạn trả: ${new Date(borrow.dueDate).toLocaleDateString('vi-VN')}</small>
                    </div>
                `).join('')}
                ${overdueList.length > 3 ? `<small>... và ${overdueList.length - 3} sách khác</small>` : ''}
            </div>
            <a href="borrow.html?filter=overdue" class="btn btn-warning" style="margin-top: 1rem; display: inline-block;">Xem tất cả</a>
        `;
    } else {
        overdueWarning.innerHTML = `
            <h3><i class="fas fa-check-circle" style="color: #27ae60;"></i> Tốt!</h3>
            <p>Không có sách nào quá hạn trả. Tất cả độc giả đều trả sách đúng hạn!</p>
        `;
        overdueWarning.style.background = '#d4edda';
        overdueWarning.style.borderLeftColor = '#27ae60';
    }
}

// Check login and load dashboard
document.addEventListener('DOMContentLoaded', () => {
    const user = authService.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    updateDashboard();
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        authService.logout();
        window.location.href = 'login.html';
    });
});