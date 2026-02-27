<template>
  <header class="top-bar">
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
        <input type="text" placeholder="Szukaj..." />
      </div>
      <button class="icon-btn notification-btn">
        <i class="fa fa-bell"></i>
        <span class="badge">2</span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Pulpit'
  }
})

const emit = defineEmits(['toggle-sidebar'])

const currentDate = computed(() => {
  return new Date().toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
})

const toggleSidebar = () => {
  emit('toggle-sidebar')
}
</script>

<style scoped>
.top-bar {
  height: 64px;
  background: var(--app-surface);
  border-bottom: 1px solid var(--app-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-xl);
  flex-shrink: 0;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.page-title {
  font-size: var(--text-xl);
  margin: 0;
}

.current-date {
  font-size: var(--text-sm);
  color: var(--secondary-500);
  margin: 0;
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
  background: var(--secondary-50);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  width: 240px;
  color: var(--secondary-400);
}

.search-bar input {
  border: none;
  background: transparent;
  outline: none;
  font-size: var(--text-sm);
  color: var(--secondary-900);
  width: 100%;
}

.icon-btn {
  position: relative;
  color: var(--secondary-500);
  font-size: var(--text-lg);
}

.icon-btn .badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: var(--danger);
  color: white;
  font-size: 10px;
  width: 16px;
  height: 16px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-bold);
}

.mobile-menu-btn {
  display: none;
  font-size: var(--text-xl);
  color: var(--secondary-600);
  margin-right: var(--spacing-md);
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
