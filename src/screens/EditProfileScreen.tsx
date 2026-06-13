import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useCustomAlert } from '@/context/AlertContext';
import { profileApi } from '@/api/profile';
import { colors, space, radius, typography } from '@/theme';
import { AppButton, AppInput } from '@/components';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function EditProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, refreshUser } = useAuth();
  const alert = useCustomAlert();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone_number ?? '');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);

  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const handleSave = async () => {
    const fields: Record<string, string> = {};
    if (name.trim() && name !== user?.name) fields.name = name.trim();
    if (email.trim() && email !== user?.email) fields.email = email.trim();
    if (phone.trim() && phone !== (user?.phone_number ?? '')) fields.phone_number = phone.trim();
    if (city.trim()) fields.city = city.trim();

    if (Object.keys(fields).length === 0) {
      alert.showAlert({ title: 'No changes', message: 'Nothing to update', type: 'info' });
      return;
    }

    setSaving(true);
    try {
      await profileApi.editProfile(fields);
      await refreshUser();
      alert.showAlert({ title: 'Saved', message: 'Profile updated successfully', type: 'success' });
      navigation.goBack();
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Failed', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPass || !newPass) {
      alert.showAlert({ title: 'Error', message: 'Both fields are required', type: 'error' });
      return;
    }
    if (newPass.length < 8) {
      alert.showAlert({ title: 'Error', message: 'New password must be at least 8 characters', type: 'error' });
      return;
    }
    setChangingPass(true);
    try {
      await profileApi.changePassword(user?.id_user ?? '', oldPass, newPass);
      alert.showAlert({ title: 'Done', message: 'Password changed successfully', type: 'success' });
      setOldPass(''); setNewPass('');
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Failed', type: 'error' });
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text.secondary} />
          </TouchableOpacity>

          <Text style={[typography.h2, { color: colors.text.primary, marginBottom: space.xl, fontFamily: 'SpaceGrotesk-Bold' }]}>
            Edit Profile
          </Text>

          <View style={styles.section}>
            <AppInput label="NAME" value={name} onChangeText={setName} placeholder="Your name" />
            <AppInput label="EMAIL" value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
            <AppInput label="PHONE" value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" />
            <AppInput label="CITY" value={city} onChangeText={setCity} placeholder="City" />

            <AppButton title="Save Changes" onPress={handleSave} loading={saving} size="lg" />
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, { color: colors.accent.gold, marginBottom: space.lg, fontFamily: 'SpaceGrotesk-Bold' }]}>
              Change Password
            </Text>
            <AppInput label="CURRENT PASSWORD" value={oldPass} onChangeText={setOldPass} placeholder="Current password" secureTextEntry />
            <AppInput label="NEW PASSWORD" value={newPass} onChangeText={setNewPass} placeholder="Min 8 characters" secureTextEntry />

            <AppButton title="Change Password" variant="secondary" onPress={handleChangePassword} loading={changingPass} size="lg" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { paddingHorizontal: space['2xl'], paddingTop: space.xl, paddingBottom: space['4xl'] },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, marginBottom: space.xl,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
  },
  section: { marginBottom: space['3xl'] },
});
