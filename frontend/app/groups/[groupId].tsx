import { MOCK_EXPENSES, MOCK_GROUPS } from '@/data/mockData';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = MOCK_GROUPS.find((g) => g.id === groupId) ?? MOCK_GROUPS[0];
  const expenses = MOCK_EXPENSES.filter((e) => e.groupId === group.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Group header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>{group.emoji ?? '👥'}</Text>
        <Text style={styles.headerTitle}>{group.name}</Text>
        <Text style={styles.headerSub}>{group.members.length} members</Text>

        {/* Net balance */}
        <View style={styles.balanceBadge}>
          {group.netBalance > 0 ? (
            <Text style={[styles.balanceText, { color: '#4ade80' }]}>
              You are owed ${group.netBalance.toFixed(2)}
            </Text>
          ) : group.netBalance < 0 ? (
            <Text style={[styles.balanceText, { color: '#f87171' }]}>
              You owe ${Math.abs(group.netBalance).toFixed(2)}
            </Text>
          ) : (
            <Text style={[styles.balanceText, { color: '#888' }]}>All settled up</Text>
          )}
        </View>
      </View>

      {/* Members */}
      <Text style={styles.sectionTitle}>Members</Text>
      <View style={styles.membersRow}>
        {group.members.map((m) => {
          const initials = m.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
          return (
            <View key={m.id} style={styles.memberItem}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitials}>{initials}</Text>
              </View>
              <Text style={styles.memberName} numberOfLines={1}>{m.name.split(' ')[0]}</Text>
            </View>
          );
        })}
      </View>

      {/* Expenses */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Expenses</Text>
        <TouchableOpacity
          style={styles.addExpBtn}
          onPress={() => router.push('/expenses/new')}
        >
          <Ionicons name="add" size={16} color="#e94560" />
          <Text style={styles.addExpText}>Add</Text>
        </TouchableOpacity>
      </View>

      {expenses.length === 0 ? (
        <Text style={styles.empty}>No expenses yet. Add one!</Text>
      ) : (
        expenses.map((exp) => (
          <TouchableOpacity
            key={exp.id}
            style={styles.expenseCard}
            onPress={() => router.push(`/expenses/${exp.id}`)}
            activeOpacity={0.75}
          >
            <View style={styles.expenseLeft}>
              <View style={styles.expIcon}>
                <Ionicons name="receipt-outline" size={20} color="#e94560" />
              </View>
              <View>
                <Text style={styles.expDesc}>{exp.description}</Text>
                <Text style={styles.expDate}>
                  {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>
            <View style={styles.expenseRight}>
              <Text style={styles.expAmount}>${exp.amount.toFixed(2)}</Text>
              <Text style={styles.expPaidBy}>paid by {exp.paidBy.name.split(' ')[0]}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* Simplify debts */}
      <TouchableOpacity style={styles.simplifyBtn}>
        <Ionicons name="git-merge-outline" size={18} color="#7c3aed" />
        <Text style={styles.simplifyText}>Simplify debts</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  headerEmoji: { fontSize: 56 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 8 },
  headerSub: { color: '#888', fontSize: 13, marginTop: 4 },
  balanceBadge: {
    marginTop: 12,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  balanceText: { fontWeight: '700', fontSize: 14 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  addExpBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addExpText: { color: '#e94560', fontWeight: '700', fontSize: 14 },
  membersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  memberItem: { alignItems: 'center', width: 60 },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e94560',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitials: { color: '#fff', fontWeight: '700', fontSize: 16 },
  memberName: { color: '#ccc', fontSize: 11, marginTop: 4 },
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
  expenseRight: { alignItems: 'flex-end' },
  expAmount: { color: '#fff', fontWeight: '700', fontSize: 16 },
  expPaidBy: { color: '#666', fontSize: 11, marginTop: 2 },
  simplifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 16,
    padding: 14,
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#7c3aed44',
  },
  simplifyText: { color: '#7c3aed', fontWeight: '700', fontSize: 15 },
  empty: { color: '#666', textAlign: 'center', padding: 24, fontSize: 14 },
});
