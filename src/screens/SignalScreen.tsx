import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Linking, Image,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  Filter, Search, TrendingUp, TrendingDown,
  Clock, Copy, ExternalLink, AlertTriangle, Tag, Gem, Plus, List,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signalsApi, Signal } from '@/api/signals';
import { settingsApi } from '@/api/settings';
import { getToken, BASE_URL } from '@/api/client';
import { colors, useColors, space, radius, typography } from '@/theme';
import { GlassCard, Badge, EmptyState, Skeleton } from '@/components';
import { useAuth } from '@/context/AuthContext';
import type { RootStackParamList, TabParamList } from '@/types/navigation';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type SignalNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Signals'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type TabFilter = 'all' | 'buy' | 'sell';

const STORAGE_HOST = BASE_URL.replace(/\/api$/, '');

const getCurrencyBadge = (currencyName: string): { label: string; isGold: boolean } => {
  const base = currencyName.split('/')[0]?.toUpperCase() ?? '';
  if (base === 'XAU') return { label: 'GOLD', isGold: true };
  return { label: base, isGold: false };
};

export default function SignalScreen() {
  const navigation = useNavigation<SignalNavProp>();
  const colors = useColors();
  const { userType } = useAuth();
  const isTrader = userType === 'trader';
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [tradeUrl, setTradeUrl] = useState('https://www.metatrader5.com/en');

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
      settingsApi.getTradeUrl().then(res => {
        if (res.data?.url) setTradeUrl(res.data.url);
      }).catch(() => {});
    }, [loadSignals])
  );

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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]} edges={['top']}>
        <EmptyState
          icon={<Search size={40} color={colors.text.secondary} />}
          title="Login to see signals"
          subtitle="Sign in to access trading signals"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={[typography.h2, { color: colors.text.primary, fontFamily: 'Manrope-Bold' }]}>
              Signals
            </Text>
            <Text style={[typography.caption, { color: colors.text.secondary }]}>
              Live trading intelligence
            </Text>
          </View>
          <View style={styles.headerBtns}>
            {isTrader && (
              <TouchableOpacity style={[styles.iconBtn, { width: 'auto', paddingHorizontal: space.md }]} onPress={() => navigation.navigate('MySignals')}>
                <List size={14} color={colors.accent.purple} />
                <Text style={[typography.label, { color: colors.accent.purple, marginLeft: 4 }]}>My Signals</Text>
              </TouchableOpacity>
            )}
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
              const pairName = signal.currency_name ?? `Pair #${signal.currency}`;
              const typeName = signal.signal_type_name ?? 'SIGNAL';
              const rr = signal.risk_reward_ratio;
              const currencyBadge = getCurrencyBadge(pairName);

              return (
                <TouchableOpacity
                  key={signal.id}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('SignalDetail', { signalId: signal.id })}
                  style={[styles.cardOuter, { backgroundColor: colors.glass.g2, borderColor: colors.glass.borderStrong }, expanded && { borderColor: colors.glass.borderStrong }]}
                >
                  <View style={styles.cardInner}>
                    <View style={styles.traderRow}>
                      {signal.trader_avatar_url ? (
                        <Image
                          source={{ uri: signal.trader_avatar_url.startsWith('http') ? signal.trader_avatar_url : `${STORAGE_HOST}/uploads/profilepic/${signal.trader_avatar_url.split(/[\\/]/).pop()}` }}
                          style={{ width: 40, height: 40, borderRadius: 20 }}
                        />
                      ) : (
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarText}>
                            {signal.trader_name?.charAt(0).toUpperCase() ?? signal.trader_id?.substring(0, 2).toUpperCase() ?? 'TR'}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.bodyBold, { color: colors.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                          {typeName}
                        </Text>
                        <Text style={[typography.caption, { color: colors.text.secondary }]}>
                          {signal.trader_name ?? 'Trader'}
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
                        <View style={styles.pairLabelRow}>
                          <Text style={[typography.label, { color: colors.text.secondary }]}>
                            TRADING PAIR
                          </Text>
                          <Text style={[styles.pairBadge, {
                            backgroundColor: currencyBadge.isGold ? 'rgba(245,158,11,0.15)' : 'rgba(139,92,246,0.12)',
                            borderColor: currencyBadge.isGold ? 'rgba(245,158,11,0.30)' : 'rgba(139,92,246,0.25)',
                            color: currencyBadge.isGold ? colors.accent.gold : colors.accent.purple,
                          }]}>
                            {currencyBadge.isGold ? 'GOLD' : currencyBadge.label}
                          </Text>
                        </View>
                        <Text style={[typography.priceSmall, { color: colors.text.primary, fontFamily: 'Manrope-Bold' }]}>
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
                        <Copy size={12} color={colors.text.secondary} />
                        <Text style={[typography.label, { color: colors.text.secondary }]}>
                          {signal.signal_execution || 0} copied
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        {signal.price_value > 0 ? (
                          <Gem size={12} color={colors.accent.gold} />
                        ) : (
                          <Tag size={12} color={colors.semantic.positive} />
                        )}
                        <Text style={[typography.label, {
                          color: signal.price_value > 0 ? colors.accent.gold : colors.semantic.positive,
                          fontWeight: '600',
                        }]}>
                          {signal.price_value > 0 ? 'PAID' : 'FREE'}
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
                            { label: 'R:R', value: rr ? `1:${rr}` : '-' },
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

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.xl }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={12} color={colors.semantic.warning} />
                        <Text style={[typography.label, { color: colors.semantic.warning }]}>
                          Trade at your own risk
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => Linking.openURL(tradeUrl)}
                        activeOpacity={0.8}
                        style={{
                          flexDirection: 'row', alignItems: 'center', gap: 6,
                          backgroundColor: colors.accent.gold,
                          paddingHorizontal: space.md, paddingVertical: space.sm,
                          borderRadius: radius.sm,
                        }}
                      >
                        <ExternalLink size={13} color="#1A1A2E" />
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#1A1A2E', fontFamily: 'Manrope-Bold' }}>
                          Trade Now
                        </Text>
                      </TouchableOpacity>
                    </View>
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

      {isTrader && (
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateSignal', {})}
          activeOpacity={0.85}
          style={[styles.fab, { backgroundColor: colors.accent.purple }]}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { },

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
  avatarText: { fontSize: 12, fontWeight: '800', color: '#fff', fontFamily: 'Manrope-Bold' },

  pairRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: space.md },
  pairLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  pairBadge: {
    fontSize: 9, fontWeight: '800',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, borderWidth: 1,
    marginLeft: space.sm, overflow: 'hidden',
    fontFamily: 'Manrope-Bold',
  },

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

  fab: {
    position: 'absolute', bottom: 28, right: space['2xl'],
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
});
