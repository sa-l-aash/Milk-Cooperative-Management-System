import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// 💡 IMPORT THE NEW COMMAND CENTER
import CoopOverview from './CoopOverview'; 

export default function ManagerDashboard() {
    const { user } = useAuth(); 
    const navigate = useNavigate();
    const location = useLocation();
    
    // UI & Navigation State
    const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'overview');
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    // Dynamic Station Pricing State
    const [currentRate, setCurrentRate] = useState(0.00);
    const [newRateInput, setNewRateInput] = useState('');

    // Form State: Collection
    const [farmerNumberInput, setFarmerNumberInput] = useState('');
    const [quantity, setQuantity] = useState('');
    const [sessionType, setSessionType] = useState('MORNING');

    // 💡 NEW Form State: Verification & Deduction
    const [verifyFarmerNo, setVerifyFarmerNo] = useState('');
    const [verifyBadLiters, setVerifyBadLiters] = useState('');
    const [coopCollections, setCoopCollections] = useState([]);

    // Form State: Onboarding
    const [farmerNumber, setFarmerNumber] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('+254');
    const [farmerPassword, setFarmerPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Directory Management States
    const [farmersList, setFarmersList] = useState([]);
    const [searchQuery, setSearchQuery] = useState(''); 
    const [editingFarmerId, setEditingFarmerId] = useState(null);
    const [editFormData, setEditFormData] = useState({ fullName: '', phoneNumber: '' });

    // Reports & Statements State
    const [statements, setStatements] = useState([]);
    const [coopStatements, setCoopStatements] = useState([]); 
    const [loadingStatements, setLoadingStatements] = useState(false);
    const [hasUnreadStatement, setHasUnreadStatement] = useState(true);

    // ==================== STRICT ROLE & SECURITY GUARD ====================
    useEffect(() => {
        if (!user) {
            navigate('/', { replace: true });
        } else if (user.role === 'ADMIN') {
            navigate('/admin-dashboard', { replace: true }); 
        } else if (user.role === 'FARMER') {
            navigate('/farmer-dashboard', { replace: true }); 
        }
    }, [user, navigate]);
    // ======================================================================

    // Fetch active cooperative base rate
    const fetchStationPricing = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/v1/managers/cooperative/rate?managerUsername=${user.identifier}`, {
                headers: { 'Authorization': `Bearer ${user.token}` } 
            });
            if (response.ok) {
                const data = await response.json();
                setCurrentRate(parseFloat(data.baseRatePerLiter));
            }
        } catch (error) {
            console.error("Failed to sync current station operational metrics.", error);
        }
    };

    // Pull all farmers under this manager's cooperative branch
    const fetchCoopFarmers = async () => {
        const trueManagerUsername = localStorage.getItem("username") || user?.username || user?.identifier;
        if (!trueManagerUsername) return;
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8080/api/v1/managers/farmers/list?managerUsername=${encodeURIComponent(trueManagerUsername)}`, {
                headers: { 'Authorization': `Bearer ${user.token}` } 
            });
            if (response.ok) {
                const data = await response.json();
                setFarmersList(data);
            }
        } catch (error) {
            console.error("Directory context sync failure.", error);
        } finally {
            setLoading(false);
        }
    };

    // FETCH & GROUP STATEMENTS BY MONTH
    useEffect(() => {
        if (activeTab === 'reports') {
            const fetchManagerStatements = async () => {
                setLoadingStatements(true);
                try {
                    const response = await fetch(`http://localhost:8080/api/v1/statements/manager/${user.identifier}`);
                    if (response.ok) {
                        const data = await response.json();
                        setStatements(data);

                        // Automatically group individual statements into Master Monthly Records
                        const grouped = data.reduce((acc, stmt) => {
                            if (!acc[stmt.statementMonth]) {
                                acc[stmt.statementMonth] = {
                                    month: stmt.statementMonth,
                                    totalVolume: 0,
                                    totalPayout: 0,
                                    farmerRecords: []
                                };
                            }

                            // Look up the farmer's real name from the Directory state
                            const farmerObj = farmersList.find(f => f.farmerNumber === stmt.farmerNumber);
                            const farmerName = farmerObj ? farmerObj.fullName : 'Unknown Farmer';

                            acc[stmt.statementMonth].totalVolume += stmt.totalVolumeLiters;
                            acc[stmt.statementMonth].totalPayout += stmt.totalPayoutKsh;
                            acc[stmt.statementMonth].farmerRecords.push({
                                farmerNumber: stmt.farmerNumber,
                                farmerName: farmerName,
                                volume: stmt.totalVolumeLiters,
                                payout: stmt.totalPayoutKsh
                            });

                            return acc;
                        }, {});

                        setCoopStatements(Object.values(grouped));
                    }
                } catch (err) {
                    console.error("Failed to fetch statements:", err);
                } finally {
                    setLoadingStatements(false);
                }
            };
            fetchManagerStatements();
        }
    }, [activeTab, user.identifier, farmersList]);

