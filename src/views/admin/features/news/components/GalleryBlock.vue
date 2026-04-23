<template>
  <div class="gallery-block">
    <div class="gallery-block__grid" :style="gridStyle">
      <div v-for="(image, index) in images" :key="image.id || index" class="gallery-card" :class="{ 'gallery-card--selected': selectedImageId === image.id }" @click.stop="$emit('select-image', image.id)">
        <img :src="image.src" :alt="image.caption || `Gallery image ${index + 1}`" class="gallery-card__img" referrerpolicy="no-referrer" draggable="false" />
        <div class="gallery-card__overlay">
          <button type="button" class="gallery-card__btn" @click.stop="$emit('replace-image', image.id)">Replace</button>
          <button type="button" class="gallery-card__btn gallery-card__btn--danger" @click.stop="$emit('delete-image', image.id)">Delete</button>
        </div>
        <input :value="image.caption || ''" class="gallery-card__caption" placeholder="Write a caption..." @input="$emit('update-caption', { id: image.id, caption: $event.target.value })" />
      </div>

      <button type="button" class="gallery-add" @click="$emit('add-image')">
        + Add Image
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  block: {
    type: Object,
    required: true,
  },
  selectedImageId: {
    type: String,
    default: null,
  },
})

defineEmits(['add-image', 'replace-image', 'delete-image', 'update-caption', 'select-image'])

const images = computed(() => props.block.props.images || [])
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.block.props.columns || 2}, minmax(0, 1fr))`,
  gap: `${props.block.props.gap || 14}px`,
}))
</script>

<style scoped>
.gallery-block {
  width: 100%;
  height: 100%;
  padding: 8px;
  box-sizing: border-box;
}

.gallery-block__grid {
  display: grid;
  width: 100%;
  min-height: 100%;
}

.gallery-card,
.gallery-add {
  min-height: 180px;
  border-radius: 18px;
}

.gallery-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #f8fafc;
}

.gallery-card--selected {
  box-shadow: 0 0 0 2px #2563eb;
}

.gallery-card__img {
  width: 100%;
  height: calc(100% - 40px);
  object-fit: cover;
  display: block;
}

.gallery-card__overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.gallery-card:hover .gallery-card__overlay {
  opacity: 1;
}

.gallery-card__btn {
  height: 28px;
  padding: 0 10px;
  border: 0;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.78);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.gallery-card__btn--danger {
  background: rgba(220, 38, 38, 0.88);
}

.gallery-card__caption {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 0;
  background: #fff;
  outline: none;
  color: #475569;
  font-size: 12px;
}

.gallery-add {
  border: 1px dashed #cbd5e1;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  color: #334155;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
</style>
