import { onMounted, ref } from 'vue'

export function useAsyncData(loader, options = {}) {
  const {
    immediate = true,
    initialData = null,
    onSuccess,
    onError,
  } = options

  const data = ref(initialData)
  const error = ref(null)
  const loading = ref(false)
  const initialized = ref(false)

  async function execute(...args) {
    loading.value = true
    error.value = null

    try {
      const result = await loader(...args)
      data.value = result
      initialized.value = true
      onSuccess?.(result)
      return result
    } catch (err) {
      error.value = err
      onError?.(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    if (immediate) {
      execute().catch(() => {})
    }
  })

  return {
    data,
    error,
    loading,
    initialized,
    execute,
    reload: execute,
  }
}

