import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ManagerDashboard() {
    const { user } = useAuth(); 

    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('collection');
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    // Dynamic Station Pricing State
    const [currentRate, setCurrentRate] = useState(0.00);
    const [newRateInput, setNewRateInput] = useState('');

    // Form State: Collection
    const [farmerNumberInput, setFarmerNumberInput] = useState('');
    const [quantity, setQuantity] = useState('');
    const [sessionType, setSessionType] = useState('MORNING');

    // Form State: Onboarding
    const [farmerNumber, setFarmerNumber] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('+254');
    const [farmerPassword, setFarmerPassword] = useState('');

    // Directory Management States
    const [farmersList, setFarmersList] = useState([]);
    const [editingFarmer, setEditingFarmer] = useState(null);
    const [updatedPhone, setUpdatedPhone] = useState('');

    // State to handle password visibility toggle for onboarding form
    const [showPassword, setShowPassword] = useState(false);

    // ==================== SECURITY LOGOUT GUARD ====================
    useEffect(() => {
        if (!user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);
    // ===============================================================

    // Fetch active cooperative base rate on layout mount
    const fetchStationPricing = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/v1/managers/cooperative/rate?managerUsername=${user.identifier}`, {
                headers: { 'Authorization': `Bearer ${user.token}` } // 💡 VIP Badge Added
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
                headers: { 'Authorization': `Bearer ${user.token}` } // 💡 VIP Badge Added
            });
            if (response.ok) {
                const data = await response.json();
                setFarmersList(data);
            } else {
                console.error("Failed to load local branch user logs.");
            }
        } catch (error) {
            console.error("Directory context sync failure.", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.identifier) {
            fetchStationPricing();
        }
    }, [user]);

    useEffect(() => {
        if (activeTab === 'directory') {
            fetchCoopFarmers();
        }
    }, [activeTab]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs font-semibold text-slate-500">
                Redirecting secure session context...
            </div>
        );
    }

    const handleUpdateRate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatusMessage({ type: '', text: '' });

        try {
            const response = await fetch('http://localhost:8080/api/v1/managers/cooperative/rate', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}` // 💡 VIP Badge Added
                },
                body: JSON.stringify({
                    managerUsername: user.identifier,
                    newRate: parseFloat(newRateInput)
                })
            });
            const text = await response.text();
            if (response.ok) {
                setStatusMessage({ type: 'success', text: 'Operational purchasing rate updated successfully!' });
                setCurrentRate(parseFloat(newRateInput));
                setNewRateInput('');
            } else {
                setStatusMessage({ type: 'error', text });
            }
        } catch {
            setStatusMessage({ type: 'error', text: 'Failed to broadcast new rate matrix.' });
        } finally {
            setLoading(false);
        }
    };

    const handleRecordCollection = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatusMessage({ type: '', text: '' });

        try {
            const response = await fetch('http://localhost:8080/api/v1/collections/record', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}` // 💡 VIP Badge Added
                },
                body: JSON.stringify({
                    farmerNumber: farmerNumberInput,
                    quantityLiters: parseFloat(quantity),
                    sessionType,
                    recordedByUserId: user.userId
                })
            });
            const text = await response.text();
            if (response.ok) {
                setStatusMessage({ type: 'success', text: text });
                setFarmerNumberInput('');
                setQuantity('');
            } else { setStatusMessage({ type: 'error', text }); }
        } catch { setStatusMessage({ type: 'error', text: 'Backend link error.' }); }
        finally { setLoading(false); }
    };

    const handleOnboardFarmer = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatusMessage({ type: '', text: '' });

        try {
            const response = await fetch('http://localhost:8080/api/v1/managers/farmers/register', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}` // 💡 VIP Badge Added
                },
                body: JSON.stringify({
                    farmerNumber,
                    fullName,
                    phoneNumber,
                    password: farmerPassword,
                    managerUsername: user.identifier
                })
            });
            const text = await response.text();
            if (response.ok) {
                setStatusMessage({ type: 'success', text: text });
                setFarmerNumber(''); setFullName(''); setPhoneNumber('+254'); setFarmerPassword('');
            } else { setStatusMessage({ type: 'error', text }); }
        } catch { setStatusMessage({ type: 'error', text: 'Registration network delivery failure.' }); }
        finally { setLoading(false); }
    };

    const handleUpdateFarmerPhone = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8080/api/v1/managers/farmers/update-phone`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}` // 💡 VIP Badge Added
                },
                body: JSON.stringify({
                    farmerNumber: editingFarmer.farmerNumber,
                    phoneNumber: updatedPhone,
                    managerUsername: user.identifier
                })
            });
            const text = await response.text();
            if (response.ok) {
                setStatusMessage({ type: 'success', text: 'Farmer records modified successfully.' });
                setEditingFarmer(null);
                fetchCoopFarmers();
            } else {
                setStatusMessage({ type: 'error', text });
            }
        } catch {
            setStatusMessage({ type: 'error', text: 'Failed to update phone record.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFarmer = async (fNo) => {
        if (!window.confirm(`Are you absolutely sure you want to remove Farmer #${fNo} from this cooperative framework log registry permanently?`)) return;
        
        const trueManagerUsername = localStorage.getItem("username") || user?.username || user?.identifier;
        if (!trueManagerUsername) return;

        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8080/api/v1/managers/farmers/${fNo}?managerUsername=${encodeURIComponent(trueManagerUsername)}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.token}` // 💡 VIP Badge Added
                }
            });
            const text = await response.text();
            if (response.ok) {
                setStatusMessage({ type: 'success', text: text || 'Farmer removed cleanly.' });
                fetchCoopFarmers();
            } else {
                setStatusMessage({ type: 'error', text });
            }
        } catch {
            setStatusMessage({ type: 'error', text: 'Network exception during entity drop execution loops.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-fade-in antialiased">

            {/* Header Display Panel - Full Responsive Flex Stack */}
            <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                    {/* Unified Branch Identity Layout Group */}
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

                {/* Tab Switcher Navigation Section (Wraps beautifully on tiny screens) */}
                <div className="bg-slate-200/70 p-1 rounded-xl flex flex-row flex-wrap gap-1 self-start md:self-center w-full sm:w-auto overflow-hidden">
                    <button
                        onClick={() => { setActiveTab('collection'); setStatusMessage({ type: '', text: '' }); }}
                        className={`flex-1 sm:flex-initial text-center px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'collection' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Daily Milk Recording
                    </button>
                    <button
                        onClick={() => { setActiveTab('onboarding'); setStatusMessage({ type: '', text: '' }); }}
                        className={`flex-1 sm:flex-initial text-center px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'onboarding' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Farmer Onboarding
                    </button>
                    <button
                        onClick={() => { setActiveTab('directory'); setStatusMessage({ type: '', text: '' }); }}
                        className={`flex-1 sm:flex-initial text-center px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'directory' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Farmer List
                    </button>
                </div>
            </div>

            {statusMessage.text && (
                <div className={`p-3.5 border text-xs font-semibold rounded-xl animate-shake flex items-center gap-2 ${statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                    }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusMessage.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    <span className="break-words">{statusMessage.text}</span>
                </div>
            )}

            {/* Core Workspace Layout Section Grid Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">

                {/* Left Primary Form Component Container Box */}
                <div className="bg-white border border-slate-200/60 rounded-2xl p-4 sm:p-6 shadow-sm lg:col-span-2 order-2 lg:order-1">

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
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Delivery Shift </label>
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
                                                placeholder="" 
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
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 rounded-xl transition text-xs mt-2 disabled:bg-slate-200 disabled:text-slate-400 shadow-sm"
                                >
                                    {loading ? "Registering Node..." : "Submit"}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'directory' && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Farmer List</h2>
                                <p className="text-slate-400 text-xs mt-0.5">Review and manage all registered farmers assigned to this cooperative.</p>
                            </div>

                            {/* Inline Modal Edit Form Component Block */}
                            {editingFarmer && (
                                <form onSubmit={handleUpdateFarmerPhone} className="bg-slate-50 border border-slate-200 rounded-xl p-4 animate-fade-in space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide truncate pr-2">
                                            Modify Records: <span className="font-mono text-emerald-700">#{editingFarmer.farmerNumber}</span> - {editingFarmer.fullName}
                                        </span>
                                        <button type="button" onClick={() => setEditingFarmer(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold shrink-0">✕ Close</button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">New Mobile Phone Number</label>
                                            <input
                                                type="tel"
                                                value={updatedPhone}
                                                onChange={(e) => setUpdatedPhone(e.target.value)}
                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                                required
                                            />
                                        </div>
                                        <button type="submit" disabled={loading} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-4 rounded-lg text-xs transition w-full">
                                            Save Phone Number
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Table Scroll Axis Shell Container Wrapper */}
                            <div className="w-full overflow-x-auto border border-slate-200/60 rounded-xl block max-w-full">
                                <table className="w-full min-w-[500px] text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider text-[10px]">
                                            <th className="p-3 whitespace-nowrap">ID Code</th>
                                            <th className="p-3 whitespace-nowrap">Full  Name</th>
                                            <th className="p-3 whitespace-nowrap">Phone Number</th>
                                            <th className="p-3 text-right whitespace-nowrap">Administrative Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {farmersList.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="text-center p-6 text-slate-400">No registered farmers assigned to this cooperative.</td>
                                            </tr>
                                        ) : (
                                            farmersList.map((farmer) => (
                                                <tr key={farmer.farmerNumber} className="hover:bg-slate-50/60 transition">
                                                    <td className="p-3 font-mono font-bold text-slate-900">{farmer.farmerNumber}</td>
                                                    <td className="p-3 text-slate-900 font-bold">{farmer.fullName}</td>
                                                    <td className="p-3 text-slate-500 font-mono">{farmer.phoneNumber}</td>
                                                    <td className="p-3 text-right space-x-2 whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => { setEditingFarmer(farmer); setUpdatedPhone(farmer.phoneNumber); }}
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
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar Column - Rates & Operational Rules Context */}
                <div className="space-y-6 lg:col-span-1 order-1 lg:order-2">

                    {/* CONTEXT CONDITIONAL LOCK: Rate form ONLY pops up if 'Intake Desk' tab is selected */}
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
        </div>
    );
}