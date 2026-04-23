<template>
  <div class="image-block">
    <div class="image-block__media" :style="mediaStyle">
      <img
        class="image-block__img"
        :src="block.props.src || fallbackSrc"
        :alt="block.props.alt || 'Image'"
        referrerpolicy="no-referrer"
        draggable="false"
      />

      <div v-if="caption && captionMode === 'inside-bottom'" class="image-block__caption image-block__caption--inside">
        <input :value="caption" class="image-block__caption-input image-block__caption-input--inside" @input="updateCaption($event.target.value)" />
      </div>
    </div>

    <div v-if="captionMode === 'outside-bottom'" class="image-block__caption image-block__caption--outside">
      <input :value="caption" class="image-block__caption-input" @input="updateCaption($event.target.value)" />
    </div>

    <div v-if="selected" class="image-block__actions">
      <button type="button" class="image-block__action" @click="$emit('replace')">Replace</button>
      <button type="button" class="image-block__action" @click="toggleCaptionMode">
        {{ captionMode === 'inside-bottom' ? 'Caption Outside' : 'Caption Inside' }}
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
  selected: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update-props', 'replace'])

const fallbackSrc = 'https://picsum.photos/seed/placeholder/1000/700'
const caption = computed(() => props.block.props.captionText || '')
const captionMode = computed(() => props.block.props.captionPosition || 'outside-bottom')
const mediaStyle = computed(() => ({
  borderRadius: `${props.block.props.borderRadius || 16}px`,
}))

function updateCaption(value) {
  emit('update-props', {
    captionText: value,
  })
}

function toggleCaptionMode() {
  emit('update-props', {
    captionPosition: captionMode.value === 'inside-bottom' ? 'outside-bottom' : 'inside-bottom',
  })
}
</script>

<style scoped>
.image-block {
  width: 100%;
  height: 100%;
  display: grid;
  align-content: start;
}

.image-block__media {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f8fafc;
}

.image-block__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-block__caption {
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-block__caption--inside {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10px 14px;
  background: linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.72) 100%);
}

.image-block__caption--outside {
  padding-top: 10px;
}

.image-block__caption-input {
  width: 100%;
  border: 0;
  background: transparent;
  outline: none;
  text-align: center;
  color: #475569;
  font-size: 12px;
  line-height: 1.6;
}

.image-block__caption-input--inside {
  color: #ffffff;
}

.image-block__actions {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 8px;
}

.image-block__action {
  height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.72);
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(10px);
}
</style>
