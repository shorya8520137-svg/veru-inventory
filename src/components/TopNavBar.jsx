"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import NotificationBell from "./NotificationBell";
import styles from "./TopNavBar.module.css";

// Global navigation items - ONLY actual existing pages from sidebar
const NAVIGATION_ITEMS = [
    // Products
    { id: 'products', title: 'Products', path: '/products', category: 'Products', icon: '🏷️' },
    { id: 'website-products', title: 'Website Products', path: '/website-products', category: 'Products', icon: '🌐' },
    
    // Inventory Management
    { id: 'inventory', title: 'Inventory', path: '/inventory', category: 'Inventory', icon: '📦' },
    
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
        <div className={styles.topNav}>
            <div className={styles.container}>
                {/* Global Navigation Search Section */}
                <div className={styles.searchSection} ref={searchRef}>
                    <form onSubmit={handleSearch} className={styles.searchForm}>
                        <div className={styles.searchContainer}>
                            <Search className={styles.searchIcon} size={18} />
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
                                className={styles.searchInput}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setShowSuggestions(false);
                                        setSelectedIndex(-1);
                                    }}
                                    className={styles.clearButton}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Navigation Suggestions Dropdown */}
                    {showSuggestions && filteredItems.length > 0 && (
                        <div className={styles.suggestionsDropdown} ref={suggestionsRef}>
                            <div className={styles.suggestionsHeader}>
                                <span className={styles.suggestionsTitle}>Navigate to</span>
                                <span className={styles.suggestionsCount}>{filteredItems.length} results</span>
                            </div>
                            <div className={styles.suggestionsList}>
                                {filteredItems.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className={`${styles.suggestionItem} ${
                                            index === selectedIndex ? styles.suggestionItemSelected : ''
                                        }`}
                                        onClick={() => navigateToItem(item)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        <div className={styles.suggestionIcon}>{item.icon}</div>
                                        <div className={styles.suggestionContent}>
                                            <div className={styles.suggestionTitle}>{item.title}</div>
                                            <div className={styles.suggestionPath}>
                                                <span className={styles.suggestionCategory}>{item.category}</span>
                                                <span className={styles.suggestionSeparator}>•</span>
                                                <span className={styles.suggestionRoute}>{item.path}</span>
                                            </div>
                                        </div>
                                        <div className={styles.suggestionArrow}>→</div>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.suggestionsFooter}>
                                <span className={styles.keyboardHint}>
                                    Use ↑↓ to navigate, Enter to select, Esc to close
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions Section */}
                <div className={styles.actionsSection}>
                    {/* User Profile - Clickable Link to Profile Page */}
                    <div 
                        className={styles.userProfile}
                        onClick={() => router.push('/profile')}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className={styles.userAvatar}>
                            <img 
                                src="/logo-dark.png" 
                                alt="Profile"
                                className={styles.profileImage}
                            />
                        </div>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{user?.name || "System Administrator"}</span>
                            <span className={styles.userRole}>Administrator</span>
                        </div>
                    </div>

                    {/* Real-time Notifications */}
                    <div className={styles.notificationWrapper}>
                        <NotificationBell />
                    </div>
                </div>
            </div>
        </div>
    );
}
