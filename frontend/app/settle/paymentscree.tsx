import { useSetuPayment } from '@/hooks/use-setu';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Share,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';
// import { useSetuPayment } from '../hooks/useSetuPayment';

const PaymentScreen = () => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { initiatePayment, pollStatus, loading, shortURL, platformBillID } =
    useSetuPayment();

  const handlePay = async () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount in ₹');
      return;
    }

    await initiatePayment({
      amount: Number(amount) * 100,  // convert ₹ to paise (Setu API requirement)
      billerBillID: `TXN-${Date.now()}`,  // unique per transaction
      note: note || 'UPI Payment',
    });
  };

  // Poll payment status every 5 seconds after link is created
  const TERMINAL_STATUSES = ['PAYMENT_SUCCESSFUL', 'PAYMENT_FAILED', 'BILL_EXPIRED'];

  useEffect(() => {
    if (!platformBillID) return;

    pollIntervalRef.current = setInterval(async () => {
      const status = await pollStatus();
      if (!status) return;
      setPaymentStatus(status);
      if (TERMINAL_STATUSES.includes(status)) {
        clearInterval(pollIntervalRef.current!);
        if (status === 'PAYMENT_SUCCESSFUL') {
          Alert.alert('✅ Payment Successful!', `₹${amount} received.`);
        } else if (status === 'PAYMENT_FAILED') {
          Alert.alert('❌ Payment Failed', 'The payment was not completed.');
        } else if (status === 'BILL_EXPIRED') {
          Alert.alert('⏰ Link Expired', 'This payment link has expired.');
        }
      }
    }, 5000);

    return () => clearInterval(pollIntervalRef.current!);
  }, [platformBillID]);

  const handleShare = async () => {
    if (!shortURL) return;
    await Share.share({ message: `Pay ₹${amount} via UPI: ${shortURL}` });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Send / Request Payment</Text>

      <TextInput
        style={styles.input}
        placeholder="Amount (₹)"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <TextInput
        style={styles.input}
        placeholder="Note (optional)"
        value={note}
        onChangeText={setNote}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handlePay}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Generate & Open UPI Link</Text>
        )}
      </TouchableOpacity>

      {shortURL && (
        <View style={styles.resultBox}>
          <Text style={styles.linkText}>{shortURL}</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareText}>📤 Share Payment Link</Text>
          </TouchableOpacity>
          {paymentStatus && (
            <Text style={styles.status}>Status: {paymentStatus}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f9f9f9', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 24, color: '#1a1a1a' },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 10,
    padding: 14, marginBottom: 16, fontSize: 16, backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#5B4FCF', borderRadius: 10,
    padding: 16, alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  resultBox: {
    marginTop: 24, padding: 16, backgroundColor: '#fff',
    borderRadius: 10, borderWidth: 1, borderColor: '#ddd',
  },
  linkText: { color: '#5B4FCF', fontSize: 14, marginBottom: 12 },
  shareBtn: {
    backgroundColor: '#e8e4ff', padding: 12,
    borderRadius: 8, alignItems: 'center',
  },
  shareText: { color: '#5B4FCF', fontWeight: '600' },
  status: { marginTop: 12, fontSize: 14, color: '#2e7d32', fontWeight: '600' },
});

export default PaymentScreen;
