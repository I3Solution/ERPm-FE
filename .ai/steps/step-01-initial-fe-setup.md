# 🚀 STEP 01: KHỞI TẠO REPOSITORY ĐỘC LẬP ERPM-FE & CÁC SUBMODULE

## 🎯 1. MỤC TIÊU CỦA BƯỚC NÀY
- Tách Frontend thành repository độc lập `ERPm-FE` (`https://github.com/I3Solution/ERPm-FE.git`).
- Phân rã 5 module nghiệp vụ thành 5 Git Submodule độc lập:
  - `src/app/modules/catalog`: `https://github.com/I3Solution/ERPm-FE-catalog.git`
  - `src/app/modules/dashboard`: `https://github.com/I3Solution/ERPm-FE-dashboard.git`
  - `src/app/modules/inventory`: `https://github.com/I3Solution/ERPm-FE-inventory.git`
  - `src/app/modules/partners`: `https://github.com/I3Solution/ERPm-FE-partners.git`
  - `src/app/modules/sales`: `https://github.com/I3Solution/ERPm-FE-sales.git`
- Mỗi submodule có `README.md` và `.ai/` quản lý kế hoạch (`plan.md`), trạng thái (`status.md`), và nhật ký (`steps/`).
- Đăng ký danh sách submodule vào `.gitmodules` của `ERPm-FE`.

---

## 📂 2. CẤU TRÚC REPOSITORY
```text
ERPm-FE/
├── .ai/
│   ├── roadmap.md
│   ├── status.md
│   └── steps/
├── .gitignore
├── .gitmodules
├── AGENTS.md
├── PROJECT_MASTER.md
├── angular.json
├── package.json
└── src/
    ├── app/
    │   ├── core/
    │   ├── shared/
    │   ├── theme/
    │   └── modules/
    │       ├── catalog/    (Git Submodule: ERPm-FE-catalog)
    │       ├── dashboard/  (Git Submodule: ERPm-FE-dashboard)
    │       ├── inventory/  (Git Submodule: ERPm-FE-inventory)
    │       ├── partners/   (Git Submodule: ERPm-FE-partners)
    │       └── sales/      (Git Submodule: ERPm-FE-sales)
    └── styles.scss
```

---

## ✅ 3. KẾT QUẢ KIỂM TRA (VERIFICATION)
- `ng build`: **Build Succeeded** (0 Error).
