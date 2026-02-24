<template>
  <div class="page-content">
    <div class="actions-bar">
      <div>
        <!-- Title handled by TopBar -->
      </div>

      <div class="action-buttons">
        <button class="btn btn-primary" @click="toggleForm">
          <i class="fa fa-plus"></i> Nowy zwrot
        </button>
      </div>
    </div>

    <!-- Return Form -->
    <div v-if="showForm" class="card form-card mb-lg">
      <div class="card-header">
        <h3>Nowy zwrot / reklamacja</h3>
        <button class="btn-icon" @click="toggleForm">
          <i class="fa fa-times"></i>
        </button>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Dokument źródłowy</label>
          <select v-model="form.documentId" class="form-control">
            <option value="">Wybierz dokument</option>
            <option v-for="doc in salesDocs" :key="doc.id" :value="doc.id">
              {{ doc.number }} ({{ doc.counterparty?.name || '-' }})
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Magazyn</label>
          <select v-model="form.warehouseId" class="form-control">
            <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
              {{ warehouse.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Produkt</label>
          <select v-model="form.itemId" class="form-control">
            <option value="">Wybierz produkt</option>
            <option v-for="item in inventory" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Ilość</label>
          <input v-model.number="form.quantity" type="number" min="1" class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">Przywrócić na magazyn?</label>
          <select v-model="form.returnToStock" class="form-control">
            <option :value="true">Tak</option>
            <option :value="false">Nie</option>
          </select>
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-ghost" @click="toggleForm">Anuluj</button>
        <button class="btn btn-primary" @click="saveReturn">
          <i class="fa fa-save"></i> Zapisz zwrot
        </button>
      </div>
    </div>

    <!-- Returns List -->
    <div class="card table-card">
      <div class="table-responsive">
        <table v-if="returnsList.length" class="table">
          <thead>
            <tr>
              <th>Dokument źródłowy</th>
              <th>Produkt</th>
              <th>Ilość</th>
              <th>Status</th>
              <th class="text-right">Akcje</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in returnsList" :key="entry.id">
              <td class="font-medium">{{ docNumber(entry.documentId) }}</td>
              <td>{{ itemName(entry.itemId) }}</td>
              <td>{{ entry.quantity }}</td>
              <td>
                <span class="badge" :class="entry.status === 'open' ? 'badge-warning' : 'badge-secondary'">
                  {{ entry.status === 'open' ? 'Otwarte' : 'Zamknięte' }}
                </span>
              </td>
              <td class="text-right actions-cell">
                <button class="btn btn-sm btn-secondary mr-sm" @click="closeReturn(entry)" v-if="entry.status === 'open'">
                  Zamknij
                </button>
                <button class="btn-icon danger" @click="deleteReturn(entry.id)">
                  <i class="fa fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <div class="empty-icon"><i class="fa fa-rotate-left"></i></div>
          <h3>Brak zwrotów</h3>
          <p>Dodaj pierwszy zwrot lub reklamację.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { addReturn, getReturns, removeReturn, updateReturn } from '@/services/returns'
import { getDocuments, addDocument, commitNumber } from '@/services/documents'
import { getInventory, adjustInventoryStock } from '@/services/inventory'
import { getWarehouses } from '@/services/warehouses'
import { getSettings } from '@/services/settings'

const router = useRouter()
const settings = getSettings()

const returnsList = ref([])
const salesDocs = ref([])
const inventory = ref([])
const warehouses = ref([])
const showForm = ref(false)

const form = ref({
  documentId: '',
  warehouseId: '',
  itemId: '',
  quantity: 1,
  returnToStock: true
})

const loadData = () => {
  returnsList.value = getReturns()
  salesDocs.value = getDocuments().filter((doc) => ['invoice', 'final', 'receipt'].includes(doc.type))
  inventory.value = getInventory()
  warehouses.value = getWarehouses()
  if (!form.value.warehouseId && warehouses.value.length) {
    form.value.warehouseId = warehouses.value[0].id
  }
}

const toggleForm = () => {
  showForm.value = !showForm.value
}

const saveReturn = () => {
  if (!form.value.itemId || !form.value.quantity) {
    alert('Wybierz produkt i ilość.')
    return
  }

  returnsList.value = addReturn({ ...form.value })

  const rmaNumber = commitNumber('rma', new Date(), settings)
  addDocument({
    id: crypto.randomUUID(),
    type: 'rma',
    number: rmaNumber,
    issuer: {
      name: settings.company.name,
      nip: settings.company.nip,
      address: settings.company.address
    },
    counterparty: { name: 'Zwrot' },
    document: {
      type: 'rma',
      number: rmaNumber,
      issueDate: new Date().toISOString().substring(0, 10),
      saleDate: new Date().toISOString().substring(0, 10)
    },
    items: [],
    currency: settings.tax.defaultCurrency,
    totals: { netto: '0.00', vat: '0.00', brutto: '0.00' }
  })

  if (form.value.returnToStock) {
    adjustInventoryStock(form.value.itemId, Number(form.value.quantity))
    const number = commitNumber('pz', new Date(), settings)
    addDocument({
      id: crypto.randomUUID(),
      type: 'pz',
      number,
      issuer: {
        name: settings.company.name,
        nip: settings.company.nip,
        address: settings.company.address
      },
      counterparty: { name: 'Zwrot' },
      document: {
        type: 'pz',
        number,
        issueDate: new Date().toISOString().substring(0, 10),
        saleDate: new Date().toISOString().substring(0, 10)
      },
      items: [],
      currency: settings.tax.defaultCurrency,
      totals: { netto: '0.00', vat: '0.00', brutto: '0.00' }
    })
  }

  form.value = {
    documentId: '',
    warehouseId: warehouses.value[0]?.id || '',
    itemId: '',
    quantity: 1,
    returnToStock: true
  }
  showForm.value = false
}

const closeReturn = (entry) => {
  returnsList.value = updateReturn(entry.id, { status: 'closed' })
}

const deleteReturn = (id) => {
  if (confirm('Czy na pewno usunąć ten zwrot?')) {
    returnsList.value = removeReturn(id)
  }
}

const docNumber = (id) => salesDocs.value.find((doc) => doc.id === id)?.number || '-'
const itemName = (id) => inventory.value.find((item) => item.id === id)?.name || '-'

onMounted(loadData)
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
}

.action-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

.form-card {
  animation: slideDown 0.3s ease;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--app-border);
  padding-bottom: var(--spacing-md);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--app-border);
}

.table-card {
  padding: 0;
  overflow: hidden;
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

.btn-icon.danger:hover {
  background: var(--danger-light);
  color: var(--danger);
}

.mr-sm {
  margin-right: var(--spacing-sm);
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

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
