import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRef, useState, useEffect } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Shield, AlertTriangle } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useCustomAlert } from '@/context/AlertContext';
import { authApi } from '@/api/auth';
import { otpApi } from '@/api/otp';
import { colors, useColors, space, radius, typography } from '@/theme';
import { AppButton } from '@/components';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function OTPScreen() {
  const route = useRoute<any>();
  const colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const alert = useCustomAlert();
  const { login } = useAuth();

  const { userId, email, type } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [stagingOtp, setStagingOtp] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    otpApi.sendOtp(email, 0, type ?? 'user').then(res => {
      setStagingOtp(res.data.otp_code);
    }).catch(() => {});
  }, []);

  const handleVerify = async () => {
    if (code.length < 4) {
      alert.showAlert({ title: 'Error', message: 'Enter the full OTP code', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      await otpApi.verifyOtp(userId, code);
      await authApi.completeLogin(userId);
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
      const res = await otpApi.sendOtp(email, 0, type ?? 'user');
      setStagingOtp(res.data.otp_code);
      alert.showAlert({ title: 'OTP Sent', message: 'A new code has been sent to your email', type: 'success' });
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Failed to resend', type: 'error' });
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]} edges={['top']}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <ArrowLeft size={20} color={colors.text.secondary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Shield size={32} color={colors.accent.purple} />
        </View>
        <Text style={[typography.h2, { color: colors.text.primary, fontFamily: 'Manrope-Bold' }]}>
          Verification Required
        </Text>
        <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center', marginTop: space.sm }]}>
          A verification code has been sent to{' '}
          <Text style={{ color: colors.accent.purple, fontWeight: '700' }}>{email}</Text>
        </Text>
      </View>

      {stagingOtp && (
        <View style={[styles.stagingBanner, { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.30)' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.xs }}>
            <AlertTriangle size={18} color="#F59E0B" />
            <Text style={[typography.captionBold, { color: '#F59E0B', fontFamily: 'DMSans-Bold' }]}>
              SISTEM OTP INI HANYA UNTUK STAGING!
            </Text>
          </View>
          <Text style={[typography.bodyBold, { color: colors.text.primary, textAlign: 'center', fontFamily: 'Manrope-Bold' }]}>
            Your code: {stagingOtp}
          </Text>
        </View>
      )}

      <View style={styles.codeInputBox}>
        <TextInput
          ref={inputRef}
          style={styles.codeInput}
          value={code}
          onChangeText={t => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
          placeholder="000000"
          placeholderTextColor={colors.text.secondary}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />
      </View>

      <AppButton
        title="Verify"
        onPress={handleVerify}
        loading={loading}
        size="lg"
        style={{ marginBottom: space.lg }}
      />

      <TouchableOpacity onPress={handleResend} style={styles.resendBtn} disabled={resending}>
        <Text style={[typography.bodyBold, { color: colors.text.secondary }]}>
          {resending ? 'Sending...' : 'Resend code'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary, paddingHorizontal: space['2xl'], paddingTop: space.xl },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, marginBottom: space['3xl'],
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: space['3xl'] },
  iconWrap: {
    width: 72, height: 72, borderRadius: radius.xl, marginBottom: space.xl,
    backgroundColor: 'rgba(139,92,246,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  codeInputBox: {
    height: 60, borderRadius: radius.md, paddingHorizontal: space.xl,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.borderStrong,
    marginBottom: space['2xl'], alignItems: 'center', justifyContent: 'center',
  },
  codeInput: {
    fontSize: 28, fontWeight: '800', color: colors.text.primary,
    letterSpacing: 8, textAlign: 'center', width: '100%',
    fontFamily: 'Manrope-Bold',
  },
  resendBtn: { alignItems: 'center', paddingVertical: space.sm },
  stagingBanner: {
    borderWidth: 1, borderRadius: radius.md,
    paddingHorizontal: space.lg, paddingVertical: space.md,
    marginBottom: space.xl, alignItems: 'center',
  },
});
