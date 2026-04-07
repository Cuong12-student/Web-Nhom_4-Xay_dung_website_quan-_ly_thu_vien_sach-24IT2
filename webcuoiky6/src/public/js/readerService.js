// js/readerService.js - Quản lý độc giả (có thanh toán nợ)
const READER_STORAGE_KEY = 'library_readers';

class ReaderService {
    constructor() {
        this.readers = this.loadReaders();
    }

    getSystemSettings() {
        const defaults = { maxStudentBooks: 5, maxTeacherBooks: 10, finePerDay: 5000 };
        const saved = localStorage.getItem('library_settings');
        if (!saved) return defaults;

        try {
            const parsed = JSON.parse(saved);
            const maxStudentBooks = Number.parseInt(parsed?.maxStudentBooks, 10);
            const maxTeacherBooks = Number.parseInt(parsed?.maxTeacherBooks, 10);
            const finePerDay = Number.parseInt(parsed?.finePerDay, 10);
            return {
                maxStudentBooks: Number.isFinite(maxStudentBooks) ? maxStudentBooks : defaults.maxStudentBooks,
                maxTeacherBooks: Number.isFinite(maxTeacherBooks) ? maxTeacherBooks : defaults.maxTeacherBooks,
                finePerDay: Number.isFinite(finePerDay) ? Math.max(0, finePerDay) : defaults.finePerDay
            };
        } catch (e) {
            return defaults;
        }
    }

    getOverdueFineForReader(readerId) {
        if (typeof borrowService === 'undefined' || typeof borrowService.getBorrowRecordsByReader !== 'function') {
            return 0;
        }

        const { finePerDay } = this.getSystemSettings();
        if (finePerDay <= 0) return 0;

        const today = new Date();
        const overdueBorrows = borrowService
            .getBorrowRecordsByReader(readerId)
            .filter(r => r.status === 'borrowed' && new Date(r.dueDate) < today);

        return overdueBorrows.reduce((sum, record) => {
            const daysOverdue = Math.ceil((today - new Date(record.dueDate)) / (1000 * 60 * 60 * 24));
            return sum + Math.max(0, daysOverdue) * finePerDay;
        }, 0);
    }

    getOutstandingFine(readerId) {
        const reader = this.getReaderById(readerId);
        if (!reader) return 0;
        return (reader.totalFines || 0) + this.getOverdueFineForReader(readerId);
    }
    
    loadReaders() {
        const data = localStorage.getItem(READER_STORAGE_KEY);
        if (data && data !== 'undefined') {
            try {
                return JSON.parse(data);
            } catch(e) {
                return this.getSampleReaders();
            }
        }
        return this.getSampleReaders();
    }
    
