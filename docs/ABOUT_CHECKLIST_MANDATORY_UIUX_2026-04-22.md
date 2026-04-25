# Checklist About Page - Bat buoc vs Nang cao UI/UX (2026-04-22)

## 1) Pham vi checklist
- Trang About public (`/about/*`) va CMS quan ly About.
- Nguon doi chieu:
- `docs/REQUIREMENT WEBSITE.docx` (nhom Company).
- `docs/From_Web.xlsx` (noi dung goc).
- Code FE/BE hien tai + API `/api/v1/public/pages/about`.

## 2) Muc Bat buoc (Blocking de dong task)

### A. Dung luong chuc nang / route / section
- [x] Co du section du lieu About tren API: `hero`, `company_introduction`, `chairman_speech`, `organization_chart`, `corporate_culture`, `development_course`, `leadership_care`, `cooperative_partner`.
- [ ] FE render du section doi tac `cooperative_partner` thanh section `page8` (hien tai chua render trong template).
- [ ] FE nav dong bo du 8 section (dot nav + tab nav + deep-link).
- [ ] Route `/about/cooperative-partner` scroll dung den section doi tac (hien tai route co, nhung normalizer chua map `page8`).

### B. Data contract bat buoc cua About CMS
- [x] Co du block key can thiet: `hero_summary`, `hero_nav`, `intro_media`, `intro_video`, `intro_paragraphs`, `speech_profile`, `speech_body`, `speech_signature`, `org_chart_image`, `culture_values`, `timeline`, `leadership_care_gallery`, `partner_categories`, `partner_logos`.
- [x] Co du item key toi thieu cho block chinh: `headline`, `description`, `cover_image`, `vision`, `mission`, `main_chart`, `milestone_*`, `leader_*`.
- [x] Rule admin cho `timeline` va `leadership_care_gallery` da co validate co ban.
- [ ] Chot nghiep vu `speech_signature`: neu de trong thi an hẳn khối chu ky tren FE (tranh UI rong), hoac nhap day du lieu.

### C. Noi dung bat buoc theo REQUIREMENT (nhom Company)
- [x] Dat 10/10 truong Company (Ten cong ty, Logo, Slogan, Gioi thieu, Lich su, Tam nhin, Su menh, Gia tri cot loi, Ban lanh dao, So do to chuc).
- [ ] UAT xac nhan noi dung hien thi khop ban nghiem thu (copy final) thay vi chi "co du truong".

### D. QA bat buoc truoc khi dong task
- [ ] Test desktop/mobile cho toan bo section About (bao gom section doi tac sau khi bo sung).
- [ ] Test deep-link tat ca route About:
- `/about/company-introduction#page1..#page2`
- `/about/chairman-speech#page3`
- `/about/organization-chart#page4`
- `/about/corporate-culture#page5`
- `/about/development-course#page6`
- `/about/leadership-care#page7`
- `/about/cooperative-partner#page8`
- [ ] Test fallback khi item anh/video rong (khong vo layout, khong crash).

## 3) Muc Nang cao UI/UX (khong block release)

### E. Trai nghiem dieu huong
- [ ] Them label/tooltip cho dot nav ben phai de nguoi dung biet section hien tai.
- [ ] Tinh chinh offset scroll de heading section khong bi "nhay" khi doi route hash.
- [ ] Thong nhat active state giua hero tab va dots khi nguoi dung scroll nhanh.

### F. Trinh bay noi dung
- [ ] Neu `speech_signature` rong: an toan bo `speech-signoff` thay vi hien khung trong.
- [ ] Section culture: gioi han do dai text + "xem them" neu qua dai.
- [ ] Timeline: bo sung empty-state dep cho moc khong co image.
- [ ] Leadership card: bo sung alt text theo ten/chuc vu thay vi alt co dinh.

### G. Modal/Media
- [ ] Video modal: bo sung `poster` + loading state.
- [ ] Org chart modal: ho tro zoom/pan co ban cho man hinh nho.
- [ ] Kiem tra URL video chuan stream/download (tranh link drive xem trang khong play truc tiep).

### H. Accessibility & Performance
- [ ] Bo sung keyboard nav cho timeline/leadership slider.
- [ ] Bo sung aria-label ro nghia cho tab/button section.
- [ ] Toi uu lazy-load hinh khung duoi (timeline/partner logos).
- [ ] Thiet lap metric ngan: LCP/CLS cho About tren mobile.

## 4) Thu tu de dong task nhanh (khuyen nghi)
1. Hoan thanh nhom A (render + route page8 doi tac).
2. Chay nhom D (QA bat buoc), dong ticket chuc nang.
3. Lam nhom E/F/G/H theo uu tien UI/UX.

## 5) Diem can sua ngay trong code (tham chieu nhanh)
- Thieu map section doi tac trong normalizer:
- `E:\uiChina_Web\China_Web_FE\src\views\user\about\adapters\aboutPageNormalizer.js` (SECTION_CONFIG hien den `page7`).
- Route da co nhung UI chua theo:
- `E:\uiChina_Web\China_Web_FE\src\app\router\client.routes.js` (da co `cooperative-partner`).
- Template About chua co section `page8`:
- `E:\uiChina_Web\China_Web_FE\src\views\user\about\AboutPage.vue`.
