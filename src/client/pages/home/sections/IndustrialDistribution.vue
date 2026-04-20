<script setup>
import { ref } from 'vue'

const markers = [
  { top: '35%', left: '72%', label: 'China Decoration (Beijing) HQ' },
  { top: '55%', left: '78%', label: 'China Decoration (Shanghai) Branch' },
  { top: '65%', left: '75%', label: 'China Decoration (Shenzhen) Center' },
  { top: '58%', left: '65%', label: 'China Decoration (Wuhan) Office' },
  { top: '52%', left: '55%', label: 'China Decoration (Chengdu) Co., LTD' },
  { top: '72%', left: '68%', label: 'China Decoration (Hainan) Co., LTD' },
  { top: '38%', left: '65%', label: 'China Decoration (Xi\'an) Branch' }
]

const activeIndex = ref(null)
</script>

<template>
  <section class="industrial-distribution">
    <div class="bg-text-overlay">CHINA DECOR</div>

    <div class="container main-content">
      <div class="map-container">
        <div class="earth-bg"></div>
        
        <div class="china-red-map">
          <img src="https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/91c2ddf4-73a0-46e5-82f5-f728b455f4f1.png" alt="China Map">
          
          <div 
            v-for="(m, i) in markers" 
            :key="i" 
            class="map-marker" 
            :style="{ top: m.top, left: m.left }"
            @mouseenter="activeIndex = i"
            @mouseleave="activeIndex = null"
          >
            <div class="gold-marker">
              <div class="inner-dot"></div>
              <div class="pulse-ring"></div>
            </div>
            
            <Transition name="fade">
              <div v-if="activeIndex === i" class="marker-tooltip">
                <div class="tooltip-icon">
                   <img src="https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/c517472a-424d-4691-b342-ded300f79e7.png" alt="icon">
                </div>
                <span>{{ m.label }}</span>
              </div>
            </Transition>
          </div>
        </div>
        
        <p class="approval-no">Approval number: Jing Shen Zi (2024) G No. 1765</p>
      </div>

      <div class="text-content">
        <div class="title-group">
          <h2 class="fnt-serif">INDUSTRIAL <br> DISTRIBUTION <span class="red-stamp">印</span></h2>
          <div class="red-line-dotted"></div>
        </div>
        
        <p class="description">
          China Decoration has set up a "design general institute ten management centers" and a number of functional departments in the headquarters, and has 7 design branches, 7 branches and 9 sub-companies throughout the country, business throughout more than 30 cities, with a large number of industry experts and technical personnel.
        </p>

        <router-link to="/branch" class="more-link-v2">
          <div class="icon-box">
            <img src="https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/c517472a-424d-4691-b342-ded300f79e7.png" class="rotate-bg" alt="rotate">
            <div class="red-circle">
              <svg viewBox="0 0 1024 1024" width="16" height="16"><path d="M312.88 995.55c-17.06 0-28.44-5.68-39.82-17.06-22.75-22.75-17.06-56.88 5.68-79.64l364.08-329.95c11.37-11.37 17.06-22.75 17.06-34.13 0-11.37-5.68-22.75-17.06-34.13L273.06 187.73c-22.75-22.75-28.44-56.88-5.68-79.64 22.75-22.75 56.88-28.44 79.64-5.68l364.08 312.88c34.13 28.44 56.88 73.95 56.88 119.46s-17.06 85.33-51.2 119.46l-364.08 329.95c-11.37 5.68-28.44 11.37-39.82 11.37z" fill="#fff"></path></svg>
            </div>
          </div>
          <span class="more-txt">MORE +</span>
        </router-link>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
$china-red: #c8161d;

.industrial-distribution {
  position: relative;
  width: 100%;
  height: 100vh;
  background: radial-gradient(circle at center, #1e3a5f 0%, #0a1426 100%);
  display: flex;
  align-items: center;
  overflow: hidden;
  color: #fff;
}

.bg-text-overlay {
  position: absolute;
  top: 10%; left: 50%;
  transform: translateX(-50%);
  font-size: 13vw;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.02);
  white-space: nowrap;
  pointer-events: none;
}

.main-content {
  display: flex;
  width: 90%;
  max-width: 1500px;
  margin: 0 auto;
  align-items: center;
  justify-content: space-between;
}

