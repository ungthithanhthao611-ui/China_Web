import { reactive } from 'vue'

export const uiState = reactive({
  isHeaderHidden: false,
  isHeaderHovered: false,
  isNavHidden: false,
  isFooterHidden: false,
  loadingCount: 0,
  loadingProgress: 0,
  get isLoading() {
    return this.loadingCount > 0
  }
})
