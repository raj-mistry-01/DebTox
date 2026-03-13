import { MOCK_EXPENSES, MOCK_FRIENDS } from '@/data/mockData';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FriendDetailScreen() {
  const { friendId } = useLocalSearchParams<{ friendId: string }>();
  const friend = MOCK_FRIENDS.find((f) => f.user.id === friendId) ?? MOCK_FRIENDS[0];
  const shared = MOCK_EXPENSES.filter(
    (e) => e.splitWith.some((s) => s.user.id === friend.user.id) || e.paidBy.id === friend.user.id
  );

  const initials = friend.user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const balance = friend.balance;
  const balanceColor = balance > 0 ? '#4ade80' : balance < 0 ? '#f87171' : '#888';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Friend header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{friend.user.name}</Text>
        <Text style={styles.email}>{friend.user.email}</Text>

        <View style={styles.balanceBadge}>
          <Text style={[styles.balanceText, { color: balanceColor }]}>
            {balance > 0
              ? `${friend.user.name.split(' ')[0]} owes you $${balance.toFixed(2)}`
              : balance < 0
              ? `You owe ${friend.user.name.split(' ')[0]} $${Math.abs(balance).toFixed(2)}`
              : 'All settled up!'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.settleBtn}
          onPress={() => router.push(`/settle/${friend.user.id}`)}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={styles.settleBtnText}>Settle Up</Text>
        </TouchableOpacity>
      </View>

      {/* Shared expenses */}
      <Text style={styles.sectionTitle}>Shared Expenses</Text>
      {shared.length === 0 ? (
        <Text style={styles.empty}>No shared expenses yet.</Text>
      ) : (
        shared.map((exp) => (
          <TouchableOpacity
            key={exp.id}
            style={styles.expenseCard}
            onPress={() => router.push(`/expenses/${exp.id}`)}
            activeOpacity={0.75}
          >
            <View style={styles.expenseLeft}>
              <View style={styles.expIcon}>
                <Ionicons name="receipt-outline" size={18} color="#e94560" />
              </View>
              <View>
                <Text style={styles.expDesc}>{exp.description}</Text>
                <Text style={styles.expDate}>
                  {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>
            <Text style={styles.expAmount}>${exp.amount.toFixed(2)}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e94560',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 26 },
  name: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 12 },
  email: { color: '#888', fontSize: 13, marginTop: 4 },
  balanceBadge: {
    marginTop: 14,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  balanceText: { fontWeight: '700', fontSize: 14 },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: '#4ade80',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  settleBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionTitle: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  expenseCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  expenseLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  expIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9456022',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expDesc: { color: '#fff', fontSize: 14, fontWeight: '600' },
  expDate: { color: '#666', fontSize: 12, marginTop: 2 },
  expAmount: { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty: { color: '#666', textAlign: 'center', padding: 24, fontSize: 14 },
});
