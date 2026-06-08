import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity
} from 'react-native';
import { useState } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg';

const chartData = [
  { date: "Jan", value: 14200 },
  { date: "Feb", value: 15800 },
  { date: "Mar", value: 13900 },
  { date: "Apr", value: 17400 },
  { date: "May", value: 20100 },
  { date: "Jun", value: 19200 },
  { date: "Jul", value: 22400 },
  { date: "Aug", value: 24810 },
];

const holdings = [
  { name: "Euro / US Dollar", symbol: "EUR/USD", amount: "2.5 Lots", value: "$12,208", change: "+0.32%", up: true, pct: 49 },
  { name: "Gold / US Dollar", symbol: "XAU/USD", amount: "1.2 Lots", value: "$7,576", change: "-0.45%", up: false, pct: 30.5 },
  { name: "British Pound / USD", symbol: "GBP/USD", amount: "1.8 Lots", value: "$4,980", change: "+0.18%", up: true, pct: 20.5 },
];

const pieColors = ["#AB4BFF", "#F7C948", "#2FEFC4"];

const activeFollows = [
  { trader: "AlphaWave", avatar: "AW", pnl: "+$1,240", pct: "+14.2%", up: true },
  { trader: "TradeMind", avatar: "TM", pnl: "+$680", pct: "+8.9%", up: true },
  { trader: "FX Sentinel", avatar: "FS", pnl: "-$120", pct: "-1.2%", up: false },
];

const periods = ["1W", "1M", "3M", "6M", "1Y", "ALL"];

