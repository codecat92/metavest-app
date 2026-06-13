import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Image, ActivityIndicator
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  Shield, Bell, LogOut,
  Star, Award, Mail, Phone, Hash, Camera
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useCustomAlert } from '@/context/AlertContext';
import { profileApi } from '@/api/profile';
import { getToken } from '@/api/client';
import { colors, space, radius, typography } from '@/theme';
import { GlassCard, AppButton } from '@/components';
import type { RootStackParamList, TabParamList } from '@/types/navigation';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ProfileNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const SERVER_HOST = 'https://metavest-backend-production.up.railway.app';

export default function ProfileScreen({ navigation }: { navigation: ProfileNavProp }) {
  const { logout, user, refreshUser } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(user?.profile_image_src ?? null);
  const [uploading, setUploading] = useState(false);
  const alert = useCustomAlert();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => { refreshUser(); }, [])
  );
  const [cacheBuster, setCacheBuster] = useState(Date.now());

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'UN';

  const rank = user?.user_rank as { rank_name?: string; rank_number?: string } | null;

  const handlePickPhoto = async () => {
    if (!getToken()) {
      alert.showAlert({ title: 'Error', message: 'Please login first', type: 'error' });
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert.showAlert({ title: 'Permission required', message: 'Allow access to photos in Settings.', type: 'error' });
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
          setCacheBuster(Date.now());
        }
        alert.showAlert({ title: 'Success', message: 'Profile photo updated', type: 'success' });
      } catch (e: any) {
        alert.showAlert({ title: 'Error', message: e.message || 'Upload failed', type: 'error' });
      } finally {
        setUploading(false);
      }
    }
  };

  const imageSrc = profileImage
    ? (profileImage.startsWith('http')
        ? profileImage
        : `${SERVER_HOST}/uploads/profilepic/${profileImage.split(/[\\/]/).pop()}` + `?t=${cacheBuster}`)
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
      title: 'Verification',
      items: [
        { Icon: Award, label: 'Membership', value: user?.membership_status === 1 ? 'Active' : 'Free' },
        { Icon: Star, label: 'ID Verified', value: user?.ktp_verified === 1 ? 'Verified' : 'Not verified' },
        { Icon: Shield, label: 'Account Type', value: user?.account_type_name ?? 'Standard' },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={{ paddingHorizontal: space['2xl'], paddingTop: space['2xl'] }}>
          <GlassCard elevation={3}>
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
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
              <View>
                <Text style={[typography.h3, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
                  {user?.name ?? 'Trader'}
                </Text>
                <Text style={[typography.caption, { color: colors.text.secondary }]}>
                  {user?.email ?? '-'}
                </Text>
                {rank?.rank_name && (
                  <View style={styles.rankBadge}>
                    <Award size={11} color={colors.accent.purple} />
                    <Text style={{ fontSize: 11, color: colors.accent.purple, fontWeight: '700', fontFamily: 'DMSans-Bold' }}>
                      {rank.rank_name}
                    </Text>
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
          </GlassCard>
        </View>

        <View style={styles.section}>
          {settingsGroups.map((group) => (
            <View key={group.title} style={{ marginBottom: space.lg }}>
              <Text style={[typography.label, { color: colors.text.secondary, marginBottom: space.sm, fontFamily: 'DMSans-Bold' }]}>
                {group.title.toUpperCase()}
              </Text>
              <GlassCard elevation={2} noPadding>
                {group.items.map((item, i) => (
                  <View
                    key={item.label}
                    style={[styles.settingsItem, i < group.items.length - 1 && styles.settingsItemBorder]}
                  >
                    <View style={styles.settingsIconWrap}>
                      <item.Icon size={15} color={colors.accent.purple} />
                    </View>
                    <Text style={[typography.body, { color: colors.text.primary, flex: 1, fontFamily: 'DMSans-SemiBold' }]}>
                      {item.label}
                    </Text>
                    <Text style={[typography.caption, { color: colors.text.secondary, fontFamily: 'DMSans' }]}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </GlassCard>
            </View>
          ))}

          <AppButton
            title="Edit Profile"
            variant="primary"
            size="lg"
            onPress={() => navigation.navigate('EditProfile')}
            style={{ marginBottom: space.md }}
          />

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={async () => {
              await logout();
              navigation.replace('Login');
            }}
          >
            <LogOut size={16} color={colors.semantic.negative} />
            <Text style={[typography.bodyBold, { color: colors.semantic.negative }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { paddingBottom: 100 },

  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg, marginBottom: space.xl },
  avatarBtn: { position: 'relative' },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.accent.purple, alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 72, height: 72, borderRadius: 36 },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#fff', fontFamily: 'SpaceGrotesk-Bold' },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.semantic.positive, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.bg.primary,
  },
  uploadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 36, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  rankBadge: {
    flexDirection: 'row', alignItems: 'center', gap: space.xs,
    marginTop: 6, paddingHorizontal: space.sm, paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)',
    alignSelf: 'flex-start',
  },

  statsRow: { flexDirection: 'row', gap: space['2xl'], marginBottom: space.sm },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' },
  statLabel: { fontSize: 11, color: colors.text.secondary, marginTop: 2, fontFamily: 'DMSans' },

  section: { paddingHorizontal: space['2xl'], marginBottom: space['2xl'] },

  settingsItem: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    paddingHorizontal: space.xl, paddingVertical: space.lg,
  },
  settingsItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.glass.border },
  settingsIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(139,92,246,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: space.sm, paddingVertical: space.lg, borderRadius: radius.lg,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.20)',
  },
});
