import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  ArrowLeft, TrendingUp, TrendingDown, Heart,
  Share2, Zap, Clock, Shield, Target, Eye
} from 'lucide-react-native';
import { signalsApi, Signal } from '../api/signals';
import { useCustomAlert } from '../context/AlertContext';

const currencyNames: Record<number, string> = {
  1: 'EUR/USD', 2: 'XAU/USD', 3: 'GBP/USD', 4: 'USD/JPY',
  5: 'AUD/USD', 6: 'USD/CAD', 7: 'XAG/USD', 8: 'GBP/JPY',
  9: 'NZD/USD', 10: 'USD/CHF', 11: 'EUR/GBP',
};

const signalTypeNames: Record<number, string> = {
  1: 'SELL LIMIT', 2: 'BUY LIMIT', 3: 'SELL ORDER',
  4: 'BUY ORDER', 5: 'SELL STOP', 6: 'BUY STOP',
};

export default function SignalDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const alert = useCustomAlert();
  const signalId: number = route.params?.signalId;
  const [signal, setSignal] = useState<Signal | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(0);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await signalsApi.getById(signalId);
        const s = res.data;
        setSignal(s);
        setLocalLikes(s.likes ?? 0);
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#AB4BFF" style={{ marginTop: 200 }} />
      </View>
    );
  }

  if (!signal) {
    return (
      <View style={styles.container}>
        <View style={{ marginTop: 200, alignItems: 'center' }}>
          <Text style={{ color: '#8899AA' }}>Signal not found</Text>
        </View>
      </View>
    );
  }

  const buy = signal.signal_type === 2 || signal.signal_type === 4 || signal.signal_type === 6;
  const pairName = currencyNames[signal.currency] ?? `Pair #${signal.currency}`;
  const typeName = signalTypeNames[signal.signal_type] ?? 'SIGNAL';
  const risk = parseFloat(signal.risk_per_one_trade ?? '0') <= 0.5 ? 'Low'
    : parseFloat(signal.risk_per_one_trade ?? '0') <= 1 ? 'Medium' : 'High';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#8899AA" />
          </TouchableOpacity>
          <View style={[styles.typeBadge, {
            backgroundColor: buy ? 'rgba(47,239,196,0.12)' : 'rgba(255,75,110,0.12)',
            borderColor: buy ? 'rgba(47,239,196,0.3)' : 'rgba(255,75,110,0.3)',
          }]}>
            {buy
              ? <TrendingUp size={14} color="#2FEFC4" />
              : <TrendingDown size={14} color="#FF4B6E" />
            }
            <Text style={[styles.typeText, { color: buy ? '#2FEFC4' : '#FF4B6E' }]}>
              {buy ? 'BUY' : 'SELL'}
            </Text>
          </View>
        </View>

        {/* Pair & Type */}
        <View style={styles.heroSection}>
          <Text style={styles.pairName}>{pairName}</Text>
          <Text style={styles.pairType}>{typeName}</Text>
        </View>

        {/* Price Card */}
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            {[
              { label: 'Entry', value: signal.open_price ?? '-', color: '#fff' },
              { label: 'Take Profit', value: signal.take_profit ?? '-', color: '#2FEFC4' },
              { label: 'Stop Loss', value: signal.stop_loss ?? '-', color: '#FF4B6E' },
            ].map((p) => (
              <View key={p.label} style={styles.priceItem}>
                <Text style={styles.priceLabel}>{p.label}</Text>
                <Text style={[styles.priceValue, { color: p.color }]}>{p.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { icon: Target, label: 'Risk/Reward', value: signal.potential_profit ? `1:${signal.potential_profit}` : '-', color: '#AB4BFF' },
            { icon: Shield, label: 'Risk Level', value: risk, color: risk === 'Low' ? '#2FEFC4' : risk === 'Medium' ? '#F7C948' : '#FF4B6E' },
            { icon: Eye, label: 'Clicks', value: String(signal.clicks ?? 0), color: '#8899AA' },
            { icon: Heart, label: 'Likes', value: String(localLikes), color: '#FF4B6E' },
            { icon: Share2, label: 'Shares', value: String(signal.shares ?? 0), color: '#8899AA' },
            { icon: Clock, label: 'Risk/Trade', value: `${signal.risk_per_one_trade ?? '-'}%`, color: '#F7C948' },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <s.icon size={14} color={s.color} />
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* Notes */}
        {signal.notes ? (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Trader Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{signal.notes}</Text>
            </View>
          </View>
        ) : null}

        {/* Created date */}
        <Text style={styles.createdAt}>
          {signal.created_at ? new Date(signal.created_at).toLocaleString() : ''}
        </Text>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
          <Heart size={20} color={liked ? '#FF4B6E' : '#8899AA'} fill={liked ? '#FF4B6E' : 'none'} />
          <Text style={[styles.actionText, liked && { color: '#FF4B6E' }]}>
            {liked ? 'Liked' : 'Like'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
          <Share2 size={20} color="#8899AA" />
          <Text style={styles.actionText}>Share</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1439' },
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
  pairName: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  pairType: { fontSize: 16, color: '#8899AA', marginTop: 4, fontWeight: '600' },

  priceCard: {
    marginHorizontal: 24, padding: 20, borderRadius: 22,
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
    marginBottom: 20,
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceItem: { alignItems: 'center' },
  priceLabel: { fontSize: 11, color: '#8899AA', fontWeight: '600', marginBottom: 4 },
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
  statLabel: { fontSize: 10, color: '#8899AA', fontWeight: '500' },
  statValue: { fontSize: 16, fontWeight: '800', marginTop: 2 },

  notesSection: { paddingHorizontal: 24, marginBottom: 20 },
  notesTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 10 },
  notesCard: {
    padding: 16, borderRadius: 18,
    backgroundColor: 'rgba(171,75,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.15)',
  },
  notesText: { fontSize: 13, color: 'rgba(240,238,255,0.7)', lineHeight: 20 },

  createdAt: {
    paddingHorizontal: 24, fontSize: 12, color: '#8899AA', textAlign: 'center',
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
  actionText: { fontSize: 11, fontWeight: '700', color: '#8899AA' },
  executeBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#AB4BFF',
  },
  executeText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
