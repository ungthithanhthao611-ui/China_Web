<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-vue-next";

const route = useRoute();
const router = useRouter();

const imageBase = "https://en.sinodecor.com/portal-local/ngc202304190002/cms/image";
const imgSrc = (file) => `${imageBase}/${file}`;
const localImg = (file) => `/images/${file}`;
const speechPortrait = localImg("4e3ee279-9a2c-4021-8fbf-ce7c9aefc218.jpg");
const speechSignature = localImg("5ea063cc-18de-4c5c-8e82-3fb04d11f038.png");
const speechTitleSeal = localImg("about/chairman-speech-seal.png");

const sectionMeta = [
  { id: "page1", title: "About Hero", route: "/about/company-introduction", hash: "#page1" },
  { id: "page2", title: "Company Introduction", route: "/about/company-introduction", hash: "#page2" },
  { id: "page3", title: "Chairman's Speech", route: "/about/chairman-speech", hash: "#page3" },
  { id: "page4", title: "Organization Chart", route: "/about/organization-chart", hash: "#page4" },
  { id: "page5", title: "Corporate Culture", route: "/about/corporate-culture", hash: "#page5" },
  { id: "page6", title: "Development Course", route: "/about/development-course", hash: "#page6" },
  { id: "page7", title: "Leadership Care", route: "/about/leadership-care", hash: "#page7" },
  { id: "page8", title: "Cooperative Partner", route: "/about/cooperative-partner", hash: "#page8" }
];

const aboutTabs = sectionMeta.slice(1);

const companyIntroduction = [
  "China National Decoration Co., LTD. (hereinafter referred to as 'China Decoration') was established in 1984 with the approval of the State Economic Commission and the Ministry of Light Industry. It is the first batch of large-scale and high-grade decoration enterprises with Grade A qualification of indoor and outdoor building decoration construction and design. Large-scale cross-regional, cross-industry digital assembly type construction joint-stock decoration backbone enterprises.",
  "China decoration takes 'innovative industry model, leading green development, and decorating a better life' as the enterprise mission. Adhere to the development path of meeting market demand, highlighting the characteristics of the company, and gathering force to innovate and build. The company now has architectural decoration engineering professional contracting level I, architectural decoration engineering professional design Grade A, exhibition exhibition engineering design and construction integration level I, exhibition engineering level I, museum exhibition exhibition design grade A, museum exhibition exhibition construction level I, building curtain wall, electronics and intelligence, building mechanical and electrical installation, steel structure, ancient buildings, building engineering construction general contracting, special engineering (structural reinforcement) and other professional qualifications.",
  "Forty years of development, China Decoration has always adhered to the deep cultivation of architectural decoration design and construction of the decoration industry. Through years of business practice, China Decoration has set up a dual headquarters development base in Beijing and East China, set up a 'design research institute and ten management centers' and a structure model of multiple functional departments, and set up 7 design branches, 7 branches and 9 subsidiaries nationwide, with a large number of industry experts and technical talents.",
  "Under the leadership of the Party committee and the board of directors of the company, China Decoration adheres to the corporate values of 'winning respect by character, improving happiness by quality, creating value by brand', and has always been in a leading position in the architectural decoration industry with strong professional strength and innovation ability. It has successively been rated as 'Top 100 enterprises in China's building decoration industry', 'National Building Decoration Award Star Enterprise', 'quality and trustworthy enterprise', 'enterprise credit evaluation AAA level credit enterprise', 'Top Ten most influential brands in China's decoration industry', 'Best design Enterprise of the Year' and 'National high-tech Enterprise'.",
  "In the process of development, China Decoration insists on fulfilling its corporate social responsibility, devoting itself to charity undertakings for a long time, continuously donating money to various public welfare organizations, including Beihang Education Foundation, Beijing Red Cross Society, Beijing New Sunshine Charity Foundation, China Children and Youth Foundation, and carrying out activities such as claiming green space and earthquake donations, with a total donation amount of more than 30 million yuan.",
  "In the new era of opportunities, China Decoration takes building domestic first-class intelligent technology, digital design, assembly and construction enterprises as the starting point and goal. It has formed a layout plan of 'building decoration design and construction as the core, digital design as the technical support, vocational education as the talent support, ecological environment, intelligent construction, assembly integration, green new energy materials four plates go hand in hand', creating the development pattern of China's decoration industry chain and promoting the transformation and upgrading of the company."
];

const chairmanSpeech = [
  "Forty years of trials and hardships is a magnificent history of struggle, but also a song of vigorous development. China Decoration Co., Ltd. from the early establishment of the reform and opening up to the growth and growth of the new century, all the way difficult, all the way bumpy, through an extraordinary development process. However, we always maintain the enthusiasm and reverence for the industry, uphold the quality concept of 'artisan spirit, the pursuit of quality', and cast quality models, which has won wide recognition and high praise from all walks of life.",
  "We have always been convinced that 'excellence, pioneering and innovation' is the fundamental way for enterprises to occupy a leading position in the market, 'let every project become a high-quality project' is our ultimate pursuit of technological achievements, but also hidden in the quality of the company's profound brand. After years of precipitation and accumulation, China Decoration has developed into a cross-regional, cross-industry large-scale joint-stock building decoration enterprise, in the design technology, industrial structure, service mode, management ideas, brand quality, personnel training and other aspects of continuous innovation, continue to stimulate the new vitality of the industry, input new momentum for the market, and cultivate a large number of new professionals.",
  "New quality productivity, leading the development of science and technology for China's building decoration industry to open the door of digitalization and intelligence. In the process of transformation and upgrading of the company, we firmly implement the new development concept, open the journey of high-quality development, focus on the application of new technologies, new materials, new processes and new equipment, practice the concept of innovation and green, promote the integration of industry and technology, and help China achieve the goal of 'double carbon', in order to create the greatest value for customers. Return the support and trust of the community to us.",
  "The ancient great event, not only exceptional talent, but also perseverance. In the face of opportunities and challenges in the new era, China Decoration will continue to carry the mission of the times, break through the inherent barriers of the industry, open up a broader space for development, and keep up with the pace of the times. It will further promote the low-carbon transformation in the field of building decoration, digital transformation, intelligent assembly interior integrated decoration, intelligent construction, and the rapid development of new building industrialization, and become the leader and developer of China's building decoration industry.",
  "We sincerely invite all partners to pursue their dreams, create a better space, and write a new chapter for the development of the field of architectural decoration in our country."
];

const cultureBlocks = [
  {
    title: "Corporate Purpose",
    items: [
      { label: "Customer satisfaction", text: "All the value of China Decoration comes from customers; without customers, there is nothing." },
      { label: "Make employees proud", text: "Employee growth is the realistic foundation of the company's value." },
      { label: "Let the world recognize", text: "Excellent enterprises must have a deep global strategic vision and international thinking, keep an open mind, and promote enterprises to internationalization." }
    ]
  },
  {
    title: "Corporate Mission",
    items: [
      { label: "Innovative industry model", text: "The company welcomes change with a positive attitude, regards change as the biggest development opportunity, embraces the trend of digitalization, industrialization and intelligence, and innovates the industry development model." },
      { label: "Leading the green development", text: "Actively explore the ecological science and technology business field, promote the development of circular economy, promote the construction of ecological civilization and high-level protection of the ecological environment, and help achieve the goal of carbon peak and carbon neutrality." },
      { label: "Decorate a better life", text: "We are committed to making every member of society learn, work and live in an elegant and comfortable environment, and enjoy the fun of life." }
    ]
  },
  {
    title: "Enterprise Spirit",
    items: [
      { label: "Creating value", text: "Creating value is fundamental to the survival and development of China Decoration." },
      { label: "Innovation and development", text: "Innovation and development is the core of the overall development of China Decoration. It is the first driving force for the development of China Decoration, advocating and practicing design technology, industrial structure, service mode, management ideas, brand quality and talent training innovation." },
      { label: "Entrepreneurship is more than", text: "The best defense is offense, the best defense is entrepreneurship." }
    ]
  },
  {
    title: "Value",
    items: [
      { label: "Character to win respect", text: "People have quality, the root in the lattice, the emphasis on virtue." },
      { label: "Quality to improve happiness", text: "To create diversified products and create a high quality of life is the meaning and value of people in China Decoration." },
      { label: "Brand creation value", text: "The Chinese decorative national-name golden signboard condensed generations of people in 40 years of painstaking efforts, operations and management and value accumulation." }
    ]
  }
];

