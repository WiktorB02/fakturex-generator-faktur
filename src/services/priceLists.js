import { getItem, setItem } from '@/services/secureStore'
import { getInventory } from '@/services/inventory'

const PRICE_LISTS_KEY = 'priceLists'

const normalizeLists = (lists) => {
  const inventory = getInventory()
  const byId = new Map(inventory.map((item) => [item.id, item.name]))
  const byName = new Map(inventory.map((item) => [item.name, item.id]))
  let changed = false

  const normalized = (lists || []).map((list) => {
    const items = (list.items || []).map((entry) => {
      let next = entry
      if (!entry.productId && entry.productName) {
        const productId = byName.get(entry.productName)
        if (productId) {
          next = { ...next, productId }
          changed = true
        }
      }
      if (!entry.productName && entry.productId) {
        const productName = byId.get(entry.productId)
        if (productName) {
          next = { ...next, productName }
          changed = true
        }
      }
      if (next.price === undefined || typeof next.price !== 'number') {
        const raw = String(next.price ?? '').replace(',', '.')
        const parsed = Number(raw)
        next = { ...next, price: Number.isFinite(parsed) ? parsed : 0 }
        changed = true
      }
      return next
    })
    if (!Array.isArray(list.items)) {
      changed = true
    }
    return { ...list, items }
  })

  return { normalized, changed }
}

export const getPriceLists = () => {
  const lists = getItem(PRICE_LISTS_KEY, []) || []
  const { normalized, changed } = normalizeLists(lists)
  if (changed) setItem(PRICE_LISTS_KEY, normalized)
  return normalized
}

const savePriceLists = (lists) => {
  setItem(PRICE_LISTS_KEY, lists)
}

export const addPriceList = (list) => {
  const lists = getPriceLists()
  const newList = { id: crypto.randomUUID(), items: [], ...list }
  lists.unshift(newList)
  savePriceLists(lists)
  return lists
}

export const updatePriceList = (id, update) => {
  const lists = getPriceLists().map((list) => (list.id === id ? { ...list, ...update } : list))
  savePriceLists(lists)
  return lists
}

export const removePriceList = (id) => {
  const lists = getPriceLists().filter((list) => list.id !== id)
  savePriceLists(lists)
  return lists
}
