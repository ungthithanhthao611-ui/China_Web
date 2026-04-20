export const DEFAULT_STATUS_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
]

export const POST_STATUS_OPTIONS = [
  { value: 'draft', label: 'Bản nháp' },
  { value: 'published', label: 'Xuất bản chính thức' },
  { value: 'archived', label: 'Lưu trữ' },
]

export const CATEGORY_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

export const CONTENT_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

export const ENTITY_MANAGER_CONFIGS = {
  pages: {
    label: 'Pages',
    eyebrow: 'CMS page records',
    description: 'Manage canonical CMS pages. For the About flow, this table should keep the single parent page record `about`, while the detailed sub-sections are managed in Page Sections and Content Blocks.',
    titleField: 'title',
    table: ['id', 'title', 'slug', 'page_type', 'status', 'language_id', 'sort_order'],
    required: ['slug', 'language_id'],
    fields: ['slug', 'title', 'summary', 'body', 'page_type', 'language_id', 'parent_id', 'status', 'meta_title', 'meta_description', 'sort_order'],
    statusOptions: CONTENT_STATUS_OPTIONS,
    defaultStatus: 'draft',
    preview: (record) => `/${record.slug}`,
    fieldLabels: {
      slug: 'Page Slug',
      title: 'Page Title',
      summary: 'Summary',
      body: 'Body Content',
      page_type: 'Page Type',
      language_id: 'Language',
      parent_id: 'Parent Page',
      status: 'Publish Status',
      meta_title: 'SEO Meta Title',
      meta_description: 'SEO Meta Description',
      sort_order: 'Display Order',
    },
    placeholders: {
      slug: 'Example: about',
      title: 'Example: About Us',
      summary: 'Short summary of the canonical page used by SEO and public API.',
      body: 'Optional long-form body content for simple standalone pages.',
      page_type: 'Example: about',
      meta_title: 'SEO title for browser tab and search result.',
      meta_description: 'Short SEO description for the selected page.',
    },
    helpText: {
      slug: 'For the About CMS currently in use, keep this record as the canonical parent slug `about`. Do not create separate page rows for company-introduction, chairman-speech, or the other About tabs.',
      page_type: 'Use a stable group name such as about, legal, or contact so frontend and reporting can filter related pages consistently.',
      parent_id: 'Usually empty for canonical top-level pages. About currently acts as the parent page, while its detailed tabs are modeled as Page Sections.',
      status: 'Only published pages should be consumed by the public API.',
      meta_title: 'Recommended for SEO. If empty, frontend may fall back to the page title.',
      meta_description: 'Recommended for SEO and social previews.',
      sort_order: 'Use 10, 20, 30... to make future reordering easier without rewriting all records.',
    },
  },
  page_sections: {
    label: 'Page Sections',
    eyebrow: 'CMS page sections',
    description: 'Manage the structural child sections inside a canonical CMS page. For About, this table should contain the 8 real sections shown on the public page: hero, company introduction, chairman\'s speech, organization chart, corporate culture, development course, leadership care, and cooperative partner.',
    titleField: 'title',
    table: ['id', 'page_id', 'title', 'anchor', 'section_type', 'sort_order'],
    required: ['page_id'],
    fields: ['page_id', 'anchor', 'title', 'content', 'image_id', 'section_type', 'sort_order'],
    preview: (record) => {
      if (record.preview_href) {
        return record.preview_href
      }

      if (record.page_slug === 'about') {
        const aboutRouteMap = {
          hero: '/about/company-introduction#page1',
          company_introduction: '/about/company-introduction#page2',
          chairman_speech: '/about/chairman-speech#page3',
          organization_chart: '/about/organization-chart#page4',
          corporate_culture: '/about/corporate-culture#page5',
          development_course: '/about/development-course#page6',
          leadership_care: '/about/leadership-care#page7',
          cooperative_partner: '/about/cooperative-partner#page8',
        }
        return aboutRouteMap[record.anchor] || '/about/company-introduction#page1'
      }

      if (record.page_slug) {
        return `/${record.page_slug}${record.anchor ? `#${record.anchor}` : ''}`
      }

      return ''
    },
    fieldLabels: {
      page_id: 'Parent Page',
      anchor: 'Section Anchor',
      title: 'Section Title',
      content: 'Section Content',
      image_id: 'Section Image',
      section_type: 'Section Type',
      sort_order: 'Display Order',
    },
    placeholders: {
      anchor: 'Example: hero, company_introduction, chairman_speech',
      title: 'Example: Company Introduction',
      content: 'Optional section-level intro text used for mapping or short summaries.',
      section_type: 'Example: hero, content, media, timeline, gallery, partners',
    },
    helpText: {
      page_id: 'Choose the canonical parent page this section belongs to. For the current About CMS, all 8 sections should belong to the single page slug `about`.',
      anchor: 'Stable technical key used by frontend mapping and route/hash sync. For About, use anchors such as hero, company_introduction, chairman_speech, organization_chart, corporate_culture, development_course, leadership_care, cooperative_partner.',
      image_id: 'Optional section-level image. Use this only when the section itself needs a representative visual; detailed content media should usually live in Content Blocks or Content Block Items.',
      section_type: 'Recommended About values: hero, content, media, timeline, gallery, partners. Keep these stable because they describe the structural role of the section, not the detailed data block.',
      sort_order: 'Use 10, 20, 30... to control render order inside the selected page. For About, this should match the public top-to-bottom sequence.',
      content: 'Use this as a short admin-facing note describing which public section this record controls. The preview link should point editors to the mapped public route for quick verification.',
    },
  },
  content_blocks: {
    label: 'Content Blocks',
    eyebrow: 'CMS block records',
    description: 'Manage reusable content blocks attached to an entity. For About CMS, blocks should attach to entity_type = page and entity_id = the selected page id.',
    titleField: 'title',
    table: ['id', 'entity_type', 'entity_id', 'block_key', 'block_type', 'sort_order'],
    required: ['entity_type', 'entity_id', 'block_key', 'block_type'],
    fields: ['entity_type', 'entity_id', 'language_id', 'block_key', 'title', 'subtitle', 'content', 'block_type', 'sort_order'],
    relationEntities: {
      entity_id: 'pages',
    },
    fieldLabels: {
      entity_type: 'Entity Type',
      entity_id: 'Entity Record ID',
      language_id: 'Language',
      block_key: 'Block Key',
      title: 'Block Title',
      subtitle: 'Block Subtitle',
      content: 'Block Content',
      block_type: 'Block Type',
      sort_order: 'Display Order',
    },
    placeholders: {
      entity_type: 'Example: page',
      entity_id: 'ID of the related page record',
      block_key: 'Example: intro_paragraphs',
      title: 'Optional block title shown in admin or frontend',
      subtitle: 'Optional block subtitle',
      content: 'Optional long-form content for this block',
      block_type: 'Example: rich_text_list, timeline, logo_grid',
    },
    helpText: {
      entity_type: 'For About CMS, lock this value to page. Do not switch between page and pages.',
      entity_id: 'Enter the id of the page record this block belongs to. Current schema links blocks directly to the page, not to page_sections.',
      block_key: 'Stable rendering key used by frontend normalizer. About CMS keys: intro_paragraphs, speech_body, speech_media, culture_values, timeline, leadership_profiles, partner_categories, partner_logos, org_chart.',
      block_type: 'Recommended About block types: rich_text_list, media_profile, tabbed_cards, timeline, carousel_cards, tab_groups, logo_grid, image.',
      sort_order: 'Use 10, 20, 30... to control block order within the same entity.',
    },
  },
  content_block_items: {
    label: 'Content Block Items',
    eyebrow: 'CMS block items',
    description: 'Manage child items rendered inside each content block, such as paragraphs, timeline milestones, leadership cards, partner categories, and partner logos.',
    titleField: 'title',
    table: ['id', 'block_id', 'title', 'item_key', 'sort_order'],
    required: ['block_id'],
    fields: ['block_id', 'item_key', 'title', 'subtitle', 'content', 'link', 'image_id', 'metadata_json', 'sort_order'],
    fieldLabels: {
      block_id: 'Parent Block',
      item_key: 'Item Key',
      title: 'Item Title',
      subtitle: 'Item Subtitle',
      content: 'Item Content',
      link: 'External Link',
      image_id: 'Item Image',
      metadata_json: 'Metadata JSON',
      sort_order: 'Display Order',
    },
    placeholders: {
      item_key: 'Example: paragraph_1 or partner-a',
      title: 'Optional item title',
      subtitle: 'Optional subtitle such as month, category, or role',
      content: 'Main content value for this item',
      link: 'https://example.com or /internal-path',
      metadata_json: '{\n  "year": 2025,\n  "category": "strategic"\n}',
    },
    helpText: {
      block_id: 'Choose the parent block first. Items always render inside the selected content block.',
      item_key: 'Stable item identifier used by frontend mapping and QA. Keep keys lowercase and descriptive.',
      image_id: 'Optional item-level image for profiles, logos, chart assets, or timeline milestones.',
      metadata_json: 'Enter valid JSON only. Use this for custom fields such as year, month, category, badge, external_link, or other block-specific metadata.',
      sort_order: 'Use 10, 20, 30... to keep item ordering predictable inside the selected block.',
    },
  },
  banners: {
    label: 'Banners',
    eyebrow: 'Hero and section banners',
    description: 'Manage banners, CTA buttons, type, language, and display order.',
    titleField: 'title',
    table: ['id', 'title', 'banner_type', 'language_id', 'sort_order', 'is_active'],
    required: ['language_id'],
    fields: ['title', 'subtitle', 'body', 'image_id', 'focus_x', 'focus_y', 'link', 'button_text', 'banner_type', 'language_id', 'sort_order', 'is_active'],
    statusOptions: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
    defaultStatus: 'active',
    previewMediaField: 'image_id',
    mediaUploadTargetField: 'image_id',
    mediaUploadAccept: 'image/*,video/*',
    cloudinaryAssetFolder: 'banner',
    fieldLabels: {
      title: 'Banner Title',
      subtitle: 'Subtitle',
      body: 'Description',
      image_id: 'Banner Image/Video',
      focus_x: 'Focus X',
      focus_y: 'Focus Y',
      link: 'CTA Link',
      button_text: 'Button Text',
      banner_type: 'Banner Type',
      language_id: 'Language',
      sort_order: 'Display Order',
      is_active: 'Status',
    },
    placeholders: {
      title: 'Example: Welcome to China Decor',
      subtitle: 'Elegant Interior Solutions',
      body: 'Write a short description for this banner.',
      link: '/about or https://example.com',
      button_text: 'Learn More',
    },
    helpText: {
      image_id: 'Upload an image (JPG, PNG, WebP) or video (MP4, WebM) for the banner background.',
      focus_x: 'Horizontal focus point for image crop (0 to 100).',
      focus_y: 'Vertical focus point for image crop (0 to 100).',
      banner_type: 'Hero = homepage slider, CTA = promotional card, Section/Page/Footer = secondary placements.',
      link: 'URL when users click on the banner or CTA button.',
      button_text: 'Text displayed on the CTA button (if any).',
      is_active: 'Only active banners are shown on the public site.',
    },
    featuredTableFields: ['image_id', 'banner_type', 'is_active'],
  },
  post_categories: {
    label: 'Post Categories',
    eyebrow: 'News taxonomy',
    description: 'Manage categories used by posts and news pages.',
    titleField: 'name',
    editorPresentation: 'modal',
    table: ['id', 'name', 'slug', 'status', 'sort_order'],
    required: ['name', 'slug'],
    fields: ['name', 'slug', 'description', 'parent_id', 'sort_order', 'status'],
    statusOptions: CATEGORY_STATUS_OPTIONS,
    defaultStatus: 'active',
  },
  posts: {
    label: 'Posts',
    eyebrow: 'News content',
    description: 'Manage post content, category, slug, publish date, SEO, and main image.',
    titleField: 'title',
    table: ['id', 'title', 'slug', 'category_id', 'status', 'published_at'],
    required: ['title', 'slug', 'language_id'],
    fields: ['title', 'slug', 'category_id', 'summary', 'body', 'published_at', 'author', 'image_id', 'language_id', 'status', 'meta_title', 'meta_description'],
    statusOptions: POST_STATUS_OPTIONS,
    defaultStatus: 'draft',
    preview: (record) => `/news/${record.slug}`,
  },
  project_categories: {
    label: 'Project Categories',
    eyebrow: 'Project taxonomy',
    description: 'Manage public Project Case categories, legacy category ids, status, and hero media bindings.',
    titleField: 'name',
    pageSize: 25,
    table: ['id', 'name', 'slug', 'status', 'sort_order'],
    required: ['name', 'slug'],
    fields: ['name', 'slug', 'description', 'parent_id', 'sort_order', 'status'],
    statusOptions: CATEGORY_STATUS_OPTIONS,
    defaultStatus: 'active',
    preview: (record) => `/project_list/${record.id}.html`,
    fieldLabels: {
      name: 'Category Name',
      slug: 'Category Slug',
      description: 'Category Summary',
      parent_id: 'Parent Category',
      sort_order: 'Display Order',
      status: 'Publish Status',
    },
    placeholders: {
      name: 'Example: Star Hotel',
      slug: 'example-star-hotel',
      description: 'Short summary used in hero slide and category metadata.',
    },
    helpText: {
      slug: 'Used for canonical admin/project taxonomy naming. Legacy public route still uses numeric category id.',
      sort_order: 'Controls category ordering in Project Case hero slider and sidebar.',
      status: 'Only active categories are exposed by the public Project Case API.',
    },
  },
  projects: {
    label: 'Projects',
    eyebrow: 'Project content',
    description: 'Manage canonical project detail records used by Project Case sections and public project detail pages.',
    titleField: 'title',
    table: ['id', 'title', 'slug', 'category_id', 'project_year', 'status'],
    required: ['title', 'slug', 'language_id'],
    fields: ['title', 'slug', 'category_id', 'summary', 'body', 'location', 'project_year', 'image_id', 'hero_image_id', 'language_id', 'status', 'meta_title', 'meta_description'],
    statusOptions: CONTENT_STATUS_OPTIONS,
    defaultStatus: 'draft',
    preview: (record) => `/project/${record.slug}`,
    fieldLabels: {
      title: 'Project Title',
      slug: 'Project Slug',
      category_id: 'Primary Category',
      summary: 'Project Summary',
      body: 'Project Detail Body',
      location: 'Project Location',
      project_year: 'Project Year',
      image_id: 'Fallback Image',
      hero_image_id: 'Fallback Hero Image',
      language_id: 'Language',
      status: 'Publish Status',
      meta_title: 'SEO Meta Title',
      meta_description: 'SEO Meta Description',
    },
    helpText: {
      category_id: 'Optional primary category for the generic project list/detail module. Project Case mapping is managed separately.',
      image_id: 'Used as fallback for left gallery when no entity_media left_gallery exists.',
      hero_image_id: 'Used as fallback for right gallery when no entity_media right_gallery exists.',
      status: 'Only published projects are returned by public project endpoints and Project Case aggregate API.',
    },
  },
  project_category_items: {
    label: 'Project Case Mapping',
    eyebrow: 'Category to project mapping',
    description: 'Manage Project Case ordering, anchors, layout pattern, and featured state inside each category.',
    titleField: 'anchor',
    pageSize: 25,
    table: ['id', 'category_id', 'project_id', 'anchor', 'sort_order', 'layout_variant', 'is_featured'],
    required: ['category_id', 'project_id', 'anchor', 'sort_order'],
    fields: ['category_id', 'project_id', 'sort_order', 'anchor', 'is_featured', 'layout_variant'],
    preview: (record) => `/project_list/${record.category_id}.html#${record.anchor}`,
    fieldLabels: {
      category_id: 'Project Category',
      project_id: 'Project',
      sort_order: 'Display Order',
      anchor: 'Section Anchor',
      is_featured: 'Featured Layout',
      layout_variant: 'Layout Variant',
    },
    placeholders: {
      anchor: 'Example: ctn2',
      layout_variant: 'feature or standard',
    },
    helpText: {
      category_id: 'Required. Category owning this Project Case section.',
      project_id: 'Required. Each project can only appear once inside the same category.',
      sort_order: 'Required. Public API sorts cases by this value.',
      anchor: 'Required. Must be unique within the selected category. Keep the legacy ctnX pattern for compatibility.',
      layout_variant: 'Current frontend uses feature and standard. Keep values stable unless frontend is updated.',
    },
    relationEntities: {
      category_id: 'project_categories',
      project_id: 'projects',
    },
  },
  entity_media: {
    label: 'Project Media Groups',
    eyebrow: 'Entity media binding',
    description: 'Bind hero and gallery media to Project Categories and Projects through entity_media groups.',
    titleField: 'group_name',
    pageSize: 25,
    table: ['id', 'entity_type', 'entity_id', 'group_name', 'media_id', 'sort_order'],
    required: ['entity_type', 'entity_id', 'media_id', 'group_name', 'sort_order'],
    fields: ['entity_type', 'entity_id', 'media_id', 'group_name', 'sort_order', 'caption'],
    defaultValues: {
      entity_type: 'project_category',
      group_name: 'hero_desktop',
    },
    selectOptions: {
      entity_type: [
        { value: 'project_category', label: 'Project Category' },
        { value: 'project', label: 'Project' },
      ],
      group_name: [
        { value: 'hero_desktop', label: 'Hero Desktop' },
        { value: 'hero_mobile', label: 'Hero Mobile' },
        { value: 'left_gallery', label: 'Left Gallery' },
        { value: 'right_gallery', label: 'Right Gallery' },
      ],
    },
    selectOptionsByEntityType: {
      group_name: {
        project_category: [
          { value: 'hero_desktop', label: 'Hero Desktop' },
          { value: 'hero_mobile', label: 'Hero Mobile' },
        ],
        project: [
          { value: 'left_gallery', label: 'Left Gallery' },
          { value: 'right_gallery', label: 'Right Gallery' },
        ],
      },
    },
    preview: (record) => {
      if (record.preview_href) {
        return record.preview_href
      }
      if (record.entity_type === 'project_category') {
        return `/project_list/${record.entity_id}.html`
      }
      if (record.entity_type === 'project' && record.entity_slug) {
        return `/project/${record.entity_slug}`
      }
      return ''
    },
    fieldLabels: {
      entity_type: 'Entity Type',
      entity_id: 'Entity Record ID',
      media_id: 'Media Asset',
      group_name: 'Media Group',
      sort_order: 'Display Order',
      caption: 'Caption',
    },
    placeholders: {
      entity_id: 'Select a category or project record from the dropdown',
      group_name: 'hero_desktop, hero_mobile, left_gallery, right_gallery',
      caption: 'Optional caption for future use',
    },
    helpText: {
      entity_type: 'Use project_category for category hero images, project for case galleries.',
      entity_id: 'The dropdown updates automatically based on Entity Type so you can bind media without copying numeric ids manually. Use the inline preview link to verify the target before saving.',
      group_name: 'Group options are filtered by Entity Type: project categories use hero_desktop/hero_mobile, projects use left_gallery/right_gallery.',
      sort_order: 'Controls image order inside the selected media group.',
    },
  },
  branches: {
    label: 'Branches',
    eyebrow: 'Subsidiaries and branches',
    description: 'Manage subsidiary pages, branch details, contact info, and media.',
    titleField: 'name',
    table: ['id', 'name', 'slug', 'branch_type', 'language_id', 'is_active'],
    required: ['name', 'slug', 'language_id'],
    fields: ['name', 'slug', 'branch_type', 'address', 'city', 'region', 'phone', 'email', 'map_url', 'parent_id', 'is_active', 'language_id', 'summary', 'body', 'image_id', 'hero_image_id', 'meta_title', 'meta_description'],
    preview: (record) => `/subsidiary_Detail/${record.slug}.html`,
  },
  contacts: {
    label: 'Contacts',
    eyebrow: 'Contact information',
    description: 'Manage contact points, map links, phone numbers, email, and branch assignments.',
    titleField: 'name',
    table: ['id', 'name', 'contact_type', 'postal_code', 'phone', 'email', 'is_primary', 'language_id'],
    required: ['name', 'language_id', 'latitude', 'longitude'],
    fields: ['name', 'contact_type', 'address', 'postal_code', 'phone', 'email', 'map_url', 'latitude', 'longitude', 'branch_id', 'is_primary', 'language_id'],
  },
  honors: {
    label: 'Honors',
    eyebrow: 'Awards and certifications',
    description: 'Manage honors, award year, issuer, linked project, and image.',
    titleField: 'title',
    table: ['id', 'title', 'award_year', 'award_category', 'issuer', 'sort_order'],
    required: ['title', 'language_id'],
    fields: ['title', 'description', 'award_year', 'award_category', 'project_id', 'image_id', 'issuer', 'language_id', 'sort_order'],
    preview: () => '/honors',
  },
  videos: {
    label: 'Videos',
    eyebrow: 'Video gallery',
    description: 'Manage showcase videos, direct media URLs, language, display order, and publish status for the public gallery.',
    titleField: 'title',
    table: ['id', 'title', 'video_url', 'language_id', 'sort_order', 'status'],
    required: ['title', 'video_url', 'language_id'],
    fields: ['title', 'description', 'video_url', 'language_id', 'sort_order', 'status'],
    statusOptions: CONTENT_STATUS_OPTIONS,
    defaultStatus: 'draft',
    preview: () => '/video',
    cloudinaryAssetFolder: 'videos',
    fieldLabels: {
      title: 'Video Title',
      description: 'Short Description',
      video_url: 'Video URL',
      language_id: 'Language',
      sort_order: 'Display Order',
      status: 'Publish Status',
    },
    placeholders: {
      title: 'Example: China Decor Signature Project Film',
      description: 'Write a concise teaser for the video card and modal caption.',
      video_url: 'https://cdn.example.com/showcase/video.mp4 or YouTube/Vimeo embed URL',
    },
    helpText: {
      video_url: 'Use a direct MP4/WebM URL, or a valid YouTube/Vimeo/share link. The frontend will open this in the premium player modal.',
      status: 'Only videos with Published status are shown on the public page.',
    },
    featuredTableFields: ['video_url', 'status'],
  },
  media_assets: {
    label: 'Media Library',
    eyebrow: 'Uploaded assets',
    description: 'Upload, review, and update images, video files, or PDF assets used across the site.',
    titleField: 'title',
    table: ['id', 'title', 'file_name', 'asset_type', 'mime_type', 'status'],
    required: ['uuid', 'url', 'asset_type'],
    fields: ['uuid', 'file_name', 'url', 'storage_path', 'asset_type', 'mime_type', 'width', 'height', 'size', 'alt_text', 'title', 'status'],
    statusOptions: CATEGORY_STATUS_OPTIONS,
    defaultStatus: 'active',
    allowCreate: false,
    standaloneUpload: true,
  },
  site_settings: {
    label: 'Site Settings',
    eyebrow: 'Global configuration',
    description: 'Manage footer texts, contact settings, site title, and legal links.',
    titleField: 'config_key',
    table: ['id', 'config_key', 'group_name', 'language_id'],
    required: ['config_key'],
    fields: ['config_key', 'config_value', 'language_id', 'group_name', 'description'],
  },
  inquiry_submissions: {
    label: 'Inquiries',
    eyebrow: 'Contact submissions',
    description: 'Review incoming inquiry form submissions and update their processing status.',
    titleField: 'subject',
    table: ['id', 'full_name', 'email', 'subject', 'status', 'created_at'],
    required: ['full_name', 'email', 'message'],
    fields: ['full_name', 'email', 'phone', 'company', 'subject', 'message', 'source_page', 'status'],
    statusOptions: [
      { value: 'new', label: 'New' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'resolved', label: 'Resolved' },
      { value: 'spam', label: 'Spam' },
    ],
    defaultStatus: 'new',
  },
}