    getSampleReaders() {
        const now = new Date();
        const oneYear = new Date(now); oneYear.setFullYear(now.getFullYear() + 1);
        const twoYears = new Date(now); twoYears.setFullYear(now.getFullYear() + 2);
        
        return [
            { id: 'RD001', cardId: 'LIB20240001', fullName: 'Nguyễn Văn An', email: 'an@email.com', phone: '0901234001', address: 'Hà Nội', idCard: '001201000001', memberType: 'student', joinDate: now.toISOString(), expiryDate: oneYear.toISOString(), status: 'active', borrowedCount: 0, totalFines: 0, blockReason: null },
            { id: 'RD002', cardId: 'LIB20240002', fullName: 'Trần Thị Bích', email: 'bich@email.com', phone: '0901234002', address: 'Hà Nội', idCard: '001201000002', memberType: 'student', joinDate: now.toISOString(), expiryDate: oneYear.toISOString(), status: 'active', borrowedCount: 0, totalFines: 0, blockReason: null },
            { id: 'RD003', cardId: 'LIB20240003', fullName: 'Lê Văn Cường', email: 'cuong@email.com', phone: '0901234003', address: 'Hà Nội', idCard: '001201000003', memberType: 'student', joinDate: now.toISOString(), expiryDate: oneYear.toISOString(), status: 'active', borrowedCount: 0, totalFines: 0, blockReason: null },
            { id: 'RD004', cardId: 'LIB20240004', fullName: 'Phạm Thị Dung', email: 'dung@email.com', phone: '0901234004', address: 'Hà Nội', idCard: '001201000004', memberType: 'student', joinDate: now.toISOString(), expiryDate: oneYear.toISOString(), status: 'blocked', borrowedCount: 0, totalFines: 150000, blockReason: 'Nợ quá hạn 150.000đ' },
            { id: 'RD005', cardId: 'LIB20240005', fullName: 'Hoàng Văn Em', email: 'em@email.com', phone: '0901234005', address: 'Hà Nội', idCard: '001201000005', memberType: 'student', joinDate: now.toISOString(), expiryDate: oneYear.toISOString(), status: 'blocked', borrowedCount: 0, totalFines: 250000, blockReason: 'Nợ quá hạn 250.000đ' },
            { id: 'RD006', cardId: 'LIB20240006', fullName: 'TS. Nguyễn Văn Phúc', email: 'phuc@cmc.edu.vn', phone: '0912345001', address: 'Hà Nội', idCard: '001201000006', memberType: 'teacher', joinDate: now.toISOString(), expiryDate: twoYears.toISOString(), status: 'active', borrowedCount: 0, totalFines: 0, blockReason: null },
            { id: 'RD007', cardId: 'LIB20240007', fullName: 'Công ty ABC', email: 'contact@abc.com', phone: '0281234567', address: 'TP.HCM', idCard: '0301234567', memberType: 'external', joinDate: now.toISOString(), expiryDate: oneYear.toISOString(), status: 'active', borrowedCount: 0, totalFines: 0, blockReason: null }
        ];
    }
    
    saveReaders() { localStorage.setItem(READER_STORAGE_KEY, JSON.stringify(this.readers)); }
    getAllReaders() { return [...this.readers]; }
    getReaderById(id) { return this.readers.find(r => r.id === id); }
    getReaderByCardId(cardId) { return this.readers.find(r => r.cardId === cardId); }
    
    addReader(data) {
        const now = new Date();
        const expiry = new Date();
        expiry.setFullYear(now.getFullYear() + (data.memberType === 'teacher' ? 2 : 1));
        const newReader = { id: 'RD' + Date.now(), cardId: 'LIB' + Date.now().toString().slice(-8), joinDate: now.toISOString(), expiryDate: expiry.toISOString(), status: 'active', borrowedCount: 0, totalFines: 0, blockReason: null, ...data };
        this.readers.push(newReader);
        this.saveReaders();
        return newReader;
    }
    
    updateReader(id, data) {
        const index = this.readers.findIndex(r => r.id === id);
        if (index !== -1) { this.readers[index] = { ...this.readers[index], ...data }; this.saveReaders(); return this.readers[index]; }
        return null;
    }
    
    deleteReader(id) {
        const reader = this.getReaderById(id);
        if (reader && reader.borrowedCount === 0 && reader.totalFines === 0) {
            this.readers = this.readers.filter(r => r.id !== id);
            this.saveReaders();
            return true;
        }
        return false;
    }
    
    // ========== KHÓA / MỞ KHÓA ==========
    blockReader(readerId, reason = 'Vi phạm quy định') {
        const reader = this.getReaderById(readerId);
        if (!reader) return { success: false, message: 'Không tìm thấy độc giả' };
        if (reader.borrowedCount > 0) return { success: false, message: 'Độc giả đang mượn sách, không thể khóa' };
        reader.status = 'blocked';
        reader.blockReason = reason;
        this.saveReaders();
        return { success: true, message: `🔒 Đã khóa thẻ ${reader.fullName}` };
    }
    
    unblockReader(readerId) {
        const reader = this.getReaderById(readerId);
        if (!reader) return { success: false, message: 'Không tìm thấy độc giả' };
        if (reader.totalFines >= 200000) {
            return { success: false, message: `❌ Còn nợ ${reader.totalFines.toLocaleString()}đ, không thể mở khóa. Vui lòng thanh toán trước.` };
        }
        reader.status = 'active';
        reader.blockReason = null;
        this.saveReaders();
        return { success: true, message: `🔓 Đã mở khóa thẻ ${reader.fullName}` };
    }
    
