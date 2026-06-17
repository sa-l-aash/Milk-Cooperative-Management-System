import React from 'react';
import { useAuth } from '../context/AuthContext';
import ManagerDashboard from './ManagerDashboard';
import FarmerDashboard from './FarmerDashboard';
import AdminDashboard from './AdminDashboard';
import Login from './Login';

export default function Home() {
    const { isAuthenticated, user } = useAuth();

    // Route 1: Unauthenticated Session Gate
    if (!isAuthenticated) {
        return <Login />;
    }

    // Route 2: Super Admin System Flow
    if (user.role === 'ADMIN') {
        return <AdminDashboard />;
    }

    // Route 3: Cooperative Manager Flow
    if (user.role === 'MANAGER') {
        return <ManagerDashboard />;
    }

    // Route 4: Farmer Profile Flow
    return <FarmerDashboard />;
}