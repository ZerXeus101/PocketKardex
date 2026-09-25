<script setup>
import { computed, watch, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { usePatientStore } from '../stores/patientStore.js'
import { useVitalsStore } from '../stores/vitalsStore.js'
import { Plus } from 'lucide-vue-next'

const emit = defineEmits(['addPatient'])

const patientStore = usePatientStore()
const vitalsStore = useVitalsStore()
const { patients, activePatientId } = storeToRefs(patientStore)

const patientMeta = ref(new Map())

async function refreshMeta() {
  const map = new Map()
  for (const p of patients.value) {
    const latest = await vitalsStore.getLatestForPatient(p.id)
    const flags = vitalsStore.checkAbnormals(latest)
    map.set(p.id, { latest, flags })
  }
  patientMeta.value = map
}

watch(patients, () => {
  patientStore.ensureSelection()
  refreshMeta()
}, { deep: true })
onMounted(() => {
  setTimeout(() => {
    patientStore.ensureSelection()
    refreshMeta()
  }, 100)
})

watch(() => vitalsStore.vitalsForActivePatient, refreshMeta, { deep: true })

function selectBed(id) {
  if (navigator.vibrate) navigator.vibrate(8)
  patientStore.selectPatient(id)
}

function formatLastTime(meta) {
  if (!meta?.latest) return 'No vitals'
  const d = new Date(meta.latest.timestamp)
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}
</script>

<template>
  <div class="w-full bg-black/60 border-b border-white/[0.06] select-none">
    <div
      class="flex items-center gap-2.5 px-4 py-2.5 overflow-x-auto no-scrollbar scroll-touch max-w-lg mx-auto"
    >
      <!-- Bed Cards -->
      <button
        v-for="patient in patients"
        :key="patient.id"
        @click="selectBed(patient.id)"
        class="card-press relative flex-shrink-0 flex flex-col justify-between w-[132px] h-[80px] p-2.5 rounded-2xl border text-left cursor-pointer"
        :class="[
          activePatientId === patient.id
            ? 'bg-zinc-900 border-emerald-500/50 shadow-md shadow-black/80 ring-1 ring-emerald-500/30'
            : 'bg-[#121215] border-white/[0.08] hover:border-white/[0.16]'
        ]"
      >
        <!-- Top: Bed Number and Alert Beacon -->
        <div class="flex items-center justify-between w-full">
          <span
            class="text-[14px] font-bold tracking-tight truncate max-w-[94px]"
            :class="activePatientId === patient.id ? 'text-white' : 'text-zinc-200'"
          >
            {{ patient.bedNumber }}
          </span>

          <!-- Restrained Alert Beacon -->
          <div
            v-if="patientMeta.get(patient.id)?.flags?.hasAny"
            class="flex items-center justify-center w-2.5 h-2.5"
          >
            <span class="relative flex h-2 w-2">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"
              />
              <span
                class="relative inline-flex rounded-full h-2 w-2 bg-rose-500"
              />
            </span>
          </div>
        </div>

        <!-- Middle: Initials & Age/Gender -->
        <div class="text-[11px] text-zinc-400 font-medium truncate w-full">
          <template v-if="patient.initials">{{ patient.initials }}</template>
          <template v-if="patient.initials && patient.ageGender"> · </template>
          <template v-if="patient.ageGender">{{ patient.ageGender }}</template>
          <template v-if="!patient.initials && !patient.ageGender">—</template>
        </div>

        <!-- Bottom: Time of Last Assessment -->
        <div class="flex items-center justify-between w-full">
          <span
            class="text-[10px] font-vitals font-medium tracking-tight truncate"
            :class="[
              patientMeta.get(patient.id)?.flags?.hasAny
                ? 'text-rose-400 font-semibold'
                : 'text-zinc-500'
            ]"
          >
            {{ formatLastTime(patientMeta.get(patient.id)) }}
          </span>
          <span
            v-if="activePatientId === patient.id"
            class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"
          />
        </div>
      </button>

      <!-- Add Patient Bed Tile -->
      <button
        @click="$emit('addPatient')"
        class="card-press flex-shrink-0 flex flex-col items-center justify-center w-[74px] h-[80px] rounded-2xl border border-dashed border-white/[0.14] text-zinc-400 bg-zinc-950/60 hover:border-emerald-500/50 hover:text-emerald-400 cursor-pointer"
        aria-label="Add new patient bed"
      >
        <div class="w-7 h-7 rounded-full bg-zinc-900 border border-white/[0.08] flex items-center justify-center mb-1">
          <Plus :size="15" class="text-zinc-300" :stroke-width="2.5" />
        </div>
        <span class="text-[10px] font-semibold tracking-wide uppercase text-zinc-400">
          Add Bed
        </span>
      </button>
    </div>
  </div>
</template>
