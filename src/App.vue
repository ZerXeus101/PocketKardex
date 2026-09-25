<script setup>
import { Stethoscope } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-dvh bg-surface-bg flex flex-col items-center justify-center gap-4">
    <Stethoscope :size="48" class="text-accent" />
    <h1 class="text-2xl font-bold text-text-primary">Pocket Kardex</h1>
    <p class="text-text-secondary text-sm">Bedside vitals — scaffold ready</p>
  </div>
</template>
