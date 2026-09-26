<script setup>
import { useThemeStore } from '../stores/themeStore.js'
import { Sun, Moon, Disc, ClipboardList, Settings2 } from 'lucide-vue-next'

defineEmits(['openEndorsement', 'openSettings'])

const themeStore = useThemeStore()
</script>

<template>
  <header
    class="sticky top-0 z-40 w-full backdrop-blur-xl bg-pk-header border-b border-pk-border pt-safe select-none transition-colors"
  >
    <div class="flex items-center justify-between h-13 px-4 max-w-lg mx-auto">
      <!-- App Brand -->
      <div class="flex items-center gap-2.5">
        <img
          src="/icon.png"
          alt="Pocket Kardex"
          class="w-8.5 h-8.5 rounded-xl shadow-sm object-cover border border-pk-border"
        />
        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <h1 class="text-[17px] font-bold tracking-tight text-pk-primary">
              Pocket Kardex
            </h1>
            <span
              class="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-pk-input text-pk-secondary border border-pk-border uppercase"
            >
              <span
                class="w-1.5 h-1.5 rounded-full"
                :class="[
                  themeStore.currentTheme === 'monochrome'
                    ? 'bg-zinc-300'
                    : 'bg-emerald-400 animate-pulse'
                ]"
              />
              Bedside
            </span>
          </div>
        </div>
      </div>

      <!-- Quick Action Controls (Strict 44x44pt Hitbox) -->
      <div class="flex items-center gap-0.5">
        <!-- 3-Way Quick Theme Toggle Button -->
        <button
          @click="themeStore.cycleTheme"
          class="btn-press w-10.5 h-10.5 flex items-center justify-center rounded-xl text-pk-secondary hover:text-pk-primary hover:bg-pk-btn active:bg-pk-btn-hover cursor-pointer"
          :aria-label="`Current theme: ${themeStore.currentTheme}. Tap to change theme.`"
          :title="`Theme: ${themeStore.currentTheme} (Tap to cycle)`"
        >
          <Sun
            v-if="themeStore.currentTheme === 'light'"
            :size="19"
            :stroke-width="2"
            class="text-amber-500"
          />
          <Disc
            v-else-if="themeStore.currentTheme === 'monochrome'"
            :size="19"
            :stroke-width="2"
            class="text-zinc-300"
          />
          <Moon
            v-else
            :size="19"
            :stroke-width="2"
            class="text-emerald-400"
          />
        </button>

        <button
          @click="$emit('openEndorsement')"
          class="btn-press w-10.5 h-10.5 flex items-center justify-center rounded-xl text-pk-secondary hover:text-pk-primary hover:bg-pk-btn active:bg-pk-btn-hover cursor-pointer"
          aria-label="Shift Endorsement"
        >
          <ClipboardList :size="19" :stroke-width="1.8" />
        </button>

        <button
          @click="$emit('openSettings')"
          class="btn-press w-10.5 h-10.5 flex items-center justify-center rounded-xl text-pk-secondary hover:text-pk-primary hover:bg-pk-btn active:bg-pk-btn-hover cursor-pointer"
          aria-label="Settings & Appearance"
        >
          <Settings2 :size="19" :stroke-width="1.8" />
        </button>
      </div>
    </div>
  </header>
</template>
