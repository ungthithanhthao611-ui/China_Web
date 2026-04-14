# Frontend Structure Refactor Guide (Admin / Client Split)

## 1) Mục tiêu

Tách rõ:

- `admin`: màn quản trị, API quản trị, logic quản trị.
- `client`: website public cho người dùng cuối.
- `shared`: phần dùng chung cho cả admin + client.
- `app`: entrypoint và router tổng.

Lợi ích:

- Dễ tìm file hơn.
- Ít lẫn lộn logic admin với client.
- Scale tính năng mới nhanh hơn.

---

## 2) Cấu trúc thư mục mẫu đề xuất

```txt
src/
  app/
    App.vue
    main.js
    router/
      index.js
      admin.routes.js
      client.routes.js

  admin/
    pages/
      AdminDashboard.vue
      navigation/
        NavigationMenusManager.vue
    components/
      layout/
      common/
    services/
      adminApi.js
    composables/
    stores/

  client/
    pages/
      Home.vue
      Contact.vue
      Branch.vue
      Honors.vue
      Privacy.vue
      Security.vue
      SocialResponsibility.vue
      Subsidiary.vue
      SubsidiaryDetail.vue
      Video.vue
      about/
      business/
      jobs/
      news/
      projects/
    components/
      layout/
        AppHeader.vue
        AppFooter.vue
        AppTopbar.vue
      about/
      honors/
    services/
      publicApi.js
    composables/
    stores/
      bootstrap.js

  shared/
    lib/
      http.js
    config/
      env.js
    utils/
      navigation.js
      uiState.js
    components/
      common/
        Breadcrumb.vue
        CountUp.vue
        PageBanner.vue
    assets/

  styles/
    main.scss
```

---

## 3) Mapping từ cấu trúc hiện tại sang cấu trúc mới

### A. Admin

- `src/pages/admin/AdminDashboard.vue` -> `src/admin/pages/AdminDashboard.vue`
- `src/pages/admin/components/NavigationMenusManager.vue` -> `src/admin/pages/navigation/NavigationMenusManager.vue`
- `src/services/adminApi.js` -> `src/admin/services/adminApi.js`

### B. Client

- `src/pages/*` (trừ `pages/admin`) -> `src/client/pages/*`
- `src/components/layout/*` -> `src/client/components/layout/*`
- `src/components/about/*` -> `src/client/components/about/*`
- `src/components/honors/*` -> `src/client/components/honors/*`
- `src/services/publicApi.js` -> `src/client/services/publicApi.js`
- `src/stores/bootstrap.js` -> `src/client/stores/bootstrap.js`

### C. Shared

- `src/lib/http.js` -> `src/shared/lib/http.js`
- `src/config/env.js` -> `src/shared/config/env.js`
- `src/utils/navigation.js` -> `src/shared/utils/navigation.js`
- `src/utils/uiState.js` -> `src/shared/utils/uiState.js`
- `src/components/common/*` -> `src/shared/components/common/*`
- `src/assets/*` -> `src/shared/assets/*` (nếu cả admin + client đều dùng)

### D. App

- `src/main.js` -> `src/app/main.js`
- `src/App.vue` -> `src/app/App.vue`
- `src/router/index.js` -> `src/app/router/index.js`

---

## 4) Lộ trình migrate an toàn (không vỡ app)

## Giai đoạn 1: Tách router thành 2 file

1. Tạo:
   - `src/app/router/admin.routes.js`
   - `src/app/router/client.routes.js`
2. `index.js` import và merge 2 mảng route.
3. Build test.

## Giai đoạn 2: Move Admin trước

1. Move `pages/admin` + `services/adminApi.js`.
2. Sửa import admin theo path mới.
3. Build test.

## Giai đoạn 3: Move Client

1. Move `pages` public + `components/layout` + `publicApi`.
2. Sửa import trong `App.vue`, `router`, các page.
3. Build test.

## Giai đoạn 4: Move Shared + Cleanup

1. Move `lib/config/utils/common`.
2. Sửa alias import.
3. Xóa thư mục cũ không dùng.
4. Build test + run dev test.

---

## 5) Đề xuất alias để code dễ đọc

Trong `vite.config.js`, ngoài `@`, thêm:

- `@app` -> `src/app`
- `@admin` -> `src/admin`
- `@client` -> `src/client`
- `@shared` -> `src/shared`

Ví dụ import sau khi tách:

```js
import { fetchJson } from '@shared/lib/http'
import { listNavigationMenus } from '@admin/services/adminApi'
import AppHeader from '@client/components/layout/AppHeader.vue'
```

---

## 6) Quy ước đặt tên khuyến nghị

- Page: `SomethingPage.vue` (ví dụ `ProjectCasePage.vue`).
- Manager/feature component: theo domain (ví dụ `NavigationMenusManager.vue`).
- API file: theo domain (`adminApi.js`, `publicApi.js`).
- Route file: `admin.routes.js`, `client.routes.js`.

---

## 7) Kết luận

Refactor nên làm theo từng giai đoạn nhỏ, mỗi giai đoạn đều chạy:

- `npm run build`
- `npm run dev` kiểm tra nhanh `/` và `/admin`

Đừng move toàn bộ một lần để tránh lỗi import khó debug.
