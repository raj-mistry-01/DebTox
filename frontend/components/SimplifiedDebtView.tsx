/**
 * SimplifiedDebtView Component
 * Displays minimized settlement plan for a group using greedy algorithm
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSimplifiedDebts } from '@/hooks/useApi';
import { apiClient } from '@/services/api';

interface SimplifiedDebt {
  from: { id: string; name: string; email: string };
  to: { id: string; name: string; email: string };
  amount: number;
}

interface Props {
  groupId: string;
  onRefresh?: () => void;
}

export default function SimplifiedDebtView({ groupId, onRefresh }: Props) {
  const { debts, loading, error, stats, refetch } = useSimplifiedDebts(groupId, false);
  const [marking, setMarking] = useState<string | null>(null);

  const handleMarkAsPaid = async (debtId: string) => {
    try {
      setMarking(debtId);
      await apiClient.markSettlementAsPaid(groupId, debtId, 'manual');
      Alert.alert('Success', 'Settlement marked as paid');
      refetch();
      onRefresh?.();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to mark as paid');
    } finally {
      setMarking(null);
    }
  };

  const handleForceRecalculate = async () => {
    try {
      await apiClient.invalidateDebtCache(groupId);
      refetch();
    } catch (err) {
      Alert.alert('Error', 'Failed to recalculate');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (debts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="checkmark-circle-outline" size={48} color="#4ade80" />
        <Text style={styles.allSettledText}>All settled! No debts to resolve.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Optimization Stats Card */}
      {stats && (
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View>
              <Text style={styles.statLabel}>Transactions</Text>
              <Text style={styles.statValue}>{stats.totalTransactions}</Text>
            </View>
            <View style={styles.statDivider} />
            <View>
              <Text style={styles.statLabel}>Reduction</Text>
              <Text style={styles.statValue}>{stats.savingsPercentage}%</Text>
            </View>
            <View style={styles.statDivider} />
            <View>
              <Text style={styles.statLabel}>Method</Text>
              <Text style={styles.statValue}>Optimized</Text>
            </View>
          </View>
          <View style={styles.sourceInfo}>
            <Text style={styles.sourceText}>
              {stats.source === 'cache' ? '📦 From cache' : '⚡ Freshly calculated'}
            </Text>
          </View>
        </View>
      )}

      {/* Optimization Info */}
      <View style={styles.infoCard}>
        <Ionicons name="bulb-outline" size={20} color="#fbbf24" />
        <Text style={styles.infoText}>
          Minimized using greedy algorithm. Each transaction fully settles at least one person. (Optimal: N-1
          transactions for N people)
        </Text>
      </View>

      {/* Settlements List */}
      <Text style={styles.sectionTitle}>Settlement Transactions</Text>
      {debts.map((debt: SimplifiedDebt, index: number) => (
        <View key={`${debt.from.id}-${debt.to.id}-${index}`} style={styles.debtCard}>
          <View style={styles.debtFlow}>
            {/* From User */}
            <View style={styles.userBubble}>
              <Text style={styles.userInitial}>{debt.from.name.charAt(0).toUpperCase()}</Text>
            </View>

            {/* Arrow & Amount */}
            <View style={styles.flowMiddle}>
              <Ionicons name="arrow-forward" size={20} color="#888" style={{ marginBottom: 4 }} />
              <Text style={styles.amountText}>₹{debt.amount.toFixed(2)}</Text>
            </View>

            {/* To User */}
            <View style={styles.userBubble}>
              <Text style={styles.userInitial}>{debt.to.name.charAt(0).toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.debtDetails}>
            <View>
              <Text style={styles.nameText}>
                {debt.from.name}
                <Text style={styles.lightText}> pays </Text>
                {debt.to.name}
              </Text>
              <Text style={styles.emailText}>{debt.from.email}</Text>
            </View>
            <TouchableOpacity
              style={[styles.markPaidBtn, marking === debt.from.id && styles.markPaidBtnLoading]}
              onPress={() => handleMarkAsPaid(debt.from.id)}
              disabled={marking !== null}
            >
              {marking === debt.from.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.markPaidText}>Mark Paid</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Recalculate Button */}
      <TouchableOpacity style={styles.recalculateBtn} onPress={handleForceRecalculate}>
        <Ionicons name="refresh" size={18} color="#fff" />
        <Text style={styles.recalculateBtnText}>Recalculate Debts</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f1a',
  },
  statsCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e94560',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#4ade80',
    fontSize: 20,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#2a2a3e',
  },
  sourceInfo: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
  },
  sourceText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#2a2417',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 10,
  },
  infoText: {
    color: '#fbbf24',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  debtCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  debtFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  flowMiddle: {
    alignItems: 'center',
  },
  amountText: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
  },
  debtDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  lightText: {
    color: '#888',
  },
  emailText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  markPaidBtn: {
    backgroundColor: '#4ade80',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  markPaidBtnLoading: {
    opacity: 0.7,
  },
  markPaidText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  recalculateBtn: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  recalculateBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: '#e94560',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
  },
  allSettledText: {
    color: '#4ade80',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
});
