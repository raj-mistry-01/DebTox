/**
 * Settle Tab Screen
 * Displays debt settlement options including simplified debts
 */

import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import SimplifiedDebtView from '@/components/SimplifiedDebtView';

export default function SettleScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [refreshKey, setRefreshKey] = useState(0);

  if (!groupId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No group selected</Text>
      </View>
    );
  }

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="swap-horizontal" size={24} color="#e94560" />
        <Text style={styles.headerTitle}>Simplified Settlement</Text>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={18} color="#3b82f6" />
        <Text style={styles.infoText}>
          View optimized payment flow using the greedy algorithm - pay minimum transactions
        </Text>
      </View>

      {/* Simplified Debts Component */}
      <SimplifiedDebtView key={refreshKey} groupId={groupId} onRefresh={handleRefresh} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  infoBanner: {
    backgroundColor: '#1a2332',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 10,
  },
  infoText: {
    color: '#3b82f6',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});
