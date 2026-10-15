import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../shared/api'
import '../styles.css'
import VaccinationStatus from '../components/VaccinationStatus'

// Vaccination info will be fetched from the backend to provide age-aware recommendations
const RECOMMENDED_VACCINES = ['BCG', 'OPV', 'DPT', 'HepB', 'MMR', 'HiB', 'Rotavirus']

export default function ChildDetail({ addNotification }) {
  // Route defines `:id` in App.jsx — map it to `childId` here

  const { id: childId } = useParams()
  const navigate = useNavigate()

  const [child, setChild] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [role, setRole] = useState(() => {
  const r = localStorage.getItem('role')
    if (r) return r
    if (localStorage.getItem('doctor')) return 'doctor'
    if (localStorage.getItem('parent')) return 'parent'
    return null
  })
  const isDoctor = role === 'doctor'

  const [filterType, setFilterType] = useState('all')
  const [showAddRecord, setShowAddRecord] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [recordForm, setRecordForm] = useState({
    type: 'growth',
    height: '',
    weight: '',
    headCircumference: '',
    bmi: '',
    vaccination: '',
    notes: ''
  })

  const [vaccinationInfo, setVaccinationInfo] = useState(null) // { reminders, recommendedSchedule, vaccinationStatus }

  // Load child + records
  useEffect(() => {
    loadChildDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId])

  const loadChildDetail = async () => {
    try {
      setLoading(true)
      const childRes = await api.get(`/children/${childId}`)
      const childPayload = childRes.data && childRes.data.data ? childRes.data.data : childRes.data
      setChild(childPayload)

      const recordRes = await api.get(`/health?childId=${childId}&limit=100`)
      console.debug('[ChildDetail] /health response', recordRes.data)
      const recordsPayload = recordRes.data && recordRes.data.records ? recordRes.data.records : (recordRes.data || [])
      setRecords(recordsPayload)
      setError('')

      // Fetch age-aware vaccination recommendations and reminders
      try {
        const vacRes = await api.get(`/children/${childId}/vaccination-status`)
        setVaccinationInfo(vacRes.data)
      } catch (e) {
        console.debug('[ChildDetail] failed to fetch vaccination status', e?.response?.data || e?.message || e)
        setVaccinationInfo(null)
      }
    } catch (err) {
      setError(err?.response?.data?.msg || 'Failed to load child details')
    } finally {
      setLoading(false)
    }
  }

  /** ------------ Vaccine toast (pending count) ------------ */
  useEffect(() => {
    if (!addNotification || !child) return
    if (!records || records.length === 0) return

    // Avoid repeating the toast over and over for the same child in this tab
    const toastKey = `vaccineToastShown-${child.id}`
    if (sessionStorage.getItem(toastKey) === '1') return

    const givenVaccines = records
      .filter(r => r.type === 'vaccination' && r.vaccination)
      .map(r => r.vaccination.trim().toLowerCase())

    const pendingCount = RECOMMENDED_VACCINES.filter(
      vac => !givenVaccines.includes(vac.toLowerCase())
    ).length

    if (pendingCount > 0) {
      addNotification(
        `💉 ${child.firstName} has ${pendingCount} pending vaccines in the recommended list.`,
        'warning'
      )
      sessionStorage.setItem(toastKey, '1')
    }
  }, [records, child, addNotification])

  /** ------------ Export helpers ------------ */

  const handleExportReport = async () => {
    try {
      setExporting(true);
      const growthCount = records.filter(r => r.type === 'growth').length;
      const includeGrowthPrediction = growthCount >= 2;
      const vaccCount = records.filter(r => r.type === 'vaccination').length;
      const includeVaccination = vaccCount > 0;

      const url = `/api/health/export/report/${childId}?includeGrowthPrediction=${includeGrowthPrediction}&includeVaccination=${includeVaccination}`;
      
      // Use fetch directly for blob response
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/pdf'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to export report');
      }

      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `health-report-${child.firstName}-${child.lastName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);

      addNotification?.('✅ Health report exported successfully', 'success');
    } catch (err) {
      console.error('Export report error:', err);
      const message = err?.message || 'Failed to export report';
      setError(message);
      addNotification?.(`❌ ${message}`, 'critical');
    } finally {
      setExporting(false);
    }
  };

  const handleExportSummary = async () => {
    try {
      setExporting(true);
      const url = `/api/health/export/summary/${childId}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/pdf'
        }
      });

      if (!response.ok) {
        // For error responses, read the response once and handle it
        const contentType = response.headers.get('content-type');
        let errorMsg = 'Failed to export summary';
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMsg = errorData.msg || errorData.message || errorMsg;
        } else {
          const text = await response.text();
          console.error('Error response:', text);
        }
        
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `summary-${child.firstName}-${child.lastName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);

      addNotification?.('✅ Quick summary exported successfully', 'success');
    } catch (err) {
      console.error('Export summary error:', err);
      const message = err?.message || 'Failed to export summary';
      setError(message);
      addNotification?.(`❌ ${message}`, 'critical');
    } finally {
      setExporting(false);
    }
  }

  /** ------------ CRUD handlers ------------ */

  const handleRecordFormChange = e => {
    const { name, value } = e.target
    setRecordForm(prev => ({ ...prev, [name]: value }))
  }

  const handleAddRecord = async e => {
    e.preventDefault()
    try {
      const payload = {
        childId,
        type: recordForm.type,
        notes: recordForm.notes
      }

      if (recordForm.type === 'growth') {
        if (recordForm.height) payload.height = parseFloat(recordForm.height)
        if (recordForm.weight) payload.weight = parseFloat(recordForm.weight)
        if (recordForm.headCircumference) {
          payload.headCircumference = parseFloat(recordForm.headCircumference)
        }
        if (recordForm.bmi) payload.bmi = parseFloat(recordForm.bmi)
      } else if (recordForm.type === 'vaccination') {
        payload.vaccination = recordForm.vaccination
      }

      await api.post('/health', payload)
      setShowAddRecord(false)
      setRecordForm({
        type: 'growth',
        height: '',
        weight: '',
        headCircumference: '',
        bmi: '',
        vaccination: '',
        notes: ''
      })
      await loadChildDetail()
    } catch (err) {
      setError(err?.response?.data?.msg || 'Failed to add record')
    }
  }

  const handleDeleteRecord = async recordId => {
    if (!window.confirm('Delete this record?')) return
    try {
      await api.delete(`/health/${recordId}`)
      await loadChildDetail()
    } catch (err) {
      setError(err?.response?.data?.msg || 'Failed to delete record')
    }
  }

  const handleDeleteChild = async () => {
    if (!window.confirm('Delete this child? This cannot be undone.')) return
    try {
      await api.delete(`/children/${childId}`)
      navigate('/children')
    } catch (err) {
      setError(err?.response?.data?.msg || 'Failed to delete child')
    }
  }

  /** ------------ Derived data ------------ */

  const filteredRecords =
    filterType === 'all' ? records : records.filter(r => r.type === filterType)

  const givenVaccines = records
    .filter(r => r.type === 'vaccination' && r.vaccination)
    .map(r => r.vaccination.trim().toLowerCase())

  // Pending based on static recommended list (fallback)
  const pendingVaccines = RECOMMENDED_VACCINES.filter(
    vac => !givenVaccines.includes(vac.toLowerCase())
  )

  // Pending based on dynamic schedule from backend (age-aware)
  const pendingBySchedule = (() => {
    if (!vaccinationInfo || !Array.isArray(vaccinationInfo.recommendedSchedule)) return null
    const completedNames = (vaccinationInfo.vaccinationStatus?.completedVaccines || []).map(c => c.name.toLowerCase())
    return vaccinationInfo.recommendedSchedule.filter(v => {
      const short = v.name.split('(')[0].trim().toLowerCase()
      // If any completed vaccine name includes the short name, consider it completed
      const isCompleted = completedNames.some(cn => cn.includes(short) || short.includes(cn))
      return !isCompleted
    })
  })()

  // compute months between date of birth and now (round down)
  const computeMonthsFromDob = (dob) => {
    if (!dob) return null
    const birth = new Date(dob)
    if (isNaN(birth)) return null
    const now = new Date()
    let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
    if (now.getDate() < birth.getDate()) months -= 1
    if (months < 0) return 0
    return months
  }

  const formatAge = (months) => {
    if (months === null || months === undefined) return '—'
    if (months < 12) return `${months} months`
    const y = Math.floor(months / 12)
    const m = months % 12
    if (m === 0) return `${y} years`
    return `${y} years ${m} months`
  }

  /** ------------ Render ------------ */

  if (loading) {
    return (
      <div className="card">
        <p>Loading child details...</p>
      </div>
    )
  }

  if (!child) {
    return (
      <div className="card">
        <p>Child not found</p>
        <Link to="/children">Back to Children</Link>
      </div>
    )
  }

  return (
    <div className="child-detail">
      {/* Header + actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}
      >
        <div>
          <Link
            to="/children"
            style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem' }}
          >
            ← Back to Children
          </Link>
          <h2 style={{ margin: '0.5rem 0 0 0' }}>
            {child.firstName} {child.lastName}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-info"
            onClick={() => navigate('/analytics')}
            title="View Analytics & AI Growth"
          >
            📊 View Analytics & AI Growth
          </button>

         {!isDoctor && (
  <button
    className="btn btn-primary"
    onClick={() => setShowAddRecord(!showAddRecord)}
  >
    {showAddRecord ? '✕' : '➕ Add Record'}
  </button>
)}

          <button
            className="btn btn-info"
            onClick={handleExportSummary}
            disabled={exporting}
            title="Export quick summary PDF"
          >
            📄 Quick Summary
          </button>
          <button
            className="btn btn-info"
            onClick={handleExportReport}
            disabled={exporting}
            title="Export comprehensive health report"
          >
            📋 Full Report
          </button>
          {role !== 'doctor' && (
            <button className="btn btn-danger" onClick={handleDeleteChild}>
              Delete Child
            </button>
          )}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Child Info Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Child Information</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem'
          }}
        >
          <div>
            <p className="small muted">Age</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              {child.dateOfBirth ? formatAge(computeMonthsFromDob(child.dateOfBirth)) : '—'}
            </p>
          </div>
          <div>
            <p className="small muted">Gender</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{child.gender}</p>
          </div>
          {child.bloodType && (
            <div>
              <p className="small muted">Blood Type</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{child.bloodType}</p>
            </div>
          )}
          <div>
            <p className="small muted">Date of Birth</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              {child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString('en-GB') : '—'}
            </p>
          </div>
        </div>

        {(child.allergies?.length > 0 || child.medications?.length > 0) && (
          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #eee'
            }}
          >
            {child.allergies?.length > 0 && (
              <div>
                <p className="small muted">⚠️ Allergies</p>
                <p style={{ color: '#d32f2f' }}>{child.allergies.join(', ')}</p>
              </div>
            )}
            {child.medications?.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <p className="small muted">💊 Current Medications</p>
                <p>{child.medications.join(', ')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Record Form */}
     {!isDoctor && showAddRecord && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Add Health Record</h3>
          <form onSubmit={handleAddRecord} style={{ display: 'grid', gap: '1rem' }}>
            <select
              name="type"
              value={recordForm.type}
              onChange={handleRecordFormChange}
              style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="growth">Growth (Height/Weight)</option>
              <option value="vaccination">Vaccination</option>
              <option value="visit">Medical Visit</option>
              <option value="med">Medication</option>
            </select>

            {recordForm.type === 'growth' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}
              >
                <input
                  type="number"
                  step="0.1"
                  name="height"
                  placeholder="Height (cm)"
                  value={recordForm.height}
                  onChange={handleRecordFormChange}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  placeholder="Weight (kg)"
                  value={recordForm.weight}
                  onChange={handleRecordFormChange}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
                <input
                  type="number"
                  step="0.1"
                  name="headCircumference"
                  placeholder="Head Circumference (cm)"
                  value={recordForm.headCircumference}
                  onChange={handleRecordFormChange}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
                <input
                  type="number"
                  step="0.1"
                  name="bmi"
                  placeholder="BMI"
                  value={recordForm.bmi}
                  onChange={handleRecordFormChange}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
            )}

            {recordForm.type === 'vaccination' && (
              <input
                type="text"
                name="vaccination"
                placeholder="Vaccine Name"
                value={recordForm.vaccination}
                onChange={handleRecordFormChange}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            )}

            <textarea
              name="notes"
              placeholder="Notes"
              value={recordForm.notes}
              onChange={handleRecordFormChange}
              style={{
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                minHeight: '60px'
              }}
            />
            
            <button type="submit" className="btn btn-primary">
              Save Record
            </button>
          </form>
        </div>
      )}

      {/* Vaccine Reminders Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3>💉 Vaccine Reminders</h3>

        {vaccinationInfo ? (
          <>
            {/* Reminders (critical/warning/info) from backend */}
            {Array.isArray(vaccinationInfo.reminders) && vaccinationInfo.reminders.length > 0 ? (
              <div>
                {vaccinationInfo.reminders.map((r, i) => (
                  <div key={i} style={{ marginBottom: '0.5rem' }}>
                    <strong>{r.icon || ''} {r.message}</strong>
                    {r.details && <div className="small muted">{r.details}</div>}
                  </div>
                ))}
              </div>
            ) : (() => {
              const pending = pendingBySchedule || []
              if (pending.length === 0) {
                return (
                  <p className="small" style={{ color: '#28a745' }}>
                    All recommended vaccines for this child's age have been given.
                  </p>
                )
              }

              return (
                <>
                  <p className="small muted">These recommended vaccines are not yet recorded for this child (age-based):</p>
                  <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                    {pending.map(v => (
                      <li key={v.name} style={{ marginBottom: '0.25rem', color: '#856404' }}>
                        {v.name} <span className="small muted">({v.ageRange})</span>
                      </li>
                    ))}
                  </ul>
                </>
              )
            })()}
          </>
        ) : (
          // Fallback to static list if backend not available
          <>
            {pendingVaccines.length === 0 ? (
              <p className="small" style={{ color: '#28a745' }}>
                All recommended vaccines in this list have been given.
              </p>
            ) : (
              <>
                <p className="small muted">These recommended vaccines are not yet recorded for this child:</p>
                <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                  {pendingVaccines.map(vac => (
                    <li key={vac} style={{ marginBottom: '0.25rem', color: '#856404' }}>
                      {vac}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>

      {/* Vaccination schedule/status component */}
      <VaccinationStatus childId={childId} />

      {/* Records Filter & List */}
      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}
        >{/* 🔴🟡🟢 Growth Risk Level (from AI) */}
{vaccinationInfo?.growthRisk && (
  <div>
    <p className="small muted">Growth Risk</p>
    <p
      style={{
        fontSize: '1.1rem',
        fontWeight: 'bold',
        color:
          vaccinationInfo.growthRisk === 'High Risk'
            ? '#d32f2f'
            : vaccinationInfo.growthRisk === 'Moderate Risk'
            ? '#f57c00'
            : '#2e7d32',
      }}
    >
      {vaccinationInfo.growthRisk}
    </p>
  </div>
)}

          <h3>Health Records</h3>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="all">All Types</option>
            <option value="growth">Growth</option>
            <option value="vaccination">Vaccination</option>
            <option value="visit">Medical Visit</option>
            <option value="med">Medication</option>
          </select>
        </div>

        {filteredRecords.length === 0 ? (
          <p className="small muted">No health records yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredRecords.map(record => (
              <div
                key={record.id}
                style={{
                  padding: '1rem',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px',
                  border: '1px solid #eee'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          backgroundColor:
                            record.type === 'growth'
                              ? '#e7f3ff'
                              : record.type === 'vaccination'
                              ? '#fff3cd'
                              : '#f0f0f0',
                          color:
                            record.type === 'growth'
                              ? '#007bff'
                              : record.type === 'vaccination'
                              ? '#856404'
                              : '#333'
                        }}
                      >
                        {record.type}
                      </span>
                      <span className="small muted">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {record.type === 'growth' && (
                      <div className="small" style={{ color: '#666' }}>
                        {record.height && (
                          <p style={{ margin: '0.25rem 0' }}>
                            Height: <strong>{record.height} cm</strong>
                          </p>
                        )}
                        {record.weight && (
                          <p style={{ margin: '0.25rem 0' }}>
                            Weight: <strong>{record.weight} kg</strong>
                          </p>
                        )}
                        {record.headCircumference && (
                          <p style={{ margin: '0.25rem 0' }}>
                            Head Circ: <strong>{record.headCircumference} cm</strong>
                          </p>
                        )}
                        {record.bmi && (
                          <p style={{ margin: '0.25rem 0' }}>
                            BMI: <strong>{record.bmi}</strong>
                          </p>
                        )}
                      </div>
                    )}

                    {record.type === 'vaccination' && (
                      <p className="small" style={{ color: '#666', margin: 0 }}>
                        Vaccine: <strong>{(record.vaccination || record.vaccine || record.name || '').toString().replace(/\s*administered\s*$/i,'').trim() || 'Vaccine'}</strong>
                      </p>
                    )}

                    {record.notes && (
                      <p
                        className="small"
                        style={{ color: '#666', marginTop: '0.5rem' }}
                      >
                        📝 {record.notes}
                      </p>
                    )}
                  </div>

                 {role !== 'doctor' && (
   <button
    className="btn btn-danger"
    onClick={() => handleDeleteRecord(record.id)}
    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
  >
    Delete
  </button>
)}

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
