export function clampBannerFocus(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 50;
  return Math.min(100, Math.max(0, numeric));
}

export function createEntityManagerBannerHelpers({
  form,
  isBannerEntity,
  getMediaOptionById,
  resolveMediaUrl,
  isVideoMediaRecord,
}) {
  const bannerMediaRecord = (record) =>
    record?.image || getMediaOptionById(record?.image_id) || null;

  const bannerFormMediaRecord = () => getMediaOptionById(form.image_id);

  const resolveBannerMedia = (record) => {
    if (
      typeof record === "object" &&
      "url" in (record || {}) &&
      "asset_type" in (record || {})
    ) {
      return record;
    }

    return bannerMediaRecord(record);
  };

  const bannerMediaUrl = (record) => {
    const media = resolveBannerMedia(record);
    return media?.url ? resolveMediaUrl(media.url) : "";
  };

  const bannerMediaAlt = (record) => {
    const media = resolveBannerMedia(record);
    return media?.alt_text || media?.title || record?.title || "Banner media";
  };

  const bannerTypeLabel = (value) => {
    const labels = {
      hero: "Hero",
      cta: "CTA",
      page: "Page",
      section: "Section",
      footer: "Footer",
    };

    return (
      labels[
        String(value || "")
          .trim()
          .toLowerCase()
      ] ||
      String(value || "Banner").trim() ||
      "Banner"
    );
  };

  const bannerOrdinal = (value) => {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      return String(Math.trunc(numeric)).padStart(2, "0");
    }
    return "00";
  };

  const bannerDisplayTitle = (record) => {
    if (String(record?.title || "").trim()) {
      return String(record.title).trim();
    }

    return `${bannerTypeLabel(record?.banner_type)} ${bannerOrdinal(record?.sort_order || record?.id)}`;
  };

  const bannerObjectPositionFromRecord = (record) =>
    `${clampBannerFocus(record?.focus_x)}% ${clampBannerFocus(record?.focus_y)}%`;

  const bannerObjectPositionFromForm = () =>
    `${clampBannerFocus(form.focus_x)}% ${clampBannerFocus(form.focus_y)}%`;

  const bannerImageStyle = (record) => ({
    objectPosition: bannerObjectPositionFromRecord(record),
  });

  const bannerFormImageStyle = () => ({
    objectPosition: bannerObjectPositionFromForm(),
  });

  const canAdjustBannerFocus = () => {
    const media = bannerFormMediaRecord();
    return (
      isBannerEntity.value &&
      Boolean(media) &&
      Boolean(bannerMediaUrl(media)) &&
      !isVideoMediaRecord(media) &&
      "focus_x" in form &&
      "focus_y" in form
    );
  };

  const bannerFocusIndicatorStyle = () => ({
    left: `${clampBannerFocus(form.focus_x)}%`,
    top: `${clampBannerFocus(form.focus_y)}%`,
  });

  const applyBannerFocusFromPointer = (event) => {
    if (!canAdjustBannerFocus()) return;
    const card = event.currentTarget;
    if (!card || typeof card.getBoundingClientRect !== "function") return;

    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const nextX = ((event.clientX - rect.left) / rect.width) * 100;
    const nextY = ((event.clientY - rect.top) / rect.height) * 100;

    form.focus_x = clampBannerFocus(nextX);
    form.focus_y = clampBannerFocus(nextY);
  };

  const resetBannerFocus = () => {
    if (!isBannerEntity.value) return;
    form.focus_x = 50;
    form.focus_y = 50;
  };

  return {
    bannerMediaRecord,
    bannerFormMediaRecord,
    bannerMediaUrl,
    bannerMediaAlt,
    bannerTypeLabel,
    bannerOrdinal,
    bannerDisplayTitle,
    bannerImageStyle,
    bannerFormImageStyle,
    canAdjustBannerFocus,
    bannerFocusIndicatorStyle,
    applyBannerFocusFromPointer,
    resetBannerFocus,
  };
}