function PortfolioChart() {
  const width = 340;
  const height = 160;
  const padL = 40;
  const padB = 24;
  const padT = 8;
  const padR = 8;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const min = Math.min(...chartData.map(d => d.value));
  const max = Math.max(...chartData.map(d => d.value));
  const range = max - min;

  const points = chartData.map((d, i) => ({
    x: padL + (i / (chartData.length - 1)) * chartW,
    y: padT + chartH - ((d.value - min) / range) * chartH,
    date: d.date,
    value: d.value,
  }));

  const linePath = points.reduce((acc, p, i) =>
    i === 0 ? `M${p.x.toFixed(1)},${p.y.toFixed(1)}`
            : `${acc} L${p.x.toFixed(1)},${p.y.toFixed(1)}`, '');

  const areaPath = `${linePath} L${points[points.length-1].x},${padT + chartH} L${padL},${padT + chartH} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#AB4BFF" stopOpacity="0.4" />
          <Stop offset="100%" stopColor="#AB4BFF" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill="url(#portfolioGrad)" />
      <Path d={linePath} stroke="#AB4BFF" strokeWidth="2" fill="none" />
      {points.map((p, i) => (
        <SvgText key={i} x={p.x} y={height - 6} fontSize="9" fill="#8899AA" textAnchor="middle">
          {p.date}
        </SvgText>
      ))}
    </Svg>
  );
}

export default function PortfolioScreen() {
  const [activePeriod, setActivePeriod] = useState("ALL");

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Portfolio</Text>
          <Text style={styles.subtitle}>Your performance overview</Text>
        </View>

        {/* Total Value */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total Value</Text>
          <Text style={styles.totalValue}>$24,810</Text>
          <View style={styles.changeRow}>
            <ArrowUpRight size={16} color="#2FEFC4" />
            <Text style={styles.changeText}>+$10,610</Text>
            <View style={styles.changeBadge}>
              <Text style={styles.changeBadgeText}>+74.5%</Text>
            </View>
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.periodRow}>
          {periods.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setActivePeriod(p)}
              style={[styles.periodBtn, activePeriod === p && styles.periodBtnActive]}
            >
              <Text style={[styles.periodText, activePeriod === p && styles.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <PortfolioChart />
        </View>

        {/* Holdings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Holdings</Text>
          <View style={styles.holdingsList}>
            {holdings.map((h, i) => (
              <View key={h.symbol} style={styles.holdingCard}>
                <View style={[styles.symbolBox, {
                  backgroundColor: `${pieColors[i]}25`,
                  borderColor: pieColors[i],
                }]}>
                  <Text style={[styles.symbolTop, { color: pieColors[i] }]}>
                    {h.symbol.split('/')[0]}
                  </Text>
                  <Text style={[styles.symbolBot, { color: `${pieColors[i]}99` }]}>
                    {h.symbol.split('/')[1]}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.holdingName}>{h.name}</Text>
                  <Text style={styles.holdingAmount}>{h.amount}</Text>
                  <View style={styles.holdingBar}>
                    <View style={[styles.holdingBarFill, {
                      width: `${h.pct}%` as any,
                      backgroundColor: pieColors[i],
                    }]} />
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.holdingValue}>{h.value}</Text>
                  <View style={styles.holdingChangeRow}>
                    {h.up
                      ? <ArrowUpRight size={11} color="#2FEFC4" />
                      : <ArrowDownRight size={11} color="#FF4B6E" />
                    }
                    <Text style={[styles.holdingChange, { color: h.up ? "#2FEFC4" : "#FF4B6E" }]}>
                      {h.change}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Active Follows */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Follows</Text>
          <View style={styles.holdingsList}>
            {activeFollows.map((f) => (
              <View key={f.trader} style={styles.followCard}>
                <View style={styles.followAvatar}>
                  <Text style={styles.followAvatarText}>{f.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.followName}>{f.trader}</Text>
                  <View style={styles.followStatusRow}>
                    {f.up
                      ? <TrendingUp size={11} color="#2FEFC4" />
                      : <TrendingDown size={11} color="#FF4B6E" />
                    }
                    <Text style={[styles.followStatus, { color: f.up ? "#2FEFC4" : "#FF4B6E" }]}>
                      Copy Trading Active
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.followPnl, { color: f.up ? "#2FEFC4" : "#FF4B6E" }]}>{f.pnl}</Text>
                  <Text style={[styles.followPct, { color: f.up ? "#2FEFC4" : "#FF4B6E" }]}>{f.pct}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Performance Analytics */}
        <View style={[styles.section, { marginBottom: 0 }]}>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>Performance Analytics</Text>
            <View style={styles.analyticsGrid}>
              {[
                { label: "Best Month", value: "+38.7%", color: "#2FEFC4" },
                { label: "Win Rate", value: "74%", color: "#AB4BFF" },
                { label: "Avg Trade", value: "+2.3%", color: "#2FEFC4" },
                { label: "Max Drawdown", value: "-8.4%", color: "#FF4B6E" },
                { label: "Sharpe Ratio", value: "1.84", color: "#F7C948" },
                { label: "Total Trades", value: "142", color: "#AB4BFF" },
              ].map((stat) => (
                <View key={stat.label} style={styles.analyticsItem}>
                  <Text style={styles.analyticsLabel}>{stat.label}</Text>
                  <Text style={[styles.analyticsValue, { color: stat.color }]}>{stat.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1439' },
  scroll: { paddingBottom: 100 },

  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 13, color: '#8899AA', marginTop: 2 },

  totalSection: { paddingHorizontal: 24, paddingVertical: 16 },
  totalLabel: { fontSize: 13, color: '#8899AA', fontWeight: '500' },
  totalValue: { fontSize: 40, fontWeight: '800', color: '#fff', letterSpacing: -1, marginTop: 4 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  changeText: { fontSize: 15, color: '#2FEFC4', fontWeight: '700' },
  changeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: 'rgba(47,239,196,0.12)' },
  changeBadgeText: { fontSize: 13, color: '#2FEFC4', fontWeight: '700' },

  periodRow: {
    flexDirection: 'row', marginHorizontal: 24, marginBottom: 8,
    padding: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  periodBtn: { flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  periodBtnActive: { backgroundColor: '#AB4BFF' },
  periodText: { fontSize: 12, fontWeight: '700', color: '#8899AA' },
  periodTextActive: { color: '#fff' },

  chartContainer: { paddingHorizontal: 24, marginBottom: 24 },

  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },

  holdingsList: { gap: 12 },
  holdingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    borderRadius: 18, backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.12)',
  },
  symbolBox: {
    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  symbolTop: { fontSize: 11, fontWeight: '800', letterSpacing: -0.5 },
  symbolBot: { fontSize: 9 },
  holdingName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  holdingAmount: { fontSize: 12, color: '#8899AA' },
  holdingBar: {
    height: 3, borderRadius: 2, marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  holdingBarFill: { height: '100%', borderRadius: 2 },
  holdingValue: { fontSize: 14, fontWeight: '700', color: '#fff' },
  holdingChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  holdingChange: { fontSize: 12, fontWeight: '700' },

  followCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    borderRadius: 18, backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.12)',
  },
  followAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#AB4BFF', alignItems: 'center', justifyContent: 'center',
  },
  followAvatarText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  followName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  followStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  followStatus: { fontSize: 12, fontWeight: '600' },
  followPnl: { fontSize: 15, fontWeight: '800' },
  followPct: { fontSize: 12, fontWeight: '600' },

  analyticsCard: {
    padding: 20, borderRadius: 24,
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.15)',
  },
  analyticsTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 16 },
  analyticsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  analyticsItem: {
    width: '47%', padding: 12, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.1)',
  },
  analyticsLabel: { fontSize: 11, color: '#8899AA', fontWeight: '500' },
  analyticsValue: { fontSize: 18, fontWeight: '800', marginTop: 4 },
});