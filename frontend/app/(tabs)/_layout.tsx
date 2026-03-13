import { Ionicons } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';

function FAB() {
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => router.push('/expenses/new')}
      activeOpacity={0.85}
    >
      <Text style={styles.fabIcon}>＋</Text>
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#1a1a2e',
            borderTopColor: '#2a2a3e',
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 88 : 64,
            paddingBottom: Platform.OS === 'ios' ? 24 : 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#e94560',
          tabBarInactiveTintColor: '#555',
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Tabs.Screen
          name="groups"
          options={{
            title: 'Groups',
            headerTitle: 'Groups',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="friends"
          options={{
            title: 'Friends',
            headerTitle: 'Friends',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="activity"
          options={{
            title: 'Activity',
            headerTitle: 'Activity',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="pulse" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: 'Account',
            headerTitle: 'Account',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-circle" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      <FAB />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 96 : 72,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e94560',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e94560',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 999,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '300',
  },
});
