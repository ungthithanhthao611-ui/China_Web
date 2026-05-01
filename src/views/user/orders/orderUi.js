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
    label: 'Đã hủy',
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

const PAYMENT_METHOD_LABELS = {
  cod: 'Thanh toán khi nhận hàng',
  bank_transfer: 'Chuyển khoản ngân hàng',
  vnpay: 'Thanh toán qua VNPAY',
}

export function cleanText(value) {
  return String(value ?? '').trim()
}

export function formatCurrencyVnd(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return 'Liên hệ'

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

  const dateText = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
  const hours24 = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 || 12

  return `${dateText} ${String(hours12).padStart(2, '0')}:${minutes} ${period}`
}

export function getOrderStatusMeta(statusValue) {
  const key = cleanText(statusValue).toLowerCase()

  return (
    ORDER_STATUS_META[key] || {
      label: 'Đang cập nhật',
      background: '#e2e8f0',
      color: '#475569',
    }
  )
}

export function getPaymentStatusMeta(statusValue) {
  const key = cleanText(statusValue).toLowerCase()

  return (
    PAYMENT_STATUS_META[key] || {
      label: 'Đang cập nhật',
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
  const label = cleanText(order?.payment_method_label)
  const method = cleanText(order?.payment_method).toLowerCase()

  if (label && !PAYMENT_METHOD_LABELS[label.toLowerCase()]) return label

  return PAYMENT_METHOD_LABELS[method] || PAYMENT_METHOD_LABELS[label.toLowerCase()] || 'Chưa cập nhật'
}

export function getOrderTotalLabel(order) {
  return formatCurrencyVnd(order?.total_amount)
}

export { resolveOrderItemDisplayPrice }
