# ERPm-FE — Step 19, 2026-10-29

## Completed

- [x] Login nội bộ, auth guard/interceptor, quyền thao tác, banner lỗi và logout; bảo vệ phiên mới khi HTTP của phiên cũ trả về.
- [x] Signals/computed/effect, số tiền POS với 4 chữ số thập phân; FormGroup cho dữ liệu lưu và CVA OnPush có nhãn/keyboard.
- [x] Lookup kho–chi nhánh thực, nhập kho có NCC; bỏ fallback dữ liệu mẫu; dictionary entries và VI/EN UTF-8; shortcut đúng route.
- [x] State item theo component, phân trang catalogue, remote search POS/phiếu nhập với barcode/bản dịch, lazy routes, proxy /api.
- [x] Production build và spec type-check đạt. 7 kiểm thử Chrome đạt; workflow CI đã tạo, chưa chạy trên GitHub.

## In-Progress

Nghiệm thu UI trên màn hình nhỏ/desktop và chạy E2E với backend. Initial bundle ~604 kB vượt budget 500 kB, warning Stencil empty-glob còn tồn tại; chưa nâng budget để che warning.

## Next Steps

UI quản lý tài khoản và hủy chứng từ, PUR/thu chi, tối ưu bundle, kiểm thử E2E/CI; sau đó native/ESC-POS/offline. Không có Capacitor/native/offline hoàn chỉnh trong checkout hiện tại. Xem [Step 19](steps/step-19-stabilization-and-internal-accounts.md).


---

## Tài liệu trước Step 19 — lưu để truy vết

# 📊 BẢNG TRẠNG THÁI FRONTEND (ERPM-FE STATUS)

> **Cập nhật:** 2026-10-28  
> **Repository:** https://github.com/I3Solution/ERPm-FE.git  
> **Trạng thái:** Tách độc lập thành công, 5 submodule tích hợp đầy đủ, build 0 error.

---

## 📌 1. TIẾN ĐỘ CÁC MODULE SUBMODULE
| Module Submodule | Repository Remote | Tiến độ | Trạng thái |
| :--- | :--- | :---: | :---: |
| **Catalog** | `https://github.com/I3Solution/ERPm-FE-catalog.git` | 100% | Hoàn thành |
| **Dashboard** | `https://github.com/I3Solution/ERPm-FE-dashboard.git` | 100% | Hoàn thành |
| **Inventory** | `https://github.com/I3Solution/ERPm-FE-inventory.git` | 100% | Hoàn thành |
| **Partners** | `https://github.com/I3Solution/ERPm-FE-partners.git` | 100% | Hoàn thành |
| **Sales** | `https://github.com/I3Solution/ERPm-FE-sales.git` | 100% | Hoàn thành |

---

## 🛠️ 2. TIẾN ĐỘ NỀN TẢNG CHUNG
| Hạng mục nền tảng | Tiến độ | Trạng thái |
| :--- | :---: | :---: |
| **Design System & Tokens** | 100% | Hoàn thành |
| **Multi-Branch Tree-Select & BFS** | 100% | Hoàn thành |
| **CustomSelectComponent** | 100% | Hoàn thành |
| **InputControlComponent & FormControlComponent (`FormGroup`)** | 100% | Hoàn thành |
| **Đa ngôn ngữ (i18n)** | 100% | Hoàn thành |
| **Build & Bundle Validation** | 100% | Hoàn thành (`ng build` 0 error) |
