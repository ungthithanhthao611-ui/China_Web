import { expect, test } from '@playwright/test'

const STAR_HOTEL_ID = '1676767239059300352'
const TERMINAL_SPACE_ID = '1676767170574704640'
const LEGACY_ROUTE = `/project_list/${STAR_HOTEL_ID}.html`

async function sectionTopDistance(page, sectionId) {
  return page.locator(`[data-section-id="${sectionId}"]`).first().evaluate((element) =>
    Math.abs(element.getBoundingClientRect().top)
  )
}

test.describe('Project Case legacy route', () => {
  test('renders seeded Star Hotel category and canonical detail link', async ({ page }) => {
    await page.goto(LEGACY_ROUTE)

    await expect(page.locator('.new_banner_top span').first()).toHaveText(/Star Hotel/i)
    await expect(page.locator('[data-section-id="ctn2"] .topTitle').first()).toHaveText('W HOTEL')
    await expect(page.locator('[data-section-id="ctn2"] a.almore').first()).toHaveAttribute('href', '/project/w-hotel')
  })

  test('keeps legacy hash anchor behavior for ctn2 without router hash warning fallout', async ({ page }) => {
    await page.goto(`${LEGACY_ROUTE}#ctn2`)

    await page.waitForFunction(() => window.location.hash === '#ctn2')
    await expect(page.locator('[data-section-id="ctn2"] .topTitle').first()).toHaveText('W HOTEL')
    expect(await sectionTopDistance(page, 'ctn2')).toBeLessThan(240)
  })

  test('switches category while preserving legacy route format', async ({ page }) => {
    await page.goto(LEGACY_ROUTE)

    await page.locator('.banFen').getByRole('button', { name: 'Terminal Space' }).click()

    await expect(page).toHaveURL(new RegExp(`/project_list/${TERMINAL_SPACE_ID}\\.html$`))
    await expect(page.locator('.new_banner_top span').first()).toHaveText(/Terminal Space/i)
    await expect(page.locator('[data-section-id="ctn2"] .topTitle').first()).toHaveText('DALIAN INTERNATIONAL AIRPORT TERMINAL')
  })
})
