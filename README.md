# Olaa Language

Học tiếng Anh (A1–C2), tiếng Tây Ban Nha (A1–C2) và tiếng Trung (HSK1–6) cho người Việt. PRD: `olaa-platform/architecture/01-olaa-language/` và `architecture/PRD/OLAA_Ecosystem_PRD_v1.0.md`. Quyết định công nghệ: `docs/decisions/ADR-001-mvp-web-stack.md`.

## Trạng thái giao diện

**Giao diện (frontend) đã được gỡ khỏi repository ngày 2026-11-21** theo yêu cầu của chủ dự án, để import bộ giao diện mới sau. Repository hiện chỉ giữ phần logic và dữ liệu, có test. `index.html` có sẵn `<div id="root">`; `src/main.ts` chỉ khởi chạy các dịch vụ dữ liệu. Giao diện mới gắn vào `#root` và dùng các module bên dưới.

Yêu cầu giao diện: `olaa-platform/architecture/PRD/UIUX_PRD_v0.1.md` và `UI_BUTTONS_PRD_v0.1.md`.

## Phần logic còn lại

```
content/                     Dữ liệu bài học: cấp độ A1–C2 / HSK1–6, 15 chủ đề, Hán Việt (content/README.md)
src/
  features/
    curriculum/              Khoá học cũ (en-from-vi, vi-from-en): bài, lộ trình, mở khoá
    levels/                  Nạp, chuẩn hoá, mở khoá cấp độ và bài; tạo bài kiểm tra cấp độ
    topics/                  15 chủ đề và bài luyện
    exercises/               Tạo bài tập, chấm điểm, giải thích lỗi, ôn lồng vào bài
    lesson-player/           Phiên học (thứ tự câu, làm lại câu sai), lưu bài dở
    flashcards-srs/          Lặp lại ngắt quãng (Leitner)
    learning-progress/       Chuỗi ngày học
    data-export/             Xuất dữ liệu người dùng (JSON)
  stores/                    Trạng thái app (hàm thuần) và store
  services/                  Firebase Auth/Firestore, đồng bộ, sự kiện gửi Olaa Habits
  i18n/                      Song ngữ Việt/Anh: tr(vi, en)
  utils/                     Chữ, ngày, số ngẫu nhiên, giọng đọc, âm thanh
scripts/import-topics.mjs    Chuyển file 15 chủ đề sang content/topics/topics.json
```

## Phát triển

Cần Node 20+ và pnpm 9.

```bash
pnpm install
pnpm test         # test phần logic
pnpm lint
pnpm typecheck
pnpm build        # dist/ (chưa có giao diện)
```

Deploy: Firebase Hosting site `olaa-language` (project `olaa-ecosystem`), GitHub Actions deploy bản xem trước cho PR và bản chính khi merge `main` (`.github/workflows/deploy.yml`). Luật Firestore nằm ở `olaa-platform/infrastructure/firebase/`.

## Bảo mật

Xem `SECURITY.md`.
