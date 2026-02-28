<template>
  <div class="settings-page">
    <div class="actions-bar">
      <div>
        <!-- Title handled by TopBar -->
      </div>

      <div class="action-buttons">
        <button class="btn btn-primary" @click="saveSettings">
          <i class="fa fa-save"></i> Zapisz ustawienia
        </button>
      </div>
    </div>

    <div class="settings-layout">
      <!-- Settings Navigation -->
      <aside class="settings-nav card">
        <h3>Kategorie</h3>
        <nav>
          <button
            v-for="section in sections"
            :key="section.id"
            class="nav-link"
            :class="{ active: activeSection === section.id }"
            @click="activeSection = section.id"
          >
            <i :class="section.icon"></i>
            {{ section.label }}
          </button>
        </nav>
      </aside>

      <!-- Settings Content -->
      <div class="settings-content">
        <!-- Appearance & Personalization -->
        <section v-if="activeSection === 'appearance'" class="card" :class="{ 'skeleton-container': isLoading }">
          <div class="card-header">
            <h3>Wygląd i personalizacja</h3>
          </div>
          <div v-if="isLoading" class="skeleton skeleton-text medium mb-lg"></div>
          <div v-if="isLoading" class="skeleton skeleton-text short"></div>

          <template v-if="!isLoading">

          <div class="form-group mb-lg">
            <label class="form-label">Motyw główny (Dark Mode)</label>
            <div class="theme-toggle-group">
              <button
                class="btn"
                :class="isDarkMode ? 'btn-ghost' : 'btn-primary'"
                @click="setDarkMode(false)"
              >
                <i class="fa fa-sun-o"></i> Jasny
              </button>
              <button
                class="btn"
                :class="isDarkMode ? 'btn-primary' : 'btn-ghost'"
                @click="setDarkMode(true)"
              >
                <i class="fa fa-moon-o"></i> Ciemny
              </button>
            </div>
          </div>

          <div class="form-group mb-lg">
            <label class="form-label">Kolor wiodący</label>
            <div class="color-swatches">
              <button
                v-for="color in colorOptions"
                :key="color.value"
                class="swatch"
                :class="[color.bgClass, { active: currentColor === color.value }]"
                @click="setColorTheme(color.value)"
                :title="color.label"
              ></button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Gęstość interfejsu</label>
            <select v-model="currentDensity" @change="setDensity(currentDensity)" class="form-control w-auto">
              <option value="compact">Kompaktowy</option>
              <option value="comfortable">Wygodny (Domyślny)</option>
              <option value="spacious">Przestronny</option>
            </select>
          </div>
          </template>
        </section>

        <!-- Company -->
        <section v-if="activeSection === 'company'" class="card">
          <div class="card-header">
            <h3>Dane firmy</h3>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Nazwa firmy</label>
              <input v-model.trim="settings.company.name" type="text" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">NIP</label>
              <input v-model.trim="settings.company.nip" type="text" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">REGON</label>
              <input v-model.trim="settings.company.regon" type="text" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Ulica i numer</label>
              <input v-model.trim="settings.company.address" type="text" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Kod pocztowy</label>
              <input v-model.trim="settings.company.postalCode" type="text" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Miasto</label>
              <input v-model.trim="settings.company.city" type="text" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Kraj</label>
              <input v-model.trim="settings.company.country" type="text" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Telefon</label>
              <input v-model.trim="settings.company.phone" type="text" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">E-mail</label>
              <input v-model.trim="settings.company.email" type="email" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Strona WWW</label>
              <input v-model.trim="settings.company.website" type="text" class="form-control" />
            </div>
          </div>
        </section>

        <!-- Branding -->
        <section v-if="activeSection === 'branding'" class="card">
          <div class="card-header">
            <h3>Branding i szablon</h3>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Logo firmy</label>
              <input type="file" @change="handleLogoUpload" accept="image/png, image/jpeg" class="form-control" />
              <div v-if="settings.template.logo" class="logo-preview mt-sm">
                <img :src="settings.template.logo" alt="Logo" class="preview-img" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Kolor akcentu</label>
              <div class="color-picker-wrapper">
                <input v-model="settings.template.accentColor" type="color" class="color-input" />
                <span class="color-value">{{ settings.template.accentColor }}</span>
              </div>
            </div>
            <div class="form-group full-width">
              <label class="form-label">Stopka dokumentu</label>
              <textarea v-model.trim="settings.template.footerNote" rows="3" class="form-control"></textarea>
            </div>
            <div class="form-group full-width">
              <label class="checkbox-label">
                <input v-model="settings.template.showPaymentInfo" type="checkbox" />
                Pokazuj informacje o płatności na dokumentach
              </label>
            </div>
            <div class="form-group">
              <label class="form-label">Język dokumentów</label>
              <select v-model="settings.template.language" class="form-control">
                <option value="pl">Polski</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </section>

        <!-- Discounts -->
        <section v-if="activeSection === 'discounts'" class="card">
          <div class="card-header">
            <h3>Rabaty i kupony</h3>
          </div>
          <div class="form-group mb-lg">
            <label class="form-label">Rabat globalny (%)</label>
            <input v-model.number="settings.discounts.globalPercent" type="number" min="0" max="100" class="form-control w-32" />
          </div>

          <div class="mb-lg">
            <h4>Rabaty progowe</h4>
            <div class="chip-list mb-sm">
              <span v-for="(rule, index) in settings.discounts.thresholds" :key="index" class="chip">
                od {{ rule.minNetto }} PLN → {{ rule.percent }}%
                <button class="chip-remove" @click="removeThreshold(index)">&times;</button>
              </span>
            </div>
            <div class="inline-form">
              <input v-model.number="thresholdForm.minNetto" type="number" min="0" placeholder="Próg netto" class="form-control" />
              <input v-model.number="thresholdForm.percent" type="number" min="0" max="100" placeholder="Rabat %" class="form-control" />
              <button class="btn btn-secondary" @click="addThreshold">Dodaj</button>
            </div>
          </div>

          <div>
            <h4>Kupony</h4>
            <div class="chip-list mb-sm">
              <span v-for="(coupon, index) in settings.discounts.coupons" :key="index" class="chip">
                {{ coupon.code }} → {{ coupon.percent }}%
                <button class="chip-remove" @click="removeCoupon(index)">&times;</button>
              </span>
            </div>
            <div class="inline-form">
              <input v-model.trim="couponForm.code" type="text" placeholder="Kod kuponu" class="form-control" />
              <input v-model.number="couponForm.percent" type="number" min="0" max="100" placeholder="Rabat %" class="form-control" />
              <button class="btn btn-secondary" @click="addCoupon">Dodaj</button>
            </div>
          </div>
        </section>

        <!-- Numbering -->
        <section v-if="activeSection === 'numbering'" class="card">
          <div class="card-header">
            <h3>Numeracja dokumentów</h3>
          </div>
          <div class="form-grid dense">
            <div class="form-group">
              <label class="form-label">Start numeracji</label>
              <input v-model.number="settings.numbering.startNumber" type="number" min="1" class="form-control" />
            </div>
            <div class="form-group">
              <label class="checkbox-label mt-md">
                <input v-model="settings.numbering.resetYearly" type="checkbox" />
                Resetuj co rok
              </label>
            </div>
            <div class="form-group" v-for="(label, key) in numberingLabels" :key="key">
              <label class="form-label">{{ label }}</label>
              <input v-model.trim="settings.numbering[key]" type="text" class="form-control" />
            </div>
          </div>
        </section>

        <!-- Tax & Currency -->
        <section v-if="activeSection === 'tax'" class="card">
          <div class="card-header">
            <h3>Stawki VAT i waluty</h3>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Domyślna stawka VAT</label>
              <select v-model="settings.tax.defaultVat" class="form-control">
                <option v-for="rate in vatOptions" :key="rate.value" :value="rate.value">
                  {{ rate.label }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Domyślna waluta</label>
              <select v-model="settings.tax.defaultCurrency" class="form-control">
                <option v-for="currency in currencyOptions" :key="currency" :value="currency">
                  {{ currency }}
                </option>
              </select>
            </div>
          </div>
        </section>

        <!-- Payments -->
        <section v-if="activeSection === 'payments'" class="card">
          <div class="card-header">
            <h3>Płatności i bank</h3>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Nazwa banku</label>
              <input v-model.trim="settings.payment.bankName" type="text" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Numer rachunku (IBAN)</label>
              <input v-model.trim="settings.payment.bankAccount" type="text" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Termin płatności (dni)</label>
              <input v-model.number="settings.payment.paymentDays" type="number" min="0" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Domyślny sposób płatności</label>
              <select v-model="settings.payment.paymentMethod" class="form-control">
                <option>Przelew</option>
                <option>Gotówka</option>
                <option>Karta</option>
                <option>Online</option>
              </select>
            </div>
          </div>
        </section>

        <!-- Permissions -->
        <section v-if="activeSection === 'permissions'" class="card">
          <div class="card-header">
            <h3>Role i uprawnienia</h3>
          </div>
          <div class="permissions-grid">
            <div v-for="role in roles" :key="role" class="permission-column">
              <h4>{{ roleLabel(role) }}</h4>
              <div class="permissions-list">
                <label v-for="perm in permissionList" :key="perm.key" class="checkbox-label">
                  <input v-model="settings.permissions[role][perm.key]" type="checkbox" />
                  {{ perm.label }}
                </label>
              </div>
            </div>
          </div>
        </section>

        <!-- Users -->
        <section v-if="activeSection === 'users'" class="card">
          <div class="card-header">
            <h3>Użytkownicy i role</h3>
          </div>
          <div class="users-list">
            <div v-for="userItem in users" :key="userItem.email" class="user-row">
              <div class="user-info">
                <strong>{{ userItem.name }}</strong>
                <span class="text-muted">{{ userItem.email }}</span>
              </div>
              <select
                class="form-control w-auto"
                :value="userItem.role"
                @change="onUserRoleChange(userItem.email, $event.target.value)"
              >
                <option v-for="role in roles" :key="role" :value="role">
                  {{ roleLabel(role) }}
                </option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, toRaw, watch } from 'vue'
