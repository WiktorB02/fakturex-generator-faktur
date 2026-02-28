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
        <button class="btn btn-secondary" @click="refresh">
          <i class="fa fa-refresh"></i> Odśwież
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
        :class="['tab-btn', filter === 'unpaid' && 'active']"
        @click="filter = 'unpaid'"
      >
        Nieopłacone
      </button>
      <button
        :class="['tab-btn', filter === 'overdue' && 'active']"
        @click="filter = 'overdue'"
      >
        Po terminie
      </button>
      <button
        :class="['tab-btn', filter === 'paid' && 'active']"
        @click="filter = 'paid'"
      >
        Opłacone
      </button>
    </div>

    <div class="card table-card">
      <div class="table-responsive">
        <table v-if="filteredDocuments.length" class="table">
          <thead>
            <tr>
              <th>Dokument</th>
              <th>Kontrahent</th>
              <th>Termin płatności</th>
              <th>Kwota</th>
              <th>Status</th>
              <th>Przypomnienie</th>
              <th class="text-right">Akcje</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doc in filteredDocuments" :key="doc.id">
              <td>
                <div class="doc-info">
                  <span class="font-medium">{{ doc.number }}</span>
                  <span class="text-muted text-xs">{{ typeLabels[doc.type] }}</span>
                </div>
              </td>
              <td>{{ doc.counterparty?.name || '-' }}</td>
              <td :class="{ 'text-danger': isOverdue(doc) && doc.document?.paymentStatus !== 'paid' }">
                {{ formatDate(doc.document?.dueDate) }}
                <span v-if="isOverdue(doc) && doc.document?.paymentStatus !== 'paid'" class="text-xs block">
                  (Po terminie)
                </span>
              </td>
              <td class="font-bold">{{ doc.totals?.brutto }} {{ doc.currency }}</td>
              <td>
                <span class="badge" :class="getStatusClass(doc)">
                  {{ getStatusLabel(doc) }}
                </span>
              </td>
              <td>
                <div class="reminder-inputs">
                  <input
                    type="date"
                    class="form-control form-control-sm"
                    :value="doc.document?.reminderDate || ''"
                    @change="(e) => updateReminder(doc, e.target.value)"
                    title="Data przypomnienia"
                  />
                  <input
                    type="text"
                    class="form-control form-control-sm"
                    placeholder="Notatka"
                    :value="doc.document?.reminderNote || ''"
                    @change="(e) => updateReminderNote(doc, e.target.value)"
                  />
                </div>
              </td>
              <td class="text-right actions-cell">
                <button
                  class="btn-icon status-toggle"
                  :class="{ 'is-completed': doc.document?.paymentStatus === 'paid' }"
                  @click="togglePaid(doc)"
                  :title="doc.document?.paymentStatus === 'paid' ? 'Oznacz jako nieopłacone' : 'Oznacz jako opłacone'"
                >
                  <i class="fa" :class="doc.document?.paymentStatus === 'paid' ? 'fa-toggle-on' : 'fa-toggle-off'"></i>
                </button>
                <button class="btn-icon" @click="openPreview(doc)" title="Podgląd">
                  <i class="fa fa-eye"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-else class="empty-state">
          <div class="empty-icon">
            <i class="fa fa-check-circle-o"></i>
          </div>
          <h3>Brak płatności</h3>
          <p>Brak dokumentów spełniających kryteria filtrowania.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getDocuments, updateDocument } from '@/services/documents'

const router = useRouter()
const documents = ref([])
const filter = ref('all')
const query = ref('')

const typeLabels = {
  invoice: 'Faktura VAT',
  proforma: 'Proforma',
  advance: 'Zaliczkowa',
  final: 'Końcowa',
  correction: 'Korekta'
}

const salesTypes = ['invoice', 'proforma', 'advance', 'final', 'correction']

const loadDocuments = () => {
  const allDocs = getDocuments() || []
  documents.value = allDocs.filter((doc) => salesTypes.includes(doc.type))
}

