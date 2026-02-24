<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="toast.type"
      >
        <div class="toast-icon">
          <i v-if="toast.type === 'success'" class="fa fa-check-circle"></i>
          <i v-else-if="toast.type === 'error'" class="fa fa-exclamation-circle"></i>
          <i v-else class="fa fa-info-circle"></i>
        </div>
        <div class="toast-content">
          <div class="toast-title" v-if="toast.title">{{ toast.title }}</div>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <button class="toast-close" @click="remove(toast.id)">
          <i class="fa fa-times"></i>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const toasts = ref([])
let counter = 0

const add = ({ message, type = 'info', title = '' }) => {
  const id = ++counter
  const toast = { id, message, type, title }
  toasts.value.push(toast)
  setTimeout(() => remove(id), 5000)
}

const remove = (id) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) toasts.value.splice(index, 1)
}

const handleEvent = (e) => add(e.detail)

onMounted(() => {
  window.addEventListener('toast-add', handleEvent)
})

onUnmounted(() => {
  window.removeEventListener('toast-add', handleEvent)
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  min-width: 300px;
  max-width: 400px;
  background: white;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border-left: 4px solid var(--primary-500);
}

.toast.success { border-left-color: var(--success); }
.toast.error { border-left-color: var(--danger); }
.toast.info { border-left-color: var(--primary-500); }

.toast-icon {
  font-size: 20px;
  margin-top: 2px;
}
.toast.success .toast-icon { color: var(--success); }
.toast.error .toast-icon { color: var(--danger); }
.toast.info .toast-icon { color: var(--primary-500); }

.toast-content {
  flex: 1;
}

.toast-title {
  font-weight: 600;
  color: var(--secondary-900);
  margin-bottom: 4px;
  font-size: 14px;
}

.toast-message {
  color: var(--secondary-600);
  font-size: 14px;
  line-height: 1.4;
}

.toast-close {
  background: transparent;
  border: none;
  color: var(--secondary-400);
  cursor: pointer;
  padding: 4px;
  margin: -4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.toast-close:hover {
  background: var(--secondary-100);
  color: var(--secondary-600);
}

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