export const ADMIN_SECTION_GROUPS = [
  { title: 'Overview', items: [{ key: 'dashboard', label: 'Dashboard' }] },
  { title: 'Navigation', items: [{ key: 'navigation', label: 'Menu Navigation' }] },
  {
    title: 'CMS Pages',
    items: [
      {
        key: 'pages',
        label: 'Pages',
        eyebrow: 'CMS page records',
        description: 'Manage top-level CMS pages and About page slugs.',
        children: [
          {
            key: 'page_sections',
            label: 'Page Sections',
            eyebrow: 'CMS page sections',
            description: 'Manage hero, intro, chart, partner, and other structural sections inside a page.',
          },
          {
            key: 'content_blocks',
            label: 'Content Blocks',
            eyebrow: 'CMS block records',
            description: 'Manage block-level records attached to a page, including About CMS block keys.',
          },
          {
            key: 'content_block_items',
            label: 'Content Block Items',
            eyebrow: 'CMS block items',
            description: 'Manage child items inside each block, including timeline entries, partner logos, and intro paragraphs.',
          },
        ],
      },
    ],
  },
  {
    title: 'Content',
    items: [
      { key: 'banners', label: 'Banners' },
      {
        key: 'posts',
        label: 'News Posts',
        children: [{ key: 'post_categories', label: 'News Category' }],
      },
      {
        key: 'projects',
        label: 'Projects',
        eyebrow: 'Project Case content',
        description: 'Manage public projects, Project Case categories, mappings, and media groups.',
        children: [
          { key: 'project_categories', label: 'Project Categories' },
          { key: 'project_category_items', label: 'Project Case Mapping' },
          { key: 'entity_media', label: 'Project Media Groups' },
        ],
      },
      { key: 'videos', label: 'Videos' },
      {
        key: 'honors',
        label: 'Honors',
        eyebrow: 'Honors records',
        description: 'Manage honors records, year, issuer, image, and active state.',
        children: [
          {
            key: 'honor_categories',
            label: 'Honor Categories',
            eyebrow: 'Honors taxonomy',
            description: 'Manage honor categories, hierarchy, and activation status.',
          },
        ],
      },
      { key: 'media_assets', label: 'Media Library' },
      { key: 'contacts', label: 'Contact Info' },
    ],
  },
]

function flattenSectionItems(items, collector = []) {
  for (const item of items || []) {
    collector.push(item)
    if (Array.isArray(item.children) && item.children.length) {
      flattenSectionItems(item.children, collector)
    }
  }
  return collector
}

export const ADMIN_SECTION_INDEX = Object.fromEntries(ADMIN_SECTION_GROUPS.flatMap((group) => flattenSectionItems(group.items)).map((item) => [item.key, item]))
