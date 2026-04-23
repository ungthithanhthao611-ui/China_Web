import { computed, reactive, ref, watch } from 'vue'

import {
  createNavigationMenu,
  deleteNavigationMenu,
  listAdminEntityRecords,
  listNavigationMenus,
  replaceNavigationMenuTree,
  updateNavigationMenu,
} from '@/views/admin/shared/api/adminApi.js'
import {
  createNavigationTreeHelpers,
  findNodeContextByCid,
  itemSlugFromUrl,
  toIntOrUndefined,
} from '@/views/admin/shared/utils/treeUtils'
import { publishNavigationMenusUpdated } from '@/shared/utils/navigationSync'

export function useNavigationMenusManager(props, emit, options = {}) {
  const { hydrateTree, serializeTree, createEmptyNode } = createNavigationTreeHelpers()

  const languages = ref([])
  const navMenus = ref([])
  const selectedNavMenuId = ref('')
  const navTree = ref([])

  const loadingLanguages = ref(false)
  const loadingNavigation = ref(false)
  const savingNavigation = ref(false)

  const searchKeyword = ref('')
  const statusFilter = ref('all')
  const typeFilter = ref('all')
  const currentPage = ref(1)
  const pageSize = 10

  const drawerOpen = ref(false)
  const drawerMode = ref('createMenu')
  const drawerTitle = ref('Add Menu')
  const editingNodeCid = ref('')
  const parentForNewNodeCid = ref('')

  const menuForm = reactive({
    name: '',
    location: 'header',
    language_id: '',
    is_active: true,
  })

  const nodeForm = reactive({
    title: '',
    url: '/',
    target: '',
    item_type: '',
    page_id: '',
    anchor: '',
    sort_order: 0,
  })

  const selectedMenu = computed(() =>
    navMenus.value.find((menu) => String(menu.id) === String(selectedNavMenuId.value)) || null
  )

  const flatTreeRows = computed(() => {
    const rows = []

    function walk(nodes, depth, parentTitle) {
      nodes.forEach((node) => {
        rows.push({
          node,
          depth,
          parentTitle,
          rowType: depth === 0 ? 'parent' : 'child',
        })
        walk(node.children || [], depth + 1, node.title)
      })
    }

    walk(navTree.value, 0, '')
    return rows
  })

  const filteredRows = computed(() => {
    let rows = [...flatTreeRows.value]
    const keyword = searchKeyword.value.trim().toLowerCase()

    if (keyword) {
      rows = rows.filter((row) => {
        const combined = `${row.node.title} ${row.node.url} ${row.parentTitle}`.toLowerCase()
        return combined.includes(keyword)
      })
    }

    if (typeFilter.value !== 'all') {
      rows = rows.filter((row) => row.rowType === typeFilter.value)
    }

    if (statusFilter.value !== 'all') {
      const active = statusFilter.value === 'active'
      rows = rows.filter(() => Boolean(selectedMenu.value?.is_active) === active)
    }

    return rows
  })

  const rowsCount = computed(() => filteredRows.value.length)
  const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize)))
  const pagedRows = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    return filteredRows.value.slice(start, start + pageSize)
  })
  const showingFrom = computed(() => (rowsCount.value ? (currentPage.value - 1) * pageSize + 1 : 0))
  const showingTo = computed(() => Math.min(currentPage.value * pageSize, rowsCount.value))

  function notifySuccess(message) {
    emit('notify-success', message)
  }

  function notifyError(message) {
    emit('notify-error', message)
  }

  function clearNotifications() {
    emit('clear-notify')
  }

  async function requestConfirm(payload) {
    if (typeof options.confirmAction === 'function') {
      return Boolean(await options.confirmAction(payload))
    }
    return window.confirm(payload?.message || 'Are you sure?')
  }

  function findNodeContext(cid) {
    return findNodeContextByCid(cid, navTree.value)
  }

  function resetMenuForm() {
    menuForm.name = ''
    menuForm.location = 'header'
    menuForm.language_id = languages.value[0] ? String(languages.value[0].id) : ''
    menuForm.is_active = true
  }

  function resetNodeForm() {
    nodeForm.title = ''
    nodeForm.url = '/'
    nodeForm.target = ''
    nodeForm.item_type = ''
    nodeForm.page_id = ''
    nodeForm.anchor = ''
    nodeForm.sort_order = 0
  }

  function syncMenuTree(menu) {
    if (!menu) {
      navTree.value = []
      return
    }
    navTree.value = hydrateTree(menu.items || [])
  }

  function normalizedToken() {
    return String(props.token || '').trim()
  }

  function applyFilters() {
    currentPage.value = 1
  }

  function setPage(page) {
    const safePage = Math.min(Math.max(1, page), totalPages.value)
    currentPage.value = safePage
  }

  async function loadLanguages() {
    const token = normalizedToken()
    if (!token) return

    loadingLanguages.value = true
    try {
      const response = await listAdminEntityRecords('languages', token, { skip: 0, limit: 100 })
      languages.value = (response.items || []).slice().sort((a, b) => Number(a.id) - Number(b.id))
      if (!menuForm.language_id && languages.value[0]) {
        menuForm.language_id = String(languages.value[0].id)
      }
    } catch (error) {
      notifyError(error.message || 'Failed to load languages.')
    } finally {
      loadingLanguages.value = false
    }
  }

  async function loadNavigationMenus() {
    const token = normalizedToken()
    if (!token) return

    loadingNavigation.value = true
    try {
      const response = await listNavigationMenus(token)
      navMenus.value = response.items || []
      emit('menus-count', navMenus.value.length)

      if (!navMenus.value.length) {
        selectedNavMenuId.value = ''
        syncMenuTree(null)
        return
      }

      const hasSelected = navMenus.value.some((menu) => String(menu.id) === String(selectedNavMenuId.value))
      if (!hasSelected) {
        selectedNavMenuId.value = String(navMenus.value[0].id)
      } else {
        syncMenuTree(selectedMenu.value)
      }
    } catch (error) {
      notifyError(error.message || 'Failed to load navigation menus.')
    } finally {
      loadingNavigation.value = false
    }
  }

  async function refreshAll() {
    const token = normalizedToken()
    if (!token) {
      emit('menus-count', 0)
      notifyError('Please provide admin token first.')
      return
    }

    clearNotifications()
    await loadLanguages()
    await loadNavigationMenus()
  }

  function openDrawer(mode, title) {
    drawerMode.value = mode
    drawerTitle.value = title
    drawerOpen.value = true
  }

  function closeDrawer() {
    drawerOpen.value = false
    drawerMode.value = 'createMenu'
    editingNodeCid.value = ''
    parentForNewNodeCid.value = ''
  }

  async function openCreateMenuDrawer() {
    if (languages.value.length === 0) {
      await loadLanguages()
    }
    resetMenuForm()
    openDrawer('createMenu', 'Add Menu')
  }

  async function openEditMenuDrawer() {
    if (!selectedMenu.value) {
      notifyError('Please select a menu first.')
      return
    }
    if (languages.value.length === 0) {
      await loadLanguages()
    }
    menuForm.name = selectedMenu.value.name || ''
    menuForm.location = selectedMenu.value.location || ''
    menuForm.language_id = String(selectedMenu.value.language_id || '')
    menuForm.is_active = Boolean(selectedMenu.value.is_active)
    openDrawer('editMenu', 'Edit Menu')
  }

  function openCreateRootNodeDrawer() {
    if (!selectedMenu.value) {
      notifyError('Please select a menu first.')
      return
    }
    resetNodeForm()
    parentForNewNodeCid.value = ''
    openDrawer('createNode', 'Add Navigation Entry')
  }

  function openCreateChildNodeDrawer(cid) {
    if (!selectedMenu.value) {
      notifyError('Please select a menu first.')
      return
    }
    const context = findNodeContext(cid)
    if (!context) return

    resetNodeForm()
    parentForNewNodeCid.value = cid
    nodeForm.item_type = 'child'
    nodeForm.sort_order = (context.node.children || []).length * 10
    openDrawer('createNode', `Add Child For "${context.node.title}"`)
  }

  function openEditNodeDrawer(cid) {
    const context = findNodeContext(cid)
    if (!context) return

    editingNodeCid.value = cid
    nodeForm.title = context.node.title || ''
    nodeForm.url = context.node.url || '/'
    nodeForm.target = context.node.target || ''
    nodeForm.item_type = context.node.item_type || ''
    nodeForm.page_id = context.node.page_id ?? ''
    nodeForm.anchor = context.node.anchor || ''
    nodeForm.sort_order = context.node.sort_order ?? 0
    openDrawer('editNode', `Edit "${context.node.title}"`)
  }

  async function submitDrawer() {
    const token = normalizedToken()
    if (!token) {
      notifyError('Please provide admin token first.')
      return
    }

    if (drawerMode.value === 'createMenu') {
      if (!menuForm.name.trim()) {
        notifyError('Menu name is required.')
        return
      }
      if (!menuForm.language_id) {
        notifyError('Language is required.')
        return
      }

      savingNavigation.value = true
      try {
        const created = await createNavigationMenu(token, {
          name: menuForm.name.trim(),
          location: menuForm.location.trim() || null,
          language_id: Number.parseInt(menuForm.language_id, 10),
          is_active: menuForm.is_active,
        })
        await loadNavigationMenus()
        publishNavigationMenusUpdated()
        selectedNavMenuId.value = String(created.id)
        notifySuccess(`Created menu "${created.name}".`)
        closeDrawer()
      } catch (error) {
        notifyError(error.message || 'Failed to create menu.')
      } finally {
        savingNavigation.value = false
      }
      return
    }

    if (drawerMode.value === 'editMenu') {
      if (!selectedMenu.value) {
        notifyError('Select a menu first.')
        return
      }
      if (!menuForm.name.trim()) {
        notifyError('Menu name is required.')
        return
      }
      if (!menuForm.language_id) {
        notifyError('Language is required.')
        return
      }

      const confirmed = await requestConfirm({
        title: 'Xac nhan cap nhat menu',
        message: `Ban co chac muon cap nhat menu "${menuForm.name.trim()}"?`,
        confirmText: 'Xac nhan cap nhat',
        tone: 'primary',
      })
      if (!confirmed) {
        return
      }

      savingNavigation.value = true
      try {
        await updateNavigationMenu(selectedMenu.value.id, token, {
          name: menuForm.name.trim(),
          location: menuForm.location.trim() || null,
          language_id: Number.parseInt(menuForm.language_id, 10),
          is_active: menuForm.is_active,
        })
        await loadNavigationMenus()
        publishNavigationMenusUpdated()
        notifySuccess('Menu metadata updated.')
        closeDrawer()
      } catch (error) {
        notifyError(error.message || 'Failed to update menu.')
      } finally {
        savingNavigation.value = false
      }
      return
    }

    if (drawerMode.value === 'createNode') {
      if (!nodeForm.title.trim()) {
        notifyError('Item title is required.')
        return
      }

      const node = createEmptyNode()
      node.title = nodeForm.title.trim()
      node.url = nodeForm.url.trim() || '/'
      node.target = nodeForm.target.trim()
      node.item_type = nodeForm.item_type.trim()
      node.page_id = toIntOrUndefined(nodeForm.page_id) ?? ''
      node.anchor = nodeForm.anchor.trim()
      node.sort_order = toIntOrUndefined(nodeForm.sort_order) ?? 0

      if (!parentForNewNodeCid.value) {
        navTree.value = [...navTree.value, node]
      } else {
        const parentCtx = findNodeContext(parentForNewNodeCid.value)
        if (!parentCtx) {
          notifyError('Parent item not found.')
          return
        }
        parentCtx.node.children = [...(parentCtx.node.children || []), node]
      }

      notifySuccess('Navigation entry added. Click "Save Changes" to persist.')
      closeDrawer()
      return
    }

    if (drawerMode.value === 'editNode') {
      const context = findNodeContext(editingNodeCid.value)
      if (!context) {
        notifyError('Selected item not found.')
        return
      }
      if (!nodeForm.title.trim()) {
        notifyError('Item title is required.')
        return
      }

      const currentTitle = context.node.title || nodeForm.title.trim() || 'item'
      const confirmed = await requestConfirm({
        title: 'Xac nhan cap nhat menu item',
        message: `Ban co chac muon cap nhat menu item "${currentTitle}"?`,
        confirmText: 'Xac nhan cap nhat',
        tone: 'primary',
      })
      if (!confirmed) {
        return
      }

      context.node.title = nodeForm.title.trim()
      context.node.url = nodeForm.url.trim() || '/'
      context.node.target = nodeForm.target.trim()
      context.node.item_type = nodeForm.item_type.trim()
      context.node.page_id = toIntOrUndefined(nodeForm.page_id) ?? ''
      context.node.anchor = nodeForm.anchor.trim()
      context.node.sort_order = toIntOrUndefined(nodeForm.sort_order) ?? 0
      notifySuccess('Navigation entry updated locally. Click "Save Changes" to persist.')
      closeDrawer()
    }
  }

  async function removeNode(cid) {
    const context = findNodeContext(cid)
    if (!context) return

    const nodeTitle = context.node.title || `#${context.index + 1}`
    const confirmed = await requestConfirm({
      title: 'Xac nhan xoa menu item',
      message: `Ban co chac muon xoa menu item "${nodeTitle}"?`,
      confirmText: 'Xac nhan xoa',
      tone: 'danger',
    })
    if (!confirmed) {
      return
    }

    context.nodes.splice(context.index, 1)
    notifySuccess('Navigation entry removed locally. Click "Save Changes" to persist.')
  }

  async function handleDeleteMenu() {
    const token = normalizedToken()
    if (!token || !selectedMenu.value) {
      notifyError('Select a menu first.')
      return false
    }

    const deletedMenuLabel = selectedMenu.value.name || `#${selectedMenu.value.id}`

    savingNavigation.value = true
    try {
      await deleteNavigationMenu(selectedMenu.value.id, token)
      selectedNavMenuId.value = ''
      clearNotifications()
      await loadNavigationMenus()
      publishNavigationMenusUpdated()
      notifySuccess(`Deleted menu "${deletedMenuLabel}" successfully.`)
      return true
    } catch (error) {
      notifyError(error.message || 'Failed to delete menu.')
      return false
    } finally {
      savingNavigation.value = false
    }
  }

  async function handleSaveTree() {
    const token = normalizedToken()
    if (!token || !selectedMenu.value) {
      notifyError('Select a menu first.')
      return
    }

    savingNavigation.value = true
    try {
      await replaceNavigationMenuTree(selectedMenu.value.id, token, serializeTree(navTree.value))
      await loadNavigationMenus()
      publishNavigationMenusUpdated()
      notifySuccess('Navigation tree saved.')
    } catch (error) {
      notifyError(error.message || 'Failed to save navigation tree.')
    } finally {
      savingNavigation.value = false
    }
  }

  watch(selectedNavMenuId, () => {
    syncMenuTree(selectedMenu.value)
    currentPage.value = 1
  })

  watch([searchKeyword, statusFilter, typeFilter], () => {
    currentPage.value = 1
  })

  watch(totalPages, (value) => {
    if (currentPage.value > value) {
      currentPage.value = value
    }
  })

  watch(
    () => props.token,
    async (value) => {
      if (!String(value || '').trim()) {
        languages.value = []
        navMenus.value = []
        selectedNavMenuId.value = ''
        navTree.value = []
        emit('menus-count', 0)
        closeDrawer()
        return
      }

      if (props.active) {
        await refreshAll()
      }
    }
  )

  watch(
    () => props.active,
    async (value) => {
      if (value && normalizedToken()) {
        await refreshAll()
      } else {
        closeDrawer()
      }
    },
    { immediate: true }
  )

  return {
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
  }
}
