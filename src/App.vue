<template>
  <div class="app-shell">
    <RouteLoadingBar :visible="isNavigating" />
    <MainLayout v-if="showLayout">
      <Transition name="page-fade" mode="out-in">
        <router-view />
      </Transition>
    </MainLayout>
    <Transition v-else name="page-fade" mode="out-in">
      <router-view />
    </Transition>
    <ToastManager />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import ToastManager from '@/components/ui/ToastManager.vue'
import RouteLoadingBar from '@/components/ui/RouteLoadingBar.vue'

const route = useRoute()
const router = useRouter()
const showLayout = computed(() => route.name !== 'login')
const isNavigating = ref(false)

let hideTimer = null
let removeBeforeHook = null
let removeAfterHook = null

onMounted(() => {
  removeBeforeHook = router.beforeEach((to, from, next) => {
    if (to.fullPath !== from.fullPath) {
      isNavigating.value = true
      if (hideTimer) clearTimeout(hideTimer)
    }
    next()
  })

  removeAfterHook = router.afterEach(() => {
    hideTimer = setTimeout(() => {
      isNavigating.value = false
    }, 180)
  })
})

onUnmounted(() => {
  if (hideTimer) clearTimeout(hideTimer)
  if (removeBeforeHook) removeBeforeHook()
  if (removeAfterHook) removeAfterHook()
})
</script>

<style>
/* Global styles are imported in style.css */
</style>