const timelineEntries = [
  { year: "1984", month: "09", title: "The company was approved to be established as China Indoor Complete Sets Corporation.", image: "" },
  { year: "1985", month: "11", title: "The company undertook the first five-star hotel decoration project, the Friendship Hotel project.", image: imgSrc("6d13d208-48e9-4b73-aee5-c356fa97ca03.jpg") },
  { year: "1989", month: "12", title: "The company held the first interior decoration exhibition in Beijing.", image: imgSrc("610aa7c0-9b72-44a2-bda2-48afb495ee95.jpg") },
  { year: "1992", month: "12", title: "Held the inauguration meeting of China Interior Decoration Complete Sets Group in the Great Hall of the People.", image: imgSrc("a481f2e2-5e24-4f0f-90d0-ef1a93986f03.jpg") },
  { year: "1995", month: "12", title: "The Party committee of the company held a party member meeting.", image: imgSrc("50808b66-5056-4c17-9ce9-c9fe80f31ca6.jpg") },
  { year: "1996", month: "12", title: "The company's office building has been completed.", image: "" },
  { year: "1997", month: "09", title: "The company was renamed China Decoration (Group) Company.", image: "" },
  { year: "2003", month: "01", title: "The first reform of China Decoration registered the company as China Decoration Co., LTD.", image: "" },
  { year: "2009", month: "06", title: "The Henan Art Center project that the company participated in won the Luban Award of China Construction Engineering.", image: "" },
  { year: "2009", month: "10", title: "The company presented a Tian'anmen LED display system to celebrate the 60th anniversary of the motherland.", image: imgSrc("3b800d78-091f-41b3-a57f-a6584ab2c64a.jpg") },
  { year: "2010", month: "12", title: "The company name is changed to China Decoration Co., LTD.", image: "" },
  { year: "2011", month: "12", title: "Established Yangzhou Yangzijiang China Decoration Building Decoration Engineering Co., LTD., a joint venture with Yangzhou Yangzijiang Group.", image: "" },
  { year: "2014", month: "12", title: "Held the 30th anniversary celebration 'Collection Glory Flying Dream' at the National Convention Center.", image: imgSrc("c6e0ed19-2885-4752-a334-9255baa8257b.jpg") },
  { year: "2015", month: "05", title: "Li Jiefeng, the former chairman of the company, was elected president and secretary-general of Beijing Architectural Decoration Association.", image: "" },
  { year: "2016", month: "06", title: "The company passed the national high-tech enterprise identification.", image: imgSrc("f031b874-f982-4b1b-9ec2-9060a03e18a6.jpg") },
  { year: "2020", month: "06", title: "Xin Jianlin took over as the third chairman and established a new executive team.", image: imgSrc("0f422b10-759a-4f1c-9ca7-43f739047ed8.jpg") },
  { year: "2025", month: "01", title: "The company held the 40th anniversary celebration 'Create and Fight for the Future' in Beijing.", image: imgSrc("238a2ef1-f15e-4758-bd09-8167e7a86216.jpg") }
];

const leadershipItems = [
  {
    year: "1985",
    image: imgSrc("6aafd3c9-4a3a-41d5-a585-5dd2a437a92f.png"),
    text: "The former minister of light industry Yang Bo (right fourth) in early 1985 personally visited my company to undertake the completion of the friendship hotel decoration site market condolences."
  },
  {
    year: "1995",
    image: imgSrc("227db1de-3a33-435f-8a68-6e4a10c7ac85.png"),
    text: "The former president of the National Light Industry Federation Yu Zhen (left) and the relevant leaders of the ministries and commissions visited the company in person and guided the work in the conference room of the original rented office building."
  },
  {
    year: "2001",
    image: imgSrc("63c5ff0a-119e-4573-864a-e45630fa1185.png"),
    text: "The former president of the National Light Industry Association Chen Shineng (fourth from right) visited the company to inspect and guide the work, accompanied by the former company leader Wei Kun (third from right)."
  },
  {
    year: "2011",
    image: imgSrc("4dcf4307-673a-4386-b351-7dcdbf31dc05.png"),
    text: "Ma Tinggui, President of China Building Decoration Association (second from left) visited the company to inspect and guide the work."
  },
  {
    year: "2011",
    image: imgSrc("e40a3fbe-4ba1-434c-9ae3-11f28e77e7ab.png"),
    text: "China Light Industry Federation President Bo Zhengfa, Vice President Tao Xiaonian, China Interior Decoration Association President Liu Yu, Secretary General Zhang Li and other leading comrades visited the company to inspect and guide the work."
  }
];

