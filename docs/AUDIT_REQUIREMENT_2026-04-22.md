# Audit Đối Chiếu Yêu Cầu Website (2026-04-22)

## 1) Phạm vi đã đối chiếu
- Nguồn yêu cầu:
  - `docs/REQUIREMENT WEBSITE.docx` (bảng yêu cầu nhóm dữ liệu)
  - `docs/From_Web.xlsx` (nội dung chi tiết + link ảnh/video Drive)
- Nguồn triển khai:
  - Frontend: `China_Web_FE/src`
  - Backend: `China_BE/app`

## 2) Kết quả tổng quan
- Đã có nền tảng CMS + API + public page cho hầu hết nhóm chức năng chính.
- Chưa đạt 100% theo yêu cầu vận hành thực tế do còn nhiều phần fallback/hardcode và chưa có pipeline import dữ liệu từ Excel/Drive vào hệ thống.

## 3) Đối chiếu theo nhóm yêu cầu

### 3.1 Company
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Tên công ty / Logo / Slogan | Đã có | Lấy từ `site_settings`, render ở header/footer |
| Giới thiệu / Lịch sử / Tầm nhìn / Sứ mệnh / Giá trị cốt lõi / Ban lãnh đạo / Sơ đồ tổ chức | Đã có | About page lấy từ `pages/about` + `content_blocks` + `content_block_items` |
| Home section "Về chúng tôi" | Chưa chuẩn | Đang hardcode text + ảnh, chưa bind theo CMS |

### 3.2 Năng lực
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Chứng nhận | Đã có | Đã có honors API + UI |
| Hình ảnh nhà máy | Một phần | Đang dùng dữ liệu honors/fallback |
| Địa chỉ nhà máy | Một phần | Lấy từ contact chính |
| Công nghệ sản xuất | Chưa chuẩn | Đang fallback cứng |
| Công suất | Chưa chuẩn | Metrics đang hardcode |

### 3.3 Danh mục sản phẩm
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Tên danh mục / Mô tả / Ảnh danh mục | Đã có | Có model + API + admin + hiển thị list |

### 3.4 Sản phẩm
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Tên / SKU / Danh mục / Ảnh / Video / Mô tả ngắn-dài / Kích thước / Chất liệu / Màu sắc / Ứng dụng / Catalog PDF | Đã có | End-to-end FE/BE đã triển khai |
| Inquiry button | Một phần | Có submit inquiry nhưng field chưa khớp hoàn toàn theo spec Excel |

### 3.5 Dự án
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Tên dự án / Ảnh dự án / Địa điểm / Mô tả / Sản phẩm dùng | Đã có nền tảng | Có project case + project detail + mapping product |
| Dữ liệu thực tế theo file | Chưa đủ | File Excel hiện để `N/A` cho nhiều trường dự án |

### 3.6 Tin tức
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Tiêu đề / Nội dung / Ảnh / Ngày đăng | Đã có | News list/detail + admin news |

### 3.7 Liên hệ
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Địa chỉ / Email / SĐT / Bản đồ / Form liên hệ | Đã có | Có contact page + submit inquiry |
| Chuẩn "Google Map" theo yêu cầu | Một phần | Hiện dùng OSM embed; cần xác nhận bắt buộc Google Maps hay không |

## 4) Khoảng trống chính cần xử lý
1. Chưa có import pipeline từ `From_Web.xlsx` + link Drive vào DB/media.
2. Còn fallback/hardcode ở Home/About/Honors, chưa nhất quán data-driven.
3. Mismatch spec form inquiry:
   - Spec: phone bắt buộc, email không bắt buộc, thêm địa điểm/diện tích/thời gian thi công.
   - Hiện tại: email bắt buộc, thiếu các trường mở rộng.
4. Có link `/video` ở hero nhưng router chưa có route public `/video`.
5. Header đang ép dùng menu hardcode thay vì menu động từ DB.
6. Có nhiều chuỗi tiếng Việt bị mojibake trong source, cần chuẩn hóa encoding.

## 5) Kết quả kiểm tra kỹ thuật
- Frontend build: PASS (`npm run build`).
- Backend test: PASS (`tests/test_public_project_case_contract.py`, 3 passed).

## 6) Định hướng triển khai (đề xuất theo pha)

### Phase 1: Chốt dữ liệu và chuẩn hóa hiển thị
- Viết script import từ Excel vào DB (site settings, categories, products, contacts, news).
- Đồng bộ asset Drive sang Cloudinary/media assets.
- Chuẩn hóa text encoding UTF-8 toàn bộ FE.

### Phase 2: Bỏ hardcode, chuyển sang CMS 100%
- HomeAbout lấy content từ API (không hardcode text/ảnh).
- Honors lấy công suất/công nghệ/địa chỉ từ CMS entity riêng hoặc quy ước rõ trong honors/contacts.
- Header/footer dùng menu động từ DB, chỉ fallback khi BE lỗi thật.

### Phase 3: Hoàn thiện nghiệp vụ inquiry và route
- Mở rộng schema inquiry theo spec Excel.
- Cập nhật form Product + Contact theo field mới và validation đúng.
- Quyết định và hoàn thiện trang `/video` hoặc bỏ link dead.

### Phase 4: QA/UAT trước bàn giao
- Viết checklist UAT theo từng nhóm yêu cầu trong docx.
- Chạy smoke test FE + regression test BE với dữ liệu import thật.
- Chốt tiêu chí done với sếp theo checklist.

