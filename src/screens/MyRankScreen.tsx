import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Shield, Award, Star, Trophy, Gem, Lock,
} from 'lucide-react-native';
import { getToken, BASE_URL } from '@/api/client';
import { useColors, space, radius, typography } from '@/theme';
import { GlassCard, Badge, Skeleton } from '@/components';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

interface RankProgress {
  current_rank: number;
  rank_name: string;
  invite_count: number;
  total_deposit: number;
  next_rank: {
    rank: number;
    rank_name: string;
    min_invites: number;
    min_deposit: number;
  } | null;
}

type Props = NativeStackScreenProps<RootStackParamList, 'MyRank'>;

const rankIcons: Record<number, React.ComponentType<{ size: number; color: string }>> = {
  1: Shield,
  2: Award,
  3: Star,
  4: Trophy,
  5: Gem,
};

const rankColors: Record<number, string> = {
  1: '#9CA3AF',
  2: '#CD7F32',
  3: '#A8A8A8',
  4: '#FFD700',
  5: '#E01E5A',
};

const allRanks = [
  { rank: 5, label: 'Platinum', min_invites: 1000, min_deposit: 100000 },
  { rank: 4, label: 'Gold',     min_invites: 100,  min_deposit: 25000 },
  { rank: 3, label: 'Silver',   min_invites: 10,   min_deposit: 5000 },
  { rank: 2, label: 'Bronze',   min_invites: 1,    min_deposit: 1000 },
  { rank: 1, label: 'Steel',    min_invites: 0,    min_deposit: 0 },
];

export default function MyRankScreen({ navigation }: Props) {
  const c = useColors();
  const [data, setData] = useState<RankProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/profile/rank-progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); loadData(); }, [loadData]));

  const formatBalance = (amount: number) => `${amount.toLocaleString('en-US')} MP`;

  const currentRankId = data?.current_rank ?? 1;
  const RankIcon = rankIcons[currentRankId] ?? Shield;
  const rankColor = rankColors[currentRankId] ?? '#9CA3AF';

  const renderProgressBar = (current: number, target: number, color: string) => {
    const pct = Math.min((current / target) * 100, 100);
    return (
      <View style={{ marginBottom: space.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.xs }}>
          <Text style={[typography.caption, { color: c.text.secondary }]}>
            {current.toLocaleString()} / {target.toLocaleString()}
          </Text>
          <Text style={[typography.caption, { color }]}>
            {Math.round(pct)}%
          </Text>
        </View>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: c.glass.g2, overflow: 'hidden' }}>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: color, width: `${pct}%` }} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: c.glass.g1, borderColor: c.glass.border }]}>
          <ArrowLeft size={20} color={c.text.secondary} />
        </TouchableOpacity>
        <Text style={[typography.h3, { color: c.text.primary, fontFamily: 'Manrope-Bold', marginLeft: space.md }]}>
          My Rank
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {loading ? (
          <View style={{ gap: space.md }}>
            <GlassCard><Skeleton height={80} /></GlassCard>
            <GlassCard><Skeleton height={100} /></GlassCard>
            <GlassCard><Skeleton height={200} /></GlassCard>
          </View>
        ) : data ? (
          <>
            {/* Hero Card */}
            <GlassCard elevation={3} style={{ marginBottom: space.lg }}>
              <View style={{ alignItems: 'center', gap: space.sm }}>
                <RankIcon size={48} color={rankColor} />
                <Text style={[typography.h1, { color: rankColor, fontFamily: 'Manrope-Bold' }]}>
                  {data.rank_name}
                </Text>
                <Text style={[typography.caption, { color: c.text.secondary }]}>
                  Level {currentRankId} of 5
                </Text>
              </View>
            </GlassCard>

            {/* Progress Card */}
            {data.next_rank ? (
              <GlassCard elevation={2} style={{ marginBottom: space.lg }}>
                <Text style={[typography.h4, { color: c.text.primary, marginBottom: space.lg, fontFamily: 'Manrope-Bold' }]}>
                  Menuju {data.next_rank.rank_name}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, marginBottom: space.sm }}>
                  <Shield size={14} color={c.text.secondary} />
                  <Text style={[typography.caption, { color: c.text.secondary }]}>Undangan</Text>
                </View>
                {renderProgressBar(data.invite_count, data.next_rank.min_invites, c.accent.purple)}

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, marginBottom: space.sm }}>
                  <Star size={14} color={c.text.secondary} />
                  <Text style={[typography.caption, { color: c.text.secondary }]}>Deposit</Text>
                </View>
                {renderProgressBar(data.total_deposit, data.next_rank.min_deposit, c.accent.gold)}
              </GlassCard>
            ) : (
              <GlassCard elevation={2} style={{ marginBottom: space.lg }}>
                <View style={{ alignItems: 'center', gap: space.sm }}>
                  <Trophy size={40} color={rankColor} />
                  <Text style={[typography.h4, { color: rankColor, textAlign: 'center', fontFamily: 'Manrope-Bold' }]}>
                    Tingkat tertinggi tercapai
                  </Text>
                  <Text style={[typography.caption, { color: c.text.secondary, textAlign: 'center' }]}>
                    Anda telah mencapai tingkat tertinggi
                  </Text>
                </View>
              </GlassCard>
            )}

            {/* Ladder */}
            <View style={{ marginBottom: space['3xl'], marginTop: space.md }}>
              <Text style={[typography.h4, { color: c.text.primary, marginBottom: space.md, fontFamily: 'Manrope-Bold' }]}>
                Tingkatan
              </Text>
              <View style={{ gap: space.sm }}>
                {allRanks.map((r) => {
                  const isCompleted = r.rank < currentRankId;
                  const isCurrent = r.rank === currentRankId;
                  const isLocked = r.rank > currentRankId;
                  const Icon = rankIcons[r.rank] ?? Shield;
                  const color = rankColors[r.rank] ?? '#9CA3AF';

                  return (
                    <GlassCard
                      key={r.rank}
                      elevation={isCurrent ? 3 : 1}
                      style={[
                        isCurrent && { borderColor: `${c.accent.purple}60`, borderWidth: 1.5 },
                        isCompleted && { opacity: 0.55 },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                        <Icon size={24} color={isLocked ? c.text.muted : color} />
                        <View style={{ flex: 1 }}>
                          <Text style={[typography.bodyBold, {
                            color: isLocked || isCompleted ? c.text.secondary : c.text.primary,
                            fontFamily: 'DMSans-SemiBold',
                          }]}>
                            {r.label}
                          </Text>
                          {isLocked && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: 2 }}>
                              <Lock size={10} color={c.text.muted} />
                              <Text style={[typography.caption, { color: c.text.muted }]}>
                                {r.min_invites} undangan · {r.min_deposit.toLocaleString()} MP
                              </Text>
                            </View>
                          )}
                          {isCompleted && (
                            <Text style={[typography.caption, { color: c.semantic.positive }]}>✓ Terpenuhi</Text>
                          )}
                        </View>
                        {isCurrent && <Badge label="Sekarang" variant="info" />}
                      </View>
                    </GlassCard>
                  );
                })}
              </View>
            </View>
          </>
        ) : (
          <View style={{ paddingTop: 60, alignItems: 'center' }}>
            <Text style={[typography.body, { color: c.text.secondary }]}>Gagal memuat data</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: space['2xl'], paddingTop: space.xl, paddingBottom: 80 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space['2xl'], paddingTop: space.xl, paddingBottom: space.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
