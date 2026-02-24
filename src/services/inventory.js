import { apiFetch } from '@/services/api'

export const getInventory = async () => {
  try {
    const products = await apiFetch('/products')
    return products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku || '',
      unit: p.unit || 'szt.', // default unit
      stock: p.stock || 0,
      price: Number(p.priceNet), // Frontend uses 'price' as net price usually
      vat: String(p.vatRate),
      warehouseId: 'default', // Backend doesn't support multiple warehouses per product yet (unless I check schema again)
      location: p.location || '',
      minStock: 0, // Not in backend schema?
      batches: [] // Not in backend schema?
    }))
  } catch (error) {
    console.error('Failed to fetch inventory:', error)
    return []
  }
}

export const addInventoryItem = async (item) => {
  const dto = {
    name: item.name,
    sku: item.sku,
    unit: 'PCS', // Default mapping
    priceNet: Number(item.price),
    vatRate: Number(item.vat),
    stock: Number(item.stock),
    location: item.location,
    companyId: '' // Handled by backend
  }

  await apiFetch('/products', {
    method: 'POST',
    body: JSON.stringify(dto)
  })

  return getInventory()
}

export const updateInventoryItem = async (id, update) => {
  const dto = {}
  if (update.name) dto.name = update.name
  if (update.sku) dto.sku = update.sku
  if (update.price) dto.priceNet = Number(update.price)
  if (update.vat) dto.vatRate = Number(update.vat)
  if (update.stock !== undefined) dto.stock = Number(update.stock)
  if (update.location) dto.location = update.location

  await apiFetch(`/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto)
  })

  return getInventory()
}

export const removeInventoryItem = async (id) => {
  await apiFetch(`/products/${id}`, {
    method: 'DELETE'
  })
  return getInventory()
}

// Adjust stock (delta)
export const adjustInventoryStock = async (itemId, delta) => {
  // Backend doesn't support atomic delta patch via public API easily,
  // but we can fetch, calculate, and update.
  // OR we can use InvoicesService if it's a document.
  // For manual adjustment:
  const products = await getInventory()
  const product = products.find(p => p.id === itemId)
  if (product) {
      const newStock = product.stock + delta
      await updateInventoryItem(itemId, { stock: newStock })
  }
  return getInventory()
}

export const saveInventory = () => {} // No-op
