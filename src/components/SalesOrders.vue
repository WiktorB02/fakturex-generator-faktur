<template>
  <div class="page-content">
    <div class="actions-bar">
      <div>
        <!-- Title handled by TopBar -->
      </div>

      <div class="action-buttons">
        <button class="btn btn-primary" @click="openNewOrderForm">
          <i class="fa fa-plus"></i> Nowe zamówienie
        </button>
      </div>
    </div>

    <!-- Order Form -->
    <div v-if="showForm" class="card form-card mb-lg">
      <div class="card-header">
        <h3>{{ editingId ? 'Edytuj zamówienie' : 'Nowe zamówienie sprzedaży' }}</h3>
        <button class="btn-icon" @click="closeForm">
          <i class="fa fa-times"></i>
        </button>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Kontrahent</label>
          <select v-model="form.contactId" class="form-control">
            <option value="">Wybierz</option>
            <option v-for="contact in contacts" :key="contact.id" :value="contact.id">
              {{ contact.name }}
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
          <label class="form-label">Termin realizacji</label>
          <input v-model="form.dueDate" type="date" class="form-control" />
        </div>
      </div>

      <div class="items-section">
        <h4>Pozycje zamówienia</h4>
        <div class="items-form-row">
          <div class="form-group flex-grow">
            <label class="form-label">Produkt</label>
            <select v-model="itemForm.itemId" class="form-control">
              <option value="">Wybierz produkt</option>
              <option v-for="item in availableItems" :key="item.id" :value="item.id">
                {{ item.name }} ({{ item.stock }} {{ item.unit }})
              </option>
            </select>
          </div>
          <div class="form-group w-24">
            <label class="form-label">Ilość</label>
            <input v-model.number="itemForm.quantity" type="number" min="1" class="form-control" />
          </div>
          <div class="form-group flex-end">
            <button class="btn btn-secondary" @click="addItem">
              <i class="fa fa-plus"></i>
            </button>
          </div>
        </div>

        <div class="table-responsive mt-md" v-if="form.items.length">
          <table class="table">
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Ilość</th>
                <th class="text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in form.items" :key="index">
                <td>{{ itemName(item.itemId) }}</td>
                <td>{{ item.quantity }}</td>
                <td class="text-right">
                  <button class="btn-icon danger" @click="removeItem(index)">
                    <i class="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-items">
          Brak pozycji w zamówieniu
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-ghost" @click="closeForm">Anuluj</button>
        <button class="btn btn-primary" @click="saveOrder">
          <i class="fa fa-save"></i> Zapisz
        </button>
      </div>
    </div>

    <!-- Orders List -->
    <div class="card table-card">
      <div class="table-responsive">
        <table v-if="orders.length" class="table">
          <thead>
            <tr>
              <th>Kontrahent</th>
              <th>Magazyn</th>
              <th>Pozycji</th>
              <th>Termin</th>
              <th>Status</th>
              <th class="text-right">Akcje</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td>{{ contactName(order.contactId) }}</td>
              <td>{{ warehouseName(order.warehouseId) }}</td>
              <td>{{ order.items?.length || 0 }}</td>
              <td>{{ order.dueDate || '-' }}</td>
              <td>
                <span class="badge" :class="getStatusClass(order.status)">
                  {{ statusLabels[order.status] }}
                </span>
              </td>
              <td class="text-right actions-cell">
                <button class="btn btn-sm btn-secondary mr-sm" @click="createPicking(order)" v-if="order.status !== 'fulfilled'">
                  Picking
                </button>
                <button class="btn btn-sm btn-primary mr-sm" @click="fulfillOrder(order)" v-if="order.status !== 'fulfilled'">
                  Realizuj
                </button>
                <button class="btn-icon danger" @click="deleteOrder(order.id)">
                  <i class="fa fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <div class="empty-icon"><i class="fa fa-shopping-cart"></i></div>
          <h3>Brak zamówień</h3>
          <p>Dodaj pierwsze zamówienie sprzedaży.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { addSalesOrder, getSalesOrders, removeSalesOrder, updateSalesOrder } from '@/services/salesOrders'
import { getContacts } from '@/services/contacts'
import { getWarehouses } from '@/services/warehouses'
import { getInventory, adjustInventoryStock } from '@/services/inventory'
import { addDocument, commitNumber } from '@/services/documents'
import { getSettings } from '@/services/settings'
import { addPickingTask } from '@/services/picking'

const router = useRouter()
const settings = getSettings()

const orders = ref([])
const contacts = ref([])
const warehouses = ref([])
const inventory = ref([])
const showForm = ref(false)
const editingId = ref('')

const form = ref({
  contactId: '',
  warehouseId: '',
  dueDate: '',
  items: []
})

const itemForm = ref({
  itemId: '',
  quantity: 1
})

const statusLabels = {
  draft: 'Szkic',
  confirmed: 'Potwierdzone',
  fulfilled: 'Zrealizowane'
}

