# Quy tắc giao diện ERPm Frontend

Đọc cùng [AGENTS.md](AGENTS.md) và mục Frontend trong [PROJECT_MASTER.md](PROJECT_MASTER.md). Tài liệu này dành cho developer và AI khi tạo hoặc rà soát màn hình. Khi đổi component, hành vi hoặc quy ước dùng chung, cập nhật quy tắc và màn tham chiếu trong cùng thay đổi.

## Cấu trúc màn hình

- Dùng Angular standalone, OnPush, Signals và ba file TypeScript, HTML, SCSS. Dùng Reactive Forms cùng `app-form-control` hoặc `app-input-control` cho dữ liệu nhập. Comment source viết bằng tiếng Anh.
- Dùng `app-list-page` cho danh sách và `app-detail-page` cho chi tiết. Shell xử lý loading, lỗi, rỗng và điều hướng theo API hiện có. Dùng `app-data-table` cho dữ liệu phẳng và `app-tree-view` cho dữ liệu phân cấp. Angular Material chỉ xuất hiện bên trong `app-data-table`.
- Dùng token trong `src/theme` cho màu, khoảng cách và kiểu hiển thị. Tận dụng component hiện có để giữ kiểu dáng và hành vi thống nhất. Giữ nguyên hỗ trợ sáng/tối, bàn phím và màn hình hẹp.

## Header và toolbar

- Header đặt chuông thông báo bên trái cụm điều khiển. Nhấp tên hoặc avatar tài khoản để chọn Tiếng Việt, English, chế độ sáng/tối và đăng xuất. Tùy chọn hiển thị ô bảng cũng nằm trong menu này.
- Khai báo thao tác toolbar bằng `PageAction` (alias `ListAction` cho màn danh sách). Giữ một thao tác chính hiện rõ bằng `primary`. Dùng menu `⋯` cho các thao tác phụ, với đúng quyền và trạng thái vô hiệu hóa. Dành slot `[actions]` cho UI tùy biến cần trạng thái hoặc xác nhận riêng.
- Đặt ô tìm kiếm và bộ lọc trong slot `[filters]`. Để toolbar tự xuống hàng, giữ nhãn nút chính và để trạng thái tải/error/empty ở shell.

## Checkbox và thao tác trên nhiều dòng

- Danh sách có hoặc chuẩn bị có thao tác hàng loạt bật `selectable` trên `app-data-table`. Checkbox đứng trước dữ liệu, cùng một nguồn trạng thái cho bảng desktop và thẻ mobile. Click checkbox giữ nguyên trang đang xem.
- Chọn tất cả chỉ áp dụng cho dữ liệu trang đang hiển thị. Dùng ID ổn định. Màn phân trang server dùng `createListSelection` để xóa lựa chọn khi query hoặc tập dữ liệu đổi, nối `[selection]` và `(selectionChange)` của bảng với `[selectedCount]` và `(clearSelection)` của shell. Truyền `cardTemplate` nếu thẻ mobile cần bố cục riêng. Màn tham chiếu là SD Đơn bán hàng và WMS Sản phẩm.
- Dùng `requiresSelection` để vô hiệu hóa một `PageAction` khi chưa chọn dòng. Khi nối nghiệp vụ duyệt, từ chối hoặc đổi trạng thái, module kiểm tra quyền và trạng thái đủ điều kiện, dùng API nghiệp vụ, xử lý lỗi một phần và nạp lại dữ liệu. Shared component chỉ quản lý tương tác UI.

## Dữ liệu phân cấp

- Dùng `app-tree-view` cho nhóm điều hướng hoặc dữ liệu cha–con. Node dùng ID ổn định, nút nở/thu có tên truy cập và báo trạng thái, node lá căn cùng hàng. Menu lọc quyền ở nguồn và mở tạm nhóm chứa route đang xem mà không ghi đè lựa chọn thủ công. Màn dữ liệu truyền template riêng cho nội dung và thao tác của node.
- Trạng thái mở/thu thủ công của nhóm menu điều hướng được lưu phiên bản hóa theo `account.id` qua `NavigationPreferenceService` (`erpm_nav_expanded:account:<id>`), dùng chung cho sidebar desktop và trang Thêm (`/more`) trên mobile; tự loại ID nhóm đã xóa, tôn trọng quyền hiện tại và chịu lỗi khi dữ liệu cũ/hỏng hoặc `localStorage` bị chặn. Khi người dùng bấm thu nhóm đang active, nhóm thu lại ngay trong phiên xem hiện tại (và bị gỡ khỏi preference nếu trước đó đã lưu mở); khi tải lại trang hoặc điều hướng rời khỏi nhóm rồi quay lại route đó, nhóm sẽ tự mở tạm lại để hỗ trợ định vị.
- Giữ tổ tiên để người dùng thấy đường dẫn khi tìm trong cây. Bộ lọc mở nhánh có kết quả. Khi bỏ lọc, dùng lại trạng thái mở/đóng trước đó. Màn tham chiếu là ACC Hệ thống tài khoản.

## Rà soát trước khi bàn giao

- Kiểm tra VI/EN và giữ hai dictionary FE/BE đồng bộ từng byte khi thêm khóa.
- Chạy build, ChromeHeadless và `node tools/check-ui-std.mjs`. Với thay đổi bố cục, kiểm tra desktop, mobile, sáng/tối và thao tác bằng bàn phím trên màn bị ảnh hưởng.
