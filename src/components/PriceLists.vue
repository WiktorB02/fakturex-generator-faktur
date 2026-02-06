<template>
  <div class="price-page">
    <header class="page-header">
      <button class="ghost-btn" @click="goHome">Powrót</button>
      <div>
        <h1>Cenniki</h1>
        <p>Twórz cenniki i przypisuj je do kontrahentów.</p>
      </div>
      <button class="primary-btn" @click="toggleForm">
        {{ showForm ? 'Zamknij' : 'Dodaj cennik' }}
      </button>
    </header>

    <section v-if="showForm" class="card">
      <h2>{{ editingId ? 'Edytuj cennik' : 'Nowy cennik' }}</h2>
      <div class="form-grid">
        <label>
          Nazwa
          <input v-model.trim="form.name" type="text" />
        </label>
        <label>
          Waluta
          <select v-model="form.currency">
            <option v-for="currency in currencies" :key="currency" :value="currency">
              {{ currency }}
            </option>
          </select>
        </label>
      </div>
      <div class="form-grid">
        <label>
          Produkt
          <select v-model="itemForm.productId">
            <option value="">Wybierz produkt</option>
            <option v-for="item in inventory" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </label>
        <label>
          Cena netto
          <input v-model="itemForm.price" type="text" inputmode="decimal" placeholder="0,00" />
        </label>
      </div>
      <button class="ghost-btn" @click="addItem">Dodaj pozycję</button>

      <table v-if="form.items.length" class="price-table">
        <thead>
          <tr>
            <th>Produkt</th>
            <th>Cena</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in form.items" :key="index">
            <td>{{ item.productName || inventory.find((entry) => entry.id === item.productId)?.name || '—' }}</td>
            <td>{{ Number(item.price ?? 0).toFixed(2) }}</td>
            <td class="actions">
              <button class="danger-btn" @click="removeItem(index)">Usuń</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="form-actions">
        <button class="ghost-btn" @click="resetForm">Wyczyść</button>
        <button class="primary-btn" @click="saveList">
          {{ editingId ? 'Zapisz' : 'Dodaj' }}
        </button>
      </div>
    </section>

    <section class="card">
      <h2>Lista cenników</h2>
      <table v-if="priceLists.length" class="price-table">
        <thead>
          <tr>
            <th>Nazwa</th>
            <th>Waluta</th>
            <th>Pozycji</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="list in priceLists" :key="list.id">
            <td>{{ list.name }}</td>
            <td>{{ list.currency }}</td>
            <td>{{ list.items?.length || 0 }}</td>
            <td class="actions">
              <button class="ghost-btn" @click="editList(list)">Edytuj</button>
              <button class="danger-btn" @click="deleteList(list.id)">Usuń</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <h3>Brak cenników</h3>
        <p>Dodaj pierwszy cennik.</p>
      </div>
    </section>
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

const toggleForm = () => {
  showForm.value = !showForm.value
  if (!showForm.value) resetForm()
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
  resetForm()
  showForm.value = false
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
  priceLists.value = removePriceList(id)
}

const resetForm = () => {
  editingId.value = ''
  form.value = { name: '', currency: settings.tax.defaultCurrency, items: [] }
  itemForm.value = { productId: '', price: '' }
}

const goHome = () => {
  router.push({ name: 'home' })
}

onMounted(loadLists)
</script>

<style src="./PriceLists.css"></style>
