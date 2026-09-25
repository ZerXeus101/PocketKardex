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

function padTwo(n) {
  return String(n).padStart(2, '0')
}
</script>

<template>
  <div class="flex items-center gap-1">
    <select
      v-model.number="hours"
      @change="update"
      class="bg-clinical-800 text-text-primary border border-clinical-700
             rounded-lg px-2 py-2 text-center text-sm font-mono
             focus:outline-none focus:border-accent appearance-none"
    >
      <option v-for="h in 24" :key="h - 1" :value="h - 1">
        {{ padTwo(h - 1) }}
      </option>
    </select>
    <span class="text-text-muted font-bold">:</span>
    <select
      v-model.number="minutes"
      @change="update"
      class="bg-clinical-800 text-text-primary border border-clinical-700
             rounded-lg px-2 py-2 text-center text-sm font-mono
             focus:outline-none focus:border-accent appearance-none"
    >
      <option v-for="m in 60" :key="m - 1" :value="m - 1">
        {{ padTwo(m - 1) }}
      </option>
    </select>
  </div>
</template>
