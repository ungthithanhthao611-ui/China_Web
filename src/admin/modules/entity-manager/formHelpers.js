import {
  ENTITY_MEDIA_RELATION_ENTITIES,
  FIELD_GROUPS,
  RELATION_ENTITIES,
  SLUG_PATTERN,
} from "./constants";

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
    if (formMode !== "create") return;
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
      (props.entityKey === "posts"
        ? "post_categories"
        : props.entityKey === "projects"
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

    return `Selected: ${label}`;
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
      return "Open selected target";
    }
    if (props.entityKey === "project_category_items" && field === "category_id") {
      return "Open category preview";
    }
    if (props.entityKey === "project_category_items" && field === "project_id") {
      return "Open project detail";
    }
    return "Open preview";
  };

  const mediaUploadAccept = () =>
    config.value?.mediaUploadAccept || "image/*,video/*,application/pdf";

  const mediaUploadAssetFolder = () =>
    String(config.value?.cloudinaryAssetFolder || "").trim();

  const mediaUploadPublicIdBase = () => {
    const seed = uploadTitle.value || form.title || "";
    return String(seed)
      .trim()
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
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
        "size",
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
    if (typeof value === "boolean") return value ? "Yes" : "No";
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
    slugManuallyEdited.value = Boolean(record?.id && String(record?.slug || "").trim());
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

    requiredFields.forEach((field) => {
      if (
        form[field] === null ||
        form[field] === undefined ||
        String(form[field]).trim() === ""
      ) {
        errors.push(`${fieldLabel(field)} is required.`);
      }
    });

    if (form.slug && !SLUG_PATTERN.test(String(form.slug))) {
      errors.push(
        "Slug must be lowercase, use numbers or hyphen, and cannot contain spaces.",
      );
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email))) {
      errors.push("Email format is invalid.");
    }

    if (isVideosEntity.value && form.video_url && !isAllowedVideoUrl(form.video_url)) {
      errors.push(
        "Video URL must be a valid http/https direct video link, YouTube URL, or Vimeo URL.",
      );
    }

    if (props.entityKey === "contacts") {
      const latitude = parseCoordinateValue(form.latitude);
      const longitude = parseCoordinateValue(form.longitude);

      if (latitude === null) {
        errors.push("Latitude must be a valid number.");
      } else if (latitude < -90 || latitude > 90) {
        errors.push("Latitude must be between -90 and 90.");
      }

      if (longitude === null) {
        errors.push("Longitude must be a valid number.");
      } else if (longitude < -180 || longitude > 180) {
        errors.push("Longitude must be between -180 and 180.");
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
        errors.push(`${fieldLabel(field)} must be a number.`);
      }
    });

    if (form.metadata_json && typeof form.metadata_json === "string") {
      try {
        JSON.parse(form.metadata_json);
      } catch {
        errors.push("Metadata JSON must be valid JSON.");
      }
    }

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
