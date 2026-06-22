import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout, isAuthenticated } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav className="bg-emerald-950 text-white shadow-md sticky top-0 z-50 antialiased">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Brand Identity */}
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-700 p-2 rounded-xl text-white font-black tracking-wider text-sm shadow-inner">
                        DAILY MILK
                        </div>
                        <span className="font-bold text-lg hidden sm:block tracking-wide text-emerald-50">
                            Milk Cooperative Management System
                        </span>
                    </div>

                    {/* Desktop Menu Items */}
                    <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
                        {isAuthenticated ? (
                            <>
                                <span className="bg-emerald-900 px-3 py-1.5 rounded-lg border border-emerald-800 text-xs text-emerald-200">
                                    User: <strong className="text-white">{user.identifier}</strong> ({user.role})
                                </span>
                                <button 
                                    onClick={logout}
                                    className="bg-rose-600 hover:bg-rose-700 px-4 py-2 rounded-xl font-semibold shadow transition-all active:scale-95"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <span className="text-emerald-300 text-xs tracking-wide uppercase font-bold">
                                Secure Access
                            </span>
                        )}
                    </div>

                    {/* Mobile Menu Button Container */}
                    <div className="md:hidden">
                        <button 
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-lg text-emerald-200 hover:text-white focus:outline-none"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Dropdown Panel Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-emerald-900 border-t border-emerald-800 px-4 pt-2 pb-4 space-y-2 animate-fade-in text-sm">
                    {isAuthenticated ? (
                        <div className="flex flex-col gap-3">
                            <div className="text-emerald-200 text-xs">
                                Logged in as: <span className="text-white font-bold">{user.identifier}</span>
                            </div>
                            <button 
                                onClick={() => { logout(); setMobileMenuOpen(false); }}
                                className="w-full bg-rose-600 hover:bg-rose-700 text-center font-bold py-2 rounded-xl shadow"
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <div className="text-center text-xs text-emerald-300 py-2">
                            Please authenticate to use dashboard services.
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
}