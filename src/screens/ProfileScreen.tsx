import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Image, Alert
} from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  Shield, Bell, LogOut,
  Star, Award, Mail, Phone, Hash, Camera
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { profileApi } from '../api/profile';
import { getToken } from '../api/client';

const SERVER_HOST = 'http://192.168.1.24:8000';

export default function ProfileScreen({ navigation }: any) {
  const { logout, user } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(user?.profile_image_src ?? null);
  const [uploading, setUploading] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'UN';

  const rank = user?.user_rank as { rank_name?: string; rank_number?: string } | null;

  const handlePickPhoto = async () => {
    if (!getToken()) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow access to photos in Settings.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        const response = await profileApi.uploadPhoto(result.assets[0].uri);
        if (response.data?.profile_image_src) {
          setProfileImage(response.data.profile_image_src);
        }
        Alert.alert('Success', 'Profile photo updated');
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Upload failed');
      } finally {
        setUploading(false);
      }
    }
  };

  const imageSrc = profileImage
    ? (profileImage.startsWith('http')
        ? profileImage.replace('localhost', '192.168.1.24')
        : `${SERVER_HOST}/uploads/profilepic/${profileImage.split(/[\\/]/).pop()}`)
    : null;

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        { Icon: Mail, label: 'Email', value: user?.email ?? '-' },
        { Icon: Phone, label: 'Phone', value: user?.phone_number || 'Not set' },
        { Icon: Hash, label: 'Referral', value: user?.referral_code ?? '-' },
      ],
    },
    {
      title: 'Trading',
      items: [
        { Icon: Award, label: 'Membership', value: user?.membership_status === 1 ? 'Active' : 'Free' },
        { Icon: Star, label: 'KTP Verified', value: user?.ktp_verified === 1 ? 'Verified' : 'Not verified' },
        { Icon: Shield, label: 'Account Type', value: user?.account_type_name ?? 'Standard' },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.headerPad}>
          <View style={styles.userCard}>
            <View style={styles.avatarRow}>
              <TouchableOpacity onPress={handlePickPhoto} disabled={uploading} style={styles.avatarBtn}>
                {imageSrc ? (
                  <Image source={{ uri: imageSrc }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  <Camera size={12} color="#fff" />
                </View>
                {uploading && (
                  <View style={styles.uploadingOverlay}>
                    <Text style={styles.uploadingText}>...</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View>
                <Text style={styles.userName}>{user?.name ?? 'Trader'}</Text>
                <Text style={styles.userHandle}>{user?.email ?? '-'}</Text>
                {rank?.rank_name && (
                  <View style={styles.eliteBadge}>
                    <Award size={11} color="#AB4BFF" />
                    <Text style={styles.eliteText}>{rank.rank_name}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.statsRow}>
              {[
                { label: 'Rank', value: rank?.rank_name ?? '-' },
                { label: 'Leverage', value: user?.account_leverage_name ?? '-' },
                { label: 'Currency', value: user?.base_currency_name ?? 'USD' },
              ].map((s) => (
                <View key={s.label}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          {settingsGroups.map((group) => (
            <View key={group.title} style={{ marginBottom: 16 }}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <View style={styles.settingsCard}>
                {group.items.map((item, i) => (
                  <View
                    key={item.label}
                    style={[styles.settingsItem, i < group.items.length - 1 && styles.settingsItemBorder]}
                  >
                    <View style={styles.settingsIconWrap}>
                      <item.Icon size={15} color="#AB4BFF" />
                    </View>
                    <Text style={styles.settingsLabel}>{item.label}</Text>
                    <Text style={styles.settingsValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={async () => {
              await logout();
              navigation?.replace('Login');
            }}
          >
            <LogOut size={16} color="#FF4B6E" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1439' },
  scroll: { paddingBottom: 100 },

  headerPad: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 0 },
  userCard: {
    borderRadius: 28, padding: 24,
    backgroundColor: 'rgba(171,75,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.3)',
    marginBottom: 24,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatarBtn: { position: 'relative' },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#AB4BFF', alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 72, height: 72, borderRadius: 36 },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#fff' },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#2FEFC4', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#0E1439',
  },
  uploadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 36, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  uploadingText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  userName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  userHandle: { fontSize: 13, color: '#8899AA', marginTop: 2 },
  eliteBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 6, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, backgroundColor: 'rgba(171,75,255,0.2)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.4)',
    alignSelf: 'flex-start',
  },
  eliteText: { fontSize: 11, color: '#AB4BFF', fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 24, marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: '#8899AA', marginTop: 2 },

  section: { paddingHorizontal: 24, marginBottom: 24 },

  groupTitle: {
    fontSize: 11, color: '#8899AA', fontWeight: '700',
    letterSpacing: 0.5, textTransform: 'uppercase',
    marginBottom: 8, paddingLeft: 4,
  },
  settingsCard: {
    borderRadius: 20, overflow: 'hidden',
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.12)',
  },
  settingsItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 16,
  },
  settingsItemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(171,75,255,0.08)' },
  settingsIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(171,75,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  settingsLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#fff' },
  settingsValue: { fontSize: 13, fontWeight: '600', color: '#8899AA' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 18,
    backgroundColor: 'rgba(255,75,110,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,75,110,0.2)',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#FF4B6E' },
});
