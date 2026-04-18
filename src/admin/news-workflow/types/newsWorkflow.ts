export type NewsStatus = 'draft' | 'published'
export type NewsBlockType = 'text' | 'heading' | 'image' | 'gallery' | 'quote' | 'divider' | 'two_column'

export interface NewsCategoryOption {
  id: number
  name: string
  slug: string
  description?: string | null
}

export interface NewsPageConfig {
  width: number
  background: string
}

export interface NewsEditorBlock {
  id: string
  type: NewsBlockType
  x: number
  y: number
  w: number
  h: number
  content: string
  props: Record<string, any>
}

export interface NewsContentJson {
  page: NewsPageConfig
  blocks: NewsEditorBlock[]
}

export interface NewsPostModel {
  id?: number
  title: string
  slug: string
  summary: string
  thumbnail_url: string
  content_json: NewsContentJson
  content_html: string
  source_url: string
  source_note: string
  status: NewsStatus
  category_ids: number[]
  categories?: NewsCategoryOption[]
  published_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface NewsListItem {
  id: number
  title: string
  slug: string
  summary?: string | null
  thumbnail_url?: string | null
  status: NewsStatus
  category_ids?: number[]
  categories?: NewsCategoryOption[]
  published_at?: string | null
  created_at: string
  updated_at: string
}

export interface NewsPagination {
  total: number
  page: number
  limit: number
}

export interface SourceImportJob {
  id: number
  source_url: string
  raw_title?: string | null
  raw_html?: string | null
  raw_text?: string | null
  parsed_json?: NewsContentJson | null
  status: string
  created_at: string
}

export interface MediaImageItem {
  id: number
  file_name?: string | null
  file_url: string
  file_type: string
  file_size?: number | null
  alt_text?: string | null
  created_at: string
}
