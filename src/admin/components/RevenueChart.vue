<script setup>
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import { computed, ref, watch } from 'vue'
import { Line } from 'vue-chartjs'

import { getDashboardRevenue } from '@/admin/api/dashboard.api'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

const props = defineProps({
  token: {
    type: String,
    required: true,
  },
  filters: {
    type: Object,
    required: true,
  },
})

const loading = ref(false)
const loadError = ref('')
const revenueData = ref({
  labels: [],
  revenues: [],
  total: 0,
})

const hasData = computed(() => revenueData.value.revenues.some((value) => Number(value || 0) > 0))

const dateSummary = computed(() => {
  const range = String(props.filters?.range || '30d')
  if (range === '1d') return 'Hôm nay'
  if (range === '7d') return '7 ngày'
  if (range === '30d') return '30 ngày'

  const from = String(props.filters?.from || '').trim()
  const to = String(props.filters?.to || '').trim()
  if (from && to) return `${from} → ${to}`
  return 'Chọn khoảng ngày'
})

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function formatCompact(value) {
  const numeric = Number(value || 0)
  if (numeric >= 1_000_000_000) return `${(numeric / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`
  if (numeric >= 1_000_000) return `${(numeric / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (numeric >= 1_000) return `${(numeric / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return `${numeric}`
}

const chartData = computed(() => {
  // Try to create a gradient if canvas is available, but vue-chartjs wrapper abstracts it.
  // Standard CSS color is fine.
  return {
    labels: revenueData.value.labels || [],
    datasets: [
      {
        label: 'Doanh thu',
        data: revenueData.value.revenues || [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.2)',
        borderWidth: 3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 5,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        tension: 0.4,
      },
    ],
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: true,
      labels: {
        boxWidth: 22,
        boxHeight: 10,
        color: '#1e3a5f',
        font: { size: 13, weight: '600' },
      },
    },
    tooltip: {
      callbacks: {
        label(context) {
          return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
        },
      },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(148, 163, 184, 0.18)' },
      ticks: {
        color: '#64748b',
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 8,
        font: { size: 12, weight: '600' },
      },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(148, 163, 184, 0.18)' },
      ticks: {
        color: '#64748b',
        callback(value) {
          return formatCompact(value)
        },
        font: { size: 12, weight: '600' },
      },
    },
  },
}))

async function loadRevenue() {
  const token = String(props.token || '').trim()
  if (!token) return

  const range = String(props.filters?.range || '').trim()
  const from = String(props.filters?.from || '').trim()
  const to = String(props.filters?.to || '').trim()

  if (range === 'custom' && (!from || !to)) {
    revenueData.value = { labels: [], revenues: [], total: 0 }
    return
  }

  loading.value = true
  loadError.value = ''
  try {
    const res = await getDashboardRevenue(token, {
      from_date: from,
      to_date: to,
    })
    
    // Support either res.revenue_chart.labels or direct labels
    if (res?.revenue_chart) {
      revenueData.value = {
        labels: res.revenue_chart.labels || [],
        revenues: res.revenue_chart.values || [],
        total: res.total || 0
      }
    } else {
      revenueData.value = {
        labels: res.labels || [],
        revenues: res.revenues || [],
        total: res.total || 0
      }
    }
  } catch (error) {
    revenueData.value = { labels: [], revenues: [], total: 0 }
    loadError.value = error?.message || 'Không thể tải dữ liệu doanh thu.'
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.token, props.filters?.range, props.filters?.from, props.filters?.to],
  () => {
    loadRevenue()
  },
  { immediate: true },
)
</script>

<template>
  <div class="revenue-chart">
    <div class="revenue-chart__meta">
      <div>
        <p class="revenue-chart__caption">Khoảng thời gian</p>
        <strong>{{ dateSummary }}</strong>
      </div>
      <div>
        <p class="revenue-chart__caption">Tổng doanh thu</p>
        <strong>{{ formatCurrency(revenueData.total) }}</strong>
      </div>
    </div>

    <div v-if="loading" class="revenue-chart__skeleton" aria-hidden="true">
      <div class="revenue-chart__skeleton-bar" />
      <div class="revenue-chart__skeleton-plot" />
    </div>

    <div v-else-if="loadError" class="revenue-chart__empty">
      <p>{{ loadError }}</p>
    </div>

    <div v-else-if="!revenueData.labels.length || !hasData" class="revenue-chart__empty">
      <p>Không có dữ liệu</p>
    </div>

    <div v-else class="revenue-chart-wrapper">
      <Line :key="revenueData.labels.join('-')" :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.revenue-chart {
  min-height: 100%;
}

.revenue-chart__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.revenue-chart__caption {
  margin: 0 0 4px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.revenue-chart__meta strong {
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
}

.revenue-chart-wrapper {
  width: 100%;
  height: 360px;
  min-height: 320px;
  position: relative;
}

.revenue-chart__skeleton {
  display: grid;
  gap: 12px;
}

.revenue-chart__skeleton-bar,
.revenue-chart__skeleton-plot {
  border-radius: 12px;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.8), rgba(241, 245, 249, 1), rgba(226, 232, 240, 0.8));
  background-size: 200% 100%;
  animation: chartSkeleton 1.3s linear infinite;
}

.revenue-chart__skeleton-bar {
  height: 48px;
}

.revenue-chart__skeleton-plot {
  min-height: 340px;
}

.revenue-chart__empty {
  min-height: 340px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  border: 1px dashed rgba(148, 163, 184, 0.45);
  color: #64748b;
  text-align: center;
  padding: 20px;
}

@keyframes chartSkeleton {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}
</style>
