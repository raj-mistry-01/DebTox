import { MOCK_ACTIVITIES } from '@/data/mockData';
import { Activity } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const TYPE_META: Record<Activity['type'], { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  expense: { icon: 'receipt-outline', color: '#e94560', label: 'Expense' },
  payment: { icon: 'arrow-redo-outline', color: '#4ade80', label: 'Payment' },
  settlement: { icon: 'checkmark-circle-outline', color: '#0ea5e9', label: 'Settlement' },
};

function ActivityItem({ item }: { item: Activity }) {
  const meta = TYPE_META[item.type];
  const date = new Date(item.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.75}>
      <View style={[styles.iconCircle, { backgroundColor: meta.color + '22' }]}>
        <Ionicons name={meta.icon} size={22} color={meta.color} />
      </View>
      <View style={styles.itemBody}>
        <Text style={styles.itemDesc}>{item.description}</Text>
        {item.groupName && (
          <Text style={styles.itemGroup}>in {item.groupName}</Text>
        )}
        <Text style={styles.itemDate}>{date}</Text>
      </View>
      <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
    </TouchableOpacity>
  );
}

const FILTERS: Activity['type'][] = ['expense', 'payment', 'settlement'];

export default function ActivityScreen() {
  const [activeFilter, setActiveFilter] = useState<Activity['type'] | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = MOCK_ACTIVITIES.filter((a) => {
    const matchesFilter = activeFilter === 'all' || a.type === activeFilter;
    const matchesSearch = search === '' || 
      a.description.toLowerCase().includes(search.toLowerCase()) || 
      (a.groupName && a.groupName.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color="#555" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search activity…"
          placeholderTextColor="#555"
        />
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {(['all', ...FILTERS] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, activeFilter === f && styles.chipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.chipText, activeFilter === f && styles.chipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ActivityItem item={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={styles.empty}>No activity yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  chipActive: { backgroundColor: '#e94560', borderColor: '#e94560' },
  chipText: { color: '#888', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  separator: {
    height: 1,
    backgroundColor: '#1a1a2e',
    marginVertical: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: { flex: 1 },
  itemDesc: { color: '#eee', fontSize: 14, fontWeight: '600' },
  itemGroup: { color: '#888', fontSize: 12, marginTop: 2 },
  itemDate: { color: '#555', fontSize: 11, marginTop: 2 },
  amount: { color: '#ccc', fontSize: 14, fontWeight: '700' },
  empty: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 15 },
});
