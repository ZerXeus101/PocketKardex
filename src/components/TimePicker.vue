<script setup>
import { ref, computed, watch } from 'vue'
import { Check } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Number, default: () => Date.now() }
})

const emit = defineEmits(['update:modelValue', 'close'])

// Time State
const initialDate = new Date(props.modelValue || Date.now())
const hours = ref(initialDate.getHours())
const minutes = ref(initialDate.getMinutes())

// View State
const mode = ref('hours') // 'hours' | 'minutes'
const is24Hour = ref(false)
const isDragging = ref(false)
const dialRef = ref(null)

let autoAdvanceTimer = null

watch(
  () => props.modelValue,
  (val) => {
    if (!isDragging.value && val) {
      const d = new Date(val)
      hours.value = d.getHours()
      minutes.value = d.getMinutes()
    }
  }
)

function triggerHaptic(duration = 8) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(duration)
    }
  } catch (_) {}
}

function padTwo(n) {
  return String(n).padStart(2, '0')
}

// 12-Hour formatted representations
const displayHours = computed(() => {
  if (is24Hour.value) {
    return padTwo(hours.value)
  }
  const h12 = hours.value % 12 || 12
  return padTwo(h12)
})

const displayMinutes = computed(() => padTwo(minutes.value))

const period = computed({
  get() {
    return hours.value >= 12 ? 'PM' : 'AM'
  },
  set(val) {
    triggerHaptic(10)
    if (val === 'PM' && hours.value < 12) {
      hours.value += 12
      commitUpdate()
    } else if (val === 'AM' && hours.value >= 12) {
      hours.value -= 12
      commitUpdate()
    }
  }
})

function commitUpdate() {
  const d = new Date(props.modelValue || Date.now())
  d.setHours(hours.value, minutes.value, 0, 0)
  emit('update:modelValue', d.getTime())
}

function setPreset(minutesAgo) {
  triggerHaptic(12)
  const target = Date.now() - minutesAgo * 60 * 1000
  const d = new Date(target)
  hours.value = d.getHours()
  minutes.value = d.getMinutes()
  emit('update:modelValue', target)
}

function toggle24Hour() {
  triggerHaptic(10)
  is24Hour.value = !is24Hour.value
}

// Clock Geometry (240x240 dial)
const DIAL_SIZE = 240
const CX = DIAL_SIZE / 2
const CY = DIAL_SIZE / 2
const R_OUTER = 90
const R_INNER = 58
const THRESHOLD_24H = 74

// Active Hand coordinates
const handCoords = computed(() => {
  let angleDeg = 0
  let r = R_OUTER

  if (mode.value === 'hours') {
    if (is24Hour.value) {
      const h = hours.value
      if (h >= 1 && h <= 12) {
        r = R_INNER
        angleDeg = (h % 12) * 30
      } else {
        r = R_OUTER
        angleDeg = (h % 12) * 30
      }
    } else {
      const h12 = hours.value % 12 || 12
      r = R_OUTER
      angleDeg = (h12 % 12) * 30
    }
  } else {
    // minutes
    r = R_OUTER
    angleDeg = minutes.value * 6
  }

  const rad = ((angleDeg - 90) * Math.PI) / 180
  const bx = CX + r * Math.cos(rad)
  const by = CY + r * Math.sin(rad)

  return { bx, by, r, angleDeg }
})

const activeBubbleText = computed(() => {
  if (mode.value === 'hours') {
    return is24Hour.value ? padTwo(hours.value) : String(hours.value % 12 || 12)
  }
  return padTwo(minutes.value)
})

// Numbers layout on clock face
const hourNumbers12 = computed(() => {
  return Array.from({ length: 12 }, (_, i) => {
    const val = i + 1
    const angle = (val % 12) * 30
    const rad = ((angle - 90) * Math.PI) / 180
    return {
      val,
      label: String(val),
      x: CX + R_OUTER * Math.cos(rad),
      y: CY + R_OUTER * Math.sin(rad),
      isSelected: (hours.value % 12 || 12) === val
    }
  })
})

