// js/borrowService.js - Mượn trả sách
const BORROW_STORAGE_KEY = 'library_borrows';

class BorrowService {
    constructor() {
        this.borrowRecords = this.loadBorrowRecords();
    }

    getSystemSettings() {
        const defaults = { maxBorrowDays: 14, finePerDay: 5000 };
        const saved = localStorage.getItem('library_settings');
        if (!saved) return defaults;

        try {
            const parsed = JSON.parse(saved);
            const maxBorrowDays = Number.parseInt(parsed?.maxBorrowDays, 10);
            const finePerDay = Number.parseInt(parsed?.finePerDay, 10);
            return {
                maxBorrowDays: Number.isFinite(maxBorrowDays) ? maxBorrowDays : defaults.maxBorrowDays,
                finePerDay: Number.isFinite(finePerDay) ? Math.max(0, finePerDay) : defaults.finePerDay
            };
        } catch (e) {
            return defaults;
        }
    }
    
    loadBorrowRecords() {
        const data = localStorage.getItem(BORROW_STORAGE_KEY);
        if (data && data !== 'undefined') {
            try {
                return JSON.parse(data);
            } catch(e) {
                return [];
            }
        }
        return [];
    }
    
    saveBorrowRecords() { localStorage.setItem(BORROW_STORAGE_KEY, JSON.stringify(this.borrowRecords)); }
    getAllBorrowRecords() { return [...this.borrowRecords]; }
    getBorrowRecordById(id) { return this.borrowRecords.find(r => r.id === id); }
    getBorrowRecordsByReader(readerId) { return this.borrowRecords.filter(r => r.readerId === readerId); }
    getBorrowRecordsByBook(bookId) { return this.borrowRecords.filter(r => r.bookId === bookId); }
    getCurrentBorrowings() { return this.borrowRecords.filter(r => r.status === 'borrowed'); }
    
    borrowBook(bookId, readerId, notes = '') {
        const book = bookService.getBookById(bookId);
        const reader = readerService.getReaderById(readerId);
        
        if (!book) return { success: false, message: '❌ Không tìm thấy sách' };
        if (!reader) return { success: false, message: '❌ Không tìm thấy độc giả' };
        if (book.quantity <= 0) return { success: false, message: `❌ Sách "${book.title}" đã hết` };
        
        const canBorrow = readerService.canBorrow(readerId);
        if (!canBorrow.allowed) return { success: false, message: `❌ ${canBorrow.reason}` };
        
        const settings = this.getSystemSettings();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + settings.maxBorrowDays);
        
        const newRecord = {
            id: 'BR' + Date.now(),
            bookId: book.id, bookTitle: book.title, bookBarcode: book.barcode,
            readerId: reader.id, readerName: reader.fullName, readerCardId: reader.cardId,
            borrowDate: new Date().toISOString(), dueDate: dueDate.toISOString(),
            returnDate: null, status: 'borrowed', fine: 0, notes: notes
        };
        
        this.borrowRecords.push(newRecord);
        this.saveBorrowRecords();
        
        book.quantity--;
        book.borrowedCount++;
        book.status = book.quantity > 0 ? 'available' : 'borrowed';
        bookService.saveBooks();
        
        reader.borrowedCount++;
        readerService.saveReaders();
        
        return { success: true, message: `✅ Mượn thành công! Còn ${book.quantity} cuốn. Hạn trả: ${dueDate.toLocaleDateString('vi-VN')}` };
    }
    
    returnBook(borrowId, returnCondition = 'normal') {
        const record = this.getBorrowRecordById(borrowId);
        if (!record) return { success: false, message: '❌ Không tìm thấy phiếu mượn' };
        if (record.status === 'returned') return { success: false, message: '❌ Sách đã được trả' };
        
        const returnDate = new Date();
        const dueDate = new Date(record.dueDate);
        let fine = 0, days = 0;
        
        const settings = this.getSystemSettings();

        if (returnDate > dueDate) {
            days = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
            fine = days * settings.finePerDay;
        }
        
        record.returnDate = returnDate.toISOString();
        record.status = 'returned';
        record.fine = fine;
        record.returnCondition = returnCondition === 'damaged' ? 'damaged' : 'normal';
        this.saveBorrowRecords();
        
        const book = bookService.getBookById(record.bookId);
        if (book) {
            if (record.returnCondition === 'damaged') {
                book.damagedReturnCount = (Number(book.damagedReturnCount) || 0) + 1;
            } else {
                book.normalReturnCount = (Number(book.normalReturnCount) || 0) + 1;
                book.quantity++;
            }
            book.status = (Number(book.damagedReturnCount) || 0) > 0
                ? 'damaged'
                : (book.quantity > 0 ? 'available' : 'borrowed');
            bookService.saveBooks();
        }
        
        const reader = readerService.getReaderById(record.readerId);
        if (reader) {
            reader.borrowedCount--;
            if (fine > 0) readerService.addFine(record.readerId, fine);
            readerService.saveReaders();
        }
        
        let msg = `✅ Trả sách "${record.bookTitle}" thành công!`;
        if (fine > 0) msg += ` Phạt ${days} ngày: ${fine.toLocaleString()}đ`;
        if (record.returnCondition === 'damaged') msg += ' Đã ghi nhận sách bị hư hỏng.';
        return { success: true, message: msg, fine: fine };
    }
}

const borrowService = new BorrowService();