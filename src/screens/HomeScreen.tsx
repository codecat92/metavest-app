import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Animated, Easing, RefreshControl
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Zap, Users, BarChart2, Bell, TrendingUp, TrendingDown, ChevronRight, ArrowUpRight, MessageCircle, Copy, Wallet, GraduationCap, Sun, Sunset, Moon } from 'lucide-react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { forexApi, ForexCurrency, ForexQuote } from '@/api/forex';
import { newsApi } from '@/api/news';
import { colors, space, radius, typography } from '@/theme';
import { GlassCard, AppButton, Skeleton } from '@/components';
import type { TabParamList, RootStackParamList } from '@/types/navigation';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const CARD_WIDTH = 150;
const CARD_GAP = 12;

function getGreeting(): { text: string; Icon: React.ComponentType<{ size: number; color: string }> } {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', Icon: Sun };
  if (h < 17) return { text: 'Good afternoon', Icon: Sunset };
  return { text: 'Good evening', Icon: Moon };
}

function Sparkline({ up, id }: { up: boolean; id: string }) {
  const data = up
    ? [{ x: 1, y: 40 }, { x: 2, y: 55 }, { x: 3, y: 48 }, { x: 4, y: 70 }, { x: 5, y: 65 }, { x: 6, y: 80 }, { x: 7, y: 75 }, { x: 8, y: 90 }]
    : [{ x: 1, y: 80 }, { x: 2, y: 72 }, { x: 3, y: 78 }, { x: 4, y: 60 }, { x: 5, y: 65 }, { x: 6, y: 55 }, { x: 7, y: 50 }, { x: 8, y: 42 }];
  const accentColor = up ? colors.semantic.positive : colors.semantic.negative;
  const width = 122;
  const height = 36;
  const min = Math.min(...data.map(d => d.y));
  const max = Math.max(...data.map(d => d.y));
  const range = max - min || 1;
  const gradId = `grad_${id}`;

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((d.y - min) / range) * (height - 4),
  }));

  const linePath = points.reduce((acc, p, i) =>
    i === 0 ? `M${p.x.toFixed(1)},${p.y.toFixed(1)}`
      : `${acc} L${p.x.toFixed(1)},${p.y.toFixed(1)}`, '');

  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <Svg width={width} height={height} style={{ marginTop: space.sm }}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={accentColor} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill={`url(#${gradId})`} />
      <Path d={linePath} stroke={accentColor} strokeWidth="1.5" fill="none" />
    </Svg>
  );
}

const majorPairs = ['USD/EUR', 'USD/GBP', 'USD/JPY', 'USD/AUD', 'USD/CAD', 'USD/CHF', 'USD/NZD'];

interface MarketItem {
  pair: string;
  price: string;
  change: string;
  up: boolean;
}

