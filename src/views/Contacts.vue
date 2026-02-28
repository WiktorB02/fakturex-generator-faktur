<template>
  <div class="page-content">
    <div class="actions-bar">
      <div class="search-wrapper">
        <i class="fa fa-search search-icon"></i>
        <input
          v-model.trim="query"
          placeholder="Szukaj kontrahenta..."
          class="form-control with-icon"
        />
      </div>

      <div class="action-buttons">
        <input ref="fileInput" type="file" accept=".csv" hidden @change="handleImport" />
        <button class="btn btn-secondary" @click="exportContacts">
          <i class="fa fa-download"></i> Eksport
        </button>
        <button class="btn btn-secondary" @click="triggerImport">
          <i class="fa fa-upload"></i> Import
        </button>
        <button class="btn btn-primary" @click="openNewContactForm">
          <i class="fa fa-plus"></i> Dodaj kontrahenta
        </button>
      </div>
    </div>

    <!-- Contact Form (Card) -->
    <div v-if="showForm" class="card form-card">
      <div class="card-header">
        <h3>{{ editingId ? 'Edytuj kontrahenta' : 'Nowy kontrahent' }}</h3>
        <button class="btn-icon" @click="closeForm">
          <i class="fa fa-times"></i>
        </button>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Nazwa *</label>
          <input v-model.trim="form.name" type="text" class="form-control" :class="{ 'is-invalid': errors.name }" />
          <span v-if="errors.name" class="form-error">{{ errors.name }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">NIP</label>
          <input v-model.trim="form.nip" type="text" class="form-control" />
        </div>

        <div class="form-group">
          <label class="form-label">Typ</label>
          <select v-model="form.type" class="form-control">
            <option value="client">Klient</option>
            <option value="supplier">Dostawca</option>
            <option value="both">Klient i dostawca</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Cennik</label>
          <select v-model="form.priceListId" class="form-control">
            <option value="">Domyślny</option>
            <option v-for="list in priceLists" :key="list.id" :value="list.id">
              {{ list.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Rabat klienta (%)</label>
          <input v-model.number="form.discountPercent" type="number" min="0" max="100" class="form-control" />
        </div>

        <div class="form-group">
          <label class="form-label">Telefon</label>
          <input v-model.trim="form.phone" type="text" class="form-control" />
        </div>

        <div class="form-group">
          <label class="form-label">E-mail</label>
          <input v-model.trim="form.email" type="email" class="form-control" />
        </div>

        <div class="form-group full-width">
          <label class="form-label">Adres</label>
          <input v-model.trim="form.address" type="text" class="form-control" />
        </div>

        <div class="form-group full-width">
          <label class="form-label">Notatka</label>
          <textarea v-model.trim="form.note" rows="2" class="form-control"></textarea>
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-ghost" @click="closeForm">Anuluj</button>
        <button class="btn btn-primary" @click="saveContact">
          <i class="fa fa-save"></i> {{ editingId ? 'Zapisz zmiany' : 'Dodaj kontrahenta' }}
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-content card">
        <h3>Usuń kontrahenta</h3>
        <p>Czy na pewno chcesz usunąć tego kontrahenta? Tej operacji nie można cofnąć.</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showDeleteModal = false">Anuluj</button>
          <button class="btn btn-danger" @click="handleDelete">
            <i class="fa fa-trash"></i> Usuń
          </button>
        </div>
      </div>
    </div>

    <!-- Contacts Table -->
    <div class="card table-card">
      <div class="table-responsive">
        <table v-if="filteredContacts.length || isLoading" class="table">
          <thead>
            <tr>
              <th>Nazwa</th>
              <th>Typ</th>
              <th>NIP</th>
              <th>Cennik</th>
              <th>Kontakt</th>
              <th>Adres</th>
              <th class="text-right">Akcje</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="isLoading">
              <tr v-for="i in 5" :key="i">
                <td><div class="skeleton skeleton-text medium"></div></td>
                <td><div class="skeleton skeleton-text short"></div></td>
                <td><div class="skeleton skeleton-text short"></div></td>
                <td><div class="skeleton skeleton-text short"></div></td>
                <td><div class="skeleton skeleton-text medium"></div></td>
                <td><div class="skeleton skeleton-text medium"></div></td>
                <td class="text-right actions-cell"><div class="skeleton skeleton-text short" style="display:inline-block; width:30px;"></div></td>
              </tr>
            </template>
            <template v-else>
              <tr v-for="contact in filteredContacts" :key="contact.id">
                <td class="font-medium">{{ contact.name }}</td>
                <td>
                  <span class="badge badge-secondary">{{ typeLabels[contact.type] }}</span>
                </td>
                <td>{{ contact.nip || '-' }}</td>
                <td>{{ getPriceListName(contact.priceListId) }}</td>
                <td>
                  <div class="contact-details">
                    <div v-if="contact.phone"><i class="fa fa-phone"></i> {{ contact.phone }}</div>
                    <div v-if="contact.email"><i class="fa fa-envelope"></i> {{ contact.email }}</div>
                    <div v-if="!contact.phone && !contact.email">-</div>
                  </div>
                </td>
                <td>{{ contact.address || '-' }}</td>
                <td class="text-right actions-cell">
                  <button class="btn-icon" @click="editContact(contact)" title="Edytuj">
                    <i class="fa fa-pencil"></i>
                  </button>
                  <button class="btn-icon danger" @click="confirmDelete(contact.id)" title="Usuń">
                    <i class="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <div v-else-if="!isLoading" class="empty-state">
          <div class="empty-icon">
            <i class="fa fa-address-book-o"></i>
          </div>
          <h3>Brak kontrahentów</h3>
          <p>Dodaj pierwszego kontrahenta, aby przyspieszyć wystawianie dokumentów.</p>
          <button class="btn btn-primary" @click="openNewContactForm">
            Dodaj kontrahenta
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { addContact, getContacts, removeContact, updateContact } from '@/services/contacts'
import { exportCsv, parseCsv } from '@/utils/csv'
import { getPriceLists } from '@/services/priceLists'
import { useToast } from '@/services/toast'

const router = useRouter()
const toast = useToast()

const showForm = ref(false)
const editingId = ref('')
const contacts = ref([])
const query = ref('')
const fileInput = ref(null)
const priceLists = ref([])
const isLoading = ref(true)
const showDeleteModal = ref(false)
const contactToDelete = ref(null)

const errors = reactive({ name: '' })

const form = ref({
  name: '',
  nip: '',
  type: 'client',
  priceListId: '',
  discountPercent: 0,
  phone: '',
  email: '',
  address: '',
  note: ''
})

const typeLabels = {
  client: 'Klient',
  supplier: 'Dostawca',
  both: 'Klient i dostawca'
}

const filteredContacts = computed(() => {
  if (!query.value) return contacts.value
  const term = query.value.toLowerCase()
  return contacts.value.filter((contact) =>
    [contact.name, contact.nip, contact.email, contact.phone]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term))
  )
})

const loadData = () => {
  contacts.value = getContacts()
  priceLists.value = getPriceLists()
}

const openNewContactForm = () => {
  resetForm()
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  resetForm()
}

const resetForm = () => {
  editingId.value = ''
  errors.name = ''
  form.value = {
    name: '',
    nip: '',
    type: 'client',
    priceListId: '',
    discountPercent: 0,
    phone: '',
    email: '',
    address: '',
    note: ''
  }
}

const saveContact = () => {
  errors.name = ''
  if (!form.value.name.trim()) {
    errors.name = 'Nazwa kontrahenta jest wymagana.'
    toast.error('Uzupełnij wymagane pola formularza.')
    return
  }

  if (editingId.value) {
    contacts.value = updateContact(editingId.value, { ...form.value })
    toast.success('Zaktualizowano kontrahenta.')
  } else {
    contacts.value = addContact({ ...form.value })
    toast.success('Dodano nowego kontrahenta.')
  }

  closeForm()
}

const editContact = (contact) => {
  showForm.value = true
  editingId.value = contact.id
  form.value = { ...contact }
  // Scroll to form
  setTimeout(() => {
    document.querySelector('.form-card')?.scrollIntoView({ behavior: 'smooth' })
  }, 100)
}

const confirmDelete = (id) => {
  contactToDelete.value = id
  showDeleteModal.value = true
}

const handleDelete = () => {
  if (contactToDelete.value) {
    contacts.value = removeContact(contactToDelete.value)
    toast.success('Kontrahent został usunięty.')
  }
  showDeleteModal.value = false
  contactToDelete.value = null
}

const getPriceListName = (id) => priceLists.value.find((list) => list.id === id)?.name || 'Domyślny'

const exportContacts = () => {
  const rows = [
    ['name', 'nip', 'type', 'priceListId', 'discountPercent', 'phone', 'email', 'address', 'note']
  ]
  contacts.value.forEach((contact) => {
    rows.push([
      contact.name,
      contact.nip,
      contact.type,
      contact.priceListId,
      contact.discountPercent ?? 0,
      contact.phone,
      contact.email,
      contact.address,
      contact.note
    ])
  })
  exportCsv(rows, 'kontrahenci.csv')
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
    const type = ['client', 'supplier', 'both'].includes(row.type) ? row.type : 'client'
    if (!row.name) return
    addContact({
      name: row.name,
      nip: row.nip || '',
      type,
      priceListId: row.priceListId || '',
      discountPercent: Number(row.discountPercent || 0),
      phone: row.phone || '',
      email: row.email || '',
      address: row.address || '',
      note: row.note || ''
    })
  })
  loadData()
  event.target.value = ''
}

onMounted(() => {
  setTimeout(() => {
    loadData()
    isLoading.value = false
  }, 500)
})
</script>

<style scoped>
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  max-width: 400px;
  width: 100%;
  animation: slideDown 0.3s ease;
}

.modal-content h3 {
  margin-bottom: var(--spacing-sm);
}

.modal-content p {
  color: var(--secondary-600);
  margin-bottom: var(--spacing-lg);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

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

.table-card {
  padding: 0;
  overflow: hidden;
}

.actions-cell {
  white-space: nowrap;
}

.contact-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: var(--text-xs);
  color: var(--secondary-600);
}

.contact-details i {
  width: 14px;
  text-align: center;
  color: var(--secondary-400);
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

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .actions-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper {
    max-width: 100%;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