const partnerCategories = [
  {
    key: "strategic",
    name: "Strategic Cooperation",
    logos: [
      { href: "http://www.shlinli.com/", image: imgSrc("6370e615-d83c-43d2-ac61-da5d37ef3a23.jpg") },
      { href: "https://www.avic.com/", image: imgSrc("b7dfe5e0-0484-44e2-8f1c-7ed1cf732672.jpg") },
      { href: "http://www.ntscid.com/", image: imgSrc("b09df614-1954-45d7-9e72-2b943e91e032.jpg") },
      { href: "https://www.chinaso.com/", image: imgSrc("bd7988af-2dda-4fc4-ba81-0aa2c46e1138.png") },
      { href: "https://www.bucg.com/", image: imgSrc("5b360838-195b-417c-b9f5-c2729c6963b0.gif") },
      { href: "http://www.ccd.com.hk/", image: imgSrc("5ef29600-187a-45e8-9990-5bc337249164.png") },
      { href: "http://www.hxwy.com.cn/", image: imgSrc("79e2da0c-9570-4450-8766-303eb9d872c6.png") },
      { href: "https://www.az.com.cn/", image: imgSrc("fd157699-2f31-43c8-a27d-f7bb51c050ca.png") },
      { href: "http://www.ideapool.tv/", image: imgSrc("502cf951-2835-4ce4-97c7-e9dcc0b6cd87.png") },
      { href: "http://www.jiusi.net/", image: imgSrc("2417ee26-0ef5-4c04-bc30-d8fdd9fc22f3.png") }
    ]
  },
  {
    key: "business",
    name: "Business Cooperation",
    logos: [
      { href: "http://www.10086.cn/bj/", image: imgSrc("c07f7c3b-4b9c-49a7-add4-d6b7d5311c1e.png") },
      { href: "https://www.chd.com.cn/", image: imgSrc("0829ee1d-40be-48bb-8add-3b20cc94f11f.png") },
      { href: "https://www.cnooc.com.cn/", image: imgSrc("7bdcdf66-291d-48b7-8ad4-25b5e67ad981.png") },
      { href: "https://www.fosun.com/", image: imgSrc("f144ac96-87d3-4a3d-b0fa-7e031dca7f5b.png") },
      { href: "http://www.cnpc.com.cn/", image: imgSrc("58260315-6796-4d66-b84f-f655415b62fd.png") },
      { href: "http://www.cofco.com/cn/", image: imgSrc("072c99df-dc7f-4363-9bec-272c60402238.png") },
      { href: "http://www.wanda.cn/", image: imgSrc("4127f235-c134-4c81-96d8-356a23257058.png") },
      { href: "https://www.cfldcn.com/", image: imgSrc("df21f2d8-be81-48da-899a-4cd1c087f94c.png") },
      { href: "http://www.spic.com.cn/", image: imgSrc("5ecfab36-8675-40c8-a47e-84a3a4086d89.png") },
      { href: "https://www.gemdale.com/", image: imgSrc("54310c5d-720a-4910-8d78-1662f39d508c.png") },
      { href: "https://www.sunac.com.cn/", image: imgSrc("00ab262b-eacb-4eaf-9c94-af6f9c7cfd43.png") },
      { href: "http://www.bankofbeijing.com.cn", image: imgSrc("bfd1c647-ea0d-4f7c-9eea-fdf1ff06c17f.png") },
      { href: "http://www.ccb.com/cn/home/indexv3.html", image: imgSrc("ac28702e-28fd-4476-979b-70bc431bd038.png") },
      { href: "http://www.abchina.com/cn/", image: imgSrc("86ed3568-8b26-4355-8738-a1606647c10d.png") },
      { href: "http://www.icbc.com.cn/icbc/", image: imgSrc("c89e54dc-54d9-433b-86ea-12daedd33f46.png") }
    ]
  },
  {
    key: "institutional",
    name: "Institutional Cooperation",
    logos: [
      { href: "https://www.tsinghua.edu.cn/", image: imgSrc("3967f2e4-4b28-4f06-8fed-d83b00787f43.png") },
      { href: "https://www.sg.pku.edu.cn/", image: imgSrc("d89e4819-0071-4bf4-be69-3381c6027929.png") },
      { href: "http://www.buaa.edu.cn/", image: imgSrc("f2325055-bddd-41df-a965-da871f0f78d7.png") },
      { href: "http://www.neu.edu.cn/", image: imgSrc("fcc283b9-dd76-4103-84a0-602c1190eba4.png") },
      { href: "https://www.yzjsxy.com/", image: imgSrc("5b670d41-92f8-44db-947b-78944ebcc82a.png") }
    ]
  },
  {
    key: "association",
    name: "Industry Associations",
    logos: [
      { href: "http://www.cida.org.cn/", image: imgSrc("adb7b287-e16d-447b-a130-4bafc4b1d371.png") },
      { href: "http://www.cbda.cn/", image: imgSrc("a93c78ed-bb1f-4f89-94d4-ddb8cb1cbbfe.gif") },
      { href: "https://www.chinamuseum.org.cn/", image: imgSrc("57325a61-ee56-490a-b89c-90e2c56f647e.png") },
      { href: "http://www.bcda.org.cn/", image: imgSrc("9ee5b030-ea8b-4887-9244-186dd43a50ef.png") },
      { href: "http://www.caec.org.cn/", image: imgSrc("8ee0eaaf-d284-4cdc-914b-8c77f7732e49.png") },
      { href: "http://www.jszszx.com.cn/", image: imgSrc("339748f8-51e2-4090-8873-2ebb97fa0c29.png") }
    ]
  }
];

const activeSection = ref("page1");
const activePartnerCategory = ref("strategic");
const activeCultureTitle = ref("Corporate Purpose");
const visibleSections = ref(new Set(["page1"]));
const videoOpen = ref(false);
const chartOpen = ref(false);
const timelineScroller = ref(null);
const leadershipScroller = ref(null);
const introScroller = ref(null);
const speechScroller = ref(null);
const syncingRouteFromSection = ref(false);

let observer;

const currentPartnerLogos = computed(
  () => partnerCategories.find((item) => item.key === activePartnerCategory.value)?.logos ?? []
);

const currentCultureBlock = computed(
  () => cultureBlocks.find((item) => item.title === activeCultureTitle.value) ?? cultureBlocks[0]
);

const getTargetSectionId = () => {
  if (route.hash) {
    return route.hash.replace("#", "");
  }

  const matched = sectionMeta.find((item) => item.route === route.path && item.id !== "page1");
  if (matched && route.path !== "/about/company-introduction") {
    return matched.id;
  }

  return "page1";
};

const isSectionVisible = (id) => visibleSections.value.has(id);

const isTabActive = (id) => {
  if (id === "page2") {
    return activeSection.value === "page1" || activeSection.value === "page2";
  }

  return activeSection.value === id;
};

const scrollToSection = (id, smooth = true) => {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  activeSection.value = id;
  element.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
};

const resetInnerScrollers = (id) => {
  if (id === "page2" && introScroller.value) {
    introScroller.value.scrollTop = 0;
  }

  if (id === "page3" && speechScroller.value) {
    speechScroller.value.scrollTop = 0;
  }
};

const navigateToSection = async (meta) => {
  await router.push({ path: meta.route, hash: meta.hash });
  await nextTick();
  resetInnerScrollers(meta.id);
  scrollToSection(meta.id, true);
};

const syncActiveSectionToRoute = async (id) => {
  const matched = sectionMeta.find((item) => item.id === id);
  if (!matched) {
    return;
  }

  if (route.path === matched.route && route.hash === matched.hash) {
    return;
  }

  syncingRouteFromSection.value = true;

  try {
    await router.replace({ path: matched.route, hash: matched.hash });
    await nextTick();
  } finally {
    syncingRouteFromSection.value = false;
  }
};

const syncRouteToScroll = async () => {
  await nextTick();
  const targetId = getTargetSectionId();
  resetInnerScrollers(targetId);
  scrollToSection(targetId, false);
};

const updateVisibleSections = (entries) => {
  const nextSet = new Set(visibleSections.value);

  entries.forEach((entry) => {
    const id = entry.target.id;

    if (entry.isIntersecting) {
      nextSet.add(id);
    } else {
      nextSet.delete(id);
    }
  });

  visibleSections.value = nextSet;

  const bestEntry = entries
    .filter((entry) => entry.isIntersecting)
    .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

  if (bestEntry?.target?.id) {
    activeSection.value = bestEntry.target.id;
  }
};

const setupObserver = () => {
  observer = new IntersectionObserver(updateVisibleSections, {
    threshold: [0.2, 0.35, 0.55, 0.75],
    rootMargin: "-12% 0px -18% 0px"
  });

  sectionMeta.forEach((section) => {
    const element = document.getElementById(section.id);
    if (element) {
      observer.observe(element);
    }
  });
};

const scrollHorizontal = (target, direction) => {
  const element = target.value;
  if (!element) {
    return;
  }

  element.scrollBy({
    left: direction * Math.max(element.clientWidth * 0.82, 320),
    behavior: "smooth"
  });
};

watch(activeSection, (id) => {
  syncActiveSectionToRoute(id);
});
watch(
  () => route.fullPath,
  () => {
    if (syncingRouteFromSection.value) {
      return;
    }

    syncRouteToScroll();
  },
  { immediate: true }
);

