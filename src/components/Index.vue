<template>
  <div class="index-container">
    <header class="header">
      <div class="header-left">
        <h1 class="app-title">Fakturex</h1>
        <nav class="main-nav">
          <button v-if="canAccess('manageDocuments')" @click="goToInvoiceList" class="nav-btn">
            <i class="fa fa-list"></i> Rejestr
          </button>
          <button v-if="canAccess('manageContacts')" @click="goToContacts" class="nav-btn">
            <i class="fa fa-address-book"></i> Kontrahenci
          </button>
          <button v-if="canAccess('manageWarehouse')" @click="goToWarehouse" class="nav-btn">
            <i class="fa fa-cubes"></i> Magazyn
          </button>
          <button v-if="canAccess('managePayments')" @click="goToPayments" class="nav-btn">
            <i class="fa fa-credit-card"></i> Płatności
          </button>
          <button v-if="canAccess('manageReports')" @click="goToReports" class="nav-btn">
            <i class="fa fa-chart-line"></i> Raporty
          </button>
          <button v-if="canAccess('manageSettings')" @click="goToSettings" class="nav-btn">
            <i class="fa fa-cogs"></i> Ustawienia
          </button>
        </nav>
      </div>

      <div class="user-area" v-if="user">
        <div class="user-info">
          <span class="user-name">{{ user.name }}</span>
          <span class="user-role">{{ roleLabels[user.role] }}</span>
        </div>
        <button class="logout-btn" @click="handleLogout">
          <i class="fa fa-sign-out-alt"></i>
        </button>
      </div>
    </header>

    <main class="dashboard-content" v-if="user">
      <div class="welcome-banner">
        <h2>Dzień dobry, {{ user.name.split(' ')[0] }}! 👋</h2>
        <p>Oto podsumowanie Twojej firmy.</p>
      </div>

      <div class="section-title">Statystyki miesiąca</div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon income"><i class="fa fa-wallet"></i></div>
          <div class="stat-info">
            <span class="stat-label">Przychód</span>
            <span class="stat-value">-- PLN</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon invoice"><i class="fa fa-file-invoice"></i></div>
          <div class="stat-info">
            <span class="stat-label">Wystawione faktury</span>
            <span class="stat-value">--</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon client"><i class="fa fa-users"></i></div>
          <div class="stat-info">
            <span class="stat-label">Nowi klienci</span>
            <span class="stat-value">--</span>
          </div>
        </div>
      </div>

      <div class="section-title">Szybkie akcje</div>
      <div class="actions-grid">
        <div class="action-card primary" @click="goToInvoiceForm" v-if="canAccess('createDocuments')">
          <i class="fa fa-plus-circle"></i>
          <span>Nowa Faktura</span>
        </div>
        <div class="action-card secondary" @click="goToContacts" v-if="canAccess('manageContacts')">
          <i class="fa fa-user-plus"></i>
          <span>Dodaj Klienta</span>
        </div>
        <div class="action-card tertiary" @click="goToWarehouse" v-if="canAccess('manageWarehouse')">
          <i class="fa fa-box-open"></i>
          <span>Stan Magazynowy</span>
        </div>
         <div class="action-card" @click="goToReports" v-if="canAccess('manageReports')">
          <i class="fa fa-chart-pie"></i>
          <span>Zobacz Raporty</span>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getSession, logout } from '@/services/auth'
import { can, getPermissionsMatrix } from '@/services/permissions'

const router = useRouter()
const user = ref(getSession()?.user ?? null)
const permissionMatrix = ref(getPermissionsMatrix())

const roleLabels = {
  OWNER: 'Właściciel',
  ACCOUNTANT: 'Księgowość',
  VIEWER: 'Podgląd'
}

const refreshPermissions = () => {
  permissionMatrix.value = getPermissionsMatrix()
}

const canAccess = (permissionKey) => {
  return can(permissionKey, user.value?.role, permissionMatrix.value)
}

const goToSettings = () => {
  router.push({ name: 'settings' })
}

const goToInvoiceList = () => {
  router.push({ name: 'invoice-list' })
}

const goToInvoiceForm = () => {
  router.push({ name: 'invoice-form' })
}

const goToContacts = () => {
  router.push({ name: 'contacts' })
}

const goToWarehouse = () => {
  router.push({ name: 'warehouse' })
}

const goToPayments = () => {
  router.push({ name: 'payments' })
}

const goToReports = () => {
  router.push({ name: 'reports' })
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

<style src="./Index.css"></style>
