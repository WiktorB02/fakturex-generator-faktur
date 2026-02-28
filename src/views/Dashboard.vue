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
        <div class="stat-icon revenue-bg" :class="{ skeleton: isLoading }">
          <i class="fa fa-wallet" v-if="!isLoading"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label" :class="{ 'skeleton skeleton-text short': isLoading }">Przychód całkowity</span>
          <span class="stat-value" :class="{ 'skeleton skeleton-text medium': isLoading }">
            <template v-if="!isLoading">{{ formatCurrency(totalRevenue) }}</template>
          </span>
        </div>
      </div>

      <div class="stat-card" v-if="canAccess('manageDocuments')">
        <div class="stat-icon pending-bg" :class="{ skeleton: isLoading }">
          <i class="fa fa-clock-o" v-if="!isLoading"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label" :class="{ 'skeleton skeleton-text short': isLoading }">Oczekujące płatności</span>
          <span class="stat-value" :class="{ 'skeleton skeleton-text medium': isLoading }">
            <template v-if="!isLoading">{{ pendingCount }}</template>
          </span>
        </div>
      </div>

      <div class="stat-card" v-if="canAccess('manageContacts')">
        <div class="stat-icon clients-bg" :class="{ skeleton: isLoading }">
          <i class="fa fa-users" v-if="!isLoading"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label" :class="{ 'skeleton skeleton-text short': isLoading }">Klienci</span>
          <span class="stat-value" :class="{ 'skeleton skeleton-text medium': isLoading }">
            <template v-if="!isLoading">{{ clientsCount }}</template>
          </span>
        </div>
      </div>

      <div class="stat-card">
          <div class="stat-icon docs-bg" :class="{ skeleton: isLoading }">
          <i class="fa fa-file-text-o" v-if="!isLoading"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label" :class="{ 'skeleton skeleton-text short': isLoading }">Dokumenty</span>
          <span class="stat-value" :class="{ 'skeleton skeleton-text medium': isLoading }">
            <template v-if="!isLoading">{{ totalDocuments }}</template>
          </span>
        </div>
      </div>
    </section>

    <div class="content-split">
      <!-- Recent Activity -->
      <section class="recent-activity card" v-if="canAccess('manageDocuments')">
        <div class="section-header">
          <h3 :class="{ 'skeleton skeleton-text medium': isLoading }">
            <template v-if="!isLoading">Ostatnie dokumenty</template>
          </h3>
          <button class="text-btn" @click="goToInvoiceList" v-if="!isLoading">Zobacz wszystkie</button>
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
              <template v-if="isLoading">
                <tr v-for="i in 5" :key="i">
                  <td><div class="skeleton skeleton-text short"></div></td>
                  <td><div class="skeleton skeleton-text medium"></div></td>
                  <td><div class="skeleton skeleton-text short"></div></td>
                  <td><div class="skeleton skeleton-text short"></div></td>
                </tr>
              </template>
              <template v-else>
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
              </template>
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
        <div class="promo-card card" :class="{ skeleton: isLoading }">
          <div class="promo-content" v-if="!isLoading">
            <h4>Wersja Pro</h4>
            <p>Zaktualizuj do wersji Pro, aby uzyskać dostęp do zaawansowanych raportów.</p>
            <button class="btn-sm btn-outline">Sprawdź ofertę</button>
          </div>
          <div class="promo-icon" v-if="!isLoading">
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
import { useToast } from '@/services/toast'
import { can, getPermissionsMatrix } from '@/services/permissions'
import { getDocuments } from '@/services/documents'
import { getContacts } from '@/services/contacts'

const router = useRouter()
const user = ref(getSession()?.user ?? null)
const permissionMatrix = ref(getPermissionsMatrix())

const documents = ref([])
const contacts = ref([])
const isLoading = ref(true)
const toast = useToast()

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
  setTimeout(() => {
    loadData()
    isLoading.value = false
  }, 800)
})

onBeforeUnmount(() => {
  window.removeEventListener('permissions-updated', refreshPermissions)
})
</script>

<style src="@/assets/css/dashboard.css"></style>
