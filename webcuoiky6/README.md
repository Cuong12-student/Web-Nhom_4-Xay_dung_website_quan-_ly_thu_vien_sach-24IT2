# Website Quan Ly Thu Vien (Khong dung backend)

Du an da duoc chuyen sang huong HTML/CSS/JavaScript thuan, khong dung:
- React/Vue/Angular
- Backend NodeJS/PHP/ASP.NET/Firebase

Du lieu tai khoan duoc luu trong IndexedDB (database tren trinh duyet) va sessionStorage.

## Cach chay

1. Mo file `src/public/login.html` bang trinh duyet.
2. Dang nhap bang tai khoan mac dinh: `admin` / `Admin@123` hoac `staff` / `staff123`
3. Hoac tao tai khoan moi tai trang dang ky.

## Luu y

- Day la mo hinh demo phu hop bai tap khong duoc dung backend.
- Mat khau dang duoc luu local trong trinh duyet de phuc vu hoc tap, khong dung cho moi truong production.

## Cau truc

```
src/
└── public/
    css/
    js/            
    ├── login.html
    ├── register.html
    ├── readers.html
    ├── dashboard.html
    ├── history.html
    ├── reports.html
    ├── settings.html 
    └── books.html
    css/
    └── style.css
    js/
    ├── app.js
    ├── auth.js
    ├── books.js
    ├── bookService.js
    ├── borrow.js
    ├── borrowService.js
    ├── dashboard.js
    ├── history.js
    ├── login.js
    ├── readers.js
    ├── readreService.js
    ├── reports.js
    ├── reportService.js
    ├── settings.js
    └── register.js
```

## Tinh nang hien co

- Dang ky tai khoan moi (luu vao IndexedDB)
- Dang nhap bang username hoac email
- Ghi nho ten dang nhap
- Kiem tra phien dang nhap truoc khi vao dashboard
- Dang xuat
