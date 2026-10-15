import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Navbar(){
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  let parent = null, doctor = null
  try { parent = JSON.parse(localStorage.getItem('parent') || 'null') } catch(e) { parent = null }
  try { doctor = JSON.parse(localStorage.getItem('doctor') || 'null') } catch(e) { doctor = null }

  const logout = ()=>{
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('parent')
    localStorage.removeItem('doctor')
    navigate('/login')
  }

  return (
    <nav className="nav">
      <div className="nav-left">
        <Link to={role === 'doctor' ? '/doctor-dashboard' : '/dashboard'}>PediatricHealth</Link>
      </div>
      <div className="nav-right">
        {token ? (
          <>
            {role === 'doctor' ? (
              <>
                <span className="small muted">Dr. {doctor?.name || 'Doctor'}</span>
                <Link to="/children">Patients</Link>
              </>
            ) : (
              <>
                <span className="small muted">Hi, {parent?.name || 'Parent'}</span>
                <Link to="/children">Children</Link>
              </>
            )}
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}
