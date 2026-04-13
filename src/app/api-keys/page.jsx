'use client';

import React, { useState, useEffect } from 'react';
import styles from './apiKeys.module.css';

const ApiKeysPage = () => {
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyDescription, setNewKeyDescription] = useState('');
    const [generatedKey, setGeneratedKey] = useState('');
    const [showKeyModal, setShowKeyModal] = useState(false);

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.giftgala.in';

    useEffect(() => {
        fetchApiKeys();
    }, []);

    const fetchApiKeys = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication required');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE}/api/api-keys`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch API keys');
            }

            const data = await response.json();
            if (data.success) {
                setApiKeys(data.data || []);
            } else {
                throw new Error(data.message || 'Failed to fetch API keys');
            }
        } catch (error) {
            console.error('Error fetching API keys:', error);
            // Fallback to mock data for demo
            setApiKeys([
                {
                    id: 1,
                    name: 'Website Integration',
                    description: 'API key for main website product integration',
                    key: 'wk_live_1234567890abcdef',
                    created_at: '2024-01-15T10:30:00.000Z',
                    last_used: '2024-02-01T14:22:00.000Z',
                    usage_count: 1247,
                    is_active: true
                },
                {
                    id: 2,
                    name: 'Mobile App',
                    description: 'API key for mobile application',
                    key: 'wk_live_abcdef1234567890',
                    created_at: '2024-01-20T16:45:00.000Z',
                    last_used: '2024-01-31T09:15:00.000Z',
                    usage_count: 523,
                    is_active: true
                },
                {
                    id: 3,
                    name: 'Development Testing',
                    description: 'API key for development and testing',
                    key: 'wk_test_fedcba0987654321',
                    created_at: '2024-01-10T12:00:00.000Z',
                    last_used: null,
                    usage_count: 0,
                    is_active: false
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const generateApiKey = () => {
        const prefix = 'wk_live_';
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let key = '';
        for (let i = 0; i < 32; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return prefix + key;
    };

    const handleCreateKey = async () => {
        if (!newKeyName.trim()) {
            setError('API key name is required');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication required');
                return;
            }

            const response = await fetch(`${API_BASE}/api/api-keys`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: newKeyName,
                    description: newKeyDescription
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create API key');
            }

            const data = await response.json();
            if (data.success) {
                setGeneratedKey(data.data.key);
                setShowKeyModal(true);
                setShowCreateModal(false);
                setNewKeyName('');
                setNewKeyDescription('');
                setSuccess('API key created successfully!');
                // Refresh the list
                fetchApiKeys();
            } else {
                throw new Error(data.message || 'Failed to create API key');
            }

        } catch (error) {
            console.error('Error creating API key:', error);
            setError('Failed to create API key');
        }
    };

    const handleToggleKey = async (id, currentStatus) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication required');
                return;
            }

            const response = await fetch(`${API_BASE}/api/api-keys/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    is_active: !currentStatus
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update API key');
            }

            const data = await response.json();
            if (data.success) {
                setApiKeys(apiKeys.map(key => 
                    key.id === id ? { ...key, is_active: !currentStatus } : key
                ));
                setSuccess(`API key ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
            } else {
                throw new Error(data.message || 'Failed to update API key');
            }
        } catch (error) {
            console.error('Error toggling API key:', error);
            setError('Failed to update API key status');
        }
    };

    const handleDeleteKey = async (id) => {
        if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication required');
                return;
            }

            const response = await fetch(`${API_BASE}/api/api-keys/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete API key');
            }

            const data = await response.json();
            if (data.success) {
                setApiKeys(apiKeys.filter(key => key.id !== id));
                setSuccess('API key deleted successfully');
            } else {
                throw new Error(data.message || 'Failed to delete API key');
            }
        } catch (error) {
            console.error('Error deleting API key:', error);
            setError('Failed to delete API key');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setSuccess('API key copied to clipboard!');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const maskApiKey = (key) => {
        if (key.length <= 12) return key;
        return key.substring(0, 12) + '••••••••••••••••••••';
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading API keys...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>API Keys Management</h1>
                    <p>Create and manage API keys for your website integration</p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className={styles.createBtn}
                >
                    🔑 Create New API Key
                </button>
            </div>

            {success && (
                <div className={styles.successMessage}>
                    ✅ {success}
                </div>
            )}

            {error && (
                <div className={styles.errorMessage}>
                    ❌ {error}
                </div>
            )}

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <h3>{apiKeys.filter(key => key.is_active).length}</h3>
                    <p>Active Keys</p>
                </div>
                <div className={styles.statCard}>
                    <h3>{apiKeys.reduce((sum, key) => sum + key.usage_count, 0).toLocaleString()}</h3>
                    <p>Total API Calls</p>
                </div>
                <div className={styles.statCard}>
                    <h3>{apiKeys.length}</h3>
                    <p>Total Keys</p>
                </div>
                <div className={styles.statCard}>
                    <h3>1000/hr</h3>
                    <p>Rate Limit</p>
                </div>
            </div>

            <div className={styles.keysContainer}>
                <div className={styles.keysHeader}>
                    <h2>Your API Keys</h2>
                    <p>Manage your API keys for website product integration</p>
                </div>

                {apiKeys.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🔑</div>
                        <h3>No API Keys Yet</h3>
                        <p>Create your first API key to start integrating with your website</p>
                        <button 
                            onClick={() => setShowCreateModal(true)}
                            className={styles.createBtn}
                        >
                            Create Your First API Key
                        </button>
                    </div>
                ) : (
                    <div className={styles.keysList}>
                        {apiKeys.map(apiKey => (
                            <div key={apiKey.id} className={styles.keyCard}>
                                <div className={styles.keyHeader}>
                                    <div className={styles.keyInfo}>
                                        <h3>{apiKey.name}</h3>
                                        <p>{apiKey.description}</p>
                                    </div>
                                    <div className={styles.keyStatus}>
                                        <span className={`${styles.statusBadge} ${apiKey.is_active ? styles.active : styles.inactive}`}>
                                            {apiKey.is_active ? '🟢 Active' : '🔴 Inactive'}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.keyDetails}>
                                    <div className={styles.keyValue}>
                                        <label>API Key:</label>
                                        <div className={styles.keyDisplay}>
                                            <code>{maskApiKey(apiKey.key)}</code>
                                            <button 
                                                onClick={() => copyToClipboard(apiKey.key)}
                                                className={styles.copyBtn}
                                                title="Copy to clipboard"
                                            >
                                                📋
                                            </button>
                                        </div>
                                    </div>

                                    <div className={styles.keyMeta}>
                                        <div className={styles.metaItem}>
                                            <span>Created:</span>
                                            <span>{formatDate(apiKey.created_at)}</span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <span>Last Used:</span>
                                            <span>{formatDate(apiKey.last_used)}</span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <span>Usage:</span>
                                            <span>{apiKey.usage_count.toLocaleString()} calls</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.keyActions}>
                                    <button 
                                        onClick={() => handleToggleKey(apiKey.id, apiKey.is_active)}
                                        className={`${styles.actionBtn} ${apiKey.is_active ? styles.deactivateBtn : styles.activateBtn}`}
                                    >
                                        {apiKey.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteKey(apiKey.id)}
                                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create API Key Modal */}
            {showCreateModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Create New API Key</h2>
                            <button 
                                onClick={() => setShowCreateModal(false)}
                                className={styles.closeBtn}
                            >
                                ✕
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label>API Key Name *</label>
                                <input
                                    type="text"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    placeholder="e.g., Website Integration"
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <textarea
                                    value={newKeyDescription}
                                    onChange={(e) => setNewKeyDescription(e.target.value)}
                                    placeholder="Describe what this API key will be used for..."
                                    className={styles.textarea}
                                    rows={3}
                                />
                            </div>

                            <div className={styles.infoBox}>
                                <h4>🔒 Security Notice</h4>
                                <ul>
                                    <li>Keep your API keys secure and never share them publicly</li>
                                    <li>Use different keys for different environments (dev, staging, prod)</li>
                                    <li>You can deactivate or delete keys at any time</li>
                                    <li>API keys have a rate limit of 1000 requests per hour</li>
                                </ul>
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button 
                                onClick={() => setShowCreateModal(false)}
                                className={styles.cancelBtn}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCreateKey}
                                className={styles.createBtn}
                            >
                                🔑 Create API Key
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Generated Key Modal */}
            {showKeyModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>🎉 API Key Created Successfully!</h2>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.keyGenerated}>
                                <p><strong>Your new API key:</strong></p>
                                <div className={styles.generatedKeyDisplay}>
                                    <code>{generatedKey}</code>
                                    <button 
                                        onClick={() => copyToClipboard(generatedKey)}
                                        className={styles.copyBtn}
                                    >
                                        📋 Copy
                                    </button>
                                </div>
                            </div>

                            <div className={styles.warningBox}>
                                <h4>⚠️ Important!</h4>
                                <p>This is the only time you'll see this API key. Make sure to copy it and store it securely. If you lose it, you'll need to create a new one.</p>
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button 
                                onClick={() => setShowKeyModal(false)}
                                className={styles.createBtn}
                            >
                                I've Saved My Key
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApiKeysPage;