import { fetchJson } from '@/shared/lib/http'

function getAuthHeader() {
  const token = localStorage.getItem('user_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function buildVnpayReturnUrl() {
  if (typeof window === 'undefined' || !window.location?.origin) {
    return ''
  }

  return `${window.location.origin}/payment/vnpay-return`
}

export function createMyOrder(payload) {
  return fetchJson('/user/orders', {
    method: 'POST',
    headers: getAuthHeader(),
    body: payload,
  })
}

export function createVnpayPayment(payload) {
  return fetchJson('/user/payments/vnpay/create', {
    method: 'POST',
    headers: getAuthHeader(),
    body: {
      ...payload,
      return_url: buildVnpayReturnUrl(),
    },
  })
}

export function verifyVnpayReturn(query = {}) {
  return fetchJson('/user/payments/vnpay/return', {
    headers: getAuthHeader(),
    query,
  })
}

export function getMyOrders() {
  return fetchJson('/user/orders', {
    headers: getAuthHeader(),
  })
}

export async function getMyOrderById(orderId) {
  const response = await getMyOrders()
  const orders = Array.isArray(response?.items) ? response.items : []

  return orders.find((item) => String(item?.id) === String(orderId)) || null
}

export function buildVnpayCartRedirectMessage() {
  return 'Thanh toán VNPAY đã bị hủy hoặc không thành công. Đơn hàng online đã được hủy, giỏ hàng của bạn vẫn được giữ nguyên để thanh toán lại.'
}
