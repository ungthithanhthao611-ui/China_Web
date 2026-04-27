import { getHonors } from '@/views/user/services/publicApi'

const createEmptyPayload = () => ({
  hero_banner: null,
  factory_overview: null,
  production_capabilities: [],
  factory_gallery: [],
  certificates: [],
  contact_info: null,
  hero: null,
  sections: {
    qualification_certificates: [],
    corporate_honors: [],
    project_honors: [],
  },
})

export async function getHonorsPageData() {
  const payload = await getHonors()

  if (!payload) {
    return createEmptyPayload()
  }

  return {
    ...createEmptyPayload(),
    ...payload,
    sections: {
      qualification_certificates: payload.sections?.qualification_certificates || payload.qualification_certificates || [],
      corporate_honors: payload.sections?.corporate_honors || payload.corporate_honors || [],
      project_honors: payload.sections?.project_honors || payload.project_honors || [],
    },
    production_capabilities: payload.production_capabilities || [],
    factory_gallery: payload.factory_gallery || [],
    certificates: payload.certificates || payload.items || [],
  }
}
