import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initStore } from './services/secureStore'
import { applyUiSettings } from './services/ui'
import { initTheme } from './services/theme'

import './style.css' // jeśli używasz ogólnego CSS

const mount = async () => {
	await initStore()
	applyUiSettings()
	initTheme() // Load user preferences for dark mode, colors, density
	window.addEventListener('ui-updated', applyUiSettings)
	const app = createApp(App)
	app.use(router)
	app.mount('#app')
}

mount()
