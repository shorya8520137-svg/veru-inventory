"use client";

import { useEffect, useState } from "react";
import { Search, Filter, Download, Package, MapPin, BarChart3, Eye, RefreshCw, Calendar, TrendingUp, X, ChevronDown } from "lucide-react";
import styles from "./inventory.module.css";
import { getMockInventoryResponse } from "../../utils/mockInventoryData";
import ProductTracker from "./ProductTracker";
import { usePermissions, PERMISSIONS } from '@/contexts/PermissionsContext';

const PAGE_SIZE = 10;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

const WAREHOUSES = [
    { code: "GGM_WH", name: "Gurgaon Warehouse", city: "Gurgaon" },
    { code: "BLR_WH", name: "Bangalore Warehouse", city: "Bangalore" },
    { code: "MUM_WH", name: "Mumbai Warehouse", city: "Mumbai" },
    { code: "AMD_WH", name: "Ahmedabad Warehouse", city: "Ahmedabad" },
    { code: "HYD_WH", name: "Hyderabad Warehouse", city: "Hyderabad" },
];

export default function InventorySheet() {
    const { hasPermission, getAccessibleWarehouses } = usePermissions();
    
    const [allItems, setAllItems] = useState([]); // Store ALL items from API
    const [items, setItems] = useState([]); // Items to display on current page
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchChips, setSearchChips] = useState([]); // For multi-search chips
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filter states
    const [selectedWarehouses, setSelectedWarehouses] = useState([]); // Multi-warehouse selection - empty means ALL
    const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false); // For inline warehouse dropdown
    const [stockFilter, setStockFilter] = useState("all");
    const [sortBy, setSortBy] = useState("product_name");
    const [sortOrder, setSortOrder] = useState("asc");
    const [showFilters, setShowFilters] = useState(false);
    const [dateFrom, setDateFrom] = useState(""); // Empty by default - no date filtering
    const [dateTo, setDateTo] = useState(""); // Empty by default - no date filtering
    const [useMockData, setUseMockData] = useState(false); // Toggle for mock data

    // Get accessible warehouses based on user permissions
    const accessibleWarehouses = getAccessibleWarehouses('INVENTORY_VIEW');
    const availableWarehouses = accessibleWarehouses.length > 0 ? accessibleWarehouses : WAREHOUSES;

    // Timeline states - restored for modal
    const [selectedItem, setSelectedItem] = useState(null);
    const [showTimeline, setShowTimeline] = useState(false);

    // Manual Stock Update states
    const [showStockUpdateModal, setShowStockUpdateModal] = useState(false);
    const [selectedItemForUpdate, setSelectedItemForUpdate] = useState(null);
    const [stockUpdateType, setStockUpdateType] = useState('adjustment'); // 'adjustment', 'in', 'out'
    const [stockUpdateQuantity, setStockUpdateQuantity] = useState('');
    const [stockUpdateReason, setStockUpdateReason] = useState('');
    const [stockUpdateNotes, setStockUpdateNotes] = useState('');
    const [updatingStock, setUpdatingStock] = useState(false);

    // Damage Update states
    // Stats
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalStock: 0,
        lowStockItems: 0,
        outOfStockItems: 0
    });

    /* ================= LOAD INVENTORY WITH FILTERS ================= */
    const loadInventory = async () => {
        setLoading(true);
        try {
            // ── Server-side pagination — fetch only current page ──
            const params = new URLSearchParams({
                page: page.toString(),
                limit: PAGE_SIZE.toString(),
            });

            if (selectedWarehouses.length === 1) params.append('warehouse', selectedWarehouses[0]);
            else if (selectedWarehouses.length > 1) params.append('warehouses', selectedWarehouses.join(','));

            const allSearchTerms = [...searchChips];
            if (searchQuery.trim()) allSearchTerms.push(searchQuery.trim());
            if (allSearchTerms.length > 0) params.append('search', allSearchTerms.join(' '));
            if (stockFilter !== 'all') params.append('stockFilter', stockFilter);
            if (sortBy !== 'product_name') params.append('sortBy', sortBy);
            if (sortOrder !== 'asc') params.append('sortOrder', sortOrder);
            if (dateFrom && dateFrom.trim()) params.append('dateFrom', dateFrom);
            if (dateTo && dateTo.trim()) params.append('dateTo', dateTo);

            console.log('🔗 API URL:', `${API_BASE}/api/inventory?${params}`);

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/inventory?${params}`, {
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();

            let inventoryItems = [];
            let totalCount = 0;

            if (data.success && data.data) {
                inventoryItems = Array.isArray(data.data) ? data.data : data.data.items || data.data.inventory || [];
                totalCount = data.total || data.pagination?.total || data.pagination?.pages * PAGE_SIZE || inventoryItems.length;
                // Use pages from pagination if available
                const totalPages = data.pagination?.pages || Math.ceil(totalCount / PAGE_SIZE) || 1;
                setTotalPages(totalPages);
            } else if (Array.isArray(data)) {
                inventoryItems = data;
                totalCount = data.length;
                setTotalPages(Math.ceil(totalCount / PAGE_SIZE) || 1);
            }

            setItems(inventoryItems);
            setAllItems(inventoryItems);
            if (!data.pagination?.pages) {
                setTotalPages(Math.ceil(totalCount / PAGE_SIZE) || 1);
            }

            setStats({
                totalProducts: totalCount,
                totalStock: inventoryItems.reduce((s, i) => s + parseInt(i.stock || i.quantity || 0), 0),
                lowStockItems: inventoryItems.filter(i => { const s = parseInt(i.stock||0); return s>0&&s<=10; }).length,
                outOfStockItems: inventoryItems.filter(i => parseInt(i.stock||0) === 0).length,
            });

        } catch (error) {
            console.error('❌ Error loading inventory:', error);
            setItems([]); setAllItems([]); setTotalPages(1);
            setStats({ totalProducts:0, totalStock:0, lowStockItems:0, outOfStockItems:0 });
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { loadInventory(); }, [selectedWarehouses, stockFilter, sortBy, sortOrder, dateFrom, dateTo, useMockData, page]);

    useEffect(() => {
        const t = setTimeout(() => { loadInventory(); }, 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    /* ================= SEARCH WITH BACKEND SUGGESTIONS ================= */
    const handleSearchChange = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        setSelectedSuggestionIndex(-1); // Reset selection when typing

        if (!query.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        if (query.length >= 2) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE}/api/products?search=${encodeURIComponent(query)}&limit=5`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        setSuggestions(data.data.products || data.data || []);
                        setShowSuggestions(true);
                    } else if (Array.isArray(data)) {
                        setSuggestions(data);
                        setShowSuggestions(true);
                    }
                }
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            }
        }
    };

    // Handle keyboard navigation in search
    const handleSearchKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) {
            // Handle chips functionality
            if (e.key === 'Enter' && searchQuery.trim()) {
                e.preventDefault();
                addSearchChip(searchQuery.trim());
                return;
            }
            if (e.key === 'Backspace' && !searchQuery && searchChips.length > 0) {
                // Remove last chip when backspace on empty input
                removeSearchChip(searchChips.length - 1);
                return;
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedSuggestionIndex(prev => 
                    prev < suggestions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedSuggestionIndex(prev => 
                    prev > 0 ? prev - 1 : suggestions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
                    selectSuggestion(suggestions[selectedSuggestionIndex]);
                } else if (searchQuery.trim()) {
                    addSearchChip(searchQuery.trim());
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedSuggestionIndex(-1);
                break;
        }
    };

    // Add search chip
    const addSearchChip = (term) => {
        if (term && !searchChips.includes(term)) {
            setSearchChips([...searchChips, term]);
            setSearchQuery("");
            setSuggestions([]);
            setShowSuggestions(false);
            setSelectedSuggestionIndex(-1);
            setPage(1);
        }
    };

    // Remove search chip
    const removeSearchChip = (index) => {
        const newChips = searchChips.filter((_, i) => i !== index);
        setSearchChips(newChips);
        setPage(1);
    };

    const selectSuggestion = (suggestion) => {
        addSearchChip(suggestion.product_name);
    };

    /* ================= WAREHOUSE FILTER ================= */
    const handleWarehouseToggle = (warehouseCode) => {
        console.log('≡ƒÅó Warehouse toggled:', warehouseCode);
        console.log('≡ƒÅó Current selection:', selectedWarehouses);

        setSelectedWarehouses(prev => {
            const newSelection = prev.includes(warehouseCode)
                ? prev.filter(code => code !== warehouseCode) // Remove if already selected
                : [...prev, warehouseCode]; // Add if not selected
            
            console.log('≡ƒÅó New selection:', newSelection);
            return newSelection;
        });
        
        setPage(1);
    };

    const selectAllWarehouses = () => {
        console.log('≡ƒÅó Selecting all accessible warehouses');
        setSelectedWarehouses(availableWarehouses.map(w => w.code));
        setShowWarehouseDropdown(false);
        setPage(1);
    };

    const clearAllWarehouses = () => {
        console.log('≡ƒÅó Clearing all warehouses (showing ALL)');
        setSelectedWarehouses([]);
        setShowWarehouseDropdown(false);
        setPage(1);
    };

    // Close warehouse dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showWarehouseDropdown && !event.target.closest('.warehouseDropdown')) {
                setShowWarehouseDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showWarehouseDropdown]);

    /* ================= LOAD INVENTORY WITH SPECIFIC WAREHOUSE (UNUSED - KEPT FOR REFERENCE) ================= */
    // Γ£à NOTE: This function is no longer used. All loading goes through loadInventory() now.
    const loadInventoryWithWarehouse = async (warehouseCode) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),  // Γ£à FIXED: Use current page, not hardcoded '1'
                limit: PAGE_SIZE.toString(),
            });

            // Use the passed warehouse parameter directly
            if (warehouseCode) {
                params.append('warehouse', warehouseCode);
            }

            // Add other current filter parameters
            if (searchQuery.trim()) {
                params.append('search', searchQuery);
            }
            if (stockFilter !== 'all') {
                params.append('stockFilter', stockFilter);
            }
            if (sortBy !== 'product_name') {
                params.append('sortBy', sortBy);
            }
            if (sortOrder !== 'asc') {
                params.append('sortOrder', sortOrder);
            }
            if (dateFrom) {
                params.append('dateFrom', dateFrom);
            }
            if (dateTo) {
                params.append('dateTo', dateTo);
            }

            console.log('≡ƒöì Loading inventory for warehouse:', warehouseCode);
            console.log('API URL:', `${API_BASE}/api/inventory?${params}`);

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/inventory?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response for', warehouseCode, ':', data);

            // Handle different response formats more robustly
            let inventoryItems = [];
            let totalCount = 0;
            let statsData = {
                totalProducts: 0,
                totalStock: 0,
                lowStockItems: 0,
                outOfStockItems: 0
            };

            // Try different response structures
            if (data.success && data.data) {
                // Standard success response
                inventoryItems = Array.isArray(data.data) ? data.data : data.data.items || data.data.inventory || [];
                totalCount = data.total || data.data.total || inventoryItems.length;
                statsData = data.stats || data.data.stats || {};
            } else if (Array.isArray(data)) {
                // Direct array response
                inventoryItems = data;
                totalCount = data.length;
            } else if (data.inventory && Array.isArray(data.inventory)) {
                // Inventory key response
                inventoryItems = data.inventory;
                totalCount = data.total || inventoryItems.length;
                statsData = data.stats || {};
            } else if (data.items && Array.isArray(data.items)) {
                // Items key response
                inventoryItems = data.items;
                totalCount = data.total || inventoryItems.length;
                statsData = data.stats || {};
            } else {
                console.warn('Unexpected API response format:', data);
                inventoryItems = [];
            }

            // Verify warehouse filtering worked correctly
            const actualWarehouses = [...new Set(inventoryItems.map(item => item.warehouse || item.warehouse_name || item.Warehouse_name))];
            console.log('≡ƒÅó Expected warehouse:', warehouseCode);
            console.log('≡ƒÅó Actual warehouses in response:', actualWarehouses);

            if (warehouseCode && actualWarehouses.length > 0 && !actualWarehouses.includes(warehouseCode)) {
                console.error('Γ¥î WAREHOUSE FILTER FAILED! Expected:', warehouseCode, 'Got:', actualWarehouses);
                console.error('Γ¥î This indicates a backend filtering bug or data corruption');
                // Clear data if wrong warehouse data is returned
                inventoryItems = [];
                totalCount = 0;
                statsData = {
                    totalProducts: 0,
                    totalStock: 0,
                    lowStockItems: 0,
                    outOfStockItems: 0
                };
            } else if (warehouseCode && actualWarehouses.length === 0) {
                console.log('Γ£à Warehouse filter working correctly - no data for', warehouseCode);
            } else if (warehouseCode && actualWarehouses.includes(warehouseCode)) {
                console.log('Γ£à Warehouse filter working correctly - data matches', warehouseCode);
            }

            // Calculate stats if not provided by API
            if (!statsData.totalProducts && inventoryItems.length > 0) {
                statsData = {
                    totalProducts: totalCount || inventoryItems.length,
                    totalStock: inventoryItems.reduce((sum, item) => sum + (parseInt(item.stock || item.quantity || 0)), 0),
                    lowStockItems: inventoryItems.filter(item => {
                        const stock = parseInt(item.stock || item.quantity || 0);
                        return stock > 0 && stock <= 10;
                    }).length,
                    outOfStockItems: inventoryItems.filter(item => {
                        const stock = parseInt(item.stock || item.quantity || 0);
                        return stock === 0;
                    }).length
                };
            }

            console.log('Γ£à Final processed data for', warehouseCode, ':', {
                itemsCount: inventoryItems.length,
                totalCount,
                stats: statsData,
                sampleItem: inventoryItems[0] || 'No items'
            });

            setItems(inventoryItems);
            setTotalPages(Math.ceil(totalCount / PAGE_SIZE) || 1);
            setStats({
                totalProducts: statsData.totalProducts || totalCount || inventoryItems.length,
                totalStock: statsData.totalStock || 0,
                lowStockItems: statsData.lowStockItems || 0,
                outOfStockItems: statsData.outOfStockItems || 0
            });
        } catch (error) {
            console.error('Γ¥î Error loading inventory for', warehouseCode, ':', error);

            // Don't fall back to mock data for warehouse-specific requests
            // Just show empty state
            setItems([]);
            setTotalPages(1);
            setStats({
                totalProducts: 0,
                totalStock: 0,
                lowStockItems: 0,
                outOfStockItems: 0
            });
        } finally {
            setLoading(false);
        }
    };

    /* ================= EXPORT ================= */
    const exportToCSV = async (warehouseOption = 'current') => {
        try {
            const params = new URLSearchParams({
                export: 'true'
            });

            // Determine which warehouses to export
            let exportWarehouses = [];
            if (warehouseOption === 'all') {
                // Don't add warehouse parameter for all warehouses
            } else if (warehouseOption === 'current') {
                exportWarehouses = selectedWarehouses;
            } else {
                exportWarehouses = [warehouseOption];
            }

            if (exportWarehouses.length > 0 && warehouseOption !== 'all') {
                params.append('warehouses', exportWarehouses.join(','));
            }

            // Add search filter - combine chips and current input
            const allSearchTerms = [...searchChips];
            if (searchQuery.trim()) {
                allSearchTerms.push(searchQuery.trim());
            }
            if (allSearchTerms.length > 0) {
                params.append('search', allSearchTerms.join(' '));
            }
            if (stockFilter !== 'all') {
                params.append('stockFilter', stockFilter);
            }
            if (sortBy !== 'product_name') {
                params.append('sortBy', sortBy);
            }
            if (sortOrder !== 'asc') {
                params.append('sortOrder', sortOrder);
            }
            // Only add date filters if they are actually set
            if (dateFrom && dateFrom.trim()) {
                params.append('dateFrom', dateFrom);
            }
            if (dateTo && dateTo.trim()) {
                params.append('dateTo', dateTo);
            }

            console.log('≡ƒö╜ Exporting with params:', params.toString());
            console.log('≡ƒÅó Export warehouses:', exportWarehouses.length === 0 ? 'All Warehouses' : exportWarehouses.join(', '));

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/inventory/export?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;

                const warehouseName = warehouseOption === 'all' ? 'All-Warehouses' :
                                    warehouseOption === 'current' ? 
                                        (selectedWarehouses.length === 0 ? 'All-Warehouses' : selectedWarehouses.join('-')) :
                                    warehouseOption;

                a.download = `inventory-${warehouseName}-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);

                console.log('Γ£à Export completed for:', warehouseName);
            } else {
                console.error('Γ¥î Export failed:', response.status);
            }
        } catch (error) {
            console.error('Γ¥î Export error:', error);
        }
    };

    /* ================= MANUAL STOCK UPDATE FUNCTIONS ================= */
    const openStockUpdateModal = (item) => {
        setSelectedItemForUpdate(item);
        setShowStockUpdateModal(true);
        setStockUpdateType('adjustment');
        setStockUpdateQuantity('');
        setStockUpdateReason('');
        setStockUpdateNotes('');
    };

    const closeStockUpdateModal = () => {
        setShowStockUpdateModal(false);
        setSelectedItemForUpdate(null);
        setStockUpdateType('adjustment');
        setStockUpdateQuantity('');
        setStockUpdateReason('');
        setStockUpdateNotes('');
    };

    const handleStockUpdate = async () => {
        if (!selectedItemForUpdate || !stockUpdateQuantity || !stockUpdateReason) {
            alert('Please fill in all required fields');
            return;
        }

        const quantity = parseInt(stockUpdateQuantity);
        if (isNaN(quantity) || quantity <= 0) {
            alert('Please enter a valid positive quantity');
            return;
        }

        setUpdatingStock(true);
        try {
            const token = localStorage.getItem('token');
            
            // Prepare the update data
            const updateData = {
                product_id: selectedItemForUpdate.id,
                barcode: selectedItemForUpdate.code || selectedItemForUpdate.barcode,
                warehouse: selectedItemForUpdate.warehouse || selectedItemForUpdate.warehouse_name,
                adjustment_type: stockUpdateType,
                quantity: quantity,
                reason: stockUpdateReason,
                notes: stockUpdateNotes,
                current_stock: selectedItemForUpdate.stock || selectedItemForUpdate.quantity || 0
            };

            console.log('≡ƒôª Updating stock:', updateData);

            const response = await fetch(`${API_BASE}/api/inventory/update-stock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('Γ£à Stock updated successfully:', result);
                
                // Update the local state to reflect the change
                const updatedItems = items.map(item => {
                    if (item.id === selectedItemForUpdate.id || 
                        (item.code || item.barcode) === (selectedItemForUpdate.code || selectedItemForUpdate.barcode)) {
                        return {
                            ...item,
                            stock: result.new_stock || result.data?.new_stock || item.stock,
                            quantity: result.new_stock || result.data?.new_stock || item.quantity,
                            updated_at: new Date().toISOString()
                        };
                    }
                    return item;
                });
                
                setItems(updatedItems);
                
                // Also update allItems for consistency
                const updatedAllItems = allItems.map(item => {
                    if (item.id === selectedItemForUpdate.id || 
                        (item.code || item.barcode) === (selectedItemForUpdate.code || selectedItemForUpdate.barcode)) {
                        return {
                            ...item,
                            stock: result.new_stock || result.data?.new_stock || item.stock,
                            quantity: result.new_stock || result.data?.new_stock || item.quantity,
                            updated_at: new Date().toISOString()
                        };
                    }
                    return item;
                });
                
                setAllItems(updatedAllItems);
                
                // Recalculate stats
                const newTotalStock = updatedAllItems.reduce((sum, item) => sum + (parseInt(item.stock || item.quantity || 0)), 0);
                const newLowStockItems = updatedAllItems.filter(item => {
                    const stock = parseInt(item.stock || item.quantity || 0);
                    return stock > 0 && stock <= 10;
                }).length;
                const newOutOfStockItems = updatedAllItems.filter(item => {
                    const stock = parseInt(item.stock || item.quantity || 0);
                    return stock === 0;
                }).length;
                
                setStats(prev => ({
                    ...prev,
                    totalStock: newTotalStock,
                    lowStockItems: newLowStockItems,
                    outOfStockItems: newOutOfStockItems
                }));
                
                alert(`Γ£à Stock updated successfully!\nNew stock level: ${result.new_stock || result.data?.new_stock || 'Updated'}`);
                closeStockUpdateModal();
                
            } else {
                console.error('Γ¥î Stock update failed:', result);
                alert(`Γ¥î Failed to update stock: ${result.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Γ¥î Stock update error:', error);
            alert(`Γ¥î Error updating stock: ${error.message}`);
        } finally {
            setUpdatingStock(false);
        }
    };

    /* ================= TIMELINE FUNCTIONS ================= */
    const openTimeline = async (item) => {
        setSelectedItem(item);
        setShowTimeline(true);
    };

    const closeTimeline = () => {
        setShowTimeline(false);
        setSelectedItem(null);
    };

    // ── Status badge helper ──
    const getStatusBadge = (stock) => {
        const s = parseInt(stock || 0);
        if (s === 0) return { label: 'Critical', color: '#DC2626', bg: '#FEF2F2' };
        if (s <= 10) return { label: 'Low Stock', color: '#D97706', bg: '#FEF3C7' };
        return { label: 'Optimal', color: '#16A34A', bg: '#DCFCE7' };
    };

    const timeAgo = (ts) => {
        if (!ts) return '—';
        const diff = Date.now() - new Date(ts).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h/24)}d ago`;
    };

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', fontFamily:'Inter,sans-serif', background:'#F8FAFC', padding:'0 20px 16px', boxSizing:'border-box' }}>
            {/* ── KPI CARDS — fixed at top ── */}
            <div style={{ flexShrink:0, padding:'12px 20px 0' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:10 }}>
                {[
                    { label:'TOTAL PRODUCTS', value: stats.totalProducts.toLocaleString(), sub:'Active SKUs', color:'#6366F1', icon:'📦' },
                    { label:'TOTAL STOCK', value: stats.totalStock.toLocaleString(), sub:'Units across warehouses', color:'#10B981', icon:'📊' },
                    { label:'URGENT RESTOCK', value: stats.outOfStockItems, sub:'Out of stock SKUs', color:'#EF4444', icon:'⚠', alert: stats.outOfStockItems > 0 },
                    { label:'LOW STOCK', value: stats.lowStockItems, sub:'Below 10 units', color:'#F59E0B', icon:'📉' },
                ].map((kpi,i) => (
                    <div key={i} style={{ background:'#fff', borderRadius:14, padding:'16px 18px', boxShadow:'0 1px 6px rgba(0,0,0,0.06)', border: kpi.alert ? '1.5px solid #FCA5A5' : '1px solid #F1F5F9', transition:'all 0.2s' }}
                        onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
                        onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}
                    >
                        <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.08em', marginBottom:8 }}>{kpi.label}</div>
                        <div style={{ fontSize:26, fontWeight:900, color: kpi.alert ? '#DC2626' : '#0F172A', marginBottom:4 }}>{kpi.value}</div>
                        <div style={{ fontSize:11, color:'#64748B' }}>{kpi.sub}</div>
                    </div>
                ))}
            </div>

            {/* ── FILTER + SEARCH BAR ── */}
            <div style={{ background:'#fff', borderRadius:14, padding:'10px 14px', margin:'10px 0 0', boxShadow:'0 1px 6px rgba(0,0,0,0.05)', border:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                {/* Search */}
                <div style={{ position:'relative', flex:1, minWidth:200 }}>
                    <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94A3B8' }} />
                    <input
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Search product, barcode..."
                        style={{ paddingLeft:30, paddingRight:12, paddingTop:8, paddingBottom:8, borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:12, outline:'none', background:'#F8FAFC', width:'100%', boxSizing:'border-box' }}
                    />
                    {showSuggestions && suggestions.length > 0 && (
                        <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1.5px solid #E5E7EB', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.1)', zIndex:100, maxHeight:200, overflowY:'auto' }}>
                            {suggestions.map((s,i) => (
                                <div key={i} onClick={() => selectSuggestion(s)} style={{ padding:'8px 12px', cursor:'pointer', fontSize:12, borderBottom:'1px solid #F1F5F9', background: i===selectedSuggestionIndex?'#F8FAFC':'#fff' }}>
                                    <div style={{ fontWeight:600 }}>{s.product_name}</div>
                                    <div style={{ fontSize:10, color:'#94A3B8' }}>{s.barcode}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Warehouse filter */}
                <div style={{ position:'relative' }} className="warehouseDropdown">
                    <button onClick={() => setShowWarehouseDropdown(!showWarehouseDropdown)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:10, border:'1.5px solid #E5E7EB', background:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', color:'#374151' }}>
                        <Filter size={12} />
                        {selectedWarehouses.length === 0 ? 'All Warehouses' : `${selectedWarehouses.length} WH`}
                        <ChevronDown size={12} />
                    </button>
                    {showWarehouseDropdown && (
                        <div style={{ position:'absolute', top:'100%', left:0, background:'#fff', border:'1.5px solid #E5E7EB', borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,0.1)', zIndex:100, minWidth:200, padding:8 }}>
                            <div style={{ display:'flex', gap:6, marginBottom:8 }}>
                                <button onClick={clearAllWarehouses} style={{ flex:1, padding:'5px', borderRadius:8, border:'1px solid #E5E7EB', background:'#fff', fontSize:11, cursor:'pointer' }}>All</button>
                                <button onClick={selectAllWarehouses} style={{ flex:1, padding:'5px', borderRadius:8, border:'1px solid #E5E7EB', background:'#fff', fontSize:11, cursor:'pointer' }}>Select All</button>
                            </div>
                            {availableWarehouses.map(wh => (
                                <div key={wh.code} onClick={() => handleWarehouseToggle(wh.code)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:8, cursor:'pointer', background: selectedWarehouses.includes(wh.code)?'#EFF6FF':'transparent', fontSize:12 }}>
                                    <div style={{ width:14, height:14, borderRadius:4, border:'1.5px solid', borderColor: selectedWarehouses.includes(wh.code)?'#2563EB':'#D1D5DB', background: selectedWarehouses.includes(wh.code)?'#2563EB':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                        {selectedWarehouses.includes(wh.code) && <span style={{ color:'#fff', fontSize:9 }}>✓</span>}
                                    </div>
                                    <span style={{ fontWeight: selectedWarehouses.includes(wh.code)?600:400 }}>{wh.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stock filter */}
                <select value={stockFilter} onChange={e=>{setStockFilter(e.target.value);setPage(1);}} style={{ padding:'7px 10px', borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:12, background:'#fff', outline:'none', cursor:'pointer' }}>
                    <option value="all">All Stock</option>
                    <option value="in-stock">In Stock</option>
                    <option value="low-stock">Low Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                </select>

                {/* Sort */}
                <select value={sortBy} onChange={e=>{setSortBy(e.target.value);setPage(1);}} style={{ padding:'7px 10px', borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:12, background:'#fff', outline:'none', cursor:'pointer' }}>
                    <option value="product_name">Sort: Name</option>
                    <option value="stock">Sort: Stock</option>
                    <option value="updated_at">Sort: Updated</option>
                </select>
                <select value={sortOrder} onChange={e=>{setSortOrder(e.target.value);setPage(1);}} style={{ padding:'7px 10px', borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:12, background:'#fff', outline:'none', cursor:'pointer' }}>
                    <option value="asc">↑ Asc</option>
                    <option value="desc">↓ Desc</option>
                </select>

                {/* Date range */}
                <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1);}} style={{ padding:'7px 10px', borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:12, outline:'none', background:'#F8FAFC' }}/>
                <input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setPage(1);}} style={{ padding:'7px 10px', borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:12, outline:'none', background:'#F8FAFC' }}/>

                {/* Refresh + Export */}
                <button onClick={loadInventory} style={{ padding:'7px 10px', borderRadius:10, border:'1.5px solid #E5E7EB', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:12 }}>
                    <RefreshCw size={12} /> Refresh
                </button>
                {hasPermission(PERMISSIONS.INVENTORY_EXPORT) && (
                    <button onClick={() => exportToCSV('current')} style={{ padding:'7px 12px', borderRadius:10, border:'none', background:'#1E3A5F', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                        <Download size={12} /> Export
                    </button>
                )}

                <span style={{ marginLeft:'auto', fontSize:11, color:'#94A3B8' }}>
                    {allItems.length} items · Page {page}/{totalPages}
                </span>
            </div>{/* end filter bar */}
            </div>{/* end fixed top section */}

            {/* ── ACTIVE STOCK REGISTRY TABLE — flex-1, only this scrolls ── */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#fff', borderRadius:14, boxShadow:'0 1px 6px rgba(0,0,0,0.05)', border:'1px solid #F1F5F9', overflow:'hidden', margin:'10px 0 0', minHeight:0 }}>
                <div style={{ padding:'12px 18px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#0F172A' }}>Active Stock Registry</span>
                    <span style={{ fontSize:11, color:'#94A3B8' }}>Showing {items.length} of {allItems.length} entries</span>
                </div>

                <div style={{ flex:1, overflowX:'auto', overflowY:'auto' }} className="scrollbar-hide">
                {loading ? (
                    <div style={{ padding:'48px', textAlign:'center', color:'#94A3B8' }}>
                        <div style={{ width:32, height:32, border:'3px solid #E5E7EB', borderTopColor:'#6366F1', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
                        Loading inventory...
                    </div>
                ) : items.length === 0 ? (
                    <div style={{ padding:'64px', textAlign:'center', color:'#94A3B8' }}>
                        <div style={{ fontSize:36, marginBottom:12 }}>📦</div>
                        <div style={{ fontSize:15, fontWeight:700, color:'#374151', marginBottom:6 }}>No inventory data found</div>
                        <button onClick={loadInventory} style={{ padding:'8px 18px', borderRadius:10, border:'none', background:'#6366F1', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>Refresh</button>
                    </div>
                ) : (
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                        <thead>
                            <tr style={{ background:'#F8FAFC', borderBottom:'1px solid #F1F5F9' }}>
                                <th style={{ padding:'10px 16px', textAlign:'left', fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.07em', whiteSpace:'nowrap' }}>PRODUCT INFO</th>
                                <th style={{ padding:'10px 16px', textAlign:'left', fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.07em', whiteSpace:'nowrap' }}>SKU IDENTIFIER</th>
                                <th style={{ padding:'10px 16px', textAlign:'center', fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.07em', whiteSpace:'nowrap' }}>CURRENT STOCK</th>
                                <th style={{ padding:'10px 16px', textAlign:'center', fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.07em', whiteSpace:'nowrap' }}>DAMAGE</th>
                                <th style={{ padding:'10px 16px', textAlign:'left', fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.07em', whiteSpace:'nowrap' }}>WAREHOUSE</th>
                                <th style={{ padding:'10px 16px', textAlign:'center', fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.07em', whiteSpace:'nowrap' }}>STATUS</th>
                                <th style={{ padding:'10px 16px', textAlign:'right', fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.07em', whiteSpace:'nowrap' }}>AUDIT</th>
                                <th style={{ padding:'10px 16px', textAlign:'center', fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.07em', whiteSpace:'nowrap' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => {
                                const stock = parseInt(item.stock || item.quantity || 0);
                                const badge = getStatusBadge(stock);
                                return (
                                    <tr key={item.id || idx} style={{ borderBottom:'1px solid #F8FAFC', transition:'background 0.1s', cursor:'pointer' }}
                                        onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'}
                                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                                    >
                                        {/* Product Info */}
                                        <td style={{ padding:'12px 16px', maxWidth:180 }}>
                                            <div style={{ fontWeight:700, color:'#0F172A', fontSize:13, lineHeight:1.3 }}>{item.product || item.product_name || 'N/A'}</div>
                                            {(item.variant || item.product_variant) && (
                                                <div style={{ fontSize:11, color:'#94A3B8', marginTop:2 }}>{item.variant || item.product_variant}</div>
                                            )}
                                        </td>
                                        {/* SKU */}
                                        <td style={{ padding:'12px 16px' }}>
                                            <span style={{ fontFamily:'monospace', fontSize:11, background:'#EEF2FF', color:'#4F46E5', padding:'3px 8px', borderRadius:6, whiteSpace:'nowrap' }}>
                                                {item.code || item.barcode || 'N/A'}
                                            </span>
                                        </td>
                                        {/* Stock */}
                                        <td style={{ padding:'12px 16px', textAlign:'center' }}>
                                            <span
                                                style={{ fontSize:18, fontWeight:900, color: stock === 0 ? '#DC2626' : stock <= 10 ? '#D97706' : '#0F172A', cursor: hasPermission(PERMISSIONS.INVENTORY_TIMELINE) ? 'pointer' : 'default' }}
                                                onClick={hasPermission(PERMISSIONS.INVENTORY_TIMELINE) ? () => openTimeline(item) : undefined}
                                                title={hasPermission(PERMISSIONS.INVENTORY_TIMELINE) ? 'View timeline' : ''}
                                            >
                                                {stock}
                                            </span>
                                            {hasPermission(PERMISSIONS.INVENTORY_EDIT) && (
                                                <button onClick={e=>{e.stopPropagation();openStockUpdateModal(item);}} style={{ marginLeft:6, background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#94A3B8' }} title="Edit stock">✏️</button>
                                            )}
                                        </td>
                                        {/* Damage */}
                                        <td style={{ padding:'12px 16px', textAlign:'center', fontSize:13, color: (item.damage_count||0)>0?'#DC2626':'#94A3B8', fontWeight: (item.damage_count||0)>0?700:400 }}>
                                            {item.damage_count || 0}
                                        </td>
                                        {/* Warehouse */}
                                        <td style={{ padding:'12px 16px' }}>
                                            <span style={{ fontSize:11, fontWeight:600, color:'#374151', background:'#F1F5F9', padding:'3px 8px', borderRadius:6 }}>
                                                {item.warehouse || item.warehouse_name || item.Warehouse_name || '—'}
                                            </span>
                                        </td>
                                        {/* Status */}
                                        <td style={{ padding:'12px 16px', textAlign:'center' }}>
                                            <span style={{ fontSize:10, fontWeight:700, color:badge.color, background:badge.bg, padding:'4px 10px', borderRadius:20 }}>{badge.label}</span>
                                        </td>
                                        {/* Audit */}
                                        <td style={{ padding:'12px 16px', textAlign:'right', fontSize:11, color:'#94A3B8', whiteSpace:'nowrap' }}>
                                            {timeAgo(item.updated_at || item.last_updated)}
                                        </td>
                                        {/* Actions */}
                                        <td style={{ padding:'12px 16px', textAlign:'center' }}>
                                            <div style={{ display:'flex', gap:4, justifyContent:'center' }}>
                                                {hasPermission(PERMISSIONS.INVENTORY_TIMELINE) && (
                                                    <button onClick={() => openTimeline(item)} style={{ padding:'4px 8px', borderRadius:6, border:'1.5px solid #E5E7EB', background:'#fff', cursor:'pointer', fontSize:10, fontWeight:600, color:'#6366F1' }} title="Timeline">
                                                        <BarChart3 size={11} />
                                                    </button>
                                                )}
                                                {hasPermission(PERMISSIONS.INVENTORY_EDIT) && (
                                                    <button onClick={() => openStockUpdateModal(item)} style={{ padding:'4px 8px', borderRadius:6, border:'1.5px solid #E5E7EB', background:'#fff', cursor:'pointer', fontSize:10, fontWeight:600, color:'#374151' }} title="Edit">
                                                        ✏️
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
                </div>

                {/* Pagination */}
                {!loading && allItems.length > 0 && (
                    <div style={{ padding:'10px 18px', borderTop:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ fontSize:11, color:'#64748B' }}>
                            Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, allItems.length)} of {allItems.length}
                        </span>
                        <div style={{ display:'flex', gap:4 }}>
                            <button onClick={()=>setPage(1)} disabled={page===1} style={{ width:28,height:28,borderRadius:6,border:'1.5px solid #E5E7EB',background:'#fff',cursor:page===1?'not-allowed':'pointer',fontSize:12,color:page===1?'#CBD5E1':'#374151' }}>⟪</button>
                            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ width:28,height:28,borderRadius:6,border:'1.5px solid #E5E7EB',background:'#fff',cursor:page===1?'not-allowed':'pointer',fontSize:12,color:page===1?'#CBD5E1':'#374151' }}>‹</button>
                            {Array.from({length:Math.min(totalPages,5)},(_,i)=>{
                                const p = totalPages<=5?i+1:page<=3?i+1:page>=totalPages-2?totalPages-4+i:page-2+i;
                                return <button key={p} onClick={()=>setPage(p)} style={{ width:28,height:28,borderRadius:6,border:'none',fontSize:12,fontWeight:600,cursor:'pointer',background:page===p?'#6366F1':'#fff',color:page===p?'#fff':'#374151',border:page===p?'none':'1.5px solid #E5E7EB' }}>{p}</button>;
                            })}
                            <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{ width:28,height:28,borderRadius:6,border:'1.5px solid #E5E7EB',background:'#fff',cursor:page===totalPages?'not-allowed':'pointer',fontSize:12,color:page===totalPages?'#CBD5E1':'#374151' }}>›</button>
                            <button onClick={()=>setPage(totalPages)} disabled={page===totalPages} style={{ width:28,height:28,borderRadius:6,border:'1.5px solid #E5E7EB',background:'#fff',cursor:page===totalPages?'not-allowed':'pointer',fontSize:12,color:page===totalPages?'#CBD5E1':'#374151' }}>⟫</button>
                        </div>
                    </div>
                )}
            </div>
            {/* Manual Stock Update Modal */}
            {showStockUpdateModal && selectedItemForUpdate && (
                <div className={styles.modalOverlay}>
                    <div className={styles.stockUpdateModal}>
                        <div className={styles.modalHeader}>
                            <h3>≡ƒôª Update Stock Manually</h3>
                            <button
                                className={styles.closeBtn}
                                onClick={closeStockUpdateModal}
                                disabled={updatingStock}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className={styles.modalContent}>
                            {/* Product Info */}
                            <div className={styles.productInfo}>
                                <div className={styles.productDetails}>
                                    <h4>{selectedItemForUpdate.product || selectedItemForUpdate.product_name || 'Product'}</h4>
                                    <p><strong>Barcode:</strong> {selectedItemForUpdate.code || selectedItemForUpdate.barcode}</p>
                                    <p><strong>Warehouse:</strong> {selectedItemForUpdate.warehouse || selectedItemForUpdate.warehouse_name}</p>
                                    <p><strong>Current Stock:</strong> <span className={styles.currentStock}>{selectedItemForUpdate.stock || selectedItemForUpdate.quantity || 0}</span></p>
                                </div>
                            </div>

                            {/* Update Type */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Update Type *</label>
                                <select
                                    value={stockUpdateType}
                                    onChange={(e) => setStockUpdateType(e.target.value)}
                                    className={styles.formSelect}
                                    disabled={updatingStock}
                                >
                                    <option value="adjustment">Stock Adjustment</option>
                                    <option value="in">Stock In (Add)</option>
                                    <option value="out">Stock Out (Remove)</option>
                                    <option value="damage">Damage</option>
                                    <option value="return">Return</option>
                                    <option value="transfer">Transfer</option>
                                </select>
                            </div>

                            {/* Quantity */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>
                                    {stockUpdateType === 'adjustment' ? 'New Stock Level *' : 'Quantity *'}
                                </label>
                                <input
                                    type="number"
                                    value={stockUpdateQuantity}
                                    onChange={(e) => setStockUpdateQuantity(e.target.value)}
                                    className={styles.formInput}
                                    placeholder={stockUpdateType === 'adjustment' ? 'Enter new stock level' : 'Enter quantity'}
                                    min="0"
                                    disabled={updatingStock}
                                />
                                {stockUpdateType !== 'adjustment' && (
                                    <div className={styles.calculatedStock}>
                                        New stock will be: {
                                            stockUpdateType === 'in' 
                                                ? (selectedItemForUpdate.stock || 0) + (parseInt(stockUpdateQuantity) || 0)
                                                : stockUpdateType === 'out'
                                                ? Math.max(0, (selectedItemForUpdate.stock || 0) - (parseInt(stockUpdateQuantity) || 0))
                                                : selectedItemForUpdate.stock || 0
                                        }
                                    </div>
                                )}
                            </div>

                            {/* Reason */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Reason *</label>
                                <select
                                    value={stockUpdateReason}
                                    onChange={(e) => setStockUpdateReason(e.target.value)}
                                    className={styles.formSelect}
                                    disabled={updatingStock}
                                >
                                    <option value="">Select reason...</option>
                                    <option value="manual_count">Manual Count</option>
                                    <option value="system_correction">System Correction</option>
                                    <option value="damaged_goods">Damaged Goods</option>
                                    <option value="returned_goods">Returned Goods</option>
                                    <option value="lost_goods">Lost Goods</option>
                                    <option value="found_goods">Found Goods</option>
                                    <option value="transfer_in">Transfer In</option>
                                    <option value="transfer_out">Transfer Out</option>
                                    <option value="supplier_return">Supplier Return</option>
                                    <option value="customer_return">Customer Return</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* Notes */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Additional Notes</label>
                                <textarea
                                    value={stockUpdateNotes}
                                    onChange={(e) => setStockUpdateNotes(e.target.value)}
                                    className={styles.formTextarea}
                                    placeholder="Enter any additional notes about this stock update..."
                                    rows="3"
                                    disabled={updatingStock}
                                />
                            </div>

                            {/* Warning for stock out */}
                            {stockUpdateType === 'out' && parseInt(stockUpdateQuantity) > (selectedItemForUpdate.stock || 0) && (
                                <div className={styles.warningMessage}>
                                    ΓÜá∩╕Å Warning: This will result in negative stock. The system will set stock to 0.
                                </div>
                            )}
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={closeStockUpdateModal}
                                disabled={updatingStock}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.updateBtn}
                                onClick={handleStockUpdate}
                                disabled={updatingStock || !stockUpdateQuantity || !stockUpdateReason}
                            >
                                {updatingStock ? (
                                    <>
                                        <div className={styles.spinner}></div>
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        ≡ƒôª Update Stock
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Use ProductTracker Component */}
            {showTimeline && selectedItem && hasPermission(PERMISSIONS.INVENTORY_TIMELINE) && (
                <ProductTracker
                    barcodeOverride={selectedItem.code || selectedItem.barcode}
                    warehouseFilter={selectedWarehouses.length === 1 ? selectedWarehouses[0] : null}
                    onClose={closeTimeline}
                />
            )}
        </div>
    );
}
