# Project -> Product Mapping - Technical Checklist (By File)

Date: 2026-04-22
Owner: FE + BE team
Status: Step 1 planning checklist created
muc

## Scope and target

- Add mapping from one Project to many Products (and one Product can belong to many Projects).
- Support CMS admin CRUD for mapping.
- Expose mapped products in public project detail API.
- Render mapped products in FE project detail page.

## Suggested data contract (target)

- New table/entity key: `project_product_items`
- Core fields:
  - `project_id` (FK -> projects.id)
  - `product_id` (FK -> products.id)
  - `sort_order` (int, default 0)
  - `usage_note` (text, optional)
  - `is_featured` (bool, default false)
- Unique constraint: (`project_id`, `product_id`)

---

## Backend checklist

- [ ] File: `China_BE/app/models/projects.py`
- Add new model `ProjectProductItem` with table `project_product_items`.
- Add FK to `projects.id` and `products.id`.
- Add `UniqueConstraint("project_id", "product_id", name="uq_project_product_items_project_product")`.
- Add optional fields `sort_order`, `usage_note`, `is_featured`.
- Add relationship on `Project` -> `product_items` (cascade delete-orphan).

- [ ] File: `China_BE/app/models/products.py`
- Add reverse relationship on `Product` -> `project_items` for join-table traversal.
- Keep relation lazy/selectin consistent with current style.

- [ ] File: `China_BE/app/db/base.py`
- Import `ProjectProductItem` so metadata sees new table.
- Add `ProjectProductItem` to `__all__`.

- [ ] File: `China_BE/app/db/init_db.py`
- Extend schema-upgrade section with `ensure_project_product_mapping_schema()`.
- Guard legacy DBs: if table missing, create by metadata (or safe DDL branch if needed).
- If table exists, ensure missing columns are added safely.
- Wire this function inside `initialize_database()`.

- [ ] File: `China_BE/app/schemas/entities.py`
- Add `ProjectProductItemCreate`, `ProjectProductItemUpdate`, `ProjectProductItemRead`.
- Include validation defaults (`sort_order=0`, `is_featured=False`).
- Keep response type compatible with generic admin serializer.

- [ ] File: `China_BE/app/services/catalog.py`
- Register entity key `project_product_items` in `ENTITY_REGISTRY`.
- Bind model + read/create/update schemas.

- [ ] File: `China_BE/app/services/admin.py`
- In `_raise_friendly_write_integrity_error`, add friendly 409 for duplicate (`project_id`,`product_id`).
- In `_raise_delete_dependency_error`, prevent deleting a project/product still referenced by project-product mapping.
- If big-int safety is required in FE, stringify ids in `_stringify_project_case_ids` (or generalize helper).

- [ ] File: `China_BE/app/services/public.py`
- In `get_project_detail(...)`, preload project product mappings and product/category/image data.
- Add `used_products` array to response, sorted by `sort_order`, then `id`.
- Suggested payload item fields:
  - `mapping_id`, `sort_order`, `usage_note`, `is_featured`
  - `product`: `id`, `name`, `slug`, `short_desc`, `image_url`, `category`.
- Ensure only active/published product records are returned (follow current product visibility rules).

- [ ] File: `China_BE/app/api/routes/public.py`
- No new endpoint required; keep `/public/projects/{slug}`.
- Confirm response model stays `dict[str, Any]` to allow added field without breaking strict schema.

- [ ] File (new): `China_BE/tests/test_admin_project_product_mapping_e2e.py`
- Create project + product + mapping via admin API.
- Assert CRUD works and ordering fields persist.
- Assert duplicate mapping returns 409 with friendly message.

- [ ] File (new): `China_BE/tests/test_public_project_detail_with_products_e2e.py`
- Seed one project with 2 mapped products.
- Assert `/api/v1/public/projects/{slug}` contains `used_products` in expected order and shape.
- Assert filtering of inactive product if applicable.

---

## Frontend checklist

- [ ] File: `China_Web_FE/src/views/admin/config/entityConfigs.js`
- Add entity config key `project_product_items`.
- Configure fields/table:
  - `project_id`, `product_id`, `sort_order`, `usage_note`, `is_featured`.
- Add `relationEntities`:
  - `project_id: 'projects'`
  - `product_id: 'products'`
- Add labels/help text and optional preview resolver.
- Add admin menu entry under `DU AN` section.

- [ ] File: `China_Web_FE/src/views/admin/modules/entity-manager/formHelpers.js`
- Add entity-specific preview URL for `project_product_items`:
  - project preview `/project/{slug}`
  - product preview `/products/{slug}`
- Decide ID safety strategy:
  - if IDs can exceed JS safe integer, add `project_id`/`product_id` to unsafe integer handling path.

- [ ] File: `China_Web_FE/src/views/admin/modules/entity-manager/EntityManager.vue` (optional)
- Only update if additional UX hints are needed for mapping entity.
- Keep generic manager behavior if config-only solution is enough.

- [ ] File: `China_Web_FE/src/views/user/services/publicApi.js`
- Keep `getProjectDetail` path unchanged.
- If FE normalizer/types are added later, include `used_products` in normalized shape.

- [ ] File: `China_Web_FE/src/views/user/projects/ProjectDetailPage.vue`
- Render new `Used Products` section when `project.used_products?.length > 0`.
- Show product card fields: image, name, short_desc, optional usage_note, CTA to `/products/{slug}`.
- Keep section responsive for desktop/mobile.
- Keep graceful empty state (hide section when no mapped products).

---

## Definition of done (Step 1)

- [ ] Admin can create/edit/delete project-product mappings.
- [ ] Public project detail API returns `used_products` with stable order.
- [ ] Project detail page displays mapped products and links to product detail.
- [ ] Backend tests for mapping + public payload pass.
- [ ] FE build passes (`npm run build`) after UI update.

## Execution order (recommended)

1. BE model/schema/registry/admin error handling.
2. BE public payload + tests.
3. FE admin config + FE project detail render.
4. Final regression run (pytest + FE build).
