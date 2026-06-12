import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator
} from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useCustomAlert } from '../context/AlertContext';
import { api } from '../api/client';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#8899AA" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Enter your email and we'll send you a reset link.</Text>
        </View>

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
            />
          </View>
        </View>

        <TouchableOpacity onPress={handleSend} style={[styles.btn, loading && { opacity: 0.6 }]} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Reset Link</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1439' },
  scroll: { paddingHorizontal: 24, paddingTop: 60 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, marginBottom: 32,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8899AA', lineHeight: 21 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#8899AA', letterSpacing: 0.5, marginBottom: 8 },
  inputBox: {
    height: 52, borderRadius: 16, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
  },
  input: { flex: 1, color: '#fff', fontSize: 15 },
  btn: {
    height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#AB4BFF',
  },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
