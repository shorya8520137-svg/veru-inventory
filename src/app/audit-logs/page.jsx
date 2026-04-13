'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Activity, MapPin, Clock, Filter, Search, RefreshCw } from 'lucide-react';

// Simple Badge component
const Badge = ({ children, className = '', variant = 'default' }) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    const variantClasses = {
        default: 'bg-gray-100 text-gray-800',
        outline: 'border border-gray-300 text-gray-700',
        secondary: 'bg-blue-100 text-blue-800'
    };
    
    return (
        <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
            {children}
        </span>
    );
};

// Simple Select component
const Select = ({ value, onValueChange, children, placeholder }) => {
    return (
        <select 
            value={value} 
            onChange={(e) => onValueChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
            <option value="">{placeholder}</option>
            {children}
        </select>
    );
};

const SelectItem = ({ value, children }) => {
    return <option value={value}>{children}</option>;
};

export default function AuditLogsPage() {
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(30); // seconds
    const [lastRefresh, setLastRefresh] = useState(null);
    const [filters, setFilters] = useState({
        action: '',
        resource: '',
        userId: '',
        search: '',
        page: 1,
        limit: 50
    });

    const fetchAuditLogs = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('No authentication token found. Please login again.');
                return;
            }

            const queryParams = new URLSearchParams();
            if (filters.action) queryParams.append('action', filters.action);
            if (filters.resource) queryParams.append('resource', filters.resource);
            if (filters.userId) queryParams.append('userId', filters.userId);
            if (filters.search) queryParams.append('search', filters.search);
            queryParams.append('page', filters.page.toString());
            queryParams.append('limit', filters.limit.toString());

            const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE}/api/audit-logs?${queryParams}`;
            console.log('🔍 Fetching audit logs from:', apiUrl);

            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error Response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch audit logs'}`);
            }

            const data = await response.json();
            console.log('📊 API Response:', data);
            
            if (data.success) {
                // Handle different response formats
                const logs = data.data?.logs || data.data || [];
                console.log(`✅ Found ${logs.length} audit logs`);
                setAuditLogs(logs);
                setError(null);
                setLastRefresh(new Date());
            } else {
                console.error('❌ API returned error:', data.message);
                setError(data.message || 'Failed to fetch audit logs');
            }
        } catch (err) {
            console.error('❌ Error fetching audit logs:', err);
            setError(`Failed to fetch audit logs: ${err.message}`);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditLogs();
    }, [filters]);

    // Auto-refresh effect
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchAuditLogs(false); // Don't show loading spinner for auto-refresh
        }, refreshInterval * 1000);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, filters]);

    const getActionBadgeColor = (action) => {
        switch (action) {
            case 'LOGIN': return 'bg-green-100 text-green-800 border-green-200';
            case 'LOGOUT': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'CREATE': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'UPDATE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
            case 'EDIT': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'VIEW': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getResourceIcon = (resource) => {
        switch (resource) {
            case 'SESSION': return <User className="w-4 h-4 text-blue-600" />;
            case 'DISPATCH': return <Activity className="w-4 h-4 text-green-600" />;
            case 'USER': return <User className="w-4 h-4 text-purple-600" />;
            case 'ROLE': return <User className="w-4 h-4 text-indigo-600" />;
            case 'PRODUCT': return <Activity className="w-4 h-4 text-orange-600" />;
            case 'INVENTORY': return <Activity className="w-4 h-4 text-teal-600" />;
            case 'RETURN': return <RefreshCw className="w-4 h-4 text-yellow-600" />;
            case 'DAMAGE': return <Activity className="w-4 h-4 text-red-600" />;
            case 'RECOVERY': return <Activity className="w-4 h-4 text-emerald-600" />;
            default: return <Activity className="w-4 h-4 text-gray-600" />;
        }
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    const parseDetails = (details) => {
        try {
            return typeof details === 'string' ? JSON.parse(details) : details;
        } catch {
            return details;
        }
    };

    const getLocationInfo = (log, details) => {
        // Check database columns first (after migration)
        if (log.location_country) {
            return {
                country: log.location_country,
                city: log.location_city,
                region: log.location_region,
                coordinates: log.location_coordinates,
                flag: details?.location?.flag || '🌍'
            };
        }
        
        // Check details JSON for location data
        if (details?.location) {
            return {
                country: details.location.country,
                city: details.location.city,
                region: details.location.region,
                coordinates: details.location.coordinates,
                flag: details.location.flag || '🌍',
                address: details.location.address,
                timezone: details.location.timezone,
                isp: details.location.isp
            };
        }
        
        return null;
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: 1 // Reset to first page when filtering
        }));
    };

    const clearFilters = () => {
        setFilters({
            action: '',
            resource: '',
            userId: '',
            search: '',
            page: 1,
            limit: 50
        });
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-lg">Loading audit logs...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <Card className="border-red-200">
                    <CardContent className="p-6">
                        <div className="text-center text-red-600">
                            <Activity className="w-12 h-12 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Error Loading Audit Logs</h3>
                            <p className="text-sm mb-4">{error}</p>
                            
                            {/* Debug Information */}
                            <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs">
                                <h4 className="font-semibold mb-2">Debug Information:</h4>
                                <p><strong>API Base:</strong> {process.env.NEXT_PUBLIC_API_BASE}</p>
                                <p><strong>Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
                                <p><strong>Full URL:</strong> {process.env.NEXT_PUBLIC_API_BASE}/api/audit-logs</p>
                            </div>
                            
                            <Button onClick={() => fetchAuditLogs()} className="mt-4">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
                    <p className="text-gray-600 mt-1">Complete user journey and system activity tracking</p>
                </div>
                <div className="flex items-center space-x-3">
                    {/* Auto-refresh controls */}
                    <div className="flex items-center space-x-2 text-sm">
                        <label className="flex items-center space-x-1">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="rounded"
                            />
                            <span>Auto-refresh</span>
                        </label>
                        {autoRefresh && (
                            <select
                                value={refreshInterval}
                                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                                className="px-2 py-1 border border-gray-300 rounded text-xs"
                            >
                                <option value={10}>10s</option>
                                <option value={30}>30s</option>
                                <option value={60}>1m</option>
                                <option value={300}>5m</option>
                            </select>
                        )}
                        {lastRefresh && (
                            <span className="text-gray-500 text-xs">
                                Last: {lastRefresh.toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                    <Button onClick={() => fetchAuditLogs()} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <Activity className="w-8 h-8 text-green-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Dispatches</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {auditLogs.filter(log => log.resource === 'DISPATCH').length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <RefreshCw className="w-8 h-8 text-yellow-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Returns</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {auditLogs.filter(log => log.resource === 'RETURN').length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <Activity className="w-8 h-8 text-red-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Damage Reports</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {auditLogs.filter(log => log.resource === 'DAMAGE').length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <User className="w-8 h-8 text-blue-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">User Actions</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {auditLogs.filter(log => log.resource === 'USER').length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Filter className="w-5 h-5 mr-2" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Action</label>
                            <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)} placeholder="All Actions">
                                <SelectItem value="">All Actions</SelectItem>
                                <SelectItem value="LOGIN">Login</SelectItem>
                                <SelectItem value="LOGOUT">Logout</SelectItem>
                                <SelectItem value="CREATE">Create</SelectItem>
                                <SelectItem value="UPDATE">Update</SelectItem>
                                <SelectItem value="DELETE">Delete</SelectItem>
                            </Select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-2">Resource</label>
                            <Select value={filters.resource} onValueChange={(value) => handleFilterChange('resource', value)} placeholder="All Resources">
                                <SelectItem value="">All Resources</SelectItem>
                                <SelectItem value="SESSION">Session</SelectItem>
                                <SelectItem value="DISPATCH">Dispatch</SelectItem>
                                <SelectItem value="USER">User</SelectItem>
                                <SelectItem value="ROLE">Role</SelectItem>
                                <SelectItem value="PRODUCT">Product</SelectItem>
                                <SelectItem value="INVENTORY">Inventory</SelectItem>
                                <SelectItem value="RETURN">Return</SelectItem>
                                <SelectItem value="DAMAGE">Damage</SelectItem>
                                <SelectItem value="RECOVERY">Recovery</SelectItem>
                            </Select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-2">User ID</label>
                            <Input
                                placeholder="Filter by user ID"
                                value={filters.userId}
                                onChange={(e) => handleFilterChange('userId', e.target.value)}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-2">Search</label>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <Input
                                    placeholder="Search details..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end mt-4">
                        <Button variant="outline" onClick={clearFilters}>
                            Clear Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Audit Logs */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                            <Activity className="w-5 h-5 mr-2" />
                            Audit Trail ({auditLogs.length} entries)
                            {autoRefresh && (
                                <span className="ml-3 flex items-center text-sm text-green-600">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                                    Live
                                </span>
                            )}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {auditLogs.length === 0 ? (
                        <div className="text-center py-12">
                            <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Audit Logs Found</h3>
                            <p className="text-gray-500">No audit entries match your current filters.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {auditLogs.map((log) => {
                                const details = parseDetails(log.details);
                                const locationInfo = getLocationInfo(log, details);
                                
                                return (
                                    <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    {getResourceIcon(log.resource)}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <Badge className={getActionBadgeColor(log.action)}>
                                                            {log.action}
                                                        </Badge>
                                                        <Badge variant="outline">
                                                            {log.resource}
                                                        </Badge>
                                                        {log.resource_id && (
                                                            <Badge variant="secondary">
                                                                ID: {log.resource_id}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                        <div className="flex items-center text-gray-600">
                                                            <User className="w-4 h-4 mr-1" />
                                                            <span>
                                                                User: {log.user_name || log.user_id || 'System'}
                                                                {log.user_email && (
                                                                    <span className="text-xs text-gray-500 ml-1">({log.user_email})</span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="flex items-center text-gray-600">
                                                            <MapPin className="w-4 h-4 mr-1" />
                                                            <span>
                                                                IP: {log.ip_address || 'Unknown'}
                                                                {locationInfo && (
                                                                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                                        {locationInfo.flag} {locationInfo.city}, {locationInfo.country}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="flex items-center text-gray-600">
                                                            <Clock className="w-4 h-4 mr-1" />
                                                            <span>{formatTimestamp(log.created_at)}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {details && Object.keys(details).length > 0 && (
                                                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border text-sm">
                                                            <div className="font-medium text-gray-700 mb-3 flex items-center">
                                                                <Activity className="w-4 h-4 mr-1" />
                                                                Operation Details:
                                                            </div>
                                                            
                                                            {/* Special formatting for different resource types */}
                                                            {log.resource === 'DISPATCH' && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                                    {details.customer && (
                                                                        <div className="flex items-center">
                                                                            <span className="font-medium text-blue-600 mr-2">👥 Customer:</span>
                                                                            <span className="text-gray-800">{details.customer}</span>
                                                                        </div>
                                                                    )}
                                                                    {details.product_name && (
                                                                        <div className="flex items-center">
                                                                            <span className="font-medium text-green-600 mr-2">📦 Product:</span>
                                                                            <span className="text-gray-800">{details.product_name}</span>
                                                                        </div>
                                                                    )}
                                                                    {details.quantity && (
                                                                        <div className="flex items-center">
                                                                            <span className="font-medium text-purple-600 mr-2">🔢 Quantity:</span>
                                                                            <span className="text-gray-800">{details.quantity}</span>
                                                                        </div>
                                                                    )}
                                                                    {details.warehouse && (
                                                                        <div className="flex items-center">
                                                                            <span className="font-medium text-orange-600 mr-2">🏢 Warehouse:</span>
                                                                            <span className="text-gray-800">{details.warehouse}</span>
                                                                        </div>
                                                                    )}
                                                                    {details.awb_number && (
                                                                        <div className="flex items-center">
                                                                            <span className="font-medium text-indigo-600 mr-2">📮 AWB:</span>
                                                                            <span className="text-gray-800">{details.awb_number}</span>
                                                                        </div>
                                                                    )}
                                                                    {details.logistics && (
                                                                        <div className="flex items-center">
                                                                            <span className="font-medium text-teal-600 mr-2">🚚 Logistics:</span>
                                                                            <span className="text-gray-800">{details.logistics}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            
                                                            {log.resource === 'DAMAGE' && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                                    {details.product_name && (
                                                                        <div className="flex items-center">
                                                                            <span className="font-medium text-red-600 mr-2">📦 Damaged Product:</span>
                                                                            <span className="text-gray-800">{details.product_name}</span>
                                                                        </div>
                                                                    )}
                                                                    {details.quantity && (
                                                                        <div className="flex items-center">
                                                                            <span className="font-medium text-red-600 mr-2">🔢 Damaged Qty:</span>
                                                                            <span className="text-gray-800">{details.quantity}</span>
                                                                        </div>
                                                                    )}
                                                                    {details.location && (
                                                                        <div className="flex items-center">
                                                                            <span className="font-medium text-red-600 mr-2">📍 Location:</span>
                                                                            <span className="text-gray-800">{details.location}</span>
                                                                        </div>
                                                                    )}
                                                                    {details.reason && (
                                                                        <div className="flex items-center">
                                                                            <span className="font-medium text-red-600 mr-2">❓ Reason:</span>
                                                                            <span className="text-gray-800">{details.reason}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            
                                                            {log.resource === 'RETURN' && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                                    {details.product_name && (
                                                                        <div className="flex items-center">
                                                                            <span className="font-medium text-yellow-600 mr-2">📦 Returned Product:</span>
                                                                            <span className="text-gray-800">{details.product_name}</span>
                                                                        </div>
                                                                    )}
                                                                    {details.quantity && (
                                                                        <div className="flex items-center">
                                                                            <span className="font-medium text-yellow-600 mr-2">🔢 Returned Qty:</span>
                                                                            <span className="text-gray-800">{details.quantity}</span>
                                                                        </div>
                                                                    )}
                                                                    {details.awb && (
                                                                        <div className="flex items-center">
                                                                            <span className="font-medium text-yellow-600 mr-2">📮 Return AWB:</span>
                                                                            <span className="text-gray-800">{details.awb}</span>
                                                                        </div>
                                                                    )}
                                                                    {details.reason && (
                                                                        <div className="flex items-center">
                                                                            <span className="font-medium text-yellow-600 mr-2">❓ Return Reason:</span>
                                                                            <span className="text-gray-800">{details.reason}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            
                                                            {log.resource === 'PRODUCT' && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                                    {details.product_name && (
                                                                        <div className="flex items-center">
                                                                            <span className="font-medium text-orange-600 mr-2">📦 Product:</span>
                                                                            <span className="text-gray-800">{details.product_name}</span>
                                                                        </div>
                                                                    )}
                                                                    {details.barcode && (
                                                                        <div className="flex items-center">
                                                                            <span className="font-medium text-orange-600 mr-2">🏷️ Barcode:</span>
                                                                            <span className="text-gray-800">{details.barcode}</span>
                                                                        </div>
                                                                    )}
                                                                    {details.category && (
                                                                        <div className="flex items-center">
                                                                            <span className="font-medium text-orange-600 mr-2">📂 Category:</span>
                                                                            <span className="text-gray-800">{details.category}</span>
                                                                        </div>
                                                                    )}
                                                                    {details.price && (
                                                                        <div className="flex items-center">
                                                                            <span className="font-medium text-orange-600 mr-2">💰 Price:</span>
                                                                            <span className="text-gray-800">{details.price}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            
                                                            {log.resource === 'INVENTORY' && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                                    {details.product_name && (
                                                                        <div className="flex items-center">
                                                                            <span className="font-medium text-teal-600 mr-2">📦 Product:</span>
                                                                            <span className="text-gray-800">{details.product_name}</span>
                                                                        </div>
                                                                    )}
                                                                    {details.warehouse && (
                                                                        <div className="flex items-center">
                                                                            <span className="font-medium text-teal-600 mr-2">🏢 Warehouse:</span>
                                                                            <span className="text-gray-800">{details.warehouse}</span>
                                                                        </div>
                                                                    )}
                                                                    {details.quantity && (
                                                                        <div className="flex items-center">
                                                                            <span className="font-medium text-teal-600 mr-2">🔢 Quantity:</span>
                                                                            <span className="text-gray-800">{details.quantity}</span>
                                                                        </div>
                                                                    )}
                                                                    {details.source_type && (
                                                                        <div className="flex items-center">
                                                                            <span className="font-medium text-teal-600 mr-2">📋 Source:</span>
                                                                            <span className="text-gray-800">{details.source_type}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            
                                                            {/* Show all other details */}
                                                            <div className="border-t pt-3">
                                                                <div className="text-xs text-gray-500 mb-2">All Details:</div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                    {Object.entries(details).map(([key, value]) => (
                                                                        <div key={key} className="flex text-xs">
                                                                            <span className="font-medium text-gray-500 mr-2 min-w-0 truncate">{key}:</span>
                                                                            <span className="text-gray-700 break-all">
                                                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Location Information Section */}
                                                            {locationInfo && (
                                                                <div className="border-t pt-3 mt-3">
                                                                    <div className="text-xs text-gray-500 mb-2 flex items-center">
                                                                        <MapPin className="w-3 h-3 mr-1" />
                                                                        Location Information:
                                                                    </div>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                        {locationInfo.country && (
                                                                            <div className="flex items-center text-sm">
                                                                                <span className="font-medium text-blue-600 mr-2">
                                                                                    {locationInfo.flag} Country:
                                                                                </span>
                                                                                <span className="text-gray-800">
                                                                                    {locationInfo.country}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {locationInfo.city && (
                                                                            <div className="flex items-center text-sm">
                                                                                <span className="font-medium text-green-600 mr-2">🏙️ City:</span>
                                                                                <span className="text-gray-800">
                                                                                    {locationInfo.city}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {locationInfo.region && (
                                                                            <div className="flex items-center text-sm">
                                                                                <span className="font-medium text-purple-600 mr-2">🗺️ Region:</span>
                                                                                <span className="text-gray-800">
                                                                                    {locationInfo.region}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {locationInfo.address && (
                                                                            <div className="flex items-center text-sm">
                                                                                <span className="font-medium text-orange-600 mr-2">📍 Address:</span>
                                                                                <span className="text-gray-800">{locationInfo.address}</span>
                                                                            </div>
                                                                        )}
                                                                        {locationInfo.coordinates && (
                                                                            <div className="flex items-center text-sm">
                                                                                <span className="font-medium text-red-600 mr-2">🎯 Coordinates:</span>
                                                                                <span className="text-gray-800 font-mono text-xs">
                                                                                    {locationInfo.coordinates}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {locationInfo.timezone && (
                                                                            <div className="flex items-center text-sm">
                                                                                <span className="font-medium text-indigo-600 mr-2">🕐 Timezone:</span>
                                                                                <span className="text-gray-800">{locationInfo.timezone}</span>
                                                                            </div>
                                                                        )}
                                                                        {locationInfo.isp && (
                                                                            <div className="flex items-center text-sm">
                                                                                <span className="font-medium text-teal-600 mr-2">🌐 ISP:</span>
                                                                                <span className="text-gray-800">{locationInfo.isp}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}