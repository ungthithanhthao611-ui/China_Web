<script setup>
defineProps({
  active: {
    type: Boolean,
    default: false
  }
})

const newsList = [
  {
    day: '24', month: 'June', year: '2025',
    title: 'Jointly Building a Green and Smart New Ecosystem | The Green Construction Supply Chain Innovation Cooperation Exchange Conference (Beijing Station) was Successfully Held...',
    image: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/3d34e801-904d-427f-be5b-4c0abbd3a62b.png',
    link: '#'
  },
  {
    day: '13', month: 'May', year: '2025',
    title: 'Strong Alliance Sketches a New Chapter for the City Shanghai Linli · China Decoration Urban Renewal Research Institute was Inaugurated and Set Sail',
    link: '#'
  },
  {
    day: '12', month: 'May', year: '2025',
    title: 'China Decoration Shines with Two Stars on the Wanjiang River Drawing a New Blueprint for Green and Intelligent Manufacturing',
    link: '#'
  },
  {
    day: '03', month: 'April', year: '2025',
    image: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/2aefd35d-5f7f-4e2e-bd1d-e48906416c97.jpg',
    link: '#'
  }
]

const goTo = (url) => { window.location.href = url }
</script>

<template>
  <section class="news-section" :class="{ 'is-active': active }">
    <div class="top-red-bar" :class="{ 'is-active': active }"></div>
    <div class="bg-shape-overlay"></div>

    <div class="container main-content">
      <header class="news-header" :class="{ 'is-active': active }">
        <div class="title-group">
          <h2 class="fnt-serif">NEWS <img src="https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/012ad584-f3a1-4ceb-a342-1936a1bf6ff2.png" alt="stamp"></h2>
          <div class="title-underline"></div>
        </div>
        
        <div class="more-btn" @click="goTo('/news')">
          <div class="icon-circle">
            <div class="red-dot"><svg viewBox="0 0 1024 1024" width="12" height="12"><path d="M312.88 995.55c-17.06 0-28.44-5.68-39.82-17.06-22.75-22.75-17.06-56.88 5.68-79.64l364.08-329.95c11.37-11.37 17.06-22.75 17.06-34.13 0-11.37-5.68-22.75-17.06-34.13L273.06 187.73c-22.75-22.75-28.44-56.88-5.68-79.64 22.75-22.75 56.88-28.44 79.64-5.68l364.08 312.88c34.13 28.44 56.88 73.95 56.88 119.46s-17.06 85.33-51.2 119.46l-364.08 329.95c-11.37 5.68-28.44 11.37-39.82 11.37z" fill="#fff"></path></svg></div>
          </div>
          <span class="text">MORE +</span>
        </div>
      </header>

      <div class="news-grid" :class="{ 'is-active': active }">
        <div class="grid-col">
          <article class="card-feature-img" @click="goTo(newsList[0].link)">
            <div class="img-wrapper">
              <img :src="newsList[0].image" :alt="newsList[0].title">
              <div class="img-overlay"></div>
              <div class="info-box">
                <div class="date-row">
                  <span class="day">{{ newsList[0].day }}</span>
                  <div class="month-year"><span>{{ newsList[0].month }}</span><span>{{ newsList[0].year }}</span></div>
                  <div class="line-red"></div>
                </div>
                <h3 class="title-white">{{ newsList[0].title }}</h3>
              </div>
            </div>
            <div class="hover-border-bottom"></div>
          </article>

          <article class="card-text" @click="goTo(newsList[2].link)">
            <div class="date-row dark">
              <span class="day-red">{{ newsList[2].day }}</span>
              <div class="month-year"><span>{{ newsList[2].month }}</span><span>{{ newsList[2].year }}</span></div>
              <div class="line-red visible"></div>
            </div>
            <h3 class="title-dark">{{ newsList[2].title }}</h3>
            <div class="hover-border-bottom"></div>
          </article>
        </div>

        <div class="grid-col">
          <article class="card-text" @click="goTo(newsList[1].link)">
            <div class="date-row dark">
              <span class="day-red">{{ newsList[1].day }}</span>
              <div class="month-year"><span>{{ newsList[1].month }}</span><span>{{ newsList[1].year }}</span></div>
              <div class="line-red visible"></div>
            </div>
            <h3 class="title-dark">{{ newsList[1].title }}</h3>
            <div class="hover-line-short"></div>
          </article>

          <article class="card-certificate" @click="goTo(newsList[3].link)">
            <div class="cert-img-container">
              <img :src="newsList[3].image" alt="Certificate">
              <div class="cert-date-tag">
                <span class="day-red">{{ newsList[3].day }}</span>
                <div class="month-year"><span>{{ newsList[3].month }}</span><span>{{ newsList[3].year }}</span></div>
                <div class="line-red visible"></div>
              </div>
            </div>
            <div class="hover-border-bottom"></div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.news-section {
  position: relative;
  width: 100%;
  height: 100vh;
  background-color: #f7f7f7;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  padding-top: 0; /* Removing the top gap */
}

