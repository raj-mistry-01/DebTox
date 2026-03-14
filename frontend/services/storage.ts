import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export async function saveToken(token: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function removeToken() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export async function saveUser(user: any) {
  if (Platform.OS === 'web') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export async function getUser(): Promise<any | null> {
  let data;
  if (Platform.OS === 'web') {
    data = localStorage.getItem(USER_KEY);
  } else {
    data = await AsyncStorage.getItem(USER_KEY);
  }
  return data ? JSON.parse(data) : null;
}

export async function removeUser() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(USER_KEY);
  } else {
    await AsyncStorage.removeItem(USER_KEY);
  }
}
