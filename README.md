PHẦN MỀM QUẢN LÝ NHÀ SÁCH
> **Môn học:** Công nghệ Phần mềm  
> **Phương pháp phát triển:** Agile
> **Công cụ quản lý:** Jira Software & GitHub Integration
1. GIỚI THIỆU TỔNG QUAN
Hệ thống Quản lý Nhà sách là sản phẩm MVP (Minimum Viable Product) được thiết kế nhằm hỗ trợ nhân viên thu ngân và quản lý nhà sách thực hiện các thao tác bán hàng, kiểm soát tồn kho, theo dõi báo cáo doanh thu và tra cứu thông tin nhanh chóng nhờ sự trợ giúp của Module AI.
Các tính năng chính (Core Features - MVP)
**Phân hệ Bán hàng (POS):** Tạo hóa đơn, tính tiền, tìm kiếm sách, tích hợp thanh toán linh hoạt (Tiền mặt & QR Code/Ví điện tử).
**Phân hệ Quản lý Kho:** Thêm/sửa/xóa đầu sách, cập nhật số lượng tồn kho theo thời gian thực.
**Phân hệ Báo cáo & Thống kê:** Thống kê doanh thu, hiển thị biểu đồ báo cáo theo ngày/tháng.
**Phân hệ AI Hỗ trợ:** Chatbot AI gợi ý, hỗ trợ tra cứu thông tin sách.
2. CÔNG NGHỆ SỬ DỤNG
**Ngôn ngữ lập trình:** Java (JDK 17)
**Giao diện (UI):** Java FX (NetBeans IDE 28)
**Cơ sở dữ liệu:** MySQL Workbench
**Kiến trúc:** 3-Tier Architecture (UI - Business Logic - Data Access)
**Tích hợp bên ngoài:** REST API (AI Service)
**Quản trị dự án:** Jira Software, GitHub
3. Hưỡng dẫn cài đặt và chạy
- Tải thư viện java sdk 17 và nén vào project
- Tải thư viện java sdk eclipse và nén vào project
- Tải mysql-connection và nén vào project
- Vào MySQL và copy file txt, sau đó tạo các dữ liệu
- Vào NetBeans, chỉnh sửa database và chạy
