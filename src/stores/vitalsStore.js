import { defineStore } from 'pinia'
import { computed } from 'vue'
import { db } from '../db/index.js'
import { useLiveQuery } from '../composables/useLiveQuery.js'
import { usePatientStore } from './patientStore.js'

export const useVitalsStore = defineStore('vitals', () => {
  const patientStore = usePatientStore()

  // ── Reactive Query: vitals for active patient (newest first) ──
  const vitalsForActivePatient = useLiveQuery(
    async () => {
      const pid = patientStore.activePatientId
      if (pid === null) return []
      return db
        .table('vitals')
        .where('patientId')
        .equals(pid)
        .reverse()
        .sortBy('timestamp')
    },
    []
  )

  // ── Getter: latest vitals record for active patient ───────
  const latestVitals = computed(() => {
    return vitalsForActivePatient.value.length > 0
      ? vitalsForActivePatient.value[0]
      : null
  })

  // ── Abnormal Threshold Checks ─────────────────────────────

  /**
   * Check if a vitals record has any abnormal values.
   * Returns an object with boolean flags per category.
   */
  function checkAbnormals(record) {
    if (!record) return {}

    const flags = {}

    // BP: systolic > 140 or < 90, diastolic > 90
    const sysL = record.bpSystolicL
    const diaL = record.bpDiastolicL
    const sysR = record.bpSystolicR
    const diaR = record.bpDiastolicR

    flags.bpHigh =
      (sysL != null && (sysL > 140 || diaL > 90)) ||
      (sysR != null && (sysR > 140 || diaR > 90))
    flags.bpLow =
      (sysL != null && sysL < 90) ||
      (sysR != null && sysR < 90)
    flags.bpAbnormal = flags.bpHigh || flags.bpLow

    // Pulse deficit
    flags.pulseDeficit =
      record.pulseDeficit != null && record.pulseDeficit > 0

    // SpO2 < 95%
    flags.spO2Low =
      record.spO2 != null && record.spO2 < 95

    // RR > 20 or < 12
    flags.rrAbnormal =
      record.respiratoryRate != null &&
      (record.respiratoryRate > 20 || record.respiratoryRate < 12)

    // Temp >= 37.8°C
    flags.tempHigh =
      record.temperature != null && record.temperature >= 37.8

    // Any abnormality present
    flags.hasAny =
      flags.bpAbnormal ||
      flags.pulseDeficit ||
      flags.spO2Low ||
      flags.rrAbnormal ||
      flags.tempHigh

    return flags
  }

  /**
   * Get latest vitals for a specific patient (for bed deck alert dots).
   * Returns a promise — use in async contexts, not reactive templates.
   */
  async function getLatestForPatient(patientId) {
    const records = await db
      .table('vitals')
      .where('patientId')
      .equals(patientId)
      .reverse()
      .sortBy('timestamp')
    return records.length > 0 ? records[0] : null
  }

  /**
   * Get all vitals for a specific patient (for endorsement).
   */
  async function getAllForPatient(patientId) {
    return db
      .table('vitals')
      .where('patientId')
      .equals(patientId)
      .reverse()
      .sortBy('timestamp')
  }

  // ── Actions ───────────────────────────────────────────────

  /**
   * Add a new vitals record.
   * Auto-calculates pulseDeficit if both apical and radial are provided.
   *
   * @param {number} patientId
   * @param {object} data — vital sign values
   * @returns {Promise<number>} new vitals record id
   */
  async function addVitals(patientId, data) {
    // Auto-calculate pulse deficit
    let pulseDeficit = null
    if (data.apicalPulse != null && data.radialPulse != null) {
      pulseDeficit = Math.abs(data.apicalPulse - data.radialPulse)
    }

    const record = {
      patientId,
      timestamp: data.timestamp || Date.now(),
      bpSystolicL: data.bpSystolicL ?? null,
      bpDiastolicL: data.bpDiastolicL ?? null,
      bpSystolicR: data.bpSystolicR ?? null,
      bpDiastolicR: data.bpDiastolicR ?? null,
      apicalPulse: data.apicalPulse ?? null,
      radialPulse: data.radialPulse ?? null,
      pulseDeficit,
      respiratoryRate: data.respiratoryRate ?? null,
      spO2: data.spO2 ?? null,
      pulseOxPR: data.pulseOxPR ?? null,
      oxygenDelivery: data.oxygenDelivery || null,
      temperature: data.temperature ?? null,
      painScore: data.painScore ?? null,
      notes: data.notes || ''
    }

    const id = await db.table('vitals').add(record)

    // Touch parent patient's updatedAt
    await db.table('patients').update(patientId, {
      updatedAt: Date.now()
    })

    return id
  }

  /**
   * Update an existing vitals record.
   * Re-calculates pulseDeficit if pulse values changed.
   */
  async function updateVitals(id, changes) {
    // Re-calculate pulse deficit if either pulse value is being changed
    if (changes.apicalPulse !== undefined || changes.radialPulse !== undefined) {
      const existing = await db.table('vitals').get(id)
      if (existing) {
        const apical = changes.apicalPulse ?? existing.apicalPulse
        const radial = changes.radialPulse ?? existing.radialPulse
        if (apical != null && radial != null) {
          changes.pulseDeficit = Math.abs(apical - radial)
        }
      }
    }

    await db.table('vitals').update(id, changes)
  }

  /**
   * Delete a vitals record.
   */
  async function deleteVitals(id) {
    await db.table('vitals').delete(id)
  }

  // ── Endorsement Formatter ─────────────────────────────────

  /**
   * Format a single vitals record as clinical shorthand.
   * e.g. "11:30 | BP: 200/120 (L), 190/110 (R) | HR: 59 ap / 60 rad ..."
   */
  function formatEndorsement(record) {
    if (!record) return ''

    const parts = []

    // Timestamp
    const d = new Date(record.timestamp)
    const time = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
    parts.push(time)

    // BP
    const bpParts = []
    if (record.bpSystolicL != null && record.bpDiastolicL != null) {
      bpParts.push(`${record.bpSystolicL}/${record.bpDiastolicL} (L)`)
    }
    if (record.bpSystolicR != null && record.bpDiastolicR != null) {
      bpParts.push(`${record.bpSystolicR}/${record.bpDiastolicR} (R)`)
    }
    if (bpParts.length) parts.push(`BP: ${bpParts.join(', ')}`)

    // HR
    const hrParts = []
    if (record.apicalPulse != null) hrParts.push(`${record.apicalPulse} ap`)
    if (record.radialPulse != null) hrParts.push(`${record.radialPulse} rad`)
    if (hrParts.length) {
      let hr = `HR: ${hrParts.join(' / ')}`
      if (record.pulseDeficit != null && record.pulseDeficit > 0) {
        hr += ` (Deficit: ${record.pulseDeficit})`
      }
      parts.push(hr)
    }

    // RR
    if (record.respiratoryRate != null) {
      parts.push(`RR: ${record.respiratoryRate}`)
    }

    // SpO2
    if (record.spO2 != null) {
      let o2 = `SpO2: ${record.spO2}%`
      if (record.oxygenDelivery) o2 += ` on ${record.oxygenDelivery}`
      if (record.pulseOxPR != null) o2 += ` (PR ${record.pulseOxPR})`
      parts.push(o2)
    }

    // Temp
    if (record.temperature != null) {
      parts.push(`T: ${record.temperature}°C`)
    }

    // Pain
    if (record.painScore != null) {
      parts.push(`Pain: ${record.painScore}/10`)
    }

    // Note
    if (record.notes) {
      parts.push(`Note: ${record.notes}`)
    }

    return parts.join(' | ')
  }

  return {
    // Reactive
    vitalsForActivePatient,
    latestVitals,
    // Utilities
    checkAbnormals,
    getLatestForPatient,
    getAllForPatient,
    formatEndorsement,
    // Actions
    addVitals,
    updateVitals,
    deleteVitals
  }
})
