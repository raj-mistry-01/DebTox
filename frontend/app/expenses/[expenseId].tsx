import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiClient } from '@/services/api';

interface ExpenseDetail {
  id: string;
  description: string;
  amount: number;
  category?: string;
  date: string;
  paidBy: { id: string; name: string };
  splitWith: Array<{ user: { id: string; name: string }; share: number }>;
}

export default function ExpenseDetailScreen() {
  const { expenseId } = useLocalSearchParams<{ expenseId: string }>();
  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenseDetails();
  }, [expenseId]);

  const fetchExpenseDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getExpense(expenseId!);
      setExpense(response);
    } catch (error) {
      console.error('Failed to fetch expense:', error);
      Alert.alert('Error', 'Failed to load expense details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.deleteExpense(expenseId!);
            router.back();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete expense');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff' }}>Expense not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Main info */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="receipt" size={32} color="#e94560" />
        </View>
        <Text style={styles.description}>{expense.description}</Text>
        <Text style={styles.amount}>${expense.amount.toFixed(2)}</Text>
        <Text style={styles.category}>{expense.category ?? 'General'}</Text>
        <Text style={styles.date}>
          {new Date(expense.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Paid by */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paid by</Text>
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {expense.paidBy.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{expense.paidBy.name}</Text>
            <Text style={styles.paidAmount}>${expense.amount.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Split */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Split with</Text>
        {expense.splitWith && expense.splitWith.length > 0 ? (
          expense.splitWith.map((split) => {
            const initials = split.user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
            return (
              <View key={split.user.id} style={styles.userRow}>
                <View style={[styles.avatar, { backgroundColor: '#7c3aed' }]}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{split.user.name}</Text>
                </View>
                <Text style={styles.share}>${split.share.toFixed(2)}</Text>
              </View>
            );
          })
        ) : (
          <Text style={{ color: '#666', marginTop: 8 }}>No split details</Text>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => Alert.alert('Edit', 'Expense editing coming soon!')}
          activeOpacity={0.85}
        >
          <Ionicons name="pencil-outline" size={18} color="#e94560" />
          <Text style={styles.editBtnText}>Edit Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.85}>
          <Ionicons name="trash-outline" size={18} color="#f87171" />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  hero: { alignItems: 'center', padding: 28 },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e9456022',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  description: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  amount: { color: '#e94560', fontSize: 40, fontWeight: '800', marginTop: 8 },
  category: {
    color: '#888',
    fontSize: 13,
    marginTop: 6,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  date: { color: '#666', fontSize: 13, marginTop: 8 },
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  sectionTitle: {
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e94560',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  userName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  paidAmount: { color: '#4ade80', fontSize: 13, marginTop: 1 },
  share: { color: '#f87171', fontWeight: '700', fontSize: 14 },
  actions: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginTop: 8 },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e9456044',
  },
  editBtnText: { color: '#e94560', fontWeight: '700', fontSize: 14 },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f8717144',
  },
  deleteBtnText: { color: '#f87171', fontWeight: '700', fontSize: 14 },
});
