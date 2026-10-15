import React, { useEffect, useState } from 'react'
import api from '../shared/api'

/* ----------------------------------
   Normalize vaccine names safely
-----------------------------------*/
const normalize = (str = '') =>
  str
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[-()]/g, '')

export default function VaccinationStatus({ childId, records: initialRecords = null }) {
  const [records, setRecords] = useState(initialRecords)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [vaccinationInfo, setVaccinationInfo] = useState(null)
  const [loadingInfo, setLoadingInfo] = useState(false)

  useEffect(() => {
    if (initialRecords && Array.isArray(initialRecords)) return
    if (!childId) return
    fetchHealthRecords()
    fetchVaccinationInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, initialRecords])

  const fetchHealthRecords = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/health?childId=${childId}&limit=200`)
      const payload = res.data || res
      const recs = Array.isArray(payload)
        ? payload
        : payload.records || []
      setRecords(recs)
      setError('')
    } catch {
      setError('Failed to load health records')
    } finally {
      setLoading(false)
    }
  }

  const fetchVaccinationInfo = async () => {
    try {
      setLoadingInfo(true)
      const res = await api.get(`/children/${childId}/vaccination-status`)
      setVaccinationInfo(res.data)
    } catch {
      setVaccinationInfo(null)
    } finally {
      setLoadingInfo(false)
    }
  }

  /* ----------------------------------
     Extract ONLY real vaccine records
  -----------------------------------*/
  const administeredVaccines = (records || [])
    .filter(r =>
      r &&
      (r.type === 'vaccine' ||
        r.type === 'vaccination' ||
        r.vaccine ||
        r.vaccineName ||
        r.vaccine_name)
    )
    .map(r => ({
      name:
        (r.vaccine ||
          r.vaccineName ||
          r.vaccine_name ||
          r.vaccination ||
          r.name ||
          '').trim(),
      date: r.createdAt || r.date || null
    }))

  /* ----------------------------------
     Normalized lookup set
  -----------------------------------*/
  const administeredSet = new Set(
    administeredVaccines.map(v => normalize(v.name))
  )

  return (
    <div className="card" style={{ marginBottom: '1.25rem' }}>
      <h3>💉 Vaccination</h3>

      {(loading || loadingInfo) && <p>Loading vaccination info...</p>}
      {error && <p className="error">{error}</p>}

      {/* Recommended Schedule */}
      {vaccinationInfo?.recommendedSchedule?.length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <p className="small muted">
            Recommended vaccines (completed only if recorded):
          </p>

          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {vaccinationInfo.recommendedSchedule.map((v, idx) => {
              const completed = administeredSet.has(normalize(v.name))

              return (
                <div
                  key={idx}
                  style={{
                    padding: '0.5rem',
                    background: '#f9f9f9',
                    borderRadius: 6,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <strong>{v.name}</strong>
                    <div style={{ fontSize: '0.85rem', color: '#555' }}>
                      {v.ageRange}
                    </div>
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      color: completed ? '#28a745' : '#856404'
                    }}
                  >
                    {completed ? 'completed' : 'pending'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Administered List */}
      <p style={{ marginTop: '1rem', color: '#666' }}>
        {administeredVaccines.length} administered vaccine(s)
      </p>

      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {administeredVaccines.map((v, idx) => (
          <div
            key={idx}
            style={{ padding: '0.5rem', background: '#f9f9f9', borderRadius: 6 }}
          >
            <strong>{v.name}</strong>
            <div style={{ fontSize: '0.85rem', color: '#555' }}>
              {v.date
                ? new Date(v.date).toLocaleDateString('en-GB')
                : 'date unknown'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
