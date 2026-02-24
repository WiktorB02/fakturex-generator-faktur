<template>
  <div class="page-content">
    <div class="actions-bar">
      <div class="search-wrapper">
        <i class="fa fa-search search-icon"></i>
        <input
          v-model.trim="query"
          placeholder="Szukaj po numerze lub kontrahencie..."
          class="form-control with-icon"
        />
      </div>

      <div class="action-buttons">
        <button class="btn btn-primary" @click="router.push({ name: 'invoice-form' })">
          <i class="fa fa-plus"></i> Nowy dokument
        </button>
        <button class="btn btn-danger" @click="deleteAll" v-if="documents.length > 0">
          <i class="fa fa-trash"></i> Usuń wszystkie
        </button>
      </div>
    </div>

    <div class="filter-tabs">
      <button
        :class="['tab-btn', filter === 'all' && 'active']"
        @click="filter = 'all'"
      >
        Wszystkie
      </button>
      <button
        :class="['tab-btn', filter === 'sales' && 'active']"
        @click="filter = 'sales'"
      >
        Sprzedaż
      </button>
      <button
        :class="['tab-btn', filter === 'warehouse' && 'active']"
        @click="filter = 'warehouse'"
      >
        Magazyn
      </button>
      <button
        :class="['tab-btn', filter === 'expense' && 'active']"
        @click="filter = 'expense'"
      >
        Wydatki
      </button>
    </div>

    <div class="card table-card">
      <div class="table-responsive">
        <table v-if="filteredDocuments.length" class="table">
          <thead>
            <tr>
              <th>Typ</th>
              <th>Numer</th>
              <th>Kontrahent</th>
              <th>Data wystawienia</th>
              <th>Termin płatności</th>
              <th>Wartość brutto</th>
              <th>Status</th>
              <th class="text-right">Akcje</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doc in filteredDocuments" :key="doc.id">
              <td>
                <span class="type-badge">{{ getShortType(doc.type) }}</span>
              </td>
              <td class="font-medium">{{ doc.number }}</td>
              <td>
                <div class="client-info">
                  <span class="client-name">{{ doc.counterparty?.name || '-' }}</span>
                  <span class="client-nip" v-if="doc.counterparty?.nip">{{ doc.counterparty.nip }}</span>
                </div>
              </td>
              <td>{{ formatDate(doc.document?.issueDate) }}</td>
              <td>{{ formatDate(doc.document?.dueDate) }}</td>
              <td class="font-bold">{{ doc.totals?.brutto }} {{ doc.currency }}</td>
              <td>
                <span class="badge" :class="getStatusClass(doc)">
                  {{ getStatusLabel(doc) }}
                </span>
              </td>
              <td class="text-right actions-cell">
                <button class="btn-icon" @click="viewDocument(doc)" title="Podgląd">
                  <i class="fa fa-eye"></i>
                </button>
                <button class="btn-icon danger" @click="deleteDocument(doc.id)" title="Usuń">
                  <i class="fa fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-else class="empty-state">
          <div class="empty-icon">
            <i class="fa fa-folder-open-o"></i>
          </div>
          <h3>Brak dokumentów</h3>
          <p>Nie znaleziono dokumentów spełniających kryteria wyszukiwania.</p>
          <button class="btn btn-primary" @click="router.push({ name: 'invoice-form' })">
            Dodaj pierwszy dokument
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { clearDocuments, getDocuments, removeDocument } from '@/services/documents'

const router = useRouter()
const documents = ref([])
const filter = ref('all')
const query = ref('')

const typeLabels = {
  invoice: 'Faktura',
  proforma: 'Proforma',
  advance: 'Zaliczka',
  final: 'Końcowa',
  correction: 'Korekta',
  receipt: 'Paragon',
  pz: 'PZ',
  wz: 'WZ',
  rw: 'RW',
  mm: 'MM',
  inw: 'Inwentaryzacja',
  so: 'Zam. Sprzedaży',
  po: 'Zam. Zakupu',
  rma: 'Zwrot',
  expense: 'Wydatek'
}

