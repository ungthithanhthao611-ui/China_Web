import { slugFromTitle } from '@/admin/utils/news-workflow/blockFactory.js'

const IMPORTED_DRAFT_STORAGE_KEY = 'china-news-workflow-imported-draft'

function makeBlockId(prefix, index) {
  return `${prefix}-${Date.now()}-${index}`
}

function pushBlock(blocks, next) {
  const previous = blocks[blocks.length - 1]
  const y = previous ? previous.y + previous.h + 20 : 40

  blocks.push({
    id: makeBlockId(next.type, blocks.length + 1),
    x: 40,
    y,
    ...next,
  })
}

function pushTextBlock(blocks, content, height = 140) {
  pushBlock(blocks, {
    type: 'text',
    w: 820,
    h: height,
    content,
    props: {
      fontFamily: 'Arial, sans-serif',
      fontSize: 16,
      lineHeight: 1.7,
      color: '#1f2937',
      textAlign: 'left',
      backgroundColor: 'transparent',
    },
  })
}

function walkNode(node, blocks) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = String(node.textContent || '').trim()
    if (!text) return
    pushTextBlock(blocks, `<p>${text}</p>`)
    return
  }

  if (!(node instanceof HTMLElement)) {
    return
  }

  const tag = node.tagName.toLowerCase()

  if (tag === 'img') {
    const src = String(node.getAttribute('src') || '').trim()
    if (!src) return

    pushBlock(blocks, {
      type: 'image',
      w: 820,
      h: 420,
      content: '',
      props: {
        src,
        alt: String(node.getAttribute('alt') || '').trim(),
        caption: '',
        borderRadius: 8,
        objectFit: 'cover',
        align: 'center',
        opacity: 1,
      },
    })
    return
  }

  if (tag === 'figure') {
    const image = node.querySelector('img')
    if (image?.getAttribute('src')) {
      pushBlock(blocks, {
        type: 'image',
        w: 820,
        h: 420,
        content: '',
        props: {
          src: String(image.getAttribute('src') || '').trim(),
          alt: String(image.getAttribute('alt') || '').trim(),
          caption: String(node.querySelector('figcaption')?.textContent || '').trim(),
          borderRadius: 8,
          objectFit: 'cover',
          align: 'center',
          opacity: 1,
        },
      })
      return
    }
  }

  if (['h1', 'h2', 'h3'].includes(tag)) {
    pushBlock(blocks, {
      type: 'heading',
      w: 820,
      h: 84,
      content: String(node.textContent || '').trim(),
      props: {
        level: tag,
        fontFamily: 'Georgia, serif',
        fontSize: tag === 'h1' ? 38 : tag === 'h2' ? 32 : 26,
        fontWeight: 700,
        color: '#111827',
        textAlign: 'left',
      },
    })
    return
  }

  if (tag === 'blockquote') {
    pushBlock(blocks, {
      type: 'quote',
      w: 820,
      h: 170,
      content: node.innerHTML || `<p>${String(node.textContent || '').trim()}</p>`,
      props: {
        fontFamily: 'Georgia, serif',
        fontSize: 24,
        lineHeight: 1.5,
        color: '#334155',
        textAlign: 'left',
      },
    })
    return
  }

  if (tag === 'hr') {
    pushBlock(blocks, {
      type: 'divider',
      w: 820,
      h: 40,
      content: '',
      props: {},
    })
    return
  }

  if (['p', 'ul', 'ol', 'table', 'pre'].includes(tag)) {
    pushTextBlock(blocks, node.outerHTML, tag === 'table' ? 220 : 140)
    return
  }

  Array.from(node.childNodes).forEach((child) => walkNode(child, blocks))
}

function createFallbackBlocks(title, summary, html) {
  const blocks = []

  if (title.trim()) {
    pushBlock(blocks, {
      type: 'heading',
      w: 820,
      h: 84,
      content: title.trim(),
      props: {
        level: 'h1',
        fontFamily: 'Georgia, serif',
        fontSize: 38,
        fontWeight: 700,
        color: '#111827',
        textAlign: 'left',
      },
    })
  }

  if (summary.trim()) {
    pushTextBlock(blocks, `<p>${summary.trim()}</p>`)
  }

  if (html.trim()) {
    pushTextBlock(blocks, html, 180)
  }

  return blocks
}

export function buildContentJsonFromImportedHtml(title, summary, html) {
  const blocks = []
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<article>${html || ''}</article>`, 'text/html')
  const root = doc.body.firstElementChild

  if (root) {
    Array.from(root.childNodes).forEach((child) => walkNode(child, blocks))
  }

  return {
    page: { width: 900, background: '#ffffff' },
    blocks: blocks.length ? blocks : createFallbackBlocks(title, summary, html),
  }
}

export function persistImportedDraft(preview) {
  const title = String(preview?.draft?.title || preview?.title || 'Imported article').trim()
  const summary = String(preview?.draft?.summary || preview?.summary || '').trim()
  const bodyHtml = String(preview?.draft?.body || preview?.body || '').trim()

  const payload = {
    title,
    slug: slugFromTitle(title),
    summary,
    content_html: bodyHtml,
    content_json: buildContentJsonFromImportedHtml(title, summary, bodyHtml),
    status: 'draft',
    source_note: `Imported from file${preview?.file?.file_name ? `: ${preview.file.file_name}` : ''}. Manual editorial review is required before publish.`,
  }

  sessionStorage.setItem(IMPORTED_DRAFT_STORAGE_KEY, JSON.stringify(payload))
}

export function consumeImportedDraft() {
  try {
    const raw = sessionStorage.getItem(IMPORTED_DRAFT_STORAGE_KEY)
    if (!raw) return null
    sessionStorage.removeItem(IMPORTED_DRAFT_STORAGE_KEY)
    return JSON.parse(raw)
  } catch {
    sessionStorage.removeItem(IMPORTED_DRAFT_STORAGE_KEY)
    return null
  }
}
