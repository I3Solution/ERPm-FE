# 🗺️ LỘ TRÌNH PHÁT TRIỂN FRONTEND (ERPM-FE ROADMAP)

> **Repository:** https://github.com/I3Solution/ERPm-FE.git  
> **Kiến trúc:** Angular 18 Standalone, Ionic 8, Signals, Multi-Submodules

---

## 📌 GIAI ĐOẠN 1: NỀN TẢNG HYBRID & CÁC SUBMODULE CỐT LÕI (HOÀN THÀNH)
- [x] **Submodule Triad Architecture:** Tách độc lập 5 module nghiệp vụ thành 5 submodule:
  - `catalog`: https://github.com/I3Solution/ERPm-FE-catalog.git
  - `dashboard`: https://github.com/I3Solution/ERPm-FE-dashboard.git
  - `inventory`: https://github.com/I3Solution/ERPm-FE-inventory.git
  - `partners`: https://github.com/I3Solution/ERPm-FE-partners.git
  - `sales`: https://github.com/I3Solution/ERPm-FE-sales.git
- [x] **Core Design System:** CSS Variables tokens, Responsive table desktop & card mobile.
- [x] **Multi-Branch Recursive Tree Select:** Menu đệ quy chọn chi nhánh với BFS filtering.
- [x] **CustomSelectComponent:** Dropdown tùy chỉnh, tìm kiếm nhanh, triệt tiêu caret nhấp nháy.
- [x] **Dynamic Item Attributes (JSONB):** Sinh form điều khiển động theo metadata.
- [x] **Hệ thống Đa ngôn ngữ (i18n):** TranslatePipe + Signal State (VI/EN).

---

## 📌 GIAI ĐOẠN 2: MỞ RỘNG HARDWARE NATIVE & PHÂN HỆ MUA HÀNG
- [ ] **Tích hợp Camera Barcode Scanner:** Capacitor Scanner cho `catalog`, `sales`, `inventory`.
- [ ] **Máy in hóa đơn nhiệt ESC/POS:** In Bluetooth/LAN qua Capacitor Printer Plugin trong `sales`.
- [ ] **Submodule Mua hàng (`purchase`):**
  - Tạo Git Submodule `https://github.com/I3Solution/ERPm-FE-purchase.git`.
  - Quản lý đơn mua hàng, nhận hàng và theo dõi tiến độ giao hàng từ NCC.
- [ ] **Submodule Sổ quỹ (`treasury`):**
  - Quản lý phiếu thu, phiếu chi, sổ tiền mặt / tài khoản ngân hàng.

---

## 📌 GIAI ĐOẠN 3: OFFLINE MODE & PWA / MOBILE STORES
- [ ] IndexedDB Offline Caching cho POS thu ngân khi rớt mạng.
- [ ] Build & đóng gói Capacitor cho Android (APK) và iOS (IPA).