onMounted(async () => {
  await nextTick();
  setupObserver();
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>

<template>
  <div class="about-page">
    <div class="about-dots">
      <button
        v-for="dot in sectionMeta"
        :key="dot.id"
        :class="['about-dot', { active: activeSection === dot.id }]"
        :aria-label="dot.title"
        type="button"
        @click="navigateToSection(dot)"
      />
    </div>

    <section id="page1" class="about-hero">
      <img class="hero-image hero-image-pc" src="/images/banner/banner3.jpg" alt="About us banner" />
      <img class="hero-image hero-image-mobile" :src="imgSrc('56ead49a-6cdb-449f-8b43-704d1c75d1f6.jpeg')" alt="About us mobile banner" />
      <div class="hero-overlay" />

      <div :class="['hero-content', { 'is-visible': isSectionVisible('page1') }]">
        <div class="hero-title-row">
          <h1>ABOUT US</h1>
          <img src="/images/daumoc.png" alt="Seal" />
        </div>
        <div class="hero-line" />
        <p class="hero-description">
          This golden signboard - China Decoration embodies the efforts and
          accumulation of several generations of people from China Decoration.
        </p>
      </div>

      <div class="hero-tabbar">
        <button
          v-for="tab in aboutTabs"
          :key="tab.id"
          :class="['hero-tab', { active: isTabActive(tab.id) }]"
          type="button"
          @click="navigateToSection(tab)"
        >
          {{ tab.title }}
        </button>
      </div>
    </section>

    <section id="page2" :class="['about-section intro-section', { 'is-visible': isSectionVisible('page2') }]">
      <div class="section-shell">
        <div class="section-heading intro-heading">
          <h2>Company Introduction</h2>
        </div>

        <div class="intro-layout">
          <div class="intro-visual">
            <img class="intro-main" :src="imgSrc('f1225086-4996-4f1d-88f9-08f4228a378e.png')" alt="Company introduction" />
            <div class="intro-watermark" />
            <div class="intro-bottom">
              <button class="video-trigger" type="button" @click="videoOpen = true">
                <span class="video-icon">
                  <Play :size="16" fill="currentColor" />
                </span>
                <span>VIDEO +</span>
              </button>
            </div>
          </div>

          <div ref="introScroller" class="intro-copy intro-scroller">
            <p v-for="paragraph in companyIntroduction" :key="paragraph">
              {{ paragraph }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section id="page3" :class="['about-section speech-section', { 'is-visible': isSectionVisible('page3') }]">
      <div class="section-shell speech-shell">
        <div class="speech-heading">
          <p class="speech-title">
            <span>Chairman's Speech</span>
            <img :src="speechTitleSeal" alt="" aria-hidden="true" />
          </p>
        </div>

        <div class="split-layout reverse speech-layout">
          <div class="speech-copy-panel">
            <div ref="speechScroller" class="split-copy speech-scroller">
              <div class="speech-intro">
                <p>Ladies and Gentlemen:</p>
                <p>Thank leaders, colleagues and partners for their long-term support and love!</p>
              </div>
              <p v-for="paragraph in chairmanSpeech" :key="paragraph">
                {{ paragraph }}
              </p>
              <div class="speech-signoff">
                <div class="signature-block">
                  <span>Chairman of China Decoration Co., LTD.</span>
                  <strong>Xin Jianlin</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="split-media">
            <img :src="speechPortrait" alt="Chairman's speech" />
          </div>

          <img class="signature-mark speech-signature-outside" :src="speechSignature" alt="Signature" />
        </div>
      </div>
    </section>

    <section id="page4" :class="['about-section chart-section', { 'is-visible': isSectionVisible('page4') }]">
      <div class="section-shell chart-shell">
        <div class="chart-heading">
          <p class="chart-title">
            <span>Organization Chart</span>
            <img :src="speechTitleSeal" alt="" aria-hidden="true" />
          </p>
        </div>

        <button class="chart-card" type="button" @click="chartOpen = true">
          <img :src="imgSrc('bcb4ff12-813e-43ef-9669-e5ed2da9a123.png')" alt="Organization chart" />
        </button>
      </div>
    </section>

    <section id="page5" :class="['about-section culture-section', { 'is-visible': isSectionVisible('page5') }]">
      <div class="section-shell">
        <div class="section-heading">
          <span class="eyebrow">ABOUT US</span>
          <h2>Corporate Culture</h2>
        </div>

        <div class="culture-layout">
          <div class="culture-image">
            <img :src="imgSrc('3f9cf9fc-c3f2-4cd5-a6e7-6c1f19a596b0.jpg')" alt="Corporate culture" />
          </div>

          <div class="culture-panel">
            <article class="culture-card active">
              <h3>{{ currentCultureBlock.title }}</h3>
              <ul>
                <li v-for="item in currentCultureBlock.items" :key="item.label">
                  <strong>{{ item.label }}:</strong>
                  <span>{{ item.text }}</span>
                </li>
              </ul>
            </article>

            <div class="culture-tabs">
              <button
                v-for="block in cultureBlocks"
                :key="block.title"
                :class="['culture-tab', { active: activeCultureTitle === block.title }]"
                type="button"
                @click="activeCultureTitle = block.title"
              >
                {{ block.title }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="page6" :class="['about-section timeline-section', { 'is-visible': isSectionVisible('page6') }]">
      <div class="section-shell">
        <div class="section-heading with-controls">
          <div>
            <span class="eyebrow">ABOUT US</span>
            <h2>Development Course</h2>
          </div>

          <div class="slider-controls">
            <button type="button" @click="scrollHorizontal(timelineScroller, -1)">
              <ChevronLeft :size="20" />
            </button>
            <button type="button" @click="scrollHorizontal(timelineScroller, 1)">
              <ChevronRight :size="20" />
            </button>
          </div>
        </div>

        <div class="timeline-stage">
          <div class="timeline-wave" />
          <div ref="timelineScroller" class="timeline-track">
          <article v-for="item in timelineEntries" :key="`${item.year}-${item.month}-${item.title}`" class="timeline-card">
            <div class="timeline-image" :class="{ empty: !item.image }">
              <img v-if="item.image" :src="item.image" :alt="item.title" />
            </div>
            <div class="timeline-meta">
              <strong>{{ item.year }}</strong>
              <span>{{ item.month }}</span>
            </div>
            <p>{{ item.title }}</p>
          </article>
        </div>
        </div>
      </div>
    </section>

    <section id="page7" :class="['about-section leadership-section', { 'is-visible': isSectionVisible('page7') }]">
      <div class="section-shell leadership-shell">
        <div class="leadership-heading">
          <h2 class="leadership-title">
            <span>Leadership Care</span>
            <img :src="speechTitleSeal" alt="" />
          </h2>
        </div>

        <div class="leadership-stage">
          <div class="leadership-nav">
            <button type="button" class="is-prev" @click="scrollHorizontal(leadershipScroller, -1)">
              <ChevronLeft :size="34" />
            </button>
            <button type="button" class="is-next" @click="scrollHorizontal(leadershipScroller, 1)">
              <ChevronRight :size="34" />
            </button>
          </div>

          <div class="leadership-fade" />

          <div ref="leadershipScroller" class="leadership-track">
            <article v-for="item in leadershipItems" :key="item.image" class="leadership-card">
              <div class="leadership-card-frame">
                <div class="leadership-photo">
                  <img :src="item.image" alt="Leadership care" />
                </div>
                <strong class="leadership-year">{{ item.year }}</strong>
              </div>
              <p class="leadership-copy">{{ item.text }}</p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section id="page8" :class="['about-section partner-section', { 'is-visible': isSectionVisible('page8') }]">
      <div class="section-shell">
        <div class="section-heading partner-heading">
          <span class="eyebrow">ABOUT US</span>
          <h2>Cooperative Partner</h2>
        </div>

        <div class="partner-tabs">
          <button
            v-for="category in partnerCategories"
            :key="category.key"
            :class="['partner-tab', { active: activePartnerCategory === category.key }]"
            type="button"
            @click="activePartnerCategory = category.key"
          >
            {{ category.name }}
          </button>
        </div>

        <div class="partner-grid">
          <a
            v-for="logo in currentPartnerLogos"
            :key="logo.image"
            class="partner-card"
            :href="logo.href"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img :src="logo.image" alt="Partner logo" />
          </a>
        </div>
      </div>
    </section>

    <div v-if="videoOpen" class="about-modal" @click.self="videoOpen = false">
      <button class="close-button" type="button" @click="videoOpen = false">
        <X :size="22" />
      </button>
      <video controls autoplay playsinline src="/images/vd/1fb59345-a995-4408-b03b-e8e38ff258e7.mp4" />
    </div>

    <div v-if="chartOpen" class="about-modal light" @click.self="chartOpen = false">
      <button class="close-button" type="button" @click="chartOpen = false">
        <X :size="22" />
      </button>
      <img class="chart-modal-image" :src="imgSrc('bcb4ff12-813e-43ef-9669-e5ed2da9a123.png')" alt="Organization chart large" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.about-page {
  position: relative;
  background:
    radial-gradient(circle at top left, rgba(41, 63, 101, 0.14), transparent 34%),
    linear-gradient(180deg, #f4f0e8 0%, #f8f6f1 14%, #f4f1ea 100%);
  color: #1f2430;
  overflow: clip;
}

.about-dots {
  position: fixed;
  right: 34px;
  top: 50%;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transform: translateY(-50%);
}

.about-dot {
  width: 11px;
  height: 11px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.56);
  box-shadow: inset 0 0 0 1px rgba(186, 157, 118, 0.55);
  cursor: pointer;
  transition: transform 0.24s ease, background 0.24s ease, box-shadow 0.24s ease;

  &.active {
    background: #d6171f;
    box-shadow: 0 0 0 6px rgba(214, 23, 31, 0.12);
    transform: scale(1.16);
  }
}

.about-hero,
.about-section {
  position: relative;
  scroll-margin-top: 96px;
}

.about-hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  overflow: hidden;
  background: #10243c;
}

.hero-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-image-mobile {
  display: none;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(12, 27, 51, 0.86) 0%, rgba(19, 35, 55, 0.78) 31%, rgba(17, 31, 48, 0.48) 54%, rgba(14, 26, 41, 0.16) 100%),
    linear-gradient(180deg, rgba(5, 12, 22, 0.36) 0%, rgba(5, 12, 22, 0.1) 46%, rgba(5, 12, 22, 0.34) 100%);
}

.hero-content {
  position: relative;
  z-index: 2;
  width: min(100%, 1680px);
  margin: 0 auto;
  padding: 180px 96px 180px;
  opacity: 0;
  transform: translateY(36px);
  transition: opacity 0.8s ease, transform 0.8s ease;

  &.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-title-row {
  display: flex;
  align-items: center;
  gap: 22px;
  margin-bottom: 18px;

  h1 {
    margin: 0;
    color: #fff;
    font-size: clamp(48px, 4vw, 82px);
    line-height: 0.96;
    font-weight: 500;
    letter-spacing: 0.02em;
    font-family: "Times New Roman", Georgia, serif;
  }

  img {
    width: clamp(48px, 3.5vw, 68px);
    height: auto;
  }
}

.hero-line {
  width: min(650px, 52vw);
  height: 2px;
  background: linear-gradient(90deg, rgba(198, 26, 33, 0.96) 0%, rgba(198, 26, 33, 0.9) 80%, rgba(198, 26, 33, 0.18) 100%);
  margin-bottom: 52px;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    right: -6px;
    top: 50%;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #c61a21;
    transform: translateY(-50%);
  }
}

.hero-description {
  margin: 0;
  max-width: 760px;
  color: rgba(255, 255, 255, 0.96);
  font-size: clamp(17px, 1.16vw, 26px);
  line-height: 1.7;
}

.hero-tabbar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0;
  padding: 0 28px;
  background: rgba(10, 23, 42, 0.78);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(226, 198, 163, 0.12);
}

.hero-tab {
  min-height: 112px;
  padding: 22px 16px;
  border: 0;
  border-right: 1px solid rgba(226, 198, 163, 0.24);
  background: transparent;
  color: #e2bd8e;
  font-size: clamp(14px, 0.96vw, 18px);
  line-height: 1.35;
  cursor: pointer;
  transition: color 0.24s ease, background 0.24s ease;

  &:last-child {
    border-right: 0;
  }

  &:hover,
  &.active {
    color: #f1d3ab;
    background: rgba(255, 255, 255, 0.04);
  }
}

.about-section {
  min-height: 100vh;
  padding: 108px 0;
  opacity: 0;
  transform: translateY(48px);
  transition: opacity 0.78s ease, transform 0.78s ease;

  &.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-shell {
  width: min(100%, 1660px);
  margin: 0 auto;
  padding: 0 64px;
}

.section-heading {
  margin-bottom: 42px;

  &.with-controls {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 24px;
  }

  h2 {
    display: inline-flex;
    align-items: center;
    gap: 18px;
    margin: 12px 0 0;
    color: #1f2430;
    font-size: clamp(34px, 2.8vw, 54px);
    line-height: 1.06;
    font-weight: 500;
    font-family: "Times New Roman", Georgia, serif;

    &::after {
      content: "";
      width: 44px;
      height: 44px;
      background: url("/images/daumoc.png") center/contain no-repeat;
      flex: none;
    }
  }

  &::after {
    content: "";
    display: block;
    width: min(580px, 48vw);
    height: 2px;
    margin-top: 14px;
    background: linear-gradient(90deg, rgba(198, 26, 33, 0.96) 0%, rgba(198, 26, 33, 0.9) 84%, rgba(198, 26, 33, 0.22) 100%);
  }
}

.eyebrow {
  color: #c49a6d;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.36em;
  text-transform: uppercase;
}

.slider-controls {
  display: inline-flex;
  gap: 12px;

  button {
    width: 46px;
    height: 46px;
    border: 1px solid rgba(180, 140, 93, 0.28);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.76);
    color: #7d5a38;
    cursor: pointer;
    transition: background 0.24s ease, color 0.24s ease, transform 0.24s ease;

    &:hover {
      background: #0f2238;
      color: #e5c494;
      transform: translateY(-1px);
    }
  }
}

.intro-section {
  min-height: 100vh;
  padding-top: 132px;
  padding-bottom: 0;
  background:
    url("https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/984d29d8-d072-49f8-97ea-0fc988e58dda.jpeg")
      no-repeat center center / cover;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 116px;
    width: 108px;
    height: 230px;
    background:
      url("https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/162aa6b5-0cd1-4ba4-b475-00319e4e4d50.jpeg")
        no-repeat center center / cover;
  }

  &::after {
    display: none;
  }
}