const availableItems = computed(() => {
  if (!form.value.warehouseId) return inventory.value
  return inventory.value.filter((item) => item.warehouseId === form.value.warehouseId)
})

const loadData = () => {
  orders.value = getSalesOrders()
  contacts.value = getContacts()
  warehouses.value = getWarehouses()
  inventory.value = getInventory()
  if (!form.value.warehouseId && warehouses.value.length) {
    form.value.warehouseId = warehouses.value[0].id
  }
}

const openNewOrderForm = () => {
  resetForm()
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  resetForm()
}

const addItem = () => {
  if (!itemForm.value.itemId || !itemForm.value.quantity) return
  form.value.items.push({ ...itemForm.value })
  itemForm.value = { itemId: '', quantity: 1 }
}

const removeItem = (index) => {
  form.value.items.splice(index, 1)
}

const saveOrder = () => {
  if (!form.value.contactId || !form.value.items.length) {
    alert('Wybierz kontrahenta i dodaj pozycje.')
    return
  }

  if (editingId.value) {
    orders.value = updateSalesOrder(editingId.value, { ...form.value })
  } else {
    orders.value = addSalesOrder({ ...form.value })
    const number = commitNumber('so', new Date(), settings)
    addDocument({
      id: crypto.randomUUID(),
      type: 'so',
      number,
      issuer: {
        name: settings.company.name,
        nip: settings.company.nip,
        address: settings.company.address
      },
      counterparty: contacts.value.find((entry) => entry.id === form.value.contactId) || { name: '—' },
      document: {
        type: 'so',
        number,
        issueDate: new Date().toISOString().substring(0, 10),
        saleDate: new Date().toISOString().substring(0, 10)
      },
      items: form.value.items,
      currency: settings.tax.defaultCurrency,
      totals: { netto: '0.00', vat: '0.00', brutto: '0.00' }
    })
  }
  closeForm()
}

const deleteOrder = (id) => {
  if (confirm('Czy na pewno usunąć zamówienie?')) {
    orders.value = removeSalesOrder(id)
  }
}

const fulfillOrder = (order) => {
  if (order.status === 'fulfilled') return
  order.items.forEach((item) => {
    adjustInventoryStock(item.itemId, -Number(item.quantity))
  })

  const number = commitNumber('wz', new Date(), settings)
  addDocument({
    id: crypto.randomUUID(),
    type: 'wz',
    number,
    issuer: {
      name: settings.company.name,
      nip: settings.company.nip,
      address: settings.company.address
    },
    counterparty: contacts.value.find((entry) => entry.id === order.contactId) || { name: '—' },
    document: {
      type: 'wz',
      number,
      issueDate: new Date().toISOString().substring(0, 10),
      saleDate: new Date().toISOString().substring(0, 10)
    },
    items: order.items.map((item) => {
      const entry = inventory.value.find((inv) => inv.id === item.itemId)
      return {
        description: entry?.name || 'Produkt',
        quantity: item.quantity,
        price: entry?.price || 0,
        vat: entry?.vat || '23'
      }
    }),
    currency: settings.tax.defaultCurrency,
    totals: { netto: '0.00', vat: '0.00', brutto: '0.00' }
  })

  orders.value = updateSalesOrder(order.id, { status: 'fulfilled' })
}

const createPicking = (order) => {
  addPickingTask({
    orderId: order.id,
    items: order.items,
    warehouseId: order.warehouseId,
    contactId: order.contactId
  })
  router.push({ name: 'picking' })
}

const itemName = (id) => inventory.value.find((item) => item.id === id)?.name || '-'
const contactName = (id) => contacts.value.find((contact) => contact.id === id)?.name || '-'
const warehouseName = (id) => warehouses.value.find((warehouse) => warehouse.id === id)?.name || '-'

const getStatusClass = (status) => {
  switch (status) {
    case 'fulfilled': return 'badge-success'
    case 'confirmed': return 'badge-info'
    default: return 'badge-secondary'
  }
}

const resetForm = () => {
  editingId.value = ''
  form.value = { contactId: '', warehouseId: warehouses.value[0]?.id || '', dueDate: '', items: [] }
  itemForm.value = { itemId: '', quantity: 1 }
}

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

.items-section {
  background: var(--secondary-50);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
}

.items-section h4 {
  margin-bottom: var(--spacing-md);
  font-size: var(--text-sm);
  color: var(--secondary-600);
  text-transform: uppercase;
}

.items-form-row {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-end;
}

.flex-grow {
  flex: 1;
}

.w-24 {
  width: 6rem;
}

.flex-end {
  display: flex;
  align-items: flex-end;
}

.mt-md {
  margin-top: var(--spacing-md);
}

.mr-sm {
  margin-right: var(--spacing-sm);
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

.empty-items {
  text-align: center;
  padding: var(--spacing-md);
  color: var(--secondary-500);
  font-style: italic;
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

@media (max-width: 768px) {
  .items-form-row {
    flex-direction: column;
    align-items: stretch;
  }

  .w-24 {
    width: 100%;
  }
}
</style>