const refresh = () => {
  loadDocuments()
}

const today = () => new Date().toISOString().substring(0, 10)

const isOverdue = (doc) => {
  if (doc.document?.paymentStatus === 'paid') return false
  if (!doc.document?.dueDate) return false
  return doc.document.dueDate < today()
}

const filteredDocuments = computed(() => {
  let base = documents.value
  if (filter.value === 'paid') base = base.filter((doc) => doc.document?.paymentStatus === 'paid')
  if (filter.value === 'unpaid') base = base.filter((doc) => doc.document?.paymentStatus !== 'paid')
  if (filter.value === 'overdue') base = base.filter((doc) => isOverdue(doc))

  if (!query.value) return base
  const term = query.value.toLowerCase()
  return base.filter((doc) =>
    [doc.number, doc.counterparty?.name, doc.counterparty?.nip]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term))
  )
})

const getStatusClass = (doc) => {
  if (doc.document?.paymentStatus === 'paid') return 'badge-success'
  if (isOverdue(doc)) return 'badge-danger'
  return 'badge-warning'
}

const getStatusLabel = (doc) => {
  if (doc.document?.paymentStatus === 'paid') return 'Opłacona'
  if (isOverdue(doc)) return 'Po terminie'
  return 'Nieopłacona'
}

const togglePaid = (doc) => {
  const nextStatus = doc.document?.paymentStatus === 'paid' ? 'unpaid' : 'paid'
  const updatedDocs = updateDocument(doc.id, { document: { paymentStatus: nextStatus } })
  // We need to update local state to reflect changes immediately or reload
  // updateDocument returns all documents, so we can re-filter
  const updatedDoc = updatedDocs.find(d => d.id === doc.id)
  if (updatedDoc) {
      const index = documents.value.findIndex(d => d.id === doc.id)
      if (index !== -1) {
          documents.value[index] = updatedDoc
      }
  }
}

const updateReminder = (doc, value) => {
  updateDocument(doc.id, { document: { reminderDate: value } })
}

const updateReminderNote = (doc, value) => {
  updateDocument(doc.id, { document: { reminderNote: value } })
}

const openPreview = (doc) => {
  const data = encodeURIComponent(JSON.stringify(doc))
  router.push({ path: '/preview', query: { data } })
}

const formatDate = (value) => {
  if (!value) return '-'
  const parsed = new Date(value)
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
  padding: 0;
  overflow: hidden;
}

.doc-info {
  display: flex;
  flex-direction: column;
}

.text-danger {
  color: var(--danger);
}

.text-xs {
  font-size: var(--text-xs);
}

.block {
  display: block;
}

.reminder-inputs {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-control-sm {
  padding: 2px 6px;
  font-size: var(--text-xs);
  height: 28px;
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
  cursor: pointer;
}

.btn-icon:hover {
  background: var(--secondary-100);
  color: var(--primary-600);
}

.btn-icon.status-toggle {
  color: var(--warning);
  border-color: color-mix(in srgb, var(--warning) 28%, transparent);
  background: color-mix(in srgb, var(--warning-light) 70%, transparent);
}

.btn-icon.status-toggle:hover {
  background: color-mix(in srgb, var(--warning-light) 78%, var(--warning));
  color: #fff;
}

.btn-icon.status-toggle.is-completed {
  color: var(--success);
  border-color: color-mix(in srgb, var(--success) 30%, transparent);
  background: color-mix(in srgb, var(--success-light) 72%, transparent);
}

.btn-icon.status-toggle.is-completed:hover {
  background: color-mix(in srgb, var(--success-light) 75%, var(--success));
  color: #fff;
}

.btn-icon.warning {
  color: var(--warning);
  background: var(--warning-light);
  border-color: color-mix(in srgb, var(--warning) 30%, transparent);
}
.btn-icon.warning:hover {
  background: color-mix(in srgb, var(--warning-light) 75%, var(--warning));
  color: #fff;
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
    padding-bottom: 8px;
  }
}
</style>
