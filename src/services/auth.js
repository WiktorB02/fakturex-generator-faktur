import { getItem, setItem, removeItem } from '@/services/secureStore'

const AUTH_KEY = 'fakturex_auth'
const USERS_KEY = 'fakturex_users'

const demoUsers = [
  {
    email: 'admin@fakturex.pl',
    password: 'admin123',
    role: 'admin',
    name: 'Administrator'
  },
  {
    email: 'ksiegowy@fakturex.pl',
    password: 'demo123',
    role: 'accountant',
    name: 'Księgowy'
  },
  {
    email: 'magazyn@fakturex.pl',
    password: 'demo123',
    role: 'warehouse',
    name: 'Magazynier'
  },
  {
    email: 'sprzedaz@fakturex.pl',
    password: 'demo123',
    role: 'sales',
    name: 'Sprzedawca'
  }
]

const readSession = () => getItem(AUTH_KEY, null)

const writeSession = (session) => {
  setItem(AUTH_KEY, session)
}

export const getUsers = () => {
  const stored = getItem(USERS_KEY, null)
  if (!Array.isArray(stored) || stored.length === 0) {
    return structuredClone(demoUsers)
  }
  return stored
}

export const saveUsers = async (users) => {
  await setItem(USERS_KEY, users)
}

export const updateUserRole = async (email, role) => {
  const users = getUsers()
  const index = users.findIndex((user) => user.email === email)
  if (index === -1) return users
  users[index] = { ...users[index], role }
  await saveUsers(users)
  return users
}

export const getSession = () => readSession()

export const isAuthenticated = () => !!readSession()?.user

export const hasRole = (roles = []) => {
  if (!roles || roles.length === 0) return true
  const role = readSession()?.user?.role
  return !!role && roles.includes(role)
}

export const login = (email, password) => {
  const users = getUsers()
  const matched = users.find((user) => user.email === email && user.password === password)

  if (!matched) {
    throw new Error('Nieprawidłowy e-mail lub hasło.')
  }

  const session = {
    user: {
      name: matched.name,
      email: matched.email,
      role: matched.role
    },
    token: `demo-${Date.now()}`
  }

  writeSession(session)
  return session
}

export const logout = () => {
  removeItem(AUTH_KEY)
}

export const getDemoUsers = () =>
  getUsers().map(({ email, role, name }) => ({ email, role, name }))
