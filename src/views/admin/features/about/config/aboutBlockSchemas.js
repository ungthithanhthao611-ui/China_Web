/**
 * aboutBlockSchemas.js
 *
 * Định nghĩa cấu trúc kỳ vọng cho từng block_key trong trang Giới thiệu.
 * Mỗi schema mô tả:
 *   - label: tên hiển thị thân thiện cho block
 *   - description: mô tả ngắn cho admin
 *   - fixedItems: danh sách item cố định với item_key đã biết trước
 *   - dynamicItems: nếu block cho phép thêm item động (timeline, leader, logo...)
 *
 * Admin sẽ KHÔNG thấy item_key kỹ thuật — hệ thống tự quản lý.
 */

/**
 * @typedef {Object} FieldDef
 * @property {string} key - tên field trong draft (title, subtitle, content, link, image_id)
 * @property {string} label - label hiển thị cho admin
 * @property {'text'|'textarea'|'image'|'url'|'timeline_date'|'timeline_date_start'|'timeline_date_end'} type - kiểu field
 * @property {boolean} [required] - có bắt buộc không
 * @property {string} [placeholder]
 * @property {string} [helpText]
 */

/**
 * @typedef {Object} FixedItemDef
 * @property {string} itemKey - item_key kỹ thuật (ẩn khỏi admin)
 * @property {string} label - tên thân thiện
 * @property {string} [description]
 * @property {FieldDef[]} fields - các field cần hiển thị
 * @property {number} sortOrder - thứ tự mặc định
 */

/**
 * @typedef {Object} DynamicItemDef
 * @property {string} keyPrefix - prefix cho item_key tự sinh (ví dụ: 'milestone', 'leader')
 * @property {string} label - tên hiển thị cho 1 item mới
 * @property {FieldDef[]} fields - các field cho mỗi item
 * @property {number} sortOrderStep - bước nhảy sort_order (thường 10)
 */

const FIELD = {
  title: (label = 'Tiêu đề', opts = {}) => ({
    key: 'title',
    label,
    type: 'text',
    ...opts,
  }),
  subtitle: (label = 'Phụ đề', opts = {}) => ({
    key: 'subtitle',
    label,
    type: 'text',
    ...opts,
  }),
  timelineDate: (label = 'Thời gian', opts = {}) => ({
    key: 'subtitle',
    label,
    type: 'timeline_date',
    ...opts,
  }),
  timelineDateStart: (label = 'Mốc thời gian từ', opts = {}) => ({
    key: 'subtitle',
    label,
    type: 'timeline_date_start',
    ...opts,
  }),
  timelineDateEnd: (label = 'Mốc thời gian đến', opts = {}) => ({
    key: 'link',
    label,
    type: 'timeline_date_end',
    ...opts,
  }),
  content: (label = 'Nội dung', opts = {}) => ({
    key: 'content',
    label,
    type: 'textarea',
    ...opts,
  }),
  link: (label = 'Liên kết', opts = {}) => ({
    key: 'link',
    label,
    type: 'url',
    ...opts,
  }),
  image: (label = 'Hình ảnh', opts = {}) => ({
    key: 'image_id',
    label,
    type: 'image',
    ...opts,
  }),
}

