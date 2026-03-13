import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
} from 'react-native';
import { apiClient } from '@/services/api';
import { Group, Expense } from '@/types';
import SimplifiedDebtView from '@/components/SimplifiedDebtView';

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSimplifiedDebts, setShowSimplifiedDebts] = useState(false);

  const fetchGroupDetails = useCallback(async () => {
    if (!groupId) {
      setError('No group ID provided');
      console.warn('No groupId in route params');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching group details for groupId:', groupId);
      
      const groupRes = await apiClient.getGroup(groupId);
      console.log('Group response:', groupRes);
      
      // Backend returns the group data directly
      if (!groupRes || !groupRes.id) {
        setError('Invalid group data received');
        console.error('No group ID in response:', groupRes);
        return;
      }

      setGroup(groupRes);
      setExpenses(groupRes.expenses || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load group';
      console.error('Group fetch error:', errorMsg, err);
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useFocusEffect(
    useCallback(() => {
      fetchGroupDetails();
    }, [fetchGroupDetails])
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  if (error || !group) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.empty}>{error || 'Group not found'}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={fetchGroupDetails}
        >
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Group header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>👥</Text>
        <Text style={styles.headerTitle}>{group.name}</Text>
        <Text style={styles.headerSub}>{group.members?.length || 0} members</Text>

        {/* Net balance */}
        <View style={styles.balanceBadge}>
          {group.netBalance > 0 ? (
            <Text style={[styles.balanceText, { color: '#4ade80' }]}>
              You are owed ₹{Math.abs(group.netBalance).toFixed(2)}
            </Text>
          ) : group.netBalance < 0 ? (
            <Text style={[styles.balanceText, { color: '#f87171' }]}>
              You owe ₹{Math.abs(group.netBalance).toFixed(2)}
            </Text>
          ) : (
            <Text style={[styles.balanceText, { color: '#888' }]}>All settled up</Text>
          )}
        </View>
      </View>

      {/* Members */}
      <Text style={styles.sectionTitle}>Members</Text>
      <View style={styles.membersRow}>
        {group.members && group.members.map((m) => {
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

      {/* Simplified Debts Section */}
      <View style={styles.simplifySectionContainer}>
        <TouchableOpacity
          style={styles.simplifyToggleBtn}
          onPress={() => setShowSimplifiedDebts(!showSimplifiedDebts)}
        >
          <View style={styles.simplifyHeader}>
            <Ionicons name="shuffle" size={18} color="#4ade80" />
            <Text style={styles.simplifyTitle}>Simplified Settlement</Text>
          </View>
          <Ionicons 
            name={showSimplifiedDebts ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#888"
          />
        </TouchableOpacity>
        
        {showSimplifiedDebts && (
          <View style={styles.simplifyContent}>
            <SimplifiedDebtView groupId={groupId} />
          </View>
        )}
      </View>

      {/* Expenses */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Expenses</Text>
        <TouchableOpacity
          style={styles.addExpBtn}
          onPress={() => router.push(`/expenses/new?groupId=${groupId}`)}
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
              <Text style={styles.expAmount}>₹{exp.amount.toFixed(2)}</Text>
              <Text style={styles.expPaidBy}>paid by {exp.paidBy?.name?.split(' ')[0] || 'Unknown'}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
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
  empty: { color: '#666', textAlign: 'center', padding: 24, fontSize: 14 },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#e94560',
    borderRadius: 8,
  },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  simplifySectionContainer: {
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    overflow: 'hidden',
  },
  simplifyToggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  simplifyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  simplifyTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  simplifyContent: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
    paddingHorizontal: 0,
    maxHeight: 500,
  },
});
