/**
 * TWO FACTOR AUTHENTICATION SERVICE
 * Handles Google Authenticator 2FA functionality
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const db = require('../db/connection');

class TwoFactorAuthService {
    
    /**
     * Generate a new 2FA secret for user
     */
    generateSecret(userEmail, serviceName = 'StockIQ Inventory') {
        const secret = speakeasy.generateSecret({
            name: userEmail,
            issuer: serviceName,
            length: 32
        });
        
        return {
            secret: secret.base32,
            otpauthUrl: secret.otpauth_url,
            qrCodeUrl: null // Will be generated separately
        };
    }
    
    /**
     * Generate QR code for the secret
     */
    async generateQRCode(otpauthUrl) {
        try {
            const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);
            return qrCodeDataURL;
        } catch (error) {
            console.error('QR Code generation error:', error);
            throw new Error('Failed to generate QR code');
        }
    }
    
    /**
     * Verify 2FA token with enhanced time synchronization
     */
    verifyToken(secret, token) {
        // Clean the token (remove spaces, ensure it's 6 digits)
        const cleanToken = token.toString().replace(/\s/g, '');
        
        console.log(`🔐 Verifying token: ${cleanToken}`);
        console.log(`🔐 Secret length: ${secret ? secret.length : 'null'}`);
        console.log(`🔐 Secret format valid: ${secret ? /^[A-Z2-7]+=*$/.test(secret) : false}`);
        
        if (!/^\d{6}$/.test(cleanToken)) {
            console.log('❌ Invalid token format:', cleanToken);
            return false;
        }
        
        if (!secret) {
            console.log('❌ No secret provided');
            return false;
        }
        
        // Generate current token for comparison
        const currentToken = speakeasy.totp({
            secret: secret,
            encoding: 'base32'
        });
        console.log(`🔐 Current expected token: ${currentToken}`);
        
        // Try with multiple verification approaches
        
        // 1. Standard verification with large window (10 time steps = 5 minutes)
        const standardResult = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: cleanToken,
            window: 10 // Allow 10 time steps (5 minutes) tolerance
        });
        
        if (standardResult) {
            console.log(`✅ Token verification successful (standard method)`);
            return true;
        }
        
        // 2. Manual time offset verification (more aggressive)
        console.log('🔐 Trying manual time offsets...');
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Try offsets from -10 minutes to +10 minutes in 30-second steps
        for (let offset = -600; offset <= 600; offset += 30) {
            const adjustedTime = currentTime + offset;
            const offsetResult = speakeasy.totp.verify({
                secret: secret,
                encoding: 'base32',
                token: cleanToken,
                time: adjustedTime,
                window: 0 // No additional window for manual offset
            });
            
            if (offsetResult) {
                console.log(`✅ Token valid with ${offset}s offset (${Math.round(offset/60)}m ${offset%60}s)`);
                return true;
            }
        }
        
        // 3. Generate tokens for debugging
        console.log('🔐 Recent expected tokens:');
        for (let i = -3; i <= 3; i++) {
            const timeStep = currentTime + (i * 30);
            const expectedToken = speakeasy.totp({
                secret: secret,
                encoding: 'base32',
                time: timeStep
            });
            const timeDesc = i === 0 ? 'NOW' : `${i > 0 ? '+' : ''}${i * 30}s`;
            console.log(`  ${timeDesc.padEnd(6)}: ${expectedToken}`);
        }
        
        console.log(`❌ Token verification failed for ${cleanToken}`);
        return false;
    }
    
    /**
     * Generate backup codes
     */
    generateBackupCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            // Generate 8-character alphanumeric codes
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            codes.push(code);
        }
        return codes;
    }
    
    /**
     * Setup 2FA for user (save secret to database)
     */
    async setup2FA(userId, secret, backupCodes) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE users 
                SET two_factor_secret = ?, 
                    two_factor_backup_codes = ?,
                    two_factor_setup_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            
            db.query(query, [secret, JSON.stringify(backupCodes), userId], (err, result) => {
                if (err) {
                    console.error('2FA setup error:', err);
                    reject(err);
                } else {
                    console.log(`✅ 2FA secret saved for user ${userId}`);
                    resolve(result);
                }
            });
        });
    }
    
    /**
     * Enable 2FA for user (after verification)
     */
    async enable2FA(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE users 
                SET two_factor_enabled = TRUE
                WHERE id = ?
            `;
            
            db.query(query, [userId], (err, result) => {
                if (err) {
                    console.error('2FA enable error:', err);
                    reject(err);
                } else {
                    console.log(`✅ 2FA enabled for user ${userId}`);
                    resolve(result);
                }
            });
        });
    }
    
    /**
     * Disable 2FA for user
     */
    async disable2FA(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE users 
                SET two_factor_enabled = FALSE,
                    two_factor_secret = NULL,
                    two_factor_backup_codes = NULL,
                    two_factor_setup_at = NULL
                WHERE id = ?
            `;
            
            db.query(query, [userId], (err, result) => {
                if (err) {
                    console.error('2FA disable error:', err);
                    reject(err);
                } else {
                    console.log(`✅ 2FA disabled for user ${userId}`);
                    resolve(result);
                }
            });
        });
    }
    
    /**
     * Get user's 2FA status and secret
     */
    async getUser2FAStatus(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    two_factor_enabled,
                    two_factor_secret,
                    two_factor_backup_codes,
                    two_factor_setup_at
                FROM users 
                WHERE id = ?
            `;
            
            db.query(query, [userId], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    if (results.length > 0) {
                        const user = results[0];
                        
                        // Safe backup codes parsing
                        let backupCodes = null;
                        if (user.two_factor_backup_codes) {
                            try {
                                // Check if it's already an array (parsed by MySQL)
                                if (Array.isArray(user.two_factor_backup_codes)) {
                                    backupCodes = user.two_factor_backup_codes;
                                } else if (typeof user.two_factor_backup_codes === 'string') {
                                    // Try to parse as JSON first
                                    try {
                                        backupCodes = JSON.parse(user.two_factor_backup_codes);
                                    } catch (jsonError) {
                                        // If JSON parsing fails, try to split as comma-separated string
                                        backupCodes = user.two_factor_backup_codes.split(',').map(code => code.trim());
                                        console.log('⚠️ Backup codes were stored as string, converted to array');
                                    }
                                } else {
                                    console.log('⚠️ Backup codes in unexpected format:', typeof user.two_factor_backup_codes);
                                    backupCodes = null;
                                }
                            } catch (error) {
                                console.error('❌ Failed to parse backup codes:', error);
                                backupCodes = null;
                            }
                        }
                        
                        resolve({
                            enabled: user.two_factor_enabled,
                            secret: user.two_factor_secret,
                            backupCodes: backupCodes,
                            setupAt: user.two_factor_setup_at
                        });
                    } else {
                        reject(new Error('User not found'));
                    }
                }
            });
        });
    }
    
    /**
     * Verify backup code and mark as used
     */
    async verifyBackupCode(userId, code) {
        try {
            const userStatus = await this.getUser2FAStatus(userId);
            
            if (!userStatus.backupCodes) {
                return false;
            }
            
            const codeIndex = userStatus.backupCodes.indexOf(code.toUpperCase());
            
            if (codeIndex === -1) {
                return false;
            }
            
            // Remove the used backup code
            userStatus.backupCodes.splice(codeIndex, 1);
            
            // Update database
            await new Promise((resolve, reject) => {
                const query = `
                    UPDATE users 
                    SET two_factor_backup_codes = ?
                    WHERE id = ?
                `;
                
                db.query(query, [JSON.stringify(userStatus.backupCodes), userId], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            
            console.log(`✅ Backup code used for user ${userId}`);
            return true;
            
        } catch (error) {
            console.error('Backup code verification error:', error);
            return false;
        }
    }
    
    /**
     * Verify 2FA token for login (supports both TOTP and backup codes)
     */
    async verifyLoginToken(userId, token) {
        try {
            const userStatus = await this.getUser2FAStatus(userId);
            
            if (!userStatus.enabled) {
                return { success: false, message: '2FA not enabled' };
            }
            
            // Check if it's a backup code (8 characters, alphanumeric)
            if (token.length === 8 && /^[A-F0-9]+$/i.test(token)) {
                const isValidBackup = await this.verifyBackupCode(userId, token);
                if (isValidBackup) {
                    const updatedStatus = await this.getUser2FAStatus(userId);
                    return { 
                        success: true, 
                        method: 'backup_code',
                        remaining_codes: updatedStatus.backupCodes ? updatedStatus.backupCodes.length : 0
                    };
                }
            }
            
            // Verify TOTP token (6 digits)
            if (token.length === 6 && /^\d+$/.test(token)) {
                const isValid = this.verifyToken(userStatus.secret, token);
                if (isValid) {
                    return { success: true, method: 'totp' };
                }
            }
            
            return { success: false, message: 'Invalid token format or value' };
            
        } catch (error) {
            console.error('Login 2FA verification error:', error);
            return { success: false, message: 'Verification failed' };
        }
    }
    
    /**
     * Check if user has 2FA enabled
     */
    async is2FAEnabled(userId) {
        try {
            const status = await this.getUser2FAStatus(userId);
            return status.enabled;
        } catch (error) {
            return false;
        }
    }
}

module.exports = new TwoFactorAuthService();