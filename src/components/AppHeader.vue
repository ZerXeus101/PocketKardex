<script setup>
import { Stethoscope, ClipboardList, Settings } from 'lucide-vue-next'

defineEmits(['openEndorsement', 'openSettings'])
</script>

<template>
  <header class="sticky top-0 z-50 bg-clinical-900/95 backdrop-blur-sm border-b border-clinical-800 pt-safe">
    <div class="flex items-center justify-between h-14 px-4">
      <!-- App Title -->
      <div class="flex items-center gap-2">
        <Stethoscope :size="22" class="text-accent" />
        <h1 class="text-lg font-bold text-text-primary tracking-tight">
          Pocket Kardex
        </h1>
      </div>

      <!-- Quick Actions -->
      <div class="flex items-center gap-1">
        <button
          @click="$emit('openEndorsement')"
          class="flex items-center justify-center w-11 h-11 rounded-xl
                 text-text-secondary hover:text-accent hover:bg-clinical-800
                 active:bg-clinical-700 transition-colors"
          aria-label="Shift Endorsement"
        >
          <ClipboardList :size="20" />
        </button>
        <button
          @click="$emit('openSettings')"
          class="flex items-center justify-center w-11 h-11 rounded-xl
                 text-text-secondary hover:text-accent hover:bg-clinical-800
                 active:bg-clinical-700 transition-colors"
          aria-label="Settings"
        >
          <Settings :size="20" />
        </button>
      </div>
    </div>
  </header>
</template>
