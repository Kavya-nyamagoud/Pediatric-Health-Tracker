import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../shared/api'

export default function Login() {
  const [role, setRole] = useState(null) // 'parent' or 'doctor'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!role) return setError('Please select a role')
    if (!email || !password) return setError('Please enter email and password')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password, role })
      const token = res.data?.token || res.data?.accessToken || null
      const user = res.data?.user || res.data?.parent || null
      localStorage.setItem('token', token)
      localStorage.setItem('role', role)
      if (role === 'parent' && user) {
        localStorage.setItem('parent', JSON.stringify(user))
      } else if (role === 'doctor' && user) {
        localStorage.setItem('doctor', JSON.stringify(user))
      }
      navigate(role === 'doctor' ? '/doctor-dashboard' : '/dashboard')
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.msg || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h1>Pediatric Health Tracker</h1>
        <p className="subtitle">Secure login for parents and doctors</p>

        {!role ? (
          <div className="role-select">
            <button
              className="role-btn parent-btn"
              onClick={() => setRole('parent')}
            >
              👨‍👩‍👧‍👦 Parent
            </button>
            <button
              className="role-btn doctor-btn"
              onClick={() => setRole('doctor')}
            >
              👨‍⚕️ Doctor
            </button>
          </div>
        ) : (
          <>
            <button className="back-btn" onClick={() => setRole(null)}>
              ← Back to role selection
            </button>
            <form onSubmit={submit}>
              <label>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Logging in…' : 'Login as ' + (role === 'doctor' ? 'Doctor' : 'Parent')}
              </button>
              {error && <div className="error">{error}</div>}
            </form>
            <p className="small muted">
              {role === 'parent'
                ? "Don't have an account? "
                : 'Contact admin for access. '}
              <Link to="/register">Register</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
