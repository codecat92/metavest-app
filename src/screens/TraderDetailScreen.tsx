import {
  View, Text, ScrollView, StyleSheet, Image,
  TouchableOpacity,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Zap, Users, GraduationCap, MessageSquare,
  ShieldCheck, ShieldOff,
} from 'lucide-react-native';
import { getToken, BASE_URL, api, ApiResponse } from '@/api/client';
import { followApi, UserTrader } from '@/api/follow';
import { useColors, space, radius, typography } from '@/theme';
import { GlassCard, Badge, Skeleton } from '@/components';
import { useCustomAlert } from '@/context/AlertContext';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

const STORAGE_HOST = BASE_URL.replace(/\/api$/, '');

type Props = NativeStackScreenProps<RootStackParamList, 'TraderDetail'>;

export default function TraderDetailScreen({ route, navigation }: Props) {
  const { traderId } = route.params;
  const c = useColors();
  const { showAlert } = useCustomAlert();

  const [trader, setTrader] = useState<UserTrader | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followed, setFollowed] = useState(false);
  const [followUpdating, setFollowUpdating] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const loadTrader = useCallback(async () => {
    setError(null);
    try {
      const token = getToken();
      if (!token) { setError('Please login'); return; }

      const res = await api.get<ApiResponse<UserTrader>>(`/user-traders/detail/${traderId}`);
      setTrader(res.data);
      setFollowed(res.data.follow_status === '1' || res.data.follow_status === 1);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load trader');
      showAlert({ title: 'Error', message: e?.message ?? 'Failed to load trader' });
    } finally {
      setLoading(false);
    }
  }, [traderId, showAlert]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadTrader();
    }, [loadTrader]),
  );

  const handleFollow = async () => {
    if (!trader || followUpdating) return;
    setFollowUpdating(true);
    try {
      await followApi.follow(trader.id);
      setFollowed(true);
      showAlert({ title: 'Success', message: 'You are now following this trader', type: 'success' });
    } catch (e: any) {
      showAlert({ title: 'Error', message: e.message || 'Failed', type: 'error' });
    } finally {
      setFollowUpdating(false);
    }
  };

  const handleUnfollow = async () => {
    if (!trader || followUpdating) return;
    setFollowUpdating(true);
    try {
      const followList = await followApi.getFollowed(1);
      const record = (followList.data ?? []).find((f: any) => f.trader_id === trader.id);
      if (!record) return;
      await followApi.unfollow(record.id, trader.id);
      setFollowed(false);
      showAlert({ title: 'Done', message: 'Unfollowed this trader', type: 'success' });
    } catch (e: any) {
      showAlert({ title: 'Error', message: e.message || 'Failed', type: 'error' });
    } finally {
      setFollowUpdating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Skeleton height={24} width="50%" style={{ marginLeft: space.md }} />
        </View>
        <View style={{ paddingHorizontal: space['2xl'], gap: space.md }}>
          <View style={{ alignItems: 'center', gap: space.md }}>
            <Skeleton height={80} width={80} borderRadius={40} />
            <Skeleton height={20} width="30%" />
            <Skeleton height={12} width="60%" />
          </View>
          <Skeleton height={14} width="100%" />
          <Skeleton height={14} width="70%" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !trader) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h4, { color: c.text.primary, fontFamily: 'Manrope-Bold', marginLeft: space.md }]}>
            Trader Profile
          </Text>
        </View>
        <View style={styles.centerState}>
          <Text style={[typography.body, { color: c.text.secondary, textAlign: 'center' }]}>
            {error ?? 'Trader not found'}
          </Text>
          <TouchableOpacity onPress={loadTrader} style={styles.retryBtn}>
            <Text style={[typography.bodyBold, { color: c.accent.purple }]}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const avatarSrc = trader.profile_image_src && !avatarFailed
    ? (trader.profile_image_src.startsWith('http')
        ? trader.profile_image_src
        : `${STORAGE_HOST}/uploads/profilepic/${trader.profile_image_src.split(/[\\/]/).pop()}`)
    : null;

  const initials = (trader.name ?? 'TR').substring(0, 2).toUpperCase();
  const isActive = trader.status === 1;
  const signalsCount = (trader as any).signal?.total ?? 0;
  const academyCount = (trader as any).academy?.total ?? 0;
  const forumCount = (trader as any).forum?.total ?? 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h4, { color: c.text.primary, fontFamily: 'Manrope-Bold', marginLeft: space.md }]}>
            Trader Profile
          </Text>
        </View>

        <View style={{ paddingHorizontal: space['2xl'] }}>
          <GlassCard elevation={2}>
            <View style={{ alignItems: 'center', gap: space.sm }}>
              {avatarSrc ? (
                <Image
                  source={{ uri: avatarSrc }}
                  style={styles.avatar}
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: c.accent.purple }]}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              )}

              <Text style={[typography.h2, { color: c.text.primary, fontFamily: 'Manrope-Bold', textAlign: 'center' }]}>
                {trader.name}
              </Text>

              <View style={[
                styles.statusBadge,
                { backgroundColor: isActive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', borderColor: isActive ? 'rgba(34,197,94,0.30)' : 'rgba(239,68,68,0.30)' },
              ]}>
                {isActive ? (
                  <ShieldCheck size={13} color={c.semantic.positive} />
                ) : (
                  <ShieldOff size={13} color={c.semantic.negative} />
                )}
                <Text style={[typography.label, { color: isActive ? c.semantic.positive : c.semantic.negative }]}>
                  {isActive ? 'Active Trader' : 'Inactive'}
                </Text>
              </View>

              {trader.description ? (
                <Text style={[typography.body, { color: c.text.secondary, textAlign: 'center', lineHeight: 22, marginTop: space.xs }]}>
                  {trader.description}
                </Text>
              ) : null}

              <TouchableOpacity
                onPress={() => followed ? handleUnfollow() : handleFollow()}
                disabled={followUpdating}
                style={[styles.followBtn, followed && styles.followBtnActive]}
              >
                <Text style={[styles.followBtnText, followed && styles.followBtnTextActive]}>
                  {followed ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Zap size={15} color={c.accent.purple} />
                  <Text style={[typography.bodyBold, { color: c.accent.purple }]}>
                    {signalsCount}
                  </Text>
                </View>
                <Text style={[typography.label, { color: c.text.muted, marginTop: 2 }]}>Signals</Text>
              </View>
              <View style={styles.stat}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <GraduationCap size={15} color={c.text.primary} />
                  <Text style={[typography.bodyBold, { color: c.text.primary }]}>
                    {academyCount}
                  </Text>
                </View>
                <Text style={[typography.label, { color: c.text.muted, marginTop: 2 }]}>Academy</Text>
              </View>
              <View style={styles.stat}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Users size={15} color={c.text.primary} />
                  <Text style={[typography.bodyBold, { color: c.text.primary }]}>
                    {(trader as any).follower_count ?? 0}
                  </Text>
                </View>
                <Text style={[typography.label, { color: c.text.muted, marginTop: 2 }]}>Followers</Text>
              </View>
              <View style={styles.stat}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <MessageSquare size={15} color={c.text.primary} />
                  <Text style={[typography.bodyBold, { color: c.text.primary }]}>
                    {forumCount}
                  </Text>
                </View>
                <Text style={[typography.label, { color: c.text.muted, marginTop: 2 }]}>Forum</Text>
              </View>
            </View>
          </GlassCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space['2xl'],
    paddingTop: space.xl,
    paddingBottom: space.lg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  avatar: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28, fontWeight: '700', color: '#fff', fontFamily: 'Manrope-Bold',
  },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: space.xs,
    paddingHorizontal: space.md, paddingVertical: space.xs,
    borderRadius: radius.full, borderWidth: 1,
  },

  followBtn: {
    height: 40, paddingHorizontal: space['2xl'], borderRadius: radius.md,
    backgroundColor: 'rgba(139,92,246,1)', alignItems: 'center', justifyContent: 'center',
    marginTop: space.sm,
  },
  followBtnActive: {
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.35)',
  },
  followBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', fontFamily: 'DMSans-Bold' },
  followBtnTextActive: { color: '#8B5CF6' },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: space.xl,
    paddingTop: space.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  stat: {
    alignItems: 'center',
  },

  centerState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: space['3xl'], gap: space.md,
  },
  retryBtn: {
    paddingHorizontal: space.xl, paddingVertical: space.sm,
    borderRadius: radius.md, borderWidth: 1,
    borderColor: '#8B5CF6',
  },
});
