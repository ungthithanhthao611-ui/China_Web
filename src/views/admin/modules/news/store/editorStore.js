import { defineStore } from 'pinia'

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export const useEditorStore = defineStore('newsEditor', {
  state: () => ({
    post: { title: '', slug: '', summary: '', thumbnailUrl: '', status: 'draft', publishedAt: '' },
    blocks: [],
    selectedBlockId: null,
    selectedSubItemId: null,
    pageConfig: { width: 800, background: '#ffffff' },
    past: [],
    future: [],
  }),

  actions: {
    saveSnapshot() {
      const current = {
        post: deepClone(this.post),
        blocks: deepClone(this.blocks),
        pageConfig: deepClone(this.pageConfig),
      }
      const last = this.past[this.past.length - 1]
      if (last && JSON.stringify(last) === JSON.stringify(current)) return
      this.past = [...this.past, current].slice(-50)
      this.future = []
    },

    undo() {
      if (this.past.length === 0) return
      const previous = this.past[this.past.length - 1]
      const current = {
        post: deepClone(this.post),
        blocks: deepClone(this.blocks),
        pageConfig: deepClone(this.pageConfig),
      }
      this.past = this.past.slice(0, -1)
      this.future = [current, ...this.future]
      this.post = previous.post
      this.blocks = previous.blocks
      this.pageConfig = previous.pageConfig
      this.selectedBlockId = null
    },

    redo() {
      if (this.future.length === 0) return
      const next = this.future[0]
      const current = {
        post: deepClone(this.post),
        blocks: deepClone(this.blocks),
        pageConfig: deepClone(this.pageConfig),
      }
      this.past = [...this.past, current]
      this.future = this.future.slice(1)
      this.post = next.post
      this.blocks = next.blocks
      this.pageConfig = next.pageConfig
      this.selectedBlockId = null
    },

    setPost(updates) {
      const willChange = Object.keys(updates).some((k) => updates[k] !== this.post[k])
      if (willChange) this.saveSnapshot()
      this.post = { ...this.post, ...updates }
    },

    setBlocks(blocks, preserveHistory = false) {
      if (!preserveHistory) {
        this.blocks = blocks
        this.past = []
        this.future = []
      } else {
        this.saveSnapshot()
        this.blocks = blocks
      }
    },

    addBlock(block) {
      this.saveSnapshot()
      this.blocks = [...this.blocks, block]
    },

    updateBlock(id, updates, skipSnapshot = false) {
      if (!skipSnapshot) this.saveSnapshot()
      this.blocks = this.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b))
    },

    removeBlock(id) {
      this.saveSnapshot()
      this.blocks = this.blocks.filter((b) => b.id !== id)
      if (this.selectedBlockId === id) this.selectedBlockId = null
    },

    duplicateBlock(id) {
      const block = this.blocks.find((b) => b.id === id)
      if (!block) return
      this.saveSnapshot()
      const newBlock = {
        ...deepClone(block),
        id: 'block-' + Date.now() + Math.random().toString(36).substring(7),
        x: block.x + 20,
        y: block.y + 20,
      }
      this.blocks = [...this.blocks, newBlock]
      this.selectedBlockId = newBlock.id
    },

    selectBlock(id) {
      if (this.selectedBlockId !== id) this.selectedSubItemId = null
      this.selectedBlockId = id
    },

    selectSubItem(id) {
      this.selectedSubItemId = id
    },

    setPageConfig(config) {
      this.saveSnapshot()
      this.pageConfig = { ...this.pageConfig, ...config }
    },

    resetEditor() {
      this.post = { title: '', slug: '', summary: '', thumbnailUrl: '', status: 'draft', publishedAt: '' }
      this.blocks = []
      this.selectedBlockId = null
      this.selectedSubItemId = null
      this.pageConfig = { width: 800, background: '#ffffff' }
      this.past = []
      this.future = []
    },
  },
})
