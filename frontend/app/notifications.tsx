import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '@/services/api';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Notification } from '@/types';

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'friend_request':
      return '👥';
    case 'friend_accepted':
      return '✅';
    case 'expense_added':
      return '💰';
    case 'payment_received':
      return '💳';
    default:
      return '📬';
  }
}

function getNotificationColor(type: string): string {
  switch (type) {
    case 'friend_request':
      return '#4CAF50';
    case 'friend_accepted':
      return '#00c853';
    case 'expense_added':
      return '#2196F3';
    case 'payment_received':
      return '#FF9800';
    default:
      return '#999';
  }
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marking, setMarking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.getNotifications(50, 0);
      console.log('📬 [Notifications] Response:', response);
      console.log('📬 [Notifications] Notifications array:', response.notifications);
      console.log('📬 [Notifications] Total count:', response.total);
      setNotifications(response.notifications || []);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch notifications';
      console.error('❌ [Notifications] Failed to fetch notifications:', err);
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setMarking(notificationId);
      await apiClient.markNotificationAsRead(notificationId);

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to mark as read');
    } finally {
      setMarking(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to mark all as read');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#e94560" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1, padding: 16 }}>
      {/* Header */}
      <View
        style={{
          marginBottom: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View>
          <ThemedText type="title" style={{ marginBottom: 4 }}>
            Notifications
          </ThemedText>
          <ThemedText style={{ fontSize: 13, opacity: 0.7 }}>
            {unreadCount} unread
          </ThemedText>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            style={{
              backgroundColor: '#e94560',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 4,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {error ? (
          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <ThemedText style={{ opacity: 0.7, fontSize: 16, marginBottom: 16 }}>
              {error}
            </ThemedText>
            <TouchableOpacity
              onPress={fetchNotifications}
              style={{
                backgroundColor: '#e94560',
                paddingHorizontal: 24,
                paddingVertical: 10,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              onPress={() => handleMarkAsRead(notification.id)}
              style={{
                backgroundColor: notification.isRead ? '#2a2a3e' : '#1a1a2e',
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
                borderLeftWidth: 4,
                borderLeftColor: getNotificationColor(notification.type),
                opacity: notification.isRead ? 0.6 : 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                {/* Icon */}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: getNotificationColor(notification.type),
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 20 }}>
                    {getNotificationIcon(notification.type)}
                  </Text>
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                  <ThemedText
                    style={{
                      fontWeight: '600',
                      fontSize: 14,
                      marginBottom: 4,
                    }}
                  >
                    {notification.title}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>
                    {notification.message}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 11, opacity: 0.5 }}>
                    {new Date(notification.createdAt).toLocaleDateString()}{' '}
                    {new Date(notification.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </ThemedText>
                </View>

                {/* Read indicator */}
                {!notification.isRead && (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#e94560',
                      marginTop: 6,
                    }}
                  />
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <ThemedText style={{ opacity: 0.7, fontSize: 16 }}>
              No notifications yet
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}