const hourNumbers24Outer = computed(() => {
  return Array.from({ length: 12 }, (_, i) => {
    const val = i === 0 ? 0 : i + 12
    const angle = i * 30
    const rad = ((angle - 90) * Math.PI) / 180
    return {
      val,
      label: padTwo(val),
      x: CX + R_OUTER * Math.cos(rad),
      y: CY + R_OUTER * Math.sin(rad),
      isSelected: hours.value === val
    }
  })
})

const hourNumbers24Inner = computed(() => {
  return Array.from({ length: 12 }, (_, i) => {
    const val = i === 0 ? 12 : i
    const angle = i * 30
    const rad = ((angle - 90) * Math.PI) / 180
    return {
      val,
      label: String(val),
      x: CX + R_INNER * Math.cos(rad),
      y: CY + R_INNER * Math.sin(rad),
      isSelected: hours.value === val
    }
  })
})

const minuteNumbers = computed(() => {
  return Array.from({ length: 12 }, (_, i) => {
    const val = i * 5
    const angle = i * 30
    const rad = ((angle - 90) * Math.PI) / 180
    return {
      val,
      label: padTwo(val),
      x: CX + R_OUTER * Math.cos(rad),
      y: CY + R_OUTER * Math.sin(rad),
      isSelected: minutes.value === val
    }
  })
})

// Pointer Events (Touch & Drag handling)
function handlePointer(e) {
  if (!dialRef.value) return
  const rect = dialRef.value.getBoundingClientRect()
  const px = e.clientX - rect.left - CX
  const py = e.clientY - rect.top - CY
  const dist = Math.hypot(px, py)

  // Radial angle in degrees, clockwise from 12 o'clock
  const rad = Math.atan2(py, px)
  const deg = (rad * (180 / Math.PI) + 90 + 360) % 360

  if (mode.value === 'hours') {
    const step = Math.round(deg / 30) % 12
    let newHour = hours.value

    if (is24Hour.value) {
      if (dist < THRESHOLD_24H) {
        // Inner ring: 12, 1, ..., 11
        newHour = step === 0 ? 12 : step
      } else {
        // Outer ring: 00, 13, ..., 23
        newHour = step === 0 ? 0 : step + 12
      }
    } else {
      const raw12 = step === 0 ? 12 : step
      const isPm = hours.value >= 12
      if (isPm) {
        newHour = raw12 === 12 ? 12 : raw12 + 12
      } else {
        newHour = raw12 === 12 ? 0 : raw12
      }
    }

    if (newHour !== hours.value) {
      hours.value = newHour
      triggerHaptic(7)
      commitUpdate()
    }
  } else {
    // Minutes: snap to exact minute 0-59
    const step = Math.round(deg / 6) % 60
    if (step !== minutes.value) {
      minutes.value = step
      triggerHaptic(5)
      commitUpdate()
    }
  }
}

function onPointerDown(e) {
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer)
    autoAdvanceTimer = null
  }
  isDragging.value = true
  try {
    e.currentTarget.setPointerCapture(e.pointerId)
  } catch (_) {}
  handlePointer(e)
}

function onPointerMove(e) {
  if (!isDragging.value) return
  handlePointer(e)
}

function onPointerUp(e) {
  if (!isDragging.value) return
  isDragging.value = false
  handlePointer(e)
  try {
    e.currentTarget.releasePointerCapture(e.pointerId)
  } catch (_) {}

  // Auto-advance to minutes after picking an hour
  if (mode.value === 'hours') {
    autoAdvanceTimer = setTimeout(() => {
      mode.value = 'minutes'
      triggerHaptic(10)
    }, 280)
  }
}

function onPointerCancel() {
  isDragging.value = false
}
</script>

