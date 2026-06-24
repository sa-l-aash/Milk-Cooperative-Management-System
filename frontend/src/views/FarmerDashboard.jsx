import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function FarmerDashboard() {
    const { user } = useAuth(); 
    const navigate = useNavigate();
    
    const [deliveries, setDeliveries] = useState([]);
    const [statements, setStatements] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [activeTab, setActiveTab] = useState('deliveries');
    const [hasUnreadStatement, setHasUnreadStatement] = useState(true);
    
    // 💡 NEW: Slideshow State Logic
    const [availableMonths, setAvailableMonths] = useState([]);
    const [currentMonthIndex, setCurrentMonthIndex] = useState(-1);

    const coopName = user?.cooperativeName || localStorage.getItem("coopName") || 'Assigned Station';
    const county = user?.county || localStorage.getItem("county") || '';
    const subCounty = user?.subCounty || localStorage.getItem("subCounty") || '';
    
    const fullName = user?.identifier || 'Registered Producer';
    const farmerNumber = localStorage.getItem("farmerNo") || '0002';

    useEffect(() => {
        if (!user) {
            navigate("/", { replace: true });
        } else if (user.role === 'ADMIN') {
            navigate('/admin-dashboard', { replace: true });
        } else if (user.role === 'MANAGER') {
            navigate('/manager-dashboard', { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const deliveryResponse = await fetch(`http://localhost:8080/api/v1/collections/farmer/${user.userId}`);
                if (!deliveryResponse.ok) throw new Error('Could not pull delivery history.');
                const deliveryData = await deliveryResponse.json();
                setDeliveries(deliveryData);

                // Extract all unique months from the data for the slideshow
                if (deliveryData.length > 0) {
                    const monthsSet = new Set(deliveryData.map(d => {
                        if (!d.deliveryDate) return null;
                        const date = new Date(d.deliveryDate);
                        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    }).filter(Boolean));
                    
                    const sortedMonths = Array.from(monthsSet).sort(); 
                    setAvailableMonths(sortedMonths);
                    setCurrentMonthIndex(sortedMonths.length - 1); // Jump to newest month
                }

                const stmtResponse = await fetch(`http://localhost:8080/api/v1/statements/farmer/${farmerNumber}`);
                if (stmtResponse.ok) {
                    const stmtData = await stmtResponse.json();
                    setStatements(stmtData);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user, farmerNumber]);

    // Handlers for switching tabs
    const handleOpenStatements = () => {
        setActiveTab('statements');
        setHasUnreadStatement(false); 
    };

    const handleOpenDeliveries = () => {
        setActiveTab('deliveries');
        if (availableMonths.length > 0) {
            setCurrentMonthIndex(availableMonths.length - 1); 
        }
    };

    // 💡 BULLETPROOF FORMATTERS
    const formatMonthYear = (monthStr) => {
        if (!monthStr) return 'Loading...'; // Safety net
        const [year, month] = monthStr.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    };

    const formatBeautifulDate = (dateStr) => {
        if (!dateStr) return '';
        const dateObj = new Date(dateStr);
        return dateObj.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    };

    // Safety fallback for current month string
    const currentMonthStr = availableMonths[currentMonthIndex] || '';
    
    // Filter deliveries to ONLY show the currently selected month
    const currentDeliveries = currentMonthStr 
        ? deliveries.filter(d => {
            if (!d.deliveryDate) return false;
            const date = new Date(d.deliveryDate);
            const formattedMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return formattedMonth === currentMonthStr;
          }).sort((a, b) => new Date(b.deliveryDate) - new Date(a.deliveryDate))
        : [];

    // PDF GENERATOR
    const downloadPDF = (stmt) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`${coopName} - Official Monthly Statement`, 14, 20);
        doc.setFontSize(11);
        doc.text(`Farmer: ${fullName} (ID: ${farmerNumber})`, 14, 30);
        doc.text(`Period: ${stmt.statementMonth}`, 14, 37);
        
        const getOrdinal = (n) => {
            if (n > 3 && n < 21) return n + 'th';
            switch (n % 10) {
                case 1:  return n + "st";
                case 2:  return n + "nd";
                case 3:  return n + "rd";
                default: return n + "th";
            }
        };

        const monthlyDeliveries = deliveries.filter(d => {
            if (!d.deliveryDate) return false;
            const parts = d.deliveryDate.split('-'); 
            const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
            const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
            const year = dateObj.getFullYear();
            return `${month}-${year}` === stmt.statementMonth;
        });

        const dailyMap = {};
        monthlyDeliveries.forEach(d => {
            const dateKey = d.deliveryDate;
            if (!dailyMap[dateKey]) {
                dailyMap[dateKey] = { originalDate: dateKey, morning: 0, evening: 0, totalLiters: 0, totalPayout: 0 };
            }
            const liters = parseFloat(d.quantityLiters) || 0;
            const payout = parseFloat(d.totalPayout) || 0;
            const session = (d.sessionType || '').toLowerCase().trim();

            if (session.includes('evening') || session.includes('pm') || session.includes('afternoon')) {
                dailyMap[dateKey].evening += liters;
            } else {
                dailyMap[dateKey].morning += liters;
            }
            dailyMap[dateKey].totalLiters += liters;
            dailyMap[dateKey].totalPayout += payout;
        });

        const sortedDays = Object.values(dailyMap).sort((a, b) => new Date(a.originalDate) - new Date(b.originalDate));

        const tableRows = sortedDays.map(day => {
            const parts = day.originalDate.split('-'); 
            const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
            const dayNum = dateObj.getDate();
            const weekday = dateObj.toLocaleString('en-US', { weekday: 'long' });
            const beautifulDate = `${getOrdinal(dayNum)} ${weekday}`; 

            return [
                beautifulDate,
                day.morning > 0 ? day.morning.toFixed(2) : '-',   
                day.evening > 0 ? day.evening.toFixed(2) : '-',   
                day.totalLiters.toFixed(2),
                day.totalPayout.toFixed(2)
            ];
        });

        if (tableRows.length === 0) {
            tableRows.push([{ content: 'Daily breakdown not available for this archived period.', colSpan: 5, styles: { fontStyle: 'italic', halign: 'center' } }]);
        }

        tableRows.push([
            { content: 'MONTHLY TOTALS', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] } },
            { content: `${stmt.totalVolumeLiters.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
            { content: `KES ${stmt.totalPayoutKsh.toLocaleString()}`, styles: { fontStyle: 'bold', textColor: [4, 120, 87], fillColor: [241, 245, 249] } }
        ]);

        autoTable(doc, {
            startY: 45,
            head: [['Date', 'Morning (L)', 'Evening (L)', 'Total (L)', 'Payout (KES)']],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42] },
            styles: { fontSize: 9 }
        });
        
        doc.save(`Statement_${stmt.statementMonth}.pdf`);
    };

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs font-semibold text-slate-500">Redirecting secure session...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-fade-in antialiased">
            
            {/* Header Card */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-4 sm:p-6 shadow-md relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
                <div className="relative z-10 space-y-4">
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
                    <div className="pt-1 space-y-2">
                        <div className="flex flex-wrap items-baseline gap-2 text-xl sm:text-2xl font-mono font-black tracking-tight text-emerald-300">
                            <span className="uppercase tracking-wide text-xs sm:text-sm text-emerald-200/60 shrink-0 font-sans font-bold">Farmer Number : </span>
                            <span>{farmerNumber}</span>
                        </div>
                        <div className="flex flex-wrap items-baseline gap-2 text-xl sm:text-2xl font-mono font-black tracking-tight text-emerald-300">
                            <span className="uppercase tracking-wide text-xs sm:text-sm text-emerald-200/60 shrink-0 font-sans font-bold">Farmer Name : </span>
                            <span className="tracking-wide">{fullName}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Controls */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="bg-slate-200/70 p-1 rounded-xl flex gap-1">
                    <button onClick={handleOpenDeliveries} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'deliveries' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Daily Deliveries</button>
                    <button onClick={handleOpenStatements} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'statements' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Monthly Statements</button>
                </div>
                <button onClick={handleOpenStatements} className="relative p-2 rounded-full hover:bg-slate-100 transition text-slate-400 hover:text-slate-700 focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
                    {hasUnreadStatement && (
                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border-2 border-white"></span>
                        </span>
                    )}
                </button>
            </div>
            
            {/* TAB 1: Live Deliveries Ledger (WITH MONTH SLIDESHOW) */}
            {activeTab === 'deliveries' && (
                <div className="space-y-4 animate-fade-in">
                    
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Delivery Receipts</h2>
                            <p className="text-[10px] text-slate-400 mt-0.5">Showing newest records first.</p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                            {deliveries.length} Total
                        </span>
                    </div>

                    {/* THE NEW EMERALD SLIDESHOW BAR */}
                    {availableMonths.length > 0 && (
                        <div className="bg-emerald-600 text-white rounded-xl flex items-center justify-between p-2 sm:p-3 shadow-sm w-full">
                            <button 
                                onClick={() => setCurrentMonthIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentMonthIndex <= 0}
                                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${currentMonthIndex <= 0 ? 'opacity-0 cursor-default pointer-events-none' : 'hover:bg-emerald-700 active:bg-emerald-800'}`}
                                aria-label="Previous Month"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                            
                            <span className="font-black tracking-widest text-xs sm:text-sm uppercase drop-shadow-sm">
                                {formatMonthYear(currentMonthStr)}
                            </span>
                            
                            <button 
                                onClick={() => setCurrentMonthIndex(prev => Math.min(availableMonths.length - 1, prev + 1))}
                                disabled={currentMonthIndex >= availableMonths.length - 1}
                                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${currentMonthIndex >= availableMonths.length - 1 ? 'opacity-0 cursor-default pointer-events-none' : 'hover:bg-emerald-700 active:bg-emerald-800'}`}
                                aria-label="Next Month"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {loading && <div className="text-center text-xs text-slate-400 py-6">Querying cluster database matrices...</div>}
                    {error && <div className="text-center text-xs text-rose-600 bg-rose-50 border border-rose-100 p-4 rounded-xl font-medium">{error}</div>}
                    
                    {!loading && !error && deliveries.length === 0 && (
                        <div className="text-center text-xs text-slate-400 bg-white border border-slate-200/60 p-8 rounded-xl shadow-sm">
                            No collection entry points found.
                        </div>
                    )}
                    
                    {/* Render Only the Selected Month's Items */}
                    <div className="space-y-3">
                        {currentDeliveries.length === 0 && availableMonths.length > 0 && (
                            <div className="text-center text-xs text-slate-400 py-4 italic">No deliveries recorded for this month.</div>
                        )}
                        {currentDeliveries.map((d) => (
                            <div key={d.deliveryId} className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition hover:border-slate-300">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-slate-900">{d.quantityLiters.toFixed(2)} Liters</span>
                                        <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                                            {d.sessionType || 'Standard'}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-medium">
                                        {formatBeautifulDate(d.deliveryDate)}
                                    </div>
                                </div>
                                <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                                    <div className="text-sm font-black text-emerald-700">KES {d.totalPayout.toFixed(2)}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">@ KES {d.pricePerLiter.toFixed(2)}/L</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 2: Live Monthly Financial Statements */}
            {activeTab === 'statements' && (
                <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Monthly Payout Statements</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Official financial records generated by your cooperative manager.</p>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {statements.length === 0 && !loading && <div className="p-8 text-center text-sm text-slate-400">No official statements have been generated for your account yet.</div>}
                        
                        {statements.map((stmt, idx) => (
                            <div key={stmt.id} className="p-4 sm:p-6 hover:bg-slate-50/50 transition flex items-center justify-between gap-2 border-b border-slate-100 last:border-0">
                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                    <div className={`h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm ${idx === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {stmt.statementMonth.split('-')[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{stmt.statementMonth}</h3>
                                        <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5 truncate hidden sm:block">
                                            Generated on {stmt.generatedAt ? stmt.generatedAt.split('T')[0] : 'Recently'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden sm:block">Net Payout</p>
                                        <p className="font-black text-emerald-700 text-sm sm:text-base mt-0.5">KES {stmt.totalPayoutKsh.toLocaleString()}</p>
                                        <p className="text-[10px] font-medium text-slate-500 sm:hidden mt-0.5">{stmt.totalVolumeLiters.toFixed(0)} L</p>
                                    </div>
                                    
                                    <button 
                                        onClick={() => downloadPDF(stmt)} 
                                        className="shrink-0 bg-slate-900 hover:bg-slate-800 text-white p-2.5 rounded-lg transition shadow-sm flex items-center justify-center" 
                                        title="Download PDF"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}