function MarqueeMarkets() {
  const [items, setItems] = useState<MarketItem[]>(majorPairs.map(p => ({ pair: p, price: '-.--', change: '--', up: true })));
  const translateX = useRef(new Animated.Value(0)).current;

  const fetchForex = useCallback(async () => {
    try {
      const res = await forexApi.getCurrencies();
      const filtered = (res.data ?? []).filter(c => majorPairs.includes(c.symbol));

      const pricePromises = filtered.map(async c => {
        try {
          const quote = await forexApi.getPrice(c.symbol);
          return {
            pair: c.symbol,
            price: quote.close ? Number(quote.close).toFixed(4) : '-.--',
            change: quote.percent_change ? `${Number(quote.percent_change) >= 0 ? '+' : ''}${Number(quote.percent_change).toFixed(2)}%` : '--',
            up: Number(quote.percent_change ?? 0) >= 0,
          };
        } catch {
          return { pair: c.symbol, price: '-.--', change: '--', up: true };
        }
      });

      const marketItems = await Promise.all(pricePromises);
      if (marketItems.length > 0) setItems(marketItems);
    } catch (e) {
      console.log('Forex fetch failed:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { fetchForex(); }, [fetchForex])
  );

  const displayItems = items.length > 0 ? items : majorPairs.map(p => ({ pair: p, price: '-.--', change: '--', up: true }));

  const totalWidth = displayItems.length * (CARD_WIDTH + CARD_GAP);

  useEffect(() => {
    if (displayItems.length === 0) return;
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: -totalWidth,
        duration: 22000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [displayItems.length]);

  const doubled = [...displayItems, ...displayItems];

  return (
    <View style={{ overflow: 'hidden', marginBottom: space['2xl'] }}>
      <Animated.View style={{
        flexDirection: 'row',
        transform: [{ translateX }],
        paddingLeft: space['2xl'],
      }}>
        {doubled.map((m, idx) => (
          <View key={`${m.pair}-${idx}`} style={styles.marketCard}>
            <Text style={[typography.captionBold, { color: colors.text.primary, fontFamily: 'DMSans-Bold' }]}>
              {m.pair}
            </Text>
            <Text style={[typography.priceSmall, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
              {m.price}
            </Text>
            <View style={styles.marketChangeRow}>
              {m.up
                ? <TrendingUp size={12} color={colors.semantic.positive} />
                : <TrendingDown size={12} color={colors.semantic.negative} />
              }
              <Text style={[typography.caption, { color: m.up ? colors.semantic.positive : colors.semantic.negative, fontWeight: '700' }]}>
                {m.change}
              </Text>
            </View>
            <Sparkline up={m.up} id={`${m.pair.replace('/', '')}_${idx}`} />
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

function QuickActions({ onNavigate }: { onNavigate: (s: string) => void }) {
  const [glowIndex, setGlowIndex] = useState<number | null>(null);

  useEffect(() => {
    const len = actions.length;
    actions.forEach((_, index) => {
      setTimeout(() => setGlowIndex(index), index * 800 + 300);
    });
    setTimeout(() => setGlowIndex(null), len * 800 + 1100);
  }, []);

  const actions = [
    { label: 'Signals', screen: 'signals', Icon: Zap },
    { label: 'Traders', screen: 'traders', Icon: Users },
    { label: 'Portfolio', screen: 'portfolio', Icon: BarChart2 },
    { label: 'Forum', screen: 'forum', Icon: MessageCircle },
  ];

  return (
    <View style={styles.quickActions}>
      {actions.map((a, index) => {
        const isGlowing = glowIndex === index;
        return (
          <TouchableOpacity
            key={a.label}
            onPress={() => onNavigate(a.screen)}
            activeOpacity={0.8}
            style={[styles.actionBtn, isGlowing && styles.actionBtnGlow]}
          >
            <a.Icon size={20} color={isGlowing ? colors.accent.gold : colors.accent.purple} strokeWidth={1.8} />
            <Text style={[typography.label, {
              color: isGlowing ? colors.accent.gold : colors.text.secondary,
              marginTop: space.xs,
              fontFamily: 'DMSans-SemiBold',
            }]}>
              {a.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function FeatureCards({ onNavigate }: { onNavigate: (s: string) => void }) {
  const features = [
    {
      label: 'Copy Trading',
      desc: 'Auto-copy trades to your MT5 account',
      screen: 'copytrade',
      Icon: Copy,
    },
    {
      label: 'PAMM',
      desc: 'Register broker for PAMM verification',
      screen: 'pamm',
      Icon: Wallet,
    },
  ];

  return (
    <View style={fcStyles.row}>
      {features.map((f) => (
        <TouchableOpacity
          key={f.label}
          onPress={() => onNavigate(f.screen)}
          activeOpacity={0.8}
          style={{ flex: 1 }}
        >
          <GlassCard elevation={2} style={{ alignItems: 'center' }}>
            <View style={fcStyles.iconWrap}>
              <f.Icon size={28} color={colors.accent.gold} strokeWidth={1.5} />
            </View>
            <Text style={[typography.h4, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
              {f.label}
            </Text>
            <Text style={[typography.caption, { color: colors.text.secondary, textAlign: 'center', marginTop: space.xs }]}>
              {f.desc}
            </Text>
          </GlassCard>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function detectTag(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('gold') || t.includes('xau')) return 'XAU/USD';
  if (t.includes('eur') || (t.includes('usd') && t.includes('dollar'))) return 'EUR/USD';
  if (t.includes('gbp')) return 'GBP/USD';
  if (t.includes('oil') || t.includes('crude')) return 'Oil';
  if (t.includes('fed') || t.includes('rate') || t.includes('nfp')) return 'Macro';
  return 'Market';
}

const tagColors: Record<string, string> = {
  Macro: colors.accent.gold,
  'EUR/USD': colors.accent.purple,
  'XAU/USD': colors.accent.gold,
  'GBP/USD': colors.semantic.positive,
  Oil: colors.accent.goldLight,
  Market: colors.accent.purple,
};

function AcademyCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ marginHorizontal: space['2xl'], marginBottom: 28 }}>
      <GlassCard elevation={3} style={{ backgroundColor: 'rgba(212,175,55,0.08)', borderColor: 'rgba(212,175,55,0.25)' }}>
        <View style={acStyles.iconWrap}>
          <GraduationCap size={24} color={colors.accent.gold} strokeWidth={1.5} />
        </View>
        <View style={acStyles.textWrap}>
          <Text style={[typography.h3, { color: colors.accent.goldLight, fontFamily: 'SpaceGrotesk-Bold' }]}>
            Metavest Academy
          </Text>
          <Text style={[typography.body, { color: 'rgba(208,200,160,0.7)', marginTop: space.sm }]}>
            Master forex, crypto, and trading strategies with our expert-led courses. From beginner to pro — learn at your own pace.
          </Text>
        </View>
        <AppButton title="Explore" variant="secondary" size="md" />
      </GlassCard>
    </TouchableOpacity>
  );
}

function AnimatedNewsFeed({ onPress }: { onPress: () => void }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const [items, setItems] = useState<{ title: string; time: string; tag: string }[]>([]);

  useFocusEffect(
    useCallback(() => {
      newsApi.getArticles().then(res => {
        const latest = (res.data ?? []).slice(0, 4).map(a => ({
          title: a.title ?? '',
          time: a.created_at ? new Date(a.created_at).toLocaleDateString() : '',
          tag: detectTag(a.title ?? ''),
        }));
        setItems(latest);
      }).catch(() => {});
    }, [])
  );

  const displayItems = items.length > 0 ? items : [
    { title: 'Fed holds rates steady — dollar weakens', time: '', tag: 'Macro' },
  ];

  const VISIBLE_COUNT = 3;
  const ITEM_HEIGHT = 72;
  const totalHeight = VISIBLE_COUNT * ITEM_HEIGHT;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translateY, {
        toValue: -totalHeight,
        duration: Math.max(displayItems.length * 8000, 12000),
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [totalHeight]);

  const doubled = [...displayItems, ...displayItems];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View style={{ height: totalHeight, overflow: 'hidden', position: 'relative' }}>
        <Animated.View style={{ transform: [{ translateY }] }}>
          {doubled.map((item, i) => {
            const tagColor = tagColors[item.tag] ?? colors.text.secondary;
            return (
              <View key={i} style={newsStyles.item}>
                <View style={[newsStyles.tag, {
                  backgroundColor: `${tagColor}18`,
                  borderColor: `${tagColor}44`,
                }]}>
                  <Text style={[newsStyles.tagText, { color: tagColor }]}>{item.tag}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={newsStyles.title} numberOfLines={2}>{item.title}</Text>
                  <Text style={newsStyles.time}>{item.time}</Text>
                </View>
              </View>
            );
          })}
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const newsStyles = StyleSheet.create({
  item: {
    flexDirection: 'row', alignItems: 'flex-start', gap: space.md,
    padding: space.md, borderRadius: radius.lg, height: 72,
    marginBottom: space.sm,
    backgroundColor: colors.glass.g2,
    borderWidth: 1, borderColor: colors.glass.border,
  },
  tag: {
    width: 72, alignItems: 'center', paddingVertical: space.xs,
    borderRadius: radius.sm, borderWidth: 1, flexShrink: 0,
  },
  tagText: { fontSize: 10, fontWeight: '700', fontFamily: 'DMSans-Bold' },
  title: { fontSize: 12, fontWeight: '600', color: colors.text.primary, lineHeight: 17, fontFamily: 'DMSans-SemiBold' },
  time: { fontSize: 11, color: colors.text.secondary, marginTop: space.xs, fontFamily: 'DMSans' },
});

export default function HomeScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  const onNavigate = (screen: string) => {
    const map: Record<string, string> = {
      signals: 'Signals', traders: 'Traders', portfolio: 'Portfolio',
      profile: 'Profile', pamm: 'PAMM', forum: 'Forum', copytrade: 'CopyTrade', market: 'Market', academy: 'Academy',
    };
    if (map[screen]) navigation.navigate(map[screen]);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 800));
    setRefreshing(false);
  }, []);

  const greeting = getGreeting();
  const GreetingIcon = greeting.Icon;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.purple} />}
      >
        <View style={styles.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <GreetingIcon size={18} color={colors.accent.gold} />
              <Text style={[typography.caption, { color: colors.text.secondary }]}>
                {greeting.text}
              </Text>
            </View>
            <Text style={[typography.h2, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
              {user?.name ?? 'Trader'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.mpBadge}>
              <Zap size={13} color={colors.accent.gold} fill={colors.accent.gold} />
              <Text style={styles.mpText}>0 MP</Text>
            </View>
            <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
              <Bell size={18} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        <GlassCard elevation={3} style={{ marginHorizontal: space['2xl'], marginBottom: space['2xl'] }}>
          <View style={styles.portfolioAccentBar} />
          <Text style={[typography.caption, { color: colors.text.muted }]}>Total Portfolio</Text>
          <Text style={[typography.h1, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold', marginTop: space.xs }]}>
            $0.00
          </Text>
          <View style={styles.portfolioChangeRow}>
            <ArrowUpRight size={14} color={colors.semantic.positive} />
            <Text style={[typography.body, { color: colors.semantic.positive, fontWeight: '700' }]}>--</Text>
            <Text style={[typography.caption, { color: colors.text.muted }]}>today</Text>
          </View>
          <View style={styles.portfolioStats}>
            {[
              { label: 'FOLLOWING', value: '0 Traders' },
              { label: 'WIN RATE', value: '--' },
              { label: 'SIGNALS', value: '0 Active' },
            ].map((s) => (
              <View key={s.label}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={styles.statValue}>{s.value}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        <QuickActions onNavigate={onNavigate} />

        <View style={styles.sectionHeader}>
          <Text style={[typography.h4, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
            Markets
          </Text>
          <View style={{ flexDirection: 'row', gap: space.lg }}>
            <TouchableOpacity onPress={() => navigation.navigate('EconomicsCalendar')}>
              <Text style={[typography.caption, { color: colors.accent.gold, fontWeight: '600' }]}>Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Market')}>
              <Text style={[typography.caption, { color: colors.accent.purple, fontWeight: '600' }]}>See all</Text>
            </TouchableOpacity>
          </View>
        </View>
        <MarqueeMarkets />

        <FeatureCards onNavigate={onNavigate} />

        <AcademyCard onPress={() => navigation.navigate('Academy')} />

        <View style={styles.sectionHeader}>
          <Text style={[typography.h4, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
            Latest News
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('News')}>
            <ChevronRight size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: space['2xl'] }}>
          <AnimatedNewsFeed onPress={() => navigation.navigate('News')} />
        </View>
      </ScrollView>
      <ExpoLinearGradient
        colors={['rgba(14,20,57,0)', 'rgba(14,20,57,0.95)']}
        locations={[0, 1]}
        style={styles.bottomFade}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { paddingBottom: 100 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: space['2xl'], paddingTop: 60, paddingBottom: space.xl,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  mpBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: space.md, paddingVertical: 6, borderRadius: radius.full,
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)',
  },
  mpText: { fontSize: 13, fontWeight: '700', color: colors.accent.gold, fontFamily: 'DMSans-Bold' },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.20)',
    alignItems: 'center', justifyContent: 'center',
  },

  portfolioAccentBar: {
    height: 3,
    backgroundColor: colors.accent.gold,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  portfolioChangeRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.xs },
  portfolioStats: { flexDirection: 'row', gap: space['2xl'], marginTop: space.lg },
  statLabel: { fontSize: 11, color: colors.text.muted, fontWeight: '500', fontFamily: 'DMSans' },
  statValue: { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginTop: 2, fontFamily: 'SpaceGrotesk-Bold' },

  quickActions: {
    flexDirection: 'row', paddingHorizontal: space['2xl'],
    gap: space.md, marginBottom: space['2xl'],
  },
  actionBtn: {
    flex: 1, alignItems: 'center', paddingVertical: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
  },
  actionBtnGlow: {
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderColor: 'rgba(212,175,55,0.35)',
  },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: space['2xl'], marginBottom: space.md,
  },

  marketCard: {
    width: CARD_WIDTH, borderRadius: radius.lg, padding: space.md,
    marginRight: CARD_GAP,
    backgroundColor: colors.glass.g2,
    borderWidth: 1, borderColor: colors.glass.border,
  },
  marketChangeRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.xs },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
});

const fcStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', gap: space.md, paddingHorizontal: space['2xl'], marginBottom: 28,
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: radius.xl,
    backgroundColor: 'rgba(212,175,55,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: space.md,
  },
});

const acStyles = StyleSheet.create({
  iconWrap: {
    width: 48, height: 48, borderRadius: radius.lg, marginBottom: space.md,
    backgroundColor: 'rgba(212,175,55,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  textWrap: { marginBottom: space.lg },
});
