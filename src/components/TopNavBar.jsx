"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, User, Bell, ArrowUpDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import NotificationBell from "./NotificationBell";

// Global navigation items - ONLY actual existing pages from sidebar
const NAVIGATION_ITEMS = [
    // Products
    { id: 'products', title: 'Products', path: '/products', category: 'Products', icon: '🏷️' },
    { id: 'website-products', title: 'Website Products', path: '/website-products', category: 'Products', icon: '🌐' },
    
    // Inventory Management
    { id: 'inventory', title: 'Inventory', path: '/inventory', category: 'Inventory', icon: '📦' },
    
    // Billing System
    { id: 'billing-create', title: 'Create Bill', path: '/billing/create', category: 'Billing', icon: '💰' },
    { id: 'billing-history', title: 'Bill History', path: '/billing/history', category: 'Billing', icon: '📋' },
    { id: 'billing-inventory', title: 'Store Inventory', path: '/billing/store-inventory', category: 'Billing', icon: '📦' },
    
    // Order Management
    { id: 'orders', title: 'Orders', path: '/order', category: 'Orders', icon: '📋' },
    { id: 'dispatch', title: 'Dispatch Orders', path: '/order', category: 'Orders', icon: '🚚' },
    { id: 'website-orders', title: 'Website Orders', path: '/website-orders', category: 'Orders', icon: '🌐' },
    { id: 'order-store', title: 'Order Store', path: '/order/store', category: 'Orders', icon: '🛒' },
    
    // System Management
    { id: 'permissions', title: 'Permissions', path: '/permissions', category: 'System', icon: '🔐' },
    { id: 'audit-logs', title: 'Audit Logs', path: '/audit-logs', category: 'System', icon: '📝' },
    
    // API Management
    { id: 'api', title: 'API Access', path: '/api', category: 'API', icon: '🔑' },
    
    // Debug & Testing (existing pages)
    { id: 'api-debug', title: 'API Debug', path: '/api-debug', category: 'Debug', icon: '🔧' },
];

export default function TopNavBar() {
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
            background: '#fff', 
            borderBottom: '1px solid #E5E7EB', 
            display: 'flex', 
            alignItems: 'center', 
            padding: '0 24px',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            {/* Left Section - Simple Brand Text Only */}
            <div style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#111827',
                cursor: 'pointer',
                flex: '0 0 auto'
            }} onClick={() => router.push('/dashboard')}>
                insora.in
            </div>

            {/* Center Section - Search */}
            <div style={{ flex: '1', maxWidth: '600px', margin: '0 auto', position: 'relative' }} ref={searchRef}>
                <form onSubmit={handleSearch} style={{ position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                        <Search 
                            size={18} 
                            style={{ 
                                position: 'absolute', 
                                left: '14px', 
                                top: '50%', 
                                transform: 'translateY(-50%)', 
                                color: '#9CA3AF' 
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
                                height: '40px',
                                paddingLeft: '44px',
                                paddingRight: searchQuery ? '40px' : '16px',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                fontSize: '14px',
                                outline: 'none',
                                background: '#F9FAFB',
                                transition: 'all 0.2s',
                                ':focus': {
                                    borderColor: '#3B82F6',
                                    background: '#fff'
                                }
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
                                    color: '#9CA3AF',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    padding: '4px'
                                }}
                            >
                                ✕
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
                            marginTop: '4px',
                            background: '#fff',
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                            zIndex: 1000,
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ 
                            padding: '12px 16px', 
                            borderBottom: '1px solid #F3F4F6',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Navigate to</span>
                            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{filteredItems.length} results</span>
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
                                        background: index === selectedIndex ? '#F3F4F6' : 'transparent',
                                        borderBottom: index < filteredItems.length - 1 ? '1px solid #F3F4F6' : 'none',
                                        transition: 'background 0.1s'
                                    }}
                                >
                                    <div style={{ fontSize: '16px' }}>{item.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                                            {item.title}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span>{item.category}</span>
                                            <span>•</span>
                                            <span>{item.path}</span>
                                        </div>
                                    </div>
                                    <div style={{ color: '#9CA3AF', fontSize: '14px' }}>→</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ 
                            padding: '8px 16px', 
                            borderTop: '1px solid #F3F4F6',
                            background: '#F9FAFB'
                        }}>
                            <span style={{ fontSize: '11px', color: '#6B7280' }}>
                                Use ↑↓ to navigate, Enter to select, Esc to close
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Section - Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '0 0 auto' }}>
                {/* Transfer Stock Button */}
                <button 
                    onClick={() => router.push('/inventory/selftransfer')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: '#3B82F6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#2563EB'}
                    onMouseLeave={(e) => e.target.style.background = '#3B82F6'}
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
                        padding: '8px',
                        borderRadius: '8px',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#F3F4F6'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
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
                        fontWeight: '600'
                    }}>
                        {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                            {user?.name || "System Administrator"}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>
                            ADMINISTRATOR
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
