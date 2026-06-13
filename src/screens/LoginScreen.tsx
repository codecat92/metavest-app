import {
  View, Text, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Image
} from 'react-native';
import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useCustomAlert } from '@/context/AlertContext';
import { authApi } from '@/api/auth';
import { otpApi } from '@/api/otp';
import { colors, space, radius, typography } from '@/theme';
import { AppButton, AppInput, GlassCard } from '@/components';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const BASE_URL = 'https://metavest-backend-production.up.railway.app/api';

function warmServer() {
  Promise.all([
    fetch(`${BASE_URL}/forex/curr`),
    fetch(`${BASE_URL}/article-event?page=1`),
  ]).catch(() => {});
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { login } = useAuth();
  const alert = useCustomAlert();

  useEffect(() => { warmServer(); }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      alert.showAlert({ title: 'Error', message: 'Please enter your email and password.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const step1 = await authApi.loginStep1(email, password);
      await otpApi.sendOtp(step1.email, 0, step1.type);
      navigation.navigate('OTP', {
        userId: step1.userId,
        email: step1.email,
        type: step1.type,
      });
    } catch (error: any) {
      alert.showAlert({ title: 'Login Failed', message: error.message || 'Invalid email or password.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.glow} />

          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/metavest-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[typography.caption, { color: colors.text.secondary, marginTop: space.sm }]}>
              Smart Social Trading Platform
            </Text>
          </View>

          <View style={styles.welcomeContainer}>
            <Text style={[typography.h2, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
              Welcome back
            </Text>
            <Text style={[typography.caption, { color: colors.text.secondary }]}>
              Sign in to your account
            </Text>
          </View>

          <AppInput
            label="EMAIL"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <AppInput
            label="PASSWORD"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            editable={!loading}
          />

          <TouchableOpacity style={styles.forgotContainer} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={[typography.caption, { color: colors.accent.purple, fontWeight: '600' }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          <AppButton
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={{ marginTop: space.sm }}
          />

          <View style={styles.registerRow}>
            <Text style={[typography.body, { color: colors.text.secondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[typography.body, { color: colors.accent.purple, fontWeight: '700' }]}>
                Sign up free
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { flexGrow: 1, paddingHorizontal: space['2xl'], paddingTop: space['4xl'], paddingBottom: space['3xl'] },
  glow: {
    position: 'absolute', top: -80, left: -60,
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
  logoContainer: { alignItems: 'center', marginBottom: space['3xl'] },
  logo: { width: 200, height: 100 },
  welcomeContainer: { marginBottom: space['3xl'] },
  forgotContainer: { alignItems: 'flex-end', marginBottom: space.lg },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: space['3xl'] },
});
