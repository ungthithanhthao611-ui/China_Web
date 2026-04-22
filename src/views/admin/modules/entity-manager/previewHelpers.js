import {
  ABOUT_BLOCK_SECTION_MAP,
  ABOUT_SECTION_PREVIEW_MAP,
  BANNER_MEDIA_KEYWORDS,
  MEDIA_NOISE_KEYWORDS,
} from "./constants";

export function createEntityManagerPreviewHelpers({
  apiOrigin,
  entityKey,
  getRelationOptions,
  getRecords,
  getMediaOptions,
}) {
  const resolveMediaUrl = (url) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    return `${apiOrigin}${url.startsWith("/") ? url : `/${url}`}`;
  };

  const relationLabelFromOptions = (field, value) => {
    if (value === null || value === undefined || value === "") return "";
    const options = getRelationOptions(field);
    const match = options.find((option) => String(option.id) === String(value));
    if (!match) return "";
    return String(
      match.title ||
        match.name ||
        match.slug ||
        match.config_key ||
        match.code ||
        `#${match.id}`,
    ).trim();
  };

  const pagePreviewPathById = (pageId) => {
    if (!pageId) return "";
    const pageRecord = [
      ...getRelationOptions("page_id"),
      ...getRelationOptions("entity_id"),
    ].find((option) => String(option.id) === String(pageId));
    if (!pageRecord?.slug) return "";
    return `/${pageRecord.slug}`;
  };

  const resolveAboutSectionPreviewHref = (anchor) => {
    const normalizedAnchor = String(anchor || "").trim().toLowerCase();
    return (
      ABOUT_SECTION_PREVIEW_MAP[normalizedAnchor] ||
      "/about/company-introduction#page1"
    );
  };

  const resolvePageSectionHref = (record) => {
    const anchor = String(record?.anchor || "").trim();
    const pageSlug = String(record?.page_slug || "").trim();
    const pagePath = pageSlug ? `/${pageSlug}` : pagePreviewPathById(record?.page_id);

    if (record?.preview_href) {
      return String(record.preview_href).trim();
    }

    if (pageSlug === "about") {
      return resolveAboutSectionPreviewHref(anchor);
    }

    return anchor && pagePath ? `${pagePath}#${anchor}` : pagePath;
  };

  const resolveContentBlockPreview = (record) => {
    const entityType = String(record?.entity_type || "").trim();
    const entityId = record?.entity_id;
    const pagePath = entityType === "page" ? pagePreviewPathById(entityId) : "";
    const pageRecord =
      entityType === "page"
        ? getRelationOptions("entity_id").find(
            (option) => String(option.id) === String(entityId),
          )
        : null;
    const pageSlug = String(pageRecord?.slug || "").trim();
    const blockKey = String(record?.block_key || "").trim();
    const aboutSectionAnchor = ABOUT_BLOCK_SECTION_MAP[blockKey];

    if (pageSlug === "about" && aboutSectionAnchor) {
      return {
        href: resolveAboutSectionPreviewHref(aboutSectionAnchor),
        targetLabel: `section: ${aboutSectionAnchor}`,
      };
    }

    return {
      href: pagePath,
      targetLabel: pagePath ? "page public" : "",
    };
  };

  const resolveBlockRecordById = (blockId) => {
    if (!blockId) return null;

    const relationBlock = getRelationOptions("block_id").find(
      (option) => String(option.id) === String(blockId),
    );
    if (relationBlock) {
      return relationBlock;
    }

    return getRecords().find((entry) => String(entry.id) === String(blockId)) || null;
  };

  const pageSectionPreview = (record) => {
    const anchor = String(record?.anchor || "").trim();
    const title = String(record?.title || "").trim();
    const pageId = record?.page_id;
    const pageLabel = relationLabelFromOptions("page_id", pageId);
    const previewHref = resolvePageSectionHref(record);

    return {
      badge: record?.section_type || "section",
      title: title || anchor || `Section #${record?.id || ""}`,
      summary: pageLabel ? `Thuộc page: ${pageLabel}` : `Page ID: ${pageId || "-"}`,
      meta: [
        anchor ? `anchor: ${anchor}` : "",
        record?.sort_order !== null && record?.sort_order !== undefined
          ? `order: ${record.sort_order}`
          : "",
      ].filter(Boolean),
      href: previewHref,
      linkLabel: previewHref ? "Mở section public" : "",
    };
  };

  const contentBlockPreview = (record) => {
    const blockKey = String(record?.block_key || "").trim();
    const blockType = String(record?.block_type || "").trim();
    const entityType = String(record?.entity_type || "").trim();
    const entityId = record?.entity_id;
    const pageLabel =
      entityType === "page" ? relationLabelFromOptions("entity_id", entityId) : "";
    const previewTarget = resolveContentBlockPreview(record);

    return {
      badge: blockType || "block",
      title:
        String(record?.title || "").trim() || blockKey || `Block #${record?.id || ""}`,
      summary: pageLabel
        ? `Block này đang cấp dữ liệu cho page: ${pageLabel}`
        : `entity_type: ${entityType || "-"} · entity_id: ${entityId || "-"}`,
      meta: [
        blockKey ? `key: ${blockKey}` : "",
        previewTarget.targetLabel,
        record?.sort_order !== null && record?.sort_order !== undefined
          ? `order: ${record.sort_order}`
          : "",
      ].filter(Boolean),
      href: previewTarget.href,
      linkLabel: previewTarget.href ? "Mở block public" : "",
    };
  };

  const contentBlockItemPreview = (record) => {
    const blockId = record?.block_id;
    const blockRecord = resolveBlockRecordById(blockId);
    const blockLabel = blockRecord
      ? String(blockRecord.title || blockRecord.block_key || `#${blockRecord.id}`).trim()
      : relationLabelFromOptions("block_id", blockId);
    const itemKey = String(record?.item_key || "").trim();
    const metadata =
      record?.metadata_json && typeof record.metadata_json === "object"
        ? record.metadata_json
        : null;
    const category = metadata?.category ? `category: ${metadata.category}` : "";
    const year = metadata?.year ? `year: ${metadata.year}` : "";
    const previewTarget = blockRecord
      ? resolveContentBlockPreview(blockRecord)
      : { href: "", targetLabel: "" };

    return {
      badge: "item",
      title:
        String(record?.title || "").trim() || itemKey || `Item #${record?.id || ""}`,
      summary: blockLabel ? `Thuộc block: ${blockLabel}` : `Block ID: ${blockId || "-"}`,
      meta: [
        itemKey ? `key: ${itemKey}` : "",
        previewTarget.targetLabel,
        category,
        year,
        record?.sort_order !== null && record?.sort_order !== undefined
          ? `order: ${record.sort_order}`
          : "",
      ].filter(Boolean),
      href: previewTarget.href,
      linkLabel: previewTarget.href ? "Mở item trên public" : "",
    };
  };

  const safeMetadataObject = (value) => {
    if (!value) return null;
    if (typeof value === "object") return value;
    if (typeof value !== "string") return null;

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const normalizedExternalUrl = (url) => {
    const raw = String(url || "").trim();
    if (!raw) return "";

    let normalized = raw
      .replace(/^['"`]+|['"`]+$/g, "")
      .replace(/\\\//g, "/")
      .replace(/&amp;/gi, "&")
      .trim();

    if (normalized.startsWith("//")) {
      normalized = `https:${normalized}`;
    }

    try {
      const parsed = new URL(normalized);

      const driveFileMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/i);
      const driveId =
        driveFileMatch?.[1] ||
        parsed.searchParams.get("id") ||
        (parsed.hostname.includes("drive.google.com") && parsed.pathname.includes("/uc")
          ? parsed.searchParams.get("id")
          : "");
      if (driveId && /(^|\.)drive\.google\.com$/i.test(parsed.hostname)) {
        return `https://drive.google.com/uc?export=view&id=${driveId}`;
      }

      if (/^www\.dropbox\.com$/i.test(parsed.hostname)) {
        parsed.searchParams.set("raw", "1");
        parsed.searchParams.delete("dl");
        return parsed.toString();
      }

      return parsed.toString();
    } catch {
      return normalized;
    }
  };

  const isDirectImageFile = (url) => {
    const normalized = normalizedExternalUrl(url).toLowerCase();
    return /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/.test(normalized);
  };

  const isDirectVideoFile = (url) => {
    const normalized = normalizedExternalUrl(url).toLowerCase();
    return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/.test(normalized);
  };

  const isAllowedVideoUrl = (url) => {
    const normalized = normalizedExternalUrl(url);
    if (!normalized) return false;

    try {
      const parsed = new URL(normalized);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return false;
      }

      return (
        isDirectVideoFile(normalized) ||
        /(^|\.)youtube\.com$/i.test(parsed.hostname) ||
        /(^|\.)youtu\.be$/i.test(parsed.hostname) ||
        /(^|\.)vimeo\.com$/i.test(parsed.hostname) ||
        parsed.pathname.includes("/video/")
      );
    } catch {
      return false;
    }
  };

  const isVideoMediaRecord = (record) => {
    if (!record) return false;
    if (String(record.asset_type || "").toLowerCase() === "video") return true;
    return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(String(record.url || "").trim());
  };

  const isImageMedia = (record) => Boolean(record) && !isVideoMediaRecord(record);

  const mediaSearchText = (record) =>
    [record?.title, record?.file_name, record?.alt_text, record?.storage_path, record?.url]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

  const isNoiseMediaAsset = (record) => {
    const text = mediaSearchText(record);
    return MEDIA_NOISE_KEYWORDS.some((keyword) => text.includes(keyword));
  };

  const isBannerRelatedMedia = (record) => {
    const text = mediaSearchText(record);
    return BANNER_MEDIA_KEYWORDS.some((keyword) => text.includes(keyword));
  };

  const getMediaOptionById = (mediaId) =>
    getMediaOptions().find((item) => String(item.id) === String(mediaId)) || null;

  const resolvePreviewMediaUrl = (url) => {
    const normalized = normalizedExternalUrl(url);
    if (!normalized) return "";
    // If it's already absolute, return as is
    if (/^https?:\/\//i.test(normalized)) return normalized;

    // Even if it starts with common asset paths, it's likely a backend path, so prefix it.
    // resolveMediaUrl handles the prefixing logic correctly.
    return resolveMediaUrl(normalized);
  };

  const buildMediaPreviewFromMediaRecord = (
    media,
    fallbackLabel = "Media preview",
  ) => {
    if (!media?.url) return null;

    if (isVideoMediaRecord(media)) {
      return {
        kind: "video",
        url: resolveMediaUrl(media.url),
        label: media.alt_text || media.title || fallbackLabel,
      };
    }

    if (isImageMedia(media)) {
      return {
        kind: "image",
        url: resolveMediaUrl(media.url),
        label: media.alt_text || media.title || fallbackLabel,
      };
    }

    return null;
  };

  const buildMediaPreviewFromUrl = (rawUrl, fallbackLabel = "Media preview") => {
    const normalized = normalizedExternalUrl(rawUrl);
    if (!normalized) return null;

    const isGoogleDriveDirectPreview =
      /^https:\/\/drive\.google\.com\/uc\?/i.test(normalized);
    const isLikelyImageHost =
      /res\.cloudinary\.com|googleusercontent\.com|en\.sinodecor\.com|imgur\.com/i.test(
        normalized,
      ) || normalized.includes("/cms/image/");

    if (isDirectVideoFile(normalized)) {
      return {
        kind: "video",
        url: resolvePreviewMediaUrl(normalized),
        label: fallbackLabel,
      };
    }

    if (isAllowedVideoUrl(normalized)) {
      return {
        kind: "external-video",
        url: resolvePreviewMediaUrl(normalized),
        label: fallbackLabel,
      };
    }

    if (
      isDirectImageFile(normalized) ||
      isGoogleDriveDirectPreview ||
      isLikelyImageHost ||
      normalized.startsWith("/")
    ) {
      return {
        kind: "image",
        url: resolvePreviewMediaUrl(normalized),
        label: fallbackLabel,
      };
    }

    return null;
  };

  const previewMedia = (record) => {
    if (entityKey.value === "page_sections") {
      return buildMediaPreviewFromMediaRecord(
        getMediaOptionById(record?.image_id),
        "Section image preview",
      );
    }

    if (entityKey.value !== "content_block_items") {
      return null;
    }

    // Prioritize linked media asset if image_id exists
    if (record?.image_id) {
      const linkedMedia = buildMediaPreviewFromMediaRecord(
        getMediaOptionById(record.image_id),
        "Ảnh đại diện mục",
      );
      if (linkedMedia) return linkedMedia;
    }

    // Fallback to metadata only if no image_id found or it failed to resolve
    const metadata = safeMetadataObject(record?.metadata_json);
    const metadataPreview = buildMediaPreviewFromUrl(
      metadata?.src ||
        metadata?.image_url ||
        metadata?.image ||
        metadata?.external_source_url ||
        metadata?.source_url ||
        metadata?.video_url ||
        metadata?.thumbnail_url,
      "Xem trước từ metadata",
    );
    if (metadataPreview) return metadataPreview;

    if (record?.item_key === "video_url" || isAllowedVideoUrl(record?.link)) {
      return buildMediaPreviewFromUrl(record?.link, "Nguồn video");
    }

    return null;
  };

  const previewCard = (record) => {
    if (entityKey.value === "page_sections") return pageSectionPreview(record);
    if (entityKey.value === "content_blocks") return contentBlockPreview(record);
    if (entityKey.value === "content_block_items") return contentBlockItemPreview(record);
    if (entityKey.value === "inquiry_submissions") {
      return {
        badge: "Phản hồi",
        title: record.admin_response ? "Đã trả lời" : "Chưa trả lời",
        summary: record.admin_response
          ? `Nội dung: ${record.admin_response}`
          : "Yêu cầu này chưa có nội dung phản hồi nội bộ.",
      };
    }
    return null;
  };

  const hasRichPreview = (record) =>
    ["page_sections", "content_blocks", "content_block_items", "inquiry_submissions"].includes(
      entityKey.value,
    ) && Boolean(previewCard(record));

  const previewStatusText = (record) => {
    if (entityKey.value === "page_sections") {
      return record?.anchor
        ? "Anchor đã sẵn sàng để map section"
        : "Thiếu anchor section";
    }
    if (entityKey.value === "content_blocks") {
      return record?.block_key
        ? "Block key đã sẵn sàng cho frontend normalizer"
        : "Thiếu block key";
    }
    if (entityKey.value === "content_block_items") {
      return record?.item_key
        ? "Item key đã sẵn sàng cho block rendering"
        : "Thiếu item key";
    }
    if (entityKey.value === "inquiry_submissions") {
      return record?.admin_response ? "Đã phản hồi khách hàng" : "Yêu cầu mới chưa xử lý";
    }
    return "";
  };

  const previewStatusTone = (record) => {
    const statusText = previewStatusText(record);
    return statusText.startsWith("Thiếu") ? "is-warning" : "is-ready";
  };

  const mediaAssetPreviewUrl = (record) =>
    record?.asset_type === "image" && record?.url ? resolveMediaUrl(record.url) : "";

  const mediaAssetLabel = (record) => record?.title || record?.file_name || record?.url || "-";

  const selectedMediaAsset = (form, field) => getMediaOptionById(form[field]);

  const selectedMediaPreviewUrl = (form, field) => {
    const media = selectedMediaAsset(form, field);
    return media?.url ? resolveMediaUrl(media.url) : "";
  };

  const selectedMediaLabel = (form, field) => {
    const media = getMediaOptionById(form[field]);
    return media ? mediaAssetLabel(media) : "No media selected";
  };

  const rowThumbnailUrl = (record) =>
    resolveMediaUrl(record?.thumbnail?.url || record?.thumbnail_url || "");

  const videoPreviewUrl = (record) =>
    record?.video_url ? resolveMediaUrl(record.video_url) : "";

  const videoUrlHint = (url) => {
    const normalized = String(url || "").trim();
    if (!normalized) return "";
    if (isDirectVideoFile(normalized)) return "Direct video file detected";
    if (/youtube\.com|youtu\.be/i.test(normalized)) return "YouTube link detected";
    if (/vimeo\.com/i.test(normalized)) return "Vimeo link detected";
    return "External video link detected";
  };

  return {
    resolveMediaUrl,
    relationLabelFromOptions,
    pagePreviewPathById,
    resolveAboutSectionPreviewHref,
    resolvePageSectionHref,
    resolveContentBlockPreview,
    resolveBlockRecordById,
    safeMetadataObject,
    normalizedExternalUrl,
    isDirectImageFile,
    isDirectVideoFile,
    isAllowedVideoUrl,
    isVideoMediaRecord,
    isImageMedia,
    isNoiseMediaAsset,
    isBannerRelatedMedia,
    getMediaOptionById,
    pageSectionPreview,
    contentBlockPreview,
    contentBlockItemPreview,
    previewMedia,
    previewCard,
    hasRichPreview,
    previewStatusText,
    previewStatusTone,
    mediaAssetPreviewUrl,
    mediaAssetLabel,
    selectedMediaAsset,
    selectedMediaPreviewUrl,
    selectedMediaLabel,
    rowThumbnailUrl,
    videoPreviewUrl,
    videoUrlHint,
  };
}


