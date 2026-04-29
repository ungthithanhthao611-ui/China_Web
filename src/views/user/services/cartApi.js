import { fetchJson } from '@/shared/lib/http'

function getAuthHeader() {
  const token = localStorage.getItem('user_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function getCart() {
  return fetchJson('/user/cart', {
    headers: getAuthHeader(),
  })
}

export function addToCart(productId, quantity = 1) {
  return fetchJson('/user/cart/items', {
    method: 'POST',
    headers: getAuthHeader(),
    body: { product_id: productId, quantity },
  })
}

export function updateCartItem(itemId, quantity) {
  return fetchJson(`/user/cart/items/${itemId}`, {
    method: 'PATCH',
    headers: getAuthHeader(),
    body: { quantity },
  })
}

export function removeCartItem(itemId) {
  return fetchJson(`/user/cart/items/${itemId}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  })
}

export function clearCart() {
  return fetchJson('/user/cart', {
    method: 'DELETE',
    headers: getAuthHeader(),
  })
}