.intro-heading {
  position: relative;
  z-index: 2;
  margin-bottom: 30px;

  h2 {
    font-size: clamp(34px, 3vw, 48px);
    letter-spacing: 0;
  }

  &::after {
    width: min(580px, 30vw);
    margin-top: 16px;
    position: relative;
  }

  &::before {
    content: "";
    position: absolute;
    left: 0;
    bottom: -2px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #ce0021;
  }
}

.intro-section .section-shell {
  width: 100%;
  max-width: none;
  padding-left: 196px;
  padding-right: 0;
}

.intro-layout {
  position: relative;
  min-height: calc(100vh - 248px);
}

.intro-visual {
  position: absolute;
  right: 0;
  bottom: 0;
  width: min(44vw, 830px);
  height: 95vh;
  z-index: 1;
  transform: translateX(0);
}

.intro-main {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: right bottom;
}

.intro-watermark {
  display: none;
}

.intro-bottom {
  position: absolute;
  left: -9%;
  bottom: 2%;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 2;
}

.intro-decoration {
  display: none;
}

.video-trigger {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #757575;
  cursor: pointer;
  box-shadow: none;
  font-size: 16px;
  letter-spacing: 0.02em;
}

.video-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 68px;
  border-radius: 50%;
  background: transparent;
  color: #fff;
  box-shadow: none;
  background-image: url("https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/4407f1e1-9209-4baa-9a9b-52e2e8262e37.png");
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  position: relative;

  :deep(svg) {
    width: 12px;
    height: 12px;
    position: absolute;
    top: 59%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #f3c7a2;
    border-radius: 999px;
    padding: 10px;
    box-sizing: content-box;
  }
}

