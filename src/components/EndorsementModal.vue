<script setup>
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { usePatientStore } from '../stores/patientStore.js'
import { useVitalsStore } from '../stores/vitalsStore.js'
import { X, Copy, ClipboardCheck, Users } from 'lucide-vue-next'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const patientStore = usePatientStore()
const vitalsStore = useVitalsStore()
const { patients, activePatient } = storeToRefs(patientStore)

const copied = ref(false)
const copiedAll = ref(false)

// Generate endorsement text for a single patient
async function generateForPatient(patient) {
  const records = await vitalsStore.getAllForPatient(patient.id)
  if (records.length === 0) return null

  const lines = []
  lines.push(`── ${patient.bedNumber} | ${patient.ageGender || ''} ${patient.initials || ''} | ${patient.diagnosis || ''} ──`)

  for (const record of records) {
    lines.push(vitalsStore.formatEndorsement(record))
  }

  if (patient.notes) {
    lines.push(`Handover: ${patient.notes}`)
  }

  return lines.join('\n')
}

// Current patient endorsement
const currentEndorsement = ref('')
const allEndorsement = ref('')

async function refresh() {
  if (!props.visible) return

  // Current patient
  if (activePatient.value) {
    currentEndorsement.value = await generateForPatient(activePatient.value) || 'No vitals recorded.'
  } else {
    currentEndorsement.value = 'No patient selected.'
  }

  // All patients
  const parts = []
  for (const p of patients.value) {
    const text = await generateForPatient(p)
    if (text) parts.push(text)
  }
  allEndorsement.value = parts.length > 0
    ? parts.join('\n\n')
    : 'No patients or vitals recorded.'
}

watch(() => props.visible, (v) => {
  if (v) {
    copied.value = false
    copiedAll.value = false
    refresh()
  }
})

async function copyCurrentBed() {
  try {
    await navigator.clipboard.writeText(currentEndorsement.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Fallback for iOS
    const ta = document.createElement('textarea')
    ta.value = currentEndorsement.value
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

async function copyAll() {
  try {
    await navigator.clipboard.writeText(allEndorsement.value)
    copiedAll.value = true
    setTimeout(() => { copiedAll.value = false }, 2000)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = allEndorsement.value
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copiedAll.value = true
    setTimeout(() => { copiedAll.value = false }, 2000)
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')" />

        <!-- Panel -->
        <div class="relative w-full max-w-lg bg-clinical-900 rounded-t-3xl sm:rounded-2xl
                    border border-clinical-800 max-h-[85vh] flex flex-col z-10">

          <!-- Handle -->
          <div class="flex justify-center pt-2 pb-1 sm:hidden">
            <div class="w-10 h-1 bg-clinical-700 rounded-full" />
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-3">
            <h2 class="text-lg font-bold text-text-primary">Shift Endorsement</h2>
            <button
              @click="$emit('close')"
              class="w-9 h-9 flex items-center justify-center rounded-lg
                     text-text-muted hover:text-text-primary hover:bg-clinical-800"
            >
              <X :size="18" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto px-5 pb-5 space-y-4 scroll-touch">

            <!-- Current Bed -->
            <div v-if="activePatient">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-accent">
                  {{ activePatient.bedNumber }}
                </h3>
                <button
                  @click="copyCurrentBed"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                         font-medium transition-colors"
                  :class="[
                    copied
                      ? 'bg-accent/20 text-accent'
                      : 'bg-clinical-800 text-text-secondary hover:text-accent'
                  ]"
                >
                  <component :is="copied ? ClipboardCheck : Copy" :size="12" />
                  {{ copied ? 'Copied!' : 'Copy Bed' }}
                </button>
              </div>
              <pre class="text-xs text-text-secondary bg-clinical-950/60 rounded-xl
                         p-3 whitespace-pre-wrap font-mono leading-relaxed
                         border border-clinical-800">{{ currentEndorsement }}</pre>
            </div>

            <!-- Divider -->
            <div class="border-t border-clinical-800" />

            <!-- All Patients -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                  <Users :size="14" class="text-text-muted" />
                  All Patients Summary
                </h3>
                <button
                  @click="copyAll"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                         font-medium transition-colors"
                  :class="[
                    copiedAll
                      ? 'bg-accent/20 text-accent'
                      : 'bg-clinical-800 text-text-secondary hover:text-accent'
                  ]"
                >
                  <component :is="copiedAll ? ClipboardCheck : Copy" :size="12" />
                  {{ copiedAll ? 'Copied!' : 'Copy All' }}
                </button>
              </div>
              <pre class="text-xs text-text-secondary bg-clinical-950/60 rounded-xl
                         p-3 whitespace-pre-wrap font-mono leading-relaxed
                         border border-clinical-800">{{ allEndorsement }}</pre>
            </div>
          </div>

          <!-- Bottom padding -->
          <div class="pb-safe" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: transform 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div:last-child {
  transform: translateY(100%);
}
.modal-leave-to > div:last-child {
  transform: translateY(100%);
}
</style>
