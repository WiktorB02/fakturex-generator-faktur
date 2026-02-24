<template>
  <div class="loading-overlay" v-if="loading">
    <div class="spinner"></div>
    <div class="loading-text" v-if="text">{{ text }}</div>
  </div>
</template>

<script setup>
defineProps({
  loading: Boolean,
  text: String
})
</script>

<style scoped>
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 50;
  backdrop-filter: blur(2px);
  border-radius: inherit;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--secondary-200);
  border-top-color: var(--primary-600);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: var(--spacing-md);
  color: var(--secondary-600);
  font-weight: 500;
  font-size: var(--text-sm);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
