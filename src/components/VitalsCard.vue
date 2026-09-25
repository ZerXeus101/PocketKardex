<script setup>
import { computed } from 'vue'
import { useVitalsStore } from '../stores/vitalsStore.js'
import { Pencil, AlertTriangle } from 'lucide-vue-next'

const props = defineProps({
  record: { type: Object, required: true }
})

const emit = defineEmits(['edit'])

const vitalsStore = useVitalsStore()

const flags = computed(() => vitalsStore.checkAbnormals(props.record))

const formattedTime = computed(() => {
  const d = new Date(props.record.timestamp)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
})

const formattedDate = computed(() => {
  const d = new Date(props.record.timestamp)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
})

// BP display helpers
const bpLeft = computed(() => {
  if (props.record.bpSystolicL == null) return null
  return `${props.record.bpSystolicL}/${props.record.bpDiastolicL}`
})

const bpRight = computed(() => {
  if (props.record.bpSystolicR == null) return null
  return `${props.record.bpSystolicR}/${props.record.bpDiastolicR}`
})
</script>

<template>
  <div
    @click="$emit('edit', record)"
    class="relative bg-clinical-900 rounded-2xl border border-clinical-800
           p-4 space-y-3 active:bg-clinical-800 transition-colors cursor-pointer"
  >
    <!-- Header: time + edit icon -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-accent">{{ formattedTime }}</span>
        <span class="text-xs text-text-muted">{{ formattedDate }}</span>
      </div>
      <button
        class="w-8 h-8 flex items-center justify-center rounded-lg
               text-text-muted hover:text-accent hover:bg-clinical-800"
        aria-label="Edit vitals"
      >
        <Pencil :size="14" />
      </button>
    </div>

    <!-- Vitals Grid -->
    <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">

      <!-- Blood Pressure -->
      <div v-if="bpLeft || bpRight" class="col-span-2">
        <span class="text-text-muted text-xs">BP</span>
        <div class="flex items-center gap-3 mt-0.5">
          <span
            v-if="bpLeft"
            class="font-mono font-semibold"
            :class="flags.bpAbnormal ? 'text-alert-danger' : 'text-text-primary'"
          >
            L: {{ bpLeft }}
          </span>
          <span
            v-if="bpRight"
            class="font-mono font-semibold"
            :class="flags.bpAbnormal ? 'text-alert-danger' : 'text-text-primary'"
          >
            R: {{ bpRight }}
          </span>
          <span v-if="flags.bpAbnormal" class="text-xs text-alert-danger font-medium">mmHg</span>
        </div>
      </div>

      <!-- Heart Rate / Pulse -->
      <div v-if="record.apicalPulse != null || record.radialPulse != null">
        <span class="text-text-muted text-xs">HR</span>
        <div class="mt-0.5">
          <span class="font-mono font-semibold text-text-primary">
            <template v-if="record.apicalPulse != null">Apical: {{ record.apicalPulse }}</template>
            <template v-if="record.apicalPulse != null && record.radialPulse != null"> | </template>
            <template v-if="record.radialPulse != null">Radial: {{ record.radialPulse }}</template>
          </span>
          <!-- Pulse Deficit Badge -->
          <div
            v-if="flags.pulseDeficit"
            class="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded-md
                   bg-alert-warning/20 text-alert-warning text-xs font-medium"
          >
            <AlertTriangle :size="10" />
            Deficit: {{ record.pulseDeficit }} bpm
          </div>
        </div>
      </div>

      <!-- SpO2 + PR -->
      <div v-if="record.spO2 != null">
        <span class="text-text-muted text-xs">O₂</span>
        <div class="mt-0.5">
          <span
            class="font-mono font-semibold"
            :class="flags.spO2Low ? 'text-alert-danger' : 'text-text-primary'"
          >
            {{ record.spO2 }}%
          </span>
          <span v-if="record.oxygenDelivery" class="text-xs text-text-secondary ml-1">
            on {{ record.oxygenDelivery }}
          </span>
          <span v-if="record.pulseOxPR != null" class="text-xs text-text-muted ml-1">
            (PR: {{ record.pulseOxPR }})
          </span>
        </div>
      </div>

      <!-- Respiratory Rate -->
      <div v-if="record.respiratoryRate != null">
        <span class="text-text-muted text-xs">RR</span>
        <div class="mt-0.5">
          <span
            class="font-mono font-semibold"
            :class="flags.rrAbnormal ? 'text-alert-warning' : 'text-text-primary'"
          >
            {{ record.respiratoryRate }}
          </span>
          <span class="text-xs text-text-muted ml-1">bpm</span>
        </div>
      </div>

      <!-- Temperature -->
      <div v-if="record.temperature != null">
        <span class="text-text-muted text-xs">Temp</span>
        <div class="mt-0.5">
          <span
            class="font-mono font-semibold"
            :class="flags.tempHigh ? 'text-alert-danger' : 'text-text-primary'"
          >
            {{ record.temperature }}°C
          </span>
        </div>
      </div>

      <!-- Pain Score -->
      <div v-if="record.painScore != null">
        <span class="text-text-muted text-xs">Pain</span>
        <div class="mt-0.5">
          <span class="font-mono font-semibold text-text-primary">
            {{ record.painScore }}/10
          </span>
        </div>
      </div>
    </div>

    <!-- Clinical Note -->
    <div
      v-if="record.notes"
      class="text-xs text-text-secondary bg-clinical-950/50 rounded-lg px-3 py-2 italic"
    >
      {{ record.notes }}
    </div>
  </div>
</template>
