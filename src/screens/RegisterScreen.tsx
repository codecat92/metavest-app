import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useCustomAlert } from '../context/AlertContext';
import { authApi } from '../api/auth';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('metavestvip');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();
  const { login } = useAuth();
  const alert = useCustomAlert();

  const handleRegister = async () => {
    if (!firstName || !email || !password) {
      alert.showAlert({ title: 'Error', message: 'First name, email, and password are required.', type: 'error' });
      return;
    }
    if (password.length < 8) {
      alert.showAlert({ title: 'Error', message: 'Password must be at least 8 characters.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        first_name: firstName,
        last_name: lastName || undefined,
        email,
        password,
        referral_code_2: referralCode || 'metavestvip',
      });
      // Token already set by authApi.register, just update auth context
      await login(email, password);
      navigation.replace('Tabs');
    } catch (e: any) {
      alert.showAlert({ title: 'Registration Failed', message: e.message || 'Unable to register.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.glow} />

        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Create account</Text>
          <Text style={styles.welcomeSub}>Join the Metavest community</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>FIRST NAME *</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="John"
              placeholderTextColor="#8899AA"
              editable={!loading}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>LAST NAME</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Doe"
              placeholderTextColor="#8899AA"
              editable={!loading}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>EMAIL *</Text>
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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>PASSWORD * (min 8 chars)</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#8899AA"
              secureTextEntry
              editable={!loading}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>REFERRAL CODE</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={referralCode}
              onChangeText={setReferralCode}
              placeholder="metavestvip"
              placeholderTextColor="#8899AA"
              editable={!loading}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Create Account</Text>
          }
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.loginLink}>Sign in</Text>
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
  welcomeContainer: { marginBottom: 32 },
  welcomeTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  welcomeSub: { fontSize: 15, color: '#8899AA' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#8899AA', letterSpacing: 0.5, marginBottom: 8 },
  inputBox: {
    height: 52, borderRadius: 16, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
  },
  input: { flex: 1, color: '#fff', fontSize: 15 },
  button: {
    height: 56, borderRadius: 18, marginBottom: 24, marginTop: 8,
    backgroundColor: '#AB4BFF',
    alignItems: 'center', justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { color: '#8899AA', fontSize: 14 },
  loginLink: { color: '#AB4BFF', fontSize: 14, fontWeight: '700' },
});
