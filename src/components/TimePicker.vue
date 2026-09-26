<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: () => Date.now() }
})

const emit = defineEmits(['update:modelValue'])

const hours = ref(new Date(props.modelValue).getHours())
const minutes = ref(new Date(props.modelValue).getMinutes())

watch(
  () => props.modelValue,
  (val) => {
    const d = new Date(val)
    hours.value = d.getHours()
    minutes.value = d.getMinutes()
  }
)

function update() {
  const d = new Date(props.modelValue)
  d.setHours(hours.value, minutes.value, 0, 0)
  emit('update:modelValue', d.getTime())
}

function setPreset(minutesAgo) {
  const target = Date.now() - minutesAgo * 60 * 1000
  const d = new Date(target)
  hours.value = d.getHours()
  minutes.value = d.getMinutes()
  emit('update:modelValue', target)
}

function padTwo(n) {
  return String(n).padStart(2, '0')
}
</script>

<template>
  <div class="space-y-2.5">
    <div class="flex items-center justify-center gap-2">
      <!-- Hour Select -->
      <div class="relative">
        <select
          v-model.number="hours"
          @change="update"
          class="w-18 h-12 bg-pk-input border border-pk-border rounded-xl text-center font-vitals text-base font-bold text-pk-primary focus:border-emerald-500 focus:outline-none appearance-none cursor-pointer transition-colors"
        >
          <option v-for="h in 24" :key="h - 1" :value="h - 1" class="bg-zinc-900 text-white">
            {{ padTwo(h - 1) }}
          </option>
        </select>
        <span class="absolute bottom-1 right-2 text-[9px] text-pk-muted pointer-events-none">HR</span>
      </div>

      <span class="text-emerald-500 font-vitals text-lg font-bold">:</span>

      <!-- Minute Select -->
      <div class="relative">
        <select
          v-model.number="minutes"
          @change="update"
          class="w-18 h-12 bg-pk-input border border-pk-border rounded-xl text-center font-vitals text-base font-bold text-pk-primary focus:border-emerald-500 focus:outline-none appearance-none cursor-pointer transition-colors"
        >
          <option v-for="m in 60" :key="m - 1" :value="m - 1" class="bg-zinc-900 text-white">
            {{ padTwo(m - 1) }}
          </option>
        </select>
        <span class="absolute bottom-1 right-2 text-[9px] text-pk-muted pointer-events-none">MIN</span>
      </div>
    </div>

    <!-- Quick Presets -->
    <div class="flex items-center justify-center gap-1.5 pt-1">
      <button
        @click="setPreset(0)"
        type="button"
        class="btn-press px-2.5 py-1 rounded-lg bg-pk-subtle border border-pk-border text-[11px] font-semibold text-pk-secondary hover:text-pk-primary cursor-pointer transition-colors"
      >
        Now
      </button>
      <button
        @click="setPreset(15)"
        type="button"
        class="btn-press px-2.5 py-1 rounded-lg bg-pk-subtle border border-pk-border text-[11px] font-semibold text-pk-secondary hover:text-pk-primary cursor-pointer transition-colors"
      >
        -15m
      </button>
      <button
        @click="setPreset(30)"
        type="button"
        class="btn-press px-2.5 py-1 rounded-lg bg-pk-subtle border border-pk-border text-[11px] font-semibold text-pk-secondary hover:text-pk-primary cursor-pointer transition-colors"
      >
        -30m
      </button>
      <button
        @click="setPreset(60)"
        type="button"
        class="btn-press px-2.5 py-1 rounded-lg bg-pk-subtle border border-pk-border text-[11px] font-semibold text-pk-secondary hover:text-pk-primary cursor-pointer transition-colors"
      >
        -1h
      </button>
    </div>
  </div>
</template>
