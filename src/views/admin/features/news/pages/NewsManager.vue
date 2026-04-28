<template>
  <div class="news-mgr" :class="{ 'news-mgr--embedded': embedded }">
    <div class="ultimate-clean-workspace">
      <!-- 1. Unified Header -->
      <header class="intro-card">
        <div class="intro-copy">
          <p class="intro-eyebrow">Nội dung & Truyền thông</p>
          <h2>Quản lý tin tức</h2>
          <p>Tạo và biên tập các bài viết tin tức, thông cáo báo chí của doanh nghiệp.</p>
        </div>
        <div class="intro-actions">
          <button class="btn btn-ghost btn-sm" @click="showCrawlModal = true">
            <Download :size="14" /> Crawl URL
          </button>
          <button type="button" class="btn btn-primary btn-sm" @click="goToCreate">
            <Plus :size="14" /> Tạo bài viết
          </button>
        </div>
      </header>

      <!-- 2. Table Area -->
      <section class="section-list-unified">
        <div class="table-wrap" style="padding: 0 32px 32px;">
          <table class="ultimate-table">
            <thead>
              <tr>
                <th style="width: 80px;">Ảnh</th>
                <th>Tiêu đề bài viết</th>
                <th style="width: 140px;">Trạng thái</th>
                <th style="width: 160px;">Ngày xuất bản</th>
                <th style="width: 120px;">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <!-- Loading -->
              <tr v-if="loading">
                <td colspan="5" class="text-center py-12">
                  <span class="text-sub">Đang tải dữ liệu...</span>
                </td>
              </tr>

              <!-- Empty -->
              <tr v-else-if="posts.length === 0">
                <td colspan="5" class="text-center py-12 text-sub">
                  Chưa có bài viết nào. Hãy tạo bài viết đầu tiên.
                </td>
              </tr>

              <!-- Rows -->
              <tr v-else v-for="post in posts" :key="post.id">
                <td>
                  <div class="thumb" style="width: 48px; height: 48px; border-radius: 8px; overflow: hidden; border: 1px solid #f1f5f9;">
                    <img
                      :src="post.thumbnail_url || `https://picsum.photos/seed/${post.id}/200/200`"
                      style="width: 100%; height: 100%; object-fit: cover;"
                      :alt="post.title"
                      referrerpolicy="no-referrer"
                    />
                  </div>
                </td>
                <td>
                  <div class="table-cell-title">
                    <span>{{ post.title }}</span>
                  </div>
                </td>
                <td>
                  <span :class="['badge', post.status === 'published' ? 'badge-active' : 'badge-inactive']">
                    {{ post.status === 'published' ? 'Đã đăng' : 'Bản nháp' }}
                  </span>
                </td>
                <td><span class="table-cell-subtext">{{ formatDate(post.published_at || post.created_at) }}</span></td>
                <td class="table-actions">
                  <button
                    type="button"
                    class="btn btn-secondary-inline"
                    title="Sửa bài viết"
                    @click="goToEdit(post.id)"
                  >
                    Sửa
                  </button>
                  <button class="btn btn-danger-inline" title="Xóa bài viết" @click="deleteTarget = post">
                    Xóa
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- Crawl Modal -->
    <Teleport to="body">
      <div v-if="showCrawlModal" class="modal-overlay" @click.self="showCrawlModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <h2>Crawl bài viết từ URL</h2>
            <button class="close-btn" @click="showCrawlModal = false"><X :size="18" /></button>
          </div>
          <div class="modal-body">
            <p class="text-sub mb-3">Nhập URL bài viết bạn muốn crawl vào trình biên tập:</p>
            <input
              v-model="crawlUrl"
              type="url"
              placeholder="https://example.com/article"
              class="field-input"
              @keydown.enter="submitCrawl"
            />
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost btn-sm" @click="showCrawlModal = false">Hủy</button>
            <button class="btn btn-primary btn-sm" :disabled="!crawlUrl.trim()" @click="submitCrawl">
              Bắt đầu crawl
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Modal -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal-card modal-card--sm">
          <div class="modal-body text-center">
            <div class="modal-icon modal-icon--danger">
              <AlertTriangle :size="24" />
            </div>
            <h3>Xóa bài viết</h3>
            <p class="text-sub">Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.</p>
          </div>
          <div class="modal-footer modal-footer--center">
            <button class="btn btn-secondary btn-sm" style="flex: 1;" @click="deleteTarget = null">Hủy</button>
            <button class="btn btn-danger btn-sm" style="flex: 1;" @click="executeDelete">Xác nhận xóa</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus, Edit, Trash2, Download, X,
  AlertTriangle, Loader2
} from 'lucide-vue-next'
import { ADMIN_TOKEN_STORAGE_KEY } from '@/views/admin/shared/constants/auth'
import {
  listAdminEntityRecords,
  deleteAdminEntityRecord,
} from '@/views/admin/shared/api/adminApi'

