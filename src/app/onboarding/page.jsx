"use client";

import { useState, useEffect } from "react";
import { usePermissions, PERMISSIONS } from "@/contexts/PermissionsContext";
import { Building2, Users, CheckCircle, AlertCircle, Loader2, Eye, EyeOff, Copy, ExternalLink, ChevronDown, ChevronRight, Shield } from "lucide-react";

const CATEGORY_LABELS = {
    PRODUCTS: "Products",
    INVENTORY: "Inventory",
    ORDERS: "Orders",
    OPERATIONS: "Operations",
    DASHBOARD: "Dashboard",
    TRACKING: "Tracking",
    MESSAGES: "Messages",
    SYSTEM: "System",
};

export default function OnboardingPage() {
    const { hasPermission, userRole } = usePermissions();
    const canCreate = hasPermission(PERMISSIONS.CLIENTS_CREATE);
    const canView = hasPermission(PERMISSIONS.CLIENTS_VIEW);

    const [form, setForm] = useState({
        company_name: "",
        admin_email: "",
        admin_password: "",
        confirm_password: "",
        phone: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [clientsLoading, setClientsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [tab, setTab] = useState("create");

    // Permission selection state
    const [availablePerms, setAvailablePerms] = useState([]);
    const [selectedPerms, setSelectedPerms] = useState({});
    const [permLoading, setPermLoading] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState({});

    useEffect(() => {
        if (canCreate) {
            loadPermissions();
        }
    }, [canCreate]);

    useEffect(() => {
        if (canView) {
            loadClients();
        }
    }, [canView]);

    const loadPermissions = async () => {
        setPermLoading(true);
        try {
            const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
            const res = await fetch(`${API_BASE}/api/permissions`);
            const data = await res.json();
            if (data.success) {
                const perms = data.data.permissions;
                setAvailablePerms(perms);
                // Initialize all as selected
                const expanded = {};
                const selected = {};
                for (const perm of perms) {
                    if (perm.name) {
                        selected[perm.name] = true;
                        if (!expanded[perm.category]) expanded[perm.category] = true;
                    }
                }
                setSelectedPerms(selected);
                setExpandedCategories(expanded);
            }
        } catch (err) {
            console.error('Failed to load permissions:', err);
        } finally {
            setPermLoading(false);
        }
    };

    const togglePermission = (permName) => {
        setSelectedPerms(prev => ({ ...prev, [permName]: !prev[permName] }));
    };

    const toggleCategory = (category) => {
        const permsInCategory = availablePerms.filter(p => p.category === category);
        const allSelected = permsInCategory.every(p => selectedPerms[p.name]);
        const newState = {};
        for (const perm of permsInCategory) {
            newState[perm.name] = !allSelected;
        }
        setSelectedPerms(prev => ({ ...prev, ...newState }));
    };

    const toggleCategoryExpanded = (category) => {
        setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const selectAllNone = (selectAll) => {
        const newState = {};
        for (const perm of availablePerms) {
            newState[perm.name] = selectAll;
        }
        setSelectedPerms(newState);
    };

    const loadClients = async () => {
        setClientsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
            const res = await fetch(`${API_BASE}/api/onboarding/clients`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setClients(data.data);
            }
        } catch (err) {
            console.error('Failed to load clients:', err);
        } finally {
            setClientsLoading(false);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setResult(null);

        if (!form.company_name.trim()) {
            setError("Company name is required");
            return;
        }
        if (!form.admin_email.trim()) {
            setError("Admin email is required");
            return;
        }
        if (!form.admin_password || form.admin_password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        if (form.admin_password !== form.confirm_password) {
            setError("Passwords do not match");
            return;
        }

        const selectedPermissionNames = Object.entries(selectedPerms)
            .filter(([_, val]) => val)
            .map(([name]) => name);

        if (selectedPermissionNames.length === 0) {
            setError("Select at least one permission for the client admin");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
            const res = await fetch(`${API_BASE}/api/onboarding/client`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    company_name: form.company_name.trim(),
                    admin_email: form.admin_email.trim(),
                    admin_password: form.admin_password,
                    phone: form.phone.trim(),
                    permissions: selectedPermissionNames
                })
            });
            const data = await res.json();
            if (data.success) {
                setResult(data.data);
                setForm({ company_name: "", admin_email: "", admin_password: "", confirm_password: "", phone: "" });
                if (canView) loadClients();
            } else {
                setError(data.message || "Failed to onboard client");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!canCreate && !canView) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600">Access Denied</h2>
                    <p className="text-sm text-slate-400 mt-1">You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    // Group permissions by category
    const groupedPerms = availablePerms.reduce((acc, perm) => {
        if (!acc[perm.category]) acc[perm.category] = [];
        acc[perm.category].push(perm);
        return acc;
    }, {});

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Client Onboarding</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Create and manage client accounts with dedicated databases</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 p-1 bg-slate-100 rounded-xl w-fit">
                {canCreate && (
                    <button
                        onClick={() => setTab("create")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                            tab === "create" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        Onboard Client
                    </button>
                )}
                {canView && (
                    <button
                        onClick={() => setTab("clients")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                            tab === "clients" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        View Clients
                    </button>
                )}
            </div>

            {tab === "create" && canCreate && (
                <>
                    {/* Onboarding Form */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-1">New Client Details</h2>
                        <p className="text-sm text-slate-500 mb-6">A dedicated database will be created for this client automatically.</p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Company Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="company_name"
                                        value={form.company_name}
                                        onChange={handleChange}
                                        placeholder="e.g. Acme Corp"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Used to create the client database name</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Admin Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="admin_email"
                                        value={form.admin_email}
                                        onChange={handleChange}
                                        placeholder="admin@company.com"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Admin Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="admin_password"
                                            value={form.admin_password}
                                            onChange={handleChange}
                                            placeholder="Min. 6 characters"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Confirm Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="confirm_password"
                                        value={form.confirm_password}
                                        onChange={handleChange}
                                        placeholder="Re-enter password"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Phone (optional)
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="+1 555-0123"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <><Loader2 size={16} className="animate-spin" /> Creating Client...</>
                                ) : (
                                    <><Building2 size={16} /> Onboard Client</>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Permissions Assignment Section */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Assign Permissions</h2>
                                <p className="text-sm text-slate-500 mt-0.5">Select which permissions the client admin will have</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => selectAllNone(true)}
                                    className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                >
                                    Select All
                                </button>
                                <button
                                    type="button"
                                    onClick={() => selectAllNone(false)}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 rounded-lg transition-all"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>

                        {permLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 size={20} className="animate-spin text-slate-400" />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(groupedPerms).map(([category, perms]) => (
                                    <div key={category} className="border border-slate-200 rounded-xl overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => toggleCategoryExpanded(category)}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                {expandedCategories[category] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                <Shield size={16} className="text-slate-400" />
                                                <span className="text-sm font-medium text-slate-700">
                                                    {CATEGORY_LABELS[category] || category}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    ({perms.filter(p => selectedPerms[p.name]).length}/{perms.length})
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); toggleCategory(category); }}
                                                className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-all ${
                                                    perms.every(p => selectedPerms[p.name])
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                                                }`}
                                            >
                                                {perms.every(p => selectedPerms[p.name]) ? "Deselect All" : "Select All"}
                                            </button>
                                        </button>
                                        {expandedCategories[category] && (
                                            <div className="px-4 py-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                                                {perms.map((perm) => (
                                                    <label
                                                        key={perm.name}
                                                        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={!!selectedPerms[perm.name]}
                                                            onChange={() => togglePermission(perm.name)}
                                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                                                        />
                                                        <span className="text-sm text-slate-700">{perm.display_name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Success Result */}
                    {result && (
                        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircle className="h-5 w-5 text-emerald-600" />
                                <h3 className="text-lg font-semibold text-emerald-800">Client Onboarded Successfully</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div className="bg-white rounded-xl p-3 border border-emerald-100">
                                    <span className="text-slate-500">Company</span>
                                    <p className="font-medium text-slate-900 mt-0.5">{result.company_name}</p>
                                </div>
                                <div className="bg-white rounded-xl p-3 border border-emerald-100">
                                    <span className="text-slate-500">Admin Email</span>
                                    <p className="font-medium text-slate-900 mt-0.5">{result.admin_email}</p>
                                </div>
                                <div className="bg-white rounded-xl p-3 border border-emerald-100">
                                    <span className="text-slate-500">Admin Password</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <code className="font-mono text-sm bg-slate-100 px-2 py-0.5 rounded text-slate-900">
                                            {result.admin_password}
                                        </code>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(result.admin_password)}
                                            className="text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl p-3 border border-emerald-100">
                                    <span className="text-slate-500">Database</span>
                                    <p className="font-mono text-sm font-medium text-slate-900 mt-0.5">{result.db_name}</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-emerald-200">
                                <a
                                    href={result.login_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                                >
                                    <ExternalLink size={14} />
                                    Open Login Page
                                </a>
                            </div>
                        </div>
                    )}
                </>
            )}

            {tab === "clients" && canView && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-900">Onboarded Clients</h2>
                        {clientsLoading && <Loader2 size={16} className="animate-spin text-slate-400" />}
                    </div>

                    {clients.length === 0 && !clientsLoading ? (
                        <div className="text-center py-12">
                            <Users className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                            <p className="text-sm text-slate-500">No clients onboarded yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left py-3 px-3 font-medium text-slate-500">Company</th>
                                        <th className="text-left py-3 px-3 font-medium text-slate-500">Admin Email</th>
                                        <th className="text-left py-3 px-3 font-medium text-slate-500">Database</th>
                                        <th className="text-left py-3 px-3 font-medium text-slate-500">Status</th>
                                        <th className="text-left py-3 px-3 font-medium text-slate-500">Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.map((client) => (
                                        <tr key={client.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                            <td className="py-3 px-3 font-medium text-slate-900">{client.company_name}</td>
                                            <td className="py-3 px-3 text-slate-600">{client.admin_email}</td>
                                            <td className="py-3 px-3">
                                                <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                                    {client.db_name}
                                                </code>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    client.status === "active" 
                                                        ? "bg-emerald-50 text-emerald-700" 
                                                        : "bg-slate-100 text-slate-600"
                                                }`}>
                                                    {client.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-slate-500">
                                                {new Date(client.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}