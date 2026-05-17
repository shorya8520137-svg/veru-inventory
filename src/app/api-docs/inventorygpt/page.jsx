'use client';

import React, { useState } from 'react';
import {
    Copy,
    ChevronDown,
    ChevronUp,
    Shield,
    Zap,
    Database,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Code,
    ExternalLink
} from 'lucide-react';
import styles from './inventorygpt-docs.module.css';

const API_BASE = 'https://api.insora.in';

const endpoints = [
    {
        section: 'Authentication & Tokens',
        icon: Shield,
        endpoints: [
            {
                method: 'GET',
                path: '/api/inventorygpt',
                auth: 'Public',
                title: 'Health Check',
                description: 'Verify the InventoryGPT API service is operational and get endpoint discovery info.',
                example: `curl -X GET ${API_BASE}/api/inventorygpt`,
                response: {
                    status: 200,
                    body: {
                        success: true,
                        message: 'InventoryGPT API is operational',
                        endpoints: [
                            'GET /api/inventorygpt/inventory-state',
                            'GET /api/inventorygpt/warehouse-metrics',
                            'GET /api/inventorygpt/regional-demand',
                            'GET /api/inventorygpt/recommendations',
                            'POST /api/inventorygpt/recommendations'
                        ]
                    }
                }
            },
            {
                method: 'GET',
                path: '/api/inventorygpt/tokens',
                auth: 'Staff JWT (Bearer token)',
                title: 'List InventoryGPT Tokens',
                description: 'Retrieve all InventoryGPT API tokens created by the authenticated user.',
                example: `curl -X GET ${API_BASE}/api/inventorygpt/tokens \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
                response: {
                    status: 200,
                    body: {
                        success: true,
                        tokens: [
                            {
                                id: 'token_123',
                                name: 'Production Agent',
                                description: 'Main InventoryGPT production instance',
                                token: 'igpt_abc123def456...',
                                is_active: true,
                                rate_limit: 5000,
                                usage_count: 1240,
                                created_at: '2026-01-15T10:30:00Z',
                                expires_at: '2026-04-15T10:30:00Z',
                                last_used_at: '2026-05-15T14:22:00Z'
                            }
                        ]
                    }
                }
            },
            {
                method: 'POST',
                path: '/api/inventorygpt/tokens',
                auth: 'Staff JWT (Bearer token)',
                title: 'Create InventoryGPT Token',
                description: 'Generate a new InventoryGPT API token with customizable rate limits and expiration.',
                params: {
                    name: 'string (required) - Token name/identifier',
                    description: 'string (optional) - Token description',
                    rate_limit: 'integer (default: 1000) - Requests per hour (100-10000)',
                    expires_in_days: 'integer (default: 90) - Token expiration in days (7-365)'
                },
                example: `curl -X POST ${API_BASE}/api/inventorygpt/tokens \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Staging Agent",
    "description": "Development InventoryGPT instance",
    "rate_limit": 2000,
    "expires_in_days": 60
  }'`,
                response: {
                    status: 201,
                    body: {
                        success: true,
                        message: 'Token created successfully',
                        token: 'igpt_def789ghi012jkl345...',
                        name: 'Staging Agent',
                        expires_at: '2026-07-14T15:45:30Z',
                        rate_limit: 2000
                    }
                }
            },
            {
                method: 'DELETE',
                path: '/api/inventorygpt/tokens/{tokenId}',
                auth: 'Staff JWT (Bearer token)',
                title: 'Revoke InventoryGPT Token',
                description: 'Deactivate/revoke an InventoryGPT token. The token immediately becomes invalid for API requests.',
                example: `curl -X DELETE ${API_BASE}/api/inventorygpt/tokens/token_123 \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
                response: {
                    status: 200,
                    body: {
                        success: true,
                        message: 'Token revoked successfully',
                        token_id: 'token_123'
                    }
                }
            }
        ]
    },
    {
        section: 'Data Feed Endpoints',
        icon: Database,
        endpoints: [
            {
                method: 'GET',
                path: '/api/inventorygpt/inventory-state',
                auth: 'InventoryGPT Token (Bearer token with "igpt_" prefix)',
                title: 'Get Current Inventory State',
                description: 'Real-time inventory snapshot across all warehouses. Returns SKU-level stock, availability, and health metrics.',
                params: {
                    warehouse_id: 'integer (optional) - Filter by specific warehouse',
                    category: 'string (optional) - Filter by stock category (ACTIVE, SLOW_MOVING, DEAD_STOCK, SEASONAL)',
                    sku: 'string (optional) - Filter by specific product SKU',
                    min_stock: 'integer (optional) - Only return items below this threshold'
                },
                example: `curl -X GET "${API_BASE}/api/inventorygpt/inventory-state?warehouse_id=1&category=ACTIVE" \\
  -H "Authorization: Bearer igpt_your_token_here"`,
                response: {
                    status: 200,
                    body: {
                        success: true,
                        timestamp: '2026-05-15T14:30:00Z',
                        inventory: [
                            {
                                id: 'inv_456',
                                sku: 'PROD-001',
                                product_name: 'Premium Widget A',
                                warehouse_id: 1,
                                warehouse_name: 'Mumbai Central',
                                stock_level: 450,
                                available_stock: 420,
                                reserved_stock: 30,
                                stock_category: 'ACTIVE',
                                last_verified_at: '2026-05-15T08:00:00Z',
                                velocity: 45.5,
                                days_of_stock: 9.8,
                                health_score: 92,
                                margin_percentage: 35.5,
                                avg_daily_sales: 45.8
                            }
                        ],
                        total_records: 1247,
                        query_time_ms: 142
                    }
                }
            },
            {
                method: 'GET',
                path: '/api/inventorygpt/warehouse-metrics',
                auth: 'InventoryGPT Token',
                title: 'Get Warehouse Performance Metrics',
                description: 'Warehouse-level KPIs for transfer and dispatch decision making. Includes health scores, utilization, and risk indicators.',
                params: {
                    warehouse_id: 'integer (optional) - Specific warehouse ID',
                    region: 'string (optional) - Filter by region code'
                },
                example: `curl -X GET "${API_BASE}/api/inventorygpt/warehouse-metrics" \\
  -H "Authorization: Bearer igpt_your_token_here"`,
                response: {
                    status: 200,
                    body: {
                        success: true,
                        timestamp: '2026-05-15T14:30:00Z',
                        warehouses: [
                            {
                                warehouse_id: 1,
                                warehouse_name: 'Mumbai Central',
                                region: 'West',
                                health_score: 88,
                                dead_stock_ratio: 0.12,
                                storage_utilization_pct: 75.3,
                                capacity_units: 10000,
                                current_utilization: 7530,
                                avg_fulfillment_days: 2.1,
                                total_skus: 450,
                                active_skus: 380,
                                slow_moving_skus: 50,
                                dead_skus: 20,
                                dispatch_volume_last_7d: 1240,
                                avg_daily_dispatch: 177.14,
                                stockout_incidents_30d: 3,
                                overstock_incidents_30d: 8
                            }
                        ],
                        total_records: 5,
                        query_time_ms: 89
                    }
                }
            },
            {
                method: 'GET',
                path: '/api/inventorygpt/regional-demand',
                auth: 'InventoryGPT Token',
                title: 'Get Regional Demand Analytics',
                description: 'Regional sales velocity and demand trends. Supports optional filtering for specific regions or SKUs.',
                params: {
                    region: 'string (optional) - Region code (e.g., "West", "East", "North")',
                    sku: 'string (optional) - Filter by specific SKU',
                    days: 'integer (default: 30) - Lookback period in days',
                    group_by: 'string (optional) - "region" or "sku" (default: "region")'
                },
                example: `curl -X GET "${API_BASE}/api/inventorygpt/regional-demand?region=West&days=30" \\
  -H "Authorization: Bearer igpt_your_token_here"`,
                response: {
                    status: 200,
                    body: {
                        success: true,
                        period: {
                            start_date: '2026-04-15',
                            end_date: '2026-05-15',
                            days: 30
                        },
                        regional_data: [
                            {
                                region: 'West',
                                daily_velocity: 523.4,
                                velocity_trend: 'INCREASING',
                                total_sales_30d: 15702,
                                avg_order_value: 285.50,
                                stockout_incidents: 2,
                                peak_demand_days: ['Friday', 'Saturday'],
                                forecast_30d: 15890
                            }
                        ],
                        query_time_ms: 156
                    }
                }
            }
        ]
    },
    {
        section: 'Recommendations',
        icon: TrendingUp,
        endpoints: [
            {
                method: 'GET',
                path: '/api/inventorygpt/recommendations',
                auth: 'InventoryGPT Token',
                title: 'Fetch Recommendations',
                description: 'Retrieve InventoryGPT AI recommendations for stock movements, transfers, and optimizations.',
                params: {
                    status: 'string (optional) - Filter by status (pending, approved, rejected, executed)',
                    agent: 'string (optional) - Filter by agent name',
                    limit: 'integer (default: 20) - Number of records to return'
                },
                example: `curl -X GET "${API_BASE}/api/inventorygpt/recommendations?status=pending&limit=10" \\
  -H "Authorization: Bearer igpt_your_token_here"`,
                response: {
                    status: 200,
                    body: {
                        success: true,
                        recommendations: [
                            {
                                id: 'rec_789',
                                agent_name: 'Transfer Optimizer',
                                recommendation_type: 'TRANSFER',
                                source_warehouse: 1,
                                destination_warehouse: 3,
                                sku: 'PROD-001',
                                quantity: 200,
                                reason: 'High demand in West region with excess stock in Central',
                                confidence_score: 0.94,
                                status: 'pending',
                                estimated_savings: 4500.00,
                                created_at: '2026-05-15T10:30:00Z',
                                expires_at: '2026-05-22T10:30:00Z'
                            }
                        ],
                        total_records: 5,
                        query_time_ms: 78
                    }
                }
            },
            {
                method: 'POST',
                path: '/api/inventorygpt/recommendations',
                auth: 'InventoryGPT Token',
                title: 'Submit Recommendation',
                description: 'InventoryGPT agents submit recommendations for human review and execution.',
                params: {
                    agent_name: 'string - AI agent identifier',
                    recommendation_type: 'string - TRANSFER, REORDER, MARKDOWN, CONSOLIDATE',
                    source_warehouse: 'integer (optional) - Source warehouse ID',
                    destination_warehouse: 'integer (optional) - Destination warehouse ID',
                    sku: 'string - Product SKU',
                    quantity: 'integer - Recommended quantity',
                    reason: 'string - Detailed reasoning',
                    confidence_score: 'float (0-1) - AI confidence level',
                    estimated_savings: 'float - Estimated cost savings'
                },
                example: `curl -X POST ${API_BASE}/api/inventorygpt/recommendations \\
  -H "Authorization: Bearer igpt_your_token_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_name": "Transfer Optimizer",
    "recommendation_type": "TRANSFER",
    "source_warehouse": 1,
    "destination_warehouse": 3,
    "sku": "PROD-001",
    "quantity": 200,
    "reason": "High regional demand",
    "confidence_score": 0.94,
    "estimated_savings": 4500
  }'`,
                response: {
                    status: 201,
                    body: {
                        success: true,
                        message: 'Recommendation submitted successfully',
                        recommendation_id: 'rec_789',
                        status: 'pending'
                    }
                }
            },
            {
                method: 'PUT',
                path: '/api/inventorygpt/recommendations/{id}/approve',
                auth: 'Staff JWT',
                title: 'Approve Recommendation',
                description: 'Human user approves an AI recommendation for execution.',
                example: `curl -X PUT ${API_BASE}/api/inventorygpt/recommendations/rec_789/approve \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
                response: {
                    status: 200,
                    body: {
                        success: true,
                        message: 'Recommendation approved',
                        recommendation_id: 'rec_789',
                        status: 'approved'
                    }
                }
            },
            {
                method: 'PUT',
                path: '/api/inventorygpt/recommendations/{id}/reject',
                auth: 'Staff JWT',
                title: 'Reject Recommendation',
                description: 'Human user rejects an AI recommendation with optional feedback.',
                params: {
                    reason: 'string (optional) - Rejection reason/feedback'
                },
                example: `curl -X PUT ${API_BASE}/api/inventorygpt/recommendations/rec_789/reject \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"reason": "Stock needed for peak season"}'`,
                response: {
                    status: 200,
                    body: {
                        success: true,
                        message: 'Recommendation rejected',
                        recommendation_id: 'rec_789',
                        status: 'rejected'
                    }
                }
            }
        ]
    }
];

