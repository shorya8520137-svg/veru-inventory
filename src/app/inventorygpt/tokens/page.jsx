'use client';

import React, { useState, useEffect } from 'react';
import styles from './inventoryGptTokens.module.css';

const InventoryGptTokensPage = () => {
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showTokenModal, setShowTokenModal] = useState(false);
    const [generatedToken, setGeneratedToken] = useState('');
    const [copiedToClipboard, setCopiedToClipboard] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        rate_limit: 1000,
        expires_in_days: 90
    });

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.insora.in';
    
    // Clear alerts after 5 seconds
    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess('');
                setError('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    useEffect(() => {
        fetchTokens();
    }, []);

    const fetchTokens = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                setError('Authentication required');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE}/api/inventorygpt/tokens`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch tokens');
            }

            const data = await response.json();
            if (data.success) {
                setTokens(data.data || []);
                setError('');
            } else {
                throw new Error(data.message || 'Failed to fetch tokens');
            }
        } catch (error) {
            console.error('Error fetching tokens:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateToken = async () => {
        try {
            if (!formData.name.trim()) {
                setError('Token name is required');
                return;
            }

            const token = localStorage.getItem('token');

            const response = await fetch(`${API_BASE}/api/inventorygpt/tokens`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to create token');
            }

            const data = await response.json();
            if (data.success) {
                setGeneratedToken(data.token);
                setShowCreateModal(false);
                setShowTokenModal(true);
                setSuccess('Token created successfully!');
                setFormData({ name: '', description: '', rate_limit: 1000, expires_in_days: 90 });
                
                // Refresh tokens list
                setTimeout(() => fetchTokens(), 500);
            } else {
                throw new Error(data.message || 'Failed to create token');
            }
        } catch (error) {
            console.error('Error creating token:', error);
            setError(error.message);
        }
    };

    const handleRevokeToken = async (tokenId) => {
        if (!confirm('Are you sure you want to revoke this token? It cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_BASE}/api/inventorygpt/tokens/${tokenId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to revoke token');
            }

            const data = await response.json();
            if (data.success) {
                setSuccess('Token revoked successfully');
                setError('');
                fetchTokens();
            } else {
                throw new Error(data.message || 'Failed to revoke token');
            }
        } catch (error) {
            console.error('Error revoking token:', error);
            setError(error.message);
        }
    };

    const handleCopyToken = () => {
        navigator.clipboard.writeText(generatedToken);
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 2000);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>ðŸ” InventoryGPT API Tokens</h1>
                    <p>Generate and manage API tokens for InventoryGPT data feed</p>
                </div>
                <button 
                    className={styles.createBtn}
                    onClick={() => setShowCreateModal(true)}
                >
                    âž• Generate New Token
                </button>
            </div>

            {error && (
                <div className={styles.alert + ' ' + styles.error}>
                    {error}
                </div>
            )}
            {success && (
                <div className={styles.alert + ' ' + styles.success}>
                    {success}
                </div>
            )}

            {loading ? (
                <div className={styles.loading}>Loading tokens...</div>
            ) : tokens.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>ðŸ”‘</div>
                    <p>No API tokens yet</p>
                    <small>Create your first token to start using InventoryGPT API</small>
                </div>
            ) : (
                <div className={styles.tokensGrid}>
                    {tokens.map(token => (
                        <div key={token.id} className={styles.tokenCard}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h3>{token.name}</h3>
                                    <p className={styles.prefix}>
                                        {token.token_prefix}...
                                        {token.is_active ? (
                                            <span className={styles.badge + ' ' + styles.active}>Active</span>
                                        ) : (
                                            <span className={styles.badge + ' ' + styles.revoked}>Revoked</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {token.description && (
                                <p className={styles.description}>{token.description}</p>
                            )}

                            <div className={styles.stats}>
                                <div className={styles.stat}>
                                    <span className={styles.label}>Rate Limit</span>
                                    <span className={styles.value}>{token.rate_limit} req/hour</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.label}>Usage</span>
                                    <span className={styles.value}>{token.usage_count} calls</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.label}>Expires</span>
                                    <span className={styles.value}>{formatDate(token.expires_at)}</span>
                                </div>
                            </div>

                            {token.last_used_at && (
                                <p className={styles.lastUsed}>
                                    Last used: {formatDate(token.last_used_at)}
                                </p>
                            )}

                            <button 
                                className={styles.revokeBtn}
                                onClick={() => handleRevokeToken(token.id)}
                                disabled={!token.is_active}
                            >
                                ðŸ”’ Revoke Token
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Token Modal */}
            {showCreateModal && (
                <div className={styles.modal} onClick={() => setShowCreateModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Generate New API Token</h2>
                            <button 
                                className={styles.closeBtn}
                                onClick={() => setShowCreateModal(false)}
                            >
                                âœ•
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label>Token Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Production API"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <textarea
                                    placeholder="What will this token be used for?"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows="3"
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Rate Limit (requests/hour)</label>
                                    <input
                                        type="number"
                                        value={formData.rate_limit}
                                        onChange={(e) => setFormData({ ...formData, rate_limit: parseInt(e.target.value) })}
                                        min="100"
                                        max="10000"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Expires In (days)</label>
                                    <input
                                        type="number"
                                        value={formData.expires_in_days}
                                        onChange={(e) => setFormData({ ...formData, expires_in_days: parseInt(e.target.value) })}
                                        min="7"
                                        max="365"
                                    />
                                </div>
                            </div>

                            <div className={styles.apiEndpoints}>
                                <h4>ðŸ“¡ Available API Endpoints:</h4>
                                <ul>
                                    <li><code>GET /api/inventorygpt/inventory-state</code> - Current inventory across warehouses</li>
                                    <li><code>GET /api/inventorygpt/warehouse-metrics</code> - Warehouse performance KPIs</li>
                                    <li><code>GET /api/inventorygpt/regional-demand</code> - Regional sales analytics</li>
                                    <li><code>GET /api/inventorygpt/recommendations</code> - AI recommendations</li>
                                    <li><code>POST /api/inventorygpt/recommendations</code> - Submit recommendations</li>
                                </ul>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button 
                                className={styles.cancelBtn}
                                onClick={() => setShowCreateModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className={styles.submitBtn}
                                onClick={handleCreateToken}
                            >
                                ðŸ”‘ Generate Token
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Token Display Modal */}
            {showTokenModal && (
                <div className={styles.modal} onClick={() => setShowTokenModal(false)}>
                    <div className={styles.modalContent + ' ' + styles.tokenModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>âœ¨ Your API Token</h2>
                            <button 
                                className={styles.closeBtn}
                                onClick={() => setShowTokenModal(false)}
                            >
                                âœ•
                            </button>
                        </div>

                        <div className={styles.tokenDisplay}>
                            <p className={styles.warning}>
                                âš ï¸ Save this token in a secure location. You won't be able to see it again!
                            </p>

                            <div className={styles.tokenBox}>
                                <code>{generatedToken}</code>
                                <button 
                                    className={styles.copyBtn}
                                    onClick={handleCopyToken}
                                >
                                    {copiedToClipboard ? 'âœ“ Copied!' : 'ðŸ“‹ Copy'}
                                </button>
                            </div>

                            <div className={styles.usage}>
                                <h4>How to use:</h4>
                                <pre>{`curl -H "Authorization: Bearer ${generatedToken}" \\
  https://api.insora.in/api/inventorygpt/inventory-state`}</pre>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button 
                                className={styles.submitBtn}
                                onClick={() => setShowTokenModal(false)}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryGptTokensPage;