.top-red-bar {
  position: absolute;
  top: 0; left: 0;
  width: 25%; height: 35px;
  background: #cd0000;
  transform: translateX(-100%);
  transition: transform 1.2s cubic-bezier(0.19, 1, 0.22, 1);
  z-index: 5;

  &.is-active {
    transform: translateX(0);
  }
}

.bg-shape-overlay {
  position: absolute;
  inset: 0;
  background: url('https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/bg_shape.png') no-repeat center;
  background-size: cover;
  opacity: 0.4;
  pointer-events: none;
}

.main-content {
  width: 85%;
  max-width: 1400px;
  margin: 0 auto;
  z-index: 10;
  padding-top: 100px; /* Offset the text from the top so it doesn't touch the edge */
}

/* Header Styles */
.news-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 50px;
  /* Entry animation */
  opacity: 0;
  transform: translateY(60px);
  transition: all 1s cubic-bezier(0.19, 1, 0.22, 1);
  transition-delay: 0.2s;

  &.is-active {
    opacity: 1;
    transform: translateY(0);
  }

  .fnt-serif {
    font-family: "Times New Roman", serif;
    font-size: 36px;
    color: #333;
    display: flex;
    align-items: center;
    gap: 15px;
    img { height: 30px; }
  }

  .title-underline {
    width: 160px; height: 1px;
    background: #cd0000;
    margin-top: 10px;
  }
}

.more-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  
  .icon-circle {
    width: 46px; height: 46px;
    background: rgba(0,0,0,0.05);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    .red-dot {
      width: 32px; height: 32px;
      background: #cd0000;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
  }
  .text {
    font-size: 13px; font-weight: bold;
    border-bottom: 1px solid #333;
    padding-bottom: 2px;
  }
}

/* Grid Layout */
.news-grid {
  display: flex;
  gap: 80px;
  height: 600px;
  /* Entry animation */
  opacity: 0;
  transform: translateY(80px);
  transition: all 1.2s cubic-bezier(0.19, 1, 0.22, 1);
  transition-delay: 0.35s;

  &.is-active {
    opacity: 1;
    transform: translateY(0);
  }
}

.grid-col {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Card Styles */
.card-feature-img {
  position: relative;
  height: 60%;
  margin-bottom: 40px;
  cursor: pointer;
  overflow: hidden;

  .img-wrapper {
    width: 100%; height: 100%;
    position: relative;
    img { width: 100%; height: 100%; object-fit: cover; }
    .img-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(transparent, rgba(0,0,0,0.8));
    }
  }

  .info-box {
    position: absolute; bottom: 30px; left: 30px; right: 30px;
    .title-white { color: #fff; font-size: 18px; line-height: 1.5; margin-top: 15px; }
  }
}

.card-text {
  position: relative;
  padding: 30px 0;
  cursor: pointer;
  .title-dark {
    font-size: 16px; color: #333; line-height: 1.6;
    margin-top: 15px; transition: color 0.3s;
  }
  &:hover .title-dark { color: #cd0000; }
}

.card-certificate {
  flex: 1;
  display: flex;
  align-items: flex-end;
  cursor: pointer;
  .cert-img-container {
    position: relative;
    width: 90%;
    img { width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
    .cert-date-tag {
      position: absolute; bottom: -10px; left: -20px;
      background: #f7f7f7; padding: 10px;
      display: flex; align-items: center; gap: 10px;
    }
  }
}

/* Hiệu ứng gạch đỏ khi Hover */
.hover-border-bottom {
  position: absolute; bottom: 0; left: 0;
  width: 0; height: 2px;
  background: #cd0000;
  transition: width 0.5s ease;
}
.card-feature-img:hover .hover-border-bottom,
.card-text:hover .hover-border-bottom,
.card-certificate:hover .hover-border-bottom {
  width: 100%;
}

.hover-line-short {
  position: absolute; bottom: 20px; left: 0;
  width: 0; height: 2px;
  background: #cd0000;
  transition: width 0.5s ease;
}
.col-right .card-text:hover .hover-line-short { width: 80px; }

/* Date Components */
.date-row {
  display: flex; align-items: center; gap: 10px;
  .day { font-size: 36px; font-weight: 300; color: #fff; }
  .day-red { font-size: 36px; font-weight: 300; color: #cd0000; }
  .month-year {
    display: flex; flex-direction: column;
    font-size: 11px; color: #888; text-transform: uppercase;
  }
  .line-red {
    width: 0; height: 1px; background: #cd0000; transition: width 0.3s;
    &.visible { width: 40px; }
  }
}
.card-feature-img:hover .line-red { width: 40px; background: #fff; }

@media (max-width: 1024px) {
  .news-section { height: auto; padding: 100px 0; }
  .news-grid { flex-direction: column; height: auto; }
}
</style>