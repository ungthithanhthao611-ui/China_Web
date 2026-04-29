<script setup>
import { ref, computed } from 'vue'
import { X, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-vue-next'
import { submitInquiry } from '@/views/user/services/productsApi'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  productName: { type: String, default: '' },
  productSku: { type: String, default: '' },
})
const emit = defineEmits(['close'])
const { t } = useI18n({ useScope: 'global' })

const form = ref({
  full_name: '',
  email: '',
  phone: '',
  company: '',
  message: '',
})

const status = ref('idle') // idle | loading | success | error
const errorMsg = ref('')

const isValid = computed(() =>
  form.value.full_name.trim() &&
  form.value.email.trim() &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email) &&
  form.value.message.trim()
)

async function handleSubmit() {
  if (!isValid.value || status.value === 'loading') return
  status.value = 'loading'
  errorMsg.value = ''
  try {
    await submitInquiry({
      ...form.value,
      subject: t('user.products.inquirySubject', { name: props.productName, sku: props.productSku }),
      product_sku: props.productSku,
      source_page: 'product_detail',
    })
    status.value = 'success'
  } catch (err) {
    status.value = 'error'
    errorMsg.value = err.message || t('user.products.inquiryError')
  }
}

function closeModal() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div class="inquiry-overlay" @click.self="closeModal">
      <div class="inquiry-modal" role="dialog" aria-modal="true" :aria-label="t('user.products.inquiryTitle')">
        <!-- Header -->
        <div class="inquiry-modal__header">
          <div class="inquiry-modal__title-wrap">
            <div class="inquiry-modal__dot" />
            <div>
              <h2 class="inquiry-modal__title">{{ t('user.products.inquiryTitle') }}</h2>
              <p v-if="productName" class="inquiry-modal__product">{{ productName }}<span v-if="productSku"> — {{ productSku }}</span></p>
            </div>
          </div>
          <button class="inquiry-modal__close" :aria-label="t('user.products.inquiryClose')" @click="closeModal">
            <X :size="20" />
          </button>
        </div>

        <!-- Success state -->
        <div v-if="status === 'success'" class="inquiry-success">
          <div class="inquiry-success__icon">
            <CheckCircle :size="52" stroke-width="1.5" />
          </div>
          <h3>{{ t('user.products.inquirySuccessTitle') }}</h3>
          <p v-html="t('user.products.inquirySuccessMsg')"></p>
          <button class="btn-close-success" @click="closeModal">{{ t('user.products.inquiryClose') }}</button>
        </div>

        <!-- Form -->
        <form v-else class="inquiry-form" @submit.prevent="handleSubmit" novalidate>
          <div class="inquiry-form__row">
            <div class="form-group">
              <label for="inq-name">{{ t('user.products.inquiryLabelName') }} <span class="req">*</span></label>
              <input
                id="inq-name"
                v-model="form.full_name"
                type="text"
                :placeholder="t('user.products.inquiryPlaceholderName')"
                :disabled="status === 'loading'"
                autocomplete="name"
                required
              />
            </div>
            <div class="form-group">
              <label for="inq-email">{{ t('user.products.inquiryLabelEmail') }} <span class="req">*</span></label>
              <input
                id="inq-email"
                v-model="form.email"
                type="email"
                :placeholder="t('user.products.inquiryPlaceholderEmail')"
                :disabled="status === 'loading'"
                autocomplete="email"
                required
              />
            </div>
          </div>

          <div class="inquiry-form__row">
            <div class="form-group">
              <label for="inq-phone">{{ t('user.products.inquiryLabelPhone') }}</label>
              <input
                id="inq-phone"
                v-model="form.phone"
                type="tel"
                :placeholder="t('user.products.inquiryPlaceholderPhone')"
                :disabled="status === 'loading'"
                autocomplete="tel"
              />
            </div>
            <div class="form-group">
              <label for="inq-company">{{ t('user.products.inquiryLabelCompany') }}</label>
              <input
                id="inq-company"
                v-model="form.company"
                type="text"
                :placeholder="t('user.products.inquiryPlaceholderCompany')"
                :disabled="status === 'loading'"
                autocomplete="organization"
              />
            </div>
          </div>

          <div class="form-group form-group--full">
            <label for="inq-message">{{ t('user.products.inquiryLabelMessage') }} <span class="req">*</span></label>
            <textarea
              id="inq-message"
              v-model="form.message"
              rows="4"
              :placeholder="t('user.products.inquiryPlaceholderMessage')"
              :disabled="status === 'loading'"
              required
            />
          </div>

          <div v-if="status === 'error'" class="inquiry-error">
            <AlertCircle :size="16" />
            {{ errorMsg }}
          </div>

          <div class="inquiry-form__footer">
            <p class="inquiry-form__note">{{ t('user.products.inquiryNote') }}</p>
            <button
              type="submit"
              class="btn-submit"
              :disabled="!isValid || status === 'loading'"
            >
              <Loader2 v-if="status === 'loading'" :size="16" class="spin" />
              <Send v-else :size="16" />
              {{ status === 'loading' ? t('user.products.inquirySending') : t('user.products.inquirySubmit') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.inquiry-overlay {
  position: fixed;
  inset: 0;
  z-index: 8888;
  background: rgba(10,17,32,0.6);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.22s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.inquiry-modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 620px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0,0,0,0.28);
  animation: slideUp 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(32px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Header */
.inquiry-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 24px 24px 20px;
  border-bottom: 1px solid #f0ebe3;
}
.inquiry-modal__title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.inquiry-modal__dot {
  flex-shrink: 0;
  width: 4px;
  height: 42px;
  background: #c40011;
  border-radius: 2px;
  margin-top: 2px;
}
.inquiry-modal__title {
  margin: 0 0 4px;
  color: #1d283d;
  font-size: 1.25rem;
  font-weight: 700;
}
.inquiry-modal__product {
  margin: 0;
  color: #9ca3af;
  font-size: 13px;
}
.inquiry-modal__close {
  flex-shrink: 0;
  width: 36px; height: 36px;
  border: 1px solid #e9e3db;
  border-radius: 8px;
  background: transparent;
  color: #9ca3af;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.18s;
}
.inquiry-modal__close:hover {
  background: #faf8f5;
  color: #c40011;
  border-color: #ddd5c8;
}

/* Form */
.inquiry-form {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.inquiry-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-group--full { grid-column: 1 / -1; }
.form-group label {
  color: #4a5568;
  font-size: 13px;
  font-weight: 600;
}
.req { color: #c40011; margin-left: 2px; }
.form-group input,
.form-group textarea {
  padding: 11px 14px;
  border: 1.5px solid #e9e3db;
  border-radius: 8px;
  background: #faf8f5;
  color: #1d283d;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s, background 0.2s;
  outline: none;
  resize: vertical;
}
.form-group input:focus,
.form-group textarea:focus {
  border-color: #c40011;
  background: #fff;
}
.form-group input:disabled,
.form-group textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.form-group input::placeholder,
.form-group textarea::placeholder { color: #c4bdb5; }

/* Error */
.inquiry-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  background: #fff5f5;
  border: 1px solid rgba(196,0,17,0.2);
  color: #c40011;
  font-size: 13px;
}

/* Footer */
.inquiry-form__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 4px;
}
.inquiry-form__note {
  margin: 0;
  color: #b0aa9f;
  font-size: 12px;
}
.btn-submit {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 26px;
  border: none;
  border-radius: 8px;
  background: #c40011;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.22s;
  box-shadow: 0 4px 12px rgba(196,0,17,0.28);
}
.btn-submit:hover:not(:disabled) {
  background: #a8000e;
  box-shadow: 0 6px 16px rgba(196,0,17,0.38);
  transform: translateY(-1px);
}
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Success */
.inquiry-success {
  padding: 40px 24px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.inquiry-success__icon { color: #22c55e; }
.inquiry-success h3 {
  margin: 0;
  color: #1d283d;
  font-size: 1.3rem;
  font-weight: 700;
}
.inquiry-success p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
  max-width: 320px;
}
.btn-close-success {
  margin-top: 8px;
  padding: 11px 28px;
  border: 1.5px solid #1d283d;
  border-radius: 8px;
  background: transparent;
  color: #1d283d;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-close-success:hover {
  background: #1d283d;
  color: #fff;
}

/* Responsive */
@media (max-width: 560px) {
  .inquiry-form__row { grid-template-columns: 1fr; }
  .inquiry-form__footer {
    flex-direction: column;
    align-items: stretch;
  }
  .btn-submit { justify-content: center; }
}
</style>
