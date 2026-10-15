import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../shared/api'

export default function Dashboard() {
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [parent, setParent] = useState(null)
  const [suggestions, setSuggestions] = useState({}) // map childId -> suggestion text
  const [role, setRole] = useState(() => {
  if (localStorage.getItem('doctor')) return 'doctor'
  if (localStorage.getItem('parent')) return 'parent'
  return null
})


  useEffect(() => {
    let p = null
    try { p = JSON.parse(localStorage.getItem('parent') || 'null') } catch(e) { p = null }
    setParent(p)

    const loadChildren = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await api.get('/children')
        // Normalize backend response shapes: either array or { success,data }
        const payload = res.data && res.data.data ? res.data.data : res.data
        const list = Array.isArray(payload) ? payload : []
        setChildren(list)

        // fetch latest doctor suggestion for each child
        list.forEach((child) => {
          api.get(`/children/${child.id}/suggestions`).then(res => {
            const data = res.data || res
            if (Array.isArray(data) && data.length > 0) {
              // store the full suggestion object (id + text) so parents can mark it completed
              setSuggestions(prev => ({ ...prev, [child.id]: data[0] }))
            }
          }).catch(() => {})
        })
      } catch (err) {
        console.error(err)
        setError(err?.response?.data?.message || err?.response?.data?.msg || 'Failed to load children')
      } finally {
        setLoading(false)
      }
    }
    loadChildren()
  }, [])

  return (
    <div className="card">
      <h1>Parent Dashboard</h1>

      {/* ✅ ADDED: Explicit Parent ID display */}
      {parent?.id && (
        <p className="subtitle" style={{ marginTop: '-10px', color: '#555' }}>
          <strong>Parent ID:</strong> {parent.id}
        </p>
      )}

      {parent && <p className="subtitle">Welcome back, {parent.name}!</p>}
      {loading && <p>Loading children...</p>}
      {error && <p className="error">{error}</p>}

      <div className="stats">
        <div className="stat-card">
          <h2>{children.length}</h2>
          <p>Children</p>
        </div>
      </div>

     <h3>{role === 'doctor' ? 'Assigned Patients' : 'Your Children'}</h3>
      {children.length === 0 ? (
        <p className="muted">No children added yet. <Link to="/children">Add one now</Link></p>
      ) : (
        <ul className="children-list">
          {children.map((child) => (
            <li key={child.id} className="child-item">
              <Link to={`/children/${child.id}`}>
                <strong>{child.firstName ? `${child.firstName} ${child.lastName || ''}` : child.name}</strong>
                <span className="small muted">
                  DOB: {child.dateOfBirth
                    ? new Date(child.dateOfBirth).toLocaleDateString('en-GB')
                    : (child.dob ? new Date(child.dob).toLocaleDateString('en-GB') : '—')}
                </span>

                {suggestions[child.id] && (
                  <div style={{ marginTop: '0.5rem' }} className="suggestion-box">
                    <strong>Doctor suggestion:</strong>
                    <p style={{ margin: '6px 0 0 0' }}>
                      {suggestions[child.id].suggestion || suggestions[child.id]}
                    </p>

                    {suggestions[child.id].id && (
                      <div style={{ marginTop: '6px' }}>
                        <button
                          className="btn btn-success"
                          onClick={async (e) => {
                            e.preventDefault()
                            try {
                              const res = await api.post(
                                `/children/${child.id}/suggestions/${suggestions[child.id].id}/complete`,
                                { note: 'Completed by parent via dashboard' }
                              )
                              setSuggestions(prev => {
                                const copy = { ...prev }
                                delete copy[child.id]
                                return copy
                              })
                              alert(res?.data?.message || 'Marked as completed and notified the doctor.')
                            } catch (err) {
                              const msg =
                                err?.response?.data?.message ||
                                err?.response?.data?.msg ||
                                err?.message ||
                                'Failed to mark suggestion completed'
                              alert(msg)
                            }
                          }}
                        >
                          Mark completed
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

     
 {role !== 'doctor' && (
  <Link to="/children" className="cta-link">
    Manage Children →
  </Link>
)}

    </div>
  )
}