const getShortType = (type) => typeLabels[type] || type.toUpperCase()

const salesTypes = ['invoice', 'proforma', 'advance', 'final', 'correction', 'receipt']

const filteredDocuments = computed(() => {
  let base = documents.value
  if (filter.value === 'sales') base = base.filter((doc) => salesTypes.includes(doc.type))
  if (filter.value === 'warehouse') base = base.filter((doc) => ['pz', 'wz', 'rw', 'mm', 'inw'].includes(doc.type))
  if (filter.value === 'expense') base = base.filter((doc) => doc.type === 'expense')

  if (!query.value) return base
  const term = query.value.toLowerCase()
  return base.filter((doc) =>
    [doc.number, doc.counterparty?.name, doc.counterparty?.nip]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term))
  )
})

const today = () => new Date().toISOString().substring(0, 10)

const isOverdue = (doc) => {
  if (doc.document?.paymentStatus === 'paid') return false
  if (!doc.document?.dueDate) return false
  return doc.document.dueDate < today()
}

const getStatusClass = (doc) => {
  if (doc.document?.paymentStatus === 'paid') return 'badge-success'
  if (isOverdue(doc)) return 'badge-danger'
  return 'badge-warning'
}

const getStatusLabel = (doc) => {
  if (doc.document?.paymentStatus === 'paid') return 'Opłacona'
  if (isOverdue(doc)) return 'Po terminie'
  return 'Oczekuje'
}

const loadDocuments = () => {
  documents.value = getDocuments()
}

const deleteDocument = (id) => {
  if (confirm('Czy na pewno chcesz usunąć ten dokument?')) {
    documents.value = removeDocument(id)
  }
}

const deleteAll = () => {
  if (confirm('Czy na pewno chcesz usunąć WSZYSTKIE dokumenty? Operacji nie można cofnąć.')) {
    documents.value = []
    clearDocuments()
  }
}

const viewDocument = (doc) => {
  const data = encodeURIComponent(JSON.stringify(doc))
  router.push({ path: '/preview', query: { data } })
}

const formatDate = (date) => {
  if (!date) return '-'
  const parsed = new Date(date)
  if (parsed.toString() === 'Invalid Date') return '-'
  return parsed.toLocaleDateString('pl-PL')
}

onMounted(loadDocuments)
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

.search-wrapper {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--secondary-400);
}

.with-icon {
  padding-left: 36px;
}

.action-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

.filter-tabs {
  display: flex;
  gap: var(--spacing-xs);
  border-bottom: 1px solid var(--app-border);
  padding-bottom: 1px;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--secondary-500);
  font-weight: var(--font-medium);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  color: var(--primary-600);
}

.tab-btn.active {
  color: var(--primary-600);
  border-bottom-color: var(--primary-600);
}

.table-card {
  padding: 0; /* Remove padding for edge-to-edge table */
  overflow: hidden;
}

.type-badge {
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: var(--secondary-600);
  background: var(--secondary-100);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.client-info {
  display: flex;
  flex-direction: column;
}

.client-name {
  font-weight: var(--font-medium);
  color: var(--secondary-900);
}

.client-nip {
  font-size: var(--text-xs);
  color: var(--secondary-500);
}

.actions-cell {
  white-space: nowrap;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  background: transparent;
  color: var(--secondary-500);
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: var(--secondary-100);
  color: var(--primary-600);
}

.btn-icon.danger:hover {
  background: var(--danger-light);
  color: var(--danger);
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

.empty-state h3 {
  font-size: var(--text-xl);
  color: var(--secondary-900);
}

.empty-state p {
  color: var(--secondary-500);
  max-width: 400px;
}

@media (max-width: 768px) {
  .actions-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper {
    max-width: 100%;
  }

  .filter-tabs {
    overflow-x: auto;
    white-space: nowrap;
    padding-bottom: 8px; /* Scrollbar space */
  }
}
</style>