import { defaultSettings, getSettings, saveSettings as saveSettingsToStore } from '@/services/settings'
import { getUsers, updateUserRole } from '@/services/auth'
import { themePreferences, setDarkMode, setColorTheme, setDensity } from '@/services/theme'
import { useToast } from '@/services/toast'

const activeSection = ref('appearance')
const users = ref([])
const isLoading = ref(true)
let saveTimer = null
const toast = useToast()

const colorOptions = [
  { label: 'Indygo (Domyślny)', value: 'indigo', bgClass: 'bg-indigo' },
  { label: 'Szmaragdowy', value: 'emerald', bgClass: 'bg-emerald' },
  { label: 'Różany', value: 'rose', bgClass: 'bg-rose' },
  { label: 'Fioletowy', value: 'violet', bgClass: 'bg-violet' }
]

const isDarkMode = computed(() => themePreferences.value.isDarkMode)
const currentColor = computed(() => themePreferences.value.colorTheme)
const currentDensity = ref(themePreferences.value.density)

// Update density select whenever themePreferences changes globally
watch(() => themePreferences.value.density, (newVal) => {
  currentDensity.value = newVal
})

const sections = [
  { id: 'appearance', label: 'Wygląd', icon: 'fa fa-paint-brush' },
  { id: 'company', label: 'Dane firmy', icon: 'fa fa-building' },
  { id: 'branding', label: 'Szablon PDF', icon: 'fa fa-file-pdf-o' },
  { id: 'discounts', label: 'Rabaty', icon: 'fa fa-percent' },
  { id: 'numbering', label: 'Numeracja', icon: 'fa fa-list-ol' },
  { id: 'tax', label: 'Podatki i waluty', icon: 'fa fa-money' },
  { id: 'payments', label: 'Płatności', icon: 'fa fa-credit-card' },
  { id: 'permissions', label: 'Uprawnienia', icon: 'fa fa-lock' },
  { id: 'users', label: 'Użytkownicy', icon: 'fa fa-users' }
]

