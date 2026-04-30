const DEFAULT_IMAGE_FALLBACK = '/images/logo.png'

const normalizeImageUrl = (value) => String(value || '').trim()

export function resolveImageWithFallback(...candidates) {
  const normalizedCandidates = candidates
    .map((candidate) => normalizeImageUrl(candidate))
    .filter(Boolean)

  return normalizedCandidates[0] || DEFAULT_IMAGE_FALLBACK
}

export function applyImageFallback(event, fallbackUrl = DEFAULT_IMAGE_FALLBACK) {
  const imageElement = event?.target
  if (!imageElement) return

  const normalizedFallback = normalizeImageUrl(fallbackUrl) || DEFAULT_IMAGE_FALLBACK
  if (imageElement.dataset.fallbackApplied === 'true') return

  imageElement.dataset.fallbackApplied = 'true'
  imageElement.src = normalizedFallback
}

export { DEFAULT_IMAGE_FALLBACK }
