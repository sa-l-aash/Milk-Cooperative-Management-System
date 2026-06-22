import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('coop_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // 💡 FIXED: Added coopCode to the parameters
    const login = async (identifier, password, coopCode) => {
        try {
            const response = await fetch('http://localhost:8080/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // 💡 FIXED: Packaged coopCode into the payload for the Spring Boot DTO
                body: JSON.stringify({ identifier, password, coopCode }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Authentication failed');
            }

            const data = await response.json(); 
            console.log("RAW NETWORK DATA PAYLOAD FROM SPRING BOOT:", data);
            
            const normalizedUserData = {
                token: data.token,
                role: data.role,
                identifier: data.username || data.identifier, // Handles whatever profile variable key your token returns
                userId: data.userId,
                cooperativeName: data.cooperativeName || 'System Headquarters',
                county: data.county || '',       
                subCounty: data.subCounty || ''  
            };

            localStorage.setItem('coop_user', JSON.stringify(normalizedUserData));
            setUser(normalizedUserData);
            
            return { success: true, role: normalizedUserData.role };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('coop_user');
        setUser(null);
    };

    return (
        <div className="auth-provider-wrapper">
            <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
                {children}
            </AuthContext.Provider>
        </div>
    );
};

export const useAuth = () => useContext(AuthContext);