const numberingLabels = {
  invoicePrefix: 'Faktura VAT',
  proformaPrefix: 'Proforma',
  advancePrefix: 'Zaliczkowa',
  finalPrefix: 'Końcowa',
  correctionPrefix: 'Korekta',
  receiptPrefix: 'Paragon',
  pzPrefix: 'PZ',
  wzPrefix: 'WZ',
  rwPrefix: 'RW',
  mmPrefix: 'MM',
  inwPrefix: 'INW',
  soPrefix: 'Zam. Sprzedaży',
  poPrefix: 'Zam. Zakupu',
  rmaPrefix: 'Zwrot',
  expensePrefix: 'Wydatek'
}

const vatOptions = [
  { value: '23', label: '23%' },
  { value: '8', label: '8%' },
  { value: '5', label: '5%' },
  { value: '0', label: '0%' },
  { value: 'zw', label: 'zw' }
]

const currencyOptions = ['PLN', 'EUR', 'USD', 'GBP', 'CZK']

const permissionList = [
  { key: 'manageSettings', label: 'Ustawienia' },
  { key: 'manageUsers', label: 'Użytkownicy' },
  { key: 'manageDocuments', label: 'Dokumenty' },
  { key: 'createDocuments', label: 'Tworzenie' },
  { key: 'managePayments', label: 'Płatności' },
  { key: 'manageReports', label: 'Raporty' },
  { key: 'manageContacts', label: 'Kontrahenci' },
  { key: 'manageWarehouse', label: 'Magazyn' },
  { key: 'manageSalesOrders', label: 'Zam. Sprzedaży' },
  { key: 'managePurchaseOrders', label: 'Zam. Zakupu' },
  { key: 'managePicking', label: 'Picking' },
  { key: 'manageReturns', label: 'Zwroty' },
  { key: 'managePriceLists', label: 'Cenniki' }
]

