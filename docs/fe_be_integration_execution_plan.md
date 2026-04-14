# FE-BE Integration Execution Plan

## 1. Mục tiêu

- Kết nối frontend Vue/Vite ở `China_Web_FE` với backend FastAPI ở `China_BE`.
- Thay mock data hiện tại bằng dữ liệu thật từ API public.
- Chia việc theo giai đoạn để triển khai dần, mỗi giai đoạn đều có tiêu chí hoàn thành rõ ràng.
- Giữ frontend chạy ổn định trong suốt quá trình chuyển đổi, không thay toàn bộ một lần.

## 2. Hiện trạng hiện tại

### 2.1 Backend

- Swagger đã chạy tại `http://127.0.0.1:8000/docs`
- Base API hiện tại là `/api/v1`
- Public endpoints đã có:
  - `GET /api/v1/health`
  - `GET /api/v1/public/bootstrap`
  - `GET /api/v1/public/banners`
  - `GET /api/v1/public/pages/{slug}`
  - `GET /api/v1/public/posts`
  - `GET /api/v1/public/posts/{slug}`
  - `GET /api/v1/public/projects`
  - `GET /api/v1/public/projects/{slug}`
  - `GET /api/v1/public/honors`
  - `GET /api/v1/public/branches`
  - `GET /api/v1/public/branches/{slug}`
  - `GET /api/v1/public/contacts`
  - `GET /api/v1/public/videos`

### 2.2 Frontend

- FE hiện chưa có lớp gọi API tập trung.
- FE vẫn dùng dữ liệu tĩnh ở nhiều chỗ:
  - `src/pages/news/newsData.js`
  - `src/pages/projects/projectCaseData.js`
  - `src/components/honors/honorsData.js`
- Router FE hiện đang dùng cả `id` và slug giả cũ, chưa đồng bộ với backend:
  - `src/router/index.js`
- `pinia` đã có trong `package.json`, nhưng hiện chưa thấy dùng làm state store chính cho dữ liệu từ API.

## 3. Nguyên tắc triển khai

- Không nối API trực tiếp rải rác trong từng component.
- Tạo một lớp `service` hoặc `api client` chung trước, rồi page/component chỉ gọi qua lớp đó.
- Không thay toàn bộ site trong một lần.
- Mỗi module chuyển từ mock sang API theo thứ tự ưu tiên: shell chung -> home -> news -> projects -> branch/contact/video/honors -> page tĩnh.
- Giữ lại mapper chuyển đổi dữ liệu từ response backend sang format FE đang cần, để không phải sửa sâu toàn bộ UI ngay từ đầu.

## 4. Cấu trúc FE nên bổ sung trước khi nối API

Tạo mới các file sau:

- `src/config/env.js`
  - Đọc `import.meta.env.VITE_API_BASE_URL`
  - Đọc `import.meta.env.VITE_LANGUAGE_CODE`

- `src/lib/http.js`
  - Viết wrapper `fetchJson(url, options)`
  - Xử lý timeout, parse JSON, error message cơ bản

- `src/services/publicApi.js`
  - Gom toàn bộ API public:
  - `getBootstrap`
  - `getBanners`
  - `getPageDetail`
  - `getPosts`
  - `getPostDetail`
  - `getProjects`
  - `getProjectDetail`
  - `getHonors`
  - `getBranches`
  - `getBranchDetail`
  - `getContacts`
  - `getVideos`

- `src/mappers/`
  - `bootstrapMapper.js`
  - `postMapper.js`
  - `projectMapper.js`
  - `branchMapper.js`
  - `honorMapper.js`
  - `pageMapper.js`

- `src/composables/useAsyncData.js`
  - Chuẩn hóa `loading`, `error`, `data`, `reload`

- `src/stores/bootstrap.js`
  - Dùng Pinia để giữ menu, site settings, hero banners chung

## 5. Biến môi trường FE cần thêm

