# UI-STD GĐ0: số đo thực (Playwright, getComputedStyle)

> Đo bằng `measure.js` trên bản FE master 2026-11-14 + API local (DB `erpm_uistd`, seed demo). 25 route × 3 chế độ (desktop 1366px sáng, desktop tối, mobile 390px sáng). Số liệu gốc: `measurements.json`; ảnh: `shots/<route>.<chế độ>.png`. Dòng bảng chỉ đo được khi màn có dữ liệu (— = danh sách rỗng hoặc không có bảng).

## 1. Desktop 1366px, sáng

| Route | Khung | Tiêu đề (px) | Nút chính cao/chữ | Nút trong dòng (cao) | Nút/dòng tối đa | Ô nhập đầu (cao) | Dòng bảng cao | Chữ ô | Tràn ngang |
|---|---|---|---|---|---|---|---|---|---|
| dashboard | - | 26 | —/— | — | — | — | — | — | không |
| catalog | LT | 24 | 36/14 | — | — | 36.6 | 50.1 | 14 | không |
| catalog/new | D | 26 | 36/14 | — | — | 36.6 | — | — | không |
| sales/price-lists | -T | 24 | 36/14 | — | — | 36.6 | 97 | 14 | không |
| sales/quotations | L | 24 | 36/14 | — | — | 36.6 | — | — | không |
| sales/orders | L | 24 | 36/14 | — | — | 36.6 | — | — | không |
| sales/orders/new | -T | — | 33.6/14 | 26.4 | 1 | 36.6 | 60.4 | 14 | không |
| sales/returns | L | 24 | 36/14 | — | — | 36.6 | — | — | không |
| inventory | -T | 24 | 36/14 | — | — | 36.6 | 97 | 14 | không |
| crm/partners | -T | 24 | 36/14 | — | — | 36.6 | 97 | 14 | không |
| crm/partners/new | - | 21.6 | 33.6/14 | — | — | 36.6 | — | — | không |
| org | - | 24 | —/— | — | — | — | — | — | không |
| department-levels | -T | 24 | 36/14 | 26.4 | 2 | — | 51.4 | 14 | không |
| job-positions | -T | 24 | 36/14 | 26.4 | 2 | 36.6 | 51.4 | 14 | không |
| employees | LT | 24 | 36/14 | 26.4–31.4 | 4 | 36.6 | 64.2 | 14 | không |
| employees/new | D | 26 | 36/14 | — | — | 36.6 | — | — | không |
| employees/1 | D | 26 | 36/14 | — | — | 36.6 | — | — | không |
| employees/1/work-history | - | 24 | 36/14 | — | — | — | — | — | không |
| users | -T | 24 | 36/14 | 26.4 | 1 | 36.6 | 51.4 | 14 | không |
| roles | - | 24 | 26.4/12.4 | — | — | 36.6 | — | — | không |
| admin | - | 24 | —/— | — | — | — | — | — | không |
| more | - | 24 | —/— | — | — | — | — | — | không |
| notifications | - | 24 | 41/14 | — | — | — | — | — | không |
| notifications/preferences | -R | 24 | —/— | — | — | — | 56.2 | 14 | không |
| notifications/templates | -T | 24 | 36/14 | 32–36 | 2 | 36.6 | 83.8 | 14 | không |

Khung: L = `app-list-page`, D = `app-detail-page`, T = `app-data-table`, R = `<table>` tay, - = tự dựng.

## 2. Độ phân tán giữa các màn (desktop sáng)

| Đại lượng | Giá trị -> số màn |
|---|---|
| Cỡ tiêu đề trang (px) | 21.6 → 1, 24 → 19, 26 → 4 |
| Chiều cao nút chính (px) | 26.4 → 1, 33.6 → 2, 36 → 16, 41 → 1 |
| Chiều cao ô nhập đầu tiên (px) | 36.6 → 17 |
| Chiều cao dòng bảng (px) | 50.1 → 1, 51.4 → 3, 56.2 → 1, 60.4 → 1, 64.2 → 1, 83.8 → 1, 97 → 3 |
| Chiều cao nút trong dòng (px), min | 26.4 → 5, 32 → 1 |
| Chiều cao nút trong dòng (px), max | 26.4 → 4, 31.4 → 1, 36 → 1 |
| Số nút tối đa trên một dòng | 1 → 2, 2 → 3, 4 → 1 |

## 3. Mobile 390px và tối

| Route | Tràn ngang mobile | Tiêu đề mobile (px) | Nút chính mobile cao | Tràn ngang tối |
|---|---|---|---|---|
| dashboard | không | 26 | — | không |
| catalog | không | 24 | 36 | không |
| catalog/new | không | 26 | 36 | không |
| sales/price-lists | không | 24 | 36 | không |
| sales/quotations | không | 24 | 36 | không |
| sales/orders | không | 24 | 36 | không |
| sales/orders/new | không | — | 33.6 | không |
| sales/returns | không | 24 | 36 | không |
| inventory | không | 24 | 36 | không |
| crm/partners | không | 24 | 36 | không |
| crm/partners/new | không | 21.6 | 33.6 | không |
| org | không | 24 | — | không |
| department-levels | không | 24 | 36 | không |
| job-positions | không | 24 | 36 | không |
| employees | không | 24 | 36 | không |
| employees/new | không | 26 | 36 | không |
| employees/1 | không | 26 | 36 | không |
| employees/1/work-history | không | 24 | 36 | không |
| users | không | 24 | 36 | không |
| roles | không | 24 | 26.4 | không |
| admin | không | 24 | — | không |
| more | không | 24 | — | không |
| notifications | không | 24 | 41 | không |
| notifications/preferences | không | 24 | — | không |
| notifications/templates | không | 24 | 36 | không |

## 4. Nhận xét từ số liệu

- Cỡ tiêu đề trang, chiều cao nút chính, chiều cao dòng bảng và chiều cao nút trong dòng đều **không thống nhất** giữa các màn (xem mục 2).
- Nút trong dòng có chiều cao khác nút chính và khác nhau giữa các màn; một số màn đặt tới 4 nút trên một dòng.
- Chiều cao dòng bảng dao động rất lớn (xem mục 2), phần lớn do nội dung ô và padding riêng từng màn.
- Số đo là đầu vào cho GĐ1: chuẩn đề xuất chọn trong khoảng số liệu thực này, không phải con số ước lượng.
