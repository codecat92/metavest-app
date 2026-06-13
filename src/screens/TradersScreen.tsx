import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, ActivityIndicator
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Shield, Star } from 'lucide-react-native';
import { followApi, UserTrader } from '@/api/follow';
import { getToken } from '@/api/client';
import { useCustomAlert } from '@/context/AlertContext';
import { colors, space, radius, typography } from '@/theme';
import { GlassCard, EmptyState, Skeleton, Badge } from '@/components';

const avatarColors = [colors.accent.purple, colors.accent.gold, colors.semantic.positive, colors.semantic.negative, '#8855CC'];

export default function TradersScreen() {
  const [traders, setTraders] = useState<UserTrader[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [followedSet, setFollowedSet] = useState<Set<string>>(new Set());
  const [followMap, setFollowMap] = useState<Record<string, number>>({});
  const alert = useCustomAlert();

  const loadTraders = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const [activeRes, followedRes] = await Promise.all([
        followApi.getActive(1),
        followApi.getFollowed(1),
      ]);
      setTraders(activeRes.data ?? []);

      const followed = new Set<string>();
      (activeRes.data ?? []).forEach(t => {
        if (t.follow_status === '1') followed.add(t.id);
      });
      setFollowedSet(followed);

      const map: Record<string, number> = {};
      (followedRes.data ?? []).forEach((f: any) => {
        if (f.trader_id) map[f.trader_id] = f.id;
      });
      setFollowMap(map);
    } catch (e) {
      console.log('Failed to load traders:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { setLoading(true); loadTraders(); }, [loadTraders])
  );

  const handleFollow = async (traderId: string) => {
    try {
      await followApi.follow(traderId);
      setFollowedSet(prev => { const n = new Set(prev); n.add(traderId); return n; });
      alert.showAlert({ title: 'Success', message: 'You are now following this trader', type: 'success' });
      setTimeout(() => loadTraders(), 500);
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Failed', type: 'error' });
    }
  };

  const handleUnfollow = async (traderId: string) => {
    const followId = followMap[traderId];
    if (!followId) return;
    try {
      await followApi.unfollow(followId, traderId);
      setFollowedSet(prev => { const n = new Set(prev); n.delete(traderId); return n; });
      alert.showAlert({ title: 'Done', message: 'Unfollowed this trader', type: 'success' });
      setTimeout(() => loadTraders(), 500);
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Failed', type: 'error' });
    }
  };

  const sorted = traders.filter(t =>
    (t.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (t.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (!getToken()) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <EmptyState icon={<Search size={40} color={colors.text.secondary} />} title="Login to see traders" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={[typography.h2, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
              Traders
            </Text>
            <Text style={[typography.caption, { color: colors.text.secondary }]}>
              Discover top performers
            </Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Search size={16} color={colors.text.secondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search traders..."
            placeholderTextColor={colors.text.secondary}
            style={styles.searchInput}
          />
        </View>

        {loading ? (
          <View style={{ paddingHorizontal: space['2xl'], gap: space.md }}>
            {[1, 2, 3].map(i => (
              <GlassCard key={i} elevation={2}>
                <Skeleton height={52} width={52} borderRadius={26} style={{ marginBottom: space.md }} />
                <Skeleton height={16} width="60%" style={{ marginBottom: space.sm }} />
                <Skeleton height={12} width="80%" />
              </GlassCard>
            ))}
          </View>
        ) : (
          <View style={styles.cardList}>
            {sorted.map((trader, i) => {
              const isFollowed = followedSet.has(trader.id);
              const initials = (trader.name ?? 'TR').substring(0, 2).toUpperCase();
              const avatarColor = avatarColors[i % avatarColors.length];
              return (
                <GlassCard key={trader.id} elevation={2}>
                  <View style={styles.topRow}>
                    <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Text style={[typography.bodyBold, { color: colors.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                          {trader.name}
                        </Text>
                        {trader.status === 1 && <Star size={12} color={colors.accent.purple} fill={colors.accent.purple} />}
                      </View>
                      {trader.description ? (
                        <Text style={styles.bio} numberOfLines={2}>{trader.description}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => isFollowed ? handleUnfollow(trader.id) : handleFollow(trader.id)}
                      style={[styles.followBtn, isFollowed && styles.followBtnActive]}
                    >
                      <Text style={[styles.followBtnText, isFollowed && styles.followBtnTextActive]}>
                        {isFollowed ? 'Following' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.statsRow}>
                    {[
                      { label: 'Status', value: trader.status === 1 ? 'Active' : 'Inactive', color: trader.status === 1 ? colors.semantic.positive : colors.text.secondary },
                      { label: 'Trades', value: '--', color: colors.accent.purple },
                      { label: 'Followers', value: '--', color: colors.accent.gold },
                    ].map((s) => (
                      <View key={s.label} style={styles.statBox}>
                        <Text style={[typography.label, { color: colors.text.secondary }]}>{s.label}</Text>
                        <Text style={[typography.captionBold, { color: s.color, marginTop: 2, fontFamily: 'SpaceGrotesk-Bold' }]}>
                          {s.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                </GlassCard>
              );
            })}
            {sorted.length === 0 && !loading && (
              <EmptyState icon={<Search size={40} color={colors.text.secondary} />} title="No traders found" />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { paddingBottom: 100 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: space['2xl'], paddingTop: space.xl, paddingBottom: space.sm,
  },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    height: 48, borderRadius: radius.md, paddingHorizontal: space.lg,
    marginHorizontal: space['2xl'], marginBottom: space.xl,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
  },
  searchInput: { flex: 1, color: colors.text.primary, fontSize: 14, fontFamily: 'DMSans' },

  cardList: { paddingHorizontal: space['2xl'], gap: space.md },

  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, marginBottom: space.md },
  avatar: {
    width: 52, height: 52, borderRadius: 26, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.glass.border,
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#fff', fontFamily: 'SpaceGrotesk-Bold' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: space.xs },
  bio: { fontSize: 12, color: colors.text.muted, lineHeight: 17, marginTop: 2, fontFamily: 'DMSans' },

  followBtn: {
    height: 34, paddingHorizontal: space.md, borderRadius: radius.md,
    backgroundColor: colors.accent.purple, alignItems: 'center', justifyContent: 'center',
  },
  followBtnActive: {
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.35)',
  },
  followBtnText: { fontSize: 12, fontWeight: '700', color: '#fff', fontFamily: 'DMSans-Bold' },
  followBtnTextActive: { color: colors.accent.purple },

  statsRow: { flexDirection: 'row', gap: space.sm },
  statBox: {
    flex: 1, alignItems: 'center', paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
  },
});
