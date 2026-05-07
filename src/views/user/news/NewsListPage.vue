<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import AOS from "aos";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { uiState } from "@/shared/utils/uiState";
import { getBanners, getNewsList } from "@/views/user/services/publicApi";
import { newsHero } from "./data/newsData";

const { locale, t } = useI18n({ useScope: 'global' });
const pageSize = 6;
const currentPage = ref(1);

const items = ref([]);
const dynamicBanner = ref(null);
const total = ref(0);
const loading = ref(false);
const error = ref(null);

const bannerImage = computed(() => dynamicBanner.value?.image?.url || newsHero.bannerImage);

const displayTotalPages = computed(() =>
  Math.max(1, Math.ceil(total.value / pageSize)),
);

const imageUrl = (item) =>
  item?.thumbnail_url || item?.image?.url || item?.image || "";

const paginationItems = computed(() => {
  const total = displayTotalPages.value;
  const current = currentPage.value;

  if (total <= 6) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, "ellipsis-end", total];
  }

  if (current >= total - 3) {
    return [1, "ellipsis-start", total - 3, total - 2, total - 1, total];
  }

  return [
    1,
    "ellipsis-start",
    current - 1,
    current,
    current + 1,
    "ellipsis-end",
    total,
  ];
});

const formatDate = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale.value === 'vi' ? 'vi-VN' : 'en-US', {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
};

function normalizeNewsItem(item = {}) {
  return {
    ...item,
    content_html: item?.content_html || item?.content || "",
    body: item?.body || item?.content || "",
  };
}

async function fetchBanner() {
  try {
    const res = await getBanners({ placement: "news" });
    if (res?.items?.length) {
      dynamicBanner.value = res.items[0];
    }
  } catch (err) {
    console.error("Failed to fetch news banner:", err);
  }
}

