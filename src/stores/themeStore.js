import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // Supported themes: 'dark' | 'light' | 'monochrome'
  const savedTheme = localStorage.getItem('pocketkardex_theme') || 'dark'
  const currentTheme = ref(savedTheme)

  function applyTheme(theme) {
    currentTheme.value = theme
    localStorage.setItem('pocketkardex_theme', theme)
    document.documentElement.setAttribute('data-theme', theme)

    // Update status bar theme-color meta tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      if (theme === 'light') {
        metaThemeColor.setAttribute('content', '#f4f4f6')
      } else if (theme === 'monochrome') {
        metaThemeColor.setAttribute('content', '#18181b')
      } else {
        metaThemeColor.setAttribute('content', '#000000')
      }
    }
  }

  // Initialize immediately on store creation
  applyTheme(currentTheme.value)

  function setTheme(theme) {
    if (navigator.vibrate) navigator.vibrate(8)
    applyTheme(theme)
  }

  function cycleTheme() {
    if (navigator.vibrate) navigator.vibrate(8)
    if (currentTheme.value === 'dark') {
      applyTheme('light')
    } else if (currentTheme.value === 'light') {
      applyTheme('monochrome')
    } else {
      applyTheme('dark')
    }
  }

  return {
    currentTheme,
    setTheme,
    cycleTheme
  }
})
