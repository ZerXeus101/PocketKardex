<script setup>
import { ref, computed, watch } from 'vue'
import TimePicker from './TimePicker.vue'
import { X, Save, Clock, ChevronDown, ChevronUp } from 'lucide-vue-next'

const props = defineProps({
  visible: { type: Boolean, default: false },
  existingRecord: { type: Object, default: null }
})

const emit = defineEmits(['close', 'save'])

// ── Form State ──────────────────────────────────────────────
const timestamp = ref(Date.now())
const showTimePicker = ref(false)

// BP
const bpSystolicL = ref('')
const bpDiastolicL = ref('')
const showRightArm = ref(false)
const bpSystolicR = ref('')
const bpDiastolicR = ref('')

// Pulse
const apicalPulse = ref('')
const radialPulse = ref('')

// Respiratory & O2
const spO2 = ref('')
const pulseOxPR = ref('')
const respiratoryRate = ref('')
const oxygenDelivery = ref('RA')

// Temp & Pain
const temperature = ref('')
const painScore = ref(null)

// Note
const notes = ref('')

// ── O2 Delivery Options ────────────────────────────────────
const o2Options = ['RA', '1L NC', '2L NC', '3L NC', '4L NC', 'Face Mask', 'Venturi', 'NRB']

// ── Auto Pulse Deficit ─────────────────────────────────────
const pulseDeficit = computed(() => {
  const ap = parseInt(apicalPulse.value)
  const rp = parseInt(radialPulse.value)
  if (!isNaN(ap) && !isNaN(rp)) return Math.abs(ap - rp)
  return null
})

// ── Time Display ───────────────────────────────────────────
const timeDisplay = computed(() => {
  const d = new Date(timestamp.value)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
})

// ── Reset / Populate ───────────────────────────────────────
function reset() {
  const r = props.existingRecord
  if (r) {
    timestamp.value = r.timestamp
    bpSystolicL.value = r.bpSystolicL ?? ''
    bpDiastolicL.value = r.bpDiastolicL ?? ''
    bpSystolicR.value = r.bpSystolicR ?? ''
    bpDiastolicR.value = r.bpDiastolicR ?? ''
    showRightArm.value = r.bpSystolicR != null
    apicalPulse.value = r.apicalPulse ?? ''
    radialPulse.value = r.radialPulse ?? ''
    spO2.value = r.spO2 ?? ''
    pulseOxPR.value = r.pulseOxPR ?? ''
    respiratoryRate.value = r.respiratoryRate ?? ''
    oxygenDelivery.value = r.oxygenDelivery || 'RA'
    temperature.value = r.temperature ?? ''
    painScore.value = r.painScore ?? null
    notes.value = r.notes || ''
  } else {
    timestamp.value = Date.now()
    bpSystolicL.value = ''
    bpDiastolicL.value = ''
    bpSystolicR.value = ''
    bpDiastolicR.value = ''
    showRightArm.value = false
    apicalPulse.value = ''
    radialPulse.value = ''
    spO2.value = ''
    pulseOxPR.value = ''
    respiratoryRate.value = ''
    oxygenDelivery.value = 'RA'
    temperature.value = ''
    painScore.value = null
    notes.value = ''
    showTimePicker.value = false
  }
}

watch(() => props.visible, (v) => {
  if (v) reset()
})

