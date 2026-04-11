<script setup>
import { ref, markRaw } from 'vue'
import { ChevronDown, ChevronUp, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-vue-next'

// Import các component động
import StarHotel from './StarHotel.vue'
import DesignWorks from './DesignWorks.vue'
import TerminalSpace from './TerminalSpace.vue'
import CoboPavilion from './CoboPavilion.vue'
// ... các hạng mục khác mặc định dùng chung layout gallery

const isSidebarOpen = ref(true)
const activeMainCat = ref('star-hotel')
const activeSubItem = ref(null)
const expandedCats = ref(['star-hotel']) // Những mục đang mở rộng

const categories = [
  { id: 'all', name: 'All', comp: markRaw(StarHotel) },
  { 
    id: 'design-works', 
    name: 'Design Works', 
    comp: markRaw(DesignWorks),
    children: ['CONCEPT DESIGN', 'INTERIOR DESIGN', 'SOFT DECORATION']
  },
  { 
    id: 'star-hotel', 
    name: 'Star Hotel', 
    comp: markRaw(StarHotel),
    children: ['W HOTEL', 'BEIJING HOTEL', 'STATE GUEST HOUSE', 'BEIJING MARRIOTT', 'INTERCONTINENTAL']
  },
  { 
    id: 'terminal-space', 
    name: 'Terminal Space', 
    comp: markRaw(TerminalSpace),
    children: ['AIRPORT T3', 'METRO LINE 1']
  },
  { 
    id: 'cobo-pavilion', 
    name: 'Cobo Pavilion', 
    comp: markRaw(CoboPavilion),
    children: []
  }
]

const currentComponent = ref(markRaw(StarHotel))

const toggleCat = (catId) => {
  if (expandedCats.value.includes(catId)) {
    expandedCats.value = expandedCats.value.filter(id => id !== catId)
  } else {
    expandedCats.value.push(catId)
  }
}

const selectCategory = (cat) => {
  activeMainCat.value = cat.id
  activeSubItem.value = null
  if (cat.comp) currentComponent.value = cat.comp
}

const selectSubItem = (catId, subName) => {
  activeMainCat.value = catId
  activeSubItem.value = subName
}
</script>

<template>
  <div class="project-case-page" :class="{ 'sidebar-collapsed': !isSidebarOpen }">
    <!-- Sidebar bên trái (Đúng mẫu ảnh) -->
    <aside class="project-sidebar">
      <div class="sidebar-scroll-area">
        <div 
          v-for="cat in categories" 
          :key="cat.id" 
          class="nav-group"
          :class="{ 'is-active': activeMainCat === cat.id && !activeSubItem, 'is-expanded': expandedCats.includes(cat.id) }"
        >
          <div class="main-link" @click="selectCategory(cat)">
            <span class="name">{{ cat.name }}</span>
            <div v-if="cat.children && cat.children.length" class="plus-minus" @click.stop="toggleCat(cat.id)">
              <Plus v-if="!expandedCats.includes(cat.id)" :size="16" />
              <Minus v-else :size="16" />
            </div>
          </div>
          
          <transition name="expand">
            <div v-if="cat.children && cat.children.length && expandedCats.includes(cat.id)" class="sub-links">
              <div 
                v-for="sub in cat.children" 
                :key="sub" 
                class="sub-link"
                :class="{ 'active': activeSubItem === sub }"
                @click="selectSubItem(cat.id, sub)"
              >
                {{ sub }}
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- Điều hướng lên xuống dưới cùng sidebar -->
      <div class="sidebar-footer">
        <button class="arrow-btn"><ChevronUp :size="24" /></button>
        <button class="arrow-btn"><ChevronDown :size="24" /></button>
      </div>

      <!-- Nút Toggle Sidebar (Mũi tên đỏ) -->
      <button class="sidebar-toggle" @click="isSidebarOpen = !isSidebarOpen">
        <ChevronLeft v-if="isSidebarOpen" :size="20" />
        <ChevronRight v-else :size="20" />
      </button>
    </aside>

    <!-- Nội dung chính bên phải -->
    <main class="project-main">
      <div class="project-content">
        <header class="content-header">
           <h1 class="fnt-serif">{{ activeMainCat.toUpperCase().replace('-', ' ') }}</h1>
           <p v-if="activeSubItem" class="sub-title">/ {{ activeSubItem }}</p>
        </header>

        <transition name="fade-slide" mode="out-in">
          <component :is="currentComponent" :key="activeMainCat + activeSubItem" />
        </transition>
      </div>
    </main>

    <!-- Thanh Menu dưới (Giữ lại từ bước trước) -->
    <nav class="project-nav-bottom">
      <div 
        v-for="cat in categories.filter(c => c.id !== 'all')" 
        :key="cat.id"
        class="nav-item"
        :class="{ 'active': activeMainCat === cat.id }"
        @click="selectCategory(cat)"
      >
        {{ cat.name }}
      </div>
    </nav>
  </div>
</template>

<style lang="scss" scoped>
.project-case-page {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  background: #fff;
  transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}

// Sidebar Styles
.project-sidebar {
  width: 280px;
  height: 100%;
  background: #2a333c;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 100;
  transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);

  .sidebar-scroll-area {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }

  .nav-group {
    border-bottom: 1px solid rgba(255,255,255,0.05);
    
    .main-link {
      padding: 22px 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      color: #fff;
      font-size: 15px;
      transition: all 0.3s ease;

      .plus-minus {
        display: flex;
        align-items: center;
        opacity: 0.6;
        &:hover { opacity: 1; }
      }
    }

    &.is-active .main-link {
      background: #da1b2b;
    }

    &.is-expanded {
      .main-link { background: #da1b2b; }
    }
  }

  .sub-links {
    background: #da1b2b;
    padding-bottom: 15px;
    .sub-link {
      padding: 10px 40px;
      color: rgba(255,255,255,0.7);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      &:hover, &.active { color: #fff; }
    }
  }

  .sidebar-footer {
    height: 70px;
    background: #1a222a;
    display: flex;
    justify-content: center;
    gap: 40px;
    align-items: center;
    .arrow-btn {
      background: none;
      border: none;
      color: #fff;
      cursor: pointer;
      opacity: 0.5;
      &:hover { opacity: 1; }
    }
  }

  .sidebar-toggle {
    position: absolute;
    right: -25px;
    top: 50%;
    transform: translateY(-50%);
    width: 25px;
    height: 60px;
    background: #da1b2b;
    border: none;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0 4px 4px 0;
  }
}

// Collapsed Sidebar
.sidebar-collapsed {
  .project-sidebar {
    transform: translateX(-280px);
    width: 0;
  }
  .project-main {
    margin-left: 0;
  }
}

// Main Content area
.project-main {
  flex: 1;
  overflow-y: auto;
  padding: 60px 5%;
  background: #fdfdfd;

  .content-header {
    margin-bottom: 40px;
    display: flex;
    align-items: baseline;
    gap: 15px;
    h1 { font-size: 38px; color: #222; }
    .sub-title { font-size: 20px; color: #da1b2b; }
  }
}

// Bottom Nav
.project-nav-bottom {
  position: absolute;
  bottom: 0;
  right: 0;
  width: calc(100% - 280px);
  height: 60px;
  background: #2a333c;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  transition: width 0.5s cubic-bezier(0.19, 1, 0.22, 1);

  .nav-item {
    padding: 0 20px;
    color: #fff;
    font-size: 13px;
    cursor: pointer;
    transition: 0.3s;
    height: 100%;
    display: flex;
    align-items: center;
    &.active { background: #da1b2b; }
    &:hover:not(.active) { background: rgba(255,255,255,0.05); }
  }
}

.sidebar-collapsed .project-nav-bottom {
  width: 100%;
}

// Transitions
.expand-enter-active, .expand-leave-active { transition: all 0.3s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { height: 0; opacity: 0; }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.4s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(20px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-20px); }

@media (max-width: 1024px) {
  .project-sidebar { position: fixed; height: 100%; }
  .project-nav-bottom { width: 100%; overflow-x: auto; justify-content: flex-start; }
}
</style>
