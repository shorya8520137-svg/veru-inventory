'use client';

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
        <div className={styles.container} style={{ overflowY: 'auto', maxHeight: '100vh' }}>
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
                    <h3>👥 Website Customers API</h3>
                    <p className={styles.sectionDesc}>Manage website customer accounts and authentication</p>
                    
                    <div className={styles.endpoint}>
                        <strong>Get All Customers:</strong>
                        <code>GET https://54.169.31.95:8443/api/website-customers</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/website-customers')}>
                            <Copy size={14} />
                        </button>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Get Customer Stats:</strong>
                        <code>GET https://54.169.31.95:8443/api/website-customers/stats</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/website-customers/stats')}>
                            <Copy size={14} />
                        </button>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Get Customer by ID:</strong>
                        <code>GET https://54.169.31.95:8443/api/website-customers/[id]</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/website-customers/{id}')}>
                            <Copy size={14} />
                        </button>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Suspend/Activate Customer:</strong>
                        <code>PATCH https://54.169.31.95:8443/api/website-customers/[id]/status</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/website-customers/{id}/status')}>
                            <Copy size={14} />
                        </button>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Get Recent Logins:</strong>
                        <code>GET https://54.169.31.95:8443/api/website-customers/recent-logins</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/website-customers/recent-logins')}>
                            <Copy size={14} />
                        </button>
                    </div>
                </div>

                <div className={styles.apiSection}>
                    <h3>🔑 Website Customer Authentication API</h3>
                    <p className={styles.sectionDesc}>Signup and login APIs for your website customers (NO AUTH REQUIRED)</p>
                    
                    <div className={styles.endpoint}>
                        <strong>Customer Signup:</strong>
                        <code>POST https://54.169.31.95:8443/api/website-auth/signup</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/website-auth/signup')}>
                            <Copy size={14} />
                        </button>
                        <div className={styles.endpointDetails}>
                            <p>Body: {`{ "name": "John Doe", "email": "john@example.com", "password": "password123", "phone": "+1234567890" }`}</p>
                            <p>Returns: JWT token + customer info</p>
                        </div>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Customer Login:</strong>
                        <code>POST https://54.169.31.95:8443/api/website-auth/login</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/website-auth/login')}>
                            <Copy size={14} />
                        </button>
                        <div className={styles.endpointDetails}>
                            <p>Body: {`{ "email": "john@example.com", "password": "password123" }`}</p>
                            <p>Returns: JWT token + customer info</p>
                        </div>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Google OAuth Login:</strong>
                        <code>POST https://54.169.31.95:8443/api/website-auth/google</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/website-auth/google')}>
                            <Copy size={14} />
                        </button>
                        <div className={styles.endpointDetails}>
                            <p>Body: {`{ "google_id": "123456", "email": "john@example.com", "name": "John Doe" }`}</p>
                            <p>Returns: JWT token + customer info</p>
                        </div>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Get Customer Profile:</strong>
                        <code>GET https://54.169.31.95:8443/api/website-auth/profile</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/website-auth/profile')}>
                            <Copy size={14} />
                        </button>
                        <div className={styles.endpointDetails}>
                            <p>Requires: Authorization header with customer JWT token</p>
                        </div>
                    </div>
                </div>

                <div className={styles.apiSection}>
                    <h3>💬 Customer Support Chat API</h3>
                    <p className={styles.sectionDesc}>AI-powered customer support bot with auto-responses (NO AUTH REQUIRED for customers)</p>
                    
                    <div className={styles.endpoint}>
                        <strong>Create Conversation:</strong>
                        <code>POST https://54.169.31.95:8443/api/customer-support/conversations</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/customer-support/conversations')}>
                            <Copy size={14} />
                        </button>
                        <div className={styles.endpointDetails}>
                            <p>Body: {`{ "customer_name": "John Doe", "customer_email": "john@example.com", "customer_phone": "+1234567890", "subject": "Order Issue", "initial_message": "I need help with my order" }`}</p>
                            <p>Returns: conversation_id + bot auto-response</p>
                        </div>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Send Message:</strong>
                        <code>POST https://54.169.31.95:8443/api/customer-support/conversations/[conversation_id]/messages</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/customer-support/conversations/{conversation_id}/messages')}>
                            <Copy size={14} />
                        </button>
                        <div className={styles.endpointDetails}>
                            <p>Body: {`{ "message": "What is your return policy?", "sender_type": "customer", "sender_name": "John Doe" }`}</p>
                            <p>Returns: bot auto-response based on keywords</p>
                        </div>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Get Messages:</strong>
                        <code>GET https://54.169.31.95:8443/api/customer-support/conversations/[conversation_id]/messages</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/customer-support/conversations/{conversation_id}/messages')}>
                            <Copy size={14} />
                        </button>
                        <div className={styles.endpointDetails}>
                            <p>Returns: All messages in the conversation with timestamps</p>
                        </div>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Rate Conversation:</strong>
                        <code>POST https://54.169.31.95:8443/api/customer-support/conversations/[conversation_id]/rating</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/customer-support/conversations/{conversation_id}/rating')}>
                            <Copy size={14} />
                        </button>
                        <div className={styles.endpointDetails}>
                            <p>Body: {`{ "rating": 5, "feedback": "Great support!" }`}</p>
                            <p>Rating: 1-5 stars</p>
                        </div>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Get All Conversations (Admin):</strong>
                        <code>GET https://54.169.31.95:8443/api/customer-support/conversations?status=open&page=1&limit=20</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/customer-support/conversations?status=open&page=1&limit=20')}>
                            <Copy size={14} />
                        </button>
                        <div className={styles.endpointDetails}>
                            <p>Requires: Authorization header (admin only)</p>
                            <p>Query params: status (open/in_progress/resolved/closed), page, limit</p>
                        </div>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Update Status (Admin):</strong>
                        <code>PATCH https://54.169.31.95:8443/api/customer-support/conversations/[conversation_id]/status</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/customer-support/conversations/{conversation_id}/status')}>
                            <Copy size={14} />
                        </button>
                        <div className={styles.endpointDetails}>
                            <p>Requires: Authorization header (admin only)</p>
                            <p>Body: {`{ "status": "resolved" }`}</p>
                            <p>Status options: open, in_progress, resolved, closed</p>
                        </div>
                    </div>
                </div>

                <div className={styles.apiSection}>
                    <h3>🤖 Bot Auto-Response Keywords</h3>
                    <p className={styles.sectionDesc}>The bot automatically responds to these keywords in customer messages:</p>
                    
                    <div className={styles.keywordList}>
                        <div className={styles.keywordItem}>
                            <strong>Greetings:</strong> hello, hi
                        </div>
                        <div className={styles.keywordItem}>
                            <strong>Orders:</strong> order status, track order, cancel order
                        </div>
                        <div className={styles.keywordItem}>
                            <strong>Returns & Refunds:</strong> return, refund
                        </div>
                        <div className={styles.keywordItem}>
                            <strong>Payment:</strong> payment
                        </div>
                        <div className={styles.keywordItem}>
                            <strong>Delivery:</strong> delivery
                        </div>
                        <div className={styles.keywordItem}>
                            <strong>Contact:</strong> contact
                        </div>
                        <div className={styles.keywordItem}>
                            <strong>Closing:</strong> thank, thanks
                        </div>
                    </div>
                </div>

                <div className={styles.apiSection}>
                    <h3>⭐ Product Reviews API</h3>
                    <p className={styles.sectionDesc}>Complete review system with ratings, comments, and helpful voting</p>
                    
                    <div className={styles.endpoint}>
                        <strong>Get Product Reviews:</strong>
                        <code>GET https://54.169.31.95:8443/api/products/[product_id]/reviews</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/products/{product_id}/reviews')}>
                            <Copy size={14} />
                        </button>
                        <div className={styles.endpointDetails}>
                            <p>Query params: page, limit, sort (latest/oldest/highest_rated/lowest_rated/most_helpful)</p>
                            <p>Returns: Reviews with statistics and rating distribution</p>
                            <p>NO AUTH REQUIRED - Public endpoint</p>
                        </div>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Create Review:</strong>
                        <code>POST https://54.169.31.95:8443/api/products/[product_id]/reviews</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/products/{product_id}/reviews')}>
                            <Copy size={14} />
                        </button>
                        <div className={styles.endpointDetails}>
                            <p>Requires: Authorization header (customer JWT token)</p>
                            <p>Body: {`{ "rating": 5, "comment": "Excellent product!" }`}</p>
                            <p>Rating: 1-5, Comment: 10-1000 characters</p>
                            <p>One review per user per product</p>
                        </div>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Update Review:</strong>
                        <code>PUT https://54.169.31.95:8443/api/products/[product_id]/reviews/[review_id]</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/products/{product_id}/reviews/{review_id}')}>
                            <Copy size={14} />
                        </button>
                        <div className={styles.endpointDetails}>
                            <p>Requires: Authorization header (user can only update own review)</p>
                            <p>Body: {`{ "rating": 4, "comment": "Updated review text" }`}</p>
                        </div>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Delete Review:</strong>
                        <code>DELETE https://54.169.31.95:8443/api/reviews/[review_id]</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/reviews/{review_id}')}>
                            <Copy size={14} />
                        </button>
                        <div className={styles.endpointDetails}>
                            <p>Requires: Authorization header (user can only delete own review)</p>
                        </div>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Mark Review as Helpful:</strong>
                        <code>POST https://54.169.31.95:8443/api/reviews/[review_id]/helpful</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/reviews/{review_id}/helpful')}>
                            <Copy size={14} />
                        </button>
                        <div className={styles.endpointDetails}>
                            <p>Requires: Authorization header</p>
                            <p>Toggle: Click once to mark helpful, click again to remove</p>
                            <p>Returns: Updated helpful_count and is_helpful status</p>
                        </div>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Get User's Reviews:</strong>
                        <code>GET https://54.169.31.95:8443/api/users/me/reviews</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/users/me/reviews')}>
                            <Copy size={14} />
                        </button>
                        <div className={styles.endpointDetails}>
                            <p>Requires: Authorization header</p>
                            <p>Returns: All reviews submitted by the authenticated user</p>
                        </div>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Get All Reviews (Admin):</strong>
                        <code>GET https://54.169.31.95:8443/api/admin/reviews?status=pending&page=1&limit=20</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/admin/reviews?status=pending&page=1&limit=20')}>
                            <Copy size={14} />
                        </button>
                        <div className={styles.endpointDetails}>
                            <p>Requires: Authorization header (admin only)</p>
                            <p>Query params: status (pending/approved/rejected), page, limit</p>
                        </div>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Approve/Reject Review (Admin):</strong>
                        <code>PUT https://54.169.31.95:8443/api/admin/reviews/[review_id]/status</code>
                        <button onClick={() => copyToClipboard('https://54.169.31.95:8443/api/admin/reviews/{review_id}/status')}>
                            <Copy size={14} />
                        </button>
                        <div className={styles.endpointDetails}>
                            <p>Requires: Authorization header (admin only)</p>
                            <p>Body: {`{ "status": "approved" }`}</p>
                            <p>Status options: pending, approved, rejected</p>
                        </div>
                    </div>
                </div>

                <div className={styles.apiSection}>
                    <h3>📊 Timeline API</h3>
                    <p className={styles.sectionDesc}>Track product inventory movements and history across warehouses</p>
                    
                    <div className={styles.endpoint}>
                        <strong>Get Product Timeline:</strong>
                        <code>GET https://api.giftgala.in/api/timeline/[productCode]</code>
                        <button onClick={() => copyToClipboard('https://api.giftgala.in/api/timeline/{productCode}')}>
                            <Copy size={14} />
                        </button>
                        <div className={styles.endpointDetails}>
                            <p>Requires: Authorization header (Bearer token)</p>
                            <p>Query params: warehouse, dateFrom, dateTo, limit</p>
                            <p>Returns: Complete movement history for a specific product</p>
                        </div>
                    </div>
                    
                    <div className={styles.endpoint}>
                        <strong>Get Timeline Summary:</strong>
                        <code>GET https://api.giftgala.in/api/timeline</code>
                        <button onClick={() => copyToClipboard('https://api.giftgala.in/api/timeline')}>
                            <Copy size={14} />
                        </button>
                        <div className={styles.endpointDetails}>
                            <p>Requires: Authorization header (Bearer token)</p>
                            <p>Query params: warehouse, groupBy (product/warehouse), dateFrom, dateTo</p>
                            <p>Returns: Aggregated timeline data grouped by product or warehouse</p>
                        </div>
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
                            <code>curl -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -X POST -d @product.json https://54.169.31.95:8443/api/website/products</code>
                            <button onClick={() => copyToClipboard('curl -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -X POST -d @product.json https://54.169.31.95:8443/api/website/products')}>
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

                    <div className={styles.exampleGroup}>
                        <h4>Customer Support API</h4>
                        <div className={styles.usage}>
                            <strong>Start conversation:</strong>
                            <code>curl -H "Content-Type: application/json" -X POST -d '{`{"customer_name":"John","customer_email":"john@example.com","initial_message":"I need help"}`}' https://54.169.31.95:8443/api/customer-support/conversations</code>
                            <button onClick={() => copyToClipboard('curl -H "Content-Type: application/json" -X POST -d \'{"customer_name":"John","customer_email":"john@example.com","initial_message":"I need help"}\' https://54.169.31.95:8443/api/customer-support/conversations')}>
                                <Copy size={14} />
                            </button>
                        </div>
                        
                        <div className={styles.usage}>
                            <strong>Send message:</strong>
                            <code>curl -H "Content-Type: application/json" -X POST -d '{`{"message":"What is your return policy?"}`}' https://54.169.31.95:8443/api/customer-support/conversations/CONV_ID/messages</code>
                            <button onClick={() => copyToClipboard('curl -H "Content-Type: application/json" -X POST -d \'{"message":"What is your return policy?"}\' https://54.169.31.95:8443/api/customer-support/conversations/CONV_ID/messages')}>
                                <Copy size={14} />
                            </button>
                        </div>
                        
                        <div className={styles.usage}>
                            <strong>Get messages:</strong>
                            <code>curl https://54.169.31.95:8443/api/customer-support/conversations/CONV_ID/messages</code>
                            <button onClick={() => copyToClipboard('curl https://54.169.31.95:8443/api/customer-support/conversations/CONV_ID/messages')}>
                                <Copy size={14} />
                            </button>
                        </div>
                    </div>

                    <div className={styles.exampleGroup}>
                        <h4>Product Reviews API</h4>
                        <div className={styles.usage}>
                            <strong>Get product reviews:</strong>
                            <code>curl "https://54.169.31.95:8443/api/products/123/reviews?page=1&limit=10&sort=latest"</code>
                            <button onClick={() => copyToClipboard('curl "https://54.169.31.95:8443/api/products/123/reviews?page=1&limit=10&sort=latest"')}>
                                <Copy size={14} />
                            </button>
                        </div>
                        
                        <div className={styles.usage}>
                            <strong>Create review:</strong>
                            <code>curl -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -X POST -d '{`{"rating":5,"comment":"Excellent product!"}`}' https://54.169.31.95:8443/api/products/123/reviews</code>
                            <button onClick={() => copyToClipboard('curl -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -X POST -d \'{"rating":5,"comment":"Excellent product!"}\' https://54.169.31.95:8443/api/products/123/reviews')}>
                                <Copy size={14} />
                            </button>
                        </div>
                        
                        <div className={styles.usage}>
                            <strong>Mark review as helpful:</strong>
                            <code>curl -H "Authorization: Bearer YOUR_TOKEN" -X POST https://54.169.31.95:8443/api/reviews/456/helpful</code>
                            <button onClick={() => copyToClipboard('curl -H "Authorization: Bearer YOUR_TOKEN" -X POST https://54.169.31.95:8443/api/reviews/456/helpful')}>
                                <Copy size={14} />
                            </button>
                        </div>
                        
                        <div className={styles.usage}>
                            <strong>Get user's reviews:</strong>
                            <code>curl -H "Authorization: Bearer YOUR_TOKEN" https://54.169.31.95:8443/api/users/me/reviews</code>
                            <button onClick={() => copyToClipboard('curl -H "Authorization: Bearer YOUR_TOKEN" https://54.169.31.95:8443/api/users/me/reviews')}>
                                <Copy size={14} />
                            </button>
                        </div>
                        
                        <div className={styles.usage}>
                            <strong>Admin - Approve review:</strong>
                            <code>curl -H "Authorization: Bearer ADMIN_TOKEN" -H "Content-Type: application/json" -X PUT -d '{`{"status":"approved"}`}' https://54.169.31.95:8443/api/admin/reviews/456/status</code>
                            <button onClick={() => copyToClipboard('curl -H "Authorization: Bearer ADMIN_TOKEN" -H "Content-Type: application/json" -X PUT -d \'{"status":"approved"}\' https://54.169.31.95:8443/api/admin/reviews/456/status')}>
                                <Copy size={14} />
                            </button>
                        </div>
                    </div>

                    <div className={styles.exampleGroup}>
                        <h4>Timeline API</h4>
                        <div className={styles.usage}>
                            <strong>Get product timeline:</strong>
                            <code>curl -H "Authorization: Bearer YOUR_TOKEN" "https://api.giftgala.in/api/timeline/XYZ789?warehouse=BLR_WH&dateFrom=2025-01-01&dateTo=2025-01-31&limit=50"</code>
                            <button onClick={() => copyToClipboard('curl -H "Authorization: Bearer YOUR_TOKEN" "https://api.giftgala.in/api/timeline/XYZ789?warehouse=BLR_WH&dateFrom=2025-01-01&dateTo=2025-01-31&limit=50"')}>
                                <Copy size={14} />
                            </button>
                        </div>
                        
                        <div className={styles.usage}>
                            <strong>Get timeline summary by product:</strong>
                            <code>curl -H "Authorization: Bearer YOUR_TOKEN" "https://api.giftgala.in/api/timeline?groupBy=product&dateFrom=2025-01-01"</code>
                            <button onClick={() => copyToClipboard('curl -H "Authorization: Bearer YOUR_TOKEN" "https://api.giftgala.in/api/timeline?groupBy=product&dateFrom=2025-01-01"')}>
                                <Copy size={14} />
                            </button>
                        </div>
                        
                        <div className={styles.usage}>
                            <strong>Get warehouse timeline:</strong>
                            <code>curl -H "Authorization: Bearer YOUR_TOKEN" "https://api.giftgala.in/api/timeline?warehouse=BLR_WH&groupBy=warehouse"</code>
                            <button onClick={() => copyToClipboard('curl -H "Authorization: Bearer YOUR_TOKEN" "https://api.giftgala.in/api/timeline?warehouse=BLR_WH&groupBy=warehouse"')}>
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

export default ApiPage;