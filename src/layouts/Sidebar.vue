<template>
  <aside class="sidebar" :class="{ 'sidebar-collapsed': isCollapsed, 'mobile-open': isMobileOpen }">
    <div class="sidebar-header">
      <div class="logo-container">
        <div class="logo-icon">F</div>
        <span class="logo-text" v-if="!isCollapsed">Fakturex</span>
      </div>
      <button class="collapse-btn" @click="toggleCollapse">
        <i class="fa fa-bars"></i>
      </button>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-group">
        <span class="nav-label" v-if="!isCollapsed">Menu</span>
        <router-link to="/" class="nav-item" active-class="active">
          <i class="fa fa-home"></i>
          <span v-if="!isCollapsed">Pulpit</span>
        </router-link>

        <template v-for="item in menuItems" :key="item.label">
          <button
            v-if="canAccess(item.permission)"
            @click="navigate(item)"
            class="nav-item"
            :class="{ active: isRouteActive(item.routeName) }"
          >
            <i :class="item.icon"></i>
            <span v-if="!isCollapsed">{{ item.label }}</span>
          </button>
        </template>
      </div>
    </nav>

    <div class="sidebar-footer">
      <div class="user-profile" v-if="user">
        <div class="avatar">{{ userInitials }}</div>
        <div class="user-details" v-if="!isCollapsed">
          <span class="user-name">{{ user.name }}</span>
          <span class="user-role">{{ roleLabels[user.role] }}</span>
        </div>
      </div>
      <button class="logout-btn" @click="handleLogout" title="Wyloguj">
        <i class="fa fa-sign-out"></i>
        <span v-if="!isCollapsed">Wyloguj</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getSession, logout } from '@/services/auth'
import { can, getPermissionsMatrix } from '@/services/permissions'

const props = defineProps({
  isCollapsed: Boolean,
  isMobileOpen: Boolean
})

const emit = defineEmits(['toggle-collapse', 'logout'])

const router = useRouter()
const route = useRoute()
const user = ref(getSession()?.user ?? null)
const permissionMatrix = ref(getPermissionsMatrix())

const roleLabels = {
  OWNER: 'Właściciel',
  ACCOUNTANT: 'Księgowość',
  VIEWER: 'Podgląd'
}

const menuItems = [
  { label: 'Rejestr dokumentów', icon: 'fa fa-list', permission: 'manageDocuments', routeName: 'invoice-list' },
  { label: 'Kontrahenci', icon: 'fa fa-address-book', permission: 'manageContacts', routeName: 'contacts' },
  { label: 'Magazyn', icon: 'fa fa-cubes', permission: 'manageWarehouse', routeName: 'warehouse' },
  { label: 'Płatności', icon: 'fa fa-credit-card', permission: 'managePayments', routeName: 'payments' },
  { label: 'Raporty', icon: 'fa fa-chart-line', permission: 'manageReports', routeName: 'reports' },
  { label: 'Zam. sprzedaży', icon: 'fa fa-shopping-cart', permission: 'manageSalesOrders', routeName: 'sales-orders' },
  { label: 'Zam. zakupu', icon: 'fa fa-truck', permission: 'managePurchaseOrders', routeName: 'purchase-orders' },
  { label: 'Picking', icon: 'fa fa-boxes', permission: 'managePicking', routeName: 'picking' },
  { label: 'Zwroty', icon: 'fa fa-rotate-left', permission: 'manageReturns', routeName: 'returns' },
  { label: 'Cenniki', icon: 'fa fa-tags', permission: 'managePriceLists', routeName: 'price-lists' },
  { label: 'Ustawienia', icon: 'fa fa-cogs', permission: 'manageSettings', routeName: 'settings' },
]

const userInitials = computed(() => {
  if (!user.value?.name) return 'U'
  return user.value.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
})

const refreshPermissions = () => {
  permissionMatrix.value = getPermissionsMatrix()
}

const canAccess = (permissionKey) => {
  return can(permissionKey, user.value?.role, permissionMatrix.value)
}

const navigate = (item) => {
  router.push({ name: item.routeName })
}

const isRouteActive = (routeName) => {
  return route.name === routeName
}

const toggleCollapse = () => {
  emit('toggle-collapse')
}

const handleLogout = () => {
  logout()
  router.push({ name: 'login' })
}

onMounted(() => {
  window.addEventListener('permissions-updated', refreshPermissions)
})

onBeforeUnmount(() => {
  window.removeEventListener('permissions-updated', refreshPermissions)
})
</script>

<style scoped>
/* Sidebar Styles - extracted from dashboard.css */
.sidebar {
  width: 260px;
  background-color: var(--app-surface);
  border-right: 1px solid var(--app-border);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-normal), transform var(--transition-normal);
  flex-shrink: 0;
  z-index: 20;
  height: 100vh;
}

.sidebar.sidebar-collapsed {
  width: 80px;
}

.sidebar-header {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  border-bottom: 1px solid var(--app-border);
}

.sidebar.sidebar-collapsed .sidebar-header {
  justify-content: center;
  padding: 0;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-extrabold);
  font-size: var(--text-xl);
  color: var(--app-text);
  letter-spacing: -0.02em;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
  color: white;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-lg);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.logo-text {
  transition: opacity var(--transition-fast);
}

.collapse-btn {
  color: var(--secondary-500);
  font-size: var(--text-lg);
}

.sidebar.sidebar-collapsed .logo-container {
  display: none;
}

.sidebar.sidebar-collapsed .collapse-btn {
  display: block;
  margin: 0 auto;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg) var(--spacing-md);
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.nav-label {
  font-size: var(--text-xs);
  text-transform: uppercase;
  color: var(--secondary-400);
  font-weight: var(--font-semibold);
  margin-bottom: var(--spacing-sm);
  padding-left: var(--spacing-sm);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  color: var(--secondary-600);
  text-decoration: none;
  font-weight: var(--font-medium);
  transition: all var(--transition-fast);
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.nav-item i {
  width: 20px;
  text-align: center;
  font-size: var(--text-lg);
}

.nav-item:hover {
  background-color: var(--secondary-50);
  color: var(--primary-600);
}

.nav-item.active {
  background-color: var(--primary-50);
  color: var(--primary-700);
}

.sidebar.sidebar-collapsed .nav-item {
  justify-content: center;
  padding: var(--spacing-md) 0;
}

.sidebar.sidebar-collapsed .nav-item span {
  display: none;
}

.sidebar-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--app-border);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: var(--secondary-200);
  color: var(--secondary-600);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-bold);
  font-size: var(--text-sm);
}

.user-details {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-name {
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: var(--secondary-900);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.user-role {
  font-size: var(--text-xs);
  color: var(--secondary-600);
  font-weight: var(--font-medium);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--danger);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  width: 100%;
  font-weight: var(--font-medium);
  transition: all var(--transition-fast);
}

.logout-btn:hover {
  background-color: var(--danger-light);
}

.sidebar.sidebar-collapsed .user-details,
.sidebar.sidebar-collapsed .logout-btn span {
  display: none;
}

.sidebar.sidebar-collapsed .user-profile {
  justify-content: center;
  padding: 0;
}

.sidebar.sidebar-collapsed .logout-btn {
  justify-content: center;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed; /* Fixed on mobile */
    top: 0;
    left: 0;
    transform: translateX(-100%);
    height: 100%;
  }

  .sidebar.mobile-open {
    transform: translateX(0);
    width: 260px;
    box-shadow: var(--shadow-xl);
  }
}
</style>
