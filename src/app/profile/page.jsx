'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity,
    AlertCircle,
    ArrowRight,
    Camera,
    CheckCircle2,
    Copy,
    CreditCard,
    FileText,
    Info,
    KeyRound,
    Loader2,
    Plus,
    RefreshCw,
    Save,
    ShieldCheck,
    Trash2,
    TrendingUp,
    User,
    Wallet
} from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import styles from './profile.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.giftgala.in';
const apiDocs = [
    {
        title: 'Authentication',
        description: 'Use these APIs to authenticate customers and retrieve the signed-in customer profile.',
        endpoints: [
            { method: 'POST', path: '/api/website-auth/signup', auth: 'Public', detail: 'Creates a website customer account with name, email, password, and optional phone.' },
            { method: 'POST', path: '/api/website-auth/login', auth: 'Public', detail: 'Verifies customer credentials and returns a JWT token with customer details.' },
            { method: 'POST', path: '/api/website-auth/google', auth: 'Public', detail: 'Creates or signs in a customer using Google identity details from the website.' },
            { method: 'GET', path: '/api/website-auth/profile', auth: 'Customer JWT', detail: 'Returns the current website customer profile for the supplied Bearer token.' }
        ]
    },
    {
        title: 'Website Products',
        description: 'Read and manage product catalog data for your storefront integration.',
        endpoints: [
            { method: 'GET', path: '/api/website/products', auth: 'Public or API key', detail: 'Lists active products with stock, pricing, images, and category details.' },
            { method: 'GET', path: '/api/website/categories', auth: 'Public or API key', detail: 'Returns product categories used by the website catalog.' },
            { method: 'POST', path: '/api/website/products', auth: 'Bearer token or API key', detail: 'Creates a product record from website or admin integration payloads.' }
        ]
    },
    {
        title: 'Website Orders',
        description: 'Create orders, inspect order history, track dispatch status, and cancel orders.',
        endpoints: [
            { method: 'POST', path: '/api/website/orders', auth: 'Bearer token or API key', detail: 'Places a website order with customer, address, payment, and item details.' },
            { method: 'GET', path: '/api/website/orders', auth: 'Bearer token or API key', detail: 'Returns paginated order history with current status and totals.' },
            { method: 'GET', path: '/api/website/orders/{orderId}/tracking', auth: 'Bearer token or API key', detail: 'Returns tracking events and dispatch movement for a single order.' },
            { method: 'PUT', path: '/api/website/orders/{orderId}/cancel', auth: 'Bearer token or API key', detail: 'Cancels an eligible order and records the cancellation reason.' }
        ]
    },
    {
        title: 'Customers',
        description: 'Admin customer APIs for CRM style customer visibility and status management.',
        endpoints: [
            { method: 'GET', path: '/api/website-customers', auth: 'Admin JWT', detail: 'Lists website customers with account status, contact details, and activity.' },
            { method: 'GET', path: '/api/website-customers/stats', auth: 'Admin JWT', detail: 'Returns customer totals, active users, and customer growth metrics.' },
            { method: 'GET', path: '/api/website-customers/{id}', auth: 'Admin JWT', detail: 'Returns one customer profile with order and login context.' },
            { method: 'PATCH', path: '/api/website-customers/{id}/status', auth: 'Admin JWT', detail: 'Suspends or activates a customer account.' },
            { method: 'GET', path: '/api/website-customers/recent-logins', auth: 'Admin JWT', detail: 'Shows recent login activity for customer security review.' }
        ]
    },
    {
        title: 'Support, Reviews, Timeline',
        description: 'Operational APIs for chat support, product reviews, and inventory movement visibility.',
        endpoints: [
            { method: 'POST', path: '/api/customer-support/conversations', auth: 'Public', detail: 'Starts a customer support conversation and stores the first message.' },
            { method: 'POST', path: '/api/customer-support/conversations/{id}/messages', auth: 'Public', detail: 'Adds a message to an existing conversation.' },
            { method: 'GET', path: '/api/customer-support/conversations/{id}/messages', auth: 'Public', detail: 'Returns all messages for a conversation.' },
            { method: 'POST', path: '/api/products/{productId}/reviews', auth: 'Bearer token', detail: 'Creates a product review with rating and comment.' },
            { method: 'GET', path: '/api/timeline/{productCode}', auth: 'Bearer token', detail: 'Shows stock movement history for one product code.' },
            { method: 'GET', path: '/api/timeline', auth: 'Bearer token', detail: 'Returns grouped timeline summaries by product or warehouse.' }
        ]
    }
];