async function fetchPage() {
  loading.value = true;
  error.value = null;

  try {
    const skip = (currentPage.value - 1) * pageSize;
    const res = await getNewsList({ skip, limit: pageSize });
    items.value = Array.isArray(res?.items)
      ? res.items.map(normalizeNewsItem)
      : [];
    total.value = Number(res?.total || 0);
  } catch (err) {
    error.value = err?.message || t('user.news.errorLoadFailed')
    items.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

const refreshAnimations = async () => {
  await nextTick();
  AOS.refreshHard();
};

const goToPage = async (page) => {
  if (page < 1 || page > displayTotalPages.value || page === currentPage.value)
    return;
  currentPage.value = page;
  await fetchPage();
  window.scrollTo({ top: 300, behavior: "smooth" });
  await refreshAnimations();
};

watch(locale, async () => {
  await Promise.all([fetchBanner(), fetchPage()]);
  await refreshAnimations();
});

onMounted(async () => {
  uiState.isHeaderHovered = false;
  uiState.isFooterHidden = false;
  await Promise.all([fetchBanner(), fetchPage()]);
  await refreshAnimations();
});

onBeforeUnmount(() => {
  uiState.isHeaderHidden = false;
});
</script>

<template>
  <div class="news-page-wrapper">
    <!-- 1. Banner Section -->
    <section class="news-banner" :style="{ backgroundImage: `url(${bannerImage})` }">
      <div class="banner-overlay"></div>
      <div class="banner-content container">
        <div class="breadcrumb" data-aos="fade-down">
          <router-link to="/">{{ t('user.home.home') || 'Trang chủ' }}</router-link>
          <span class="separator">/</span>
          <span class="current">{{ t('user.home.news') || 'Tin tức' }}</span>
        </div>
      </div>
    </section>

    <!-- 2. News List Section -->
    <section class="news-list-section">
      <div class="container">
        <!-- Status Messages -->
        <div v-if="loading" class="status-box">
          <div class="loader"></div>
          <p>{{ t('user.news.loading') || 'Đang tải tin tức...' }}</p>
        </div>

        <div v-else-if="error" class="status-box status-box--error">
          <p>{{ error }}</p>
        </div>

        <!-- News Grid -->
        <div v-else class="news-grid">
          <article
            v-for="(item, index) in items"
            :key="item.slug"
            class="news-card"
            data-aos="fade-up"
            :data-aos-delay="index * 150"
            data-aos-duration="1000"
            data-aos-offset="50"
          >
            <router-link :to="`/news/${item.slug}`" class="card-image">
              <img :src="imageUrl(item)" :alt="item.title" loading="lazy" />
            </router-link>

            <div class="card-body">
              <span class="card-date">{{ formatDate(item.published_at || item.created_at) }}</span>
              <router-link :to="`/news/${item.slug}`" class="card-title">
                {{ item.title }}
              </router-link>
              <p class="card-summary">{{ item.summary }}</p>
              <router-link :to="`/news/${item.slug}`" class="btn-read-more">
                {{ t('user.news.readMore') || 'Xem chi tiết' }}
                <ChevronRight :size="16" />
              </router-link>
            </div>
          </article>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && !items.length && !error" class="status-box">
          <p>{{ t('user.news.empty') || 'Hiện chưa có tin tức nào.' }}</p>
        </div>

        <!-- 3. Pagination -->
        <div v-if="displayTotalPages > 1" class="pagination" data-aos="fade-up">
          <button
            type="button"
            class="pag-btn"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            <ChevronLeft :size="20" />
          </button>

          <div class="pag-numbers">
            <template v-for="item in paginationItems" :key="`page-${item}`">
              <span v-if="typeof item === 'string'" class="pag-dots">...</span>
              <button
                v-else
                type="button"
                :class="['pag-num', { active: currentPage === item }]"
                @click="goToPage(item)"
              >
                {{ item }}
              </button>
            </template>
          </div>

          <button
            type="button"
            class="pag-btn"
            :disabled="currentPage === displayTotalPages"
            @click="goToPage(currentPage + 1)"
          >
            <ChevronRight :size="20" />
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.news-page-wrapper {
  width: 100%;
  overflow-x: hidden;
  background: #fff;
  min-height: 100vh;
}

.container {
  width: min(100% - 48px, 1280px);
  margin: 0 auto;
}

/* 1. Banner Section */
.news-banner {
  position: relative;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: #fff;
  padding-top: 60px;

  .banner-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 1;
  }

  .banner-content {
    position: relative;
    z-index: 2;
    text-align: center;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;

    a {
      color: #fff;
      text-decoration: none;
      transition: opacity 0.2s;
      &:hover { opacity: 0.7; }
    }
    .separator { opacity: 0.6; }
    .current { color: #df0019; }
  }
}

/* 2. News List Section */
.news-list-section {
  padding: 80px 0 100px;
  background: #f8fafc;
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 32px;
}

/* Card Styling */
.news-card {
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
  transition: all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
  display: flex;
  flex-direction: column;
  height: 100%;

  &:hover {
    transform: translateY(-12px) scale(1.02);
    box-shadow: 0 30px 60px rgba(15, 23, 42, 0.12);
    border-color: rgba(223, 0, 25, 0.2);
  }

  .card-image {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 10;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.8s cubic-bezier(0.165, 0.84, 0.44, 1);
    }
  }

  &:hover .card-image img {
    transform: scale(1.1);
  }

  .card-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .card-date {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .card-title {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.4;
    margin-bottom: 12px;
    text-decoration: none;
    transition: color 0.3s ease;

    &:hover {
      color: #df0019;
    }
  }

  .card-summary {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: 15px;
    color: #475569;
    line-height: 1.6;
    margin-bottom: 20px;
  }

  .btn-read-more {
    margin-top: auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #df0019;
    font-weight: 700;
    font-size: 14px;
    text-decoration: none;
    transition: all 0.3s ease;

    &:hover {
      gap: 12px;
      letter-spacing: 0.5px;
    }
  }
}

/* 3. Pagination */
.pagination {
  margin-top: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;

  .pag-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid #e2e8f0;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      background: #f1f5f9;
      border-color: #df0019;
      color: #df0019;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  .pag-numbers {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pag-num {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid transparent;
    background: transparent;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;

    &:hover { background: #f1f5f9; }

    &.active {
      background: #df0019;
      color: #fff;
    }
  }

  .pag-dots { color: #94a3b8; }
}

/* Status Messages */
.status-box {
  text-align: center;
  padding: 60px 0;
  p { color: #64748b; font-size: 16px; }

  .loader {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #df0019;
    border-radius: 50%;
    margin: 0 auto 20px;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Styles */
@media (max-width: 1024px) {
  .news-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
  }
  .news-banner { min-height: 240px; }
}

@media (max-width: 640px) {
  .news-banner {
    min-height: 180px;
    padding-top: 40px;
  }
  .news-list-section { padding: 48px 0 64px; }
  .news-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .pagination {
    gap: 8px;
    .pag-btn, .pag-num { width: 38px; height: 38px; font-size: 14px; }
  }
}
</style>
