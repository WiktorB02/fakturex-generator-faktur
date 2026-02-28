<template>
  <Transition name="nav-progress-fade">
    <div v-if="visible" class="nav-progress" role="progressbar" aria-label="Ładowanie widoku">
      <div class="nav-progress-track"></div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.nav-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 12000;
  height: 3px;
  overflow: hidden;
}

.nav-progress-track {
  width: 35%;
  height: 100%;
  background: linear-gradient(90deg, var(--primary-400), var(--primary-600));
  box-shadow: 0 0 10px color-mix(in srgb, var(--primary-500) 50%, transparent);
  animation: nav-progress-move 1s ease-in-out infinite;
}

.nav-progress-fade-enter-active,
.nav-progress-fade-leave-active {
  transition: opacity 0.18s ease;
}

.nav-progress-fade-enter-from,
.nav-progress-fade-leave-to {
  opacity: 0;
}

@keyframes nav-progress-move {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(320%); }
}
</style>
