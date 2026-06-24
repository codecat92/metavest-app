import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Linking, Image
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Building2, Calendar, Globe, MapPin,
  Shield, Medal, ChevronRight, ExternalLink
} from 'lucide-react-native';
import { pammApi, BrokerWithDetail } from '@/api/pamm';
import { getToken } from '@/api/client';
import { colors, useColors, space, radius, typography } from '@/theme';
import { GlassCard, Skeleton, AppButton } from '@/components';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'PAMMDetail'>;

export default function PAMMDetailScreen({ navigation, route }: Props) {
  const STAGING_HOST = 'http://157.66.4.40:8081';
  const colors = useColors();
  const { brokerId } = route.params;
  const [broker, setBroker] = useState<BrokerWithDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const res = await pammApi.getBrokerDetail(brokerId);
      setBroker(res.data);
    } catch (e) {
      console.log('PAMM detail load failed:', e);
    } finally {
      setLoading(false);
    }
  }, [brokerId]);

  useFocusEffect(
    useCallback(() => { setLoading(true); loadData(); }, [loadData])
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: space['2xl'], gap: space.lg }}>
          <Skeleton height={60} width={60} borderRadius={30} style={{ alignSelf: 'center' }} />
          <Skeleton height={120} borderRadius={radius.lg} />
          <Skeleton height={80} borderRadius={radius.lg} />
        </View>
      </SafeAreaView>
    );
  }

  if (!broker) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h2, { color: colors.text.primary, marginLeft: space.lg, fontFamily: 'Manrope-Bold' }]}>
            PAMM
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.text.secondary }}>Broker not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const detail = broker.detail;
  const licenses = detail.licenses ?? [];
  const description = detail.description ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h2, { color: colors.text.primary, flex: 1, marginLeft: space.lg, fontFamily: 'Manrope-Bold' }]}>
            PAMM
          </Text>
        </View>

        {/* Logo & Name */}
        <View style={styles.heroSection}>
          <View style={styles.heroAvatar}>
            {detail.logo_url ? (
              <Image
                source={{ uri: STAGING_HOST + detail.logo_url }}
                style={styles.heroLogo}
                resizeMode="contain"
              />
            ) : (
              <Building2 size={40} color={colors.accent.purple} />
            )}
          </View>
          <Text style={[typography.h3, { color: colors.text.primary, marginTop: space.md, fontFamily: 'Manrope-Bold' }]}>
            {broker.name}
          </Text>
        </View>

        {/* Info Grid */}
        <GlassCard elevation={2} style={{ marginHorizontal: space['2xl'], marginBottom: space.xl }}>
          <View style={styles.infoRow}>
            <Calendar size={16} color={colors.accent.purple} />
            <Text style={[typography.captionBold, { color: colors.text.primary, flex: 1, marginLeft: space.sm, fontFamily: 'DMSans-SemiBold' }]}>
              {detail.year_established ?? '-'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Globe size={16} color={colors.accent.purple} />
            <Text style={[typography.captionBold, { color: colors.text.primary, flex: 1, marginLeft: space.sm, fontFamily: 'DMSans-SemiBold' }]}>
              {detail.platform ?? '-'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={16} color={colors.accent.purple} />
            <Text style={[typography.captionBold, { color: colors.text.primary, flex: 1, marginLeft: space.sm, fontFamily: 'DMSans-SemiBold' }]}>
              {detail.address ?? '-'}
            </Text>
          </View>
          <View style={styles.statsRow}>
            {[
              { label: 'Min Deposit', value: detail.min_deposit ?? '-' },
              { label: 'Spread Forex', value: detail.spread_forex ?? '-' },
              { label: 'Max Leverage', value: detail.max_leverage ?? '-' },
            ].map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={[typography.label, { color: colors.text.secondary }]}>{s.label}</Text>
                <Text style={[typography.captionBold, { color: colors.text.primary, marginTop: 2, fontFamily: 'DMSans-Bold' }]}>
                  {s.value}
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Licenses */}
        {licenses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitle}>
              <Medal size={16} color={colors.accent.gold} />
              <Text style={[typography.h4, { color: colors.text.primary, marginLeft: space.xs, fontFamily: 'Manrope-Bold' }]}>
                Licenses
              </Text>
            </View>
            <View style={styles.licenseRow}>
              {licenses.map((lic, i) => (
                <GlassCard key={i} elevation={2} style={{ flex: 1, alignItems: 'center' }}>
                  <Shield size={28} color={colors.accent.gold} />
                  <Text style={[typography.captionBold, { color: colors.text.primary, marginTop: space.sm, textAlign: 'center', fontFamily: 'DMSans-Bold' }]}>
                    {lic.name}
                  </Text>
                  <Text style={[typography.label, { color: colors.text.secondary, marginTop: 2 }]}>
                    {lic.type}
                  </Text>
                </GlassCard>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        {description.length > 0 && (
          <View style={styles.section}>
            <Text style={[typography.h4, { color: colors.text.primary, marginBottom: space.md, fontFamily: 'Manrope-Bold' }]}>
              Description
            </Text>
            <View style={{ gap: space.sm }}>
              {description.map((item, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={[typography.body, { color: colors.text.secondary, flex: 1, fontFamily: 'DMSans' }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bottom Buttons */}
        <View style={styles.bottomBtns}>
          {detail.investor_url ? (
            <TouchableOpacity
              style={[styles.goldBtn, { flex: 1 }]}
              onPress={() => Linking.openURL(detail.investor_url!)}
              activeOpacity={0.8}
            >
              <ExternalLink size={16} color="#1a1a2e" />
              <Text style={styles.goldBtnText}>Open Broker</Text>
            </TouchableOpacity>
          ) : null}
          {detail.pamm_url ? (
            <TouchableOpacity
              style={[styles.goldBtn, { flex: 1 }]}
              onPress={() => Linking.openURL(detail.pamm_url!)}
              activeOpacity={0.8}
            >
              <ExternalLink size={16} color="#1a1a2e" />
              <Text style={styles.goldBtnText}>PAMM</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { paddingBottom: space['4xl'] },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: space['2xl'], paddingTop: space.xl, paddingBottom: space.xl,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
  },

  heroSection: { alignItems: 'center', paddingVertical: space.xl },
  heroAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 2, borderColor: 'rgba(139,92,246,0.25)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  heroLogo: {
    width: 80, height: 80, borderRadius: 40,
  },

  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: space.sm,
    borderBottomWidth: 1, borderBottomColor: colors.glass.border,
  },
  statsRow: {
    flexDirection: 'row', gap: space.sm, marginTop: space.md,
  },
  statItem: { flex: 1, alignItems: 'center' },

  section: { paddingHorizontal: space['2xl'], marginBottom: space['2xl'] },
  sectionTitle: {
    flexDirection: 'row', alignItems: 'center', marginBottom: space.md,
  },
  licenseRow: { flexDirection: 'row', gap: space.sm },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  bulletDot: {
    width: 6, height: 6, borderRadius: 3, marginTop: 7,
    backgroundColor: colors.accent.purple,
  },

  bottomBtns: {
    flexDirection: 'row', gap: space.md,
    paddingHorizontal: space['2xl'], marginTop: space.xl,
  },
  goldBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: space.sm, paddingVertical: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.accent.gold,
  },
  goldBtnText: {
    fontSize: 14, fontWeight: '800', color: '#1a1a2e', fontFamily: 'Manrope-Bold',
  },
});
