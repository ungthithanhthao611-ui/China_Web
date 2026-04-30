import { test, expect } from '@playwright/test'

const uniqueSeed = Date.now()
const qaEmail = `qa_${uniqueSeed}@example.com`
const qaPassword = 'Test@123456'
const regularProduct = {
  name: 'Travertine',
  slug: 'travertine',
  price: '1.290.000',
  stock: 24,
}
const saleProduct = {
  name: 'Travertine 3D',
  slug: 'travertine-3d',
  salePrice: '1.390.000',
  originalPrice: '1.490.000',
  stock: 8,
}

test.describe('storefront pricing and stock flow', () => {
  test('keeps pricing and stock consistent from product to order history', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/products')
    await expect(page).toHaveURL(/\/products/)
    await expect(page.locator('body')).toContainText(regularProduct.name)
    await expect(page.locator('body')).toContainText(saleProduct.name)
    await expect(page.locator('body')).toContainText(regularProduct.price)
    await expect(page.locator('body')).toContainText(saleProduct.salePrice)
    await expect(page.locator('body')).toContainText(saleProduct.originalPrice)

    await page.goto(`/products/${regularProduct.slug}`)
    await expect(page.locator('body')).toContainText(regularProduct.price)
    await expect(page.locator('body')).toContainText('Còn 24 sản phẩm')

    await page.goto(`/products/${saleProduct.slug}`)
    await expect(page.locator('body')).toContainText(saleProduct.salePrice)
    await expect(page.locator('body')).toContainText(saleProduct.originalPrice)
    await expect(page.locator('body')).toContainText('Còn 8 sản phẩm')

    await page.goto('/register')
    await page.locator('input[type="email"]').fill(qaEmail)
    await page.locator('input[placeholder="username"]').fill(`qa_${uniqueSeed}`)
    await page.locator('input[type="tel"]').fill('0982000000')
    await page.locator('input[type="password"]').nth(0).fill(qaPassword)
    await page.locator('input[type="password"]').nth(1).fill(qaPassword)
    await page.getByRole('button', { name: 'Đăng ký' }).click()
    await expect(page.locator('.success-message')).toContainText('thành công')
    await page.waitForURL(/\/login/, { timeout: 10_000 })

    await page.locator('input[type="email"]').fill(qaEmail)
    await page.locator('input[type="password"]').first().fill(qaPassword)
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page.locator('.success-message')).toContainText('thành công')
    await page.waitForURL(/\/$/, { timeout: 10_000 })

    await page.goto(`/products/${saleProduct.slug}`)
    await page.getByRole('button', { name: 'Thêm vào giỏ hàng' }).click()
    await page.goto('/cart')
    await expect(page.locator('body')).toContainText(saleProduct.name)
    await expect(page.locator('.cart-row__stock')).toContainText('Còn 8 sản phẩm')
    await expect(page.locator('.cart-price-block')).toContainText(saleProduct.salePrice)
    await expect(page.locator('.cart-price-block')).toContainText(saleProduct.originalPrice)

    const saleQuantityValue = page.locator('.quantity-control span').first()
    const saleIncreaseButton = page.locator('.quantity-control button').nth(1)
    for (let quantity = 1; quantity < saleProduct.stock; quantity += 1) {
      await expect(saleQuantityValue).toHaveText(String(quantity))
      await saleIncreaseButton.click()
    }
    await expect(saleQuantityValue).toHaveText(String(saleProduct.stock))
    await expect(saleIncreaseButton).toBeDisabled()

    await page.goto(`/products/${regularProduct.slug}`)
    await page.getByRole('button', { name: 'Thêm vào giỏ hàng' }).click()

    await page.goto('/cart')
    const cartRows = page.locator('.cart-row')
    await expect(cartRows).toHaveCount(2)
    const saleRow = cartRows.filter({ hasText: saleProduct.name })
    const regularRow = cartRows.filter({ hasText: regularProduct.name })
    await expect(saleRow).toContainText('11.120.000')
    await expect(regularRow).toContainText(regularProduct.price)
    await expect(page.locator('.cart-summary__row--total')).toContainText('12.410.000')

    await page.getByRole('button', { name: 'TIẾN HÀNH THANH TOÁN' }).click()
    await expect(page).toHaveURL(/\/checkout/)
    await expect(page.locator('.checkout-summary-list')).toContainText(saleProduct.name)
    await expect(page.locator('.checkout-summary-list')).toContainText(regularProduct.name)
    await expect(page.locator('.checkout-summary-list')).toContainText(saleProduct.salePrice)
    await expect(page.locator('.checkout-summary-list')).toContainText(saleProduct.originalPrice)
    await expect(page.locator('.checkout-total-row--grand')).toContainText('12.410.000')

    await page.locator('input[placeholder="Nhập họ và tên của bạn"]').fill('QA Automation User')
    await page.locator('input[placeholder="Nhập địa chỉ nhận hàng"]').fill('123 QA Street, Ha Noi')
    await page.locator('input[placeholder="Nhập số điện thoại"]').fill('0982000000')
    await page.locator('input[placeholder="Nhập email của bạn"]').fill(qaEmail)
    await page.locator('textarea[placeholder*="Nhập ghi chú"]').fill('Playwright automated checkout')
    await page.getByRole('button', { name: 'ĐẶT HÀNG' }).click()

    await expect(page.locator('.checkout-success')).toContainText('Đặt hàng thành công!')
    await expect(page.locator('.checkout-success')).toContainText('12.410.000')
    const orderCodeText = await page.locator('.checkout-success strong').first().textContent()
    const orderCode = orderCodeText?.trim() || ''
    expect(orderCode.length).toBeGreaterThan(0)

    await page.goto('/profile?tab=orders')
    await expect(page.locator('.profile-order-list')).toContainText(orderCode)
    await expect(page.locator('.profile-order-list')).toContainText(saleProduct.salePrice)
    await expect(page.locator('.profile-order-list')).toContainText(saleProduct.originalPrice)
    await expect(page.locator('.profile-order-list')).toContainText('12.410.000')

    const latestOrderCard = page.locator('.profile-order-card').first()
    await latestOrderCard.getByRole('button', { name: 'Xem chi tiết' }).click()
    await expect(page).toHaveURL(/\/orders\/\d+/)
    await expect(page.locator('.order-detail-content')).toContainText(orderCode)
    await expect(page.locator('.order-products')).toContainText(saleProduct.name)
    await expect(page.locator('.order-products')).toContainText(regularProduct.name)
    await expect(page.locator('.order-products')).toContainText(saleProduct.salePrice)
    await expect(page.locator('.order-products')).toContainText(saleProduct.originalPrice)
    await expect(page.locator('.order-product-card__line-total')).toContainText('11.120.000')
    await expect(page.locator('.order-detail-summary')).toContainText('12.410.000')
  })
})
