import Dexie from 'dexie'

/**
 * Pocket Kardex — IndexedDB via Dexie v4
 *
 * Tables:
 *   patients  — bed assignments (no PHI / full names)
 *   vitals    — timestamped vital-sign records per patient
 */
const db = new Dexie('PocketKardexDB')

db.version(1).stores({
  patients: '++id, bedNumber, createdAt, updatedAt',
  vitals: '++id, patientId, timestamp'
})

// ── Seed data on first-ever open ──────────────────────────────
db.on('populate', async (tx) => {
  const now = Date.now()

  // Patient 1: Bed 4-A
  const p1 = await tx.table('patients').add({
    bedNumber: 'Bed 4-A',
    ageGender: '64M',
    initials: 'J.D.',
    diagnosis: 'Hypertensive Urgency',
    notes: 'Monitor BP q15min. IV labetalol drip titrating.',
    createdAt: now,
    updatedAt: now
  })

  // Patient 2: Bed 12
  const p2 = await tx.table('patients').add({
    bedNumber: 'Bed 12',
    ageGender: '22F',
    initials: 'A.M.',
    diagnosis: 'Community-Acquired Pneumonia',
    notes: 'On Day 2 IV antibiotics. For repeat CXR tomorrow.',
    createdAt: now,
    updatedAt: now
  })

  // ── Vitals for Bed 4-A ───────────────────────────────────
  // Record 1: 30 min ago — critically elevated BP
  await tx.table('vitals').add({
    patientId: p1,
    timestamp: now - 30 * 60 * 1000,
    bpSystolicL: 200,
    bpDiastolicL: 120,
    bpSystolicR: 190,
    bpDiastolicR: 110,
    apicalPulse: 59,
    radialPulse: 60,
    pulseDeficit: 0,
    respiratoryRate: 18,
    spO2: 97,
    pulseOxPR: 61,
    oxygenDelivery: 'RA',
    temperature: 36.8,
    painScore: 0,
    notes: 'Post-nebulization. Pt alert and oriented x4.'
  })

  // Record 2: 15 min ago — BP trending down
  await tx.table('vitals').add({
    patientId: p1,
    timestamp: now - 15 * 60 * 1000,
    bpSystolicL: 178,
    bpDiastolicL: 105,
    bpSystolicR: null,
    bpDiastolicR: null,
    apicalPulse: 62,
    radialPulse: 60,
    pulseDeficit: 2,
    respiratoryRate: 17,
    spO2: 98,
    pulseOxPR: 63,
    oxygenDelivery: 'RA',
    temperature: 36.9,
    painScore: 2,
    notes: 'Slight headache reported. Labetalol drip at 2 mg/min.'
  })

  // ── Vitals for Bed 12 ────────────────────────────────────
  // Record 1: 45 min ago
  await tx.table('vitals').add({
    patientId: p2,
    timestamp: now - 45 * 60 * 1000,
    bpSystolicL: 118,
    bpDiastolicL: 72,
    bpSystolicR: null,
    bpDiastolicR: null,
    apicalPulse: 88,
    radialPulse: 88,
    pulseDeficit: 0,
    respiratoryRate: 22,
    spO2: 93,
    pulseOxPR: 89,
    oxygenDelivery: '2L NC',
    temperature: 38.2,
    painScore: 4,
    notes: 'Productive cough. Febrile — paracetamol given.'
  })

  // Record 2: 10 min ago — post-antipyretic
  await tx.table('vitals').add({
    patientId: p2,
    timestamp: now - 10 * 60 * 1000,
    bpSystolicL: 115,
    bpDiastolicL: 70,
    bpSystolicR: null,
    bpDiastolicR: null,
    apicalPulse: 84,
    radialPulse: 84,
    pulseDeficit: 0,
    respiratoryRate: 20,
    spO2: 94,
    pulseOxPR: 85,
    oxygenDelivery: '2L NC',
    temperature: 37.9,
    painScore: 3,
    notes: 'Temp trending down post-paracetamol. Encourage fluids.'
  })
})

export { db }
