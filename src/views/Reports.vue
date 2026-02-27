<template>
  <div class="page-content">
    <div class="actions-bar">
      <div>
        <!-- Title area if needed, but TopBar handles it -->
      </div>

      <div class="action-buttons">
        <button class="btn btn-secondary" @click="refresh">
          <i class="fa fa-refresh"></i> Odśwież
        </button>
        <button class="btn btn-primary" @click="exportDocuments">
          <i class="fa fa-download"></i> Eksport CSV
        </button>
      </div>
    </div>

    <!-- Filters Card -->
    <div class="card mb-lg">
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Od daty</label>
          <input v-model="range.from" type="date" class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">Do daty</label>
          <input v-model="range.to" type="date" class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">Typ dokumentu</label>
          <select v-model="filterType" class="form-control">
            <option value="all">Wszystkie</option>
            <option v-for="type in salesTypes" :key="type" :value="type">
              {{ typeLabels[type] }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Waluta</label>
          <select v-model="filterCurrency" class="form-control">
            <option value="all">Wszystkie</option>
            <option v-for="currency in currencies" :key="currency" :value="currency">
              {{ currency }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Summary Grid -->
    <div class="summary-grid mb-lg">
      <div class="stat-card">
        <div class="stat-icon revenue-bg">
          <i class="fa fa-money"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Suma Netto</span>
          <span class="stat-value">{{ formatCurrency(totals.netto, activeCurrency) }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon vat-bg">
          <i class="fa fa-percent"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Suma VAT</span>
          <span class="stat-value">{{ formatCurrency(totals.vat, activeCurrency) }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon total-bg">
          <i class="fa fa-balance-scale"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Suma Brutto</span>
          <span class="stat-value">{{ formatCurrency(totals.brutto, activeCurrency) }}</span>
        </div>
      </div>
    </div>

    <!-- Documents Table -->
    <div class="card table-card">
      <div class="table-responsive">
        <table v-if="filteredDocuments.length" class="table">
          <thead>
            <tr>
              <th>Numer</th>
              <th>Typ</th>
              <th>Kontrahent</th>
              <th>Data</th>
              <th class="text-right">Netto</th>
              <th class="text-right">VAT</th>
              <th class="text-right">Brutto</th>
              <th>Waluta</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doc in filteredDocuments" :key="doc.id">
              <td class="font-medium">{{ doc.number }}</td>
              <td>
                <span class="badge badge-secondary">{{ typeLabels[doc.type] }}</span>
              </td>
              <td>{{ doc.counterparty?.name || '-' }}</td>
              <td>{{ formatDate(doc.document?.issueDate) }}</td>
              <td class="text-right">{{ formatNumber(doc.totals?.netto) }}</td>
              <td class="text-right">{{ formatNumber(doc.totals?.vat) }}</td>
              <td class="text-right font-bold">{{ formatNumber(doc.totals?.brutto) }}</td>
              <td>{{ doc.currency }}</td>
            </tr>
          </tbody>
        </table>

        <div v-else class="empty-state">
          <div class="empty-icon">
            <i class="fa fa-bar-chart"></i>
          </div>
          <h3>Brak danych</h3>
          <p>Brak dokumentów sprzedaży w wybranym okresie.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getDocuments } from '@/services/documents'
import { getSettings } from '@/services/settings'
import { exportCsv } from '@/utils/csv'

const router = useRouter()
const settings = ref(getSettings())
const documents = ref([])

const typeLabels = {
  invoice: 'Faktura VAT',
  proforma: 'Proforma',
  advance: 'Zaliczkowa',
  final: 'Końcowa',
  correction: 'Korekta',
  receipt: 'Paragon'
}

const salesTypes = ['invoice', 'proforma', 'advance', 'final', 'correction', 'receipt']
const currencies = computed(() => settings.value.tax.enabledCurrencies)

const filterType = ref('all')
const filterCurrency = ref('all')

const range = ref({
  from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10),
  to: new Date().toISOString().substring(0, 10)
})

const normalize = (date) => (date ? new Date(date).toISOString().substring(0, 10) : '')

const inRange = (date) => {
  if (!date) return false
  const current = normalize(date)
  if (range.value.from && current < range.value.from) return false
  if (range.value.to && current > range.value.to) return false
  return true
}

const filteredDocuments = computed(() => {
  return documents.value
    .filter((doc) => salesTypes.includes(doc.type))
    .filter((doc) => inRange(doc.document?.issueDate))
    .filter((doc) => (filterType.value === 'all' ? true : doc.type === filterType.value))
    .filter((doc) => (filterCurrency.value === 'all' ? true : doc.currency === filterCurrency.value))
})

const getTotals = (doc) => {
  const totals = doc.totals || {}
  return {
    netto: Number(totals.netto || 0),
    vat: Number(totals.vat || 0),
    brutto: Number(totals.brutto || 0)
  }
}

const totals = computed(() => {
  const sums = filteredDocuments.value.reduce(
    (acc, doc) => {
      const t = getTotals(doc)
      acc.netto += t.netto
      acc.vat += t.vat
      acc.brutto += t.brutto
      return acc
    },
    { netto: 0, vat: 0, brutto: 0 }
  )

  return {
    netto: sums.netto,
    vat: sums.vat,
    brutto: sums.brutto
  }
})

const activeCurrency = computed(() => (filterCurrency.value === 'all' ? settings.value.tax.defaultCurrency : filterCurrency.value))

const exportDocuments = () => {
  const rows = [
    ['Numer', 'Typ', 'Kontrahent', 'Data', 'Netto', 'VAT', 'Brutto', 'Waluta']
  ]

  filteredDocuments.value.forEach((doc) => {
    const t = getTotals(doc)
    rows.push([
      doc.number,
      typeLabels[doc.type] || doc.type,
      doc.counterparty?.name || '-',
      formatDate(doc.document?.issueDate),
      t.netto.toFixed(2),
      t.vat.toFixed(2),
      t.brutto.toFixed(2),
      doc.currency
    ])
  })

  exportCsv(rows, 'raport-dokumenty.csv')
}

const formatDate = (value) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (parsed.toString() === 'Invalid Date') return '-'
  return parsed.toLocaleDateString('pl-PL')
}

const formatNumber = (val) => {
  return Number(val || 0).toFixed(2)
}

const formatCurrency = (val, currency) => {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: currency || 'PLN' }).format(val || 0)
}

const refresh = () => {
  documents.value = getDocuments()
}

onMounted(refresh)
</script>

<style scoped>
.page-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--spacing-lg);
}

.stat-card {
  background: var(--app-surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  border: 1px solid var(--app-border);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xl);
}

.revenue-bg { background: var(--info-light); color: var(--info); }
.vat-bg { background: var(--warning-light); color: var(--warning); }
.total-bg { background: var(--success-light); color: var(--success); }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--secondary-500);
  font-weight: var(--font-medium);
}

.stat-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--secondary-900);
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.empty-state {
  padding: var(--spacing-3xl);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.empty-icon {
  font-size: 3rem;
  color: var(--secondary-300);
  margin-bottom: var(--spacing-sm);
}

.mb-lg {
  margin-bottom: var(--spacing-lg);
}

@media (max-width: 768px) {
  .actions-bar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
