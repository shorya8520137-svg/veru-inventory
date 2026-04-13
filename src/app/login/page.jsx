"use client";

import { useState } from "react";
import styles from './login.module.css';

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // 2FA States
    const [requires2FA, setRequires2FA] = useState(false);
    const [twoFactorToken, setTwoFactorToken] = useState("");
    const [userId, setUserId] = useState(null);
    const [isBackupCode, setIsBackupCode] = useState(false);
    
    // 2FA Setup Modal States
    const [show2FASetup, setShow2FASetup] = useState(false);
    const [setupStep, setSetupStep] = useState(1);
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [backupCodes, setBackupCodes] = useState([]);
    const [verificationCode, setVerificationCode] = useState("");
    const [setupSuccess, setSetupSuccess] = useState("");

    // ENHANCED LOGIN LOGIC WITH 2FA SUPPORT
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        console.log("🚀 Form submitted - JavaScript is working!");

        try {
            const apiBase = process.env.NEXT_PUBLIC_API_BASE || "https://api.giftgala.in";
            console.log("🔗 API Base:", apiBase);

            // Prepare request body
            const requestBody = { 
                email, 
                password,
                ...(requires2FA && twoFactorToken && { 
                    two_factor_token: twoFactorToken,
                    isBackupCode: isBackupCode 
                })
            };
            console.log("� Request body:", { ...requestBody, password: "***" });

            const response = await fetch(`${apiBase}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            console.log("📥 Response status:", response.status);
            const data = await response.json();
            console.log("📥 Response data:", data);

            // Handle 2FA requirement
            if (data.requires_2fa && !requires2FA) {
                console.log("🔐 2FA Required - Showing 2FA input");
                setRequires2FA(true);
                setUserId(data.user_id);
                setLoading(false);
                return;
            }

            // Handle successful login
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                console.log("✅ Login successful! Redirecting...");
                window.location.href = "/products";
            } else {
                setError(data.message || "Invalid credentials");
                console.log("❌ Login failed:", data.message);
                
                // Reset 2FA state on error
                if (requires2FA) {
                    setTwoFactorToken("");
                }
            }
        } catch (error) {
            console.error("❌ Network error:", error);
            setError("Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Handle 2FA token submission
    const handle2FASubmit = async (e) => {
        e.preventDefault();
        
        if (!twoFactorToken.trim()) {
            setError("Please enter your 2FA code");
            return;
        }

        // Trigger the main login flow with 2FA token
        await handleSubmit(e);
    };

    // Reset 2FA flow
    const reset2FA = () => {
        setRequires2FA(false);
        setTwoFactorToken("");
        setUserId(null);
        setIsBackupCode(false);
        setError("");
    };

    // 2FA Setup Functions
    const start2FASetup = async () => {
        if (!email.trim() || !password.trim()) {
            setError("Please enter your email and password first to set up 2FA");
            return;
        }

        setLoading(true);
        setError("");
        
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_BASE || "https://api.giftgala.in";
            
            // First login to get token
            const loginResponse = await fetch(`${apiBase}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            
            const loginData = await loginResponse.json();
            
            if (!loginData.success) {
                setError(loginData.message || 'Invalid credentials');
                return;
            }
            
            // Now setup 2FA
            const setupResponse = await fetch(`${apiBase}/api/2fa/setup`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${loginData.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const setupData = await setupResponse.json();
            
            console.log('🔐 Setup response:', setupData);
            
            if (setupData.success) {
                console.log('✅ 2FA setup successful');
                console.log('QR Code URL length:', setupData.data.qrCodeUrl ? setupData.data.qrCodeUrl.length : 0);
                console.log('Backup codes count:', setupData.data.backupCodes ? setupData.data.backupCodes.length : 0);
                
                setQrCodeUrl(setupData.data.qrCodeUrl);
                setBackupCodes(setupData.data.backupCodes);
                setShow2FASetup(true);
                setSetupStep(1);
                setUserId(loginData.user.id);
            } else {
                console.error('❌ 2FA setup failed:', setupData.message);
                setError(setupData.message || 'Failed to setup 2FA');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const verify2FASetup = async () => {
        if (!verificationCode.trim()) {
            setError("Please enter the verification code");
            return;
        }

        setLoading(true);
        setError("");
        
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_BASE || "https://api.giftgala.in";
            
            // Login again to get fresh token
            const loginResponse = await fetch(`${apiBase}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            
            const loginData = await loginResponse.json();
            
            if (!loginData.success) {
                setError('Authentication failed. Please try again.');
                return;
            }
            
            // Use the correct endpoint for setup verification
            const response = await fetch(`${apiBase}/api/2fa/verify-enable`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${loginData.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: verificationCode.trim()
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setSetupStep(3);
                setSetupSuccess("2FA has been successfully enabled for your account!");
            } else {
                setError(data.message || 'Invalid verification code. Please ensure your device time is synchronized and try again.');
            }
        } catch (error) {
            console.error('2FA verification error:', error);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const close2FASetup = () => {
        setShow2FASetup(false);
        setSetupStep(1);
        setQrCodeUrl("");
        setBackupCodes([]);
        setVerificationCode("");
        setSetupSuccess("");
        setError("");
    };

    return (
        <div className={styles.container}>
            {/* Background Elements */}
            <div className={styles.backgroundElements}>
                <div className={styles.circle1}></div>
                <div className={styles.circle2}></div>
                <div className={styles.circle3}></div>
            </div>

            {/* Login Card */}
            <div className={styles.loginCard}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.logo}>
                        <div className={styles.logoIcon}>
                            <img 
                                src="/logo-dark.png" 
                                alt="StockSphere Logo" 
                                style={{ 
                                    width: '32px', 
                                    height: '32px',
                                    objectFit: 'contain'
                                }}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentNode.innerHTML = '<div style="font-size: 20px; font-weight: bold; color: white;">SS</div>';
                                }}
                            />
                        </div>
                        <div className={styles.logoText}>
                            <div className={styles.companyName}>StockSphere</div>
                            <div className={styles.tagline}>INVENTORY MANAGEMENT</div>
                        </div>
                    </div>
                    
                    <h1 className={styles.title}>
                        {requires2FA ? 'Two-Factor Authentication' : 'Welcome Back'}
                    </h1>
                    <p className={styles.subtitle}>
                        {requires2FA 
                            ? 'Enter the 6-digit code from your authenticator app' 
                            : 'Sign in to your StockSphere account'
                        }
                    </p>
                </div>

                <form className={styles.form} onSubmit={requires2FA ? handle2FASubmit : handleSubmit}>
                    {error && (
                        <div className={styles.errorMessage}>
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Show 2FA input when required */}
                    {requires2FA ? (
                        <>
                            {/* 2FA Token Input */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    {isBackupCode ? 'Backup Code' : 'Authentication Code'}
                                </label>
                                <div className={styles.inputWrapper}>
                                    <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                        <circle cx="12" cy="16" r="1"/>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                    </svg>
                                    <input
                                        className={styles.input}
                                        type="text"
                                        value={twoFactorToken}
                                        onChange={(e) => setTwoFactorToken(e.target.value)}
                                        placeholder={isBackupCode ? "Enter 8-character backup code" : "Enter 6-digit code"}
                                        required
                                        autoFocus
                                        maxLength={isBackupCode ? 8 : 6}
                                        style={{ textAlign: 'center', letterSpacing: '0.1em' }}
                                    />
                                </div>
                            </div>

                            {/* Backup Code Toggle */}
                            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsBackupCode(!isBackupCode);
                                        setTwoFactorToken("");
                                        setError("");
                                    }}
                                    className={styles.linkButton}
                                >
                                    {isBackupCode ? 'Use authenticator code instead' : 'Use backup code instead'}
                                </button>
                            </div>

                            {/* 2FA Help Info */}
                            <div className={styles.helpBox}>
                                <div style={{ fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    💡 Need help with 2FA?
                                </div>
                                <div style={{ fontSize: '13px' }}>
                                    Open <strong>Google Authenticator</strong> app on your phone and enter the 6-digit code for "hunyhuny"
                                </div>
                            </div>

                            {/* Back Button */}
                            <button
                                type="button"
                                onClick={reset2FA}
                                className={styles.secondaryBtn}
                            >
                                ← Back to login
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Email Input */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Email Address</label>
                                <div className={styles.inputWrapper}>
                                    <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                    </svg>
                                    <input
                                        className={styles.input}
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Password</label>
                                <div className={styles.inputWrapper}>
                                    <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                    <input
                                        className={styles.input}
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                        style={{ paddingRight: '48px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={styles.passwordToggle}
                                    >
                                        {showPassword ? (
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                            </svg>
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading || (requires2FA && !twoFactorToken.trim())}
                        className={`${styles.submitBtn} ${loading ? styles.loading : ''}`}
                    >
                        {loading ? (
                            <>
                                <div className={styles.spinner}></div>
                                {requires2FA ? 'Verifying...' : 'Signing in...'}
                            </>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                    {requires2FA ? (
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    ) : (
                                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    )}
                                </svg>
                                {requires2FA ? 'Verify Code' : 'Sign In'}
                            </>
                        )}
                    </button>
                </form>
            </div>
            {/* 2FA Setup Modal */}
            {show2FASetup && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        {/* Close Button */}
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>
                                Setup Two-Factor Authentication
                            </h2>
                            <button
                                onClick={close2FASetup}
                                className={styles.closeButton}
                            >
                                ×
                            </button>
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                            <div className={styles.errorMessage}>
                                {error}
                            </div>
                        )}

                        {setupSuccess && (
                            <div className={styles.successMessage}>
                                {setupSuccess}
                            </div>
                        )}

                        {/* Step 1: QR Code */}
                        {setupStep === 1 && (
                            <div>
                                <h3 className={styles.stepTitle}>Step 1: Scan QR Code</h3>
                                <p className={styles.stepDescription}>
                                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                                </p>
                                
                                {qrCodeUrl ? (
                                    <div className={styles.qrCodeContainer}>
                                        <img 
                                            src={qrCodeUrl} 
                                            alt="2FA QR Code" 
                                            className={styles.qrCode}
                                            onError={(e) => {
                                                console.error('QR Code failed to load:', qrCodeUrl);
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className={styles.qrCodePlaceholder}>
                                        <p>QR Code is loading...</p>
                                        <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                                            If this persists, try refreshing or use manual setup
                                        </p>
                                    </div>
                                )}
                                
                                <button
                                    onClick={() => setSetupStep(2)}
                                    className={styles.submitBtn}
                                >
                                    I've Scanned the Code
                                </button>
                            </div>
                        )}

                        {/* Step 2: Verify */}
                        {setupStep === 2 && (
                            <div>
                                <h3 className={styles.stepTitle}>Step 2: Verify Setup</h3>
                                <p className={styles.stepDescription}>
                                    Enter the 6-digit code from your authenticator app
                                </p>
                                
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    placeholder="Enter 6-digit code"
                                    maxLength="6"
                                    className={styles.input}
                                    style={{
                                        textAlign: 'center',
                                        letterSpacing: '0.1em',
                                        fontSize: '18px',
                                        marginBottom: '20px'
                                    }}
                                />
                                
                                <div className={styles.buttonGroup}>
                                    <button
                                        onClick={verify2FASetup}
                                        disabled={loading || !verificationCode.trim()}
                                        className={`${styles.submitBtn} ${styles.successBtn}`}
                                        style={{ opacity: loading || !verificationCode.trim() ? 0.7 : 1 }}
                                    >
                                        {loading ? 'Verifying...' : 'Verify & Enable'}
                                    </button>
                                    
                                    <button
                                        onClick={() => setSetupStep(1)}
                                        className={styles.secondaryBtn}
                                    >
                                        Back
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Success */}
                        {setupStep === 3 && (
                            <div className={styles.successStep}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                                <h3 style={{ color: '#16a34a', marginBottom: '16px' }}>2FA Successfully Enabled!</h3>
                                <p style={{ marginBottom: '20px' }}>
                                    Your account is now protected with Two-Factor Authentication. You can now login normally.
                                </p>
                                
                                <button
                                    onClick={close2FASetup}
                                    className={styles.submitBtn}
                                >
                                    Continue to Login
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}