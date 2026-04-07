// ========== BÁO CÁO THỐNG KÊ ==========

class ReportService {
    constructor() {
        this.books = bookService.getAllBooks();
        this.readers = readerService.getAllReaders();
        this.borrows = borrowService.getAllBorrowRecords();
    }
    
    refresh() {
        this.books = bookService.getAllBooks();
        this.readers = readerService.getAllReaders();
        this.borrows = borrowService.getAllBorrowRecords();
    }
    
    getStatistics() {
        this.refresh();
        
        const totalBooks = this.books.length;
        const availableBooks = this.books.filter(b => b.status === 'available').length;
        const borrowedBooks = this.books.filter(b => b.status === 'borrowed').length;
        
        const totalReaders = this.readers.length;
        const activeReaders = this.readers.filter(r => r.status === 'active').length;
        
        const currentBorrows = this.borrows.filter(b => b.status === 'borrowed').length;
        const overdueBorrows = this.borrows.filter(b => {
            if (b.status !== 'borrowed') return false;
            return new Date(b.dueDate) < new Date();
        }).length;
        
        const totalFines = this.readers.reduce((sum, r) => sum + r.totalFines, 0);
        
        return {
            books: { totalBooks, availableBooks, borrowedBooks },
            readers: { totalReaders, activeReaders },
            borrows: { currentBorrows, overdueBorrows },
            fines: totalFines
        };
    }
    
    getTopBooks(limit = 5) {
        this.refresh();
        return [...this.books]
            .sort((a, b) => b.borrowedCount - a.borrowedCount)
            .slice(0, limit);
    }
    
    getTopReaders(limit = 5) {
        this.refresh();
        return [...this.readers]
            .sort((a, b) => b.borrowedCount - a.borrowedCount)
            .slice(0, limit);
    }
    
    getStatisticsByCategory() {
        this.refresh();
        const categories = {};
        this.books.forEach(book => {
            if (!categories[book.category]) {
                categories[book.category] = { total: 0, borrowed: 0, available: 0 };
            }
            categories[book.category].total++;
            if (book.status === 'borrowed') {
                categories[book.category].borrowed++;
            } else {
                categories[book.category].available++;
            }
        });
        return categories;
    }
    
    getMonthlyBorrowStats() {
        this.refresh();
        const monthlyStats = {};
        
        this.borrows.forEach(borrow => {
            const date = new Date(borrow.borrowDate);
            const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyStats[month]) {
                monthlyStats[month] = { borrows: 0, returns: 0 };
            }
            monthlyStats[month].borrows++;
            
            if (borrow.returnDate) {
                monthlyStats[month].returns++;
            }
        });
        
        return monthlyStats;
    }
    
    getOverdueList() {
        this.refresh();
        const today = new Date();
        return this.borrows.filter(borrow => {
            if (borrow.status !== 'borrowed') return false;
            return new Date(borrow.dueDate) < today;
        });
    }
}

const reportService = new ReportService();