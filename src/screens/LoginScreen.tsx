import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Image, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { authApi } from '../api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  const handleLogin = async () => {
    // Basic validation
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      await authApi.login(email, password);
      // Login successful — navigate to main app
      navigation.replace('Tabs');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Glow */}
        <View style={styles.glow} />

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/metavest-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Smart Social Trading Platform</Text>
        </View>

        {/* Welcome */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Welcome back</Text>
          <Text style={styles.welcomeSub}>Sign in to your account</Text>
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>EMAIL</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#8899AA"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>PASSWORD</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#8899AA"
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.forgotContainer}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Continue</Text>
          }
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social */}
        <View style={styles.socialRow}>
          {['G', '𝕏', 'in'].map((icon) => (
            <TouchableOpacity key={icon} style={styles.socialBtn}>
              <Text style={styles.socialText}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Register */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity>
            <Text style={styles.registerLink}>Sign up free</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1439' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  glow: {
    position: 'absolute', top: -80, left: -60,
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(171,75,255,0.15)',
  },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 200, height: 100 },
  tagline: { fontSize: 15, color: '#8899AA', marginTop: 8 },
  welcomeContainer: { marginBottom: 32 },
  welcomeTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  welcomeSub: { fontSize: 15, color: '#8899AA' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#8899AA', letterSpacing: 0.5, marginBottom: 8 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, borderRadius: 16, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
  },
  input: { flex: 1, color: '#fff', fontSize: 15 },
  eyeText: { color: '#8899AA', fontSize: 13 },
  forgotContainer: { alignItems: 'flex-end', marginTop: 8 },
  forgotText: { color: '#AB4BFF', fontSize: 13, fontWeight: '600' },
  button: {
    height: 56, borderRadius: 18, marginBottom: 24,
    backgroundColor: '#AB4BFF',
    alignItems: 'center', justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(171,75,255,0.15)' },
  dividerText: { color: '#8899AA', fontSize: 13, marginHorizontal: 12 },
  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  socialBtn: {
    flex: 1, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  socialText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  registerRow: { flexDirection: 'row', justifyContent: 'center' },
  registerText: { color: '#8899AA', fontSize: 14 },
  registerLink: { color: '#AB4BFF', fontSize: 14, fontWeight: '700' },
});