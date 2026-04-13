"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { api, getToken, getUser, clearAuth } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        // Check if user is logged in from localStorage
        const storedUser = getUser();
        const token = getToken();
        
        if (storedUser && token) {
            setUser(storedUser);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.login({ email, password });
            
            if (response.success && response.token) {
                // Store JWT token and user data
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
                
                setUser(response.user);
                return { success: true, user: response.user };
            } else {
                return { success: false, error: response.message || "Invalid credentials" };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: "Network error. Please try again." };
        }
    };

    const logout = () => {
        // Show confirmation modal instead of logging out immediately
        setShowLogoutModal(true);
    };

    const confirmLogout = async () => {
        try {
            // Call logout API if user is logged in
            if (user) {
                try {
                    await api.logout();
                } catch (apiError) {
                    console.warn('API logout failed:', apiError);
                }
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage and state
            clearAuth();
            setUser(null);
            setShowLogoutModal(false);
            // Redirect to login page
            window.location.href = "/login";
        }
    };

    const cancelLogout = () => {
        setShowLogoutModal(false);
    };

    const hasPermission = (permission) => {
        if (!user || !user.permissions) return false;
        
        // Super admin has all permissions
        if (user.role === "super_admin") return true;
        
        // Check if user has specific permission
        return user.permissions.includes(permission);
    };

    const hasRole = (role) => {
        if (!user) return false;
        return user.role === role;
    };

    const isAuthenticated = () => {
        return !!user && !!getToken();
    };

    // Logout Confirmation Modal Component
    const LogoutModal = () => {
        if (!showLogoutModal) return null;

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                backdropFilter: 'blur(4px)'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '2rem',
                    maxWidth: '400px',
                    width: '90%',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
                    transform: 'scale(1)',
                    animation: 'modalSlideIn 0.3s ease-out'
                }}>
                    {/* Header */}
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            backgroundColor: '#fef2f2',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem auto'
                        }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                <polyline points="16,17 21,12 16,7"/>
                                <line x1="21" y1="12" x2="9" y2="12"/>
                            </svg>
                        </div>
                        <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: '#1f2937',
                            margin: '0 0 0.5rem 0'
                        }}>
                            Confirm Logout
                        </h3>
                        <p style={{
                            color: '#6b7280',
                            margin: 0,
                            fontSize: '0.875rem'
                        }}>
                            Are you sure you want to logout? You will need to sign in again to access your account.
                        </p>
                    </div>

                    {/* User Info */}
                    <div style={{
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: '#3b82f6',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.875rem'
                        }}>
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <div style={{
                                fontWeight: '500',
                                color: '#1f2937',
                                fontSize: '0.875rem'
                            }}>
                                {user?.name || 'User'}
                            </div>
                            <div style={{
                                color: '#6b7280',
                                fontSize: '0.75rem'
                            }}>
                                {user?.email || 'user@example.com'}
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        justifyContent: 'flex-end'
                    }}>
                        <button
                            onClick={cancelLogout}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#f3f4f6',
                                color: '#374151',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                minWidth: '80px'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.backgroundColor = '#e5e7eb';
                                e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.backgroundColor = '#f3f4f6';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmLogout}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                minWidth: '80px',
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.backgroundColor = '#dc2626';
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.backgroundColor = '#ef4444';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                            }}
                        >
                            Logout
                        </button>
                    </div>
                </div>

                <style jsx>{`
                    @keyframes modalSlideIn {
                        from {
                            opacity: 0;
                            transform: scale(0.95) translateY(-10px);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1) translateY(0);
                        }
                    }
                `}</style>
            </div>
        );
    };

    return (
        <AuthContext.Provider
            value={{ 
                user, 
                login, 
                logout, 
                loading, 
                hasPermission,
                hasRole,
                isAuthenticated
            }}
        >
            {children}
            <LogoutModal />
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}

