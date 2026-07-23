import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Users, Copy, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useColors, space, radius, typography } from '@/theme';
import { getToken, BASE_URL } from '@/api/client';
import { GlassCard, Skeleton, EmptyState, Badge } from '@/components';
import { useCustomAlert } from '@/context/AlertContext';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

const STORAGE_HOST = BASE_URL.replace(/\/api$/, '');

interface ReferralUser {
  name: string;
  profile_image_src: string | null;
  type: 'user' | 'trader';
  referred_by: string | null;
}

interface ReferralSummary {
  total_descendants: number;
  levels: { depth: number; count: number }[];
}

interface LevelPage {
  users: ReferralUser[];
  page: number;
  hasMore: boolean;
  total: number;
}

type Props = NativeStackScreenProps<RootStackParamList, 'ReferralList'>;

export default function ReferralListScreen({ route, navigation }: Props) {
  const { referralCode } = route.params;
  const c = useColors();
  const { showAlert } = useCustomAlert();
  const [treeData, setTreeData] = useState<ReferralSummary | null>(null);
  const [levelData, setLevelData] = useState<Record<number, LevelPage>>({});
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([1]));
  const [levelsLoading, setLevelsLoading] = useState<Set<number>>(new Set());
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setLoadError(false);
    try {
      const token = getToken();
      if (!token) return;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${BASE_URL}/profile/referral-tree/summary`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const json = await res.json();
      setTreeData(json);
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setLoadError(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    setLevelData({});
    setExpandedLevels(new Set([1]));
    fetchSummary();
  }, [fetchSummary]));

  const fetchLevel = useCallback(async (depth: number, page: number = 1) => {
    setLevelsLoading(prev => new Set(prev).add(depth));
    try {
      const token = getToken();
      if (!token) return;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(
        `${BASE_URL}/profile/referral-tree/level/${depth}?page=${page}&per_page=20`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      const json = await res.json();

      setLevelData(prev => ({
        ...prev,
        [depth]: {
          users: page > 1 ? [...(prev[depth]?.users ?? []), ...json.users] : json.users,
          page: json.page,
          hasMore: json.has_more,
          total: json.total,
        },
      }));
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.log('[ReferralList] Level load failed:', e?.message);
      }
    } finally {
      setLevelsLoading(prev => {
        const next = new Set(prev);
        next.delete(depth);
        return next;
      });
    }
  }, []);

  const toggleLevel = (depth: number) => {
    setExpandedLevels(prev => {
      const next = new Set(prev);
      if (next.has(depth)) {
        next.delete(depth);
      } else {
        next.add(depth);
        if (!levelData[depth]) {
          fetchLevel(depth, 1);
        }
      }
      return next;
    });
  };

  const loadMore = (depth: number) => {
    const existing = levelData[depth];
    if (existing && existing.hasMore) {
      fetchLevel(depth, existing.page + 1);
    }
  };

  const renderUserItem = (item: ReferralUser, index: number) => (
    <View key={index} style={styles.userItem}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        {item.profile_image_src ? (
          <Image
            source={{ uri: item.profile_image_src.startsWith('http') ? item.profile_image_src : `${STORAGE_HOST}/uploads/profilepic/${item.profile_image_src.split(/[\\/]/).pop()}` }}
            style={styles.avatarImg}
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: item.type === 'trader' ? c.accent.gold : c.accent.purple }]}>
            <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase() ?? '?'}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[typography.bodyBold, { color: c.text.primary, fontFamily: 'DMSans-SemiBold' }]} numberOfLines={1}>
            {item.name ?? '-'}
          </Text>
          <Text style={[typography.label, { color: c.text.secondary, marginTop: 2 }]}>
            {item.type === 'trader' ? 'Trader' : 'User'}
          </Text>
          {item.referred_by && (
            <Text style={{ fontSize: 11, color: c.text.muted, marginTop: 1, fontFamily: 'DMSans' }} numberOfLines={1}>
              Dibawa oleh {item.referred_by}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const levels = treeData?.levels ?? [];
  const total = treeData?.total_descendants ?? 0;

  const ListHeader = () => (
    <View style={{ alignItems: 'center', marginBottom: space.lg }}>
      {treeData && (
        <GlassCard elevation={3} style={{ width: '100%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.lg }}>
            <Users size={40} color={c.accent.purple} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.priceSmall, { color: c.semantic.positive, fontFamily: 'Manrope-Bold' }]}>
                {total}
              </Text>
              <Text style={[typography.caption, { color: c.text.secondary }]}>
                Total network
              </Text>
            </View>
          </View>

          {levels.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg }}>
              {levels.map((l) => (
                <Badge key={l.depth} label={`Level ${l.depth}: ${l.count}`} variant="success" />
              ))}
            </View>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs, paddingTop: space.md, borderTopWidth: 1, borderTopColor: c.glass.border }}>
            <Text style={[typography.bodyBold, { color: c.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
              Your Code
            </Text>
            <TouchableOpacity
              onPress={async () => {
                await Clipboard.setStringAsync(referralCode);
                showAlert({ title: 'Copied', message: 'Referral code copied to clipboard' });
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.codeBadge, { backgroundColor: c.accent.purple }]}>
                <Text style={styles.codeText}>{referralCode}</Text>
                <Copy size={12} color="rgba(255,255,255,0.7)" />
              </View>
            </TouchableOpacity>
          </View>
        </GlassCard>
      )}

      {levels.length > 0 && (
        <Text style={[typography.label, { color: c.text.secondary, marginTop: space.xl, marginBottom: space.sm, alignSelf: 'flex-start', fontFamily: 'DMSans-Bold' }]}>
          YOUR NETWORK TREE
        </Text>
      )}
    </View>
  );

  const renderLevel = ({ item }: { item: { depth: number; count: number } }) => {
    const isExpanded = expandedLevels.has(item.depth);
    const isLoading = levelsLoading.has(item.depth);
    const data = levelData[item.depth];
    const users = data?.users ?? [];
    const hasMore = data?.hasMore ?? false;

    return (
      <View style={{ marginBottom: space.sm }}>
        <TouchableOpacity
          onPress={() => toggleLevel(item.depth)}
          activeOpacity={0.7}
          style={[styles.levelHeader, { backgroundColor: c.glass.g1, borderColor: c.glass.border }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            {isExpanded ? <ChevronDown size={16} color={c.text.secondary} /> : <ChevronRight size={16} color={c.text.secondary} />}
            <Text style={[typography.bodyBold, { color: c.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
              Level {item.depth}
            </Text>
          </View>
          <Badge label={String(item.count)} variant="neutral" />
        </TouchableOpacity>

        {isExpanded && (
          <View style={{ paddingLeft: space.lg, marginTop: space.sm }}>
            {isLoading && users.length === 0 ? (
              <ActivityIndicator size="small" color={c.accent.purple} style={{ marginVertical: space.lg }} />
            ) : (
              <>
                {users.map((u, i) => renderUserItem(u, i))}
                {isLoading && users.length > 0 && (
                  <ActivityIndicator size="small" color={c.accent.purple} style={{ marginVertical: space.md }} />
                )}
                {hasMore && !isLoading && (
                  <TouchableOpacity
                    onPress={() => loadMore(item.depth)}
                    activeOpacity={0.7}
                    style={{
                      paddingVertical: space.md,
                      alignItems: 'center',
                      borderRadius: radius.md,
                      backgroundColor: c.glass.g1,
                      borderWidth: 1,
                      borderColor: c.glass.border,
                      marginTop: space.sm,
                    }}
                  >
                    <Text style={[typography.bodyBold, { color: c.accent.purple }]}>
                      Muat lebih banyak
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  if (!loading && loadError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: c.glass.g1, borderColor: c.glass.border }]}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h3, { color: c.text.primary, fontFamily: 'Manrope-Bold', marginLeft: space.md }]}>
            Your Referrals
          </Text>
        </View>
        <EmptyState
          icon={<RefreshCw size={48} color={c.text.secondary} />}
          title="Gagal memuat data"
          subtitle="Coba lagi"
          onPress={() => { setLoading(true); fetchSummary(); }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: c.glass.g1, borderColor: c.glass.border }]}>
          <ArrowLeft size={20} color={c.text.secondary} />
        </TouchableOpacity>
        <Text style={[typography.h3, { color: c.text.primary, fontFamily: 'Manrope-Bold', marginLeft: space.md }]}>
          Your Referrals
        </Text>
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: space['2xl'], gap: space.sm }}>
          {[1, 2, 3].map(i => <GlassCard key={i}><Skeleton height={48} /></GlassCard>)}
        </View>
      ) : (
        <FlatList
          data={levels}
          keyExtractor={(item) => `level-${item.depth}`}
          renderItem={renderLevel}
          contentContainerStyle={styles.list}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            treeData && treeData.total_descendants === 0 ? (
              <EmptyState icon={<Users size={48} color={c.text.muted} />} title="No referrals yet" subtitle="Share your code to invite friends" />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space['2xl'], paddingTop: space.xl, paddingBottom: space.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'DMSans-Bold' },
  list: { paddingHorizontal: space['2xl'], paddingBottom: 80 },
  codeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: space.md, paddingVertical: space.xs, borderRadius: radius.sm },
  codeText: { fontSize: 13, fontWeight: '700', color: '#fff', fontFamily: 'DMSans-Bold' },
  levelHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: space.lg, paddingVertical: space.md, borderRadius: radius.md,
    borderWidth: 1,
  },
  userItem: {
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
});
