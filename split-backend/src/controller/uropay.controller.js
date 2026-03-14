import crypto from 'crypto';

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
    const { amount, merchantOrderId, transactionNote, customerName, customerEmail } = req.body;

    // Amount must be in paise
    const amountValue = parseInt(amount, 10);
    if (!amountValue || amountValue <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive integer (in paise)' });
    }

    if (!merchantOrderId) {
      return res.status(400).json({ message: 'merchantOrderId is required' });
    }

    const payload = {
      vpa: UROPAY_VPA,
      vpaName: UROPAY_VPA_NAME,
      amount: amountValue,
      merchantOrderId,
      transactionNote: transactionNote || '',
      customerName: customerName || 'DebTox User',
      customerEmail: customerEmail || 'user@debtox.com',
    };

    const response = await fetch('https://api.uropay.me/order/generate', {
      method: 'POST',
      headers: getUroPayHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.code !== 200) {
      console.error('[UroPay] Error generating order:', data);
      return res.status(response.status || 400).json({ message: 'Error generating UroPay order', error: data });
    }

    console.log('[UroPay] Order generated successfully ✅');
    return res.status(200).json(data);
  } catch (error) {
    console.error('[UroPay] Exception generation order:', error.message);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
