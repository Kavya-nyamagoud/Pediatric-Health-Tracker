import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../shared/api'
import '../styles.css'

export default function ChildrenList() {
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(() => {
    const r = localStorage.getItem('role')
    if (r) return r
    if (localStorage.getItem('doctor')) return 'doctor'
    if (localStorage.getItem('parent')) return 'parent'
    return null
  })
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    bloodType: 'O+',
    allergies: '',
    medications: ''
  })
  const navigate = useNavigate()

  useEffect(() => {
    // Get user role from localStorage
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        setUser(JSON.parse(userStr))
      } catch(e) {}
    }
    // ensure role is up-to-date if localStorage changed elsewhere
    const r = localStorage.getItem('role') || (localStorage.getItem('doctor') ? 'doctor' : (localStorage.getItem('parent') ? 'parent' : null))
    setRole(r)
    loadChildren()
  }, [])

  const loadChildren = async () => {
    try {
      setLoading(true)
      const res = await api.get('/children')
      const payload = res.data && res.data.data ? res.data.data : res.data
      setChildren(Array.isArray(payload) ? payload : [])
      setError('')
    } catch (err) {
      setError(err?.response?.data?.msg || 'Failed to load children')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAddChild = async (e) => {
    e.preventDefault()
    try {
      await api.post('/children', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodType: formData.bloodType || undefined,
        allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()) : [],
        medications: formData.medications ? formData.medications.split(',').map(m => m.trim()) : []
      })
      setShowAddForm(false)
      setFormData({ firstName: '', lastName: '', dateOfBirth: '', gender: 'male', bloodType: 'O+', allergies: '', medications: '' })
      await loadChildren()
    } catch (err) {
      setError(err?.response?.data?.msg || 'Failed to add child')
    }
  }

  const handleDeleteChild = async (childId) => {
    if (window.confirm('Are you sure you want to delete this child?')) {
      try {
        await api.delete(`/children/${childId}`)
        await loadChildren()
      } catch (err) {
        setError(err?.response?.data?.msg || 'Failed to delete child')
      }
    }
  }

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A'
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  if (loading) return <div className="card"><p>Loading children...</p></div>

  return (
    <div className="children-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>My Children</h2>
        {role !== 'doctor' && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? '✕ Cancel' : '➕ Add Child'}
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {/* Add Child Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Add New Child</h3>
          <form onSubmit={handleAddChild} style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input
                type="text"
                name="firstName"
                placeholder="First Name *"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name *"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
                style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <input
              type="text"
              name="bloodType"
              placeholder="Blood Type (e.g., O+)"
              value={formData.bloodType}
              onChange={handleInputChange}
              style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />

            <textarea
              name="allergies"
              placeholder="Allergies (comma-separated)"
              value={formData.allergies}
              onChange={handleInputChange}
              style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', minHeight: '60px' }}
            />

            <textarea
              name="medications"
              placeholder="Current Medications (comma-separated)"
              value={formData.medications}
              onChange={handleInputChange}
              style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', minHeight: '60px' }}
            />

            <button type="submit" className="btn btn-primary">Save Child</button>
          </form>
        </div>
      )}

      {/* Children Grid */}
      {children.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p className="small muted">No children added yet.</p>
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>Add First Child</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {children.map(child => (
            <div key={child.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>{child.firstName} {child.lastName}</h3>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  <p style={{ margin: '0.25rem 0' }}>Age: <strong>{calculateAge(child.dateOfBirth)} years</strong></p>
                  <p style={{ margin: '0.25rem 0' }}>Gender: <strong>{child.gender}</strong></p>
                  {child.bloodType && <p style={{ margin: '0.25rem 0' }}>Blood Type: <strong>{child.bloodType}</strong></p>}
                  {child.allergies && child.allergies.length > 0 && (
                    <p style={{ margin: '0.25rem 0', color: '#d32f2f' }}>⚠️ Allergies: <strong>{child.allergies.join(', ')}</strong></p>
                  )}

                  {/* Show parent assignment status to avoid "unknown" children confusion */}
                  <p style={{ margin: '0.25rem 0' }}>Parent: <strong>{child.userId ? 'Assigned' : 'Unassigned'}</strong></p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <Link to={`/children/${child.id}`} className="btn btn-primary" style={{ flex: 1 }}>View Details</Link>
                {role !== 'doctor' && (
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteChild(child.id)}
                    style={{ padding: '0.5rem 0.75rem' }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
