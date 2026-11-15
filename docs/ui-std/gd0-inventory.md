# UI-STD GĐ0: kiểm kê giao diện FE (tĩnh)

> Sinh bởi script đọc template/SCSS của các màn trong `src/app/modules` tại master 2026-11-14. Số đo pixel thực và ảnh chụp **chưa có** (cần chạy app + API, xem mục 5).

## 1. Tổng quan

- 47 template màn/thành phần (`*.component.html`) ở CRM, HRM, SD, SYS, WMS và dashboard; ACC, PUR, MFG, SCM, PM chưa có màn.
- Dùng khung `app-list-page`: **5**; `app-detail-page`: **2**; `app-data-table`: **17**; `<table>` tự dựng: **11**.
- Nút: 177 nút kích thước mặc định, 56 nút `erpm-btn-sm`. Không có biến thể cỡ khác, không có token chiều cao nút.
- SCSS riêng từng màn tự đặt: `font-size` ×236, `height/min-height` ×30, `padding` ×252, ghi đè lớp `.btn` ×7 (tổng 4723 dòng SCSS).

## 2. Theo module

| Module | Màn | list-page | detail-page | data-table | `<table>` tay | font-size riêng | height riêng | padding riêng |
|---|---|---|---|---|---|---|---|---|
| CRM | 3 | 0 | 0 | 1 | 0 | 17 | 0 | 18 |
| HRM | 8 | 1 | 1 | 3 | 0 | 10 | 2 | 29 |
| SD | 20 | 3 | 0 | 8 | 8 | 134 | 13 | 137 |
| SYS | 12 | 0 | 0 | 3 | 3 | 71 | 14 | 65 |
| WMS | 3 | 1 | 1 | 2 | 0 | 0 | 0 | 1 |
| dashboard | 1 | 0 | 0 | 0 | 0 | 4 | 1 | 2 |

## 3. Từng template

Cột Khung: L=list-page, D=detail-page, T=data-table, R=`<table>` tay, - = tự dựng bố cục. Nút: tổng (sm/mặc định).

