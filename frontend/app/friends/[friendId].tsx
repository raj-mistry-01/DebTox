import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiClient } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface Activity {
  id: string;
  type: 'expense' | 'payment';
  description: string;
  amount: number;
  date: string;
  involvedUsers?: { name: string; id: string }[];
}

export default function FriendDetailScreen() {
  const { friendId } = useLocalSearchParams<{ friendId: string }>();
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendName, setFriendName] = useState('Friend');

  useEffect(() => {
    fetchFriendExpenses();
  }, [friendId]);

  const fetchFriendExpenses = async () => {
    try {
      setLoading(true);
      // Fetch all activities
      const response = await apiClient.getActivity();
      const allActivities: Activity[] = response.activities || [];

      // Filter to only show activities involving this friend
      const friendActivities = allActivities.filter((activity) => {
        return (
          activity.involvedUsers &&
          activity.involvedUsers.some((u) => u.id === friendId)
        );
      });

      // Get friend name from first activity if available
      if (friendActivities.length > 0 && friendActivities[0].involvedUsers) {
        const friend = friendActivities[0].involvedUsers.find((u) => u.id === friendId);
        if (friend) setFriendName(friend.name);
      }

      // Sort by date (newest first)
      friendActivities.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setActivities(friendActivities);
    } catch (error) {
      console.error('Failed to fetch friend expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>Shared Expenses with {friendName}</Text>
      </View>

      {/* Shared expenses list */}
      {activities.length === 0 ? (
        <Text style={styles.empty}>No shared expenses yet.</Text>
      ) : (
        activities.map((activity) => (
          <TouchableOpacity
            key={activity.id}
            style={styles.expenseCard}
            activeOpacity={0.75}
            onPress={() => {
              if (activity.type === 'expense') {
                // Extract expense ID from "expense-123"
                const expenseId = activity.id.split('-')[1];
                router.push(`/expenses/${expenseId}`);
              }
            }}
          >
            <View style={styles.expenseLeft}>
              <View style={styles.expIcon}>
                <Ionicons
                  name={activity.type === 'expense' ? 'receipt-outline' : 'swap-horizontal'}
                  size={18}
                  color={activity.type === 'expense' ? '#e94560' : '#4ade80'}
                />
              </View>
              <View>
                <Text style={styles.expDesc}>{activity.description}</Text>
                <Text style={styles.expDate}>
                  {new Date(activity.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
            <Text style={styles.expAmount}>${activity.amount.toFixed(2)}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  titleSection: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  expenseCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  expenseLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  expIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9456022',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expDesc: { color: '#fff', fontSize: 14, fontWeight: '600' },
  expDate: { color: '#666', fontSize: 12, marginTop: 2 },
  expAmount: { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty: { color: '#666', textAlign: 'center', padding: 24, fontSize: 14 },
});
