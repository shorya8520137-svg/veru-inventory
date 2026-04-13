"use client";

import { useState, useEffect } from "react";
import { getToken } from "../../utils/api";

export default function SecurityPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    // 2FA States
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [backupCodes, setBackupCodes] = useState([]);
    const [verificationCode, setVerificationCode] = useState("");
    const [showSetup, setShowSetup] = useState(false);
    const [setupStep, setSetupStep] = useState(1);
    const [showDisableModal, setShowDisableModal] = useState(false);
    const [disablePassword, setDisablePassword] = useState("");
    const [disableToken, setDisableToken] = useState(""); // 1: QR Code, 2: Verify, 3: Backup Codes

    useEffect(() => {
        checkTwoFactorStatus();
    }, []);

    const checkTwoFactorStatus = async () => {
        try {
            const token = getToken();
            const apiBase = process.env.NEXT_PUBLIC_API_BASE || "https://api.giftgala.in";
            
            const response = await fetch(`${apiBase}/api/2fa/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            if (data.success) {
                setTwoFactorEnabled(data.data.enabled || false);
            }
        } catch (error) {
            console.error('Error checking 2FA status:', error);
        }
    };

    const startTwoFactorSetup = async () => {
        setLoading(true);
        setError("");
        
        try {
            const token = getToken();
            const apiBase = process.env.NEXT_PUBLIC_API_BASE || "https://api.giftgala.in";
            
            const response = await fetch(`${apiBase}/api/2fa/setup`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                setQrCodeUrl(data.data.qrCodeUrl);
                setBackupCodes(data.data.backupCodes);
                setShowSetup(true);
                setSetupStep(1);
            } else {
                setError(data.message || 'Failed to setup 2FA');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const verifyAndEnable2FA = async () => {
        if (!verificationCode.trim()) {
            setError("Please enter the verification code");
            return;
        }

        setLoading(true);
        setError("");
        
        try {
            const token = getToken();
            const apiBase = process.env.NEXT_PUBLIC_API_BASE || "https://api.giftgala.in";
            
            const response = await fetch(`${apiBase}/api/2fa/verify-enable`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: verificationCode
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setTwoFactorEnabled(true);
                setSetupStep(3);
                setSuccess("2FA has been successfully enabled!");
            } else {
                setError(data.message || 'Invalid verification code');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const disable2FA = async () => {
        setShowDisableModal(true);
    };

    const confirmDisable2FA = async () => {
        if (!disablePassword.trim() || !disableToken.trim()) {
            setError("Please enter both password and 2FA code");
            return;
        }

        setLoading(true);
        setError("");
        
        try {
            const authToken = getToken();
            const apiBase = process.env.NEXT_PUBLIC_API_BASE || "https://api.giftgala.in";
            
            const response = await fetch(`${apiBase}/api/2fa/disable`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    password: disablePassword,
                    token: disableToken
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setTwoFactorEnabled(false);
                setShowSetup(false);
                setSuccess("2FA has been disabled");
            } else {
                setError(data.message || 'Failed to disable 2FA');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const downloadBackupCodes = () => {
        const codesText = backupCodes.join('\n');
        const blob = new Blob([`Backup Codes for hunyhuny Inventory System\n\nGenerated: ${new Date().toLocaleString()}\n\n${codesText}\n\nKeep these codes safe! Each code can only be used once.`], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hunyhuny-backup-codes.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                    Security Settings
                </h1>
                <p style={{ color: '#6b7280', fontSize: '16px' }}>
                    Manage your account security and two-factor authentication
                </p>
            </div>

            {/* Error/Success Messages */}
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

            {success && (
                <div style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    color: '#16a34a',
                    fontSize: '14px'
                }}>
                    {success}
                </div>
            )}

            {/* Two-Factor Authentication Section */}
            <div style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        backgroundColor: twoFactorEnabled ? '#dcfce7' : '#fef3c7',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '16px'
                    }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={twoFactorEnabled ? '#16a34a' : '#d97706'} strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <circle cx="12" cy="16" r="1"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                    </div>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 4px 0' }}>
                            Two-Factor Authentication
                        </h3>
                        <p style={{ color: '#6b7280', margin: '0', fontSize: '14px' }}>
                            {twoFactorEnabled ? 'Your account is protected with 2FA' : 'Add an extra layer of security to your account'}
                        </p>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    marginBottom: '16px'
                }}>
                    <div>
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>
                            Status: {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            {twoFactorEnabled ? 'Your account requires 2FA for login' : 'Your account uses only password authentication'}
                        </div>
                    </div>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: twoFactorEnabled ? '#16a34a' : '#dc2626'
                    }}></div>
                </div>

                {!twoFactorEnabled && !showSetup && (
                    <button
                        onClick={startTwoFactorSetup}
                        disabled={loading}
                        style={{
                            backgroundColor: '#4f46e5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 24px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Setting up...' : 'Enable Two-Factor Authentication'}
                    </button>
                )}

                {twoFactorEnabled && (
                    <button
                        onClick={disable2FA}
                        disabled={loading}
                        style={{
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 24px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Disabling...' : 'Disable 2FA'}
                    </button>
                )}
            </div>

            {/* 2FA Setup Process */}
            {showSetup && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '500px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
                        border: '1px solid #e5e7eb'
                }}>
                    {setupStep === 1 && (
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                                Step 1: Scan QR Code
                            </h3>
                            <p style={{ 
                                color: '#d1d5db', 
                                marginBottom: '20px',
                                lineHeight: '1.5'
                            }}>
                                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                            </p>
                            
                            {qrCodeUrl && (
                                <div style={{ 
                                    textAlign: 'center', 
                                    marginBottom: '24px',
                                    padding: '20px',
                                    backgroundColor: '#374151',
                                    borderRadius: '12px',
                                    border: '1px solid #4b5563'
                                }}>
                                    <img 
                                        src={qrCodeUrl} 
                                        alt="2FA QR Code" 
                                        style={{ 
                                            maxWidth: '200px',
                                            borderRadius: '8px',
                                            backgroundColor: 'white',
                                            padding: '10px'
                                        }} 
                                    />
                                </div>
                            )}
                            
                            <button
                                onClick={() => setSetupStep(2)}
                                style={{
                                    backgroundColor: '#4f46e5',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '12px 24px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    width: '100%',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#4338ca'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#4f46e5'}
                            >
                                I've Scanned the Code
                            </button>
                        </div>
                    )}

                    {setupStep === 2 && (
                        <div>
                            <h3 style={{ 
                                color: '#f9fafb', 
                                marginBottom: '16px',
                                fontSize: '18px',
                                fontWeight: '600'
                            }}>
                                Step 2: Verify Setup
                            </h3>
                            <p style={{ 
                                color: '#d1d5db', 
                                marginBottom: '20px',
                                lineHeight: '1.5'
                            }}>
                                Enter the 6-digit code from your authenticator app to verify the setup
                            </p>
                            
                            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    placeholder="000000"
                                    maxLength="6"
                                    style={{
                                        width: '200px',
                                        padding: '16px',
                                        border: '2px solid #4b5563',
                                        borderRadius: '12px',
                                        fontSize: '24px',
                                        textAlign: 'center',
                                        letterSpacing: '0.2em',
                                        backgroundColor: '#374151',
                                        color: '#f9fafb',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                                    onBlur={(e) => e.target.style.borderColor = '#4b5563'}
                                />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={verifyAndEnable2FA}
                                    disabled={loading || !verificationCode.trim()}
                                    style={{
                                        backgroundColor: '#16a34a',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '12px 24px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: loading || !verificationCode.trim() ? 'not-allowed' : 'pointer',
                                        opacity: loading || !verificationCode.trim() ? 0.7 : 1
                                    }}
                                >
                                    {loading ? 'Verifying...' : 'Verify & Enable'}
                                </button>
                                
                                <button
                                    onClick={() => setSetupStep(1)}
                                    style={{
                                        backgroundColor: '#6b7280',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '12px 24px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Back
                                </button>
                            </div>
                        </div>
                    )}

                    {setupStep === 3 && (
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#16a34a' }}>
                                ✅ 2FA Successfully Enabled!
                            </h3>
                            <p style={{ color: '#6b7280', marginBottom: '20px' }}>
                                Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
                            </p>
                            
                            <div style={{
                                backgroundColor: '#f9fafb',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                padding: '16px',
                                marginBottom: '20px'
                            }}>
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(2, 1fr)', 
                                    gap: '8px',
                                    fontFamily: 'monospace',
                                    fontSize: '14px'
                                }}>
                                    {backupCodes.map((code, index) => (
                                        <div key={index} style={{ padding: '4px 8px', backgroundColor: 'white', borderRadius: '4px' }}>
                                            {code}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={downloadBackupCodes}
                                    style={{
                                        backgroundColor: '#4f46e5',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '12px 24px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Download Backup Codes
                                </button>
                                
                                <button
                                    onClick={() => {
                                        setShowSetup(false);
                                        setSuccess("");
                                    }}
                                    style={{
                                        backgroundColor: '#16a34a',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '12px 24px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Complete Setup
                                </button>
                            </div>
                        </div>
                    )}
                    </div>
                </div>
            )}

            {/* Disable 2FA Modal */}
            {showDisableModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '400px',
                        width: '100%',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
                        border: '1px solid #e5e7eb'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            marginBottom: '24px' 
                        }}>
                            <h2 style={{ 
                                margin: 0, 
                                color: '#1f2937', 
                                fontSize: '20px', 
                                fontWeight: 'bold' 
                            }}>
                                Disable Two-Factor Authentication
                            </h2>
                            <button
                                onClick={() => {
                                    setShowDisableModal(false);
                                    setDisablePassword("");
                                    setDisableToken("");
                                    setError("");
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                    padding: '4px'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <p style={{ 
                            color: '#6b7280', 
                            marginBottom: '20px',
                            lineHeight: '1.5'
                        }}>
                            Enter your current password and 2FA code to disable two-factor authentication.
                        </p>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ 
                                display: 'block', 
                                color: '#1f2937', 
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={disablePassword}
                                onChange={(e) => setDisablePassword(e.target.value)}
                                placeholder="Enter your password"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    backgroundColor: '#f9fafb',
                                    color: '#1f2937',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ 
                                display: 'block', 
                                color: '#1f2937', 
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                2FA Code
                            </label>
                            <input
                                type="text"
                                value={disableToken}
                                onChange={(e) => setDisableToken(e.target.value)}
                                placeholder="000000"
                                maxLength="6"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '18px',
                                    textAlign: 'center',
                                    letterSpacing: '0.1em',
                                    backgroundColor: '#f9fafb',
                                    color: '#1f2937',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={confirmDisable2FA}
                                disabled={loading || !disablePassword.trim() || !disableToken.trim()}
                                style={{
                                    backgroundColor: loading || !disablePassword.trim() || !disableToken.trim() ? '#6b7280' : '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '12px 24px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: loading || !disablePassword.trim() || !disableToken.trim() ? 'not-allowed' : 'pointer',
                                    flex: 1
                                }}
                            >
                                {loading ? 'Disabling...' : 'Disable 2FA'}
                            </button>

                            <button
                                onClick={() => {
                                    setShowDisableModal(false);
                                    setDisablePassword("");
                                    setDisableToken("");
                                    setError("");
                                }}
                                style={{
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '12px 24px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}