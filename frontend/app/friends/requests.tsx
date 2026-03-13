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
import { FriendRequest } from '@/types';

export default function FriendRequestsScreen() {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const response = await apiClient.getPendingFriendRequests();
      setRequests(response.requests || []);
    } catch (error) {
      console.error('Failed to fetch friend requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchRequests();
    }, [])
  );

  const handleAccept = async (requestId: string, senderName: string) => {
    try {
      setResponding(requestId);
      await apiClient.acceptFriendRequest(requestId);
      Alert.alert('Success', `You are now friends with ${senderName}`);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to accept request');
    } finally {
      setResponding(null);
    }
  };

  const handleReject = async (requestId: string, senderName: string) => {
    try {
      setResponding(requestId);
      await apiClient.rejectFriendRequest(requestId);
      Alert.alert('Rejected', `Friend request from ${senderName} declined`);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to reject request');
    } finally {
      setResponding(null);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#e94560" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1, padding: 16 }}>
      <View style={{ marginBottom: 20 }}>
        <ThemedText type="title" style={{ marginBottom: 8 }}>
          Friend Requests
        </ThemedText>
        <ThemedText style={{ fontSize: 14, opacity: 0.7 }}>
          {requests.length} {requests.length === 1 ? 'request' : 'requests'} pending
        </ThemedText>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {requests.length > 0 ? (
          requests.map((request) => (
            <View
              key={request.id}
              style={{
                backgroundColor: '#f5f5f5',
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
              }}
            >
              {/* User Info */}
              <View style={{ marginBottom: 12 }}>
                <ThemedText style={{ fontWeight: '600', fontSize: 16 }}>
                  {request.sender.name}
                </ThemedText>
                <ThemedText style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
                  {request.sender.email}
                </ThemedText>
                {request.sender.phone && (
                  <ThemedText style={{ fontSize: 13, opacity: 0.7 }}>
                    {request.sender.phone}
                  </ThemedText>
                )}
                {request.message && (
                  <ThemedText
                    style={{
                      fontSize: 13,
                      marginTop: 8,
                      fontStyle: 'italic',
                      opacity: 0.8,
                    }}
                  >
                    "{request.message}"
                  </ThemedText>
                )}
              </View>

              {/* Date */}
              <ThemedText style={{ fontSize: 12, opacity: 0.5, marginBottom: 12 }}>
                {new Date(request.createdAt).toLocaleDateString()}
              </ThemedText>

              {/* Action Buttons */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <TouchableOpacity
                  onPress={() => handleAccept(request.id, request.sender.name)}
                  disabled={responding === request.id}
                  style={{
                    flex: 1,
                    backgroundColor: '#00c853',
                    paddingVertical: 10,
                    borderRadius: 6,
                    alignItems: 'center',
                  }}
                >
                  {responding === request.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Accept</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleReject(request.id, request.sender.name)}
                  disabled={responding === request.id}
                  style={{
                    flex: 1,
                    backgroundColor: '#e94560',
                    paddingVertical: 10,
                    borderRadius: 6,
                    alignItems: 'center',
                  }}
                >
                  {responding === request.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Decline</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <ThemedText style={{ opacity: 0.7, fontSize: 16 }}>
              No pending friend requests
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}