| Template | Khung | Nút | font-size | height | padding | dòng SCSS |
|---|---|---|---|---|---|---|
| CRM/partners/partner-form/components/partner-delivery-addresses/partner-delivery-addresses | - | 7 (7/0) | 11 | 0 | 8 | 205 |
| CRM/partners/partner-form/partner-form | - | 3 (0/3) | 5 | 0 | 7 | 142 |
| CRM/partners/partners | T | 6 (1/5) | 1 | 0 | 3 | 33 |
| HRM/department-levels/components/department-level-form-dialog/department-level-form-dialog | - | 3 (0/3) | 0 | 0 | 0 | 0 |
| HRM/department-levels/department-levels | T | 3 (2/1) | 1 | 0 | 4 | 20 |
| HRM/employee-detail/employee-detail | D | 3 (0/3) | 1 | 0 | 0 | 4 |
| HRM/employees/employees | LT | 4 (3/1) | 0 | 0 | 0 | 6 |
| HRM/job-positions/job-positions | T | 10 (2/8) | 0 | 0 | 9 | 22 |
| HRM/org-tree/org-tree | - | 16 (0/16) | 5 | 1 | 10 | 74 |
| HRM/work-histories/components/work-history-form-dialog/work-history-form-dialog | - | 3 (0/3) | 0 | 0 | 0 | 0 |
| HRM/work-histories/work-histories | - | 4 (2/2) | 3 | 1 | 6 | 32 |
| SD/orders/components/order-detail-drawer/order-detail-drawer | R | 6 (0/6) | 9 | 2 | 10 | 186 |
| SD/orders/components/order-invoice-dialog/order-invoice-dialog | - | 3 (0/3) | 0 | 0 | 0 | 0 |
| SD/orders/order-detail/order-detail | T | 16 (3/13) | 22 | 4 | 18 | 342 |
| SD/orders/orders | LT | 5 (4/1) | 7 | 0 | 7 | 161 |
| SD/pos/pos | R | 18 (0/18) | 18 | 5 | 27 | 492 |
| SD/price-lists/components/price-list-form-dialog/price-list-form-dialog | - | 3 (0/3) | 0 | 0 | 0 | 5 |
| SD/price-lists/components/price-list-items/price-list-items | T | 5 (1/4) | 5 | 0 | 4 | 61 |
| SD/price-lists/components/price-list-versions/price-list-versions | R | 8 (2/6) | 5 | 0 | 5 | 16 |
| SD/price-lists/components/pricing-simulator-dialog/pricing-simulator-dialog | - | 3 (0/3) | 0 | 0 | 0 | 9 |
| SD/price-lists/price-list-detail/price-list-detail | - | 6 (0/6) | 8 | 0 | 9 | 198 |
| SD/price-lists/price-lists | T | 7 (6/1) | 4 | 0 | 4 | 113 |
| SD/print-preview/print-preview-dialog/print-preview-dialog | R | 5 (0/5) | 1 | 2 | 7 | 118 |
| SD/quotations/components/quotation-detail-drawer/quotation-detail-drawer | R | 4 (0/4) | 5 | 0 | 5 | 78 |
| SD/quotations/components/quotation-form-dialog/quotation-form-dialog | R | 5 (2/3) | 1 | 0 | 1 | 15 |
| SD/quotations/quotation-detail/quotation-detail | T | 11 (0/11) | 17 | 0 | 12 | 307 |
| SD/quotations/quotations | LT | 5 (4/1) | 4 | 0 | 4 | 123 |
| SD/returns/components/return-detail-drawer/return-detail-drawer | R | 1 (0/1) | 6 | 0 | 6 | 76 |
| SD/returns/components/return-form-dialog/return-form-dialog | R | 5 (2/3) | 1 | 0 | 1 | 15 |
| SD/returns/return-detail/return-detail | T | 4 (0/4) | 17 | 0 | 13 | 320 |
| SD/returns/returns | LT | 4 (3/1) | 4 | 0 | 4 | 96 |
| SYS/admin-hub/admin-hub | - | 0 (0/0) | 8 | 2 | 4 | 174 |
| SYS/notifications/notification-center/notification-center | T | 5 (0/5) | 16 | 1 | 11 | 280 |
| SYS/notifications/notification-preferences/notification-preferences | R | 0 (0/0) | 11 | 3 | 4 | 186 |
| SYS/notifications/notification-templates/notification-templates | T | 10 (0/10) | 28 | 8 | 17 | 600 |
| SYS/roles/components/account-access/account-access | - | 0 (0/0) | 0 | 0 | 2 | 5 |
| SYS/roles/components/data-scope/data-scope | - | 1 (0/1) | 1 | 0 | 2 | 11 |
| SYS/roles/components/effective-permission-preview/effective-permission-preview | R | 3 (3/0) | 3 | 0 | 4 | 22 |
| SYS/roles/components/permission-matrix/permission-matrix | R | 5 (4/1) | 3 | 0 | 3 | 29 |
| SYS/roles/components/policy-json-editor/policy-json-editor | - | 0 (0/0) | 0 | 0 | 0 | 2 |
| SYS/roles/components/user-role-assignment/user-role-assignment | - | 1 (0/1) | 1 | 0 | 2 | 4 |
| SYS/roles/roles | - | 11 (4/7) | 0 | 0 | 12 | 46 |
| SYS/users/users | T | 2 (1/1) | 0 | 0 | 4 | 8 |
| WMS/inventory/inventory | T | 5 (0/5) | 0 | 0 | 1 | 6 |
| WMS/item-detail/item-detail | D | 2 (0/2) | 0 | 0 | 0 | 4 |
| WMS/items/items | LT | 1 (0/1) | 0 | 0 | 0 | 3 |
| dashboard/dashboard/dashboard | - | 1 (0/1) | 4 | 1 | 2 | 74 |

## 4. Phát hiện chính

1. **Chưa có token kích thước.** `theme/variables.scss` chỉ có token màu và `--erpm-radius-*`; không có token cỡ chữ, chiều cao nút/ô nhập/dòng bảng, khoảng cách. `.erpm-btn` (theme/components.scss) dựng bằng `padding: 0.625rem 1.25rem; font-size: 0.875rem`, `.erpm-btn-sm` là biến thể duy nhất.
2. **Tiêu đề trang**: `.erpm-page-title` 1.5rem/800 ở theme; nhiều màn tự dựng thanh tiêu đề riêng trong SCSS (nhóm SD, SYS).
3. **Bảng**: chỉ một phần dùng `app-data-table`; các màn còn lại dùng `<table>` tay với CSS riêng, nên dòng/cỡ chữ/viền khác nhau.
4. **Cột hành động**: nhiều màn đặt 3-4 nút chữ trong dòng; chưa có thành phần row-actions dùng chung. `app-dropdown-menu` (Dev 1, FE #45) là mẫu cho menu "...".
5. **Khung trang**: chỉ các màn đã qua LD.1 (HRM, WMS, vài màn SD) dùng `app-list-page`/`app-detail-page`; còn lại tự dựng.
6. Màn có nhiều tùy biến SCSS nhất (cần ưu tiên dọn): xem 8 dòng đầu khi sắp xếp cột "font-size + height + padding" ở mục 3 (notification-templates, pos, order-detail, return-detail, quotation-detail, notification-center).

## 5. Số đo thực và ảnh

Xem `gd0-measurements.md` (bảng số đo 25 route × 3 chế độ), `measurements.json`, ảnh trong `shots/`, và script đo `tools/measure.js`. Chuẩn đề xuất (GĐ1) sẽ chọn từ số đo đó.
