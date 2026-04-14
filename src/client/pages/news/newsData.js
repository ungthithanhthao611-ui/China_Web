const SITE_ROOT = 'https://en.sinodecor.com'
const BANNER_IMAGE =
  `${SITE_ROOT}/portal-local/ngc202304190002/cms/image/bb102e9a-bc5a-40e6-95f6-ff9c8ab0af94.jpg`
const MOBILE_BANNER_IMAGE =
  `${SITE_ROOT}/repository/portal-local/ngc202304190002/cms/image/24cc6d79-516b-4e0a-a7ae-4b6dcb0bdccc.jpeg`
const BREADCRUMB_IMAGE =
  `${SITE_ROOT}/repository/portal-local/ngc202304190002/cms/image/f516113d-048d-45e0-b42e-3c0cd58d723d.jpeg`
const STAMP_IMAGE =
  'https://omo-oss-image.thefastimg.com/portal-saas/ngc202303290005/cms/image/53e45437-3eaa-453a-87e7-5d86b6f29064.png'
const SECTION_DECORATION =
  `${SITE_ROOT}/repository/portal-local/ngc202304190002/cms/image/bd97f2ca-79a8-43ee-8efa-5b6056d5b1c1.png`
const FEATURED_BACKGROUND =
  `${SITE_ROOT}/repository/portal-local/ngc202304190001/cms/image/9e08c7c1-16d5-44b5-be95-e80b099bc97f.jpg`
const LIST_BACKGROUND =
  `${SITE_ROOT}/repository/portal-local/ngc202304190002/cms/image/dabcc14d-2fa9-4e02-80f3-db7fde9020e0.jpeg`

export const newsCategoryMeta = {
  enterprise: {
    key: 'enterprise',
    label: 'Corporate News',
    heading: 'CORPORATE NEWS',
    route: '/news/enterprise',
    sourceType: 'news_Detail',
    sourceTotalPages: 72,
    sourceTotalItems: 431
  },
  industry: {
    key: 'industry',
    label: 'Industry dynamics',
    heading: 'INDUSTRY DYNAMICS',
    route: '/news/industry',
    sourceType: 'news_Detail2',
    sourceTotalPages: 6,
    sourceTotalItems: 34,
    breadcrumbParentLabel: 'Social Responsibility',
    breadcrumbParentRoute: '/social-responsibility'
  }
}

const buildSourceUrl = (type, id) => `${SITE_ROOT}/${type}/${id}.html`

const buildNewsItem = ({
  id,
  category,
  title,
  date,
  image = '',
  excerpt = '',
  content = [],
  sourceType
}) => ({
  id,
  category,
  title,
  date,
  image,
  excerpt,
  content,
  sourceUrl: buildSourceUrl(sourceType, id)
})

export const newsHero = {
  title: 'NEWS CENTER',
  subtitle: 'Record every step of our progress with news',
  bannerImage: BANNER_IMAGE,
  mobileBannerImage: MOBILE_BANNER_IMAGE,
  breadcrumbImage: BREADCRUMB_IMAGE,
  stampImage: STAMP_IMAGE,
  sectionDecoration: SECTION_DECORATION,
  featuredBackground: FEATURED_BACKGROUND,
  listBackground: LIST_BACKGROUND
}

export const enterpriseFeaturedNews = [
  buildNewsItem({
    id: '1937323008641404928',
    category: 'enterprise',
    date: '2025-06-24',
    sourceType: 'news_Detail',
    image:
      `${SITE_ROOT}/repository/portal-local/ngc202304190002/cms/image/3d34e801-904d-427f-be5b-4c0abbd3a62b.png`,
    title:
      'Jointly Building a Green and Smart New Ecosystem | The Green Construction Supply Chain Innovation Cooperation Exchange Conference (Beijing Station) was Successfully Held, Contributing to the High-quality Development of the Industry',
    excerpt:
      'On June 19th, the Green Construction Supply Chain Innovation Cooperation Exchange Conference (Beijing Station) was held in Beijing under the guidance of the China Building Decoration Association.',
    content: [
      'The conference focused on green construction, smarter supply-chain collaboration, and the practical path toward higher-quality development in decoration engineering.',
      'China Decoration participated in the exchange as part of a broader industry dialogue around innovation, ecological cooperation, and new productive capacity for the built environment.'
    ]
  }),
  buildNewsItem({
    id: '1925373640090783744',
    category: 'enterprise',
    date: '2025-05-13',
    sourceType: 'news_Detail',
    image:
      `${SITE_ROOT}/repository/portal-local/ngc202304190002/cms/image/8ece924a-f6fe-4c18-8900-7e5ca0328ec5.png`,
    title:
      'Strong Alliance Sketches a New Chapter for the City | Shanghai Linli - China Decoration Urban Renewal Research Institute was Inaugurated and Set Sail',
    excerpt:
      'China Decoration and Shanghai Linli launched the Urban Renewal Research Institute to connect research, industrial collaboration, and practical urban renewal strategy.',
    content: [
      'The institute signals a more research-led approach to urban renewal, combining planning, design, and implementation capability around future city transformation.',
      "The launch also highlights China Decoration's interest in long-horizon partnerships that connect policy direction, design thinking, and project delivery."
    ]
  })
]

