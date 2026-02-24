<template>
  <div class="dashboard-layout">
    <!-- Mobile Overlay -->
    <div class="mobile-overlay" v-if="isMobileMenuOpen" @click="isMobileMenuOpen = false"></div>

    <!-- Sidebar -->
    <Sidebar
      :is-collapsed="isSidebarCollapsed"
      :is-mobile-open="isMobileMenuOpen"
      @toggle-collapse="toggleSidebar"
    />

    <!-- Main Content Area -->
    <main class="main-area">
      <TopBar
        @toggle-sidebar="toggleSidebar"
        :title="pageTitle"
      />

      <div class="dashboard-content">
        <slot></slot>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './Sidebar.vue'
import TopBar from './TopBar.vue'

const route = useRoute()
const isSidebarCollapsed = ref(false)
const isMobileMenuOpen = ref(false)

const pageTitle = computed(() => {
  // Map route names to readable titles
  const titles = {
    'home': 'Pulpit',
    'invoice-list': 'Rejestr dokumentów',
    'contacts': 'Kontrahenci',
    'warehouse': 'Magazyn',
    'payments': 'Płatności',
    'reports': 'Raporty',
    'sales-orders': 'Zamówienia sprzedaży',
    'purchase-orders': 'Zamówienia zakupu',
    'picking': 'Kompletacja (Picking)',
    'returns': 'Zwroty',
    'price-lists': 'Cenniki',
    'settings': 'Ustawienia',
    'invoice-form': 'Edycja dokumentu',
    'InvoicePreview': 'Podgląd dokumentu'
  }
  return titles[route.name] || 'Fakturex'
})

const toggleSidebar = () => {
  if (window.innerWidth <= 768) {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
  } else {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
  }
}
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: var(--app-bg);
  overflow: hidden;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  width: 100%;
}

.dashboard-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 15;
}

@media (max-width: 768px) {
  .dashboard-content {
    padding: var(--spacing-md);
  }
}
</style>
