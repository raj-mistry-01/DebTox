import crypto from 'crypto';
import { Op } from 'sequelize';
import { Payment, Balance, Notification, User } from '../model/index.js';
import { sendPaymentReceiptEmail, sendCashPaymentSentEmail, sendCashPaymentReceivedEmail } from '../services/emailService.js';


// ─── Read env vars ────────────────────────────────────────────────────────────
const UROPAY_API_KEY  = (process.env.UROPAY_API_KEY  ?? '').trim();
const UROPAY_SECRET   = (process.env.UROPAY_SECRET   ?? '').trim();
const UROPAY_VPA      = (process.env.UROPAY_VPA      ?? '').trim();
const UROPAY_VPA_NAME = (process.env.UROPAY_VPA_NAME ?? '').trim();

// ─── Startup sanity check ─────────────────────────────────────────────────────
['UROPAY_API_KEY', 'UROPAY_SECRET', 'UROPAY_VPA', 'UROPAY_VPA_NAME'].forEach((key) => {
  const val = process.env[key]?.trim();
  if (!val) console.error(`[UroPay] ⚠️  Missing env var: ${key}`);
  else      console.log(`[UroPay] ✅  ${key} = ${val.slice(0, 4)}…`);
});

function getUroPayHeaders() {
  const sha512 = crypto.createHash('sha512');
  sha512.update(UROPAY_SECRET);
  const hashedSecret = sha512.digest('hex');

  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-API-KEY': UROPAY_API_KEY,
    'Authorization': `Bearer ${hashedSecret}`,
  };
}