export const enterpriseNews = [
  buildNewsItem({
    id: '1925367804035534848',
    category: 'enterprise',
    date: '2025-05-12',
    sourceType: 'news_Detail',
    image:
      `${SITE_ROOT}/repository/portal-local/ngc202304190002/cms/image/38d6df33-e47c-46f6-86c1-10e44a69799f.png`,
    title:
      'China Decoration Shines with Two Stars on the Wanjiang River Drawing a New Blueprint for Green and Intelligent Manufacturing',
    excerpt:
      "The opening of the Wuhu Branch and Anhui Subsidiary marked a new step in China Decoration's regional deployment and green intelligent manufacturing strategy.",
    content: [
      'The ceremony framed the new branch and subsidiary as dual growth anchors in Anhui, combining local project delivery with broader industrial capability.',
      "It also reinforced the company's push into green manufacturing, intelligent construction, and a more integrated operating footprint."
    ]
  }),
  buildNewsItem({
    id: '1910243262246100992',
    category: 'enterprise',
    date: '2025-04-03',
    sourceType: 'news_Detail',
    image:
      `${SITE_ROOT}/repository/portal-local/ngc202304190002/cms/image/2aefd35d-5f7f-4e2e-bd1d-e48906416c97.jpg`,
    title:
      'To Build the Foundation with Sincerity and Go Further with Integrity | China Decoration Won the Title of the First Batch of Beijing Credit Commitment Enterprises in 2025',
    excerpt:
      'China Decoration was recognized among the first batch of Beijing Credit Commitment Enterprises in 2025, underscoring its emphasis on integrity and compliance.',
    content: [
      'The recognition reflects long-term attention to operating discipline, reputation, and transparent business practice.',
      'For a company working across public and private projects, credibility remains part of brand equity as much as construction performance.'
    ]
  }),
  buildNewsItem({
    id: '1910206620277874688',
    category: 'enterprise',
    date: '2025-03-29',
    sourceType: 'news_Detail',
    image:
      `${SITE_ROOT}/repository/portal-local/ngc202304190002/cms/image/93cb2d9f-fd0c-47ab-99db-d5771b643785.png`,
    title: 'China Decoration Consortium Won the Bid for Inner Mongolia New City Hotel Renovation Project',
    excerpt:
      'China Decoration secured the Inner Mongolia New City Hotel renovation project, adding another hospitality renovation win to its portfolio.',
    content: [
      "The hotel project strengthens the company's footprint in renovation-led hospitality work, where coordination, finish quality, and schedule control are critical.",
      'Winning the bid also reflects continued competitiveness in complex public-facing renovation projects.'
    ]
  }),
  buildNewsItem({
    id: '1897088519139172352',
    category: 'enterprise',
    date: '2025-03-05',
    sourceType: 'news_Detail',
    image:
      `${SITE_ROOT}/repository/portal-local/ngc202304190002/cms/image/image-20250305085224-2.png`,
    title:
      'Gather Strength and Work Together for Win-Win | China Decoration Attended the 2024 President Meeting of Green Intelligent Construction Branch of China Building Decoration Association',
    excerpt:
      'China Decoration participated in the association president meeting focused on green and intelligent construction, emphasizing cooperation across the sector.',
    content: [
      'The event gathered industry leaders around greener delivery models, smarter workflows, and stronger supply-chain collaboration.',
      "China Decoration's participation aligns with its public positioning around intelligent construction and sustainable development."
    ]
  }),
  buildNewsItem({
    id: '1895023370253312000',
    category: 'enterprise',
    date: '2025-02-27',
    sourceType: 'news_Detail',
    image:
      `${SITE_ROOT}/repository/portal-local/ngc202304190002/cms/image/image-20250227160628-1.png`,
    title:
      'Build a Foundation in Good Faith and Add Wings with Innovation | China Decoration has Won the AAA Credit Rating of China Installation Association for Ten Years',
    excerpt:
      'China Decoration maintained the AAA credit rating from the China Installation Association for a tenth consecutive year.',
    content: [
      'Ten straight years of top credit certification speaks to continuity in governance, delivery reputation, and partner confidence.',
      'The company positions this recognition alongside innovation, suggesting credibility and change are treated as complementary rather than competing priorities.'
    ]
  }),
  buildNewsItem({
    id: '1882617251891453952',
    category: 'enterprise',
    date: '2025-01-24',
    sourceType: 'news_Detail',
    image:
      `${SITE_ROOT}/repository/portal-local/ngc202304190002/cms/image/38317567-c0d6-4493-a1ce-072c2a2b2091.png`,
    title:
      'Tron Legacy Guide the Future | The 40th Anniversary Celebration of China Decoration was Held at Beijing International Hotel Conference Center',
    excerpt:
      'China Decoration marked its 40th anniversary with an event that brought together association leaders, partners, media, and employee representatives.',
    content: [
      "The anniversary celebration served both as a milestone review and a statement of future intent, tying the company's legacy to the next phase of digital and intelligent transformation.",
      "Industry leaders, partners, and colleagues joined the event, reinforcing the company's position within a broad professional network."
    ]
  }),
  buildNewsItem({
    id: '1857342019857489920',
    category: 'enterprise',
    date: '2024-11-07',
    sourceType: 'news_Detail',
    image:
      `${SITE_ROOT}/repository/portal-local/ngc202304190002/cms/image/31b7816e-abf8-4564-9b37-d3bd09dae2df.webp`,
    title: 'Credit China Issue 20241106 | Xin Jianlin: Forty Years of Grace Cast Decoration Industry Leader',
    excerpt:
      'A feature in Credit China highlighted Xin Jianlin and the 40-year development path of China Decoration.',
    content: [
      "The coverage framed the company's four decades of growth around persistence, industry reform, and an evolving strategic agenda.",
      'Media exposure of this kind helps convert corporate history into a clearer public narrative about leadership and direction.'
    ]
  }),
  buildNewsItem({
    id: '1857338368002826240',
    category: 'enterprise',
    date: '2024-11-06',
    sourceType: 'news_Detail',
    image:
      `${SITE_ROOT}/repository/portal-local/ngc202304190002/cms/image/2f05ca39-f6e9-41be-8b8e-a2492f332072.webp`,
    title:
      'New Starting Point New Journey | Maintain Youthful Energy and Enthusiasm in the Forties and Continue to Pursue Dreams and Goals. Pragmatic and Encourage Innovation were Kicked off in Shanghai.',
    excerpt:
      "The Shanghai event set the tone for a new chapter after the company's 40th anniversary, focusing on energy, pragmatism, and innovation.",
    content: [
      'The message was clear: the company wants its next phase to feel ambitious, disciplined, and action-oriented rather than ceremonial.',
      'Shanghai was used as a symbolic launch point for that renewed operating posture.'
    ]
  }),
  buildNewsItem({
    id: '1857334801791655936',
    category: 'enterprise',
    date: '2024-10-31',
    sourceType: 'news_Detail',
    image:
      `${SITE_ROOT}/repository/portal-local/ngc202304190002/cms/image/3e4ca293-fdb7-42c9-800a-072010d3ab19.jpg`,
    title:
      'China Decoration Once Again Won the Title of Statistical Integrity Demonstration Enterprise in Dongcheng District 2024',
    excerpt:
      'China Decoration again received the title of Statistical Integrity Demonstration Enterprise in Dongcheng District.',
    content: [
      'The recognition speaks to data quality, reporting discipline, and formal management capability.',
      'Awards of this type are low-profile externally but important indicators of institutional reliability.'
    ]
  }),
  buildNewsItem({
    id: '1857326373522317312',
    category: 'enterprise',
    date: '2024-10-30',
    sourceType: 'news_Detail',
    image:
      `${SITE_ROOT}/repository/portal-local/ngc202304190002/cms/image/4a1336c8-926a-475d-aadb-1d449f434194.jpg`,
    title:
      'Xin Jianlin, Chairman of China Decoration, was Invited to Attend the 2024 International Youth Sustainable Innovation Conference (YSS2024)',
    excerpt:
      "Chairman Xin Jianlin was invited to YSS2024, linking China Decoration's voice to wider conversations on innovation and sustainability.",
    content: [
      "Participation in cross-sector forums broadens the company's visibility beyond decoration engineering alone.",
      'It also connects its operating story to longer-term sustainability and innovation agendas.'
    ]
  }),
  buildNewsItem({
    id: '1836214251883274240',
    category: 'enterprise',
    date: '2024-08-30',
    sourceType: 'news_Detail',
    image:
      `${SITE_ROOT}/repository/portal-local/ngc202304190002/cms/image/fd548488-c024-46e7-9803-0351a11e7c76.jpg`,
    title:
      'New Chapter of Green Development | Xin Jianlin, Chairman of China Decoration, talks about Industrial Innovation and Sustainable Future',
    excerpt:
      'China Decoration emphasized ecological partnership and higher-quality industrial development through a green-development themed appearance.',
    content: [
      'The company framed ecosystems and collaboration as the route to sustainable competitiveness.',
      'That language matches its broader positioning around green construction and supply-chain partnership.'
    ]
  }),
  buildNewsItem({
    id: '1836315371112701952',
    category: 'enterprise',
    date: '2024-08-30',
    sourceType: 'news_Detail',
    image:
      `${SITE_ROOT}/repository/portal-local/ngc202304190002/cms/image/70d275f9-a40c-4210-a6cf-ea98103e456f.jpg`,
    title:
      'China Decoration was Invited to Attend the First Meeting of the Cooperation Committee of the Hotel Branch of Beijing Culture and Tourism Association',
    excerpt:
      'China Decoration joined the first meeting of the hotel branch cooperation committee to support stronger industry coordination and resource integration.',
    content: [
      'The event focused on complementary advantages, association cohesion, and improving service capability for hotel enterprises.',
      'For China Decoration, this kind of participation reinforces its role in hospitality-related supply and project ecosystems.'
    ]
  })
]

