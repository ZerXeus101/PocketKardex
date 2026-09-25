<script setup>
import { ClipboardList, Settings2 } from 'lucide-vue-next'

defineEmits(['openEndorsement', 'openSettings'])
</script>

<template>
  <header
    class="sticky top-0 z-40 w-full backdrop-blur-xl bg-black/75 border-b border-white/[0.08] pt-safe select-none transition-colors"
  >
    <div class="flex items-center justify-between h-13 px-4 max-w-lg mx-auto">
      <!-- App Brand -->
      <div class="flex items-center gap-2.5">
        <img
          src="/icon.png"
          alt="Pocket Kardex"
          class="w-8.5 h-8.5 rounded-xl shadow-sm object-cover border border-white/[0.12]"
        />
        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <h1 class="text-[17px] font-bold tracking-tight text-white">
              Pocket Kardex
            </h1>
            <span
              class="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-white/[0.08] uppercase"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Bedside
            </span>
          </div>
        </div>
      </div>

      <!-- Quick Action Controls (Strict 44x44pt Hitbox) -->
      <div class="flex items-center gap-1">
        <button
          @click="$emit('openEndorsement')"
          class="btn-press w-11 h-11 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] active:bg-white/[0.1]"
          aria-label="Shift Endorsement"
        >
          <ClipboardList :size="20" :stroke-width="1.8" />
        </button>
        <button
          @click="$emit('openSettings')"
          class="btn-press w-11 h-11 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] active:bg-white/[0.1]"
          aria-label="Settings & Shift Data"
        >
          <Settings2 :size="20" :stroke-width="1.8" />
        </button>
      </div>
    </div>
  </header>
</template>
