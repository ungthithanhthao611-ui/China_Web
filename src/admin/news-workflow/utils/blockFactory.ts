import type { NewsBlockType, NewsEditorBlock } from '@/admin/news-workflow/types/newsWorkflow'

function randomId(prefix = 'block'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function nextBlockY(blocks: NewsEditorBlock[]): number {
  if (!blocks.length) return 40
  const maxBottom = Math.max(...blocks.map((item) => item.y + item.h))
  return maxBottom + 20
}

export function createDefaultBlock(type: NewsBlockType, blocks: NewsEditorBlock[]): NewsEditorBlock {
  const y = nextBlockY(blocks)
  const base = {
    id: randomId(),
    type,
    x: 40,
    y,
    w: 820,
    h: 120,
    content: '',
    props: {},
  }

  if (type === 'text') {
    return {
      ...base,
      h: 160,
      content: '<p>Write your article content...</p>',
      props: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 16,
        lineHeight: 1.7,
        color: '#1f2937',
        textAlign: 'left',
        backgroundColor: 'transparent',
      },
    }
  }

  if (type === 'heading') {
    return {
      ...base,
      h: 84,
      content: 'Article heading',
      props: {
        level: 'h2',
        fontFamily: 'Georgia, serif',
        fontSize: 32,
        fontWeight: 700,
        color: '#111827',
        textAlign: 'left',
      },
    }
  }

  if (type === 'image') {
    return {
      ...base,
      h: 420,
      content: '',
      props: {
        src: '',
        alt: '',
        caption: '',
        borderRadius: 8,
        objectFit: 'cover',
        align: 'center',
        opacity: 1,
      },
    }
  }

  if (type === 'gallery') {
    return {
      ...base,
      h: 400,
      content: '',
      props: {
        images: [
          { id: 'img-1', src: 'https://picsum.photos/seed/picsum/800/600', alt: '', caption: 'Caption 1' },
          { id: 'img-2', src: 'https://picsum.photos/seed/237/800/600', alt: '', caption: 'Caption 2' },
        ],
        columns: 2,
        gap: 12,
        borderRadius: 8,
        objectFit: 'cover',
      },
    }
  }

  if (type === 'quote') {
    return {
      ...base,
      h: 170,
      content: '<p>"Highlighted quote"</p>',
      props: {
        fontFamily: 'Georgia, serif',
        fontSize: 24,
        lineHeight: 1.5,
        color: '#334155',
        textAlign: 'left',
      },
    }
  }

  if (type === 'divider') {
    return {
      ...base,
      h: 40,
      content: '',
      props: {},
    }
  }

  return {
    ...base,
    h: 260,
    content: '',
    props: {
      gap: 24,
      leftContent: '<p>Left column content</p>',
      rightContent: '<p>Right column content</p>',
      fontFamily: 'Arial, sans-serif',
      fontSize: 16,
      lineHeight: 1.6,
      color: '#1f2937',
    },
  }
}

export function cloneBlock(block: NewsEditorBlock): NewsEditorBlock {
  return {
    ...JSON.parse(JSON.stringify(block)),
    id: randomId(),
    x: block.x + 24,
    y: block.y + 24,
  }
}

export function slugFromTitle(title: string): string {
  const normalized = String(title || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized || `news-${Date.now()}`
}