const props = defineProps({
  embedded: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()
const token = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || ''

const posts = ref([])
const loading = ref(false)
const showCrawlModal = ref(false)
const crawlUrl = ref('')
const deleteTarget = ref(null)

async function fetchPosts() {
  loading.value = true
  try {
    const res = await listAdminEntityRecords('news_posts', token)
    posts.value = res.items || res.data || res || []
  } catch {
    posts.value = []
  } finally {
    loading.value = false
  }
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString()
}

function goToCreate(query = {}) {
  router.push({ name: 'AdminNewsCreate', query })
}

function goToEdit(id) {
  router.push({ name: 'AdminNewsEdit', params: { id } })
}

function submitCrawl() {
  if (!crawlUrl.value.trim()) return
  goToCreate({ crawl: crawlUrl.value.trim() })
  showCrawlModal.value = false
  crawlUrl.value = ''
}


async function executeDelete() {
  if (!deleteTarget.value) return
  try {
    await deleteAdminEntityRecord('news_posts', deleteTarget.value.id, token)
    deleteTarget.value = null
    await fetchPosts()
  } catch (err) {
    alert('Không thể xóa bài viết: ' + err.message)
  }
}

onMounted(fetchPosts)
</script>

<style scoped>
.news-mgr {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.news-mgr--embedded {
  max-width: none;
  margin: 0;
  padding: 0;
}

.news-mgr__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.news-mgr__title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.news-mgr__actions {
  display: flex;
  gap: 10px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
  text-decoration: none;
  white-space: nowrap;
}

.btn--primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}
.btn--primary:hover { opacity: 0.9; }
.btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn--outline {
  background: #fff;
  color: #374151;
  border-color: #e5e7eb;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.btn--outline:hover { background: #f9fafb; }

.btn--ghost {
  background: transparent;
  color: #6b7280;
}
.btn--ghost:hover { background: #f3f4f6; }

.btn--danger {
  background: #dc2626;
  color: #fff;
  border-color: #dc2626;
}
.btn--danger:hover { background: #b91c1c; }

.btn--full { flex: 1; justify-content: center; }
.btn--loading { opacity: 0.7; cursor: wait; }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  border: 0;
}

/* Table */
.news-mgr__table-wrap {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.news-mgr__table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.news-mgr__table thead {
  background: #f9f9f9;
  border-bottom: 1px solid #e5e7eb;
}

.news-mgr__table th {
  padding: 14px 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
}

.news-mgr__table td {
  padding: 14px 20px;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.news-mgr__row:hover { background: #fafbfc; }

.col-img { width: 72px; }
.col-status { width: 120px; }
.col-date { width: 140px; }
.col-actions { width: 100px; text-align: right; }

.thumb {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background: #f9f9f9;
}
.thumb img { width: 100%; height: 100%; object-fit: cover; }

.post-title { font-weight: 600; color: #1a1a2e; }

/* Badges */
.badge {
  display: inline-block;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-radius: 4px;
}
.badge--draft { background: #fff3e0; color: #e65100; }
.badge--published { background: #e8f5e9; color: #2e7d32; }
.badge--archived { background: #f3e5f5; color: #7b1fa2; }

/* Row actions */
.row-actions { display: flex; justify-content: flex-end; gap: 4px; }

.act-btn {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  background: transparent;
  color: #6b7280;
  text-decoration: none;
}
.act-btn:hover { background: #f3f4f6; }
.act-btn--edit:hover { color: #2563eb; background: #eff6ff; }
.act-btn--delete:hover { color: #dc2626; background: #fef2f2; }

/* Helpers */
.text-sub { color: #6b7280; font-size: 13px; }
.text-center { text-align: center; }
.py-12 { padding-top: 48px; padding-bottom: 48px; }
.mb-3 { margin-bottom: 12px; }
.ml-2 { margin-left: 8px; }
.inline-block { display: inline-block; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  padding: 20px;
}

.modal-card {
  background: #fff;
  border-radius: 8px;
  width: 100%;
  max-width: 460px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}
.modal-card--sm { max-width: 380px; }

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}
.modal-header h2 { font-size: 15px; font-weight: 700; color: #1a1a2e; margin: 0; }

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
}
.close-btn:hover { background: #f3f4f6; }

.modal-body { padding: 16px 20px; }

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  background: #f9f9f9;
  border-top: 1px solid #e5e7eb;
}
.modal-footer--center { justify-content: center; }

.modal-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}
.modal-icon--danger { background: #fef2f2; color: #dc2626; }

.modal-body h3 { font-size: 18px; font-weight: 700; color: #1a1a2e; margin: 0 0 8px; }
.modal-body p { font-size: 14px; margin: 0; line-height: 1.5; }

.field-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}
.field-input:focus { border-color: #2563eb; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
