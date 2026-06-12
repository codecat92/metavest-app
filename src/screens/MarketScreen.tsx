import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, PanResponder
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Rect, Text as SvgText } from 'react-native-svg';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react-native';
import { forexApi } from '../api/forex';

const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF', 'USD/NZD'];
const INTERVALS = [
  { label: '1D', value: '1day' },
  { label: '1W', value: '1week' },
  { label: '1M', value: '1month' },
  { label: '3M', value: '3month' },
  { label: '1Y', value: '1year' },
];

export default function MarketScreen({ navigation }: any) {
  const [pair, setPair] = useState('EUR/USD');
  const [interval, setInterval] = useState('1day');
  const [price, setPrice] = useState<number | null>(null);
  const [change, setChange] = useState<number>(0);
  const [changePct, setChangePct] = useState<number>(0);
  const [chartData, setChartData] = useState<{ x: number; y: number; time: string }[]>([]);
  const [o, setO] = useState(0);
  const [h, setH] = useState(0);
  const [l, setL] = useState(0);
  const [c, setC] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; price: number; time: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setTooltip(null);
    try {
      const [quote, ts] = await Promise.all([
        forexApi.getPrice(pair),
        forexApi.getTimeSeries(pair, interval),
      ]);
      setPrice(Number(quote.close ?? 0));
      setChange(Number(quote.change ?? 0));
      setChangePct(Number(quote.percent_change ?? 0));
      setO(Number(quote.open ?? 0));
      setH(Number(quote.high ?? 0));
      setL(Number(quote.low ?? 0));
      setC(Number(quote.close ?? 0));

      const values = ts?.values ?? [];
      const points = values.map((v: any, i: number) => ({
        x: i,
        y: Number(v.close ?? 0),
        time: v.datetime ?? '',
      })).filter((p: any) => !isNaN(p.y) && p.y > 0);

      setChartData(points.slice(-60)); // last 60 candles max
    } catch (e) {
      console.log('Market load failed:', e);
    } finally {
      setLoading(false);
    }
  }, [pair, interval]);

  useFocusEffect(
    useCallback(() => { loadData(); }, [loadData])
  );

  // Chart dimensions
  const W = 340; const H = 200;
  const padL = 8; const padR = 8; const padT = 12; const padB = 24;
  const cw = W - padL - padR; const ch = H - padT - padB;

  const up = change >= 0;
  const accent = up ? '#2FEFC4' : '#FF4B6E';

  // Compute chart path
  const points = chartData.length > 0
    ? (() => {
        const vals = chartData.map(d => d.y);
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const range = max - min || 1;
        return chartData.map((d, i) => ({
          x: padL + (i / Math.max(chartData.length - 1, 1)) * cw,
          y: padT + ch - ((d.y - min) / range) * ch,
          price: d.y,
          time: d.time,
        }));
      })()
    : [];

  const linePath = points.length > 0
    ? points.reduce((acc, p, i) => i === 0 ? `M${p.x},${p.y}` : `${acc} L${p.x},${p.y}`, '')
    : '';
  const areaPath = points.length > 0 ? `${linePath} L${points[points.length-1].x},${padT+ch} L${padL},${padT+ch} Z` : '';

  // PanResponder for crosshair
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      const touchX = Math.max(padL, Math.min(padL + cw, gesture.x0 + gesture.dx));
      const idx = Math.round(((touchX - padL) / cw) * Math.max(points.length - 1, 0));
      if (points[idx]) {
        setTooltip({
          x: points[idx].x,
          y: points[idx].y,
          price: points[idx].price,
          time: points[idx].time,
        });
      }
    },
    onPanResponderRelease: () => setTooltip(null),
    onPanResponderTerminate: () => setTooltip(null),
  })).current;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#8899AA" />
          </TouchableOpacity>
          <Text style={styles.title}>Market</Text>
        </View>

        {/* Pair Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
          <View style={styles.selectorRow}>
            {PAIRS.map(p => (
              <TouchableOpacity
                key={p}
                onPress={() => setPair(p)}
                style={[styles.pairBtn, pair === p && styles.pairBtnActive]}
              >
                <Text style={[styles.pairBtnText, pair === p && styles.pairBtnTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color="#AB4BFF" style={{ marginTop: 80 }} />
        ) : (
          <>
            {/* Price Header */}
            <View style={styles.priceSection}>
              <View>
                <Text style={styles.pairLabel}>{pair}</Text>
                <Text style={styles.priceValue}>{price?.toFixed(4) ?? '-.--'}</Text>
              </View>
              <View style={styles.changeCol}>
                <View style={styles.changeRow}>
                  {up ? <TrendingUp size={18} color={accent} /> : <TrendingDown size={18} color={accent} />}
                  <Text style={[styles.changeText, { color: accent }]}>{change.toFixed(4)}</Text>
                </View>
                <Text style={[styles.changePct, { color: accent }]}>{changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%</Text>
              </View>
            </View>

            {/* Chart */}
            <View style={styles.chartWrap} {...panResponder.panHandlers}>
              <Svg width={W} height={H}>
                <Defs>
                  <LinearGradient id="mktGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={accent} stopOpacity="0.35" />
                    <Stop offset="100%" stopColor={accent} stopOpacity="0" />
                  </LinearGradient>
                </Defs>
                {areaPath ? <Path d={areaPath} fill="url(#mktGrad)" /> : null}
                {linePath ? <Path d={linePath} stroke={accent} strokeWidth="2" fill="none" /> : null}
                {tooltip && (
                  <>
                    <Line x1={tooltip.x} y1={padT} x2={tooltip.x} y2={padT + ch} stroke={accent} strokeWidth="1" strokeDasharray="4,4" />
                    <Rect x={tooltip.x - 40} y={padT - 4} width={80} height={18} rx={6} fill="rgba(14,20,57,0.9)" />
                    <SvgText x={tooltip.x} y={padT + 9} fontSize="10" fill={accent} textAnchor="middle" fontWeight="700">
                      {tooltip.price.toFixed(4)}
                    </SvgText>
                    <SvgText x={tooltip.x} y={padT + ch + 14} fontSize="9" fill="#8899AA" textAnchor="middle">
                      {tooltip.time?.slice(0, 16) ?? ''}
                    </SvgText>
                  </>
                )}
              </Svg>
            </View>

            {/* Timeframe */}
            <View style={styles.tfRow}>
              {INTERVALS.map(tf => (
                <TouchableOpacity
                  key={tf.value}
                  onPress={() => setInterval(tf.value)}
                  style={[styles.tfBtn, interval === tf.value && styles.tfBtnActive]}
                >
                  <Text style={[styles.tfText, interval === tf.value && styles.tfTextActive]}>{tf.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {[
                { label: 'Open', value: o.toFixed(4), color: '#fff' },
                { label: 'High', value: h.toFixed(4), color: '#2FEFC4' },
                { label: 'Low', value: l.toFixed(4), color: '#FF4B6E' },
                { label: 'Close', value: c.toFixed(4), color: accent },
              ].map(s => (
                <View key={s.label} style={styles.statItem}>
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1439' },
  scroll: { paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },

  selectorScroll: { maxHeight: 40, marginBottom: 16 },
  selectorRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 8 },
  pairBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.15)',
  },
  pairBtnActive: { backgroundColor: '#AB4BFF', borderColor: '#AB4BFF' },
  pairBtnText: { fontSize: 12, fontWeight: '700', color: '#8899AA' },
  pairBtnTextActive: { color: '#fff' },

  priceSection: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 24, marginBottom: 16,
  },
  pairLabel: { fontSize: 13, color: '#8899AA', fontWeight: '600' },
  priceValue: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  changeCol: { alignItems: 'flex-end' },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  changeText: { fontSize: 18, fontWeight: '700' },
  changePct: { fontSize: 13, fontWeight: '700', marginTop: 2 },

  chartWrap: {
    marginHorizontal: 24, borderRadius: 20, overflow: 'hidden', marginBottom: 12,
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.12)',
    padding: 12, alignItems: 'center',
  },

  tfRow: {
    flexDirection: 'row', paddingHorizontal: 24, gap: 8, marginBottom: 20,
  },
  tfBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.15)',
  },
  tfBtnActive: { backgroundColor: 'rgba(171,75,255,0.25)', borderColor: 'rgba(171,75,255,0.5)' },
  tfText: { fontSize: 12, fontWeight: '700', color: '#8899AA' },
  tfTextActive: { color: '#AB4BFF' },

  statsGrid: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 24, marginBottom: 24,
  },
  statItem: {
    flex: 1, padding: 12, borderRadius: 14, alignItems: 'center',
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.12)',
  },
  statLabel: { fontSize: 10, color: '#8899AA', fontWeight: '600' },
  statValue: { fontSize: 13, fontWeight: '800', marginTop: 4 },
});