export const ABOUT_BLOCK_SCHEMAS = {
  // ═══════════════════════════════════════════════════════════
  // PAGE 1 — HERO
  // ═══════════════════════════════════════════════════════════
  hero_summary: {
    label: 'Hero Banner — Trang chủ About',
    description: 'Tiêu đề chính, đoạn mô tả hero và ảnh bìa hero cho trang Giới thiệu.',
    fixedItems: [
      {
        itemKey: 'headline',
        label: 'Tiêu đề Hero',
        fields: [
          FIELD.title('Tiêu đề chính', { required: true, placeholder: 'Ví dụ: CHINA DECOR' }),
        ],
        sortOrder: 10,
      },
      {
        itemKey: 'description',
        label: 'Đoạn mô tả Hero',
        fields: [
          FIELD.content('Nội dung mô tả', { placeholder: 'Đoạn văn giới thiệu ngắn trên hero banner' }),
        ],
        sortOrder: 20,
      },
      {
        itemKey: 'cover_image',
        label: 'Ảnh bìa Hero',
        fields: [
          FIELD.image('Ảnh bìa Hero Banner', { required: true }),
        ],
        sortOrder: 30,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // PAGE 2 — GIỚI THIỆU CÔNG TY
  // ═══════════════════════════════════════════════════════════
  intro_media: {
    label: 'Ảnh bìa giới thiệu công ty',
    description: 'Ảnh lớn phía bên trái phần giới thiệu.',
    fixedItems: [
      {
        itemKey: 'section_title',
        label: 'Tiêu đề hiển thị Page 2',
        fields: [
          FIELD.title('Tiêu đề hiển thị', {
            required: true,
            placeholder: 'Ví dụ: Giới thiệu công ty',
          }),
        ],
        sortOrder: 5,
      },
      {
        itemKey: 'cover_image',
        label: 'Ảnh bìa section',
        fields: [
          FIELD.image('Ảnh bìa giới thiệu công ty', { required: true }),
          FIELD.title('Caption ảnh (nếu có)', { placeholder: 'Tùy chọn' }),
        ],
        sortOrder: 10,
      },
    ],
  },

  intro_video: {
    label: 'Video giới thiệu',
    description: 'Nút phát video và liên kết video nhúng cho phần giới thiệu.',
    fixedItems: [
      {
        itemKey: 'video_button',
        label: 'Nút phát video',
        fields: [
          FIELD.title('Nhãn nút phát video', { placeholder: 'XEM VIDEO +', required: true }),
        ],
        sortOrder: 10,
      },
      {
        itemKey: 'video_url',
        label: 'Liên kết video',
        fields: [
          FIELD.link('URL video (YouTube / Vimeo)', {
            required: true,
            placeholder: 'https://www.youtube.com/watch?v=...',
            helpText: 'Hỗ trợ YouTube, Vimeo hoặc link video trực tiếp.',
          }),
        ],
        sortOrder: 20,
      },
    ],
  },

  intro_paragraphs: {
    label: 'Các đoạn văn giới thiệu',
    description: 'Từng đoạn văn bản mô tả công ty, hiển thị bên phải ảnh bìa.',
    dynamicItems: {
      keyPrefix: 'paragraph',
      label: 'Đoạn văn mới',
      fields: [
        FIELD.content('Nội dung đoạn văn', {
          required: true,
          placeholder: 'Nhập nội dung đoạn giới thiệu...',
        }),
        FIELD.title('Tiêu đề đoạn (nếu có)', { placeholder: 'Tùy chọn' }),
      ],
      sortOrderStep: 10,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // PAGE 3 — TẦM NHÌN & SỨ MỆNH (Chairman Speech)
  // ═══════════════════════════════════════════════════════════
  speech_profile: {
    label: 'Ảnh chân dung lãnh đạo',
    description: 'Ảnh đại diện của chủ tịch / tổng giám đốc.',
    fixedItems: [
      {
        itemKey: 'portrait',
        label: 'Ảnh chân dung',
        fields: [
          FIELD.image('Ảnh chân dung', { required: true }),
          FIELD.title('Tên người (alt text)', { placeholder: 'Nguyễn Văn A' }),
        ],
        sortOrder: 10,
      },
    ],
  },

  speech_body: {
    label: 'Nội dung Tầm nhìn & Sứ mệnh',
    description: 'Văn bản tầm nhìn, sứ mệnh của công ty.',
    fixedItems: [
      {
        itemKey: 'section_title',
        label: 'Tiêu đề hiển thị Page 3',
        fields: [
          FIELD.title('Tiêu đề hiển thị', {
            required: true,
            placeholder: 'Ví dụ: Tầm nhìn & Sứ mệnh',
          }),
        ],
        sortOrder: 5,
      },
      {
        itemKey: 'vision',
        label: 'Tầm nhìn (Vision)',
        fields: [
          FIELD.title('Tiêu đề tầm nhìn', { placeholder: 'Tầm nhìn', required: true }),
          FIELD.content('Nội dung tầm nhìn', {
            required: true,
            placeholder: 'Mô tả tầm nhìn dài hạn của công ty...',
          }),
        ],
        sortOrder: 10,
      },
      {
        itemKey: 'mission',
        label: 'Sứ mệnh (Mission)',
        fields: [
          FIELD.title('Tiêu đề sứ mệnh', { placeholder: 'Sứ mệnh', required: true }),
          FIELD.content('Nội dung sứ mệnh', {
            required: true,
            placeholder: 'Mô tả sứ mệnh và cam kết của công ty...',
          }),
        ],
        sortOrder: 20,
      },
    ],
  },



  // ═══════════════════════════════════════════════════════════
  // PAGE 4 — SƠ ĐỒ TỔ CHỨC
  // ═══════════════════════════════════════════════════════════
  org_chart_image: {
    label: 'Sơ đồ tổ chức',
    description: 'Ảnh sơ đồ tổ chức công ty.',
    fixedItems: [
      {
        itemKey: 'section_title',
        label: 'Tiêu đề hiển thị Page 4',
        fields: [
          FIELD.title('Tiêu đề hiển thị', {
            required: true,
            placeholder: 'Ví dụ: Sơ đồ tổ chức',
          }),
        ],
        sortOrder: 5,
      },
      {
        itemKey: 'main_chart',
        label: 'Ảnh sơ đồ tổ chức',
        fields: [
          FIELD.image('Ảnh sơ đồ tổ chức', { required: true }),
          FIELD.title('Tiêu đề sơ đồ (nếu có)', { placeholder: 'Sơ đồ tổ chức công ty' }),
        ],
        sortOrder: 10,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // PAGE 5 — GIÁ TRỊ CỐT LÕI
  // ═══════════════════════════════════════════════════════════
  culture_purpose: {
    label: 'Mục tiêu doanh nghiệp',
    description: 'Các mục tiêu chiến lược của doanh nghiệp.',
    dynamicItems: {
      keyPrefix: 'purpose',
      label: 'Mục tiêu mới',
      fields: [
        FIELD.title('Tên mục tiêu', { required: true, placeholder: 'Ví dụ: Phát triển bền vững' }),
        FIELD.content('Chi tiết mục tiêu', { placeholder: 'Mô tả chi tiết mục tiêu...' }),
      ],
      sortOrderStep: 10,
    },
  },

  culture_mission: {
    label: 'Sứ mệnh doanh nghiệp',
    description: 'Các sứ mệnh cốt lõi.',
    dynamicItems: {
      keyPrefix: 'mission_item',
      label: 'Sứ mệnh mới',
      fields: [
        FIELD.title('Tên sứ mệnh', { required: true, placeholder: 'Ví dụ: Đổi mới sáng tạo' }),
        FIELD.content('Chi tiết sứ mệnh', { placeholder: 'Mô tả giá trị sứ mệnh...' }),
      ],
      sortOrderStep: 10,
    },
  },

  culture_spirit: {
    label: 'Tinh thần doanh nghiệp',
    description: 'Tinh thần và văn hóa nội bộ.',
    dynamicItems: {
      keyPrefix: 'spirit',
      label: 'Tinh thần mới',
      fields: [
        FIELD.title('Tên tinh thần', { required: true, placeholder: 'Ví dụ: Đoàn kết' }),
        FIELD.content('Chi tiết', { placeholder: 'Mô tả tinh thần...' }),
      ],
      sortOrderStep: 10,
    },
  },

  culture_values: {
    label: 'Giá trị cốt lõi',
    description: 'Từng giá trị cốt lõi của công ty, hiển thị dạng card.',
    fixedItems: [
      {
        itemKey: 'section_title',
        label: 'Tiêu đề hiển thị Page 5',
        fields: [
          FIELD.title('Tiêu đề hiển thị', {
            required: true,
            placeholder: 'Ví dụ: Văn hóa doanh nghiệp',
          }),
        ],
        sortOrder: 5,
      },
      {
        itemKey: 'cover_image',
        label: 'Ảnh nền chung Page 5',
        fields: [
          FIELD.image('Ảnh nền phần Giá trị cốt lõi', { required: true }),
          FIELD.title('Caption ảnh (nếu có)', { placeholder: 'Tùy chọn' }),
        ],
        sortOrder: 10,
      },
    ],
    dynamicItems: {
      keyPrefix: 'value',
      label: 'Giá trị cốt lõi mới',
      fields: [
        FIELD.title('Tên giá trị', { required: true, placeholder: 'Ví dụ: Chính trực' }),
        FIELD.content('Giải thích giá trị', {
          required: true,
          placeholder: 'Mô tả ý nghĩa của giá trị cốt lõi này...',
        }),
      ],
      sortOrderStep: 10,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // PAGE 6 — LỊCH SỬ PHÁT TRIỂN
  // ═══════════════════════════════════════════════════════════
  culture_slogan: {
    label: 'Slogan',
    description: 'Khẩu hiệu công ty hiển thị dưới phần Giá trị cốt lõi.',
    dynamicItems: {
      keyPrefix: 'slogan',
      label: 'Slogan mới',
      fields: [
        FIELD.title('Tiêu đề slogan', { required: true, placeholder: 'Ví dụ: Slogan' }),
        FIELD.content('Nội dung slogan', {
          required: true,
          placeholder: 'Ví dụ: Uy tín từ những điều nhỏ nhất',
        }),
      ],
      sortOrderStep: 10,
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 6 — LỊCH SỬ PHÁT TRIỂN
  // ═══════════════════════════════════════════════════════════════════════════
  timeline: {
    label: 'Các mốc lịch sử phát triển',
    description: 'Mỗi mốc gồm năm, tháng (nếu có), tiêu đề sự kiện và ảnh minh họa.',
    fixedItems: [
      {
        itemKey: 'section_title',
        label: 'Tiêu đề hiển thị Page 6',
        fields: [
          FIELD.title('Tiêu đề hiển thị', {
            required: true,
            placeholder: 'Ví dụ: Lịch sử phát triển',
          }),
        ],
        sortOrder: 5,
      },
    ],
    dynamicItems: {
      keyPrefix: 'milestone',
      label: 'Mốc lịch sử mới',
      fields: [
        FIELD.title('Tiêu đề sự kiện', { required: true, placeholder: 'Ví dụ: Thành lập công ty' }),
        FIELD.timelineDateStart('Mốc thời gian từ', {
          helpText: 'Có thể chỉ chọn mốc bắt đầu, hoặc kết hợp với mốc đến để hiển thị khoảng thời gian.',
        }),
        FIELD.timelineDateEnd('Mốc thời gian đến', {
          helpText: 'Không bắt buộc. Chỉ chọn khi bạn muốn hiển thị thêm mốc kết thúc.',
        }),
        FIELD.content('Mô tả sự kiện (nếu có)', { placeholder: 'Chi tiết về sự kiện...' }),
        FIELD.image('Ảnh minh họa mốc lịch sử'),
      ],
      sortOrderStep: 10,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // PAGE 7 — BAN LÃNH ĐẠO
  // ═══════════════════════════════════════════════════════════
  leadership_care_gallery: {
    label: 'Hồ sơ ban lãnh đạo',
    description: 'Mỗi thành viên gồm tên, chức vụ/vai trò và ảnh đại diện.',
    fixedItems: [
      {
        itemKey: 'section_title',
        label: 'Tiêu đề hiển thị Page 7',
        fields: [
          FIELD.title('Tiêu đề hiển thị', {
            required: true,
            placeholder: 'Ví dụ: Ban lãnh đạo',
          }),
        ],
        sortOrder: 5,
      },
    ],
    dynamicItems: {
      keyPrefix: 'leader',
      label: 'Thành viên lãnh đạo mới',
      fields: [
        FIELD.title('Họ và tên', { required: true, placeholder: 'Nguyễn Văn A' }),
        FIELD.subtitle('Chức vụ / Vai trò', {
          required: true,
          placeholder: 'Tổng Giám đốc',
        }),
        FIELD.content('Tiểu sử ngắn (nếu có)', { placeholder: 'Vài dòng giới thiệu...' }),
        FIELD.image('Ảnh đại diện', {
          required: true,
          helpText: 'Sau khi chọn ảnh, bạn có thể căn nhanh 4 góc hoặc giữa để avatar hiển thị đúng ý hơn ở giao diện người dùng.',
        }),
      ],
      sortOrderStep: 10,
    },
  },

}

/**
 * Lấy schema cho block theo block_key.
 * @param {string} blockKey
 * @returns {import('./aboutBlockSchemas').BlockSchema | null}
 */
export const getBlockSchema = (blockKey) => {
  const normalized = String(blockKey || '').trim().toLowerCase()
  return ABOUT_BLOCK_SCHEMAS[normalized] || null
}

/**
 * Sinh item_key tự động cho dynamic item.
 * @param {string} prefix
 * @param {Array} existingItems - danh sách items hiện có
 * @returns {string}
 */
export const generateDynamicItemKey = (prefix, existingItems = []) => {
  const existingNumbers = existingItems
    .map((item) => {
      const match = String(item.item_key || '').match(new RegExp(`^${prefix}_(\\d+)$`))
      return match ? Number(match[1]) : 0
    })
    .filter((n) => n > 0)
  const nextNumber = existingNumbers.length ? Math.max(...existingNumbers) + 1 : 1
  return `${prefix}_${nextNumber}`
}

/**
 * Tạo draft từ schema field definitions.
 * @param {FieldDef[]} fields
 * @param {Object} [record] - record hiện có
 * @returns {Object}
 */
export const makeDraftFromFields = (fields, record = {}) => {
  const draft = {
    id: record.id ?? null,
    block_id: Number(record.block_id ?? 0),
    item_key: String(record.item_key ?? ''),
    sort_order: Number(record.sort_order ?? 0),
    metadata_json:
      record.metadata_json && typeof record.metadata_json === 'object' && !Array.isArray(record.metadata_json)
        ? { ...record.metadata_json }
        : null,
    block_key: record.block_key ?? '',
    focus_x: record.focus_x ?? null,
    focus_y: record.focus_y ?? null,
    avatar_fit: record.avatar_fit ?? '',
    avatar_focus: record.avatar_focus ?? '',
  }
  for (const field of fields) {
    if (field.key === 'image_id') {
      draft.image_id = record.image_id ?? null
    } else {
      draft[field.key] = String(record[field.key] ?? '')
    }
  }
  return draft
}
