<script setup>
import { storeToRefs } from 'pinia'
import { usePatientStore } from '../stores/patientStore.js'
import { useVitalsStore } from '../stores/vitalsStore.js'
import VitalsCard from './VitalsCard.vue'
import { UserCheck, Stethoscope } from 'lucide-vue-next'

const emit = defineEmits(['editVitals', 'editPatient'])

const patientStore = usePatientStore()
const vitalsStore = useVitalsStore()
const { activePatient } = storeToRefs(patientStore)
const { vitalsForActivePatient } = storeToRefs(vitalsStore)
</script>

<template>
  <div class="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-3.5 scroll-touch no-scrollbar max-w-lg mx-auto w-full">
    <!-- Active Bed Context Banner -->
    <div
      v-if="activePatient"
      @click="$emit('editPatient', activePatient)"
      class="card-press flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-pk-card border border-pk-border cursor-pointer select-none shadow-sm transition-colors"
    >
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-8 h-8 rounded-xl bg-pk-subtle border border-pk-border flex items-center justify-center flex-shrink-0 text-emerald-500">
          <UserCheck :size="16" />
        </div>
        <div class="flex flex-col min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="text-[14px] font-bold text-pk-primary tracking-tight truncate">
              {{ activePatient.bedNumber }}
            </span>
            <span v-if="activePatient.initials" class="text-[12px] font-medium text-pk-secondary">
              ({{ activePatient.initials }})
            </span>
            <span v-if="activePatient.ageGender" class="text-[12px] text-pk-secondary">
              • {{ activePatient.ageGender }}
            </span>
          </div>
          <span v-if="activePatient.diagnosis" class="text-[11px] text-pk-muted truncate">
            {{ activePatient.diagnosis }}
          </span>
        </div>
      </div>

      <span class="text-[11px] text-pk-secondary hover:text-pk-primary font-medium px-2 py-0.5 rounded-lg bg-pk-subtle border border-pk-border flex-shrink-0 transition-colors">
        Edit / Discharge
      </span>
    </div>

    <!-- Vitals Telemetry History (Newest First) -->
    <div v-if="vitalsForActivePatient.length > 0" class="space-y-3">
      <VitalsCard
        v-for="record in vitalsForActivePatient"
        :key="record.id"
        :record="record"
        @edit="(r) => $emit('editVitals', r)"
      />
    </div>

    <!-- Empty State: Patient exists, no assessments yet -->
    <div
      v-else-if="activePatient"
      class="flex flex-col items-center justify-center py-20 px-6 text-center select-none"
    >
      <div class="w-14 h-14 rounded-2xl bg-pk-card border border-pk-border flex items-center justify-center text-pk-muted mb-3.5 shadow-sm transition-colors">
        <Stethoscope :size="24" :stroke-width="1.75" />
      </div>
      <h3 class="text-[15px] font-semibold text-pk-primary mb-1">
        No Telemetry Recorded
      </h3>
      <p class="text-[12px] text-pk-secondary max-w-[220px]">
        Tap <strong class="text-emerald-500">+ Record Vitals</strong> below to capture bedside observations.
      </p>
    </div>

    <!-- Empty State: No patient active -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-20 px-6 text-center select-none"
    >
      <img
        src="/icon.png"
        alt="Pocket Kardex"
        class="w-16 h-16 rounded-2xl shadow-lg border border-pk-border mb-3.5 object-cover"
      />
      <h3 class="text-[15px] font-semibold text-pk-primary mb-1">
        No Bed Selected
      </h3>
      <p class="text-[12px] text-pk-secondary max-w-[220px]">
        Select an active bed or tap <strong class="text-emerald-500">+ Add Bed</strong> above.
      </p>
    </div>

    <!-- Bottom Spacing so content is never hidden behind floating action button -->
    <div class="h-28" />
  </div>
</template>