// 💡 FETCH COLLECTIONS FOR VERIFICATION TAB
    useEffect(() => {
        if (activeTab === 'verification') {
            const fetchCollections = async () => {
                try {
                    const response = await fetch(`http://localhost:8080/api/v1/collections/manager/${user.identifier}`);
                    if (response.ok) setCoopCollections(await response.json());
                } catch (error) { console.error("Failed to fetch collections for verification."); }
            };
            fetchCollections();
        }
    }, [activeTab, user.identifier, statusMessage]);

   // 💡 DERIVED VERIFICATION STATE (Auto-populates UI based on Farmer Number)
    const cleanSearch = verifyFarmerNo.trim().toLowerCase();

    const targetFarmer = farmersList.find(f => 
        f.farmerNumber && String(f.farmerNumber).toLowerCase() === cleanSearch
    );

    const targetDelivery = coopCollections
        .filter(c => {
            // Safely grab the farmer number whether Spring Boot nested it or not
            const fNo = c.farmerNumber || (c.farmer && c.farmer.farmerNumber);
            return fNo && String(fNo).toLowerCase() === cleanSearch;
        })
        .sort((a, b) => new Date(b.deliveryDate) - new Date(a.deliveryDate))[0];

    // THE MASTER COOPERATIVE PDF GENERATOR
    const downloadCoopPDF = (monthGroup) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`${user.cooperativeName} - Master Ledger`, 14, 20);
        doc.setFontSize(11);
        doc.text(`Authorized Manager: ${user.identifier}`, 14, 30);
        doc.text(`For the month of: ${monthGroup.month}`, 14, 37);

        // Map a row for every single farmer in the cooperative
        const tableRows = monthGroup.farmerRecords.map(r => [
            r.farmerNumber,
            r.farmerName,
            r.volume.toFixed(2),
            r.payout.toLocaleString()
        ]);

        // Add the Cooperative Grand Total at the bottom
        tableRows.push([
            { content: 'COOPERATIVE GRAND TOTAL', colSpan: 2, styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] } },
            { content: `${monthGroup.totalVolume.toFixed(2)} L`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
            { content: `KES ${monthGroup.totalPayout.toLocaleString()}`, styles: { fontStyle: 'bold', textColor: [4, 120, 87], fillColor: [241, 245, 249] } }
        ]);

        autoTable(doc, {
            startY: 45,
            head: [['Farmer ID', 'Farmer Name', 'Volume (Liters)', 'Payout (KES)']],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42] },
            styles: { fontSize: 9 }
        });

        doc.save(`Coop_Ledger_${monthGroup.month}.pdf`);
    };

    // Filter Logic for Directory
    const filteredFarmers = farmersList.filter((farmer) => {
        const query = searchQuery.toLowerCase();
        const matchNumber = (farmer.farmerNumber || "").toLowerCase().includes(query);
        const matchName = (farmer.fullName || "").toLowerCase().includes(query);
        const matchPhone = (farmer.phoneNumber || "").toLowerCase().includes(query);
        return matchNumber || matchName || matchPhone;
    });

    // HANDLERS
    const handleUpdateRate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatusMessage({ type: '', text: '' });
        try {
            const response = await fetch('http://localhost:8080/api/v1/managers/cooperative/rate', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ managerUsername: user.identifier, newRate: parseFloat(newRateInput) })
            });
            const text = await response.text();
            if (response.ok) {
                setStatusMessage({ type: 'success', text: 'Operational purchasing rate updated successfully!' });
                setCurrentRate(parseFloat(newRateInput));
                setNewRateInput('');
            } else { setStatusMessage({ type: 'error', text }); }
        } catch { setStatusMessage({ type: 'error', text: 'Failed to broadcast new rate matrix.' }); } 
        finally { setLoading(false); }
    };

    const handleRecordCollection = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatusMessage({ type: '', text: '' });
        try {
            const response = await fetch('http://localhost:8080/api/v1/collections/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ farmerNumber: farmerNumberInput, quantityLiters: parseFloat(quantity), sessionType, recordedByUserId: user.userId })
            });
            const text = await response.text();
            if (response.ok) {
                setStatusMessage({ type: 'success', text: text });
                setFarmerNumberInput(''); setQuantity('');
            } else { setStatusMessage({ type: 'error', text }); }
        } catch { setStatusMessage({ type: 'error', text: 'Backend link error.' }); }
        finally { setLoading(false); }
    };

    // 💡 NEW: Lab Deduction Submission Handler
    const handleVerifySubmit = async (e) => {
        e.preventDefault();
        if (!targetDelivery) return setStatusMessage({ type: 'error', text: 'No recent delivery found for this farmer to deduct from.' });
        
        const deductVal = parseFloat(verifyBadLiters);
        if (deductVal > targetDelivery.quantityLiters) {
            return setStatusMessage({ type: 'error', text: `Cannot deduct ${deductVal}L. Farmer only delivered ${targetDelivery.quantityLiters.toFixed(2)}L.` });
        }

        setLoading(true);
        setStatusMessage({ type: '', text: '' });

        try {
            const response = await fetch(`http://localhost:8080/api/v1/collections/deduct/${targetDelivery.deliveryId}?badLiters=${deductVal}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const text = await response.text();
            if (response.ok) {
                setStatusMessage({ type: 'success', text });
                setVerifyFarmerNo(''); setVerifyBadLiters('');
            } else { setStatusMessage({ type: 'error', text }); }
        } catch { setStatusMessage({ type: 'error', text: 'Network error during lab adjustment.' }); } 
        finally { setLoading(false); }
    };

    const handleOnboardFarmer = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatusMessage({ type: '', text: '' });
        try {
            const response = await fetch('http://localhost:8080/api/v1/managers/farmers/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ farmerNumber, fullName, phoneNumber, password: farmerPassword, managerUsername: user.identifier })
            });
            const text = await response.text();
            if (response.ok) {
                setStatusMessage({ type: 'success', text: text });
                setFarmerNumber(''); setFullName(''); setPhoneNumber('+254'); setFarmerPassword('');
            } else { setStatusMessage({ type: 'error', text }); }
        } catch { setStatusMessage({ type: 'error', text: 'Registration network delivery failure.' }); }
        finally { setLoading(false); }
    };

    const handleEditClick = (farmer) => {
        setEditingFarmerId(farmer.farmerNumber);
        setEditFormData({ fullName: farmer.fullName || '', phoneNumber: farmer.phoneNumber || '' });
    };

    const handleSaveFarmerEdit = async (farmerNumber) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8080/api/v1/managers/farmers/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ farmerNumber: farmerNumber, fullName: editFormData.fullName, phoneNumber: editFormData.phoneNumber, managerUsername: user.identifier })
            });
            const text = await response.text();
            if (response.ok) {
                setStatusMessage({ type: 'success', text: 'Farmer records modified successfully.' });
                setEditingFarmerId(null);
                fetchCoopFarmers(); 
            } else { setStatusMessage({ type: 'error', text }); }
        } catch { setStatusMessage({ type: 'error', text: 'Failed to update farmer record.' }); } 
        finally { setLoading(false); }
    };

    const handleDeleteFarmer = async (fNo) => {
        if (!window.confirm(`Are you absolutely sure you want to remove Farmer #${fNo}?`)) return;
        const trueManagerUsername = localStorage.getItem("username") || user?.username || user?.identifier;
        if (!trueManagerUsername) return;
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8080/api/v1/managers/farmers/${fNo}?managerUsername=${encodeURIComponent(trueManagerUsername)}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const text = await response.text();
            if (response.ok) {
                setStatusMessage({ type: 'success', text: text || 'Farmer removed cleanly.' });
                fetchCoopFarmers();
            } else { setStatusMessage({ type: 'error', text }); }
        } catch { setStatusMessage({ type: 'error', text: 'Network exception during entity drop execution loops.' }); } 
        finally { setLoading(false); }
    };

    const handleGenerateReport = async () => {
        if (!window.confirm("Generate draft reports for the current month? This will overwrite any existing drafts for this month.")) return;
        setLoading(true);
        setStatusMessage({ type: '', text: '' });
        try {
            const response = await fetch(`http://localhost:8080/api/v1/managers/reports/generate-draft?managerUsername=${user.identifier}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const text = await response.text();
            if (response.ok) setStatusMessage({ type: 'success', text: text });
            else setStatusMessage({ type: 'error', text });
        } catch { setStatusMessage({ type: 'error', text: 'Network exception. Failed to contact the report engine.' }); } 
        finally { setLoading(false); }
    };

    // Initialization UseEffects
    useEffect(() => { if (user?.identifier) fetchStationPricing(); }, [user]);
    useEffect(() => { 
        if (activeTab === 'directory') {
            fetchCoopFarmers();
            setSearchQuery(''); 
        }
    }, [activeTab]);

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs font-semibold text-slate-500">Redirecting secure session context...</div>;
    }

   return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-fade-in antialiased">

            {/* Header Display Panel */}
            <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shadow-sm">
                            Cooperative: {user.cooperativeName}
                        </span>
                        {user.subCounty && user.county && (
                            <span className="text-[11px] sm:text-xs text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                <span className="font-semibold text-slate-800">{user.subCounty} Sub-County, {user.county} County</span>
                            </span>
                        )}
                    </div>

                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                        Cooperative Control Center
                    </h1>
                    <p className="text-slate-500 text-xs mt-0.5">
                        Logged In Manager: <strong className="text-slate-800 font-semibold">{user.identifier}</strong>
                    </p>
                </div>

                {/* The Action Area (Tabs Only) */}
                <div className="flex flex-col sm:flex-row items-center gap-3 self-start md:self-center w-full md:w-auto">
                    
                    <div className="bg-slate-200/70 p-1 rounded-xl flex flex-row flex-wrap gap-1 overflow-hidden w-full sm:w-auto">
                        <button onClick={() => { setActiveTab('overview'); setStatusMessage({ type: '', text: '' }); }} className={`flex-1 sm:flex-initial text-center px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Overview</button>
                        <button onClick={() => { setActiveTab('collection'); setStatusMessage({ type: '', text: '' }); }} className={`flex-1 sm:flex-initial text-center px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'collection' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Daily Milk</button>
                        <button onClick={() => { setActiveTab('verification'); setStatusMessage({ type: '', text: '' }); }} className={`flex-1 sm:flex-initial text-center px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'verification' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Verification</button>
                        <button onClick={() => { setActiveTab('onboarding'); setStatusMessage({ type: '', text: '' }); }} className={`flex-1 sm:flex-initial text-center px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'onboarding' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Onboard</button>
                        <button onClick={() => { setActiveTab('directory'); setStatusMessage({ type: '', text: '' }); }} className={`flex-1 sm:flex-initial text-center px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'directory' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Directory</button>
                        <button onClick={() => { setActiveTab('reports'); setStatusMessage({ type: '', text: '' }); }} className={`flex-1 sm:flex-initial text-center px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'reports' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Reports</button>
                    </div> 

                </div>
            </div>

            {statusMessage.text && (
                <div className={`p-3.5 border text-xs font-semibold rounded-xl animate-shake flex items-center gap-2 ${statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusMessage.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    <span className="break-words">{statusMessage.text}</span>
                </div>
            )}

            {/* TAB RENDERING LOGIC */}
            {activeTab === 'overview' && <CoopOverview />}

            {/* 💡 PERFECTED REPORTS TAB */}
            {activeTab === 'reports' && (
                <div className="space-y-6 animate-fade-in w-full">
                    {/* Centered Title */}
                    <div className="text-center w-full space-y-2 mt-4 mb-8">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Cooperative Master Ledgers</h2>
                        <p className="text-slate-500 text-xs sm:text-sm font-medium">Unified monthly reports aggregating all farmer contributions.</p>
                    </div>
                    
                    {loadingStatements ? (
                        <div className="text-center p-8 text-xs text-slate-400">Compiling cooperative ledgers...</div>
                    ) : coopStatements.length === 0 ? (
                        <div className="text-center p-8 border border-slate-200 border-dashed rounded-xl text-xs text-slate-400">No master ledgers generated yet.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {coopStatements.map((group, idx) => (
                                <div key={idx} className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 shrink-0 rounded-xl flex items-center justify-center font-black text-sm bg-emerald-100 text-emerald-700">
                                                {group.month.split('-')[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-sm">{group.month}</h3>
                                                <p className="text-[11px] text-slate-500 font-medium">{group.farmerRecords.length} Active Farmers</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => downloadCoopPDF(group)} 
                                            className="bg-slate-900 hover:bg-slate-800 text-white p-2.5 rounded-lg transition shadow-sm flex items-center justify-center"
                                            title="Download Master Ledger PDF"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                            </svg>
                                        </button>
                                    </div>
                                    
                                    <div className="bg-slate-50 rounded-lg p-3 text-xs flex justify-between items-center border border-slate-100 mt-2">
                                        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Net Dispense</span>
                                        <span className="font-black text-emerald-700">KES {group.totalPayout.toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Render legacy forms (Collection, Onboarding, Directory) */}
            {activeTab !== 'overview' && activeTab !== 'reports' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-4 sm:p-6 shadow-sm lg:col-span-2 order-2 lg:order-1">
                        
                        {/* Collection Tab */}
                        {activeTab === 'collection' && (
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-2">
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900">Record Weight Intake</h2>
                                        <p className="text-slate-400 text-xs mt-0.5">Log current daily milk collections.</p>
                                    </div>
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left sm:text-right shrink-0 w-full sm:w-auto">
                                        <span className="block text-[10px] uppercase tracking-wider font-bold text-amber-700">Buying Rate</span>
                                        <strong className="text-base font-black text-amber-900">KSH {currentRate.toFixed(2)}/L</strong>
                                    </div>
                                </div>

                                <form onSubmit={handleRecordCollection} className="space-y-4 pt-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Farmer Number</label>
                                            <input type="text" value={farmerNumberInput} onChange={(e) => setFarmerNumberInput(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none" placeholder="e.g., 0001" required />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Quantity (Liters)</label>
                                            <input type="number" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none" placeholder="e.g., 12.50" required />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Delivery Shift</label>
                                        <select value={sessionType} onChange={(e) => setSessionType(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none">
                                            <option value="MORNING">Morning Shift </option>
                                            <option value="AFTERNOON">Afternoon Shift </option>
                                        </select>
                                    </div>

                                    {quantity && (
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs flex flex-col sm:flex-row justify-between text-slate-600 font-semibold gap-1 animate-fade-in">
                                            <span>Payout Calculation:</span>
                                            <span className="text-slate-900 font-bold break-all">{quantity} L × KSH {currentRate.toFixed(2)} = KSH {(parseFloat(quantity) * currentRate).toFixed(2)}</span>
                                        </div>
                                    )}

                                    <button type="submit" disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 rounded-xl transition text-xs shadow-sm">
                                        {loading ? "Processing Dispatch..." : "Submit"}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* 💡 THE NEW VERIFICATION TAB */}
                        {activeTab === 'verification' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex flex-col border-b border-slate-50 pb-2">
                                    <h2 className="text-base font-bold text-slate-900">Lab Result Verification</h2>
                                    <p className="text-slate-400 text-xs mt-0.5">Deduct volumes that failed advanced testing.</p>
                                </div>
                                <form onSubmit={handleVerifySubmit} className="space-y-4 pt-2">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Farmer Number</label>
                                        <input type="text" value={verifyFarmerNo} onChange={(e) => setVerifyFarmerNo(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="e.g., 0001" required />
                                    </div>
                                    
                                    {/* Auto-filled Info Panel */}
                                    {verifyFarmerNo.length > 0 && (
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="font-bold text-slate-500">Farmer Name:</span>
                                                <span className="font-black text-slate-900">
                                                    {/* 💡 SMART FALLBACK: Tries the directory first, then checks inside the delivery object! */}
                                                    {targetFarmer?.fullName || targetDelivery?.farmer?.fullName || targetDelivery?.fullName || "User not found"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="font-bold text-slate-500">Latest Delivery:</span>
                                                <span className={`font-black ${targetDelivery ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                    {targetDelivery ? `${targetDelivery.quantityLiters.toFixed(2)} L (${targetDelivery.sessionType})` : "No recent deliveries"}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Bad Quantity to Deduct (Liters)</label>
                                        <input type="number" step="0.01" value={verifyBadLiters} onChange={(e) => setVerifyBadLiters(e.target.value)} disabled={!targetDelivery} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none disabled:opacity-50" placeholder="e.g., 2.50" required />
                                    </div>

                                    <button type="submit" disabled={loading || !targetDelivery} className="w-full bg-emerald-600 hover:bg-amber-700 text-white font-semibold py-2.5 rounded-xl transition text-xs shadow-sm disabled:opacity-50">
                                        {loading ? "Processing..." : "Deduct & Recalculate"}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Onboarding Tab */}
                        {activeTab === 'onboarding' && (
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">Farmer Onboarding</h2>
                                    <p className="text-slate-400 text-xs mt-0.5">Register a farmer in : <span className="font-semibold text-slate-700">{user.cooperativeName}</span>.</p>
                                </div>
                                <form onSubmit={handleOnboardFarmer} className="space-y-4 pt-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Farmer Number</label>
                                            <input type="text" value={farmerNumber} onChange={(e) => setFarmerNumber(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none" placeholder="e.g., 0001" required />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Full Name</label>
                                            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none" placeholder="Charles Njoroge" required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Phone Number</label>
                                            <input
                                                type="tel"
                                                value={phoneNumber}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val.startsWith('+254')) setPhoneNumber(val);
                                                    else if (val.length < 4) setPhoneNumber('+254');
                                                }}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Password</label>
                                            <div className="relative">
                                                <input 
                                                    type={showPassword ? "text" : "password"} 
                                                    value={farmerPassword} 
                                                    onChange={(e) => setFarmerPassword(e.target.value)} 
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none pr-10" 
                                                    required 
                                                />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                                                    {showPassword ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z" /></svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 rounded-xl transition text-xs mt-2 disabled:bg-slate-200 disabled:text-slate-400 shadow-sm">
                                        {loading ? "Registering Node..." : "Submit"}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Directory Tab */}
                        {activeTab === 'directory' && (
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900">Farmer List</h2>
                                        <p className="text-slate-400 text-xs mt-0.5">Review and manage all registered farmers assigned to this cooperative.</p>
                                    </div>
                                    
                                    <div className="relative w-full sm:w-64">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search ID, name, phone..."
                                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition-all text-slate-700 font-medium"
                                        />
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="w-full overflow-x-auto border border-slate-200/60 rounded-xl block max-w-full">
                                    <table className="w-full min-w-[500px] text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider text-[10px]">
                                                <th className="p-3 whitespace-nowrap">ID Code</th>
                                                <th className="p-3 whitespace-nowrap">Full Name</th>
                                                <th className="p-3 whitespace-nowrap">Phone Number</th>
                                                <th className="p-3 text-right whitespace-nowrap">Administrative Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                            {farmersList.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="text-center p-6 text-slate-400">No registered farmers assigned to this cooperative.</td>
                                                </tr>
                                            ) : filteredFarmers.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="text-center p-6 text-slate-400">No farmers match your search criteria.</td>
                                                </tr>
                                            ) : (
                                                filteredFarmers.map((farmer) => (
                                                    <tr key={farmer.farmerNumber} className="hover:bg-slate-50/60 transition">
                                                        <td className="p-3 font-mono font-bold text-slate-900">{farmer.farmerNumber}</td>
                                                        
                                                        {/* INLINE EDITING LOGIC */}
                                                        {editingFarmerId === farmer.farmerNumber ? (
                                                            <>
                                                                <td className="p-2">
                                                                    <input 
                                                                        type="text" 
                                                                        value={editFormData.fullName} 
                                                                        onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })} 
                                                                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none" 
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    <input 
                                                                        type="tel" 
                                                                        value={editFormData.phoneNumber} 
                                                                        onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })} 
                                                                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none" 
                                                                    />
                                                                </td>
                                                                <td className="p-3 text-right whitespace-nowrap">
                                                                    <div className="flex justify-end gap-2">
                                                                        <button onClick={() => handleSaveFarmerEdit(farmer.farmerNumber)} disabled={loading} className="text-emerald-600 hover:text-emerald-800 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-lg transition">Save</button>
                                                                        <button onClick={() => setEditingFarmerId(null)} className="text-slate-500 hover:text-slate-700 font-bold text-xs bg-slate-100 px-3 py-1.5 rounded-lg transition">Cancel</button>
                                                                    </div>
                                                                </td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className="p-3 text-slate-900 font-bold">{farmer.fullName}</td>
                                                                <td className="p-3 text-slate-500 font-mono">{farmer.phoneNumber}</td>
                                                                <td className="p-3 text-right space-x-2 whitespace-nowrap">
                                                                    
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleEditClick(farmer)}
                                                                        className="text-emerald-700 hover:text-emerald-900 hover:underline text-xs font-bold inline-block"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <span className="text-slate-200">|</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteFarmer(farmer.farmerNumber)}
                                                                        className="text-rose-600 hover:text-rose-800 hover:underline text-xs font-bold inline-block"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar Column */}
                    <div className="space-y-6 lg:col-span-1 order-1 lg:order-2">
                        {activeTab === 'collection' && (
                            <form onSubmit={handleUpdateRate} className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm animate-fade-in">
                                <div>
                                    <h3 className="text-sm font-bold text-white tracking-tight">Adjust Buying Rate</h3>
                                    <p className="text-slate-400 text-[11px] leading-relaxed mt-0.5">
                                        Modify your station's current purchasing price structure per liter. Changes update farmer views instantly.
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">New Buying Price (KSH / Liter)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newRateInput}
                                        onChange={(e) => setNewRateInput(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        placeholder={`Current: KSH ${currentRate.toFixed(2)}`}
                                        required
                                    />
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition disabled:bg-slate-800 disabled:text-slate-500 shadow-sm">
                                    Broadcast New Buying Rate
                                </button>
                            </form>
                        )}

                        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm hidden lg:block">
                            <h3 className="text-xs font-bold text-slate-900 tracking-tight">Operational Bounds</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Onboarding details are auto-assigned to your cooperative. Active rate indices govern current transaction weights to prevent compliance friction.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}