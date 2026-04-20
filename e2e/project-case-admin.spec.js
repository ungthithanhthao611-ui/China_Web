import { expect, test } from '@playwright/test'

const STAR_HOTEL_ID = '1676767239059300352'
const ADMIN_USERNAME = process.env.PLAYWRIGHT_ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.PLAYWRIGHT_ADMIN_PASSWORD || 'admin123456'

async function loginAdmin(page) {
  await page.goto('/admin/login')
  await page.fill('#admin-login-username', ADMIN_USERNAME)
  await page.fill('#admin-login-password', ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard/)
}

async function openAdminSection(page, sectionKey, headingText) {
  await page.goto(`/admin/dashboard?section=${sectionKey}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(headingText)
}

async function selectOptionContainingText(selectLocator, text) {
  const optionValue = await selectLocator.locator('option').evaluateAll((options, expectedText) => {
    const matched = options.find((option) => option.value && option.textContent?.includes(expectedText))
    return matched?.value || ''
  }, text)
  expect(optionValue).not.toBe('')
  await selectLocator.selectOption(optionValue)
}

test.describe('Project Case admin flows', () => {
  test('keeps preview links working for multiple mapping records', async ({ page, context }) => {
    await loginAdmin(page)

    await openAdminSection(page, 'project_category_items', 'Project Case Mapping')
    const ctn2PreviewLink = page.locator(`a[href="/project_list/${STAR_HOTEL_ID}.html#ctn2"]`).first()
    await expect(ctn2PreviewLink).toBeVisible()

    const [ctn2PreviewPage] = await Promise.all([
      context.waitForEvent('page'),
      ctn2PreviewLink.click(),
    ])
    await ctn2PreviewPage.waitForLoadState('domcontentloaded')
    await expect(ctn2PreviewPage).toHaveURL(new RegExp(`/project_list/${STAR_HOTEL_ID}\\.html#ctn2$`))
    await expect(ctn2PreviewPage.locator('[data-section-id="ctn2"] .topTitle').first()).toHaveText('W HOTEL')
    await ctn2PreviewPage.close()

    const ctn3PreviewLink = page.locator(`a[href="/project_list/${STAR_HOTEL_ID}.html#ctn3"]`).first()
    await expect(ctn3PreviewLink).toBeVisible()

    const [ctn3PreviewPage] = await Promise.all([
      context.waitForEvent('page'),
      ctn3PreviewLink.click(),
    ])
    await ctn3PreviewPage.waitForLoadState('domcontentloaded')
    await expect(ctn3PreviewPage).toHaveURL(new RegExp(`/project_list/${STAR_HOTEL_ID}\\.html#ctn3$`))
    await expect(ctn3PreviewPage.locator('[data-section-id="ctn3"] .topTitle').first()).toHaveText('BEIJING HOTEL')
    await ctn3PreviewPage.close()
  })

  test('validates required mapping fields and improves entity_media target binding UX', async ({ page }) => {
    await loginAdmin(page)

    await openAdminSection(page, 'project_category_items', 'Project Case Mapping')
    await page.getByRole('button', { name: 'New Record' }).click()
    await page.getByRole('button', { name: 'Save Record' }).click()

    const formErrors = page.locator('.form-errors')
    await expect(formErrors).toContainText('Project Category is required.')
    await expect(formErrors).toContainText('Project is required.')
    await expect(formErrors).toContainText('Section Anchor is required.')
    await expect(formErrors).toContainText('Display Order is required.')

    await openAdminSection(page, 'entity_media', 'Project Media Groups')
    await page.getByRole('button', { name: 'New Record' }).click()

    const entityTypeSelect = page.locator('label').filter({ hasText: 'Entity Type' }).locator('select').first()
    const entityTargetSelect = page.locator('label').filter({ hasText: 'Entity Record ID' }).locator('select').first()
    const groupNameSelect = page.locator('label').filter({ hasText: 'Media Group' }).locator('select').first()

    await expect(entityTypeSelect).toHaveValue('project_category')
    await expect(groupNameSelect).toHaveValue('hero_desktop')
    await expect(entityTargetSelect).toContainText('Star Hotel')
    await expect(groupNameSelect).toContainText('Hero Desktop')
    await expect(groupNameSelect).toContainText('Hero Mobile')
    await expect(groupNameSelect).not.toContainText('Left Gallery')

    await selectOptionContainingText(entityTargetSelect, 'Star Hotel')
    await expect(page.getByRole('link', { name: 'Open selected target' })).toHaveAttribute(
      'href',
      `/project_list/${STAR_HOTEL_ID}.html`
    )

    await entityTypeSelect.selectOption('project')
    await expect(groupNameSelect).toHaveValue('left_gallery')
    await expect(groupNameSelect).toContainText('Left Gallery')
    await expect(groupNameSelect).toContainText('Right Gallery')
    await expect(groupNameSelect).not.toContainText('Hero Desktop')
    await expect(entityTargetSelect).toContainText('W HOTEL')
    await expect(entityTargetSelect).not.toContainText('Star Hotel')

    await selectOptionContainingText(entityTargetSelect, 'W HOTEL')
    await expect(page.getByRole('link', { name: 'Open selected target' })).toHaveAttribute('href', '/project/w-hotel')
  })

  test('edits existing mapping and entity media records and persists updates', async ({ page }) => {
    await loginAdmin(page)

    await openAdminSection(page, 'project_category_items', 'Project Case Mapping')
    const mappingRow = page.locator('tr').filter({ hasText: STAR_HOTEL_ID }).filter({ hasText: 'ctn3' }).first()
    await mappingRow.getByRole('button', { name: 'Edit' }).click()

    const featuredCheckbox = page.locator('label').filter({ hasText: 'Featured Layout' }).locator('input[type="checkbox"]').first()
    await expect(featuredCheckbox).not.toBeChecked()
    await expect(page.getByRole('link', { name: 'Open category preview' })).toHaveAttribute(
      'href',
      `/project_list/${STAR_HOTEL_ID}.html#ctn3`
    )

    await featuredCheckbox.check()
    await page.getByRole('button', { name: 'Save Record' }).click()
    await page.getByRole('button', { name: 'Confirm Update' }).click()

    const updatedMappingRow = page.locator('tr').filter({ hasText: STAR_HOTEL_ID }).filter({ hasText: 'ctn3' }).first()
    await updatedMappingRow.getByRole('button', { name: 'Edit' }).click()
    await expect(page.locator('label').filter({ hasText: 'Featured Layout' }).locator('input[type="checkbox"]').first()).toBeChecked()
    await page.getByRole('button', { name: 'Cancel' }).click()

    await openAdminSection(page, 'entity_media', 'Project Media Groups')
    const mediaRow = page.locator('tr').filter({ hasText: 'hero_desktop' }).first()
    await expect(mediaRow).toBeVisible()
    await mediaRow.getByRole('button', { name: 'Edit' }).click()

    const captionInput = page.locator('label').filter({ hasText: 'Caption' }).locator('input').first()
    await expect(page.getByRole('link', { name: 'Open current preview' })).toHaveAttribute(
      'href',
      /\/project_list\/\d+\.html/
    )

    await captionInput.fill('Smoke caption updated')
    await page.getByRole('button', { name: 'Save Record' }).click()
    await page.getByRole('button', { name: 'Confirm Update' }).click()

    const updatedMediaRow = page.locator('tr').filter({ hasText: 'hero_desktop' }).first()
    await updatedMediaRow.getByRole('button', { name: 'Edit' }).click()
    await expect(page.locator('label').filter({ hasText: 'Caption' }).locator('input').first()).toHaveValue('Smoke caption updated')
  })
})