export async function generateOrder(req, res) {
  try {
    const { amount, merchantOrderId, transactionNote, customerName, customerEmail, receiverUPI } = req.body;
    
    const customerEmailToUse = customerEmail || req.user?.email || 'user@debtox.com';
    const customerNameToUse = customerName || req.user?.name || 'DebTox User';
    
    console.log('[UroPay] 📨 Request received:', { amount, merchantOrderId, transactionNote, receiverUPI });

    // Amount must be in paise
    const amountValue = parseInt(amount, 10);
    if (!amountValue || amountValue <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive integer (in paise)' });
    }

    if (!merchantOrderId) {
      return res.status(400).json({ message: 'merchantOrderId is required' });
    }

    // Use receiver's UPI if provided, otherwise fall back to hardcoded VPA
    const vpaToUse = receiverUPI || UROPAY_VPA;
    if (!vpaToUse) {
      return res.status(400).json({ message: 'No receiver UPI or fallback VPA available' });
    }

    const payload = {
      vpa: vpaToUse,
      vpaName: UROPAY_VPA_NAME,
      amount: amountValue,
      merchantOrderId,
      transactionNote: transactionNote || '',
      customerName: customerNameToUse,
      customerEmail: customerEmailToUse,
    };

    console.log('[UroPay] 🔐 Credentials loaded:');
    console.log('  - API Key:', UROPAY_API_KEY ? `${UROPAY_API_KEY.slice(0, 8)}…` : '❌ MISSING');
    console.log('  - Secret:', UROPAY_SECRET ? `${UROPAY_SECRET.slice(0, 8)}…` : '❌ MISSING');
    console.log('  - Receiver VPA (dynamic):', receiverUPI || '❌ NOT PROVIDED');
    console.log('  - Fallback VPA (hardcoded):', UROPAY_VPA || '❌ MISSING');
    console.log('  - VPA being used:', vpaToUse);
    console.log('  - VPA Name:', UROPAY_VPA_NAME || '❌ MISSING');

    console.log('[UroPay] 📤 Sending payload to UroPay API:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://api.uropay.me/order/generate', {
      method: 'POST',
      headers: getUroPayHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log('[UroPay] 📥 Response received:');
    console.log('  - Status:', response.status);
    console.log('  - Response:', JSON.stringify(data, null, 2));

    if (!response.ok || data.code !== 200) {
      console.error('[UroPay] ❌ Error from UroPay API:', {
        httpStatus: response.status,
        responseCode: data.code,
        message: data.message,
        error: data.error,
      });
      return res.status(response.status || 400).json({ message: 'UroPay API error', error: data });
    }

    console.log('[UroPay] ✅ Order generated successfully');
    return res.status(200).json(data);
  } catch (error) {
    console.error('[UroPay] ❌ Exception generating order:', {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

// ─── Mock payment status checker (1-5 random attempts) ─────────────────────────
const paymentAttempts = new Map(); // Track attempts per orderId

export async function checkPaymentStatus(req, res) {
  try {
    const { orderId } = req.params;
    const userId = req.user?.sub || req.user?.id;  // JWT uses 'sub', fallback to 'id'

    if (!orderId || !userId) {
      return res.status(400).json({ message: 'orderId and authentication required' });
    }

    // Initialize tracking for this order if needed
    if (!paymentAttempts.has(orderId)) {
      const maxAttempts = Math.floor(Math.random() * 5) + 1; // 1-5
      paymentAttempts.set(orderId, { maxAttempts, currentAttempt: 0 });
      console.log(`[Payment Check] 🎯 Order ${orderId}: Max attempts set to ${maxAttempts}`);
    }

    const tracker = paymentAttempts.get(orderId);
    tracker.currentAttempt += 1;

    const isVerified = tracker.currentAttempt >= tracker.maxAttempts;

    console.log(`[Payment Check] 📊 Order ${orderId}: Attempt ${tracker.currentAttempt}/${tracker.maxAttempts}`);

    return res.status(200).json({
      orderId,
      isVerified,
      message: isVerified ? 'Payment verified' : 'Payment pending, try again',
    });
  } catch (error) {
    console.error('[Payment Check] ❌ Error:', error.message);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

// ─── Finalize payment: Record in DB, update balance, send notifications ───────
export async function finalizePayment(req, res) {
  try {
    const userId = req.user?.sub || req.user?.id;  // JWT uses 'sub', fallback to 'id'
    const { friendId, amount, upiTxnId, orderId } = req.body;

    if (!userId || !friendId || !amount || !upiTxnId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log(`[Payment Finalize] 💳 Recording: ${userId} → ${friendId}, ₹${amount}, UPI: ${upiTxnId}`);

    // 1. Create Payment record
    const payment = await Payment.create({
      payerId: userId,
      payeeId: friendId,
      amount: Math.round(amount * 100) / 100,
      method: 'upi',  // lowercase to match enum
      gatewayTxnId: upiTxnId,  // Use correct field name
      status: 'completed',  // lowercase to match enum
    });

    console.log(`[Payment Finalize] ✅ Payment record created: ${payment.id}`);


    // 2. Update Balance (reduce debt) - use same pattern as getFriend() to find friend-to-friend balances
    const balances = await Balance.findAll({
      where: {
        [Op.or]: [
          { fromUserId: userId, toUserId: friendId },
          { fromUserId: friendId, toUserId: userId },
        ],
      },
    });

    console.log(`[Payment Finalize] 🔍 Found ${balances.length} balance records between user ${userId} and friend ${friendId}`);
    
    if (balances.length > 0) {
      for (const balance of balances) {
        const oldAmount = balance.netAmount;
        console.log(`[Payment Finalize] 📊 Processing balance: ID=${balance.id}, from=${balance.fromUserId}, to=${balance.toUserId}, oldAmount=${oldAmount}`);
        
        // Calculate new amount - payment reduces debt
        const newAmount = oldAmount - amount;
        
        console.log(`[Payment Finalize] 💾 Reduced by ₹${amount} → new amount = ₹${newAmount}`);
        
        // Delete if ≈ 0 OR would go negative (overpayment)
        if (Math.abs(newAmount) < 0.01 || newAmount < 0) {
          await balance.destroy();
          console.log(`[Payment Finalize] 🗑️  Balance settled/overpaid, record deleted`);
        } else {
          // Update with positive amount only
          balance.netAmount = newAmount;
          await balance.save();
          console.log(`[Payment Finalize] ⚖️  Balance updated: ₹${balance.netAmount}`);
        }
      }
    } else {
      console.log(`[Payment Finalize] ⚠️  No balance records found! This is unexpected.`);
    }

    // 3. Create notifications for both users
    const payer = await User.findByPk(userId);
    const payee = await User.findByPk(friendId);

    // Send payment receipt email to payer
    if (payer?.email) {
      sendPaymentReceiptEmail(
        payer.email,
        payer.name,
        amount,
        payment.id,
        upiTxnId
      ).catch((err) => {
        console.log(`[Payment Finalize] ⚠️  Email send failed: ${err.message}`);
      });
    }

    await Notification.create({
      userId: friendId,
      type: 'payment_received',
      title: 'Payment Received',
      message: `${payer?.name || 'Someone'} paid you ₹${amount.toFixed(2)} via UPI`,
      relatedId: payment.id,
      isRead: false,
    });

    await Notification.create({
      userId: userId,
      type: 'payment_received',
      title: 'Payment Sent',
      message: `You paid ${payee?.name || 'Friend'} ₹${amount.toFixed(2)} via UPI`,
      relatedId: payment.id,
      isRead: false,
    });

    console.log(`[Payment Finalize] 🔔 Notifications sent to both users`);

    // Clean up attempt tracker
    paymentAttempts.delete(orderId);

    return res.status(200).json({
      success: true,
      payment: {
        id: payment.id,
        amount,
        status: 'completed',
        transactionId: upiTxnId,
        message: `Payment of ₹${amount.toFixed(2)} recorded successfully`,
      },
    });
  } catch (error) {
    console.error('[Payment Finalize] ❌ Error:', error.message);
    return res.status(500).json({ message: 'Payment finalization failed', error: error.message });
  }
}

// ─── Record Cash Payment: Direct recording without verification ────────────────
export async function recordCashPayment(req, res) {
  try {
    const userId = req.user?.sub || req.user?.id;  // JWT uses 'sub', fallback to 'id'
    const { friendId, amount } = req.body;

    if (!userId || !friendId || !amount) {
      return res.status(400).json({ message: 'Missing required fields: friendId, amount' });
    }

    if (userId === friendId) {
      return res.status(400).json({ message: 'Cannot pay yourself' });
    }

    const parsedAmount = parseFloat(amount);
    if (parsedAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }

    console.log(`[Cash Payment] 💵 Recording: ${userId} → ${friendId}, ₹${parsedAmount}`);

    // 1. Create Payment record
    const payment = await Payment.create({
      payerId: userId,
      payeeId: friendId,
      amount: Math.round(parsedAmount * 100) / 100,
      method: 'cash',  // Cash payment method
      status: 'completed',
    });

    console.log(`[Cash Payment] ✅ Payment record created: ${payment.id}`);

    // 2. Update Balance (reduce debt) - same logic as UPI
    const balances = await Balance.findAll({
      where: {
        [Op.or]: [
          { fromUserId: userId, toUserId: friendId },
          { fromUserId: friendId, toUserId: userId },
        ],
      },
    });

    console.log(`[Cash Payment] 🔍 Found ${balances.length} balance records between user ${userId} and friend ${friendId}`);
    
    if (balances.length > 0) {
      for (const balance of balances) {
        const oldAmount = balance.netAmount;
        console.log(`[Cash Payment] 📊 Processing balance: ID=${balance.id}, from=${balance.fromUserId}, to=${balance.toUserId}, oldAmount=${oldAmount}`);
        
        // Calculate new amount - payment reduces debt
        const newAmount = oldAmount - parsedAmount;
        
        console.log(`[Cash Payment] 💾 Reduced by ₹${parsedAmount} → new amount = ₹${newAmount}`);
        
        // Delete if ≈ 0 OR would go negative (overpayment)
        if (Math.abs(newAmount) < 0.01 || newAmount < 0) {
          await balance.destroy();
          console.log(`[Cash Payment] 🗑️  Balance settled/overpaid, record deleted`);
        } else {
          // Update with positive amount only
          balance.netAmount = newAmount;
          await balance.save();
          console.log(`[Cash Payment] ⚖️  Balance updated: ₹${balance.netAmount}`);
        }
      }
    } else {
      console.log(`[Cash Payment] ⚠️  No balance records found! This is unexpected.`);
    }

    // 3. Create notifications for both users
    const payer = await User.findByPk(userId);
    const payee = await User.findByPk(friendId);

    // Send payment sent email to payer
    if (payer?.email) {
      sendCashPaymentSentEmail(
        payer.email,
        payer.name,
        payee?.name || 'Friend',
        parsedAmount,
        payment.id
      ).catch((err) => {
        console.log(`[Cash Payment] ⚠️  Email to payer failed: ${err.message}`);
      });
    }

    // Send payment received email to payee
    if (payee?.email) {
      sendCashPaymentReceivedEmail(
        payee.email,
        payer?.name || 'Someone',
        payee.name,
        parsedAmount,
        payment.id
      ).catch((err) => {
        console.log(`[Cash Payment] ⚠️  Email to payee failed: ${err.message}`);
      });
    }

    // Notification to payee (receiver)
    await Notification.create({
      userId: friendId,
      type: 'payment_received',
      title: 'Cash Payment Received',
      message: `${payer?.name || 'Someone'} paid you ₹${parsedAmount.toFixed(2)} in cash`,
      relatedId: payment.id,
      isRead: false,
    });

    // Notification to payer (sender)
    await Notification.create({
      userId: userId,
      type: 'payment_received',
      title: 'Cash Payment Sent',
      message: `You paid ${payee?.name || 'Friend'} ₹${parsedAmount.toFixed(2)} in cash`,
      relatedId: payment.id,
      isRead: false,
    });

    console.log(`[Cash Payment] 🔔 Notifications and emails sent to both users`);

    return res.status(200).json({
      success: true,
      payment: {
        id: payment.id,
        amount: parsedAmount,
        status: 'completed',
        method: 'cash',
        message: `Cash payment of ₹${parsedAmount.toFixed(2)} recorded successfully`,
      },
    });
  } catch (error) {
    console.error('[Cash Payment] ❌ Error:', error.message);
    return res.status(500).json({ message: 'Cash payment recording failed', error: error.message });
  }
}
