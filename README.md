# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## Backend connection

Copy `.env.example` to `.env` and point `VITE_API_BASE_URL` to the FastAPI backend.

Default local value:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
VITE_LANGUAGE_CODE=en
VITE_HTTP_TIMEOUT_MS=15000
```

## Project Case smoke verification

The Project Case public contract is fixed to:

- `currentCategory`
- `categories`
- `heroSlides`
- `cases`

Notes:

- `detailHref` is the canonical route used by the current frontend.
- `legacyDetailHref` is currently nullable because there is no verified numeric legacy detail route in the app yet.
- `categories[].projects` stays available as a compatibility payload, but the current Project Case page now prefers category-scoped fetch/cache instead of depending on nested compatibility data for category switching.

Local verification flow:

1. Ensure the backend database configured in `China_BE/.env` is reachable.
2. Seed the broader Project Case sample dataset if you want to inspect it outside Playwright:

```powershell
cd e:\uiChina_Web\China_BE
python scripts\seed_project_case_catalog.py
```

To import the full legacy Project Case catalog directly from `src/client/pages/projects/projectCaseData.js`:

```powershell
cd e:\uiChina_Web\China_BE
python scripts\import_project_case_legacy_catalog.py
```

Optional: import only selected category slugs:

```powershell
cd e:\uiChina_Web\China_BE
python scripts\import_project_case_legacy_catalog.py star-hotel terminal-space cobo-pavilion
```

3. Install the Playwright browser once:

```powershell
cd e:\uiChina_Web\China_Web_FE
npx playwright install chromium
```

4. Optional: override admin login credentials for smoke tests when `China_BE/.env` does not use the default bootstrap admin account:

```powershell
$env:PLAYWRIGHT_ADMIN_USERNAME='admin'
$env:PLAYWRIGHT_ADMIN_PASSWORD='admin123456'
```

5. Run backend regression tests:

```powershell
cd e:\uiChina_Web\China_BE
python -m pytest -q tests\test_public_project_case_e2e.py tests\test_public_project_case_contract.py tests\test_admin_entity_integrity_conflicts.py
```

6. Run the frontend smoke suite:

```powershell
cd e:\uiChina_Web\China_Web_FE
npm run test:smoke
```

What the smoke suite does:

- seeds the expanded Project Case catalog before backend startup
- starts backend on `127.0.0.1:18000`
- starts frontend on `127.0.0.1:14173`
- verifies `/project_list/1676767239059300352.html`
- verifies `/project_list/1676767239059300352.html#ctn2`
- verifies category switching while preserving `/project_list/:categoryId.html`
- verifies seeded category title, first case title, and canonical detail link
- verifies admin preview links for Project Categories and Project Case Mapping
- verifies required-field validation for Project Case Mapping
- verifies dynamic `entity_media` target binding when `entity_type` switches between `project_category` and `project`
- verifies admin edit/save/update flows for Project Case Mapping and Project Media Groups
