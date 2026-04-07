// js/borrow.js - SỬA HOÀN TOÀN LỖI KHÔNG XÁC NHẬN MƯỢN
let currentReader = null;
let currentBook = null;
let currentBorrowRecord = null;

function showToast(msg, isErr = false) {
    let toast = document.createElement('div');
    toast.className = `toast-notification ${isErr ? 'error' : ''}`;
    toast.innerHTML = `<i class="fas ${isErr ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
}

function formatDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('vi-VN');
}

function getSystemSettings() {
    const defaults = { maxBorrowDays: 14, finePerDay: 5000, maxStudentBooks: 5, maxTeacherBooks: 10 };
    const saved = localStorage.getItem('library_settings');
    if (!saved) return defaults;

    try {
        const parsed = JSON.parse(saved);
        const maxBorrowDays = Number.parseInt(parsed?.maxBorrowDays, 10);
        const finePerDay = Number.parseInt(parsed?.finePerDay, 10);
        const maxStudentBooks = Number.parseInt(parsed?.maxStudentBooks, 10);
        const maxTeacherBooks = Number.parseInt(parsed?.maxTeacherBooks, 10);
        return {
            maxBorrowDays: Number.isFinite(maxBorrowDays) ? maxBorrowDays : defaults.maxBorrowDays,
            finePerDay: Number.isFinite(finePerDay) ? Math.max(0, finePerDay) : defaults.finePerDay,
            maxStudentBooks: Number.isFinite(maxStudentBooks) ? maxStudentBooks : defaults.maxStudentBooks,
            maxTeacherBooks: Number.isFinite(maxTeacherBooks) ? maxTeacherBooks : defaults.maxTeacherBooks
        };
    } catch (e) {
        return defaults;
    }
}

// ========== CHUYỂN TAB ==========
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.getElementById(`${tab}Tab`).classList.add('active');
    
    if (tab === 'list') {
        loadBorrowList();
    } else if (tab === 'borrow') {
        resetBorrowForm();
    } else if (tab === 'return') {
        resetReturnForm();
    }
}

// ========== RESET FORM MƯỢN ==========
function resetBorrowForm() {
    currentReader = null;
    currentBook = null;
    document.getElementById('readerSearch').value = '';
    document.getElementById('bookSearch').value = '';
    document.getElementById('readerInfo').innerHTML = '';
    document.getElementById('readerInfo').classList.remove('show');
    document.getElementById('bookInfo').innerHTML = '';
    document.getElementById('bookInfo').classList.remove('show');
    
    const borrowBtn = document.getElementById('borrowBtn');
    if (borrowBtn) {
        borrowBtn.disabled = true;
        borrowBtn.style.opacity = '0.5';
    }
}

// ========== RESET FORM TRẢ ==========
function resetReturnForm() {
    currentBorrowRecord = null;
    document.getElementById('returnSearch').value = '';
    document.getElementById('returnInfo').innerHTML = '';
    document.getElementById('returnInfo').classList.remove('show');
    const returnBtn = document.getElementById('returnBtn');
    if (returnBtn) {
        returnBtn.disabled = true;
        returnBtn.title = 'Vui long chon sach can tra';
    }
}

function selectReturnRecord(borrowId) {
    const record = borrowService.getBorrowRecordById(borrowId);
    if (!record || record.status !== 'borrowed') {
        showToast('Không tìm thấy phiếu mượn hợp lệ', true);
        return;
    }

    currentBorrowRecord = record;
    const returnBtn = document.getElementById('returnBtn');
    if (returnBtn) {
        returnBtn.disabled = false;
        returnBtn.title = `Trả sách: ${record.bookTitle}`;
    }

    document.querySelectorAll('[data-return-record]').forEach(btn => {
        btn.style.opacity = '0.75';
        btn.textContent = 'Chọn trả';
    });

    const selectedBtn = document.querySelector(`[data-return-record="${borrowId}"]`);
    if (selectedBtn) {
        selectedBtn.style.opacity = '1';
        selectedBtn.textContent = 'Đã chọn';
    }
}

// ========== TÌM ĐỘC GIẢ ==========
function searchReader() {
    const keyword = document.getElementById('readerSearch').value.trim();
    if (!keyword) {
        showToast('Vui lòng nhập mã thẻ hoặc tên độc giả', true);
        return;
    }
    
    let reader = readerService.getReaderByCardId(keyword);
    if (!reader) {
        reader = readerService.getAllReaders().find(r => 
            r.fullName.toLowerCase().includes(keyword.toLowerCase())
        );
    }
    
    if (!reader) {
        showToast('Không tìm thấy độc giả', true);
        resetBorrowForm();
        return;
    }
    
    currentReader = reader;
    const settings = getSystemSettings();
    const maxBorrow = reader.memberType === 'teacher' ? settings.maxTeacherBooks : (reader.memberType === 'student' ? settings.maxStudentBooks : 3);
    const currentBorrows = borrowService.getBorrowRecordsByReader(reader.id).filter(r => r.status === 'borrowed').length;
    const canBorrow = reader.status === 'active' && currentBorrows < maxBorrow && reader.totalFines < 200000;
    
    let statusHtml = '';
    if (reader.status !== 'active') statusHtml = '<span style="color:#e74c3c">⚠️ Thẻ không hoạt động</span>';
    else if (currentBorrows >= maxBorrow) statusHtml = `<span style="color:#e74c3c">⚠️ Đã mượn tối đa ${maxBorrow} sách</span>`;
    else if (reader.totalFines >= 200000) statusHtml = `<span style="color:#e74c3c">⚠️ Nợ ${reader.totalFines.toLocaleString()}đ</span>`;
    else statusHtml = '<span style="color:#27ae60">✅ Có thể mượn</span>';
    
    document.getElementById('readerInfo').innerHTML = `
        <h4><i class="fas fa-user-circle"></i> Thông tin độc giả</h4>
        <div class="info-row"><div class="info-label">Mã thẻ:</div><div class="info-value">${reader.cardId}</div></div>
        <div class="info-row"><div class="info-label">Họ tên:</div><div class="info-value">${escapeHtml(reader.fullName)}</div></div>
        <div class="info-row"><div class="info-label">Loại:</div><div class="info-value">${reader.memberType === 'student' ? 'Sinh viên' : reader.memberType === 'teacher' ? 'Giảng viên' : 'Bên ngoài'}</div></div>
        <div class="info-row"><div class="info-label">Sách mượn:</div><div class="info-value">${currentBorrows}/${maxBorrow}</div></div>
        <div class="info-row"><div class="info-label">Nợ phạt:</div><div class="info-value" style="color:${reader.totalFines > 0 ? '#e74c3c' : '#27ae60'}">${reader.totalFines.toLocaleString()}đ</div></div>
        <div class="info-row"><div class="info-label">Trạng thái:</div><div class="info-value">${statusHtml}</div></div>
    `;
    document.getElementById('readerInfo').classList.add('show');
    
    // Cập nhật nút mượn - QUAN TRỌNG
    updateBorrowButton();
}

// ========== TÌM SÁCH ==========
function searchBook() {
    const keyword = document.getElementById('bookSearch').value.trim();
    if (!keyword) {
        showToast('Vui lòng nhập mã vạch hoặc tên sách', true);
        return;
    }
    
    let book = bookService.getBookByBarcode(keyword);
    if (!book) {
        book = bookService.getAllBooks().find(b => 
            b.title.toLowerCase().includes(keyword.toLowerCase())
        );
    }
    
    if (!book) {
        showToast('Không tìm thấy sách', true);
        resetBorrowForm();
        return;
    }
    
    currentBook = book;
    const canBorrow = book.quantity > 0;
    
    let statusHtml = '';
    if (book.quantity <= 0) statusHtml = `<span style="color:#e74c3c">⚠️ Hết sách (${book.quantity} cuốn)</span>`;
    else statusHtml = `<span style="color:#27ae60">✅ Có sẵn (${book.quantity} cuốn)</span>`;
    
    document.getElementById('bookInfo').innerHTML = `
        <h4><i class="fas fa-book"></i> Thông tin sách</h4>
        <div class="info-row"><div class="info-label">Mã vạch:</div><div class="info-value">${book.barcode}</div></div>
        <div class="info-row"><div class="info-label">Tên sách:</div><div class="info-value">${escapeHtml(book.title)}</div></div>
        <div class="info-row"><div class="info-label">Tác giả:</div><div class="info-value">${escapeHtml(book.author)}</div></div>
        <div class="info-row"><div class="info-label">Số lượng:</div><div class="info-value">${book.quantity} cuốn</div></div>
        <div class="info-row"><div class="info-label">Trạng thái:</div><div class="info-value">${statusHtml}</div></div>
    `;
    document.getElementById('bookInfo').classList.add('show');
    
    // Cập nhật nút mượn - QUAN TRỌNG
    updateBorrowButton();
}

// ========== CẬP NHẬT TRẠNG THÁI NÚT MƯỢN ==========
function updateBorrowButton() {
    const borrowBtn = document.getElementById('borrowBtn');
    if (!borrowBtn) return;
    
    // Kiểm tra điều kiện để bật nút
    let canBorrow = false;
    let reason = '';
    
    if (!currentReader) {
        reason = 'Chưa chọn độc giả';
    } else if (!currentBook) {
        reason = 'Chưa chọn sách';
    } else if (currentReader.status !== 'active') {
        reason = 'Độc giả không hoạt động';
    } else if (currentBook.quantity <= 0) {
        reason = 'Sách đã hết';
    } else {
        const settings = getSystemSettings();
        const maxBorrow = currentReader.memberType === 'teacher' ? settings.maxTeacherBooks : (currentReader.memberType === 'student' ? settings.maxStudentBooks : 3);
        const currentBorrows = borrowService.getBorrowRecordsByReader(currentReader.id).filter(r => r.status === 'borrowed').length;
        
        if (currentBorrows >= maxBorrow) {
            reason = `Đã mượn tối đa ${maxBorrow} sách`;
        } else if (currentReader.totalFines >= 200000) {
            reason = `Còn nợ ${currentReader.totalFines.toLocaleString()}đ`;
        } else {
            canBorrow = true;
        }
    }
    
    if (canBorrow) {
        borrowBtn.disabled = false;
        borrowBtn.style.opacity = '1';
        borrowBtn.title = 'Xác nhận mượn sách';
    } else {
        borrowBtn.disabled = true;
        borrowBtn.style.opacity = '0.5';
        borrowBtn.title = reason;
    }
    
    console.log('Update borrow button:', { canBorrow, reason, currentReader, currentBook });
}

// ========== XÁC NHẬN MƯỢN ==========
function confirmBorrow() {
    console.log('confirmBorrow called', { currentReader, currentBook });
    
    // Kiểm tra lại một lần nữa trước khi mở modal
    if (!currentReader) {
        showToast('Vui lòng chọn độc giả trước', true);
        return;
    }
    
    if (!currentBook) {
        showToast('Vui lòng chọn sách trước', true);
        return;
    }
    
    if (currentBook.quantity <= 0) {
        showToast(`Sách "${currentBook.title}" đã hết, không thể mượn`, true);
        return;
    }
    
    if (currentReader.status !== 'active') {
        showToast('Độc giả không hoạt động, không thể mượn', true);
        return;
    }
    
    const settings = getSystemSettings();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + settings.maxBorrowDays);
    
    const modal = document.getElementById('confirmModal');
    const confirmBody = document.getElementById('confirmBody');
    const confirmTitle = document.getElementById('confirmTitle');
    
    if (!modal) {
        showToast('Lỗi: Không tìm thấy modal xác nhận', true);
        return;
    }
    
    confirmTitle.textContent = 'Xác nhận mượn sách';
    confirmBody.innerHTML = `
        <div class="info-row"><strong>📖 Độc giả:</strong> ${escapeHtml(currentReader.fullName)} (${currentReader.cardId})</div>
        <div class="info-row"><strong>📚 Sách:</strong> ${escapeHtml(currentBook.title)}</div>
        <div class="info-row"><strong>✍️ Tác giả:</strong> ${escapeHtml(currentBook.author)}</div>
        <div class="info-row"><strong>📅 Ngày mượn:</strong> ${new Date().toLocaleDateString('vi-VN')}</div>
        <div class="info-row"><strong>⏰ Hạn trả:</strong> ${dueDate.toLocaleDateString('vi-VN')}</div>
        <div class="info-row"><strong>📌 Ghi chú:</strong> Thời gian mượn tối đa ${settings.maxBorrowDays} ngày</div>
        <hr>
        <div class="info-row"><strong>Số lượng còn sau khi mượn:</strong> ${currentBook.quantity - 1} cuốn</div>
    `;
    
    const confirmBtn = document.getElementById('confirmActionBtn');
    if (confirmBtn) {
        // Gỡ bỏ event cũ để tránh gọi nhiều lần
        confirmBtn.onclick = null;
        confirmBtn.onclick = executeBorrow;
    }
    
    modal.classList.add('show');
}

// ========== THỰC HIỆN MƯỢN ==========
function executeBorrow() {
    console.log('executeBorrow called');
    closeConfirmModal();
    
    if (!currentReader || !currentBook) {
        showToast('Lỗi: Thiếu thông tin độc giả hoặc sách', true);
        return;
    }
    
    // Gọi service mượn sách
    const result = borrowService.borrowBook(currentBook.id, currentReader.id);
    console.log('Borrow result:', result);
    
    if (result.success) {
        showToast(result.message);
        // Reset form sau khi mượn thành công
        resetBorrowForm();
        loadBorrowList();
    } else {
        showToast(result.message, true);
    }
}

// ========== TÌM SÁCH TRẢ ==========
function searchReturnBook() {
    const readerKeyword = document.getElementById('returnSearch').value.trim();
    if (!readerKeyword) {
        showToast('Vui lòng nhập mã thẻ độc giả', true);
        return;
    }

    let reader = readerService.getReaderByCardId(readerKeyword);
    if (!reader) {
        reader = readerService.getAllReaders().find(r =>
            r.fullName.toLowerCase().includes(readerKeyword.toLowerCase())
        );
    }

    if (!reader) {
        showToast('Không tìm thấy độc giả', true);
        resetReturnForm();
        return;
    }

    const activeBorrows = borrowService.getBorrowRecordsByReader(reader.id)
        .filter(r => r.status === 'borrowed');

    if (!activeBorrows.length) {
        showToast(`Độc giả "${reader.fullName}" không có sách đang mượn`, true);
        resetReturnForm();
        return;
    }

    currentBorrowRecord = null;
    const settings = getSystemSettings();
    const rowsHtml = activeBorrows.map(record => {
        const dueDate = new Date(record.dueDate);
        const today = new Date();
        const isOverdue = today > dueDate;
        const daysOverdue = isOverdue ? Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24)) : 0;
        const fine = daysOverdue * settings.finePerDay;

        return `
            <div class="info-row" style="align-items:center;gap:0.75rem">
                <div class="info-value" style="flex:1">
                    <div><strong>${escapeHtml(record.bookTitle)}</strong> (${record.bookBarcode})</div>
                    <div style="font-size:0.85rem;color:#4a5568">
                        Ngay muon: ${formatDate(record.borrowDate)} | Han tra: ${formatDate(record.dueDate)}
                        ${isOverdue ? ` | <span style="color:#e74c3c;font-weight:600">Quá hạn ${daysOverdue} ngày (${fine.toLocaleString()}d)</span>` : ''}
                    </div>
                </div>
                <button class="btn btn-sm btn-warning" data-return-record="${record.id}" onclick="selectReturnRecord('${record.id}')">Chọn trả</button>
            </div>
        `;
    }).join('');

    document.getElementById('returnInfo').innerHTML = `
        <h4><i class="fas fa-receipt"></i> Danh sách sách đang mượn của độc giả</h4>
        <div class="info-row"><div class="info-label">Doc gia:</div><div class="info-value">${escapeHtml(reader.fullName)} (${reader.cardId})</div></div>
        <div class="info-row"><div class="info-label">So sach:</div><div class="info-value">${activeBorrows.length} cuốn đang mượn</div></div>
        <div style="margin-top:0.5rem">${rowsHtml}</div>
    `;
    document.getElementById('returnInfo').classList.add('show');

    // Chon mac dinh ban ghi dau tien de co the tra nhanh
    selectReturnRecord(activeBorrows[0].id);
}

// ========== XÁC NHẬN TRẢ ==========
function confirmReturn() {
    if (!currentBorrowRecord) {
        showToast('Vui lòng chọn sách cần trả', true);
        return;
    }
    
    const dueDate = new Date(currentBorrowRecord.dueDate);
    const today = new Date();
    const isOverdue = today > dueDate;
    const daysOverdue = isOverdue ? Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24)) : 0;
    const settings = getSystemSettings();
    const fine = daysOverdue * settings.finePerDay;
    
    const modal = document.getElementById('confirmModal');
    const confirmBody = document.getElementById('confirmBody');
    const confirmTitle = document.getElementById('confirmTitle');
    
    confirmTitle.textContent = 'Xác nhận trả sách';
    confirmBody.innerHTML = `
        <div class="info-row"><strong>📖 Sách:</strong> ${escapeHtml(currentBorrowRecord.bookTitle)}</div>
        <div class="info-row"><strong>👤 Độc giả:</strong> ${escapeHtml(currentBorrowRecord.readerName)}</div>
        <div class="info-row"><strong>📅 Ngày mượn:</strong> ${formatDate(currentBorrowRecord.borrowDate)}</div>
        <div class="info-row"><strong>⏰ Hạn trả:</strong> ${formatDate(currentBorrowRecord.dueDate)}</div>
        <div class="info-row" style="align-items:center"><strong>📚 Tình trạng sách:</strong> <select id="returnCondition" style="margin-left:0.75rem;padding:0.55rem 0.75rem;border:1px solid #cbd5e0;border-radius:10px;min-width:220px"><option value="normal">Sách bình thường</option><option value="damaged">Sách bị hư hỏng</option></select></div>
        <div class="info-row"><strong>ℹ️ Ghi chú:</strong> Nếu chọn hư hỏng, sách sẽ không được cộng lại vào số lượng khả dụng.</div>
        ${isOverdue ? `<div class="info-row"><strong style="color:#e74c3c">💰 Tiền phạt:</strong> <span style="color:#e74c3c;font-weight:bold">${fine.toLocaleString()}đ</span><br><small>(Quá hạn ${daysOverdue} ngày x ${settings.finePerDay.toLocaleString('vi-VN')}đ/ngày)</small></div>` : '<div class="info-row"><strong>✅ Trạng thái:</strong> Trả đúng hạn</div>'}
    `;
    
    const confirmBtn = document.getElementById('confirmActionBtn');
    confirmBtn.onclick = null;
    confirmBtn.onclick = executeReturn;
    
    modal.classList.add('show');
}

// ========== THỰC HIỆN TRẢ ==========
function executeReturn() {
    closeConfirmModal();
    
    if (!currentBorrowRecord) {
        showToast('Lỗi: Không tìm thấy phiếu mượn', true);
        return;
    }
    
    const returnCondition = document.getElementById('returnCondition')?.value || 'normal';
    const result = borrowService.returnBook(currentBorrowRecord.id, returnCondition);
    
    if (result.success) {
        showToast(result.message);
        resetReturnForm();
        loadBorrowList();
    } else {
        showToast(result.message, true);
    }
}

// ========== DANH SÁCH MƯỢN ==========
function loadBorrowList() {
    const keyword = document.getElementById('borrowSearch')?.value || '';
    const status = document.getElementById('borrowStatusFilter')?.value || '';
    
    let records = borrowService.getAllBorrowRecords();
    
    if (keyword) {
        records = records.filter(r => 
            r.bookTitle.toLowerCase().includes(keyword.toLowerCase()) ||
            r.readerName.toLowerCase().includes(keyword.toLowerCase())
        );
    }
    
    if (status) {
        records = records.filter(r => r.status === status);
    }
    
    renderBorrowList(records);
}

function renderBorrowList(records) {
    const tbody = document.getElementById('borrowList');
    if (!tbody) return;
    
    if (!records || records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:2rem">📋 Không có phiếu mượn nào</td></tr>';
        return;
    }
    
    tbody.innerHTML = records.map(record => {
        const isOverdue = record.status === 'borrowed' && new Date(record.dueDate) < new Date();
        const statusClass = record.status === 'borrowed' ? 
            (isOverdue ? 'status-overdue' : 'status-borrowed') : 'status-returned';
        const statusText = record.status === 'borrowed' ? 
            (isOverdue ? '⚠️ Quá hạn' : '📖 Đang mượn') : '✅ Đã trả';
        
        return `
            <tr>
                <td><code>${record.id}</code></td>
                <td><strong>${escapeHtml(record.bookTitle)}</strong></td>
                <td>${escapeHtml(record.readerName)}</td>
                <td>${formatDate(record.borrowDate)}</td>
                <td class="${isOverdue ? 'warning-text' : ''}">${formatDate(record.dueDate)}</td>
                <td>${record.returnDate ? formatDate(record.returnDate) : '-'}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>${record.fine ? record.fine.toLocaleString() + 'đ' : '-'}</td>
                <td>
                    ${record.status === 'borrowed' ? 
                        `<button class="btn btn-sm btn-warning" onclick="quickReturn('${record.id}')" style="background:#f39c12;color:#fff">
                            <i class="fas fa-undo-alt"></i> Trả
                        </button>` : '-'}
                </td>
            </tr>
        `;
    }).join('');
}

function quickReturn(borrowId) {
    const record = borrowService.getBorrowRecordById(borrowId);
    if (record) {
        currentBorrowRecord = record;
        confirmReturn();
    }
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.classList.remove('show');
}

function updateUserInfo() {
    const user = authService.getCurrentUser();
    const nameSpan = document.getElementById('userName');
    if (nameSpan) nameSpan.textContent = user?.fullName || user?.username || 'Admin';
}

// ========== KHỞI TẠO ==========
document.addEventListener('DOMContentLoaded', () => {
    const user = authService.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    loadBorrowList();
    updateUserInfo();
    authService.initTheme?.();
    
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        authService.logout();
        window.location.href = 'login.html';
    });
    
    // Enter key support
    document.getElementById('readerSearch')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchReader();
    });
    document.getElementById('bookSearch')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchBook();
    });
    document.getElementById('returnSearch')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchReturnBook();
    });
    
    // Gán sự kiện cho nút mượn
    const borrowBtn = document.getElementById('borrowBtn');
    if (borrowBtn) {
        borrowBtn.addEventListener('click', confirmBorrow);
    }
    
    // Click outside modal to close
    window.onclick = (event) => {
        const modal = document.getElementById('confirmModal');
        if (event.target === modal) closeConfirmModal();
    };

    window.selectReturnRecord = selectReturnRecord;
});