![1776136366167](image/backend_implementation_plan/1776136366167.png)![1776136380264](image/backend_implementation_plan/1776136380264.png)# China Web Implementation Plan

## 1. Đánh giá hiện trạng

File `db_web_trung.xlsx` đang mô tả schema CMS cho website corporate đa ngôn ngữ. Bộ schema gốc đủ tốt cho:

- trang tĩnh
- banner
- menu
- news
- projects
- honors
- contact
- video
- media
- site settings
- translations

Nhưng để bám sát logic site mẫu `sinodecor`, vẫn cần bổ sung:

- `content_blocks`, `content_block_items`: quản trị section lặp, timeline, card, logo, leadership list
- `entity_media`: gallery nhiều ảnh cho `page`, `project`, `branch`, `post`
- `inquiry_submissions`: form contact/inquiry
- mở rộng `branches`: phục vụ detail page như subsidiary detail
- SEO fields cho `posts`, `projects`, `branches`

## 2. Kiến trúc triển khai đề xuất

### 2.1 Tổng thể

- FE: Vue/Vite hiện tại
- BE: FastAPI
- ORM: SQLAlchemy 2.0
- Validation: Pydantic
- DB local/dev: SQLite
- DB production: có thể đổi sang MySQL/PostgreSQL qua `DATABASE_URL`
- pgAdmin/PostgreSQL không bắt buộc cho môi trường local hiện tại vì repo đã có sẵn `backend/china_web.db`
- nếu chuyển sang PostgreSQL thì phải dùng đúng mật khẩu thật của user DB, không có mật khẩu mặc định từ repo

### 2.2 Phân lớp backend

- `app/core`: config, security
- `app/db`: engine, session, init db
- `app/models`: schema DB
- `app/schemas`: validate request/response
- `app/services`: query logic và generic CRUD
- `app/api/routes/public.py`: route public cho FE
- `app/api/routes/admin.py`: route quản trị

### 2.3 Mức an toàn

- admin route tách riêng `/api/v1/admin/*`
- yêu cầu `X-Admin-Token`
- public route chỉ đọc dữ liệu published/active
- CORS và Trusted Host cấu hình bằng env
- hạn chế pagination `limit <= 100`

## 3. Thứ tự triển khai đúng logic

### Giai đoạn 1: nền tảng dữ liệu

1. Tạo DB và seed `languages`, `site_settings`
2. Nhập `media_assets`
3. Nhập `menus`, `menu_items`
4. Nhập `pages`, `page_sections`
5. Nhập `content_blocks`, `content_block_items`

### Giai đoạn 2: module public chính

1. `banners`
2. `posts`, `post_categories`
3. `projects`, `project_categories`
4. `honors`
5. `branches`, `contacts`
6. `videos`

### Giai đoạn 3: ghép FE với BE

1. Header/Footer dùng `/public/bootstrap`
2. Home dùng `/public/bootstrap`, `/public/banners`, `/public/projects`, `/public/posts`
3. About/Business page dùng `/public/pages/{slug}`
4. Projects dùng `/public/projects` và `/public/projects/{slug}`
5. News dùng `/public/posts` và `/public/posts/{slug}`
6. Subsidiary dùng `/public/branches` và `/public/branches/{slug}`
7. Contact dùng `/public/contacts`

### Giai đoạn 4: quản trị nội dung

1. Tạo admin screen cho từng entity
2. Upload media trước, liên kết ID sau
3. Có preview dữ liệu public theo slug
4. Chốt quy ước slug, sort_order, status

## 4. Mapping dữ liệu theo site mẫu

### Home

- hero: `banners`
- giới thiệu nhanh: `pages(home)` + `content_blocks`
- business cards: `content_blocks`
- project highlight: `projects`
- news highlight: `posts`
- partner/logo strip: `content_block_items` hoặc `entity_media`

### About

- phần intro: `pages`
- chairman speech / culture / organization / development course: dùng `page_sections` cho section đơn, `content_blocks` cho timeline/list

### Business Areas

- overview page: `pages`
- từng lĩnh vực: có thể là `pages` con hoặc block theo `page_type=business-area`

### Projects

- list: `projects`
- detail: `projects` + `entity_media` + `content_blocks`

### Honors

- list: `honors`
- nếu cần nhóm theo năm/loại: dùng FE grouping hoặc thêm block page tĩnh

### Subsidiary

- list: `branches`
- detail: `branches` + `contacts` + `entity_media` + `content_blocks`

## 5. Quy ước nhập dữ liệu CMS

- `slug`: duy nhất, lowercase, không dấu, dùng `-`
- `status`: `published/draft/archived` cho content; `active/inactive` cho taxonomy/config
- `sort_order`: số nguyên tăng dần, không để trống
- `language_id`: luôn bắt buộc với content public
- `body`: chỉ dùng cho phần thân chính
- `content_blocks`: dùng cho vùng lặp và layout phức tạp, tránh nhồi mọi thứ vào `body`

## 6. Việc nên làm tiếp ngay sau backend

1. Chuyển mock data trong FE sang gọi API
2. Tạo file seed nội dung thật cho `home`, `about`, `projects`, `news`
3. Chốt `slug map` giữa route FE và `pages.slug`
4. Tạo upload service cho `media_assets`
5. Sau khi ổn định mới bổ sung auth user đầy đủ cho CMS
