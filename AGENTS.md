# 🤖 AGENTS.MD: HƯỚNG DẪN DÀNH CHO AI AGENT TRONG DỰ ÁN ERPM-FE

Chào bạn AI Assistant, bạn đang làm việc trên repository **ERPm-FE** - Ứng dụng Frontend Angular 20 + Ionic 8 Hybrid cho ERPm (Quản trị Bán hàng, Tồn kho & Kế toán mở rộng).
- **Repository Remote:** `https://github.com/I3Solution/ERPm-FE.git`

---

## 📌 QUY TẮC HOẠT ĐỘNG BẮT BUỘC

1. **Đọc tài liệu cốt lõi trước khi thực hiện nhiệm vụ:**
   - [PROJECT_MASTER.md](PROJECT_MASTER.md): Kiến trúc Standalone, Signals, Design System và quản lý submodule.
   - [.ai/roadmap.md](.ai/roadmap.md): Lộ trình phát triển tính năng Frontend.
   - [.ai/status.md](.ai/status.md): Trạng thái hiện tại của Frontend và các công việc tiếp theo.

2. **Cấu trúc Git Submodule cho từng Module nghiệp vụ:**
   - Mỗi module trong `src/app/modules/` là một Git Submodule độc lập:
     - `catalog`: `https://github.com/I3Solution/ERPm-FE-catalog.git`
     - `dashboard`: `https://github.com/I3Solution/ERPm-FE-dashboard.git`
     - `inventory`: `https://github.com/I3Solution/ERPm-FE-inventory.git`
     - `partners`: `https://github.com/I3Solution/ERPm-FE-partners.git`
     - `sales`: `https://github.com/I3Solution/ERPm-FE-sales.git`
   - Khi sửa đổi code trong một module, cần cập nhật `.ai/plan.md`, `.ai/status.md` và `.ai/steps/` bên trong module đó, đồng thời commit submodule trước khi cập nhật pointer ở root FE.

3. **Quy chuẩn lưu vết từng Step vào thư mục `.ai/steps/`:**
   - Cập nhật file log: `ERPm-FE/.ai/steps/step-[số thứ tự]-[tên-ngắn-gọn].md`.

4. **Kỷ luật Kỹ thuật Frontend (Angular 20 + Ionic 8):**
   - 100% Standalone Components, Signal State Management, OnPush Change Detection.
   - **Standardized Reactive Forms (`FormGroup` + `<app-form-control>` / `<app-input-control>`):** Mọi biểu mẫu nhập liệu lưu dữ liệu (CRUD Modal, Chứng từ) bắt buộc dùng `FormGroup` (`ReactiveFormsModule`) và vẽ control qua `<app-form-control>` (`FormControlComponent`) hoặc `<app-input-control>` (`InputControlComponent`) bằng cách truyền `type` (`'text' | 'number' | 'currency' | 'date' | 'textarea' | 'select' | 'checkbox'`) và `dataSource` (`SelectOption[]`).
   - Triad 3-file tách bạch: Mỗi component bắt buộc có file `.ts`, `.html`, `.scss` riêng biệt. Không nhét inline template hoặc inline style.
   - Đa ngôn ngữ (i18n): Mọi text hiển thị bắt buộc qua pipe `translate`.
   - Cursor pointer & User select: Không để caret nhấp nháy trên non-editable text, các vùng tương tác ép `cursor: pointer`.
   - **Code Comments (English Only):** Toàn bộ comment trong TypeScript, HTML, SCSS bắt buộc 100% bằng Tiếng Anh.

5. **Quy tắc Git Commit (Commit Message Convention):**
   - Mọi lệnh `git commit` trên `ERPm-FE` và các Submodules bắt buộc tuân thủ cú pháp:
     `[tag] nội dung commit` hoặc `[tag](MODULE) nội dung commit`
   - **Bộ 6 Tag chuẩn:**
     - `[add]`: Thêm mới màn hình, component, service, tính năng UI.
     - `[update]`: Cập nhật giao diện, luồng tương tác hoặc tối ưu hiệu năng.
     - `[fix]`: Sửa lỗi hiển thị, lỗi logic hoặc lỗi build.
     - `[refactor]`: Tái cấu trúc component/service không làm thay đổi hành vi.
     - `[db]`: Cập nhật mock data hoặc local storage schema.
     - `[docs]`: Cập nhật tài liệu (`PROJECT_MASTER.md`, `AGENTS.md`, `.ai/`).
