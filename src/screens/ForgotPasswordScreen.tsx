import {
  View, Text, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator
} from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useCustomAlert } from '@/context/AlertContext';
import { api } from '@/api/client';
import { colors, space, radius, typography } from '@/theme';
import { AppButton, AppInput } from '@/components';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const alert = useCustomAlert();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      alert.showAlert({ title: 'Error', message: 'Email is required', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/send-reset', { email: email.trim() });
      alert.showAlert({
        title: 'Email Sent',
        message: 'If the email is registered, you will receive a password reset link.',
        type: 'success',
      });
      navigation.goBack();
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text.secondary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[typography.h2, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
              Forgot Password
            </Text>
            <Text style={[typography.body, { color: colors.text.secondary, marginTop: space.sm }]}>
              Enter your email and we'll send you a reset link.
            </Text>
          </View>

          <AppInput
            label="EMAIL"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <AppButton
            title="Send Reset Link"
            onPress={handleSend}
            loading={loading}
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { paddingHorizontal: space['2xl'], paddingTop: space.xl },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, marginBottom: space['3xl'],
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
  },
  header: { marginBottom: space['3xl'] },
});
