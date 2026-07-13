import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Award, Users } from 'lucide-react-native';
import { useColors, space, radius, typography } from '@/theme';
import { getToken, BASE_URL } from '@/api/client';
import { GlassCard, Skeleton, EmptyState } from '@/components';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'ReferralList'>;

export default function ReferralListScreen({ navigation }: Props) {
  const c = useColors();
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch(`${BASE_URL}/profile/referral-stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${BASE_URL}/profile/referral-users`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]);
      setStats(statsRes);
      setUsers(usersRes.data ?? []);
    } catch { } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); loadData(); }, [loadData]));

  const renderItem = ({ item }: { item: any }) => (
    <GlassCard elevation={2}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={[styles.avatar, { backgroundColor: item.type === 'trader' ? c.accent.gold : c.accent.purple }]}>
          <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase() ?? '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.bodyBold, { color: c.text.primary, fontFamily: 'DMSans-SemiBold' }]} numberOfLines={1}>
            {item.name ?? '-'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 2 }}>
            <Text style={[typography.label, { color: c.text.secondary }]}>
              {item.type === 'trader' ? 'Trader' : 'User'}
            </Text>
            <Text style={[typography.label, { color: c.text.muted }]}>
              {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
            </Text>
          </View>
        </View>
      </View>
    </GlassCard>
  );

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
          data={users}
          keyExtractor={(item, idx) => `${item.type}-${idx}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={{ alignItems: 'center', marginBottom: space.lg }}>
              <Text style={[typography.priceSmall, { color: c.accent.purple, fontFamily: 'Manrope-Bold' }]}>
                {stats.total_referred ?? 0}
              </Text>
              <Text style={[typography.caption, { color: c.text.secondary }]}>
                {stats.user_referred ?? 0} users · {stats.trader_referred ?? 0} traders
              </Text>
              <Text style={[typography.h4, { color: c.text.primary, marginTop: space.md, fontFamily: 'Manrope-Bold' }]}>
                Code: {stats.referral_code ?? '-'}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState icon={<Users size={48} color={c.text.muted} />} title="No referrals yet" subtitle="Share your code to invite friends" />
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
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'DMSans-Bold' },
  list: { paddingHorizontal: space['2xl'], paddingBottom: 80, gap: space.sm },
});
