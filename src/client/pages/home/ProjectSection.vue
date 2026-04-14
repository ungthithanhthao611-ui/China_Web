<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  }
})

const projects = [
  { 
    id: 1, 
    title: 'Yangzhou State Guest House Building 8 (Fufang Garden)', 
    award: 'China Building Decoration Engineering Award (Design)',
    images: [
      'https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/fee0cab9-edf6-422a-867b-23c2c7c4d06c.jpg',
      'https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/7b5ef27e-8ad6-4ae4-b0d5-33ae1fc37f06.jpg'
    ]
  },
  { 
    id: 2, 
    title: 'Wyndham Garden Nanchang Downing', 
    award: 'Huading Award Gold Award in the Hotel Design Category',
    images: [
      'https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/be4142ce-2b55-4557-b169-bcc8e1066fe1.jpg',
      'https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/37dd09ce-118a-4bde-8d12-d243ff7cb5c7.jpg'
    ]
  },
  { 
    id: 3, 
    title: 'Linyi Grand Theater', 
    award: 'China Building Decoration Engineering Award',
    images: [
      'https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/2f991952-d521-4b59-98b2-f3836138a062.jpg'
    ]
  },
  { 
    id: 4, 
    title: 'Kunming Changshui International Airport', 
    award: 'World Architecture Festival China Annual Public Jury Award',
    images: [
      'https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/081871d2-673f-49f3-8ac3-f4e4df366d82.jpg',
      'https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/a3c8cbc9-8b13-4728-adc9-3fc46db9bc4e.jpg'
    ]
  }
]

const activeIndex = ref(0)
const currentImgIndices = ref(projects.map(() => 0))
let timer = null

const startAutoPlay = () => {
  if (timer) return
  timer = setInterval(() => {
    const proj = projects[activeIndex.value]
    if (proj.images.length > 1) {
      currentImgIndices.value[activeIndex.value] = (currentImgIndices.value[activeIndex.value] + 1) % proj.images.length
    }
  }, 4000)
}

const stopAutoPlay = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const resetTimer = () => {
  if (props.active) {
    stopAutoPlay()
    startAutoPlay()
  }
}

const nextImage = () => {
  const proj = projects[activeIndex.value]
  if (proj.images.length <= 1) return
  currentImgIndices.value[activeIndex.value] = (currentImgIndices.value[activeIndex.value] + 1) % proj.images.length
  resetTimer()
}

const prevImage = () => {
  const proj = projects[activeIndex.value]
  if (proj.images.length <= 1) return
  currentImgIndices.value[activeIndex.value] = (currentImgIndices.value[activeIndex.value] - 1 + proj.images.length) % proj.images.length
  resetTimer()
}

const selectProject = (index) => {
  activeIndex.value = index
  resetTimer()
}

watch(() => props.active, (newVal) => {
  if (newVal) {
    startAutoPlay()
  } else {
    stopAutoPlay()
  }
})

onMounted(() => {
  if (props.active) startAutoPlay()
})

onUnmounted(() => {
  stopAutoPlay()
})
</script>

