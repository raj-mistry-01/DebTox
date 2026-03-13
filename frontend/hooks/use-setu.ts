import { checkPaymentStatus, createPaymentLink, PaymentLinkRequest } from '@/components/upis';
import { useCallback, useState } from 'react';
import { Alert, Linking } from 'react-native';
// import { createPaymentLink, checkPaymentStatus, PaymentLinkRequest } from '../api/setuApi';

export const useSetuPayment = () => {
  const [loading, setLoading] = useState(false);
  const [platformBillID, setPlatformBillID] = useState<string | null>(null);
  const [shortURL, setShortURL] = useState<string | null>(null);

  const initiatePayment = useCallback(async (payload: PaymentLinkRequest) => {
    setLoading(true);
    try {
      const result = await createPaymentLink(payload);
      setPlatformBillID(result.platformBillID);
      setShortURL(result.shortURL);

      // Try to open UPI app directly via deep link
      const canOpen = await Linking.canOpenURL(result.upiLink);
      if (canOpen) {
        await Linking.openURL(result.upiLink); // Opens GPay / PhonePe / BHIM etc.
      } else {
        // Fallback: open short URL in browser
        await Linking.openURL(result.shortURL);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not create payment link. Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const pollStatus = useCallback(async () => {
    if (!platformBillID) return null;
    try {
      return await checkPaymentStatus(platformBillID);
    } catch {
      return null; // fail gracefully, polling will retry next interval
    }
  }, [platformBillID]);

  return { initiatePayment, pollStatus, loading, shortURL, platformBillID };
};
