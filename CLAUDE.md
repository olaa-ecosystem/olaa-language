# CLAUDE.md — olaa-language

Hướng dẫn cho Claude Code khi làm việc trong repository này.

## Repository này là gì

Olaa Language: học tiếng Anh, Tây Ban Nha (A1–C2) và tiếng Trung (HSK1–6) cho người Việt — nhánh 01 trong kiến trúc 22 nhánh của Olaa. Kiến trúc, PRD, contract và hạ tầng dùng chung nằm ở repository `olaa-ecosystem/olaa-platform` (ADR-0001). Stack: React 18, Vite 5, TypeScript strict, pnpm 9, Vitest (ADR-0003).

Giao diện gỡ ngày 2026-11-21 đã được làm lại ngày 2026-11-24 theo phong cách Olaa Note / Habits (xem mục Giao diện trong `README.md`). Logic thuần nằm trong `src/features`, `src/stores`; màn hình trong `src/pages`.

## Đọc trước khi làm

1. `README.md` của repository này.
2. Trong `olaa-platform`: `architecture/01-olaa-language/README.md`, `architecture/01-olaa-language/requirements/PRD.md`, `architecture/PRD/OLAA_Ecosystem_PRD_v1.0.md`.
3. Khi làm giao diện: `architecture/PRD/UIUX_PRD_v0.1.md`, `architecture/PRD/UI_BUTTONS_PRD_v0.1.md`, và `packages/design-system/` (biểu tượng, biểu tượng app). Ba tài liệu này đang ở branch `claude/awesome-knuth-s6a8fz` của `olaa-platform` cho tới khi được merge.
4. `architecture/IMPLEMENTATION_STATUS.md` — trạng thái thật, không giả định việc cũ đã xong.

## Quy tắc

- **Ranh giới dữ liệu.** App chỉ đọc/ghi Firestore `language/{uid}` của chính người dùng và tạo event trong `events/`; không đọc dữ liệu của Habits hay TakeNote. Nội dung bài học nằm ở `content/`.
- **Giao tiếp giữa app** chỉ qua contract trong `olaa-platform/contracts/`. Language phát `language.daily_goal.completed` và `language.lesson.completed` theo `contracts/events/language-events.md`. Đổi shape event hoặc dữ liệu đồng bộ là thay đổi contract: cập nhật `olaa-platform` trước (contract, `INTEGRATION_CHANGELOG.md`), rồi mới sửa ở đây.
- **Logic thuần, có test.** Trạng thái đổi qua hàm thuần trong `src/stores/`; mỗi hàm mới có test Vitest cạnh file.
- **Đổi shape dữ liệu đã lưu** phải tăng phiên bản và có hàm chuyển đổi dữ liệu cũ kèm test. Không làm mất dữ liệu người dùng khi chưa được chủ dự án đồng ý.
- **Song ngữ.** Mọi chữ hiển thị đi qua `tr(vi, en)` trong `src/i18n/`.
- **Không tạo đồ giả.** Không thêm file, thư mục hay module rỗng chỉ để đánh dấu tiến độ.
- **Trạng thái trung thực.** Chỉ báo "đã kiểm tra" khi đã thật sự chạy lệnh.
- **Bảo mật.** Không commit khoá, token, file `.env`; cấu hình Firebase web chỉ nằm trong `.env.*` theo `.env.example`. Khoá service account chỉ nằm trong GitHub secret.

## Lệnh

```bash
pnpm install
pnpm test        # Vitest
pnpm typecheck
pnpm lint
pnpm build
pnpm run audit   # lỗ hổng mức high trở lên trong dependency
```

Chạy đủ test, typecheck, lint, build trước khi commit. CI (`.github/workflows/ci.yml`) chạy cùng các lệnh này.

## Git

- Kiểm tra `git status` và branch hiện tại trước khi sửa.
- Làm trên branch `<loại>/<slug>` (`feat`, `fix`, `docs`, `chore`, `refactor`), không commit thẳng vào `main`. Commit theo Conventional Commits.
- Không force push, không xoá lịch sử, không đổi remote.
- Chỉ push hoặc mở PR khi chủ dự án yêu cầu.

## Không được làm khi chưa có xác nhận

Xoá chức năng hoặc dữ liệu, đổi schema theo cách phá tương thích, đổi event hay API đang dùng, thay công nghệ hiện có, nâng phiên bản lớn của dependency.
