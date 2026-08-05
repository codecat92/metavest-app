import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, ActivityIndicator
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Server, Key, User, Zap, Activity,
  TrendingUp, Shield, Trash2, Building2, DollarSign, BarChart2, Unlock
} from 'lucide-react-native';
import { copytradeApi, Mt5Account } from '@/api/copytrade';
import { getToken } from '@/api/client';
import { useCustomAlert } from '@/context/AlertContext';
import { colors, useColors, space, radius, typography } from '@/theme';
import { GlassCard, AppButton, AppInput, Badge, EmptyState } from '@/components';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type CopyTradeProps = NativeStackScreenProps<RootStackParamList, 'CopyTrade'>;

function formatCurrency(val: number): string {
  return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CopyTradeScreen({ navigation }: CopyTradeProps) {
  const alert = useCustomAlert();
  const c = useColors();
  const [subscriber, setSubscriber] = useState<Mt5Account | null>(null);
  const [mt5Account, setMt5Account] = useState<any>(null);
  const [positions, setPositions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [server, setServer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const [info, mt5, pos] = await Promise.all([
        copytradeApi.getSubscriberInfo().catch(() => null),
        copytradeApi.getMt5Account().catch(() => null),
        copytradeApi.getMt5Positions().catch(() => null),
      ]);
      if (info?.data) setSubscriber(info.data as any);
      if (mt5?.data) setMt5Account(mt5.data?.mt5 ?? null);
      if (pos?.data) setPositions(pos.data?.mt5 ?? null);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { setLoading(true); loadData(); }, [loadData])
  );

  const handleSubscribe = async () => {
    if (!account.trim() || !password.trim() || !server.trim()) {
      alert.showAlert({ title: 'Error', message: 'All fields are required', type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await copytradeApi.subscribe(account.trim(), password.trim(), server.trim());
      alert.showAlert({ title: 'Success', message: 'Successfully subscribed to copy trading', type: 'success' });
      setShowForm(false);
      setSubscriber(res.data?.user ?? null);
      loadData();
    } catch (e: any) {
      if (e.message?.includes('Subscribe success') || e.message?.includes('Subscription')) {
        alert.showAlert({ title: 'Subscribed', message: 'Account saved. MT5 connection pending.', type: 'success' });
        setShowForm(false);
        loadData();
      } else {
        alert.showAlert({ title: 'Error', message: e.message || 'Subscribe failed', type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await copytradeApi.unsubscribe();
      setSubscriber(null);
      setMt5Account(null);
      setPositions(null);
      alert.showAlert({ title: 'Done', message: 'Unsubscribed from copy trading', type: 'success' });
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Failed', type: 'error' });
    }
  };

  if (!getToken()) {
    return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <View style={styles.center}><Text style={{ color: c.text.secondary }}>Login to use Copy Trading</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: c.glass.g2, borderColor: c.glass.border }]}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: c.text.primary }]}>Copy Trading</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={c.accent.purple} style={{ marginTop: 60 }} />
        ) : subscriber ? (
          <>
            {/* ── CARD 1: Account Info ── */}
            <GlassCard elevation={2} style={styles.accInfoCard}>
              <View style={styles.accInfoHeader}>
                <User size={20} color={c.accent.gold} />
                <View>
                  <Text style={[styles.accName, { color: c.text.primary }]}>
                    {mt5Account?.name ?? `#${subscriber.account}`}
                  </Text>
                  <Text style={[styles.accLogin, { color: c.text.secondary }]}>
                    #{subscriber.account}
                  </Text>
                </View>
              </View>
              <View style={[styles.accDivider, { borderColor: c.glass.border }]} />
              <View style={styles.accMetaRow}>
                <View style={[styles.accMetaBadge, { backgroundColor: c.glass.g1, borderColor: c.glass.borderStrong }]}>
                  <Server size={11} color={c.text.secondary} />
                  <Text style={[styles.accMetaText, { color: c.text.secondary }]}>
                    {subscriber.mt5_server}
                  </Text>
                </View>
                <View style={[styles.accMetaBadge, { backgroundColor: c.glass.g1, borderColor: c.glass.borderStrong }]}>
                  <DollarSign size={11} color={c.accent.gold} />
                  <Text style={[styles.accMetaText, { color: c.text.secondary }]}>
                    {mt5Account?.currency ?? 'USD'}
                  </Text>
                </View>
                <View style={[styles.accMetaBadge, { backgroundColor: c.glass.g1, borderColor: c.glass.borderStrong }]}>
                  <BarChart2 size={11} color={c.accent.gold} />
                  <Text style={[styles.accMetaText, { color: c.text.secondary }]}>
                    1:{mt5Account?.leverage ?? '--'}
                  </Text>
                </View>
              </View>
              {mt5Account?.company ? (
                <View style={styles.accCompanyRow}>
                  <Building2 size={11} color={c.text.muted} />
                  <Text style={[styles.accCompany, { color: c.text.muted }]}>{mt5Account.company}</Text>
                </View>
              ) : null}
            </GlassCard>

            {/* ── CARD 2: Balance Sheet ── */}
            {mt5Account && (
              <GlassCard elevation={2} style={styles.balanceCard}>
                <Text style={[styles.bsTitle, { color: c.accent.gold }]}>BALANCE SHEET</Text>
                <View style={styles.bsGrid}>
                  <View style={[styles.bsItem, { borderRightWidth: 1, borderColor: c.glass.border, borderBottomWidth: 1 }]}>
                    <Text style={[styles.bsLabel, { color: c.text.secondary }]}>Balance</Text>
                    <Text style={[styles.bsValue, { color: c.text.primary }]}>
                      {formatCurrency(Number(mt5Account.balance ?? 0))}
                    </Text>
                  </View>
                  <View style={[styles.bsItem, { borderBottomWidth: 1, borderColor: c.glass.border }]}>
                    <Text style={[styles.bsLabel, { color: c.text.secondary }]}>Equity</Text>
                    <Text style={[styles.bsValue, { color: c.text.primary }]}>
                      {formatCurrency(Number(mt5Account.equity ?? 0))}
                    </Text>
                  </View>
                  <View style={[styles.bsItem, { borderRightWidth: 1, borderColor: c.glass.border, borderBottomWidth: 1 }]}>
                    <Text style={[styles.bsLabel, { color: c.text.secondary }]}>Profit</Text>
                    <Text style={[styles.bsValue, { color: Number(mt5Account.profit ?? 0) >= 0 ? c.semantic.positive : c.semantic.negative }]}>
                      {formatCurrency(Number(mt5Account.profit ?? 0))}
                    </Text>
                  </View>
                  <View style={[styles.bsItem, { borderBottomWidth: 1, borderColor: c.glass.border }]}>
                    <Text style={[styles.bsLabel, { color: c.text.secondary }]}>Margin</Text>
                    <Text style={[styles.bsValue, { color: c.text.primary }]}>
                      {formatCurrency(Number(mt5Account.margin ?? 0))}
                    </Text>
                  </View>
                  <View style={[styles.bsItem, { borderRightWidth: 1, borderColor: c.glass.border }]}>
                    <Text style={[styles.bsLabel, { color: c.text.secondary }]}>Free Margin</Text>
                    <Text style={[styles.bsValue, { color: c.text.primary }]}>
                      {formatCurrency(Number(mt5Account.margin_free ?? 0))}
                    </Text>
                  </View>
                  <View style={styles.bsItem}>
                    <Text style={[styles.bsLabel, { color: c.text.secondary }]}>Margin Level</Text>
                    <Text style={[styles.bsValue, { color: c.text.primary }]}>
                      {mt5Account.margin_level != null ? `${Number(mt5Account.margin_level).toFixed(2)}%` : '--'}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            )}

            {/* ── CARD 3: Open Positions ── */}
            <GlassCard elevation={2} style={styles.positionsCard}>
              <Text style={[styles.bsTitle, { color: c.accent.gold }]}>OPEN POSITIONS</Text>
              {positions && positions.length > 0 ? (
                positions.slice(0, 10).map((pos: any, i: number) => {
                  const isPositive = Number(pos.profit ?? 0) >= 0;
                  return (
                    <View key={i} style={[styles.positionCard, { backgroundColor: c.glass.g1, borderColor: c.glass.borderStrong }]}>
                      <View style={styles.posHeader}>
                        <View style={styles.posSymbol}>
                          <Activity size={14} color={c.accent.purple} />
                          <Text style={[styles.posSymbolText, { color: c.text.primary }]}>{pos.symbol ?? 'N/A'}</Text>
                        </View>
                        <View style={[
                          styles.posBadge,
                          isPositive
                            ? { backgroundColor: c.semantic.positive + '20', borderColor: c.semantic.positive + '4D' }
                            : { backgroundColor: c.semantic.negative + '20', borderColor: c.semantic.negative + '4D' },
                        ]}>
                          <TrendingUp size={11} color={isPositive ? c.semantic.positive : c.semantic.negative} />
                          <Text style={[styles.posPnl, { color: isPositive ? c.semantic.positive : c.semantic.negative }]}>
                            ${Number(pos.profit ?? 0).toFixed(2)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.posDetails}>
                        <Text style={[styles.posDetail, { color: c.text.secondary }]}>Vol: {pos.volume ?? '-'}</Text>
                        <Text style={[styles.posDetail, { color: c.text.secondary }]}>Open: {pos.open_price ?? '-'}</Text>
                        <Text style={[styles.posDetail, { color: c.text.secondary }]}>Current: {pos.current_price ?? '-'}</Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyPositions}>
                  <Shield size={32} color={c.text.muted} />
                  <Text style={[styles.emptyPosText, { color: c.text.muted }]}>No open positions</Text>
                </View>
              )}
            </GlassCard>

            {/* ── Disconnect ── */}
            <TouchableOpacity
              onPress={handleUnsubscribe}
              style={[styles.unsubscribeBtn, { backgroundColor: c.semantic.negative + '14', borderColor: c.semantic.negative + '33' }]}
            >
              <Trash2 size={16} color={c.semantic.negative} />
              <Text style={[styles.unsubscribeText, { color: c.semantic.negative }]}>Disconnect MT5 Account</Text>
            </TouchableOpacity>
          </>
        ) : showForm ? (
          <GlassCard elevation={2} style={styles.formCard}>
            <Text style={[styles.formTitle, { color: c.text.primary }]}>Connect MT5 Account</Text>
            <View style={styles.inputGroup}>
              <Text style={[styles.formLabel, { color: c.text.secondary }]}>MT5 ACCOUNT</Text>
              <View style={[styles.inputBox, { backgroundColor: c.glass.g1, borderColor: c.glass.border }]}>
                <TextInput
                  style={[styles.input, { color: c.text.primary }]}
                  value={account}
                  onChangeText={setAccount}
                  placeholder="12345678"
                  placeholderTextColor={c.text.muted}
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.formLabel, { color: c.text.secondary }]}>PASSWORD</Text>
              <View style={[styles.inputBox, { backgroundColor: c.glass.g1, borderColor: c.glass.border }]}>
                <TextInput
                  style={[styles.input, { color: c.text.primary }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="MT5 password"
                  placeholderTextColor={c.text.muted}
                  secureTextEntry
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.formLabel, { color: c.text.secondary }]}>SERVER</Text>
              <View style={[styles.inputBox, { backgroundColor: c.glass.g1, borderColor: c.glass.border }]}>
                <TextInput
                  style={[styles.input, { color: c.text.primary }]}
                  value={server}
                  onChangeText={setServer}
                  placeholder="ICMarkets-Demo"
                  placeholderTextColor={c.text.muted}
                  autoCapitalize="none"
                />
              </View>
            </View>
            <TouchableOpacity
              onPress={handleSubscribe}
              style={[styles.submitBtn, { backgroundColor: c.accent.purple }, submitting && { opacity: 0.6 }]}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator size="small" color={c.text.primary} /> : <Text style={[styles.submitText, { color: c.text.primary }]}>Connect</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowForm(false)} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: c.text.secondary }]}>Cancel</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          <GlassCard elevation={2} style={styles.emptyCard}>
            <Zap size={48} color={c.accent.purple} />
            <Text style={[styles.emptyTitle, { color: c.text.primary }]}>Copy Trading</Text>
            <Text style={[styles.emptySub, { color: c.text.secondary }]}>
              Automatically copy trades from your followed traders to your MT5 account.
            </Text>
            <TouchableOpacity onPress={() => setShowForm(true)} style={[styles.connectBtn, { backgroundColor: c.accent.purple }]}>
              <Text style={[styles.connectBtnText, { color: c.text.primary }]}>Connect MT5 Account</Text>
            </TouchableOpacity>
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', marginTop: 200 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', fontFamily: 'Manrope-Bold' },

  // ── CARD 1: Account Info ──
  accInfoCard: {
    marginHorizontal: 24, marginBottom: 16, borderRadius: 20, padding: 20,
  },
  accInfoHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  accName: {
    fontSize: 18, fontWeight: '700', fontFamily: 'Manrope-Bold',
  },
  accLogin: {
    fontSize: 13, fontFamily: 'DMSans', marginTop: 2,
  },
  accDivider: {
    borderTopWidth: 1, marginVertical: 14,
  },
  accMetaRow: {
    flexDirection: 'row', gap: 8, flexWrap: 'wrap',
  },
  accMetaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  accMetaText: {
    fontSize: 11, fontFamily: 'DMSans-Medium',
  },
  accCompanyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 12,
  },
  accCompany: {
    fontSize: 11, fontFamily: 'DMSans',
  },

  // ── CARD 2: Balance Sheet ──
  balanceCard: {
    marginHorizontal: 24, marginBottom: 16, borderRadius: 20, padding: 20,
  },
  bsTitle: {
    fontSize: 11, fontWeight: '600', letterSpacing: 1.5, marginBottom: 14,
    fontFamily: 'DMSans-Bold', textTransform: 'uppercase',
  },
  bsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
  },
  bsItem: {
    width: '50%', padding: 12,
  },
  bsLabel: {
    fontSize: 10, fontWeight: '600', fontFamily: 'DMSans-Bold', marginBottom: 4,
  },
  bsValue: {
    fontSize: 17, fontWeight: '600', fontFamily: 'Manrope-SemiBold',
  },

  // ── CARD 3: Positions ──
  positionsCard: {
    marginHorizontal: 24, marginBottom: 16, borderRadius: 20, padding: 20,
  },
  positionCard: {
    padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1,
  },
  posHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  posSymbol: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  posSymbolText: { fontSize: 14, fontWeight: '700', fontFamily: 'DMSans-Bold' },
  posBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  posPnl: { fontSize: 12, fontWeight: '700', fontFamily: 'DMSans-Bold' },
  posDetails: { flexDirection: 'row', gap: 14 },
  posDetail: { fontSize: 12, fontFamily: 'DMSans' },
  emptyPositions: {
    alignItems: 'center', paddingVertical: 24,
  },
  emptyPosText: {
    fontSize: 13, fontFamily: 'DMSans', marginTop: 8,
  },

  // ── Disconnect ──
  unsubscribeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 24, paddingVertical: 14, borderRadius: 16,
    borderWidth: 1,
  },
  unsubscribeText: { fontSize: 14, fontWeight: '700', fontFamily: 'DMSans-Bold' },

  // ── Empty / Not-connected ──
  emptyCard: {
    marginHorizontal: 24, padding: 40, borderRadius: 24, alignItems: 'center',
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', fontFamily: 'Manrope-Bold', marginTop: 16 },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 8, marginBottom: 24, fontFamily: 'DMSans' },
  connectBtn: {
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14,
  },
  connectBtnText: { fontSize: 15, fontWeight: '700', fontFamily: 'DMSans-Bold' },

  // ── Form ──
  formCard: {
    marginHorizontal: 24, padding: 24, borderRadius: 22,
  },
  formTitle: { fontSize: 18, fontWeight: '800', fontFamily: 'Manrope-Bold', marginBottom: 20 },
  inputGroup: { marginBottom: 14 },
  formLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6, fontFamily: 'DMSans-Bold' },
  inputBox: {
    height: 48, borderRadius: 14, paddingHorizontal: 16,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15, fontFamily: 'DMSans' },
  submitBtn: {
    height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  submitText: { fontSize: 15, fontWeight: '700', fontFamily: 'DMSans-Bold' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  cancelText: { fontSize: 13, fontWeight: '600', fontFamily: 'DMSans-Bold' },
});
