<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '@/views/user/stores/auth'
import { useCartStore } from '@/views/user/stores/cart'
import { resolveProductDisplayPrice } from '@/views/user/utils/productPricing'

const props = defineProps({
  isOpen: Boolean,
})

const emit = defineEmits(['close'])

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const cartStore = useCartStore()

const getDisplayPrice = (product) => resolveProductDisplayPrice(product)

const formatPrice = (price) => {
  if (!price) return t('user.home.contactPrice') || 'Liên hệ báo giá'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

const handleUpdateQuantity = async (item, delta) => {
  const newQty = item.quantity + delta
  if (newQty <= 0) {
    await cartStore.removeItem(item.id)
  } else {
    await cartStore.updateItem(item.id, newQty)
  }
}

const handleCheckout = () => {
  emit('close')

  if (!authStore.isAuthenticated) {
    router.push({ path: '/login', query: { redirect: '/checkout' } })
    return
  }

  router.push('/checkout')
}
</script>

<template>
  <Transition name="slide">
    <div v-if="isOpen" class="cart-drawer-overlay" @click.self="emit('close')">
      <div class="cart-drawer">
        <div class="cart-header">
          <div class="cart-title">
            <ShoppingBag :size="24" />
            <h2>{{ t('user.home.cart') || 'Giỏ hàng' }}</h2>
            <span class="cart-count">({{ cartStore.totalItems }})</span>
          </div>
          <button class="close-btn" @click="emit('close')">
            <X :size="24" />
          </button>
        </div>

        <div class="cart-content">
          <div v-if="cartStore.loading && !cartStore.cart" class="cart-loading">
            <Loader2 class="spinner" :size="32" />
          </div>

          <div v-else-if="cartStore.items.length === 0" class="cart-empty">
            <div class="empty-icon">
              <ShoppingBag :size="64" />
            </div>
            <h3>{{ t('user.home.cartEmpty') || 'Giỏ hàng trống' }}</h3>
            <p>Hãy chọn những sản phẩm tuyệt vời của chúng tôi</p>
            <button class="continue-btn" @click="emit('close')">
              {{ t('user.home.continueShopping') }}
            </button>
          </div>

          <div v-else class="cart-items">
            <div v-for="item in cartStore.items" :key="item.id" class="cart-item">
              <div class="item-img">
                <img :src="item.product.image_url" :alt="item.product.name" />
              </div>
              <div class="item-details">
                <div class="item-info">
                  <h3>{{ item.product.name }}</h3>
                  <div class="item-price-block">
                    <span class="item-price-label">{{ t('user.products.priceLabel') }}</span>
                    <div v-if="getDisplayPrice(item.product).hasSale" class="item-price-badges">
                      <span class="item-price-badge item-price-badge--sale">Giá khuyến mãi</span>
                      <span class="item-price-badge item-price-badge--original">Giá gốc</span>
                    </div>
                    <p
                      class="item-price"
                      :class="{ 'item-price--sale': getDisplayPrice(item.product).hasSale }"
                    >
                      {{ formatPrice(getDisplayPrice(item.product).finalPrice) }}
                    </p>
                    <span
                      v-if="getDisplayPrice(item.product).hasSale"
                      class="item-price-original"
                    >
                      {{ formatPrice(getDisplayPrice(item.product).originalPrice) }}
                    </span>
                  </div>
                </div>
                <div class="item-actions">
                  <div class="quantity-ctrl">
                    <button @click="handleUpdateQuantity(item, -1)" :disabled="cartStore.loading">
                      <Minus :size="14" />
                    </button>
                    <span>{{ item.quantity }}</span>
                    <button @click="handleUpdateQuantity(item, 1)" :disabled="cartStore.loading">
                      <Plus :size="14" />
                    </button>
                  </div>
                  <button class="remove-btn" @click="cartStore.removeItem(item.id)" :disabled="cartStore.loading">
                    <Trash2 :size="16" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="cartStore.items.length > 0" class="cart-footer">
          <div class="cart-summary">
            <div class="summary-row">
              <span>{{ t('user.home.subtotal') }}:</span>
              <span class="total-price">{{ formatPrice(cartStore.totalPrice) }}</span>
            </div>
            <p class="shipping-note">{{ t('user.home.shippingNote') }}</p>
          </div>
          <div class="footer-actions">
            <button class="checkout-btn" @click="handleCheckout">
              <span>{{ t('user.home.checkout') }}</span>
              <ArrowRight :size="18" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.cart-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 3000;
  display: flex;
  justify-content: flex-end;
}

.cart-drawer {
  width: 100%;
  max-width: 420px;
  background: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
}

.cart-header {
  padding: 24px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .cart-title {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #1e293b;

    h2 {
      font-size: 20px;
      font-weight: 700;
      margin: 0;
    }

    .cart-count {
      font-size: 16px;
      color: #64748b;
    }
  }

  .close-btn {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
    transition: all 0.2s ease;

    &:hover {
      background: #f1f5f9;
      color: #1e293b;
    }
  }
}

.cart-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.cart-loading {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;

  .empty-icon {
    color: #cbd5e1;
  }

  h3 {
    font-size: 20px;
    color: #1e293b;
    margin: 0;
  }

  p {
    color: #64748b;
  }

  .continue-btn {
    margin-top: 8px;
    background: #1e293b;
    color: #fff;
    border: none;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
  }
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.cart-item {
  display: flex;
  gap: 16px;

  .item-img {
    width: 90px;
    height: 90px;
    border-radius: 12px;
    overflow: hidden;
    background: #f8fafc;
    border: 1px solid #f1f5f9;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .item-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 4px;
    }

    .item-price-block {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .item-price-label {
      color: #64748b;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .item-price-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .item-price-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 22px;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 800;
    }

    .item-price-badge--sale {
      background: rgba(220, 38, 38, 0.1);
      color: #dc2626;
    }

    .item-price-badge--original {
      background: #e2e8f0;
      color: #475569;
    }

    .item-price {
      color: #d6b074;
      font-weight: 700;
      font-size: 15px;
      margin: 0;
    }

    .item-price--sale {
      color: #dc2626;
    }

    .item-price-original {
      color: #94a3b8;
      font-size: 12px;
      font-weight: 700;
      text-decoration: line-through;
    }
  }

  .item-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
  }
}

.quantity-ctrl {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8fafc;
  border-radius: 8px;
  padding: 4px;

  button {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    color: #1e293b;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: #f1f5f9;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  span {
    font-weight: 600;
    min-width: 20px;
    text-align: center;
  }
}

.remove-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #fee2e2;
  }
}

.cart-footer {
  padding: 24px;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
}

.cart-summary {
  margin-bottom: 20px;

  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    span:first-child {
      color: #64748b;
      font-weight: 500;
    }

    .total-price {
      font-size: 22px;
      font-weight: 800;
      color: #1e293b;
    }
  }

  .shipping-note {
    font-size: 13px;
    color: #94a3b8;
  }
}

.checkout-btn {
  width: 100%;
  background: #d6b074;
  color: #0c1831;
  border: none;
  padding: 16px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(214, 176, 116, 0.2);
  }
}

.spinner {
  animation: rotate 1s linear infinite;
  color: #d6b074;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Transitions */
.slide-enter-active, .slide-leave-active {
  transition: opacity 0.4s ease;
  .cart-drawer {
    transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
  }
}

.slide-enter-from, .slide-leave-to {
  opacity: 0;
  .cart-drawer {
    transform: translateX(100%);
  }
}
</style>
