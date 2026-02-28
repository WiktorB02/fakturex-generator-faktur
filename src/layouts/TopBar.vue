<template>
  <header class="top-bar glass-panel">
    <div class="top-bar-left">
      <button class="mobile-menu-btn" @click="toggleSidebar">
        <i class="fa fa-bars"></i>
      </button>
      <div>
        <h1 class="page-title">{{ title }}</h1>
        <p class="current-date">{{ currentDate }}</p>
      </div>
    </div>
    <div class="top-bar-right">
      <div class="search-bar">
        <i class="fa fa-search"></i>
        <input v-model.trim="searchTerm" type="text" placeholder="Szukaj dokumentu lub kontrahenta..." @keydown.enter.prevent="runSearch" />
      </div>

      <button class="icon-btn theme-toggle-btn" @click="toggleTheme" :title="isDark ? 'Przełącz na jasny' : 'Przełącz na ciemny'">
        <i :class="isDark ? 'fa fa-sun-o' : 'fa fa-moon-o'"></i>
      </button>

      <button class="icon-btn notification-btn" title="Powiadomienia" aria-label="Powiadomienia">
        <i class="fa fa-bell"></i>
        <span class="badge">!</span>
      </button>

      <div class="user-avatar" @click="goToSettings" title="Ustawienia">
        <i class="fa fa-user-circle-o"></i>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { themePreferences, toggleDarkMode } from '@/services/theme'

const props = defineProps({
  title: {
    type: String,
    default: 'Pulpit'
  }
})

const emit = defineEmits(['toggle-sidebar'])
const router = useRouter()

const isDark = computed(() => themePreferences.value.isDarkMode)
const searchTerm = ref('')

const currentDate = computed(() => {
  return new Date().toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
})

const toggleSidebar = () => {
  emit('toggle-sidebar')
}

const toggleTheme = () => {
  toggleDarkMode()
}

const goToSettings = () => {
  router.push({ name: 'settings' })
}

const runSearch = () => {
  if (!searchTerm.value) return
  router.push({ name: 'invoice-list', query: { q: searchTerm.value } })
}
</script>

<style scoped>
.top-bar {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-xl);
  flex-shrink: 0;
  border-radius: var(--radius-lg);
  margin: var(--spacing-md) var(--spacing-lg) 0 var(--spacing-lg); /* floating effect */
  border: 1px solid var(--glass-border);
  z-index: 10;
  background: var(--app-overlay);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: var(--shadow-sm);
  transition: background-color var(--transition-normal);
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.page-title {
  font-size: var(--text-xl);
  margin: 0;
  color: var(--app-text);
  font-weight: var(--font-extrabold);
}

.current-date {
  font-size: var(--text-sm);
  color: var(--app-muted);
  margin: 0;
  font-weight: var(--font-medium);
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: var(--app-bg);
  padding: 8px 16px;
  border-radius: var(--radius-full);
  width: 260px;
  color: var(--app-muted);
  border: 1px solid var(--app-border);
  transition: border-color var(--transition-fast);
}

.search-bar:focus-within {
  border-color: var(--primary-400);
  background: var(--app-surface);
}

.search-bar input {
  border: none;
  background: transparent;
  outline: none;
  font-size: var(--text-sm);
  color: var(--app-text);
  width: 100%;
}

.icon-btn {
  position: relative;
  color: var(--app-muted);
  font-size: var(--text-lg);
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-bounce);
  background: transparent;
}

.icon-btn:hover {
  background: var(--app-bg);
  color: var(--primary-600);
  transform: translateY(-2px);
}

.icon-btn .badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--danger);
  color: white;
  font-size: 10px;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-bold);
  border: 2px solid var(--app-surface);
}

.user-avatar {
  font-size: 28px;
  color: var(--primary-600);
  cursor: pointer;
  transition: transform var(--transition-bounce);
}
.user-avatar:hover {
  transform: scale(1.1);
}

.mobile-menu-btn {
  display: none;
  font-size: var(--text-xl);
  color: var(--app-muted);
  margin-right: var(--spacing-sm);
  background: none;
  border: none;
}

@media (max-width: 1024px) {
  .top-bar {
    margin: 0;
    border-radius: 0;
    border-top: none;
    border-left: none;
    border-right: none;
    height: 64px;
    padding: 0 var(--spacing-lg);
  }
}

@media (max-width: 768px) {
  .top-bar {
    padding: 0 var(--spacing-md);
  }

  .mobile-menu-btn {
    display: block;
  }

  .search-bar {
    display: none; /* Hide search on mobile for space */
  }
}
</style>