<template>
  <div class="section page4" :class="{ 'is-active': active }">
    
    <!-- 1) RED HEADER (Top Right) -->
    <div class="top-red-block slide-right-red">
      <a class="more-btn" :class="{ 'reveal-anim': active }" href="javascript:;">
        <div class="icon-circle">
          <svg viewBox="0 0 1024 1024" width="16" height="16">
            <path d="M312.888889 995.555556c-17.066667 0-28.444444-5.688889-39.822222-17.066667-22.755556-22.755556-17.066667-56.888889 5.688889-79.644445l364.088888-329.955555c11.377778-11.377778 17.066667-22.755556 17.066667-34.133333 0-11.377778-5.688889-22.755556-17.066667-34.133334L273.066667 187.733333c-22.755556-22.755556-28.444444-56.888889-5.688889-79.644444 22.755556-22.755556 56.888889-28.444444 79.644444-5.688889l364.088889 312.888889c34.133333 28.444444 56.888889 73.955556 56.888889 119.466667s-17.066667 85.333333-51.2 119.466666l-364.088889 329.955556c-11.377778 5.688889-28.444444 11.377778-39.822222 11.377778z" fill="#cd0000"></path>
          </svg>
        </div>
        <span class="fnt-14 uppercase">MORE +</span>
      </a>
    </div>

    <!-- 2) VERTICAL TEXT FLOAT (Far Left) -->
    <div class="vertical-text-float" :class="{ 'reveal-anim': active }">
       <div class="red-dot"></div>
       <div class="red-line line-top"></div>
       <div class="v-text-box">{{ projects[activeIndex].award }}</div>
       <div class="red-line line-bottom"></div>
       <div class="red-dot"></div>
    </div>

    <!-- 3) MAIN LAYOUT (Aligned to 1600px Grid Left edge, Bleeds Right) -->
    <div class="main-layout">
       
       <!-- TOP ROW: TITLE -->
       <div class="title-area">
          <div class="tit-box" :class="{ 'reveal-anim': active }">
             <div class="tit-content">
                <span class="fnt-36">PROJECT CASE</span>
                <img src="https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/012ad584-f3a1-4ceb-a342-1936a1bf6ff2.png" class="stamp-ic" alt=""/>
             </div>
             <div class="tit-line"></div>
          </div>
       </div>

       <!-- BOTTOM ROW: SLIDER -->
       <div class="slider-area" :class="{ 'reveal-right': active }">
          
          <transition-group name="fade" tag="div" class="image-wrapper">
             <img 
               v-for="(img, idx) in projects[activeIndex].images" 
               :key="img" 
               v-show="idx === currentImgIndices[activeIndex]" 
               :src="img" 
               class="full-image" 
               alt=""
             />
          </transition-group>

          <!-- Arrows -->
          <div class="arrow-btn prev" @click.stop="prevImage" v-if="projects[activeIndex].images.length > 1">
             <svg viewBox="0 0 1024 1024"><path d="M711.111111 995.555556c17.066667 0 28.444444-5.688889 39.822222-17.066667 22.755556-22.755556 17.066667-56.888889-5.688889-79.644445l-364.088888-329.955555c-11.377778-11.377778-17.066667-22.755556-17.066667-34.133333 0-11.377778 5.688889-22.755556 17.066667-34.133334L750.933333 187.733333c22.755556-22.755556 28.444444-56.888889 5.688889-79.644444-22.755556-22.755556-56.888889-28.444444-79.644444-5.688889l-364.088889 312.888889c-34.133333 28.444444-56.888889 73.955556-56.888889 119.466667s17.066667 85.333333 51.2 119.466666l364.088889 329.955556c11.377778 5.688889 28.444444 11.377778 39.822222 11.377778z" fill="#fff"></path></svg>
          </div>
          <div class="arrow-btn next" @click.stop="nextImage" v-if="projects[activeIndex].images.length > 1">
             <svg viewBox="0 0 1024 1024"><path d="M312.888889 995.555556c-17.066667 0-28.444444-5.688889-39.822222-17.066667-22.755556-22.755556-17.066667-56.888889 5.688889-79.644445l364.088888-329.955555c11.377778-11.377778 17.066667-22.755556 17.066667-34.133333 0-11.377778-5.688889-22.755556-17.066667-34.133334L273.066667 187.733333c-22.755556-22.755556-28.444444-56.888889-5.688889-79.644444 22.755556-22.755556 56.888889-28.444444 79.644444-5.688889l364.088889 312.888889c34.133333 28.444444 56.888889 73.955556 56.888889 119.466667s-17.066667 85.333333-51.2 119.466666l-364.088889 329.955556c-11.377778 5.688889-28.444444 11.377778-39.822222 11.377778z" fill="#fff"></path></svg>
          </div>

          <!-- Bottom Tabs -->
          <div class="bottom-nav">
             <div 
               v-for="(p, i) in projects" 
               :key="p.id" 
               class="nav-tab" 
               :class="{ 'active-tab': activeIndex === i }"
               @click="selectProject(i)"
             >
               <span class="tab-text">{{ p.title }}</span>
             </div>
          </div>
       </div>

    </div>
  </div>
</template>

<style scoped>
/* ====================
   GLOBAL CONTAINER
   ==================== */
.page4 {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #f2f2f2;
  overflow: hidden;
}

/* ====================
   TOP RIGHT RED BLOCK
   ==================== */
.top-red-block {
  position: absolute;
  top: 0;
  right: 0;
  width: 38%;
  height: 20%;
  background: url('https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/442e1fd6-c07a-4e7b-99b0-b9cccb231a03.jpeg') center/cover;
  background-color: #cd0000;
  display: flex;
  align-items: center;
  padding-left: 5%;
  z-index: 5;
}

.more-btn {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 15px;
  text-decoration: none;
  color: #fff;
  transition: opacity 0.3s;
}
.more-btn:hover { opacity: 0.8; }

.icon-circle {
  width: 36px;
  height: 36px;
  background-color: #fff;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.4s ease;
}
.more-btn:hover .icon-circle {
  transform: translateX(4px);
}

.icon-circle svg path {
  fill: #cd0000;
}

