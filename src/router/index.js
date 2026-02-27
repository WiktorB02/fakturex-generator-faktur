import { createRouter, createWebHistory } from 'vue-router'
import { getSession, isAuthenticated, hasRole } from '@/services/auth'
import { can, getPermissionsMatrix } from '@/services/permissions'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/invoice-form',
    name: 'invoice-form',
    component: () => import('@/views/InvoiceForm.vue'),
    meta: { requiresAuth: true, permission: 'createDocuments' }
  },
  {
    path: '/preview',
    name: 'InvoicePreview',
    component: () => import('@/views/InvoicePreview.vue'),
    meta: { requiresAuth: true, permission: 'createDocuments' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/Settings.vue'),
    meta: { requiresAuth: true, roles: ['OWNER'], permission: 'manageSettings' }
  },
  {
    path: '/invoice-list',
    name: 'invoice-list',
    component: () => import('@/views/InvoiceList.vue'),
    meta: { requiresAuth: true, permission: 'manageDocuments' }
  },
  {
    path: '/contacts',
    name: 'contacts',
    component: () => import('@/views/Contacts.vue'),
    meta: { requiresAuth: true, roles: ['OWNER', 'ACCOUNTANT', 'VIEWER'], permission: 'manageContacts' }
  },
  {
    path: '/warehouse',
    name: 'warehouse',
    component: () => import('@/views/Warehouse.vue'),
    meta: { requiresAuth: true, roles: ['OWNER'], permission: 'manageWarehouse' }
  },
  {
    path: '/payments',
    name: 'payments',
    component: () => import('@/views/Payments.vue'),
    meta: { requiresAuth: true, roles: ['OWNER', 'ACCOUNTANT', 'VIEWER'], permission: 'managePayments' }
  },
  {
    path: '/reports',
    name: 'reports',
    component: () => import('@/views/Reports.vue'),
    meta: { requiresAuth: true, roles: ['OWNER', 'ACCOUNTANT', 'VIEWER'], permission: 'manageReports' }
  },
  {
    path: '/sales-orders',
    name: 'sales-orders',
    component: () => import('@/views/SalesOrders.vue'),
    meta: { requiresAuth: true, roles: ['OWNER', 'ACCOUNTANT'], permission: 'manageSalesOrders' }
  },
  {
    path: '/purchase-orders',
    name: 'purchase-orders',
    component: () => import('@/views/PurchaseOrders.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/picking',
    name: 'picking',
    component: () => import('@/views/Picking.vue'),
    meta: { requiresAuth: true, roles: ['OWNER'], permission: 'managePicking' }
  },
  {
    path: '/returns',
    name: 'returns',
    component: () => import('@/views/Returns.vue'),
    meta: { requiresAuth: true, roles: ['OWNER', 'ACCOUNTANT'], permission: 'manageReturns' }
  },
  {
    path: '/price-lists',
    name: 'price-lists',
    component: () => import('@/views/PriceLists.vue'),
    meta: { requiresAuth: true, roles: ['OWNER', 'ACCOUNTANT'], permission: 'managePriceLists' }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  if (to.name === 'login' && isAuthenticated()) {
    return { name: 'home' }
  }

  if (to.meta?.requiresAuth && !isAuthenticated()) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta?.roles && !hasRole(to.meta.roles)) {
    return { name: 'home' }
  }

  if (to.meta?.permission) {
    const role = getSession()?.user?.role
    const matrix = getPermissionsMatrix()
    if (!can(to.meta.permission, role, matrix)) {
      return { name: 'home' }
    }
  }
})

export default router
