import { env } from '@/config/env'
import { fetchJson } from '@/lib/http'

function withLanguage(query = {}) {
  return {
    language_code: env.languageCode,
    ...query,
  }
}

export function getHealth() {
  return fetchJson('/health')
}

export function getBootstrap(query = {}) {
  return fetchJson('/public/bootstrap', { query: withLanguage(query) })
}

export function getBanners({ bannerType, ...query } = {}) {
  return fetchJson('/public/banners', {
    query: withLanguage({
      banner_type: bannerType,
      ...query,
    }),
  })
}

export function getPageDetail(slug, query = {}) {
  return fetchJson(`/public/pages/${slug}`, { query: withLanguage(query) })
}

export function getPosts({ categorySlug, skip, limit, ...query } = {}) {
  return fetchJson('/public/posts', {
    query: withLanguage({
      category_slug: categorySlug,
      skip,
      limit,
      ...query,
    }),
  })
}

export function getPostDetail(slug, query = {}) {
  return fetchJson(`/public/posts/${slug}`, { query: withLanguage(query) })
}

export function getProjects({ categorySlug, year, skip, limit, ...query } = {}) {
  return fetchJson('/public/projects', {
    query: withLanguage({
      category_slug: categorySlug,
      year,
      skip,
      limit,
      ...query,
    }),
  })
}

export function getProjectDetail(slug, query = {}) {
  return fetchJson(`/public/projects/${slug}`, { query: withLanguage(query) })
}

export function getHonors({ awardYear, ...query } = {}) {
  return fetchJson('/public/honors', {
    query: withLanguage({
      award_year: awardYear,
      ...query,
    }),
  })
}

export function getBranches({ branchType, ...query } = {}) {
  return fetchJson('/public/branches', {
    query: withLanguage({
      branch_type: branchType,
      ...query,
    }),
  })
}

export function getBranchDetail(slug, query = {}) {
  return fetchJson(`/public/branches/${slug}`, { query: withLanguage(query) })
}

export function getContacts(query = {}) {
  return fetchJson('/public/contacts', { query: withLanguage(query) })
}

export function getVideos(query = {}) {
  return fetchJson('/public/videos', { query: withLanguage(query) })
}

