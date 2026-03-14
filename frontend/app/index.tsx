import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';

export default function Index() {
  const { isAuthenticated } = useAuth();
  console.log('Index page rendered. User is authenticated:', isAuthenticated);
  // Redirect component fires safely after the Stack navigator has mounted
  return <Redirect href={isAuthenticated ? '/(tabs)/groups' : '/login'} />;
}
