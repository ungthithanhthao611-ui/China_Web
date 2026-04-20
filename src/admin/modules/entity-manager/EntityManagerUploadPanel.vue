<script setup>
defineProps({
  uploading: {
    type: Boolean,
    required: true,
  },
  uploadTitle: {
    type: String,
    required: true,
  },
  uploadAltText: {
    type: String,
    required: true,
  },
});

const emit = defineEmits([
  "file-change",
  "update:uploadTitle",
  "update:uploadAltText",
  "upload",
]);
</script>

<template>
  <div class="upload-panel">
    <div class="upload-panel__intro">
      <p class="eyebrow">Media Workspace</p>
      <h3>Upload media asset</h3>
      <p class="description">
        Add new files to the media library with a clean publishing workflow and ready-to-use metadata.
      </p>
    </div>

    <div class="upload-row upload-row--standalone">
      <label class="upload-field upload-field--file">
        <span>Source file</span>
        <input
          type="file"
          accept="image/*,video/*,application/pdf"
          @change="emit('file-change', $event)"
        />
      </label>

      <label class="upload-field">
        <span>Media title</span>
        <input
          :value="uploadTitle"
          type="text"
          placeholder="Media title"
          @input="emit('update:uploadTitle', $event.target.value)"
        />
      </label>

      <label class="upload-field">
        <span>Alt text</span>
        <input
          :value="uploadAltText"
          type="text"
          placeholder="Alt text"
          @input="emit('update:uploadAltText', $event.target.value)"
        />
      </label>

      <div class="upload-field upload-field--action">
        <span>Publish</span>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="uploading"
          @click="emit('upload')"
        >
          {{ uploading ? "Uploading..." : "Upload" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-panel {
  display: grid;
  gap: 18px;
  align-items: flex-start;
}

.upload-panel__intro {
  display: grid;
  gap: 8px;
}

.eyebrow {
  margin: 0;
  color: #6c839c;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-weight: 800;
}

h3 {
  margin: 0;
  color: #15314d;
  font-size: 22px;
}

.description {
  margin: 0;
  color: #5d7690;
  font-size: 14px;
  line-height: 1.65;
}

.upload-row--standalone {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr auto;
  gap: 14px;
  width: 100%;
}

.upload-field {
  display: grid;
  gap: 8px;
}

.upload-field span {
  color: #6a8097;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.upload-field--action {
  min-width: 150px;
}

input {
  min-height: 48px;
  border: 1px solid rgba(198, 216, 233, 0.95);
  border-radius: 16px;
  padding: 12px 14px;
  color: #17324d;
  background: rgba(255, 255, 255, 0.98);
  font: inherit;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

input:focus {
  outline: none;
  border-color: rgba(63, 140, 221, 0.74);
  box-shadow: 0 0 0 4px rgba(79, 167, 255, 0.14);
}

.btn {
  border-radius: 16px;
  border: 1px solid transparent;
  min-height: 46px;
  padding: 0 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    background 0.22s ease,
    border-color 0.22s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #1f7ae0 0%, #4fa7ff 100%);
  box-shadow: 0 16px 30px rgba(31, 122, 224, 0.22);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

@media (max-width: 1180px) {
  .upload-row--standalone {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .upload-row--standalone {
    grid-template-columns: 1fr;
  }
}
</style>
