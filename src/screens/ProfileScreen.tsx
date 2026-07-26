import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  Shield, Bell, LogOut,
  Star, Award, Mail, Phone, Hash, Camera, Sun, Moon, GraduationCap,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useCustomAlert } from '@/context/AlertContext';
import { profileApi } from '@/api/profile';
import { academyNewApi } from '@/api/academyNew';
import { getToken, BASE_URL } from '@/api/client';
import { colors, useColors, useTheme, space, radius, typography } from '@/theme';
import { GlassCard, AppButton, Badge } from '@/components';
import type { RootStackParamList, TabParamList } from '@/types/navigation';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ProfileNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const STORAGE_HOST = BASE_URL.replace(/\/api$/, '');

export default function ProfileScreen({ navigation }: { navigation: ProfileNavProp }) {
  const { logout, user, refreshUser, userType } = useAuth();
  const colors = useColors();
  const { isDark, toggle: toggleTheme } = useTheme();
  const [profileImage, setProfileImage] = useState<string | null>(user?.profile_image_src ?? null);
  const [traderProfileImage, setTraderProfileImage] = useState<string | null>(user?.profile_image_src ?? null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [traderId, setTraderId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const alert = useCustomAlert();
  const insets = useSafeAreaInsets();

  const [instructorStatus, setInstructorStatus] = useState<string | null>(null);
  const [cacheBuster, setCacheBuster] = useState(Date.now());

  const fetchInstructorStatus = useCallback(async () => {
    try {
      const res = await academyNewApi.getInstructorProfile();
      setInstructorStatus(res.data.status);
    } catch {
      setInstructorStatus(null);
    }
  }, []);

  useEffect(() => {
    if (user?.profile_image_src) {
      setProfileImage(user.profile_image_src);
      setTraderProfileImage(user.profile_image_src);
    }
  }, [user?.profile_image_src]);

  useFocusEffect(
    useCallback(() => {
      refreshUser();
      fetchInstructorStatus();
      setCacheBuster(Date.now());
      setAvatarFailed(false);
      if (userType === 'trader') {
        fetch(`${BASE_URL}/user-traders/profile`, {
          headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json' },
        })
          .then(r => r.json())
          .then(res => {
            if (res.data?.profile_image_src) setTraderProfileImage(res.data.profile_image_src);
            if (res.data?.id) setTraderId(res.data.id);
          })
          .catch(() => {});
      }
    }, [refreshUser, fetchInstructorStatus, userType])
  );

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
        if (userType === 'trader') {
          const formData = new FormData();
          formData.append('user_id', traderId ?? '');
          formData.append('profile_image_src', {
            uri: result.assets[0].uri,
            name: 'profilepic.jpg',
            type: 'image/jpeg',
          } as any);
          const res = await fetch(`${BASE_URL}/user-traders/update`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json' },
            body: formData,
          });
          const json = await res.json();
          if (json.data?.profile_image_src) {
            setTraderProfileImage(json.data.profile_image_src);
            setCacheBuster(Date.now());
            refreshUser();
          }
          alert.showAlert({ title: 'Success', message: 'Profile photo updated', type: 'success' });
        } else {
          const response = await profileApi.uploadPhoto(result.assets[0].uri);
          if (response.data?.profile_image_src) {
            setProfileImage(response.data.profile_image_src);
            setCacheBuster(Date.now());
            refreshUser();
          }
          alert.showAlert({ title: 'Success', message: 'Profile photo updated', type: 'success' });
        }
      } catch (e: any) {
        alert.showAlert({ title: 'Error', message: e.message || 'Upload failed', type: 'error' });
      } finally {
        setUploading(false);
      }
    }
  };

  const activeImage = userType === 'trader'
    ? traderProfileImage
    : profileImage;

  const imageSrc = activeImage
    ? (activeImage.startsWith('http')
        ? activeImage
        : `${STORAGE_HOST}/uploads/profilepic/${activeImage.split(/[\\/]/).pop()}` + `?t=${cacheBuster}`)
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={{ paddingHorizontal: space['2xl'], paddingTop: space['2xl'] }}>
          <GlassCard elevation={3}>
            <View style={styles.avatarRow}>
              <TouchableOpacity onPress={handlePickPhoto} disabled={uploading} style={styles.avatarBtn}>
                {imageSrc && !avatarFailed ? (
                  <ExpoImage source={{ uri: imageSrc }} style={styles.avatarImg} cachePolicy="none" onError={() => setAvatarFailed(true)} />
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
                <Text style={[typography.h3, { color: colors.text.primary, fontFamily: 'Manrope-Bold' }]}>
                  {user?.name ?? 'Trader'}
                </Text>
                <Text style={[typography.caption, { color: colors.text.secondary }]}>
                  {user?.email ?? '-'}
                </Text>
                {rank?.rank_name && (
                  <TouchableOpacity onPress={() => navigation.navigate('MyRank')} activeOpacity={0.7}>
                  <View style={styles.rankBadge}>
                    <Award size={11} color={colors.accent.purple} />
                    <Text style={{ fontSize: 11, color: colors.accent.purple, fontWeight: '700', fontFamily: 'DMSans-Bold' }}>
                      {rank.rank_name}
                    </Text>
                  </View>
                  </TouchableOpacity>
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
                  <Text style={[styles.statValue, { color: colors.text.primary }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.text.secondary }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </View>

        <View style={[styles.section, { marginTop: space['2xl'] }]}>
          <TouchableOpacity onPress={toggleTheme} activeOpacity={0.7} style={{ marginBottom: space.xl }}>
            <GlassCard elevation={2}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <View style={styles.settingsIconWrap}>
                  {isDark
                    ? <Moon size={15} color={colors.accent.purple} />
                    : <Sun size={15} color={colors.accent.purple} />
                  }
                </View>
                <Text style={[typography.body, { color: colors.text.primary, flex: 1, fontFamily: 'DMSans-SemiBold' }]}>
                  Appearance
                </Text>
                <View style={{
                  width: 52, height: 28, borderRadius: 14,
                  backgroundColor: isDark ? colors.accent.purple : 'rgba(0,0,0,0.12)',
                  justifyContent: 'center', paddingHorizontal: 3,
                }}>
                  <View style={{
                    width: 22, height: 22, borderRadius: 11,
                    backgroundColor: '#fff',
                    alignSelf: isDark ? 'flex-end' : 'flex-start',
                  }} />
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>

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
                    <Text style={[typography.caption, { color: colors.text.secondary, maxWidth: '45%', fontFamily: 'DMSans' }]} numberOfLines={1}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </GlassCard>
            </View>
          ))}

          {/* ── Your Referrals ── */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ReferralList', { referralCode: user?.referral_code ?? '-' })}
            activeOpacity={0.8}
          >
            <GlassCard elevation={2} style={{ marginBottom: space.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <View style={[styles.settingsIconWrap, { backgroundColor: 'rgba(139,92,246,0.18)' }]}>
                  <Award size={18} color={colors.accent.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, { color: colors.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                    Your Referrals
                  </Text>
                  <Text style={[typography.caption, { color: colors.text.secondary, marginTop: 2 }]}>
                    Share your referral code with friends
                  </Text>
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>

          <AppButton
            title="Edit Profile"
            variant="primary"
            size="lg"
            onPress={() => navigation.navigate('EditProfile')}
            style={{ marginBottom: space.md }}
          />

          {/* ── Apply as Instructor ── */}
          {instructorStatus === null ? (
            <GlassCard elevation={2} style={{ marginBottom: space.md, borderColor: `${colors.accent.purple}40`, borderWidth: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <View style={[styles.settingsIconWrap, { backgroundColor: 'rgba(139,92,246,0.18)' }]}>
                  <GraduationCap size={18} color={colors.accent.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, { color: colors.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                    Become an Instructor
                  </Text>
                  <Text style={[typography.caption, { color: colors.text.secondary, marginTop: 2 }]}>
                    Share your trading knowledge with others
                  </Text>
                </View>
              </View>
              <AppButton
                title="Apply as Instructor"
                variant="primary"
                size="md"
                onPress={() => navigation.navigate('ApplyInstructor')}
                style={{ marginTop: space.md }}
              />
            </GlassCard>
          ) : instructorStatus === 'pending' ? (
            <View style={{ marginBottom: space.md }}>
              <Badge label="Application Pending" variant="warning" style={{ alignSelf: 'center' }} />
            </View>
          ) : instructorStatus === 'active' ? (
            <View style={{ marginBottom: space.md }}>
              <Badge label="✓ Verified Instructor" variant="success" style={{ alignSelf: 'center' }} />
            </View>
          ) : instructorStatus === 'rejected' ? (
            <GlassCard elevation={2} style={{ marginBottom: space.md }}>
              <Badge label="Application Rejected" variant="danger" style={{ alignSelf: 'center', marginBottom: space.md }} />
              <AppButton
                title="Re-apply"
                variant="secondary"
                size="md"
                onPress={() => navigation.navigate('ApplyInstructor')}
              />
            </GlassCard>
          ) : null}

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => {
              logout();
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
  scroll: { },

  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg, marginBottom: space.xl },
  avatarBtn: { position: 'relative' },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.accent.purple, alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 72, height: 72, borderRadius: 36 },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#fff', fontFamily: 'Manrope-Bold' },
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
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text.primary, fontFamily: 'Manrope-Bold' },
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
