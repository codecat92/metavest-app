import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Image, Animated, Easing
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Zap, Users, BarChart2, Building2, Bell, TrendingUp, TrendingDown, ChevronRight, ArrowUpRight, MessageCircle, Copy } from 'lucide-react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { forexApi, ForexCurrency, ForexQuote } from '../api/forex';

const CARD_WIDTH = 150;
const CARD_GAP = 12;

// Sparkline using react-native-svg
function Sparkline({ up, id }: { up: boolean; id: string }) {
  const data = up
    ? [{ x: 1, y: 40 }, { x: 2, y: 55 }, { x: 3, y: 48 }, { x: 4, y: 70 }, { x: 5, y: 65 }, { x: 6, y: 80 }, { x: 7, y: 75 }, { x: 8, y: 90 }]
    : [{ x: 1, y: 80 }, { x: 2, y: 72 }, { x: 3, y: 78 }, { x: 4, y: 60 }, { x: 5, y: 65 }, { x: 6, y: 55 }, { x: 7, y: 50 }, { x: 8, y: 42 }];
  const color = up ? '#2FEFC4' : '#FF4B6E';
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
    <Svg width={width} height={height} style={{ marginTop: 8 }}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill={`url(#${gradId})`} />
      <Path d={linePath} stroke={color} strokeWidth="1.5" fill="none" />
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
    <View style={{ overflow: 'hidden', marginBottom: 24 }}>
      <Animated.View style={{
        flexDirection: 'row',
        transform: [{ translateX }],
        paddingLeft: 24,
      }}>
        {doubled.map((m, idx) => (
          <View key={`${m.pair}-${idx}`} style={styles.marketCard}>
            <Text style={styles.marketPair}>{m.pair}</Text>
            <Text style={styles.marketPrice}>{m.price}</Text>
            <View style={styles.marketChangeRow}>
              {m.up
                ? <TrendingUp size={12} color="#2FEFC4" />
                : <TrendingDown size={12} color="#FF4B6E" />
              }
              <Text style={[styles.marketChange, { color: m.up ? '#2FEFC4' : '#FF4B6E' }]}>
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
    const len = actions.length - 1;
    Array.from({length: actions.length}).forEach((_, index) => {
      setTimeout(() => setGlowIndex(index), index * 800 + 300);
    });
    setTimeout(() => setGlowIndex(null), len * 800 + 1100);
  }, []);

  const actions = [
    { label: 'Signals', screen: 'signals', Icon: Zap },
    { label: 'Traders', screen: 'traders', Icon: Users },
    { label: 'Copytrade', screen: 'copytrade', Icon: Copy },
    { label: 'Portfolio', screen: 'portfolio', Icon: BarChart2 },
    { label: 'PAMM', screen: 'pamm', Icon: Building2 },
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
            style={[styles.actionBtn, isGlowing && styles.actionBtnGlow]}
          >
            <a.Icon size={20} color={isGlowing ? '#F7C948' : '#AB4BFF'} strokeWidth={1.8} />
            <Text style={[styles.actionLabel, isGlowing && { color: '#F7C948' }]}>
              {a.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function AnimatedNewsFeed({ onPress }: { onPress: () => void }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const newsItems = [
    { title: "Fed holds rates steady — dollar weakens as traders price in June cut", time: "2h ago", tag: "Macro" },
    { title: "EUR/USD breaks key resistance at 1.0850 — bulls target 1.0920 next", time: "4h ago", tag: "EUR/USD" },
    { title: "Gold surges past $2,340 on safe-haven demand amid geopolitical tensions", time: "6h ago", tag: "XAU/USD" },
  ];
  const tagColors: Record<string, string> = {
    Macro: '#C9A84C', 'EUR/USD': '#AB4BFF', 'XAU/USD': '#C9A84C',
  };

  const ITEM_HEIGHT = 80;
  const totalHeight = newsItems.length * ITEM_HEIGHT;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translateY, {
        toValue: -totalHeight,
        duration: 28000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const doubled = [...newsItems, ...newsItems];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View style={{ height: 300, overflow: 'hidden', position: 'relative' }}>
        <Animated.View style={{ transform: [{ translateY }] }}>
          {doubled.map((item, i) => {
            const tagColor = tagColors[item.tag] ?? '#8899AA';
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
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 12, marginBottom: 8, borderRadius: 16,
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.12)',
    height: 80,
  },
  tag: {
    width: 72, alignItems: 'center', paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, flexShrink: 0,
  },
  tagText: { fontSize: 10, fontWeight: '700' },
  title: { fontSize: 12, fontWeight: '600', color: '#F0EEFF', lineHeight: 17 },
  time: { fontSize: 11, color: '#8899AA', marginTop: 4 },
});

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const onNavigate = (screen: string) => {
    const map: Record<string, string> = {
      signals: 'Signals', traders: 'Traders', portfolio: 'Portfolio',
      profile: 'Profile', pamm: 'PAMM', forum: 'Forum', copytrade: 'CopyTrade',
    };
    if (map[screen]) navigation.navigate(map[screen]);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.username}>{user?.name ?? 'Trader'}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.mpBadge}>
              <Zap size={13} color="#C9A84C" fill="#C9A84C" />
              <Text style={styles.mpText}>0 MP</Text>
            </View>
            <TouchableOpacity style={styles.bellBtn}>
              <Bell size={18} color="#8899AA" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Portfolio Card */}
        <View style={styles.portfolioCard}>
          <Text style={styles.portfolioLabel}>Total Portfolio</Text>
          <Text style={styles.portfolioValue}>$0.00</Text>
          <View style={styles.portfolioChangeRow}>
            <ArrowUpRight size={14} color="#2FEFC4" />
            <Text style={styles.portfolioChange}>--</Text>
            <Text style={styles.portfolioChangeSub}>today</Text>
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
        </View>

        {/* Quick Actions */}
        <QuickActions onNavigate={onNavigate} />

        {/* Markets */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Markets</Text>
          <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
        </View>
        <MarqueeMarkets />

        {/* Latest News */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest News</Text>
          <TouchableOpacity onPress={() => navigation.navigate('News')}>
            <ChevronRight size={18} color="#8899AA" />
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: 24 }}>
          <AnimatedNewsFeed onPress={() => navigation.navigate('News')} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1439' },
  scroll: { paddingBottom: 100 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20,
  },
  greeting: { fontSize: 13, color: '#8899AA', fontWeight: '500' },
  username: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mpBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(201,168,76,0.12)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.35)',
  },
  mpText: { fontSize: 13, fontWeight: '700', color: '#C9A84C' },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  portfolioCard: {
    marginHorizontal: 24, borderRadius: 24, padding: 20,
    backgroundColor: 'rgba(171,75,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.25)',
    marginBottom: 24,
  },
  portfolioLabel: { fontSize: 13, color: 'rgba(240,238,255,0.6)' },
  portfolioValue: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1, marginTop: 4 },
  portfolioChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  portfolioChange: { fontSize: 14, color: '#2FEFC4', fontWeight: '700' },
  portfolioChangeSub: { fontSize: 13, color: 'rgba(240,238,255,0.5)' },
  portfolioStats: { flexDirection: 'row', gap: 24, marginTop: 16 },
  statLabel: { fontSize: 11, color: 'rgba(240,238,255,0.5)', fontWeight: '500' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 2 },

  quickActions: {
    flexDirection: 'row', paddingHorizontal: 24,
    gap: 12, marginBottom: 24,
  },
  actionBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.15)', gap: 4,
  },
  actionBtnGlow: {
    backgroundColor: 'rgba(247,201,72,0.1)',
    borderColor: 'rgba(247,201,72,0.35)',
  },
  actionLabel: { fontSize: 11, color: '#8899AA', fontWeight: '600' },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 24, marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  seeAll: { fontSize: 13, color: '#AB4BFF', fontWeight: '600' },

  marketCard: {
    width: CARD_WIDTH, borderRadius: 20, padding: 14,
    marginRight: CARD_GAP,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.15)',
  },
  marketPair: { fontSize: 13, fontWeight: '700', color: '#fff' },
  marketPrice: { fontSize: 16, fontWeight: '800', color: '#fff', marginTop: 2 },
  marketChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  marketChange: { fontSize: 12, fontWeight: '700' },
});
