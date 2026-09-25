<script setup>
import { storeToRefs } from 'pinia'
import { usePatientStore } from '../stores/patientStore.js'
import { useVitalsStore } from '../stores/vitalsStore.js'
import VitalsCard from './VitalsCard.vue'
import { FileHeart } from 'lucide-vue-next'

const emit = defineEmits(['editVitals'])

const patientStore = usePatientStore()
const vitalsStore = useVitalsStore()
const { activePatient } = storeToRefs(patientStore)
const { vitalsForActivePatient } = storeToRefs(vitalsStore)
</script>

<template>
  <div class="flex-1 overflow-y-auto px-3 py-2 space-y-3 scroll-touch">
    <!-- Active patient info banner -->
    <div v-if="activePatient" class="flex items-center gap-2 px-1 py-1">
      <span class="text-sm font-semibold text-accent">{{ activePatient.bedNumber }}</span>
      <span v-if="activePatient.diagnosis" class="text-xs text-text-muted truncate">
        — {{ activePatient.diagnosis }}
      </span>
    </div>

    <!-- Vitals cards list (newest first) -->
    <VitalsCard
      v-for="record in vitalsForActivePatient"
      :key="record.id"
      :record="record"
      @edit="(r) => $emit('editVitals', r)"
    />

    <!-- Empty state -->
    <div
      v-if="activePatient && vitalsForActivePatient.length === 0"
      class="flex flex-col items-center justify-center py-16 text-text-muted"
    >
      <FileHeart :size="40" class="mb-3 opacity-50" />
      <p class="text-sm">No vitals recorded yet</p>
      <p class="text-xs mt-1">Tap + to record vitals</p>
    </div>

    <!-- No patient selected -->
    <div
      v-if="!activePatient"
      class="flex flex-col items-center justify-center py-16 text-text-muted"
    >
      <p class="text-sm">Select or add a patient</p>
    </div>
  </div>
</template>
