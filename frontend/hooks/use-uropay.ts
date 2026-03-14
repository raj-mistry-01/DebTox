import axios from 'axios';
import { useCallback, useState } from 'react';

// Match the ngrok proxy being used in api.ts
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'https://ad07-152-58-63-92.ngrok-free.app';

const api = axios.create({
  baseURL: BACKEND_URL + '/api/v1/payments',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

export const useUroPay = () => {
  const [loading, setLoading] = useState(false);

  const generateQRCode = useCallback(async (amount: number, note?: string) => {
    try {
      setLoading(true);
      const { data } = await api.post('/create-order', {
        amount, // in paise
        merchantOrderId: `ORDER-${Date.now()}`,
        transactionNote: note || 'UPI Payment',
      });
      return data?.data;
    } catch (e) {
      console.error('UroPay generateQRCode error', e);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, generateQRCode };
};