function EndpointCard({ endpoint, baseApi }) {
    const [expanded, setExpanded] = useState(false);
    
    const methodColors = {
        GET: '#3b82f6',
        POST: '#10b981',
        PUT: '#f59e0b',
        DELETE: '#ef4444'
    };

    return (
        <div className={styles.endpointCard}>
            <button
                className={styles.cardHeader}
                onClick={() => setExpanded(!expanded)}
            >
                <div className={styles.methodBadge} style={{ backgroundColor: methodColors[endpoint.method] }}>
                    {endpoint.method}
                </div>
                <div className={styles.pathAndTitle}>
                    <code className={styles.path}>{endpoint.path}</code>
                    <p className={styles.title}>{endpoint.title}</p>
                </div>
                {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {expanded && (
                <div className={styles.cardBody}>
                    <div className={styles.section}>
                        <h4>Description</h4>
                        <p>{endpoint.description}</p>
                    </div>

                    <div className={styles.section}>
                        <h4>Authentication</h4>
                        <div className={styles.authBadge}>{endpoint.auth}</div>
                    </div>

                    {endpoint.params && (
                        <div className={styles.section}>
                            <h4>Parameters</h4>
                            <div className={styles.paramsList}>
                                {Object.entries(endpoint.params).map(([key, desc]) => (
                                    <div key={key} className={styles.param}>
                                        <code>{key}</code>
                                        <p>{desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={styles.section}>
                        <h4>Example Request</h4>
                        <div className={styles.codeBlock}>
                            <pre>{endpoint.example}</pre>
                            <button
                                className={styles.copyBtn}
                                onClick={() => navigator.clipboard.writeText(endpoint.example)}
                                title="Copy to clipboard"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h4>Example Response</h4>
                        <div className={styles.responseBlock}>
                            <div className={styles.statusCode}>HTTP {endpoint.response.status}</div>
                            <pre>{JSON.stringify(endpoint.response.body, null, 2)}</pre>
                            <button
                                className={styles.copyBtn}
                                onClick={() => navigator.clipboard.writeText(JSON.stringify(endpoint.response.body, null, 2))}
                                title="Copy to clipboard"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function InventoryGPTDocsPage() {
    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1>InventoryGPT API Documentation</h1>
                    <p>Complete API reference for InventoryGPT data feeds and AI-powered inventory intelligence</p>
                    <p className={styles.domain}>Base URL: <code>{API_BASE}</code></p>
                </div>
            </section>

            <section className={styles.quickStart}>
                <h2>Quick Start</h2>
                <div className={styles.quickStartCards}>
                    <div className={styles.card}>
                        <Shield size={24} />
                        <h3>1. Generate Token</h3>
                        <p>Create an InventoryGPT API token in your Profile â†’ InventoryGPT API section</p>
                    </div>
                    <div className={styles.card}>
                        <Zap size={24} />
                        <h3>2. Authenticate</h3>
                        <p>Include your token in the Authorization header with Bearer prefix</p>
                    </div>
                    <div className={styles.card}>
                        <Database size={24} />
                        <h3>3. Query Data</h3>
                        <p>Fetch inventory, warehouse metrics, and demand analytics</p>
                    </div>
                </div>
            </section>

            <section className={styles.authSection}>
                <h2>Authentication</h2>
                <div className={styles.authBox}>
                    <h3>Bearer Token Authentication</h3>
                    <p>All InventoryGPT data feed endpoints require a Bearer token in the Authorization header:</p>
                    <div className={styles.codeBlock}>
                        <pre>{`Authorization: Bearer igpt_your_token_here

// Example with curl
curl -X GET ${API_BASE}/api/inventorygpt/inventory-state \\
  -H "Authorization: Bearer igpt_your_token_here"`}</pre>
                    </div>
                    <div className={styles.infoBox}>
                        <AlertCircle size={16} />
                        <p><strong>Note:</strong> Tokens starting with <code>igpt_</code> are InventoryGPT data feed tokens. Staff JWT tokens are required for token management endpoints.</p>
                    </div>
                </div>
            </section>

            <section className={styles.rateLimit}>
                <h2>Rate Limiting</h2>
                <div className={styles.rateLimitBox}>
                    <div className={styles.rateLimitItem}>
                        <h3>Requests per Hour</h3>
                        <p>Token-specific limits (default: 1000, max: 10000)</p>
                    </div>
                    <div className={styles.rateLimitItem}>
                        <h3>Response Headers</h3>
                        <code>X-RateLimit-Limit: 1000</code>
                        <code>X-RateLimit-Remaining: 987</code>
                        <code>X-RateLimit-Reset: 1685362800</code>
                    </div>
                </div>
            </section>

            <section className={styles.endpointsSection}>
                <h2>Endpoints</h2>
                {endpoints.map((group) => {
                    const Icon = group.icon;
                    return (
                        <div key={group.section} className={styles.endpointGroup}>
                            <div className={styles.groupHeader}>
                                <Icon size={24} />
                                <h3>{group.section}</h3>
                            </div>
                            <div className={styles.endpointsList}>
                                {group.endpoints.map((endpoint, idx) => (
                                    <EndpointCard
                                        key={`${endpoint.method}-${endpoint.path}-${idx}`}
                                        endpoint={endpoint}
                                        baseApi={API_BASE}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </section>

            <section className={styles.errorHandling}>
                <h2>Error Handling</h2>
                <div className={styles.errorGrid}>
                    <div className={styles.errorCard}>
                        <div className={styles.errorCode}>401</div>
                        <h4>Unauthorized</h4>
                        <p>Invalid or missing token</p>
                    </div>
                    <div className={styles.errorCard}>
                        <div className={styles.errorCode}>429</div>
                        <h4>Too Many Requests</h4>
                        <p>Rate limit exceeded</p>
                    </div>
                    <div className={styles.errorCard}>
                        <div className={styles.errorCode}>500</div>
                        <h4>Server Error</h4>
                        <p>Internal service error</p>
                    </div>
                </div>
            </section>

            <section className={styles.support}>
                <h2>Support</h2>
                <p>For questions or issues, contact: <code>support@insora.in</code></p>
            </section>
        </main>
    );
}
