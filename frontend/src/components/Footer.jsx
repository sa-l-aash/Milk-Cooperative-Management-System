import React from 'react';

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-xs mt-auto antialiased">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-center font-medium">
                    &copy; 2026 <span className="text-slate-200">Milk Cooperative Management System</span>. All Rights Reserved.
                    
                </div>
                <div className="flex gap-4 text-slate-500 font-semibold uppercase tracking-wider">
                    <span>Secured Access</span>
                   
                </div>
            </div>
        </footer>
    );
}