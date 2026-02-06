<template>
  <div class="orders-page">
    <header class="page-header">
      <button class="ghost-btn" @click="goHome">Powrót</button>
      <div>
        <h1>Picking / Packing</h1>
        <p>Lista zleceń kompletacji i pakowania.</p>
      </div>
      <button class="primary-btn" @click="refresh">Odśwież</button>
    </header>

    <section class="card">
      <table v-if="tasks.length" class="orders-table">
        <thead>
          <tr>
            <th>Kontrahent</th>
            <th>Magazyn</th>
            <th>Pozycji</th>
            <th>Status</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="task in tasks" :key="task.id">
            <tr>
            <td>{{ contactName(task.contactId) }}</td>
            <td>{{ warehouseName(task.warehouseId) }}</td>
            <td>{{ task.items?.length || 0 }}</td>
            <td>
              <select class="status-select" :value="task.status" @change="setStatus(task, $event.target.value)">
                <option v-for="status in statusOptions" :key="status.value" :value="status.value">
                  {{ status.label }}
                </option>
              </select>
            </td>
            <td class="actions">
              <button class="ghost-btn" @click="toggleDetails(task.id)">
                {{ expandedTaskId === task.id ? 'Ukryj' : 'Szczegóły' }}
              </button>
              <button class="ghost-btn" @click="closeTask(task)">Zamknij</button>
              <button class="danger-btn" @click="deleteTask(task.id)">Usuń</button>
            </td>
            </tr>
            <tr v-if="expandedTaskId === task.id" class="details-row">
              <td colspan="5">
                <div class="details-panel">
                  <h4>Szczegóły pozycji</h4>
                  <div v-if="task.items?.length" class="details-grid">
                    <div v-for="(item, index) in task.items" :key="index" class="details-item">
                      <div>
                        <strong>{{ itemName(item.itemId) }}</strong>
                        <div class="details-meta">Ilość: {{ item.quantity }}</div>
                      </div>
                      <div>
                        <div class="details-meta">SKU: {{ itemInfo(item.itemId).sku || '—' }}</div>
                        <div class="details-meta">Lokalizacja: {{ itemInfo(item.itemId).location || '—' }}</div>
                      </div>
                      <div>
                        <div class="details-meta">Magazyn: {{ warehouseName(itemInfo(item.itemId).warehouseId) }}</div>
                        <div class="details-meta">Stan: {{ itemInfo(item.itemId).stock ?? '—' }}</div>
                      </div>
                    </div>
                  </div>
                  <p v-else class="details-empty">Brak pozycji w zleceniu.</p>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <h3>Brak zleceń</h3>
        <p>Utwórz picking z poziomu zamówień sprzedaży.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPickingTasks, removePickingTask, updatePickingTask } from '@/services/picking'
import { getContacts } from '@/services/contacts'
import { getWarehouses } from '@/services/warehouses'
import { getInventory } from '@/services/inventory'

const router = useRouter()
const tasks = ref([])
const contacts = ref([])
const warehouses = ref([])
const inventory = ref([])
const expandedTaskId = ref('')

const statusOptions = [
  { value: 'open', label: 'Otwarte' },
  { value: 'in_progress', label: 'W realizacji' },
  { value: 'packed', label: 'Spakowane' },
  { value: 'closed', label: 'Zamknięte' }
]

const refresh = () => {
  tasks.value = getPickingTasks()
  contacts.value = getContacts()
  warehouses.value = getWarehouses()
  inventory.value = getInventory()
}

const closeTask = (task) => {
  tasks.value = updatePickingTask(task.id, { status: 'closed' })
}

const setStatus = (task, status) => {
  tasks.value = updatePickingTask(task.id, { status })
}

const deleteTask = (id) => {
  tasks.value = removePickingTask(id)
}

const toggleDetails = (id) => {
  expandedTaskId.value = expandedTaskId.value === id ? '' : id
}

const contactName = (id) => contacts.value.find((contact) => contact.id === id)?.name || '-'
const warehouseName = (id) => warehouses.value.find((warehouse) => warehouse.id === id)?.name || '-'
const itemInfo = (id) => inventory.value.find((item) => item.id === id) || {}
const itemName = (id) => itemInfo(id).name || '-'

const goHome = () => {
  router.push({ name: 'home' })
}

onMounted(refresh)
</script>

<style src="./Orders.css"></style>
