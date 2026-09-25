import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '../db/index.js'
import { useLiveQuery } from '../composables/useLiveQuery.js'

export const usePatientStore = defineStore('patients', () => {
  // ── State ─────────────────────────────────────────────────
  const activePatientId = ref(null)

  // ── Reactive Queries (auto-update on IndexedDB changes) ──
  const patients = useLiveQuery(
    () => db.table('patients').orderBy('createdAt').toArray(),
    []
  )

  // ── Getters ───────────────────────────────────────────────
  const activePatient = computed(() => {
    if (activePatientId.value === null) return null
    return patients.value.find((p) => p.id === activePatientId.value) ?? null
  })

  const patientCount = computed(() => patients.value.length)

  // ── Actions ───────────────────────────────────────────────

  /**
   * Select a patient by id (sets the active bed).
   * Pass null to deselect.
   */
  function selectPatient(id) {
    activePatientId.value = id
  }

  /**
   * Auto-select the first patient if none is selected.
   * Call after patients load.
   */
  function ensureSelection() {
    if (patients.value.length === 0) {
      activePatientId.value = null
      return
    }
    if (
      activePatientId.value === null ||
      !patients.value.some((p) => p.id === activePatientId.value)
    ) {
      activePatientId.value = patients.value[0].id
    }
  }

  /**
   * Add a new patient.
   * @param {{ bedNumber: string, ageGender?: string, initials?: string, diagnosis?: string, notes?: string }} data
   * @returns {Promise<number>} new patient id
   */
  async function addPatient(data) {
    const now = Date.now()
    const id = await db.table('patients').add({
      bedNumber: data.bedNumber,
      ageGender: data.ageGender || '',
      initials: data.initials || '',
      diagnosis: data.diagnosis || '',
      notes: data.notes || '',
      createdAt: now,
      updatedAt: now
    })
    // Auto-select newly added patient
    activePatientId.value = id
    return id
  }

  /**
   * Update an existing patient.
   * @param {number} id
   * @param {Partial<Patient>} changes
   */
  async function updatePatient(id, changes) {
    await db.table('patients').update(id, {
      ...changes,
      updatedAt: Date.now()
    })
  }

  /**
   * Delete a patient and all their vitals records.
   * @param {number} id
   */
  async function deletePatient(id) {
    await db.transaction('rw', db.table('patients'), db.table('vitals'), async () => {
      await db.table('vitals').where('patientId').equals(id).delete()
      await db.table('patients').delete(id)
    })
    // If we deleted the active patient, pick first remaining patient immediately
    if (activePatientId.value === id) {
      const remaining = patients.value.filter((p) => p.id !== id)
      activePatientId.value = remaining.length > 0 ? remaining[0].id : null
    }
  }

  /**
   * Delete all patients and vitals (clear shift).
   */
  async function clearAll() {
    await db.transaction('rw', db.table('patients'), db.table('vitals'), async () => {
      await db.table('vitals').clear()
      await db.table('patients').clear()
    })
    activePatientId.value = null
  }

  return {
    // State
    activePatientId,
    // Reactive queries
    patients,
    // Getters
    activePatient,
    patientCount,
    // Actions
    selectPatient,
    ensureSelection,
    addPatient,
    updatePatient,
    deletePatient,
    clearAll
  }
})
