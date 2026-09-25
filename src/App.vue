<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { usePatientStore } from './stores/patientStore.js'
import { useVitalsStore } from './stores/vitalsStore.js'
import { Plus } from 'lucide-vue-next'

import AppHeader from './components/AppHeader.vue'
import BedDeck from './components/BedDeck.vue'
import VitalsFeed from './components/VitalsFeed.vue'
import VitalsEntrySheet from './components/VitalsEntrySheet.vue'
import PatientModal from './components/PatientModal.vue'
import EndorsementModal from './components/EndorsementModal.vue'
import SettingsModal from './components/SettingsModal.vue'

const patientStore = usePatientStore()
const vitalsStore = useVitalsStore()
const { activePatientId } = storeToRefs(patientStore)

// ── Modal visibility ────────────────────────────────────────
const showVitalsEntry = ref(false)
const showPatientModal = ref(false)
const showEndorsement = ref(false)
const showSettings = ref(false)

// ── Edit states ─────────────────────────────────────────────
const editingPatient = ref(null)
const editingVitals = ref(null)

// ── Patient actions ─────────────────────────────────────────
function openAddPatient() {
  editingPatient.value = null
  showPatientModal.value = true
}

async function handleSavePatient(data) {
  if (data.id) {
    await patientStore.updatePatient(data.id, data)
  } else {
    await patientStore.addPatient(data)
  }
  showPatientModal.value = false
}

// ── Vitals actions ──────────────────────────────────────────
function openRecordVitals() {
  editingVitals.value = null
  showVitalsEntry.value = true
}

function openEditVitals(record) {
  editingVitals.value = record
  showVitalsEntry.value = true
}

async function handleSaveVitals(data) {
  if (data.id) {
    // Edit existing
    await vitalsStore.updateVitals(data.id, data)
  } else {
    // New record
    await vitalsStore.addVitals(activePatientId.value, data)
  }
  showVitalsEntry.value = false
}
</script>

<template>
  <div class="min-h-dvh bg-surface-bg flex flex-col">
    <!-- Header -->
    <AppHeader
      @open-endorsement="showEndorsement = true"
      @open-settings="showSettings = true"
    />

    <!-- Bed Deck Strip -->
    <BedDeck @add-patient="openAddPatient" />

    <!-- Divider -->
    <div class="h-px bg-clinical-800 mx-3" />

    <!-- Vitals Feed -->
    <VitalsFeed @edit-vitals="openEditVitals" />

    <!-- Floating Action Button: Record Vitals -->
    <div class="sticky bottom-0 pb-safe z-40 pointer-events-none">
      <div class="flex justify-center pb-4">
        <button
          v-if="activePatientId"
          @click="openRecordVitals"
          class="pointer-events-auto flex items-center gap-2
                 px-6 py-3.5 rounded-2xl
                 bg-accent text-clinical-950 font-bold text-sm
                 shadow-lg shadow-accent/25
                 active:bg-accent-light transition-all"
        >
          <Plus :size="18" :stroke-width="2.5" />
          Record Vitals
        </button>
      </div>
    </div>

    <!-- ═══ MODALS ═══ -->

    <!-- Vitals Entry Sheet -->
    <VitalsEntrySheet
      :visible="showVitalsEntry"
      :existing-record="editingVitals"
      @close="showVitalsEntry = false"
      @save="handleSaveVitals"
    />

    <!-- Patient Modal -->
    <PatientModal
      :visible="showPatientModal"
      :patient="editingPatient"
      @close="showPatientModal = false"
      @save="handleSavePatient"
    />

    <!-- Endorsement Modal -->
    <EndorsementModal
      :visible="showEndorsement"
      @close="showEndorsement = false"
    />

    <!-- Settings Modal -->
    <SettingsModal
      :visible="showSettings"
      @close="showSettings = false"
    />
  </div>
</template>