// ── Helpers ────────────────────────────────────────────────
function toNum(v) {
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

function toInt(v) {
  const n = parseInt(v)
  return isNaN(n) ? null : n
}

// ── Save ───────────────────────────────────────────────────
function save() {
  // Haptic feedback
  if (navigator.vibrate) navigator.vibrate(10)

  const data = {
    id: props.existingRecord?.id,
    timestamp: timestamp.value,
    bpSystolicL: toInt(bpSystolicL.value),
    bpDiastolicL: toInt(bpDiastolicL.value),
    bpSystolicR: showRightArm.value ? toInt(bpSystolicR.value) : null,
    bpDiastolicR: showRightArm.value ? toInt(bpDiastolicR.value) : null,
    apicalPulse: toInt(apicalPulse.value),
    radialPulse: toInt(radialPulse.value),
    respiratoryRate: toInt(respiratoryRate.value),
    spO2: toInt(spO2.value),
    pulseOxPR: toInt(pulseOxPR.value),
    oxygenDelivery: oxygenDelivery.value,
    temperature: toNum(temperature.value),
    painScore: painScore.value,
    notes: notes.value.trim()
  }

  emit('save', data)
}

// ── Copy L→R ───────────────────────────────────────────────
function copyLeftToRight() {
  showRightArm.value = true
  bpSystolicR.value = bpSystolicL.value
  bpDiastolicR.value = bpDiastolicL.value
}
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div
        v-if="visible"
        class="fixed inset-0 z-[100] flex items-end justify-center"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="$emit('close')"
        />

        <!-- Sheet -->
        <div class="relative w-full max-w-md bg-clinical-900 rounded-t-3xl
                    border-t border-x border-clinical-800
                    max-h-[90vh] flex flex-col z-10">

          <!-- Handle -->
          <div class="flex justify-center pt-2 pb-1">
            <div class="w-10 h-1 bg-clinical-700 rounded-full" />
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-2">
            <h2 class="text-lg font-bold text-text-primary">
              {{ existingRecord ? 'Edit Vitals' : 'Record Vitals' }}
            </h2>
            <button
              @click="$emit('close')"
              class="w-9 h-9 flex items-center justify-center rounded-lg
                     text-text-muted hover:text-text-primary hover:bg-clinical-800"
            >
              <X :size="18" />
            </button>
          </div>

          <!-- Time Button -->
          <div class="px-5 pb-3">
            <button
              @click="showTimePicker = !showTimePicker"
              class="flex items-center gap-2 px-3 py-2 rounded-xl
                     bg-clinical-800 border border-clinical-700
                     text-accent text-sm font-mono"
            >
              <Clock :size="14" />
              {{ timeDisplay }}
              <component :is="showTimePicker ? ChevronUp : ChevronDown" :size="14" class="text-text-muted" />
            </button>
            <div v-if="showTimePicker" class="mt-2">
              <TimePicker v-model="timestamp" />
            </div>
          </div>

          <!-- Scrollable Form -->
          <div class="flex-1 overflow-y-auto px-5 pb-4 space-y-5 scroll-touch">

            <!-- ═══ BLOOD PRESSURE ═══ -->
            <section>
              <h3 class="text-xs text-text-muted font-semibold uppercase tracking-wider mb-2">
                Blood Pressure (mmHg)
              </h3>
              <!-- Left Arm -->
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xs text-text-secondary w-6">L</span>
                <input
                  v-model="bpSystolicL"
                  inputmode="numeric"
                  placeholder="Sys"
                  class="flex-1 bg-clinical-800 border border-clinical-700 rounded-xl
                         px-3 py-3 text-text-primary text-center font-mono text-lg
                         placeholder-text-muted focus:outline-none focus:border-accent"
                />
                <span class="text-text-muted font-bold">/</span>
                <input
                  v-model="bpDiastolicL"
                  inputmode="numeric"
                  placeholder="Dia"
                  class="flex-1 bg-clinical-800 border border-clinical-700 rounded-xl
                         px-3 py-3 text-text-primary text-center font-mono text-lg
                         placeholder-text-muted focus:outline-none focus:border-accent"
                />
              </div>
              <!-- Right Arm Toggle -->
              <div class="flex items-center gap-2">
                <button
                  v-if="!showRightArm"
                  @click="showRightArm = true"
                  class="text-xs text-accent py-1"
                >
                  + Add Right Arm
                </button>
                <button
                  v-if="!showRightArm && bpSystolicL"
                  @click="copyLeftToRight"
                  class="text-xs text-text-muted py-1 ml-2"
                >
                  Copy L → R
                </button>
              </div>
              <!-- Right Arm -->
              <div v-if="showRightArm" class="flex items-center gap-2 mt-2">
                <span class="text-xs text-text-secondary w-6">R</span>
                <input
                  v-model="bpSystolicR"
                  inputmode="numeric"
                  placeholder="Sys"
                  class="flex-1 bg-clinical-800 border border-clinical-700 rounded-xl
                         px-3 py-3 text-text-primary text-center font-mono text-lg
                         placeholder-text-muted focus:outline-none focus:border-accent"
                />
                <span class="text-text-muted font-bold">/</span>
                <input
                  v-model="bpDiastolicR"
                  inputmode="numeric"
                  placeholder="Dia"
                  class="flex-1 bg-clinical-800 border border-clinical-700 rounded-xl
                         px-3 py-3 text-text-primary text-center font-mono text-lg
                         placeholder-text-muted focus:outline-none focus:border-accent"
                />
              </div>
            </section>

            <!-- ═══ PULSE ═══ -->
            <section>
              <h3 class="text-xs text-text-muted font-semibold uppercase tracking-wider mb-2">
                Heart Rate (bpm)
              </h3>
              <div class="flex items-center gap-3">
                <div class="flex-1">
                  <label class="text-xs text-text-secondary mb-1 block">Apical</label>
                  <input
                    v-model="apicalPulse"
                    inputmode="numeric"
                    placeholder="—"
                    class="w-full bg-clinical-800 border border-clinical-700 rounded-xl
                           px-3 py-3 text-text-primary text-center font-mono text-lg
                           placeholder-text-muted focus:outline-none focus:border-accent"
                  />
                </div>
                <div class="flex-1">
                  <label class="text-xs text-text-secondary mb-1 block">Radial</label>
                  <input
                    v-model="radialPulse"
                    inputmode="numeric"
                    placeholder="—"
                    class="w-full bg-clinical-800 border border-clinical-700 rounded-xl
                           px-3 py-3 text-text-primary text-center font-mono text-lg
                           placeholder-text-muted focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
              <!-- Live Pulse Deficit -->
              <div
                v-if="pulseDeficit !== null"
                class="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                :class="[
                  pulseDeficit > 0
                    ? 'bg-alert-warning/20 text-alert-warning'
                    : 'bg-clinical-800 text-text-muted'
                ]"
              >
                Pulse Deficit: {{ pulseDeficit }} bpm
              </div>
            </section>

            <!-- ═══ RESPIRATORY & O2 ═══ -->
            <section>
              <h3 class="text-xs text-text-muted font-semibold uppercase tracking-wider mb-2">
                Respiratory & Oxygen
              </h3>
              <div class="grid grid-cols-3 gap-2 mb-3">
                <div>
                  <label class="text-xs text-text-secondary mb-1 block">SpO₂ %</label>
                  <input
                    v-model="spO2"
                    inputmode="numeric"
                    placeholder="—"
                    class="w-full bg-clinical-800 border border-clinical-700 rounded-xl
                           px-2 py-3 text-text-primary text-center font-mono text-lg
                           placeholder-text-muted focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label class="text-xs text-text-secondary mb-1 block">PR</label>
                  <input
                    v-model="pulseOxPR"
                    inputmode="numeric"
                    placeholder="—"
                    class="w-full bg-clinical-800 border border-clinical-700 rounded-xl
                           px-2 py-3 text-text-primary text-center font-mono text-lg
                           placeholder-text-muted focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label class="text-xs text-text-secondary mb-1 block">RR</label>
                  <input
                    v-model="respiratoryRate"
                    inputmode="numeric"
                    placeholder="—"
                    class="w-full bg-clinical-800 border border-clinical-700 rounded-xl
                           px-2 py-3 text-text-primary text-center font-mono text-lg
                           placeholder-text-muted focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
              <!-- O2 Delivery Chips -->
              <label class="text-xs text-text-secondary mb-1.5 block">O₂ Delivery</label>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="opt in o2Options"
                  :key="opt"
                  @click="oxygenDelivery = opt"
                  class="px-3 py-1.5 rounded-full text-xs font-medium
                         border transition-colors"
                  :class="[
                    oxygenDelivery === opt
                      ? 'bg-accent text-clinical-950 border-accent'
                      : 'bg-clinical-800 text-text-secondary border-clinical-700 hover:border-clinical-600'
                  ]"
                >
                  {{ opt }}
                </button>
              </div>
            </section>

            <!-- ═══ TEMP & PAIN ═══ -->
            <section>
              <h3 class="text-xs text-text-muted font-semibold uppercase tracking-wider mb-2">
                Temperature & Pain
              </h3>
              <div class="flex gap-3 mb-3">
                <div class="flex-1">
                  <label class="text-xs text-text-secondary mb-1 block">Temp °C</label>
                  <input
                    v-model="temperature"
                    inputmode="decimal"
                    placeholder="36.5"
                    class="w-full bg-clinical-800 border border-clinical-700 rounded-xl
                           px-3 py-3 text-text-primary text-center font-mono text-lg
                           placeholder-text-muted focus:outline-none focus:border-accent"
                  />
                </div>
                <div class="flex-1">
                  <label class="text-xs text-text-secondary mb-1 block">Pain (0–10)</label>
                  <div class="flex items-center gap-0.5 mt-1">
                    <button
                      v-for="n in 11"
                      :key="n - 1"
                      @click="painScore = (painScore === n - 1) ? null : n - 1"
                      class="flex-1 h-10 rounded-lg text-xs font-mono font-semibold
                             transition-colors min-w-0"
                      :class="[
                        painScore === n - 1
                          ? (n - 1 <= 3 ? 'bg-accent text-clinical-950'
                             : n - 1 <= 6 ? 'bg-alert-warning text-clinical-950'
                             : 'bg-alert-danger text-white')
                          : 'bg-clinical-800 text-text-muted hover:bg-clinical-700'
                      ]"
                    >
                      {{ n - 1 }}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <!-- ═══ NOTE ═══ -->
            <section>
              <h3 class="text-xs text-text-muted font-semibold uppercase tracking-wider mb-2">
                Clinical Note
              </h3>
              <textarea
                v-model="notes"
                rows="2"
                placeholder="Post-nebulization, Complains of dizziness..."
                class="w-full bg-clinical-800 border border-clinical-700 rounded-xl
                       px-4 py-3 text-text-primary placeholder-text-muted text-sm
                       focus:outline-none focus:border-accent resize-none"
              />
            </section>
          </div>

          <!-- Save Button (sticky bottom) -->
          <div class="px-5 pt-3 pb-5 pb-safe border-t border-clinical-800 bg-clinical-900">
            <button
              @click="save"
              class="w-full py-4 rounded-2xl bg-accent text-clinical-950
                     font-bold text-base flex items-center justify-center gap-2
                     active:bg-accent-light transition-colors"
            >
              <Save :size="18" />
              {{ existingRecord ? 'Update Record' : 'Save Record' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s ease;
}
.sheet-enter-active > div:last-child,
.sheet-leave-active > div:last-child {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from > div:last-child {
  transform: translateY(100%);
}
.sheet-leave-to > div:last-child {
  transform: translateY(100%);
}
</style>
