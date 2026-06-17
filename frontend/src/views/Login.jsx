import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate(); 
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // State to handle password visibility toggle
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(identifier, password);
        setLoading(false);

        if (result.success) {
            // 💡 CRITICAL CACHE STEP: Saves the precise typed number string (e.g. 0002) 
            // so the FarmerDashboard can render it side-by-side with their full name.
            localStorage.setItem('farmerNo', identifier.trim());

            // MULTI-COOP ROLE-BASED ROUTING SYSTEM
            if (result.role === 'ADMIN') {
                navigate('/admin-dashboard');
            } else if (result.role === 'MANAGER') {
                navigate('/manager-dashboard');
            } else if (result.role === 'FARMER') {
                navigate('/farmer-dashboard');
            } else {
                navigate('/'); 
            }
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-8rem)] bg-slate-50 flex items-center justify-center p-4 sm:p-6 antialiased">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 max-w-4xl w-full overflow-hidden flex flex-col md:flex-row transition-all duration-300">
                
                {/* Brand Side Panel - Responsive visibility and layout */}
                <div className="bg-emerald-800 text-white p-6 sm:p-8 md:w-1/2 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 to-teal-950 opacity-95 z-0"></div>
                    <div className="relative z-10 animate-fade-in space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black tracking-wider bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                                M-COOP
                            </span>
                            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        </div>
                        <div className="pt-2 sm:pt-4 space-y-2">
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                                Smart Dairy Logistics Platform
                            </h1>
                            <p className="text-emerald-100/80 text-xs font-medium leading-relaxed max-w-sm">
                                Empowering local farmers and cooperative clusters with real-time transactional ledger and intake inventory tracking.
                            </p>
                        </div>
                    </div>
                    <div className="relative z-10 mt-8 md:mt-12 text-[10px] uppercase tracking-wider font-semibold text-emerald-200/50">
                        &copy; 2026 Milk Cooperative Management System.
                    </div>
                </div>

                {/* Form Inputs Side Panel */}
                <div className="p-6 sm:p-8 md:w-1/2 flex flex-col justify-center bg-white">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
                        <p className="text-slate-500 text-xs mt-1">Please enter your credentials to access the cooperative system workspace.</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold rounded-xl animate-shake flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0"></span>
                            <span className="break-words">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                Username / Farmer Number
                            </label>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all duration-200 text-sm"
                                placeholder="e.g., manager_sk or 10025"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all duration-200 text-sm pr-10"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center text-sm mt-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="h-5 w-5 border-2 border-slate-400 border-t-emerald-700 rounded-full animate-spin"></div>
                            ) : (
                                "Sign In to System"
                            )}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
}