import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Image,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Award, Users, Copy } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useColors, space, radius, typography } from '@/theme';
import { getToken, BASE_URL } from '@/api/client';
import { GlassCard, Skeleton, EmptyState } from '@/components';
import { useCustomAlert } from '@/context/AlertContext';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

const STORAGE_HOST = BASE_URL.replace(/\/api$/, '');

type Props = NativeStackScreenProps<RootStackParamList, 'ReferralList'>;

export default function ReferralListScreen({ route, navigation }: Props) {
  const { referralCode } = route.params;
  const c = useColors();
  const { showAlert } = useCustomAlert();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const token = getToken();
      console.log('[ReferralList] token:', token ? 'present' : 'MISSING');
      if (!token) return;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const url = `${BASE_URL}/profile/referral-users`;
      console.log('[ReferralList] fetching:', url);

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const json = await res.json();
      console.log('[ReferralList] response:', JSON.stringify(json));
      setUsers(json.data ?? []);
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        console.log('[ReferralList] Request timed out');
      } else {
        console.log('[ReferralList] Load failed:', e?.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); loadData(); }, [loadData]));

  const renderItem = ({ item }: { item: any }) => (
    <GlassCard elevation={2}>
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

  const total = users.length;

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
                {total}
              </Text>
              <Text style={[typography.caption, { color: c.text.secondary }]}>
                {total === 0 ? 'No referrals yet' : total === 1 ? '1 user joined' : `${total} users joined`}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.md }}>
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
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'DMSans-Bold' },
  list: { paddingHorizontal: space['2xl'], paddingBottom: 80, gap: space.sm },
  codeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: space.md, paddingVertical: space.xs, borderRadius: radius.sm },
  codeText: { fontSize: 13, fontWeight: '700', color: '#fff', fontFamily: 'DMSans-Bold' },
});
