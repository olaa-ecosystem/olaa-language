# Olaa Language

Học tiếng Anh (A1–C2), tiếng Tây Ban Nha (A1–C2) và tiếng Trung (HSK1–6) cho người Việt. PRD: `olaa-platform/architecture/01-olaa-language/` và `architecture/PRD/OLAA_Ecosystem_PRD_v1.0.md`. Quyết định công nghệ: `docs/decisions/ADR-001-mvp-web-stack.md`.

## Giao diện

Giao diện mới (2026-11-24) theo phong cách Olaa Note / Olaa Habits (bản mẫu `prototypes/takenote-ipad-home` trong `olaa-platform`): khung kính mờ trên nền pastel trôi chậm, hạt phim nhẹ, bo góc 18–28px. Màu nhận diện lấy từ ô app trong bản mẫu Note: Language xanh Fuji, Habits cam Kodak, Note xám than. Biểu tượng chức năng là bộ 20 biểu tượng Olaa (`packages/design-system/icons`); nút mà bộ này chưa có (đóng, quay lại, ✓/✗, loa…) dùng biểu tượng nét tạm. Sáng / Tối / Theo thiết bị, song ngữ Việt–Anh, tôn trọng "giảm chuyển động".

> Lưu ý: `UIUX_PRD_v0.1.md` câu 3c (2026-11-21) chọn bảng màu vàng–đen–trắng. Giao diện này đi theo bản mẫu Note mới hơn (2026-11-24) theo yêu cầu "phong cách Olaa Note và Olaa Habits". Toàn bộ màu nằm trong biến CSS ở `src/styles/app.css`, đổi sang bảng vàng chỉ cần sửa phần `:root`.

Màn hình (thanh điều hướng 6 mục theo PRD nút 7.1):

| Mục | Nội dung |
|---|---|
| **Học** (Hôm nay) | Vòng mục tiêu ngày, danh sách việc hôm nay kiểu Habits (tự đánh dấu), lịch tháng có thanh XP, thẻ Olaa Habits và Olaa Note |
| **Lộ trình** | Cấp độ A1–C2 / HSK1–6; mỗi cấp là giáo trình: chặng → bài → 4 bước (học, luyện, đọc–nghe, thử thách), chủ đề đời sống chèn đúng cấp, bài kiểm tra cấp; ước lượng số tuần theo mục tiêu ngày |
| Bài học | Quy tắc (lưu vào ghi chú), bảng, từ mới có loa, pinyin, Hán Việt; bài đọc chạm-để-tra-nghĩa; luyện tập trộn câu ôn; học tiếp chỗ đã dừng |
| **Chủ đề** | 15 chủ đề: từ, mẫu câu, ngữ pháp, phát âm, bài kỹ năng, câu hỏi nói, luyện tập |
| **Luyện tập** | Sửa lỗi sai, luyện nhanh, luyện phát âm (cặp âm, trọng âm, thanh điệu), bảng âm |
| **Thẻ từ** | Ôn SRS lật thẻ, tra 20.910 mục từ điển của khoá, thêm từ bất kỳ vào thẻ |
| **Hồ sơ** | Thống kê, biểu đồ 7 ngày, cài đặt, Olaa ID, tải dữ liệu, ghi chú học tập |

Tích hợp hệ sinh thái: bộ chuyển app (Language → Note → Habits) ở góc trên; Habits nhận event `language.daily_goal.completed` và `language.lesson.completed` như trước. Ghi chú học tập thuộc Language, nằm trên máy, chờ lệnh `takenote.note.create_from_source` (PENDING); trong lúc chờ, xuất Markdown để nhập vào Note.

## Phát triển

Cần Node 20+ và pnpm 9.

```bash
pnpm install
pnpm test         # test phần logic
pnpm lint
pnpm typecheck
pnpm dev          # http://localhost:5173
pnpm build        # dist/
```

Deploy: Firebase Hosting site `olaa-language` (project `olaa-ecosystem`), GitHub Actions deploy bản xem trước cho PR và bản chính khi merge `main` (`.github/workflows/deploy.yml`). Luật Firestore nằm ở `olaa-platform/infrastructure/firebase/`.

## Bảo mật

Xem `SECURITY.md`.
