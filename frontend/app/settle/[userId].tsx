import React, { useState, useEffect } from 'react';
import { MOCK_FRIENDS } from '@/data/mockData';
import { useUroPay } from '@/hooks/use-uropay';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiClient } from '@/services/api';

interface FriendBalance {
  friendId: string;
  friendName: string;
  balance: number;
  upiId?: string;
}

type PaymentMethod = 'Cash' | 'Card' | 'UPI';

export default function SettleUpScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [friend, setFriend] = useState<FriendBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Cash');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [upiTxnId, setUpiTxnId] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const { loading: isGeneratingQR, generateQRCode } = useUroPay();

  useEffect(() => {
    fetchFriendBalance();
  }, [userId]);

  const fetchFriendBalance = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getBalance(userId!);
      console.log(response)
      // The response has user (with upiId) and balance
      setFriend({
        friendId: userId!,
        friendName: response.user?.name || 'Friend',
        balance: response.balance || 0,
        upiId: response.user?.upiId,  // Get receiver's UPI
      });
      // Set default amount to the balance
      setAmount(Math.abs(response.balance || 0).toFixed(2));
    } catch (error) {
      console.error('Failed to fetch friend balance:', error);
      Alert.alert('Error', 'Failed to load settle details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const initials = friend
    ? friend.friendName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  // ─── Cash / Card settlement (record only) ───────────────────────────────────
  const handleSettle = () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }
    Alert.alert(
      'Settlement recorded! ✅',
      `You recorded a ${selectedMethod} payment of ₹${parsed.toFixed(2)} to ${friend?.friendName}.`,
      [{ text: 'Done', onPress: () => router.back() }]
    );
  };

  // ─── UPI settlement via UroPay ────────────────────────────────────────────────
  const handleSettleUPI = async () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    // Warn if paying more than owed
    const amountOwed = Math.abs(friend?.balance || 0);
    if (parsed > amountOwed + 0.01) {
      Alert.alert(
        'Overpayment',
        `You owe ₹${amountOwed.toFixed(2)} but entered ₹${parsed.toFixed(2)}. Continue?`,
        [
          { text: 'Edit Amount', onPress: () => {} },
          { text: 'Continue', onPress: () => continueUPIPayment(parsed) },
        ]
      );
      return;
    }

    continueUPIPayment(parsed);
  };

  const continueUPIPayment = async (parsed: number) => {
    if (!friend?.upiId) {
      Alert.alert('Error', 'Receiver UPI not available. Cannot generate QR code.');
      return;
    }

    const amountInPaise = Math.round(parsed * 100);
    const order = await generateQRCode(
      amountInPaise,
      note || `Settle up with ${friend?.friendName || 'Friend'}`,
      friend.upiId  // Pass receiver's UPI
    );
    
    if (order?.qrCode && order?.uroPayOrderId) {
      setQrCode(order.qrCode);
      setOrderId(order.uroPayOrderId);
      setPaymentSuccess(false);
    } else {
      Alert.alert('Error', 'Could not generate UPI QR Code. Try again.');
    }
  };

  // ─── Check payment status (1-5 hidden attempts) ────────────────────────────
  const handleCheckPayment = async () => {
    if (!upiTxnId.trim()) {
      Alert.alert('Error', 'Please enter UPI Transaction ID');
      return;
    }

    if (!orderId) {
      Alert.alert('Error', 'Order not initialized');
      return;
    }

    setIsChecking(true);
    
    try {
      const response = await apiClient.checkPaymentStatus(orderId);
      console.log('Payment check response:', response);

      if (response.isVerified) {
        setPaymentSuccess(true);
        Alert.alert('✅ Success', 'Payment verified! Click Done to complete.');
      } else {
        Alert.alert('Checking...', 'Payment verification in progress. Tap again to check.');
      }
    } catch (error) {
      console.error('Payment check error:', error);
      Alert.alert('Error', 'Failed to check payment status');
    } finally {
      setIsChecking(false);
    }
  };

  // ─── Finalize payment and redirect ─────────────────────────────────────────
  const handleDone = async () => {
    if (!orderId || !upiTxnId || !paymentSuccess) {
      Alert.alert('Error', 'Payment verification incomplete');
      return;
    }

    try {
      setIsChecking(true);
      const parsed = parseFloat(amount);
      
      console.log('Finalizing payment:', { userId, friendId: userId, amount: parsed, upiTxnId, orderId });
      
      const result = await apiClient.finalizePayment(
        userId!,
        parsed,
        upiTxnId,
        orderId
      );

      console.log('✅ Payment finalized successfully:', result);

      // Wait a bit to ensure DB updates are processed
      await new Promise(resolve => setTimeout(resolve, 800));

      Alert.alert('✅ Payment Recorded!', `₹${parsed.toFixed(2)} paid successfully to ${friend?.friendName}`, [
        {
          text: 'Back to Friends',
          onPress: () => {
            console.log('Navigating back to friends list...');
            router.back();
          },
        },
      ]);
    } catch (error) {
      console.error('❌ Finalization error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment could not be recorded';
      Alert.alert('Error', errorMessage);
      setPaymentSuccess(false);
    } finally {
      setIsChecking(false);
    }
  };

  const methods: { icon: React.ComponentProps<typeof Ionicons>['name']; label: PaymentMethod }[] = [
    { icon: 'cash-outline',           label: 'Cash' },
    { icon: 'card-outline',           label: 'Card' },
    { icon: 'qr-code-outline',        label: 'UPI'  },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0f0f1a' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {loading ? (
        <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#4ade80" />
        </View>
      ) : !friend ? (
        <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#fff' }}>Friend not found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

          {/* Friend summary */}
          <View style={styles.friendCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View>
              <Text style={styles.settlingWith}>Settling up with</Text>
              <Text style={styles.friendName}>{friend.friendName}</Text>
            </View>
          </View>

          {/* Balance reminder */}
          <View style={styles.balanceBanner}>
            <Ionicons name="information-circle-outline" size={18} color="#0ea5e9" />
            <Text style={styles.balanceText}>
              {friend.balance < 0
                ? `You owe ${friend.friendName.split(' ')[0]} ₹${Math.abs(friend.balance).toFixed(2)}`
                : `${friend.friendName.split(' ')[0]} owes you ₹${friend.balance.toFixed(2)}`}
            </Text>
          </View>

          {/* Amount */}
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#444"
            />
          </View>

          {/* Quick fill buttons */}
          <View style={styles.quickRow}>
            {[25, 50, 75, 100].map((pct) => (
              <TouchableOpacity
                key={pct}
                style={styles.quickChip}
                onPress={() => setAmount(((Math.abs(friend.balance) * pct) / 100).toFixed(2))}
              >
                <Text style={styles.quickChipText}>{pct}%</Text>
              </TouchableOpacity>
            ))}
          </View>

        {/* Payment method selector */}
        <Text style={styles.label}>Payment method</Text>
        <View style={styles.methodRow}>
          {methods.map((m) => {
            const isActive = selectedMethod === m.label;
            return (
              <TouchableOpacity
                key={m.label}
                style={[styles.methodCard, isActive && styles.methodCardActive]}
                onPress={() => setSelectedMethod(m.label)}
              >
                <Ionicons name={m.icon} size={22} color={isActive ? '#4ade80' : '#888'} />
                <Text style={[styles.methodLabel, isActive && styles.methodLabelActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Note */}
        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="Add a note…"
          placeholderTextColor="#555"
          multiline
          numberOfLines={3}
        />


        {selectedMethod === 'UPI' ? (
          qrCode ? (
            <View style={{ alignItems: 'center', marginTop: 30 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 16 }}>
                {paymentSuccess ? '✅ Payment Verified!' : 'Scan to Pay via UPI'}
              </Text>
              <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 20 }}>
                <Image source={{ uri: qrCode }} style={{ width: 220, height: 220 }} resizeMode="contain" />
              </View>

              {/* UPI Transaction ID Input */}
              {!paymentSuccess && (
                <View style={{ width: '100%', marginBottom: 16 }}>
                  <Text style={{ color: '#4ade80', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
                    Enter UPI Transaction ID from SMS
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#1a1a2e',
                      borderWidth: 1,
                      borderColor: '#2a2a3e',
                      borderRadius: 12,
                      padding: 12,
                      color: '#fff',
                      fontSize: 14,
                    }}
                    value={upiTxnId}
                    onChangeText={setUpiTxnId}
                    placeholder="e.g., 413267809430"
                    placeholderTextColor="#555"
                    editable={!isChecking}
                  />
                </View>
              )}

              {/* Check Payment Button */}
              {!paymentSuccess && (
                <TouchableOpacity
                  style={[styles.settleBtn, isChecking && styles.btnDisabled]}
                  onPress={handleCheckPayment}
                  disabled={isChecking}
                  activeOpacity={0.85}
                >
                  {isChecking ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                      <Text style={styles.settleBtnText}>Check Payment</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {paymentSuccess && (
                <TouchableOpacity
                  style={[styles.settleBtn, isChecking && styles.btnDisabled]}
                  onPress={handleDone}
                  disabled={isChecking}
                  activeOpacity={0.85}
                >
                  {isChecking ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-all" size={20} color="#fff" />
                      <Text style={styles.settleBtnText}>Done</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.settleBtn, styles.upiBtn, isGeneratingQR && styles.btnDisabled]}
              onPress={handleSettleUPI}
              disabled={isGeneratingQR}
              activeOpacity={0.85}
            >
              {isGeneratingQR ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="qr-code-outline" size={20} color="#fff" />
                  <Text style={styles.settleBtnText}>Generate UPI QR</Text>
                </>
              )}
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity
            style={styles.settleBtn}
            onPress={handleSettle}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.settleBtnText}>Record {selectedMethod} Payment</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  inner: { padding: 20, paddingBottom: 60 },

  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e94560',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  settlingWith: { color: '#888', fontSize: 12 },
  friendName: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 },

  balanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0ea5e922',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#0ea5e944',
  },
  balanceText: { color: '#0ea5e9', fontSize: 13, fontWeight: '600', flex: 1 },

  label: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  currencySymbol: { color: '#4ade80', fontSize: 28, fontWeight: '800', marginRight: 4 },
  amountInput: {
    flex: 1,
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
    paddingVertical: 14,
  },

  quickRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  quickChip: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  quickChipText: { color: '#888', fontWeight: '700', fontSize: 13 },

  methodRow: { flexDirection: 'row', gap: 10 },
  methodCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  methodCardActive: {
    borderColor: '#4ade80',
    backgroundColor: '#4ade8011',
  },
  methodLabel: { color: '#888', fontSize: 12, fontWeight: '600' },
  methodLabelActive: { color: '#4ade80' },

  noteInput: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 15,
    textAlignVertical: 'top',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#1a1a2e',
  },
  statusText: { fontSize: 14, fontWeight: '700' },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  linkText: { color: '#0ea5e9', fontSize: 12, flex: 1 },

  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4ade80',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 28,
    shadowColor: '#4ade80',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  upiBtn: {
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
  },
  btnDisabled: { opacity: 0.6 },
  settleBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', padding: 14, marginTop: 6 },
  cancelText: { color: '#666', fontSize: 15 },
});
