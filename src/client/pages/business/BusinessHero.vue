<script setup>
const props = defineProps({
  active: Boolean,
  sections: Array
})

const emit = defineEmits(['navigateTo'])

const handleNavigate = (label) => {
  const index = props.sections.findIndex(s => s.label === label)
  if (index !== -1) {
    emit('navigateTo', index)
  }
}
</script>

<template>
  <div class="business-hero" :class="{ 'is-active': active }">
    <div class="content-wrapper">
      <div class="title-group animate-text">
        <h1 class="fnt-serif">BUSINESS FIELD <span class="red-stamp">印</span></h1>
        <div class="red-line"></div>
        <p class="slogan">Innovate industry model, lead green development, decorate a better life</p>
      </div>
    </div>
    
    <div class="bottom-nav">
      <div class="nav-container">
        <div 
          v-for="(item, i) in sections.slice(1)" 
          :key="item.label"
          class="nav-item"
        >
          <a 
            href="javascript:;"
            @click="handleNavigate(item.label)"
          >
            {{ item.label }}
          </a>
          <span v-if="i < sections.length - 2" class="separator">|</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.business-hero {
  position: relative;
  width: 100%;
  height: 100vh;
  background: url('https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/177ed557-dad7-4cf2-b1e8-ee44154ac91b.jpg') no-repeat center;
  background-size: cover;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #fff;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.25);
  }

  .content-wrapper {
    position: relative;
    z-index: 2;
    padding: 0 10%;
    margin-top: -80px;
  }

  .fnt-serif {
    font-size: 68px;
    font-family: serif;
    letter-spacing: 4px;
    margin-bottom: 25px;
    display: flex;
    align-items: center;
    gap: 30px;
    font-weight: 300;
    
    .red-stamp {
      font-size: 22px;
      background: #c8161d;
      padding: 4px 8px;
      font-family: sans-serif;
      font-weight: bold;
    }
  }

  .red-line {
    width: 500px;
    height: 1px;
    background: rgba(200, 22, 29, 0.6);
    margin-bottom: 35px;
    position: relative;
    &::after {
      content: '';
      position: absolute;
      right: 0; top: 50%;
      transform: translateY(-50%);
      width: 4px; height: 4px;
      background: #c8161d;
      border-radius: 50%;
    }
  }

  .slogan {
    font-size: 18px;
    letter-spacing: 1.5px;
    opacity: 0.85;
    font-weight: 300;
  }

  .bottom-nav {
    position: absolute;
    bottom: 0;
    width: 100%;
    background: rgba(10, 20, 38, 0.8);
    backdrop-filter: blur(15px);
    z-index: 10;
    border-top: 1px solid rgba(255,255,255,0.1);
    
    .nav-container {
      max-width: 1600px;
      margin: 0 auto;
      display: flex;
      justify-content: center;
      padding: 30px 0;
      gap: 0;
      
      .nav-item {
        display: flex;
        align-items: center;
        
        a {
          color: #fff;
          text-decoration: none;
          font-size: 13px;
          opacity: 0.7;
          transition: 0.3s;
          padding: 0 25px;
          letter-spacing: 0.5px;
          &:hover { opacity: 1; color: #fff; transform: translateY(-2px); }
        }
        
        .separator {
          color: rgba(255,255,255,0.2);
          font-size: 12px;
        }
      }
    }
  }
}

// Entrance Animations
.animate-text {
  opacity: 0;
  transform: translateY(40px);
  transition: all 1.2s cubic-bezier(0.19, 1, 0.22, 1);
}

.is-active .animate-text {
  opacity: 1;
  transform: translateY(0);
}
</style>
