const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class TwoFactorService {
  /**
   * Generate a new secret for 2FA
   * @param {string} email - User's email
   * @returns {Object} - Secret and otpauth URL
   */
  generateSecret(email) {
    const secret = speakeasy.generateSecret({
      name: `SaveMyMoney (${email})`,
      issuer: 'SaveMyMoney',
      length: 32
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url
    };
  }

  /**
   * Generate QR code for 2FA setup
   * @param {string} otpauthUrl - OTP Auth URL
   * @returns {Promise<string>} - QR code as data URL
   */
  async generateQRCode(otpauthUrl) {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataUrl;
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify a 2FA token
   * @param {string} secret - User's 2FA secret
   * @param {string} token - Token to verify
   * @returns {boolean} - Verification result
   */
  verifyToken(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps before/after current time
    });
  }

  /**
   * Generate backup codes for account recovery
   * @returns {Array<string>} - Array of backup codes
   */
  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Hash backup code for storage
   * @param {string} code - Backup code
   * @returns {string} - Hashed code
   */
  hashBackupCode(code) {
    const bcrypt = require('bcrypt');
    return bcrypt.hashSync(code, 10);
  }

  /**
   * Verify backup code
   * @param {string} code - Code to verify
   * @param {string} hashedCode - Hashed code from database
   * @returns {Promise<boolean>} - Verification result
   */
  async verifyBackupCode(code, hashedCode) {
    const bcrypt = require('bcrypt');
    return await bcrypt.compare(code, hashedCode);
  }
}

module.exports = new TwoFactorService();
