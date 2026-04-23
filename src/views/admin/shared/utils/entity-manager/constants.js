export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const FIELD_GROUPS = {
  content: ["summary", "body", "description", "content", "message", "full_desc", "short_desc", "use_case"],
  media: ["image_id", "hero_image_id", "thumbnail_id", "media_id"],
};

export const BANNER_MEDIA_KEYWORDS = [
  "banner",
  "hero",
  "slider",
  "slide",
  "cover",
  "homepage",
];

export const MEDIA_NOISE_KEYWORDS = [
  "screenshot",
  "screen-shot",
  "screen shot",
  "capture",
  "tmp",
  "temp",
];

export const RELATION_ENTITIES = {
  language_id: "languages",
  category_id: null,
  project_id: "projects",
  branch_id: "branches",
  page_id: "pages",
  parent_id: null,
  block_id: "content_blocks",
};

export const ENTITY_MEDIA_RELATION_ENTITIES = {
  project_category: "project_categories",
  project: "projects",
};

export const ABOUT_SECTION_PREVIEW_MAP = {
  hero: "/about/company-introduction#page1",
  company_introduction: "/about/company-introduction#page2",
  chairman_speech: "/about/chairman-speech#page3",
  organization_chart: "/about/organization-chart#page4",
  corporate_culture: "/about/corporate-culture#page5",
  development_course: "/about/development-course#page6",
  leadership_care: "/about/leadership-care#page7",
  cooperative_partner: "/about/cooperative-partner#page8",
};

export const ABOUT_BLOCK_SECTION_MAP = {
  hero_summary: "hero",
  hero_nav: "hero",
  intro_media: "company_introduction",
  intro_video: "company_introduction",
  intro_paragraphs: "company_introduction",
  speech_profile: "chairman_speech",
  speech_body: "chairman_speech",
  speech_signature: "chairman_speech",
  org_chart_image: "organization_chart",
  culture_purpose: "corporate_culture",
  culture_mission: "corporate_culture",
  culture_spirit: "corporate_culture",
  culture_values: "corporate_culture",
  timeline: "development_course",
  leadership_care_gallery: "leadership_care",
  partner_categories: "cooperative_partner",
  partner_logos: "cooperative_partner",
};
