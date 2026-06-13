import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  Filter, Search, TrendingUp, TrendingDown,
  Clock, Shield, Copy, Eye
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signalsApi, Signal } from '@/api/signals';
import { getToken } from '@/api/client';
import { colors, space, radius, typography } from '@/theme';
import { GlassCard, Badge, EmptyState, Skeleton } from '@/components';
import type { RootStackParamList, TabParamList } from '@/types/navigation';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type SignalNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Signals'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const currencyNames: Record<number, string> = {
  1: 'EUR/USD', 2: 'XAU/USD', 3: 'GBP/USD', 4: 'USD/JPY',
  5: 'AUD/USD', 6: 'USD/CAD', 7: 'XAG/USD', 8: 'GBP/JPY',
  9: 'NZD/USD', 10: 'USD/CHF', 11: 'EUR/GBP',
};

const signalTypeNames: Record<number, string> = {
  1: 'SELL LIMIT', 2: 'BUY LIMIT', 3: 'SELL ORDER',
  4: 'BUY ORDER', 5: 'SELL STOP', 6: 'BUY STOP',
};

type TabFilter = 'all' | 'buy' | 'sell';

export default function SignalScreen() {
  const navigation = useNavigation<SignalNavProp>();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadSignals = useCallback(async () => {
    try {
      const tok = getToken();
      if (!tok) {
        setLoading(false);
        return;
      }
      const response = await signalsApi.getAll(1);
      setSignals(response.data ?? []);
    } catch (e) {
      console.log('Signal load failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadSignals();
    }, [loadSignals])
  );

  const riskFromSignal = (s: Signal): string => {
    const r = parseFloat(s.risk_per_one_trade ?? '0');
    if (r <= 0.5) return 'Low';
    if (r <= 1) return 'Medium';
    return 'High';
  };

  const isBuy = (s: Signal): boolean => {
    const t = s.signal_type;
    return t === 2 || t === 4 || t === 6;
  };

  const filtered = signals.filter((s) => {
    if (activeTab === 'buy') return isBuy(s);
    if (activeTab === 'sell') return !isBuy(s);
    return true;
  });

  if (!getToken()) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <EmptyState
          icon={<Search size={40} color={colors.text.secondary} />}
          title="Login to see signals"
          subtitle="Sign in to access trading signals"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={[typography.h2, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
              Signals
            </Text>
            <Text style={[typography.caption, { color: colors.text.secondary }]}>
              Live trading intelligence
            </Text>
          </View>
          <View style={styles.headerBtns}>
            <TouchableOpacity style={styles.iconBtn}>
              <Search size={16} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Filter size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabContainer}>
          {(['all', 'buy', 'sell'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'all' ? 'All Signals' : tab === 'buy' ? 'Buy' : 'Sell'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={{ paddingHorizontal: space['2xl'], gap: space.lg }}>
            {[1, 2, 3].map(i => (
              <View key={i} style={{ borderRadius: radius.lg, overflow: 'hidden' }}>
                <GlassCard elevation={2} noPadding>
                  <View style={{ padding: space.xl }}>
                    <Skeleton height={40} width={40} borderRadius={20} style={{ marginBottom: space.md }} />
                    <Skeleton height={18} width="70%" style={{ marginBottom: space.sm }} />
                    <Skeleton height={14} width="40%" style={{ marginBottom: space.lg }} />
                    <Skeleton height={14} width="100%" />
                  </View>
                </GlassCard>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.cardList}>
            {filtered.map((signal) => {
              const expanded = expandedId === signal.id;
              const buy = isBuy(signal);
              const pairName = currencyNames[signal.currency] ?? `Pair #${signal.currency}`;
              const typeName = signalTypeNames[signal.signal_type] ?? 'SIGNAL';
              const risk = riskFromSignal(signal);

              return (
                <TouchableOpacity
                  key={signal.id}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('SignalDetail', { signalId: signal.id })}
                  style={[styles.cardOuter, expanded && { borderColor: colors.glass.borderStrong }]}
                >
                  <View style={styles.cardInner}>
                    <View style={styles.traderRow}>
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                          {signal.trader_id?.substring(0, 2).toUpperCase() ?? 'TR'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.bodyBold, { color: colors.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                          {typeName}
                        </Text>
                        <Text style={[typography.caption, { color: colors.text.secondary }]}>
                          {pairName}
                        </Text>
                      </View>
                      <Badge
                        label={buy ? 'BUY' : 'SELL'}
                        variant={buy ? 'success' : 'danger'}
                        icon={buy
                          ? <TrendingUp size={13} color={colors.semantic.positive} />
                          : <TrendingDown size={13} color={colors.semantic.negative} />
                        }
                      />
                    </View>

                    <View style={styles.pairRow}>
                      <View>
                        <Text style={[typography.label, { color: colors.text.secondary }]}>
                          TRADING PAIR
                        </Text>
                        <Text style={[typography.priceSmall, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
                          {pairName}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[typography.label, { color: colors.text.secondary }]}>
                          TYPE
                        </Text>
                        <Text style={[typography.captionBold, { color: colors.accent.purple, fontFamily: 'DMSans-Bold' }]}>
                          {typeName}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Clock size={12} color={colors.text.secondary} />
                        <Text style={[typography.label, { color: colors.text.secondary }]}>
                          {signal.created_at ? new Date(signal.created_at).toLocaleDateString() : 'Recent'}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Shield size={12} color={
                          risk === 'Low' ? colors.semantic.positive :
                          risk === 'Medium' ? colors.semantic.warning : colors.semantic.negative
                        } />
                        <Text style={[typography.label, {
                          color: risk === 'Low' ? colors.semantic.positive :
                                 risk === 'Medium' ? colors.semantic.warning : colors.semantic.negative,
                          fontWeight: '600',
                        }]}>
                          {risk} Risk
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Copy size={12} color={colors.text.secondary} />
                        <Text style={[typography.label, { color: colors.text.secondary }]}>
                          {signal.signal_execution || 0} copied
                        </Text>
                      </View>
                    </View>

                    {expanded && (
                      <View style={styles.expandedSection}>
                        <View style={styles.expandedStats}>
                          {[
                            { label: 'Entry', value: signal.open_price ?? '-' },
                            { label: 'Take Profit', value: signal.take_profit ?? '-' },
                            { label: 'Stop Loss', value: signal.stop_loss ?? '-' },
                            { label: 'R:R', value: signal.potential_profit ? `1:${signal.potential_profit}` : '-' },
                          ].map((item) => (
                            <View key={item.label} style={{ alignItems: 'center' }}>
                              <Text style={[typography.label, { color: colors.text.secondary }]}>
                                {item.label}
                              </Text>
                              <Text style={[typography.bodyBold, { color: colors.text.primary, marginTop: 2, fontFamily: 'DMSans-Bold' }]}>
                                {item.value}
                              </Text>
                            </View>
                          ))}
                        </View>
                        {signal.notes ? (
                          <Text style={styles.notes}>{signal.notes}</Text>
                        ) : null}
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => setExpandedId(expanded ? null : signal.id)}
                    style={styles.expandToggle}
                  >
                    <Text style={[typography.caption, { color: colors.accent.purple, fontWeight: '600' }]}>
                      {expanded ? 'Show less' : 'View details'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
            {filtered.length === 0 && !loading && (
              <EmptyState
                icon={<Search size={40} color={colors.text.secondary} />}
                title="No signals found"
                subtitle="Check back later for new trading signals"
              />
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { paddingBottom: 100 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: space['2xl'], paddingTop: space.xl, paddingBottom: space.xl,
  },
  headerBtns: { flexDirection: 'row', gap: space.sm },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
  },

  tabContainer: {
    flexDirection: 'row', marginHorizontal: space['2xl'], marginBottom: space.xl,
    padding: space.xs, borderRadius: radius.md,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
  },
  tab: { flex: 1, paddingVertical: space.sm, borderRadius: radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: colors.accent.purple },
  tabText: { fontSize: 13, fontWeight: '700', color: colors.text.secondary, fontFamily: 'DMSans-Bold' },
  tabTextActive: { color: colors.text.primary },

  cardList: { paddingHorizontal: space['2xl'], gap: space.lg },
  cardOuter: {
    borderRadius: radius.xl, overflow: 'hidden',
    backgroundColor: colors.glass.g2,
    borderWidth: 1, borderColor: colors.glass.border,
  },
  cardInner: { padding: space.xl },

  traderRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.lg },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.accent.purple,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: '800', color: '#fff', fontFamily: 'SpaceGrotesk-Bold' },

  pairRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: space.md },

  metaRow: { flexDirection: 'row', gap: space.md, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: space.xs },

  expandedSection: {
    marginTop: space.lg, paddingTop: space.lg,
    borderTopWidth: 1, borderTopColor: colors.glass.border,
  },
  expandedStats: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.md,
  },
  notes: {
    fontSize: 12, color: colors.text.secondary, marginTop: space.sm,
    padding: space.sm, backgroundColor: colors.glass.g1,
    borderRadius: radius.sm, fontFamily: 'DMSans',
  },

  expandToggle: {
    paddingVertical: space.sm, alignItems: 'center',
    backgroundColor: 'rgba(139,92,246,0.06)',
    borderTopWidth: 1, borderTopColor: colors.glass.border,
  },
});
