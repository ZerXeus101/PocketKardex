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

// ── Modal Visibility ────────────────────────────────────────
const showVitalsEntry = ref(false)
const showPatientModal = ref(false)
const showEndorsement = ref(false)
const showSettings = ref(false)

// ── Edit States ─────────────────────────────────────────────
const editingPatient = ref(null)
const editingVitals = ref(null)

// ── Patient Actions ─────────────────────────────────────────
function openAddPatient() {
  editingPatient.value = null
  showPatientModal.value = true
}

function openEditPatient(patient) {
  editingPatient.value = patient
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

async function handleDeletePatient(id) {
  await patientStore.deletePatient(id)
  showPatientModal.value = false
}

// ── Vitals Actions ──────────────────────────────────────────
function openRecordVitals() {
  if (navigator.vibrate) navigator.vibrate(8)
  editingVitals.value = null
  showVitalsEntry.value = true
}

function openEditVitals(record) {
  if (navigator.vibrate) navigator.vibrate(6)
  editingVitals.value = record
  showVitalsEntry.value = true
}

async function handleSaveVitals(data) {
  if (data.id) {
    await vitalsStore.updateVitals(data.id, data)
  } else {
    await vitalsStore.addVitals(activePatientId.value, data)
  }
  showVitalsEntry.value = false
}

async function handleDeleteVitals(id) {
  await vitalsStore.deleteVitals(id)
  showVitalsEntry.value = false
}
</script>

<template>
  <div class="h-[100dvh] max-h-[100dvh] w-full bg-pk-canvas text-pk-primary flex flex-col overflow-hidden select-none">
    <!-- Top Navigation & Clinical Branding -->
    <AppHeader
      @open-endorsement="showEndorsement = true"
      @open-settings="showSettings = true"
    />

    <!-- Bed Deck: Horizontal Bed Telemetry Strip -->
    <BedDeck @add-patient="openAddPatient" />

    <!-- Main Telemetry Body: Isolated Scrollable View -->
    <main class="flex-1 min-h-0 flex flex-col overflow-hidden relative">
      <VitalsFeed
        @edit-vitals="openEditVitals"
        @edit-patient="openEditPatient"
      />

      <!-- Native Floating Action Pill with Frosted Shield -->
      <div
        v-if="activePatientId"
        class="absolute bottom-0 left-0 right-0 pointer-events-none pb-safe z-20 flex justify-center pt-6"
        style="background: var(--pk-gradient-bottom)"
      >
        <button
          @click="openRecordVitals"
          class="btn-press pointer-events-auto h-13 px-6 rounded-full bg-pk-fab text-pk-fab-text font-bold text-[15px] tracking-tight flex items-center gap-2 border border-black/10 mb-1 cursor-pointer transition-colors"
          style="box-shadow: 0 10px 25px -5px var(--pk-fab-shadow)"
        >
          <Plus :size="19" :stroke-width="2.75" />
          <span>Record Vitals</span>
        </button>
      </div>
    </main>

    <!-- ═══ Native iOS Sheets & Modals ═══ -->
    <VitalsEntrySheet
      :visible="showVitalsEntry"
      :existing-record="editingVitals"
      @close="showVitalsEntry = false"
      @save="handleSaveVitals"
      @delete="handleDeleteVitals"
    />

    <PatientModal
      :visible="showPatientModal"
      :patient="editingPatient"
      @close="showPatientModal = false"
      @save="handleSavePatient"
      @delete="handleDeletePatient"
    />

    <EndorsementModal
      :visible="showEndorsement"
      @close="showEndorsement = false"
    />

    <SettingsModal
      :visible="showSettings"
      @close="showSettings = false"
    />
  </div>
</template>
