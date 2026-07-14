import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Animated, Easing, RefreshControl
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Zap, Users, BarChart2, Bell, TrendingUp, TrendingDown, ChevronRight, ArrowUpRight, MessageCircle, Copy, Wallet, GraduationCap, Sun, Sunset, Moon } from 'lucide-react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAuth } from '@/context/AuthContext';
import { forexApi, ForexCurrency, ForexQuote } from '@/api/forex';
import { newsApi } from '@/api/news';
import { followApi } from '@/api/follow';
import { signalsApi } from '@/api/signals';
import { colors, useColors, useTheme, space, radius, typography } from '@/theme';
import { GlassCard, AppButton, Skeleton, BackgroundGlow } from '@/components';
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

// KOMPONEN: Sparkline — Grafik mini SVG di dalam kartu pasar forex
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

// KOMPONEN: MarqueeMarkets — Karusel kartu pasar forex yang bergerak otomatis
function MarqueeMarkets() {
  const c = useColors();
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
          <View key={`${m.pair}-${idx}`} style={[styles.marketCard, { backgroundColor: c.glass.g2, borderColor: c.glass.border }]}>
            <Text style={[typography.captionBold, { color: c.text.primary, fontFamily: 'DMSans-Bold' }]}>
              {m.pair}
            </Text>
            <Text style={[typography.priceSmall, { color: c.text.primary, fontFamily: 'Manrope-Bold' }]}>
              {m.price}
            </Text>
            <View style={styles.marketChangeRow}>
              {m.up
                ? <TrendingUp size={12} color={c.semantic.positive} />
                : <TrendingDown size={12} color={c.semantic.negative} />
              }
              <Text style={[typography.caption, { color: m.up ? c.semantic.positive : c.semantic.negative, fontWeight: '700' }]}>
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

// KOMPONEN: QuickActions — Grid 4 tombol aksi cepat dengan animasi glow
function QuickActions({ onNavigate }: { onNavigate: (s: string) => void }) {
  const [glowIndex, setGlowIndex] = useState<number | null>(null);
  const c = useColors();

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
            style={[styles.actionBtn, { backgroundColor: c.glass.g1, borderColor: c.glass.border }, isGlowing && styles.actionBtnGlow]}
          >
            <a.Icon size={20} color={isGlowing ? colors.accent.gold : colors.accent.purple} strokeWidth={1.8} />
            <Text style={[typography.label, {
              color: isGlowing ? colors.accent.gold : c.text.secondary,
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

// KOMPONEN: FeatureCards — Dua kartu fitur (Copy Trading + PAMM)
function FeatureCards({ onNavigate }: { onNavigate: (s: string) => void }) {
  const c = useColors();
  const features = [
    {
      label: 'Copy Trading',
      desc: 'Auto-copy trades to your MT5 account',
      screen: 'copytrade',
      Icon: Copy,
    },
    {
      label: 'PAMM',
      desc: 'Explore PAMM brokers',
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
          <GlassCard elevation={2} style={fcStyles.card}>
            <View style={[fcStyles.iconWrap, { backgroundColor: 'rgba(139,92,246,0.15)' }]}>
              <f.Icon size={28} color="#8B5CF6" strokeWidth={1.5} />
            </View>
            <View style={{ minHeight: 48, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', fontFamily: 'Manrope-Bold', color: c.text.primary, textAlign: 'center' }}>
                {f.label}
              </Text>
            </View>
            <Text style={[typography.caption, { color: c.text.secondary, textAlign: 'center', marginTop: space.xs }]}>
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
  Global: colors.semantic.info,
  Macro: colors.accent.gold,
  'EUR/USD': colors.accent.purple,
  'XAU/USD': colors.accent.gold,
  'GBP/USD': colors.semantic.positive,
  Oil: colors.accent.goldLight,
  Market: colors.accent.purple,
};

// KOMPONEN: AcademyCard — Kartu promo Metavest Academy dengan tombol CTA
function AcademyCard({ onPress }: { onPress: () => void }) {
  const c = useColors();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ marginHorizontal: space['2xl'], marginBottom: 28 }}>
      <GlassCard elevation={3} style={{ backgroundColor: c.accent.purple, borderColor: 'rgba(124,58,237,0.40)' }}>
        <View style={[acStyles.iconWrap, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <GraduationCap size={24} color="#FFFFFF" strokeWidth={1.5} />
        </View>
        <View style={acStyles.textWrap}>
          <Text style={[typography.h3, { color: c.bg.primary, fontFamily: 'Manrope-Bold' }]}>
            Metavest Academy
          </Text>
          <Text style={[typography.body, { color: c.bg.primary, marginTop: space.sm, opacity: 0.8 }]}>
            Master forex, crypto, and trading strategies with our expert-led courses. From beginner to pro, learn at your own pace!
          </Text>
        </View>
        <AppButton title="Explore" variant="secondary" size="md" />
      </GlassCard>
    </TouchableOpacity>
  );
}

// KOMPONEN: AnimatedNewsFeed — Daftar berita dengan animasi scroll vertikal otomatis
let globalNewsCache: { title: string; time: string; tag: string }[] | null = null;
let globalNewsCacheTime = 0;
const CACHE_TTL = 15 * 60 * 1000;

function AnimatedNewsFeed({ onPress }: { onPress: () => void }) {
  const d = useColors();
  const translateY = useRef(new Animated.Value(0)).current;
  const [items, setItems] = useState<{ title: string; time: string; tag: string }[]>([]);

  useFocusEffect(
    useCallback(() => {
      newsApi.getArticles().then(res => {
        const marketArticles = (res.data ?? []).slice(0, 6).map(a => ({
          title: a.title ?? '',
          time: a.created_at ? new Date(a.created_at).toLocaleDateString() : '',
          tag: detectTag(a.title ?? ''),
        }));

        if (marketArticles.length >= 4) {
          setItems(marketArticles);
          return;
        }

        const now = Date.now();
        if (globalNewsCache && (now - globalNewsCacheTime) < CACHE_TTL) {
          setItems([...marketArticles, ...globalNewsCache].slice(0, 6));
          return;
        }

        newsApi.getGlobalNews().then(globalRes => {
          const globalArticles = (globalRes.data ?? []).slice(0, 6).map(a => ({
            title: a.title ?? '',
            time: 'Global',
            tag: 'Global',
          }));
          globalNewsCache = globalArticles;
          globalNewsCacheTime = now;
          setItems([...marketArticles, ...globalArticles].slice(0, 6));
        }).catch(() => {
          setItems(marketArticles);
        });
      }).catch(() => { });
    }, [])
  );

  const hasArticles = items.length > 0;
  const displayItems = hasArticles ? items : [
    { title: 'No articles available', time: '', tag: 'Market' },
  ];

  const VISIBLE_COUNT = 4;
  const ITEM_HEIGHT = 72;
  const totalHeight = VISIBLE_COUNT * ITEM_HEIGHT;

  useEffect(() => {
    if (!hasArticles) return;
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
  }, [totalHeight, hasArticles]);

  const doubled = [...displayItems, ...displayItems];

  const renderItem = (item: { title: string; time: string; tag: string }, key: number) => {
    const tagColor = tagColors[item.tag] ?? d.text.secondary;
    return (
      <View key={key} style={newsStyles.item}>
        <View style={[newsStyles.tag, {
          backgroundColor: `${tagColor}18`,
          borderColor: `${tagColor}44`,
        }]}>
          <Text style={[newsStyles.tagText, { color: tagColor }]}>{item.tag}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[newsStyles.title, { color: d.text.primary }]} numberOfLines={2}>{item.title}</Text>
          <Text style={[newsStyles.time, { color: d.text.secondary }]}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View style={{ height: totalHeight, overflow: 'hidden', position: 'relative' }}>
        {hasArticles ? (
          <Animated.View style={{ transform: [{ translateY }] }}>
            {doubled.map((item, i) => renderItem(item, i))}
          </Animated.View>
        ) : (
          renderItem(displayItems[0], 0)
        )}
      </View>
    </TouchableOpacity>
  );
}

// STYLE: newsStyles — Gaya untuk setiap item kartu berita
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
  const colors = useColors();
  const { isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [signalsCount, setSignalsCount] = useState<number | null>(null);
  const navigation = useNavigation<any>();

  useFocusEffect(
    useCallback(() => {
      Promise.allSettled([
        followApi.getFollowed(1),
        signalsApi.getFollowed(1),
      ]).then(([followRes, signalRes]) => {
        if (followRes.status === 'fulfilled') setFollowingCount(followRes.value.data_count ?? 0);
        if (signalRes.status === 'fulfilled') setSignalsCount(signalRes.value.data_count ?? 0);
      });
    }, [])
  );

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
    <View style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      {isDark && <BackgroundGlow />}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.purple} />}
      >
        {/* ── HEADER: Sapaan + Nama User + MP Badge + Tombol Notifikasi ── */}
        <View style={styles.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <GreetingIcon size={18} color={colors.accent.gold} />
              <Text style={[typography.caption, { color: colors.text.secondary }]}>
                {greeting.text}
              </Text>
            </View>
            <Text style={[typography.h2, { color: colors.text.primary, fontFamily: 'Manrope-Bold' }]}>
              {user?.name?.split(' ')[0] ?? 'Trader'}
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

        {/* ── PORTOFOLIO CARD: Total Saldo + Perubahan Hari Ini + Statistik (Following / Win Rate / Signals) ── */}
        <GlassCard elevation={3} style={{ marginHorizontal: space['2xl'], marginBottom: space['2xl'] }}>
          <Text style={[typography.caption, { color: colors.text.secondary }]}>Total Portfolio</Text>
          <Text style={[typography.h1, { color: colors.text.primary, fontFamily: 'Manrope-Bold', marginTop: space.xs }]}>
            $0.00
          </Text>
          <View style={styles.portfolioChangeRow}>
            <ArrowUpRight size={14} color={colors.semantic.positive} />
            <Text style={[typography.body, { color: colors.semantic.positive, fontWeight: '700' }]}>--</Text>
            <Text style={[typography.caption, { color: colors.text.muted }]}>today</Text>
          </View>
          <View style={styles.portfolioStats}>
            {[
              { label: 'FOLLOWING', value: followingCount !== null ? `${followingCount} Traders` : '--' },
              { label: 'WIN RATE', value: '--' },
              { label: 'SIGNALS', value: signalsCount !== null ? `${signalsCount} Active` : '--' },
            ].map((s) => (
              <View key={s.label}>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>{s.label}</Text>
                <Text style={[styles.statValue, { color: colors.text.primary }]}>{s.value}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* ── QUICK ACTIONS: 4 Tombol Navigasi Cepat (Signals / Traders / Portfolio / Forum) ── */}
        <QuickActions onNavigate={onNavigate} />

        {/* ── SECTION HEADER: Markets + Link Calendar / See all ── */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h4, { color: colors.text.primary, fontFamily: 'Manrope-Bold' }]}>
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
        {/* ── MARKET CAROUSEL: Kartu Forex berjalan horizontal (EUR/USD, GBP/USD, dll) ── */}
        <MarqueeMarkets />

        {/* ── FEATURE CARDS: Kartu Copy Trading + PAMM ── */}
        <FeatureCards onNavigate={onNavigate} />

        {/* ── ACADEMY CARD: Kartu Promo Metavest Academy ── */}
        <AcademyCard onPress={() => navigation.navigate('Academy')} />

        {/* ── SECTION HEADER: Latest News + Ikon Panah Kanan ── */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h4, { color: colors.text.primary, fontFamily: 'Manrope-Bold' }]}>
            Latest News
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('News')}>
            <ChevronRight size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
        {/* ── NEWS FEED: Daftar Berita Animasi Scroll Vertikal ── */}
        <View style={{ paddingHorizontal: space['2xl'] }}>
          <AnimatedNewsFeed onPress={() => navigation.navigate('News')} />
        </View>
      </ScrollView>
    </View>
  );
}

// STYLE: styles — Gaya utama untuk container, header, kartu, tombol, section
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { },

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

  portfolioChangeRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.xs },
  portfolioStats: { flexDirection: 'row', gap: space['2xl'], marginTop: space.lg },
  statLabel: { fontSize: 11, color: colors.text.muted, fontWeight: '500', fontFamily: 'DMSans' },
  statValue: { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginTop: 2, fontFamily: 'Manrope-Bold' },

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
});

// STYLE: fcStyles — Gaya untuk komponen FeatureCards (Copy Trading + PAMM)
const fcStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', gap: space.md, paddingHorizontal: space['2xl'], marginBottom: 28,
    alignItems: 'stretch',
  },
  card: {
    flex: 1,
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: radius.xl,
    alignItems: 'center', justifyContent: 'center',
  },
});

// STYLE: acStyles — Gaya untuk komponen AcademyCard
const acStyles = StyleSheet.create({
  iconWrap: {
    width: 48, height: 48, borderRadius: radius.lg, marginBottom: space.md,
    alignItems: 'center', justifyContent: 'center',
  },
  textWrap: { marginBottom: space.lg },
});
