import { MOCK_FRIENDS } from '@/data/mockData';
import { useSetuPayment } from '@/hooks/use-setu';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type PaymentMethod = 'Cash' | 'Card' | 'UPI';

const TERMINAL_STATUSES = ['PAYMENT_SUCCESSFUL', 'PAYMENT_FAILED', 'BILL_EXPIRED'];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  BILL_CREATED:        { label: '⏳ Awaiting payment…',   color: '#f59e0b' },
  PAYMENT_SUCCESSFUL:  { label: '✅ Payment received!',    color: '#4ade80' },
  PAYMENT_FAILED:      { label: '❌ Payment failed',       color: '#f87171' },
  BILL_EXPIRED:        { label: '⏰ Link expired',         color: '#888'    },
};

export default function SettleUpScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const friend = MOCK_FRIENDS.find((f) => f.user.id === userId) ?? MOCK_FRIENDS[0];

  const [amount, setAmount] = useState(Math.abs(friend.balance).toFixed(2));
  const [note, setNote] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Cash');
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  const { initiatePayment, pollStatus, loading, shortURL, platformBillID } = useSetuPayment();
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initials = friend.user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // ─── Cash / Card settlement (record only) ───────────────────────────────────
  const handleSettle = () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }
    Alert.alert(
      'Settlement recorded! ✅',
      `You recorded a ${selectedMethod} payment of ₹${parsed.toFixed(2)} to ${friend.user.name}.`,
      [{ text: 'Done', onPress: () => router.back() }]
    );
  };

  // ─── UPI settlement via Setu ────────────────────────────────────────────────
  const handleSettleUPI = async () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    // Reset previous status if retrying
    setPaymentStatus(null);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    await initiatePayment({
      amount: parsed * 100,                    // ₹ → paise
      billerBillID: `TXN-${Date.now()}`,       // unique per transaction
      note: note || `Settle up with ${friend.user.name}`,
    });
  };

  // ─── Poll for UPI status once platformBillID is available ──────────────────
  useEffect(() => {
    if (!platformBillID) return;

    setPaymentStatus('BILL_CREATED');

    pollIntervalRef.current = setInterval(async () => {
      const status = await pollStatus();
      if (!status) return;

      setPaymentStatus(status);

      if (TERMINAL_STATUSES.includes(status)) {
        clearInterval(pollIntervalRef.current!);

        if (status === 'PAYMENT_SUCCESSFUL') {
          Alert.alert('✅ Payment Successful!', `₹${amount} received from ${friend.user.name}.`, [
            { text: 'Done', onPress: () => router.back() },
          ]);
        } else if (status === 'PAYMENT_FAILED') {
          Alert.alert('❌ Payment Failed', 'The payment was not completed. You can retry.');
        } else if (status === 'BILL_EXPIRED') {
          Alert.alert('⏰ Link Expired', 'This payment link has expired. Generate a new one.');
        }
      }
    }, 5000);

    return () => clearInterval(pollIntervalRef.current!);
  }, [platformBillID]);

  const methods: { icon: React.ComponentProps<typeof Ionicons>['name']; label: PaymentMethod }[] = [
    { icon: 'cash-outline',           label: 'Cash' },
    { icon: 'card-outline',           label: 'Card' },
    { icon: 'phone-portrait-outline', label: 'UPI'  },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0f0f1a' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

        {/* Friend summary */}
        <View style={styles.friendCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.settlingWith}>Settling up with</Text>
            <Text style={styles.friendName}>{friend.user.name}</Text>
          </View>
        </View>

        {/* Balance reminder */}
        <View style={styles.balanceBanner}>
          <Ionicons name="information-circle-outline" size={18} color="#0ea5e9" />
          <Text style={styles.balanceText}>
            {friend.balance < 0
              ? `You owe ${friend.user.name.split(' ')[0]} ₹${Math.abs(friend.balance).toFixed(2)}`
              : `${friend.user.name.split(' ')[0]} owes you ₹${friend.balance.toFixed(2)}`}
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

        {/* UPI status badge */}
        {paymentStatus && STATUS_LABELS[paymentStatus] && (
          <View style={[styles.statusBadge, { borderColor: STATUS_LABELS[paymentStatus].color }]}>
            <Text style={[styles.statusText, { color: STATUS_LABELS[paymentStatus].color }]}>
              {STATUS_LABELS[paymentStatus].label}
            </Text>
            {paymentStatus === 'BILL_CREATED' && (
              <ActivityIndicator size="small" color={STATUS_LABELS[paymentStatus].color} style={{ marginLeft: 8 }} />
            )}
          </View>
        )}

        {/* UPI payment link */}
        {shortURL && (
          <View style={styles.linkRow}>
            <Ionicons name="link-outline" size={14} color="#0ea5e9" />
            <Text style={styles.linkText} numberOfLines={1}>{shortURL}</Text>
          </View>
        )}

        {/* Action buttons */}
        {selectedMethod === 'UPI' ? (
          <TouchableOpacity
            style={[styles.settleBtn, styles.upiBtn, loading && styles.btnDisabled]}
            onPress={handleSettleUPI}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="phone-portrait-outline" size={20} color="#fff" />
                <Text style={styles.settleBtnText}>Pay via UPI</Text>
              </>
            )}
          </TouchableOpacity>
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
