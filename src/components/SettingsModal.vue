<script setup>
import { ref, watch, onMounted } from 'vue'
import { db } from '../db/index.js'
import { usePatientStore } from '../stores/patientStore.js'
import {
  X, Download, Upload, Trash2, HardDrive,
  ShieldCheck, AlertTriangle
} from 'lucide-vue-next'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const patientStore = usePatientStore()

const storagePersisted = ref(false)
const storageEstimate = ref(null)
const showClearConfirm = ref(false)

// ── Storage Status ──────────────────────────────────────────
async function checkStorage() {
  if (navigator.storage && navigator.storage.persisted) {
    storagePersisted.value = await navigator.storage.persisted()
  }
  if (navigator.storage && navigator.storage.estimate) {
    storageEstimate.value = await navigator.storage.estimate()
  }
}

async function requestPersist() {
  if (navigator.storage && navigator.storage.persist) {
    storagePersisted.value = await navigator.storage.persist()
  }
}

watch(() => props.visible, (v) => {
  if (v) {
    checkStorage()
    showClearConfirm.value = false
  }
})

// ── Export ───────────────────────────────────────────────────
async function exportData() {
  const patients = await db.table('patients').toArray()
  const vitals = await db.table('vitals').toArray()

  const data = {
    exportedAt: new Date().toISOString(),
    version: 1,
    patients,
    vitals
  }

  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `pocket-kardex-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Import ──────────────────────────────────────────────────
const fileInput = ref(null)

function triggerImport() {
  fileInput.value?.click()
}

async function handleImport(event) {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const data = JSON.parse(text)

    if (!data.patients || !data.vitals) {
      alert('Invalid file format: missing patients or vitals data.')
      return
    }

    await db.transaction('rw', db.table('patients'), db.table('vitals'), async () => {
      // Clear existing
      await db.table('vitals').clear()
      await db.table('patients').clear()

      // Import
      for (const p of data.patients) {
        await db.table('patients').add(p)
      }
      for (const v of data.vitals) {
        await db.table('vitals').add(v)
      }
    })

    patientStore.ensureSelection()
    alert(`Imported ${data.patients.length} patients and ${data.vitals.length} vitals records.`)
  } catch (err) {
    alert('Import failed: ' + err.message)
  }

  // Reset file input
  event.target.value = ''
}

// ── Clear Shift ─────────────────────────────────────────────
async function clearShift() {
  await patientStore.clearAll()
  showClearConfirm.value = false
}

// Format bytes
function formatBytes(bytes) {
  if (bytes == null) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
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
        <div class="relative w-full max-w-md bg-clinical-900 rounded-t-3xl sm:rounded-2xl
                    border border-clinical-800 p-5 pb-safe space-y-5 z-10">

          <!-- Handle -->
          <div class="flex justify-center sm:hidden -mt-2 mb-1">
            <div class="w-10 h-1 bg-clinical-700 rounded-full" />
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-text-primary">Settings</h2>
            <button
              @click="$emit('close')"
              class="w-9 h-9 flex items-center justify-center rounded-lg
                     text-text-muted hover:text-text-primary hover:bg-clinical-800"
            >
              <X :size="18" />
            </button>
          </div>

          <!-- Storage Status -->
          <div class="bg-clinical-800 rounded-xl p-4 space-y-2">
            <div class="flex items-center gap-2">
              <HardDrive :size="16" class="text-text-muted" />
              <h3 class="text-sm font-semibold text-text-primary">Storage</h3>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-text-secondary">Persistence:</span>
              <span
                class="flex items-center gap-1 font-medium"
                :class="storagePersisted ? 'text-accent' : 'text-alert-warning'"
              >
                <component :is="storagePersisted ? ShieldCheck : AlertTriangle" :size="12" />
                {{ storagePersisted ? 'Protected' : 'Not persisted' }}
              </span>
            </div>
            <div v-if="storageEstimate" class="flex items-center justify-between text-xs">
              <span class="text-text-secondary">Usage:</span>
              <span class="text-text-primary font-mono">
                {{ formatBytes(storageEstimate.usage) }} / {{ formatBytes(storageEstimate.quota) }}
              </span>
            </div>
            <button
              v-if="!storagePersisted"
              @click="requestPersist"
              class="w-full mt-2 py-2 rounded-lg bg-clinical-700 text-accent
                     text-xs font-medium hover:bg-clinical-600 transition-colors"
            >
              Request Persistent Storage
            </button>
          </div>

          <!-- Data Actions -->
          <div class="space-y-2">
            <!-- Export -->
            <button
              @click="exportData"
              class="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl
                     bg-clinical-800 text-text-primary text-sm font-medium
                     hover:bg-clinical-700 active:bg-clinical-600 transition-colors"
            >
              <Download :size="18" class="text-accent" />
              Export Shift Data (JSON)
            </button>

            <!-- Import -->
            <button
              @click="triggerImport"
              class="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl
                     bg-clinical-800 text-text-primary text-sm font-medium
                     hover:bg-clinical-700 active:bg-clinical-600 transition-colors"
            >
              <Upload :size="18" class="text-accent" />
              Import Shift Data (JSON)
            </button>
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              class="hidden"
              @change="handleImport"
            />

            <!-- Clear Shift -->
            <div v-if="!showClearConfirm">
              <button
                @click="showClearConfirm = true"
                class="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl
                       bg-clinical-800 text-alert-danger text-sm font-medium
                       hover:bg-red-950/30 active:bg-red-950/50 transition-colors"
              >
                <Trash2 :size="18" />
                Clear Current Shift
              </button>
            </div>

            <!-- Clear Confirm -->
            <div
              v-else
              class="bg-red-950/30 border border-alert-danger/30 rounded-xl p-4 space-y-3"
            >
              <p class="text-sm text-alert-danger font-medium">
                Delete all patients and vitals? This cannot be undone.
              </p>
              <div class="flex gap-2">
                <button
                  @click="showClearConfirm = false"
                  class="flex-1 py-2.5 rounded-xl bg-clinical-800 text-text-secondary
                         text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  @click="clearShift"
                  class="flex-1 py-2.5 rounded-xl bg-alert-danger text-white
                         text-sm font-bold"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
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
