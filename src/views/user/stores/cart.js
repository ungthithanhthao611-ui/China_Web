import { defineStore } from 'pinia'
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart } from '@/views/user/services/cartApi'
import { resolveProductUnitPrice } from '@/views/user/utils/productPricing'
import { useAuthStore } from './auth'

const getEffectiveProductPrice = (product) => resolveProductUnitPrice(product)

export const useCartStore = defineStore('cart', {
  state: () => ({
    cart: null,
    loading: false,
    error: null,
  }),

  getters: {
    items: (state) => state.cart?.items || [],
    totalItems: (state) => (state.cart?.items || []).reduce((acc, item) => acc + item.quantity, 0),
    totalPrice: (state) =>
      (state.cart?.items || []).reduce(
        (acc, item) => acc + getEffectiveProductPrice(item.product) * Number(item.quantity || 0),
        0,
      ),
  },

  actions: {
    async fetchCart() {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) return

      this.loading = true
      try {
        this.cart = await getCart()
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },

    async addItem(productId, quantity = 1) {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) {
        throw new Error('AUTH_REQUIRED')
      }

      this.loading = true
      try {
        this.cart = await addToCart(productId, quantity)
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateItem(itemId, quantity) {
      this.loading = true
      try {
        this.cart = await updateCartItem(itemId, quantity)
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async removeItem(itemId) {
      this.loading = true
      try {
        this.cart = await removeCartItem(itemId)
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async clear() {
      this.loading = true
      try {
        this.cart = await clearCart()
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    initialize() {
      this.fetchCart()
    }
  },
})
