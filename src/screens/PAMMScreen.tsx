import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, useWindowDimensions, Image,
  Animated, PanResponder
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Building2, ChevronRight } from 'lucide-react-native';
import { pammApi, BrokerWithDetail, PammBanner } from '@/api/pamm';
import { getToken } from '@/api/client';
import { colors, space, radius, typography } from '@/theme';
import { GlassCard, Skeleton, AppButton } from '@/components';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type PAMMProps = NativeStackScreenProps<RootStackParamList, 'PAMM'>;

export default function PAMMScreen({ navigation }: PAMMProps) {
  const STAGING_HOST = 'http://157.66.4.40:8081';
  const { width: screenWidth } = useWindowDimensions();
  const [banners, setBanners] = useState<PammBanner[]>([]);
  const [brokers, setBrokers] = useState<BrokerWithDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerIdx, setBannerIdx] = useState(0);
  const cardWidth = screenWidth - space['2xl'] * 2 + space.md;
  const translateX = useRef(new Animated.Value(0)).current;
  const isDragging = useRef(false);
  const autoInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIdx = useRef(0);
  const dragStartX = useRef(0);

  const loadData = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const [bRes, brRes] = await Promise.all([
        pammApi.getBanners(),
        pammApi.getBrokers(),
      ]);
      setBanners(bRes.data ?? []);
      setBrokers(brRes.data ?? []);
    } catch (e) {
      console.log('PAMM load failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { setLoading(true); loadData(); }, [loadData])
  );

  // Auto-scroll effect
  useEffect(() => {
    if (totalBanners <= 1) return;
    if (autoInterval.current) clearInterval(autoInterval.current);
    autoInterval.current = setInterval(() => {
      if (!isDragging.current) {
        const next = (currentIdx.current + 1) % totalBanners;
        currentIdx.current = next;
        setBannerIdx(next);
        Animated.timing(translateX, {
          toValue: -next * cardWidth,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    }, 3000);
    return () => { if (autoInterval.current) clearInterval(autoInterval.current); };
  }, [totalBanners, cardWidth]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
    onPanResponderGrant: () => {
      isDragging.current = true;
      translateX.extractOffset();
      dragStartX.current = Number(JSON.stringify(translateX));
    },
    onPanResponderMove: (_, g) => {
      const newX = Math.max(-(totalBanners - 1) * cardWidth, Math.min(0, g.dx));
      translateX.setValue(newX);
    },
    onPanResponderRelease: (_, g) => {
      translateX.flattenOffset();
      isDragging.current = false;
      const clamped = Math.max(0, Math.min(totalBanners - 1, Math.round(Math.abs(g.dx) > 50
        ? (g.dx < 0 ? currentIdx.current + 1 : currentIdx.current - 1)
        : currentIdx.current)));
      currentIdx.current = clamped;
      setBannerIdx(clamped);
      Animated.timing(translateX, {
        toValue: -clamped * cardWidth,
        duration: 300,
        useNativeDriver: true,
      }).start();
    },
  })).current;

  const activeBanners = banners.filter(b => b.is_active == 1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h2, { color: colors.text.primary, flex: 1, marginLeft: space.lg, fontFamily: 'Manrope-Bold' }]}>
            Trade Menu
          </Text>
        </View>

        {loading ? (
          <View style={{ paddingHorizontal: space['2xl'], gap: space.lg }}>
            <Skeleton height={180} borderRadius={radius.xl} />
            <Skeleton height={80} borderRadius={radius.lg} />
            <Skeleton height={80} borderRadius={radius.lg} />
          </View>
        ) : (
          <>
            {/* Banner Carousel */}
            {activeBanners.length > 0 && (
              <View style={styles.carouselWrap}>
                <View style={{ overflow: 'hidden', paddingLeft: space['2xl'] }}>
                  <Animated.View
                    style={[styles.carouselTrack, { transform: [{ translateX }] }]}
                    {...panResponder.panHandlers}
                  >
                    {activeBanners.map((b) => (
                      <View key={b.id} style={[styles.bannerCard, { width: screenWidth - space['2xl'] * 2 }]}>
                        {b.image_url ? (
                          <Image
                            source={{ uri: STAGING_HOST + b.image_url }}
                            style={styles.bannerImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.bannerPlaceholder}>
                            <Building2 size={48} color="rgba(139,92,246,0.3)" />
                          </View>
                        )}
                        {b.title ? (
                          <Text style={styles.bannerTitle}>{b.title}</Text>
                        ) : null}
                      </View>
                    ))}
                  </Animated.View>
                </View>
                {activeBanners.length > 1 && (
                  <View style={styles.dots}>
                    {activeBanners.map((_, i) => (
                      <View key={i} style={[styles.dot, i === bannerIdx && styles.dotActive]} />
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Broker List */}
            <View style={styles.section}>
              <Text style={[typography.h4, { color: colors.text.primary, marginBottom: space.md, fontFamily: 'Manrope-Bold' }]}>
                Available Brokers
              </Text>
              <View style={{ gap: space.sm }}>
                {brokers.map((broker) => (
                  <TouchableOpacity
                    key={broker.id}
                    onPress={() => navigation.navigate('PAMMDetail', { brokerId: broker.id })}
                    activeOpacity={0.8}
                  >
                    <GlassCard elevation={2}>
                      <View style={styles.brokerRow}>
                        <View style={styles.brokerAvatar}>
                          {broker.detail?.logo_url ? (
                            <Image
                              source={{ uri: STAGING_HOST + broker.detail.logo_url }}
                              style={styles.brokerLogo}
                              resizeMode="contain"
                            />
                          ) : (
                            <Building2 size={22} color={colors.accent.purple} />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[typography.bodyBold, { color: colors.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                            {broker.name}
                          </Text>
                          {broker.detail ? (
                            <Text style={[typography.caption, { color: colors.text.secondary }]}>
                              {broker.detail.platform} · {broker.detail.spread_forex}
                            </Text>
                          ) : null}
                        </View>
                        <ChevronRight size={18} color={colors.text.secondary} />
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { paddingBottom: space['3xl'] },
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
  carouselWrap: { marginBottom: space['2xl'] },
  carouselTrack: {
    flexDirection: 'row',
  },
  bannerCard: {
    height: 180, borderRadius: radius.xl, marginRight: space.md,
    backgroundColor: colors.glass.g2,
    borderWidth: 1, borderColor: colors.glass.borderStrong,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  bannerPlaceholder: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  bannerImage: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: radius.xl,
  },
  bannerTitle: {
    fontSize: 16, fontWeight: '800', color: colors.text.primary,
    fontFamily: 'Manrope-Bold', position: 'absolute', bottom: space.md, left: space.md,
  },
  dots: {
    flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: space.md,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(139,92,246,0.2)',
  },
  dotActive: {
    backgroundColor: colors.accent.purple, width: 20,
  },
  section: { paddingHorizontal: space['2xl'], marginBottom: space['2xl'] },
  brokerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  brokerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(139,92,246,0.12)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  brokerLogo: {
    width: 44, height: 44, borderRadius: 22,
  },
});