const roleLabels = {
  OWNER: 'Właściciel',
  ACCOUNTANT: 'Księgowość',
  VIEWER: 'Podgląd'
}

const roleOrder = ['OWNER', 'ACCOUNTANT', 'VIEWER']

const settings = reactive(structuredClone(defaultSettings))

const roles = computed(() => {
  const existing = Object.keys(settings.permissions || {})
  const ordered = roleOrder.filter((role) => existing.includes(role))
  const rest = existing.filter((role) => !roleOrder.includes(role))
  return [...ordered, ...rest]
})

const roleLabel = (role) => roleLabels[role] ?? role

const thresholdForm = reactive({ minNetto: 0, percent: 0 })
const couponForm = reactive({ code: '', percent: 0 })

const loadSettings = () => {
  const parsed = getSettings()
  Object.assign(settings.company, parsed.company ?? {})
  Object.assign(settings.template, parsed.template ?? {})
  Object.assign(settings.numbering, parsed.numbering ?? {})
  Object.assign(settings.tax, parsed.tax ?? {})
  Object.assign(settings.payment, parsed.payment ?? {})
  Object.assign(settings.discounts, parsed.discounts ?? {})
  Object.assign(settings.ui, parsed.ui ?? {})
  Object.assign(settings.performance, parsed.performance ?? {})
  Object.assign(settings.mobileUx, parsed.mobileUx ?? {})
  settings.discounts.thresholds = parsed.discounts?.thresholds ?? settings.discounts.thresholds
  settings.discounts.coupons = parsed.discounts?.coupons ?? settings.discounts.coupons
  settings.permissions = parsed.permissions ?? settings.permissions
  ensureDefaults()
}

const loadUsers = () => {
  users.value = getUsers()
}

const ensureDefaults = () => {
  if (!settings.tax.enabledVatRates.includes(settings.tax.defaultVat)) {
    settings.tax.enabledVatRates.push(settings.tax.defaultVat)
  }
  if (!settings.tax.enabledCurrencies.includes(settings.tax.defaultCurrency)) {
    settings.tax.enabledCurrencies.push(settings.tax.defaultCurrency)
  }

  const defaults = defaultSettings.permissions
  Object.keys(defaults).forEach((role) => {
    if (!settings.permissions[role]) settings.permissions[role] = {}
    permissionList.forEach(({ key }) => {
      if (settings.permissions[role][key] === undefined) {
        settings.permissions[role][key] = !!defaults[role]?.[key]
      }
    })
  })
}

const addThreshold = () => {
  if (!thresholdForm.minNetto || !thresholdForm.percent) return
  settings.discounts.thresholds.push({
    minNetto: Number(thresholdForm.minNetto),
    percent: Number(thresholdForm.percent)
  })
  thresholdForm.minNetto = 0
  thresholdForm.percent = 0
}

const removeThreshold = (index) => {
  settings.discounts.thresholds.splice(index, 1)
}

const addCoupon = () => {
  if (!couponForm.code || !couponForm.percent) return
  settings.discounts.coupons.push({
    code: couponForm.code.toUpperCase(),
    percent: Number(couponForm.percent)
  })
  couponForm.code = ''
  couponForm.percent = 0
}

const removeCoupon = (index) => {
  settings.discounts.coupons.splice(index, 1)
}

