import { resolveOrderItemDisplayPrice } from '@/views/user/utils/productPricing'

export const ORDER_STATUS_META = {
  pending_confirmation: {
    label: 'Chờ xác nhận',
    background: '#fef3c7',
    color: '#b45309',
  },
  confirmed: {
    label: 'Đã xác nhận',
    background: '#dbeafe',
    color: '#1d4ed8',
  },
  processing: {
    label: 'Đang xử lý',
    background: '#e0f2fe',
    color: '#0369a1',
  },
  shipping: {
    label: 'Đang giao',
    background: '#e0f2fe',
    color: '#0369a1',
  },
  delivered: {
    label: 'Hoàn thành',
    background: '#dcfce7',
    color: '#15803d',
  },
  completed: {
    label: 'Hoàn thành',
    background: '#dcfce7',
    color: '#15803d',
  },
  cancelled: {
    label: 'Đã huỷ',
    background: '#fee2e2',
    color: '#dc2626',
  },
}

export const PAYMENT_STATUS_META = {
  unpaid: {
    label: 'Chưa thanh toán',
    background: '#ffedd5',
    color: '#ea580c',
  },
  pending: {
    label: 'Đang chờ thanh toán',
    background: '#fef3c7',
    color: '#b45309',
  },
  paid: {
    label: 'Đã thanh toán',
    background: '#dcfce7',
    color: '#15803d',
  },
  failed: {
    label: 'Thanh toán thất bại',
    background: '#fee2e2',
    color: '#dc2626',
  },
  refunded: {
    label: 'Đã hoàn tiền',
    background: '#fee2e2',
    color: '#dc2626',
  },
}

export function cleanText(value) {
  return String(value ?? '').trim()
}

export function formatCurrencyVnd(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 'Liên hệ'

  return `${new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(amount)} đ`
}

export function formatDate(value) {
  if (!value) return 'Chưa cập nhật'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return cleanText(value) || 'Chưa cập nhật'

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(value) {
  if (!value) return 'Chưa cập nhật'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return cleanText(value) || 'Chưa cập nhật'

  const timeText = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)

  const dateText = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)

  return `${timeText} ${dateText}`
}

export function getOrderStatusMeta(statusValue) {
  const key = cleanText(statusValue).toLowerCase()

  return (
    ORDER_STATUS_META[key] || {
      label: cleanText(statusValue) || 'Đang cập nhật',
      background: '#e2e8f0',
      color: '#475569',
    }
  )
}

export function getPaymentStatusMeta(statusValue) {
  const key = cleanText(statusValue).toLowerCase()

  return (
    PAYMENT_STATUS_META[key] || {
      label: cleanText(statusValue) || 'Đang cập nhật',
      background: '#e2e8f0',
      color: '#475569',
    }
  )
}

export function getOrderItemCount(order) {
  const directCount = Number(order?.item_count)
  if (Number.isFinite(directCount) && directCount > 0) return directCount

  return (Array.isArray(order?.items) ? order.items : []).reduce(
    (total, item) => total + Number(item?.quantity || 0),
    0,
  )
}

export function formatProductCount(count) {
  const normalized = Number(count || 0)
  return `${normalized} sản phẩm`
}

export function getOrderRecipientName(order, fallback = 'Nguyễn Văn A') {
  return cleanText(order?.customer_name) || fallback
}

export function getPaymentMethodLabel(order) {
  return cleanText(order?.payment_method_label) || cleanText(order?.payment_method) || 'Chưa cập nhật'
}

export function getOrderTotalLabel(order) {
  return formatCurrencyVnd(order?.total_amount)
}

export { resolveOrderItemDisplayPrice }