.intro-copy,
.split-copy {
  display: grid;
  gap: 18px;

  p {
    margin: 0;
    color: #aa8760;
    font-size: 20px;
    line-height: 2;
  }
}

.intro-copy {
  position: relative;
  z-index: 2;
  width: 35%;
  max-width: none;
  margin-left: 60px;
  padding: 0 0 8px 40px;
  position: relative;
  direction: rtl;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 8px;
    bottom: 16px;
    width: 6px;
    background: linear-gradient(180deg, #c6a277 0 22%, #ececec 22% 100%);
  }

  p {
    color: #896f56;
    font-size: 17px;
    line-height: 2;
    letter-spacing: 0.01em;
    word-spacing: 0.1em;
    direction: ltr;
    text-align: justify;
  }
}

.intro-scroller {
  max-height: 50vh;
  overflow-y: auto;
  padding-right: 0;
  scrollbar-width: thin;
  scrollbar-color: #bf9a78 #e4e4e4;

  &::-webkit-scrollbar {
    width: 4px;
    background: #e4e4e4;
  }

  &::-webkit-scrollbar-thumb {
    background: #bf9a78;
    border-radius: 999px;
  }
}

.speech-copy-panel {
  width: 60.41%;
  max-width: none;
  margin-left: 0;
  min-height: 0;
}

.speech-layout .split-copy {
  width: min(100%, 820px);
  max-width: none;
  margin-left: 0;
  padding-left: 40px;
  position: relative;
  direction: ltr;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 10px;
    bottom: 0;
    width: 6px;
    background: linear-gradient(180deg, #c6a277 0 20%, #ececec 20% 100%);
  }
}

.speech-scroller {
  display: block;
  margin-top: clamp(42px, 8vh, 92px);
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }

  p {
    margin: 0;
    color: #896f56;
    font-size: 18px;
    line-height: 2;
    text-align: justify;
  }
}

.speech-signoff {
  display: grid;
  justify-items: end;
  gap: 4px;
  margin-top: 26px;
  padding-right: 14px;
}

.speech-intro {
  display: grid;
  gap: 2px;
  margin-bottom: 6px;

  p {
    color: #c49a6d;
    font-size: 18px;
    font-weight: 700;
    line-height: 1.8;
  }
}

.speech-section,
.culture-section,
.timeline-section {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 245, 239, 0.94)),
    radial-gradient(circle at 85% 28%, rgba(212, 205, 194, 0.18), transparent 30%),
    linear-gradient(135deg, rgba(220, 214, 206, 0.16) 0%, transparent 36%);
}

.speech-section {
  position: relative;
  min-height: 100vh;
  padding-top: 118px;
  padding-bottom: 44px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.22)),
    url("/images/about/chairman-speech-bg.jpg") no-repeat center center / cover;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 61.405%;
    height: 40px;
    background: #949494;
  }

  &::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: 0;
    width: 38.595%;
    height: 40px;
    background: #9d000b;
  }
}

.speech-shell {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: none;
  padding-left: 196px;
  padding-right: 140px;
}

.speech-heading {
  margin-bottom: 0;
}

.speech-title {
  display: inline-flex;
  align-items: center;
  gap: 35px;
  margin: 0;
  padding: 0 5% 16px 0;
  border-bottom: 1px solid #ce0021;
  position: relative;

  span {
    color: #333333;
    font-family: "Times New Roman", Georgia, serif;
    font-size: clamp(34px, 3vw, 52px);
    line-height: 1.08;
  }

  img {
    width: 40px;
    flex: 0 0 auto;
  }

  &::before,
  &::after {
    content: "";
    position: absolute;
    bottom: -3px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #ce0021;
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }
}

.split-layout {
  display: grid;
  grid-template-columns: 1.04fr 0.96fr;
  gap: 54px;
  align-items: center;

  &.reverse {
    grid-template-columns: 1.08fr 0.92fr;
  }
}

.split-media img {
  width: 100%;
  min-height: 760px;
  object-fit: cover;
  border-radius: 0;
  box-shadow: none;
}

.speech-layout.reverse {
  grid-template-columns: 60.41% 31.2%;
  gap: 0;
  align-items: center;
  position: relative;
  min-height: calc(100vh - 204px);
}

.speech-layout .split-media {
  position: absolute;
  right: 7.395%;
  top: 50%;
  width: 31.2%;
  height: 86%;
  transform: translateY(-50%);
}

.speech-layout .split-media img {
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: contain;
  background: transparent;
}

.signature-block {
  display: grid;
  justify-items: end;
  gap: 4px;
  color: #c49a6d;

  span {
    font-size: 17px;
    font-weight: 700;
  }

  strong {
    font-size: 22px;
    font-weight: 700;
  }
}

.signature-mark {
  width: 108px;
  opacity: 0.9;
}

.speech-signature-outside {
  position: absolute;
  left: calc(60.41% - 94px);
  bottom: 34px;
  width: 118px;
}

.chart-section {
  position: relative;
  min-height: 100vh;
  padding-top: 118px;
  padding-bottom: 44px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.18)),
    url("/images/about/organization-chart-bg.jpg") no-repeat center center / cover;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 61.405%;
    height: 40px;
    background: #949494;
  }

  &::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: 0;
    width: 38.595%;
    height: 40px;
    background: #9d000b;
  }
}

.chart-shell {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: none;
  padding-left: 196px;
  padding-right: 140px;
}

.chart-heading {
  margin-bottom: 0;
}

.chart-title {
  display: inline-flex;
  align-items: center;
  gap: 35px;
  margin: 0;
  padding: 0 5% 16px 0;
  border-bottom: 1px solid #ce0021;
  position: relative;

  span {
    color: #333333;
    font-family: "Times New Roman", Georgia, serif;
    font-size: clamp(34px, 3vw, 52px);
    line-height: 1.08;
  }

  img {
    width: 40px;
    flex: 0 0 auto;
  }

  &::before,
  &::after {
    content: "";
    position: absolute;
    bottom: -3px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #ce0021;
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }
}

.chart-card {
  width: 100%;
  margin-top: clamp(34px, 6vh, 72px);
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  cursor: zoom-in;
  box-shadow: none;
  position: relative;

  img {
    width: 64%;
    max-width: 64%;
    max-height: 62vh;
    height: auto;
    display: block;
    margin: 3vw auto 0;
    object-fit: contain;
  }
}

.culture-section {
  color: #2b2d31;
}

.culture-layout {
  display: grid;
  grid-template-columns: 1.06fr 0.94fr;
  gap: 40px;
  align-items: start;
}

.culture-image img {
  width: 100%;
  min-height: 760px;
  object-fit: cover;
  border-radius: 0;
}

.culture-panel {
  display: grid;
  gap: 24px;
}

.culture-card {
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;

  h3 {
    margin: 0 0 24px;
    color: #292c32;
    font-size: 26px;
    font-weight: 500;
    padding-bottom: 18px;
    border-bottom: 2px solid #d21a28;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 16px;
  }

  li {
    display: grid;
    gap: 6px;
    color: #6f6f6f;
    font-size: 19px;
    line-height: 1.75;
  }

  strong {
    color: #141414;
    font-weight: 600;
  }
}

.culture-tabs {
  display: grid;
  gap: 18px;
}

.culture-tab {
  text-align: left;
  padding: 0 0 18px;
  border: 0;
  border-bottom: 1px solid rgba(179, 179, 179, 0.4);
  background: transparent;
  color: #a3a3a3;
  font-size: 28px;
  cursor: pointer;
  transition: color 0.24s ease;

  &.active {
    color: #6b6b6b;
  }
}

