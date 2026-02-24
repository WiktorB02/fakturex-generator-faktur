import { apiFetch } from '@/services/api'

export const getContacts = async () => {
  try {
    const clients = await apiFetch('/clients')
    return clients.map(c => ({
      id: c.id,
      name: c.name,
      nip: c.nip,
      address: c.address,
      email: c.email,
      phone: c.phone
    }))
  } catch (error) {
    console.error('Failed to fetch contacts:', error)
    return []
  }
}

export const addContact = async (contact) => {
  const dto = {
    name: contact.name,
    nip: contact.nip,
    address: contact.address,
    email: contact.email,
    phone: contact.phone
  }

  await apiFetch('/clients', {
    method: 'POST',
    body: JSON.stringify(dto)
  })

  return getContacts()
}

export const updateContact = async (id, update) => {
  const dto = {
    name: update.name,
    nip: update.nip,
    address: update.address,
    email: update.email,
    phone: update.phone
  }

  await apiFetch(`/clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto)
  })

  return getContacts()
}

export const removeContact = async (id) => {
  await apiFetch(`/clients/${id}`, {
    method: 'DELETE'
  })
  return getContacts()
}