    // ========== THANH TOÁN NỢ ==========
    payFine(readerId, amount) {
        const reader = this.getReaderById(readerId);
        if (!reader) return { success: false, message: 'Không tìm thấy độc giả' };
        if (amount <= 0) return { success: false, message: 'Số tiền không hợp lệ' };
        
        const paidAmount = Math.min(amount, reader.totalFines);
        reader.totalFines = reader.totalFines - paidAmount;
        
        let message = `💰 Thanh toán thành công ${paidAmount.toLocaleString()}đ! `;
        
        if (reader.totalFines === 0) {
            message += `Đã xóa hết nợ. `;
            if (reader.status === 'blocked') {
                reader.status = 'active';
                reader.blockReason = null;
                message += `✅ Đã mở khóa thẻ!`;
            }
        } else {
            message += `Còn nợ ${reader.totalFines.toLocaleString()}đ. `;
            if (reader.totalFines < 200000 && reader.status === 'blocked') {
                reader.status = 'active';
                reader.blockReason = null;
                message += `✅ Đã mở khóa thẻ!`;
            }
        }
        
        this.saveReaders();
        return { success: true, message: message, remainingFine: reader.totalFines };
    }
    
    // ========== THÊM TIỀN PHẠT ==========
    addFine(readerId, amount) {
        const reader = this.getReaderById(readerId);
        if (!reader) return 0;
        reader.totalFines = (reader.totalFines || 0) + amount;
        if (reader.totalFines >= 200000 && reader.status === 'active') {
            reader.status = 'blocked';
            reader.blockReason = `Tự động khóa do nợ ${reader.totalFines.toLocaleString()}đ`;
        }
        this.saveReaders();
        return reader.totalFines;
    }

    renewCard(readerId, months = 12) {
        const reader = this.getReaderById(readerId);
        if (!reader) return { success: false, message: 'Không tìm thấy độc giả' };

        const renewMonths = Number.parseInt(months, 10);
        if (!Number.isFinite(renewMonths) || renewMonths <= 0) {
            return { success: false, message: 'Số tháng gia hạn không hợp lệ' };
        }

        const currentExpiry = reader.expiryDate ? new Date(reader.expiryDate) : new Date();
        const baseDate = Number.isNaN(currentExpiry.getTime()) || currentExpiry < new Date() ? new Date() : currentExpiry;
        const newExpiryDate = new Date(baseDate);
        newExpiryDate.setMonth(newExpiryDate.getMonth() + renewMonths);

        reader.expiryDate = newExpiryDate.toISOString();
        if (reader.status === 'expired') {
            reader.status = 'active';
            reader.blockReason = null;
        }

        this.saveReaders();

        return {
            success: true,
            message: `✅ Đã gia hạn thẻ thêm ${renewMonths} tháng. Hạn mới: ${newExpiryDate.toLocaleDateString('vi-VN')}`,
            expiryDate: reader.expiryDate
        };
    }
    
    // ========== KIỂM TRA CÓ THỂ MƯỢN ==========
    canBorrow(readerId) {
        const reader = this.getReaderById(readerId);
        if (!reader) return { allowed: false, reason: 'Không tìm thấy độc giả' };
        const expiryDate = reader.expiryDate ? new Date(reader.expiryDate) : null;
        const isExpired = expiryDate ? expiryDate < new Date() : reader.status === 'expired';
        if (reader.status === 'blocked') return { allowed: false, reason: `Thẻ bị khóa: ${reader.blockReason}` };
        if (isExpired) return { allowed: false, reason: 'Thẻ đã hết hạn' };

        const settings = this.getSystemSettings();
        const maxBorrow = reader.memberType === 'teacher'
            ? settings.maxTeacherBooks
            : (reader.memberType === 'student' ? settings.maxStudentBooks : 3);
        if (reader.borrowedCount >= maxBorrow) return { allowed: false, reason: `Đã mượn tối đa ${maxBorrow} sách` };
        if (reader.totalFines >= 200000) return { allowed: false, reason: `Còn nợ ${reader.totalFines.toLocaleString()}đ` };
        
        return { allowed: true };
    }
}

const readerService = new ReaderService();