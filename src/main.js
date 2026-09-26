import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'
import { useThemeStore } from './stores/themeStore.js'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// Initialize theme
useThemeStore()

app.mount('#app')
