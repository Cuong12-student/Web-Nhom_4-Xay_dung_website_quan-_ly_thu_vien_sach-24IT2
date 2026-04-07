// js/books.js
let currentBooks = [], currentPage = 1, pageSize = 10, totalPages = 1;
let currentBookSort = { key: null, direction: 'desc' };

function showToast(msg, isErr = false) {
    let toast = document.createElement('div');
    toast.className = `toast-notification ${isErr ? 'error' : ''}`;
    toast.innerHTML = `<i class="fas ${isErr ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(str) { return str ? str.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])) : ''; }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : ''; }

function getStatusBadge(status) {
    const map = {
        'available': '<span class="status-badge status-available"><i class="fas fa-check-circle"></i> Có sẵn</span>',
        'borrowed': '<span class="status-badge status-borrowed"><i class="fas fa-hand-holding-heart"></i> Đang mượn</span>',
        'damaged': '<span class="status-badge status-damaged"><i class="fas fa-exclamation-triangle"></i> Hư hỏng</span>'
    };
    return map[status] || map.available;
}

function getMultipleStatusBadges(book) {
    const badges = [];
    const damagedCount = Number(book?.damagedReturnCount) || 0;
    const quantity = Number(book?.quantity) || 0;
    
    if (damagedCount > 0) {
        badges.push('<span class="status-badge status-damaged"><i class="fas fa-exclamation-triangle"></i> Hư hỏng (' + damagedCount + ')</span>');
    }
    if (quantity > 0) {
        badges.push('<span class="status-badge status-available"><i class="fas fa-check-circle"></i> Có sẵn (' + quantity + ')</span>');
    }
    
    if (badges.length === 0) {
        badges.push('<span class="status-badge status-available"><i class="fas fa-check-circle"></i> Có sẵn</span>');
    }
    
    return '<div style="display:flex;flex-wrap:wrap;gap:6px">' + badges.join('') + '</div>';
}

function getBookStatusRank(status) {
    const ranks = { available: 3, borrowed: 2, damaged: 1 };
    return ranks[status] || 0;
}

function getEffectiveBookStatus(book) {
    const damagedCount = Number(book?.damagedReturnCount) || 0;
    if (damagedCount > 0) return 'damaged';
    return book?.status || 'available';
}

function getBookReturnConditionSummary(bookId) {
    const summary = { normal: 0, damaged: 0 };
    borrowService.getAllBorrowRecords()
        .filter(record => record.bookId === bookId && record.status === 'returned')
        .forEach(record => {
            if (record.returnCondition === 'damaged') {
                summary.damaged += 1;
            } else {
                summary.normal += 1;
            }
        });

    return summary;
}

function updateBookSortIndicators() {
    document.querySelectorAll('[data-sort-indicator]').forEach(el => {
        const key = el.getAttribute('data-sort-indicator');
        if (currentBookSort.key === key) {
            el.textContent = currentBookSort.direction === 'desc' ? '↓' : '↑';
            el.style.opacity = '1';
        } else {
            el.textContent = '↕';
            el.style.opacity = '0.65';
        }
    });
}

function sortBooksBy(key) {
    if (currentBookSort.key === key) {
        currentBookSort.direction = currentBookSort.direction === 'desc' ? 'asc' : 'desc';
    } else {
        currentBookSort.key = key;
        currentBookSort.direction = 'desc';
    }
    currentPage = 1;
    loadBooks();
}

function applyBookSorting(books) {
    if (!currentBookSort.key) return books;

    const direction = currentBookSort.direction === 'asc' ? 1 : -1;
    return [...books].sort((a, b) => {
        let left = 0;
        let right = 0;

        if (currentBookSort.key === 'quantity') {
            left = Number(a.quantity) || 0;
            right = Number(b.quantity) || 0;
        } else if (currentBookSort.key === 'borrowedCount') {
            left = Number(a.borrowedCount) || 0;
            right = Number(b.borrowedCount) || 0;
        } else if (currentBookSort.key === 'status') {
            left = getBookStatusRank(getEffectiveBookStatus(a));
            right = getBookStatusRank(getEffectiveBookStatus(b));
        }

        return (left - right) * direction;
    });
}

function loadCategories() {
    let select = document.getElementById('categoryFilter');
    if (select) {
        select.innerHTML = '<option value="">📚 Tất cả thể loại</option>' + 
            bookService.getCategories().map(c => `<option value="${c}">${c}</option>`).join('');
    }
}

function loadBooks() {
    let keyword = document.getElementById('searchInput')?.value || '';
    let category = document.getElementById('categoryFilter')?.value || '';
    let status = document.getElementById('statusFilter')?.value || '';
    let author = document.getElementById('authorFilter')?.value || '';
    let publisher = document.getElementById('publisherFilter')?.value || '';
    
    let books = bookService.getAllBooks();
    if (keyword) books = books.filter(b => b.title.toLowerCase().includes(keyword.toLowerCase()) || b.author.toLowerCase().includes(keyword.toLowerCase()) || b.barcode.includes(keyword));
    if (category) books = books.filter(b => b.category === category);
    if (status) {
        books = books.filter(b => {
            const damagedCount = Number(b?.damagedReturnCount) || 0;
            const quantity = Number(b?.quantity) || 0;
            const borrowedCount = Number(b?.borrowedCount) || 0;
            
            if (status === 'available') return quantity > 0;
            if (status === 'damaged') return damagedCount > 0;
            if (status === 'borrowed') return borrowedCount > 0 || b?.status === 'borrowed';
            return true;
        });
    }
    if (author) books = books.filter(b => b.author.toLowerCase().includes(author.toLowerCase()));
    if (publisher) books = books.filter(b => b.publisher && b.publisher.toLowerCase().includes(publisher.toLowerCase()));
    
    books = applyBookSorting(books);
    currentBooks = books;
    totalPages = Math.ceil(currentBooks.length / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    
    let start = (currentPage - 1) * pageSize;
    renderBooksTable(currentBooks.slice(start, start + pageSize));
    updatePaginationUI();
    updateBookSortIndicators();
}

function renderBooksTable(books) {
    let tbody = document.getElementById('bookList');
    if (!tbody) return;
    if (!books.length) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:3rem;">📚 Không có sách nào</td></tr>';
        return;
    }
    
    tbody.innerHTML = books.map(book => {
        let qtyHtml = book.quantity <= 0 ? '<span style="color:#e74c3c">❌ Hết</span>' :
                       book.quantity === 1 ? '<span style="color:#e74c3c">⚠️ Còn 1</span>' :
                       book.quantity <= 3 ? `<span style="color:#f39c12">⚠️ Còn ${book.quantity}</span>` :
                       `<span style="color:#27ae60">${book.quantity}</span>`;
        return `<tr>
            <td><code>${book.barcode}</code></td>
            <td><div style="display:flex;gap:8px"><div style="width:40px;height:55px;background:#667eea;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff"><i class="fas fa-book"></i></div><div><b>${escapeHtml(book.title)}</b><br><small>${(book.description || '').substring(0,50)}...</small></div></div></td>
            <td>${escapeHtml(book.author)}</td>
            <td><span class="book-category-badge">${escapeHtml(book.category || '-')}</span></td>
            <td>${book.publisher || '-'}<br><small>${book.publishYear || ''}</small></td>
            <td style="text-align:center">${qtyHtml}</td>
            <td style="text-align:center"><b>${book.borrowedCount || 0}</b></td>
            <td>${getMultipleStatusBadges(book)}</td>
            <td><div style="display:flex;gap:5px">
                <button class="btn btn-sm" onclick="viewBookDetail('${book.id}')" style="background:#4facfe;color:#fff"><i class="fas fa-info-circle"></i></button>
                <button class="btn btn-sm" onclick="openEditModal('${book.id}')" style="background:#f39c12;color:#fff"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteBook('${book.id}')" style="background:#e74c3c;color:#fff"><i class="fas fa-trash"></i></button>
            </div></td>
        </tr>`;
    }).join('');
}

function updatePaginationUI() {
    let info = document.getElementById('pageInfo');
    let record = document.getElementById('recordInfo');
    if (info) info.innerHTML = `Trang ${currentPage} / ${totalPages}`;
    if (record) record.innerHTML = `Tổng: ${currentBooks.length} sách`;
    ['firstPageBtn', 'prevPageBtn'].forEach(id => { let btn = document.getElementById(id); if(btn) btn.disabled = currentPage <= 1; });
    ['nextPageBtn', 'lastPageBtn'].forEach(id => { let btn = document.getElementById(id); if(btn) btn.disabled = currentPage >= totalPages; });
}

function goToPage(page) { if(page >= 1 && page <= totalPages) { currentPage = page; loadBooks(); window.scrollTo(0,0); } }
function changePageSize() { pageSize = parseInt(document.getElementById('pageSizeSelect').value); currentPage = 1; localStorage.setItem('library_pageSize', pageSize); loadBooks(); }

function viewBookDetail(bookId) {
    let book = bookService.getBookById(bookId);
    if (!book) return showToast('Không tìm thấy sách', true);
    let borrows = borrowService.getAllBorrowRecords().filter(r => r.bookId === bookId);
    let current = borrows.find(r => r.status === 'borrowed');
    let returnSummary = getBookReturnConditionSummary(bookId);
    const hasManualDamagedCount = Object.prototype.hasOwnProperty.call(book, 'damagedReturnCount');
    let damagedCount = hasManualDamagedCount
        ? Math.max(0, Number(book.damagedReturnCount) || 0)
        : (returnSummary.damaged || 0);
    let availableCount = Number(book.quantity) || 0;
    let totalCount = availableCount + damagedCount;
    let modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'bookDetailModal';
    modal.onclick = (e) => { if(e.target === modal) modal.remove(); };
    modal.innerHTML = `<div class="modal-content" style="max-width:600px" onclick="event.stopPropagation()">
        <div class="modal-header" style="background:linear-gradient(135deg,#2c5282,#1e3c5c);color:#fff"><h3><i class="fas fa-book"></i> Chi tiết sách</h3><span class="modal-close" onclick="this.closest('.modal').remove()">&times;</span></div>
        <div class="modal-body">
            <div style="display:flex;gap:1rem;margin-bottom:1rem"><div style="width:80px;height:110px;background:#667eea;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff"><i class="fas fa-book fa-3x"></i></div>
            <div><h3>${escapeHtml(book.title)}</h3><p><i class="fas fa-user"></i> ${escapeHtml(book.author)}<br><i class="fas fa-barcode"></i> ${book.barcode}</p>${getMultipleStatusBadges(book)}</div></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#f8fafc;padding:1rem;border-radius:12px;margin-bottom:1rem">
                <div><b>📅 Năm XB:</b> ${book.publishYear || '-'}</div><div><b>🏢 NXB:</b> ${book.publisher || '-'}</div>
                <div><b>📚 Tổng số:</b> ${totalCount} cuốn</div><div><b>📊 Lượt mượn:</b> ${book.borrowedCount || 0}</div>
                <div><b>✅ Số lượng còn tốt:</b> ${availableCount} cuốn</div><div><b>📦 Sách hỏng:</b> ${damagedCount} cuốn</div>
                <div><b>✅ Trả bình thường:</b> ${returnSummary.normal} lượt</div><div><b>⚠️ Trả hư hỏng:</b> ${returnSummary.damaged} lượt</div>
                <div><b>📍 Vị trí:</b> ${book.location || '-'}</div><div><b>📖 ISBN:</b> ${book.isbn || '-'}</div>
            </div>
            <div style="background:#e8f0fe;padding:1rem;border-radius:12px;margin-bottom:1rem"><b>📝 Mô tả:</b><p>${book.description || 'Chưa có mô tả'}</p></div>
            ${current ? `<div style="background:#fff3cd;padding:1rem;border-radius:12px;margin-bottom:1rem"><b><i class="fas fa-user"></i> Đang mượn bởi:</b> ${escapeHtml(current.readerName)}<br><b>📅 Ngày mượn:</b> ${formatDate(current.borrowDate)} | <b>⏰ Hạn trả:</b> ${formatDate(current.dueDate)}</div>` : '<div style="background:#d4edda;padding:1rem;border-radius:12px;margin-bottom:1rem">✅ Sách hiện đang CÓ SẴN</div>'}
        </div>
        <div class="modal-footer"><button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Đóng</button></div>
    </div>`;
    document.body.appendChild(modal);
}

function openAddModal() { if(!checkAdmin()) return; document.getElementById('modalTitle').innerText = 'Thêm sách mới'; document.getElementById('bookId').value = ''; document.getElementById('bookForm').reset(); document.getElementById('bookModal').classList.add('show'); }

function openEditModal(id) {
    if(!checkAdmin()) return;
    let book = bookService.getBookById(id);
    if(!book) return showToast('Không tìm thấy sách', true);
    document.getElementById('modalTitle').innerText = 'Sửa sách';
    document.getElementById('bookId').value = book.id;
    document.getElementById('title').value = book.title;
    document.getElementById('author').value = book.author;
    document.getElementById('category').value = book.category || '';
    document.getElementById('publisher').value = book.publisher || '';
    document.getElementById('publishYear').value = book.publishYear || '';
    document.getElementById('isbn').value = book.isbn || '';
    document.getElementById('location').value = book.location || '';
    document.getElementById('quantity').value = book.quantity || 1;
    document.getElementById('damagedCount').value = Number(book.damagedReturnCount) || 0;
    document.getElementById('description').value = book.description || '';
    document.getElementById('bookModal').classList.add('show');
}

function saveBook() {
    if(!checkAdmin()) return;
    let id = document.getElementById('bookId').value;
    let title = document.getElementById('title').value.trim();
    let author = document.getElementById('author').value.trim();
    let quantity = Math.max(0, parseInt(document.getElementById('quantity').value, 10) || 0);
    let damagedCount = Math.max(0, parseInt(document.getElementById('damagedCount').value, 10) || 0);
    let status = damagedCount > 0 ? 'damaged' : (quantity > 0 ? 'available' : 'borrowed');
    if(!title || !author) return showToast('Vui lòng nhập tên sách và tác giả', true);
    let data = { title, author, category: document.getElementById('category').value, publisher: document.getElementById('publisher').value,
                 publishYear: document.getElementById('publishYear').value, isbn: document.getElementById('isbn').value,
                 location: document.getElementById('location').value, quantity: quantity, damagedReturnCount: damagedCount,
                 status: status, description: document.getElementById('description').value };
    if(id) bookService.updateBook(id, data);
    else bookService.addBook(data);
    showToast(id ? 'Cập nhật thành công' : 'Thêm sách thành công');
    closeModal();
    loadBooks();
    loadCategories();
}

function deleteBook(id) {
    if(!checkAdmin()) return;
    let book = bookService.getBookById(id);
    if(book.borrowedCount > 0) return showToast('Không thể xóa sách đã có lịch sử mượn', true);
    if(confirm(`Xóa sách "${book.title}"?`)) { bookService.deleteBook(id); showToast('Đã xóa'); loadBooks(); loadCategories(); }
}

function closeModal() { document.getElementById('bookModal').classList.remove('show'); }

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
    let saved = localStorage.getItem('library_pageSize');
    if(saved) { pageSize = parseInt(saved); let select = document.getElementById('pageSizeSelect'); if(select) select.value = pageSize; }
    loadCategories();
    loadBooks();
    updateUserInfo();
    authService.initTheme?.();
    document.getElementById('logoutBtn')?.addEventListener('click', e => { e.preventDefault(); authService.logout(); window.location.href = 'login.html'; });
    window.onclick = e => { if(e.target === document.getElementById('bookModal')) closeModal(); };
});