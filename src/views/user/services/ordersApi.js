import { fetchJson } from '@/shared/lib/http'

function getAuthHeader() {
  const token = localStorage.getItem('user_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function createMyOrder(payload) {
  return fetchJson('/user/orders', {
    method: 'POST',
    headers: getAuthHeader(),
    body: payload,
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
