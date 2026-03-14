import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginScreen() {
  const { login, googleLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // const [request, response, promptAsync] = Google.useAuthRequest({
  //   webClientId: "847665555342-pg0r163fb9189tq4b8ihkhdi22on01jc.apps.googleusercontent.com", // Generic fallback just in case
  //   responseType: "id_token",  // 👈 add this
  //   usePKCE: false,
  // });

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "847665555342-hmiv7tvdbln0lpji4v8a293mso5vail1.apps.googleusercontent.com",
    webClientId: "847665555342-pg0r163fb9189tq4b8ihkhdi22on01jc.apps.googleusercontent.com",
    androidClientId: "847665555342-prrhtlqm5ik12ue66piou2dcg27upq54.apps.googleusercontent.com",
    responseType: "id_token",
    usePKCE: false,
  });

  useEffect(() => {
    const processResponse = async () => {
      console.log('Login useEffect', response);
      if (response?.type === 'success') {
        const { authentication } = response;
        const idToken = response.params?.id_token;
        console.log('Login s', idToken);
        if (idToken) {
          console.log('Login maadchoe');
          await handleGoogleLogin(idToken);
        } else {
          console.log('Login unsc');
          Alert.alert('Google Sign-in failed', 'No ID Token received from Google.');
        }
      } else if (response?.type === 'cancel') {
        console.log('Login c');
        // user canceled
      } else if (response?.type === 'error') {
        console.log('Login unsc');
        Alert.alert('Google Sign-in failed', response.error?.message || 'Something went wrong.');
      } else {
        console.log('Login fuk');
      }
    };

    processResponse();
  }, [response]);

  const handleGoogleLogin = async (idToken: string) => {
    console.log('Google Login started');
    setLoading(true);
    console.log('Login maadchoe');
    try {
      await googleLogin(idToken);
      console.log('Login successful');
      router.replace('/(tabs)/groups');
    } catch (e) {
      router.replace('/login');
      console.log('Login unsc');
    } finally {
      console.log('Login fuk');
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      console.log('Login successful');
      router.replace('/(tabs)/groups');
    } catch (e) {
      console.log('Login failed', e);
      Alert.alert('Login failed', 'Invalid credentials. Please try again.');
    } finally {
      console.log('Login settllae');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        {/* Logo / Header */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>💸</Text>
          <Text style={styles.logoText}>Splitwise</Text>
          <Text style={styles.tagline}>Split bills. Not friendships.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#555"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#555"
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Button */}
          <TouchableOpacity
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={() => promptAsync()}
            disabled={loading || !request}
            activeOpacity={0.85}
          >
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.footerLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoIcon: { fontSize: 64 },
  logoText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#e94560',
    marginTop: 8,
    letterSpacing: -0.5,
  },
  tagline: { fontSize: 14, color: '#888', marginTop: 4 },
  form: { gap: 8 },
  label: { color: '#ccc', fontSize: 13, fontWeight: '600', marginTop: 12 },
  input: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#e94560',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#e94560',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2a2a3e',
  },
  dividerText: {
    color: '#888',
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  googleButtonText: { color: '#000', fontSize: 16, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: { color: '#666', fontSize: 14 },
  footerLink: { color: '#e94560', fontSize: 14, fontWeight: '700' },
});
