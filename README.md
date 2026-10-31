# HMT Flash Study - Nền tảng Học Tiếng Anh Thông Minh

Ứng dụng học tiếng Anh toàn diện phát triển từ **HMT Center**, xây dựng trên nền tảng **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS** và **Supabase**.

---

## 🚀 Các Tính Năng Đã Triển Khai (100% Khớp Gốc)

### 1. 🌿 Hệ Thống Gamification "Cây Tri Thức"
- **6 Giai đoạn phát triển cây**:
  1. `01 Hạt giống` (Seed)
  2. `02 Nảy mầm` (Sprout)
  3. `03 Phát triển thân` (Trunk)
  4. `04 Phân cành` (Branching)
  5. `05 Ra lá` (Foliage)
  6. `06 Kết trái` (Fruiting)
- **Thanh tiến độ XP**: Tích luỹ XP qua từng bài học để nuôi cây lớn dần.
- **Thanh trượt mô phỏng (Interactive Simulator)**: Cho phép kéo thanh trượt để xem trước hình ảnh cây ở tất cả 6 giai đoạn mà không ảnh hưởng đến số XP thực tế.

### 2. 📚 Kho Học Liệu Chuẩn Quốc Tế
- **101 Bài học Ngữ pháp CEFR (A1 – C2)**: Đầy đủ tóm tắt quy tắc, công thức (`S + V + O`), câu ví dụ chuẩn, phân tích lỗi sai thường gặp và các use cases thực tế.
- **9.922 Từ vựng Tuyển chọn**:
  - **6 Bộ CEFR Oxford**: A1 (890 từ), A2 (792 từ), B1 (688 từ), B2 (530 từ), C1 (1.300 từ), C2 (722 từ).
  - **25 Chủ đề IELTS chuyên sâu**: Education, Environment, Technology, Health, Work, Crime, Media, Economy,... (mỗi chủ đề 200 từ vựng).

### 3. 🎯 Bộ Động Cơ Làm Bài & Tra Từ Độc Quyền (Quiz Engine)
- **Trắc nghiệm 4 đáp án (A, B, C, D)**: Tích hợp phím tắt bàn phím `1`, `2`, `3`, `4` hoặc `A`, `B`, `C`, `D` để chọn nhanh tức thì.
- **Điền từ vào chỗ trống (Fill in the blank)**: Chỗ trống `___`, nhãn gợi ý loại từ (Cue) và gợi ý nghĩa (Hints/HintVi).
- **Tap-to-Lookup (Tra từ nhanh)**: Nhấp/chạm vào **bất kỳ từ tiếng Anh nào** trong câu hỏi hoặc đề bài để bật popup tra cứu từ điển tức thì (loại từ, IPA, nghĩa tiếng Việt, câu ví dụ, phát âm và nút lưu sổ tay).
- **Đồng hồ đếm ngược (Countdown Timer)**: Tự động tính thời gian theo từng câu hỏi.
- **Đánh giá sao & Hiệu ứng thưởng**: 1 - 3 sao (đạt tối thiểu 80% để mở khóa bài tiếp theo), hiệu ứng pháo hoa Confetti khi vượt qua bài thi.

### 4. 🗂️ Flashcard 3D & Sổ Tay Ôn Tập (Review Hub)
- **Thẻ từ 3D**: Lật mặt thẻ 360 độ mượt mà.
- **Tùy chỉnh linh hoạt**: Đổi chiều học (Anh → Việt hoặc Việt → Anh), tự động phát âm giọng bản ngữ (Web Speech API).
- **Sổ tay từ vựng**: Đánh dấu từ khó để gom vào trang Ôn tập riêng.

### 5. 🛠️ Tiện Ích Tiếp Cận Toàn Cầu (Topbar Tools)
- **Đổi cỡ chữ**: 3 nấc **S (Nhỏ) / M (Vừa) / L (Lớn)**.
- **Đổi giao diện**: **Sáng (Light) / Tối (Dark) / Theo hệ thống (System)**.
- **Song ngữ 1 chạm**: **Tiếng Việt (VI) ↔ Tiếng Anh (EN)**.
- **Hệ thống lưu trữ Hybrid**: Khách học thử lưu tại `localStorage`, người dùng đăng nhập tự động đồng bộ dữ liệu 2 chiều với Supabase.

---

## 🛠️ Hướng Dẫn Khởi Chạy

### 1. Chạy Máy Chủ Phát Triển (Development)
```bash
npm run dev
```
Truy cập [http://localhost:3000](http://localhost:3000) trên trình duyệt để trải nghiệm ngay.

### 2. Cấu Hình Supabase (Tùy chọn)
Dự án được thiết kế chế độ **Local-first** (hoạt động 100% mượt mà ngay cả khi chưa kết nối Supabase):
1. Đăng ký/đăng nhập vào [supabase.com](https://supabase.com).
2. Tạo một Project mới.
3. Mở **SQL Editor** trong Supabase Dashboard, sao chép nội dung tệp `supabase/schema.sql` và nhấn **Run** để khởi tạo bảng và trigger tự động.
4. Mở tệp `.env.local` và điền thông tin:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
5. Khởi động lại `npm run dev` để kích hoạt tính năng đồng bộ đám mây và đăng ký tài khoản.

---

## 📂 Cấu Trúc Dự Án

```
├── app/
│   ├── globals.css         # System colors, dark theme tokens, font size scale & 3D flip card
│   ├── layout.tsx          # Root layout với LearningProvider
│   └── page.tsx            # Single Page Application router (home, path, review, history)
├── components/
│   ├── auth/               # Modal đăng nhập / đăng ký Supabase
│   ├── flashcard/          # Trình lật thẻ từ vựng 3D
│   ├── history/            # Lịch sử các lượt kiểm tra & thống kê
│   ├── home/               # Hero banner & 3 khối tuyển chọn lộ trình
│   ├── layout/             # Header (Topbar tools), Footer
│   ├── quiz/               # Động cơ làm bài trắc nghiệm & Tap-to-lookup dictionary
│   ├── review/             # Sổ tay từ vựng ôn tập
│   ├── roadmap/            # Bản đồ lộ trình CEFR A1-C2 & Drawer chi tiết
│   └── tree/               # Gamification Cây tri thức với 6 giai đoạn SVG
├── data/
│   ├── grammar_101.json    # 101 bài học ngữ pháp kèm bài tập trắc nghiệm/điền từ
│   └── vocab_31_decks.json # 9.922 từ vựng chuẩn Oxford & 25 chủ đề IELTS
├── lib/
│   ├── curriculum.ts       # Tra cứu học liệu, từ điển tap-to-lookup
│   ├── store.tsx           # State management & LocalStorage ↔ Cloud sync adapter
│   ├── supabase.ts         # Khởi tạo Supabase client
│   └── types.ts            # Định nghĩa kiểu dữ liệu TypeScript
└── supabase/
    └── schema.sql          # Toàn bộ SQL script khởi tạo cơ sở dữ liệu
```
