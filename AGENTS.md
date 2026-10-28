# 🤖 AGENTS.MD: HƯỚNG DẪN DÀNH CHO AI AGENT TRONG DỰ ÁN ERPM-FE

Chào bạn AI Assistant, bạn đang làm việc trên repository **ERPm-FE** - Ứng dụng Frontend Angular 18 + Ionic 8 Hybrid cho ERPm (Quản trị Bán hàng, Tồn kho & Kế toán mở rộng).
- **Repository Remote:** `https://github.com/I3Solution/ERPm-FE.git`

---

## 📌 QUY TẮC HOẠT ĐỘNG BẮT BUỘC

1. **Đọc tài liệu cốt lõi trước khi thực hiện nhiệm vụ:**
   - [PROJECT_MASTER.md](file:///d:/WORKING%20PLACE/ERPm/ERPm-FE/PROJECT_MASTER.md): Kiến trúc Standalone, Signals, Design System và quản lý submodule.
   - [.ai/roadmap.md](file:///d:/WORKING%20PLACE/ERPm/ERPm-FE/.ai/roadmap.md): Lộ trình phát triển tính năng Frontend.
   - [.ai/status.md](file:///d:/WORKING%20PLACE/ERPm/ERPm-FE/.ai/status.md): Trạng thái hiện tại của Frontend và các công việc tiếp theo.

2. **Cấu trúc Git Submodule cho từng Module nghiệp vụ:**
   - Mỗi module trong `src/app/modules/` là một Git Submodule độc lập:
     - `catalog`: `https://github.com/I3Solution/ERPm-FE-catalog.git`
     - `dashboard`: `https://github.com/I3Solution/ERPm-FE-dashboard.git`
     - `inventory`: `https://github.com/I3Solution/ERPm-FE-inventory.git`
     - `partners`: `https://github.com/I3Solution/ERPm-FE-partners.git`
     - `sales`: `https://github.com/I3Solution/ERPm-FE-sales.git`
   - Khi sửa đổi code trong một module, cần cập nhật `.ai/plan.md`, `.ai/status.md` và `.ai/steps/` bên trong module đó, đồng thời commit submodule trước khi cập nhật pointer ở root FE.

3. **Quy chuẩn lưu vết từng Step vào thư mục `.ai/steps/`:**
   - Cập nhật file log: `d:/WORKING PLACE/ERPm/ERPm-FE/.ai/steps/step-[số thứ tự]-[tên-ngắn-gọn].md`.

4. **Kỷ luật Kỹ thuật Frontend (Angular 18 + Ionic 8):**
   - 100% Standalone Components, Signal State Management, OnPush Change Detection.
   - Triad 3-file tách bạch: Mỗi component bắt buộc có file `.ts`, `.html`, `.scss` riêng biệt. Không nhét inline template hoặc inline style.
   - Đa ngôn ngữ (i18n): Mọi text hiển thị bắt buộc qua pipe `translate`.
   - Cursor pointer & User select: Không để caret nhấp nháy trên non-editable text, các vùng tương tác ép `cursor: pointer`.
   - **Code Comments (English Only):** Toàn bộ comment trong TypeScript, HTML, SCSS bắt buộc 100% bằng Tiếng Anh.
