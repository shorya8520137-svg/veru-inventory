"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ArrowUpDown, FileText, UploadCloud, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import NotificationBell from "./NotificationBell";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

function getAvatarUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_BASE}${path}`;
}

// Convert raw role slug to a human-readable label.
function getRoleLabel(user) {
    if (!user) return 'User';
    // Prefer explicit display name fields if backend sends them
    if (user.role_display_name) return user.role_display_name;
    if (user.role_label) return user.role_label;

    const raw = (user.role_name || user.role || '').toString().toLowerCase().trim();
    const map = {
        super_admin:        'Super Admin',
        admin:              'Administrator',
        administrator:      'Administrator',
        warehouse_manager:  'Warehouse Manager',
        'warehouse manager':  'Warehouse Manager',
        manager:            'Manager',
        staff:              'Staff',
        viewer:             'Viewer',
        accountant:         'Accountant',
        dispatch:           'Dispatch',
        dispatcher:         'Dispatcher',
    };
    return map[raw] || raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'User';
}

// Global navigation items - ONLY actual existing pages from sidebar
const NAVIGATION_ITEMS = [
    // Products
    { id: 'products', title: 'Products', path: '/products', category: 'Products', icon: 'ðŸ·ï¸' },
    { id: 'website-products', title: 'Website Products', path: '/website-products', category: 'Products', icon: 'ðŸŒ' },
    
    // Inventory Management
    { id: 'inventory', title: 'Inventory', path: '/inventory', category: 'Inventory', icon: 'ðŸ“¦' },
    
    // Billing System
    { id: 'billing-create', title: 'Create Bill', path: '/billing/create', category: 'Billing', icon: 'ðŸ’°' },
    { id: 'billing-history', title: 'Bill History', path: '/billing/history', category: 'Billing', icon: 'ðŸ“‹' },
    { id: 'billing-inventory', title: 'Store Inventory', path: '/billing/store-inventory', category: 'Billing', icon: 'ðŸ“¦' },
    
    // Order Management
    { id: 'orders', title: 'Orders', path: '/order', category: 'Orders', icon: 'ðŸ“‹' },
    { id: 'dispatch', title: 'Dispatch Orders', path: '/order', category: 'Orders', icon: 'ðŸšš' },
    { id: 'website-orders', title: 'Website Orders', path: '/website-orders', category: 'Orders', icon: 'ðŸŒ' },
    { id: 'order-store', title: 'Order Store', path: '/order/store', category: 'Orders', icon: 'ðŸ›’' },
    
    // System Management
    { id: 'permissions', title: 'Permissions', path: '/permissions', category: 'System', icon: 'ðŸ”' },
    { id: 'audit-logs', title: 'Audit Logs', path: '/audit-logs', category: 'System', icon: 'ðŸ“' },
    
    // API Management
    { id: 'api', title: 'API Access', path: '/api', category: 'API', icon: 'ðŸ”‘' },
    
    // Debug & Testing (existing pages)
    { id: 'api-debug', title: 'API Debug', path: '/api-debug', category: 'Debug', icon: 'ðŸ”§' },
];

export default function TopNavBar({ onTransferStock }) {
    const { user } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchRef = useRef(null);
    const suggestionsRef = useRef(null);

    // Filter navigation items based on search query
    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = NAVIGATION_ITEMS.filter(item =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.path.toLowerCase().includes(searchQuery.toLowerCase())
            ).slice(0, 8); // Limit to 8 results
            
            setFilteredItems(filtered);
            setShowSuggestions(filtered.length > 0);
            setSelectedIndex(-1);
        } else {
            setFilteredItems([]);
            setShowSuggestions(false);
            setSelectedIndex(-1);
        }
    }, [searchQuery]);

    // Handle navigation
    const navigateToItem = (item) => {
        router.push(item.path);
        setSearchQuery("");
        setShowSuggestions(false);
        setSelectedIndex(-1);
    };

    // Handle form submission
    const handleSearch = (e) => {
        e.preventDefault();
        if (filteredItems.length > 0) {
            const targetItem = selectedIndex >= 0 ? filteredItems[selectedIndex] : filteredItems[0];
            navigateToItem(targetItem);
        }
    };

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (!showSuggestions || filteredItems.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev < filteredItems.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev > 0 ? prev - 1 : filteredItems.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    navigateToItem(filteredItems[selectedIndex]);
                } else if (filteredItems.length > 0) {
                    navigateToItem(filteredItems[0]);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedIndex(-1);
                searchRef.current?.blur();
                break;
        }
    };

    // Handle click outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target) &&
                suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setShowSuggestions(false);
                setSelectedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div style={{ 
            height: '64px', 
            zIndex: 100,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderBottom: '1px solid rgba(226,232,240,0.85)',
            display: 'flex', 
            alignItems: 'center', 
            gap: '18px',
            padding: '0 22px',
            width: '100%',
            boxSizing: 'border-box',
            boxShadow: '0 1px 0 rgba(15,23,42,0.03), 0 18px 45px rgba(15,23,42,0.045)'
        }}>
            {/* Left Section - Company Name */}
            <div style={{
                fontSize: '19px',
                fontWeight: '800',
                letterSpacing: '-0.04em',
                color: '#0F172A',
                cursor: 'pointer',
                flex: '0 0 auto',
                padding: '8px 10px',
                borderRadius: '12px',
                transition: 'background 0.24s cubic-bezier(.2,.8,.2,1), transform 0.24s cubic-bezier(.2,.8,.2,1)'
            }} onClick={() => router.push('/dashboard')}>
                insora.in
            </div>

            {/* Center Section - Search */}
            <div style={{ flex: '1 1 420px', maxWidth: '620px', minWidth: '260px', position: 'relative' }} ref={searchRef}>
                <form onSubmit={handleSearch} style={{ position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: showSuggestions ? '#2563EB' : '#94A3B8',
                                transition: 'color 0.22s ease'
                            }} 
                        />
                        <input
                            type="text"
                            placeholder="Search pages, features, orders, products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => {
                                if (searchQuery.trim() && filteredItems.length > 0) {
                                    setShowSuggestions(true);
                                }
                            }}
                            style={{
                                width: '100%',
                                height: '42px',
                                paddingLeft: '46px',
                                paddingRight: searchQuery ? '42px' : '16px',
                                border: showSuggestions ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                                borderRadius: '14px',
                                fontSize: '14.5px',
                                outline: 'none',
                                color: '#0F172A',
                                background: showSuggestions ? '#FFFFFF' : '#F8FAFC',
                                transition: 'all 0.28s cubic-bezier(.2,.8,.2,1)',
                                boxShadow: showSuggestions ? '0 0 0 4px rgba(37,99,235,0.08), 0 12px 30px rgba(15,23,42,0.08)' : 'inset 0 1px 0 rgba(255,255,255,0.8)'
                            }}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery("");
                                    setShowSuggestions(false);
                                    setSelectedIndex(-1);
                                }}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#94A3B8',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <X size={15} />
                            </button>
                        )}
                    </div>
                </form>

                {/* Navigation Suggestions Dropdown */}
                {showSuggestions && filteredItems.length > 0 && (
                    <div 
                        ref={suggestionsRef}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '10px',
                            background: 'rgba(255,255,255,0.98)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            border: '1px solid #E2E8F0',
                            borderRadius: '18px',
                            boxShadow: '0 24px 70px rgba(15,23,42,0.14)',
                            zIndex: 1000,
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{
                            padding: '13px 16px',
                            borderBottom: '1px solid #F3F4F6',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Navigate</span>
                            <span style={{ fontSize: '11px', color: '#94A3B8', background: '#F1F5F9', borderRadius: '999px', padding: '3px 8px' }}>{filteredItems.length} results</span>
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {filteredItems.map((item, index) => (
                                <div
                                    key={item.id}
                                    onClick={() => navigateToItem(item)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    style={{
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        background: index === selectedIndex ? '#F8FAFC' : 'transparent',
                                        borderBottom: index < filteredItems.length - 1 ? '1px solid #F3F4F6' : 'none',
                                        transition: 'background 0.18s ease, transform 0.18s ease',
                                        transform: index === selectedIndex ? 'translateX(2px)' : 'translateX(0)'
                                    }}
                                >
                                    <div style={{ fontSize: '16px' }}>{item.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                                            {item.title}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span>{item.category}</span>
                                            <span>/</span>
                                            <span>{item.path}</span>
                                        </div>
                                    </div>
                                    <div style={{ color: '#CBD5E1', fontSize: '14px' }}>-&gt;</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ 
                            padding: '8px 16px', 
                            borderTop: '1px solid #F3F4F6',
                            background: '#F9FAFB'
                        }}>
                            <span style={{ fontSize: '11px', color: '#6B7280' }}>
                                Use up/down to navigate, Enter to select, Esc to close
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Section - Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '0 0 auto' }}>
                {/* Product Upload Button */}
                <button 
                    onClick={() => {
                        // Trigger product upload modal via callback
                        if (window.openProductUpload) {
                            window.openProductUpload();
                        }
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '9px 14px',
                        background: '#FFFFFF',
                        color: '#4F46E5',
                        border: '1px solid #E0E7FF',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '750',
                        cursor: 'pointer',
                        transition: 'all 0.24s cubic-bezier(.2,.8,.2,1)',
                        boxShadow: '0 8px 20px rgba(79,70,229,0.08)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 14px 30px rgba(79,70,229,0.13)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(79,70,229,0.08)'; }}
                >
                    <FileText size={16} />
                    Product Upload
                </button>

                {/* Bulk Upload Button */}
                <button 
                    onClick={() => {
                        // Trigger bulk upload modal via callback
                        if (window.openBulkUpload) {
                            window.openBulkUpload();
                        }
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '9px 14px',
                        background: '#FFFFFF',
                        color: '#047857',
                        border: '1px solid #D1FAE5',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '750',
                        cursor: 'pointer',
                        transition: 'all 0.24s cubic-bezier(.2,.8,.2,1)',
                        boxShadow: '0 8px 20px rgba(4,120,87,0.08)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 14px 30px rgba(4,120,87,0.13)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(4,120,87,0.08)'; }}
                >
                    <UploadCloud size={16} />
                    Bulk Upload
                </button>

                {/* Transfer Stock Button */}
                <button 
                    onClick={() => {
                        if (onTransferStock) {
                            onTransferStock();
                        } else {
                            router.push('/inventory/selftransfer');
                        }
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '9px 15px',
                        background: '#2563EB',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '750',
                        cursor: 'pointer',
                        transition: 'all 0.24s cubic-bezier(.2,.8,.2,1)',
                        boxShadow: '0 12px 28px rgba(37,99,235,0.22)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 16px 34px rgba(37,99,235,0.28)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(37,99,235,0.22)'; }}
                >
                    <ArrowUpDown size={16} />
                    Transfer Stock
                </button>

                {/* Notifications */}
                <div style={{ position: 'relative' }}>
                    <NotificationBell />
                </div>

                {/* User Profile */}
                <div 
                    onClick={() => router.push('/profile')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        padding: '7px',
                        borderRadius: '14px',
                        transition: 'all 0.22s cubic-bezier(.2,.8,.2,1)',
                        border: '1px solid transparent'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                >
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#3B82F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: '600',
                        overflow: 'hidden',
                        flexShrink: 0
                    }}>
                        {getAvatarUrl(user?.profile_image || user?.avatar) ? (
                            <img
                                src={getAvatarUrl(user?.profile_image || user?.avatar)}
                                alt={user?.name || 'User'}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                        ) : null}
                        <span style={{ display: getAvatarUrl(user?.profile_image || user?.avatar) ? 'none' : 'flex' }}>
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                            {user?.name || 'User'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {getRoleLabel(user)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
