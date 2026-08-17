import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ChevronRight, Shield } from 'lucide-react-native';
import { getToken, BASE_URL } from '@/api/client';
import { useColors, space, typography } from '@/theme';
import GlassCard from '@/components/GlassCard';
import Skeleton from '@/components/Skeleton';
import { rankIcons, tierColors, type RankProgress } from '@/constants/rank';

export default function RankPreviewCard() {
  const navigation = useNavigation<any>();
  const c = useColors();
  const [data, setData] = useState<RankProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
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

  if (loading) {
    return (
      <View style={styles.wrap}>
        <GlassCard elevation={3}><Skeleton height={90} /></GlassCard>
      </View>
    );
  }

  if (!data) return null;

  const currentRankId = data.current_rank ?? 1;
  const RankIcon = rankIcons[currentRankId] ?? Shield;
  const tier = tierColors[currentRankId] ?? tierColors[1];
  const next = data.next_rank ?? null;

  const invitePct = next && next.min_invites > 0 ? data.invite_count / next.min_invites : 0;
  const depositPct = next && next.min_deposit > 0 ? data.total_deposit / next.min_deposit : 0;
  const pct = Math.min(100, Math.max(0, Math.round(Math.max(invitePct, depositPct) * 100)));

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('MyRank')} style={styles.wrap}>
      <GlassCard elevation={3} style={{ overflow: 'hidden', padding: 0 }}>
        <LinearGradient
          colors={[tier.gradient, '#1b2140']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: space.xl }}
        >
          <View
            pointerEvents="none"
            style={{ position: 'absolute', top: -16, right: -24, opacity: 0.10 }}
          >
            <RankIcon size={110} color={tier.ring} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View style={{
              width: 52, height: 52, borderRadius: 26,
              borderWidth: 2.5, borderColor: tier.ring,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <RankIcon size={24} color={tier.ring} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.caption, { color: c.text.secondary }]}>Peringkatmu saat ini</Text>
              <Text style={{ fontSize: 17, fontWeight: '500', color: c.text.primary, marginTop: 2 }}>{data.rank_name}</Text>
            </View>
            <ChevronRight size={20} color={c.text.secondary} />
          </View>

          {next ? (
            <View style={{ marginTop: space.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.xs }}>
                <Text style={[typography.caption, { color: c.text.secondary }]}>Menuju {next.rank_name}</Text>
                <Text style={[typography.caption, { color: tier.ring }]}>{pct}%</Text>
              </View>
              <View style={{ height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                <View style={{ height: 5, borderRadius: 3, backgroundColor: tier.ring, width: `${pct}%` }} />
              </View>
            </View>
          ) : (
            <Text style={[typography.caption, { color: c.text.secondary, marginTop: space.md }]}>
              Tingkat tertinggi tercapai
            </Text>
          )}
        </LinearGradient>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: space['2xl'], marginBottom: 28 },
});
