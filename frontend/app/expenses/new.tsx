import { MOCK_GROUPS, MOCK_USERS } from '@/data/mockData';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
    FlatList,
} from 'react-native';

type SplitType = 'equally' | 'unequally' | 'percentage' | 'shares' | 'adjustment';

const getSymbol = (code: string) => {
  const map: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥', AUD: 'A$'
  };
  return map[code] || code;
};

export default function NewExpenseScreen() {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [currencies, setCurrencies] = useState<string[]>(['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD']);
  const [isCurrencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');

  useEffect(() => {
    fetch('https://api.exchangeratesapi.io/v1/latest?access_key=cfc551bfc1146abd61104353dfd3a396&format=1')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          setCurrencies(Object.keys(data.rates));
        }
      })
      .catch(err => console.error(err));
  }, []);

  const filteredCurrencies = currencies.filter(c => c.toLowerCase().includes(currencySearch.toLowerCase()));

  const [splitType, setSplitType] = useState<SplitType>('equally');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedPayer, setSelectedPayer] = useState(MOCK_USERS[0].id);

  const handleAdd = () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description.');
      return;
    }
    if (!amount.trim() || isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }
    Alert.alert('Expense added!', `"${description}" for ${getSymbol(currency)}${parseFloat(amount).toFixed(2)}`, [
      { text: 'Done', onPress: () => router.back() },
    ]);
  };

  const splitOptions: { type: SplitType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { type: 'equally', label: 'Equally', icon: 'people-outline' },
    { type: 'unequally', label: 'Unequally', icon: 'git-branch-outline' },
    { type: 'percentage', label: 'By %', icon: 'pie-chart-outline' },
    { type: 'shares', label: 'Shares', icon: 'grid-outline' },
    { type: 'adjustment', label: 'Adj', icon: 'options-outline' },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0f0f1a' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

        {/* Amount input */}
        <View style={styles.amountContainer}>
          <TouchableOpacity onPress={() => setCurrencyModalVisible(true)} style={styles.currencySymbolBtn}>
            <Text style={styles.currencySymbol}>{getSymbol(currency)}</Text>
            <Ionicons name="chevron-down" size={20} color="#e94560" />
          </TouchableOpacity>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#333"
            keyboardType="decimal-pad"
            autoFocus
          />
        </View>

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="What's it for? (e.g. Dinner)"
          placeholderTextColor="#555"
        />

        {/* Group picker */}
        <Text style={styles.label}>Group (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {MOCK_GROUPS.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[styles.groupChip, selectedGroup === g.id && styles.groupChipActive]}
              onPress={() => setSelectedGroup(selectedGroup === g.id ? null : g.id)}
            >
              <Text style={styles.groupChipText}>{g.emoji} {g.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Paid by */}
        <Text style={styles.label}>Paid by</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {MOCK_USERS.map((u) => {
            const initials = u.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
            const selected = selectedPayer === u.id;
            return (
              <TouchableOpacity
                key={u.id}
                style={[styles.payerChip, selected && styles.payerChipActive]}
                onPress={() => setSelectedPayer(u.id)}
              >
                <View style={[styles.payerAvatar, selected && styles.payerAvatarActive]}>
                  <Text style={styles.payerInitials}>{initials}</Text>
                </View>
                <Text style={[styles.payerName, selected && { color: '#fff' }]}>
                  {u.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Split type */}
        <Text style={styles.label}>Split</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
          {splitOptions.map((opt) => (
            <TouchableOpacity
              key={opt.type}
              style={[styles.splitOption, splitType === opt.type && styles.splitOptionActive]}
              onPress={() => setSplitType(opt.type)}
            >
              <Ionicons
                name={opt.icon}
                size={20}
                color={splitType === opt.type ? '#e94560' : '#666'}
              />
              <Text style={[styles.splitLabel, splitType === opt.type && { color: '#e94560' }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Split preview */}
        {amount !== '' && !isNaN(parseFloat(amount)) && (
          <View style={styles.splitPreview}>
            <Text style={styles.splitPreviewTitle}>Each person pays</Text>
            <Text style={styles.splitPreviewAmount}>
              {getSymbol(currency)}{(parseFloat(amount) / MOCK_USERS.length).toFixed(2)}
            </Text>
            <Text style={styles.splitPreviewSub}>split among {MOCK_USERS.length} people</Text>
          </View>
        )}

        {/* Add button */}
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.85}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Currency Modal */}
      <Modal visible={isCurrencyModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalSearch}
              placeholder="Search currency..."
              placeholderTextColor="#555"
              value={currencySearch}
              onChangeText={setCurrencySearch}
            />
            <FlatList
              data={filteredCurrencies}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.currencyListItem}
                  onPress={() => {
                    setCurrency(item);
                    setCurrencyModalVisible(false);
                    setCurrencySearch('');
                  }}
                >
                  <Text style={styles.currencyListText}>{item} ({getSymbol(item)})</Text>
                  {currency === item && <Ionicons name="checkmark" size={20} color="#e94560" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  inner: { padding: 20, paddingBottom: 60 },

  currencySymbolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  modalSearch: {
    backgroundColor: '#0f0f1a',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    marginBottom: 16,
  },
  currencyListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  currencyListText: { color: '#eee', fontSize: 16, fontWeight: '500' },

  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  currencySymbol: {
    color: '#e94560',
    fontSize: 28,
    fontWeight: '800',
    marginRight: 4,
  },
  amountInput: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '800',
    minWidth: 120,
  },

  label: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 20,
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

  chipScroll: { flexGrow: 0 },
  groupChip: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  groupChipActive: { borderColor: '#e94560', backgroundColor: '#e9456022' },
  groupChipText: { color: '#ccc', fontSize: 13 },

  payerChip: {
    alignItems: 'center',
    marginRight: 16,
    opacity: 0.6,
  },
  payerChipActive: { opacity: 1 },
  payerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a2a3e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  payerAvatarActive: { backgroundColor: '#e94560', borderColor: '#fff' },
  payerInitials: { color: '#fff', fontWeight: '700', fontSize: 15 },
  payerName: { color: '#888', fontSize: 11, marginTop: 4 },

  splitRow: { flexDirection: 'row', gap: 8 },
  splitOption: {
    minWidth: 80,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  splitOptionActive: { borderColor: '#e94560', backgroundColor: '#e9456011' },
  splitLabel: { color: '#666', fontSize: 12, fontWeight: '600' },

  splitPreview: {
    marginTop: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  splitPreviewTitle: { color: '#888', fontSize: 12 },
  splitPreviewAmount: { color: '#4ade80', fontSize: 28, fontWeight: '800', marginTop: 4 },
  splitPreviewSub: { color: '#666', fontSize: 12, marginTop: 4 },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e94560',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 28,
    shadowColor: '#e94560',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  addBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', marginTop: 14, padding: 10 },
  cancelBtnText: { color: '#666', fontSize: 15 },
});
