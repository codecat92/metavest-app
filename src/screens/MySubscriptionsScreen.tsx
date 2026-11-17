import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Bot, Calendar, ChevronRight, CheckCircle2, XCircle } from 'lucide-react-native';
import { subscriptionApi, MySubscription } from '@/api/subscription';
import { useColors, space, radius, typography } from '@/theme';
import { GlassCard, AppButton } from '@/components';
import { useAuth } from '@/context/AuthContext';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'MySubscriptions'>;

export default function MySubscriptionsScreen({ navigation }: Props) {
  const c = useColors();
  const { userType } = useAuth();
  const [subs, setSubs] = useState<MySubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const isTrader = userType === 'trader';

  const load = useCallback(async () => {
    if (isTrader) { setLoading(false); return; }
    try {
      const res = await subscriptionApi.getMySubscriptions();
      setSubs(res.data ?? []);
    } catch {
      setSubs([]);
    } finally {
      setLoading(false);
    }
  }, [isTrader]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg.primary }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[typography.body, { color: c.accent.purple, fontFamily: 'DMSans-SemiBold' }]}>‹ Kembali</Text>
          </TouchableOpacity>
        </View>

        <Text style={[typography.h2, { color: c.text.primary, fontFamily: 'Manrope-ExtraBold', marginBottom: space.sm }]}>
          Langganan Saya
        </Text>
        <Text style={[typography.caption, { color: c.text.secondary, marginBottom: space.xl }]}>
          Status langganan bot Anda dan sisa masa aktif.
        </Text>

        {isTrader && (
          <GlassCard elevation={2}>
            <Text style={[typography.body, { color: c.text.secondary, textAlign: 'center' }]}>
              Fitur langganan hanya tersedia untuk akun pengguna biasa.
            </Text>
          </GlassCard>
        )}

        {!isTrader && loading && (
          <View style={{ paddingVertical: space['3xl'], alignItems: 'center' }}>
            <ActivityIndicator color={c.accent.purple} />
          </View>
        )}

        {!isTrader && !loading && subs.length === 0 && (
          <GlassCard elevation={2}>
            <View style={{ alignItems: 'center', paddingVertical: space.lg }}>
              <Bot size={40} color={c.text.secondary} strokeWidth={1.5} />
              <Text style={[typography.body, { color: c.text.secondary, textAlign: 'center', marginTop: space.md }]}>
                Belum ada langganan aktif. Jelajahi etalase bot untuk mulai berlangganan.
              </Text>
              <View style={{ marginTop: space.lg, width: '100%' }}>
                <AppButton title="Lihat Etalase Bot" variant="primary" onPress={() => navigation.goBack()} />
              </View>
            </View>
          </GlassCard>
        )}

        {!isTrader && !loading && subs.map((s) => {
          const active = s.is_active;
          return (
            <GlassCard key={s.id} elevation={2} style={{ marginBottom: space.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.iconWrap, { backgroundColor: active ? 'rgba(34,197,94,0.12)' : 'rgba(139,92,246,0.12)' }]}>
                  {s.icon_url ? (
                    <ExpoImage source={{ uri: s.icon_url }} style={styles.iconImg} contentFit="cover" />
                  ) : (
                    <Bot size={26} color={active ? c.semantic.positive : c.accent.purple} strokeWidth={1.6} />
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: space.md }}>
                  <Text style={[typography.bodyBold, { color: c.text.primary, fontFamily: 'DMSans-Bold' }]} numberOfLines={1}>
                    {s.product_name ?? 'Bot'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 }}>
                    {active ? (
                      <CheckCircle2 size={13} color={c.semantic.positive} />
                    ) : (
                      <XCircle size={13} color={c.text.secondary} />
                    )}
                    <Text style={{ fontSize: 12, color: active ? c.semantic.positive : c.text.secondary, fontFamily: 'DMSans-SemiBold' }}>
                      {active ? `Aktif · sisa ${s.days_remaining} hari` : 'Kedaluwarsa'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: space.md, gap: 6 }}>
                <Calendar size={14} color={c.text.secondary} />
                <Text style={[typography.caption, { color: c.text.secondary }]}>
                  Berakhir: {s.ends_at ? new Date(s.ends_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: space.md }}
              >
                <Text style={{ color: c.accent.purple, fontFamily: 'DMSans-SemiBold', fontSize: 13 }}>
                  {active ? 'Perpanjang di etalase' : 'Langganan lagi'}
                </Text>
                <ChevronRight size={16} color={c.accent.purple} />
              </TouchableOpacity>
            </GlassCard>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: space['2xl'], paddingBottom: space['4xl'] },
  headerRow: { paddingVertical: space.lg },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconImg: { width: 48, height: 48 },
});
