<script setup>
import { ref, watch } from 'vue'
import { db } from '../db/index.js'
import { usePatientStore } from '../stores/patientStore.js'
import {
  X, Download, Upload, Trash2, Database,
  ShieldCheck, AlertCircle
} from 'lucide-vue-next'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const patientStore = usePatientStore()

const storagePersisted = ref(false)
const storageEstimate = ref(null)
const showClearConfirm = ref(false)

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
    if (navigator.vibrate) navigator.vibrate(8)
  }
}

watch(() => props.visible, (v) => {
  if (v) {
    checkStorage()
    showClearConfirm.value = false
  }
})

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
  a.download = `pocket-kardex-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

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
      alert('Invalid backup file format.')
      return
    }

    await db.transaction('rw', db.table('patients'), db.table('vitals'), async () => {
      await db.table('vitals').clear()
      await db.table('patients').clear()

      for (const p of data.patients) {
        await db.table('patients').add(p)
      }
      for (const v of data.vitals) {
        await db.table('vitals').add(v)
      }
    })

    patientStore.ensureSelection()
    alert(`Successfully imported ${data.patients.length} patients and ${data.vitals.length} vitals records.`)
  } catch (err) {
    alert('Import failed: ' + err.message)
  }

  event.target.value = ''
}

async function clearShift() {
  if (navigator.vibrate) navigator.vibrate([10, 50, 10])
  await patientStore.clearAll()
  showClearConfirm.value = false
}

function formatBytes(bytes) {
  if (bytes == null) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
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
                Settings & Local Storage
              </h2>
              <p class="text-[11px] text-zinc-400">
                100% offline database stored locally on this device
              </p>
            </div>
            <button
              @click="$emit('close')"
              class="btn-press w-8.5 h-8.5 rounded-full bg-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X :size="16" />
            </button>
          </div>

          <!-- Storage Status Box -->
          <div class="rounded-2xl bg-zinc-900 border border-white/[0.08] p-3.5 space-y-2.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Database :size="15" class="text-emerald-400" />
                <span class="text-[13px] font-bold text-white">IndexedDB Persistence</span>
              </div>
              <span
                class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                :class="[
                  storagePersisted
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                ]"
              >
                <component :is="storagePersisted ? ShieldCheck : AlertCircle" :size="11" />
                {{ storagePersisted ? 'Protected' : 'Standard' }}
              </span>
            </div>

            <p class="text-[11px] text-zinc-400 leading-relaxed">
              When persistent, iOS Safari will not purge clinical records under low disk storage pressure.
            </p>

            <div v-if="storageEstimate" class="flex justify-between text-[11px] text-zinc-400 pt-1 border-t border-white/[0.04]">
              <span>Storage Used:</span>
              <span class="font-vitals text-zinc-300 font-semibold">
                {{ formatBytes(storageEstimate.usage) }} / {{ formatBytes(storageEstimate.quota) }}
              </span>
            </div>

            <button
              v-if="!storagePersisted"
              @click="requestPersist"
              class="btn-press w-full h-10 mt-1 rounded-xl bg-zinc-800 border border-white/[0.08] text-white text-[12px] font-bold cursor-pointer"
            >
              Request iOS Persistent Storage
            </button>
          </div>

          <!-- Grouped Data Actions -->
          <div class="rounded-2xl bg-zinc-900 border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
            <!-- Export -->
            <button
              @click="exportData"
              class="w-full flex items-center justify-between px-4 py-3.5 text-left text-white hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <div class="flex items-center gap-3">
                <Download :size="17" class="text-emerald-400" />
                <span class="text-[14px] font-semibold">Export Shift Data (JSON)</span>
              </div>
              <span class="text-[11px] text-zinc-500">Backup</span>
            </button>

            <!-- Import -->
            <button
              @click="triggerImport"
              class="w-full flex items-center justify-between px-4 py-3.5 text-left text-white hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <div class="flex items-center gap-3">
                <Upload :size="17" class="text-emerald-400" />
                <span class="text-[14px] font-semibold">Import Shift Data (JSON)</span>
              </div>
              <span class="text-[11px] text-zinc-500">Restore</span>
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
                class="w-full flex items-center justify-between px-4 py-3.5 text-left text-rose-400 hover:bg-rose-950/20 active:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <div class="flex items-center gap-3">
                  <Trash2 :size="17" class="text-rose-400" />
                  <span class="text-[14px] font-semibold">Clear Current Shift</span>
                </div>
                <span class="text-[11px] text-rose-400/80">Flush</span>
              </button>
            </div>

            <!-- Confirmation Prompt -->
            <div v-else class="p-3.5 bg-rose-950/40 space-y-2.5">
              <p class="text-[12px] text-rose-200 font-semibold leading-snug">
                Permanently purge all bed assignments and vitals for this shift?
              </p>
              <div class="flex gap-2">
                <button
                  @click="showClearConfirm = false"
                  class="btn-press flex-1 h-10 rounded-xl bg-zinc-800 border border-white/[0.08] text-zinc-300 text-[12px] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  @click="clearShift"
                  class="btn-press flex-1 h-10 rounded-xl bg-rose-600 text-white text-[12px] font-bold cursor-pointer"
                >
                  Confirm Flush
                </button>
              </div>
            </div>
          </div>

          <!-- App Brand & Version Footer -->
          <div class="flex flex-col items-center justify-center pt-2 pb-1 text-center select-none">
            <img
              src="/icon.png"
              alt="Pocket Kardex"
              class="w-14 h-14 rounded-2xl shadow-lg border border-white/[0.1] mb-2 object-cover"
            />
            <span class="text-[13px] font-bold text-white tracking-tight">Pocket Kardex</span>
            <span class="text-[11px] text-zinc-400 font-medium">Bedside Clinical Kardex • 100% Offline-First</span>
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
