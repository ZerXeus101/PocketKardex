<script setup>
import { ref, computed, watch } from 'vue'
import TimePicker from './TimePicker.vue'
import { X, Check, Clock, ChevronDown, ChevronUp, AlertTriangle, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  visible: { type: Boolean, default: false },
  existingRecord: { type: Object, default: null }
})

const emit = defineEmits(['close', 'save', 'delete'])

const showDeleteConfirm = ref(false)

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

const o2Options = ['RA', '1L NC', '2L NC', '3L NC', '4L NC', 'Face Mask', 'Venturi', 'NRB']

const pulseDeficit = computed(() => {
  const ap = parseInt(apicalPulse.value)
  const rp = parseInt(radialPulse.value)
  if (!isNaN(ap) && !isNaN(rp)) return Math.abs(ap - rp)
  return null
})

const timeDisplay = computed(() => {
  const d = new Date(timestamp.value)
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
})

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
  showDeleteConfirm.value = false
}

function confirmDelete() {
  if (props.existingRecord?.id) {
    if (navigator.vibrate) navigator.vibrate([10, 50, 10])
    emit('delete', props.existingRecord.id)
    showDeleteConfirm.value = false
  }
}

watch(() => props.visible, (v) => {
  if (v) reset()
})

function toNum(v) {
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

function toInt(v) {
  const n = parseInt(v)
  return isNaN(n) ? null : n
}

function save() {
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

function copyLeftToRight() {
  showRightArm.value = true
  bpSystolicR.value = bpSystolicL.value
  bpDiastolicR.value = bpDiastolicL.value
}
</script>

<template>
  <Teleport to="body">
    <Transition name="ios-sheet">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-end justify-center select-none"
      >
        <!-- iOS Sheet Backdrop with Blur -->
        <div
          class="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          @click="$emit('close')"
        />

        <!-- Sheet Panel -->
        <div
          class="relative w-full max-w-lg bg-[#16161a] rounded-t-[32px] border-t border-white/[0.12] shadow-2xl max-h-[92dvh] flex flex-col z-10 overflow-hidden"
        >
          <!-- Native iOS Grab Handle -->
          <div class="flex justify-center pt-3 pb-1">
            <div class="w-10 h-1 bg-white/20 rounded-full" />
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-2">
            <div>
              <h2 class="text-[17px] font-bold tracking-tight text-white">
                {{ existingRecord ? 'Edit Bedside Vitals' : 'Record Bedside Vitals' }}
              </h2>
              <p class="text-[11px] text-zinc-400">
                Large touch targets optimized for gloved bedside use
              </p>
            </div>
            <div class="flex items-center gap-1.5">
              <button
                v-if="existingRecord"
                @click="showDeleteConfirm = !showDeleteConfirm"
                class="btn-press w-8.5 h-8.5 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 hover:text-rose-300"
                aria-label="Delete vitals entry"
                title="Delete vitals entry"
              >
                <Trash2 :size="15" />
              </button>
              <button
                @click="$emit('close')"
                class="btn-press w-8.5 h-8.5 rounded-full bg-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X :size="16" />
              </button>
            </div>
          </div>

          <!-- Delete Confirmation Banner -->
          <div
            v-if="showDeleteConfirm"
            class="mx-5 mb-2 p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-2.5"
          >
            <p class="text-[12px] font-semibold text-rose-200">
              Permanently delete this vitals record?
            </p>
            <div class="flex gap-2">
              <button
                @click="showDeleteConfirm = false"
                class="btn-press flex-1 h-9 rounded-xl bg-zinc-800 text-zinc-300 text-[12px] font-semibold"
              >
                Cancel
              </button>
              <button
                @click="confirmDelete"
                class="btn-press flex-1 h-9 rounded-xl bg-rose-600 text-white text-[12px] font-bold"
              >
                Confirm Delete
              </button>
            </div>
          </div>

          <!-- Assessment Time Pill -->
          <div class="px-5 pt-1 pb-3">
            <button
              @click="showTimePicker = !showTimePicker"
              class="btn-press inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-emerald-400 text-[13px] font-vitals font-semibold"
            >
              <Clock :size="13" />
              <span>Assessment Time: {{ timeDisplay }}</span>
              <component :is="showTimePicker ? ChevronUp : ChevronDown" :size="13" class="text-zinc-400" />
            </button>
            <div v-if="showTimePicker" class="mt-2.5 p-3 rounded-2xl bg-zinc-950 border border-white/[0.08]">
              <TimePicker v-model="timestamp" />
            </div>
          </div>

          <!-- Form Body -->
          <div class="flex-1 overflow-y-auto overscroll-contain px-5 pb-6 space-y-5 scroll-touch no-scrollbar">

            <!-- 1. BLOOD PRESSURE -->
            <section class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[11px] tracking-wider text-zinc-400 font-bold uppercase">
                  Blood Pressure (mmHg)
                </span>
                <button
                  v-if="!showRightArm"
                  @click="showRightArm = true"
                  class="text-[11px] text-emerald-400 font-semibold active:opacity-70 cursor-pointer"
                >
                  + Add Right Arm
                </button>
              </div>

              <!-- Left Arm -->
              <div class="flex items-center gap-2">
                <div class="w-7 text-[12px] font-bold text-zinc-400 text-center">L</div>
                <input
                  v-model="bpSystolicL"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  placeholder="Sys"
                  class="flex-1 h-12 bg-zinc-900 border border-white/[0.1] rounded-xl text-center font-vitals text-base font-bold text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                />
                <span class="text-zinc-500 font-vitals text-lg font-bold">/</span>
                <input
                  v-model="bpDiastolicL"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  placeholder="Dia"
                  class="flex-1 h-12 bg-zinc-900 border border-white/[0.1] rounded-xl text-center font-vitals text-base font-bold text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <!-- Right Arm -->
              <div v-if="showRightArm" class="flex items-center gap-2 pt-1">
                <div class="w-7 text-[12px] font-bold text-zinc-400 text-center">R</div>
                <input
                  v-model="bpSystolicR"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  placeholder="Sys"
                  class="flex-1 h-12 bg-zinc-900 border border-white/[0.1] rounded-xl text-center font-vitals text-base font-bold text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                />
                <span class="text-zinc-500 font-vitals text-lg font-bold">/</span>
                <input
                  v-model="bpDiastolicR"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  placeholder="Dia"
                  class="flex-1 h-12 bg-zinc-900 border border-white/[0.1] rounded-xl text-center font-vitals text-base font-bold text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  v-if="bpSystolicL"
                  @click="copyLeftToRight"
                  class="btn-press text-[11px] text-zinc-400 px-2 py-1 rounded-lg bg-zinc-800 border border-white/[0.08]"
                >
                  Copy L
                </button>
              </div>
            </section>

            <!-- 2. PULSES & DEFICIT -->
            <section class="space-y-2">
              <span class="text-[11px] tracking-wider text-zinc-400 font-bold uppercase">
                Heart Rate & Rhythm (bpm)
              </span>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-[11px] text-zinc-400 font-medium block mb-1">
                    Apical Pulse
                  </label>
                  <input
                    v-model="apicalPulse"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    placeholder="Auscultated"
                    class="w-full h-12 bg-zinc-900 border border-white/[0.1] rounded-xl text-center font-vitals text-base font-bold text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="text-[11px] text-zinc-400 font-medium block mb-1">
                    Radial Pulse
                  </label>
                  <input
                    v-model="radialPulse"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    placeholder="Palpated"
                    class="w-full h-12 bg-zinc-900 border border-white/[0.1] rounded-xl text-center font-vitals text-base font-bold text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <!-- Pulse Deficit Real-time Calculation Badge -->
              <div
                v-if="pulseDeficit !== null"
                class="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-vitals font-semibold transition-all"
                :class="[
                  pulseDeficit > 0
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-zinc-900 text-zinc-400 border border-white/[0.06]'
                ]"
              >
                <AlertTriangle v-if="pulseDeficit > 0" :size="13" />
                <span>Calculated Pulse Deficit: {{ pulseDeficit }} bpm</span>
                <span v-if="pulseDeficit === 0" class="text-emerald-400 text-[11px] font-sans font-normal ml-auto">
                  (Equal / Normal)
                </span>
              </div>
            </section>

            <!-- 3. RESPIRATORY & OXYGENATION -->
            <section class="space-y-2">
              <span class="text-[11px] tracking-wider text-zinc-400 font-bold uppercase">
                Respiratory & Oxygenation
              </span>
              <div class="grid grid-cols-3 gap-2.5">
                <div>
                  <label class="text-[11px] text-zinc-400 font-medium block mb-1">
                    SpO₂ (%)
                  </label>
                  <input
                    v-model="spO2"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    placeholder="98"
                    class="w-full h-12 bg-zinc-900 border border-white/[0.1] rounded-xl text-center font-vitals text-base font-bold text-sky-400 placeholder-zinc-600 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="text-[11px] text-zinc-400 font-medium block mb-1">
                    Oximeter PR
                  </label>
                  <input
                    v-model="pulseOxPR"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    placeholder="61"
                    class="w-full h-12 bg-zinc-900 border border-white/[0.1] rounded-xl text-center font-vitals text-base font-bold text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="text-[11px] text-zinc-400 font-medium block mb-1">
                    Resp Rate
                  </label>
                  <input
                    v-model="respiratoryRate"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    placeholder="18"
                    class="w-full h-12 bg-zinc-900 border border-white/[0.1] rounded-xl text-center font-vitals text-base font-bold text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <!-- O2 Delivery Chips -->
              <div class="pt-1">
                <label class="text-[11px] text-zinc-400 font-medium block mb-1.5">
                  Oxygen Delivery Mode
                </label>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="opt in o2Options"
                    :key="opt"
                    @click="oxygenDelivery = opt"
                    class="btn-press px-3 py-1.5 rounded-xl text-[12px] font-semibold border cursor-pointer"
                    :class="[
                      oxygenDelivery === opt
                        ? 'bg-sky-500 text-black border-sky-400 shadow-sm'
                        : 'bg-zinc-900 text-zinc-300 border-white/[0.08] hover:border-white/[0.16]'
                    ]"
                  >
                    {{ opt }}
                  </button>
                </div>
              </div>
            </section>

            <!-- 4. TEMPERATURE & PAIN SCORE -->
            <section class="space-y-2">
              <span class="text-[11px] tracking-wider text-zinc-400 font-bold uppercase">
                Temperature & Pain Score
              </span>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-[11px] text-zinc-400 font-medium block mb-1">
                    Temp (°C)
                  </label>
                  <input
                    v-model="temperature"
                    type="text"
                    inputmode="decimal"
                    placeholder="36.8"
                    class="w-full h-12 bg-zinc-900 border border-white/[0.1] rounded-xl text-center font-vitals text-base font-bold text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="text-[11px] text-zinc-400 font-medium block mb-1">
                    Pain (0–10)
                  </label>
                  <div class="h-12 flex items-center justify-center bg-zinc-900 border border-white/[0.1] rounded-xl font-vitals font-bold text-white text-base">
                    {{ painScore !== null ? `${painScore} / 10` : 'None' }}
                  </div>
                </div>
              </div>

              <!-- Pain Scale Selector (0-10) -->
              <div class="flex gap-1 pt-1 overflow-x-auto no-scrollbar py-0.5">
                <button
                  v-for="n in 11"
                  :key="n - 1"
                  @click="painScore = (painScore === n - 1) ? null : n - 1"
                  class="btn-press flex-1 min-w-[30px] h-9.5 rounded-lg text-[12px] font-vitals font-bold flex items-center justify-center cursor-pointer"
                  :class="[
                    painScore === n - 1
                      ? (n - 1 <= 3
                          ? 'bg-emerald-500 text-black shadow-sm'
                          : n - 1 <= 6
                            ? 'bg-amber-400 text-black shadow-sm'
                            : 'bg-rose-500 text-white shadow-sm')
                      : 'bg-zinc-900 text-zinc-400 border border-white/[0.06] hover:border-white/[0.14]'
                  ]"
                >
                  {{ n - 1 }}
                </button>
              </div>
            </section>

            <!-- 5. CLINICAL NOTE -->
            <section class="space-y-1.5">
              <span class="text-[11px] tracking-wider text-zinc-400 font-bold uppercase">
                Clinical Observation Note
              </span>
              <textarea
                v-model="notes"
                rows="2"
                placeholder="Observation (e.g. Post-nebulization, complained of mild dizziness)..."
                class="w-full bg-zinc-900 border border-white/[0.1] rounded-xl p-3 text-white placeholder-zinc-600 text-base focus:border-emerald-500 focus:outline-none resize-none leading-relaxed"
              />
            </section>
          </div>

          <!-- Bottom Sticky Action Bar with Safe Area -->
          <div class="px-5 pt-3 pb-safe bg-[#16161a] border-t border-white/[0.08]">
            <button
              @click="save"
              class="btn-press w-full h-13 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[16px] tracking-tight flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Check :size="18" :stroke-width="2.5" />
              <span>{{ existingRecord ? 'Update Record' : 'Save Vitals Record' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ios-sheet-enter-active,
.ios-sheet-leave-active {
  transition: opacity 0.22s ease;
}
.ios-sheet-enter-active > div:last-child,
.ios-sheet-leave-active > div:last-child {
  transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}
.ios-sheet-enter-from,
.ios-sheet-leave-to {
  opacity: 0;
}
.ios-sheet-enter-from > div:last-child {
  transform: translateY(100%);
}
.ios-sheet-leave-to > div:last-child {
  transform: translateY(100%);
}
</style>
