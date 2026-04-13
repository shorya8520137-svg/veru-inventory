/**
 * TWO FACTOR AUTHENTICATION CONTROLLER
 * Handles 2FA API endpoints
 */

const TwoFactorAuthService = require('../services/TwoFactorAuthService');

class TwoFactorController {
    
    /**
     * Generate 2FA setup (secret and QR code)
     */
    async generateSetup(req, res) {
        try {
            const userId = req.user.id;
            const userEmail = req.user.email;
            
            console.log(`🔐 Generating 2FA setup for user ${userId} (${userEmail})`);
            
            // Check if 2FA is already enabled
            const currentStatus = await TwoFactorAuthService.getUser2FAStatus(userId);
            if (currentStatus.enabled) {
                return res.status(400).json({
                    success: false,
                    message: '2FA is already enabled for this account'
                });
            }
            
            // Generate new secret with proper validation
            const secretData = TwoFactorAuthService.generateSecret(userEmail);
            
            console.log(`🔐 Generated secret: ${secretData.secret} (length: ${secretData.secret.length})`);
            console.log(`🔐 Secret format valid: ${/^[A-Z2-7]+=*$/.test(secretData.secret)}`);
            
            // Generate QR code
            const qrCodeUrl = await TwoFactorAuthService.generateQRCode(secretData.otpauthUrl);
            
            // Generate backup codes
            const backupCodes = TwoFactorAuthService.generateBackupCodes();
            
            // Save secret to database (but don't enable yet)
            await TwoFactorAuthService.setup2FA(userId, secretData.secret, backupCodes);
            
            console.log(`✅ 2FA setup saved for user ${userId}`);
            
            res.json({
                success: true,
                data: {
                    secret: secretData.secret,
                    qrCodeUrl: qrCodeUrl,
                    backupCodes: backupCodes,
                    manualEntryKey: secretData.secret,
                    otpauthUrl: secretData.otpauthUrl
                }
            });
            
        } catch (error) {
            console.error('2FA setup generation error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate 2FA setup'
            });
        }
    }
    
    /**
     * Verify and enable 2FA
     */
    async verifyAndEnable(req, res) {
        try {
            const userId = req.user.id;
            const { token } = req.body;
            
            console.log(`🔐 2FA verification attempt for user ${userId} with token: ${token}`);
            
            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: '2FA token is required'
                });
            }
            
            // Clean and validate token format
            const cleanToken = token.toString().replace(/\s/g, '');
            if (!/^\d{6}$/.test(cleanToken)) {
                return res.status(400).json({
                    success: false,
                    message: 'Token must be 6 digits'
                });
            }
            
            // Get user's secret
            const userStatus = await TwoFactorAuthService.getUser2FAStatus(userId);
            
            if (!userStatus.secret) {
                return res.status(400).json({
                    success: false,
                    message: '2FA setup not found. Please generate setup first.'
                });
            }
            
            console.log(`🔐 User ${userId} has secret, verifying token...`);
            
            // Verify token
            const isValid = TwoFactorAuthService.verifyToken(userStatus.secret, cleanToken);
            
            if (!isValid) {
                console.log(`❌ Token verification failed for user ${userId}`);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid 2FA token. Please check your authenticator app and ensure your device time is synchronized.'
                });
            }
            
            // Enable 2FA
            await TwoFactorAuthService.enable2FA(userId);
            
            console.log(`✅ 2FA enabled successfully for user ${userId}`);
            
            res.json({
                success: true,
                message: '2FA has been successfully enabled'
            });
            
        } catch (error) {
            console.error('2FA verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify 2FA token'
            });
        }
    }
    
    /**
     * Verify 2FA token (for login)
     */
    async verifyToken(req, res) {
        try {
            const userId = req.user.id;
            const { token, isBackupCode } = req.body;
            
            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: '2FA token is required'
                });
            }
            
            let isValid = false;
            
            if (isBackupCode) {
                // Verify backup code
                isValid = await TwoFactorAuthService.verifyBackupCode(userId, token);
            } else {
                // Verify TOTP token
                const userStatus = await TwoFactorAuthService.getUser2FAStatus(userId);
                if (userStatus.secret) {
                    isValid = TwoFactorAuthService.verifyToken(userStatus.secret, token);
                }
            }
            
            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: isBackupCode ? 'Invalid backup code' : 'Invalid 2FA token'
                });
            }
            
            res.json({
                success: true,
                message: '2FA token verified successfully'
            });
            
        } catch (error) {
            console.error('2FA token verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify 2FA token'
            });
        }
    }
    
    /**
     * Get 2FA status
     */
    async getStatus(req, res) {
        try {
            const userId = req.user.id;
            const status = await TwoFactorAuthService.getUser2FAStatus(userId);
            
            res.json({
                success: true,
                data: {
                    enabled: status.enabled,
                    setupAt: status.setupAt,
                    hasBackupCodes: status.backupCodes && status.backupCodes.length > 0,
                    backupCodesCount: status.backupCodes ? status.backupCodes.length : 0
                }
            });
            
        } catch (error) {
            console.error('2FA status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get 2FA status'
            });
        }
    }
    
    /**
     * Disable 2FA
     */
    async disable(req, res) {
        try {
            const userId = req.user.id;
            const { password, token } = req.body;
            
            // Verify current password (you might want to add this validation)
            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is required to disable 2FA'
                });
            }
            
            // Verify 2FA token before disabling
            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: '2FA token is required to disable 2FA'
                });
            }
            
            const userStatus = await TwoFactorAuthService.getUser2FAStatus(userId);
            const isValidToken = TwoFactorAuthService.verifyToken(userStatus.secret, token);
            
            if (!isValidToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid 2FA token'
                });
            }
            
            // Disable 2FA
            await TwoFactorAuthService.disable2FA(userId);
            
            res.json({
                success: true,
                message: '2FA has been successfully disabled'
            });
            
        } catch (error) {
            console.error('2FA disable error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to disable 2FA'
            });
        }
    }
    
    /**
     * Regenerate backup codes
     */
    async regenerateBackupCodes(req, res) {
        try {
            const userId = req.user.id;
            const { token } = req.body;
            
            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: '2FA token is required'
                });
            }
            
            // Verify 2FA token
            const userStatus = await TwoFactorAuthService.getUser2FAStatus(userId);
            const isValid = TwoFactorAuthService.verifyToken(userStatus.secret, token);
            
            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid 2FA token'
                });
            }
            
            // Generate new backup codes
            const newBackupCodes = TwoFactorAuthService.generateBackupCodes();
            
            // Update database
            await TwoFactorAuthService.setup2FA(userId, userStatus.secret, newBackupCodes);
            
            res.json({
                success: true,
                data: {
                    backupCodes: newBackupCodes
                },
                message: 'Backup codes regenerated successfully'
            });
            
        } catch (error) {
            console.error('Backup codes regeneration error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to regenerate backup codes'
            });
        }
    }
}

module.exports = new TwoFactorController();