const toPositiveNumber = (value) => {
  const normalized = Number(value)
  return Number.isFinite(normalized) && normalized > 0 ? normalized : 0
}

export function resolveProductDisplayPrice(product) {
  const effectivePrice = toPositiveNumber(product?.effective_price)
  const salePrice = toPositiveNumber(product?.sale_price)
  const originalPrice = toPositiveNumber(product?.original_price)
  const legacyPrice = toPositiveNumber(product?.price)

  const basePrice = originalPrice || effectivePrice || legacyPrice || 0
  const hasSale = basePrice > salePrice && salePrice > 0
  const finalPrice = hasSale ? salePrice : effectivePrice || legacyPrice || originalPrice || salePrice || 0

  return {
    finalPrice,
    originalPrice: hasSale ? basePrice : 0,
    hasSale,
    hasPrice: finalPrice > 0,
  }
}

export function resolveOrderItemDisplayPrice(item) {
  const salePrice = toPositiveNumber(item?.sale_unit_price)
  const originalPrice = toPositiveNumber(item?.original_unit_price)
  const unitPrice = toPositiveNumber(item?.unit_price)

  const basePrice = originalPrice || unitPrice || 0
  const hasSale = basePrice > salePrice && salePrice > 0
  const finalPrice = hasSale ? salePrice : unitPrice || originalPrice || salePrice || 0

  return {
    finalPrice,
    originalPrice: hasSale ? basePrice : 0,
    hasSale,
    hasPrice: finalPrice > 0,
  }
}

export function resolveProductUnitPrice(product) {
  return resolveProductDisplayPrice(product).finalPrice
}

export function resolveOrderItemUnitPrice(item) {
  return resolveOrderItemDisplayPrice(item).finalPrice
}

export function resolveStockQuantity(record) {
  const normalized = Number(record?.stock_quantity)
  return Number.isFinite(normalized) && normalized > 0 ? Math.floor(normalized) : 0
}
