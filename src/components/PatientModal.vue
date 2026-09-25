<script setup>
import { ref, watch } from 'vue'
import { X, Check, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  visible: { type: Boolean, default: false },
  patient: { type: Object, default: null }
})

const emit = defineEmits(['close', 'save', 'delete'])

const bedNumber = ref('')
const ageGender = ref('')
const initials = ref('')
const diagnosis = ref('')
const notes = ref('')
const showDeleteConfirm = ref(false)

function reset() {
  showDeleteConfirm.value = false
  if (props.patient) {
    bedNumber.value = props.patient.bedNumber || ''
    ageGender.value = props.patient.ageGender || ''
    initials.value = props.patient.initials || ''
    diagnosis.value = props.patient.diagnosis || ''
    notes.value = props.patient.notes || ''
  } else {
    bedNumber.value = ''
    ageGender.value = ''
    initials.value = ''
    diagnosis.value = ''
    notes.value = ''
  }
}

function confirmDelete() {
  if (props.patient?.id) {
    if (navigator.vibrate) navigator.vibrate([10, 50, 10])
    emit('delete', props.patient.id)
    showDeleteConfirm.value = false
  }
}

watch(() => props.visible, (v) => {
  if (v) reset()
})

function save() {
  if (!bedNumber.value.trim()) return
  if (navigator.vibrate) navigator.vibrate(8)

  emit('save', {
    id: props.patient?.id,
    bedNumber: bedNumber.value.trim(),
    ageGender: ageGender.value.trim(),
    initials: initials.value.trim().slice(0, 6),
    diagnosis: diagnosis.value.trim(),
    notes: notes.value.trim()
  })
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
          class="relative w-full max-w-lg bg-[#16161a] rounded-t-[32px] border-t border-white/[0.12] shadow-2xl p-5 pb-safe space-y-4 z-10 overflow-hidden"
        >
          <!-- Grab Handle -->
          <div class="flex justify-center -mt-1 pb-1">
            <div class="w-10 h-1 bg-white/20 rounded-full" />
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-[17px] font-bold tracking-tight text-white">
                {{ patient ? 'Edit Bed Assignment' : 'New Bed Assignment' }}
              </h2>
              <p class="text-[11px] text-zinc-400">
                Zero PHI: bed label, age/gender, and initials only
              </p>
            </div>
            <button
              @click="$emit('close')"
              class="btn-press w-8.5 h-8.5 rounded-full bg-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X :size="16" />
            </button>
          </div>

          <!-- Form Fields -->
          <div class="space-y-3">
            <!-- Bed Label -->
            <div>
              <label class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1 block">
                Bed / Room Label *
              </label>
              <input
                v-model="bedNumber"
                type="text"
                placeholder="e.g. Bed 4-A or Rm 302-1"
                class="w-full h-12 bg-zinc-900 border border-white/[0.1] rounded-xl px-4 text-base font-semibold text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <!-- Age/Gender + Initials -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1 block">
                  Age / Sex
                </label>
                <input
                  v-model="ageGender"
                  type="text"
                  placeholder="e.g. 64M or 22F"
                  class="w-full h-12 bg-zinc-900 border border-white/[0.1] rounded-xl px-4 text-base font-semibold text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1 block">
                  Patient Initials
                </label>
                <input
                  v-model="initials"
                  type="text"
                  placeholder="e.g. J.D."
                  maxlength="6"
                  class="w-full h-12 bg-zinc-900 border border-white/[0.1] rounded-xl px-4 text-base font-semibold text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <!-- Working Diagnosis -->
            <div>
              <label class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1 block">
                Working Diagnosis / Shift Goal
              </label>
              <input
                v-model="diagnosis"
                type="text"
                placeholder="e.g. Post-op Day 1, Hypertensive Urgency"
                class="w-full h-12 bg-zinc-900 border border-white/[0.1] rounded-xl px-4 text-base text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <!-- Handover Notes -->
            <div>
              <label class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1 block">
                Shift Handover Instructions
              </label>
              <textarea
                v-model="notes"
                rows="2"
                placeholder="Key handover orders..."
                class="w-full bg-zinc-900 border border-white/[0.1] rounded-xl p-3 text-base text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="pt-2 space-y-3">
            <!-- Submit Button -->
            <button
              @click="save"
              :disabled="!bedNumber.trim()"
              class="w-full h-13 rounded-2xl font-bold text-[16px] tracking-tight flex items-center justify-center gap-2 cursor-pointer"
              :class="[
                bedNumber.trim()
                  ? 'btn-press bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20'
                  : 'bg-zinc-800 text-zinc-600 border border-white/[0.05] cursor-not-allowed'
              ]"
            >
              <Check :size="18" :stroke-width="2.5" />
              <span>{{ patient ? 'Update Bed Information' : 'Assign Bed to Deck' }}</span>
            </button>

            <!-- Delete Bed Assignment -->
            <div v-if="patient">
              <div v-if="!showDeleteConfirm">
                <button
                  @click="showDeleteConfirm = true"
                  type="button"
                  class="btn-press w-full h-11 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 font-semibold text-[13px] flex items-center justify-center gap-2 hover:bg-rose-950/40 cursor-pointer"
                >
                  <Trash2 :size="15" />
                  <span>Discharge / Delete Bed (Discards Vitals)</span>
                </button>
              </div>

              <!-- Delete Confirmation Panel -->
              <div v-else class="p-3.5 bg-rose-950/40 rounded-xl border border-rose-500/30 space-y-2.5">
                <p class="text-[12px] text-rose-200 font-semibold leading-snug">
                  Permanently delete {{ patient.bedNumber }} and all recorded vitals?
                </p>
                <div class="flex gap-2">
                  <button
                    @click="showDeleteConfirm = false"
                    type="button"
                    class="btn-press flex-1 h-9.5 rounded-lg bg-zinc-800 text-zinc-300 text-[12px] font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    @click="confirmDelete"
                    type="button"
                    class="btn-press flex-1 h-9.5 rounded-lg bg-rose-600 text-white text-[12px] font-bold cursor-pointer"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
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
