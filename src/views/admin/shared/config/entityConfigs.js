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
    label: 'Trang Nội Dung',
    eyebrow: 'Danh sách các trang CMS',
    description: 'Quản lý các trang nội dung chính của website. Đối với luồng Giới thiệu, bảng này chỉ nên giữ một bản ghi trang cha duy nhất là `about`, trong khi các phần chi tiết được quản lý trong mục Phần Trang và Khối Nội Dung.',
    titleField: 'title',
    editorPresentation: 'modal',
    table: ['id', 'title', 'slug', 'page_type', 'status', 'language_id', 'sort_order'],
    required: ['slug', 'language_id'],
    fields: ['slug', 'title', 'summary', 'body', 'page_type', 'language_id', 'parent_id', 'status', 'meta_title', 'meta_description', 'sort_order'],
    statusOptions: CONTENT_STATUS_OPTIONS,
    defaultStatus: 'draft',
    preview: (record) => `/${record.slug}`,
    fieldLabels: {
      slug: 'Đường dẫn (Slug)',
      title: 'Tiêu đề trang',
      summary: 'Tóm tắt ngắn',
      body: 'Nội dung chi tiết',
      page_type: 'Loại trang',
      language_id: 'Ngôn ngữ',
      parent_id: 'Trang cha',
      status: 'Trạng thái xuất bản',
      meta_title: 'SEO Meta Title',
      meta_description: 'SEO Meta Description',
      sort_order: 'Thứ tự hiển thị',
    },
    placeholders: {
      slug: 'Ví dụ: about',
      title: 'Ví dụ: Giới thiệu công ty',
      summary: 'Tóm tắt ngắn gọn của trang dùng cho SEO và API công khai.',
      body: 'Nội dung chi tiết (không bắt buộc nếu dùng các khối nội dung).',
      page_type: 'Ví dụ: about',
      meta_title: 'Tiêu đề SEO hiển thị trên tab trình duyệt.',
      meta_description: 'Mô tả SEO ngắn gọn cho trang.',
    },
    helpText: {
      slug: 'Đối với trang Giới thiệu hiện tại, hãy giữ nguyên slug `about`. Không tạo thêm các hàng riêng biệt cho từng phần như introduction hay vision.',
      page_type: 'Sử dụng tên nhóm ổn định như about, legal hoặc contact.',
      parent_id: 'Thường để trống cho các trang cấp cao nhất.',
      status: 'Chỉ các trang được "Published" mới hiển thị trên website.',
      meta_title: 'Khuyên dùng cho SEO. Nếu để trống sẽ dùng tiêu đề trang.',
      meta_description: 'Khuyên dùng cho SEO và xem trước trên mạng xã hội.',
      sort_order: 'Dùng 10, 20, 30... để dễ dàng sắp xếp lại thứ tự sau này.',
    },
  },
  page_sections: {
    label: 'Các Phần Trang',
    eyebrow: 'Cấu trúc các phần của trang',
    description: 'Quản lý các phần cấu trúc bên trong một trang CMS. Ví dụ với trang Giới thiệu, bảng này chứa các phần: Hero, Giới thiệu công ty, Tầm nhìn & Sứ mệnh, Sơ đồ tổ chức, Giá trị cốt lõi, Lịch sử phát triển, Ban lãnh đạo.',
    titleField: 'title',
    editorPresentation: 'modal',
    hideMediaGallery: true,
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
    fields: ['title', 'content', 'image_id', 'sort_order'],
    fieldLabels: {
      title: 'Tên mục hiển thị',
      content: 'Ghi chú (Nội bộ)',
      image_id: 'Ảnh đại diện/Ảnh nền',
      sort_order: 'Thứ tự',
    },
    helpText: {
      page_id: 'Chọn trang cha mà phần này thuộc về. Với trang Giới thiệu, tất cả các phần nên thuộc về trang `about`.',
      anchor: 'Mã kỹ thuật dùng để link chính xác đến phần đó trên web. KHÔNG đổi khi không cần thiết.',
      image_id: 'Ảnh nền hoặc ảnh đại diện cho phần này.',
      section_type: 'Phân loại loại mục để FE xử lý style tương ứng.',
      sort_order: 'Dùng 10, 20, 30... để kiểm soát thứ tự từ trên xuống dưới.',
      content: 'Dùng như ghi chú nội bộ để người quản trị biết phần này điều khiển nội dung nào.',
    },
  },
  content_blocks: {
    label: 'Khối Nội Dung',
    eyebrow: 'Các khối nội dung CMS',
    description: 'Quản lý các khối nội dung lớn gắn với một trang. Đối với trang Giới thiệu, các khối nên gắn với Loai đối tượng = page và ID bản ghi = id của trang `about` (thường là 1).',
    recordDisplayName: (record) => {
      const translations = {
        'hero_summary': '1. Tên công ty & Slogan',
        'hero_nav': '2. Menu điều hướng trang',
        'intro_media': '3. Hình ảnh/Video giới thiệu',
        'intro_video': '4. Nút bấm xem Video',
        'intro_paragraphs': '5. Các đoạn văn giới thiệu',
        'speech_profile': '6. Ảnh chân dung Lãnh đạo',
        'speech_body': '7. Văn bản Tầm nhìn & Sứ mệnh',
        'speech_signature': '8. Chữ ký Lãnh đạo',
        'org_chart_image': '9. Sơ đồ tổ chức',
        'culture_values': '10. Giá trị cốt lõi',
        'timeline': '11. Lịch sử phát triển',
        'leadership_care_gallery': '12. Ban lãnh đạo (Album)',
      }
      const rawKey = String(record?.block_key || record?.title || '').toLowerCase().trim();
      // Try to find a match by comparing lowercase keys
      const matchedKey = Object.keys(translations).find(k => k.toLowerCase() === rawKey);
      return matchedKey ? translations[matchedKey] : (record?.block_key || record?.title || '');
    },
    table: ['id', 'block_key', 'block_type', 'sort_order'],
    required: ['entity_id', 'block_key', 'block_type'],
    fields: ['entity_id', 'block_key', 'block_type', 'title', 'sort_order'],
    fieldLabels: {
      entity_type: 'Loại trang',
      entity_id: 'ID Trang',
      language_id: 'Ngôn ngữ',
      block_key: 'Mã định danh nhóm',
      title: 'Tiêu đề nhóm (Nếu có)',
      subtitle: 'Phụ đề nhóm',
      content: 'Mô tả nội bộ',
      block_type: 'Loại hiển thị',
      sort_order: 'Thứ tự ưu tiên',
    },
    relationEntities: {
      entity_id: 'pages',
    },
    fieldLabels: {
      entity_type: 'Loại thực thể',
      entity_id: 'ID bản ghi trang',
      language_id: 'Ngôn ngữ',
      block_key: 'Mã định danh khối',
      title: 'Tiêu đề khối',
      subtitle: 'Phụ đề khối',
      content: 'Nội dung khối',
      block_type: 'Loại khối',
      sort_order: 'Thứ tự hiển thị',
    },
    placeholders: {
      entity_type: 'Ví dụ: page',
      entity_id: 'ID của bản ghi trang liên quan',
      block_key: 'Ví dụ: intro_paragraphs',
      title: 'Tiêu đề khối (tùy chọn)',
      subtitle: 'Phụ đề khối (tùy chọn)',
      content: 'Nội dung văn bản dài (tùy chọn)',
      block_type: 'Ví dụ: rich_text_list, timeline, logo_grid',
    },
    helpText: {
      entity_type: 'Đối với trang Giới thiệu, hãy khóa giá trị này là `page`.',
      entity_id: 'Nhập ID của bản ghi trang mà khối này thuộc về.',
      block_key: 'Mã định danh ổn định. Ví dụ: intro_paragraphs (giới thiệu), speech_body (tầm nhìn), culture_values (giá trị), timeline (lịch sử), leadership_profiles (lãnh đạo).',
      block_type: 'Phân loại loại khối: rich_text_list, media_profile, timeline, carousel_cards.',
      sort_order: 'Dùng 10, 20, 30... để kiểm soát thứ tự khối trong cùng một trang.',
    },
  },
  content_block_items: {
    label: 'Mục Chi Tiết (Khối)',
    eyebrow: 'Chi tiết bên trong khối nội dung',
    description: 'Quản lý các mục con bên trong mỗi khối nội dung, ví dụ: các đoạn văn, mốc lịch sử, hồ sơ ban lãnh đạo, logo đối tác.',
    titleField: 'title',
    editorPresentation: 'modal',
    hideMediaGallery: true,
    recordDisplayName: (record) => {
      const translations = {
        'hero_summary': '1. Tên công ty & Slogan',
        'intro_paragraphs': '5. Văn bản giới thiệu',
        'cover_image': 'Ảnh bìa/Ảnh nền',
        'paragraph_1': 'Đoạn văn số 1',
        'paragraph_2': 'Đoạn văn số 2',
        'paragraph_3': 'Đoạn văn số 3',
        'portrait': 'Ảnh chân dung lãnh đạo',
        'sign_name': 'Họ tên lãnh đạo',
        'sign_title': 'Chức danh lãnh đạo',
        'visit_1': 'Mục lịch sử/Lãnh đạo 1',
        'milestone_1': 'Mốc lịch sử 1',
        'milestone_2': 'Mốc lịch sử 2',
      }
      const rawTitle = record?.title || '';
      const rawKey = String(record?.item_key || '').toLowerCase().trim();
      return rawTitle || translations[rawKey] || rawKey || `#${record?.id}`;
    },
    table: ['id', 'block_id', 'title', 'item_key', 'sort_order'],
    required: ['block_id', 'item_key'],
    fields: ['block_id', 'item_key', 'title', 'subtitle', 'content', 'link', 'image_id', 'sort_order'],
    fieldLabels: {
      block_id: 'Thuộc nhóm nội dung',
      item_key: 'Mã mục (item_key)',
      title: 'Tên mục (Để bạn dễ tìm)',
      subtitle: 'Phụ đề / Chức vụ / Năm-Tháng',
      content: 'Nội dung chi tiết / Văn bản',
      link: 'Liên kết / URL',
      image_id: 'Hình ảnh / Logo / Sơ đồ',
      sort_order: 'Thứ tự hiển thị (10, 20...)',
    },
    optionLabel: (option, field) => {
      if (field === 'block_id') {
        const translations = {
          'About Hero Summary': '1. Tên công ty & Slogan',
          'About Navigation Tabs': '2. Menu điều hướng trang',
          'Company Introduction Media': '3. Hình ảnh/Video giới thiệu',
          'Company Introduction Text': '4. Nội dung bài viết giới thiệu',
          'Chairman Portrait': '5. Ảnh chân dung lãnh đạo',
          'Chairman\'s Speech Text': '6. Văn bản Tầm nhìn & Sứ mệnh',
          'Chairman Signature': '7. Chữ ký lãnh đạo',
          'Organization Chart': '8. Sơ đồ tổ chức',
          'Corporate Culture': '9. Giá trị cốt lõi',
          'Development Course Timeline': '10. Lịch sử phát triển',
          'Leadership Care Gallery': '11. Danh sách ban lãnh đạo',
        }
        const key = option.title || option.name || ''
        return translations[key] || `#${option.id} - ${key}`
      }
      return `#${option.id} - ${option.title || option.name || option.slug}`
    },
    placeholders: {
      item_key: 'Ví dụ: paragraph_1, vision, mission, value_1, milestone_1, leader_1',
      title: 'Ví dụ: Nguyễn Văn A hoặc Thành lập công ty',
      subtitle: 'Ví dụ: Giám đốc Điều hành hoặc 2024-01 (timeline)',
      content: 'Nhập nội dung văn bản cho mục này.',
      link: 'https://example.com hoặc /internal-path',
    },
    helpText: {
      block_id: 'Chọn khối cha trước. Các mục sẽ luôn hiển thị bên trong khối này.',
      item_key: 'Mã kỹ thuật định danh mục. Bắt buộc theo chuẩn từng block (ví dụ: vision/mission, value_1, milestone_1, leader_1...).',
      subtitle: 'Dùng cho chức vụ ở Ban lãnh đạo. Riêng timeline, nhập Năm/Tháng dạng 2024 hoặc 2024-01.',
      image_id: 'Ảnh đại diện cho cá nhân (Ban lãnh đạo), ảnh mốc lịch sử hoặc logo đối tác.',
      link: 'Dùng cho mục cần gắn URL ngoài hoặc đường dẫn nội bộ.',
      sort_order: 'Dùng 10, 20, 30... để sắp xếp thứ tự các mục bên trong khối.',
    },
  },
  banners: {
    label: 'Banners',
    eyebrow: 'Hero and section banners',
    description: 'Manage banners, CTA buttons, type, language, and display order.',
    titleField: 'title',
    table: ['id', 'title', 'banner_type', 'placement', 'sort_order', 'is_active'],
    required: ['placement'],
    fields: ['title', 'subtitle', 'body', 'image_id', 'focus_x', 'focus_y', 'link', 'button_text', 'banner_type', 'placement', 'sort_order', 'is_active'],
    statusOptions: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
    selectOptions: {
      banner_type: [
        { value: 'hero', label: 'Hero (Main Slider)' },
        { value: 'cta', label: 'CTA (Call to Action)' },
        { value: 'secondary', label: 'Secondary Banner' },
        { value: 'video_bg', label: 'Video Background' },
      ],
      placement: [
        { value: 'home', label: 'Trang chủ (Home)' },
        { value: 'about', label: 'Giới thiệu (About)' },
        { value: 'products', label: 'Sản phẩm (Products)' },
        { value: 'news', label: 'Tin tức (News)' },
        { value: 'contact', label: 'Liên hệ (Contact)' },
        { value: 'global', label: 'Toàn trang (Global)' },
      ],
    },
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
      placement: 'Vị trí hiển thị',
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
      placement: 'Chọn trang banner sẽ xuất hiện',
    },
    helpText: {
      image_id: 'Upload an image (JPG, PNG, WebP) or video (MP4, WebM) for the banner background.',
      focus_x: 'Horizontal focus point for image crop (0 to 100).',
      focus_y: 'Vertical focus point for image crop (0 to 100).',
      banner_type: 'Hero = homepage slider, CTA = promotional card, Section/Page/Footer = secondary placements.',
      placement: 'Chọn chính xác trang mà bạn muốn banner này hiển thị.',
      link: 'URL when users click on the banner or CTA button.',
      button_text: 'Text displayed on the CTA button (if any).',
      is_active: 'Only active banners are shown on the public site.',
    },
    featuredTableFields: ['image_id', 'banner_type', 'placement', 'is_active'],
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
      name: 'Tên Danh Mục',
      slug: 'Slug (URL)',
      description: 'Mô Tả Danh Mục',
      parent_id: 'Danh Mục Cha',
      sort_order: 'Thứ Tự Hiển Thị',
      status: 'Trạng Thái',
    },
    placeholders: {
      name: 'Ví dụ: Khách Sạn 5 Sao',
      slug: 'khach-san-5-sao',
      description: 'Mô tả ngắn hiển thị trên banner hoặc metadata danh mục.',
    },
    helpText: {
      slug: 'Used for canonical admin/project taxonomy naming. Legacy public route still uses numeric category id.',
      sort_order: 'Controls category ordering in Project Case hero slider and sidebar.',
      status: 'Only active categories are exposed by the public Project Case API.',
    },
  },
  projects: {
    label: 'Dự Án',
    eyebrow: 'Quản trị dự án',
    description: 'Chỉ giữ đúng các thông tin dự án theo requirement: tên dự án, hình ảnh, địa điểm, mô tả và sản phẩm sử dụng.',
    titleField: 'title',
    table: ['id', 'title', 'location', 'image_id', 'status'],
    required: ['title', 'language_id'],
    fields: ['title', 'slug', 'category_id', 'summary', 'body', 'location', 'project_year', 'image_id', 'hero_image_id', 'language_id', 'status', 'meta_title', 'meta_description'],
    hiddenFormFields: ['slug', 'category_id', 'project_year', 'hero_image_id', 'language_id', 'status', 'meta_title', 'meta_description'],
    defaultValues: {
      status: 'published',
    },
    statusOptions: CONTENT_STATUS_OPTIONS,
    defaultStatus: 'published',
    preview: (record) => `/project/${record.slug}`,
    fieldLabels: {
      title: 'Tên Dự Án',
      slug: 'Slug (Tự Sinh)',
      category_id: 'Danh Mục',
      summary: 'Mô Tả',
      body: 'Mô Tả Chi Tiết',
      location: 'Địa Điểm',
      project_year: 'Năm Thực Hiện',
      image_id: 'Hình Ảnh Dự Án',
      hero_image_id: 'Ảnh Banner',
      language_id: 'Ngôn Ngữ',
      status: 'Trạng Thái',
      meta_title: 'SEO Meta Title',
      meta_description: 'SEO Meta Description',
    },
    placeholders: {
      title: 'Ví dụ: Hengtong Building',
      summary: 'Nhập mô tả ngắn cho dự án.',
      body: 'Nhập mô tả chi tiết cho dự án nếu cần hiển thị ở trang chi tiết.',
      location: 'Ví dụ: Quảng Châu, Trung Quốc',
    },
    helpText: {
      title: 'Tên hiển thị chính của dự án.',
      summary: 'Đây là phần mô tả chính theo requirement.',
      body: 'Có thể dùng để lưu nội dung mô tả dài hơn cho trang chi tiết.',
      location: 'Địa điểm thực hiện dự án.',
      image_id: 'Chọn ảnh đại diện chính cho dự án. Nếu cần nhiều ảnh, dùng mục Hình Ảnh Dự Án ở sidebar.',
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
  project_products: {
    label: 'Mapping Dự Án - Sản Phẩm',
    eyebrow: 'Project to product mapping',
    description: 'Liên kết sản phẩm sử dụng trong từng dự án để section public "Sản phẩm sử dụng" render hoàn toàn từ CMS.',
    titleField: 'id',
    pageSize: 25,
    table: ['id', 'project_id', 'product_id', 'sort_order', 'note'],
    required: ['project_id', 'product_id'],
    fields: ['project_id', 'product_id', 'sort_order', 'note'],
    preview: () => '',
    fieldLabels: {
      project_id: 'Dự Án',
      product_id: 'Sản Phẩm',
      sort_order: 'Thứ Tự Hiển Thị',
      note: 'Ghi Chú Ứng Dụng',
    },
    placeholders: {
      note: 'Ví dụ: Dùng cho khu vực sảnh chính, vách trang trí, trần hành lang...',
    },
    helpText: {
      project_id: 'Chọn dự án cần gắn sản phẩm.',
      product_id: 'Chọn sản phẩm thực tế đã sử dụng trong dự án này.',
      sort_order: 'Dùng 10, 20, 30... để kiểm soát thứ tự card ở trang chi tiết dự án.',
      note: 'Ghi chú ngắn để mô tả ngữ cảnh ứng dụng của sản phẩm trong công trình.',
    },
    relationEntities: {
      project_id: 'projects',
      product_id: 'products',
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
  contacts: {
    label: 'Contacts',
    eyebrow: 'Contact information',
    description: 'Manage contact points, map links, phone numbers, email, and branch assignments.',
    titleField: 'name',
    table: ['id', 'name', 'contact_type', 'postal_code', 'phone', 'email', 'is_primary', 'language_id'],
    required: ['name', 'language_id', 'latitude', 'longitude'],
    fields: ['name', 'contact_type', 'address', 'postal_code', 'phone', 'email', 'map_url', 'latitude', 'longitude', 'branch_id', 'is_primary', 'language_id'],
    fieldLabels: {
      name: 'Tên Liên Hệ / Chi Nhánh',
      contact_type: 'Loại Liên Hệ',
      address: 'Địa Chỉ',
      postal_code: 'Mã Bưu Chính',
      phone: 'Số Điện Thoại',
      email: 'Email',
      map_url: 'Link Google Maps',
      latitude: 'Vĩ Độ (Lat)',
      longitude: 'Kinh Độ (Lng)',
      branch_id: 'Chi Nhánh',
      is_primary: 'Liên Hệ Chính',
      language_id: 'Ngôn Ngữ',
    }
  },
  honors: {
    label: 'Năng Lực',
    eyebrow: 'Factory profile and capability',
    description: 'Quản lý hình ảnh nhà máy, công nghệ sản xuất, công suất, chứng nhận ISO & CE và nội dung năng lực.',
    titleField: 'title',
    table: ['id', 'title', 'award_category', 'issuer', 'sort_order', 'is_active'],
    required: ['title', 'language_id'],
    fields: ['title', 'description', 'award_year', 'award_category', 'project_id', 'image_id', 'issuer', 'language_id', 'sort_order', 'is_active'],
    preview: () => '/honors',
    statusOptions: CONTENT_STATUS_OPTIONS,
    defaultStatus: 'published',
    fieldLabels: {
      title: 'Tiêu Đề',
      description: 'Mô Tả Ngắn',
      award_year: 'Năm / Mốc',
      award_category: 'Nhóm Nội Dung',
      project_id: 'Dự Án Liên Kết',
      image_id: 'Ảnh Đại Diện',
      issuer: 'Nguồn / Đơn Vị',
      language_id: 'Ngôn Ngữ',
      sort_order: 'Thứ Tự Hiển Thị',
      is_active: 'Đang Hiển Thị',
    },
    placeholders: {
      title: 'Ví dụ: Hình ảnh nhà máy',
      description: 'Mô tả ngắn cho mục năng lực này.',
      award_year: '2024',
      award_category: 'factory_images / production_technology / output / certificate',
      issuer: 'Ví dụ: Nhà máy Bắc Kinh',
    },
    helpText: {
      award_category: 'Dùng để phân nhóm nội dung năng lực: factory_images, production_technology, output, certificate.',
      image_id: 'Ảnh thực tế của nhà máy, máy móc hoặc chứng nhận. Đây là nội dung công khai của trang Năng lực.',
      sort_order: 'Dùng 10, 20, 30... để sắp xếp thứ tự hiển thị.',
      is_active: 'Chỉ mục đang hiển thị mới xuất hiện trên trang public.',
    },
  },
  videos: {
    label: 'Videos',
    eyebrow: 'Video gallery',
    description: 'Manage showcase videos with a title, direct video URL, and publish status.',
    titleField: 'title',
    table: ['id', 'title', 'video_url', 'status'],
    required: ['title', 'video_url'],
    fields: ['title', 'video_url', 'status'],
    statusOptions: CONTENT_STATUS_OPTIONS,
    defaultStatus: 'draft',
    preview: () => '/video',
    cloudinaryAssetFolder: 'videos',
    fieldLabels: {
      title: 'Video Title',
      video_url: 'Video URL',
      status: 'Publish Status',
    },
    placeholders: {
      title: 'Example: Product Demo Video',
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
    label: 'Yêu Cầu Từ Khách Hàng',
    editLabel: 'Trả lời',
    editorPresentation: 'modal',
    eyebrow: 'Inquiry submissions',
    description: 'Xem và xử lý các yêu cầu báo giá sản phẩm từ người dùng gửi qua form.',
    titleField: 'full_name',
    table: ['id', 'full_name', 'email', 'phone', 'subject', 'message', 'admin_response', 'status', 'created_at'],
    required: ['full_name', 'email', 'message'],
    fields: ['full_name', 'email', 'phone', 'company', 'subject', 'message', 'status', 'admin_response'],
    statusOptions: [
      { value: 'new', label: 'Mới' },
      { value: 'in_progress', label: 'Đang xử lý' },
      { value: 'replied', label: 'Đã trả lời' },
      { value: 'resolved', label: 'Đã giải quyết' },
      { value: 'spam', label: 'Spam' },
    ],
    defaultStatus: 'new',
    previewCard: (record) => ({
      badge: 'Phản hồi',
      title: record.admin_response ? 'Đã trả lời' : 'Chưa trả lời',
      summary: record.admin_response 
        ? `Nội dung: ${record.admin_response}`
        : 'Yêu cầu này chưa có nội dung phản hồi nội bộ.',
      status: record.admin_response ? 'resolved' : 'warning',
    }),
    fieldLabels: {
      full_name: 'Họ và Tên',
      email: 'Email',
      phone: 'Số Điện Thoại',
      company: 'Công Ty / Tổ Chức',
      subject: 'Chủ Đề',
      message: 'Nội Dung Yêu Cầu',
      status: 'Trạng Thái',
      created_at: 'Thời Gian Gửi',
      admin_response: 'Phản Hồi (Nội bộ)',
    },
    placeholders: {
      admin_response: 'Ghi chú nội dung bạn đã trả lời khách hàng hoặc kết quả xử lý...',
    },
    helpText: {
      admin_response: 'Thông tin này hiện chỉ hiển thị trong quản trị để bạn theo dõi lịch sử xử lý yêu cầu.',
    },
  },
  news_posts: {
    label: 'Quản Lý Bài Viết',
    eyebrow: 'News management',
    description: 'Quản lý bài viết tin tức theo mô hình danh sách + chi tiết, không sử dụng category ở website public.',
    titleField: 'title',
    table: ['id', 'title', 'slug', 'status', 'is_featured', 'published_at', 'created_at'],
    required: ['title', 'slug'],
    fields: [
      'title', 'slug', 'summary', 'content', 'content_json',
      'thumbnail_url', 'image_id', 'author',
      'status', 'is_featured', 'published_at',
      'meta_title', 'meta_description', 'sort_order',
    ],
    statusOptions: CONTENT_STATUS_OPTIONS,
    defaultStatus: 'draft',
    fieldLabels: {
      title: 'Tiêu Đề',
      slug: 'Slug (URL)',
      summary: 'Tóm Tắt',
      content: 'Nội Dung',
      content_json: 'Nội Dung (Block Editor)',
      thumbnail_url: 'Ảnh Thumbnail (URL)',
      image_id: 'Ảnh Thumbnail (Media)',
      author: 'Tác Giả',
      status: 'Trạng Thái',
      is_featured: 'Nổi Bật',
      published_at: 'Ngày Xuất Bản',
      meta_title: 'SEO Title',
      meta_description: 'SEO Description',
      sort_order: 'Thứ Tự',
    },
    placeholders: {
      title: 'Nhập tiêu đề bài viết...',
      slug: 'tu-dong-tao-tu-tieu-de',
      summary: 'Mô tả ngắn cho bài viết...',
    },
  },
  product_categories: {
    label: 'Danh Mục Sản Phẩm',
    eyebrow: 'Product taxonomy',
    description: 'Quản lý danh mục sản phẩm. Mỗi danh mục có tên, slug, mô tả và ảnh đại diện.',
    titleField: 'name',
    editorPresentation: 'modal',
    table: ['id', 'name', 'slug', 'sort_order', 'is_active'],
    required: ['name', 'slug'],
    fields: ['name', 'slug', 'description', 'image_url', 'sort_order', 'is_active'],
    fieldLabels: {
      name: 'Tên Danh Mục',
      slug: 'Slug (URL)',
      description: 'Mô Tả',
      image_url: 'Ảnh Đại Diện (URL)',
      sort_order: 'Thứ Tự Hiển Thị',
      is_active: 'Đang Hoạt Động',
    },
    placeholders: {
      name: 'Ví dụ: Sàn Gỗ',
      slug: 'san-go',
      description: 'Mô tả ngắn về danh mục sản phẩm.',
      image_url: 'https://cdn.example.com/category-thumbnail.jpg',
    },
    helpText: {
      slug: 'Dùng cho URL và lọc sản phẩm. Viết thường, không dấu, dùng dấu gạch ngang.',
      sort_order: 'Dùng 10, 20, 30... để dễ sắp xếp lại sau này.',
    },
    preview: (record) => `/products?category=${record.slug}`,
  },
  products: {
    label: 'Sản Phẩm',
    eyebrow: 'Product catalog',
    description: 'Quản lý sản phẩm: tên, mã SKU, danh mục, mô tả, kích thước, chất liệu, màu sắc, ứng dụng, video, catalog PDF.',
    titleField: 'name',
    editorPresentation: 'modal',
    table: ['id', 'image_url', 'name', 'sku', 'category_id', 'sort_order', 'is_active'],
    required: ['name', 'slug'],
    fields: [
      'name', 'slug', 'sku', 'category_id',
      'image_url',
      'gallery_urls',
      'short_desc', 'full_desc',
      'size', 'material', 'color', 'use_case',
      'video_url', 'catalog_pdf_url',
      'sort_order', 'is_active',
    ],
    cloudinaryAssetFolder: 'products',
    mediaUploadTargetField: 'image_url',
    mediaUploadAccept: 'image/*,video/*,application/pdf',
    fieldLabels: {
      name: 'Tên Sản Phẩm',
      slug: 'Slug (URL)',
      sku: 'Mã Sản Phẩm (SKU)',
      category_id: 'Danh Mục',
      image_url: 'Ảnh Sản Phẩm Gốc (URL)',
      gallery_urls: 'Ảnh Liên Quan Sản Phẩm (mỗi dòng một URL)',
      short_desc: 'Mô Tả Ngắn',
      full_desc: 'Mô Tả Chi Tiết',
      size: 'Kích Thước',
      material: 'Chất Liệu',
      color: 'Màu Sắc',
      use_case: 'Ứng Dụng',
      video_url: 'Video Demo (URL)',
      catalog_pdf_url: 'Catalog PDF (URL)',
      sort_order: 'Thứ Tự',
      is_active: 'Đang Bán',
    },
    placeholders: {
      name: 'Ví dụ: Sàn Gỗ Sồi Tự Nhiên',
      slug: 'san-go-soi-tu-nhien',
      sku: 'FLR-OAK-001',
      image_url: 'Dán link ảnh gốc sản phẩm hoặc upload phía trên.',
      gallery_urls: 'Mỗi dòng là một ảnh liên quan. Upload vào mục này sẽ tự nối thêm URL mới.',
      short_desc: 'Mô tả ngắn hiển thị trên thẻ sản phẩm.',
      full_desc: 'Mô tả đầy đủ hiển thị trên trang chi tiết sản phẩm.',
      size: 'Ví dụ: 1220 × 150 × 15 mm',
      material: 'Ví dụ: Gỗ Sồi Trắng (Oak)',
      color: 'Ví dụ: Nâu vàng tự nhiên',
      use_case: 'Ví dụ: Phòng ngủ, phòng khách, văn phòng',
      video_url: 'Dán link YouTube/Cloudinary hoặc chọn tệp tải lên.',
      catalog_pdf_url: 'Link file PDF catalog.',
    },
    helpText: {
      sku: 'Mã sản phẩm duy nhất. Ví dụ: OS.01',
      category_id: 'Chọn danh mục chứa sản phẩm này.',
      image_url: 'Đây là ảnh chính/ảnh gốc của sản phẩm, dùng làm ảnh đại diện.',
      gallery_urls: 'Danh sách ảnh liên quan. Có thể dán nhiều URL hoặc upload vào đúng mục này để tự thêm mới.',
      video_url: 'Link YouTube embed hoặc link MP4 tải lên. Để trống nếu không có.',
      catalog_pdf_url: 'Link file PDF catalog tải lên hoặc dán URL.',
    },
    relationEntities: {
      category_id: 'product_categories',
    },
    preview: (record) => `/products/${record.slug}`,
    featuredTableFields: ['image_url', 'is_active'],
  },
}

export const ADMIN_SECTION_GROUPS = [
  { title: 'TỔNG QUAN', items: [{ key: 'dashboard', label: 'Bảng Điều Khiển' }] },
  {
    title: 'CẤU HÌNH HỆ THỐNG',
    items: [
      { key: 'navigation', label: 'Menu Điều Hướng' },
      { key: 'site_settings', label: 'Cài Đặt Website (Tên, Logo, Slogan)' },
      { key: 'banners', label: 'Banner & Slider' },
    ],
  },
  {
    title: 'GIỚI THIỆU CÔNG TY (ABOUT)',
    items: [{ key: 'content_block_items', label: 'Quản lý toàn bộ trang Giới thiệu' }],
  },
  {
    title: 'NĂNG LỰC',
    items: [
      {
        key: 'honors',
        label: 'Chứng Nhận & Năng Lực',
        description: 'Quản lý Chứng nhận (ISO, CE), Hình ảnh nhà máy, Công nghệ, Công suất.',
        children: [{ key: 'media_assets', label: 'Thư Viện Ảnh Nhà Máy' }],
      },
    ],
  },
  {
    title: 'SẢN PHẨM',
    items: [
      { key: 'products', label: 'Danh Sách Sản Phẩm' },
      { key: 'product_categories', label: 'Danh Mục Sản Phẩm' },
      { key: 'videos', label: 'Video Sản Phẩm' },
    ],
  },
  {
    title: 'DỰ ÁN',
    items: [{ key: 'projects', label: 'Quản Lý Dự Án' }],
  },
  {
    title: 'LIÊN HỆ',
    items: [
      { key: 'contacts', label: 'Thông Tin Liên Hệ' },
      { key: 'inquiry_submissions', label: 'Phản Hồi Từ Form' },
    ],
  },
  {
    title: 'TIN TỨC',
    items: [
      {
        key: 'news_posts',
        label: 'Quản Lý Bài Viết',
      },
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
