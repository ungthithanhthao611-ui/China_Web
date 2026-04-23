export const NEWS_STATUSES = ['draft', 'published']

export const NEWS_BLOCK_TYPES = [
  'text',
  'heading',
  'image',
  'gallery',
  'quote',
  'divider',
  'two_column',
]

export function createDefaultNewsPageConfig() {
  return {
    width: 900,
    background: '#ffffff',
  }
}

export function createEmptyNewsContentJson() {
  return {
    page: createDefaultNewsPageConfig(),
    blocks: [],
  }
}
