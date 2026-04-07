// js/bookService.js - Quản lý sách
const BOOK_STORAGE_KEY = 'library_books';

class BookService {
    constructor() {
        this.books = this.loadBooks();
    }
    
    loadBooks() {
        const data = localStorage.getItem(BOOK_STORAGE_KEY);
        if (data && data !== 'undefined') {
            try {
                return JSON.parse(data);
            } catch(e) {
                return this.getSampleBooks();
            }
        }
        return this.getSampleBooks();
    }
    
    getSampleBooks() {
        return [
            { id: 'BK001', barcode: 'BAR20240001', title: 'Nhà giả kim', author: 'Paulo Coelho', category: 'Tiểu thuyết', publisher: 'NXB Trẻ', publishYear: 2020, isbn: '9786041234567', location: 'A1-01', status: 'available', quantity: 5, borrowedCount: 3, description: 'Hành trình tìm kiếm kho báu', language: 'Tiếng Việt' },
            { id: 'BK002', barcode: 'BAR20240002', title: 'Đắc nhân tâm', author: 'Dale Carnegie', category: 'Kỹ năng sống', publisher: 'NXB Tổng hợp', publishYear: 2019, isbn: '9786041234568', location: 'B2-03', status: 'available', quantity: 5, borrowedCount: 4, description: 'Nghệ thuật ứng xử', language: 'Tiếng Việt' },
            { id: 'BK003', barcode: 'BAR20240003', title: 'Sapiens', author: 'Yuval Noah Harari', category: 'Lịch sử', publisher: 'NXB Thế giới', publishYear: 2018, isbn: '9786041234569', location: 'C1-02', status: 'available', quantity: 5, borrowedCount: 2, description: 'Lược sử loài người', language: 'Tiếng Việt' },
            { id: 'BK004', barcode: 'BAR20240004', title: 'Clean Code', author: 'Robert Martin', category: 'Lập trình', publisher: 'Prentice Hall', publishYear: 2008, isbn: '9786041234570', location: 'D1-01', status: 'available', quantity: 5, borrowedCount: 3, description: 'Nguyên tắc viết mã sạch', language: 'Tiếng Anh' },
            { id: 'BK005', barcode: 'BAR20240005', title: 'Atomic Habits', author: 'James Clear', category: 'Kỹ năng sống', publisher: 'NXB Lao động', publishYear: 2018, isbn: '9786041234571', location: 'B2-01', status: 'available', quantity: 5, borrowedCount: 3, description: 'Thay đổi nhỏ - Kết quả lớn', language: 'Tiếng Việt' },
            { id: 'BK006', barcode: 'BAR20240006', title: 'Số Đỏ', author: 'Vũ Trọng Phụng', category: 'Văn học', publisher: 'NXB Văn học', publishYear: 1936, isbn: '9786041234572', location: 'A2-01', status: 'available', quantity: 5, borrowedCount: 0, description: 'Tiểu thuyết phóng sự', language: 'Tiếng Việt' }
        ];
    }
    
    saveBooks() { localStorage.setItem(BOOK_STORAGE_KEY, JSON.stringify(this.books)); }
    getAllBooks() { return [...this.books]; }
    getBookById(id) { return this.books.find(b => b.id === id); }
    getBookByBarcode(barcode) { return this.books.find(b => b.barcode === barcode); }
    getCategories() { return [...new Set(this.books.map(b => b.category).filter(c => c))]; }
    
    addBook(data) {
        const newBook = { id: 'BK' + Date.now(), barcode: 'BAR' + Date.now().toString().slice(-8), status: 'available', borrowedCount: 0, quantity: 5, ...data };
        this.books.push(newBook);
        this.saveBooks();
        return newBook;
    }
    
    updateBook(id, data) {
        const index = this.books.findIndex(b => b.id === id);
        if (index !== -1) { this.books[index] = { ...this.books[index], ...data }; this.saveBooks(); return this.books[index]; }
        return null;
    }
    
    deleteBook(id) {
        const book = this.getBookById(id);
        if (book && book.borrowedCount === 0) { this.books = this.books.filter(b => b.id !== id); this.saveBooks(); return true; }
        return false;
    }
    
    updateQuantity(bookId, delta) {
        const book = this.getBookById(bookId);
        if (book) {
            book.quantity = Math.max(0, book.quantity + delta);
            book.status = book.quantity > 0 ? 'available' : 'borrowed';
            this.saveBooks();
            return book.quantity;
        }
        return 0;
    }
}

const bookService = new BookService();