Tạo file `.env` hoặc `.env.local` trong `China_Web_FE`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
VITE_LANGUAGE_CODE=en
```

Nếu FE chạy ở cổng khác vẫn ổn, vì backend đã có CORS local.

## 6. Mapping route FE sang API BE

### 6.1 Phần khung site

- Header/Footer/Menu
  - FE route: toàn site
  - API: `GET /public/bootstrap?language_code=en`
  - Mục tiêu:
  - đổ menu top/header/footer
  - đổ site settings
  - bỏ dữ liệu hardcode trong layout nếu có

### 6.2 Home

- FE route: `/`
- File chính:
  - `src/pages/Home.vue`
  - `src/pages/home/HeroBanner.vue`
  - `src/pages/home/HomeAbout.vue`
  - `src/pages/home/ProjectSection.vue`
  - `src/pages/home/NewsSection.vue`
  - `src/pages/home/PartnerSlider.vue`
- API:
  - `GET /public/bootstrap`
  - `GET /public/banners?banner_type=hero`
  - `GET /public/pages/home`
  - `GET /public/projects?limit=...`
  - `GET /public/posts?limit=...`
- Lưu ý:
  - `pages/home` sẽ cấp phần intro + sections + blocks
  - partner/logo strip nên map từ `blocks` hoặc `gallery`

### 6.3 About

- FE routes:
  - `/about/company-introduction`
  - `/about/chairman-speech`
  - `/about/organization-chart`
  - `/about/corporate-culture`
  - `/about/development-course`
  - `/about/leadership-care`
- File chính:
  - `src/pages/about/AboutPage.vue`
- API:
  - `GET /public/pages/{slug}`
- Gợi ý slug backend:
  - `company-introduction`
  - `chairman-speech`
  - `organization-chart`
  - `corporate-culture`
  - `development-course`
  - `leadership-care`

### 6.4 News

- FE routes:
  - `/news`
  - `/news/enterprise`
  - `/news/industry`
  - `/news/:id`
- File chính:
  - `src/pages/news/NewsList.vue`
  - `src/pages/news/NewsDetail.vue`
  - `src/pages/news/newsData.js`
- API:
  - `GET /public/posts`
  - `GET /public/posts/{slug}`
- Việc cần làm:
  - đổi route detail từ `:id` sang `:slug`
  - category filter dùng `category_slug`
  - thay `newsData.js` bằng API + mapper

### 6.5 Projects

- FE routes:
  - `/projects`
  - `/projects/:category`
  - `/project/:id`
- File chính:
  - `src/pages/projects/ProjectCasePage.vue`
  - `src/pages/projects/ProjectDetail.vue`
  - `src/pages/projects/projectCaseData.js`
- API:
  - `GET /public/projects`
  - `GET /public/projects/{slug}`
- Việc cần làm:
  - đổi route detail từ `:id` sang `:slug`
  - category route nên dùng slug thật của category
  - thay `projectCaseData.js` bằng API + mapper

### 6.6 Honors

- FE route: `/honors`
- File chính:
  - `src/pages/Honors.vue`
  - `src/components/honors/honorsData.js`
- API:
  - `GET /public/honors`
- Việc cần làm:
  - trước mắt map danh sách honors về đúng sections FE đang có
  - nếu dữ liệu backend chưa đủ nhóm section, xử lý grouping tại FE

### 6.7 Subsidiary / Branch / Contact / Video

- FE routes:
  - `/subsidiary`
  - `/subsidiary_Detail/:id.html`
  - `/branch`
  - `/contact`
  - `/video`
- API:
  - `GET /public/branches`
  - `GET /public/branches/{slug}`
  - `GET /public/contacts`
  - `GET /public/videos`
- Việc cần làm:
  - đổi detail branch từ `:id.html` sang `:slug`
  - branch list và branch detail dùng chung mapper
  - contact page lấy cả `contacts` và settings từ bootstrap nếu cần

## 7. Thứ tự triển khai đề xuất

### Giai đoạn 0: Chuẩn bị nền API cho FE

Việc làm:

- tạo `env.js`
- tạo `http.js`
- tạo `publicApi.js`
- tạo `useAsyncData.js`
- tạo `bootstrap` store
- thêm `VITE_API_BASE_URL`

Xong khi:

- FE gọi được `GET /health`
- FE gọi được `GET /public/bootstrap`
- có log/error rõ ràng khi API fail

### Giai đoạn 1: Nối shell chung của site

Việc làm:

- lấy menu/settings từ `bootstrap`
- thay dữ liệu header/footer hardcode bằng dữ liệu từ store
- nạp bootstrap một lần ở `App.vue` hoặc layout root

File ưu tiên:

- `src/App.vue`
- `src/components/layout/AppHeader.vue`
- `src/components/layout/AppFooter.vue`

Xong khi:

- toàn site dùng menu từ backend
- đổi ngôn ngữ hoặc reload không làm vỡ layout

### Giai đoạn 2: Nối trang Home

Việc làm:

- hero lấy từ `hero_banners`
- intro/home sections lấy từ `pages/home`
- project highlights lấy từ `projects`
- news highlights lấy từ `posts`

Xong khi:

- trang `/` không còn phụ thuộc mock data
- ảnh, title, subtitle, CTA đều lấy từ backend hoặc mapper

### Giai đoạn 3: Nối module News

Việc làm:

- thay `newsData.js`
- chuyển route detail sang slug
- map category filter qua `category_slug`
- gắn pagination từ `pagination.total`

File ưu tiên:

- `src/pages/news/NewsList.vue`
- `src/pages/news/NewsDetail.vue`
- `src/router/index.js`

Xong khi:

- list và detail đều lấy API thật
- refresh trang detail không bị lỗi

### Giai đoạn 4: Nối module Projects

Việc làm:

- thay `projectCaseData.js`
- chuyển detail sang slug
- map category thật từ backend
- xử lý blocks/gallery nếu cần cho detail

File ưu tiên:

- `src/pages/projects/ProjectCasePage.vue`
- `src/pages/projects/ProjectDetail.vue`
- `src/router/index.js`

Xong khi:

- list project, lọc category, detail project đều dùng API
- UI hiện tại vẫn giữ được bố cục lớn

### Giai đoạn 5: Nối Honors / Video / Contact / Branch / Subsidiary

Việc làm:

- honors lấy từ `/public/honors`
- videos lấy từ `/public/videos`
- contacts lấy từ `/public/contacts`
- branch/subsidiary list + detail lấy từ `/public/branches`

Xong khi:

- không còn `honorsData.js` làm nguồn dữ liệu chính
- branch detail chuyển sang slug

### Giai đoạn 6: Nối các page tĩnh About / Business

Việc làm:

- mỗi page đọc từ `/public/pages/{slug}`
- dùng `sections`, `blocks`, `gallery` để render
- chuẩn hóa slug page

Xong khi:

- nội dung page tĩnh có thể thay từ backend mà không cần sửa source FE

### Giai đoạn 7: Chuẩn hóa dữ liệu và tối ưu

Việc làm:

- cache bootstrap
- chuẩn hóa loading skeleton
- chuẩn hóa error state
- thêm empty state
- audit lại route slug
- bỏ các mock data file không còn dùng

Xong khi:

- FE không còn phụ thuộc dữ liệu cứng cho các module public chính

## 8. Ticket breakdown gợi ý để làm từng bước

### Ticket 1

- tạo `VITE_API_BASE_URL`
- tạo `src/config/env.js`
- tạo `src/lib/http.js`
- tạo `src/services/publicApi.js`

### Ticket 2

- tạo `src/stores/bootstrap.js`
- nối `App.vue`, `AppHeader.vue`, `AppFooter.vue` với `/public/bootstrap`

### Ticket 3

- nối Home với `/public/bootstrap`, `/public/banners`, `/public/pages/home`, `/public/projects`, `/public/posts`

### Ticket 4

- refactor router news sang slug
- nối `NewsList.vue`
- nối `NewsDetail.vue`

### Ticket 5

- refactor router projects sang slug
- nối `ProjectCasePage.vue`
- nối `ProjectDetail.vue`

### Ticket 6

- nối `Honors.vue`
- nối `Video.vue`
- nối `Contact.vue`

### Ticket 7

- nối `Subsidiary.vue`, `SubsidiaryDetail.vue`, `Branch.vue`

### Ticket 8

- nối `AboutPage.vue` và các page tĩnh theo slug backend

## 9. Tiêu chí hoàn thành toàn bộ phase public

- Header/Footer/Menu lấy từ backend
- Home dùng API thật
- News dùng API thật
- Projects dùng API thật
- Branch/Subsidiary/Contact/Video/Honors dùng API thật
- About page lấy từ `pages/{slug}`
- Router FE đổi từ `id` giả sang `slug` thật cho detail page
- Không còn file mock data là nguồn dữ liệu chính

## 10. Việc nên làm ngay bây giờ

Thứ tự ngắn nhất để bắt đầu:

1. Tạo lớp API chung cho FE
2. Nối `bootstrap` vào `AppHeader` và `AppFooter`
3. Nối Home
4. Nối News
5. Nối Projects

Đây là thứ tự tối ưu vì:

- `bootstrap` ảnh hưởng toàn site
- Home là trang quan trọng nhất để chứng minh FE-BE đã thông
- News và Projects hiện đang dùng mock data rõ nhất nên chuyển trước sẽ thấy hiệu quả ngay

## 11. Ghi chú kỹ thuật quan trọng

- Backend hiện dùng `slug` cho detail ở posts/projects/branches/pages.
- FE hiện còn dùng `:id` ở nhiều route, nên phải đổi dần sang `:slug`.
- Backend trả `image`, `hero_image`, `thumbnail`, `gallery`, `blocks`, `sections` theo module; FE cần mapper thay vì đọc raw response trực tiếp ở khắp nơi.
- Không cần thêm `axios` ngay; có thể dùng `fetch` native để giảm phụ thuộc.
- Khi chưa seed đủ dữ liệu backend, mapper nên cho phép fallback nhẹ để UI không trắng hoàn toàn.

