<script setup>
// Dữ liệu mẫu cho Star Hotel projects
const projects = [
  { id: 1, title: 'Luxury Grand Hotel', location: 'Shanghai', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
  { id: 2, title: 'Boutique Resort & Spa', location: 'Beijing', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
]
</script>

<template>
  <div class="project-gallery">
    <div class="grid">
      <div v-for="p in projects" :key="p.id" class="project-card">
        <div class="img-box">
          <img :src="p.image" :alt="p.title">
          <div class="overlay">
            <span>View Details</span>
          </div>
        </div>
        <div class="info">
          <h3>{{ p.title }}</h3>
          <p>{{ p.location }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 40px;
}
.project-card {
  cursor: pointer;
  .img-box {
    position: relative;
    height: 300px;
    overflow: hidden;
    img { width: 100%; height: 100%; object-fit: cover; transition: 0.6s; }
    .overlay {
      position: absolute; inset: 0; background: rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: 0.4s;
      span { color: #fff; border: 1px solid #fff; padding: 10px 20px; }
    }
  }
  &:hover {
    .img-box img { transform: scale(1.1); }
    .overlay { opacity: 1; }
  }
  .info {
    padding: 20px 0;
    h3 { font-size: 20px; color: #333; margin-bottom: 5px; }
    p { color: #888; font-size: 14px; }
  }
}
</style>
