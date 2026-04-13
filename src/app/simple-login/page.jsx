"use client";

import { useState } from "react";

export default function SimpleLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        setDebugInfo("Form submitted! Starting login process...");

        try {
            const apiBase = process.env.NEXT_PUBLIC_API_BASE || "https://api.giftgala.in";
            setDebugInfo(`API Base: ${apiBase}`);

            const requestBody = { email, password };
            setDebugInfo(`Request body: ${JSON.stringify(requestBody)}`);

            const response = await fetch(`${apiBase}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            setDebugInfo(`Response status: ${response.status}`);
            const data = await response.json();
            setDebugInfo(`Response data: ${JSON.stringify(data)}`);

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setDebugInfo("✅ Login successful! Redirecting...");
                window.location.href = "/products";
            } else {
                setError(data.message || "Invalid credentials");
                setDebugInfo(`❌ Login failed: ${data.message}`);
            }
        } catch (error) {
            setError("Login failed. Please try again.");
            setDebugInfo(`❌ Network error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testButtonClick = () => {
        setDebugInfo("✅ Button click detected! JavaScript is working!");
        console.log("Button clicked - JavaScript is working!");
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#1f2937' }}>
                    Simple Login Test
                </h1>

                {/* Debug Info */}
                {debugInfo && (
                    <div style={{
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #0ea5e9',
                        padding: '1rem',
                        borderRadius: '4px',
                        marginBottom: '1rem',
                        fontSize: '0.875rem',
                        color: '#0c4a6e'
                    }}>
                        <strong>Debug:</strong> {debugInfo}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div style={{
                        backgroundColor: '#fef2f2',
                        border: '1px solid #ef4444',
                        padding: '1rem',
                        borderRadius: '4px',
                        marginBottom: '1rem',
                        color: '#dc2626'
                    }}>
                        {error}
                    </div>
                )}

                {/* Test Button */}
                <button
                    type="button"
                    onClick={testButtonClick}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        marginBottom: '1rem'
                    }}
                >
                    🧪 Test JavaScript Click
                </button>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@company.com"
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Admin@123"
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '1rem',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    <p>Test credentials:</p>
                    <p>Email: admin@company.com</p>
                    <p>Password: Admin@123</p>
                </div>
            </div>
        </div>
    );
}