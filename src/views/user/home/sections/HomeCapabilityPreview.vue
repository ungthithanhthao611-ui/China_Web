<script setup>
import { Building2, Cog, MapPin, MapPinned, Users } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { env } from '@/shared/config/env'
import { useSectionReveal } from '@/views/user/home/composables/useSectionReveal'
import { getHonorsPageData } from '@/views/user/services/honorsApi'

const API_ORIGIN = env.apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')
const loading = ref(true)
const payload = ref(null)
const activeOverviewImage = ref('')
const { rootRef, isVisible } = useSectionReveal({ threshold: 0.22 })
const { locale, t } = useI18n({ useScope: 'global' })

function resolveImageUrl(url) {
  const normalized = String(url || '').trim()
  if (!normalized) return ''
  if (/^https?:\/\//i.test(normalized)) return normalized
  return `${API_ORIGIN}${normalized.startsWith('/') ? normalized : `/${normalized}`}`
}

const factoryOverview = computed(() => {
  const raw = payload.value?.factory_overview || {}
  const useApi = locale.value === 'vi'

  return {
    title: (useApi && String(raw.title || '').trim()) || t('user.home.factoryOverviewTitle'),
    description: (useApi && String(raw.description || '').trim()) || t('user.home.factoryOverviewDescription'),
    factory_name: String(raw.factory_name || '').trim(),
    factory_address: String(raw.factory_address || '').trim(),
    production_capacity: String(raw.production_capacity || '').trim(),
    main_image_url: String(raw.main_image_url || '').trim(),
    stats: Array.isArray(raw.stats) ? raw.stats : [],
  }
})

const contactInfo = computed(() => payload.value?.contact_info || {})

const companyName = computed(() =>
  factoryOverview.value.factory_name ||
  String(contactInfo.value.contact_name || '').trim() ||
  t('user.home.factoryNameEmpty')
)

const factoryAddress = computed(() =>
  String(contactInfo.value.address || '').trim() ||
  factoryOverview.value.factory_address ||
  t('user.home.factoryAddressEmpty')
)

const overviewHighlights = computed(() => [
  {
    label: t('user.home.factoryName'),
    value: companyName.value,
    icon: Building2,
  },
  {
    label: t('user.home.factoryAddress'),
    value: factoryAddress.value,
    icon: MapPinned,
  },
  {
    label: t('user.home.factoryCapacity'),
    value: factoryOverview.value.production_capacity || t('user.home.factoryCapacityEmpty'),
    icon: Cog,
  },
])

const overviewGalleryImages = computed(() => {
  const imageMap = new Map()
  const rows = Array.isArray(payload.value?.factory_gallery) ? payload.value.factory_gallery : []

  rows
    .filter((item) => item?.is_active !== false && (item?.image_url || item?.url))
    .sort((left, right) => Number(left?.sort_order || 0) - Number(right?.sort_order || 0))
    .forEach((item, index) => {
      const normalizedUrl = resolveImageUrl(item?.image_url || item?.url || '')
      if (!normalizedUrl || imageMap.has(normalizedUrl)) return

      imageMap.set(normalizedUrl, {
        id: item?.id || `factory-${index + 1}`,
        image_url: item?.image_url || item?.url || '',
        title: item?.title || `${t('user.home.factoryImage')} ${index + 1}`,
        _preview_url: normalizedUrl,
      })
    })

  const items = Array.from(imageMap.values())
  if (items.length) return items.slice(0, 4)

  const fallback = resolveImageUrl(factoryOverview.value.main_image_url)
  return fallback
    ? [
        {
          id: 'factory-main',
          image_url: factoryOverview.value.main_image_url,
          title: t('user.home.factoryImage'),
          _preview_url: fallback,
        },
      ]
    : []
})

const overviewDisplayImage = computed(() => {
  const active = activeOverviewImage.value
  const activeInGallery = overviewGalleryImages.value.some((item) => item.image_url === active)
  if (active && activeInGallery) return active
  return overviewGalleryImages.value[0]?.image_url || factoryOverview.value.main_image_url || active || ''
})

const overviewMetricCards = computed(() => {
  const fallbackCards = [
    {
      value: '20,000',
      unit: 'm2',
      label: t('user.home.factoryArea'),
      icon: Building2,
    },
    {
      value: '500',
      unit: '',
      label: t('user.home.experiencedStaff'),
      icon: Users,
    },
  ]

  return fallbackCards.map((fallbackCard, index) => {
    const metric = factoryOverview.value.stats[index]
    const rawValue = String(metric?.value || '').trim()
    const numericMatch = rawValue.match(/^[\d.,]+\+?/)
    const unitMatch = rawValue.match(/(m²|m2|sqm|%)/i)

    if (!rawValue) return fallbackCard

    return {
      value: numericMatch?.[0] || fallbackCard.value,
      unit: unitMatch?.[0] || fallbackCard.unit,
      label: String(metric?.label || '').trim() || fallbackCard.label,
      icon: fallbackCard.icon,
    }
  })
})

const factoryMapLink = computed(() => {
  const directLink = String(contactInfo.value.google_map_url || '').trim()
  if (directLink) return directLink

  if (!factoryAddress.value) return 'https://www.google.com/maps'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(factoryAddress.value)}`
})

watch(
  overviewGalleryImages,
  (images) => {
    const active = activeOverviewImage.value
    const activeExists = images.some((item) => item.image_url === active)
    if (active && activeExists) return

    activeOverviewImage.value = images[0]?.image_url || String(factoryOverview.value.main_image_url || '').trim()
  },
  { immediate: true },
)

async function loadData() {
  loading.value = true
  try {
    payload.value = await getHonorsPageData()
  } catch {
    payload.value = null
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <section class="home-capability" ref="rootRef">
    <div class="stage capability-stage capability-stage--overview capability-stage--overview-refined home-reveal" :class="{ 'is-visible': isVisible }">
      <div class="capability-overview__media-shell" data-reveal-item>
        <div class="capability-overview__media capability-overview__media--refined">
          <img
            v-if="overviewDisplayImage"
            :src="resolveImageUrl(overviewDisplayImage)"
            :alt="factoryOverview.factory_name || t('user.home.factoryImageAlt')"
          />
          <div v-else class="capability-overview__placeholder">
            <span>{{ companyName.slice(0, 1) }}</span>
          </div>

          <div class="capability-overview__footer-card" v-if="overviewDisplayImage">
            <div class="capability-overview__footer-location">
              <div class="capability-overview__footer-icon">
                <MapPin :size="20" />
              </div>
              <div>
                <span>{{ t('user.home.factoryLocation') }}</span>
                <strong>{{ factoryAddress }}</strong>
              </div>
            </div>

            <a :href="factoryMapLink" class="capability-overview__footer-map" target="_blank" rel="noreferrer">
              <div class="capability-overview__footer-map-icon">
                <MapPinned :size="18" />
              </div>
              <span>{{ t('user.home.viewOnMap') }}</span>
            </a>
          </div>
        </div>

        <div v-if="overviewGalleryImages.length" class="capability-overview__thumb-grid">
          <button
            v-for="(item, index) in overviewGalleryImages.slice(0, 3)"
            :key="item.id || `${item.title}-${index}`"
            type="button"
            class="capability-overview__thumb-card"
            :class="{ 'capability-overview__thumb-card--active': item.image_url === overviewDisplayImage }"
            @click="activeOverviewImage = item.image_url"
          >
            <img :src="item._preview_url || resolveImageUrl(item.image_url)" :alt="item.title || `${t('user.home.factoryImage')} ${index + 1}`" />
          </button>
        </div>
      </div>

      <div class="capability-overview__content capability-overview__content--refined">
        <header class="capability-heading capability-heading--overview-refined" data-reveal-item>
          <span class="eyebrow">{{ t('user.home.factoryEyebrow') }}</span>
          <span class="capability-heading__accent"></span>
          <h2>{{ factoryOverview.title }}</h2>
          <p>{{ factoryOverview.description }}</p>
        </header>

        <div class="overview-highlights overview-highlights--refined" data-reveal-item>
          <article v-for="item in overviewHighlights" :key="item.label" class="overview-highlight overview-highlight--refined">
            <div class="overview-highlight__icon overview-highlight__icon--refined">
              <component :is="item.icon" :size="22" />
            </div>
            <div class="overview-highlight__body">
              <span class="overview-highlight__label">{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </article>
        </div>

        <div class="output-grid output-grid--light output-grid--overview-refined" data-reveal-item>
          <div v-for="(metric, index) in overviewMetricCards" :key="`${metric.label}-${index}`" class="output-card output-card--light output-card--overview-refined">
            <div class="output-card__icon-badge">
              <component :is="metric.icon" :size="22" />
            </div>
            <div class="output-card__content">
              <strong>
                {{ metric.value }}
                <small v-if="metric.unit">{{ metric.unit }}</small>
              </strong>
              <span>{{ metric.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-capability {
  padding: 40px 0 20px 0;
  background: #f3f3f5;
}

.capability-stage {
  width: min(900px, calc(100% - 68px));
  margin: 0 auto;
}

.capability-stage--overview {
  display: grid;
  gap: 24px;
}

.capability-stage--overview-refined {
  grid-template-columns: minmax(300px, 1fr) minmax(320px, 1fr);
  gap: 16px;
  align-items: start;
}

.capability-overview__media-shell {
  min-width: 0;
}

.capability-overview__media {
  position: relative;
  min-height: 395px;
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  box-shadow:
    0 32px 80px rgba(8, 5, 3, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);
}

.capability-overview__media--refined {
  min-height: 410px;
}

.capability-overview__media img,
.capability-overview__placeholder {
  width: 100%;
  height: 100%;
}

.capability-overview__media img {
  display: block;
  object-fit: cover;
}

.capability-overview__placeholder {
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.88);
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: clamp(4rem, 3rem + 4vw, 7rem);
}

.capability-overview__thumb-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
}

.capability-overview__thumb-card {
  position: relative;
  border: 0;
  padding: 0;
  border-radius: 10px;
  overflow: hidden;
  aspect-ratio: 1.18;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
  transition: transform 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease;
}

.capability-overview__thumb-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.14);
}

.capability-overview__thumb-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.capability-overview__thumb-card--active {
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.55);
}

.capability-overview__content {
  min-width: 0;
}

.capability-heading--overview-refined {
  margin-bottom: 12px;
}

.eyebrow {
  display: inline-block;
  margin-bottom: 8px;
  color: #c2410c;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.capability-heading__accent {
  display: block;
  width: 36px;
  height: 2px;
  border-radius: 999px;
  margin-bottom: 6px;
  background: linear-gradient(90deg, #f97316, #ef4444);
}

.capability-heading--overview-refined h2 {
  margin: 0;
  color: #0f172a;
  font-family: 'Manrope', 'Segoe UI', Arial, sans-serif;
  font-size: clamp(1.58rem, 1.4rem + 0.82vw, 2.2rem);
  line-height: 1.12;
  font-weight: 800;
}

.capability-heading--overview-refined p {
  margin: 10px 0 0;
  color: #0f2947;
  font-size: 12px;
  line-height: 1.56;
  max-width: 760px;
}

.overview-highlights {
  display: grid;
  gap: 10px;
  margin-bottom: 12px;
}

.overview-highlight {
  border-radius: 14px;
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.07);
}

.overview-highlight--refined {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  align-items: center;
  gap: 9px;
  padding: 10px 12px;
}

.overview-highlight__icon--refined {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  background: linear-gradient(180deg, rgba(254, 242, 242, 0.98), rgba(255, 255, 255, 0.98));
  border: 1px solid rgba(226, 232, 240, 0.96);
}

.overview-highlight__label {
  color: #4f6b8a;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.overview-highlight--refined strong {
  display: block;
  margin-top: 2px;
  color: #0b2045;
  font-size: 13px;
  line-height: 1.35;
  word-break: break-word;
}

.output-grid {
  display: grid;
  gap: 9px;
}

.output-grid--light {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.output-grid--overview-refined {
  max-width: 340px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.output-card {
  padding: 10px;
  border-radius: 14px;
  text-align: left;
}

.output-card--light {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
  border: 1px solid rgba(226, 232, 240, 0.96);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.07);
}

.output-card--overview-refined {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 78px;
}

.output-card__icon-badge {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #dc2626, #ef4444);
  color: #fff;
  box-shadow: 0 14px 26px rgba(220, 38, 38, 0.22);
}

.output-card strong {
  display: block;
  color: #0b2045;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: clamp(1.15rem, 0.98rem + 0.45vw, 1.42rem);
  line-height: 1.02;
  white-space: normal;
  word-break: break-word;
}

.output-card strong small {
  font-size: 0.5em;
  font-weight: 700;
}

.output-card span {
  display: block;
  margin-top: 4px;
  color: #4f6b8a;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  line-height: 1.45;
}

.capability-overview__footer-card {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.06), rgba(15, 23, 42, 0.88));
}

.capability-overview__footer-location {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.capability-overview__footer-icon,
.capability-overview__footer-map-icon {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.capability-overview__footer-icon {
  background: linear-gradient(135deg, #dc2626, #ef4444);
  color: #fff;
  box-shadow: 0 12px 24px rgba(220, 38, 38, 0.24);
}

.capability-overview__footer-location span {
  display: block;
  margin-bottom: 4px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.capability-overview__footer-location strong {
  display: block;
  color: #fff;
  font-size: 12px;
  line-height: 1.35;
  word-break: break-word;
}

.capability-overview__footer-map {
  min-width: 128px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  color: #0f172a;
  text-decoration: none;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.18);
}

.capability-overview__footer-map-icon {
  width: 24px;
  height: 24px;
  background: rgba(254, 242, 242, 0.96);
  color: #dc2626;
}

.capability-overview__footer-map span {
  font-size: 10px;
  font-weight: 800;
}

@media (max-width: 1199px) {
  .capability-stage--overview-refined {
    grid-template-columns: 1fr;
  }

  .capability-overview__media,
  .capability-overview__media--refined {
    min-height: 420px;
  }
}

@media (max-width: 991px) {
  .output-grid--light,
  .output-grid--overview-refined,
  .overview-highlights {
    grid-template-columns: 1fr;
  }

  .capability-overview__media,
  .capability-overview__media--refined {
    min-height: 340px;
  }

  .capability-overview__footer-card {
    flex-direction: column;
    align-items: stretch;
  }

  .capability-overview__footer-map {
    min-width: 0;
  }
}

@media (max-width: 767px) {
  .home-capability {
    padding: 48px 0;
  }

  .capability-stage {
    width: calc(100% - 24px);
  }

  .capability-heading--overview-refined h2 {
    font-size: clamp(2rem, 1.5rem + 2vw, 2.8rem);
  }

  .capability-heading--overview-refined p {
    font-size: 14px;
  }

  .capability-overview__media,
  .capability-overview__media--refined {
    min-height: 340px;
    border-radius: 24px;
  }

  .capability-overview__footer-card {
    padding: 14px;
    gap: 12px;
  }

  .capability-overview__footer-location {
    align-items: flex-start;
  }

  .capability-overview__footer-icon,
  .capability-overview__footer-map-icon {
    width: 42px;
    height: 42px;
  }

  .capability-overview__footer-location strong {
    font-size: 14px;
  }

  .overview-highlight--refined,
  .output-card--overview-refined {
    grid-template-columns: 1fr;
  }

  .overview-highlight__icon--refined,
  .output-card__icon-badge {
    width: 48px;
    height: 48px;
  }
}
</style>
