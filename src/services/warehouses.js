import { apiFetch } from '@/services/api'

export const getWarehouses = async () => {
  try {
    const warehouses = await apiFetch('/warehouses')
    if (!warehouses || warehouses.length === 0) {
      // Create a default if none exists, as frontend expects at least one
      // If user has rights
      return [{ id: 'default', name: 'Magazyn Główny' }]
    }
    return warehouses.map(w => ({
      id: w.id,
      name: w.name,
      code: w.code,
      location: w.location
    }))
  } catch (error) {
    console.error('Failed to fetch warehouses:', error)
    return [{ id: 'default', name: 'Magazyn Główny' }]
  }
}

export const addWarehouse = async (warehouse) => {
  const dto = {
    name: warehouse.name,
    code: warehouse.code,
    location: warehouse.location
  }

  await apiFetch('/warehouses', {
    method: 'POST',
    body: JSON.stringify(dto)
  })

  return getWarehouses()
}

export const updateWarehouse = async (id, update) => {
  const dto = {
    name: update.name,
    code: update.code,
    location: update.location
  }

  await apiFetch(`/warehouses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto)
  })

  return getWarehouses()
}

export const removeWarehouse = async (id) => {
  await apiFetch(`/warehouses/${id}`, {
    method: 'DELETE'
  })
  return getWarehouses()
}
