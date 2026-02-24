<template>
  <div class="dashboard-layout">
    <!-- Mobile Overlay -->
    <div class="mobile-overlay" v-if="isMobileMenuOpen" @click="isMobileMenuOpen = false"></div>

    <!-- Sidebar Navigation -->
    <aside class="sidebar" :class="{ 'sidebar-collapsed': isSidebarCollapsed, 'mobile-open': isMobileMenuOpen }">
      <div class="sidebar-header">
        <div class="logo-container">
          <div class="logo-icon">F</div>
          <span class="logo-text" v-if="!isSidebarCollapsed">Fakturex</span>
        </div>
        <button class="collapse-btn" @click="toggleSidebar">
          <i class="fa fa-bars"></i>
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-group">
          <span class="nav-label" v-if="!isSidebarCollapsed">Menu</span>
          <router-link to="/" class="nav-item active">
            <i class="fa fa-home"></i>
            <span v-if="!isSidebarCollapsed">Pulpit</span>
          </router-link>

          <template v-for="item in menuItems" :key="item.label">
            <button
              v-if="canAccess(item.permission)"
              @click="item.action"
              class="nav-item"
            >
              <i :class="item.icon"></i>
              <span v-if="!isSidebarCollapsed">{{ item.label }}</span>
            </button>
          </template>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="user-profile" v-if="user">
          <div class="avatar">{{ userInitials }}</div>
          <div class="user-details" v-if="!isSidebarCollapsed">
            <span class="user-name">{{ user.name }}</span>
            <span class="user-role">{{ roleLabels[user.role] }}</span>
          </div>
        </div>
        <button class="logout-btn" @click="handleLogout" title="Wyloguj">
          <i class="fa fa-sign-out"></i>
          <span v-if="!isSidebarCollapsed">Wyloguj</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="main-area">
      <!-- Top Bar -->
      <header class="top-bar">
        <div class="top-bar-left">
          <button class="mobile-menu-btn" @click="toggleSidebar">
            <i class="fa fa-bars"></i>
          </button>
          <div>
            <h1 class="page-title">Pulpit</h1>
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

      <!-- Dashboard Content -->
      <div class="dashboard-content">
        <!-- Welcome Section -->
        <section class="welcome-section">
          <h2>Dzień dobry, {{ user?.name?.split(' ')[0] }}! 👋</h2>
          <p>Oto podsumowanie Twojej firmy na dzień dzisiejszy.</p>
        </section>

        <!-- Stats Grid -->
        <section class="stats-grid">
          <div class="stat-card" v-if="canAccess('manageReports')">
            <div class="stat-icon revenue-bg">
              <i class="fa fa-wallet"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Przychód całkowity</span>
              <span class="stat-value">{{ formatCurrency(totalRevenue) }}</span>
            </div>
          </div>

          <div class="stat-card" v-if="canAccess('manageDocuments')">
            <div class="stat-icon pending-bg">
              <i class="fa fa-clock-o"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Oczekujące płatności</span>
              <span class="stat-value">{{ pendingCount }}</span>
            </div>
          </div>

          <div class="stat-card" v-if="canAccess('manageContacts')">
            <div class="stat-icon clients-bg">
              <i class="fa fa-users"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Klienci</span>
              <span class="stat-value">{{ clientsCount }}</span>
            </div>
          </div>

          <div class="stat-card">
             <div class="stat-icon docs-bg">
              <i class="fa fa-file-text-o"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Dokumenty</span>
              <span class="stat-value">{{ totalDocuments }}</span>
            </div>
          </div>
        </section>

        <div class="content-split">
          <!-- Recent Activity -->
          <section class="recent-activity card" v-if="canAccess('manageDocuments')">
            <div class="section-header">
              <h3>Ostatnie dokumenty</h3>
              <button class="text-btn" @click="goToInvoiceList">Zobacz wszystkie</button>
            </div>

            <div class="table-container">
              <table class="recent-table">
                <thead>
                  <tr>
                    <th>Numer</th>
                    <th>Klient</th>
                    <th>Kwota</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="doc in recentDocuments" :key="doc.id">
                    <td class="font-medium">{{ doc.number }}</td>
                    <td>{{ doc.counterparty?.name || '-' }}</td>
                    <td>{{ doc.totals?.brutto }} {{ doc.currency }}</td>
                    <td>
                      <span class="status-badge" :class="getStatusClass(doc)">
                        {{ getStatusLabel(doc) }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="recentDocuments.length === 0">
                    <td colspan="4" class="text-center text-muted">Brak ostatnich dokumentów</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Quick Actions -->
          <section class="quick-actions-section">
            <div class="quick-actions-grid">
               <button v-if="canAccess('createDocuments')" @click="goToInvoiceForm" class="action-card primary-action">
                <i class="fa fa-plus-circle"></i>
                <span>Nowa Faktura</span>
              </button>

              <button v-if="canAccess('manageContacts')" @click="goToContacts" class="action-card">
                <i class="fa fa-user-plus"></i>
                <span>Dodaj Klienta</span>
              </button>

              <button v-if="canAccess('manageWarehouse')" @click="goToWarehouse" class="action-card">
                <i class="fa fa-cubes"></i>
                <span>Stan Magazynowy</span>
              </button>

              <button v-if="canAccess('manageSettings')" @click="goToSettings" class="action-card">
                <i class="fa fa-cogs"></i>
                <span>Ustawienia</span>
              </button>
            </div>

            <!-- System Status / Promo (Optional Placeholder) -->
            <div class="promo-card card">
              <div class="promo-content">
                <h4>Wersja Pro</h4>
                <p>Zaktualizuj do wersji Pro, aby uzyskać dostęp do zaawansowanych raportów.</p>
                <button class="btn-sm btn-outline">Sprawdź ofertę</button>
              </div>
              <div class="promo-icon">
                <i class="fa fa-rocket"></i>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getSession, logout } from '@/services/auth'
