import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function FarmerDashboard() {
    const { user } = useAuth(); // Log out handled globally by Navbar context
    const navigate = useNavigate();
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Dynamic contextual station metadata parameters pulled from user context or session keys
    const coopName = user?.cooperativeName || localStorage.getItem("coopName") || 'Assigned Station';
    const county = user?.county || localStorage.getItem("county") || '';
    const subCounty = user?.subCounty || localStorage.getItem("subCounty") || '';
    
    const fullName = user?.identifier || 'Registered Producer';
    const farmerNumber = localStorage.getItem("farmerNo") || '0002';

    // ==================== SECURITY LOGOUT GUARD ====================
    useEffect(() => {
        if (!user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);
    // ===============================================================

    useEffect(() => {
        if (!user) return;

        const fetchHistory = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/v1/collections/farmer/${user.userId}`);
                if (!response.ok) throw new Error('Could not pull delivery history.');
                const data = await response.json();
                setDeliveries(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [user]);

    // Safety fallback screen during frame structural shifts
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs font-semibold text-slate-500">
                Redirecting safe session context...
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-fade-in antialiased">
            
            {/* Context-Aware Account Card Frame */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-4 sm:p-6 shadow-md relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
                <div className="relative z-10 space-y-4">
                    
                    {/* Upper Metadata Ribbon Area */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-200 bg-white/10 border border-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                             {coopName}
                        </span>
                        {subCounty && county && (
                            <span className="text-[10px] uppercase font-medium tracking-wide text-emerald-100 bg-black/20 px-2.5 py-0.5 rounded-full">
                                 {subCounty}, {county} County
                            </span>
                        )}
                    </div>

                    {/* Left: Stacked Identifiers (Uniform typography pairs in two rows) */}
                    <div className="pt-1 space-y-2">
                        {/* Row 1: Farmer Number Section */}
                        <div className="flex flex-wrap items-baseline gap-2 text-xl sm:text-2xl font-mono font-black tracking-tight text-emerald-300">
                            <span className="uppercase tracking-wide text-xs sm:text-sm text-emerald-200/60 shrink-0 font-sans font-bold">
                                Farmer Number : 
                            </span>
                            <span>
                                {farmerNumber}
                            </span>
                        </div>

                        {/* Row 2: Farmer Name Section */}
                        <div className="flex flex-wrap items-baseline gap-2 text-xl sm:text-2xl font-mono font-black tracking-tight text-emerald-300">
                            <span className="uppercase tracking-wide text-xs sm:text-sm text-emerald-200/60 shrink-0 font-sans font-bold">
                                Farmer Name : 
                            </span>
                            <span className="tracking-wide">
                                {fullName}
                            </span>
                        </div>
                    </div>

                </div>
            </div>

            {/* Ledger Log Section */}
            <div className="space-y-3">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Your Delivery Receipts History
                </h2>
                
                {loading && <div className="text-center text-xs text-slate-400 py-6">Querying cluster database matrices...</div>}
                {error && <div className="text-center text-xs text-rose-600 bg-rose-50 border border-rose-100 p-4 rounded-xl font-medium">{error}</div>}
                
                {!loading && !error && deliveries.length === 0 && (
                    <div className="text-center text-xs text-slate-400 bg-white border border-slate-200/60 p-8 rounded-xl shadow-sm">
                        No collection entry points found for this node framework.
                    </div>
                )}

                {/* Dynamic List Rendering */}
                <div className="space-y-3">
                    {deliveries.map((d) => (
                        <div key={d.deliveryId} className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition hover:border-slate-300">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-slate-900">{d.quantityLiters.toFixed(2)} Liters</span>
                                    <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">{d.sessionType}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 font-medium">Delivered Date: {d.deliveryDate}</div>
                            </div>
                            <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                                <div className="text-sm font-black text-emerald-700">KES {d.totalPayout.toFixed(2)}</div>
                                <div className="text-[10px] text-slate-400 font-medium">@ KES {d.pricePerLiter.toFixed(2)}/L</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}