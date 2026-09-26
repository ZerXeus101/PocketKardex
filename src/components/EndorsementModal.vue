<script setup>
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { usePatientStore } from '../stores/patientStore.js'
import { useVitalsStore } from '../stores/vitalsStore.js'
import { X, Copy, Check, Users, BedDouble } from 'lucide-vue-next'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const patientStore = usePatientStore()
const vitalsStore = useVitalsStore()
const { patients, activePatient } = storeToRefs(patientStore)

const copiedBed = ref(false)
const copiedAll = ref(false)

async function generateForPatient(patient) {
  const records = await vitalsStore.getAllForPatient(patient.id)
  if (records.length === 0) return null

  const lines = []
  const identifier = [patient.bedNumber]
  if (patient.ageGender) identifier.push(patient.ageGender)
  if (patient.initials) identifier.push(patient.initials)
  if (patient.diagnosis) identifier.push(patient.diagnosis)

  lines.push(`═══ ${identifier.join(' | ')} ═══`)

  for (const record of records) {
    lines.push(vitalsStore.formatEndorsement(record))
  }

  if (patient.notes) {
    lines.push(`Handover: ${patient.notes}`)
  }

  return lines.join('\n')
}

const currentEndorsement = ref('')
const allEndorsement = ref('')

async function refresh() {
  if (!props.visible) return

  if (activePatient.value) {
    currentEndorsement.value = (await generateForPatient(activePatient.value)) || 'No vitals recorded for this bed.'
  } else {
    currentEndorsement.value = 'No bed currently selected.'
  }

  const parts = []
  for (const p of patients.value) {
    const text = await generateForPatient(p)
    if (text) parts.push(text)
  }
  allEndorsement.value = parts.length > 0
    ? parts.join('\n\n')
    : 'No active patients with vitals to endorse.'
}

watch(() => props.visible, (v) => {
  if (v) {
    copiedBed.value = false
    copiedAll.value = false
    refresh()
  }
})

async function copyToClipboard(text, isAll = false) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }

  if (navigator.vibrate) navigator.vibrate(8)

  if (isAll) {
    copiedAll.value = true
    setTimeout(() => { copiedAll.value = false }, 2000)
  } else {
    copiedBed.value = true
    setTimeout(() => { copiedBed.value = false }, 2000)
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="ios-modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-end justify-center select-none"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          @click="$emit('close')"
        />

        <!-- Sheet Panel -->
        <div
          class="relative w-full max-w-lg bg-pk-sheet rounded-t-[32px] border-t border-pk-border-sheet shadow-2xl max-h-[90dvh] flex flex-col z-10 overflow-hidden transition-colors"
        >
          <!-- Grab Handle -->
          <div class="flex justify-center pt-3 pb-1">
            <div class="w-10 h-1 bg-pk-muted/40 rounded-full" />
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-2">
            <div>
              <h2 class="text-[17px] font-bold tracking-tight text-pk-primary">
                Shift Endorsement
              </h2>
              <p class="text-[11px] text-pk-secondary">
                Ward handoff shorthand formatted for reading or clipboard
              </p>
            </div>
            <button
              @click="$emit('close')"
              class="btn-press w-8.5 h-8.5 rounded-full bg-pk-subtle flex items-center justify-center text-pk-secondary hover:text-pk-primary cursor-pointer"
            >
              <X :size="16" />
            </button>
          </div>

          <!-- Content Body -->
          <div class="flex-1 overflow-y-auto overscroll-contain px-5 pb-6 space-y-5 scroll-touch no-scrollbar">

            <!-- 1. Current Bed Endorsement -->
            <div v-if="activePatient" class="space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5 text-pk-primary text-[13px] font-bold">
                  <BedDouble :size="15" class="text-emerald-500" />
                  <span>{{ activePatient.bedNumber }} Endorsement</span>
                </div>
                <button
                  @click="copyToClipboard(currentEndorsement, false)"
                  class="btn-press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-semibold cursor-pointer transition-colors"
                  :class="[
                    copiedBed
                      ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                      : 'bg-pk-card text-pk-primary border-pk-border hover:border-pk-border-card'
                  ]"
                >
                  <component :is="copiedBed ? Check : Copy" :size="13" />
                  <span>{{ copiedBed ? 'Copied Bed' : 'Copy Bed' }}</span>
                </button>
              </div>

              <div class="relative bg-pk-input rounded-2xl p-3 border border-pk-border">
                <pre class="text-[12px] font-vitals text-pk-primary leading-relaxed whitespace-pre-wrap select-text">{{ currentEndorsement }}</pre>
              </div>
            </div>

            <!-- Divider -->
            <div class="border-t border-pk-border" />

            <!-- 2. All Beds Summary -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5 text-pk-primary text-[13px] font-bold">
                  <Users :size="15" class="text-pk-secondary" />
                  <span>Full Round Summary (All Beds)</span>
                </div>
                <button
                  @click="copyToClipboard(allEndorsement, true)"
                  class="btn-press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-semibold cursor-pointer transition-colors"
                  :class="[
                    copiedAll
                      ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                      : 'bg-pk-card text-pk-primary border-pk-border hover:border-pk-border-card'
                  ]"
                >
                  <component :is="copiedAll ? Check : Copy" :size="13" />
                  <span>{{ copiedAll ? 'Copied All' : 'Copy All Beds' }}</span>
                </button>
              </div>

              <div class="relative bg-pk-input rounded-2xl p-3 border border-pk-border">
                <pre class="text-[12px] font-vitals text-pk-primary leading-relaxed whitespace-pre-wrap select-text">{{ allEndorsement }}</pre>
              </div>
            </div>
          </div>

          <!-- Bottom Safe Area Buffer -->
          <div class="pb-safe" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ios-modal-enter-active,
.ios-modal-leave-active {
  transition: opacity 0.2s ease;
}
.ios-modal-enter-active > div:last-child,
.ios-modal-leave-active > div:last-child {
  transition: transform 0.26s cubic-bezier(0.32, 0.72, 0, 1);
}
.ios-modal-enter-from,
.ios-modal-leave-to {
  opacity: 0;
}
.ios-modal-enter-from > div:last-child {
  transform: translateY(100%);
}
.ios-modal-leave-to > div:last-child {
  transform: translateY(100%);
}
</style>
