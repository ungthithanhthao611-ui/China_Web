<script setup>
import { computed, reactive, ref } from "vue";

const props = defineProps({
  formOpen: {
    type: Boolean,
    required: true,
  },
  entityKey: {
    type: String,
    required: true,
  },
  inlineEditorRef: {
    type: Object,
    default: null,
  },
  isFormModalEntity: {
    type: Boolean,
    required: true,
  },
  showInlineEditor: {
    type: Boolean,
    required: true,
  },
  inlineEditorPlacement: {
    type: String,
    required: true,
  },
  formMode: {
    type: String,
    required: true,
  },
  config: {
    type: Object,
    required: true,
  },
  formErrors: {
    type: Array,
    required: true,
  },
  hasMediaFields: {
    type: Boolean,
    required: true,
  },
  isVideosEntity: {
    type: Boolean,
    required: true,
  },
  isProductsEntity: {
    type: Boolean,
    default: false,
  },
  isBannerEntity: {
    type: Boolean,
    required: true,
  },
  uploadTargetField: {
    type: String,
    required: true,
  },
  mediaFieldOptions: {
    type: Array,
    required: true,
  },
  fieldLabel: {
    type: Function,
    required: true,
  },
  mediaUploadAccept: {
    type: Function,
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
  uploading: {
    type: Boolean,
    required: true,
  },
  uploadFileName: {
    type: String,
    default: "",
  },
  uploadFileExists: {
    type: Boolean,
    default: false,
  },
  visibleFormFields: {
    type: Array,
    required: true,
  },
  isTextarea: {
    type: Function,
    required: true,
  },
  form: {
    type: Object,
    required: true,
  },
  isBooleanField: {
    type: Function,
    required: true,
  },
  fieldHelpText: {
    type: Function,
    required: true,
  },
  mediaOptions: {
    type: Array,
    required: true,
  },
  selectedMediaPreviewUrl: {
    type: Function,
    required: true,
  },
  selectedMediaAsset: {
    type: Function,
    required: true,
  },
  selectedMediaLabel: {
    type: Function,
    required: true,
  },
  isVideoMediaRecord: {
    type: Function,
    required: true,
  },
  relationOptions: {
    type: Object,
    required: true,
  },
  relationSelectValue: {
    type: Function,
    required: true,
  },
  isSelectField: {
    type: Function,
    required: true,
  },
  selectOptions: {
    type: Function,
    required: true,
  },
  fieldPlaceholder: {
    type: Function,
    required: true,
  },
  inputType: {
    type: Function,
    required: true,
  },
  videoUploading: {
    type: Boolean,
    required: true,
  },
  videoUploadFile: {
    type: Object,
    default: null,
  },
  videoLibraryOptions: {
    type: Array,
    required: true,
  },
  isAllowedVideoUrl: {
    type: Function,
    required: true,
  },
  videoUrlHint: {
    type: Function,
    required: true,
  },
  isDirectVideoFile: {
    type: Function,
    required: true,
  },
  resolveMediaUrl: {
    type: Function,
    required: true,
  },
  selectedRelationSummary: {
    type: Function,
    required: true,
  },
  relationPreviewPath: {
    type: Function,
    required: true,
  },
  relationPreviewLabel: {
    type: Function,
    required: true,
  },
  editingRecordId: {
    type: [String, Number, null],
    default: null,
  },
  bannerDisplayTitle: {
    type: Function,
    required: true,
  },
  bannerTypeLabel: {
    type: Function,
    required: true,
  },
  bannerOrdinal: {
    type: Function,
    required: true,
  },
  canAdjustBannerFocus: {
    type: Function,
    required: true,
  },
  bannerFocusDragging: {
    type: Boolean,
    required: true,
  },
  bannerMediaUrl: {
    type: Function,
    required: true,
  },
  bannerFormMediaRecord: {
    type: Function,
    required: true,
  },
  bannerMediaAlt: {
    type: Function,
    required: true,
  },
  bannerFormImageStyle: {
    type: Function,
    required: true,
  },
  bannerFocusIndicatorStyle: {
    type: Function,
    required: true,
  },
  previewMediaOptions: {
    type: Array,
    required: true,
  },
  isImageMedia: {
    type: Function,
    required: true,
  },
  currentFormPreviewUrl: {
    type: Function,
    required: true,
  },
  saving: {
    type: Boolean,
    required: true,
  },
  fieldGroups: {
    type: Object,
    required: true,
  },
  productInlineUploading: {
    type: String,
    default: "",
  },
  galleryUploadProgress: {
    type: String,
    default: "",
  },
});

const emit = defineEmits([
  "close",
  "submit",
  "file-change",
  "video-file-change",
  "upload-media",
  "upload-video",
  "update:uploadTargetField",
  "update:uploadTitle",
  "update:uploadAltText",
  "update:field",
  "update:relation-field",
  "slug-input",
  "slug-source-input",
  "video-library-select",
  "reset-banner-focus",
  "banner-focus-start",
  "banner-focus-move",
  "banner-focus-stop",
  "inline-upload",
  "remove-gallery-url",
]);

function handleInlineFile(field, event) {
  const files = event?.target?.files;
  if (files && files.length) {
    emit("inline-upload", field, files);
    event.target.value = "";
  }
}

const isProductInlineUploadField = (field) =>
  props.isProductsEntity && (field === "image_url" || field === "gallery_urls");

const galleryUrlList = computed(() => {
  const raw = String(props.form?.gallery_urls || "");
  return raw
    .replace(/\r/g, "\n")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
});

const quickPreviewOpen = ref(true);

const safeConfigLabel = computed(() => props.config?.label || "Bản ghi");
const isOrdersEntity = computed(() => props.entityKey === "orders");
const orderEditableFields = computed(() => ["status", "payment_status", "note"]);
const orderReadonlyFields = computed(() => {
  const editable = new Set(orderEditableFields.value);
  return props.visibleFormFields.filter((field) => !editable.has(field));
});
const orderStatusField = computed(() =>
  props.visibleFormFields.includes("status") ? "status" : "",
);
const orderPaymentStatusField = computed(() =>
  props.visibleFormFields.includes("payment_status") ? "payment_status" : "",
);
const orderNoteField = computed(() =>
  props.visibleFormFields.includes("note") ? "note" : "",
);
const formatMoney = (value, currency = "VND") => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "-";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency || "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};
const orderFieldValue = (field) => {
  const value = props.form?.[field];
  if (field === "total_amount" || field === "subtotal_amount" || field === "shipping_fee" || field === "discount_amount") {
    return formatMoney(value, props.form?.currency || "VND");
  }
  if (field === "item_count") {
    const count = Number(value || 0);
    return `${count} sản phẩm`;
  }
  if (field === "created_at" || field === "updated_at" || field === "placed_at") {
    return value ? String(value).replace("T", " ").slice(0, 19) : "-";
  }
  return value === null || value === undefined || String(value).trim() === "" ? "-" : String(value);
};
const orderItems = computed(() =>
  Array.isArray(props.form?.items) ? props.form.items : [],
);
const orderHasItems = computed(() => orderItems.value.length > 0);
const orderCustomerContact = computed(() => {
  const values = [props.form?.customer_phone, props.form?.customer_email]
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  return values.length ? values.join(" • ") : "Chưa có thông tin liên hệ";
});
const orderAddressSummary = computed(() => {
  const address = String(props.form?.shipping_address || "").trim();
  return address || "Chưa có địa chỉ giao hàng";
});
const orderStatusText = computed(
  () => String(props.form?.status_label || props.form?.status || "Chưa cập nhật").trim(),
);
const orderPaymentStatusText = computed(
  () =>
    String(
      props.form?.payment_status_label || props.form?.payment_status || "Chưa cập nhật",
    ).trim(),
);
const orderPaymentMethodText = computed(
  () =>
    String(
      props.form?.payment_method_label || props.form?.payment_method || "Chưa cập nhật",
    ).trim(),
);
const orderStatusTone = computed(() => {
  const value = String(props.form?.status || "").trim().toLowerCase();
  if (value === "delivered") return "is-success";
  if (value === "cancelled") return "is-danger";
  if (["confirmed", "processing", "shipping"].includes(value)) return "is-info";
  return "is-warning";
});
const orderPaymentTone = computed(() => {
  const value = String(props.form?.payment_status || "").trim().toLowerCase();
  if (value === "paid") return "is-success";
  if (value === "refunded") return "is-danger";
  return "is-warning";
});
const orderItemImage = (item) => {
  const direct = String(item?.product_image_url || "").trim();
  return direct ? props.resolveMediaUrl(direct) : "";
};
const orderItemLineTotal = (item) =>
  formatMoney(item?.line_total, props.form?.currency || "VND");
const orderItemUnitPrice = (item) =>
  formatMoney(item?.unit_price, props.form?.currency || "VND");
const optionLabelRenderer = computed(() =>
  typeof props.config?.optionLabel === "function"
    ? props.config.optionLabel
    : null,
);
const relationSearchKeyword = reactive({});

const relationOptionText = (option, field) => {
  if (typeof optionLabelRenderer.value === "function") {
    return String(optionLabelRenderer.value(option, field) || "").trim();
  }
  if (field === "product_id") {
    const name = String(option?.name || option?.title || option?.slug || `#${option?.id || ""}`).trim();
    const sku = String(option?.sku || "").trim();
    return sku ? `${name} [${sku}]` : name;
  }
  return String(
    option?.title ||
      option?.name ||
      option?.slug ||
      option?.sku ||
      option?.code ||
      `#${option?.id || ""}`,
  ).trim();
};

const relationSearchValue = (field) =>
  String(relationSearchKeyword?.[field] || "").trim();

const updateRelationSearch = (field, value) => {
  relationSearchKeyword[field] = String(value || "");
};

const isSearchableRelationField = (field) =>
  props.isVideosEntity && field === "product_id";

const filteredRelationOptions = (field) => {
  const options = Array.isArray(props.relationOptions?.[field])
    ? props.relationOptions[field]
    : [];
  const keyword = relationSearchValue(field).toLowerCase();
  if (!keyword) return options;

  return options.filter((option) => {
    const searchableText = `${option?.id || ""} ${relationOptionText(option, field)} ${option?.sku || ""} ${option?.slug || ""}`
      .toLowerCase()
      .trim();
    return searchableText.includes(keyword);
  });
};

const isContentBlockItemsEditor = computed(
  () => props.entityKey === "content_block_items",
);

const currentBlockOption = computed(() => {
  const options = Array.isArray(props.relationOptions?.block_id)
    ? props.relationOptions.block_id
    : [];
  const currentId = Number(props.form?.block_id);
  if (!Number.isFinite(currentId)) return null;
  return (
    options.find((option) => Number(option?.id) === currentId) || null
  );
});

const currentBlockKey = computed(() => {
  const block = currentBlockOption.value;
  return String(
    block?.block_key ||
      block?.key ||
      block?.slug ||
      block?.code ||
      "",
  ).trim();
});

const currentBlockLabel = computed(() => {
  const block = currentBlockOption.value;
  if (!block) return "Chưa chọn khối";
  return String(
    block?.title ||
      block?.name ||
      block?.label ||
      block?.block_key ||
      `#${block?.id || ""}`,
  ).trim();
});

const previewItemKey = computed(() => String(props.form?.item_key || "").trim());
const previewTitle = computed(() => String(props.form?.title || "").trim());
const previewSubtitle = computed(() => String(props.form?.subtitle || "").trim());
const previewContent = computed(() => String(props.form?.content || "").trim());
const previewLink = computed(() => String(props.form?.link || "").trim());
const previewSortOrder = computed(() =>
  Number.isFinite(Number(props.form?.sort_order))
    ? Number(props.form?.sort_order)
    : null,
);
const previewImageUrl = computed(() =>
  props.selectedMediaPreviewUrl("image_id") || "",
);

const timelineParts = computed(() => {
  const raw = previewSubtitle.value;
  const match = raw.match(/^(\d{4})(?:[-\/](\d{1,2}))?$/);
  if (!match) return { year: "", month: "" };
  const year = match[1];
  const month = match[2] ? String(match[2]).padStart(2, "0") : "";
  return { year, month };
});

const previewHasContent = computed(
  () =>
    Boolean(previewTitle.value) ||
    Boolean(previewSubtitle.value) ||
    Boolean(previewContent.value) ||
    Boolean(previewImageUrl.value) ||
    Boolean(previewLink.value),
);

const supportsTranslation = computed(() => ["products", "product_categories"].includes(props.entityKey) && props.formMode === "edit");
</script>

<template>
  <div
    v-if="formOpen"
    ref="inlineEditorRef"
    :class="[
      'editor-shell',
      {
        'editor-shell--modal': isFormModalEntity,
        'editor-shell--inline-top':
          showInlineEditor && inlineEditorPlacement === 'top',
      },
    ]"
    @click.self="!isFormModalEntity && emit('close')"
  >
    <aside
      :class="['editor-panel', { 'editor-panel--modal': isFormModalEntity }]"
      @click.stop
      @mousedown.stop
    >
      <div class="editor-head">
        <div class="editor-head__content">
          <div class="editor-head__badge-wrap">
            <p class="eyebrow">{{ formMode === "create" ? "Thêm mới" : "Chỉnh sửa" }}</p>
            <span class="editor-head__badge">{{ safeConfigLabel }}</span>
            <button
              v-if="supportsTranslation"
              type="button"
              class="btn btn-sm btn-secondary btn-translate"
              :disabled="saving"
              @click="emit('auto-translate')"
            >
              <span v-if="saving" class="spinner-tiny"></span>
              <span v-else>🪄</span>
              Dịch Tự Động
            </button>
          </div>
          <h3>{{ formMode === "create" ? `Tạo ${safeConfigLabel}` : `Sửa ${safeConfigLabel}` }}</h3>
        </div>
        <button
          type="button"
          class="icon-btn"
          aria-label="Close editor"
          @click="emit('close')"
        >
          ×
        </button>
      </div>

      <div v-if="formErrors.length" class="form-errors">
        <p v-for="error in formErrors" :key="error">{{ error }}</p>
      </div>

      <div v-if="hasMediaFields && !isProductsEntity" class="upload-panel-minimal">
        <div class="upload-panel-minimal__header">
          <div class="upload-panel-minimal__title">
            <span class="upload-panel-badge">QUẢN LÝ MEDIA</span>
            <strong>Tải Ảnh/Video Lên Cloudinary</strong>
          </div>
        </div>

        <div class="upload-panel-grid">
          <div class="upload-panel-section">
            <div class="upload-input-group">
              <label>Bạn muốn tải lên cho mục nào?</label>
              <select
                :value="uploadTargetField"
                class="minimal-select"
                @change="emit('update:uploadTargetField', $event.target.value)"
              >
                <option v-for="field in mediaFieldOptions" :key="field" :value="field">
                  {{ fieldLabel(field) }}
                </option>
              </select>
            </div>
            
            <div class="upload-input-group">
              <label>Chọn tệp từ máy tính</label>
              <div class="file-input-wrapper">
                <input 
                  type="file" 
                  :accept="mediaUploadAccept()" 
                  id="minimal-file-input"
                  @change="emit('file-change', $event)" 
                />
                <label for="minimal-file-input" class="file-input-proxy">
                  <span v-if="uploadFileName">{{ uploadFileName }}</span>
                  <span v-else>Nhấn để chọn file...</span>
                </label>
              </div>
            </div>
          </div>

          <div class="upload-panel-section">
            <div class="upload-input-row">
              <div class="upload-input-group">
                <label>Tiêu đề ảnh (Tùy chọn)</label>
                <input
                  :value="uploadTitle"
                  type="text"
                  placeholder="Ví dụ: Ảnh sản phẩm OS.01"
                  @input="emit('update:uploadTitle', $event.target.value)"
                />
              </div>
              <div class="upload-input-group">
                <label>Mô tả Alt (SEO)</label>
                <input
                  :value="uploadAltText"
                  type="text"
                  placeholder="Mô tả cho công cụ tìm kiếm"
                  @input="emit('update:uploadAltText', $event.target.value)"
                />
              </div>
            </div>

            <button
              type="button"
              class="btn btn-primary btn-sm"
              style="width: 100%; margin-top: 12px;"
              :disabled="uploading || !uploadFileExists"
              @click="emit('upload-media')"
            >
              <div v-if="uploading" class="spinner-tiny"></div>
              <span>{{ uploading ? "Đang tải..." : "Tải lên Cloudinary" }}</span>
            </button>
          </div>
        </div>
      </div>

      <form class="dynamic-form" @submit.prevent="emit('submit')">
        <section v-if="isOrdersEntity" class="order-editor-detail">
          <div class="order-editor-detail__hero">
            <div>
              <p class="eyebrow">Chi tiết đơn hàng COD</p>
              <h4>{{ form.code || `Đơn #${editingRecordId || '-'}` }}</h4>
              <p>{{ orderAddressSummary }}</p>
            </div>
            <div class="order-editor-detail__hero-metrics">
              <article>
                <span>Tổng thanh toán</span>
                <strong>{{ formatMoney(form.total_amount, form.currency || 'VND') }}</strong>
              </article>
              <article>
                <span>Phương thức</span>
                <strong>{{ orderPaymentMethodText }}</strong>
              </article>
              <article>
                <span>Trạng thái</span>
                <div class="order-editor-status-row">
                  <span :class="['order-editor-status-chip', orderStatusTone]">
                    {{ orderStatusText }}
                  </span>
                  <span :class="['order-editor-status-chip', 'is-soft', orderPaymentTone]">
                    {{ orderPaymentStatusText }}
                  </span>
                </div>
              </article>
            </div>
          </div>

          <div class="order-editor-grid">
            <article class="order-editor-card">
              <div class="order-editor-card__head">
                <strong>Thông tin khách hàng</strong>
                <small>Thông tin nhận hàng và liên hệ</small>
              </div>
              <div class="order-editor-info-list">
                <div class="order-editor-info-item">
                  <span>Người nhận</span>
                  <strong>{{ orderFieldValue('customer_name') }}</strong>
                </div>
                <div class="order-editor-info-item">
                  <span>Liên hệ</span>
                  <strong>{{ orderCustomerContact }}</strong>
                </div>
                <div class="order-editor-info-item order-editor-info-item--wide">
                  <span>Địa chỉ giao hàng</span>
                  <strong>{{ orderAddressSummary }}</strong>
                </div>
                <div class="order-editor-info-item order-editor-info-item--wide">
                  <span>Ghi chú hiện tại</span>
                  <strong>{{ orderFieldValue('note') }}</strong>
                </div>
              </div>
            </article>

            <article class="order-editor-card">
              <div class="order-editor-card__head">
                <strong>Tổng quan thanh toán</strong>
                <small>Các mốc tiền và thời gian của đơn</small>
              </div>
              <div class="order-editor-info-list">
                <div v-for="field in orderReadonlyFields" :key="field" class="order-editor-info-item">
                  <span>{{ fieldLabel(field) }}</span>
                  <strong>{{ orderFieldValue(field) }}</strong>
                </div>
              </div>
            </article>
          </div>

          <article class="order-editor-card order-editor-card--full">
            <div class="order-editor-card__head">
              <strong>Danh sách sản phẩm</strong>
              <small>
                {{ orderHasItems ? `${orderItems.length} sản phẩm trong đơn` : 'Chưa có dữ liệu sản phẩm' }}
              </small>
            </div>

            <div v-if="orderHasItems" class="order-editor-items">
              <article v-for="(item, index) in orderItems" :key="`${item.product_id || 'item'}-${index}`" class="order-editor-item-card">
                <div class="order-editor-item-card__media">
                  <img
                    v-if="orderItemImage(item)"
                    :src="orderItemImage(item)"
                    :alt="item.product_name || `Sản phẩm ${index + 1}`"
                    loading="lazy"
                  />
                  <div v-else class="order-editor-item-card__placeholder">
                    SP {{ index + 1 }}
                  </div>
                </div>
                <div class="order-editor-item-card__content">
                  <div class="order-editor-item-card__title-row">
                    <strong>{{ item.product_name || `Sản phẩm #${index + 1}` }}</strong>
                    <span>{{ orderItemLineTotal(item) }}</span>
                  </div>
                  <div class="order-editor-item-card__meta">
                    <span>SKU: {{ item.product_sku || 'Chưa có SKU' }}</span>
                    <span>Số lượng: {{ item.quantity || 0 }}</span>
                    <span>Đơn giá: {{ orderItemUnitPrice(item) }}</span>
                  </div>
                  <a
                    v-if="item.product_slug"
                    class="order-editor-item-card__link"
                    :href="`/product/${item.product_slug}`"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Xem sản phẩm công khai
                  </a>
                </div>
              </article>
            </div>
            <p v-else class="order-editor-empty">Chưa có dữ liệu sản phẩm cho đơn hàng này.</p>
          </article>

          <article class="order-editor-card order-editor-card--full">
            <div class="order-editor-card__head">
              <strong>Cập nhật trạng thái vận hành</strong>
              <small>Admin chỉ chỉnh sửa trạng thái và ghi chú, các dữ liệu còn lại là thông tin đơn thật.</small>
            </div>
            <div class="order-editor-actions-grid">
              <label v-if="orderStatusField" class="editor-field">
                <span>{{ fieldLabel(orderStatusField) }}</span>
                <select
                  :value="form[orderStatusField]"
                  @change="emit('update:field', orderStatusField, $event.target.value)"
                >
                  <option value="">None</option>
                  <option
                    v-for="option in selectOptions(orderStatusField)"
                    :key="typeof option === 'string' ? option : option.value"
                    :value="typeof option === 'string' ? option : option.value"
                  >
                    {{ typeof option === 'string' ? option : option.label }}
                  </option>
                </select>
                <small v-if="fieldHelpText(orderStatusField)" class="field-help">{{ fieldHelpText(orderStatusField) }}</small>
              </label>

              <label v-if="orderPaymentStatusField" class="editor-field">
                <span>{{ fieldLabel(orderPaymentStatusField) }}</span>
                <select
                  :value="form[orderPaymentStatusField]"
                  @change="emit('update:field', orderPaymentStatusField, $event.target.value)"
                >
                  <option value="">None</option>
                  <option
                    v-for="option in selectOptions(orderPaymentStatusField)"
                    :key="typeof option === 'string' ? option : option.value"
                    :value="typeof option === 'string' ? option : option.value"
                  >
                    {{ typeof option === 'string' ? option : option.label }}
                  </option>
                </select>
                <small v-if="fieldHelpText(orderPaymentStatusField)" class="field-help">{{ fieldHelpText(orderPaymentStatusField) }}</small>
              </label>

              <label v-if="orderNoteField" class="editor-field order-editor-note-field">
                <span>{{ fieldLabel(orderNoteField) }}</span>
                <textarea
                  :value="form[orderNoteField]"
                  rows="5"
                  :placeholder="fieldPlaceholder(orderNoteField)"
                  @input="emit('update:field', orderNoteField, $event.target.value)"
                ></textarea>
                <small v-if="fieldHelpText(orderNoteField)" class="field-help">{{ fieldHelpText(orderNoteField) }}</small>
              </label>
            </div>
          </article>
        </section>

        <template v-else>
          <label
            v-for="field in visibleFormFields"
            :key="field"
            :class="[
              'editor-field',
              {
                wide:
                  isTextarea(field) ||
                  (isVideosEntity && (field === 'video_url' || field === 'thumbnail_id')),
              },
            ]"
          >
            <span>{{ fieldLabel(field) }}</span>

            <input
              v-if="isBooleanField(field)"
              :checked="Boolean(form[field])"
              type="checkbox"
              @change="emit('update:field', field, $event.target.checked)"
            />

            <div v-else-if="fieldGroups.media.includes(field)" class="field-stack">
              <select
                :value="form[field] ?? null"
                @change="emit('update:field', field, $event.target.value === 'null' ? null : Number($event.target.value))"
              >
                <option :value="'null'">No media</option>
                <option v-for="media in mediaOptions" :key="media.id" :value="media.id">
                  #{{ media.id }} - {{ media.title || media.file_name || media.url }}
                </option>
              </select>
              <small v-if="fieldHelpText(field)" class="field-help">{{ fieldHelpText(field) }}</small>
              <div v-if="selectedMediaPreviewUrl(field)" class="selected-media-preview">
                <video
                  v-if="isVideoMediaRecord(selectedMediaAsset(field))"
                  :src="selectedMediaPreviewUrl(field)"
                  muted
                  controls
                  playsinline
                  preload="metadata"
                ></video>
                <img
                  v-else
                  :src="selectedMediaPreviewUrl(field)"
                  :alt="selectedMediaLabel(field)"
                  loading="lazy"
                />
                <div>
                  <strong>{{ selectedMediaLabel(field) }}</strong>
                  <small v-if="form[field]">#{{ form[field] }}</small>
                  <small v-else>Nguồn ngoài / metadata cũ</small>
                </div>
              </div>
            </div>

            <div
              v-else-if="relationOptions[field] && isSearchableRelationField(field)"
              class="field-stack relation-combobox"
            >
              <input
                type="text"
                :value="relationSearchValue(field)"
                :placeholder="fieldPlaceholder(field) || 'Tim kiem san pham theo ten, SKU, slug...'"
                @input="updateRelationSearch(field, $event.target.value)"
              />
              <select
                :value="relationSelectValue(field)"
                @change="emit('update:relation-field', field, $event.target.value)"
              >
                <option value="">-- Chon san pham --</option>
                <option
                  v-for="option in filteredRelationOptions(field)"
                  :key="option.id"
                  :value="String(option.id)"
                >
                  #{{ option.id }} - {{ relationOptionText(option, field) }}
                </option>
              </select>
              <small
                v-if="relationSearchValue(field) && !filteredRelationOptions(field).length"
                class="field-help"
              >
                Khong tim thay san pham phu hop voi tu khoa.
              </small>
            </div>

            <select
              v-else-if="relationOptions[field]"
              :value="relationSelectValue(field)"
              @change="emit('update:relation-field', field, $event.target.value)"
            >
              <option value="">None</option>
              <option
                v-for="option in relationOptions[field]"
                :key="option.id"
                :value="String(option.id)"
              >
                <template v-if="optionLabelRenderer">
                  {{ optionLabelRenderer(option, field) }}
                </template>
                <template v-else>
                  #{{ option.id }} -
                  {{ option.title || option.name || option.slug || option.config_key || option.code }}
                </template>
              </option>
            </select>

            <select
              v-else-if="isSelectField(field)"
              :value="form[field]"
              @change="emit('update:field', field, $event.target.value)"
            >
              <option value="">None</option>
              <option
                v-for="option in selectOptions(field)"
                :key="typeof option === 'string' ? option : option.value"
                :value="typeof option === 'string' ? option : option.value"
              >
                {{ typeof option === "string" ? option : option.label }}
              </option>
            </select>

            <textarea
              v-else-if="isTextarea(field)"
              :value="form[field]"
              rows="5"
              :placeholder="fieldPlaceholder(field)"
              @input="emit('update:field', field, $event.target.value)"
            ></textarea>

            <div v-else-if="(isVideosEntity || isProductsEntity) && field === 'video_url'" class="field-stack">
              <div class="video-url-section">
                <div class="video-url-row">
                  <input
                    :value="form[field]"
                    :type="inputType(field)"
                    placeholder="https://... or select from library"
                    @input="emit('update:field', field, $event.target.value)"
                  />
                  <button
                    type="button"
                    class="btn btn-secondary"
                    :disabled="videoUploading"
                    @click="emit('upload-video')"
                  >
                    {{ videoUploading ? "Uploading..." : "Upload" }}
                  </button>
                </div>
                <div class="video-file-row">
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v,.mp4,.webm,.ogg,.mov,.m4v"
                    @change="emit('video-file-change', $event)"
                  />
                  <span class="video-file-row__name">
                    {{ videoUploadFile?.name || "Chua chon file video" }}
                  </span>
                </div>
                <small class="field-help">
                  Chon file video tu may tinh roi bam Upload de tu dong dien vao Video URL.
                </small>
                <div class="video-library-select">
                  <select @change="emit('video-library-select', $event.target.value)">
                    <option value="">-- Chon tu Thu vien Media --</option>
                    <option v-for="media in videoLibraryOptions" :key="media.id" :value="media.url">
                      #{{ media.id }} - {{ media.title || media.file_name }}
                    </option>
                  </select>
                  <small v-if="videoLibraryOptions.length">
                    Hoac chon tu {{ videoLibraryOptions.length }} video da tai len
                  </small>
                </div>
              </div>
              <small v-if="fieldHelpText(field)" class="field-help">{{ fieldHelpText(field) }}</small>
              <div
                v-if="form.video_url"
                class="video-url-helper"
                :class="{
                  'is-valid': isAllowedVideoUrl(form.video_url),
                  'is-invalid': !isAllowedVideoUrl(form.video_url),
                }"
              >
                <span>
                  {{ isAllowedVideoUrl(form.video_url) ? "Nguồn video hợp lệ" : "Nguồn video không hợp lệ" }}
                </span>
                <small>
                  {{ videoUrlHint(form.video_url) || "Hỗ trợ: MP4/WebM, YouTube, Vimeo" }}
                </small>
              </div>
              <video
                v-if="isDirectVideoFile(form.video_url)"
                class="video-form-preview"
                :src="resolveMediaUrl(form.video_url)"
                muted
                controls
                playsinline
                preload="metadata"
              ></video>
              <a
                v-else-if="isAllowedVideoUrl(form.video_url)"
                class="video-form-link"
                :href="resolveMediaUrl(form.video_url)"
                target="_blank"
                rel="noreferrer noopener"
              >
                Mở nguồn video
              </a>
            </div>

            <div v-else-if="isProductInlineUploadField(field)" class="field-stack">
              <template v-if="field === 'image_url'">
                <input
                  :value="form[field]"
                  type="text"
                  :placeholder="fieldPlaceholder(field)"
                  @input="emit('update:field', field, $event.target.value)"
                />
                <div class="inline-upload-row">
                  <label :for="`inline-upload-${field}`" class="inline-upload-btn" :class="{ 'is-uploading': productInlineUploading === field }">
                    <div v-if="productInlineUploading === field" class="spinner-tiny"></div>
                    <span v-else>📁</span>
                    <span>{{ productInlineUploading === field ? 'Đang tải...' : 'Chọn file tải lên' }}</span>
                  </label>
                  <input
                    :id="`inline-upload-${field}`"
                    type="file"
                    accept="image/*"
                    class="inline-upload-input"
                    :disabled="!!productInlineUploading"
                    @change="handleInlineFile(field, $event)"
                  />
                </div>
                <small v-if="fieldHelpText(field)" class="field-help">{{ fieldHelpText(field) }}</small>
                <div
                  v-if="form[field] && /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(String(form[field]))"
                  class="url-image-preview"
                >
                  <img :src="resolveMediaUrl(form[field])" alt="Preview" loading="lazy" />
                </div>
              </template>

              <template v-else>
                <div class="inline-upload-row">
                  <label :for="`inline-upload-${field}`" class="inline-upload-btn" :class="{ 'is-uploading': productInlineUploading === field }">
                    <div v-if="productInlineUploading === field" class="spinner-tiny"></div>
                    <span v-else>📁</span>
                    <span v-if="productInlineUploading === field && galleryUploadProgress">Đang tải {{ galleryUploadProgress }}...</span>
                    <span v-else-if="productInlineUploading === field">Đang tải...</span>
                    <span v-else>Chọn nhiều ảnh tải lên</span>
                  </label>
                  <input
                    :id="`inline-upload-${field}`"
                    type="file"
                    accept="image/*"
                    multiple
                    class="inline-upload-input"
                    :disabled="!!productInlineUploading"
                    @change="handleInlineFile(field, $event)"
                  />
                  <small class="gallery-count" v-if="galleryUrlList.length">Đang có: {{ galleryUrlList.length }} ảnh</small>
                </div>
                <small v-if="fieldHelpText(field)" class="field-help">{{ fieldHelpText(field) }}</small>

                <div v-if="galleryUrlList.length" class="gallery-preview-grid">
                  <div
                    v-for="(url, idx) in galleryUrlList"
                    :key="idx"
                    class="gallery-preview-item"
                  >
                    <video
                      v-if="isDirectVideoFile(url)"
                      :src="resolveMediaUrl(url)"
                      muted
                      playsinline
                      preload="metadata"
                    ></video>
                    <img v-else :src="resolveMediaUrl(url)" :alt="`Gallery ${idx + 1}`" loading="lazy" />
                    <button
                      type="button"
                      class="gallery-preview-remove"
                      title="Xóa ảnh này"
                      @click="emit('remove-gallery-url', url)"
                    >×</button>
                    <small class="gallery-preview-idx">#{{ idx + 1 }}</small>
                  </div>
                </div>
                <div v-else class="gallery-empty-hint">Chưa có ảnh liên quan. Nhấn "Chọn nhiều ảnh tải lên" để thêm.</div>

                <details class="gallery-raw-toggle">
                  <summary>Chỉnh sửa URL thủ công</summary>
                  <textarea
                    :value="form[field]"
                    rows="3"
                    :placeholder="fieldPlaceholder(field)"
                    @input="emit('update:field', field, $event.target.value)"
                  ></textarea>
                </details>
              </template>
            </div>

            <input
              v-else
              :value="form[field]"
              :type="inputType(field) === 'url' ? 'text' : inputType(field)"
              :placeholder="field === 'slug' ? fieldPlaceholder(field) || 'auto-generated-from-name' : fieldPlaceholder(field)"
              @input="
                emit('update:field', field, $event.target.value);
                field === 'slug'
                  ? emit('slug-input')
                  : emit('slug-source-input', field)
              "
            />

            <div
              v-if="!isProductInlineUploadField(field) && inputType(field) === 'url' && form[field] && /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(String(form[field]))"
              class="url-image-preview"
            >
              <img :src="resolveMediaUrl(form[field])" alt="Preview" loading="lazy" />
            </div>

            <small
              v-if="!isProductInlineUploadField(field) && !fieldGroups.media.includes(field) && fieldHelpText(field)"
              class="field-help"
            >
              {{ fieldHelpText(field) }}
            </small>
            <small
              v-if="relationOptions[field] && selectedRelationSummary(field)"
              class="field-help field-help--selected"
            >
              {{ selectedRelationSummary(field) }}
            </small>
            <a
              v-if="relationOptions[field] && relationPreviewPath(field)"
              class="field-help field-help--selected"
              :href="relationPreviewPath(field)"
              target="_blank"
              rel="noreferrer noopener"
            >
              {{ relationPreviewLabel(field) }}
            </a>
          </label>
        </template>

        <div v-if="isBannerEntity" class="banner-form-preview">
          <p class="eyebrow">Xem trước trực tiếp (Live Preview)</p>
          <div class="banner-preview-card banner-preview-card--editor">
            <div
              class="banner-preview-card__media"
              :class="{
                'banner-preview-card__media--interactive': canAdjustBannerFocus(),
                'is-dragging': bannerFocusDragging,
              }"
              @pointerdown="emit('banner-focus-start', $event)"
              @pointermove="emit('banner-focus-move', $event)"
              @pointerup="emit('banner-focus-stop', $event)"
              @pointercancel="emit('banner-focus-stop', $event)"
              @pointerleave="emit('banner-focus-stop', $event)"
            >
              <video
                v-if="bannerMediaUrl(bannerFormMediaRecord()) && isVideoMediaRecord(bannerFormMediaRecord())"
                :src="bannerMediaUrl(bannerFormMediaRecord())"
                muted
                playsinline
                preload="metadata"
                autoplay
                loop
              ></video>
              <img
                v-else-if="bannerMediaUrl(bannerFormMediaRecord())"
                :src="bannerMediaUrl(bannerFormMediaRecord())"
                :alt="bannerMediaAlt(bannerFormMediaRecord())"
                :style="bannerFormImageStyle()"
                loading="lazy"
              />
              <div
                v-if="canAdjustBannerFocus()"
                class="banner-focus-indicator"
                :style="bannerFocusIndicatorStyle()"
              ></div>
              <div v-else class="banner-preview-card__empty">Select or upload banner media</div>
              <div class="banner-preview-card__overlay"></div>
            </div>
            <div class="banner-preview-card__content">
              <div class="banner-preview-card__meta">
                <span>{{ bannerTypeLabel(form.banner_type) }}</span>
                <strong>{{ bannerOrdinal(form.sort_order || editingRecordId || 1) }}</strong>
              </div>
              <h4>
                {{ form.title || bannerDisplayTitle({ ...form, id: editingRecordId || 1 }) }}
              </h4>
              <p v-if="form.subtitle">{{ form.subtitle }}</p>
              <small>{{ form.button_text || form.link || "CTA text or link will appear here" }}</small>
            </div>
          </div>
          <div v-if="canAdjustBannerFocus()" class="banner-focus-tools">
            <small>Nhấp chuột hoặc kéo trực tiếp trên ảnh xem trước để chọn vùng hiển thị (crop area).</small>
            <div class="banner-focus-tools__row">
              <small>
                X: {{ Math.round(form.focus_x ?? 50) }}% / Y: {{ Math.round(form.focus_y ?? 50) }}%
              </small>
              <button
                type="button"
                class="btn btn-secondary"
                @click="emit('reset-banner-focus')"
              >
                Căn giữa
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="!isBannerEntity && !isVideosEntity && !isProductsEntity && previewMediaOptions.length"
          class="media-preview-list"
        >
          <article v-for="media in previewMediaOptions" :key="media.id">
            <img
              v-if="isImageMedia(media)"
              :src="resolveMediaUrl(media.url)"
              :alt="media.alt_text || media.title || ''"
            />
            <video
              v-else-if="isVideoMediaRecord(media)"
              :src="resolveMediaUrl(media.url)"
              muted
              playsinline
              preload="metadata"
            ></video>
            <span v-else>{{ media.asset_type }}</span>
            <small>#{{ media.id }} {{ media.title || media.file_name }}</small>
          </article>
        </div>

        <div v-if="currentFormPreviewUrl()" class="selected-media-preview selected-media-preview--link">
          <div>
            <strong>Xem trước Public</strong>
            <small>{{ currentFormPreviewUrl() }}</small>
          </div>
          <a :href="currentFormPreviewUrl()" target="_blank" rel="noreferrer noopener">
            Mở xem trước bản ghi hiện tại
          </a>
        </div>

        <section
          v-if="isContentBlockItemsEditor"
          class="content-item-preview"
        >
          <div class="content-item-preview__head">
            <div>
              <strong>Xem nhanh trước khi lưu</strong>
              <small>Preview dữ liệu hiện tại để kiểm tra nhanh trước khi ghi DB.</small>
            </div>
            <button
              type="button"
              class="btn btn-secondary"
              @click="quickPreviewOpen = !quickPreviewOpen"
            >
              {{ quickPreviewOpen ? "Ẩn preview" : "Xem nhanh" }}
            </button>
          </div>

          <div v-if="quickPreviewOpen" class="content-item-preview__body">
            <div class="content-item-preview__meta">
              <span>Khối: {{ currentBlockLabel }}</span>
              <span v-if="currentBlockKey">block_key: {{ currentBlockKey }}</span>
              <span v-if="previewItemKey">item_key: {{ previewItemKey }}</span>
              <span v-if="previewSortOrder !== null">thứ tự: {{ previewSortOrder }}</span>
            </div>

            <article v-if="previewHasContent" class="content-item-preview__card">
              <img
                v-if="previewImageUrl"
                :src="previewImageUrl"
                alt="Preview media"
                loading="lazy"
              />
              <div class="content-item-preview__content">
                <h4 v-if="previewTitle">{{ previewTitle }}</h4>
                <p v-if="previewSubtitle">{{ previewSubtitle }}</p>
                <p
                  v-if="currentBlockKey === 'timeline' && timelineParts.year"
                  class="content-item-preview__timeline"
                >
                  Mốc thời gian: {{ timelineParts.year }}{{ timelineParts.month ? `-${timelineParts.month}` : "" }}
                </p>
                <p v-if="previewContent" class="content-item-preview__text">{{ previewContent }}</p>
                <a
                  v-if="previewLink"
                  :href="previewLink"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {{ previewLink }}
                </a>
              </div>
            </article>

            <p v-else class="content-item-preview__empty">
              Chưa có dữ liệu để preview. Nhập tiêu đề/nội dung/hình ảnh để xem nhanh.
            </p>
          </div>
        </section>

        <div class="editor-footer">
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          :disabled="saving"
          @click="emit('close')"
        >
          Hủy bỏ
        </button>
        <button
          type="button"
          class="btn btn-primary btn-sm"
          :disabled="saving"
          @click="emit('submit')"
        >
          {{ saving ? "Đang lưu..." : "Lưu thay đổi" }}
        </button>
      </div>
      </form>
    </aside>
  </div>
</template>


<style scoped>
@import '@/views/admin/shared/components/AdminCoreEditor.css';
</style>