export const industryNews = [
  buildNewsItem({
    id: '1716629569984188416',
    category: 'industry',
    date: '2019-01-01',
    sourceType: 'news_Detail2',
    title: 'Rise of Artificial Sandstone in Decoration Industry',
    excerpt:
      'In the 21st century, people will be concerned about the nature and seek for an environment-friendly living space. Through years of efforts, a green environment-friendly building material containing no radioactive substance has been finally found among hundreds of stone varieties.',
    content: [
      'The original article presents sandstone as a green alternative with strong visual character and practical acoustic advantages.',
      'It highlights how material innovation can reshape interior finishes by balancing natural expression with functional performance.'
    ]
  }),
  buildNewsItem({
    id: '1716629450274557952',
    category: 'industry',
    date: '2019-01-01',
    sourceType: 'news_Detail2',
    title: 'Boeing Beginning to Try Environmentally-friendly Airplane Paint',
    excerpt:
      'Boeing declared recently that it is trying one kind of environmentally-friendly airplane paint and is planning to use this chrome-free coating on all airplanes in the future.',
    content: [
      'Although not a decoration project case, the item points to a wider materials trend: environmental compliance increasingly shapes product development decisions.',
      'That same logic influences coatings and finish systems in the building sector as standards tighten.'
    ]
  }),
  buildNewsItem({
    id: '1716629342535471104',
    category: 'industry',
    date: '2019-01-01',
    sourceType: 'news_Detail2',
    title: 'Knockoff Kitchen and Bathroom Products Predominate',
    excerpt:
      'Knockoff household articles have long existed in the industry. Similar products often appear rapidly after exhibitions, creating pressure on original brands, quality standards, and product trust.',
    content: [
      'Imitation products often compress margins and blur value signals in the market, especially when visual similarity hides quality differences.',
      'The piece underlines why trust, specification discipline, and brand credibility still matter in product selection.'
    ]
  }),
  buildNewsItem({
    id: '1716629819914375168',
    category: 'industry',
    date: '2018-01-01',
    sourceType: 'news_Detail2',
    title: 'China Building Decoration Industry Development in the End of 20th Century',
    excerpt:
      'China Building Decoration Industry Development in the End of 20th Century (1978 - 2000).',
    content: [
      'The article frames late-20th-century industry development as the foundation for later specialization, scaling, and professionalization.',
      'Historical context is useful here because many current players still inherit organizational patterns from that period.'
    ]
  }),
  buildNewsItem({
    id: '1716629663206789120',
    category: 'industry',
    date: '2018-01-01',
    sourceType: 'news_Detail2',
    title: 'False Advertising Still Exists in Decoration Industry',
    excerpt:
      'Complaints in the decoration industry arising from false advertising continued to increase, prompting local consumer associations to warn buyers against being misled by furniture and building material promotions.',
    content: [
      'The article centers on a basic point that still holds: buyers can be misled when product claims and delivered performance diverge.',
      'For contractors and suppliers alike, accurate communication is a trust issue, not just a marketing issue.'
    ]
  }),
  buildNewsItem({
    id: '1716625603955183616',
    category: 'industry',
    date: '2014-04-03',
    sourceType: 'news_Detail2',
    title: 'Furniture Industry: Be Vigilant of 3 New National Standards',
    excerpt:
      'Authorities highlighted new and revised national standards affecting furniture durability, air-quality related equipment, and faucet components, all of which directly impact future product qualification.',
    content: [
      'Standards work often looks dry, but it directly changes product qualification, testing scope, and procurement requirements.',
      'That is why standard updates matter for both manufacturers and project teams specifying finish and fixture packages.'
    ]
  })
]

export const allNewsItems = [
  ...enterpriseFeaturedNews,
  ...enterpriseNews,
  ...industryNews
]

export const getNewsById = (id) => allNewsItems.find((item) => item.id === String(id))
