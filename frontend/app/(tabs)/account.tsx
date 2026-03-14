import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { apiClient } from '@/services/api';

type SettingRow = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
  badge?: number;
};

export default function AccountScreen() {
  const { currentUser, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.getUnreadNotificationCount();
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const settings: SettingRow[] = [
    {
      icon: 'person-outline',
      label: 'Edit profile',
      onPress: () => router.push('/edit-profile'),
    },
    {
      icon: 'heart-outline',
      label: 'Add friends',
      onPress: () => router.push('/friends/add'),
    },
    {
      icon: 'mail-outline',
      label: 'Friend requests',
      onPress: () => router.push('/friends/requests'),
    },
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      onPress: () => router.push('/notifications'),
      badge: unreadCount,
    },
    {
      icon: 'card-outline',
      label: 'Payment methods',
      onPress: () => Alert.alert('Coming soon'),
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Privacy & Security',
      onPress: () => Alert.alert('Coming soon'),
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      onPress: () => Alert.alert('Coming soon'),
    },
    {
      icon: 'log-out-outline',
      label: 'Log out',
      onPress: handleLogout,
      danger: true,
    },
  ];

  const initials = (currentUser?.name ?? 'A J')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{currentUser?.name ?? 'Alex Johnson'}</Text>
          <Text style={styles.email}>{currentUser?.email ?? 'alex@example.com'}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Pro</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Groups', value: '4' },
          { label: 'Friends', value: '3' },
          { label: 'Expenses', value: '12' },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Settings list */}
      <View style={styles.settingsSection}>
        {settings.map((s, i) => (
          <TouchableOpacity
            key={s.label}
            style={[
              styles.settingRow,
              i > 0 && styles.settingRowBorder,
            ]}
            onPress={s.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons
                name={s.icon}
                size={20}
                color={s.danger ? '#f87171' : '#aaa'}
                style={{ marginRight: 14 }}
              />
              <Text style={[styles.settingLabel, s.danger && { color: '#f87171' }]}>
                {s.label}
              </Text>
            </View>
            <View style={styles.settingRight}>
              {s.badge && s.badge > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {s.badge > 99 ? '99+' : s.badge}
                  </Text>
                </View>
              )}
              {!s.danger && (
                <Ionicons name="chevron-forward" size={16} color="#444" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.version}>Debtox Clone v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e94560',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  profileInfo: { flex: 1 },
  name: { color: '#fff', fontSize: 18, fontWeight: '800' },
  email: { color: '#888', fontSize: 13, marginTop: 2 },
  badge: {
    backgroundColor: '#e94560',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  statValue: { color: '#e94560', fontSize: 22, fontWeight: '800' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 2 },
  settingsSection: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  settingRowBorder: { borderTopWidth: 1, borderTopColor: '#2a2a3e' },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingLabel: { color: '#ddd', fontSize: 15 },
  notificationBadge: {
    backgroundColor: '#e94560',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  notificationBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  version: { color: '#333', textAlign: 'center', marginTop: 28, fontSize: 12 },
});
