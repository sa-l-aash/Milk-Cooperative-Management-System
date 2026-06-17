import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const { user } = useAuth(); // Removed 'logout' variable extract
    const navigate = useNavigate();

    const [coopName, setCoopName] = useState('');
    const [county, setCounty] = useState('');
    const [subCounty, setSubCounty] = useState('');
    const [managerUsername, setManagerUsername] = useState('');
    const [managerPassword, setManagerPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', text: '' });

    // State to handle password visibility toggle
    const [showPassword, setShowPassword] = useState(false);

    // ==================== SECURITY LOGOUT GUARD ====================
    useEffect(() => {
        // Safe context interceptor redirects clean before null references fire
        if (!user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);
    // ===============================================================

    // Safety fallback layout to prevent crashes during logout transitions
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs font-semibold text-slate-500">
                Redirecting secure session context...
            </div>
        );
    }

    const handleProvisionSystem = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', text: '' });

        try {
            const response = await fetch('http://localhost:8080/api/v1/admin/provision-station', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    coopName,
                    county,
                    subCounty,
                    managerUsername,
                    managerPassword
                })
            });

            const resultText = await response.text();

            if (response.ok) {
                setStatus({ type: 'success', text: resultText });
                // Reset form inputs cleanly on success
                setCoopName('');
                setCounty('');
                setSubCounty('');
                setManagerUsername('');
                setManagerPassword('');
            } else {
                setStatus({ type: 'error', text: resultText || 'Failed to complete provision sequence.' });
            }
        } catch (error) {
            setStatus({ type: 'error', text: 'Network dispatch failure. Ensure backend is active.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in antialiased">
            {/* Header Display Panel */}
            <div className="border-b border-slate-200 pb-4">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">System Infrastructure Console</h1>
                <p className="text-slate-500 text-xs mt-1">Administrative centralized station deployment terminal.</p>
            </div>

            {status.text && (
                <div className={`p-3.5 border text-xs font-semibold rounded-xl animate-shake flex items-center gap-2 ${
                    status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${status.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    <span className="break-words">{status.text}</span>
                </div>
            )}

            <form onSubmit={handleProvisionSystem} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
                <div>
                    <h2 className="text-base font-bold text-slate-900">Station Deployment</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Initialize a physical cooperative processing cluster branch and assign its primary station manager concurrently.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Section left: Cooperative Details */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cooperative Parameters</h3>
                        
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1.5">Cooperative Name</label>
                            <input 
                                type="text" 
                                value={coopName} 
                                onChange={(e) => setCoopName(e.target.value)} 
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all" 
                                placeholder="e.g., Mau Dairy Cooperative" 
                                required 
                            />
                        </div>

                        {/* Geographic Splitting Form Input Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1.5">County</label>
                                <input 
                                    type="text" 
                                    value={county} 
                                    onChange={(e) => setCounty(e.target.value)} 
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all" 
                                    placeholder="e.g., Kericho" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1.5">Sub-County Branch</label>
                                <input 
                                    type="text" 
                                    value={subCounty} 
                                    onChange={(e) => setSubCounty(e.target.value)} 
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all" 
                                    placeholder="e.g., Belgut" 
                                    required 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section Right: Station Operator Details */}
                    <div className="space-y-4 md:border-l md:border-slate-100 md:pl-6 border-t md:border-t-0 pt-6 md:pt-0 border-slate-100">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Manager Credentials</h3>

                        <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1.5">Manager Account Username</label>
                            <input 
                                type="text" 
                                value={managerUsername} 
                                onChange={(e) => setManagerUsername(e.target.value)} 
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all" 
                                placeholder="e.g., manager_sk" 
                                required 
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1.5">Initial Access Password</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={managerPassword} 
                                    onChange={(e) => setManagerPassword(e.target.value)} 
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all pr-10" 
                                    placeholder="••••••••" 
                                    required 
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 rounded-xl transition text-xs disabled:bg-slate-200 disabled:text-slate-400 shadow-sm"
                    >
                        {loading ? "Executing Transactional Provisions..." : "Deploy Branch System"}
                    </button>
                </div>
            </form>
        </div>
    );
}