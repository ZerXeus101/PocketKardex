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
    class="card-press relative rounded-2xl bg-[#121215] border border-white/[0.08] p-3.5 space-y-3 cursor-pointer select-none shadow-sm hover:border-white/[0.16] transition-colors"
  >
    <!-- Card Header: Time & Edit Trigger -->
    <div class="flex items-center justify-between pb-2 border-b border-white/[0.06]">
      <div class="flex items-baseline gap-2">
        <span class="text-[15px] font-bold font-vitals text-white">
          {{ formattedTime }}
        </span>
        <span class="text-[11px] text-zinc-400 font-medium">
          {{ formattedDate }}
        </span>
      </div>

      <div class="flex items-center gap-0.5 text-zinc-400 text-[11px] font-medium">
        <span>Edit</span>
        <ChevronRight :size="13" class="opacity-70" />
      </div>
    </div>

    <!-- Clinical Telemetry Grid -->
    <div class="grid grid-cols-2 gap-x-4 gap-y-2.5">
      <!-- 1. Blood Pressure Channel -->
      <div v-if="bpLeft || bpRight" class="col-span-2">
        <div class="text-[10px] tracking-wider text-zinc-400 font-bold uppercase mb-1">
          Blood Pressure
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <!-- Left Arm Reading -->
          <div
            v-if="bpLeft"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[14px] font-vitals font-bold"
            :class="[
              flags.bpAbnormal
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                : 'bg-zinc-900 text-white border-white/[0.08]'
            ]"
          >
            <span class="text-[10px] font-sans font-semibold text-zinc-400">L:</span>
            <span>{{ bpLeft }}</span>
          </div>

          <!-- Right Arm Reading -->
          <div
            v-if="bpRight"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[14px] font-vitals font-bold"
            :class="[
              flags.bpAbnormal
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                : 'bg-zinc-900 text-white border-white/[0.08]'
            ]"
          >
            <span class="text-[10px] font-sans font-semibold text-zinc-400">R:</span>
            <span>{{ bpRight }}</span>
          </div>

          <span class="text-[10px] text-zinc-400 font-medium">mmHg</span>
        </div>
      </div>

      <!-- 2. Heart Rate Channel -->
      <div v-if="record.apicalPulse != null || record.radialPulse != null" class="col-span-2 sm:col-span-1">
        <div class="text-[10px] tracking-wider text-zinc-400 font-bold uppercase mb-1">
          Heart Rate
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900 border border-white/[0.08] text-[14px] font-vitals font-bold text-white">
            <template v-if="record.apicalPulse != null">
              <span class="text-[10px] font-sans font-semibold text-zinc-400">Ap</span>
              <span class="text-emerald-400">{{ record.apicalPulse }}</span>
            </template>
            <template v-if="record.apicalPulse != null && record.radialPulse != null">
              <span class="text-white/20">/</span>
            </template>
            <template v-if="record.radialPulse != null">
              <span class="text-[10px] font-sans font-semibold text-zinc-400">Rad</span>
              <span class="text-emerald-400">{{ record.radialPulse }}</span>
            </template>
            <span class="text-[10px] text-zinc-400 font-normal">bpm</span>
          </div>

          <!-- Pulse Deficit Warning Badge -->
          <div
            v-if="flags.pulseDeficit"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-vitals font-semibold"
          >
            <AlertTriangle :size="11" />
            <span>Deficit: {{ record.pulseDeficit }} bpm</span>
          </div>
        </div>
      </div>

      <!-- 3. Oxygen Saturation Channel (Hospital Cyan) -->
      <div v-if="record.spO2 != null" class="col-span-1">
        <div class="text-[10px] tracking-wider text-zinc-400 font-bold uppercase mb-1">
          Oxygen Sat
        </div>
        <div class="flex items-center gap-1.5">
          <div
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[14px] font-vitals font-bold"
            :class="[
              flags.spO2Low
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                : 'bg-zinc-900 text-sky-400 border-white/[0.08]'
            ]"
          >
            <span>{{ record.spO2 }}%</span>
            <span v-if="record.oxygenDelivery" class="text-[11px] font-sans font-medium text-zinc-300 ml-0.5">
              {{ record.oxygenDelivery }}
            </span>
          </div>
          <span v-if="record.pulseOxPR != null" class="text-[11px] text-zinc-400 font-vitals">
            PR {{ record.pulseOxPR }}
          </span>
        </div>
      </div>

      <!-- 4. Respiratory Rate Channel -->
      <div v-if="record.respiratoryRate != null" class="col-span-1">
        <div class="text-[10px] tracking-wider text-zinc-400 font-bold uppercase mb-1">
          Resp Rate
        </div>
        <div
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[14px] font-vitals font-bold"
          :class="[
            flags.rrAbnormal
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              : 'bg-zinc-900 text-white border-white/[0.08]'
          ]"
        >
          <span>{{ record.respiratoryRate }}</span>
          <span class="text-[10px] font-sans font-normal text-zinc-400">bpm</span>
        </div>
      </div>

      <!-- 5. Temperature Channel -->
      <div v-if="record.temperature != null" class="col-span-1">
        <div class="text-[10px] tracking-wider text-zinc-400 font-bold uppercase mb-1">
          Temperature
        </div>
        <div
          class="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-xl border text-[14px] font-vitals font-bold"
          :class="[
            flags.tempHigh
              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              : 'bg-zinc-900 text-white border-white/[0.08]'
          ]"
        >
          <span>{{ record.temperature }}</span>
          <span class="text-[11px] font-sans font-medium">°C</span>
        </div>
      </div>

      <!-- 6. Pain Scale Channel -->
      <div v-if="record.painScore != null" class="col-span-1">
        <div class="text-[10px] tracking-wider text-zinc-400 font-bold uppercase mb-1">
          Pain Score
        </div>
        <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-900 border border-white/[0.08] text-[14px] font-vitals font-bold text-white">
          <span>{{ record.painScore }}</span>
          <span class="text-[10px] font-sans font-normal text-zinc-400">/10</span>
        </div>
      </div>
    </div>

    <!-- 7. Bedside Clinical Note -->
    <div
      v-if="record.notes"
      class="text-[12px] text-zinc-300 bg-zinc-900/90 rounded-xl px-3 py-2 border-l-2 border-emerald-400 border-t border-r border-b border-white/[0.04] leading-relaxed"
    >
      {{ record.notes }}
    </div>
  </div>
</template>