const saveSettings = async () => {
  ensureDefaults()
  try {
    const payload = JSON.parse(JSON.stringify(toRaw(settings)))
    await saveSettingsToStore(payload)
    toast.success('Ustawienia zapisane!')
    window.dispatchEvent(new Event('permissions-updated'))
  } catch (error) {
    toast.error('Nie udało się zapisać ustawień.')
  }
}

const autoSave = () => {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    try {
      const payload = JSON.parse(JSON.stringify(toRaw(settings)))
      await saveSettingsToStore(payload)
      window.dispatchEvent(new Event('permissions-updated'))
    } catch {
      // ignore
    }
  }, 500)
}

const onUserRoleChange = async (email, role) => {
  await updateUserRole(email, role)
  loadUsers()
}

const handleLogoUpload = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    settings.template.logo = reader.result
  }
  reader.readAsDataURL(file)
}

onMounted(() => {
  setTimeout(() => {
    loadSettings()
    loadUsers()
    isLoading.value = false
  }, 400)
})

watch(settings, autoSave, { deep: true })
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: var(--spacing-xl);
  align-items: start;
}

.settings-nav {
  padding: var(--spacing-md);
  position: sticky;
  top: 20px;
}

.settings-nav h3 {
  font-size: var(--text-sm);
  text-transform: uppercase;
  color: var(--secondary-500);
  margin-bottom: var(--spacing-md);
  padding-left: var(--spacing-sm);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  color: var(--secondary-600);
  font-weight: var(--font-medium);
  text-align: left;
  transition: all var(--transition-fast);
  margin-bottom: 2px;
  position: relative;
  overflow: hidden;
}

.nav-link::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background: var(--primary-500);
  transform: translateX(-100%);
  transition: transform var(--transition-fast);
}

.nav-link:hover {
  background: var(--secondary-50);
  color: var(--primary-600);
  transform: translateX(4px);
}

.nav-link.active {
  background: var(--primary-50);
  color: var(--primary-700);
  font-weight: var(--font-bold);
}

.nav-link.active::before {
  transform: translateX(0);
}

.nav-link i {
  width: 20px;
  text-align: center;
}

.card-header {
  margin-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--app-border);
  padding-bottom: var(--spacing-md);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.form-grid.dense {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.full-width {
  grid-column: 1 / -1;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  font-size: var(--text-sm);
}

.logo-preview {
  margin-top: var(--spacing-sm);
  max-width: 200px;
  border: 1px solid var(--app-border);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
}

.preview-img {
  max-width: 100%;
  height: auto;
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.color-input {
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  overflow: hidden;
  cursor: pointer;
}

.color-value {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--secondary-600);
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.chip {
  background: var(--secondary-100);
  padding: 4px 8px;
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chip-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--secondary-500);
  font-size: 16px;
  line-height: 1;
  padding: 0;
}

.inline-form {
  display: flex;
  gap: var(--spacing-sm);
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-xl);
}

.permission-column h4 {
  margin-bottom: var(--spacing-md);
  font-size: var(--text-sm);
  color: var(--secondary-600);
  text-transform: uppercase;
  font-weight: var(--font-bold);
}

.permissions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.users-list {
  display: flex;
  flex-direction: column;
}

.user-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--app-border);
}

.user-row:last-child {
  border-bottom: none;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.w-32 { width: 8rem; }
.w-auto { width: auto; }
.mt-sm { margin-top: var(--spacing-sm); }
.mt-md { margin-top: var(--spacing-md); }
.mb-sm { margin-bottom: var(--spacing-sm); }
.mb-lg { margin-bottom: var(--spacing-lg); }

.theme-toggle-group {
  display: inline-flex;
  gap: var(--spacing-sm);
  background: var(--secondary-100);
  padding: 4px;
  border-radius: var(--radius-full);
}

.theme-toggle-group .btn {
  border-radius: var(--radius-full);
}

.color-swatches {
  display: flex;
  gap: var(--spacing-md);
}

.swatch {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform var(--transition-bounce), border-color var(--transition-fast);
}

.swatch:hover {
  transform: scale(1.1);
}

.swatch.active {
  border-color: var(--app-text);
  transform: scale(1.15);
  box-shadow: var(--shadow-md);
}

.bg-indigo { background-color: #6366f1; }
.bg-emerald { background-color: #10b981; }
.bg-rose { background-color: #f43f5e; }
.bg-violet { background-color: #8b5cf6; }

@media (max-width: 768px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }

  .settings-nav {
    position: static;
    margin-bottom: var(--spacing-lg);
  }
}
</style>
