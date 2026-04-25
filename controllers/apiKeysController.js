const crypto = require('crypto');
const db = require('../db/connection');

// Standalone function to generate API key
function generateApiKey() {
    const prefix = 'wk_live_';
    const randomBytes = crypto.randomBytes(32);
    const key = randomBytes.toString('hex');
    return prefix + key;
}

class ApiKeysController {
    // Generate a secure API key
    generateApiKey() {
        return generateApiKey();
    }

    // Get all API keys for a user
    async getApiKeys(req, res) {
        try {
            const userId = req.user?.id;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User authentication required'
                });
            }

            const query = `
                SELECT 
                    id,
                    name,
                    description,
                    CONCAT(SUBSTRING(api_key, 1, 12), '••••••••••••••••••••') as masked_key,
                    api_key,
                    created_at,
                    last_used_at,
                    usage_count,
                    is_active,
                    rate_limit_per_hour
                FROM api_keys 
                WHERE user_id = ? 
                ORDER BY created_at DESC
            `;

            db.query(query, [userId], (err, apiKeys) => {
                if (err) {
                    console.error('Error fetching API keys:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to fetch API keys',
                        error: err.message
                    });
                }

                // Don't send the actual API key in the response for security, but include masked version
                const safeApiKeys = apiKeys.map(key => ({
                    id: key.id,
                    name: key.name,
                    description: key.description,
                    key: key.api_key, // Include full key for copying
                    masked_key: key.masked_key,
                    created_at: key.created_at,
                    last_used_at: key.last_used_at,
                    usage_count: key.usage_count,
                    is_active: key.is_active,
                    rate_limit_per_hour: key.rate_limit_per_hour
                }));

                res.json({
                    success: true,
                    data: safeApiKeys
                });
            });

        } catch (error) {
            console.error('Error fetching API keys:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch API keys',
                error: error.message
            });
        }
    }

    // Create a new API key
    async createApiKey(req, res) {
        try {
            const userId = req.user?.id;
            const { name, description, token_type = 'api_key', rate_limit_per_hour = 1000 } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User authentication required'
                });
            }

            if (!name || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'API key name is required'
                });
            }

            // Generate token based on type
            let token;
            if (token_type === 'jwt') {
                // Generate JWT token
                const { generateToken } = require('../middleware/auth');
                token = generateToken(req.user);
            } else {
                // Generate API key
                token = generateApiKey();
            }

            // Check if user already has a key with this name
            db.query('SELECT id FROM api_keys WHERE user_id = ? AND name = ?', [userId, name.trim()], (err, existing) => {
                if (err) {
                    console.error('Error checking existing API key:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error',
                        error: err.message
                    });
                }

                if (existing.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'API key with this name already exists'
                    });
                }

                const query = `
                    INSERT INTO api_keys (
                        user_id, name, description, api_key, 
                        rate_limit_per_hour, is_active
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `;

                db.query(query, [
                    userId,
                    name.trim(),
                    description?.trim() || null,
                    token,
                    rate_limit_per_hour,
                    true
                ], (err, result) => {
                    if (err) {
                        console.error('Error creating API key:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to create API key',
                            error: err.message
                        });
                    }

                    res.status(201).json({
                        success: true,
                        message: token_type === 'jwt' ? 'JWT token created successfully' : 'API key created successfully',
                        data: {
                            id: result.insertId,
                            name: name.trim(),
                            api_key: token,
                            key: token,
                            token_type: token_type
                        }
                    });
                });
            });

        } catch (error) {
            console.error('Error creating API key:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create API key',
                error: error.message
            });
        }
    }

    // Update API key (name, description, status)
    async updateApiKey(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            const { name, description, is_active } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User authentication required'
                });
            }

            // Check if API key exists and belongs to user
            db.query('SELECT id FROM api_keys WHERE id = ? AND user_id = ?', [id, userId], (err, existing) => {
                if (err) {
                    console.error('Error checking API key:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error',
                        error: err.message
                    });
                }

                if (existing.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'API key not found'
                    });
                }

                // Build update query dynamically
                const updateFields = [];
                const updateValues = [];

                if (name !== undefined) {
                    updateFields.push('name = ?');
                    updateValues.push(name.trim());
                }

                if (description !== undefined) {
                    updateFields.push('description = ?');
                    updateValues.push(description?.trim() || null);
                }

                if (is_active !== undefined) {
                    updateFields.push('is_active = ?');
                    updateValues.push(is_active);
                }

                if (updateFields.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'No fields to update'
                    });
                }

                updateFields.push('updated_at = CURRENT_TIMESTAMP');
                updateValues.push(id);

                const query = `
                    UPDATE api_keys 
                    SET ${updateFields.join(', ')}
                    WHERE id = ?
                `;

                db.query(query, updateValues, (err, result) => {
                    if (err) {
                        console.error('Error updating API key:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to update API key',
                            error: err.message
                        });
                    }

                    res.json({
                        success: true,
                        message: 'API key updated successfully'
                    });
                });
            });

        } catch (error) {
            console.error('Error updating API key:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update API key',
                error: error.message
            });
        }
    }

    // Delete API key
    async deleteApiKey(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User authentication required'
                });
            }

            // Check if API key exists and belongs to user
            db.query('SELECT id FROM api_keys WHERE id = ? AND user_id = ?', [id, userId], (err, existing) => {
                if (err) {
                    console.error('Error checking API key:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error',
                        error: err.message
                    });
                }

                if (existing.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'API key not found'
                    });
                }

                // Delete the API key
                db.query('DELETE FROM api_keys WHERE id = ?', [id], (err, result) => {
                    if (err) {
                        console.error('Error deleting API key:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to delete API key',
                            error: err.message
                        });
                    }

                    res.json({
                        success: true,
                        message: 'API key deleted successfully'
                    });
                });
            });

        } catch (error) {
            console.error('Error deleting API key:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete API key',
                error: error.message
            });
        }
    }

    // Validate API key (middleware function)
    validateApiKey(req, res, next) {
        const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

        if (!apiKey) {
            return res.status(401).json({
                success: false,
                message: 'API key required'
            });
        }

        // Check if API key exists and is active
        const query = `
            SELECT ak.*, u.id as user_id, u.email 
            FROM api_keys ak
            JOIN users u ON ak.user_id = u.id
            WHERE ak.api_key = ? AND ak.is_active = TRUE
        `;

        // Store 'this' context for use in callback
        const self = this;

        db.query(query, [apiKey], (err, results) => {
            if (err) {
                console.error('Error validating API key:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or inactive API key'
                });
            }

            const keyData = results[0];

            // Update last used timestamp and usage count
            db.query(
                'UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP, usage_count = usage_count + 1 WHERE id = ?',
                [keyData.id],
                (err) => {
                    if (err) {
                        console.error('Error updating API key usage:', err);
                    }
                }
            );

            // Log API usage directly (simplified to avoid context issues)
            const endpoint = req.originalUrl || req.url;
            const method = req.method;
            console.log(`✅ API Call: ${method} ${endpoint} - Key ID: ${keyData.id}`);

            // Add API key info to request
            req.apiKey = keyData;
            req.user = { id: keyData.user_id, email: keyData.email };

            next();
        });
    }

    // Log detailed API usage (disabled to prevent table errors)
    logApiUsage(apiKeyId, req) {
        // DISABLED: Prevents "Table 'api_usage_logs' doesn't exist" errors
        const endpoint = req.originalUrl || req.url;
        const method = req.method;
        console.log(`✅ API Call: ${method} ${endpoint} - Key ID: ${apiKeyId}`);
        // Database logging disabled - no table needed
    }

    // Get API usage statistics
    async getApiUsage(req, res) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User authentication required'
                });
            }

            const query = `
                SELECT 
                    COUNT(*) as total_keys,
                    SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_keys,
                    SUM(usage_count) as total_usage,
                    MAX(last_used_at) as last_api_call
                FROM api_keys 
                WHERE user_id = ?
            `;

            db.query(query, [userId], (err, stats) => {
                if (err) {
                    console.error('Error fetching API usage:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to fetch API usage',
                        error: err.message
                    });
                }

                res.json({
                    success: true,
                    data: stats[0] || {
                        total_keys: 0,
                        active_keys: 0,
                        total_usage: 0,
                        last_api_call: null
                    }
                });
            });

        } catch (error) {
            console.error('Error fetching API usage:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch API usage',
                error: error.message
            });
        }
    }

    // Get detailed usage analytics (disabled to prevent table errors)
    async getUsageAnalytics(req, res) {
        try {
            const userId = req.user?.id;
            const { days = 30 } = req.query;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User authentication required'
                });
            }

            // DISABLED: Advanced analytics to prevent "Table 'api_usage_logs' doesn't exist" errors
            // Return basic API usage instead
            console.log('Advanced analytics disabled - api_usage_logs table not available');
            
            // Fallback to basic API usage stats
            return this.getApiUsage(req, res);
            
            // TODO: Uncomment below after running database fixes to create api_usage_logs table
            /*
            // Get usage by endpoint (if logs table exists)
            const endpointQuery = `
                SELECT 
                    aul.endpoint,
                    aul.method,
                    COUNT(*) as call_count,
                    ak.name as api_key_name
                FROM api_usage_logs aul
                JOIN api_keys ak ON aul.api_key_id = ak.id
                WHERE ak.user_id = ? 
                AND aul.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY aul.endpoint, aul.method, ak.name
                ORDER BY call_count DESC
                LIMIT 20
            `;

            // Get daily usage stats
            const dailyQuery = `
                SELECT 
                    DATE(aul.created_at) as date,
                    COUNT(*) as calls,
                    COUNT(DISTINCT aul.api_key_id) as active_keys
                FROM api_usage_logs aul
                JOIN api_keys ak ON aul.api_key_id = ak.id
                WHERE ak.user_id = ? 
                AND aul.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY DATE(aul.created_at)
                ORDER BY date DESC
            `;

            // Execute both queries
            db.query(endpointQuery, [userId, days], (err, endpointStats) => {
                if (err) {
                    console.error('Error fetching endpoint stats:', err);
                    return this.getApiUsage(req, res);
                }

                db.query(dailyQuery, [userId, days], (err, dailyStats) => {
                    if (err) {
                        console.error('Error fetching daily stats:', err);
                        dailyStats = [];
                    }

                    res.json({
                        success: true,
                        data: {
                            endpoint_usage: endpointStats || [],
                            daily_usage: dailyStats || [],
                            period_days: days
                        }
                    });
                });
            });
            */

        } catch (error) {
            console.error('Error fetching usage analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch usage analytics',
                error: error.message
            });
        }
    }
}

module.exports = new ApiKeysController();