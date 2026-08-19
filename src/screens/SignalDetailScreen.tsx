import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Linking, Image, Share,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useCallback, useEffect, useState } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, TrendingUp, TrendingDown, Heart,
  Share2, Zap, Clock, Target, Eye, AlertTriangle, Tag, Gem, User, Lock,
} from 'lucide-react-native';
import { signalsApi, Signal, formatPrice } from '@/api/signals';
import { settingsApi } from '@/api/settings';
import { walletApi } from '@/api/wallet';
import { useCustomAlert } from '@/context/AlertContext';
import { colors, useColors, useTheme, space, radius, typography } from '@/theme';
import { GlassCard } from '@/components';
import SubscribeTraderModal from '@/components/SubscribeTraderModal';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const LIKED_IDS_KEY = 'liked_signal_ids';

async function getLikedIds(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(LIKED_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveLikedIds(ids: number[]) {
  await AsyncStorage.setItem(LIKED_IDS_KEY, JSON.stringify(ids));
}

export default function SignalDetailScreen() {
  const route = useRoute<any>();
  const c = useColors();
  const { isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const alert = useCustomAlert();
  const signalId: number = route.params?.signalId;
  const [signal, setSignal] = useState<Signal | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(0);
  const [tradeUrl, setTradeUrl] = useState('https://www.metatrader5.com/en');
  const [subscribed, setSubscribed] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [subscribeModal, setSubscribeModal] = useState<{ trader: { id: string; name: string; avatar_url: string | null }; price: number } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await signalsApi.getById(signalId);
      const s = res.data;
      setSignal(s);
      setSubscribed(s.is_trader_subscribed ?? false);
      setLocalLikes(s.likes ?? 0);
      const cachedIds = await getLikedIds();
      setLiked(s.is_liked === 1 || cachedIds.includes(signalId));
      signalsApi.click(signalId).catch(() => {});
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Failed to load signal', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [signalId]);

  useEffect(() => {
    settingsApi.getTradeUrl().then(res => {
      if (res.data?.url) setTradeUrl(res.data.url);
    }).catch(() => {});
    walletApi.getBalance().then(res => setWalletBalance(res.data?.balance ?? 0)).catch(() => {});
    loadData();
  }, [loadData]);

  const handleSubscribed = useCallback((traderId: string, newBalance: number) => {
    setSubscribed(true);
    setWalletBalance(newBalance);
  }, []);

  const handleLike = async () => {
    if (!signal) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLocalLikes(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    const cachedIds = await getLikedIds();
    const updated = newLiked
      ? [...cachedIds, signal.id].filter((v, i, a) => a.indexOf(v) === i)
      : cachedIds.filter(id => id !== signal.id);
    await saveLikedIds(updated);
    try {
      if (newLiked) await signalsApi.like(signal.id);
      else await signalsApi.unlike(signal.id);
    } catch {}
  };

  const handleShare = async () => {
    if (!signal) return;
    try {
      await signalsApi.share(signal.id);
      await Share.share({
        message: `${typeof signal.trader_name === 'string' ? signal.trader_name : 'Trader'}: ${pairName} ${typeName}\nEntry: ${formatPrice(signal.open_price, signal.currency)}\nTP: ${formatPrice(signal.take_profit, signal.currency)}\nSL: ${formatPrice(signal.stop_loss, signal.currency)}\n\nFrom Metavest`,
      });
    } catch (e: any) {
      // cancelled or failed — no alert
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <ActivityIndicator size="large" color={c.accent.purple} style={{ marginTop: 200 }} />
      </SafeAreaView>
    );
  }

  if (!signal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <View style={{ marginTop: 200, alignItems: 'center' }}>
          <Text style={{ color: c.text.secondary }}>Signal not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const buy = signal.signal_type === 2 || signal.signal_type === 4 || signal.signal_type === 6;
  const pairName = signal.currency_name ?? `Pair #${signal.currency}`;
  const typeName = signal.signal_type_name ?? 'SIGNAL';
  const rt = signal.risk_reward_ratio;
  const isPaid = (signal.price_value ?? 0) > 0;
  const locked = isPaid && !subscribed;
  const subPrice = (signal.subscription_price ?? 0) > 0 ? (signal.subscription_price ?? 0) : (signal.price_value ?? 0);

  const sensitiveSection = (
    <>
      {/* Price Card */}
      <GlassCard elevation={2} style={styles.priceCard}>
        <View style={styles.priceRow}>
          {[
            { label: 'Entry', value: formatPrice(signal.open_price, signal.currency), color: c.text.primary },
            { label: 'Take Profit', value: formatPrice(signal.take_profit, signal.currency), color: c.semantic.positive },
            { label: 'Stop Loss', value: formatPrice(signal.stop_loss, signal.currency), color: c.semantic.negative },
          ].map((p) => (
            <View key={p.label} style={styles.priceItem}>
              <Text style={[styles.priceLabel, { color: c.text.secondary }]}>{p.label}</Text>
              <Text style={[styles.priceValue, { color: p.color }]}>{p.value}</Text>
            </View>
          ))}
        </View>
      </GlassCard>

      {/* Trading Info */}
      <GlassCard elevation={2} style={styles.infoCard}>
        <Text style={[styles.sectionTitle, { color: c.text.secondary }]}>TRADING INFO</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Target size={14} color={c.accent.purple} />
            <Text style={[styles.metricLabel, { color: c.text.secondary }]}>R:R</Text>
            <Text style={[styles.metricValue, { color: c.accent.purple }]}>{rt ? `1:${rt}` : '-'}</Text>
          </View>
          <View style={styles.metricItem}>
            <Clock size={14} color={c.accent.gold} />
            <Text style={[styles.metricLabel, { color: c.text.secondary }]}>Risk/Trade</Text>
            <Text style={[styles.metricValue, { color: c.text.primary }]}>{signal.risk_per_one_trade ?? '-'}</Text>
          </View>
          <View style={styles.metricItem}>
            {signal.price_value > 0 ? <Gem size={14} color={c.accent.gold} /> : <Tag size={14} color={c.semantic.positive} />}
            <Text style={[styles.metricLabel, { color: c.text.secondary }]}>Price</Text>
            <Text style={[styles.metricValue, { color: signal.price_value > 0 ? c.accent.gold : c.semantic.positive }]}>{signal.price_value > 0 ? 'PAID' : 'FREE'}</Text>
          </View>
        </View>
      </GlassCard>

      {/* Notes */}
      {signal.notes ? (
        <GlassCard elevation={2} style={styles.infoCard}>
          <Text style={[styles.sectionTitle, { color: c.text.secondary }]}>TRADER NOTES</Text>
          <Text style={[styles.notesText, { color: c.text.secondary }]}>{signal.notes}</Text>
        </GlassCard>
      ) : null}
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: c.glass.g2, borderColor: c.glass.border }]}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <View style={[styles.typeBadge,
            buy
              ? { backgroundColor: c.semantic.positive + '20', borderColor: c.semantic.positive + '4D' }
              : { backgroundColor: c.semantic.negative + '20', borderColor: c.semantic.negative + '4D' },
          ]}>
            {buy
              ? <TrendingUp size={14} color={c.semantic.positive} />
              : <TrendingDown size={14} color={c.semantic.negative} />
            }
            <Text style={[styles.typeText, { color: buy ? c.semantic.positive : c.semantic.negative }]}>
              {buy ? 'BUY' : 'SELL'}
            </Text>
          </View>
        </View>

        {/* Trader Info */}
        <View style={styles.traderSection}>
          <View style={[styles.traderAvatar, { backgroundColor: c.glass.g2, borderColor: c.glass.border }]}>
            {signal.trader_avatar_url ? (
              <Image source={{ uri: signal.trader_avatar_url }} style={styles.avatarImg} />
            ) : (
              <User size={22} color={c.accent.purple} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.traderName, { color: c.text.primary }]}>
              {typeof signal.trader_name === 'string' ? signal.trader_name : 'Unknown Trader'}
            </Text>
            <Text style={[styles.traderSignals, { color: c.text.secondary }]}>
              {signal.total_signals ?? 0} signals
            </Text>
          </View>
        </View>

        {/* Pair & Type */}
        <View style={styles.heroSection}>
          <Text style={[styles.pairName, { color: c.text.primary }]}>{pairName}</Text>
          <Text style={[styles.pairType, { color: c.text.secondary }]}>{typeName}</Text>
        </View>

        {locked ? (
          <View style={styles.lockedBox}>
            {sensitiveSection}
            <BlurView
              intensity={isDark ? 25 : 40}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(10,13,22,0.86)' : 'rgba(255,255,255,0.86)' }]} />
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.lockOverlay}
              onPress={() => setSubscribeModal({
                trader: {
                  id: signal.trader_id ?? '',
                  name: signal.trader_name ?? 'Trader',
                  avatar_url: signal.trader_avatar_url ?? null,
                },
                price: subPrice,
              })}
            >
              <View style={styles.lockCircle}>
                <Lock size={18} color={c.accent.gold} />
              </View>
              <Text style={[styles.lockTitle, { color: c.text.primary }]}>Subscribe to unlock</Text>
              <Text style={[styles.lockSubtitle, { color: c.text.secondary }]}>
                {subPrice} MP / month · unlock all paid signals from this trader
              </Text>
              <View style={[styles.subscribeBtn, { backgroundColor: c.accent.purple }]}>
                <Text style={styles.subscribeBtnText}>Subscribe</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          sensitiveSection
        )}

        {/* Engagement */}
        <GlassCard elevation={2} style={styles.infoCard}>
          <Text style={[styles.sectionTitle, { color: c.text.secondary }]}>ENGAGEMENT</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Eye size={14} color={c.text.secondary} />
              <Text style={[styles.metricLabel, { color: c.text.secondary }]}>Clicks</Text>
              <Text style={[styles.metricValue, { color: c.text.primary }]}>{signal.clicks ?? 0}</Text>
            </View>
            <View style={styles.metricItem}>
              <Heart size={14} color={c.semantic.negative} />
              <Text style={[styles.metricLabel, { color: c.text.secondary }]}>Likes</Text>
              <Text style={[styles.metricValue, { color: c.text.primary }]}>{localLikes}</Text>
            </View>
            <View style={styles.metricItem}>
              <Share2 size={14} color={c.text.secondary} />
              <Text style={[styles.metricLabel, { color: c.text.secondary }]}>Shares</Text>
              <Text style={[styles.metricValue, { color: c.text.primary }]}>{signal.shares ?? 0}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Disclaimer */}
        <View style={styles.disclaimerRow}>
          <AlertTriangle size={12} color={c.text.muted} />
          <Text style={[styles.disclaimerText, { color: c.text.muted }]}>Trade at your own risk. This is not financial advice.</Text>
        </View>

        {/* Created date */}
        <Text style={[styles.createdAt, { color: c.text.muted }]}>
          {signal.created_at ? new Date(signal.created_at).toLocaleString() : ''}
        </Text>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomBar, { backgroundColor: c.bg.elevated, borderTopColor: c.glass.borderStrong }]}>
        <TouchableOpacity onPress={handleLike} style={[styles.actionBtn, { backgroundColor: c.glass.g2 }]}>
          <Heart size={20} color={liked ? c.semantic.negative : c.text.secondary} fill={liked ? c.semantic.negative : 'none'} />
          <Text style={[styles.actionText, { color: liked ? c.semantic.negative : c.text.secondary }]}>{liked ? 'Liked' : 'Like'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={[styles.actionBtn, { backgroundColor: c.glass.g2 }]}>
          <Share2 size={20} color={c.text.secondary} />
          <Text style={[styles.actionText, { color: c.text.secondary }]}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL(tradeUrl)} style={[styles.tradeBtn, { backgroundColor: c.accent.gold }]}>
          <Zap size={18} color={c.bg.deep} fill={c.bg.deep} />
          <Text style={[styles.actionText, { color: c.bg.deep }]}>Open MT5</Text>
        </TouchableOpacity>
      </View>

      <SubscribeTraderModal
        visible={subscribeModal !== null}
        trader={subscribeModal?.trader ?? { id: '', name: '', avatar_url: null }}
        price={subscribeModal?.price ?? 0}
        walletBalance={walletBalance}
        onClose={() => setSubscribeModal(null)}
        onSubscribed={handleSubscribed}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 120 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, borderWidth: 1,
  },
  typeText: { fontSize: 14, fontWeight: '800', fontFamily: 'DMSans-Bold' },

  traderSection: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 24, marginTop: 20, marginBottom: 8,
  },
  traderAvatar: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  traderName: { fontSize: 16, fontWeight: '700', fontFamily: 'Manrope-Bold' },
  traderSignals: { fontSize: 12, fontFamily: 'DMSans', marginTop: 2 },

  heroSection: { paddingHorizontal: 24, marginTop: 16, marginBottom: 20 },
  pairName: { fontSize: 36, fontWeight: '800', fontFamily: 'Manrope-Bold', letterSpacing: -1 },
  pairType: { fontSize: 16, fontWeight: '600', fontFamily: 'DMSans-SemiBold', marginTop: 4 },

  priceCard: {
    marginHorizontal: 24, marginBottom: 16, borderRadius: 20, padding: 20,
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceItem: { alignItems: 'center' },
  priceLabel: { fontSize: 11, fontWeight: '600', fontFamily: 'DMSans-SemiBold', marginBottom: 4 },
  priceValue: { fontSize: 16, fontWeight: '800', fontFamily: 'Manrope-Bold' },

  infoCard: {
    marginHorizontal: 24, marginBottom: 16, borderRadius: 20, padding: 16,
  },
  sectionTitle: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 12,
    fontFamily: 'DMSans-Bold', textTransform: 'uppercase',
  },
  metricsRow: { flexDirection: 'row' },
  metricItem: { flex: 1, alignItems: 'center', gap: 4 },
  metricLabel: { fontSize: 10, fontWeight: '600', fontFamily: 'DMSans-SemiBold' },
  metricValue: { fontSize: 15, fontWeight: '700', fontFamily: 'Manrope-Bold', marginTop: 2 },

  notesText: { fontSize: 13, lineHeight: 20, fontFamily: 'DMSans' },

  lockedBox: {
    position: 'relative',
    overflow: 'hidden',
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 20,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.lg,
  },
  lockCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: space.xs,
  },
  lockTitle: { fontSize: 16, fontWeight: '800', fontFamily: 'Manrope-Bold', textAlign: 'center' },
  lockSubtitle: { fontSize: 12, fontFamily: 'DMSans', textAlign: 'center' },
  subscribeBtn: {
    marginTop: space.xs,
    paddingHorizontal: space.lg, paddingVertical: space.sm,
    borderRadius: radius.sm,
  },
  subscribeBtnText: {
    fontSize: 13, fontWeight: '800', color: '#fff', fontFamily: 'Manrope-Bold',
  },

  disclaimerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingHorizontal: 24, marginTop: 8, marginBottom: 8,
  },
  disclaimerText: { fontSize: 11, fontFamily: 'DMSans', textAlign: 'center' },

  createdAt: {
    paddingHorizontal: 24, fontSize: 12, fontFamily: 'DMSans', textAlign: 'center',
    marginBottom: 20,
  },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, paddingBottom: 32,
    borderTopWidth: 1, gap: 10,
  },
  actionBtn: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: 14 },
  tradeBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  actionText: { fontSize: 11, fontWeight: '700', fontFamily: 'DMSans-Bold' },
});
