# ERPm Frontend

Angular 17.3, Ionic 8, standalone/Signals/OnPush. Clone recursive 10 submodules trước npm ci. npm start mở http://localhost:4200 và proxy /api tới http://localhost:5000. Backend cần chạy cùng lúc; dùng tài khoản nội bộ đã bootstrap. Không có dữ liệu demo fallback.

Xem [hướng dẫn local và credentials](../docs/LOCAL_DEVELOPMENT.md), [.ai/status.md](.ai/status.md), [Step 19](.ai/steps/step-19-stabilization-and-internal-accounts.md).

Build: npm run build. Type-check: npx tsc --noEmit -p tsconfig.spec.json. Test: npm test -- --watch=false --browsers=ChromeHeadless; đặt CHROME_BIN nếu cần.

CI chưa chạy remote; private submodules cần SUBMODULES_TOKEN. Commit module trước rồi cập nhật gitlink FE/umbrella. Native scanner/ESC-POS/offline chưa triển khai; in hiện là browser print.
