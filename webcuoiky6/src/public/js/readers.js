// js/readers.js - Quản lý độc giả (có thanh toán nợ)
let currentReaders = [], currentPage = 1, pageSize = 10, totalPages = 1, currentDetailReaderId = null;
let currentReaderSort = { key: null, direction: 'desc' };

function showToast(msg, isErr = false) {
    let toast = document.createElement('div');
    toast.className = `toast-notification ${isErr ? 'error' : ''}`;
    toast.innerHTML = `<i class="fas ${isErr ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(str) { return str ? str.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])) : ''; }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : ''; }

function toDateInputValue(dateValue) {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getMemberTypeText(type) {
    const map = {
        'student': '<span class="member-badge member-student"><i class="fas fa-graduation-cap"></i> Sinh viên</span>',
        'teacher': '<span class="member-badge member-teacher"><i class="fas fa-chalkboard-teacher"></i> Giảng viên</span>',
        'external': '<span class="member-badge member-external"><i class="fas fa-building"></i> Bên ngoài</span>'
    };
    return map[type] || type;
}

function getStatusBadge(status) {
    const map = {
        'active': '<span class="status-badge status-active"><i class="fas fa-check-circle"></i> Đang hoạt động</span>',
        'blocked': '<span class="status-badge status-blocked"><i class="fas fa-ban"></i> Bị khóa</span>',
        'expired': '<span class="status-badge status-expired"><i class="fas fa-clock"></i> Hết hạn</span>'
    };
    return map[status] || map.active;
}

function getReaderStatusRank(status) {
    const ranks = { active: 3, blocked: 2, expired: 1 };
    return ranks[status] || 0;
}

function getReaderOutstandingFine(reader) {
    const overdueFine = readerService.getOverdueFineForReader(reader.id);
    return (reader.totalFines || 0) + overdueFine;
}

function updateReaderSortIndicators() {
    document.querySelectorAll('[data-sort-indicator]').forEach(el => {
        const key = el.getAttribute('data-sort-indicator');
        if (currentReaderSort.key === key) {
            el.textContent = currentReaderSort.direction === 'desc' ? '↓' : '↑';
            el.style.opacity = '1';
        } else {
            el.textContent = '↕';
            el.style.opacity = '0.65';
        }
    });
}

function sortReadersBy(key) {
    if (currentReaderSort.key === key) {
        currentReaderSort.direction = currentReaderSort.direction === 'desc' ? 'asc' : 'desc';
    } else {
        currentReaderSort.key = key;
        currentReaderSort.direction = 'desc';
    }
    currentPage = 1;
    loadReaders();
}

function applyReaderSorting(readers) {
    if (!currentReaderSort.key) return readers;

    const direction = currentReaderSort.direction === 'asc' ? 1 : -1;
    return [...readers].sort((a, b) => {
        let left = 0;
        let right = 0;

        if (currentReaderSort.key === 'borrowedCount') {
            left = Number(a.borrowedCount) || 0;
            right = Number(b.borrowedCount) || 0;
        } else if (currentReaderSort.key === 'outstandingFine') {
            left = getReaderOutstandingFine(a);
            right = getReaderOutstandingFine(b);
        } else if (currentReaderSort.key === 'status') {
            left = getReaderStatusRank(a.status);
            right = getReaderStatusRank(b.status);
        }

        return (left - right) * direction;
    });
}

function loadReaders() {
    let keyword = document.getElementById('searchInput')?.value || '';
    let status = document.getElementById('statusFilter')?.value || '';
    let memberType = document.getElementById('typeFilter')?.value || '';
    
    let readers = readerService.getAllReaders();
    if (keyword) readers = readers.filter(r => r.fullName.toLowerCase().includes(keyword.toLowerCase()) || r.cardId.includes(keyword) || (r.email && r.email.includes(keyword)) || (r.phone && r.phone.includes(keyword)));
    if (status) readers = readers.filter(r => r.status === status);
    if (memberType) readers = readers.filter(r => r.memberType === memberType);
    
    readers = applyReaderSorting(readers);
    currentReaders = readers;
    totalPages = Math.ceil(currentReaders.length / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    
    let start = (currentPage - 1) * pageSize;
    renderReadersTable(currentReaders.slice(start, start + pageSize));
    updatePaginationUI();
    updateReaderSortIndicators();
}

function renderReadersTable(readers) {
    let tbody = document.getElementById('readerList');
    if (!tbody) return;
    if (!readers.length) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:3rem;">👥 Không có độc giả nào</td></tr>';
        return;
    }
    
    tbody.innerHTML = readers.map(reader => {
        const overdueFine = readerService.getOverdueFineForReader(reader.id);
        const outstandingFine = (reader.totalFines || 0) + overdueFine;
        let fineWarning = outstandingFine > 100000 ? '<span style="color:#e74c3c"><i class="fas fa-exclamation-triangle"></i> Nợ cao</span>' : '';
        let expiryDate = new Date(reader.expiryDate);
        let daysLeft = Math.ceil((expiryDate - new Date()) / (1000*60*60*24));
        let expiryWarning = daysLeft <= 30 && daysLeft > 0 ? `<span style="color:#f39c12">(còn ${daysLeft} ngày)</span>` : (daysLeft <= 0 ? `<span style="color:#e74c3c">(hết hạn)</span>` : '');
        const isExpired = daysLeft <= 0;
        
        return `
            <tr>
                <td><code>${reader.cardId}</code></td>
                <td><div style="display:flex;align-items:center;gap:8px"><div style="width:35px;height:35px;background:#667eea;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff"><i class="fas fa-user"></i></div><div><b>${escapeHtml(reader.fullName)}</b></div></div></td>
                <td>${reader.email || '-'}<br><small>📞 ${reader.phone || '-'}</small></td>
                <td>${getMemberTypeText(reader.memberType)}</td>
                <td>${formatDate(reader.joinDate)}</td>
                <td>${formatDate(reader.expiryDate)} ${expiryWarning}</td>
                <td style="text-align:center"><b>${reader.borrowedCount || 0}</b></td>
                <td>
                    <span style="color:${outstandingFine > 0 ? '#e74c3c' : '#27ae60'}">${outstandingFine.toLocaleString()}đ</span>
                    ${overdueFine > 0 ? `<br><small style="color:#e67e22">(tạm tính quá hạn: ${overdueFine.toLocaleString()}đ)</small>` : ''}
                    ${fineWarning}
                </td>
                <td>${getStatusBadge(reader.status)}</td>
                <td>
                    <div style="display:flex;flex-direction:column;gap:5px">
                        <div style="display:flex;gap:5px">
                            <button class="btn btn-sm" onclick="viewReaderDetail('${reader.id}')" style="background:#4facfe;color:#fff"><i class="fas fa-info-circle"></i></button>
                            <button class="btn btn-sm" onclick="openEditModal('${reader.id}')" style="background:#f39c12;color:#fff"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-danger" onclick="deleteReader('${reader.id}')" style="background:#e74c3c;color:#fff"><i class="fas fa-trash"></i></button>
                        </div>
                        ${reader.totalFines > 0 ? `
                            <button class="btn btn-sm" onclick="payFine('${reader.id}')" style="background:#27ae60;color:#fff;width:100%">
                                <i class="fas fa-money-bill-wave"></i> Thanh toán ${reader.totalFines.toLocaleString()}đ
                            </button>
                        ` : ''}
                        ${reader.status === 'blocked' && reader.totalFines === 0 ? `
                            <button class="btn btn-sm" onclick="unlockReader('${reader.id}')" style="background:#27ae60;color:#fff;width:100%">
                                <i class="fas fa-unlock-alt"></i> Mở khóa
                            </button>
                        ` : ''}
                        ${isExpired ? `
                            <button class="btn btn-sm" onclick="renewReader('${reader.id}')" style="background:#2c5282;color:#fff;width:100%">
                                <i class="fas fa-calendar-plus"></i> Gia hạn thẻ
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updatePaginationUI() {
    let info = document.getElementById('pageInfo');
    let record = document.getElementById('recordInfo');
    if (info) info.innerHTML = `Trang ${currentPage} / ${totalPages}`;
    if (record) record.innerHTML = `Tổng: ${currentReaders.length} độc giả`;
    ['firstPageBtn', 'prevPageBtn'].forEach(id => { let btn = document.getElementById(id); if(btn) btn.disabled = currentPage <= 1; });
    ['nextPageBtn', 'lastPageBtn'].forEach(id => { let btn = document.getElementById(id); if(btn) btn.disabled = currentPage >= totalPages; });
}

function goToPage(page) { if(page >= 1 && page <= totalPages) { currentPage = page; loadReaders(); window.scrollTo(0,0); } }
function changePageSize() { pageSize = parseInt(document.getElementById('pageSizeSelect').value); currentPage = 1; localStorage.setItem('library_pageSize_readers', pageSize); loadReaders(); }

// ========== THANH TOÁN NỢ PHẠT ==========
function payFine(readerId) {
    if (!checkAdmin()) return;
    
    const reader = readerService.getReaderById(readerId);
    if (!reader) {
        showToast('Không tìm thấy độc giả', true);
        return;
    }
    
    if (reader.totalFines <= 0) {
        showToast('Độc giả không có nợ phạt', true);
        return;
    }
    
    const fineAmount = reader.totalFines;
    const confirmMsg = `💰 XÁC NHẬN THANH TOÁN\n\nĐộc giả: ${reader.fullName}\nSố tiền nợ: ${fineAmount.toLocaleString()}đ\n\nSau khi thanh toán, thẻ sẽ được mở khóa (nếu đang bị khóa).\n\nXác nhận thanh toán?`;
    
    if (confirm(confirmMsg)) {
        const result = readerService.payFine(readerId, fineAmount);
        showToast(result.message);
        
        if (result.success) {
            loadReaders();
            if (currentDetailReaderId === readerId) {
                viewReaderDetail(readerId);
            }
        }
    }
}

// ========== MỞ KHÓA ==========
function unlockReader(readerId) {
    if (!checkAdmin()) return;
    const result = readerService.unblockReader(readerId);
    showToast(result.message, !result.success);
    if (result.success) { loadReaders(); if (currentDetailReaderId === readerId) viewReaderDetail(readerId); }
}

// ========== KHÓA ==========
function blockReader(readerId) {
    if (!checkAdmin()) return;
    const reader = readerService.getReaderById(readerId);
    if (!reader) return showToast('Không tìm thấy độc giả', true);
    if (reader.borrowedCount > 0) return showToast('❌ Không thể khóa độc giả đang mượn sách', true);
    
    const reason = prompt('Nhập lý do khóa thẻ:', 'Vi phạm quy định thư viện');
    if (reason && confirm(`Xác nhận KHÓA thẻ cho "${reader.fullName}"?`)) {
        const result = readerService.blockReader(readerId, reason);
        showToast(result.message, !result.success);
        if (result.success) { loadReaders(); if (currentDetailReaderId === readerId) viewReaderDetail(readerId); }
    }
}

function renewReader(readerId) {
    if (!checkAdmin()) return;
    const reader = readerService.getReaderById(readerId);
    if (!reader) return showToast('Không tìm thấy độc giả', true);

    const monthsText = prompt(`Nhập số tháng gia hạn cho ${reader.fullName}:`, '12');
    if (!monthsText) return;

    const months = parseInt(monthsText, 10);
    if (isNaN(months) || months <= 0) {
        showToast('Số tháng gia hạn không hợp lệ', true);
        return;
    }

    if (!confirm(`Xác nhận gia hạn thẻ cho "${reader.fullName}" thêm ${months} tháng?`)) return;

    const result = readerService.renewCard(readerId, months);
    showToast(result.message, !result.success);
    if (result.success) {
        loadReaders();
        if (currentDetailReaderId === readerId) viewReaderDetail(readerId);
    }
}

// ========== XEM CHI TIẾT ==========
function viewReaderDetail(readerId) {
    let reader = readerService.getReaderById(readerId);
    if (!reader) return showToast('Không tìm thấy độc giả', true);
    currentDetailReaderId = readerId;
    
    let borrows = borrowService.getBorrowRecordsByReader(readerId);
    let currentBooks = borrows.filter(r => r.status === 'borrowed');
    let canUnblock = reader.status === 'blocked' && reader.totalFines < 200000;
    const overdueFine = readerService.getOverdueFineForReader(reader.id);
    const outstandingFine = (reader.totalFines || 0) + overdueFine;
    const isExpired = reader.expiryDate ? new Date(reader.expiryDate) < new Date() : reader.status === 'expired';
    
    let modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'readerDetailModal';
    modal.onclick = (e) => { if(e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="modal-content" style="max-width:600px" onclick="event.stopPropagation()">
            <div class="modal-header" style="background:linear-gradient(135deg,#2c5282,#1e3c5c);color:#fff">
                <h3><i class="fas fa-user-circle"></i> Chi tiết độc giả</h3>
                <span class="modal-close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <div style="display:flex;gap:1rem;margin-bottom:1rem">
                    <div style="width:80px;height:80px;background:#667eea;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff"><i class="fas fa-user fa-3x"></i></div>
                    <div><h3>${escapeHtml(reader.fullName)}</h3><p><i class="fas fa-id-card"></i> ${reader.cardId}<br>${getMemberTypeText(reader.memberType)} | ${getStatusBadge(reader.status)}</p></div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#f8fafc;padding:1rem;border-radius:12px;margin-bottom:1rem">
                    <div><b>📧 Email:</b> ${reader.email || '-'}</div>
                    <div><b>📞 Điện thoại:</b> ${reader.phone || '-'}</div>
                    <div><b>📍 Địa chỉ:</b> ${reader.address || '-'}</div>
                    <div><b>🆔 CMND:</b> ${reader.idCard || '-'}</div>
                    <div><b>📅 Ngày tham gia:</b> ${formatDate(reader.joinDate)}</div>
                    <div><b>⏰ Hạn thẻ:</b> ${formatDate(reader.expiryDate)}</div>
                    <div><b>📚 Sách mượn:</b> ${reader.borrowedCount || 0}</div>
                    <div><b>💰 Nợ phạt:</b> <span style="color:${outstandingFine > 0 ? '#e74c3c' : '#27ae60'}">${outstandingFine.toLocaleString()}đ</span>${overdueFine > 0 ? ` <small style="color:#e67e22">(bao gồm tạm tính quá hạn ${overdueFine.toLocaleString()}đ)</small>` : ''}</div>
                </div>
                ${reader.blockReason ? `<div style="background:#fff3cd;padding:1rem;border-radius:12px;margin-bottom:1rem"><b><i class="fas fa-ban"></i> Lý do khóa:</b> ${escapeHtml(reader.blockReason)}</div>` : ''}
                <div><b><i class="fas fa-hand-holding-heart"></i> Sách đang mượn (${currentBooks.length})</b>
                    <div style="max-height:150px;overflow-y:auto;margin-top:8px;border:1px solid #e2e8f0;border-radius:8px;padding:0 10px">
                        ${currentBooks.length ? currentBooks.map(b => `<div style="padding:8px 0;border-bottom:1px solid #e2e8f0"><b>📖 ${escapeHtml(b.bookTitle)}</b><br>Mượn: ${formatDate(b.borrowDate)} | Hạn: ${formatDate(b.dueDate)}</div>`).join('') : '<p style="text-align:center;padding:1rem">Không có sách đang mượn</p>'}
                    </div>
                </div>
                <div style="margin-top:1rem"><b><i class="fas fa-sticky-note"></i> Ghi chú:</b><p style="margin-top:5px;padding:8px;background:#f8fafc;border-radius:8px">${reader.notes || 'Không có ghi chú'}</p></div>
            </div>
            <div class="modal-footer" style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px;">
                <div>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Đóng</button>
                    <button class="btn btn-primary" onclick="editFromDetail()">Sửa thông tin</button>
                </div>
                <div>
                    ${reader.totalFines > 0 ? `
                        <button class="btn btn-success" onclick="payFineFromDetail()" style="background:#27ae60">
                            <i class="fas fa-money-bill-wave"></i> Thanh toán ${reader.totalFines.toLocaleString()}đ
                        </button>
                    ` : ''}
                    ${reader.status === 'blocked' ? 
                        `<button class="btn btn-success" onclick="unlockReaderFromDetail()" ${!canUnblock ? 'disabled' : ''} style="background:#27ae60">
                            <i class="fas fa-unlock-alt"></i> Mở khóa thẻ
                        </button>` : 
                        `<button class="btn btn-danger" onclick="blockReaderFromDetail()" style="background:#e74c3c">
                            <i class="fas fa-lock"></i> Khóa thẻ
                        </button>`
                    }
                    ${isExpired ? `
                        <button class="btn btn-primary" onclick="renewReaderFromDetail()" style="background:#2c5282">
                            <i class="fas fa-calendar-plus"></i> Gia hạn thẻ
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function payFineFromDetail() {
    if (currentDetailReaderId) {
        document.getElementById('readerDetailModal')?.remove();
        payFine(currentDetailReaderId);
    }
}

function unlockReaderFromDetail() {
    if (currentDetailReaderId) {
        document.getElementById('readerDetailModal')?.remove();
        unlockReader(currentDetailReaderId);
    }
}

function blockReaderFromDetail() {
    if (currentDetailReaderId) {
        document.getElementById('readerDetailModal')?.remove();
        blockReader(currentDetailReaderId);
    }
}

function renewReaderFromDetail() {
    if (currentDetailReaderId) {
        document.getElementById('readerDetailModal')?.remove();
        renewReader(currentDetailReaderId);
    }
}

function editFromDetail() {
    document.getElementById('readerDetailModal')?.remove();
    if (currentDetailReaderId) openEditModal(currentDetailReaderId);
}

function openAddModal() { if(!checkAdmin()) return; document.getElementById('modalTitle').innerText = 'Thêm độc giả mới'; document.getElementById('readerId').value = ''; document.getElementById('readerForm').reset(); document.getElementById('readerModal').classList.add('show'); }

function openEditModal(id) {
    if(!checkAdmin()) return;
    let reader = readerService.getReaderById(id);
    if(!reader) return showToast('Không tìm thấy độc giả', true);
    document.getElementById('modalTitle').innerText = 'Sửa thông tin độc giả';
    document.getElementById('readerId').value = reader.id;
    document.getElementById('fullName').value = reader.fullName;
    document.getElementById('email').value = reader.email || '';
    document.getElementById('phone').value = reader.phone || '';
    document.getElementById('address').value = reader.address || '';
    document.getElementById('idCard').value = reader.idCard || '';
    document.getElementById('memberType').value = reader.memberType;
    document.getElementById('expiryDate').value = toDateInputValue(reader.expiryDate);
    document.getElementById('notes').value = reader.notes || '';
    document.getElementById('readerModal').classList.add('show');
}

function saveReader() {
    if(!checkAdmin()) return;
    let id = document.getElementById('readerId').value;
    let fullName = document.getElementById('fullName').value.trim();
    if(!fullName) return showToast('Vui lòng nhập họ tên', true);
    let data = {
        fullName,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        idCard: document.getElementById('idCard').value,
        memberType: document.getElementById('memberType').value,
        notes: document.getElementById('notes').value
    };
    const expiryDate = document.getElementById('expiryDate').value;
    if (expiryDate) {
        data.expiryDate = new Date(`${expiryDate}T00:00:00`).toISOString();
    }
    if(id) readerService.updateReader(id, data);
    else readerService.addReader(data);
    showToast(id ? 'Cập nhật thành công' : 'Thêm độc giả thành công');
    closeModal();
    loadReaders();
}

function deleteReader(id) {
    if(!checkAdmin()) return;
    let reader = readerService.getReaderById(id);
    if(reader.borrowedCount > 0) return showToast('Không thể xóa độc giả đang mượn sách', true);
    if(reader.totalFines > 0) return showToast('Không thể xóa độc giả còn nợ phạt', true);
    if(confirm(`Xóa độc giả "${reader.fullName}"?`)) { readerService.deleteReader(id); showToast('Đã xóa'); loadReaders(); }
}

function closeModal() { document.getElementById('readerModal').classList.remove('show'); }

function checkAdmin() {
    let user = authService.getCurrentUser();
    if(!user) { showToast('Vui lòng đăng nhập', true); setTimeout(()=>window.location.href='login.html',1000); return false; }
    if(user.role !== 'admin') { showToast('Chỉ admin mới có quyền', true); return false; }
    return true;
}

function updateUserInfo() {
    let user = authService.getCurrentUser();
    let nameSpan = document.getElementById('userName');
    if(nameSpan) nameSpan.textContent = user?.fullName || user?.username || 'Admin';
}

document.addEventListener('DOMContentLoaded', () => {
    if(!authService.getCurrentUser()) { window.location.href = 'login.html'; return; }
    let saved = localStorage.getItem('library_pageSize_readers');
    if(saved) { pageSize = parseInt(saved); let select = document.getElementById('pageSizeSelect'); if(select) select.value = pageSize; }
    loadReaders();
    updateUserInfo();
    authService.initTheme?.();
    document.getElementById('logoutBtn')?.addEventListener('click', e => { e.preventDefault(); authService.logout(); window.location.href = 'login.html'; });
    window.onclick = e => { if(e.target === document.getElementById('readerModal')) closeModal(); };
});