import React, { useState, useEffect } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

export default function CoopOverview() {
    const [loading, setLoading] = useState(true);

    // ==========================================
    // MOCK DATA: To visualize the UI instantly
    // ==========================================
    const kpis = {
        totalVolumeMTD: "15,420",
        volumeTrend: "+5.2%",
        projectedPayout: "693,900", // 15,420 * 45 Ksh
        payoutTrend: "+5.2%",
        activeFarmers: 42,
        totalFarmers: 50
    };

    const amPmSplit = [
        { name: 'Morning Shift', value: 9250, color: '#10b981' }, // Emerald
        { name: 'Evening Shift', value: 6170, color: '#0ea5e9' }  // Sky Blue
    ];

    const topProducers = [
        { id: '0012', name: 'Peter Kipkorir', volume: 1120, trend: 'up' },
        { id: '0001', name: 'Andrew Salaash', volume: 1050, trend: 'up' },
        { id: '0045', name: 'Grace Wambui', volume: 980, trend: 'same' },
        { id: '0023', name: 'John Doe', volume: 940, trend: 'up' },
        { id: '0008', name: 'Sarah Connor', volume: 890, trend: 'down' },
    ];

    const bottomProducers = [
        { id: '0033', name: 'James Omondi', volume: 120, trend: 'down' },
        { id: '0019', name: 'Alice Mutua', volume: 145, trend: 'same' },
        { id: '0027', name: 'David Kimani', volume: 160, trend: 'down' },
        { id: '0004', name: 'Lucy Njoroge', volume: 185, trend: 'up' },
        { id: '0039', name: 'Brian Odhiambo', volume: 190, trend: 'down' },
    ];

    const suddenDrops = [
        { id: '0015', name: 'Moses Kuria', drop: '-45%', reason: 'Pending Check' },
        { id: '0042', name: 'Faith Nduta', drop: '-32%', reason: 'Pending Check' },
    ];

    // Generate 30 days of mock macro data
    const macroTrendData = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return {
            date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            liters: Math.floor(Math.random() * (600 - 400 + 1) + 400) // Random daily total between 400-600
        };
    });

    // Simulate network load
    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 600);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center h-96">
                <div className="h-10 w-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            
            {/* 1. KPI ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Volume KPI */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Volume (MTD)</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-3xl font-black text-slate-900">{kpis.totalVolumeMTD} <span className="text-lg text-slate-500 font-medium">L</span></h3>
                    </div>
                    <p className="text-sm font-medium text-emerald-600 mt-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        {kpis.volumeTrend} vs last month
                    </p>
                </div>

                {/* Payout KPI */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Projected Payout</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-3xl font-black text-slate-900"><span className="text-lg text-slate-500 font-medium mr-1">KSh</span>{kpis.projectedPayout}</h3>
                    </div>
                    <p className="text-sm font-medium text-emerald-600 mt-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        {kpis.payoutTrend} vs last month
                    </p>
                </div>

                {/* Active Farmers KPI */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Farmers</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-3xl font-black text-slate-900">{kpis.activeFarmers}</h3>
                        <span className="text-slate-500 font-medium">/ {kpis.totalFarmers}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(kpis.activeFarmers/kpis.totalFarmers)*100}%` }}></div>
                    </div>
                </div>
            </div>

            {/* 2. CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 30-Day Coop Trend */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-base font-bold text-slate-900 mb-6">30-Day Cooperative Intake</h2>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={macroTrendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="macroColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} dy={10} minTickGap={20} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                                <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                                <Area type="monotone" dataKey="liters" stroke="#10b981" strokeWidth={3} fill="url(#macroColor)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AM/PM Split Donut */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <h2 className="text-base font-bold text-slate-900 mb-2">Shift Breakdown</h2>
                    <div className="flex-1 flex flex-col justify-center items-center relative">
                        <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={amPmSplit} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                        {amPmSplit.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value) => [`${value} L`, "Volume"]} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Custom Legend */}
                        <div className="flex gap-4 mt-2">
                            {amPmSplit.map(item => (
                                <div key={item.name} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                                    {item.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. LEADERBOARDS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Top 5 Producers */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-emerald-50 px-5 py-4 border-b border-emerald-100 flex justify-between items-center">
                        <h2 className="font-bold text-emerald-900">Top 5 Producers</h2>
                        <span className="text-xs font-bold bg-emerald-200 text-emerald-800 px-2 py-1 rounded-md">MTD</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {topProducers.map((farmer, idx) => (
                            <div key={farmer.id} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="font-black text-slate-300 w-4">{idx + 1}</div>
                                    <div>
                                        <p className="font-bold text-sm text-slate-900">{farmer.name}</p>
                                        <p className="text-xs text-slate-500 font-medium">ID: {farmer.id}</p>
                                    </div>
                                </div>
                                <div className="font-bold text-slate-700">{farmer.volume} L</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom 5 Producers */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                        <h2 className="font-bold text-slate-900">Bottom 5 (Active)</h2>
                        <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-1 rounded-md">Needs Review</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {bottomProducers.map((farmer, idx) => (
                            <div key={farmer.id} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                                <div>
                                    <p className="font-bold text-sm text-slate-900">{farmer.name}</p>
                                    <p className="text-xs text-slate-500 font-medium">ID: {farmer.id}</p>
                                </div>
                                <div className="font-bold text-amber-600">{farmer.volume} L</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sudden Drops */}
                <div className="bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden">
                    <div className="bg-rose-50 px-5 py-4 border-b border-rose-100 flex justify-between items-center">
                        <h2 className="font-bold text-rose-900">Sudden Drops Alert</h2>
                        <span className="text-xs font-bold bg-rose-200 text-rose-800 px-2 py-1 rounded-md border border-rose-300 animate-pulse">Action Req.</span>
                    </div>
                    <div className="divide-y divide-rose-100">
                        {suddenDrops.length === 0 ? (
                            <div className="p-8 text-center text-sm font-medium text-slate-500">No sudden drops detected this week.</div>
                        ) : (
                            suddenDrops.map(farmer => (
                                <div key={farmer.id} className="p-4 hover:bg-rose-50/50 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="font-bold text-sm text-slate-900">{farmer.name}</p>
                                        <span className="font-black text-rose-600 bg-rose-100 px-2 rounded-md">{farmer.drop}</span>
                                    </div>
                                    <p className="text-xs font-semibold text-rose-500/80">Suggest farm visit or health check.</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}