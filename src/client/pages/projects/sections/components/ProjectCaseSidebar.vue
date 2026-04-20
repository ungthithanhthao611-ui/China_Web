<script setup>
import { computed, ref } from 'vue'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Minus, Plus } from 'lucide-vue-next'

const props = defineProps({
  categories: {
    type: Array,
    required: true
  },
  activeCategoryId: {
    type: String,
    required: true
  },
  activeSectionId: {
    type: String,
    required: true
  },
  expandedCategoryIds: {
    type: Array,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'select-all',
  'select-category',
  'select-project',
  'toggle-category',
  'toggle-sidebar'
])

const bodyRef = ref(null)
const expandedLookup = computed(() => new Set(props.expandedCategoryIds))

function isExpanded(categoryId) {
  return expandedLookup.value.has(categoryId)
}

function scrollBody(direction) {
  if (!bodyRef.value) return

  bodyRef.value.scrollBy({
    top: direction * 260,
    behavior: 'smooth'
  })
}
</script>

<template>
  <aside class="case_nav" :class="{ case_nav_act: isOpen }">
    <div class="case_nl">
      <button class="case_navh case_navall" type="button" @click="emit('select-all')">All</button>

      <div ref="bodyRef" class="case_sw">
        <section
          v-for="category in categories"
          :key="category.id"
          class="case_group"
          :class="{ case_act: activeCategoryId === category.id }"
        >
          <button class="case_name" type="button" @click="emit('toggle-category', category.id)">
            <span>{{ category.name }}</span>
            <span class="case_tag">
              <Minus v-if="isExpanded(category.id)" :size="14" />
              <Plus v-else :size="14" />
            </span>
          </button>

          <transition name="case-sidebar-expand">
            <div v-if="isExpanded(category.id)" class="case_tent">
              <button class="case_title_link" type="button" @click="emit('select-category', category.id)">
                Open Category
              </button>

              <div class="case_num">
                <span>{{ category.projects.length }}</span>
                <span>project cases in total</span>
              </div>

              <button
                v-for="project in category.projects"
                :key="`${category.id}-${project.id}`"
                class="case_tit"
                :class="{ 'is-current': activeCategoryId === category.id && activeSectionId === project.id }"
                type="button"
                @click="emit('select-project', category.id, project.id)"
              >
                {{ project.title }}
              </button>
            </div>
          </transition>
        </section>
      </div>

      <div class="case_btn">
        <button type="button" aria-label="Scroll up" @click="scrollBody(-1)">
          <ChevronUp :size="18" />
        </button>
        <button type="button" aria-label="Scroll down" @click="scrollBody(1)">
          <ChevronDown :size="18" />
        </button>
      </div>
    </div>

    <button
      class="case_nr"
      type="button"
      :aria-label="isOpen ? 'Collapse sidebar' : 'Expand sidebar'"
      @click="emit('toggle-sidebar')"
    >
      <ChevronLeft v-if="isOpen" :size="18" />
      <ChevronRight v-else :size="18" />
    </button>
  </aside>
</template>

<style scoped>
.case_nav {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  height: 100vh;
  transform: translateX(calc(-1 * var(--case-sidebar-width)));
  transition: transform 0.4s ease;
}

.case_nav.case_nav_act {
  transform: translateX(0);
}

.case_nl {
  width: var(--case-sidebar-width);
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(196, 6, 18, 0.98), rgba(164, 7, 20, 0.96));
  color: #f7efe4;
  box-shadow: 18px 0 40px rgba(15, 22, 34, 0.18);
}

.case_navall,
.case_name,
.case_tit,
.case_btn button,
.case_nr,
.case_title_link {
  border: 0;
  cursor: pointer;
}

.case_navall {
  height: 78px;
  padding: 0 28px;
  background: transparent;
  color: #ffffff;
  text-align: left;
  font-size: 16px;
  letter-spacing: 0.04em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
}

.case_sw {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
}

.case_sw::-webkit-scrollbar {
  width: 0;
}

.case_group {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.case_group.case_act .case_name {
  background: rgba(255, 255, 255, 0.08);
}

.case_name {
  width: 100%;
  min-height: 70px;
  padding: 0 18px 0 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #ffffff;
  background: transparent;
  text-align: left;
  font-size: 16px;
  transition: background 0.3s ease;
}

.case_name:hover {
  background: rgba(255, 255, 255, 0.07);
}

.case_tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.92);
}

.case_tent {
  padding: 10px 0 18px;
  background: rgba(142, 6, 18, 0.22);
}

.case_title_link {
  margin: 0 28px 14px;
  padding: 0;
  background: transparent;
  color: rgba(255, 240, 226, 0.92);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.case_num {
  padding: 0 28px 14px;
  display: flex;
  align-items: baseline;
  gap: 8px;
  color: rgba(255, 241, 230, 0.86);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.case_num span:first-child {
  font-size: 18px;
  color: #ffffff;
}

.case_tit {
  width: calc(100% - 56px);
  margin: 0 28px 14px;
  padding: 0;
  background: transparent;
  color: rgba(255, 232, 215, 0.84);
  text-align: left;
  font-size: 13px;
  line-height: 1.3;
  transition: color 0.3s ease, transform 0.3s ease;
}

.case_tit:hover,
.case_tit.is-current {
  color: #ffffff;
  transform: translateX(4px);
}

.case_btn {
  height: 80px;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 0 28px;
  background: rgba(104, 4, 14, 0.28);
}

.case_btn button {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #f4efe7;
}

.case_nr {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0 12px 12px 0;
  background: #d7000f;
  color: #ffffff;
  box-shadow: 12px 18px 30px rgba(156, 7, 22, 0.28);
}

.case-sidebar-expand-enter-active,
.case-sidebar-expand-leave-active {
  overflow: hidden;
  transition: max-height 0.28s ease, opacity 0.28s ease;
}

.case-sidebar-expand-enter-from,
.case-sidebar-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.case-sidebar-expand-enter-to,
.case-sidebar-expand-leave-from {
  max-height: 960px;
  opacity: 1;
}

@media (max-width: 768px) {
  .case_nav {
    transform: translateX(calc(-1 * 100vw + 40px));
  }

  .case_nl {
    width: calc(100vw - 40px);
  }
}
</style>
