<template>
  <div class="page-content">
    <div class="actions-bar">
      <div class="tabs-wrapper">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-btn', currentTab === tab.id && 'active']"
          @click="currentTab = tab.id"
        >
          <i :class="tab.icon"></i> {{ tab.label }}
        </button>
      </div>

      <div class="action-buttons">
        <input ref="fileInput" type="file" accept=".csv" hidden @change="handleImport" />
        <button class="btn btn-secondary" @click="exportInventory">
          <i class="fa fa-download"></i> Eksport
        </button>
        <button class="btn btn-secondary" @click="triggerImport">
          <i class="fa fa-upload"></i> Import
        </button>
        <button v-if="currentTab === 'inventory'" class="btn btn-primary" @click="toggleItemForm">
          <i class="fa fa-plus"></i> Nowy towar
        </button>
      </div>
    </div>

    <!-- Tab Content: Inventory -->
    <div v-if="currentTab === 'inventory'" class="tab-content">
      <div v-if="showItemForm" class="card form-card mb-lg">
        <div class="card-header">
          <h3>{{ editingId ? 'Edytuj towar' : 'Nowy towar' }}</h3>
          <button class="btn-icon" @click="toggleItemForm">
            <i class="fa fa-times"></i>
          </button>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Nazwa *</label>
            <input v-model.trim="itemForm.name" type="text" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">SKU</label>
            <input v-model.trim="itemForm.sku" type="text" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Jednostka</label>
            <input v-model.trim="itemForm.unit" type="text" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Cena netto</label>
            <input v-model.number="itemForm.price" type="number" step="0.01" min="0" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">VAT</label>
            <select v-model="itemForm.vat" class="form-control">
              <option v-for="rate in vatRates" :key="rate" :value="rate">
                {{ rate === 'zw' ? 'zw' : rate + '%' }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Magazyn</label>
            <select v-model="itemForm.warehouseId" class="form-control">
              <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
                {{ warehouse.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Lokalizacja</label>
            <input v-model.trim="itemForm.location" type="text" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Stan początkowy</label>
            <input v-model.number="itemForm.stock" type="number" step="1" min="0" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Stan minimalny</label>
            <input v-model.number="itemForm.minStock" type="number" step="1" min="0" class="form-control" />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-ghost" @click="resetItemForm">Wyczyść</button>
          <button class="btn btn-primary" @click="saveItem">
            {{ editingId ? 'Zapisz' : 'Dodaj' }}
          </button>
        </div>
      </div>

      <div class="card table-card">
        <div class="table-header-filters">
          <div class="search-wrapper">
             <i class="fa fa-search search-icon"></i>
            <input v-model.trim="query" placeholder="Szukaj produktu..." class="form-control with-icon" />
          </div>
          <select v-model="warehouseFilter" class="form-control warehouse-select">
            <option value="">Wszystkie magazyny</option>
            <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
              {{ warehouse.name }}
            </option>
          </select>
        </div>

        <div class="alert alert-warning" v-if="lowStockCount > 0">
          <i class="fa fa-exclamation-triangle"></i>
          Uwaga: {{ lowStockCount }} pozycji poniżej stanu minimalnego.
        </div>

        <div class="table-responsive">
          <table v-if="filteredInventory.length" class="table">
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>SKU</th>
                <th>Jednostka</th>
                <th>Magazyn</th>
                <th>Stan</th>
                <th>Zarezerwowane</th>
                <th>Dostępne</th>
                <th>Cena</th>
                <th class="text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredInventory" :key="item.id" :class="{ 'row-warning': isBelowMin(item) }">
                <td class="font-medium">{{ item.name }}</td>
                <td>{{ item.sku || '-' }}</td>
                <td>{{ item.unit }}</td>
                <td>{{ warehouseName(item.warehouseId) }}</td>
                <td class="font-bold">{{ item.stock }}</td>
                <td>{{ reservedForItem(item.id) }}</td>
                <td>{{ availableForItem(item.id, item.stock) }}</td>
                <td>{{ item.price.toFixed(2) }}</td>
                <td class="text-right actions-cell">
                  <button class="btn-icon" @click="editItem(item)" title="Edytuj">
                    <i class="fa fa-pencil"></i>
                  </button>
                  <button class="btn-icon danger" @click="deleteItem(item.id)" title="Usuń">
                    <i class="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <div class="empty-icon"><i class="fa fa-cubes"></i></div>
            <h3>Brak towarów</h3>
            <p>Dodaj pierwszy produkt, aby prowadzić magazyn.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Content: Documents (Movement) -->
    <div v-if="currentTab === 'documents'" class="tab-content">
      <div class="card">
        <h3>Nowy dokument magazynowy</h3>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Typ dokumentu</label>
            <select v-model="movement.type" class="form-control">
              <option value="pz">PZ (przyjęcie)</option>
              <option value="wz">WZ (wydanie)</option>
              <option value="rw">RW (rozchód wewn.)</option>
              <option value="mm">MM (przesunięcie)</option>
              <option value="inw">INW (inwentaryzacja)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Data</label>
            <input v-model="movement.date" type="date" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Kontrahent</label>
            <select v-model="movement.contactId" class="form-control">
              <option value="">Brak</option>
              <option v-for="contact in contacts" :key="contact.id" :value="contact.id">
                {{ contact.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Magazyn</label>
            <select v-model="movement.warehouseId" class="form-control">
              <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
                {{ warehouse.name }}
              </option>
            </select>
          </div>
          <div class="form-group" v-if="movement.type === 'mm'">
            <label class="form-label">Magazyn docelowy</label>
            <select v-model="movement.toWarehouseId" class="form-control">
              <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
                {{ warehouse.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Produkt *</label>
            <select v-model="movement.itemId" class="form-control">
              <option value="">Wybierz produkt</option>
              <option v-for="item in filteredByWarehouse" :key="item.id" :value="item.id">
                {{ item.name }} ({{ item.stock }} {{ item.unit }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">{{ movement.type === 'inw' ? 'Stan po inwentaryzacji *' : 'Ilość *' }}</label>
            <input v-model.number="movement.quantity" type="number" min="0" class="form-control" />
          </div>
          <div class="form-group full-width">
            <label class="form-label">Uwagi</label>
            <input v-model.trim="movement.note" type="text" class="form-control" />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" @click="createMovement">
            <i class="fa fa-save"></i> Zapisz dokument
          </button>
        </div>
      </div>
    </div>

    <!-- Tab Content: Reservations -->
    <div v-if="currentTab === 'reservations'" class="tab-content">
      <div class="card mb-lg">
        <h3>Nowa rezerwacja</h3>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Magazyn</label>
            <select v-model="reservationForm.warehouseId" class="form-control">
              <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
                {{ warehouse.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Produkt</label>
            <select v-model="reservationForm.itemId" class="form-control">
              <option value="">Wybierz produkt</option>
              <option v-for="item in filteredReservationItems" :key="item.id" :value="item.id">
                {{ item.name }} ({{ item.stock }} {{ item.unit }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Ilość</label>
            <input v-model.number="reservationForm.quantity" type="number" min="1" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Kontrahent</label>
            <select v-model="reservationForm.contactId" class="form-control">
              <option value="">Brak</option>
              <option v-for="contact in contacts" :key="contact.id" :value="contact.id">
                {{ contact.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Termin ważności</label>
            <input v-model="reservationForm.until" type="date" class="form-control" />
          </div>
          <div class="form-group full-width">
            <label class="form-label">Notatka</label>
            <input v-model.trim="reservationForm.note" type="text" class="form-control" />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" @click="saveReservation">Dodaj rezerwację</button>
        </div>
      </div>

      <div class="card table-card">
        <div class="table-responsive">
          <table v-if="reservations.length" class="table">
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Magazyn</th>
                <th>Ilość</th>
                <th>Kontrahent</th>
                <th>Termin</th>
                <th>Status</th>
                <th class="text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="reservation in reservations" :key="reservation.id">
                <td>{{ itemName(reservation.itemId) }}</td>
                <td>{{ warehouseName(reservation.warehouseId) }}</td>
                <td class="font-bold">{{ reservation.quantity }}</td>
                <td>{{ contactName(reservation.contactId) }}</td>
                <td>{{ reservation.until || '-' }}</td>
                <td>
                  <span class="badge" :class="reservation.status === 'active' ? 'badge-info' : 'badge-secondary'">
                    {{ reservation.status === 'active' ? 'Aktywna' : 'Zrealizowana' }}
                  </span>
                </td>
                <td class="text-right actions-cell">
                  <button class="btn btn-sm btn-ghost" @click="closeReservation(reservation)" v-if="reservation.status === 'active'">
                    Zamknij
                  </button>
                  <button class="btn-icon danger" @click="deleteReservation(reservation.id)">
                    <i class="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <p>Brak rezerwacji</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Content: Batches -->
    <div v-if="currentTab === 'batches'" class="tab-content">
      <div class="card mb-lg">
        <h3>Zarządzanie partiami (FEFO)</h3>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Magazyn</label>
            <select v-model="batchForm.warehouseId" class="form-control">
              <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
                {{ warehouse.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Produkt</label>
            <select v-model="batchForm.itemId" class="form-control">
              <option value="">Wybierz produkt</option>
              <option v-for="item in batchItems" :key="item.id" :value="item.id">
                {{ item.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Numer partii</label>
            <input v-model.trim="batchForm.batchNumber" type="text" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Data ważności</label>
            <input v-model="batchForm.expiryDate" type="date" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Ilość</label>
            <input v-model.number="batchForm.quantity" type="number" min="1" class="form-control" />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" @click="addBatch">Dodaj partię</button>
        </div>
      </div>

      <div class="card table-card">
        <div class="table-responsive">
          <table v-if="batchTableRows.length" class="table">
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Magazyn</th>
                <th>Partia</th>
                <th>Ważna do</th>
                <th>Ilość</th>
                <th class="text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in batchTableRows" :key="row.id">
                <td>{{ row.itemName }}</td>
                <td>{{ warehouseName(row.warehouseId) }}</td>
                <td class="font-mono">{{ row.batchNumber || '-' }}</td>
                <td>{{ row.expiryDate || '-' }}</td>
                <td>{{ row.quantity }}</td>
                <td class="text-right actions-cell">
                  <button class="btn-icon danger" @click="removeBatch(row)">
                    <i class="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
           <div v-else class="empty-state">
            <p>Brak partii magazynowych</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Content: Warehouses -->
    <div v-if="currentTab === 'warehouses'" class="tab-content">
      <div class="card mb-lg">
        <h3>{{ editingWarehouseId ? 'Edytuj magazyn' : 'Nowy magazyn' }}</h3>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Nazwa magazynu</label>
            <input v-model.trim="warehouseForm.name" type="text" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Kod</label>
            <input v-model.trim="warehouseForm.code" type="text" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Lokalizacja</label>
            <input v-model.trim="warehouseForm.location" type="text" class="form-control" />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-ghost" @click="resetWarehouseForm">Wyczyść</button>
          <button class="btn btn-primary" @click="saveWarehouse">
            {{ editingWarehouseId ? 'Zapisz' : 'Dodaj magazyn' }}
          </button>
        </div>
      </div>

      <div class="card table-card">
        <div class="table-responsive">
          <table v-if="warehouses.length" class="table">
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Kod</th>
                <th>Lokalizacja</th>
                <th class="text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="warehouse in warehouses" :key="warehouse.id">
                <td class="font-medium">{{ warehouse.name }}</td>
                <td class="font-mono">{{ warehouse.code || '-' }}</td>
                <td>{{ warehouse.location || '-' }}</td>
                <td class="text-right actions-cell">
                  <button class="btn-icon" @click="editWarehouse(warehouse)">
                    <i class="fa fa-pencil"></i>
                  </button>
                  <button class="btn-icon danger" @click="deleteWarehouse(warehouse.id)">
                    <i class="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getContacts } from '@/services/contacts'
import { addInventoryItem, getInventory, removeInventoryItem, updateInventoryItem } from '@/services/inventory'
import { addDocument, commitNumber } from '@/services/documents'
import { getSettings } from '@/services/settings'
import { exportCsv, parseCsv } from '@/utils/csv'
import { addWarehouse, getWarehouses, removeWarehouse, updateWarehouse } from '@/services/warehouses'
import { addReservation, getReservations, removeReservation, updateReservation } from '@/services/reservations'

const router = useRouter()
const settings = ref(getSettings())
const inventory = ref([])
const contacts = ref([])
const warehouses = ref([])
const reservations = ref([])
const query = ref('')
const showItemForm = ref(false)
const editingId = ref('')
const fileInput = ref(null)
const warehouseFilter = ref('')
const editingWarehouseId = ref('')
const currentTab = ref('inventory')

const tabs = [
  { id: 'inventory', label: 'Stany magazynowe', icon: 'fa fa-cubes' },
  { id: 'documents', label: 'Nowy dokument', icon: 'fa fa-file-text' },
  { id: 'reservations', label: 'Rezerwacje', icon: 'fa fa-bookmark' },
  { id: 'batches', label: 'Partie (FEFO)', icon: 'fa fa-barcode' },
  { id: 'warehouses', label: 'Magazyny', icon: 'fa fa-building' }
]

const vatRates = computed(() => settings.value.tax.enabledVatRates)

const itemForm = ref({
  name: '',
  sku: '',
  unit: 'szt.',
  stock: 0,
  price: 0,
  vat: settings.value.tax.defaultVat,
  warehouseId: '',
  location: ''
})

const movement = ref({
  type: 'pz',
  date: new Date().toISOString().substring(0, 10),
  contactId: '',
  warehouseId: '',
  toWarehouseId: '',
  itemId: '',
  quantity: 1,
  note: ''
})

const reservationForm = ref({
  warehouseId: '',
  itemId: '',
  quantity: 1,
  contactId: '',
  until: '',
  note: ''
})

const batchForm = ref({
  warehouseId: '',
  itemId: '',
  batchNumber: '',
  expiryDate: '',
  quantity: 1
})

const warehouseForm = ref({
  name: '',
  code: '',
  location: ''
})

const filteredInventory = computed(() => {
  let base = inventory.value
  if (warehouseFilter.value) {
    base = base.filter((item) => item.warehouseId === warehouseFilter.value)
  }
  if (!query.value) return base
  const term = query.value.toLowerCase()
  return base.filter((item) =>
    [item.name, item.sku].filter(Boolean).some((value) => String(value).toLowerCase().includes(term))
  )
})

const filteredByWarehouse = computed(() => {
  if (!movement.value.warehouseId) return inventory.value
  return inventory.value.filter((item) => item.warehouseId === movement.value.warehouseId)
})

const filteredReservationItems = computed(() => {
  if (!reservationForm.value.warehouseId) return inventory.value
  return inventory.value.filter((item) => item.warehouseId === reservationForm.value.warehouseId)
})

const batchItems = computed(() => {
  if (!batchForm.value.warehouseId) return inventory.value
  return inventory.value.filter((item) => item.warehouseId === batchForm.value.warehouseId)
})

const loadData = () => {
  inventory.value = getInventory()
  contacts.value = getContacts()
  warehouses.value = getWarehouses()
  reservations.value = getReservations()
  if (!itemForm.value.warehouseId && warehouses.value.length) {
    itemForm.value.warehouseId = warehouses.value[0].id
  }
  if (!movement.value.warehouseId && warehouses.value.length) {
    movement.value.warehouseId = warehouses.value[0].id
  }
  if (!reservationForm.value.warehouseId && warehouses.value.length) {
    reservationForm.value.warehouseId = warehouses.value[0].id
  }
  if (!batchForm.value.warehouseId && warehouses.value.length) {
    batchForm.value.warehouseId = warehouses.value[0].id
  }
}

const toggleItemForm = () => {
  showItemForm.value = !showItemForm.value
  if (!showItemForm.value) resetItemForm()
}

const resetItemForm = () => {
  editingId.value = ''
  itemForm.value = {
    name: '',
    sku: '',
    unit: 'szt.',
    stock: 0,
    price: 0,
    vat: settings.value.tax.defaultVat,
    warehouseId: warehouses.value[0]?.id || '',
    location: '',
    minStock: 0
  }
}

const saveItem = () => {
  if (!itemForm.value.name.trim()) {
    alert('Nazwa towaru jest wymagana.')
    return
  }

  if (editingId.value) {
    inventory.value = updateInventoryItem(editingId.value, { ...itemForm.value })
  } else {
    inventory.value = addInventoryItem({ ...itemForm.value })
  }

  showItemForm.value = false
  resetItemForm()
}

const editItem = (item) => {
  showItemForm.value = true
  editingId.value = item.id
  itemForm.value = { minStock: 0, ...item }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const deleteItem = (id) => {
  inventory.value = removeInventoryItem(id)
}

const warehouseName = (id) => warehouses.value.find((warehouse) => warehouse.id === id)?.name || '-'
const itemName = (id) => inventory.value.find((item) => item.id === id)?.name || '-'
const contactName = (id) => contacts.value.find((contact) => contact.id === id)?.name || '-'
const isBelowMin = (item) => availableForItem(item.id, item.stock) < Number(item.minStock || 0)
const lowStockCount = computed(() => inventory.value.filter(isBelowMin).length)

const reservedForItem = (itemId) =>
  reservations.value
    .filter((reservation) => reservation.itemId === itemId && reservation.status === 'active')
    .reduce((sum, reservation) => sum + Number(reservation.quantity || 0), 0)

const availableForItem = (itemId, stock) => Math.max(0, Number(stock) - reservedForItem(itemId))

const resetWarehouseForm = () => {
  editingWarehouseId.value = ''
  warehouseForm.value = { name: '', code: '', location: '' }
}

const saveWarehouse = () => {
  if (!warehouseForm.value.name.trim()) {
    alert('Nazwa magazynu jest wymagana.')
    return
  }

  if (editingWarehouseId.value) {
    warehouses.value = updateWarehouse(editingWarehouseId.value, { ...warehouseForm.value })
  } else {
    warehouses.value = addWarehouse({ ...warehouseForm.value })
  }

  resetWarehouseForm()
}

const editWarehouse = (warehouse) => {
  editingWarehouseId.value = warehouse.id
  warehouseForm.value = { name: warehouse.name, code: warehouse.code || '', location: warehouse.location || '' }
}

const deleteWarehouse = (id) => {
  warehouses.value = removeWarehouse(id)
  if (warehouseFilter.value === id) warehouseFilter.value = ''
}

const saveReservation = () => {
  if (!reservationForm.value.itemId || !reservationForm.value.quantity) {
    alert('Wybierz produkt i ilość.')
    return
  }

  const item = inventory.value.find((entry) => entry.id === reservationForm.value.itemId)
  if (!item) return

  const available = availableForItem(item.id, item.stock)
  if (reservationForm.value.quantity > available) {
    alert('Brak wystarczającej ilości dostępnej do rezerwacji.')
    return
  }

  reservations.value = addReservation({ ...reservationForm.value })
  reservationForm.value = {
    warehouseId: reservationForm.value.warehouseId,
    itemId: '',
    quantity: 1,
    contactId: '',
    until: '',
    note: ''
  }
}

const closeReservation = (reservation) => {
  reservations.value = updateReservation(reservation.id, { status: 'closed' })
}

const deleteReservation = (id) => {
  reservations.value = removeReservation(id)
}

const normalizeItem = (item) => ({
  ...item,
  batches: Array.isArray(item.batches) ? item.batches : []
})

const addBatch = () => {
  if (!batchForm.value.itemId || !batchForm.value.quantity) {
    alert('Wybierz produkt i ilość.')
    return
  }

  const item = inventory.value.find((entry) => entry.id === batchForm.value.itemId)
  if (!item) return
  const normalized = normalizeItem(item)
  const newBatch = {
    id: crypto.randomUUID(),
    batchNumber: batchForm.value.batchNumber,
    expiryDate: batchForm.value.expiryDate,
    quantity: Number(batchForm.value.quantity)
  }

  const updated = {
    ...normalized,
    stock: Number(normalized.stock) + newBatch.quantity,
    batches: [newBatch, ...normalized.batches]
  }

  inventory.value = updateInventoryItem(normalized.id, updated)
  batchForm.value = {
    warehouseId: batchForm.value.warehouseId,
    itemId: '',
    batchNumber: '',
    expiryDate: '',
    quantity: 1
  }
}

const removeBatch = (row) => {
  const item = inventory.value.find((entry) => entry.id === row.itemId)
  if (!item) return
  const normalized = normalizeItem(item)
  const batch = normalized.batches.find((b) => b.id === row.id)
  if (!batch) return
  const updated = {
    ...normalized,
    stock: Math.max(0, Number(normalized.stock) - Number(batch.quantity)),
    batches: normalized.batches.filter((b) => b.id !== row.id)
  }
  inventory.value = updateInventoryItem(normalized.id, updated)
}

const batchTableRows = computed(() => {
  return inventory.value.flatMap((item) => {
    const normalized = normalizeItem(item)
    return normalized.batches.map((batch) => ({
      ...batch,
      itemId: normalized.id,
      itemName: normalized.name,
      warehouseId: normalized.warehouseId
    }))
  })
})

const consumeBatchesFefo = (item, quantity) => {
  const normalized = normalizeItem(item)
  if (!normalized.batches.length) return normalized

  const sorted = [...normalized.batches].sort((a, b) => {
    if (!a.expiryDate) return 1
    if (!b.expiryDate) return -1
    return a.expiryDate.localeCompare(b.expiryDate)
  })

  let remaining = quantity
  const updatedBatches = []

  sorted.forEach((batch) => {
    if (remaining <= 0) {
      updatedBatches.push(batch)
      return
    }
    if (batch.quantity > remaining) {
      updatedBatches.push({ ...batch, quantity: batch.quantity - remaining })
      remaining = 0
    } else {
      remaining -= batch.quantity
    }
  })

  return {
    ...normalized,
    batches: updatedBatches
  }
}

const exportInventory = () => {
  const rows = [
    ['name', 'sku', 'unit', 'stock', 'price', 'vat', 'minStock']
  ]
  inventory.value.forEach((item) => {
    rows.push([
      item.name,
      item.sku,
      item.unit,
      item.stock,
      item.price,
      item.vat,
      item.minStock ?? 0
    ])
  })
  exportCsv(rows, 'magazyn.csv')
}

const triggerImport = () => {
  fileInput.value?.click()
}

const handleImport = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  const text = await file.text()
  const rows = parseCsv(text)
  rows.forEach((row) => {
    if (!row.name) return
    addInventoryItem({
      name: row.name,
      sku: row.sku || '',
      unit: row.unit || 'szt.',
      stock: Number(row.stock || 0),
      price: Number(row.price || 0),
      vat: row.vat || settings.value.tax.defaultVat,
      minStock: Number(row.minStock || 0)
    })
  })
  loadData()
  event.target.value = ''
}

const createMovement = () => {
  const item = inventory.value.find((entry) => entry.id === movement.value.itemId)
  if (!item || movement.value.quantity === null || movement.value.quantity === undefined) {
    alert('Wybierz produkt oraz ilość.')
    return
  }

  if (movement.value.type === 'mm' && movement.value.toWarehouseId === movement.value.warehouseId) {
    alert('Wybierz inny magazyn docelowy.')
    return
  }

  const quantity = Number(movement.value.quantity)
  let nextStock = item.stock

  if (movement.value.type === 'pz') nextStock = item.stock + quantity
  if (movement.value.type === 'wz' || movement.value.type === 'rw') nextStock = item.stock - quantity
  if (movement.value.type === 'inw') nextStock = quantity

  if (nextStock < 0) {
    alert('Brak wystarczającego stanu magazynowego.')
    return
  }

  if (movement.value.type !== 'mm') {
    const updatedItem = {
      ...item,
      stock: nextStock,
      batches: consumeBatchesFefo(item, quantity).batches
    }
    inventory.value = updateInventoryItem(item.id, updatedItem)
  }

  if (movement.value.type === 'mm') {
    const updatedItem = {
      ...item,
      stock: item.stock - quantity,
      batches: consumeBatchesFefo(item, quantity).batches
    }
    if (updatedItem.stock < 0) {
      alert('Brak wystarczającego stanu magazynowego.')
      return
    }
    inventory.value = updateInventoryItem(item.id, updatedItem)

    const destination = inventory.value.find(
      (entry) => entry.warehouseId === movement.value.toWarehouseId && entry.name === item.name && entry.sku === item.sku
    )
    if (destination) {
      inventory.value = updateInventoryItem(destination.id, {
        ...destination,
        stock: destination.stock + quantity
      })
    } else {
      inventory.value = addInventoryItem({
        name: item.name,
        sku: item.sku,
        unit: item.unit,
        stock: quantity,
        price: item.price,
        vat: item.vat,
        warehouseId: movement.value.toWarehouseId,
        location: ''
      })
    }
  }

  const contact = contacts.value.find((entry) => entry.id === movement.value.contactId)
  const number = commitNumber(movement.value.type, new Date(movement.value.date), settings.value)
  const vatValue = item.vat === 'zw' ? 0 : Number(item.vat)

  addDocument({
    id: crypto.randomUUID(),
    type: movement.value.type,
    number,
    issuer: {
      name: settings.value.company.name,
      nip: settings.value.company.nip,
      address: settings.value.company.address
    },
    counterparty: contact
      ? { name: contact.name, nip: contact.nip, address: contact.address }
      : { name: '—', nip: '', address: '' },
    document: {
      type: movement.value.type,
      number,
      issueDate: movement.value.date,
      saleDate: movement.value.date,
      notes: movement.value.note,
      warehouseId: movement.value.warehouseId,
      toWarehouseId: movement.value.toWarehouseId
    },
    items: [
      {
        description: item.name,
        quantity,
        price: item.price,
        vat: item.vat
      }
    ],
     currency: settings.value.tax.defaultCurrency,
     totals: {
       netto: (item.price * quantity).toFixed(2),
      vat: (item.price * quantity * (vatValue / 100)).toFixed(2),
      brutto: (item.price * quantity * (1 + vatValue / 100)).toFixed(2)
    }
   })

   movement.value = {
     type: movement.value.type,
     date: new Date().toISOString().substring(0, 10),
     contactId: '',
    warehouseId: movement.value.warehouseId,
    toWarehouseId: '',
     itemId: '',
     quantity: 1,
     note: ''
   }

   // Switch to inventory tab to see changes or stay?
   // Maybe show success message
   alert('Dokument utworzony pomyślnie.')
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
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.tabs-wrapper {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-btn:hover {
  color: var(--primary-600);
  background: var(--secondary-50);
}

.tab-btn.active {
  color: var(--primary-600);
  border-bottom-color: var(--primary-600);
  background: var(--primary-50);
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
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-md);
}

.full-width {
  grid-column: 1 / -1;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--app-border);
}

.table-header-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--secondary-50);
  border-bottom: 1px solid var(--app-border);
}

.search-wrapper {
  position: relative;
  flex: 1;
  max-width: 300px;
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

.warehouse-select {
  width: auto;
  min-width: 200px;
}

.alert {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  margin: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--text-sm);
}

.alert-warning {
  background: var(--warning-light);
  color: var(--warning);
}

.row-warning td {
  background-color: var(--warning-light) !important;
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
  .actions-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .tabs-wrapper {
    overflow-x: auto;
    white-space: nowrap;
    padding-bottom: 8px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
