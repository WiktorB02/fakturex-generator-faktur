<template>
  <div class="login-container">
    <div class="login-left">
      <div class="brand-header">
        <div class="brand-logo">F</div>
        <span class="brand-name">Fakturex</span>
      </div>

      <div class="login-content">
        <h1>Witaj ponownie 👋</h1>
        <p class="login-subtitle">Zaloguj się do swojego konta, aby zarządzać firmą.</p>

        <form @submit.prevent="onSubmit" class="login-form">
          <div class="form-group">
            <label class="form-label">Adres e-mail</label>
            <div class="input-wrapper">
              <i class="fa fa-envelope input-icon"></i>
              <input
                v-model.trim="email"
                type="email"
                class="form-control with-icon"
                placeholder="np. jan@firma.pl"
                autocomplete="username"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Hasło</label>
            <div class="input-wrapper">
              <i class="fa fa-lock input-icon"></i>
              <input
                v-model.trim="password"
                type="password"
                class="form-control with-icon"
                placeholder="••••••••"
                autocomplete="current-password"
                required
              />
            </div>
          </div>

          <button type="submit" class="btn btn-primary w-full" :disabled="loading">
            <i class="fa fa-sign-in" v-if="!loading"></i>
            <i class="fa fa-spinner fa-spin" v-else></i>
            {{ loading ? 'Logowanie...' : 'Zaloguj się' }}
          </button>

          <div v-if="error" class="error-message" role="alert" aria-live="polite">
            <i class="fa fa-exclamation-circle"></i>
            {{ error }}
          </div>
        </form>

        <div class="demo-credentials">
          <p class="demo-title">Konta demonstracyjne:</p>
          <div class="demo-grid">
            <div
              v-for="user in demoUsers"
              :key="user.email"
              class="demo-user"
              @click="fillCredentials(user)"
            >
              <div class="demo-role">{{ roleLabels[user.role] }}</div>
              <div class="demo-email">{{ user.email }}</div>
            </div>
          </div>
          <p class="demo-hint">Hasło dla wszystkich: <strong>demo123</strong> (admin: <strong>admin123</strong>)</p>
        </div>
      </div>

      <div class="login-footer">
        &copy; {{ new Date().getFullYear() }} Fakturex. Wszystkie prawa zastrzeżone.
      </div>
    </div>

    <div class="login-right">
      <div class="feature-showcase">
        <h2>Pełna kontrola nad Twoim biznesem</h2>
        <p>Zarządzaj fakturami, magazynem i kontrahentami w jednym, nowoczesnym systemie.</p>

        <div class="features-list">
          <div class="feature-item">
            <div class="feature-icon"><i class="fa fa-check"></i></div>
            <span>Intuicyjne wystawianie faktur</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon"><i class="fa fa-check"></i></div>
            <span>Pełna obsługa magazynu</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon"><i class="fa fa-check"></i></div>
            <span>Raporty i statystyki sprzedaży</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login, getDemoUsers } from '@/services/auth'
import { useToast } from '@/services/toast'

const router = useRouter()
const route = useRoute()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const demoUsers = getDemoUsers()
const toast = useToast()

const isEmailValid = computed(() => /\S+@\S+\.\S+/.test(email.value))
const isPasswordValid = computed(() => password.value.length >= 6)

const roleLabels = {
  OWNER: 'Właściciel',
  ACCOUNTANT: 'Księgowość',
  VIEWER: 'Podgląd'
}

const fillCredentials = (user) => {
  email.value = user.email
  password.value = user.role === 'OWNER' ? 'admin123' : 'demo123'
}

const onSubmit = async () => {
  error.value = ''

  if (!isEmailValid.value) {
    error.value = 'Wprowadź poprawny adres e-mail.'
    return
  }
  if (!isPasswordValid.value) {
    error.value = 'Hasło musi zawierać co najmniej 6 znaków.'
    return
  }

  loading.value = true

  try {
    await login(email.value, password.value)
    toast.success('Zalogowano pomyślnie.')
    const redirect = route.query.redirect
    router.push(redirect ? String(redirect) : { name: 'home' })
  } catch (err) {
    error.value = err.message ?? 'Nie udało się zalogować.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  background-color: var(--app-bg);
}

.login-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-2xl);
  justify-content: space-between;
  background: var(--app-surface);
  max-width: 600px;
  box-shadow: var(--shadow-xl);
  z-index: 10;
}

.brand-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.brand-logo {
  width: 40px;
  height: 40px;
  background: var(--primary-600);
  color: white;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-bold);
  font-size: var(--text-xl);
}

.brand-name {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--secondary-900);
}

.login-content {
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
}

h1 {
  font-size: var(--text-3xl);
  margin-bottom: var(--spacing-sm);
  color: var(--secondary-900);
}

.login-subtitle {
  color: var(--secondary-500);
  margin-bottom: var(--spacing-xl);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--secondary-400);
}

.form-control.with-icon {
  padding-left: 36px;
}

.error-message {
  padding: var(--spacing-md);
  background: var(--danger-light);
  color: var(--danger);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.demo-credentials {
  margin-top: var(--spacing-2xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--app-border);
}

.demo-title {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--secondary-500);
  margin-bottom: var(--spacing-md);
}

.demo-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.demo-user {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--secondary-50);
  border: 1px solid var(--secondary-200);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.demo-user:hover {
  border-color: var(--primary-400);
  background: var(--primary-50);
}

.demo-role {
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  color: var(--secondary-700);
}

.demo-email {
  font-size: var(--text-xs);
  color: var(--secondary-500);
}

.demo-hint {
  font-size: var(--text-xs);
  color: var(--secondary-400);
  text-align: center;
}

.login-footer {
  text-align: center;
  font-size: var(--text-xs);
  color: var(--secondary-400);
}

.login-right {
  flex: 1;
  background: linear-gradient(135deg, var(--primary-900), var(--primary-700));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  position: relative;
  overflow: hidden;
}

.login-right::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, transparent 60%);
}

.feature-showcase {
  max-width: 480px;
  padding: var(--spacing-2xl);
  position: relative;
  z-index: 1;
}

.feature-showcase h2 {
  font-size: var(--text-4xl);
  color: white;
  margin-bottom: var(--spacing-lg);
  line-height: 1.2;
}

.feature-showcase p {
  font-size: var(--text-lg);
  color: var(--primary-100);
  margin-bottom: var(--spacing-2xl);
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--text-lg);
}

.feature-icon {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
}

@media (max-width: 900px) {
  .login-right {
    display: none;
  }

  .login-left {
    max-width: 100%;
  }

  .login-content {
    max-width: 100%;
  }
}
</style>
