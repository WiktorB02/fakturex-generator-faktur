import { getItem, setItem } from '@/services/secureStore'

const SETTINGS_KEY = 'settings'

export const defaultSettings = {
  company: {
    name: '',
    nip: '',
    regon: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'Polska',
    phone: '',
    email: '',
    website: ''
  },
  template: {
    logo: '',
    accentColor: '#6366f1',
    footerNote: 'Dziękujemy za współpracę!',
    showPaymentInfo: true,
    layout: 'classic',
    language: 'pl',
    terms: 'Warunki sprzedaży: płatność przelewem, termin zgodnie z umową.'
  },
  numbering: {
    startNumber: 1,
    resetYearly: true,
    invoicePrefix: 'FV',
    proformaPrefix: 'PF',
    advancePrefix: 'FZ',
    finalPrefix: 'FK',
    correctionPrefix: 'KOR',
    receiptPrefix: 'PAR',
    pzPrefix: 'PZ',
    wzPrefix: 'WZ',
    rwPrefix: 'RW',
    mmPrefix: 'MM',
    inwPrefix: 'INW',
    soPrefix: 'SO',
    poPrefix: 'PO',
    rmaPrefix: 'RMA',
    expensePrefix: 'WYD'
  },
  tax: {
    defaultVat: '23',
    enabledVatRates: ['23', '8', '5', '0', 'zw'],
    defaultCurrency: 'PLN',
    enabledCurrencies: ['PLN', 'EUR']
  },
  payment: {
    bankName: '',
    bankAccount: '',
    paymentDays: 14,
    paymentMethod: 'Przelew'
  },
  discounts: {
    globalPercent: 0,
    thresholds: [
      { minNetto: 5000, percent: 2 },
      { minNetto: 10000, percent: 5 }
    ],
    coupons: [
      { code: 'START5', percent: 5 },
      { code: 'VIP10', percent: 10 }
    ]
  },
  ui: {
    theme: 'light',
    density: 'comfortable',
    roundedCards: true,
    highContrast: false
  },
  performance: {
    reduceAnimations: false,
    lowDataMode: false,
    enableCache: true
  },
  mobileUx: {
    enableMobileMode: false,
    largeTouchTargets: false,
    stickyActions: false
  },
  permissions: {
    admin: {
      manageSettings: true,
      manageUsers: true,
      manageDocuments: true,
      createDocuments: true,
      manageInvoices: true,
      managePayments: true,
      manageReports: true,
      manageContacts: true,
      manageWarehouse: true,
      manageSalesOrders: true,
      managePurchaseOrders: true,
      managePicking: true,
      manageReturns: true,
      managePriceLists: true
    },
    sales: {
      manageSettings: false,
      manageUsers: false,
      manageDocuments: true,
      createDocuments: true,
      manageInvoices: true,
      managePayments: false,
      manageReports: false,
      manageContacts: true,
      manageWarehouse: false,
      manageSalesOrders: true,
      managePurchaseOrders: false,
      managePicking: false,
      manageReturns: true,
      managePriceLists: true
    },
    warehouse: {
      manageSettings: false,
      manageUsers: false,
      manageDocuments: true,
      createDocuments: false,
      manageInvoices: false,
      managePayments: false,
      manageReports: false,
      manageContacts: false,
      manageWarehouse: true,
      manageSalesOrders: false,
      managePurchaseOrders: true,
      managePicking: true,
      manageReturns: true,
      managePriceLists: false
    },
    accountant: {
      manageSettings: false,
      manageUsers: false,
      manageDocuments: true,
      createDocuments: true,
      manageInvoices: true,
      managePayments: true,
      manageReports: true,
      manageContacts: true,
      manageWarehouse: false,
      manageSalesOrders: false,
      managePurchaseOrders: false,
      managePicking: false,
      manageReturns: false,
      managePriceLists: true
    }
  }
}

const mergeDeep = (target, source) => {
  Object.keys(source || {}).forEach((key) => {
    const value = source[key]
    if (Array.isArray(value)) {
      target[key] = [...value]
      return
    }
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
        target[key] = {}
      }
      mergeDeep(target[key], value)
      return
    }
    target[key] = value
  })
  return target
}

const readLocalSettings = () => {
  const raw = localStorage.getItem(SETTINGS_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const writeLocalSettings = (settings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

export const getSettings = () => {
  const local = readLocalSettings()
  if (local) {
    const mergedLocal = structuredClone(defaultSettings)
    mergeDeep(mergedLocal, local)
    void setItem(SETTINGS_KEY, mergedLocal)
    return mergedLocal
  }

  const cached = getItem(SETTINGS_KEY)
  if (!cached) return structuredClone(defaultSettings)

  try {
    const parsed = cached
    const merged = structuredClone(defaultSettings)
    mergeDeep(merged, parsed)
    writeLocalSettings(merged)
    return merged
  } catch {
    return structuredClone(defaultSettings)
  }
}

export const saveSettings = async (settings) => {
  writeLocalSettings(settings)
  try {
    await setItem(SETTINGS_KEY, settings)
  } catch {
    // ignore IndexedDB errors
  }
}
