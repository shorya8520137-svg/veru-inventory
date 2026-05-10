const db = require('../../../db/connection');
const crypto = require('crypto');

class WalletService {
  /**
   * Hold/Deduct funds before attempting a courier shipment.
   * Uses MySQL transactions to ensure ACID compliance.
   */
  static async deductForShipment(tenantId, amount, orderId) {
    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
      // 1. Lock the wallet row for update
      const [wallets] = await connection.execute(
        'SELECT wallet_id, balance FROM logistics_wallets WHERE tenant_id = ? FOR UPDATE',
        [tenantId]
      );

      if (wallets.length === 0) {
        throw new Error('Wallet not found for this tenant.');
      }

      const wallet = wallets[0];

      // 2. Check sufficient balance
      if (parseFloat(wallet.balance) < parseFloat(amount)) {
        throw new Error('Insufficient wallet balance to create shipment.');
      }

      // 3. Deduct balance
      await connection.execute(
        'UPDATE logistics_wallets SET balance = balance - ? WHERE wallet_id = ?',
        [amount, wallet.wallet_id]
      );

      // 4. Record transaction ledger
      const transactionId = 'TXN-' + crypto.randomBytes(8).toString('hex').toUpperCase();
      await connection.execute(
        `INSERT INTO logistics_wallet_transactions 
         (transaction_id, wallet_id, amount, type, reference_id, status, description) 
         VALUES (?, ?, ?, 'DEDUCTION', ?, 'SUCCESS', ?)`,
        [transactionId, wallet.wallet_id, amount, orderId, `Shipping cost for order ${orderId}`]
      );

      await connection.commit();
      return { success: true, transactionId, remainingBalance: parseFloat(wallet.balance) - parseFloat(amount) };
    } catch (error) {
      await connection.rollback();
      return { success: false, error: error.message };
    } finally {
      connection.release();
    }
  }

  /**
   * Refund wallet if courier API fails or order is cancelled.
   */
  static async refund(tenantId, amount, referenceId, reason) {
    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
      const [wallets] = await connection.execute(
        'SELECT wallet_id, balance FROM logistics_wallets WHERE tenant_id = ? FOR UPDATE',
        [tenantId]
      );

      if (wallets.length === 0) throw new Error('Wallet not found.');
      const wallet = wallets[0];

      await connection.execute(
        'UPDATE logistics_wallets SET balance = balance + ? WHERE wallet_id = ?',
        [amount, wallet.wallet_id]
      );

      const transactionId = 'REF-' + crypto.randomBytes(8).toString('hex').toUpperCase();
      await connection.execute(
        `INSERT INTO logistics_wallet_transactions 
         (transaction_id, wallet_id, amount, type, reference_id, status, description) 
         VALUES (?, ?, ?, 'REFUND', ?, 'SUCCESS', ?)`,
        [transactionId, wallet.wallet_id, amount, referenceId, reason]
      );

      await connection.commit();
      return { success: true, transactionId };
    } catch (error) {
      await connection.rollback();
      return { success: false, error: error.message };
    } finally {
      connection.release();
    }
  }

  static async getBalance(tenantId) {
    const [rows] = await db.promise().execute(
      'SELECT balance FROM logistics_wallets WHERE tenant_id = ?',
      [tenantId]
    );
    return rows.length > 0 ? parseFloat(rows[0].balance) : 0.00;
  }

  static async getHistory(tenantId) {
    const [rows] = await db.promise().execute(
      `SELECT t.transaction_id, t.amount, t.type, t.reference_id, t.status, t.description, t.created_at 
       FROM logistics_wallet_transactions t
       JOIN logistics_wallets w ON t.wallet_id = w.wallet_id
       WHERE w.tenant_id = ?
       ORDER BY t.created_at DESC
       LIMIT 50`,
      [tenantId]
    );
    return rows;
  }
}

module.exports = WalletService;
