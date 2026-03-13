/**
 * New Expense Screen - Support both Group and Friend Expenses
 * 
 * Two modes:
 * 1. Group Expense - Only shows members of selected group
 * 2. Friend Payment - Only shows accepted friends
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { apiClient } from '@/services/api';
import { useGroups, useFriends } from '@/hooks/useApi';

type ExpenseType = 'group' | 'friend';
type SplitType = 'equal' | 'percentage' | 'custom' | 'shares' | 'adjustment';

interface GroupMember {
  id: string;
  name: string;
  email: string;
  selected?: boolean;
  shareAmount?: number;
}

interface FriendItem {
  id: string;
  user: { id: string; name: string; email: string };
  balance: number;
}

export default function NewExpenseScreen() {
  const { groupId: initialGroupId } = useLocalSearchParams<{ groupId?: string }>();
  const { groups } = useGroups();
  const { friends } = useFriends();

  // Expense details
  const [expenseType, setExpenseType] = useState<ExpenseType>('group');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [splitMethod, setSplitMethod] = useState<SplitType>('equal');

  // Selection state
  const [selectedGroup, setSelectedGroup] = useState<string | null>(
    initialGroupId || null
  );
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [selectedPayer, setSelectedPayer] = useState<string | null>(null);

  // Data state
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch group members when group changes
  const handleGroupSelect = useCallback(
    async (gId: string) => {
      setSelectedGroup(gId);
      setSelectedPayer(null);
      setGroupMembers([]);

      try {
        setLoading(true);
        const groupData = await apiClient.getGroup(gId);
        const membersWithSelection = (groupData.members || []).map(
          (m: any) => ({
            ...m,
            selected: false,
          })
        );
        setGroupMembers(membersWithSelection);
      } catch (err) {
        Alert.alert('Error', 'Failed to load group members');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Toggle participant selection
  const toggleParticipant = (memberId: string) => {
    setGroupMembers((prev) =>
      prev.map((m) =>
        m.id === memberId 
          ? { ...m, selected: !m.selected }
          : m
      )
    );
  };

  // Update member share amount (for custom split modes)
  const updateMemberShare = (memberId: string, value: number) => {
    setGroupMembers((prev) =>
      prev.map((m) =>
        m.id === memberId 
          ? { ...m, shareAmount: value }
          : m
      )
    );
  };

  // Get selected members
  const selectedMembers = groupMembers.filter((m) => m.selected);

  // Calculate splits based on split method
  const calculateSplits = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) return [];

    if (expenseType === 'group') {
      if (selectedMembers.length === 0) return [];

      switch (splitMethod) {
        case 'equal':
          return selectedMembers.map((m) => ({
            userId: m.id,
            shareAmount: amountNum / selectedMembers.length,
          }));

        case 'percentage':
          // User-defined percentages (default to equal if not set)
          const totalPercent = selectedMembers.reduce(
            (sum, m) => sum + (m.shareAmount || 0),
            0
          );
          if (totalPercent === 0) {
            return selectedMembers.map((m) => ({
              userId: m.id,
              shareAmount: amountNum / selectedMembers.length,
            }));
          }
          return selectedMembers.map((m) => ({
            userId: m.id,
            shareAmount: (amountNum * (m.shareAmount || 0)) / totalPercent,
          }));

        case 'custom':
          // Custom amounts entered by user
          return selectedMembers.map((m) => ({
            userId: m.id,
            shareAmount: m.shareAmount || 0,
          }));

        case 'shares':
          // Custom number of shares
          const totalShares = selectedMembers.reduce(
            (sum, m) => sum + (m.shareAmount || 1),
            0
          );
          return selectedMembers.map((m) => ({
            userId: m.id,
            shareAmount: (amountNum * (m.shareAmount || 1)) / totalShares,
          }));

        case 'adjustment':
          // Equal split with adjustments
          const baseAmount = amountNum / selectedMembers.length;
          return selectedMembers.map((m) => ({
            userId: m.id,
            shareAmount: baseAmount + (m.shareAmount || 0),
          }));

        default:
          return selectedMembers.map((m) => ({
            userId: m.id,
            shareAmount: amountNum / selectedMembers.length,
          }));
      }
    } else {
      // Friend expense - simple split
      return [
        {
          userId: selectedFriend || '',
          shareAmount: amountNum,
        },
      ];
    }
  };

  // Handle expense type change
  const handleExpenseTypeChange = (type: ExpenseType) => {
    setExpenseType(type);
    setSelectedPayer(null);
    setGroupMembers([]);
    setSelectedGroup(null);
    setSelectedFriend(null);
  };

  // Create expense
  const handleCreateExpense = async () => {
    // Validation
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount.trim() || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!selectedPayer) {
      Alert.alert('Error', 'Please select who paid');
      return;
    }

    if (expenseType === 'group') {
      if (!selectedGroup) {
        Alert.alert('Error', 'Please select a group');
        return;
      }
      if (selectedMembers.length === 0) {
        Alert.alert('Error', 'Please select at least one person to split with');
        return;
      }
    } else {
      if (!selectedFriend) {
        Alert.alert('Error', 'Please select a friend');
        return;
      }
    }

    try {
      setLoading(true);

      const splits = calculateSplits();
      if (splits.length === 0) {
        Alert.alert('Error', 'No valid splits calculated');
        return;
      }

      if (expenseType === 'group') {
        // Group expense
        await apiClient.createExpense(
          selectedGroup,
          description,
          amountNum,
          splits,
          currency,
          'OTHER',
          splitMethod
        );

        Alert.alert('Success', 'Group expense added!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        // Friend expense - pass null for groupId
        await apiClient.createExpense(
          null,
          description,
          amountNum,
          splits,
          currency,
          'OTHER',
          splitMethod
        );

        Alert.alert('Success', 'Friend expense added!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  };

  const displayMembers =
    expenseType === 'group' ? groupMembers : friends.map((f) => ({ ...f.user }));

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Amount Input */}
        <View style={styles.amountSection}>
          <TouchableOpacity
            onPress={() => setShowCurrencyModal(true)}
            style={styles.currencyBtn}
          >
            <Text style={styles.currencyText}>{currency}</Text>
            <Ionicons name="chevron-down" size={18} color="#e94560" />
          </TouchableOpacity>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#555"
            keyboardType="decimal-pad"
            autoFocus
          />
        </View>

        {/* Description */}
        <Text style={styles.label}>What's it for?</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="e.g. Dinner, Coffee, Movie"
          placeholderTextColor="#555"
        />

        {/* Expense Type Toggle */}
        <Text style={styles.label}>Expense Type</Text>
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              expenseType === 'group' && styles.typeBtnActive,
            ]}
            onPress={() => handleExpenseTypeChange('group')}
          >
            <Ionicons
              name="people"
              size={18}
              color={expenseType === 'group' ? '#fff' : '#888'}
            />
            <Text
              style={[
                styles.typeText,
                expenseType === 'group' && styles.typeTextActive,
              ]}
            >
              Group
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeBtn,
              expenseType === 'friend' && styles.typeBtnActive,
            ]}
            onPress={() => handleExpenseTypeChange('friend')}
          >
            <Ionicons
              name="person"
              size={18}
              color={expenseType === 'friend' ? '#fff' : '#888'}
            />
            <Text
              style={[
                styles.typeText,
                expenseType === 'friend' && styles.typeTextActive,
              ]}
            >
              Friend
            </Text>
          </TouchableOpacity>
        </View>

        {/* Group Selection */}
        {expenseType === 'group' && (
          <>
            <Text style={styles.label}>Select Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {groups.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[
                    styles.optionChip,
                    selectedGroup === g.id.toString() && styles.optionChipActive,
                  ]}
                  onPress={() => handleGroupSelect(g.id.toString())}
                >
                  <Text style={styles.optionChipText}>
                    {g.emoji || '👥'} {g.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Friend Selection */}
        {expenseType === 'friend' && (
          <>
            <Text style={styles.label}>Select Friend</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {friends.map((f) => (
                <TouchableOpacity
                  key={f.user.id}
                  style={[
                    styles.friendChip,
                    selectedFriend === f.user.id && styles.friendChipActive,
                  ]}
                  onPress={() => setSelectedFriend(f.user.id)}
                >
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>
                      {f.user.name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </Text>
                  </View>
                  <Text numberOfLines={1} style={styles.friendName}>
                    {f.user.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Who Paid */}
        <Text style={styles.label}>Who Paid?</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#e94560" />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {displayMembers.map((member: any) => {
              const initials = member.name
                .split(' ')
                .map((w: any) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              const isSelected = selectedPayer === member.id;

              return (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.payerChip,
                    isSelected && styles.payerChipActive,
                  ]}
                  onPress={() => setSelectedPayer(member.id)}
                >
                  <View
                    style={[
                      styles.payerAvatar,
                      isSelected && styles.payerAvatarActive,
                    ]}
                  >
                    <Text style={styles.payerInitials}>{initials}</Text>
                  </View>
                  <Text style={styles.payerName}>
                    {member.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Split Options (Group Expense Only) */}
        {expenseType === 'group' && (
          <>
            <Text style={styles.label}>How to Split?</Text>
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  splitMethod === 'equal' && styles.typeBtnActive,
                ]}
                onPress={() => setSplitMethod('equal')}
              >
                <Text
                  style={[
                    styles.typeText,
                    splitMethod === 'equal' && styles.typeTextActive,
                  ]}
                >
                  Equal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  splitMethod === 'percentage' && styles.typeBtnActive,
                ]}
                onPress={() => setSplitMethod('percentage')}
              >
                <Text
                  style={[
                    styles.typeText,
                    splitMethod === 'percentage' && styles.typeTextActive,
                  ]}
                >
                  %
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  splitMethod === 'custom' && styles.typeBtnActive,
                ]}
                onPress={() => setSplitMethod('custom')}
              >
                <Text
                  style={[
                    styles.typeText,
                    splitMethod === 'custom' && styles.typeTextActive,
                  ]}
                >
                  Custom
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  splitMethod === 'adjustment' && styles.typeBtnActive,
                ]}
                onPress={() => setSplitMethod('adjustment')}
              >
                <Text
                  style={[
                    styles.typeText,
                    splitMethod === 'adjustment' && styles.typeTextActive,
                  ]}
                >
                  Adjust
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Participants (Group Expense Only) */}
        {expenseType === 'group' && selectedGroup && (
          <>
            <Text style={styles.label}>Split Between</Text>
            <Text style={styles.hintText}>
              (Select at least one person)
            </Text>
            {loading ? (
              <ActivityIndicator size="large" color="#e94560" />
            ) : (
              groupMembers.map((member) => {
                const isSelected = member.selected;
                const initials = member.name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                // Get split label based on mode
                let splitLabel = '';
                let splitValue = '';
                
                if (isSelected && amount) {
                  const amountNum = parseFloat(amount);
                  switch (splitMethod) {
                    case 'equal':
                      splitValue = (amountNum / selectedMembers.length).toFixed(2);
                      splitLabel = '₹';
                      break;
                    case 'percentage':
                      splitValue = ((member.shareAmount || 0)).toString();
                      splitLabel = '%';
                      break;
                    case 'custom':
                      splitValue = (member.shareAmount || 0).toFixed(2);
                      splitLabel = '₹';
                      break;
                    case 'shares':
                      splitValue = ((member.shareAmount || 1)).toString();
                      splitLabel = 'shares';
                      break;
                    case 'adjustment':
                      const baseAmt = amountNum / selectedMembers.length;
                      const adjAmount = baseAmt + (member.shareAmount || 0);
                      splitValue = adjAmount.toFixed(2);
                      splitLabel = '₹';
                      break;
                  }
                }

                return (
                  <View key={member.id}>
                    <TouchableOpacity
                      style={[
                        styles.memberRow,
                        isSelected && styles.memberRowActive,
                      ]}
                      onPress={() => toggleParticipant(member.id)}
                    >
                      <View style={styles.memberLeft}>
                        <View
                          style={[
                            styles.checkbox,
                            isSelected && styles.checkboxActive,
                          ]}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          )}
                        </View>
                        <View>
                          <Text style={styles.memberName}>{member.name}</Text>
                          <Text style={styles.memberEmail}>{member.email}</Text>
                        </View>
                      </View>
                      {isSelected && splitValue && (
                        <Text style={styles.shareAmount}>
                          {splitLabel === '₹' ? '₹' : ''}{splitValue}{splitLabel !== '₹' ? ' ' + splitLabel : ''}
                        </Text>
                      )}
                    </TouchableOpacity>

                    {/* Input field for custom split modes */}
                    {isSelected && splitMethod !== 'equal' && (
                      <View style={styles.memberInputRow}>
                        <Text style={styles.memberInputLabel}>
                          {splitMethod === 'percentage' 
                            ? 'Percentage (%)' 
                            : splitMethod === 'custom'
                            ? 'Amount (₹)'
                            : splitMethod === 'shares'
                            ? 'Shares'
                            : 'Adjustment (₹)'}
                        </Text>
                        <TextInput
                          style={styles.memberInput}
                          value={(member.shareAmount || 0).toString()}
                          onChangeText={(text) => {
                            const num = parseFloat(text) || 0;
                            updateMemberShare(member.id, num);
                          }}
                          placeholder={'0'}
                          placeholderTextColor="#555"
                          keyboardType="decimal-pad"
                        />
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}

        {/* Info Box */}
        {expenseType === 'friend' && selectedFriend && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color="#3b82f6" />
            <Text style={styles.infoText}>
              Direct payment between two friends. No group involved. Both debts will be simplified.
            </Text>
          </View>
        )}

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createBtn, loading && styles.createBtnDisabled]}
          onPress={handleCreateExpense}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createBtnText}>Add Expense</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Currency Modal */}
      <Modal
        visible={showCurrencyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD']}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.currencyItem}
                  onPress={() => {
                    setCurrency(item);
                    setShowCurrencyModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.currencyItemText,
                      currency === item && styles.currencyItemActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 60,
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  currencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  currencyText: {
    color: '#e94560',
    fontWeight: '700',
    fontSize: 16,
  },
  amountInput: {
    flex: 1,
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
    paddingVertical: 12,
  },
  label: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 16,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  typeToggle: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  typeBtnActive: {
    backgroundColor: '#e94560',
    borderColor: '#e94560',
  },
  typeText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 14,
  },
  typeTextActive: {
    color: '#fff',
  },
  optionChip: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  optionChipActive: {
    backgroundColor: '#e94560',
    borderColor: '#e94560',
  },
  optionChipText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  friendChip: {
    alignItems: 'center',
    marginRight: 12,
    gap: 8,
  },
  friendChipActive: {
    opacity: 0.7,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  friendAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  friendName: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 60,
  },
  payerChip: {
    alignItems: 'center',
    marginRight: 12,
    gap: 8,
    opacity: 0.6,
  },
  payerChipActive: {
    opacity: 1,
  },
  payerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a2a3e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  payerAvatarActive: {
    backgroundColor: '#e94560',
    borderColor: '#fff',
  },
  payerInitials: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  payerName: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
  },
  hintText: {
    color: '#666',
    fontSize: 11,
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  memberRowActive: {
    borderColor: '#4ade80',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2a2a3e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#4ade80',
    borderColor: '#4ade80',
  },
  memberName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  memberEmail: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  shareAmount: {
    color: '#4ade80',
    fontWeight: '700',
    fontSize: 13,
  },
  memberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a3a4e',
  },
  memberInputLabel: {
    color: '#888',
    fontSize: 11,
    fontWeight: '600',
    minWidth: 90,
  },
  memberInput: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  infoBox: {
    backgroundColor: '#1a2332',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginVertical: 16,
  },
  infoText: {
    color: '#3b82f6',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  createBtn: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  createBtnDisabled: {
    opacity: 0.6,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  modal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  currencyItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  currencyItemText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
  currencyItemActive: {
    color: '#4ade80',
    fontWeight: '700',
  },
});

