import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // 💡 ADDED: Routing package structures
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './views/Login'; // 💡 ADDED: Your secure entry portal
import AdminDashboard from './views/AdminDashboard'; // 💡 ADDED: Infrastructure deck
import ManagerDashboard from './views/ManagerDashboard'; // 💡 ADDED: Intake workspace
import FarmerDashboard from './views/FarmerDashboard'; // 💡 ADDED: Producer ledger metrics

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
          {/* Global Structural Header (Stays active on top of all application frames) */}
          <Navbar />

          {/* Central Router Core Wrapper */}
          <main className="flex-grow">
            <Routes>
              {/* Public Entry Route - Serves your login portal console right at root layout */}
              <Route path="/" element={<Login />} />

              {/* Secure Internal System Workspaces */}
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/manager-dashboard" element={<ManagerDashboard />} />
              <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
            </Routes>
          </main>

          {/* Global Structural Footer */}
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;