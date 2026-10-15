// frontend/src/pages/ParentLogin.jsx
import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000/api";

const ParentLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "parent" }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Parent Login</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: 420 }}>
        <div style={{ marginBottom: 10 }}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" style={{ width: "100%", padding: 10 }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" style={{ width: "100%", padding: 10 }} />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: "10px 16px" }}>{loading ? "Logging in..." : "Login as Parent"}</button>
      </form>

      <p>
        Are you a doctor? <Link to="/doctor-login">Login here</Link>
      </p>
      <p>
        New here? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};

export default ParentLogin;
