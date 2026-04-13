// API Utility Functions for JWT Authentication

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

if (!API_BASE) {
    throw new Error('NEXT_PUBLIC_API_BASE environment variable is required');
}

/**
 * Get JWT token from localStorage
 */
export const getToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
};

/**
 * Get user data from localStorage
 */
export const getUser = () => {
    if (typeof window !== 'undefined') {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
    return null;
};

/**
 * Remove token and user data (logout)
 */
export const clearAuth = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
    return !!getToken();
};

/**
 * Make authenticated API request
 */
export const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();
    const url = `${API_BASE}${endpoint}`;
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    };

    try {
        const response = await fetch(url, config);
        
        // Handle 401 Unauthorized - redirect to login
        if (response.status === 401) {
            clearAuth();
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
            throw new Error('Authentication required');
        }

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
};

/**
 * API Methods
 */
export const api = {
    // Authentication
    login: (credentials) => 
        fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        }).then(res => res.json()),
    
    getCurrentUser: () => apiRequest('/api/auth/me'),
    
    logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
    
    // Products
    getProducts: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/api/products${query ? `?${query}` : ''}`);
    },
    
    createProduct: (product) => 
        apiRequest('/api/products', {
            method: 'POST',
            body: JSON.stringify(product),
        }),
    
    updateProduct: (id, product) => 
        apiRequest(`/api/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(product),
        }),
    
    deleteProduct: (id) => 
        apiRequest(`/api/products/${id}`, { method: 'DELETE' }),
    
    // Inventory
    getInventory: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/api/inventory${query ? `?${query}` : ''}`);
    },
    
    // Dispatch
    getDispatches: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/api/dispatch${query ? `?${query}` : ''}`);
    },
    
    createDispatch: (dispatch) => 
        apiRequest('/api/dispatch', {
            method: 'POST',
            body: JSON.stringify(dispatch),
        }),
    
    // Order Tracking
    getOrderTracking: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/api/order-tracking${query ? `?${query}` : ''}`);
    },
    
    updateOrderStatus: (id, status) => 
        apiRequest(`/api/order-tracking/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),
    
    deleteOrder: (id) => 
        apiRequest(`/api/order-tracking/${id}`, { method: 'DELETE' }),
    
    // Self Transfer
    getSelfTransfers: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/api/self-transfer${query ? `?${query}` : ''}`);
    },
    
    createSelfTransfer: (transfer) => 
        apiRequest('/api/self-transfer', {
            method: 'POST',
            body: JSON.stringify(transfer),
        }),
    
    // Bulk Upload
    bulkUpload: (formData) => 
        apiRequest('/api/bulk-upload', {
            method: 'POST',
            headers: {}, // Let browser set Content-Type for FormData
            body: formData,
        }),
    
    // Damage Recovery
    getDamageRecovery: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/api/damage-recovery${query ? `?${query}` : ''}`);
    },
    
    createDamageRecord: (damage) => 
        apiRequest('/api/damage-recovery', {
            method: 'POST',
            body: JSON.stringify(damage),
        }),
    
    // Returns
    getReturns: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/api/returns${query ? `?${query}` : ''}`);
    },
    
    createReturn: (returnData) => 
        apiRequest('/api/returns', {
            method: 'POST',
            body: JSON.stringify(returnData),
        }),
    
    // Timeline
    getTimeline: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/api/timeline${query ? `?${query}` : ''}`);
    },
    
    // Permissions Management
    getUsers: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/api/users${query ? `?${query}` : ''}`);
    },
    
    createUser: (user) => 
        apiRequest('/api/users', {
            method: 'POST',
            body: JSON.stringify(user),
        }),
    
    updateUser: (id, user) => 
        apiRequest(`/api/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(user),
        }),
    
    deleteUser: (id) => 
        apiRequest(`/api/users/${id}`, { method: 'DELETE' }),
    
    // User Profile Management
    getUserProfile: () => apiRequest('/api/users/profile'),
    
    updateUserProfile: (formData) => {
        const token = getToken();
        return fetch(`${API_BASE}/api/users/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData // FormData for file upload
        }).then(response => response.json());
    },
    
    getRoles: () => apiRequest('/api/roles'),
    
    createRole: (role) => 
        apiRequest('/api/roles', {
            method: 'POST',
            body: JSON.stringify(role),
        }),
    
    updateRole: (id, role) => 
        apiRequest(`/api/roles/${id}`, {
            method: 'PUT',
            body: JSON.stringify(role),
        }),
    
    deleteRole: (id) => 
        apiRequest(`/api/roles/${id}`, { method: 'DELETE' }),
    
    getPermissions: () => apiRequest('/api/permissions'),
    
    getRolePermissions: (roleId) => 
        apiRequest(`/api/roles/${roleId}/permissions`),
    
    updateRolePermissions: (roleId, permissionIds) => 
        apiRequest(`/api/roles/${roleId}/permissions`, {
            method: 'PUT',
            body: JSON.stringify({ permissionIds }),
        }),
    
    getAuditLogs: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/api/audit-logs${query ? `?${query}` : ''}`);
    },
    
    getSystemStats: () => apiRequest('/api/system/stats'),
};

// Legacy function - use checkAPIHealth from src/services/api instead
export async function testConnection() {
    console.warn('DEPRECATED: Use checkAPIHealth from @/services/api instead');
    try {
        const response = await fetch(`${API_BASE}/api/health`);
        return await response.json();
    } catch (error) {
        throw new Error(`Connection failed: ${error.message}`);
    }
}

export default api;