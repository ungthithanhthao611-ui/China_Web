<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  loading?: boolean
  title?: string
  description?: string
  submitLabel?: string
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'submit', payload: { source_url: string; source_note?: string }): void
}>()

const sourceUrl = ref('')
const sourceNote = ref('')

watch(
  () => props.open,
  (value) => {
    if (!value) {
      sourceUrl.value = ''
      sourceNote.value = ''
    }
  }
)

function onClose() {
  emit('close')
}

function onSubmit() {
  if (!sourceUrl.value.trim()) return
  emit('submit', {
    source_url: sourceUrl.value.trim(),
    source_note: sourceNote.value.trim() || undefined,
  })
}
</script>

<template>
  <div v-if="props.open" class="dialog-overlay" @click.self="onClose">
    <div class="dialog-card">
      <header class="dialog-header">
        <h3>{{ props.title || 'Import Source URL' }}</h3>
        <button type="button" class="ghost-btn" aria-label="Close dialog" @click="onClose">x</button>
      </header>

      <div class="dialog-body">
        <p class="dialog-description">
          {{ props.description || 'Enter the source URL you want to parse into draft blocks for manual editing.' }}
        </p>

        <label class="field">
          <span>Source URL</span>
          <input v-model="sourceUrl" type="url" placeholder="https://example.com/news" @keydown.enter="onSubmit" />
        </label>

        <label class="field">
          <span>Source Note</span>
          <textarea
            v-model="sourceNote"
            rows="4"
            placeholder="Reference only. Manual editorial review is required before publish."
          />
        </label>

        <p class="note">
          Import creates draft blocks for manual editing only. This flow does not auto-publish imported content.
        </p>
      </div>

      <footer class="dialog-footer">
        <button type="button" class="btn-secondary" @click="onClose">Cancel</button>
        <button type="button" class="btn-primary" :disabled="props.loading || !sourceUrl.trim()" @click="onSubmit">
          {{ props.loading ? 'Importing...' : props.submitLabel || 'Import to Draft' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(15, 23, 42, 0.5);
  display: grid;
  place-items: center;
  padding: 16px;
}

.dialog-card {
  width: min(680px, 100%);
  border-radius: 10px;
  background: #fff;
  border: 1px solid #d7dee8;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.26);
}

.dialog-header,
.dialog-footer {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e6ebf2;
}

.dialog-footer {
  border-bottom: 0;
  border-top: 1px solid #e6ebf2;
  justify-content: flex-end;
  gap: 10px;
}

.dialog-header h3 {
  margin: 0;
  font-size: 17px;
  color: #1e293b;
}

.dialog-body {
  padding: 16px;
  display: grid;
  gap: 12px;
}

.dialog-description {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.field {
  display: grid;
  gap: 6px;
}

.field span {
  font-size: 12px;
  color: #475569;
  font-weight: 600;
}

.field input,
.field textarea {
  width: 100%;
  border: 1px solid #d5dde9;
  border-radius: 6px;
  font-size: 13px;
  padding: 9px 10px;
  outline: none;
}

.field input:focus,
.field textarea:focus {
  border-color: #0b76d1;
}

.note {
  margin: 0;
  font-size: 12px;
  color: #64748b;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px;
}

.btn-primary,
.btn-secondary,
.ghost-btn {
  border-radius: 6px;
  border: 1px solid transparent;
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: #0b76d1;
  color: #fff;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #eef2f7;
  color: #1f2937;
  border-color: #d5dde9;
}

.ghost-btn {
  background: transparent;
  color: #64748b;
  padding: 6px 8px;
}
</style>
