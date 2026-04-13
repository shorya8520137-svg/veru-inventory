import { apiRequest } from './index';

export const websiteProductsAPI = {
    /**
     * Get all products with pagination and filters
     * @param {Object} params - Query parameters
     * @returns {Promise} Products list with pagination
     */
    async getProducts(params = {}) {
        const queryParams = new URLSearchParams();
        
        Object.keys(params).forEach(key => {
            if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
                queryParams.append(key, params[key]);
            }
        });

        const endpoint = `/website/products${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        return apiRequest(endpoint);
    },

    /**
     * Get single product by ID
     * @param {number} productId - Product ID
     * @returns {Promise} Product details
     */
    async getProduct(productId) {
        return apiRequest(`/website/products/${productId}`);
    },

    /**
     * Create new product
     * @param {Object} productData - Product data
     * @returns {Promise} Created product
     */
    async createProduct(productData) {
        return apiRequest('/website/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    },

    /**
     * Update existing product
     * @param {number} productId - Product ID
     * @param {Object} productData - Updated product data
     * @returns {Promise} Update result
     */
    async updateProduct(productId, productData) {
        return apiRequest(`/website/products/${productId}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    },

    /**
     * Delete product (soft delete)
     * @param {number} productId - Product ID
     * @returns {Promise} Delete result
     */
    async deleteProduct(productId) {
        return apiRequest(`/website/products/${productId}`, {
            method: 'DELETE'
        });
    },

    /**
     * Get all categories
     * @returns {Promise} Categories list
     */
    async getCategories() {
        return apiRequest('/website/categories');
    },

    /**
     * Create new category
     * @param {Object} categoryData - Category data
     * @returns {Promise} Created category
     */
    async createCategory(categoryData) {
        return apiRequest('/website/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
    },

    /**
     * Update existing category
     * @param {number} categoryId - Category ID
     * @param {Object} categoryData - Updated category data
     * @returns {Promise} Update result
     */
    async updateCategory(categoryId, categoryData) {
        return apiRequest(`/website/categories/${categoryId}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData)
        });
    },

    /**
     * Delete category
     * @param {number} categoryId - Category ID
     * @returns {Promise} Delete result
     */
    async deleteCategory(categoryId) {
        return apiRequest(`/website/categories/${categoryId}`, {
            method: 'DELETE'
        });
    },

    /**
     * Get featured products
     * @param {number} limit - Number of products to fetch
     * @returns {Promise} Featured products
     */
    async getFeaturedProducts(limit = 10) {
        return apiRequest(`/website/products/featured?limit=${limit}`);
    },

    /**
     * Bulk upload products from CSV
     * @param {File} csvFile - CSV file
     * @returns {Promise} Upload result with upload ID
     */
    async bulkUpload(csvFile) {
        const formData = new FormData();
        formData.append('csvFile', csvFile);

        // Get token for authorization
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/website/products/bulk-upload`, {
            method: 'POST',
            headers: {
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Upload failed: ${response.status}`);
        }

        return await response.json();
    },

    /**
     * Get bulk upload status
     * @param {number} uploadId - Upload ID
     * @returns {Promise} Upload status
     */
    async getBulkUploadStatus(uploadId) {
        return apiRequest(`/website/bulk-upload/${uploadId}/status`);
    },

    /**
     * Search products
     * @param {string} query - Search query
     * @param {Object} filters - Additional filters
     * @returns {Promise} Search results
     */
    async searchProducts(query, filters = {}) {
        const params = {
            search: query,
            ...filters
        };
        return this.getProducts(params);
    },

    /**
     * Get products by category
     * @param {string} categorySlug - Category slug
     * @param {Object} params - Additional parameters
     * @returns {Promise} Products in category
     */
    async getProductsByCategory(categorySlug, params = {}) {
        return this.getProducts({
            category: categorySlug,
            ...params
        });
    },

    /**
     * Get low stock products
     * @param {number} threshold - Stock threshold
     * @returns {Promise} Low stock products
     */
    async getLowStockProducts(threshold = 10) {
        return this.getProducts({
            maxStock: threshold,
            sortBy: 'stock_quantity',
            sortOrder: 'ASC'
        });
    },

    /**
     * Toggle product featured status
     * @param {number} productId - Product ID
     * @param {boolean} featured - Featured status
     * @returns {Promise} Update result
     */
    async toggleFeatured(productId, featured) {
        return this.updateProduct(productId, { is_featured: featured });
    },

    /**
     * Toggle product active status
     * @param {number} productId - Product ID
     * @param {boolean} active - Active status
     * @returns {Promise} Update result
     */
    async toggleActive(productId, active) {
        return this.updateProduct(productId, { is_active: active });
    },

    /**
     * Update product stock
     * @param {number} productId - Product ID
     * @param {number} quantity - New stock quantity
     * @returns {Promise} Update result
     */
    async updateStock(productId, quantity) {
        return this.updateProduct(productId, { stock_quantity: quantity });
    },

    /**
     * Update product pricing
     * @param {number} productId - Product ID
     * @param {Object} pricing - Pricing data {price, offer_price}
     * @returns {Promise} Update result
     */
    async updatePricing(productId, pricing) {
        return this.updateProduct(productId, pricing);
    },

    /**
     * Get product statistics
     * @returns {Promise} Product statistics
     */
    async getStatistics() {
        // This would need to be implemented in the backend
        return apiRequest('/website/products/statistics');
    },

    /**
     * Export products to CSV
     * @param {Object} filters - Export filters
     * @returns {Promise} Export result
     */
    async exportProducts(filters = {}) {
        const queryParams = new URLSearchParams();
        
        Object.keys(filters).forEach(key => {
            if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
                queryParams.append(key, filters[key]);
            }
        });
        
        queryParams.append('export', 'true');

        // Get token for authorization
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE}/api/website/products?${queryParams.toString()}`,
            {
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Export failed: ${response.status}`);
        }

        // Return blob for download
        return await response.blob();
    },

    /**
     * Validate CSV file before upload
     * @param {File} csvFile - CSV file to validate
     * @returns {Promise} Validation result
     */
    async validateCSV(csvFile) {
        // Client-side validation
        return new Promise((resolve, reject) => {
            if (!csvFile) {
                reject(new Error('No file provided'));
                return;
            }

            if (!csvFile.name.toLowerCase().endsWith('.csv')) {
                reject(new Error('File must be a CSV file'));
                return;
            }

            if (csvFile.size > 10 * 1024 * 1024) { // 10MB
                reject(new Error('File size must be less than 10MB'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const csv = e.target.result;
                const lines = csv.split('\n');
                
                if (lines.length < 2) {
                    reject(new Error('CSV file must have at least a header and one data row'));
                    return;
                }

                const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
                const requiredHeaders = ['product_name', 'price', 'category_name'];
                
                const missingHeaders = requiredHeaders.filter(header => 
                    !headers.some(h => h.includes(header))
                );

                if (missingHeaders.length > 0) {
                    reject(new Error(`Missing required columns: ${missingHeaders.join(', ')}`));
                    return;
                }

                resolve({
                    valid: true,
                    rowCount: lines.length - 1,
                    headers: headers
                });
            };

            reader.onerror = () => {
                reject(new Error('Failed to read CSV file'));
            };

            reader.readAsText(csvFile);
        });
    }
};

// Export for use in components
export default websiteProductsAPI;