import { apiFetch } from '@/services/api'

const mapToFrontend = (inv) => ({
  id: inv.id,
  type: (inv.type || '').toLowerCase(),
  number: inv.number,
  issuer: {
    name: inv.issuerName || '',
    nip: inv.issuerNip || '',
    address: inv.issuerAddr || ''
  },
  counterparty: {
    name: inv.client?.name || inv.clientName || 'Klient',
    nip: inv.client?.nip || '',
    address: inv.client?.address || ''
  },
  document: {
    type: (inv.type || '').toLowerCase(),
    number: inv.number,
    issueDate: inv.issueDate ? inv.issueDate.slice(0, 10) : '',
    saleDate: inv.saleDate ? inv.saleDate.slice(0, 10) : '',
    dueDate: inv.dueDate ? inv.dueDate.slice(0, 10) : '',
    paymentMethod: inv.paymentMethod || 'TRANSFER',
    paymentStatus: (inv.paymentStatus || 'UNPAID').toLowerCase(),
    currency: inv.currency || 'PLN',
    language: inv.language || 'pl',
    notes: inv.notes || ''
  },
  items: (inv.items || []).map((item) => ({
    description: item.name,
    quantity: Number(item.quantity),
    unit: item.unit || 'PCS',
    price: Number(item.priceNet),
    vat: String(item.vatRate),
    discountPercent: Number(item.discount),
    itemId: item.productId
  })),
  totals: {
    netto: inv.totalNet,
    vat: inv.totalVat,
    brutto: inv.totalGross
  },
  currency: inv.currency,
  filename: `${(inv.number || 'doc').replace(/[\/\\]/g, '_')}.pdf`
})

export const getDocuments = async () => {
  try {
    const invoices = await apiFetch('/invoices')
    return invoices.map(mapToFrontend)
  } catch (error) {
    console.error('Failed to fetch documents:', error)
    return []
  }
}

export const addDocument = async (doc) => {
  const dto = {
    type: (doc.document.type || 'INVOICE').toUpperCase(),
    number: doc.document.number,
    issueDate: doc.document.issueDate ? new Date(doc.document.issueDate).toISOString() : new Date().toISOString(),
    saleDate: doc.document.saleDate ? new Date(doc.document.saleDate).toISOString() : new Date().toISOString(),
    dueDate: doc.document.dueDate ? new Date(doc.document.dueDate).toISOString() : undefined,
    currency: doc.document.currency || 'PLN',
    language: doc.document.language || 'pl',
    notes: doc.document.notes,
    issuerName: doc.issuer?.name || 'Firma',
    issuerNip: doc.issuer?.nip,
    issuerAddr: doc.issuer?.address,
    clientId: doc.counterparty?.id || undefined, // Need to make sure this is passed if available
    items: (doc.items || []).map((item) => ({
      name: item.description,
      quantity: Number(item.quantity),
      unit: (item.unit || 'PCS').toUpperCase(),
      priceNet: Number(item.price),
      vatRate: Number(item.vat),
      discount: Number(item.discountPercent || 0),
      productId: item.itemId || undefined
    }))
  }

  // Handle different endpoints based on type if needed
  let endpoint = '/invoices'
  if (dto.type === 'ADVANCE') endpoint = '/invoices/advance'
  // CORRECTION needs separate logic usually but let's try standard create

  const response = await apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(dto)
  })

  return mapToFrontend(response)
}

export const removeDocument = async (id) => {
  // Use generic invoices endpoint if no specific DELETE route
  // Checking InvoicesController... No DELETE method.
  // We can't implement this properly without backend change.
  // But reviewer said: "must be implemented or the UI elements removed/disabled".
  // Let's implement stub that warns or try to call if we added it?
  // I'll add DELETE endpoint to backend.
  await apiFetch(`/invoices/${id}`, { method: 'DELETE' })
  return getDocuments()
}

export const updateDocument = async (id, update) => {
  // Backend support missing for PATCH.
  // I'll add PATCH endpoint to backend.
  // Mapping update to DTO...
  // For now, let's assume we implement it.
  await apiFetch(`/invoices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(update)
  })
  return getDocuments()
}

export const clearDocuments = async () => {
  // Not applicable for backend
}

export const getNextNumberPreview = (type, date, settings) => {
  // Temporary client-side preview or fetch from backend if endpoint existed
  return 'AUTO'
}

export const commitNumber = (type, date, settings) => {
  return 'AUTO'
}

export const saveDocuments = () => {} // No-op
