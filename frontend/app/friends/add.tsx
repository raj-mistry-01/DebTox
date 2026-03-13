import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '@/services/api';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

interface UserResult {
  id: string;
  name: string;
  email: string;
  phone?: string;
  friendStatus: 'none' | 'pending' | 'accepted' | 'rejected';
  friendRequestId?: string;
}

export default function AddFriendsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) {
      Alert.alert('Error', 'Please enter at least 2 characters to search');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.searchUsers(searchQuery);
      setSearchResults(response.users || []);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (user: UserResult) => {
    if (user.friendStatus === 'accepted') {
      Alert.alert('Already Friends', `You are already friends with ${user.name}`);
      return;
    }

    if (user.friendStatus === 'pending') {
      Alert.alert('Request Pending', `Friend request already sent to ${user.name}`);
      return;
    }

    try {
      setSending(user.id);
      await apiClient.sendFriendRequest(user.id);
      Alert.alert('Success', `Friend request sent to ${user.name}`);

      // Update the local state to reflect the change
      setSearchResults((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, friendStatus: 'pending' } : u
        )
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send request');
    } finally {
      setSending(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return '#00c853'; // Green
      case 'pending':
        return '#ffa500'; // Orange
      case 'rejected':
        return '#999'; // Gray
      default:
        return '#e94560'; // Red
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Friends';
      case 'pending':
        return 'Request Sent';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Add';
    }
  };

  return (
    <ThemedView style={{ flex: 1, padding: 16 }}>
      <View style={{ marginBottom: 20 }}>
        <ThemedText type="title" style={{ marginBottom: 12 }}>
          Add Friends
        </ThemedText>
        <ThemedText style={{ fontSize: 14, marginBottom: 16, opacity: 0.7 }}>
          Search by name, email, or phone number
        </ThemedText>

        {/* Search Input */}
        <View style={{ marginBottom: 12 }}>
          <TextInput
            placeholder="Search friends..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholderTextColor="#999"
            style={{
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 16,
              marginBottom: 12,
              color: '#333',
            }}
          />
          <TouchableOpacity
            onPress={handleSearch}
            disabled={loading}
            style={{
              backgroundColor: '#e94560',
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={{ color: '#fff', fontWeight: '600' }}>
                Search
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Results */}
      <ScrollView>
        {searchResults.length > 0 ? (
          searchResults.map((user) => (
            <View
              key={user.id}
              style={{
                backgroundColor: '#f5f5f5',
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontWeight: '600', fontSize: 16 }}>
                  {user.name}
                </ThemedText>
                <ThemedText style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
                  {user.email}
                </ThemedText>
                {user.phone && (
                  <ThemedText style={{ fontSize: 13, opacity: 0.7 }}>
                    {user.phone}
                  </ThemedText>
                )}
              </View>

              {/* Action Button */}
              <TouchableOpacity
                onPress={() => handleSendRequest(user)}
                disabled={
                  sending === user.id ||
                  user.friendStatus === 'accepted' ||
                  user.friendStatus === 'pending'
                }
                style={{
                  backgroundColor: getStatusColor(user.friendStatus),
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 6,
                  opacity:
                    user.friendStatus === 'accepted' ||
                    user.friendStatus === 'pending'
                      ? 0.6
                      : 1,
                }}
              >
                {sending === user.id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>
                    {getStatusLabel(user.friendStatus)}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))
        ) : searchQuery.length > 0 && !loading ? (
          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <ThemedText style={{ opacity: 0.7 }}>No users found</ThemedText>
          </View>
        ) : (
          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <ThemedText style={{ opacity: 0.7 }}>
              Search for friends to get started
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}
