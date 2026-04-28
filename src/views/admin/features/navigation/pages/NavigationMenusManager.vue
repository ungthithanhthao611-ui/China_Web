<script setup>
import { reactive } from 'vue'
import AddNavigationMenu from '@/views/admin/features/navigation/components/AddNavigationMenu.vue'
import DeleteNavigationMenu from '@/views/admin/features/navigation/components/DeleteNavigationMenu.vue'
import EditNavigationMenu from '@/views/admin/features/navigation/components/EditNavigationMenu.vue'
import { useNavigationMenusManager } from '@/views/admin/features/navigation/composables/useNavigationMenusManager'

const props = defineProps({
  token: {
    type: String,
    default: '',
  },
  active: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['notify-success', 'notify-error', 'clear-notify', 'menus-count'])

const confirmDialog = reactive({
  open: false,
  title: '',
  message: '',
  confirmText: 'Xác nhận',
  tone: 'primary',
  resolver: null,
})

function closeConfirmDialog(confirmed = false) {
  if (!confirmDialog.open) {
    return
  }

  confirmDialog.open = false
  const resolve = confirmDialog.resolver
  confirmDialog.resolver = null
  if (typeof resolve === 'function') {
    resolve(Boolean(confirmed))
  }
}

function openConfirmDialog({ title, message, confirmText, tone = 'primary' } = {}) {
  if (typeof confirmDialog.resolver === 'function') {
    confirmDialog.resolver(false)
    confirmDialog.resolver = null
  }

  confirmDialog.title = String(title || 'Xác nhận thao tác')
  confirmDialog.message = String(message || 'Bạn có chắc chắn muốn tiếp tục?')
  confirmDialog.confirmText = String(confirmText || 'Xác nhận')
  confirmDialog.tone = tone === 'danger' ? 'danger' : 'primary'
  confirmDialog.open = true

  return new Promise((resolve) => {
    confirmDialog.resolver = resolve
  })
}

const {
  languages,
  navMenus,
  selectedNavMenuId,
  loadingLanguages,
  loadingNavigation,
  savingNavigation,
  searchKeyword,
  statusFilter,
  typeFilter,
  currentPage,
  pageSize,
  drawerOpen,
  drawerMode,
  drawerTitle,
  menuForm,
  nodeForm,
  selectedMenu,
  rowsCount,
  totalPages,
  pagedRows,
  showingFrom,
  showingTo,
  itemSlugFromUrl,
  refreshAll,
  applyFilters,
  setPage,
  openCreateMenuDrawer,
  openEditMenuDrawer,
  openCreateRootNodeDrawer,
  openCreateChildNodeDrawer,
  openEditNodeDrawer,
  closeDrawer,
  submitDrawer,
  removeNode,
  handleDeleteMenu,
  handleSaveTree,
} = useNavigationMenusManager(props, emit, {
  confirmAction: openConfirmDialog,
})

async function openDeleteConfirm() {
  if (!selectedMenu.value || savingNavigation.value) {
    return
  }

  const confirmed = await openConfirmDialog({
    title: 'Xác nhận xóa menu',
    message: `Bạn có chắc chắn muốn xóa menu "${selectedMenu.value?.name || 'đang chọn'}" và toàn bộ mục menu bên trong không?`,
    confirmText: 'Xóa menu',
    tone: 'danger',
  })
  if (!confirmed) {
    return
  }
  await handleDeleteMenu()
}

defineExpose({
  refreshAll,
})
</script>

<template>
  <section class="nav-manager">
    <div class="ultimate-clean-workspace">
      <!-- 1. Unified Header -->
      <header class="intro-card">
        <div class="intro-copy">
          <p class="intro-eyebrow">Quản trị hệ thống</p>
          <h2>Menu điều hướng</h2>
          <p>Tạo, sửa, xóa và sắp xếp phân cấp các menu điều hướng trên toàn hệ thống.</p>
        </div>
        <div class="intro-actions">
          <button type="button" class="btn btn-ghost btn-sm">Xuất XML</button>
          <button type="button" class="btn btn-ghost btn-sm" :disabled="loadingNavigation" @click="refreshAll">
            {{ loadingNavigation ? 'Đang làm mới...' : 'Làm mới' }}
          </button>
          <AddNavigationMenu @trigger="openCreateMenuDrawer" />
        </div>
      </header>

      <section class="editor-head" style="padding: 24px 32px 16px; border-top: 1px solid #f1f5f9;">
        <div class="toolbar-grid" style="grid-template-columns: 1.2fr 1fr 1fr 1.2fr auto; gap: 12px; width: 100%;">
          <input v-model="searchKeyword" type="text" class="form-control" placeholder="Tìm tên menu..." />
          <select v-model="statusFilter" class="form-control">
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hiển thị</option>
            <option value="inactive">Đang ẩn</option>
          </select>
          <select v-model="typeFilter" class="form-control">
            <option value="all">Tất cả loại</option>
            <option value="parent">Mục cha</option>
            <option value="child">Mục con</option>
          </select>
          <select v-model="selectedNavMenuId" class="form-control">
            <option value="">Chọn menu phạm vi</option>
            <option v-for="menu in navMenus" :key="menu.id" :value="String(menu.id)">
              {{ menu.name }} ({{ menu.location || 'N/A' }})
            </option>
          </select>
          <button type="button" class="btn btn-secondary btn-sm" @click="applyFilters">Lọc</button>
        </div>
      </section>

      <section class="section-list-unified">
        <div class="table-wrap" style="padding: 0 32px 32px;">
          <table class="ultimate-table">
            <thead>
              <tr>
                <th style="width: 60px;">STT</th>
                <th>Tên mục menu</th>
                <th style="width: 140px;">Loại</th>
                <th style="width: 180px;">Mục cha</th>
                <th style="width: 80px;">Thứ tự</th>
                <th style="width: 100px;">Trạng thái</th>
                <th style="width: 220px;">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in pagedRows" :key="row.node._cid">
                <td>{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
                <td>
                  <div class="table-cell-title" :style="{ paddingLeft: `${row.depth * 18}px` }">
                    <span>{{ row.node.title }}</span>
                    <p class="table-cell-subtext">{{ itemSlugFromUrl(row.node.url) }}</p>
                  </div>
                </td>
                <td>
                  <span class="badge" :class="row.rowType === 'parent' ? 'badge-active' : 'badge-inactive'">
                    {{ row.rowType === 'parent' ? 'MỤC CHA' : 'MỤC CON' }}
                  </span>
                </td>
                <td>{{ row.parentTitle || '-' }}</td>
                <td>{{ row.node.sort_order ?? 0 }}</td>
                <td>
                  <span :class="selectedMenu?.is_active ? 'badge-active' : 'badge-inactive'" class="badge">
                    {{ selectedMenu?.is_active ? 'Hiện' : 'Ẩn' }}
                  </span>
                </td>
                <td class="table-actions">
                  <button type="button" class="btn btn-secondary-inline" @click="openEditNodeDrawer(row.node._cid)">Sửa</button>
                  <button type="button" class="btn btn-soft-inline" @click="openCreateChildNodeDrawer(row.node._cid)">+ Con</button>
                  <button type="button" class="btn btn-danger-inline" @click="removeNode(row.node._cid)">Xóa</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="table-pagination">
          <p class="pagination-meta">Hiển thị {{ showingFrom }}-{{ showingTo }} / {{ rowsCount }} mục</p>
          <div class="pagination-actions">
            <button type="button" class="btn btn-secondary btn-sm" :disabled="currentPage <= 1" @click="setPage(currentPage - 1)">Trước</button>
            <button type="button" class="btn btn-secondary btn-sm" :disabled="currentPage >= totalPages" @click="setPage(currentPage + 1)">Sau</button>
          </div>
          <div class="footer-actions">
            <button type="button" class="btn btn-secondary btn-sm" @click="openCreateRootNodeDrawer">Thêm mục gốc</button>
            <EditNavigationMenu :disabled="!selectedMenu" @trigger="openEditMenuDrawer" />
            <DeleteNavigationMenu :disabled="!selectedMenu || savingNavigation" @trigger="openDeleteConfirm" />
            <button type="button" class="btn btn-primary btn-sm" :disabled="!selectedMenu || savingNavigation" @click="handleSaveTree">
              Lưu thay đổi
            </button>
          </div>
        </footer>
      </section>
    </div>

    <transition name="confirm-fade">
      <div v-if="confirmDialog.open" class="confirm-overlay" @click="closeConfirmDialog(false)"></div>
    </transition>
    <transition name="confirm-pop">
      <div
        v-if="confirmDialog.open"
        class="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div class="confirm-modal__icon" :class="`confirm-modal__icon--${confirmDialog.tone}`">
          {{ confirmDialog.tone === 'danger' ? '!' : '?' }}
        </div>
        <h3 id="confirm-dialog-title">{{ confirmDialog.title }}</h3>
        <p>{{ confirmDialog.message }}</p>
        <div class="confirm-modal__actions">
          <button type="button" class="btn btn-ghost" @click="closeConfirmDialog(false)">Hủy</button>
          <button
            type="button"
            class="btn"
            :class="confirmDialog.tone === 'danger' ? 'btn-danger' : 'btn-primary'"
            @click="closeConfirmDialog(true)"
          >
            {{ confirmDialog.confirmText }}
          </button>
        </div>
      </div>
    </transition>
    <div v-if="drawerOpen" class="drawer-overlay" @click="closeDrawer"></div>
    <aside class="drawer" :class="{ open: drawerOpen }">
      <button type="button" class="drawer-toggle" @click="closeDrawer">&lt;</button>
      <header class="drawer-header">
        <div>
          <h3>{{ drawerTitle }}</h3>
          <p>{{ drawerMode === 'createMenu' || drawerMode === 'editMenu' ? 'Thông tin menu' : 'Thông tin mục điều hướng' }}</p>
        </div>
        <button type="button" class="close-btn" @click="closeDrawer">x</button>
      </header>

      <section class="drawer-body" v-if="drawerMode === 'createMenu' || drawerMode === 'editMenu'">
        <label>
          <span>Tên menu</span>
          <input v-model="menuForm.name" type="text" placeholder="Ví dụ: Menu chính" />
        </label>
        <label>
          <span>Vị trí</span>
          <input v-model="menuForm.location" type="text" placeholder="header / footer" />
        </label>
        <label>
          <span>Ngôn ngữ</span>
          <select v-model="menuForm.language_id">
            <option value="">Chọn ngôn ngữ</option>
            <option v-for="language in languages" :key="language.id" :value="String(language.id)">
              {{ language.code }} - {{ language.name }}
            </option>
          </select>
        </label>
        <label class="toggle-row">
          <input v-model="menuForm.is_active" type="checkbox" />
          <span>Đang hiển thị</span>
        </label>
      </section>

      <section class="drawer-body" v-else>
        <label>
          <span>Tên mục</span>
          <input v-model="nodeForm.title" type="text" placeholder="Ví dụ: Lịch sử phát triển" />
        </label>
        <label>
          <span>Đường dẫn</span>
          <input v-model="nodeForm.url" type="text" placeholder="/about/history" />
        </label>
        <div class="grid-2">
          <label>
            <span>Anchor</span>
            <input v-model="nodeForm.anchor" type="text" placeholder="section-id" />
          </label>
          <label>
            <span>Thứ tự</span>
            <input v-model="nodeForm.sort_order" type="number" placeholder="0" />
          </label>
        </div>
        <div class="grid-2">
          <label>
            <span>Loại</span>
            <input v-model="nodeForm.item_type" type="text" placeholder="parent/child" />
          </label>
          <label>
            <span>Target</span>
            <input v-model="nodeForm.target" type="text" placeholder="_self / _blank" />
          </label>
        </div>
      </section>

      <footer class="drawer-footer">
        <button type="button" class="btn btn-ghost" @click="closeDrawer">Hủy</button>
        <button type="button" class="btn btn-primary" :disabled="savingNavigation || loadingLanguages" @click="submitDrawer">
          Lưu thay đổi
        </button>
      </footer>
    </aside>
  </section>
</template>

<style scoped>
.nav-manager {
  display: grid;
  gap: 24px;
}

.ultimate-clean-workspace {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.intro-card {
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
}

.intro-copy h2 {
  margin: 4px 0;
  font-size: 22px;
  font-weight: 500;
  color: #1e293b;
}

.intro-copy p {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.intro-eyebrow {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.05em;
}

.intro-actions {
  display: flex;
  gap: 8px;
}

.ultimate-table {
  width: 100%;
  border-collapse: collapse;
}

.ultimate-table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.ultimate-table td {
  padding: 12px 16px;
  font-size: 13px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
}

.table-cell-title span {
  display: block;
  font-weight: 500;
  color: #1e293b;
}

.table-cell-subtext {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.table-actions {
  display: flex;
  gap: 6px;
}

.badge {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
}

.badge-active { background: #dcfce7; color: #166534; }
.badge-inactive { background: #f1f5f9; color: #475569; }

.form-control {
  height: 36px;
  padding: 0 12px;
}

.btn-filter {
  border-color: #d7d2ff;
  background: linear-gradient(135deg, #d9d6ff 0%, #c7c2ff 100%);
  color: #363a7a;
  font-weight: 700;
  min-width: 134px;
}

button:disabled {
  opacity: 0.56;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

@media (max-width: 1200px) {
  .filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  table {
    min-width: 860px;
  }
}

@media (max-width: 900px) {
  .nav-manager__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .head-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .filters {
    grid-template-columns: 1fr;
  }

  .table-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .pagination {
    order: 2;
  }

  .footer-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .drawer-header h3 {
    font-size: 30px;
  }

  table {
    min-width: 760px;
  }
}

@media (max-width: 760px) {
  .table-scroll {
    overflow: visible;
  }

  table {
    min-width: 0;
    display: block;
  }

  thead {
    display: none;
  }

  tbody {
    display: grid;
    gap: 10px;
    padding: 10px;
  }

  .nav-row {
    display: block;
    border: 1px solid #dbe4f2;
    border-radius: 12px;
    background: #fff;
    overflow: hidden;
  }

  .nav-row td {
    display: grid;
    grid-template-columns: minmax(100px, 38%) minmax(0, 1fr);
    gap: 10px;
    align-items: start;
    border-bottom: 1px dashed #e6eef8;
    padding: 10px 12px;
  }

  .nav-row td:last-child {
    border-bottom: 0;
  }

  .nav-row td::before {
    content: attr(data-label);
    color: #73839a;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 700;
    line-height: 1.4;
    padding-top: 2px;
  }

  .table-empty-row {
    display: block;
  }

  .table-empty-row td {
    display: block;
    border: 1px solid #dbe4f2;
    border-radius: 10px;
    background: #fff;
  }

  .table-empty-row td::before {
    content: none;
  }

  .row-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 680px) {
  .head-actions .btn {
    flex: 1 1 calc(50% - 8px);
  }

  .table-footer p {
    font-size: 12px;
  }

  .footer-actions .btn {
    width: 100%;
  }

  .grid-2 {
    grid-template-columns: 1fr;
  }

  .drawer-toggle {
    display: none;
  }

  .drawer-header {
    padding: 16px;
  }

  .drawer-header h3 {
    font-size: 26px;
  }

  .drawer-body {
    padding: 14px 16px;
  }

  .drawer-footer {
    padding: 12px 16px;
    justify-content: stretch;
    flex-wrap: wrap;
  }

  .drawer-footer .btn {
    width: 100%;
  }
}

.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 41;
  background: rgba(10, 18, 35, 0.54);
  backdrop-filter: blur(6px);
}

.confirm-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 42;
  width: min(440px, calc(100vw - 32px));
  padding: 18px 16px 16px;
  border-radius: 18px;
  border: 1px solid #d9e4f5;
  background:
    radial-gradient(circle at top left, rgba(82, 167, 237, 0.14), transparent 48%),
    radial-gradient(circle at top right, rgba(115, 105, 234, 0.12), transparent 50%),
    #ffffff;
  box-shadow: 0 24px 54px rgba(22, 38, 70, 0.26);
  transform: translate(-50%, -50%);
  text-align: center;
}

.confirm-modal__icon {
  width: 50px;
  height: 50px;
  margin: 0 auto 16px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 24px;
  font-weight: 800;
}

.confirm-modal__icon--primary {
  background: linear-gradient(135deg, #d6ebff 0%, #c7e2ff 100%);
  color: #205f9d;
}

.confirm-modal__icon--danger {
  background: linear-gradient(135deg, #ffe3e8 0%, #ffd2db 100%);
  color: #c43b57;
}

.confirm-modal h3 {
  margin: 0;
  color: #16233f;
  font-size: 20px;
  font-weight: 800;
}

.confirm-modal p {
  margin: 10px 0 0;
  color: #5d6d85;
  font-size: 14px;
  line-height: 1.6;
}

.confirm-modal strong {
  color: #1a2743;
}

.confirm-modal__actions {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.btn-danger {
  border-color: #d64563;
  background: linear-gradient(135deg, #d93b59 0%, #f0627d 100%);
  color: #fff;
}

.btn-danger:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 20px rgba(217, 59, 89, 0.28);
}

.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.18s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

.confirm-pop-enter-active,
.confirm-pop-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.confirm-pop-enter-from,
.confirm-pop-leave-to {
  opacity: 0;
  transform: translate(-50%, -46%) scale(0.96);
}

@media (max-width: 680px) {
  .confirm-modal {
    padding: 22px 18px;
    border-radius: 20px;
  }

  .confirm-modal h3 {
    font-size: 24px;
  }

  .confirm-modal p {
    font-size: 14px;
  }

  .confirm-modal__actions {
    flex-direction: column;
  }

  .confirm-modal__actions .btn {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .nav-manager {
    padding: 12px;
  }

  .title-wrap h2 {
    font-size: 28px;
  }

  .head-actions,
  .footer-actions,
  .pagination {
    display: grid;
    grid-template-columns: 1fr;
    width: 100%;
  }

  .head-actions .btn,
  .footer-actions .btn,
  .page-btn {
    width: 100%;
  }

  .nav-row td {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .drawer {
    width: 100vw;
    border-left-width: 0;
  }
}
</style>

