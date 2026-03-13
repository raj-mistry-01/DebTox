import { MOCK_FRIENDS } from '@/data/mockData';
import { Friend } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';

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
        <TouchableOpacity
          style={styles.settleBtn}
          onPress={() => router.push(`/settle/${friend.user.id}`)}
        >
          <Text style={styles.settleBtnText}>Settle</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function FriendsScreen() {
  const [search, setSearch] = useState('');
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [dummyRefresh, setDummyRefresh] = useState(0);

  const filtered = MOCK_FRIENDS.filter((f) =>
    f.user.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddFriend = () => {
    if (!newName.trim()) return;
    const newFriend: Friend = {
      id: `friend-${Date.now()}`,
      user: {
        id: `user-${Date.now()}`,
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
      },
      balance: 0,
    };
    MOCK_FRIENDS.push(newFriend);
    setNewName('');
    setNewEmail('');
    setAddModalVisible(false);
    setDummyRefresh((prev) => prev + 1);
  };

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
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setAddModalVisible(true)}
        >
          <Ionicons name="person-add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Overall balance banner */}
      <View style={styles.banner}>
        <View style={styles.bannerItem}>
          <Text style={styles.bannerLabel}>Friends owe you</Text>
          <Text style={[styles.bannerValue, { color: '#4ade80' }]}>$42.50</Text>
        </View>
        <View style={styles.bannerDivider} />
        <View style={styles.bannerItem}>
          <Text style={styles.bannerLabel}>You owe friends</Text>
          <Text style={[styles.bannerValue, { color: '#f87171' }]}>$150.00</Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        extraData={dummyRefresh}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FriendCard friend={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={<Text style={styles.empty}>No friends found.</Text>}
      />

      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Friend</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex. Jane Doe"
                placeholderTextColor="#555"
                value={newName}
                onChangeText={setNewName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex. jane@example.com"
                placeholderTextColor="#555"
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, !newName.trim() && { opacity: 0.5 }]}
              onPress={handleAddFriend}
              disabled={!newName.trim()}
            >
              <Text style={styles.saveBtnText}>Add Friend</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const AVATAR_COLORS = ['#e94560', '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b'];

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
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: '#888', fontSize: 13, marginBottom: 8, fontWeight: '600' },
  modalInput: {
    backgroundColor: '#0f0f1a',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  saveBtn: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: Platform.OS === 'ios' ? 24 : 0,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
