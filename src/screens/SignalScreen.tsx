import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity
} from 'react-native';
import { useState } from 'react';
import {
  Filter, Search, TrendingUp, TrendingDown,
  Clock, Shield, Users, Copy, Eye
} from 'lucide-react-native';

const signals = [
  {
    id: 1, trader: "AlphaWave", avatar: "AW",
    pair: "EUR/USD", type: "BUY", confidence: 87,
    accuracy: "78%", risk: "Medium", timeAgo: "12 min ago",
    entry: "1.0842", target: "1.0920", stopLoss: "1.0790",
    followers: 1240, rr: "2.1",
  },
  {
    id: 2, trader: "TradeMind", avatar: "TM",
    pair: "GBP/USD", type: "BUY", confidence: 92,
    accuracy: "71%", risk: "Low", timeAgo: "28 min ago",
    entry: "1.2680", target: "1.2780", stopLoss: "1.2620",
    followers: 876, rr: "2.4",
  },
  {
    id: 3, trader: "FX Sentinel", avatar: "FS",
    pair: "XAU/USD", type: "SELL", confidence: 74,
    accuracy: "83%", risk: "High", timeAgo: "1h ago",
    entry: "2,342.50", target: "2,290.00", stopLoss: "2,375.00",
    followers: 2140, rr: "2.5",
  },
  {
    id: 4, trader: "PipMaster", avatar: "PM",
    pair: "USD/JPY", type: "BUY", confidence: 68,
    accuracy: "65%", risk: "Medium", timeAgo: "2h ago",
    entry: "157.20", target: "158.80", stopLoss: "156.40",
    followers: 534, rr: "2.3",
  },
];

const riskColor: Record<string, string> = {
  Low: "#2FEFC4", Medium: "#F7C948", High: "#FF4B6E",
};

export default function SignalScreen() {
  const [activeTab, setActiveTab] = useState<"all" | "buy" | "sell">("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = signals.filter((s) => {
    if (activeTab === "buy") return s.type === "BUY";
    if (activeTab === "sell") return s.type === "SELL";
    return true;
  });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
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

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {(['all', 'buy', 'sell'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'all' ? 'All Signals' : tab === 'buy' ? '🟢 Buy' : '🔴 Sell'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Signal Cards */}
        <View style={styles.cardList}>
          {filtered.map((signal) => {
            const expanded = expandedId === signal.id;
            const isBuy = signal.type === "BUY";
            return (
              <View
                key={signal.id}
                style={[styles.card, expanded && styles.cardExpanded]}
              >
                {/* Card Top */}
                <View style={styles.cardInner}>

                  {/* Trader row */}
                  <View style={styles.traderRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{signal.avatar}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.traderName}>{signal.trader}</Text>
                      <Text style={styles.traderAccuracy}>Accuracy: {signal.accuracy}</Text>
                    </View>
                    <View style={[styles.typeBadge, {
                      backgroundColor: isBuy ? "rgba(47,239,196,0.12)" : "rgba(255,75,110,0.12)",
                      borderColor: isBuy ? "rgba(47,239,196,0.3)" : "rgba(255,75,110,0.3)",
                    }]}>
                      {isBuy
                        ? <TrendingUp size={13} color="#2FEFC4" />
                        : <TrendingDown size={13} color="#FF4B6E" />
                      }
                      <Text style={[styles.typeText, { color: isBuy ? "#2FEFC4" : "#FF4B6E" }]}>
                        {signal.type}
                      </Text>
                    </View>
                  </View>

                  {/* Pair + Confidence */}
                  <View style={styles.pairRow}>
                    <View>
                      <Text style={styles.pairLabel}>TRADING PAIR</Text>
                      <Text style={styles.pairValue}>{signal.pair}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.pairLabel}>CONFIDENCE</Text>
                      <Text style={styles.confidenceValue}>{signal.confidence}%</Text>
                    </View>
                  </View>

                  {/* Confidence bar */}
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${signal.confidence}%` as any }]} />
                  </View>

                  {/* Meta row */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Clock size={12} color="#8899AA" />
                      <Text style={styles.metaText}>{signal.timeAgo}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Shield size={12} color={riskColor[signal.risk]} />
                      <Text style={[styles.metaText, { color: riskColor[signal.risk], fontWeight: '600' }]}>
                        {signal.risk} Risk
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Users size={12} color="#8899AA" />
                      <Text style={styles.metaText}>{signal.followers.toLocaleString()} following</Text>
                    </View>
                  </View>

                  {/* Expanded */}
                  {expanded && (
                    <View style={styles.expandedSection}>
                      <View style={styles.expandedStats}>
                        {[
                          { label: "Entry", value: signal.entry },
                          { label: "Target", value: signal.target },
                          { label: "Stop Loss", value: signal.stopLoss },
                          { label: "R:R", value: `1:${signal.rr}` },
                        ].map((item) => (
                          <View key={item.label} style={{ alignItems: 'center' }}>
                            <Text style={styles.expandedLabel}>{item.label}</Text>
                            <Text style={styles.expandedValue}>{item.value}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Action buttons */}
                      <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionBtnSecondary}>
                          <Eye size={14} color="#8899AA" />
                          <Text style={styles.actionBtnSecondaryText}>View</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtnSecondary}>
                          <Users size={14} color="#8899AA" />
                          <Text style={styles.actionBtnSecondaryText}>Follow</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtnPrimary}>
                          <Copy size={14} color="#fff" />
                          <Text style={styles.actionBtnPrimaryText}>Copy</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>

                {/* Expand toggle */}
                <TouchableOpacity
                  onPress={() => setExpandedId(expanded ? null : signal.id)}
                  style={styles.expandToggle}
                >
                  <Text style={styles.expandToggleText}>
                    {expanded ? "Show less ▲" : "View details ▼"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
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
  confidenceValue: { fontSize: 22, fontWeight: '800', color: '#AB4BFF' },

  barBg: {
    height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
  },
  barFill: {
    height: '100%', borderRadius: 3,
    backgroundColor: '#AB4BFF',
  },

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

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtnSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
  },
  actionBtnSecondaryText: { fontSize: 13, fontWeight: '600', color: '#8899AA' },
  actionBtnPrimary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 14,
    backgroundColor: '#AB4BFF',
  },
  actionBtnPrimaryText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  expandToggle: {
    paddingVertical: 10, alignItems: 'center',
    backgroundColor: 'rgba(171,75,255,0.06)',
    borderTopWidth: 1, borderTopColor: 'rgba(171,75,255,0.1)',
  },
  expandToggleText: { fontSize: 12, fontWeight: '600', color: '#AB4BFF' },
});