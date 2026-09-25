<script setup>
import { computed, watch, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { usePatientStore } from '../stores/patientStore.js'
import { useVitalsStore } from '../stores/vitalsStore.js'
import { Plus, AlertCircle } from 'lucide-vue-next'

const emit = defineEmits(['addPatient'])

const patientStore = usePatientStore()
const vitalsStore = useVitalsStore()
const { patients, activePatientId } = storeToRefs(patientStore)

// Track latest vitals + alerts per patient for bed cards
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

watch(patients, refreshMeta, { deep: true })
onMounted(() => {
  // Auto-select first patient on load
  setTimeout(() => {
    patientStore.ensureSelection()
    refreshMeta()
  }, 100)
})

// Re-check when vitals change
watch(() => vitalsStore.vitalsForActivePatient, refreshMeta, { deep: true })

function selectBed(id) {
  patientStore.selectPatient(id)
}

function formatLastTime(meta) {
  if (!meta?.latest) return 'No vitals'
  const d = new Date(meta.latest.timestamp)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}
</script>

<template>
  <div class="flex items-center gap-2 px-3 py-3 overflow-x-auto scroll-touch">
    <!-- Bed Cards -->
    <button
      v-for="patient in patients"
      :key="patient.id"
      @click="selectBed(patient.id)"
      class="relative flex-shrink-0 flex flex-col items-start gap-0.5
             w-32 p-3 rounded-2xl border transition-all duration-200"
      :class="[
        activePatientId === patient.id
          ? 'bg-clinical-800 border-accent shadow-lg shadow-accent/10'
          : 'bg-clinical-900 border-clinical-800 hover:border-clinical-700'
      ]"
    >
      <!-- Alert dot -->
      <div
        v-if="patientMeta.get(patient.id)?.flags?.hasAny"
        class="absolute top-2 right-2"
      >
        <AlertCircle :size="14" class="text-alert-danger" />
      </div>

      <!-- Bed number -->
      <span
        class="text-sm font-semibold truncate w-full"
        :class="activePatientId === patient.id ? 'text-accent' : 'text-text-primary'"
      >
        {{ patient.bedNumber }}
      </span>

      <!-- Initials + Age/Gender -->
      <span class="text-xs text-text-muted truncate w-full">
        <template v-if="patient.initials">{{ patient.initials }}</template>
        <template v-if="patient.initials && patient.ageGender"> · </template>
        <template v-if="patient.ageGender">{{ patient.ageGender }}</template>
        <template v-if="!patient.initials && !patient.ageGender">—</template>
      </span>

      <!-- Last vitals time -->
      <span class="text-[10px] mt-1"
        :class="[
          patientMeta.get(patient.id)?.flags?.hasAny
            ? 'text-alert-danger'
            : 'text-text-muted'
        ]"
      >
        {{ formatLastTime(patientMeta.get(patient.id)) }}
      </span>
    </button>

    <!-- Add Patient Button -->
    <button
      @click="$emit('addPatient')"
      class="flex-shrink-0 flex flex-col items-center justify-center
             w-16 h-[76px] rounded-2xl border-2 border-dashed border-clinical-700
             text-clinical-600 hover:border-accent hover:text-accent
             active:bg-clinical-800 transition-colors"
      aria-label="Add patient"
    >
      <Plus :size="22" />
      <span class="text-[10px] mt-0.5">Add</span>
    </button>
  </div>
</template>
