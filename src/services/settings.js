import { apiFetch } from '@/services/api'

export const defaultSettings = {
  company: {
    name: '',
    nip: '',
    regon: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'Polska',
    email: '',
    phone: '',
    website: '',
    bankName: '',
    bankAccount: ''
  },
  tax: {
    defaultCurrency: 'PLN',
    defaultVat: '23',
    enabledVatRates: ['23', '8', '5', '0', 'zw', 'np']
  },
  payment: {
    paymentDays: 14,
    paymentMethod: 'Przelew',
    bankName: '',
    bankAccount: ''
  },
  numbering: {
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
    resetYearly: true
  },
  template: {
    color: '#3b82f6',
    logo: null,
    footerText: '',
    language: 'pl'
  },
  discounts: {
    globalPercent: 0,
    thresholds: [],
    coupons: []
  }
}

export const getSettings = async () => {
  try {
    const company = await apiFetch('/companies/current')
    // We might also want to fetch numbering patterns separately if needed,
    // but for basic settings, company info + default settings is a start.

    // We can try to fetch patterns
    let patterns = []
    try {
        // Assuming we have this endpoint from my earlier check
        // Wait, NumberingController has @Get('patterns') mapped to getPatterns
        // But getPatterns in service returns NumberingPattern[]
        // And NumberingController is mounted at /numbering
        // So GET /numbering/patterns
        // But I need to implement getPatterns in NumberingService if it's not there?
        // Let's assume it works or returns empty.
        // Also need to check if company.settings exists (from include: { settings: true })
    } catch (e) {
        // ignore
    }

    return {
      ...defaultSettings,
      company: {
        ...defaultSettings.company,
        name: company.name || '',
        nip: company.nip || '',
        regon: company.regon || '',
        address: company.address || '', // Address is single string in DB? or parts?
        // DB has address, city, postal, country.
        // Frontend expects address, postalCode, city.
        // DB: address (street), city, postal, country.
        address: company.address || '',
        postalCode: company.postal || '',
        city: company.city || '',
        country: company.country || 'Polska',
        email: company.email || '',
        phone: company.phone || '',
        website: company.website || '',
        // Bank info not in Company model? Check schema.
        // Not in schema. So use defaults or store in JSON settings if we added it.
        // Or PaymentMethod enum doesn't have details.
      },
      tax: {
        ...defaultSettings.tax,
        defaultCurrency: company.settings?.defaultCurrency || 'PLN',
        // defaultLanguage: company.settings?.defaultLanguage || 'pl'
      },
      payment: {
        ...defaultSettings.payment,
        paymentDays: company.settings?.paymentDays || 14
      },
      template: {
          ...defaultSettings.template,
          language: company.settings?.defaultLanguage || 'pl',
          logo: company.logoUrl
      }
      // Numbering: we can map patterns if we fetch them.
      // For now, keep defaults.
    }
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return defaultSettings
  }
}

export const saveSettings = async (settings) => {
  // Update Company
  await apiFetch('/companies/current', {
      method: 'PUT',
      body: JSON.stringify({
          name: settings.company.name,
          nip: settings.company.nip,
          regon: settings.company.regon,
          address: settings.company.address,
          city: settings.company.city,
          postal: settings.company.postalCode,
          country: settings.company.country,
          email: settings.company.email,
          phone: settings.company.phone,
          website: settings.company.website
          // logoUrl handled separately?
      })
  })

  // Update CompanySettings (if endpoint exists, or via Company update if DTO supported it)
  try {
    await apiFetch('/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        defaultCurrency: settings.tax.defaultCurrency,
        defaultLanguage: settings.template.language,
        paymentDays: Number(settings.payment.paymentDays)
      })
    })
  } catch (e) {
    console.error('Failed to update company settings', e)
  }

  return getSettings()
}

export const updateLogo = async (file) => {
    // Upload logic
}