.map-container {
  position: relative;
  flex: 1.2;
  height: 700px;

  .earth-bg {
    position: absolute;
    width: 1000px; height: 1000px;
    background: url('https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/d1abb229-17b7-47df-85a3-07fa69598623.png') no-repeat center;
    background-size: contain;
    top: 50%; left: 45%; /* Shifted right to center under map */
    transform: translate(-50%, -50%);
    opacity: 0.2; /* A bit lighter for better map contrast */
  }

  .china-red-map {
    position: relative;
    width: 680px; /* Sized to fit globe view */
    margin-left: 20px;
    z-index: 5;
    img { width: 100%; filter: drop-shadow(0 0 40px rgba(200, 22, 29, 0.5)); }
  }
}

// Marker hiệu ứng
.map-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 10;
  cursor: pointer;

  .gold-marker {
    position: relative;
    .inner-dot {
      width: 6px; height: 6px;
      background: #ffe664;
      border-radius: 50%;
      box-shadow: 0 0 10px #ffe664;
    }
    .pulse-ring {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 20px; height: 20px;
      border: 1px solid rgba(255, 230, 100, 0.5);
      border-radius: 50%;
      animation: pulse-ring 2s infinite ease-out;
    }
  }
}

@keyframes pulse-ring {
  0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
}

// Tooltip Label
.marker-tooltip {
  position: absolute;
  bottom: 20px; left: 50%;
  transform: translateX(-50%);
  background: #fff;
  color: #333;
  padding: 8px 15px;
  border-radius: 4px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  z-index: 20;

  &::after {
    content: '';
    position: absolute;
    top: 100%; left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: #fff;
  }

  .tooltip-icon img { height: 14px; }
  span { font-size: 13px; font-weight: 600; }
}

// Animation cho tooltip
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translate(-50%, 10px); }

// Text Content
.text-content {
  flex: 0.8;
  padding-left: 100px;

  .fnt-serif {
    font-family: "Times New Roman", serif;
    font-size: 54px;
    letter-spacing: 4px; /* Increased for premium look */
    line-height: 1.1;
    margin-bottom: 5px;
    text-transform: uppercase; /* Match sample */
    
    .red-stamp {
      background: $china-red;
      font-size: 18px;
      padding: 4px 6px;
      margin-left: 20px;
      vertical-align: middle;
    }
  }

  .red-line-dotted {
    width: 450px; height: 1px;
    background: linear-gradient(to right, $china-red 120px, rgba(255,255,255,0.2) 120px);
    margin: 30px 0 50px;
    position: relative;
    &::after {
      content: '';
      position: absolute; right: 0; top: -1.5px;
      width: 4px; height: 4px;
      background: $china-red; border-radius: 50%;
    }
  }

  .description {
    color: #a5b1c2;
    font-size: 15px;
    line-height: 1.8;
    margin-bottom: 60px;
    max-width: 500px;
  }
}

// Nút More
.more-link-v2 {
  display: flex;
  align-items: center;
  gap: 20px;
  text-decoration: none;
  width: fit-content;

  .icon-box {
    position: relative;
    width: 75px; height: 75px;
    display: flex; align-items: center; justify-content: center;

    .rotate-bg {
      position: absolute; 
      width: 100%;
      opacity: 0.2; /* Dimmier when not hover */
      transition: opacity 0.3s;
      /* Animation only plays on hover */
      animation: spin 10s linear infinite;
      animation-play-state: paused;
    }
    .red-circle {
      width: 42px; height: 42px;
      background: $china-red;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      transition: 0.3s;
      position: relative;
      z-index: 2;
    }
  }

  .more-txt {
    font-size: 16px;
    font-weight: bold;
    color: #fff;
    border-bottom: 2px solid rgba(255,255,255,0.2);
    padding-bottom: 5px;
    transition: 0.3s;
  }

  &:hover {
    .rotate-bg { 
      opacity: 0.6; 
      animation-play-state: running; 
    }
    .red-circle { 
      transform: scale(1.1); 
      box-shadow: 0 0 25px rgba(200, 22, 29, 0.4); 
    }
    .more-txt { 
      border-color: #fff; 
      letter-spacing: 1px; 
    }
  }
}

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

@media (max-width: 1200px) {
  .main-content { flex-direction: column; text-align: center; }
  .text-content { padding-left: 0; margin-top: 50px; }
  .red-line-dotted { margin: 20px auto 40px; }
  .more-link-v2 { justify-content: center; }
}
</style>