.partner-section {
  background: linear-gradient(180deg, #beaa8c 0%, #bca788 100%);
}

.timeline-stage {
  position: relative;
  padding: 48px 0 42px;
}

.timeline-wave {
  position: absolute;
  left: 0;
  right: 0;
  top: 43%;
  height: 26px;
  background:
    radial-gradient(circle at 2% 40%, transparent 22px, rgba(0, 0, 0, 0.84) 23px, rgba(0, 0, 0, 0.84) 28px, transparent 29px) 0 0/180px 100% repeat-x;
  opacity: 0.66;
  filter: blur(1px);
}

.timeline-track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(250px, 320px);
  gap: 34px;
  overflow-x: auto;
  padding: 8px 4px 18px;
  scroll-snap-type: x proximity;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.timeline-card {
  scroll-snap-align: start;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}

.timeline-card {
  padding-bottom: 24px;

  p {
    margin: 18px 0 0;
    color: #707070;
    font-size: 19px;
    line-height: 1.75;
  }
}

.timeline-image {
  height: 180px;
  width: 180px;
  margin: 0 auto 18px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  box-shadow:
    0 0 0 18px rgba(255, 255, 255, 0.5),
    18px 14px 0 rgba(220, 220, 220, 0.22);
  overflow: hidden;

  &.empty {
    background: rgba(255, 255, 255, 0.7);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.timeline-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  margin: 0 0 10px;
  color: #b08b62;

  strong {
    font-size: 58px;
    line-height: 1;
  }

  span {
    font-size: 36px;
    line-height: 1;
  }
}

.leadership-stage {
  position: relative;
  overflow: hidden;
  min-height: calc(100vh - 255px);
  padding: 12px 0 18px;
}

.leadership-section {
  position: relative;
  min-height: 100vh;
  padding-top: 118px;
  padding-bottom: 0;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 245, 239, 0.96)),
    radial-gradient(circle at 78% 46%, rgba(218, 212, 201, 0.18), transparent 34%),
    linear-gradient(135deg, rgba(223, 219, 212, 0.18) 0%, transparent 38%);

  &::before {
    content: "";
    position: absolute;
    left: -9%;
    top: -24%;
    width: 42%;
    height: 88%;
    border-radius: 0 0 56% 0 / 0 0 100% 0;
    background: rgba(214, 214, 214, 0.9);
  }

  &::after {
    content: "";
    position: absolute;
    left: -14%;
    bottom: -32%;
    width: 54%;
    height: 70%;
    border-radius: 0 100% 0 0 / 0 100% 0 0;
    background: rgba(177, 157, 133, 0.96);
  }
}

.leadership-shell {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: none;
  padding: 0;
}

.leadership-heading {
  display: grid;
  justify-items: center;
  margin-bottom: 32px;
}

.leadership-title {
  display: inline-flex;
  align-items: center;
  gap: 34px;
  margin: 0;
  padding: 0 5% 14px;
  border-bottom: 1px solid #ce0021;
  position: relative;

  span {
    color: #333333;
    font-family: "Times New Roman", Georgia, serif;
    font-size: clamp(38px, 3vw, 52px);
    line-height: 1.08;
  }

  img {
    width: 40px;
    flex: 0 0 auto;
  }

  &::before,
  &::after {
    content: "";
    position: absolute;
    bottom: -3px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ce0021;
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }
}

.leadership-nav {
  position: absolute;
  left: clamp(92px, 10.5vw, 170px);
  top: 29%;
  z-index: 4;
  display: inline-flex;
  gap: 22px;

  button {
    width: 84px;
    height: 84px;
    border: 0;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    cursor: pointer;
    transition: transform 0.24s ease, opacity 0.24s ease;

    &:hover {
      transform: translateY(-2px);
    }
  }

  .is-prev {
    background: rgba(187, 187, 187, 0.78);
  }

  .is-next {
    background: #ea4b59;
  }
}

.leadership-fade {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 3;
  width: 12vw;
  min-width: 140px;
  height: 100%;
  pointer-events: none;
  background: linear-gradient(90deg, rgba(247, 245, 239, 0) 0%, rgba(247, 245, 239, 0.96) 82%);
}

.leadership-track {
  position: relative;
  z-index: 2;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(410px, 25.2vw);
  gap: clamp(40px, 3.2vw, 74px);
  overflow-x: auto;
  padding: 14px 10vw 34px clamp(430px, 29vw, 560px);
  scroll-snap-type: x mandatory;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.leadership-card {
  scroll-snap-align: start;
  display: grid;
  gap: 28px;
  align-content: start;
}

.leadership-card-frame {
  padding: 18px;
  border: 1px solid rgba(199, 186, 170, 0.92);
  background: rgba(255, 255, 255, 0.96);
}

.leadership-photo {
  display: grid;
  justify-items: center;
  padding: 34px 32px 0;
  min-height: 228px;
  background: #fff;
  border: 1px solid rgba(220, 214, 205, 0.78);

  img {
    width: 100%;
    max-width: 278px;
    height: 170px;
    object-fit: contain;
  }
}

.leadership-year {
  display: block;
  margin: 12px 0 0 54px;
  color: #b08961;
  font-family: "Times New Roman", Georgia, serif;
  font-size: clamp(40px, 3vw, 56px);
  font-weight: 400;
  line-height: 1;
}

.leadership-copy {
  margin: 0;
  padding: 0 24px 0 26px;
  color: #7a7a7a;
  font-size: clamp(17px, 1.15vw, 20px);
  line-height: 1.72;
  letter-spacing: 0.04em;
}

.partner-heading {
  text-align: center;

  h2 {
    color: #fff;
  }

  .eyebrow {
    color: rgba(255, 255, 255, 0.72);
  }
}

.partner-tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin: 0 auto 42px;
  max-width: 1250px;
}

.partner-tab {
  min-height: 58px;
  padding: 12px 20px;
  border: 1px solid rgba(255, 255, 255, 0.36);
  border-radius: 6px;
  background: transparent;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.24s ease;

  &:hover,
  &.active {
    background: #d40012;
    border-color: #d40012;
    color: #fff;
  }
}

.partner-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 26px;
}

.partner-card {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 88px;
  padding: 14px;
  border-radius: 0;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: none;
  transition: transform 0.24s ease, box-shadow 0.24s ease;

  &:hover {
    transform: translateY(-2px);
  }

  img {
    width: 100%;
    max-width: 220px;
    max-height: 62px;
    object-fit: contain;
  }
}

.about-modal {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  background: rgba(4, 10, 18, 0.82);

  video,
  .chart-modal-image {
    width: min(100%, 1180px);
    max-height: min(86vh, 920px);
    border-radius: 24px;
    background: #000;
    box-shadow: 0 36px 100px rgba(0, 0, 0, 0.38);
  }

  &.light {
    background: rgba(15, 21, 31, 0.72);
  }
}

.close-button {
  position: absolute;
  top: 28px;
  right: 28px;
  width: 46px;
  height: 46px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  cursor: pointer;
}

