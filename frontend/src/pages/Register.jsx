// frontend/src/pages/Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("parent");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const contentType = res.headers.get("content-type") || "";
      let data;
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server returned non-JSON response (${res.status}): ${text.slice(0, 300)}`);
      }

      if (!res.ok) {
        throw new Error(data.message || `Register failed (${res.status})`);
      }

      // store token and role-specific user object
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user?.role || role);
      if ((data.user?.role || role) === 'parent') {
        localStorage.setItem('parent', JSON.stringify(data.user));
      } else if ((data.user?.role || role) === 'doctor') {
        localStorage.setItem('doctor', JSON.stringify(data.user));
      } else {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      navigate(data.user.role === "doctor" ? "/doctor-dashboard" : "/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Register</h2>
      <form onSubmit={submit} style={{ maxWidth: 420 }}>
        <div style={{ marginBottom: 10 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required style={{ width: "100%", padding: 10 }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required style={{ width: "100%", padding: 10 }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required style={{ width: "100%", padding: 10 }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: "100%", padding: 10 }}>
            <option value="parent">Parent</option>
            <option value="doctor">Doctor</option>
          </select>
        </div>

        {error && <p style={{ color: "red", whiteSpace: "pre-wrap" }}>{error}</p>}

        <button type="submit" disabled={loading} style={{ padding: "10px 16px" }}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}
