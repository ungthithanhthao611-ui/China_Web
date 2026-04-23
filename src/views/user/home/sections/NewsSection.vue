<script setup>
import { onMounted, ref } from 'vue'
import { getNewsList } from '@/views/user/services/publicApi'
import { useRouter } from 'vue-router'
import { ArrowRight, ChevronRight } from 'lucide-vue-next'

defineProps({
  active: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const newsList = ref([])
const loading = ref(true)

const formatDate = (dateStr) => {
  if (!dateStr) return { day: '', month: '', year: '' }
  const d = new Date(dateStr)
  return {
    day: d.getDate().toString().padStart(2, '0'),
    month: d.toLocaleString('en-US', { month: 'long' }),
    year: d.getFullYear().toString()
  }
}

const goTo = (path) => {
  if (path) router.push(path)
}

const fetchNews = async () => {
  try {
    const res = await getNewsList({ skip: 0, limit: 4 })
    const items = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : [])
    
    newsList.value = items.map(item => {
      const dateParts = formatDate(item.published_at || item.created_at)
      return {
        ...item,
        ...dateParts,
        image: item.thumbnail_url || item.image?.url || item.image || '',
        link: `/news/${item.slug}`
      }
    })
  } catch (error) {
    console.error('Failed to fetch news for home:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchNews()
})
</script>

<template>
  <section class="news-section" :class="{ 'is-active': active }">
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
    </div>

    <div class="container main-content">
      <header class="section-header" :class="{ 'is-active': active }">
        <div class="title-group">
          <span class="eyebrow">Latest Updates</span>
          <h2 class="fnt-serif">Trung Tâm Tin Tức</h2>
          <div class="title-line"></div>
        </div>
        
        <button class="view-all-link" @click="goTo('/news')">
          <span>Xem tất cả tin tức</span>
          <div class="icon-box">
            <ChevronRight :size="18" />
          </div>
        </button>
      </header>

      <div v-if="newsList.length > 0" class="news-grid-modern" :class="{ 'is-active': active }">
        <div 
          v-for="(item, index) in newsList" 
          :key="item.id" 
          class="news-card-col"
          :style="{ transitionDelay: `${0.2 + index * 0.1}s` }"
        >
          <article class="news-card-premium" @click="goTo(item.link)">
            <div class="card-media">
              <img :src="item.image" :alt="item.title" loading="lazy">
              <div class="media-overlay"></div>
              <div class="date-tag">
                <span class="day">{{ item.day }}</span>
                <span class="month">{{ item.month }}</span>
              </div>
            </div>
            <div class="card-body">
              <h3 class="card-title">{{ item.title }}</h3>
              <div class="card-action">
                <span class="action-text">Xem chi tiết</span>
                <div class="action-line"></div>
                <ArrowRight :size="16" class="action-icon" />
              </div>
            </div>
          </article>
        </div>
      </div>

      <div v-else-if="!loading" class="news-empty-modern">
        <div class="empty-content">
          <p>Hiện tại chưa có tin tức mới nào.</p>
          <button @click="goTo('/news')" class="btn-minimal">Truy cập trung tâm tin tức</button>
        </div>
      </div>
      
      <div v-else class="news-loading-modern">
        <div class="loading-shimmer"></div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/variables" as *;

.news-section {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #ffffff;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.bg-decoration {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  
  .circle {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.05;
  }
  
  .circle-1 {
    top: -10%;
    right: -10%;
    width: 600px;
    height: 600px;
    background: #cd0000;
  }
  
  .circle-2 {
    bottom: -10%;
    left: -10%;
    width: 500px;
    height: 500px;
    background: #10243c;
  }
}

.main-content {
  position: relative;
  z-index: 10;
  padding: 0 40px;
  width: 90%;
  max-width: 1600px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 60px;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s cubic-bezier(0.19, 1, 0.22, 1);

  &.is-active {
    opacity: 1;
    transform: translateY(0);
  }

  .eyebrow {
    display: block;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: #cd0000;
    margin-bottom: 12px;
    font-weight: 600;
  }

  h2 {
    font-size: clamp(2.2rem, 3.5vw, 3.2rem);
    color: #1a1a1a;
    line-height: 1.1;
  }

  .title-line {
    width: 80px;
    height: 3px;
    background: #cd0000;
    margin-top: 20px;
  }
}

.view-all-link {
  display: flex;
  align-items: center;
  gap: 15px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  color: #666;
  font-weight: 500;
  transition: color 0.3s ease;

  span {
    font-size: 1rem;
    border-bottom: 1px solid transparent;
    padding-bottom: 2px;
  }

  .icon-box {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.4s ease;
  }

  &:hover {
    color: #cd0000;
    
    .icon-box {
      background: #cd0000;
      color: #fff;
      transform: translateX(5px);
    }
  }
}

.news-grid-modern {
  display: flex;
  gap: 30px;
  justify-content: center;
  
  &.is-active .news-card-col {
    opacity: 1;
    transform: translateY(0);
  }
}

.news-card-col {
  flex: 1;
  max-width: 400px;
  opacity: 0;
  transform: translateY(40px);
  transition: all 0.8s cubic-bezier(0.19, 1, 0.22, 1);
}

.news-card-premium {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(0,0,0,0.04);
  transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-12px);
    box-shadow: 0 20px 50px rgba(0,0,0,0.1);

    .card-media img {
      transform: scale(1.1);
    }
    
    .action-text {
      color: #cd0000;
    }
    
    .action-line {
      width: 40px;
      background: #cd0000;
    }
    
    .action-icon {
      transform: translateX(5px);
      color: #cd0000;
    }
  }
}

.card-media {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 1.2s cubic-bezier(0.19, 1, 0.22, 1);
  }

  .media-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.3) 100%);
  }

  .date-tag {
    position: absolute;
    top: 20px;
    left: 20px;
    background: #fff;
    padding: 8px 15px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);

    .day {
      font-size: 1.4rem;
      font-weight: 700;
      color: #cd0000;
      line-height: 1;
    }

    .month {
      font-size: 0.7rem;
      text-transform: uppercase;
      font-weight: 600;
      color: #999;
      margin-top: 2px;
    }
  }
}

.card-body {
  padding: 30px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 1.25rem;
  color: #1a1a1a;
  line-height: 1.5;
  margin-bottom: 25px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-weight: 600;
  flex: 1;
}

.card-action {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .action-text {
    font-size: 0.85rem;
    font-weight: 600;
    color: #999;
    transition: color 0.3s ease;
  }

  .action-line {
    width: 20px;
    height: 1px;
    background: #ddd;
    transition: all 0.3s ease;
  }

  .action-icon {
    color: #ddd;
    transition: all 0.3s ease;
  }
}

.news-empty-modern,
.news-loading-modern {
  width: 100%;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-content {
  p {
    font-size: 1.2rem;
    color: #999;
    margin-bottom: 20px;
  }
}

.btn-minimal {
  background: #cd0000;
  color: #fff;
  border: none;
  padding: 12px 30px;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #a30000;
    transform: translateY(-2px);
  }
}

.loading-shimmer {
  width: 100%;
  max-width: 1200px;
  height: 400px;
  background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 12px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 1200px) {
  .news-grid-modern {
    gap: 20px;
  }
}

@media (max-width: 992px) {
  .news-section {
    height: auto;
    padding: 80px 0;
  }

  .news-grid-modern {
    flex-direction: column;
    align-items: center;
  }

  .news-card-col {
    width: 100%;
    max-width: 500px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    
    .view-all-link {
      width: 100%;
      justify-content: space-between;
    }
  }
}
</style>
