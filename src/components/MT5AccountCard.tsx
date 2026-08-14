import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TrendingUp, Shield, Users, BarChart2, Link, Activity } from 'lucide-react-native';
import { useColors, useTheme, space, radius } from '@/theme';
import GlassCard from './GlassCard';

// Palet khusus light mode — dark mode tetap memakai theme default.
const LIGHT = {
  cardBg: '#F2ECFF',
  cardBorder: 'rgba(139,92,246,0.35)',
  innerBorder: 'rgba(139,92,246,0.28)',
  divider: 'rgba(139,92,246,0.20)',
  tileBg: '#FFFFFF',
  gold: '#A97E2B',
};

interface MT5AccountCardProps {
  connected: boolean;
  mt5Data?: any;
  serviceError?: string | null;
  followingCount: number | null;
  onConnectPress: () => void;
  onCardPress?: () => void;
}

function formatCurrency(val: number): string {
  return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatProfit(val: number): { text: string; isPositive: boolean } {
  const abs = Math.abs(val);
  const text = (val >= 0 ? '+' : '-') + '$' + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return { text, isPositive: val >= 0 };
}

function StatColumn({
  icon: Icon,
  value,
  label,
  color,
  bordered,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  value: string;
  label: string;
  color: string;
  bordered?: boolean;
}) {
  const c = useColors();
  const { isDark } = useTheme();
  return (
    <View
      style={[
        cardStyles.statColumn,
        bordered && {
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: isDark ? c.glass.border : LIGHT.divider,
        },
      ]}
    >
      <Icon size={16} color={color} />
      <Text style={[cardStyles.statValue, { color: c.text.primary }]}>{value}</Text>
      <Text style={[cardStyles.statLabel, { color: c.text.secondary }]}>{label}</Text>
    </View>
  );
}

function MetricTile({
  icon: Icon,
  iconColor,
  label,
  value,
  valueColor,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  iconColor: string;
  label: string;
  value: string;
  valueColor: string;
}) {
  const c = useColors();
  const { isDark } = useTheme();
  return (
    <View
      style={[
        cardStyles.tile,
        {
          backgroundColor: isDark ? c.glass.g1 : LIGHT.tileBg,
          borderColor: isDark ? c.glass.borderStrong : LIGHT.innerBorder,
        },
      ]}
    >
      <View style={cardStyles.tileHeader}>
        <Icon size={14} color={iconColor} />
        <Text style={[cardStyles.tileLabel, { color: c.text.secondary }]}>{label}</Text>
      </View>
      <Text style={[cardStyles.tileValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

export default function MT5AccountCard({
  connected,
  mt5Data,
  serviceError,
  followingCount,
  onConnectPress,
  onCardPress,
}: MT5AccountCardProps) {
  const c = useColors();
  const { isDark } = useTheme();

  const followingVal = followingCount !== null ? `${followingCount} Traders` : '--';
  const openPosVal = mt5Data?.active_positions != null ? String(mt5Data.active_positions) : '--';
  const gold = isDark ? c.accent.gold : LIGHT.gold;

  return (
    <TouchableOpacity onPress={onCardPress} activeOpacity={connected ? 0.9 : 1} disabled={!connected}>
    <GlassCard
      elevation={3}
      style={{
        borderRadius: 20,
        padding: 22,
        borderColor: isDark ? c.glass.border : LIGHT.cardBorder,
        backgroundColor: isDark ? undefined : LIGHT.cardBg,
        marginHorizontal: space['2xl'],
        marginBottom: space['2xl'],
      }}
    >
      {/* ── EYEBROW ROW ── */}
      <View style={cardStyles.eyebrow}>
        <Text style={[cardStyles.eyebrowText, { color: gold }]}>MT5 ACCOUNT</Text>
        {connected && mt5Data?.server ? (
          <View
            style={[
              cardStyles.pill,
              {
                backgroundColor: isDark ? c.glass.g1 : LIGHT.tileBg,
                borderColor: isDark ? c.glass.borderStrong : LIGHT.innerBorder,
              },
            ]}
          >
            <Text style={[cardStyles.pillText, { color: c.text.secondary }]}>{mt5Data.server}</Text>
          </View>
        ) : null}
      </View>

      {/* ── EQUITY HERO ── */}
      <View style={[cardStyles.hero, { borderBottomColor: isDark ? c.glass.border : LIGHT.divider }]}>
        {connected && serviceError ? (
          <View style={cardStyles.ctaArea}>
            <Text style={[cardStyles.ctaTitle, { color: c.semantic.negative }]}>
              Layanan Tidak Tersedia
            </Text>
            <Text style={[cardStyles.ctaSubtitle, { color: c.text.muted, textAlign: 'center' }]}>
              {serviceError}
            </Text>
          </View>
        ) : connected ? (
          <>
            <Text style={[cardStyles.equityValue, { color: c.text.primary }]}>
              {mt5Data?.equity != null ? formatCurrency(mt5Data.equity) : '--'}
            </Text>
            <Text style={[cardStyles.equityLabel, { color: c.text.secondary }]}>Equity</Text>
          </>
        ) : (
          <TouchableOpacity onPress={onConnectPress} activeOpacity={0.7} style={cardStyles.ctaArea}>
            <Link size={32} color={gold} />
            <Text style={[cardStyles.ctaTitle, { color: c.text.primary }]}>Connect MT5 Account</Text>
            <Text style={[cardStyles.ctaSubtitle, { color: c.text.muted }]}>
              View your trading portfolio in real-time
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── PROFIT / MARGIN TILES ── */}
      <View style={cardStyles.tileRow}>
        <MetricTile
          icon={TrendingUp}
          iconColor={c.semantic.positive}
          label="Profit"
          value={connected && mt5Data?.profit != null ? formatProfit(mt5Data.profit).text : '--'}
          valueColor={connected && mt5Data?.profit != null ? c.semantic.positive : c.text.secondary}
        />
        <MetricTile
          icon={Shield}
          iconColor={c.text.secondary}
          label="Margin"
          value={connected && mt5Data?.margin != null ? formatCurrency(mt5Data.margin) : '--'}
          valueColor={connected && mt5Data?.margin != null ? c.text.primary : c.text.secondary}
        />
      </View>

      {/* ── BROKER LINE ── */}
      {connected && mt5Data?.company ? (
        <Text style={[cardStyles.broker, { color: c.text.muted }]}>{mt5Data.company}</Text>
      ) : null}

      {/* ── STATS ROW ── */}
      <View style={[cardStyles.statsRow, { borderTopColor: isDark ? c.glass.border : LIGHT.divider }]}>
        <StatColumn
          icon={Users}
          value={followingVal}
          label="FOLLOWING"
          color={gold}
        />
        <StatColumn
          icon={BarChart2}
          value={connected && mt5Data?.leverage != null ? `1:${mt5Data.leverage}` : '--'}
          label="LEVERAGE"
          color={gold}
          bordered
        />
        <StatColumn
          icon={Activity}
          value={openPosVal}
          label="OPEN"
          color={gold}
        />
      </View>
    </GlassCard>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  eyebrow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: 'DMSans-Medium',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11,
    fontFamily: 'DMSans-Medium',
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    marginBottom: 14,
  },
  equityValue: {
    fontSize: 38,
    fontWeight: '500',
    fontFamily: 'Manrope-Medium',
    letterSpacing: -0.5,
  },
  equityLabel: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'DMSans',
  },
  ctaArea: {
    alignItems: 'center',
    paddingVertical: space.sm,
  },
  ctaTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Manrope-SemiBold',
    marginTop: space.sm,
  },
  ctaSubtitle: {
    fontSize: 12,
    fontFamily: 'DMSans',
    marginTop: space.xs,
  },
  tileRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  tile: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  tileLabel: {
    fontSize: 11,
    fontFamily: 'DMSans-Medium',
  },
  tileValue: {
    fontSize: 17,
    fontWeight: '500',
    fontFamily: 'Manrope-Medium',
  },
  broker: {
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'DMSans',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 14,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Manrope-Medium',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
    fontFamily: 'DMSans-Medium',
  },
});
