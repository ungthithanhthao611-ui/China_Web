import { getHonors } from '@/client/services/publicApi'

export async function getHonorsPageData() {
  const payload = await getHonors()

  if (!payload) {
    return {
      hero: null,
      sections: {
        qualification_certificates: [],
        corporate_honors: [],
        project_honors: [],
      },
    }
  }

  if (payload.hero || payload.sections) {
    return {
      hero: payload.hero || null,
      sections: {
        qualification_certificates: payload.sections?.qualification_certificates || [],
        corporate_honors: payload.sections?.corporate_honors || [],
        project_honors: payload.sections?.project_honors || [],
      },
    }
  }

  return {
    hero: null,
    sections: {
      qualification_certificates: payload.qualification_certificates || [],
      corporate_honors: payload.corporate_honors || [],
      project_honors: payload.project_honors || [],
    },
  }
}