<template>
  <div class="space-y-3 select-none">
    <!-- Header: Readout & Format Toggles -->
    <div class="flex items-center justify-between gap-2 px-1">
      <!-- Digital readout pills -->
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          @click="mode = 'hours'"
          class="btn-press px-3.5 py-1.5 rounded-xl border font-vitals text-2xl font-bold cursor-pointer transition-all"
          :class="mode === 'hours'
            ? 'bg-pk-accent/15 border-pk-accent text-pk-accent shadow-sm ring-1 ring-pk-accent/30'
            : 'bg-pk-card border-pk-border text-pk-primary hover:border-pk-border-subtle-hover'"
        >
          {{ displayHours }}
        </button>

        <span class="text-pk-muted font-vitals text-xl font-bold">:</span>

        <button
          type="button"
          @click="mode = 'minutes'"
          class="btn-press px-3.5 py-1.5 rounded-xl border font-vitals text-2xl font-bold cursor-pointer transition-all"
          :class="mode === 'minutes'
            ? 'bg-pk-accent/15 border-pk-accent text-pk-accent shadow-sm ring-1 ring-pk-accent/30'
            : 'bg-pk-card border-pk-border text-pk-primary hover:border-pk-border-subtle-hover'"
        >
          {{ displayMinutes }}
        </button>
      </div>

      <!-- AM / PM and 24H Selectors -->
      <div class="flex items-center gap-2">
        <!-- AM/PM Toggle (12H mode) -->
        <div v-if="!is24Hour" class="flex rounded-xl bg-pk-card border border-pk-border p-0.5">
          <button
            type="button"
            @click="period = 'AM'"
            class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
            :class="period === 'AM'
              ? 'bg-pk-accent text-white shadow-sm'
              : 'text-pk-secondary hover:text-pk-primary'"
          >
            AM
          </button>
          <button
            type="button"
            @click="period = 'PM'"
            class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
            :class="period === 'PM'
              ? 'bg-pk-accent text-white shadow-sm'
              : 'text-pk-secondary hover:text-pk-primary'"
          >
            PM
          </button>
        </div>

        <!-- 12H / 24H Toggle -->
        <button
          type="button"
          @click="toggle24Hour"
          class="btn-press h-8.5 px-2 rounded-xl bg-pk-card border border-pk-border text-[11px] font-bold text-pk-secondary hover:text-pk-primary cursor-pointer transition-colors"
          title="Toggle 12H or 24H military time"
        >
          {{ is24Hour ? '24H' : '12H' }}
        </button>

        <!-- Done / Confirm Button -->
        <button
          type="button"
          @click="$emit('close')"
          class="btn-press w-8.5 h-8.5 rounded-xl bg-pk-accent text-white flex items-center justify-center cursor-pointer shadow-sm active:scale-95 transition-transform"
          title="Done selecting time"
        >
          <Check :size="16" :stroke-width="2.5" />
        </button>
      </div>
    </div>

    <!-- Mode Hint -->
    <div class="flex items-center justify-between px-1 text-[11px] text-pk-secondary">
      <span>
        Select <strong class="text-pk-primary">{{ mode === 'hours' ? 'Hour' : 'Minute' }}</strong>
        <span v-if="mode === 'hours' && is24Hour" class="text-pk-muted text-[10px]"> (outer: 13-00, inner: 1-12)</span>
      </span>
      <span class="text-pk-muted text-[10px]">Tap or drag hand</span>
    </div>

    <!-- Interactive Dial (240px circle) -->
    <div class="flex justify-center py-1">
      <div
        ref="dialRef"
        class="relative rounded-full bg-pk-card/70 border border-pk-border shadow-[inset_0_2px_10px_rgba(0,0,0,0.12)] touch-none cursor-pointer"
        :style="{ width: `${DIAL_SIZE}px`, height: `${DIAL_SIZE}px` }"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerCancel"
      >
        <!-- Center Pivot Dot -->
        <div
          class="absolute rounded-full pointer-events-none z-20"
          :style="{
            left: `${CX}px`,
            top: `${CY}px`,
            width: '8px',
            height: '8px',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'var(--pk-accent, #10b981)'
          }"
        />

        <!-- SVG Clock Hand -->
        <svg class="absolute inset-0 pointer-events-none w-full h-full z-10">
          <line
            :x1="CX"
            :y1="CY"
            :x2="handCoords.bx"
            :y2="handCoords.by"
            stroke="var(--pk-accent, #10b981)"
            stroke-width="2"
            stroke-linecap="round"
            :class="{ 'transition-all duration-150 ease-out': !isDragging }"
          />
        </svg>

        <!-- Floating Selection Bubble -->
        <div
          class="absolute rounded-full flex items-center justify-center font-vitals font-bold pointer-events-none z-30 shadow-md text-white"
          :class="{ 'transition-all duration-150 ease-out': !isDragging }"
          :style="{
            left: `${handCoords.bx}px`,
            top: `${handCoords.by}px`,
            width: handCoords.r === R_INNER ? '28px' : '32px',
            height: handCoords.r === R_INNER ? '28px' : '32px',
            fontSize: handCoords.r === R_INNER ? '11px' : '13px',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'var(--pk-accent, #10b981)'
          }"
        >
          {{ activeBubbleText }}
        </div>

        <!-- Clock Face Numbers: HOURS (12H Mode) -->
        <template v-if="mode === 'hours' && !is24Hour">
          <div
            v-for="item in hourNumbers12"
            :key="item.val"
            class="absolute pointer-events-none font-vitals text-sm font-semibold transition-colors flex items-center justify-center"
            :class="item.isSelected ? 'text-transparent' : 'text-pk-primary'"
            :style="{
              left: `${item.x}px`,
              top: `${item.y}px`,
              width: '28px',
              height: '28px',
              transform: 'translate(-50%, -50%)'
            }"
          >
            {{ item.label }}
          </div>
        </template>

        <!-- Clock Face Numbers: HOURS (24H Mode - Dual Rings) -->
        <template v-else-if="mode === 'hours' && is24Hour">
          <!-- Outer Ring (00, 13-23) -->
          <div
            v-for="item in hourNumbers24Outer"
            :key="'outer-' + item.val"
            class="absolute pointer-events-none font-vitals text-[11px] font-semibold transition-colors flex items-center justify-center"
            :class="item.isSelected ? 'text-transparent' : 'text-pk-primary'"
            :style="{
              left: `${item.x}px`,
              top: `${item.y}px`,
              width: '24px',
              height: '24px',
              transform: 'translate(-50%, -50%)'
            }"
          >
            {{ item.label }}
          </div>

          <!-- Inner Ring (12, 1-11) -->
          <div
            v-for="item in hourNumbers24Inner"
            :key="'inner-' + item.val"
            class="absolute pointer-events-none font-vitals text-[10px] font-bold transition-colors flex items-center justify-center"
            :class="item.isSelected ? 'text-transparent' : 'text-pk-secondary'"
            :style="{
              left: `${item.x}px`,
              top: `${item.y}px`,
              width: '22px',
              height: '22px',
              transform: 'translate(-50%, -50%)'
            }"
          >
            {{ item.label }}
          </div>
        </template>

        <!-- Clock Face Numbers: MINUTES -->
        <template v-else>
          <div
            v-for="item in minuteNumbers"
            :key="item.val"
            class="absolute pointer-events-none font-vitals text-[12px] font-semibold transition-colors flex items-center justify-center"
            :class="item.isSelected ? 'text-transparent' : 'text-pk-primary'"
            :style="{
              left: `${item.x}px`,
              top: `${item.y}px`,
              width: '26px',
              height: '26px',
              transform: 'translate(-50%, -50%)'
            }"
          >
            {{ item.label }}
          </div>
        </template>
      </div>
    </div>

    <!-- Quick Presets -->
    <div class="flex items-center justify-center gap-1.5 pt-1 border-t border-pk-border">
      <button
        @click="setPreset(0)"
        type="button"
        class="btn-press flex-1 py-1.5 rounded-xl bg-pk-card border border-pk-border text-[11px] font-semibold text-pk-secondary hover:text-pk-primary cursor-pointer transition-colors text-center"
      >
        Now
      </button>
      <button
        @click="setPreset(15)"
        type="button"
        class="btn-press flex-1 py-1.5 rounded-xl bg-pk-card border border-pk-border text-[11px] font-semibold text-pk-secondary hover:text-pk-primary cursor-pointer transition-colors text-center"
      >
        -15m
      </button>
      <button
        @click="setPreset(30)"
        type="button"
        class="btn-press flex-1 py-1.5 rounded-xl bg-pk-card border border-pk-border text-[11px] font-semibold text-pk-secondary hover:text-pk-primary cursor-pointer transition-colors text-center"
      >
        -30m
      </button>
      <button
        @click="setPreset(60)"
        type="button"
        class="btn-press flex-1 py-1.5 rounded-xl bg-pk-card border border-pk-border text-[11px] font-semibold text-pk-secondary hover:text-pk-primary cursor-pointer transition-colors text-center"
      >
        -1h
      </button>
    </div>
  </div>
</template>
