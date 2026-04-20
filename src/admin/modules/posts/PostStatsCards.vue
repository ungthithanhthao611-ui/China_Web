<script setup>
defineProps({
  cards: {
    type: Array,
    default: () => [],
  },
})

function resolveIcon(key) {
  if (key === 'total') return '≡'
  if (key === 'draft') return '✎'
  if (key === 'pending') return '↔'
  if (key === 'published') return '✓'
  return '•'
}

function resolveTone(key, tone) {
  if (key === 'total') return 'tone-primary'
  if (key === 'draft') return 'tone-tertiary'
  if (key === 'pending') return 'tone-secondary'
  if (key === 'published') return 'tone-primary-strong'
  return `tone-${tone || 'neutral'}`
}

function resolveProgress(card) {
  if (typeof card.progress === 'number') {
    return `${Math.max(8, Math.min(100, card.progress))}%`
  }

  if (card.key === 'published') return '100%'
  if (card.key === 'draft') return '34%'
  if (card.key === 'pending') return '26%'
  return '0%'
}
</script>

<template>
  <div class="stats-grid">
    <article v-for="card in cards" :key="card.key" class="stat-card" :class="resolveTone(card.key, card.tone)">
      <div class="stat-top">
        <span class="stat-icon">{{ resolveIcon(card.key) }}</span>
        <span class="stat-label">{{ card.badge || card.label }}</span>
      </div>
      <p class="stat-value">{{ card.value }}</p>
      <p class="stat-description">{{ card.description || card.subtitle || '' }}</p>
      <div class="stat-progress" aria-hidden="true">
        <span :style="{ width: resolveProgress(card) }"></span>
      </div>
    </article>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.stat-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 8px 30px rgba(42, 52, 57, 0.05);
  display: grid;
  gap: 12px;
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.stat-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 800;
  background: #d8e2ff;
  color: #005ac2;
}

.stat-label {
  color: #566166;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.stat-value {
  margin: 0;
  color: #2a3439;
  font-size: clamp(36px, 4vw, 44px);
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.stat-description {
  margin: 0;
  min-height: 18px;
  color: #566166;
  font-size: 12px;
  line-height: 1.5;
}

.stat-progress {
  width: 100%;
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: #e8eff3;
}

.stat-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #005ac2;
}

.tone-tertiary .stat-icon {
  background: #d3ceef;
  color: #5f5c78;
}

.tone-tertiary .stat-progress span {
  background: #5f5c78;
}

.tone-secondary .stat-icon {
  background: #d3e4fe;
  color: #506076;
}

.tone-secondary .stat-progress span {
  background: #506076;
}

.tone-primary-strong .stat-icon,
.tone-primary .stat-icon {
  background: #d8e2ff;
  color: #005ac2;
}

.tone-primary-strong .stat-progress span,
.tone-primary .stat-progress span {
  background: linear-gradient(145deg, #005ac2 0%, #004fab 100%);
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
