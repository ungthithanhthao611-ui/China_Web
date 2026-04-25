import {
  ENTITY_MEDIA_RELATION_ENTITIES,
  FIELD_GROUPS,
  RELATION_ENTITIES,
  SLUG_PATTERN,
} from "@/views/admin/shared/utils/entity-manager/constants.js";

export function createEntityManagerFormHelpers({
  props,
  form,
  formErrors,
  relationOptions,
  uploadTitle,
  uploadAltText,
  uploadTargetField,
  slugManuallyEdited,
  config,
  formFields,
  mediaFieldOptions,
  statusOptions,
  relationLabelFromOptions,
  isBannerEntity,
  isEntityMediaEntity,
  isVideosEntity,
  clampBannerFocus,
  isAllowedVideoUrl,
}) {
  const recordDisplayName = (record = null) => {
    const source = record || form;
    return String(
      source?.[config.value?.titleField] ||
        source?.title ||
        source?.name ||
        source?.slug ||
        "",
    ).trim();
  };

  const recordDisplayLabel = (record = null, editingRecordId = null) => {
    const name = recordDisplayName(record);
    if (name) return name;
    const fallbackId = record?.id || editingRecordId;
    return fallbackId ? `#${fallbackId}` : "#record";
  };

  const entityLabelForAction = (record = null) => {
    const configLabel = String(config.value?.label || "Record").trim();
    const singular = configLabel.endsWith("s")
      ? configLabel.slice(0, -1)
      : configLabel;
    return recordDisplayName(record) || singular || "Record";
  };

  const fieldLabel = (field) =>
    config.value?.fieldLabels?.[field] ||
    field.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  const fieldPlaceholder = (field) => config.value?.placeholders?.[field] || "";

  const fieldHelpText = (field) => config.value?.helpText?.[field] || "";

  const slugify = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const syncSlugFromSource = (formMode, slugSourceField) => {
    if (!slugSourceField || !("slug" in form)) return;
    if (slugManuallyEdited.value) return;
    form.slug = slugify(form[slugSourceField]);
  };

  const handleSlugSourceInput = (field, slugSourceField, formMode) => {
    if (field !== slugSourceField) return;
    syncSlugFromSource(formMode, slugSourceField);
  };

  const handleSlugInput = (slugSourceField, formMode) => {
    const normalizedSlug = slugify(form.slug);
    form.slug = normalizedSlug;
    slugManuallyEdited.value = Boolean(normalizedSlug);

    if (!normalizedSlug) {
      slugManuallyEdited.value = false;
      syncSlugFromSource(formMode, slugSourceField);
    }
  };

  const configSelectOptions = (field) => {
    if (isEntityMediaEntity.value && field === "group_name") {
      const optionsByEntityType = config.value?.selectOptionsByEntityType?.[field];
      const entityType = String(form.entity_type || "").trim();
      const typedOptions = optionsByEntityType?.[entityType];
      if (Array.isArray(typedOptions) && typedOptions.length) {
        return typedOptions;
      }
    }

    const options = config.value?.selectOptions?.[field];
    return Array.isArray(options) ? options : null;
  };

  const configDefaultValue = (field) => config.value?.defaultValues?.[field];

  const isUnsafeIntegerField = (field) => {
    if (field === "entity_id" && isEntityMediaEntity.value) {
      return true;
    }

    if (
      field === "category_id" &&
      ["projects", "project_category_items"].includes(props.entityKey)
    ) {
      return true;
    }

    if (field === "parent_id" && props.entityKey === "project_categories") {
      return true;
    }

    return false;
  };

  const relationSelectValue = (field) => {
    const value = form[field];
    if (value === null || value === undefined || value === "") return "";
    return String(value);
  };

  const updateRelationField = (field, rawValue) => {
    if (rawValue === "" || rawValue === null || rawValue === undefined) {
      form[field] = null;
      return;
    }

    form[field] = isUnsafeIntegerField(field) ? String(rawValue) : Number(rawValue);
  };

  const resolveRelationMap = () => {
    const relationMap = {
      ...RELATION_ENTITIES,
      ...(config.value?.relationEntities || {}),
    };
    relationMap.category_id =
      relationMap.category_id ||
      (props.entityKey === "projects"
        ? "project_categories"
        : null);
    relationMap.parent_id =
      relationMap.parent_id ||
      (props.entityKey === "pages"
        ? "pages"
        : props.entityKey === "branches"
          ? "branches"
          : props.entityKey.includes("categor")
            ? props.entityKey
            : null);

    if (isEntityMediaEntity.value) {
      const entityType = String(form.entity_type || "").trim();
      relationMap.entity_id =
        ENTITY_MEDIA_RELATION_ENTITIES[entityType] ||
        ENTITY_MEDIA_RELATION_ENTITIES.project_category;
    }

    return relationMap;
  };

  const entityMediaTargetTypeLabel = () => {
    if (!isEntityMediaEntity.value) return "";
    return String(form.entity_type || "").trim() === "project"
      ? "Project target"
      : "Project Category target";
  };

  const selectedRelationSummary = (field) => {
    const label = relationLabelFromOptions(field, form[field]);
    if (!label) return "";

    if (field === "entity_id" && isEntityMediaEntity.value) {
      return `${entityMediaTargetTypeLabel()}: ${label}`;
    }

    return `Đã chọn: ${label}`;
  };

  const relationPreviewPath = (field) => {
    if (field === "entity_id" && isEntityMediaEntity.value) {
      const selectedOption = relationOptions[field]?.find(
        (option) => String(option.id) === String(form[field]),
      );
      if (!selectedOption) return "";

      const entityType = String(form.entity_type || "").trim();
      if (entityType === "project_category") {
        return `/project_list/${selectedOption.id}.html`;
      }
      if (entityType === "project" && selectedOption.slug) {
        return `/project/${selectedOption.slug}`;
      }
      return "";
    }

    if (props.entityKey === "project_category_items") {
      if (field === "category_id" && form.category_id) {
        const anchor = String(form.anchor || "").trim();
        return `/project_list/${form.category_id}.html${anchor ? `#${anchor}` : ""}`;
      }

      if (field === "project_id") {
        const selectedOption = relationOptions[field]?.find(
          (option) => String(option.id) === String(form[field]),
        );
        if (selectedOption?.slug) {
          return `/project/${selectedOption.slug}`;
        }
      }
    }

    return "";
  };

  const relationPreviewLabel = (field) => {
    if (field === "entity_id" && isEntityMediaEntity.value) {
      return "Xem trang đích đã chọn";
    }
    if (props.entityKey === "project_category_items" && field === "category_id") {
      return "Xem trước chuyên mục";
    }
    if (props.entityKey === "project_category_items" && field === "project_id") {
      return "Xem chi tiết dự án";
    }
    return "Mở xem trước";
  };

  const mediaUploadAccept = () =>
    config.value?.mediaUploadAccept || "image/*,video/*,application/pdf";

  const mediaUploadAssetFolder = () => {
    const configuredFolder = String(config.value?.cloudinaryAssetFolder || "").trim();
    if (props.entityKey !== "products") {
      return configuredFolder;
    }

    const productFolderName = slugify(
      form.slug || form.name || form.sku || uploadTitle.value || "product",
    );

    return `products/${productFolderName}`;
  };

  const mediaUploadPublicIdBase = (fileName = "") => {
    const normalizedFileName = String(fileName || "")
      .trim()
      .replace(/\.[a-z0-9]+$/i, "");
    const fileSeed = slugify(normalizedFileName);
    const recordSeed = slugify(uploadTitle.value || form.name || form.title || form.slug || "");

    if (props.entityKey === "products") {
      return fileSeed || recordSeed || "product-file";
    }

    return recordSeed || fileSeed;
  };

  const inputType = (field) => {
    if (
      [
        "sort_order",
        "language_id",
        "category_id",
        "project_id",
        "branch_id",
        "page_id",
        "parent_id",
        "block_id",
        "entity_id",
        "award_year",
        "project_year",
        "width",
        "height",
        "image_id",
        "hero_image_id",
        "thumbnail_id",
        "media_id",
        "focus_x",
        "focus_y",
      ].includes(field)
    ) {
      return "number";
    }
    if (field === "email") return "email";
    if (
      field.endsWith("_url") ||
      field === "url" ||
      field === "link" ||
      field === "video_url"
    ) {
      return "url";
    }
    if (field.endsWith("_at")) return "datetime-local";
    return "text";
  };

  const isTextarea = (field) =>
    FIELD_GROUPS.content.includes(field) ||
    field === "meta_description" ||
    field === "config_value" ||
    field === "metadata_json";

  const isBooleanField = (field) =>
    field === "is_active" ||
    field === "is_primary" ||
    field === "is_default" ||
    field === "is_featured";

  const relationFetchTargetCount = (entityName) => {
    if (
      ["projects", "project_categories", "project_category_items"].includes(
        String(entityName || "").trim(),
      )
    ) {
      return 500;
    }
    return 100;
  };

  const isSelectField = (field) =>
    Boolean(configSelectOptions(field)) ||
    field === "status" ||
    field === "asset_type" ||
    field === "banner_type" ||
    field === "branch_type" ||
    field === "contact_type";

  const selectOptions = (field) => {
    const configuredOptions = configSelectOptions(field);
    if (configuredOptions) {
      return configuredOptions;
    }

    const options = {
      status: statusOptions.value,
      asset_type: ["image", "video", "document", "file"],
      banner_type: ["hero", "cta", "page", "section", "footer"],
      branch_type: ["subsidiary", "branch", "office"],
      contact_type: ["headquarters", "branch", "sales", "support"],
    };
    return options[field] || [];
  };

  const formatCell = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "boolean") return value ? "Bật/Phát" : "Tắt/Ẩn";
    if (typeof value === "string" && value.length > 80) {
      return `${value.slice(0, 80)}...`;
    }
    return value;
  };

  const normalizeDatetimeForInput = (value) => {
    if (!value) return "";
    return String(value).slice(0, 16);
  };

  const parseCoordinateValue = (value) => {
    const raw = String(value ?? "").trim();
    if (!raw) {
      return null;
    }

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const BLOCK_ITEM_KEY_RULES = {
    hero_summary: /^(headline|description|cover_image)$/,
    intro_media: /^cover_image$/,
    intro_video: /^(video_button|video_url)$/,
    intro_paragraphs: /^paragraph_\d+$/,
    speech_body: /^(vision|mission)$/,
    culture_values: /^value_\d+$/,
    timeline: /^milestone_\d+$/,
    leadership_care_gallery: /^leader_\d+$/,
    org_chart_image: /^main_chart$/,
  };

  const parseMetadataJsonSafe = () => {
    if (!form.metadata_json) return null;
    if (typeof form.metadata_json === "object") return form.metadata_json;
    if (typeof form.metadata_json !== "string") return null;

    const raw = form.metadata_json.trim();
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return "__invalid_json__";
    }
  };

  const parseTimelineSubtitle = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return { year: "", month: "" };

    const match = raw.match(/^(\d{4})(?:[-/.](\d{1,2}))?$/);
    if (!match) return { year: "", month: "" };
    return { year: match[1], month: match[2] ? String(match[2]).padStart(2, "0") : "" };
  };

  const validateContentBlockItemRules = (errors, metadataValue) => {
    if (props.entityKey !== "content_block_items") return;

    const itemKey = String(form.item_key || "").trim();
    if (itemKey && !/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(itemKey)) {
      errors.push(
        "item_key chỉ được chứa chữ thường không dấu, số và dấu gạch dưới (_).",
      );
    }

    const selectedBlock = (relationOptions.block_id || []).find(
      (option) => String(option.id) === String(form.block_id),
    );
    const blockKey = String(selectedBlock?.block_key || "").trim();
    if (!blockKey || !itemKey) return;

    const expectedPattern = BLOCK_ITEM_KEY_RULES[blockKey];
    if (expectedPattern && !expectedPattern.test(itemKey)) {
      errors.push(
        `item_key không đúng chuẩn cho block "${blockKey}".`,
      );
    }

    if (blockKey === "speech_body" && !String(form.content || "").trim()) {
      errors.push('Block "speech_body" yêu cầu nhập nội dung cho vision/mission.');
    }

    if (blockKey === "timeline") {
      const yearFromMetadata =
        metadataValue && metadataValue !== "__invalid_json__"
          ? String(metadataValue.year ?? "").trim()
          : "";
      const { year: yearFromSubtitle } = parseTimelineSubtitle(form.subtitle);
      const year = yearFromMetadata || yearFromSubtitle;
      if (!year) {
        errors.push(
          'Block "timeline" yêu cầu Năm. Hãy nhập ở trường "Phụ đề" dạng 2024 hoặc 2024-01.',
        );
      }
    }

    if (blockKey === "leadership_care_gallery" && !String(form.subtitle || "").trim()) {
      errors.push('Block "leadership_care_gallery" yêu cầu "subtitle" là chức vụ.');
    }
  };

  const setDefaultFormValues = (record = {}) => {
    Object.keys(form).forEach((key) => delete form[key]);

    formFields.value.forEach((field) => {
      if (field in record) {
        form[field] = field.endsWith("_at")
          ? normalizeDatetimeForInput(record[field])
          : record[field];
        return;
      }

      const configuredDefault = configDefaultValue(field);
      if (configuredDefault !== undefined) {
        form[field] = configuredDefault;
        return;
      }

      if (isBooleanField(field)) {
        form[field] = field === "is_active";
        return;
      }
      if (field === "status") {
        form[field] = config.value?.defaultStatus || statusOptions.value[0]?.value || "draft";
        return;
      }
      if (field === "language_id") {
        form[field] = relationOptions.language_id?.[0]?.id || 1;
        return;
      }
      if (field === "sort_order") {
        if (
          props.entityKey === "project_category_items" ||
          props.entityKey === "entity_media"
        ) {
          form[field] = "";
          return;
        }
        form[field] = 0;
        return;
      }
      form[field] = "";
    });

    uploadTargetField.value = isBannerEntity.value
      ? "image_id"
      : config.value?.mediaUploadTargetField || mediaFieldOptions.value[0] || "image_id";

    if (isBannerEntity.value) {
      form.focus_x = clampBannerFocus(form.focus_x);
      form.focus_y = clampBannerFocus(form.focus_y);
    }

    uploadTitle.value = record?.title || "";
    uploadAltText.value = record?.title || "";
    formErrors.value = [];
    slugManuallyEdited.value = false;
  };

  const cleanPayload = () => {
    const payload = {};

    formFields.value.forEach((field) => {
      const value = form[field];
      if (value === "") {
        payload[field] = null;
        return;
      }

      if (field === "metadata_json" && typeof value === "string") {
        payload[field] = value.trim() ? JSON.parse(value) : null;
        return;
      }

      if (inputType(field) === "number" && !isUnsafeIntegerField(field)) {
        payload[field] = value === null || value === undefined ? null : Number(value);
        return;
      }

      payload[field] = value;
    });

    return payload;
  };

  const validateForm = () => {
    const errors = [];
    const requiredFields = config.value?.required || [];
    const metadataValue = parseMetadataJsonSafe();

    requiredFields.forEach((field) => {
      if (
        form[field] === null ||
        form[field] === undefined ||
        String(form[field]).trim() === ""
      ) {
        errors.push(`Trường "${fieldLabel(field)}" là bắt buộc.`);
      }
    });

    if (form.slug && !SLUG_PATTERN.test(String(form.slug))) {
      errors.push(
        "Slug (đường dẫn) phải là chữ thường, chỉ chứa số, chữ cái không dấu hoặc dấu gạch ngang, không chứa dấu cách.",
      );
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email))) {
      errors.push("Định dạng email không hợp lệ.");
    }

    if (isVideosEntity.value && form.video_url && !isAllowedVideoUrl(form.video_url)) {
      errors.push(
        "URL video phải là liên kết trực tiếp (http/https), hoặc link YouTube/Vimeo hợp lệ.",
      );
    }

    if (props.entityKey === "contacts") {
      const latitude = parseCoordinateValue(form.latitude);
      const longitude = parseCoordinateValue(form.longitude);

      if (latitude === null) {
        errors.push("Vĩ độ (Latitude) phải là một con số.");
      } else if (latitude < -90 || latitude > 90) {
        errors.push("Vĩ độ phải nằm trong khoảng từ -90 đến 90.");
      }

      if (longitude === null) {
        errors.push("Kinh độ (Longitude) phải là một con số.");
      } else if (longitude < -180 || longitude > 180) {
        errors.push("Kinh độ phải nằm trong khoảng từ -180 đến 180.");
      }
    }

    formFields.value.forEach((field) => {
      if (
        inputType(field) === "number" &&
        !isUnsafeIntegerField(field) &&
        form[field] !== "" &&
        form[field] !== null &&
        !Number.isFinite(Number(form[field]))
      ) {
        errors.push(`Trường "${fieldLabel(field)}" phải là một con số.`);
      }
    });

    if (metadataValue === "__invalid_json__") {
      errors.push("Dữ liệu Metadata JSON không đúng định dạng JSON.");
    }

    validateContentBlockItemRules(errors, metadataValue);

    formErrors.value = errors;
    return errors.length === 0;
  };

  return {
    recordDisplayName,
    recordDisplayLabel,
    entityLabelForAction,
    fieldLabel,
    fieldPlaceholder,
    fieldHelpText,
    slugify,
    syncSlugFromSource,
    handleSlugSourceInput,
    handleSlugInput,
    configSelectOptions,
    configDefaultValue,
    isUnsafeIntegerField,
    relationSelectValue,
    updateRelationField,
    resolveRelationMap,
    entityMediaTargetTypeLabel,
    selectedRelationSummary,
    relationPreviewPath,
    relationPreviewLabel,
    mediaUploadAccept,
    mediaUploadAssetFolder,
    mediaUploadPublicIdBase,
    inputType,
    isTextarea,
    isBooleanField,
    relationFetchTargetCount,
    isSelectField,
    selectOptions,
    formatCell,
    normalizeDatetimeForInput,
    parseCoordinateValue,
    setDefaultFormValues,
    cleanPayload,
    validateForm,
  };
}
