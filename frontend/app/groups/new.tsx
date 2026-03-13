import { MOCK_USERS } from '@/data/mockData';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function NewGroupScreen() {
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name.');
      return;
    }
    Alert.alert('Group created!', `"${groupName}" with ${selectedMembers.length + 1} members.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Text style={styles.sectionTitle}>Group Name</Text>
      <TextInput
        style={styles.input}
        value={groupName}
        onChangeText={setGroupName}
        placeholder="e.g. Barcelona Trip 🏖️"
        placeholderTextColor="#555"
      />

      <Text style={styles.sectionTitle}>Add Members</Text>
      {MOCK_USERS.slice(1).map((user) => {
        const selected = selectedMembers.includes(user.id);
        const initials = user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
        return (
          <TouchableOpacity
            key={user.id}
            style={[styles.memberRow, selected && styles.memberRowSelected]}
            onPress={() => toggleMember(user.id)}
            activeOpacity={0.75}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>{user.name}</Text>
              <Text style={styles.memberEmail}>{user.email}</Text>
            </View>
            <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
              {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity style={styles.createBtn} onPress={handleCreate} activeOpacity={0.85}>
        <Text style={styles.createBtnText}>Create Group</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  inner: { padding: 20, paddingBottom: 60 },
  sectionTitle: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    gap: 12,
  },
  memberRowSelected: { borderColor: '#e94560' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e94560',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  memberName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  memberEmail: { color: '#666', fontSize: 12, marginTop: 1 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: '#e94560', borderColor: '#e94560' },
  createBtn: {
    backgroundColor: '#e94560',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: '#e94560',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  createBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
