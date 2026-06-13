import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useCustomAlert } from '../context/AlertContext';
import { profileApi } from '../api/profile';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, refreshUser } = useAuth();
  const alert = useCustomAlert();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone_number ?? '');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);

  // Password
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#8899AA" />
        </TouchableOpacity>

        <Text style={styles.title}>Edit Profile</Text>

        {/* Profile Fields */}
        <View style={styles.section}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>NAME</Text>
            <View style={styles.inputBox}><TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="#8899AA" /></View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <View style={styles.inputBox}><TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#8899AA" keyboardType="email-address" autoCapitalize="none" /></View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PHONE</Text>
            <View style={styles.inputBox}><TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone number" placeholderTextColor="#8899AA" keyboardType="phone-pad" /></View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>CITY</Text>
            <View style={styles.inputBox}><TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="City" placeholderTextColor="#8899AA" /></View>
          </View>

          <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, saving && { opacity: 0.6 }]} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Changes</Text>}
          </TouchableOpacity>
        </View>

        {/* Password */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>CURRENT PASSWORD</Text>
            <View style={styles.inputBox}><TextInput style={styles.input} value={oldPass} onChangeText={setOldPass} placeholder="Current password" placeholderTextColor="#8899AA" secureTextEntry /></View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>NEW PASSWORD</Text>
            <View style={styles.inputBox}><TextInput style={styles.input} value={newPass} onChangeText={setNewPass} placeholder="Min 8 characters" placeholderTextColor="#8899AA" secureTextEntry /></View>
          </View>

          <TouchableOpacity onPress={handleChangePassword} style={[styles.passBtn, changingPass && { opacity: 0.6 }]} disabled={changingPass}>
            {changingPass ? <ActivityIndicator color="#0E1439" /> : <Text style={styles.passText}>Change Password</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1439' },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 60 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 28 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#F7C948', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#8899AA', letterSpacing: 0.5, marginBottom: 8 },
  inputBox: {
    height: 50, borderRadius: 14, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
  },
  input: { flex: 1, color: '#fff', fontSize: 15 },
  saveBtn: {
    height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#AB4BFF', marginTop: 8,
  },
  saveText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  passBtn: {
    height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F7C948', marginTop: 8,
  },
  passText: { fontSize: 16, fontWeight: '700', color: '#0E1439' },
});
