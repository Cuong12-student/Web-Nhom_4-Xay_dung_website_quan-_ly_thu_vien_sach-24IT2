// js/history.js
function showToast(msg, isErr = false) {
    let toast = document.createElement('div');
    toast.className = `toast-notification ${isErr ? 'error' : ''}`;
    toast.innerHTML = `<i class="fas ${isErr ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(str) { return str ? str.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])) : ''; }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : ''; }

function loadHistory() {
    let status = document.getElementById('statusFilter').value;
    let records = borrowService.getAllBorrowRecords();
    if (status) records = records.filter(r => r.status === status);
    let tbody = document.getElementById('historyList');
    if (!records.length) { tbody.innerHTML = '<tr><td colspan="10" style="text-align:center">📋 Không có phiếu mượn</td></tr>'; return; }
    tbody.innerHTML = records.map(r => {
        let isOverdue = r.status === 'borrowed' && new Date(r.dueDate) < new Date();
        let statusClass = r.status === 'borrowed' ? (isOverdue ? 'status-overdue' : 'status-borrowed') : 'status-returned';
        let statusText = r.status === 'borrowed' ? (isOverdue ? '⚠️ Quá hạn' : '📖 Đang mượn') : '✅ Đã trả';
        return `<tr><td><code>${r.id}</code></td><td><strong>${escapeHtml(r.bookTitle)}</strong></td><td><code>${r.bookBarcode}</code></td>
            <td>${escapeHtml(r.readerName)}<br><small>${r.readerCardId}</small></td><td>${formatDate(r.borrowDate)}</td>
            <td>${formatDate(r.dueDate)}</td><td>${r.returnDate ? formatDate(r.returnDate) : '-'}</td>
            <td><span class="${statusClass}">${statusText}</span></td><td>${r.fine ? r.fine.toLocaleString()+'đ' : '-'}</td>
            <td>${r.status === 'borrowed' ? `<button class="btn btn-sm" onclick="quickReturn('${r.id}')">Trả</button>` : '-'}</td></tr>`;
    }).join('');
}

function searchReaderDetail() {
    let keyword = document.getElementById('readerSearch').value.trim();
    if (!keyword) { document.getElementById('readerDetail').classList.remove('show'); loadHistory(); return; }
    let reader = readerService.getReaderByCardId(keyword);
    if (!reader) reader = readerService.getAllReaders().find(r => r.fullName.toLowerCase().includes(keyword.toLowerCase()));
    if (!reader) return showToast('Không tìm thấy độc giả', true);
    let records = borrowService.getBorrowRecordsByReader(reader.id);
    let tbody = document.getElementById('historyList');
    if (!records.length) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center">Độc giả chưa mượn sách</td></tr>';
    else tbody.innerHTML = records.map(r => { let isOverdue = r.status === 'borrowed' && new Date(r.dueDate) < new Date(); let statusClass = r.status === 'borrowed' ? (isOverdue ? 'status-overdue' : 'status-borrowed') : 'status-returned'; let statusText = r.status === 'borrowed' ? (isOverdue ? '⚠️ Quá hạn' : '📖 Đang mượn') : '✅ Đã trả'; return `<tr><td><code>${r.id}</code></td><td><strong>${escapeHtml(r.bookTitle)}</strong></td><td><code>${r.bookBarcode}</code></td><td>${escapeHtml(r.readerName)}<br><small>${r.readerCardId}</small></td><td>${formatDate(r.borrowDate)}</td><td>${formatDate(r.dueDate)}</td><td>${r.returnDate ? formatDate(r.returnDate) : '-'}</td><td><span class="${statusClass}">${statusText}</span></td><td>${r.fine ? r.fine.toLocaleString()+'đ' : '-'}</td><td>${r.status === 'borrowed' ? `<button class="btn btn-sm" onclick="quickReturn('${r.id}')">Trả</button>` : '-'}</td></tr>`; }).join('');
    let currentBooks = records.filter(r => r.status === 'borrowed');
    document.getElementById('readerDetail').innerHTML = `
        <h3><i class="fas fa-user-circle"></i> Thông tin độc giả: ${escapeHtml(reader.fullName)}</h3>
        <div class="detail-row"><div class="detail-label">Mã thẻ:</div><div>${reader.cardId}</div></div>
        <div class="detail-row"><div class="detail-label">Email:</div><div>${reader.email || '-'}</div></div>
        <div class="detail-row"><div class="detail-label">SĐT:</div><div>${reader.phone || '-'}</div></div>
        <div class="detail-row"><div class="detail-label">Loại:</div><div>${reader.memberType === 'student' ? 'Sinh viên' : reader.memberType === 'teacher' ? 'Giảng viên' : 'Bên ngoài'}</div></div>
        <div class="detail-row"><div class="detail-label">Nợ phạt:</div><div style="color:${reader.totalFines>0?'#e74c3c':'#27ae60'}">${reader.totalFines?.toLocaleString()||0}đ</div></div>
        ${currentBooks.length ? `<div class="current-books"><h4>Sách đang mượn (${currentBooks.length})</h4>${currentBooks.map(b => `<div><strong>${escapeHtml(b.bookTitle)}</strong><br>Hạn: ${formatDate(b.dueDate)}</div>`).join('')}</div>` : ''}
    `;
    document.getElementById('readerDetail').classList.add('show');
}

function quickReturn(id) { let r = borrowService.getBorrowRecordById(id); if(r && confirm('Xác nhận trả sách?')) { let result = borrowService.returnBook(id); showToast(result.message || (result.fine ? `Trả thành công! Phạt: ${result.fine.toLocaleString()}đ` : 'Trả thành công!')); searchReaderDetail(); loadHistory(); } }

function updateUserInfo() {
    let user = authService.getCurrentUser();
    let nameSpan = document.getElementById('userName');
    if(nameSpan) nameSpan.textContent = user?.fullName || user?.username || 'Admin';
}

document.addEventListener('DOMContentLoaded', () => {
    if(!authService.getCurrentUser()) { window.location.href = 'login.html'; return; }
    loadHistory();
    updateUserInfo();
    authService.initTheme?.();
    document.getElementById('logoutBtn')?.addEventListener('click', e => { e.preventDefault(); authService.logout(); window.location.href = 'login.html'; });
    document.getElementById('readerSearch')?.addEventListener('keypress', e => { if(e.key === 'Enter') searchReaderDetail(); });
});