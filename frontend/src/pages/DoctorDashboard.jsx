import React, { useEffect, useState } from 'react'
import api from '../shared/api'

export default function DoctorDashboard() {
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [doctor, setDoctor] = useState(null)
  const [suggestions, setSuggestions] = useState({})
  const [suggestionDrafts, setSuggestionDrafts] = useState({})
  const [saving, setSaving] = useState({}) // map childId -> bool
  // Optional filter: show only children for a specific parent ID (useful to show only the 3 you added)
  const [filterParentId, setFilterParentId] = useState(() => {
    try {
      const p = JSON.parse(localStorage.getItem('parent') || 'null')
      return p && p.id ? String(p.id) : ''
    } catch (e) {
      return ''
    }
  })

  useEffect(() => {
    let d = null
    try { d = JSON.parse(localStorage.getItem('doctor') || 'null') } catch (e) { d = null }
    setDoctor(d)

    // Fetch all children, but only show those with a parent (userId set) so doctors see actual patients
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await api.get('/children')
        console.debug('[DoctorDashboard] /children response', res.data)
        const payload = res.data && res.data.data ? res.data.data : res.data
        let list = Array.isArray(payload) ? payload : []
        // Filter to children that have a parent (userId). This ensures doctor sees only real patients.
        list = list.filter(c => !!c.userId)
        setChildren(list)

        const sugg = {}
        const drafts = {}
        list.forEach((child) => {
          // no automatic suggestions — start empty and load persisted suggestions
          sugg[child.id] = { suggestion: '', completed: false, completion: null }
          drafts[child.id] = ''
        })
        setSuggestions(sugg)
        setSuggestionDrafts(drafts)

        // fetch persisted suggestions (latest) for each child
        list.forEach((child) => {
          api.get(`/children/${child.id}/suggestions`).then(res => {
            const data = res.data || res
            if (Array.isArray(data) && data.length > 0) {
              const latest = data[0]
              setSuggestions(prev => ({ ...prev, [child.id]: { suggestion: latest.suggestion || '', completed: !!latest.latestCompletion, completion: latest.latestCompletion || null } }))
            }
          }).catch(() => {})
        })
      } catch (err) {
        console.error('Doctor dashboard load error:', err)
        const msg = err?.response?.data?.msg || 'Failed to load patient data'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Periodically refresh suggestions so doctors see parent completions shortly after they happen
    const refreshInterval = setInterval(() => {
      // re-fetch latest suggestion for each child
      list.forEach((child) => {
        api.get(`/children/${child.id}/suggestions`).then(res => {
          const data = res.data || res
          if (Array.isArray(data) && data.length > 0) {
            const latest = data[0]
            setSuggestions(prev => ({ ...prev, [child.id]: { suggestion: latest.suggestion || '', completed: !!latest.latestCompletion, completion: latest.latestCompletion || null, id: latest.id } }))
          }
        }).catch(() => {})
      })
    }, 10000)

    return () => clearInterval(refreshInterval)
  }, [])

  // Automatic suggestions removed — doctors should manually enter suggestions
  // (function intentionally left blank)

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
    const y = Math.floor(months / 12)
    const m = months % 12
    if (y === 0) return `${m} months`
    if (m === 0) return `${y} years`
    return `${y} years ${m} months`
  }

  const getSuggestionForChild = (c) => {
    // Only show suggestion that doctor has explicitly saved
    return suggestions[c.id] || { suggestion: '', completed: false, completion: null }
  }

  return (
    <div className="doctor-dashboard">
      <div className="card">
        <h2>Doctor Dashboard</h2>
        {doctor && <p className="subtitle">Welcome, Dr. {doctor.name}!</p>}
        {doctor && doctor.role === 'doctor' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <p className="small muted">Showing patients with parent accounts by default.</p>
          </div>
        )}
        <p className="small muted">Review patients and provide recommendations.</p>
      </div>

      {error && <div className="card error-card">{error}</div>}
      {loading && !error && <div className="card"><p className="small muted">Loading patients…</p></div>}

      {!loading && (
        <>
          <div className="stats">
            <div className="stat-card">
              <h2>{children.length}</h2>
              <p>Patients</p>
            </div>
          </div>

          <h3 style={{ marginTop: '24px' }}>Patient List & Recommendations</h3>

          {/* Filter by parent id (show only specific parent's children) */}
          <div style={{ marginTop: '0.5rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label className="small muted">Filter by parent ID:</label>
            <input
              value={filterParentId}
              onChange={(e) => setFilterParentId(e.target.value)}
              placeholder="e.g. 5"
              style={{ width: 100, padding: '0.25rem' }}
            />
            <button className="btn" onClick={() => setFilterParentId('')}>Clear</button>
            <p className="small muted" style={{ marginLeft: 'auto' }}>
              Showing {filterParentId ? `children for parent ${filterParentId}` : 'all patients'}
            </p>
          </div>

          {children.length === 0 ? (
            <p className="muted">No patients to review yet.</p>
          ) : (
            <div className="patients-list">
              {children
                .filter((c) => (!filterParentId ? true : String(c.userId) === String(filterParentId)))
                .map((child) => (
                  <div key={child.id} className="patient-card">
                    <div className="patient-header">
                      <h4>{child.firstName ? `${child.firstName} ${child.lastName || ''}` : (child.name || 'Unnamed')}</h4>
                      <span className="small muted">Age: {child.dateOfBirth ? formatAge(computeMonthsFromDob(child.dateOfBirth)) : '—'}</span>
                    </div>
                    <div className="suggestion-box">
                      <strong>Doctor suggestion:</strong>
                      {getSuggestionForChild(child).suggestion ? (
                        <div>
                          <p>{getSuggestionForChild(child).suggestion}</p>
                          {getSuggestionForChild(child).completed && getSuggestionForChild(child).completion && (
                            <div className="small muted" style={{ marginTop: '0.5rem' }}>
                              ✅ Completed by parent on {new Date(getSuggestionForChild(child).completion.createdAt).toLocaleString()}
                              {getSuggestionForChild(child).completion.note && <div>Note: {getSuggestionForChild(child).completion.note}</div>}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="small muted">No doctor suggestion yet.</p>
                      )}

                      {doctor && doctor.id && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <textarea
                            rows={3}
                            value={suggestionDrafts[child.id] || ''}
                            onChange={(e) => setSuggestionDrafts(prev => ({ ...prev, [child.id]: e.target.value }))}
                            placeholder="Write a suggestion for the family..."
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 4 }}
                          />
                          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn"
                              disabled={!suggestionDrafts[child.id] || suggestionDrafts[child.id].trim().length === 0 || saving[child.id]}
                              onClick={async () => {
                                try {
                                  setSaving(prev => ({ ...prev, [child.id]: true }))
                                  const res = await api.post(`/children/${child.id}/suggestions`, { suggestion: suggestionDrafts[child.id] })
                                  // server returns created suggestion
                                  const persisted = res.data || res
                                  setSuggestions(prev => ({ ...prev, [child.id]: { suggestion: persisted.suggestion || suggestionDrafts[child.id], completed: false, completion: null } }))
                                  setSuggestionDrafts(prev => ({ ...prev, [child.id]: '' }))
                                  alert('Suggestion saved')
                                } catch (err) {
                                  console.error('Failed to save suggestion', err)
                                  const serverMsg = err?.response?.data?.message || err?.message || 'Failed to save suggestion'
                                  if (typeof serverMsg === 'string' && serverMsg.includes('No API route')) {
                                    alert('Server endpoint not available (backend may need restart).')
                                  } else {
                                    alert(serverMsg)
                                  }
                                } finally {
                                  setSaving(prev => ({ ...prev, [child.id]: false }))
                                }
                              }}
                            >
                              {saving[child.id] ? 'Saving…' : 'Save suggestion'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
