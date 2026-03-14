import { apiClient } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Friend } from '@/types';

type Step = 'details' | 'members' | 'review';

const CURRENCY_OPTIONS = [
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
];

export default function NewGroupScreen() {
  const [step, setStep] = useState<Step>('details');
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [memberEmail, setMemberEmail] = useState('');
  const [members, setMembers] = useState<{ email: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  useEffect(() => {
    if (step === 'members') {
      fetchFriends();
    }
  }, [step]);

  const fetchFriends = async () => {
    try {
      setLoadingFriends(true);
      const response = await apiClient.getBalances();
      setFriends(response.friends || []);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      Alert.alert('Error', 'Failed to load friends');
    } finally {
      setLoadingFriends(false);
    }
  };

  const validateGroupDetails = () => {
    if (!groupName.trim() || groupName.trim().length < 2) {
      Alert.alert('Error', 'Group name must be at least 2 characters.');
      return false;
    }
    return true;
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddMember = () => {
    const email = memberEmail.trim().toLowerCase();
    
    if (!email) {
      Alert.alert('Error', 'Please enter an email address.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    if (members.some(m => m.email === email)) {
      Alert.alert('Error', 'This email is already added.');
      return;
    }

    setMembers([...members, { email, name: email }]);
    setMemberEmail('');
  };

  const handleAddFriend = (friend: Friend) => {
    if (members.some(m => m.email === friend.user.email)) {
      Alert.alert('Already Added', `${friend.user.name} is already in the group.`);
      return;
    }
    
    setMembers([...members, { email: friend.user.email, name: friend.user.name }]);
  };

  const handleRemoveMember = (email: string) => {
    setMembers(members.filter(m => m.email !== email));
  };

  const handleCreateGroup = async () => {
    setLoading(true);
    try {
      const memberEmails = members.map(m => m.email);
      const response = await apiClient.createGroup(
        groupName.trim(),
        description.trim() || undefined,
        currency,
        memberEmails
      );

      Alert.alert('Success', 'Group created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/(tabs)/groups');
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create group. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Group Details
  if (step === 'details') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Create a Group</Text>
            <Text style={styles.subtitle}>Step 1 of 3: Group Details</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Group Name *</Text>
            <TextInput
              style={styles.input}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="e.g., Weekend Trip"
              placeholderTextColor="#555"
              autoCapitalize="words"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g., Accommodation, food, activities..."
              placeholderTextColor="#555"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Currency *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.currencyScroll}
            >
              {CURRENCY_OPTIONS.map((cur) => (
                <TouchableOpacity
                  key={cur.code}
                  style={[
                    styles.currencyButton,
                    currency === cur.code && styles.currencyButtonActive,
                  ]}
                  onPress={() => setCurrency(cur.code)}
                >
                  <Text style={styles.currencySymbol}>{cur.symbol}</Text>
                  <Text style={[
                    styles.currencyCode,
                    currency === cur.code && { color: '#fff' },
                  ]}>
                    {cur.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={() => {
                if (validateGroupDetails()) {
                  setStep('members');
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.nextButtonText}>Next: Add Members</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Step 2: Add Members
  if (step === 'members') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Add Members</Text>
            <Text style={styles.subtitle}>Step 2 of 3: Invite Friends</Text>
          </View>

          <View style={styles.form}>
            {/* Friends List */}
            {loadingFriends ? (
              <ActivityIndicator size="large" color="#e94560" style={{ marginVertical: 20 }} />
            ) : friends.length > 0 ? (
              <>
                <Text style={styles.label}>Quick Add: Your Friends</Text>
                <View style={styles.friendsList}>
                  {friends.map((friend) => {
                    const isAdded = members.some(m => m.email === friend.user.email);
                    return (
                      <TouchableOpacity
                        key={friend.id}
                        style={[styles.friendItem, isAdded && styles.friendItemAdded]}
                        onPress={() => handleAddFriend(friend)}
                        disabled={isAdded}
                        activeOpacity={isAdded ? 1 : 0.7}
                      >
                        <View style={styles.friendInfo}>
                          <View style={styles.friendAvatar}>
                            <Text style={styles.friendAvatarText}>
                              {friend.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.friendName}>{friend.user.name}</Text>
                            <Text style={styles.friendEmail}>{friend.user.email}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.friendAddBtn,
                            isAdded && styles.friendAddBtnActive,
                          ]}
                          onPress={() => handleAddFriend(friend)}
                          disabled={isAdded}
                        >
                          <Ionicons
                            name={isAdded ? 'checkmark' : 'add'}
                            size={20}
                            color={isAdded ? '#fff' : '#e94560'}
                          />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : (
              <Text style={styles.hint}>No friends yet. Add friends first to select them here.</Text>
            )}

            {/* Manual Email Input */}
            <Text style={[styles.label, { marginTop: 20 }]}>Or Add by Email</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                value={memberEmail}
                onChangeText={setMemberEmail}
                placeholder="friend@example.com"
                placeholderTextColor="#555"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddMember}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {members.length > 0 && (
              <View style={styles.membersList}>
                <Text style={styles.label}>Added Members ({members.length})</Text>
                {members.map((member, index) => (
                  <View key={index} style={styles.memberItem}>
                    <View style={styles.memberInfo}>
                      <Ionicons name="person-circle" size={28} color="#e94560" />
                      <View>
                        <Text style={styles.memberEmail}>{member.name}</Text>
                        <Text style={styles.memberEmailSmall}>{member.email}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveMember(member.email)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.hint}>
              {members.length === 0
                ? 'Add members from your friends or by email. You can add more after creating the group.'
                : `${members.length} member(s) added`}
            </Text>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setStep('details')}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-back" size={18} color="#e94560" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nextButton}
                onPress={() => setStep('review')}
                activeOpacity={0.85}
              >
                <Text style={styles.nextButtonText}>Review</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Step 3: Review & Create
  if (step === 'review') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.title}>Review Group</Text>
          <Text style={styles.subtitle}>Step 3 of 3: Create</Text>
        </View>

        <View style={styles.reviewCard}>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Group Name</Text>
            <Text style={styles.reviewValue}>{groupName}</Text>
          </View>

          {description && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Description</Text>
              <Text style={styles.reviewValue}>{description}</Text>
            </View>
          )}

          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Currency</Text>
            <Text style={styles.reviewValue}>
              {CURRENCY_OPTIONS.find(c => c.code === currency)?.name} ({currency})
            </Text>
          </View>

          <View style={[styles.reviewRow, styles.reviewRowNoBottom]}>
            <Text style={styles.reviewLabel}>Members</Text>
            <Text style={styles.reviewValue}>{members.length + 1} (including you)</Text>
          </View>
        </View>

        {members.length > 0 && (
          <View style={styles.membersList}>
            <Text style={styles.label}>Group Members</Text>
            <View style={styles.memberItem}>
              <View style={styles.memberInfo}>
                <Ionicons name="person-circle" size={28} color="#e94560" />
                <View>
                  <Text style={styles.memberEmail}>You (Admin)</Text>
                </View>
              </View>
            </View>
            {members.map((member, index) => (
              <View key={index} style={styles.memberItem}>
                <View style={styles.memberInfo}>
                  <Ionicons name="person-circle" size={28} color="#888" />
                  <View>
                    <Text style={styles.memberEmail}>{member.name}</Text>
                    <Text style={styles.memberEmailSmall}>{member.email}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('members')}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={18} color="#e94560" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createButton, loading && styles.buttonDisabled]}
            onPress={handleCreateGroup}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.createButtonText}>Create Group</Text>
                <Ionicons name="checkmark-done" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  inner: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
  form: { gap: 4 },
  label: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  currencyScroll: {
    marginVertical: 8,
  },
  currencyButton: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  currencyButtonActive: {
    backgroundColor: '#e94560',
    borderColor: '#e94560',
  },
  currencySymbol: {
    color: '#e94560',
    fontSize: 18,
    fontWeight: '800',
  },
  currencyCode: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  inputGroup: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  membersList: {
    marginTop: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  memberEmail: {
    color: '#ddd',
    fontSize: 14,
    fontWeight: '500',
  },
  hint: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  reviewCard: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
  },
  reviewRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  reviewRowNoBottom: {
    borderBottomWidth: 0,
  },
  reviewLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  reviewValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  backButton: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#e94560',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backButtonText: {
    color: '#e94560',
    fontSize: 15,
    fontWeight: '700',
  },
  nextButton: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: '#e94560',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#e94560',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  createButton: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: '#00c853',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#00c853',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  createButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  friendsList: {
    gap: 8,
    marginBottom: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    borderRadius: 10,
    padding: 12,
  },
  friendItemAdded: {
    backgroundColor: '#00c85315',
    borderColor: '#00c853',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  friendName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  friendEmail: {
    color: '#888',
    fontSize: 12,
  },
  friendAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAddBtnActive: {
    backgroundColor: '#00c853',
    borderColor: '#00c853',
  },
  memberEmailSmall: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
