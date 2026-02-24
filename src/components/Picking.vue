<template>
  <div class="page-content">
    <div class="actions-bar">
      <div>
        <!-- Title handled by TopBar -->
      </div>

      <div class="action-buttons">
        <button class="btn btn-secondary" @click="refresh">
          <i class="fa fa-refresh"></i> Odśwież
        </button>
      </div>
    </div>

    <div class="card table-card">
      <div class="table-responsive">
        <table v-if="tasks.length" class="table">
          <thead>
            <tr>
              <th>Kontrahent</th>
              <th>Magazyn</th>
              <th>Pozycji</th>
              <th>Status</th>
              <th class="text-right">Akcje</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="task in tasks" :key="task.id">
              <tr>
                <td>{{ contactName(task.contactId) }}</td>
                <td>{{ warehouseName(task.warehouseId) }}</td>
                <td>{{ task.items?.length || 0 }}</td>
                <td>
                  <select
                    class="form-control form-control-sm status-select"
                    :value="task.status"
                    @change="setStatus(task, $event.target.value)"
                    :class="getStatusClass(task.status)"
                  >
                    <option v-for="status in statusOptions" :key="status.value" :value="status.value">
                      {{ status.label }}
                    </option>
                  </select>
                </td>
                <td class="text-right actions-cell">
                  <button class="btn btn-sm btn-secondary mr-sm" @click="toggleDetails(task.id)">
                    <i class="fa" :class="expandedTaskId === task.id ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                    {{ expandedTaskId === task.id ? 'Ukryj' : 'Szczegóły' }}
                  </button>
                  <button class="btn-icon danger" @click="deleteTask(task.id)">
                    <i class="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="expandedTaskId === task.id" class="details-row">
                <td colspan="5">
                  <div class="details-panel">
                    <h4>Szczegóły pozycji</h4>
                    <div v-if="task.items?.length" class="details-grid">
                      <div v-for="(item, index) in task.items" :key="index" class="details-item card">
                        <div class="item-header">
                          <strong>{{ itemName(item.itemId) }}</strong>
                          <span class="badge badge-secondary">{{ item.quantity }} szt.</span>
                        </div>
                        <div class="item-meta">
                          <div><span class="label">SKU:</span> {{ itemInfo(item.itemId).sku || '—' }}</div>
                          <div><span class="label">Lok:</span> {{ itemInfo(item.itemId).location || '—' }}</div>
                          <div><span class="label">Stan:</span> {{ itemInfo(item.itemId).stock ?? '—' }}</div>
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
          <div class="empty-icon"><i class="fa fa-th-list"></i></div>
          <h3>Brak zleceń</h3>
          <p>Utwórz picking z poziomu zamówień sprzedaży.</p>
        </div>
      </div>
    </div>
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

const setStatus = (task, status) => {
  tasks.value = updatePickingTask(task.id, { status })
}

const deleteTask = (id) => {
  if (confirm('Czy na pewno usunąć to zlecenie?')) {
    tasks.value = removePickingTask(id)
  }
}

const toggleDetails = (id) => {
  expandedTaskId.value = expandedTaskId.value === id ? '' : id
}

const contactName = (id) => contacts.value.find((contact) => contact.id === id)?.name || '-'
const warehouseName = (id) => warehouses.value.find((warehouse) => warehouse.id === id)?.name || '-'
const itemInfo = (id) => inventory.value.find((item) => item.id === id) || {}
const itemName = (id) => itemInfo(id).name || '-'

const getStatusClass = (status) => {
  switch (status) {
    case 'open': return ''
    case 'in_progress': return 'text-warning'
    case 'packed': return 'text-success'
    case 'closed': return 'text-muted'
    default: return ''
  }
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
}

.action-buttons {
  display: flex;
  gap: var(--spacing-sm);
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

.status-select {
  border: 1px solid var(--secondary-200);
  border-radius: var(--radius-sm);
  padding: 2px 6px;
  background-color: transparent;
  cursor: pointer;
}

.text-warning { color: var(--warning); font-weight: bold; }
.text-success { color: var(--success); font-weight: bold; }
.text-muted { color: var(--secondary-400); }

.details-row td {
  background-color: var(--secondary-50);
  padding: var(--spacing-md);
  border-top: none;
}

.details-panel {
  padding: var(--spacing-sm);
}

.details-panel h4 {
  margin-bottom: var(--spacing-md);
  font-size: var(--text-sm);
  color: var(--secondary-600);
  text-transform: uppercase;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-md);
}

.details-item {
  padding: var(--spacing-md);
  background: white;
  border: 1px solid var(--secondary-200);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.item-meta {
  font-size: var(--text-xs);
  color: var(--secondary-600);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-meta .label {
  color: var(--secondary-400);
  width: 40px;
  display: inline-block;
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
</style>
