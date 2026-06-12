import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  Filter, Search, TrendingUp, TrendingDown,
  Clock, Shield, Copy, Eye
} from 'lucide-react-native';
import { signalsApi, Signal } from '../api/signals';
import { getToken } from '../api/client';

const currencyNames: Record<number, string> = {
  1: 'EUR/USD', 2: 'XAU/USD', 3: 'GBP/USD', 4: 'USD/JPY',
  5: 'AUD/USD', 6: 'USD/CAD', 7: 'XAG/USD', 8: 'GBP/JPY',
  9: 'NZD/USD', 10: 'USD/CHF', 11: 'EUR/GBP',
};

const signalTypeNames: Record<number, string> = {
  1: 'SELL LIMIT', 2: 'BUY LIMIT', 3: 'SELL ORDER',
  4: 'BUY ORDER', 5: 'SELL STOP', 6: 'BUY STOP',
};

const riskColor: Record<string, string> = {
  Low: '#2FEFC4', Medium: '#F7C948', High: '#FF4B6E',
};

type TabFilter = 'all' | 'buy' | 'sell';

export default function SignalScreen() {
  const navigation = useNavigation<any>();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadSignals = useCallback(async () => {
    try {
      const tok = getToken();
      if (!tok) {
        Alert.alert('Debug', 'Token is NULL — not logged in yet');
        setLoading(false);
        return;
      }
      const response = await signalsApi.getAll(1);
      const arr = response.data ?? [];
      setSignals(arr);
      if (arr.length === 0) {
        Alert.alert('Debug', 'API returned: count=' + (response.data_count ?? '?') + ', data=' + JSON.stringify(arr));
      }
    } catch (e: any) {
      Alert.alert('Debug', 'Error: ' + (e?.message ?? String(e)));
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
    return t === 2 || t === 4 || t === 6; // BUY LIMIT, BUY ORDER, BUY STOP
  };

  const filtered = signals.filter((s) => {
    if (activeTab === 'buy') return isBuy(s);
    if (activeTab === 'sell') return !isBuy(s);
    return true;
  });

  if (!getToken()) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Search size={40} color="#8899AA" />
          <Text style={styles.emptyText}>Login to see signals</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Signals</Text>
            <Text style={styles.subtitle}>Live trading intelligence</Text>
          </View>
          <View style={styles.headerBtns}>
            <TouchableOpacity style={styles.iconBtn}>
              <Search size={16} color="#8899AA" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Filter size={16} color="#8899AA" />
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
          <ActivityIndicator size="large" color="#AB4BFF" style={{ marginTop: 60 }} />
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
                  style={[styles.card, expanded && styles.cardExpanded]}
                >
                  <View style={styles.cardInner}>
                    <View style={styles.traderRow}>
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                          {signal.trader_id?.substring(0, 2).toUpperCase() ?? 'TR'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.traderName}>{typeName}</Text>
                        <Text style={styles.traderAccuracy}>{pairName}</Text>
                      </View>
                      <View style={[styles.typeBadge, {
                        backgroundColor: buy ? 'rgba(47,239,196,0.12)' : 'rgba(255,75,110,0.12)',
                        borderColor: buy ? 'rgba(47,239,196,0.3)' : 'rgba(255,75,110,0.3)',
                      }]}>
                        {buy
                          ? <TrendingUp size={13} color="#2FEFC4" />
                          : <TrendingDown size={13} color="#FF4B6E" />
                        }
                        <Text style={[styles.typeText, { color: buy ? '#2FEFC4' : '#FF4B6E' }]}>
                          {buy ? 'BUY' : 'SELL'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.pairRow}>
                      <View>
                        <Text style={styles.pairLabel}>TRADING PAIR</Text>
                        <Text style={styles.pairValue}>{pairName}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.pairLabel}>TYPE</Text>
                        <Text style={styles.confidenceValue}>{typeName}</Text>
                      </View>
                    </View>

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Clock size={12} color="#8899AA" />
                        <Text style={styles.metaText}>{signal.created_at ? new Date(signal.created_at).toLocaleDateString() : 'Recent'}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Shield size={12} color={riskColor[risk]} />
                        <Text style={[styles.metaText, { color: riskColor[risk], fontWeight: '600' }]}>
                          {risk} Risk
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Copy size={12} color="#8899AA" />
                        <Text style={styles.metaText}>{signal.signal_execution} copied</Text>
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
                              <Text style={styles.expandedLabel}>{item.label}</Text>
                              <Text style={styles.expandedValue}>{item.value}</Text>
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
                    <Text style={styles.expandToggleText}>
                      {expanded ? 'Show less' : 'View details'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
            {filtered.length === 0 && !loading && (
              <Text style={{ color: '#8899AA', textAlign: 'center', marginTop: 40 }}>
                No signals found
              </Text>
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1439' },
  scroll: { paddingBottom: 100 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 200 },
  emptyText: { fontSize: 14, color: '#8899AA', marginTop: 12 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 13, color: '#8899AA', marginTop: 2 },
  headerBtns: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  tabContainer: {
    flexDirection: 'row', marginHorizontal: 24, marginBottom: 20,
    padding: 4, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.15)',
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#AB4BFF' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#8899AA' },
  tabTextActive: { color: '#fff' },

  cardList: { paddingHorizontal: 24, gap: 16 },
  card: {
    borderRadius: 24, overflow: 'hidden',
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.15)',
  },
  cardExpanded: { borderColor: 'rgba(171,75,255,0.5)' },
  cardInner: { padding: 20 },

  traderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#AB4BFF',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  traderName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  traderAccuracy: { fontSize: 11, color: '#8899AA' },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1,
  },
  typeText: { fontSize: 13, fontWeight: '800' },

  pairRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  pairLabel: { fontSize: 11, color: '#8899AA', fontWeight: '500' },
  pairValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
  confidenceValue: { fontSize: 13, fontWeight: '800', color: '#AB4BFF', maxWidth: 120, textAlign: 'right' },

  metaRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#8899AA' },

  expandedSection: {
    marginTop: 16, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: 'rgba(171,75,255,0.15)',
  },
  expandedStats: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12,
  },
  expandedLabel: { fontSize: 10, color: '#8899AA', fontWeight: '500' },
  expandedValue: { fontSize: 14, fontWeight: '700', color: '#fff', marginTop: 2 },
  notes: {
    fontSize: 12, color: '#8899AA', marginTop: 8,
    padding: 10, backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
  },

  expandToggle: {
    paddingVertical: 10, alignItems: 'center',
    backgroundColor: 'rgba(171,75,255,0.06)',
    borderTopWidth: 1, borderTopColor: 'rgba(171,75,255,0.1)',
  },
  expandToggleText: { fontSize: 12, fontWeight: '600', color: '#AB4BFF' },
});
