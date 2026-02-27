<template>
  <div class="page-content">
    <div class="actions-bar">
      <div>
        <!-- Title handled by TopBar -->
      </div>

      <div class="action-buttons">
        <button class="btn btn-primary" @click="openNewForm">
          <i class="fa fa-plus"></i> Dodaj cennik
        </button>
      </div>
    </div>

    <!-- Price List Form -->
    <div v-if="showForm" class="card form-card mb-lg">
      <div class="card-header">
        <h3>{{ editingId ? 'Edytuj cennik' : 'Nowy cennik' }}</h3>
        <button class="btn-icon" @click="closeForm">
          <i class="fa fa-times"></i>
        </button>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Nazwa</label>
          <input v-model.trim="form.name" type="text" class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">Waluta</label>
          <select v-model="form.currency" class="form-control">
            <option v-for="currency in currencies" :key="currency" :value="currency">
              {{ currency }}
            </option>
          </select>
        </div>
      </div>

      <div class="items-section">
        <h4>Pozycje cennika</h4>
        <div class="items-form-row">
          <div class="form-group flex-grow">
            <label class="form-label">Produkt</label>
            <select v-model="itemForm.productId" class="form-control">
              <option value="">Wybierz produkt</option>
              <option v-for="item in inventory" :key="item.id" :value="item.id">
                {{ item.name }}
              </option>
            </select>
          </div>
          <div class="form-group w-32">
            <label class="form-label">Cena netto</label>
            <input v-model="itemForm.price" type="text" inputmode="decimal" placeholder="0.00" class="form-control" />
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
                <th class="text-right">Cena</th>
                <th class="text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in form.items" :key="index">
                <td>{{ item.productName || inventory.find((entry) => entry.id === item.productId)?.name || '—' }}</td>
                <td class="text-right">{{ Number(item.price ?? 0).toFixed(2) }} {{ form.currency }}</td>
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
          Brak pozycji w cenniku
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-ghost" @click="closeForm">Anuluj</button>
        <button class="btn btn-primary" @click="saveList">
          <i class="fa fa-save"></i> Zapisz
        </button>
      </div>
    </div>

    <!-- Price Lists Table -->
    <div class="card table-card">
      <div class="table-responsive">
        <table v-if="priceLists.length" class="table">
          <thead>
            <tr>
              <th>Nazwa</th>
              <th>Waluta</th>
              <th>Pozycji</th>
              <th class="text-right">Akcje</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="list in priceLists" :key="list.id">
              <td class="font-medium">{{ list.name }}</td>
              <td>{{ list.currency }}</td>
              <td>{{ list.items?.length || 0 }}</td>
              <td class="text-right actions-cell">
                <button class="btn-icon" @click="editList(list)" title="Edytuj">
                  <i class="fa fa-pencil"></i>
                </button>
                <button class="btn-icon danger" @click="deleteList(list.id)" title="Usuń">
                  <i class="fa fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <div class="empty-icon"><i class="fa fa-tags"></i></div>
          <h3>Brak cenników</h3>
          <p>Dodaj pierwszy cennik, aby przypisać indywidualne ceny dla kontrahentów.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { addPriceList, getPriceLists, removePriceList, updatePriceList } from '@/services/priceLists'
import { getInventory } from '@/services/inventory'
import { getSettings } from '@/services/settings'

const router = useRouter()
const settings = getSettings()
const currencies = settings.tax.enabledCurrencies

const priceLists = ref([])
const inventory = ref([])
const showForm = ref(false)
const editingId = ref('')

const form = ref({
  name: '',
  currency: settings.tax.defaultCurrency,
  items: []
})

const itemForm = ref({
  productId: '',
  price: ''
})

const loadLists = () => {
  priceLists.value = getPriceLists()
  inventory.value = getInventory()
}

const openNewForm = () => {
  resetForm()
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  resetForm()
}

const addItem = () => {
  if (!itemForm.value.productId) return
  const product = inventory.value.find((entry) => entry.id === itemForm.value.productId)
  if (!product) return
  const rawPrice = String(itemForm.value.price ?? '').replace(',', '.')
  const price = Number(rawPrice)
  if (!Number.isFinite(price)) return
  const nextItem = {
    productId: product.id,
    productName: product.name,
    price
  }
  const existingIndex = form.value.items.findIndex((entry) =>
    (nextItem.productId && entry.productId === nextItem.productId) ||
    entry.productName === nextItem.productName
  )
  if (existingIndex >= 0) {
    form.value.items[existingIndex] = { ...form.value.items[existingIndex], ...nextItem }
  } else {
    form.value.items.push(nextItem)
  }
  itemForm.value = { productId: '', price: '' }
}

const removeItem = (index) => {
  form.value.items.splice(index, 1)
}

const saveList = () => {
  if (!form.value.name.trim()) return
  if (editingId.value) {
    priceLists.value = updatePriceList(editingId.value, { ...form.value })
  } else {
    priceLists.value = addPriceList({ ...form.value })
  }
  closeForm()
}

const editList = (list) => {
  editingId.value = list.id
  showForm.value = true
  form.value = {
    name: list.name,
    currency: list.currency,
    items: (list.items || []).map((entry) => ({
      ...entry,
      price: Number(String(entry.price ?? 0).replace(',', '.')) || 0
    }))
  }
}

const deleteList = (id) => {
  if (confirm('Czy na pewno usunąć ten cennik?')) {
    priceLists.value = removePriceList(id)
  }
}

const resetForm = () => {
  editingId.value = ''
  form.value = { name: '', currency: settings.tax.defaultCurrency, items: [] }
  itemForm.value = { productId: '', price: '' }
}

onMounted(loadLists)
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

.w-32 {
  width: 8rem;
}

.flex-end {
  display: flex;
  align-items: flex-end;
}

.mt-md {
  margin-top: var(--spacing-md);
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

  .w-32 {
    width: 100%;
  }
}
</style>