import { can, getPermissionsMatrix } from '@/services/permissions'
import { getDocuments } from '@/services/documents'
import { getContacts } from '@/services/contacts'

const router = useRouter()
const user = ref(getSession()?.user ?? null)
const permissionMatrix = ref(getPermissionsMatrix())
const isSidebarCollapsed = ref(false)
const isMobileMenuOpen = ref(false)

const documents = ref([])
const contacts = ref([])

const roleLabels = {
  OWNER: 'Właściciel',
  ACCOUNTANT: 'Księgowość',
  VIEWER: 'Podgląd'
}

// Navigation Items Configuration
const menuItems = [
  { label: 'Rejestr dokumentów', icon: 'fa fa-list', permission: 'manageDocuments', action: () => router.push({ name: 'invoice-list' }) },
  { label: 'Kontrahenci', icon: 'fa fa-address-book', permission: 'manageContacts', action: () => router.push({ name: 'contacts' }) },
  { label: 'Magazyn', icon: 'fa fa-cubes', permission: 'manageWarehouse', action: () => router.push({ name: 'warehouse' }) },
  { label: 'Płatności', icon: 'fa fa-credit-card', permission: 'managePayments', action: () => router.push({ name: 'payments' }) },
  { label: 'Raporty', icon: 'fa fa-chart-line', permission: 'manageReports', action: () => router.push({ name: 'reports' }) },
  { label: 'Zam. sprzedaży', icon: 'fa fa-shopping-cart', permission: 'manageSalesOrders', action: () => router.push({ name: 'sales-orders' }) },
  { label: 'Zam. zakupu', icon: 'fa fa-truck', permission: 'managePurchaseOrders', action: () => router.push({ name: 'purchase-orders' }) },
  { label: 'Picking', icon: 'fa fa-boxes', permission: 'managePicking', action: () => router.push({ name: 'picking' }) },
  { label: 'Zwroty', icon: 'fa fa-rotate-left', permission: 'manageReturns', action: () => router.push({ name: 'returns' }) },
  { label: 'Cenniki', icon: 'fa fa-tags', permission: 'managePriceLists', action: () => router.push({ name: 'price-lists' }) },
  { label: 'Ustawienia', icon: 'fa fa-cogs', permission: 'manageSettings', action: () => router.push({ name: 'settings' }) },
]

// Computed Props
const userInitials = computed(() => {
  if (!user.value?.name) return 'U'
  return user.value.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
})

const totalRevenue = computed(() => {
  return documents.value
    .filter(d => ['invoice', 'receipt'].includes(d.type)) // Only count actual sales
    .reduce((sum, doc) => {
      const val = parseFloat(doc.totals?.brutto || 0)
      return sum + (isNaN(val) ? 0 : val)
    }, 0)
})

const pendingCount = computed(() => {
  return documents.value.filter(doc => doc.document?.paymentStatus === 'unpaid').length
})

const clientsCount = computed(() => contacts.value.length)
const totalDocuments = computed(() => documents.value.length)

const recentDocuments = computed(() => {
  return documents.value.slice(0, 5)
})

// Methods
const refreshPermissions = () => {
  permissionMatrix.value = getPermissionsMatrix()
}

const canAccess = (permissionKey) => {
  return can(permissionKey, user.value?.role, permissionMatrix.value)
}

const toggleSidebar = () => {
  if (window.innerWidth <= 768) {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
  } else {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)
}

const getStatusClass = (doc) => {
  if (doc.document?.paymentStatus === 'paid') return 'status-paid'
  const dueDate = doc.document?.dueDate ? new Date(doc.document.dueDate) : null
  if (dueDate && dueDate < new Date()) return 'status-overdue'
  return 'status-unpaid'
}

const getStatusLabel = (doc) => {
  if (doc.document?.paymentStatus === 'paid') return 'Opłacona'
  const dueDate = doc.document?.dueDate ? new Date(doc.document.dueDate) : null
  if (dueDate && dueDate < new Date()) return 'Po terminie'
  return 'Oczekująca'
}

const goToInvoiceList = () => router.push({ name: 'invoice-list' })
const goToInvoiceForm = () => router.push({ name: 'invoice-form' })
const goToContacts = () => router.push({ name: 'contacts' })
const goToWarehouse = () => router.push({ name: 'warehouse' })
const goToSettings = () => router.push({ name: 'settings' })

const handleLogout = () => {
  logout()
  router.push({ name: 'login' })
}

const loadData = () => {
  documents.value = getDocuments()
  contacts.value = getContacts()
}

onMounted(() => {
  window.addEventListener('permissions-updated', refreshPermissions)
  loadData()
})

onBeforeUnmount(() => {
  window.removeEventListener('permissions-updated', refreshPermissions)
})
</script>

<style src="./Index.css"></style>
