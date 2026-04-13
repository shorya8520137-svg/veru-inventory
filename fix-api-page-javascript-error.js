#!/usr/bin/env node

/**
 * Fix API Page JavaScript Error
 * Creates a simplified version of the API page without template literals
 */

const fs = require('fs');
const path = require('path');

const apiPagePath = path.join(__dirname, 'src/app/api/page.jsx');

const fixedApiPageContent = `'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import styles from './api.module.css';

const ApiPage = () => {
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [generatedKey, setGeneratedKey] = useState('');
    const [showKeyModal, setShowKeyModal] = useState(false);

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://54.169.31.95:8443';

    useEffect(() => {
        try {
            fetchApiKeys();
        } catch (error) {
            console.error('Error in useEffect:', error);
            setError('Failed to initialize API page');
            setLoading(false);
        }
    }, []);

    const fetchApiKeys = async () => {
        try {
            setError('');
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Please login to manage API keys');
                setLoading(false);
                return;
            }

            const response = await fetch(API_BASE + '/api/api-keys', {
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json',
                    'X-API-Key': token
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setApiKeys(data.data || []);
                } else {
                    throw new Error(data.message || 'Failed to fetch API keys');
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'HTTP ' + response.status + ': Failed to fetch API keys');
            }
        } catch (error) {
            console.error('Error fetching API keys:', error);
            setError('Failed to load API keys: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateKey = async () => {
        if (!newKeyName.trim()) {
            setError('API key name is required');
            return;
        }

        try {
            setError('');
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Please login to create API keys');
                return;
            }

            const response = await fetch(API_BASE + '/api/api-keys', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json',
                    'X-API-Key': token
                },
                body: JSON.stringify({
                    name: newKeyName,
                    description: 'API access token'
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setGeneratedKey(data.data.key || data.data.api_key);
                setShowKeyModal(true);
                setShowCreateModal(false);
                setNewKeyName('');
                setSuccess('API key created successfully!');
                fetchApiKeys();
            } else {
                throw new Error(data.message || 'HTTP ' + response.status + ': Failed to create API key');
            }
        } catch (error) {
            console.error('Error creating API key:', error);
            setError('Failed to create API key: ' + error.message);
        }
    };

    const handleDeleteKey = async (id) => {
        if (!confirm('Delete this API key? This cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_BASE + '/api/api-keys/' + id, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json',
                    'X-API-Key': token
                }
            });

            if (response.ok) {
                setApiKeys(apiKeys.filter(key => key.id !== id));
                setSuccess('API key deleted');
            } else {
                throw new Error('Failed to delete API key');
            }
        } catch (error) {
            console.error('Error deleting API key:', error);
            setError('Failed to delete API key');
        }
    };

    const copyToClipboard = (text) => {
        if (!text || text === 'undefined') {
            setError('No text to copy');
            return;
        }
        navigator.clipboard.writeText(text);
        setSuccess('Copied to clipboard!');
        setTimeout(() => setSuccess(''), 2000);
    };

    const maskApiKey = (key) => {
        if (!key || key === 'undefined') return 'No key available';
        if (key.length <= 12) return key;
        return key.substring(0, 12) + '••••••••••••••••••••';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>API Access</h1>
                <p>Generate tokens to access your data via API</p>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className={styles.createBtn}
                >
                    <Plus size={16} />
                    Generate Token
                </button>
            </div>

            {success && <div className={styles.success}>{success}</div>}
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.apiInfo}>
                <div className={styles.apiSection}>
                    <h3>🛍️ Website Products & Categories API</h3>
                    <p className={styles.sectionDesc}>Manage products and categories for your website integration</p>
                    
                    <div className={styles.endpoint}>
                        <strong>Get Products:</strong>
                        <code>GET https://54.169.31.95:8443/api/website/products</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/website/products')}>
                            <Copy size={14} />
                        </button>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Get Categories:</strong>
                        <code>GET https://54.169.31.95:8443/api/website/categories</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/website/categories')}>
                            <Copy size={14} />
                        </button>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Create Product:</strong>
                        <code>POST https://54.169.31.95:8443/api/website/products</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/website/products')}>
                            <Copy size={14} />
                        </button>
                    </div>
                </div>

                <div className={styles.apiSection}>
                    <h3>📦 Website Orders API</h3>
                    <p className={styles.sectionDesc}>Complete order management system for website integration</p>
                    
                    <div className={styles.endpoint}>
                        <strong>Place Order:</strong>
                        <code>POST https://54.169.31.95:8443/api/website/orders</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/website/orders')}>
                            <Copy size={14} />
                        </button>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Get Orders:</strong>
                        <code>GET https://54.169.31.95:8443/api/website/orders</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/website/orders')}>
                            <Copy size={14} />
                        </button>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Track Order:</strong>
                        <code>GET https://54.169.31.95:8443/api/website/orders/[orderId]/tracking</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/website/orders/{orderId}/tracking')}>
                            <Copy size={14} />
                        </button>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Cancel Order:</strong>
                        <code>PUT https://54.169.31.95:8443/api/website/orders/[orderId]/cancel</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/website/orders/{orderId}/cancel')}>
                            <Copy size={14} />
                        </button>
                    </div>
                </div>

                <div className={styles.apiSection}>
                    <h3>🔐 Authentication</h3>
                    <p className={styles.sectionDesc}>All API requests require authentication using Bearer tokens</p>
                    
                    <div className={styles.authExample}>
                        <strong>Header Format:</strong>
                        <code>Authorization: Bearer YOUR_TOKEN_HERE</code>
                        <button onClick={() => copyToClipboard('Authorization: Bearer YOUR_TOKEN_HERE')}>
                            <Copy size={14} />
                        </button>
                    </div>
                </div>

                <div className={styles.apiSection}>
                    <h3>💻 Usage Examples</h3>
                    
                    <div className={styles.exampleGroup}>
                        <h4>Products API</h4>
                        <div className={styles.usage}>
                            <strong>Get all products:</strong>
                            <code>curl -H "Authorization: Bearer YOUR_TOKEN" https://54.169.31.95:8443/api/website/products</code>
                            <button onClick={() => copyToClipboard('curl -H "Authorization: Bearer YOUR_TOKEN" https://54.169.31.95:8443/api/website/products')}>
                                <Copy size={14} />
                            </button>
                        </div>
                        
                        <div className={styles.usage}>
                            <strong>Create product:</strong>
                            <code>curl -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -X POST -d '{"product_name":"Custom Mug","price":24.99,"category_id":1}' https://54.169.31.95:8443/api/website/products</code>
                            <button onClick={() => copyToClipboard('curl -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -X POST -d \'{"product_name":"Custom Mug","price":24.99,"category_id":1}\' https://54.169.31.95:8443/api/website/products')}>
                                <Copy size={14} />
                            </button>
                        </div>
                    </div>

                    <div className={styles.exampleGroup}>
                        <h4>Orders API</h4>
                        <div className={styles.usage}>
                            <strong>Place order:</strong>
                            <code>curl -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -X POST -d @order.json https://54.169.31.95:8443/api/website/orders</code>
                            <button onClick={() => copyToClipboard('curl -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -X POST -d @order.json https://54.169.31.95:8443/api/website/orders')}>
                                <Copy size={14} />
                            </button>
                        </div>
                        
                        <div className={styles.usage}>
                            <strong>Get user orders:</strong>
                            <code>curl -H "Authorization: Bearer YOUR_TOKEN" "https://54.169.31.95:8443/api/website/orders?page=1&limit=10"</code>
                            <button onClick={() => copyToClipboard('curl -H "Authorization: Bearer YOUR_TOKEN" "https://54.169.31.95:8443/api/website/orders?page=1&limit=10"')}>
                                <Copy size={14} />
                            </button>
                        </div>
                        
                        <div className={styles.usage}>
                            <strong>Track order:</strong>
                            <code>curl -H "Authorization: Bearer YOUR_TOKEN" https://54.169.31.95:8443/api/website/orders/ORDER_ID/tracking</code>
                            <button onClick={() => copyToClipboard('curl -H "Authorization: Bearer YOUR_TOKEN" https://54.169.31.95:8443/api/website/orders/ORDER_ID/tracking')}>
                                <Copy size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.keysList}>
                <h3>Your API Tokens ({apiKeys.length})</h3>
                {apiKeys.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No API tokens yet. Generate one to get started.</p>
                    </div>
                ) : (
                    apiKeys.map(apiKey => (
                        <div key={apiKey.id} className={styles.keyItem}>
                            <div className={styles.keyInfo}>
                                <strong>{apiKey.name}</strong>
                                <div className={styles.keyDetails}>
                                    <code>{maskApiKey(apiKey.key || apiKey.api_key)}</code>
                                    <span>•</span>
                                    <span>{apiKey.usage_count || 0} calls</span>
                                    <span>•</span>
                                    <span>Last used: {formatDate(apiKey.last_used_at)}</span>
                                </div>
                            </div>
                            <div className={styles.keyActions}>
                                <button 
                                    onClick={() => copyToClipboard(apiKey.key || apiKey.api_key)}
                                    className={styles.copyBtn}
                                    title="Copy token"
                                >
                                    <Copy size={14} />
                                </button>
                                <button 
                                    onClick={() => handleDeleteKey(apiKey.id)}
                                    className={styles.deleteBtn}
                                    title="Delete token"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3>Generate API Token</h3>
                        <input
                            type="text"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            placeholder="Token name (e.g., My Website)"
                            className={styles.input}
                        />
                        <div className={styles.modalActions}>
                            <button onClick={() => setShowCreateModal(false)}>Cancel</button>
                            <button onClick={handleCreateKey} className={styles.createBtn}>
                                Generate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Generated Key Modal */}
            {showKeyModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3>Your API Token</h3>
                        <p>Copy this token now. You won't see it again.</p>
                        <div className={styles.generatedKey}>
                            <code>{generatedKey}</code>
                            <button onClick={() => copyToClipboard(generatedKey)}>
                                <Copy size={16} />
                            </button>
                        </div>
                        <button 
                            onClick={() => setShowKeyModal(false)}
                            className={styles.createBtn}
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApiPage;`;

console.log('🔧 Creating fixed API page...');

try {
    fs.writeFileSync(apiPagePath, fixedApiPageContent, 'utf8');
    console.log('✅ Fixed API page created successfully');
    console.log('📋 Changes made:');
    console.log('   • Removed all template literals that were causing JavaScript errors');
    console.log('   • Replaced template literals with string concatenation');
    console.log('   • Simplified JSON examples to prevent parsing issues');
    console.log('   • Used [orderId] placeholder instead of {orderId}');
    console.log('   • Removed complex test functionality that was causing errors');
    console.log('');
    console.log('🚀 The API page should now load without JavaScript errors');
} catch (error) {
    console.error('❌ Failed to create fixed API page:', error.message);
    process.exit(1);
}