.fnt-14 {
  font-size: 13px;
  letter-spacing: 1px;
}
.uppercase { text-transform: uppercase; }

/* ====================
   FAR LEFT VERTICAL TEXT
   ==================== */
.vertical-text-float {
  position: absolute;
  top: 20%;
  bottom: 15%; 
  left: 54px; /* Align with nav numbers */
  width: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 15;
}

.red-dot {
  width: 4px;
  height: 4px;
  background-color: #c9000a;
  border-radius: 50%;
  flex-shrink: 0;
}

.red-line {
  width: 1px;
  background-color: #c9000a;
}
.line-top { flex: 1; margin-bottom: 20px; max-height: 80px; }
.line-bottom { flex: 1.5; margin-top: 20px; }

.v-text-box {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  font-size: 13px;
  color: #333;
  letter-spacing: 2px;
  white-space: nowrap;
}

/* ====================
   MAIN LAYOUT (Title + Slider)
   ==================== */
.main-layout {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 140px; /* Leave space for vertical text */
  display: flex;
  flex-direction: column;
  z-index: 10;
}

/* Title Area takes the Top 20% */
.title-area {
  height: 20%;
  display: flex;
  align-items: center;
}

.tit-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tit-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.fnt-36 {
  font-family: inherit;
  font-size: 36px;
  font-weight: 500;
  color: #222;
  letter-spacing: 1.5px;
}

.stamp-ic { height: 28px; }

.tit-line {
  width: 180px;
  height: 1px;
  background-color: #c9000a;
}

/* Slider Area takes the remaining 80% */
.slider-area {
  flex: 1;
  position: relative;
  background: #000;
  overflow: hidden;
  box-shadow: -20px 20px 60px rgba(0,0,0,0.15);
}

.image-wrapper {
  position: absolute;
  inset: 0;
}

.full-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 1.2s cubic-bezier(0.19, 1, 0.22, 1);
}

/* Transitions for Images */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Arrows */
.arrow-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  background: rgba(0,0,0,0.4);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
}
.arrow-btn:hover { background: #c9000a; transform: translateY(-50%) scale(1.1); }
.arrow-btn svg { width: 16px; height: 16px; }
.prev { left: 40px; }
.next { right: 80px; }

/* ====================
   BOTTOM TABS
   ==================== */
.bottom-nav {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 70px;
  background: rgba(0,0,0,0.7);
  display: flex;
  z-index: 20;
  backdrop-filter: blur(10px);
}

.nav-tab {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 30px;
  cursor: pointer;
  position: relative;
  transition: all 0.4s ease;
  border-right: 1px solid rgba(255,255,255,0.1);
}

.nav-tab:last-child { border-right: 0; }

.active-tab {
  background-color: #cd0000;
}

.tab-text {
  color: #fff;
  font-size: 14px;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.5px;
  opacity: 0.8;
  transition: opacity 0.3s;
}

.active-tab .tab-text {
  opacity: 1;
  font-weight: 600;
}

/* ====================
   ANIMATIONS
   ==================== */
.reveal-anim {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s cubic-bezier(0.19, 1, 0.22, 1);
}

.reveal-right {
  opacity: 0;
  transform: translateX(60px);
  transition: all 1s cubic-bezier(0.19, 1, 0.22, 1) 0.2s;
}

/* New Sliding Animations for Red Blocks */
.slide-right-red {
  transform: translateX(100%);
  transition: transform 1.2s cubic-bezier(0.19, 1, 0.22, 1);
}

.is-active .slide-right-red {
  transform: translateX(0);
}

.bottom-nav .nav-tab.active-tab {
  position: relative;
  overflow: hidden;
}

.bottom-nav .nav-tab.active-tab::before {
  content: '';
  position: absolute;
  inset: 0;
  background-color: #cd0000;
  transform: translateX(-100%);
  transition: transform 0.8s cubic-bezier(0.19, 1, 0.22, 1) 0.5s;
  z-index: -1;
}

.is-active .bottom-nav .nav-tab.active-tab::before {
  transform: translateX(0);
}

/* Remove direct background color to allow animation */
.active-tab {
  background-color: transparent !important;
}

.is-active .reveal-anim { opacity: 1; transform: translateY(0); }
.is-active .reveal-right { opacity: 1; transform: translateX(0); }

/* Responsive Adjustments */
@media (max-width: 992px) {
  .top-red-block { width: 40%; }
  .main-layout { left: 40px; }
  .vertical-text-float { display: none; }
  .bottom-nav { overflow-x: auto; }
  .tit { top: 12%; }
}
@media (max-width: 768px) {
  .top-red-block { display: none; }
  .main-layout { left: 20px; }
}
</style>
