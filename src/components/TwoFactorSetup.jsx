"use client";

import { useState, useEffect } from "react";

export default function TwoFactorSetup({ onClose, onSuccess }) {
    const [step, setStep] = useState(1); // 1: Generate, 2: Verify
    const [qrCode, setQrCode] = useState("");
    const [secret, setSecret] = useState("");
    const [backupCodes, setBackupCodes] = useState([]);
    const [verificationCode, setVerificationCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Generate 2FA setup
    const generateSetup = async () => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem('token');
            const apiBase = process.env.NEXT_PUBLIC_API_BASE || "https://api.giftgala.in";

            const response = await fetch(`${apiBase}/api/2fa/setup`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                setQrCode(data.data.qrCodeUrl);
                setSecret(data.data.secret);
                setBackupCodes(data.data.backupCodes);
                setStep(2);
            } else {
                setError(data.message || "Failed to generate 2FA setup");
            }
        } catch (error) {
            console.error("2FA setup error:", error);
            setError("Failed to generate 2FA setup");
        } finally {
            setLoading(false);
        }
    };

    // Verify and enable 2FA
    const verifyAndEnable = async () => {
        if (!verificationCode.trim()) {
            setError("Please enter the verification code");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem('token');
            const apiBase = process.env.NEXT_PUBLIC_API_BASE || "https://api.giftgala.in";

            const response = await fetch(`${apiBase}/api/2fa/verify-enable`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: verificationCode
                }),
            });

            const data = await response.json();

            if (data.success) {
                onSuccess && onSuccess();
            } else {
                setError(data.message || "Invalid verification code");
            }
        } catch (error) {
            console.error("2FA verification error:", error);
            setError("Failed to verify 2FA code");
        } finally {
            setLoading(false);
        }
    };

    // Auto-generate setup on component mount
    useEffect(() => {
        generateSetup();
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '32px',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflow: 'auto'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                    }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <circle cx="12" cy="16" r="1"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>
                        Enable Two-Factor Authentication
                    </h2>
                    <p style={{ color: '#6b7280', margin: '0', fontSize: '14px' }}>
                        Secure your account with an additional layer of protection
                    </p>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        color: '#dc2626',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            padding: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {loading ? (
                                <div>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        border: '4px solid #f3f4f6',
                                        borderTop: '4px solid #4f46e5',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                        margin: '0 auto 16px'
                                    }}></div>
                                    <p>Generating 2FA setup...</p>
                                </div>
                            ) : (
                                <p>Setting up 2FA...</p>
                            )}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        {/* Step 1: Scan QR Code */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                                Step 1: Scan QR Code
                            </h3>
                            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
                                Use Google Authenticator, Authy, or any TOTP app to scan this QR code:
                            </p>
                            
                            {qrCode && (
                                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                    <img 
                                        src={qrCode} 
                                        alt="2FA QR Code"
                                        style={{
                                            maxWidth: '200px',
                                            height: 'auto',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px'
                                        }}
                                    />
                                </div>
                            )}

                            <details style={{ marginTop: '12px' }}>
                                <summary style={{ 
                                    cursor: 'pointer', 
                                    color: '#4f46e5', 
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}>
                                    Can't scan? Enter manually
                                </summary>
                                <div style={{
                                    marginTop: '8px',
                                    padding: '12px',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontFamily: 'monospace',
                                    wordBreak: 'break-all'
                                }}>
                                    {secret}
                                </div>
                            </details>
                        </div>

                        {/* Step 2: Verify */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                                Step 2: Enter Verification Code
                            </h3>
                            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
                                Enter the 6-digit code from your authenticator app:
                            </p>
                            
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="000000"
                                maxLength={6}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '18px',
                                    textAlign: 'center',
                                    letterSpacing: '0.1em',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#4f46e5';
                                    e.target.style.boxShadow = '0 0 0 2px rgba(79, 70, 229, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#d1d5db';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        {/* Backup Codes */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                                Backup Codes
                            </h3>
                            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
                                Save these backup codes in a safe place. You can use them to access your account if you lose your phone:
                            </p>
                            
                            <div style={{
                                backgroundColor: '#f9fafb',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                padding: '16px',
                                fontSize: '14px',
                                fontFamily: 'monospace'
                            }}>
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(2, 1fr)', 
                                    gap: '8px' 
                                }}>
                                    {backupCodes.map((code, index) => (
                                        <div key={index} style={{ padding: '4px 0' }}>
                                            {code}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    flex: 1,
                                    padding: '12px 24px',
                                    backgroundColor: '#f9fafb',
                                    color: '#374151',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={verifyAndEnable}
                                disabled={loading || !verificationCode.trim()}
                                style={{
                                    flex: 1,
                                    padding: '12px 24px',
                                    backgroundColor: loading || !verificationCode.trim() ? '#9ca3af' : '#4f46e5',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: loading || !verificationCode.trim() ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                {loading ? (
                                    <>
                                        <div style={{
                                            width: '16px',
                                            height: '16px',
                                            border: '2px solid #ffffff',
                                            borderTop: '2px solid transparent',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite'
                                        }}></div>
                                        Enabling...
                                    </>
                                ) : (
                                    'Enable 2FA'
                                )}
                            </button>
                        </div>
                    </div>
                )}

                <style jsx>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    );
}