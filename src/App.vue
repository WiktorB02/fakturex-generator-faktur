<template>
  <div class="app-shell">
    <MainLayout v-if="showLayout">
      <router-view />
    </MainLayout>
    <router-view v-else />
    <ToastManager />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import ToastManager from '@/components/ui/ToastManager.vue'

const route = useRoute()
const showLayout = computed(() => route.name !== 'login')
</script>

<style>
/* Global styles are imported in style.css */
</style>
