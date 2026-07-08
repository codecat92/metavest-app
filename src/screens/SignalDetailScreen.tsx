import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Linking
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, TrendingUp, TrendingDown, Heart,
  Share2, Zap, Clock, Target, Eye, ExternalLink, AlertTriangle, Tag, Gem
} from 'lucide-react-native';
import { signalsApi, Signal } from '@/api/signals';
import { settingsApi } from '@/api/settings';
import { useCustomAlert } from '@/context/AlertContext';
import { colors, useColors, space, radius, typography } from '@/theme';
import { GlassCard, Badge, Skeleton } from '@/components';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function SignalDetailScreen() {
  const route = useRoute<any>();
  const colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const alert = useCustomAlert();
  const signalId: number = route.params?.signalId;
  const [signal, setSignal] = useState<Signal | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(0);
  const [executing, setExecuting] = useState(false);
  const [tradeUrl, setTradeUrl] = useState('https://www.metatrader5.com/en');

  useEffect(() => {
    settingsApi.getTradeUrl().then(res => {
      if (res.data?.url) setTradeUrl(res.data.url);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await signalsApi.getById(signalId);
        const s = res.data;
        setSignal(s);
        setLocalLikes(s.likes ?? 0);
        setLiked(s.is_liked === 1);
        // Track click
        signalsApi.click(signalId).catch(() => {});
      } catch (e: any) {
        alert.showAlert({ title: 'Error', message: e.message || 'Failed to load signal', type: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, [signalId]);

  const handleLike = async () => {
    if (!signal) return;
    try {
      if (liked) {
        await signalsApi.unlike(signal.id);
        setLiked(false);
        setLocalLikes(prev => Math.max(0, prev - 1));
      } else {
        await signalsApi.like(signal.id);
        setLiked(true);
        setLocalLikes(prev => prev + 1);
      }
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Failed', type: 'error' });
    }
  };

  const handleShare = async () => {
    if (!signal) return;
    try {
      await signalsApi.share(signal.id);
      alert.showAlert({ title: 'Shared', message: 'Signal shared successfully', type: 'success' });
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Failed', type: 'error' });
    }
  };

  const handleExecute = async () => {
    if (!signal) return;
    setExecuting(true);
    try {
      await signalsApi.execute(signal.id);
      alert.showAlert({ title: 'Executed', message: 'Signal copy trade initiated', type: 'success' });
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Execution failed', type: 'error' });
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.accent.purple} style={{ marginTop: 200 }} />
      </SafeAreaView>
    );
  }

  if (!signal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]} edges={['top']}>
        <View style={{ marginTop: 200, alignItems: 'center' }}>
          <Text style={{ color: colors.text.secondary }}>Signal not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const buy = signal.signal_type === 2 || signal.signal_type === 4 || signal.signal_type === 6;
  const pairName = signal.currency_name ?? `Pair #${signal.currency}`;
  const typeName = signal.signal_type_name ?? 'SIGNAL';
  const rt = signal.risk_reward_ratio;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.glass.g2, borderColor: colors.glass.border }]}>
            <ArrowLeft size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          <View style={[styles.typeBadge, {
            backgroundColor: buy ? 'rgba(47,239,196,0.12)' : 'rgba(255,75,110,0.12)',
            borderColor: buy ? 'rgba(47,239,196,0.3)' : 'rgba(255,75,110,0.3)',
          }]}>
            {buy
              ? <TrendingUp size={14} color={colors.semantic.positive} />
              : <TrendingDown size={14} color={colors.semantic.negative} />
            }
            <Text style={[styles.typeText, { color: buy ? colors.semantic.positive : colors.semantic.negative }]}>
              {buy ? 'BUY' : 'SELL'}
            </Text>
          </View>
        </View>

        {/* Pair & Type */}
        <View style={styles.heroSection}>
          <Text style={[styles.pairName, { color: colors.text.primary }]}>{pairName}</Text>
          <Text style={[styles.pairType, { color: colors.text.secondary }]}>{typeName}</Text>
        </View>

        {/* Price Card */}
        <View style={[styles.priceCard, { backgroundColor: colors.accent.purple, borderColor: 'rgba(124,58,237,0.40)' }]}>
          <View style={styles.priceRow}>
            {[
              { label: 'Entry', value: signal.open_price ?? '-', color: '#FFFFFF' },
              { label: 'Take Profit', value: signal.take_profit ?? '-', color: colors.semantic.positive },
              { label: 'Stop Loss', value: signal.stop_loss ?? '-', color: colors.semantic.negative },
            ].map((p) => (
              <View key={p.label} style={styles.priceItem}>
                <Text style={[styles.priceLabel, { color: 'rgba(255,255,255,0.80)' }]}>{p.label}</Text>
                <Text style={[styles.priceValue, { color: p.color }]}>{p.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { icon: Target, label: 'Risk/Reward', value: rt ? `1:${rt}` : '-', color: colors.accent.purple },
            { icon: AlertTriangle, label: 'Disclaimer', value: 'Trade at your own risk', color: colors.semantic.warning },
            { icon: Eye, label: 'Clicks', value: String(signal.clicks ?? 0), color: colors.text.secondary },
            { icon: Heart, label: 'Likes', value: String(localLikes), color: colors.semantic.negative },
            { icon: Share2, label: 'Shares', value: String(signal.shares ?? 0), color: colors.text.secondary },
            { icon: Clock, label: 'Risk/Trade', value: signal.risk_per_one_trade ?? '-', color: '#F7C948' },
            { icon: signal.price_value > 0 ? Gem : Tag, label: 'Price', value: signal.price_value > 0 ? 'PAID' : 'FREE', color: signal.price_value > 0 ? colors.accent.gold : colors.semantic.positive },
          ].map((s) => (
            <View key={s.label} style={[styles.statItem, { backgroundColor: colors.glass.g2, borderColor: colors.glass.border }]}>
              <s.icon size={14} color={s.color} />
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>{s.label}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* Notes */}
        {signal.notes ? (
          <View style={styles.notesSection}>
            <Text style={[styles.notesTitle, { color: colors.text.primary }]}>Trader Notes</Text>
            <View style={[styles.notesCard, { backgroundColor: colors.glass.g2, borderColor: colors.glass.border }]}>
              <Text style={[styles.notesText, { color: colors.text.secondary }]}>{signal.notes}</Text>
            </View>
          </View>
        ) : null}

        {/* Created date */}
        <Text style={styles.createdAt}>
          {signal.created_at ? new Date(signal.created_at).toLocaleString() : ''}
        </Text>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomBar, { backgroundColor: colors.glass.g3, borderTopColor: colors.glass.borderStrong }]}>
        <TouchableOpacity onPress={handleLike} style={[styles.actionBtn, { backgroundColor: colors.glass.g2 }]}>
          <Heart size={20} color={liked ? colors.semantic.negative : colors.text.secondary} fill={liked ? colors.semantic.negative : 'none'} />
          <Text style={[styles.actionText, liked && { color: colors.semantic.negative }, !liked && { color: colors.text.secondary }]}>
            {liked ? 'Liked' : 'Like'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={[styles.actionBtn, { backgroundColor: colors.glass.g2 }]}>
          <Share2 size={20} color={colors.text.secondary} />
          <Text style={[styles.actionText, { color: colors.text.secondary }]}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => Linking.openURL(tradeUrl)}
          style={[styles.actionBtn, { backgroundColor: colors.accent.gold }]}
        >
          <ExternalLink size={16} color="#1A1A2E" />
          <Text style={[styles.actionText, { color: '#1A1A2E' }]}>Trade Now</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleExecute}
          style={styles.executeBtn}
          disabled={executing}
        >
          {executing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Zap size={18} color="#fff" fill="#fff" />
              <Text style={styles.executeText}>Copy Trade</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      </SafeAreaView>
    );
  }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { paddingBottom: 120 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 14, borderWidth: 1,
  },
  typeText: { fontSize: 14, fontWeight: '800' },

  heroSection: { paddingHorizontal: 24, marginTop: 20, marginBottom: 20 },
  pairName: { fontSize: 36, fontWeight: '800', color: colors.text.primary, letterSpacing: -1 },
  pairType: { fontSize: 16, color: colors.text.secondary, marginTop: 4, fontWeight: '600' },

  priceCard: {
    marginHorizontal: 24, padding: 20, borderRadius: 22,
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
    marginBottom: 20,
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceItem: { alignItems: 'center' },
  priceLabel: { fontSize: 11, color: colors.text.secondary, fontWeight: '600', marginBottom: 4 },
  priceValue: { fontSize: 16, fontWeight: '800' },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 24, marginBottom: 20,
  },
  statItem: {
    width: '47%', padding: 14, borderRadius: 16,
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.12)',
    gap: 4,
  },
  statLabel: { fontSize: 10, color: colors.text.secondary, fontWeight: '500' },
  statValue: { fontSize: 16, fontWeight: '800', marginTop: 2 },

  notesSection: { paddingHorizontal: 24, marginBottom: 20 },
  notesTitle: { fontSize: 14, fontWeight: '700', color: colors.text.primary, marginBottom: 10 },
  notesCard: {
    padding: 16, borderRadius: 18,
    backgroundColor: 'rgba(171,75,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.15)',
  },
  notesText: { fontSize: 13, color: 'rgba(240,238,255,0.7)', lineHeight: 20 },

  createdAt: {
    paddingHorizontal: 24, fontSize: 12, color: colors.text.secondary, textAlign: 'center',
  },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 36,
    backgroundColor: 'rgba(14,20,57,0.95)',
    borderTopWidth: 1, borderTopColor: 'rgba(171,75,255,0.15)',
    gap: 10,
  },
  actionBtn: {
    flex: 1, alignItems: 'center', gap: 4,
    paddingVertical: 10, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  actionText: { fontSize: 11, fontWeight: '700', color: colors.text.secondary },
  executeBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
    backgroundColor: colors.accent.purple,
  },
  executeText: { fontSize: 14, fontWeight: '800', color: colors.text.primary },
});
