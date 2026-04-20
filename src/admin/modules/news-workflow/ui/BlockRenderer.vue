<script setup>
const props = defineProps({
  block: {
    type: Object,
    required: true,
  },
})

function getImageCaption(block) {
  return String(block.props?.caption || block.props?.captionText || '')
}
</script>

<template>
  <div
    class="block-renderer"
    :style="{
      fontFamily: String(block.props?.fontFamily || ''),
      color: String(block.props?.color || ''),
      fontSize: block.props?.fontSize ? `${Number(block.props.fontSize)}px` : undefined,
      lineHeight: block.props?.lineHeight ? String(block.props.lineHeight) : undefined,
      textAlign: String(block.props?.textAlign || ''),
      backgroundColor: String(block.props?.backgroundColor || ''),
      fontWeight: String(block.props?.fontWeight || ''),
      fontStyle: String(block.props?.fontStyle || ''),
      textDecoration: String(block.props?.textDecoration || ''),
    }"
  >
    <template v-if="block.type === 'text'">
      <div v-html="block.content" />
    </template>

    <template v-else-if="block.type === 'heading'">
      <component :is="block.props?.level || 'h2'" v-html="block.content" />
    </template>

    <template v-else-if="block.type === 'quote'">
      <blockquote v-html="block.content" />
    </template>

    <template v-else-if="block.type === 'divider'">
      <hr />
    </template>

    <template v-else-if="block.type === 'image'">
      <figure :class="`align-${block.props?.align || 'left'}`">
        <img
          :src="block.props?.src"
          :alt="block.props?.alt || ''"
          :style="{
            borderRadius: `${Number(block.props?.borderRadius || 0)}px`,
            objectFit: String(block.props?.objectFit || 'cover'),
            opacity: String(block.props?.opacity ?? 1),
          }"
        />
        <figcaption v-if="getImageCaption(block)">{{ getImageCaption(block) }}</figcaption>
      </figure>
    </template>

    <template v-else-if="block.type === 'gallery'">
      <section
        class="gallery"
        :style="{
          gridTemplateColumns: `repeat(${Math.max(1, Math.min(6, Number(block.props?.columns || 3)))}, minmax(0, 1fr))`,
          gap: `${Number(block.props?.gap || 12)}px`,
        }"
      >
        <figure
          v-for="(item, index) in (Array.isArray(block.props?.images) ? block.props.images : [])"
          :key="`${block.id}-gallery-render-${item?.id || index}`"
          class="gallery-item"
        >
          <img
            v-if="item?.src"
            :src="item.src"
            :alt="item?.alt || ''"
            :style="{
              borderRadius: `${Number(block.props?.borderRadius || 0)}px`,
              objectFit: String(block.props?.objectFit || 'cover'),
            }"
          />
          <figcaption v-if="item?.caption">{{ item.caption }}</figcaption>
        </figure>
      </section>
    </template>

    <template v-else-if="block.type === 'two_column'">
      <div class="two-column" :style="{ gap: `${Number(block.props?.gap || 24)}px` }">
        <div v-html="block.props?.leftContent || ''" />
        <div v-html="block.props?.rightContent || ''" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.block-renderer {
  width: 100%;
}

.block-renderer :deep(p) {
  margin: 0 0 10px;
}

figure {
  margin: 0;
}

figure img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 640px;
}

figure.align-center {
  text-align: center;
}

figcaption {
  margin-top: 8px;
  text-align: center;
  color: #64748b;
  font-size: 13px;
}

.two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.gallery {
  display: grid;
}

.gallery-item {
  margin: 0;
}

.gallery-item img {
  display: block;
  width: 100%;
  height: auto;
  min-height: 120px;
}
</style>


