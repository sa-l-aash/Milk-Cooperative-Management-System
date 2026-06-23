import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './views/Login'; 
import AdminDashboard from './views/AdminDashboard'; 
import ManagerDashboard from './views/ManagerDashboard'; 
import FarmerDashboard from './views/FarmerDashboard'; 
import FarmerAnalytics from './views/FarmerAnalytics'; // 💡 FIXED: Changed 'pages' to 'views'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
          {/* Global Structural Header */}
          <Navbar />

          {/* Central Router Core Wrapper */}
          <main className="flex-grow">
            <Routes>
              {/* Public Entry Route */}
              <Route path="/" element={<Login />} />

              {/* Secure Internal System Workspaces */}
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/manager-dashboard" element={<ManagerDashboard />} />
              <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
              
              {/* 💡 The New Analytics Sub-Route */}
              <Route path="/manager/farmer-analytics/:id" element={<FarmerAnalytics />} />
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