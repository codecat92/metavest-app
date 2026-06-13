import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, PanResponder, useWindowDimensions
} from 'react-native';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Rect, Text as SvgText } from 'react-native-svg';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react-native';
import { forexApi } from '../api/forex';
import { colors, space, radius, typography } from '../theme';
import { GlassCard, Skeleton } from '../components';
import type { RootStackParamList } from '../types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF', 'USD/NZD'];
const INTERVALS = [
  { label: '1D', value: '1day' },
  { label: '1W', value: '1week' },
  { label: '1M', value: '1month' },
  { label: '3M', value: '3month' },
  { label: '1Y', value: '1year' },
];

const CHART_PADDING = { L: 8, R: 8, T: 12, B: 24 };

type MarketProps = NativeStackScreenProps<RootStackParamList, 'Market'>;

export default function MarketScreen({ navigation }: MarketProps) {
  const { width: screenWidth } = useWindowDimensions();
  const chartW = screenWidth - space['2xl'] * 2 - space.md * 2;
  const chartH = 200;
  const cw = chartW - CHART_PADDING.L - CHART_PADDING.R;
  const ch = chartH - CHART_PADDING.T - CHART_PADDING.B;

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

      setChartData(points.slice(-60));
    } catch (e) {
      console.log('Market load failed:', e);
    } finally {
      setLoading(false);
    }
  }, [pair, interval]);

  useFocusEffect(
    useCallback(() => { loadData(); }, [loadData])
  );

  const up = change >= 0;
  const accent = up ? colors.semantic.positive : colors.semantic.negative;

  const points = chartData.length > 0
    ? (() => {
        const vals = chartData.map(d => d.y);
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const range = max - min || 1;
        return chartData.map((d, i) => ({
          x: CHART_PADDING.L + (i / Math.max(chartData.length - 1, 1)) * cw,
          y: CHART_PADDING.T + ch - ((d.y - min) / range) * ch,
          price: d.y,
          time: d.time,
        }));
      })()
    : [];

  const linePath = points.length > 0
    ? points.reduce((acc, p, i) => i === 0 ? `M${p.x},${p.y}` : `${acc} L${p.x},${p.y}`, '')
    : '';
  const areaPath = points.length > 0 ? `${linePath} L${points[points.length-1].x},${CHART_PADDING.T+ch} L${CHART_PADDING.L},${CHART_PADDING.T+ch} Z` : '';

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      const touchX = Math.max(CHART_PADDING.L, Math.min(CHART_PADDING.L + cw, gesture.x0 + gesture.dx));
      const idx = Math.round(((touchX - CHART_PADDING.L) / cw) * Math.max(points.length - 1, 0));
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h2, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
            Market
          </Text>
        </View>

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
          <View style={{ paddingHorizontal: space['2xl'], marginTop: space['3xl'] }}>
            <Skeleton height={200} borderRadius={radius.lg} style={{ marginBottom: space.lg }} />
            <Skeleton height={40} width="60%" style={{ marginBottom: space.md }} />
            <Skeleton height={14} width="40%" />
          </View>
        ) : (
          <>
            <View style={styles.priceSection}>
              <View>
                <Text style={[typography.caption, { color: colors.text.secondary, fontWeight: '600' }]}>
                  {pair}
                </Text>
                <Text style={[typography.h1, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
                  {price?.toFixed(4) ?? '-.--'}
                </Text>
              </View>
              <View style={styles.changeCol}>
                <View style={styles.changeRow}>
                  {up ? <TrendingUp size={18} color={accent} /> : <TrendingDown size={18} color={accent} />}
                  <Text style={[typography.h3, { color: accent, fontFamily: 'DMSans-Bold' }]}>
                    {change.toFixed(4)}
                  </Text>
                </View>
                <Text style={[typography.caption, { color: accent, fontWeight: '700' }]}>
                  {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                </Text>
              </View>
            </View>

            <View style={styles.chartWrap} {...panResponder.panHandlers}>
              <Svg width={chartW} height={chartH}>
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
                    <Line x1={tooltip.x} y1={CHART_PADDING.T} x2={tooltip.x} y2={CHART_PADDING.T + ch} stroke={accent} strokeWidth="1" strokeDasharray="4,4" />
                    <Rect x={tooltip.x - 40} y={CHART_PADDING.T - 4} width={80} height={18} rx={6} fill="rgba(14,20,57,0.9)" />
                    <SvgText x={tooltip.x} y={CHART_PADDING.T + 9} fontSize="10" fill={accent} textAnchor="middle" fontWeight="700">
                      {tooltip.price.toFixed(4)}
                    </SvgText>
                    <SvgText x={tooltip.x} y={CHART_PADDING.T + ch + 14} fontSize="9" fill={colors.text.secondary} textAnchor="middle">
                      {tooltip.time?.slice(0, 16) ?? ''}
                    </SvgText>
                  </>
                )}
              </Svg>
            </View>

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

            <View style={styles.statsGrid}>
              {[
                { label: 'Open', value: o.toFixed(4), color: colors.text.primary },
                { label: 'High', value: h.toFixed(4), color: colors.semantic.positive },
                { label: 'Low', value: l.toFixed(4), color: colors.semantic.negative },
                { label: 'Close', value: c.toFixed(4), color: accent },
              ].map(s => (
                <View key={s.label} style={styles.statItem}>
                  <Text style={[typography.label, { color: colors.text.secondary }]}>
                    {s.label}
                  </Text>
                  <Text style={[typography.captionBold, { color: s.color, marginTop: space.xs, fontFamily: 'SpaceGrotesk-Bold' }]}>
                    {s.value}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { paddingBottom: space['3xl'] },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: space.lg,
    paddingHorizontal: space['2xl'], paddingTop: space.lg, paddingBottom: space.lg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
  },

  selectorScroll: { maxHeight: 40, marginBottom: space.lg },
  selectorRow: { flexDirection: 'row', paddingHorizontal: space['2xl'], gap: space.sm },
  pairBtn: {
    paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.sm,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
  },
  pairBtnActive: { backgroundColor: colors.accent.purple, borderColor: colors.accent.purple },
  pairBtnText: { fontSize: 12, fontWeight: '700', color: colors.text.secondary, fontFamily: 'DMSans-Bold' },
  pairBtnTextActive: { color: colors.text.primary },

  priceSection: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: space['2xl'], marginBottom: space.lg,
  },
  changeCol: { alignItems: 'flex-end' },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },

  chartWrap: {
    marginHorizontal: space['2xl'], borderRadius: radius.lg, overflow: 'hidden', marginBottom: space.md,
    backgroundColor: colors.glass.g2,
    borderWidth: 1, borderColor: colors.glass.border,
    padding: space.md, alignItems: 'center',
  },

  tfRow: {
    flexDirection: 'row', paddingHorizontal: space['2xl'], gap: space.sm, marginBottom: space.xl,
  },
  tfBtn: {
    flex: 1, paddingVertical: space.sm, borderRadius: radius.sm, alignItems: 'center',
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
  },
  tfBtnActive: { backgroundColor: 'rgba(139,92,246,0.25)', borderColor: 'rgba(139,92,246,0.5)' },
  tfText: { fontSize: 12, fontWeight: '700', color: colors.text.secondary, fontFamily: 'DMSans-Bold' },
  tfTextActive: { color: colors.accent.purple },

  statsGrid: {
    flexDirection: 'row', gap: space.sm, paddingHorizontal: space['2xl'], marginBottom: space['2xl'],
  },
  statItem: {
    flex: 1, padding: space.md, borderRadius: radius.md, alignItems: 'center',
    backgroundColor: colors.glass.g2,
    borderWidth: 1, borderColor: colors.glass.border,
  },
});
