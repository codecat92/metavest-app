import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native';
import { useRef, useState } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Shield } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useCustomAlert } from '../context/AlertContext';
import { authApi } from '../api/auth';
import { otpApi } from '../api/otp';

export default function OTPScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const alert = useCustomAlert();
  const { login } = useAuth();

  const { userId, email, type } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleVerify = async () => {
    if (code.length < 4) {
      alert.showAlert({ title: 'Error', message: 'Enter the full OTP code', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      await otpApi.verifyOtp(userId, code);
      // OTP verified — complete login
      const result = await authApi.completeLogin(userId);
      login(result.user.email, ''); // Use AuthContext's login to set user state
      // Actually just navigate — the completeLogin already set token + user via setToken
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
    } catch (e: any) {
      alert.showAlert({ title: 'Verification Failed', message: e.message || 'Invalid OTP code', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await otpApi.sendOtp(email, 0, type ?? 'user');
      alert.showAlert({ title: 'OTP Sent', message: 'A new code has been sent to your email', type: 'info' });
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Failed to resend', type: 'error' });
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <ArrowLeft size={20} color="#8899AA" />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Shield size={32} color="#AB4BFF" />
        </View>
        <Text style={styles.title}>Verification Required</Text>
        <Text style={styles.subtitle}>
          A verification code has been sent to{' '}
          <Text style={styles.email}>{email}</Text>
        </Text>
      </View>

      <View style={styles.codeInputBox}>
        <TextInput
          ref={inputRef}
          style={styles.codeInput}
          value={code}
          onChangeText={t => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
          placeholder="000000"
          placeholderTextColor="#8899AA"
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />
      </View>

      <TouchableOpacity onPress={handleVerify} style={[styles.verifyBtn, loading && { opacity: 0.6 }]} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyText}>Verify</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} style={styles.resendBtn} disabled={resending}>
        <Text style={styles.resendText}>{resending ? 'Sending...' : 'Resend code'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1439', paddingHorizontal: 24, paddingTop: 60 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, marginBottom: 32,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: 36 },
  iconWrap: {
    width: 72, height: 72, borderRadius: 24, marginBottom: 20,
    backgroundColor: 'rgba(171,75,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8899AA', textAlign: 'center', lineHeight: 21 },
  email: { color: '#AB4BFF', fontWeight: '700' },
  codeInputBox: {
    height: 60, borderRadius: 16, paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.3)',
    marginBottom: 24, alignItems: 'center', justifyContent: 'center',
  },
  codeInput: {
    fontSize: 28, fontWeight: '800', color: '#fff',
    letterSpacing: 8, textAlign: 'center', width: '100%',
  },
  verifyBtn: {
    height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#AB4BFF', marginBottom: 16,
  },
  verifyText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  resendBtn: { alignItems: 'center', paddingVertical: 8 },
  resendText: { fontSize: 14, fontWeight: '600', color: '#8899AA' },
});
