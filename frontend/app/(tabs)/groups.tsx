import { Group } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';
import { useGroups } from '@/hooks/useApi';

function GroupCard({ group }: { group: Group }) {
  const balance = group.netBalance;
  const balanceColor = balance > 0 ? '#4ade80' : balance < 0 ? '#f87171' : '#888';
  const balanceText =
    balance > 0
      ? `you are owed $${balance.toFixed(2)}`
      : balance < 0
      ? `you owe $${Math.abs(balance).toFixed(2)}`
      : 'settled up';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/groups/${group.id}`)}
      activeOpacity={0.75}
    >
      <View style={styles.cardLeft}>
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{group.emoji ?? '👥'}</Text>
        </View>
        <View>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.memberCount}>
            {group.members?.length || 0} members
          </Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.balance, { color: balanceColor }]}>{balanceText}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function GroupsScreen() {
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const { groups, loading, error, refetch } = useGroups(refreshKey);

  // Refetch when screen is focused
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalOwed = groups.reduce((sum, g) => (g.netBalance > 0 ? sum + g.netBalance : sum), 0);
  const totalOwe = groups.reduce((sum, g) => (g.netBalance < 0 ? sum + Math.abs(g.netBalance) : sum), 0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (error && !loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>Error loading groups</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={handleRefresh}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color="#555" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search groups…"
            placeholderTextColor="#555"
          />
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/groups/new')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Net summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total owed</Text>
          <Text style={[styles.summaryValue, { color: '#4ade80' }]}>${totalOwed.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>You owe</Text>
          <Text style={[styles.summaryValue, { color: '#f87171' }]}>${totalOwe.toFixed(2)}</Text>
        </View>
      </View>

      {loading ? (
        <View style={[styles.list, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#e94560" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <GroupCard group={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <Text style={styles.empty}>{search ? 'No groups found.' : 'No groups yet. Create one to get started!'}</Text>
          }
          refreshing={loading}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },
  addBtn: {
    backgroundColor: '#e94560',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  summaryLabel: { color: '#888', fontSize: 12 },
  summaryValue: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  separator: { height: 8 },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0f0f1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 22 },
  groupName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  memberCount: { color: '#666', fontSize: 12, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  balance: { fontSize: 12, fontWeight: '600' },
  empty: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 15 },
  errorText: { color: '#f87171', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  errorSubtext: { color: '#888', fontSize: 14, marginBottom: 16 },
  retryBtn: { backgroundColor: '#e94560', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '600' },
});
