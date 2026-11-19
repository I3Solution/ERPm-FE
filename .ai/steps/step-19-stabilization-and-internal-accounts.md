# Step19 — ERPm-FE stabilization

Ngày2026-10-29. Sửa ưu tiên review, xác thực nội bộ và dữ liệu thực. Chi tiết phạm vi/toàn bộ lệnh và giới hạn ở Step19 root, hướng dẫn docs/LOCAL_DEVELOPMENT.md và bảng đối chiếu F01–F22.

## Mục tiêu

Login/guard/interceptor, Signals/reactive controls/i18n, pagination/lookup/routes, real data/print/a11y, tests/CI.

## Lệnh đã chạy

- `npm.cmd run build`
- `node_modules/.bin/tsc.cmd --noEmit -p tsconfig.spec.json`
- `CHROME_BIN=... npm.cmd test -- --watch=false --browsers=ChromeHeadless`
- `git status, git diff --check, git check-ignore, kiểm kê i18n keys/comments`

## Verification

- Backend solution build: **0 warning, 0 error** với SDK10.0.403; không dùng dotnet8 trên PATH.
- PostgreSQL18: **44 kiểm tra đạt**, DB cuối erpm_verify_4e0da447e406407398afec289ace3df2. Fixture nâng cấp chứa UOM/item UUID cũ và FK; kiểm tra snapshot/model, dashboard0, costing/payment/journal/idempotency/validation/concurrency/JSONB/cancellation/scope/immutability/master-data guard và HTTP auth/orders/revoke. Fixture chưa bao phủ mọi dạng dữ liệu lịch sử tài chính.
- Chạy đồng thời 4 bán +4 nhập không mất cập nhật. Case nhập3@1 +4@2 giữ trị giá tồn11; xuất hết ghi giá vốn11, tồn quantity/value0.
- Frontend production build đạt; initial **604.08kB**, còn warning budget500kB và Stencil empty-glob. Spec type-check đạt; **7/7 ChromeHeadless đạt**.
- 238 key VI và238 key EN từ JSON chung; literal template keys và error codes backend không thiếu bản dịch.
- Local smoke: migration/seed, admin login/profile, dictionary238 key và dashboard0 đạt trên DB mới erpm_mvp_local_a7b56c332ef941d3962eb338c78fc765. Database cũ không reset. Credentials/config/keys đều được git check-ignore xác nhận ignored.
- CI workflow mới ở root/BE/FE chưa chạy trên GitHub; chưa có E2E toàn bộ app trên mobile/desktop hoặc kiểm tra thiết bị in.

## Gián đoạn và giới hạn môi trường

- Ban đầu công cụ gặp os error112; người dùng đã dọn dung lượng và công việc được tiếp tục. SDK10 thực tế đã có trong thư mục người dùng, ngoài PATH; đính chính đánh giá Step18.
- NuGet advisory feed không truy cập được; restore dùng cache và tắt audit chỉ qua tham số lệnh, không thay chính sách CI.
- Một lượt kiểm thử cuối bị Npgsql SSLRequest error do PostgreSQL **out of memory/recovery**, log Windows1455. Đã đọc log được cấp quyền, xác nhận ổ C: hết chỗ (D: còn~96GB), tắt MSBuild/Roslyn build servers và chạy lại tuần tự với TEMP/TMP trên D:. Lượt sau đạt đủ44. Không sửa logic để che lỗi và không restart/reset DB.
- Cần duy trì dung lượng C:/virtual memory để tránh sự cố vận hành lặp lại. Không tự dọn dữ liệu người dùng ngoài workspace.

## Hướng tiếp theo

Nghiệm thu MVP bằng quy trình thực tế; E2E mobile/desktop và CI private submodules; UI quản trị account/hủy chứng từ; PO→nhận hàng→hóa đơn mua và thu/chi; sau đó sổ cái, chuyển kho/kiểm kê, native/ESC-POS/offline. DB tạo thủ công bằng script cũ cần adoption riêng nếu giữ dữ liệu. Chưa commit/push/deploy server trong phiên.

## File tạo/chỉnh sửa/xóa (đường dẫn trong repo này)

- `.ai/roadmap.md` (M)
- `.ai/status.md` (M)
- `.gitignore` (M)
- `AGENTS.md` (M)
- `PROJECT_MASTER.md` (M)
- `README.md` (M)
- `angular.json` (M)
- `src/app/app.component.html` (M)
- `src/app/app.component.spec.ts` (M)
- `src/app/app.component.ts` (M)
- `src/app/app.config.ts` (M)
- `src/app/app.routes.ts` (M)
- `src/app/core/services/branch.service.ts` (M)
- `src/app/core/services/dashboard.service.ts` (M)
- `src/app/core/services/item.service.ts` (M)
- `src/app/core/services/localization.service.ts` (M)
- `src/app/core/services/partner.service.ts` (M)
- `src/app/core/services/sales.service.ts` (M)
- `src/app/core/services/stock.service.ts` (M)
- `src/app/core/services/theme.service.ts` (M)
- `src/app/modules/CRM` (M)
- `src/app/modules/SD` (M)
- `src/app/modules/WMS` (M)
- `src/app/modules/dashboard` (M)
- `src/app/shared/components/branch-tree-select/branch-tree-select.component.html` (M)
- `src/app/shared/components/branch-tree-select/branch-tree-select.component.ts` (M)
- `src/app/shared/components/custom-select/custom-select.component.html` (M)
- `src/app/shared/components/custom-select/custom-select.component.ts` (M)
- `src/app/shared/components/form-control/form-control.component.html` (M)
- `src/app/shared/components/form-control/form-control.component.ts` (M)
- `src/app/shared/components/input-control/input-control.component.html` (M)
- `src/app/shared/components/input-control/input-control.component.ts` (M)
- `src/index.html` (M)
- `src/styles.scss` (M)
- `src/theme/tables.scss` (M)
- `tsconfig.json` (M)
- `.ai/steps/step-19-stabilization-and-internal-accounts.md` (??)
- `.github/workflows/verify.yml` (??)
- `proxy.conf.json` (??)
- `src/app/core/api.interceptor.ts` (??)
- `src/app/core/auth.guard.ts` (??)
- `src/app/core/login/login.component.html` (??)
- `src/app/core/login/login.component.scss` (??)
- `src/app/core/login/login.component.ts` (??)
- `src/app/core/money.ts` (??)
- `src/app/core/services/api-error.service.ts` (??)
- `src/app/core/services/auth.service.ts` (??)
- `src/assets/i18n/system.json` (??)
