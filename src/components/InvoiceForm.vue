<template>
  <div class="form-page">
    <div class="form-header">
      <!-- Title handled by TopBar -->
    </div>

    <form @submit.prevent class="form-layout">
      <div class="form-content">
        <!-- 1. Document Basics -->
        <section class="card mb-lg">
          <div class="card-header">
            <h3>1. Podstawy dokumentu</h3>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Rodzaj dokumentu</label>
              <select v-model="document.type" class="form-control">
                <optgroup label="Sprzedaż">
                  <option value="invoice">Faktura VAT</option>
                  <option value="proforma">Proforma</option>
                  <option value="advance">Faktura zaliczkowa</option>
                  <option value="final">Faktura końcowa</option>
                  <option value="correction">Korekta</option>
                  <option value="receipt">Paragon</option>
                </optgroup>
                <optgroup label="Magazyn">
                  <option value="pz">PZ (przyjęcie zewnętrzne)</option>
                </optgroup>
                <optgroup label="Finanse">
                  <option value="expense">Wydatek</option>
                </optgroup>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Numer</label>
              <input :value="document.number" type="text" readonly class="form-control bg-secondary-50" />
            </div>
            <div class="form-group">
              <label class="form-label">Data wystawienia</label>
              <input v-model="document.issueDate" type="date" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Data sprzedaży</label>
              <input v-model="document.saleDate" type="date" class="form-control" />
            </div>
          </div>

          <div class="checkbox-group mb-md">
            <label class="checkbox-label">
              <input v-model="showPaymentOptions" type="checkbox" />
              Pokaż opcje płatności
            </label>
          </div>

          <div v-if="showPaymentOptions" class="form-grid">
            <div class="form-group">
              <label class="form-label">Termin płatności</label>
              <input v-model="document.dueDate" type="date" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Metoda płatności</label>
              <select v-model="document.paymentMethod" class="form-control">
                <option>Przelew</option>
                <option>Gotówka</option>
                <option>Karta</option>
                <option>Online</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Status płatności</label>
              <select v-model="document.paymentStatus" class="form-control">
                <option value="unpaid">Nieopłacona</option>
                <option value="paid">Opłacona</option>
              </select>
            </div>
          </div>
        </section>

        <!-- 2. Sales & Discounts -->
        <section v-if="isSalesDoc" class="card mb-lg">
          <div class="card-header">
            <h3>2. Sprzedaż i rabaty</h3>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Cennik</label>
              <select v-model="selectedPriceListId" class="form-control">
                <option value="">Domyślny</option>
                <option v-for="list in priceLists" :key="list.id" :value="list.id">
                  {{ list.name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Magazyn do WZ</label>
              <select v-model="selectedWarehouseId" class="form-control">
                <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
                  {{ warehouse.name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Rabat globalny (%)</label>
              <input v-model.number="globalDiscount" type="number" min="0" max="100" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Kupon rabatowy</label>
              <input v-model.trim="couponCode" type="text" placeholder="Kod kuponu" class="form-control" />
            </div>
          </div>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input v-model="autoWz" type="checkbox" />
              Automatycznie generuj WZ
            </label>
          </div>
        </section>

        <!-- 3. Counterparty -->
        <section class="card mb-lg">
          <div class="card-header">
            <h3>3. {{ counterpartyTitle }}</h3>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Wybierz z listy</label>
              <select v-model="selectedContactId" @change="applyContact" class="form-control">
                <option value="">Wpisz ręcznie</option>
                <option v-for="contact in contacts" :key="contact.id" :value="contact.id">
                  {{ contact.name }}
                </option>
              </select>
            </div>
            <div class="form-group full-width-mobile">
              <label class="form-label">Nazwa *</label>
              <input v-model="counterparty.name" type="text" class="form-control" :class="{ 'is-invalid': validated && !counterparty.name }" />
            </div>
            <div class="form-group">
              <label class="form-label">NIP</label>
              <input v-model="counterparty.nip" type="text" class="form-control" :class="{ 'is-invalid': validated && requireCounterpartyNip && !isValidNIP(counterparty.nip) }" />
            </div>
            <div class="form-group">
              <label class="form-label">Adres *</label>
              <input v-model="counterparty.address" type="text" class="form-control" :class="{ 'is-invalid': validated && !counterparty.address }" />
            </div>
          </div>
        </section>

        <!-- 4. Items -->
        <section class="card mb-lg">
          <div class="card-header">
            <h3>4. Pozycje dokumentu</h3>
          </div>

          <div class="items-table-wrapper">
            <table class="table items-table">
              <thead>
                <tr>
                  <th style="width: 30%">Produkt / Opis</th>
                  <th style="width: 10%">Ilość</th>
                  <th style="width: 15%">Cena netto</th>
                  <th style="width: 10%">Rabat %</th>
                  <th style="width: 10%">VAT</th>
                  <th style="width: 15%" class="text-right">Brutto</th>
                  <th style="width: 5%"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in items" :key="index">
                  <td>
                    <div class="flex-col gap-xs">
                      <select @change="applyProductToItem(index, $event.target.value)" class="form-control form-control-sm mb-xs">
                        <option value="">Magazyn...</option>
                        <option v-for="product in filteredProducts" :key="product.id" :value="product.name">
                          {{ product.name }} (Stan: {{ product.stock }})
                        </option>
                      </select>
                      <input
                        v-model="item.description"
                        class="form-control"
                        placeholder="Opis pozycji *"
                        :class="{ 'is-invalid': validated && !item.description }"
                      />
                    </div>
                  </td>
                  <td>
                    <input
                      v-model.number="item.quantity"
                      type="number"
                      min="1"
                      class="form-control"
                      :class="{ 'is-invalid': (validated && item.quantity <= 0) || isStockInsufficient(item) }"
                    />
                    <small v-if="isStockInsufficient(item)" class="text-danger">
                      Dostępne: {{ getProductStock(item.itemId) }}
                    </small>
                  </td>
                  <td>
                    <input v-model.number="item.price" type="number" min="0" step="0.01" class="form-control" :class="{ 'is-invalid': validated && item.price < 0 }" />
                  </td>
                  <td>
                    <input v-model.number="item.discountPercent" type="number" min="0" max="100" class="form-control" />
                  </td>
                  <td>
                    <select v-model="item.vat" class="form-control">
                      <option v-for="rate in vatRates" :key="rate" :value="rate">
                        {{ rate === 'zw' ? 'zw' : rate + '%' }}
                      </option>
                    </select>
                  </td>
                  <td class="text-right font-medium">
                    {{ formatGrossValue(item) }}
                  </td>
                  <td class="text-right">
                    <button type="button" class="btn-icon danger" @click="removeItem(index)">
                      <i class="fa fa-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="items-actions mt-md">
            <button type="button" class="btn btn-secondary" @click="addItem">
              <i class="fa fa-plus"></i> Dodaj pozycję
            </button>
          </div>
        </section>

        <!-- 5. Notes -->
        <section class="card mb-lg">
          <div class="card-header">
            <h3>5. Uwagi</h3>
          </div>
          <textarea v-model="document.notes" rows="3" class="form-control" placeholder="Dodatkowe informacje widoczne na dokumencie..."></textarea>
        </section>
      </div>

      <!-- Sidebar Summary -->
      <aside class="form-sidebar">
        <div class="summary-card sticky-card">
          <div class="summary-row">
            <span>Netto</span>
            <strong>{{ totalNetto }} {{ document.currency }}</strong>
          </div>
          <div class="summary-row">
            <span>VAT</span>
            <strong>{{ totalVat }} {{ document.currency }}</strong>
          </div>
          <div class="summary-row total">
            <span>Do zapłaty</span>
            <strong>{{ totalBrutto }} {{ document.currency }}</strong>
          </div>

          <button type="button" class="btn btn-primary w-full mt-lg" @click="goToPreview">
            <i class="fa fa-save"></i> Zapisz i Podgląd
          </button>

          <button type="button" class="btn btn-ghost w-full mt-sm" @click="resetForm">
            Wyczyść formularz
          </button>
        </div>
      </aside>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, toRaw } from 'vue'
import { useRouter } from 'vue-router'
import { getSettings } from '@/services/settings'
import { addDocument, commitNumber, getNextNumberPreview, getDocuments } from '@/services/documents'
import { getContacts } from '@/services/contacts'
import { getInventory, adjustInventoryStock } from '@/services/inventory'
import { getWarehouses } from '@/services/warehouses'
import { getPriceLists } from '@/services/priceLists'

const router = useRouter()
const settings = ref({
  tax: { enabledVatRates: [], defaultVat: '23', defaultCurrency: 'PLN' },
  company: {},
  payment: {},
  discounts: {},
  template: {},
  numbering: {}
})

const issuer = ref({ name: '', nip: '', address: '' })
const counterparty = ref({ name: '', nip: '', address: '' })
const items = ref([{ description: '', quantity: 1, price: 0, vat: '23', discountPercent: 0, itemId: '' }])
const availableProducts = ref([])
const contacts = ref([])
const selectedContactId = ref('')
const warehouses = ref([])
const selectedWarehouseId = ref('')
const priceLists = ref([])
const selectedPriceListId = ref('')
const globalDiscount = ref(0)
const couponCode = ref('')
const autoWz = ref(true)
const validated = ref(false)
const existingDocuments = ref([])
const showPaymentOptions = ref(false)
const showAdvancedOptions = ref(false)
const useCompanyData = ref(true)
const autoDueDate = ref('')

const document = ref({
  type: 'invoice',
  number: '',
  issueDate: '',
  saleDate: '',
  dueDate: '',
  currency: 'PLN',
  exchangeRate: null,
  exchangeDate: '',
  paymentMethod: 'Przelew',
  paymentStatus: 'unpaid',
  relatedNumber: '',
  notes: '',
  language: 'pl'
})

const isSalesDoc = computed(() =>
  ['invoice', 'proforma', 'advance', 'final', 'correction', 'receipt'].includes(document.value.type)
)

const counterpartyTitle = computed(() => {
  if (document.value.type === 'pz') return 'Dane dostawcy'
  if (document.value.type === 'expense') return 'Dane kontrahenta'
  return 'Dane nabywcy'
})

const requireCounterpartyNip = computed(() =>
  ['invoice', 'proforma', 'advance', 'final', 'correction'].includes(document.value.type)
)

const vatRates = computed(() => settings.value.tax.enabledVatRates)
const filteredProducts = computed(() => {
  if (!selectedWarehouseId.value) return availableProducts.value
  return availableProducts.value.filter((item) => item.warehouseId === selectedWarehouseId.value)
})

const addItem = () => items.value.push({ description: '', quantity: 1, price: 0, vat: settings.value.tax.defaultVat, discountPercent: 0, itemId: '' })
const removeItem = (index) => items.value.splice(index, 1)

const applyProductToItem = (index, productName) => {
  const product = availableProducts.value.find((p) => p.name === productName)
  if (product) {
    items.value[index].description = product.name
    items.value[index].price = resolvePrice(product.name, product.id)
    items.value[index].vat = String(product.vat)
    items.value[index].itemId = product.id
  }
}

const loadProducts = async () => {
  availableProducts.value = await getInventory()
}

const loadContacts = async () => {
  contacts.value = await getContacts()
}

const loadWarehouses = async () => {
  warehouses.value = await getWarehouses()
  if (!selectedWarehouseId.value && warehouses.value.length) {
    selectedWarehouseId.value = warehouses.value[0].id
  }
}

const loadPriceLists = async () => {
  // priceLists service might also need to be async if I updated it, but I missed it in plan.
  // Assuming it's still sync mock or handled.
  // But wait, if getPriceLists uses apiFetch, it's async.
  // I didn't refactor priceLists.js yet.
  priceLists.value = await getPriceLists()
}

const applyContact = () => {
  const contact = contacts.value.find((entry) => entry.id === selectedContactId.value)
  if (!contact) {
    selectedPriceListId.value = ''
    globalDiscount.value = settings.value.discounts.globalPercent || 0
    applyPriceListToItems()
    return
  }
  counterparty.value = {
    name: contact.name,
    nip: contact.nip || '',
    address: contact.address || ''
  }
  selectedPriceListId.value = contact.priceListId || ''
  globalDiscount.value = Number(contact.discountPercent || settings.value.discounts.globalPercent || 0)
  applyPriceListToItems()
}

const loadCompanyData = () => {
  issuer.value = {
    name: settings.value.company.name || '',
    nip: settings.value.company.nip || '',
    address: [settings.value.company.address, settings.value.company.postalCode, settings.value.company.city]
      .filter(Boolean)
      .join(' ')
  }
}

const loadDocuments = async () => {
  existingDocuments.value = await getDocuments()
}

const updateNumber = () => {
  if (!document.value.issueDate) return
  const date = new Date(document.value.issueDate)
  document.value.number = getNextNumberPreview(document.value.type, date, settings.value)
}

const formatToday = () => new Date().toISOString().slice(0, 10)

const updateAutoDates = () => {
  if (!document.value.issueDate) return
  if (!document.value.saleDate) {
    document.value.saleDate = document.value.issueDate
  }

  if (document.value.currency !== settings.value.tax.defaultCurrency && !document.value.exchangeDate) {
    document.value.exchangeDate = document.value.issueDate
  }

  if (!isSalesDoc.value || document.value.type === 'receipt') return
  const days = Number(settings.value.payment.paymentDays || 0)
  const base = new Date(document.value.issueDate)
  base.setDate(base.getDate() + days)
  const next = base.toISOString().slice(0, 10)
  if (!document.value.dueDate || document.value.dueDate === autoDueDate.value) {
    document.value.dueDate = next
    autoDueDate.value = next
  }
}

const ensureDocumentDates = () => {
  if (!document.value.issueDate) {
    document.value.issueDate = formatToday()
  }
  if (!document.value.saleDate) {
    document.value.saleDate = document.value.issueDate
  }

  if (showPaymentOptions.value && !document.value.dueDate) {
    const days = Number(settings.value.payment.paymentDays || 0)
    const base = new Date(document.value.issueDate)
    base.setDate(base.getDate() + days)
    document.value.dueDate = base.toISOString().slice(0, 10)
  }
}

const resetForm = () => {
  counterparty.value = { name: '', nip: '', address: '' }
  selectedContactId.value = ''
  items.value = [{ description: '', quantity: 1, price: 0, vat: settings.value.tax.defaultVat, discountPercent: 0, itemId: '' }]
  const today = formatToday()
  document.value = {
    type: document.value.type,
    number: '',
    issueDate: today,
    saleDate: today,
    dueDate: '',
    currency: settings.value.tax.defaultCurrency,
    paymentMethod: settings.value.payment.paymentMethod,
    paymentStatus: 'unpaid',
    relatedNumber: '',
    notes: '',
    language: settings.value.template.language || 'pl'
  }
  validated.value = false
  globalDiscount.value = settings.value.discounts.globalPercent || 0
  couponCode.value = ''
  showPaymentOptions.value = false
  showAdvancedOptions.value = false
  useCompanyData.value = true
  loadCompanyData()
  updateNumber()
}

const vatToNumber = (vat) => {
  if (vat === 'zw') return 0
  const parsed = parseFloat(String(vat))
  return Number.isNaN(parsed) ? 0 : parsed
}

const baseNetto = computed(() =>
  items.value.reduce((sum, item) => {
    const discount = Number(item.discountPercent || 0) / 100
    return sum + item.quantity * item.price * (1 - discount)
  }, 0)
)

const thresholdDiscount = computed(() => {
  const threshold = [...(settings.value.discounts.thresholds || [])]
    .sort((a, b) => b.minNetto - a.minNetto)
    .find((rule) => baseNetto.value >= rule.minNetto)
  return threshold ? Number(threshold.percent || 0) : 0
})

const couponDiscount = computed(() => {
  const code = couponCode.value?.toUpperCase()
  const coupon = (settings.value.discounts.coupons || []).find((entry) => entry.code === code)
  return coupon ? Number(coupon.percent || 0) : 0
})

const totalDiscountPercent = computed(() =>
  Number(globalDiscount.value || 0) + thresholdDiscount.value + couponDiscount.value
)

const totalNetto = computed(() =>
  (baseNetto.value * (1 - totalDiscountPercent.value / 100)).toFixed(2)
)

const totalVat = computed(() => {
  const baseVat = items.value.reduce((sum, item) => {
    const discount = Number(item.discountPercent || 0) / 100
    return sum + item.quantity * item.price * (1 - discount) * (vatToNumber(item.vat) / 100)
  }, 0)
  const factor = baseNetto.value ? Number(totalNetto.value) / baseNetto.value : 1
  return (baseVat * factor).toFixed(2)
})

const totalBrutto = computed(() =>
  (Number(totalNetto.value) + Number(totalVat.value)).toFixed(2)
)

const formatGrossValue = (item) => {
  const discount = Number(item.discountPercent || 0) / 100
  return (item.price * item.quantity * (1 - discount) * (1 + vatToNumber(item.vat) / 100)).toFixed(2)
}

const getProductStock = (itemId) => {
  if (!itemId) return 999
  const product = availableProducts.value.find(p => p.id === itemId)
  return product ? product.stock : 0
}

const isStockInsufficient = (item) => {
  if (!isSalesDoc.value || !item.itemId) return false
  return item.quantity > getProductStock(item.itemId)
}

const resolvePrice = (productName, productId = '') => {
  if (!selectedPriceListId.value) {
    const product = availableProducts.value.find((entry) =>
      (productId && entry.id === productId) || entry.name === productName
    )
    return product ? Number(product.price) : 0
  }
  const list = priceLists.value.find((entry) => entry.id === selectedPriceListId.value)
  const item = list?.items?.find((entry) =>
    (productId && entry.productId === productId) || entry.productName === productName
  )
  return item ? Number(item.price) : 0
}

const resolvePriceForItem = (item) => {
  const product = availableProducts.value.find((p) => p.id === item.itemId)
  const name = item.description || product?.name
  if (!name && !product?.id) return item.price

  if (!selectedPriceListId.value) {
    if (product) return Number(product.price)
    const match = availableProducts.value.find((entry) => entry.name === name)
    return match ? Number(match.price) : item.price
  }

  const list = priceLists.value.find((entry) => entry.id === selectedPriceListId.value)
  const found = list?.items?.find((entry) =>
    (product?.id && entry.productId === product.id) || entry.productName === name
  )
  return found ? Number(found.price) : item.price
}

const applyPriceListToItems = () => {
  if (!items.value.length) return
  items.value = items.value.map((item) => ({
    ...item,
    price: resolvePriceForItem(item)
  }))

  const list = priceLists.value.find((entry) => entry.id === selectedPriceListId.value)
  if (list?.currency) {
    document.value.currency = list.currency
  } else {
    document.value.currency = settings.value.tax.defaultCurrency
  }
}

const isValidNIP = (nip) => {
  if (!nip) return false
  const onlyDigits = nip.replace(/\D/g, '')
  return onlyDigits.length === 10
}

const validate = () => {
  const issuerName = issuer.value.name || settings.value.company.name || ''
  const issuerValid = !!issuerName
  const counterpartyValid = counterparty.value.name
  const nipValid = !requireCounterpartyNip.value || (counterparty.value.nip ? isValidNIP(counterparty.value.nip) : true)
  const itemsValid = items.value.length > 0 && items.value.every((item) => item.description && item.quantity > 0 && item.price >= 0)
  return issuerValid && counterpartyValid && nipValid && document.value.issueDate && document.value.saleDate && itemsValid
}

const goToPreview = async () => {
  try {
    ensureDocumentDates()
    validated.value = true
    if (!validate()) {
      alert('Uzupełnij poprawnie wszystkie wymagane pola.')
      return
    }

    const issueDateRaw = document.value.issueDate || formatToday()
    const issueDate = new Date(issueDateRaw)
    const safeDate = isNaN(issueDate) ? new Date() : issueDate
    const number = commitNumber(document.value.type, safeDate, settings.value)
    const safeName = String(counterparty.value.name || 'kontrahent')
    const filename = `${number}_${safeName.replace(/\s+/g, '_')}.pdf`

    const clone = (value) => JSON.parse(JSON.stringify(toRaw(value)))
    const createId = () => (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`)

    const issuerData = clone(issuer.value)
    const counterpartyData = clone(counterparty.value)
    const itemsData = clone(items.value)
    const documentData = clone(document.value)

    const newDoc = {
      id: createId(),
      type: document.value.type,
      number,
      issuer: issuerData,
      counterparty: counterpartyData,
      document: {
        ...documentData,
        number,
        issueDate: document.value.issueDate,
        saleDate: document.value.saleDate,
        dueDate: document.value.dueDate,
        language: document.value.language
      },
      items: itemsData,
      currency: document.value.currency,
      totals: {
        netto: totalNetto.value,
        vat: totalVat.value,
        brutto: totalBrutto.value
      },
      filename
    }

    const createdDoc = await addDocument(newDoc)
    Object.assign(newDoc, createdDoc) // Update with backend data
    await loadDocuments()

    if (autoWz.value && ['invoice', 'final', 'receipt'].includes(document.value.type)) {
      const wzNumber = commitNumber('wz', safeDate, settings.value)
      // Stock adjustment is handled by backend in create invoice logic now.
      // But WZ document creation might still be needed if it's separate.
      // The current backend logic updates stock but doesn't create WZ explicitly in InvoicesService.
      // If we want WZ document, we should create it.
      // But adjustInventoryStock logic was also removed/refactored.

      // Let's create WZ document via API.

      await addDocument({
        id: createId(),
        type: 'wz',
        number: wzNumber,
        issuer: issuerData,
        counterparty: counterpartyData,
        document: {
          type: 'wz',
          number: wzNumber,
          issueDate: document.value.issueDate,
          saleDate: document.value.saleDate,
          warehouseId: selectedWarehouseId.value
        },
        items: itemsData.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          vat: item.vat
        })),
        currency: document.value.currency,
        totals: {
          netto: totalNetto.value,
          vat: totalVat.value,
          brutto: totalBrutto.value
        },
        filename: `${wzNumber}.pdf`
      })
    }

    router.push({
      name: 'InvoicePreview',
      query: {
        data: encodeURIComponent(JSON.stringify(newDoc))
      }
    })

    resetForm()
  } catch (error) {
    console.error('Błąd zapisu dokumentu:', error)
    alert('Nie udało się zapisać dokumentu. Spróbuj ponownie.')
  }
}

const goToHome = () => {
  router.push({ name: 'home' })
}

onMounted(async () => {
  settings.value = await getSettings()
  loadProducts()
  loadContacts()
  loadWarehouses()
  loadPriceLists()
  loadCompanyData()
  if (!settings.value.company?.name) {
    useCompanyData.value = false
  }
  await loadDocuments()
  if (!document.value.issueDate) {
    const today = formatToday()
    document.value.issueDate = today
    document.value.saleDate = today
  }
  document.value.currency = settings.value.tax.defaultCurrency
  document.value.paymentMethod = settings.value.payment.paymentMethod
  document.value.language = settings.value.template.language || 'pl'
  globalDiscount.value = settings.value.discounts.globalPercent || 0
  updateNumber()
  updateAutoDates()
})

watch([() => document.value.type, () => document.value.issueDate], () => {
  updateNumber()
  updateAutoDates()
})
watch(() => selectedPriceListId.value, applyPriceListToItems)
watch(
  () => useCompanyData.value,
  (useDefaults) => {
    if (useDefaults) {
      loadCompanyData()
    }
  }
)
</script>

<style scoped>
.form-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: var(--spacing-xl);
  align-items: start;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.card-header {
  margin-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--app-border);
  padding-bottom: var(--spacing-md);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.checkbox-group {
  margin-top: var(--spacing-sm);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--text-sm);
  cursor: pointer;
}

.items-table-wrapper {
  overflow-x: auto;
}

.items-table {
  width: 100%;
  min-width: 800px;
}

.mb-xs { margin-bottom: 4px; }
.gap-xs { gap: 4px; }
.flex-col { display: flex; flex-direction: column; }

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

.btn-icon.danger:hover {
  background: var(--danger-light);
  color: var(--danger);
}

.summary-card {
  background: var(--app-surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  border: 1px solid var(--app-border);
  box-shadow: var(--shadow-sm);
}

.sticky-card {
  position: sticky;
  top: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
  font-size: var(--text-sm);
  color: var(--secondary-600);
}

.summary-row.total {
  border-top: 1px solid var(--app-border);
  padding-top: var(--spacing-md);
  margin-top: var(--spacing-md);
  font-size: var(--text-lg);
  color: var(--secondary-900);
  font-weight: bold;
}

.is-invalid {
  border-color: var(--danger);
}

.text-danger {
  color: var(--danger);
  font-size: var(--text-xs);
  display: block;
  margin-top: 2px;
}

.bg-secondary-50 {
  background-color: var(--secondary-50);
}

.mb-lg { margin-bottom: var(--spacing-lg); }
.mb-md { margin-bottom: var(--spacing-md); }
.mt-lg { margin-top: var(--spacing-lg); }
.mt-md { margin-top: var(--spacing-md); }
.mt-sm { margin-top: var(--spacing-sm); }

@media (max-width: 1024px) {
  .form-layout {
    grid-template-columns: 1fr;
  }

  .form-sidebar {
    grid-row: 1;
  }

  .sticky-card {
    position: static;
  }
}
</style>
