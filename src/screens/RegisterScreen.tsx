import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useCustomAlert } from '../context/AlertContext';
import { authApi } from '../api/auth';
import { colors, space, radius, typography } from '../theme';
import { AppButton, AppInput, GlassCard } from '../components';
import type { RootStackParamList } from '../types/navigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { login } = useAuth();
  const alert = useCustomAlert();

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'First name is required';
    if (!email.trim()) errs.email = 'Email is required';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await authApi.register({
        first_name: firstName.trim(),
        last_name: lastName.trim() || undefined,
        email: email.trim(),
        password,
        referral_code_2: referralCode.trim() || undefined,
      });
      alert.showAlert({ title: 'Success', message: 'Account created successfully.', type: 'success' });
      await login(email.trim(), password);
      navigation.replace('Tabs');
    } catch (e: any) {
      alert.showAlert({ title: 'Registration Failed', message: e.message || 'Unable to register.', type: 'error' });
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

          <View style={[styles.welcomeContainer, { marginTop: space['3xl'] }]}>
            <Text style={[typography.h2, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
              Create account
            </Text>
            <Text style={[typography.caption, { color: colors.text.secondary }]}>
              Join the Metavest community
            </Text>
          </View>

          <AppInput
            label="FIRST NAME"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="John"
            editable={!loading}
            error={errors.firstName}
          />

          <AppInput
            label="LAST NAME"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Doe (optional)"
            editable={!loading}
          />

          <AppInput
            label="EMAIL"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
            error={errors.email}
          />

          <AppInput
            label="PASSWORD"
            value={password}
            onChangeText={setPassword}
            placeholder="Minimum 8 characters"
            secureTextEntry
            editable={!loading}
            error={errors.password}
          />

          <AppInput
            label="CONFIRM PASSWORD"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter your password"
            secureTextEntry
            editable={!loading}
            error={errors.confirmPassword}
          />

          <AppInput
            label="REFERRAL CODE (OPTIONAL)"
            value={referralCode}
            onChangeText={setReferralCode}
            placeholder="Enter referral code"
            autoCapitalize="characters"
            editable={!loading}
          />

          <AppButton
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            size="lg"
          />

          <View style={styles.loginRow}>
            <Text style={[typography.body, { color: colors.text.secondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[typography.body, { color: colors.accent.purple, fontWeight: '700' }]}>
                Sign in
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
  scroll: { flexGrow: 1, paddingHorizontal: space['2xl'], paddingBottom: space['3xl'] },
  glow: {
    position: 'absolute', top: -80, left: -60,
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
  welcomeContainer: { marginBottom: space['3xl'] },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: space['3xl'] },
});
