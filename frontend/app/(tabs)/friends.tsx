import { Friend } from '@/types';
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
import { useFriends } from '@/hooks/useApi';

function FriendCard({ friend }: { friend: Friend }) {
  const balance = friend.balance;
  const balanceColor = balance > 0 ? '#4ade80' : balance < 0 ? '#f87171' : '#888';
  const balanceLabel =
    balance > 0
      ? `owes you $${balance.toFixed(2)}`
      : balance < 0
      ? `you owe $${Math.abs(balance).toFixed(2)}`
      : 'settled up';

  const initials = friend.user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/friends/${friend.user.id}`)}
      activeOpacity={0.75}
    >
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View>
          <Text style={styles.name}>{friend.user.name}</Text>
          <Text style={styles.email}>{friend.user.email}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.balance, { color: balanceColor }]}>{balanceLabel}</Text>
        {balance !== 0 && (
          <TouchableOpacity
            style={styles.settleBtn}
            onPress={() => router.push(`/settle/${friend.user.id}`)}
          >
            <Text style={styles.settleBtnText}>Settle</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function FriendsScreen() {
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const { friends, loading, error, refetch } = useFriends(refreshKey);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const filtered = friends.filter((f) =>
    f.user.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalOwedByFriends = friends.reduce((sum, f) => (f.balance > 0 ? sum + f.balance : sum), 0);
  const totalOweToFriends = friends.reduce((sum, f) => (f.balance < 0 ? sum + Math.abs(f.balance) : sum), 0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (error && !loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>Error loading friends</Text>
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
            placeholder="Search friends…"
            placeholderTextColor="#555"
          />
        </View>
      </View>

      {/* Overall balance banner */}
      <View style={styles.banner}>
        <View style={styles.bannerItem}>
          <Text style={styles.bannerLabel}>Friends owe you</Text>
          <Text style={[styles.bannerValue, { color: '#4ade80' }]}>${totalOwedByFriends.toFixed(2)}</Text>
        </View>
        <View style={styles.bannerDivider} />
        <View style={styles.bannerItem}>
          <Text style={styles.bannerLabel}>You owe friends</Text>
          <Text style={[styles.bannerValue, { color: '#f87171' }]}>${totalOweToFriends.toFixed(2)}</Text>
        </View>
      </View>

      {loading ? (
        <View style={[styles.list, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#e94560" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <FriendCard friend={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {search ? 'No friends found.' : 'No friends yet.'}
            </Text>
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
  banner: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  bannerItem: { flex: 1, alignItems: 'center' },
  bannerDivider: { width: 1, backgroundColor: '#2a2a3e' },
  bannerLabel: { color: '#888', fontSize: 12 },
  bannerValue: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e94560',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  name: { color: '#fff', fontSize: 15, fontWeight: '700' },
  email: { color: '#666', fontSize: 12, marginTop: 1 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  balance: { fontSize: 12, fontWeight: '600' },
  settleBtn: {
    backgroundColor: '#1f2d3d',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#4ade80',
  },
  settleBtnText: { color: '#4ade80', fontSize: 11, fontWeight: '700' },
  empty: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 15 },
  errorText: { color: '#f87171', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  errorSubtext: { color: '#888', fontSize: 14, marginBottom: 16 },
  retryBtn: { backgroundColor: '#e94560', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '600' },
});
