import { AuthProvider } from '@/context/AuthContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#e94560',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#0f0f1a' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="expenses/new"
          options={{
            presentation: 'modal',
            title: 'Add Expense',
            headerStyle: { backgroundColor: '#1a1a2e' },
            headerTintColor: '#e94560',
          }}
        />
        <Stack.Screen
          name="groups/new"
          options={{
            presentation: 'modal',
            title: 'Create Group',
            headerStyle: { backgroundColor: '#1a1a2e' },
            headerTintColor: '#e94560',
          }}
        />
        <Stack.Screen
          name="groups/[groupId]"
          options={{ title: 'Group Details' }}
        />
        <Stack.Screen
          name="friends/[friendId]"
          options={{ title: 'Friend' }}
        />
        <Stack.Screen
          name="expenses/[expenseId]"
          options={{ title: 'Expense Details' }}
        />
        <Stack.Screen
          name="settle/[userId]"
          options={{ title: 'Settle Up' }}
        />
      </Stack>
    </AuthProvider>
  );
}
