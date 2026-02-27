import { ref } from 'vue'

const THEME_KEY = 'fakturex_theme_preferences'

const defaultPreferences = {
  isDarkMode: false,
  colorTheme: 'indigo', // 'indigo', 'emerald', 'rose', 'violet'
  density: 'comfortable', // 'compact', 'comfortable', 'spacious'
}

export const themePreferences = ref({ ...defaultPreferences })

export const initTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved) {
      themePreferences.value = { ...defaultPreferences, ...JSON.parse(saved) }
    } else {
      // Check system preference for dark mode
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        themePreferences.value.isDarkMode = true
      }
    }
  } catch (e) {
    console.error('Failed to load theme preferences', e)
  }
  applyTheme()
}

export const saveThemePreferences = () => {
  try {
    localStorage.setItem(THEME_KEY, JSON.stringify(themePreferences.value))
    applyTheme()
  } catch (e) {
    console.error('Failed to save theme preferences', e)
  }
}

export const applyTheme = () => {
  const root = document.documentElement

  // Dark Mode
  if (themePreferences.value.isDarkMode) {
    root.classList.add('dark-mode')
  } else {
    root.classList.remove('dark-mode')
  }

  // Color Theme
  root.classList.remove('theme-indigo', 'theme-emerald', 'theme-rose', 'theme-violet')
  if (themePreferences.value.colorTheme !== 'indigo') {
    root.classList.add(`theme-${themePreferences.value.colorTheme}`)
  }

  // Density
  root.classList.remove('density-compact', 'density-spacious')
  if (themePreferences.value.density !== 'comfortable') {
    root.classList.add(`density-${themePreferences.value.density}`)
  }
}

export const setDarkMode = (isDark) => {
  themePreferences.value.isDarkMode = isDark
  saveThemePreferences()
}

export const toggleDarkMode = () => {
  themePreferences.value.isDarkMode = !themePreferences.value.isDarkMode
  saveThemePreferences()
}

export const setColorTheme = (theme) => {
  themePreferences.value.colorTheme = theme
  saveThemePreferences()
}

export const setDensity = (density) => {
  themePreferences.value.density = density
  saveThemePreferences()
}