@media (max-width: 1200px) {
  .section-shell,
  .hero-content {
    padding-left: 28px;
    padding-right: 28px;
  }

  .hero-tabbar {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .intro-layout,
  .split-layout,
  .culture-layout {
    grid-template-columns: 1fr;
  }

  .intro-layout {
    min-height: auto;
    display: grid;
    gap: 32px;
  }

  .intro-section .section-shell {
    padding-left: 120px;
    padding-right: 24px;
  }

  .speech-shell {
    padding-left: 120px;
    padding-right: 48px;
  }

  .intro-visual {
    position: relative;
    right: auto;
    top: auto;
    bottom: auto;
    width: 100%;
    min-height: 520px;
  }

  .split-media img,
  .culture-image img,
  .intro-main {
    min-height: 520px;
  }

  .intro-bottom {
    left: 28px;
    bottom: -20px;
  }

  .intro-copy {
    width: min(100%, 720px);
    max-width: none;
    margin-left: 0;
    padding-left: 42px;
  }

  .culture-grid,
  .partner-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .speech-layout.reverse {
    grid-template-columns: 1fr;
    gap: 24px;
    min-height: auto;
  }

  .speech-layout .split-media {
    position: relative;
    right: auto;
    top: auto;
    width: min(100%, 500px);
    height: auto;
    margin-left: auto;
    transform: none;
  }

  .speech-copy-panel {
    width: min(100%, 760px);
    min-height: auto;
    padding-bottom: 0;
  }

  .speech-layout .split-copy {
    width: 100%;
    max-width: none;
  }

  .chart-shell {
    padding-left: 120px;
    padding-right: 48px;
  }

  .chart-card img {
    width: 76%;
    max-width: 76%;
    max-height: 58vh;
  }

  .speech-signoff {
    margin-top: 24px;
    justify-items: start;
    padding-right: 0;
  }

  .speech-signature-outside {
    position: static;
    margin-top: 14px;
    margin-left: auto;
  }

  .leadership-nav {
    left: 28px;
    top: 26%;

    button {
      width: 68px;
      height: 68px;
    }
  }

  .leadership-track {
    grid-auto-columns: minmax(340px, 32vw);
    gap: 36px;
    padding: 14px 7vw 30px 160px;
  }

  .leadership-photo {
    min-height: 208px;
    padding: 26px 24px 0;

    img {
      height: 156px;
    }
  }
}

@media (max-width: 900px) {
  .about-dots {
    right: 16px;
    gap: 12px;
  }

  .hero-content {
    padding-top: 150px;
    padding-bottom: 170px;
  }

  .hero-line {
    width: min(430px, 78vw);
    margin-bottom: 34px;
  }

  .hero-tabbar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 0 12px;
  }

  .hero-tab {
    min-height: 74px;
    border-bottom: 1px solid rgba(226, 198, 163, 0.16);
  }

  .about-section {
    padding: 78px 0;
  }

  .section-shell {
    padding: 0 20px;
  }

  .intro-section .section-shell {
    padding-left: 64px;
    padding-right: 20px;
  }

  .speech-shell {
    padding-left: 64px;
    padding-right: 20px;
  }

  .chart-shell {
    padding-left: 64px;
    padding-right: 20px;
  }

  .section-heading.with-controls {
    align-items: start;
    flex-direction: column;
  }

  .culture-grid,
  .partner-grid {
    grid-template-columns: 1fr;
  }

  .intro-section {
    padding-top: 118px;
  }

  .intro-heading {
    margin-bottom: 24px;
  }

  .intro-layout {
    display: grid;
    gap: 24px;
  }

  .intro-visual {
    min-height: 420px;
    height: auto;
  }

  .intro-copy {
    width: 100%;
    padding-left: 30px;
  }

  .speech-section {
    padding-top: 108px;
  }

  .speech-heading {
    margin-bottom: 24px;
  }

  .chart-card {
    margin-top: 28px;
  }

  .speech-layout .split-copy {
    width: 100%;
    padding-left: 30px;
    margin-top: 0;
  }

  .speech-signoff {
    margin-top: 18px;
  }

  .intro-scroller,
  .speech-scroller {
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }

  .signature-block {
    justify-items: start;
  }

  .speech-signature-outside {
    margin-left: 0;
  }

  .leadership-section {
    padding-top: 108px;

    &::before {
      width: 60%;
      height: 56%;
      top: -10%;
      left: -22%;
    }

    &::after {
      width: 72%;
      height: 42%;
      left: -24%;
      bottom: -10%;
    }
  }

  .leadership-heading {
    margin-bottom: 24px;
  }

  .leadership-title {
    gap: 18px;
    padding: 0 24px 10px;

    span {
      font-size: 30px;
    }

    img {
      width: 30px;
    }
  }

  .leadership-stage {
    min-height: auto;
    padding-top: 74px;
  }

  .leadership-nav {
    left: 20px;
    top: 0;
    gap: 14px;
  }

  .leadership-track {
    grid-auto-columns: minmax(300px, 72vw);
    gap: 24px;
    padding: 0 26px 24px;
  }

  .leadership-fade {
    display: none;
  }
}

@media (max-width: 640px) {
  .about-hero {
    min-height: auto;
    padding-top: 82px;
  }

  .hero-image-pc {
    display: none;
  }

  .hero-image-mobile {
    display: block;
  }

  .hero-content {
    padding-top: 86px;
    padding-bottom: 132px;
  }

  .hero-title-row {
    align-items: end;
    gap: 14px;
  }

  .hero-description {
    font-size: 17px;
  }

  .about-dots {
    display: none;
  }

  .timeline-track,
  .leadership-track {
    grid-auto-columns: minmax(84vw, 84vw);
  }

  .split-media img,
  .culture-image img,
  .intro-main {
    min-height: 360px;
  }

  .intro-section .section-shell {
    padding-left: 20px;
    padding-right: 20px;
  }

  .speech-shell {
    padding-left: 20px;
    padding-right: 20px;
  }

  .chart-shell {
    padding-left: 20px;
    padding-right: 20px;
  }

  .intro-section {
    padding-top: 108px;
  }

  .intro-heading h2 {
    font-size: 28px;
  }

  .intro-heading::after {
    width: min(300px, 72vw);
  }

  .speech-title {
    gap: 18px;
    padding-right: 24px;
    padding-bottom: 10px;

    span {
      font-size: 28px;
    }

    img {
      width: 30px;
    }
  }

  .chart-title {
    gap: 18px;
    padding-right: 24px;
    padding-bottom: 10px;

    span {
      font-size: 28px;
    }

    img {
      width: 30px;
    }
  }

  .chart-card {
    margin-top: 22px;
  }

  .chart-card img {
    width: 94%;
    max-width: 94%;
    max-height: none;
    margin-top: 18px;
  }

  .leadership-nav {
    position: static;
    justify-content: center;
    margin-bottom: 18px;

    button {
      width: 58px;
      height: 58px;
    }
  }

  .leadership-stage {
    padding-top: 0;
  }

  .leadership-track {
    gap: 18px;
    padding: 0 20px 24px;
  }

  .leadership-card {
    gap: 18px;
  }

  .leadership-card-frame {
    padding: 12px;
  }

  .leadership-photo {
    min-height: 182px;
    padding: 18px 12px 0;

    img {
      height: 142px;
    }
  }

  .leadership-year {
    margin-left: 26px;
    font-size: 38px;
  }

  .leadership-copy {
    padding: 0 6px;
    font-size: 16px;
    line-height: 1.65;
    letter-spacing: 0.02em;
  }

  .intro-copy {
    padding-left: 18px;
    padding-right: 0;

    p {
      font-size: 16px;
      line-height: 1.95;
      word-spacing: normal;
    }
  }

  .intro-decoration {
    width: 110px;
  }

  .intro-bottom {
    position: static;
    margin-top: 18px;
    align-items: center;
    justify-content: flex-start;
    gap: 14px;
  }

  .video-trigger {
    font-size: 15px;
  }

  .video-icon {
    width: 52px;
    height: 52px;
  }

  .speech-layout .split-copy {
    padding-left: 18px;
    margin-top: 0;

    &::before {
      width: 5px;
    }
  }

  .speech-signoff {
    gap: 8px;
  }

  .signature-block {
    span {
      font-size: 15px;
    }

    strong {
      font-size: 19px;
    }
  }

  .signature-mark {
    width: 84px;
  }

  .close-button {
    top: 14px;
    right: 14px;
  }
}
</style>
