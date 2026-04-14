<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronRight, House } from 'lucide-vue-next'

const route = useRoute()

const detailMap = {
  '1678649369783721984': {
    title: 'China National Decoration (Hainan) Co., LTD',
    image: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/25d8d8e5-5327-4af5-98da-df5e57990185.jpg',
    content:
      "China National Decoration (Hainan) Co., LTD., founded on April 1, 2016, is a holding subsidiary of China Decoration Co., LTD., a comprehensive building decoration enterprise located in Haikou City, Hainan Province. The company focuses on providing indoor and outdoor decoration engineering construction and design services, while involved in the design and installation of water and electrical systems, air conditioning equipment, as well as intelligent, fire protection and garden engineering and other professional fields. In terms of product sales, the company not only provides interior decoration supplies, furniture, kitchen equipment and household appliances, but also covers building materials, decorative materials, chemical products and low-voltage electrical appliances, wire and cable. The company actively responds to the trend of green environmental protection, through the use of environmentally friendly materials and energy-saving technology, to provide customers with green and healthy dining, accommodation, office environment, commercial space, terminal space, science and technology exhibition hall, medical engineering and public venues. With the progress of science and technology, the company continues to explore in the field of intelligent engineering, providing customers with the design and installation of intelligent systems, improving the convenience and comfort of space, and meeting customers' needs for personalized space. Welcome customers and partners to visit China National Decoration (Hainan) Co., Ltd. to visit and negotiate, and jointly create a better future."
  },
  '1678649350821273600': {
    title: 'China Decoration Liaoning Co., LTD',
    image: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/ded7f266-b3fa-43a6-a5c2-8028061d9c11.jpg',
    content:
      "China National Decoration Liaoning Co., LTD., founded on June 3rd, 2011, is a holding subsidiary of China National Decoration Co., LTD., is a comprehensive enterprise focusing on indoor and outdoor decoration projects. Decoration industry as an important branch of the construction industry, with the rapid development of China's economy and the acceleration of the process of urbanization, the market demand continues to grow. The company constantly innovates the design concept and improves the construction technology to meet the diversified needs of the market and customers. The company actively explores green environmental protection, intelligent decoration and other emerging fields to adapt to the new trend of industry development. The company focuses on technology research and development and innovation, and has an experienced design and construction team. The company adopts the advanced design concept, combined with the advanced technology of decoration at home and abroad, to provide customers with one-stop service from design to construction. Welcome customers and partners to visit China National Decoration Liaoning Co., Ltd. to visit and negotiate, and jointly create a better future."
  },
  '1678649214808383488': {
    title: 'Zhongli Intelligent Assembly Technology Research Jiangsu Co., LTD',
    image: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/49a12222-8604-4dd1-a078-92f7284b32ed.jpg',
    content:
      'Zhongli Intelligent Energy Assembly Technology Research Jiangsu Co., LTD., established on February 24, 2022, is a holding subsidiary of China National Decoration Co., LTD. In order to promote the realization of strategic planning and help the industry achieve high-quality development goals, the company has conducted research and practice in application development fields such as intelligent construction and green manufacturing. With the rapid development of the global economy and the continuous progress of science and technology, intelligent construction and green manufacturing have become the key forces to promote the sustainable development of the building decoration industry. The company stands at the forefront of the development of the industry, through the integration of advanced information technology, such as artificial intelligence, big data, Internet of things, etc., is committed to the research and development and application of intelligent construction technology to improve construction efficiency, reduce costs, and improve project quality. At the same time, the company actively responds to the national call for green development, through the use of environmentally friendly materials, optimize the production process, reduce energy consumption and other measures to promote the practice of green manufacturing, in order to achieve a win-win economic and environmental benefits.'
  },
  '1678648937904627712': {
    title: 'Ningbo China National Decoration Design and Research Institute Co., LTD',
    image: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/68fa8575-7756-4a8f-b3ed-1e3703619060.jpg',
    content:
      "Ningbo China National Decoration Design & Research Institute Co., Ltd. is a holding subsidiary of China National Decoration Co., LTD. Since its establishment on December 09, 2003, it has been focusing on the research and practice in the field of architectural decoration and design. Relying on strong design and development capabilities and professional construction team, the company provides customers with a full range of services from concept design to construction completion. With the development of society and the improvement of people's aesthetic needs, the decoration industry is developing in the direction of green, intelligent and personalized. The company follows the industry trend, constantly introduces new materials, new technologies, and promotes the innovation of design concepts to meet the new needs of the market. Welcome friends from all walks of life to visit Ningbo China National Decoration Design and Research Institute Co., LTD., seek common development, create brilliant."
  },
  '1694195421597163520': {
    title: 'China National Decoration Ecological (Beijing) Environment Co., LTD',
    image: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/d5f2f694-f4c1-4f3c-8463-6b6ac8c2abaa.jpg',
    content:
      'China National Decoration Ecological (Beijing) Environment Co., LTD., established on September 30, 2022, is a holding subsidiary of China Decoration Co., LTD. The ecological development strategy of China National Decoration is closely combined with national policies, positioning itself in the field of "ecological restoration + digital environmental protection". Currently, China National Decoration has the advantages of whole-process integration system in industrial research, planning and design, science and technology research and development, investment and financing, construction management, operation and maintenance, and consulting services. Strive to build the whole industry chain system service providers such as water quality management, smart water, ecological restoration, pipe network construction, wetland function restoration, construction operation and maintenance, and strive to become a leader in the ecological and environmental protection industry in the new era.'
  },
  '1694195687021109248': {
    title: 'China National Decoration (Anhui) Building Decoration Co., LTD',
    image: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/62f391cf-6077-40b8-8bc5-bf10b2a32c85.jpg',
    content:
      'China National Decoration (Anhui) Building Decoration Co., Ltd. is a holding subsidiary of China Decoration Co., LTD. With its expertise and rich experience in the field of architectural decoration, the company is committed to providing customers with one-stop solutions from design, construction to post-production services. The company focuses on improving the quality of service, improving the level of decoration technology and design innovation ability. At the same time, explore new business models, such as online and offline combination, customized services, etc., to cope with market competition and meet customer needs. The company actively responds to the development trend of the industry, and promotes the transformation of the company business to green building and prefabricated decoration by adopting advanced decoration technology and materials.'
  },
  '1694195899173199872': {
    title: 'China National Decoration Intelligent (Beijing) Digital Technology Co., LTD',
    image: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/93cdc7ab-b95f-46ee-bd2d-5fc6e83bf5a8.jpg',
    content:
      'China National Decoration Intelligent (Beijing) Digital Technology Co., LTD., established on June 15, 2023, is a holding subsidiary of China Decoration Co., LTD. The company focuses on the 3D digital platform of the decoration whole industry chain system of science and technology, intelligence, industrialization and information; engaged in the prefabricated decoration of digital content intelligent production and information 3D visualization technology development and application; the industrialization software system runs through the whole process of marketing, design, production, material intelligent selection, manufacturing management, and production equipment upgrading of the decoration industry, providing front and back integrated solutions for the entire decoration industry and promoting the digital upgrading of the decoration industry and equipment manufacturing industry.'
  },
  '1958808723589840896': {
    title: 'Zhongzhuang Media (Beijing) Co., Ltd.',
    image: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/c8b65ef0-275f-437a-bfa2-1c77e5d3dcc4.png',
    content:
      'The detailed profile for this subsidiary is being updated. Please contact CNDC@sinodecor.com for the latest company information.'
  }
}

