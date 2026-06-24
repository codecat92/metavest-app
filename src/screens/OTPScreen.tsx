import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Modal as RNModal
} from 'react-native';
import { useRef, useState } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Shield } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useCustomAlert } from '@/context/AlertContext';
import { authApi } from '@/api/auth';
import { otpApi } from '@/api/otp';
import { useColors, space, radius, typography } from '@/theme';
import { AppButton } from '@/components';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function OTPScreen() {
  const route = useRoute<any>();
  const colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const alert = useCustomAlert();
  const { login } = useAuth();

  const { userId, email, type, otpCode: devOtpCode } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [devOtpCodeState, setDevOtpCodeState] = useState(devOtpCode ?? null);
  const [showDevOtp, setShowDevOtp] = useState(!!devOtpCode);
  const inputRef = useRef<TextInput>(null);

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
      const newCode = res?.data?.otp_code ?? null;
      if (newCode) {
        setDevOtpCodeState(newCode);
        setShowDevOtp(true);
      }
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

      <RNModal visible={showDevOtp} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalBadge}>
              <Text style={styles.modalBadgeText}>⚠️ ONLY FOR STAGING</Text>
            </View>
            <Text style={[typography.caption, { color: colors.text.secondary, textAlign: 'center', marginTop: space.md }]}>
              This OTP is shown because the app is in staging mode.
            </Text>
            <Text style={[typography.caption, { color: colors.text.secondary, textAlign: 'center', marginTop: space.xs }]}>
              Your OTP Code:
            </Text>
            <Text style={styles.modalCode}>{devOtpCodeState}</Text>
            <TouchableOpacity onPress={() => setShowDevOtp(false)} style={styles.modalBtn}>
              <Text style={styles.modalBtnText}>Got it, Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </RNModal>
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
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: space['2xl'],
  },
  modalCard: {
    width: '100%', borderRadius: radius.xl, padding: space.xl,
    backgroundColor: colors.glass.g2,
    borderWidth: 1, borderColor: colors.glass.borderStrong,
    alignItems: 'center',
  },
  modalBadge: {
    backgroundColor: 'rgba(247,201,72,0.15)',
    borderWidth: 1, borderColor: 'rgba(247,201,72,0.35)',
    borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: space.xs,
  },
  modalBadgeText: {
    fontSize: 12, fontWeight: '800', color: '#F7C948',
    fontFamily: 'DMSans-Bold', letterSpacing: 0.5,
  },
  modalCode: {
    fontSize: 40, fontWeight: '800', color: colors.text.primary,
    fontFamily: 'Manrope-Bold', letterSpacing: 6,
    marginTop: space.md, marginBottom: space.lg,
  },
  modalBtn: {
    width: '100%', paddingVertical: space.md, borderRadius: radius.sm,
    backgroundColor: colors.accent.purple, alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 14, fontWeight: '700', color: colors.text.primary, fontFamily: 'DMSans-Bold',
  },
});
