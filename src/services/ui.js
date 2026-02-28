import { getSettings } from '@/services/settings'

const applyDensity = (density) => {
  const body = document.body
  body.classList.toggle('density-compact', density === 'compact')
}

const applyContrast = (highContrast) => {
  document.body.classList.toggle('high-contrast', !!highContrast)
}

const applyMobileMode = (mobileUx) => {
  const body = document.body
  body.classList.toggle('mobile-mode', !!mobileUx?.enableMobileMode)
  body.classList.toggle('mobile-large-touch', !!mobileUx?.largeTouchTargets)
  body.classList.toggle('mobile-sticky-actions', !!mobileUx?.stickyActions)
}

const applyPerformance = (performance) => {
  document.body.classList.toggle('reduce-animations', !!performance?.reduceAnimations)
  document.body.classList.toggle('low-data-mode', !!performance?.lowDataMode)
}

export const applyUiSettings = () => {
  const settings = getSettings()
  applyDensity(settings.ui?.density)
  applyContrast(settings.ui?.highContrast)
  applyMobileMode(settings.mobileUx)
  applyPerformance(settings.performance)
}
