<script setup>
import AddNavigationMenu from './AddNavigationMenu.vue'
import DeleteNavigationMenu from './DeleteNavigationMenu.vue'
import EditNavigationMenu from './EditNavigationMenu.vue'
import { useNavigationMenusManager } from '@/admin/composables/useNavigationMenusManager'

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
} = useNavigationMenusManager(props, emit)

defineExpose({
  refreshAll,
})
</script>

<template>
  <section class="nav-manager">
    <header class="nav-manager__header">
      <div class="title-wrap">
        <p class="crumb">Dashboard <span>/</span> Navigation Menus</p>
        <h2>Navigation Menus</h2>
      </div>
      <div class="head-actions">
        <button type="button" class="btn btn-ghost">Export XML</button>
        <button type="button" class="btn btn-ghost" :disabled="loadingNavigation" @click="refreshAll">
          {{ loadingNavigation ? 'Refreshing...' : 'Refresh' }}
        </button>
        <AddNavigationMenu @trigger="openCreateMenuDrawer" />
      </div>
    </header>

    <section class="filters">
      <label class="filter-box">
        <span>Keyword Search</span>
        <input v-model="searchKeyword" type="text" placeholder="Menu title..." />
      </label>
      <label class="filter-box">
        <span>Status</span>
        <select v-model="statusFilter">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </label>
      <label class="filter-box">
        <span>Type</span>
        <select v-model="typeFilter">
          <option value="all">All Types</option>
          <option value="parent">Parent</option>
          <option value="child">Child</option>
        </select>
      </label>
      <label class="filter-box">
        <span>Menu Scope</span>
        <select v-model="selectedNavMenuId">
          <option value="">Select menu</option>
          <option v-for="menu in navMenus" :key="menu.id" :value="String(menu.id)">
            {{ menu.name }} ({{ menu.location || 'no-location' }})
          </option>
        </select>
      </label>
      <button type="button" class="btn btn-filter" @click="applyFilters">Apply Filters</button>
    </section>

    <section class="table-card">
      <div class="table-scroll">
        <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Menu Title</th>
            <th>Slug</th>
            <th>Type</th>
            <th>Parent</th>
            <th>Sort</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in pagedRows" :key="row.node._cid">
            <td>{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
            <td>
              <span class="title-cell" :style="{ paddingLeft: `${row.depth * 18}px` }">{{ row.node.title }}</span>
            </td>
            <td>{{ itemSlugFromUrl(row.node.url) }}</td>
            <td>
              <span class="pill" :class="row.rowType">{{ row.rowType.toUpperCase() }}</span>
            </td>
            <td>{{ row.parentTitle || '-' }}</td>
            <td>{{ row.node.sort_order ?? 0 }}</td>
            <td>
              <span class="status-chip" :class="{ inactive: !selectedMenu?.is_active }">
                {{ selectedMenu?.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <div class="row-actions">
                <button type="button" class="btn btn-mini btn-ghost" @click="openEditNodeDrawer(row.node._cid)">
                  Edit
                </button>
                <button type="button" class="btn btn-mini btn-ghost" @click="openCreateChildNodeDrawer(row.node._cid)">
                  + Child
                </button>
                <button type="button" class="btn btn-mini btn-danger-outline" @click="removeNode(row.node._cid)">
                  Delete
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!pagedRows.length">
            <td colspan="8" class="empty-row">No navigation entries.</td>
          </tr>
        </tbody>
        </table>
      </div>

      <footer class="table-footer">
        <p>Showing {{ showingFrom }}-{{ showingTo }} of {{ rowsCount }} entries</p>
        <div class="pagination">
          <button type="button" class="page-btn" :disabled="currentPage <= 1" @click="setPage(currentPage - 1)">
            &lt;
          </button>
          <button
            v-for="page in totalPages"
            :key="page"
            type="button"
            class="page-btn"
            :class="{ active: page === currentPage }"
            @click="setPage(page)"
          >
            {{ page }}
          </button>
          <button
            type="button"
            class="page-btn"
            :disabled="currentPage >= totalPages"
            @click="setPage(currentPage + 1)"
          >
            &gt;
          </button>
        </div>
        <div class="footer-actions">
          <button type="button" class="btn btn-secondary" @click="openCreateRootNodeDrawer">Add Root Entry</button>
          <EditNavigationMenu :disabled="!selectedMenu" @trigger="openEditMenuDrawer" />
          <DeleteNavigationMenu :disabled="!selectedMenu" @trigger="handleDeleteMenu" />
          <button type="button" class="btn btn-primary" :disabled="!selectedMenu || savingNavigation" @click="handleSaveTree">
            Save Changes
          </button>
        </div>
      </footer>
    </section>

    <div v-if="drawerOpen" class="drawer-overlay" @click="closeDrawer"></div>
    <aside class="drawer" :class="{ open: drawerOpen }">
      <button type="button" class="drawer-toggle" @click="closeDrawer">&lt;</button>
      <header class="drawer-header">
        <div>
          <h3>{{ drawerTitle }}</h3>
          <p>Navigation Entry</p>
        </div>
        <button type="button" class="close-btn" @click="closeDrawer">x</button>
      </header>

      <section class="drawer-body" v-if="drawerMode === 'createMenu' || drawerMode === 'editMenu'">
        <label>
          <span>Menu Label</span>
          <input v-model="menuForm.name" type="text" placeholder="e.g. Main Navigation" />
        </label>
        <label>
          <span>Location</span>
          <input v-model="menuForm.location" type="text" placeholder="header / footer" />
        </label>
        <label>
          <span>Language</span>
          <select v-model="menuForm.language_id">
            <option value="">Select language</option>
            <option v-for="language in languages" :key="language.id" :value="String(language.id)">
              {{ language.code }} - {{ language.name }}
            </option>
          </select>
        </label>
        <label class="toggle-row">
          <input v-model="menuForm.is_active" type="checkbox" />
          <span>Active status</span>
        </label>
      </section>

      <section class="drawer-body" v-else>
        <label>
          <span>Menu Label</span>
          <input v-model="nodeForm.title" type="text" placeholder="e.g. Our History" />
        </label>
        <label>
          <span>Target Path</span>
          <input v-model="nodeForm.url" type="text" placeholder="/about/history" />
        </label>
        <div class="grid-2">
          <label>
            <span>Anchor</span>
            <input v-model="nodeForm.anchor" type="text" placeholder="section-id" />
          </label>
          <label>
            <span>Sort Order</span>
            <input v-model="nodeForm.sort_order" type="number" placeholder="0" />
          </label>
        </div>
        <div class="grid-2">
          <label>
            <span>Type</span>
            <input v-model="nodeForm.item_type" type="text" placeholder="parent/child" />
          </label>
          <label>
            <span>Target</span>
            <input v-model="nodeForm.target" type="text" placeholder="_self / _blank" />
          </label>
        </div>
      </section>

      <footer class="drawer-footer">
        <button type="button" class="btn btn-ghost" @click="closeDrawer">Discard</button>
        <button type="button" class="btn btn-primary" :disabled="savingNavigation || loadingLanguages" @click="submitDrawer">
          Save Changes
        </button>
      </footer>
    </aside>
  </section>
</template>

<style scoped>
.nav-manager {
  margin-top: 14px;
  background: #f4f6fb;
  border: 1px solid #dde3ee;
  border-radius: 16px;
  padding: clamp(12px, 2.3vw, 18px);
  position: relative;
  overflow: hidden;
}

.nav-manager__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.title-wrap h2 {
  margin: 6px 0 0;
  font-size: clamp(32px, 5vw, 56px);
  line-height: 1;
  font-weight: 800;
  color: #151b2d;
}

.crumb {
  margin: 0;
  color: #5f6f86;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 600;
}

.crumb span {
  margin: 0 8px;
  color: #374a70;
}

.head-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.filters {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr auto;
  gap: 10px;
  align-items: stretch;
}

.filter-box {
  border: 1px solid #dbe4f2;
  background: #fff;
  border-radius: 12px;
  padding: 10px;
  display: grid;
  gap: 6px;
}

.filter-box span {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #73839a;
  font-weight: 700;
}

.filter-box input,
.filter-box select {
  border: 0;
  background: transparent;
  font-size: 14px;
  color: #1f3249;
}

.filter-box input:focus,
.filter-box select:focus {
  outline: none;
}

.table-card {
  margin-top: 14px;
  border: 1px solid #dbe4f2;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
}

.table-scroll {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}

th,
td {
  padding: 13px 14px;
  border-bottom: 1px solid #edf2f8;
  text-align: left;
  font-size: 13px;
  color: #334864;
}

th {
  background: #f7f9fc;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 11px;
  font-weight: 700;
  color: #6f8199;
}

.title-cell {
  font-weight: 700;
  color: #1f2f45;
  display: inline-block;
}

.pill {
  border-radius: 999px;
  font-size: 10px;
  padding: 4px 8px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.pill.parent {
  background: #ecefff;
  color: #5058bd;
}

.pill.child {
  background: #eef6ff;
  color: #2f7bc7;
}

.status-chip {
  color: #4138d2;
  font-weight: 700;
}

.status-chip.inactive {
  color: #95a3b8;
}

.row-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.table-footer {
  padding: 12px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  background: #fbfcff;
}

.table-footer p {
  margin: 0;
  color: #6f8199;
  font-size: 13px;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid #d4deed;
  background: #fff;
  color: #495f7b;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.page-btn.active {
  border-color: #3830c9;
  background: #2f2bbf;
  color: #fff;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.footer-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.empty-row {
  text-align: center;
  color: #8394aa;
}

.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(18, 27, 42, 0.35);
  z-index: 39;
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: min(420px, 100vw);
  height: 100vh;
  background: #fff;
  border-left: 6px solid #4c42e7;
  box-shadow: -24px 0 40px rgba(22, 38, 70, 0.2);
  z-index: 40;
  transform: translateX(100%);
  transition: transform 0.28s ease;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.drawer.open {
  transform: translateX(0);
}

.drawer-toggle {
  position: absolute;
  left: -18px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 46px;
  border: 0;
  border-radius: 12px 0 0 12px;
  background: #4c42e7;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}

.drawer-header {
  padding: 20px;
  border-bottom: 1px solid #e8edf5;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}

.drawer-header h3 {
  margin: 0;
  font-size: 48px;
  line-height: 1;
  color: #1b2368;
}

.drawer-header p {
  margin: 6px 0 0;
  font-size: 12px;
  color: #77869b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
}

.close-btn {
  border: 0;
  background: transparent;
  color: #8b96aa;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
}

.drawer-body {
  padding: 18px 20px;
  overflow: auto;
  display: grid;
  align-content: start;
  gap: 12px;
}

.drawer-body label {
  display: grid;
  gap: 6px;
}

.drawer-body label span {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #728197;
  font-weight: 700;
}

.drawer-body input,
.drawer-body select {
  border: 1px solid #d6e1ee;
  border-radius: 12px;
  background: #f8fbff;
  padding: 11px 12px;
  font-size: 14px;
  color: #22354d;
}

.drawer-body input:focus,
.drawer-body select:focus {
  outline: none;
  border-color: #7a84ff;
  box-shadow: 0 0 0 3px rgba(116, 125, 249, 0.2);
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.toggle-row {
  display: flex !important;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid #dde6f3;
  border-radius: 12px;
  background: #f7f8ff;
}

.toggle-row input {
  width: 16px;
  height: 16px;
}

.drawer-footer {
  border-top: 1px solid #e8edf5;
  padding: 14px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn {
  border-radius: 10px;
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-mini {
  padding: 5px 8px;
  border-radius: 8px;
  font-size: 11px;
}

.btn-primary {
  border-color: #4138d2;
  background: linear-gradient(135deg, #2f2bc4 0%, #5348ea 100%);
  color: #fff;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(56, 52, 199, 0.34);
}

.btn-secondary {
  border-color: #c8d6ea;
  background: #eef4ff;
  color: #324968;
}

.btn-secondary:hover {
  background: #e4edfb;
}

.btn-ghost {
  border-color: #d5e0ee;
  background: #fff;
  color: #405a79;
}

.btn-ghost:hover {
  background: #f6f9fd;
}

.btn-danger-outline {
  border-color: #e5bbc4 !important;
  background: #fff6f8 !important;
  color: #a34256 !important;
}

.btn-danger-outline:hover {
  background: #ffedf1 !important;
}

.btn-filter {
  border-color: #d7d2ff;
  background: linear-gradient(135deg, #d9d6ff 0%, #c7c2ff 100%);
  color: #363a7a;
  font-weight: 700;
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
    font-size: 36px;
  }

  table {
    min-width: 760px;
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
    font-size: 30px;
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
</style>

