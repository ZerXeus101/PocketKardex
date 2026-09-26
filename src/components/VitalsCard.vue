<script setup>
import { computed } from 'vue'
import { useVitalsStore } from '../stores/vitalsStore.js'
import { ChevronRight, AlertTriangle } from 'lucide-vue-next'

const props = defineProps({
  record: { type: Object, required: true }
})

const emit = defineEmits(['edit'])

const vitalsStore = useVitalsStore()

const flags = computed(() => vitalsStore.checkAbnormals(props.record))

const formattedTime = computed(() => {
  const d = new Date(props.record.timestamp)
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
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
    class="card-press relative rounded-2xl bg-pk-card border border-pk-border p-3.5 space-y-3 cursor-pointer select-none shadow-sm hover:border-pk-border-card transition-colors"
  >
    <!-- Card Header: Time & Edit Trigger -->
    <div class="flex items-center justify-between pb-2 border-b border-pk-border">
      <div class="flex items-baseline gap-2">
        <span class="text-[15px] font-bold font-vitals text-pk-primary">
          {{ formattedTime }}
        </span>
        <span class="text-[11px] text-pk-secondary font-medium">
          {{ formattedDate }}
        </span>
      </div>

      <div class="flex items-center gap-0.5 text-pk-secondary text-[11px] font-medium">
        <span>Edit</span>
        <ChevronRight :size="13" class="opacity-70" />
      </div>
    </div>

    <!-- Clinical Telemetry Grid -->
    <div class="grid grid-cols-2 gap-x-4 gap-y-2.5">
      <!-- 1. Blood Pressure Channel -->
      <div v-if="bpLeft || bpRight" class="col-span-2">
        <div class="text-[10px] tracking-wider text-pk-secondary font-bold uppercase mb-1">
          Blood Pressure
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <!-- Left Arm Reading -->
          <div
            v-if="bpLeft"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[14px] font-vitals font-bold"
            :style="flags.bpAbnormal
              ? 'background: var(--pk-ch-alert-bg); color: var(--pk-ch-alert-text); border-color: var(--pk-ch-alert-border)'
              : 'background: var(--pk-ch-bp-bg); color: var(--pk-ch-bp-text); border-color: var(--pk-ch-bp-border)'"
          >
            <span class="text-[10px] font-sans font-semibold text-pk-secondary">L:</span>
            <span>{{ bpLeft }}</span>
          </div>

          <!-- Right Arm Reading -->
          <div
            v-if="bpRight"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[14px] font-vitals font-bold"
            :style="flags.bpAbnormal
              ? 'background: var(--pk-ch-alert-bg); color: var(--pk-ch-alert-text); border-color: var(--pk-ch-alert-border)'
              : 'background: var(--pk-ch-bp-bg); color: var(--pk-ch-bp-text); border-color: var(--pk-ch-bp-border)'"
          >
            <span class="text-[10px] font-sans font-semibold text-pk-secondary">R:</span>
            <span>{{ bpRight }}</span>
          </div>

          <span class="text-[10px] text-pk-muted font-medium">mmHg</span>
        </div>
      </div>

      <!-- 2. Heart Rate Channel -->
      <div v-if="record.apicalPulse != null || record.radialPulse != null" class="col-span-2 sm:col-span-1">
        <div class="text-[10px] tracking-wider text-pk-secondary font-bold uppercase mb-1">
          Heart Rate
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          <div
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[14px] font-vitals font-bold"
            style="background: var(--pk-ch-hr-bg); color: var(--pk-ch-hr-text); border-color: var(--pk-ch-hr-border)"
          >
            <template v-if="record.apicalPulse != null">
              <span class="text-[10px] font-sans font-semibold text-pk-secondary">Ap</span>
              <span>{{ record.apicalPulse }}</span>
            </template>
            <template v-if="record.apicalPulse != null && record.radialPulse != null">
              <span class="opacity-40">/</span>
            </template>
            <template v-if="record.radialPulse != null">
              <span class="text-[10px] font-sans font-semibold text-pk-secondary">Rad</span>
              <span>{{ record.radialPulse }}</span>
            </template>
            <span class="text-[10px] text-pk-secondary font-normal">bpm</span>
          </div>

          <!-- Pulse Deficit Warning Badge -->
          <div
            v-if="flags.pulseDeficit"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-vitals font-semibold"
            style="background: var(--pk-ch-warn-bg); color: var(--pk-ch-warn-text); border-color: var(--pk-ch-warn-border)"
          >
            <AlertTriangle :size="11" />
            <span>Deficit: {{ record.pulseDeficit }} bpm</span>
          </div>
        </div>
      </div>

      <!-- 3. Oxygen Saturation Channel -->
      <div v-if="record.spO2 != null" class="col-span-1">
        <div class="text-[10px] tracking-wider text-pk-secondary font-bold uppercase mb-1">
          Oxygen Sat
        </div>
        <div class="flex items-center gap-1.5">
          <div
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[14px] font-vitals font-bold"
            :style="flags.spO2Low
              ? 'background: var(--pk-ch-alert-bg); color: var(--pk-ch-alert-text); border-color: var(--pk-ch-alert-border)'
              : 'background: var(--pk-ch-spo2-bg); color: var(--pk-ch-spo2-text); border-color: var(--pk-ch-spo2-border)'"
          >
            <span>{{ record.spO2 }}%</span>
            <span v-if="record.oxygenDelivery" class="text-[11px] font-sans font-medium opacity-85 ml-0.5">
              {{ record.oxygenDelivery }}
            </span>
          </div>
          <span v-if="record.pulseOxPR != null" class="text-[11px] text-pk-muted font-vitals">
            PR {{ record.pulseOxPR }}
          </span>
        </div>
      </div>

      <!-- 4. Respiratory Rate Channel -->
      <div v-if="record.respiratoryRate != null" class="col-span-1">
        <div class="text-[10px] tracking-wider text-pk-secondary font-bold uppercase mb-1">
          Resp Rate
        </div>
        <div
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[14px] font-vitals font-bold"
          :style="flags.rrAbnormal
            ? 'background: var(--pk-ch-warn-bg); color: var(--pk-ch-warn-text); border-color: var(--pk-ch-warn-border)'
            : 'background: var(--pk-ch-rr-bg); color: var(--pk-ch-rr-text); border-color: var(--pk-ch-rr-border)'"
        >
          <span>{{ record.respiratoryRate }}</span>
          <span class="text-[10px] font-sans font-normal text-pk-secondary">bpm</span>
        </div>
      </div>

      <!-- 5. Temperature Channel -->
      <div v-if="record.temperature != null" class="col-span-1">
        <div class="text-[10px] tracking-wider text-pk-secondary font-bold uppercase mb-1">
          Temperature
        </div>
        <div
          class="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-xl border text-[14px] font-vitals font-bold"
          :style="flags.tempHigh
            ? 'background: var(--pk-ch-alert-bg); color: var(--pk-ch-alert-text); border-color: var(--pk-ch-alert-border)'
            : 'background: var(--pk-ch-temp-bg); color: var(--pk-ch-temp-text); border-color: var(--pk-ch-temp-border)'"
        >
          <span>{{ record.temperature }}</span>
          <span class="text-[11px] font-sans font-medium">°C</span>
        </div>
      </div>

      <!-- 6. Pain Scale Channel -->
      <div v-if="record.painScore != null" class="col-span-1">
        <div class="text-[10px] tracking-wider text-pk-secondary font-bold uppercase mb-1">
          Pain Score
        </div>
        <div
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[14px] font-vitals font-bold"
          style="background: var(--pk-ch-bp-bg); color: var(--pk-ch-bp-text); border-color: var(--pk-ch-bp-border)"
        >
          <span>{{ record.painScore }}</span>
          <span class="text-[10px] font-sans font-normal text-pk-secondary">/10</span>
        </div>
      </div>
    </div>

    <!-- 7. Bedside Clinical Note -->
    <div
      v-if="record.notes"
      class="text-[12px] text-pk-primary bg-pk-input rounded-xl px-3 py-2 border-l-2 border-emerald-500 border-t border-r border-b border-pk-border leading-relaxed"
    >
      {{ record.notes }}
    </div>
  </div>
</template>
