"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/utils/api";
import CreateRoleModern from "./CreateRoleModern";
import styles from "./modern-role.module.css";

/**
 * MODERN PERMISSIONS PAGE INTEGRATION
 * Integrates the new modern role creation UI with existing functionality
 */
export default function ModernPermissionsPage() {
    const { user, hasPermission } = useAuth();
    const [showCreateRole, setShowCreateRole] = useState(false);
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Check permissions
    const canManageRoles = hasPermission('SYSTEM_ROLE_MANAGEMENT');

    useEffect(() => {
        if (!canManageRoles) {
            setError("You don't have permission to access this page");
            return;
        }
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [rolesRes, permissionsRes] = await Promise.all([
                api.getRoles(),
                api.getPermissions()
            ]);
            
            setRoles(rolesRes.data || []);
            setPermissions(permissionsRes.data?.permissions || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRole = async (roleData) => {
        try {
            await api.createRole(roleData);
            await loadInitialData();
            setShowCreateRole(false);
        } catch (err) {
            setError(err.message);
        }
    };

    // If showing create role modal, render the modern UI
    if (showCreateRole) {
        return (
            <CreateRoleModern
                role={null}
                permissions={permissions}
                onSave={handleCreateRole}
                onClose={() => setShowCreateRole(false)}
            />
        );
    }

    // Main permissions page with modern styling
    return (
        <div className="min-h-screen bg-[#F5F7FB]">
            {/* Top Navigation - Same as CreateRoleModern */}
            <nav className={`sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm ${styles.navbar}`}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between h-16">
                        {/* Left side - Logo and Navigation */}
                        <div className="flex items-center space-x-8">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">P</span>
                                </div>
                                <span className="ml-2 text-xl font-bold text-gray-900">PermitFlow</span>
                            </div>
                            
                            <nav className="hidden md:flex space-x-8">
                                <a href="#" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Dashboard</a>
                                <a href="#" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Team</a>
                                <a href="#" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Logs</a>
                                <a href="#" className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium">Settings</a>
                            </nav>
                        </div>

                        {/* Right side - Actions */}
                        <div className="flex items-center space-x-4">
                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                                </svg>
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Page Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Role Management</h1>
                        <p className="text-gray-600 text-lg">Manage user roles and permissions across your organization.</p>
                    </div>
                    <button
                        onClick={() => setShowCreateRole(true)}
                        className={`px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-all shadow-sm ${styles.primaryButton}`}
                    >
                        Create New Role
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                        <div className="flex">
                            <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <h3 className="text-sm font-medium text-red-800">Error</h3>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Roles Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className={`bg-white rounded-2xl border border-gray-200 p-6 ${styles.loading}`}>
                                <div className="animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roles.map((role) => (
                            <div
                                key={role.id}
                                className={`bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 ${styles.permissionCard}`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div 
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold"
                                            style={{ backgroundColor: role.color || '#3B82F6' }}
                                        >
                                            {role.display_name?.charAt(0) || role.name?.charAt(0) || 'R'}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{role.display_name || role.name}</h3>
                                            <p className="text-sm text-gray-500">ID: {role.id}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                    {role.description || 'No description provided'}
                                </p>
                                
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">
                                        {role.user_count || 0} users
                                    </span>
                                    <span className="text-gray-500">
                                        {role.permission_count || 0} permissions
                                    </span>
                                </div>
                                
                                <div className="mt-4 flex space-x-2">
                                    <button className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                        Edit
                                    </button>
                                    <button className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && roles.length === 0 && (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
                        <p className="text-gray-500 mb-6">Get started by creating your first role.</p>
                        <button
                            onClick={() => setShowCreateRole(true)}
                            className={`px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-all ${styles.primaryButton}`}
                        >
                            Create Your First Role
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}