const currentDetail = computed(() => {
  const id = String(route.params.id || '')
  return detailMap[id] || null
})

const splitParagraphs = (text) => {
  if (!text) return []
  const chunks = []
  let cursor = 0
  while (cursor < text.length) {
    const next = Math.min(cursor + 430, text.length)
    chunks.push(text.slice(cursor, next).trim())
    cursor = next
  }
  return chunks
}

const paragraphs = computed(() => splitParagraphs(currentDetail.value?.content || ''))
</script>

<template>
  <main class="subsidiary-detail">
    <section class="subsidiary-detail__shell">
      <nav class="subsidiary-detail__breadcrumb">
        <House :size="16" />
        <router-link to="/">Home</router-link>
        <ChevronRight :size="14" />
        <router-link to="/news/enterprise">News</router-link>
        <ChevronRight :size="14" />
        <span>Enterprise News Details</span>
      </nav>

      <template v-if="currentDetail">
        <h1 class="subsidiary-detail__title">{{ currentDetail.title }}</h1>
        <div class="subsidiary-detail__line"></div>

        <div class="subsidiary-detail__content">
          <p v-for="(paragraph, idx) in paragraphs" :key="`paragraph-${idx}`">
            {{ paragraph }}
          </p>
        </div>

        <div class="subsidiary-detail__image-wrap">
          <img :src="currentDetail.image" :alt="currentDetail.title" />
        </div>
      </template>

      <template v-else>
        <h1 class="subsidiary-detail__title">Subsidiary Detail</h1>
        <div class="subsidiary-detail__line"></div>
        <div class="subsidiary-detail__content">
          <p>The requested detail content was not found.</p>
        </div>
      </template>
    </section>
  </main>
</template>

<style scoped lang="scss">
.subsidiary-detail {
  min-height: 100vh;
  padding: 92px 22px 76px;
  background:
    linear-gradient(180deg, rgba(246, 245, 243, 0.98), rgba(244, 243, 241, 0.98)),
    url('https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/ff34f837-0ea5-4775-a85b-7620d8d7f7ec.jpg')
      center / cover no-repeat;
}

.subsidiary-detail__shell {
  width: min(1280px, calc(100% - 20px));
  margin: 0 auto;
}

.subsidiary-detail__breadcrumb {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666666;
  font-size: 17px;
}

.subsidiary-detail__breadcrumb a {
  color: #555555;
  text-decoration: none;
}

.subsidiary-detail__breadcrumb span {
  color: #d60010;
}

.subsidiary-detail__title {
  margin: 56px 0 0;
  text-align: center;
  color: #212121;
  font-size: clamp(36px, 2.2vw, 52px);
  font-weight: 600;
  line-height: 1.18;
}

.subsidiary-detail__line {
  height: 1px;
  margin: 26px 0 34px;
  background: rgba(142, 142, 142, 0.48);
}

.subsidiary-detail__content p {
  margin: 0 0 12px;
  color: #222f44;
  font-size: clamp(20px, 1.03vw, 23px);
  line-height: 1.88;
}

.subsidiary-detail__image-wrap {
  margin: 34px auto 0;
  width: min(800px, 100%);
}

.subsidiary-detail__image-wrap img {
  width: 100%;
  height: auto;
  display: block;
}

@media (max-width: 767px) {
  .subsidiary-detail {
    padding: 80px 12px 42px;
  }

  .subsidiary-detail__breadcrumb {
    gap: 6px;
    font-size: 14px;
  }

  .subsidiary-detail__title {
    margin-top: 28px;
    font-size: 30px;
  }

  .subsidiary-detail__line {
    margin: 16px 0 20px;
  }

  .subsidiary-detail__content p {
    font-size: 17px;
    line-height: 1.7;
  }
}
</style>
