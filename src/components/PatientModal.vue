<script setup>
import { ref } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  visible: { type: Boolean, default: false },
  patient: { type: Object, default: null }
})

const emit = defineEmits(['close', 'save'])

const bedNumber = ref('')
const ageGender = ref('')
const initials = ref('')
const diagnosis = ref('')
const notes = ref('')

// Populate for edit mode
function reset() {
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

// Reset when visibility changes
import { watch } from 'vue'
watch(() => props.visible, (v) => {
  if (v) reset()
})

function save() {
  if (!bedNumber.value.trim()) return
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
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="$emit('close')"
        />

        <!-- Panel -->
        <div class="relative w-full max-w-md bg-clinical-900 rounded-t-3xl sm:rounded-2xl
                    border border-clinical-800 p-5 pb-safe space-y-4 z-10">
          <!-- Handle bar -->
          <div class="flex justify-center sm:hidden">
            <div class="w-10 h-1 bg-clinical-700 rounded-full" />
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-text-primary">
              {{ patient ? 'Edit Patient' : 'New Patient' }}
            </h2>
            <button
              @click="$emit('close')"
              class="w-9 h-9 flex items-center justify-center rounded-lg
                     text-text-muted hover:text-text-primary hover:bg-clinical-800"
            >
              <X :size="18" />
            </button>
          </div>

          <!-- Form -->
          <div class="space-y-3">
            <!-- Bed Number (required) -->
            <div>
              <label class="text-xs text-text-muted mb-1 block">Bed / Room *</label>
              <input
                v-model="bedNumber"
                type="text"
                placeholder="e.g. Bed 4-A, Rm 302-1"
                class="w-full bg-clinical-800 border border-clinical-700 rounded-xl
                       px-4 py-3 text-text-primary placeholder-text-muted text-sm
                       focus:outline-none focus:border-accent"
              />
            </div>

            <!-- Age/Gender + Initials row -->
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="text-xs text-text-muted mb-1 block">Age/Gender</label>
                <input
                  v-model="ageGender"
                  type="text"
                  placeholder="e.g. 64M"
                  class="w-full bg-clinical-800 border border-clinical-700 rounded-xl
                         px-4 py-3 text-text-primary placeholder-text-muted text-sm
                         focus:outline-none focus:border-accent"
                />
              </div>
              <div class="w-24">
                <label class="text-xs text-text-muted mb-1 block">Initials</label>
                <input
                  v-model="initials"
                  type="text"
                  placeholder="J.D."
                  maxlength="6"
                  class="w-full bg-clinical-800 border border-clinical-700 rounded-xl
                         px-4 py-3 text-text-primary placeholder-text-muted text-sm
                         focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <!-- Diagnosis -->
            <div>
              <label class="text-xs text-text-muted mb-1 block">Diagnosis</label>
              <input
                v-model="diagnosis"
                type="text"
                placeholder="e.g. Post-op Day 1, Pneumonia"
                class="w-full bg-clinical-800 border border-clinical-700 rounded-xl
                       px-4 py-3 text-text-primary placeholder-text-muted text-sm
                       focus:outline-none focus:border-accent"
              />
            </div>

            <!-- Notes -->
            <div>
              <label class="text-xs text-text-muted mb-1 block">Handover Notes</label>
              <textarea
                v-model="notes"
                rows="2"
                placeholder="Key handover info..."
                class="w-full bg-clinical-800 border border-clinical-700 rounded-xl
                       px-4 py-3 text-text-primary placeholder-text-muted text-sm
                       focus:outline-none focus:border-accent resize-none"
              />
            </div>
          </div>

          <!-- Save -->
          <button
            @click="save"
            :disabled="!bedNumber.trim()"
            class="w-full py-3.5 rounded-xl font-semibold text-sm
                   transition-colors"
            :class="[
              bedNumber.trim()
                ? 'bg-accent text-clinical-950 active:bg-accent-light'
                : 'bg-clinical-800 text-text-muted cursor-not-allowed'
            ]"
          >
            {{ patient ? 'Update Patient' : 'Add Patient' }}
          </button>
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
