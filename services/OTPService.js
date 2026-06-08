const db = require('../db/connection');
const crypto = require('crypto');
const https = require('https');

class OTPService {
    static async ensureTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS phone_otps (
                id INT PRIMARY KEY AUTO_INCREMENT,
                phone VARCHAR(50) NOT NULL,
                otp VARCHAR(6) NOT NULL,
                purpose VARCHAR(50) DEFAULT 'phone_verification',
                expires_at TIMESTAMP NOT NULL,
                verified BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_phone_otp (phone, otp, purpose)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `;
        return new Promise((resolve, reject) => {
            db.query(sql, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }

    static generateOTP() {
        return crypto.randomInt(100000, 999999).toString();
    }

    static async sendOTP(phone, otp) {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            console.log(`[OTP Service] No Telegram configured. OTP for ${phone}: ${otp}`);
            return { success: true, method: 'console' };
        }

        return new Promise((resolve, reject) => {
            const message = `🔐 Phone Verification OTP\n\nPhone: ${phone}\nOTP: ${otp}\nExpires: 5 minutes`;

            const data = JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            });

            const req = https.request({
                hostname: 'api.telegram.org',
                path: `/bot${botToken}/sendMessage`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(body);
                        if (result.ok) {
                            resolve({ success: true, method: 'telegram' });
                        } else {
                            console.error('Telegram API error:', result);
                            resolve({ success: false, error: result.description });
                        }
                    } catch (e) {
                        resolve({ success: false, error: e.message });
                    }
                });
            });

            req.on('error', (e) => {
                console.error('Telegram request error:', e);
                resolve({ success: false, error: e.message });
            });

            req.write(data);
            req.end();
        });
    }

    static async sendAndStoreOTP(phone, purpose = 'phone_verification') {
        await OTPService.ensureTable();

        const otp = OTPService.generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        return new Promise((resolve, reject) => {
            db.query(
                'INSERT INTO phone_otps (phone, otp, purpose, expires_at) VALUES (?, ?, ?, ?)',
                [phone, otp, purpose, expiresAt],
                async (err) => {
                    if (err) return reject(err);

                    const sent = await OTPService.sendOTP(phone, otp);
                    resolve(sent);
                }
            );
        });
    }

    static verifyOTP(phone, otp, purpose = 'phone_verification') {
        return new Promise((resolve, reject) => {
            db.query(
                `SELECT id FROM phone_otps 
                 WHERE phone = ? AND otp = ? AND purpose = ? 
                 AND expires_at > NOW() AND verified = false 
                 ORDER BY id DESC LIMIT 1`,
                [phone, otp, purpose],
                (err, results) => {
                    if (err) return reject(err);

                    if (results.length === 0) {
                        return resolve({ valid: false, message: 'Invalid or expired OTP' });
                    }

                    const otpId = results[0].id;
                    db.query('UPDATE phone_otps SET verified = true WHERE id = ?', [otpId], (updateErr) => {
                        if (updateErr) return reject(updateErr);
                        resolve({ valid: true, message: 'OTP verified successfully' });
                    });
                }
            );
        });
    }
}

module.exports = OTPService;