function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
}

function authHeaders(extra = {}) {
    const token = getToken();
    return {
        Authorization: token ? `Bearer ${token}` : '',
        ...extra
    };
}

function formatDate(value) {
    if (!value) return 'Never';
    return new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatDateTime(value) {
    if (!value) return 'Never';
    return new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function currency(value) {
    return `Rs. ${Number(value || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function imageUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_BASE}${path}`;
}

function normalizeUser(data) {
    const user = data.user || data.data || {};
    return {
        ...user,
        profile_image: user.profile_image || user.avatar || ''
    };
}

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState(null);
    const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', address: '' });
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [apiKeys, setApiKeys] = useState([]);
    const [apiUsage, setApiUsage] = useState({});
    const [apiAnalytics, setApiAnalytics] = useState({ daily_usage: [], endpoint_usage: [] });
    const [walletBalance, setWalletBalance] = useState(0);
    const [walletHistory, setWalletHistory] = useState([]);
    const [newKey, setNewKey] = useState({ name: '', description: '', token_type: 'api_key' });
    const [generatedKey, setGeneratedKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'api', label: 'API', icon: KeyRound },
        { id: 'wallet', label: 'Wallet', icon: Wallet },
        { id: 'usage', label: 'Usage', icon: Activity }
    ];

    useEffect(() => {
        loadEverything();
    }, []);

    async function requestJson(url, options = {}) {
        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false) {
            throw new Error(data.message || data.error || `Request failed with ${response.status}`);
        }
        return data;
    }

    async function loadEverything() {
        setLoading(true);
        setError('');
        const results = await Promise.allSettled([loadProfile(), loadApiData(), loadWalletData()]);
        const failed = results.find((result) => result.status === 'rejected');
        if (failed) {
            setError(failed.reason?.message || 'Some profile data could not be loaded.');
        }
        setLoading(false);
    }

    async function loadProfile() {
        let data;
        try {
            console.log('[Profile] Fetching from:', `${API_BASE}/api/users/profile`);
            data = await requestJson(`${API_BASE}/api/users/profile`, {
                headers: authHeaders()
            });
            console.log('[Profile] API Response:', data);
        } catch (err) {
            console.log('[Profile] Primary endpoint failed:', err.message);
            if (!String(err.message || '').includes('404')) {
                throw err;
            }
            console.log('[Profile] Trying fallback endpoint...');
            data = await requestJson(`${API_BASE}/api/profile`, {
                headers: authHeaders()
            });
            console.log('[Profile] Fallback Response:', data);
        }

        const user = normalizeUser(data);
        console.log('[Profile] Normalized user:', user);
        setProfile(user);
        setProfileForm({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || ''
        });
        console.log('[Profile] Form set with:', { name: user.name, email: user.email, phone: user.phone, address: user.address });
        setImagePreview(imageUrl(user.profile_image));
    }

    async function loadApiData() {
        const [keysData, usageData, analyticsData] = await Promise.all([
            requestJson(`${API_BASE}/api/api-keys`, { headers: authHeaders({ 'Content-Type': 'application/json' }) }),
            requestJson(`${API_BASE}/api/api-keys/usage`, { headers: authHeaders({ 'Content-Type': 'application/json' }) }),
            requestJson(`${API_BASE}/api/api-keys/analytics?days=30`, { headers: authHeaders({ 'Content-Type': 'application/json' }) })
        ]);
        setApiKeys(keysData.data || []);
        setApiUsage(usageData.data || {});
        setApiAnalytics(analyticsData.data || { daily_usage: [], endpoint_usage: [] });
    }

    async function loadWalletData() {
        const headers = authHeaders();
        const [balanceData, historyData] = await Promise.all([
            requestJson(`${API_BASE}/api/logistics/wallet`, { headers }),
            requestJson(`${API_BASE}/api/logistics/wallet/history`, { headers })
        ]);
        setWalletBalance(balanceData.balance || 0);
        setWalletHistory(historyData.history || []);
    }

    function handleImageChange(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        setProfileImage(file);
        setImagePreview(URL.createObjectURL(file));
    }

    async function saveProfile(event) {
        event.preventDefault();
        setSaving(true);
        setMessage('');
        setError('');

        try {
            const formData = new FormData();
            formData.append('name', profileForm.name);
            formData.append('email', profileForm.email);
            formData.append('phone', profileForm.phone || '');
            formData.append('address', profileForm.address || '');
            if (profileImage) {
                formData.append('profile_image', profileImage);
            }

            let data;
            try {
                data = await requestJson(`${API_BASE}/api/users/profile`, {
                    method: 'PUT',
                    headers: authHeaders(),
                    body: formData
                });
            } catch (err) {
                if (!String(err.message || '').includes('404')) {
                    throw err;
                }
                data = await requestJson(`${API_BASE}/api/profile`, {
                    method: 'PUT',
                    headers: authHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({
                        name: profileForm.name,
                        email: profileForm.email
                    })
                });
            }

            const updatedUser = normalizeUser(data);
            setProfile(updatedUser);
            setImagePreview(imageUrl(updatedUser.profile_image));
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setProfileImage(null);
            setMessage('Profile updated successfully.');
        } catch (err) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    }

    async function createApiKey(event) {
        event.preventDefault();
        if (!newKey.name.trim()) {
            setError('Token name is required.');
            return;
        }

        setError('');
        setMessage('');
        try {
            const data = await requestJson(`${API_BASE}/api/api-keys`, {
                method: 'POST',
                headers: authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(newKey)
            });
            setGeneratedKey(data.data?.key || data.data?.api_key || '');
            setNewKey({ name: '', description: '', token_type: 'api_key' });
            setMessage('API token generated successfully.');
            await loadApiData();
        } catch (err) {
            setError(err.message || 'Failed to generate API token');
        }
    }

    async function deleteApiKey(id) {
        if (!window.confirm('Delete this API token? This action cannot be undone.')) return;
        setError('');
        setMessage('');
        try {
            await requestJson(`${API_BASE}/api/api-keys/${id}`, {
                method: 'DELETE',
                headers: authHeaders({ 'Content-Type': 'application/json' })
            });
            setMessage('API token deleted.');
            await loadApiData();
        } catch (err) {
            setError(err.message || 'Failed to delete API token');
        }
    }

    async function copyText(text) {
        if (!text) return;
        await navigator.clipboard.writeText(text);
        setMessage('Copied to clipboard.');
        window.setTimeout(() => setMessage(''), 1800);
    }

    const dailyUsage = useMemo(() => {
        const rows = apiAnalytics.daily_usage || [];
        if (rows.length) {
            return rows.map((row) => ({
                date: formatDate(row.date).replace(',', ''),
                calls: Number(row.calls || 0),
                keys: Number(row.active_keys || 0)
            }));
        }
        return Array.from({ length: 7 }, (_, index) => ({
            date: `Day ${index + 1}`,
            calls: 0,
            keys: 0
        }));
    }, [apiAnalytics]);

    const walletGraph = useMemo(() => {
        const rows = walletHistory.slice(0, 8).reverse();
        if (rows.length) {
            return rows.map((row) => ({
                date: formatDate(row.created_at).replace(',', ''),
                amount: Number(row.amount || 0)
            }));
        }
        return [{ date: 'No data', amount: 0 }];
    }, [walletHistory]);

    const avatarInitials = (profileForm.name || profile?.email || 'User')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    if (loading) {
        return (
            <main className={styles.page}>
                <div className={styles.loadingState}>
                    <Loader2 className={styles.spin} size={26} />
                    <span>Loading profile workspace</span>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.page}>
            <section className={styles.shell}>
                <aside className={styles.sideNav}>
                    <nav className={styles.tabs}>
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <Icon size={18} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                <section className={styles.content}>
                    <div className={styles.topBar}>
                        <p className={styles.headerText}>Manage your account, API access, wallet ledger, and usage visibility.</p>
                    </div>

                    {message && <div className={styles.successMessage}>{message}</div>}

                    {activeTab === 'profile' && (
                        <div className={styles.profileTabStack}>
                            <div className={styles.errorAlert}>
                                <AlertCircle size={18} />
                                <span>Failed to fetch updated billing status. Please try again later.</span>
                            </div>

                            <section className={styles.profileHeroCard}>
                                <div className={styles.avatarWrap}>
                                    <div className={styles.avatar}>
                                        {imagePreview ? <img src={imagePreview} alt={profileForm.name || 'Profile'} /> : <span>{avatarInitials}</span>}
                                    </div>
                                    <button
                                        type="button"
                                        className={styles.cameraButton}
                                        onClick={() => fileInputRef.current?.click()}
                                        title="Update profile photo"
                                    >
                                        <Camera size={14} />
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        className={styles.hiddenInput}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </div>
                                <div className={styles.profileHeroInfo}>
                                    <h2>Your profile</h2>
                                    <div className={styles.badgeRow}>
                                        <span className={styles.badgeUser}><ShieldCheck size={14} /> User</span>
                                        <span className={styles.badgeActive}><CheckCircle2 size={14} /> Active</span>
                                    </div>
                                </div>
                            </section>

                            <form className={styles.formPanel} onSubmit={saveProfile}>
                                <div className={styles.sectionHeader}>
                                    <div>
                                        <p className={styles.eyebrow}>PERSONAL DETAILS</p>
                                        <h2>Contact Profile</h2>
                                    </div>
                                    <button type="submit" className={styles.primaryButton} disabled={saving}>
                                        {saving ? <Loader2 className={styles.spin} size={16} /> : <Save size={16} />}
                                        Save Changes
                                    </button>
                                </div>

                                <div className={styles.formGrid}>
                                    <label>
                                        <span>Name</span>
                                        <input placeholder="Alexander Thompson" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
                                    </label>
                                    <label>
                                        <span>Email</span>
                                        <input placeholder="alexander.t@workspace.com" type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
                                    </label>
                                    <label>
                                        <span>Phone</span>
                                        <input placeholder="+1 (555) 000-1234" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                                    </label>
                                    <label>
                                        <span>Member since</span>
                                        <input placeholder="November 12, 2023" value={profile?.created_at ? formatDate(profile?.created_at) : ''} disabled />
                                    </label>
                                    <label className={styles.fullField}>
                                        <span>Address</span>
                                        <textarea placeholder="742 Evergreen Terrace, Springfield, OR 97403, United States" rows={4} value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
                                    </label>
                                </div>

                                <div className={styles.infoAlert}>
                                    <Info size={16} />
                                    <span>These details are visible to your account administrators for verification purposes.</span>
                                </div>
                            </form>

                            <div className={styles.bottomCardsGrid}>
                                <div className={styles.bottomCard}>
                                    <span className={styles.cardEyebrow}>STORAGE USED</span>
                                    <div className={styles.cardValue}><strong>42.8</strong> GB</div>
                                    <div className={styles.progressBarWrap}>
                                        <div className={styles.progressBarFill} style={{ width: '42%' }}></div>
                                    </div>
                                    <span className={styles.cardSubtext}>42% of 100GB limit</span>
                                </div>
                                <div className={styles.bottomCard}>
                                    <span className={styles.cardEyebrow}>API REQUESTS</span>
                                    <div className={styles.cardValue}><strong>1.2k</strong> /day</div>
                                    <div className={styles.trendUp}>
                                        <TrendingUp size={14} />
                                        <span>12% increase this month</span>
                                    </div>
                                </div>
                                <div className={styles.walletCard}>
                                    <span className={styles.walletCardEyebrow}>WALLET BALANCE</span>
                                    <div className={styles.walletCardValue}>$1,248.00</div>
                                    <button type="button" className={styles.manageWalletBtn} onClick={() => setActiveTab('wallet')}>
                                        Manage Wallet <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'api' && (
                        <div className={styles.stack}>
                            {error && <div className={styles.errorMessage}>{error}</div>}
                            <section className={styles.metricGrid}>
                                <div className={styles.metricCard}><span>Total tokens</span><strong>{apiUsage.total_keys || 0}</strong></div>
                                <div className={styles.metricCard}><span>Active tokens</span><strong>{apiUsage.active_keys || 0}</strong></div>
                                <div className={styles.metricCard}><span>Total calls</span><strong>{apiUsage.total_usage || 0}</strong></div>
                                <div className={styles.metricCard}><span>Last API call</span><strong>{formatDate(apiUsage.last_api_call)}</strong></div>
                            </section>

                            <section className={styles.twoColumn}>
                                <form className={styles.panel} onSubmit={createApiKey}>
                                    <div className={styles.sectionHeader}>
                                        <div>
                                            <p className={styles.eyebrow}>Token generator</p>
                                            <h2>Create API Access</h2>
                                        </div>
                                        <KeyRound size={20} />
                                    </div>
                                    <label>
                                        <span>Token name</span>
                                        <input value={newKey.name} onChange={(e) => setNewKey({ ...newKey, name: e.target.value })} placeholder="Website integration" />
                                    </label>
                                    <label>
                                        <span>Description</span>
                                        <input value={newKey.description} onChange={(e) => setNewKey({ ...newKey, description: e.target.value })} placeholder="Production storefront token" />
                                    </label>
                                    <label>
                                        <span>Token type</span>
                                        <select value={newKey.token_type} onChange={(e) => setNewKey({ ...newKey, token_type: e.target.value })}>
                                            <option value="api_key">API key</option>
                                            <option value="jwt">JWT token</option>
                                        </select>
                                    </label>
                                    <button type="submit" className={styles.primaryButton}>
                                        <Plus size={16} />
                                        Generate Token
                                    </button>
                                    {generatedKey && (
                                        <div className={styles.generatedKey}>
                                            <span>New token</span>
                                            <code>{generatedKey}</code>
                                            <button type="button" onClick={() => copyText(generatedKey)} title="Copy token"><Copy size={15} /></button>
                                        </div>
                                    )}
                                </form>

                                <section className={styles.panel}>
                                    <div className={styles.sectionHeader}>
                                        <div>
                                            <p className={styles.eyebrow}>Your tokens</p>
                                            <h2>Active Credentials</h2>
                                        </div>
                                    </div>
                                    <div className={styles.keyList}>
                                        {apiKeys.length === 0 ? (
                                            <div className={styles.emptyState}>No API tokens yet.</div>
                                        ) : apiKeys.map((key) => (
                                            <div className={styles.keyRow} key={key.id}>
                                                <div>
                                                    <strong>{key.name}</strong>
                                                    <span>{key.description || 'No description'}</span>
                                                    <code>{key.masked_key || key.key}</code>
                                                </div>
                                                <div className={styles.keyActions}>
                                                    <button type="button" onClick={() => copyText(key.key || key.api_key)} title="Copy token"><Copy size={15} /></button>
                                                    <button type="button" onClick={() => deleteApiKey(key.id)} title="Delete token"><Trash2 size={15} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </section>

                            <section className={styles.docsPanel}>
                                <div className={styles.sectionHeader}>
                                    <div>
                                        <p className={styles.eyebrow}>API documentation</p>
                                        <h2>Endpoint Details</h2>
                                    </div>
                                    <FileText size={20} />
                                </div>
                                <div className={styles.docsGrid}>
                                    {apiDocs.map((group) => (
                                        <article className={styles.docGroup} key={group.title}>
                                            <h3>{group.title}</h3>
                                            <p>{group.description}</p>
                                            {group.endpoints.map((endpoint) => (
                                                <div className={styles.endpointRow} key={`${endpoint.method}-${endpoint.path}`}>
                                                    <span className={styles.method}>{endpoint.method}</span>
                                                    <code>{endpoint.path}</code>
                                                    <small>{endpoint.auth}</small>
                                                    <p>{endpoint.detail}</p>
                                                </div>
                                            ))}
                                        </article>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'wallet' && (
                        <div className={styles.stack}>
                            {error && <div className={styles.errorMessage}>{error}</div>}
                            <section className={styles.metricGrid}>
                                <div className={styles.metricCard}><span>Wallet balance</span><strong>{currency(walletBalance)}</strong></div>
                                <div className={styles.metricCard}><span>Transactions</span><strong>{walletHistory.length}</strong></div>
                                <div className={styles.metricCard}><span>API calls</span><strong>{apiUsage.total_usage || 0}</strong></div>
                                <div className={styles.metricCard}><span>Active API keys</span><strong>{apiUsage.active_keys || 0}</strong></div>
                            </section>

                            <section className={styles.twoColumn}>
                                <div className={styles.chartPanel}>
                                    <div className={styles.sectionHeader}>
                                        <div>
                                            <p className={styles.eyebrow}>API usage</p>
                                            <h2>Last 30 Days</h2>
                                        </div>
                                        <KeyRound size={20} />
                                    </div>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={dailyUsage}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                            <Tooltip />
                                            <Bar dataKey="calls" fill="#2563eb" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className={styles.chartPanel}>
                                    <div className={styles.sectionHeader}>
                                        <div>
                                            <p className={styles.eyebrow}>Wallet movement</p>
                                            <h2>Ledger Amounts</h2>
                                        </div>
                                        <CreditCard size={20} />
                                    </div>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <AreaChart data={walletGraph}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip formatter={(value) => currency(value)} />
                                            <Area type="monotone" dataKey="amount" stroke="#0f766e" fill="#ccfbf1" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </section>

                            <section className={styles.tablePanel}>
                                <div className={styles.sectionHeader}>
                                    <div>
                                        <p className={styles.eyebrow}>Wallet ledger</p>
                                        <h2>Transaction Details</h2>
                                    </div>
                                    <Wallet size={20} />
                                </div>
                                <div className={styles.tableWrap}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Transaction</th>
                                                <th>Description</th>
                                                <th>Type</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                                <th>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {walletHistory.length === 0 ? (
                                                <tr><td colSpan="6" className={styles.emptyCell}>No wallet transactions found.</td></tr>
                                            ) : walletHistory.map((row) => (
                                                <tr key={row.transaction_id}>
                                                    <td><code>{row.transaction_id}</code></td>
                                                    <td>{row.description || 'Wallet activity'}</td>
                                                    <td>{row.type}</td>
                                                    <td><span className={styles.status}>{row.status}</span></td>
                                                    <td>{formatDateTime(row.created_at)}</td>
                                                    <td className={styles.amount}>{currency(row.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </div>
                    )}
                    
                    {activeTab === 'usage' && (
                        <div className={styles.stack}>
                            <div className={styles.emptyState}>Usage visibility coming soon.</div>
                        </div>
                    )}
                </section>
            </section>
        </main>
    );
}
