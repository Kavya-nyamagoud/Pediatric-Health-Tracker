import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChildrenList from "./pages/ChildrenList";
import ChildDetail from "./pages/ChildDetail";
import Analytics from "./pages/Analytics";
import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/Navbar";

function App() {
  return (
    <div>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/children" element={<ChildrenList />} />
            <Route path="/children/:id" element={<ChildDetail />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>

          <Route path="*" element={<div style={{ padding: 24 }}>Page not found</div>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
