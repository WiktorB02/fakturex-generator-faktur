<template>
  <div class="dashboard-home">
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
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getSession } from '@/services/auth'
import { can, getPermissionsMatrix } from '@/services/permissions'
import { getDocuments } from '@/services/documents'
import { getContacts } from '@/services/contacts'

const router = useRouter()
const user = ref(getSession()?.user ?? null)
const permissionMatrix = ref(getPermissionsMatrix())

const documents = ref([])
const contacts = ref([])

// Computed Props
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

<style src="@/assets/css/dashboard.css"></style>
