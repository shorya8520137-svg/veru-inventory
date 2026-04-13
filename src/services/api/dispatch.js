/**
 * Dispatch API Service
 * Handles warehouse dispatch operations
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

/**
 * Get JWT token from localStorage
 */
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

/**
 * Create new dispatch
 */
export const createDispatch = async (dispatchData) => {
    const response = await fetch(`${API_BASE}/dispatch`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dispatchData)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create dispatch');
    }

    return response.json();
};

/**
 * Get dispatches with filters
 */
export const getDispatches = async (filters = {}) => {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
            params.append(key, filters[key]);
        }
    });

    const response = await fetch(`${API_BASE}/dispatch?${params}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch dispatches');
    }

    return response.json();
};

/**
 * Update dispatch status
 */
export const updateDispatchStatus = async (dispatchId, statusData) => {
    const response = await fetch(`${API_BASE}/dispatch/${dispatchId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(statusData)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update dispatch status');
    }

    return response.json();
};

/**
 * Get product suggestions for dispatch
 */
export const getProductSuggestions = async (search, warehouse = null) => {
    const params = new URLSearchParams({ search });
    if (warehouse) params.append('warehouse', warehouse);

    const response = await fetch(`${API_BASE}/dispatch/suggestions/products?${params}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch product suggestions');
    }

    return response.json();
};

/**
 * Get warehouse suggestions
 */
export const getWarehouseSuggestions = async () => {
    const response = await fetch(`${API_BASE}/dispatch/suggestions/warehouses`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch warehouse suggestions');
    }

    return response.json();
};
