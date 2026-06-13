import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, TextInput
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Plus, Minus, Wallet as WalletIcon } from 'lucide-react-native';
import { walletApi, Wallet, WalletHistoryItem } from '../api/wallet';
import { followApi, UserTrader } from '../api/follow';
import { getToken } from '../api/client';
import { useCustomAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import { otpApi } from '../api/otp';
import { colors, space, radius, typography } from '../theme';
import { GlassCard, AppButton, AppInput, EmptyState } from '../components';

export default function PortfolioScreen() {
  const alert = useCustomAlert();
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [otpId, setOtpId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [history, setHistory] = useState<WalletHistoryItem[]>([]);
  const [followed, setFollowed] = useState<UserTrader[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const [walletRes, historyRes, followRes] = await Promise.all([
        walletApi.getById(),
        walletApi.getHistory(1),
        followApi.getFollowed(1),
      ]);
      setWallet(walletRes.data ?? null);
      setHistory(historyRes.data ?? []);
      setFollowed(followRes.data ?? []);
    } catch (e) {
      console.log('Portfolio load failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { setLoading(true); loadData(); }, [loadData])
  );

  const balance = wallet?.balance ?? 0;
  const formatBalance = (amount: number) =>
    `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  if (!getToken()) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <EmptyState icon={<WalletIcon size={40} color={colors.text.secondary} />} title="Login to see portfolio" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[typography.h2, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
            Portfolio
          </Text>
          <Text style={[typography.caption, { color: colors.text.secondary }]}>
            Your wallet & follows
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.accent.purple} style={{ marginTop: 60 }} />
        ) : (
          <>
            <GlassCard elevation={3} style={{ marginHorizontal: space['2xl'], marginBottom: space['2xl'] }}>
              <Text style={[typography.caption, { color: colors.text.muted }]}>Wallet Balance</Text>
              <Text style={[typography.h1, { color: colors.text.primary, marginTop: space.xs, fontFamily: 'SpaceGrotesk-Bold' }]}>
                {formatBalance(balance)}
              </Text>
              <View style={styles.walletIdRow}>
                <Text style={[typography.label, { color: colors.text.secondary }]}>Wallet ID: </Text>
                <Text style={[typography.label, { color: colors.text.muted }]} numberOfLines={1}>
                  {wallet?.id_wallet?.substring(0, 12) ?? '-'}...
                </Text>
              </View>
            </GlassCard>

            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => { setShowTopUp(true); setShowWithdraw(false); setAmount(''); }}
                style={[styles.actionBtn, { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.25)' }]}
              >
                <Plus size={16} color={colors.semantic.positive} />
                <Text style={[typography.bodyBold, { color: colors.semantic.positive }]}>Top Up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setShowWithdraw(true); setShowTopUp(false); setAmount(''); }}
                style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)' }]}
              >
                <Minus size={16} color={colors.semantic.negative} />
                <Text style={[typography.bodyBold, { color: colors.semantic.negative }]}>Withdraw</Text>
              </TouchableOpacity>
            </View>

            {showTopUp && (
              <GlassCard elevation={2} style={{ marginHorizontal: space['2xl'], marginBottom: space.xl }}>
                <Text style={[typography.h4, { color: colors.text.primary, marginBottom: space.md, fontFamily: 'SpaceGrotesk-Bold' }]}>
                  Top Up Wallet
                </Text>
                <AppInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                />
                <AppButton
                  title={submitting ? 'Processing...' : 'Confirm Top Up'}
                  onPress={async () => {
                    const val = Number(amount);
                    if (!val || val <= 0) { alert.showAlert({ title: 'Error', message: 'Enter a valid amount', type: 'error' }); return; }
                    setSubmitting(true);
                    try {
                      await walletApi.validateTopUp(val);
                      alert.showAlert({ title: 'Success', message: 'Top up request submitted', type: 'success' });
                      setShowTopUp(false); setAmount(''); loadData();
                    } catch (e: any) { alert.showAlert({ title: 'Error', message: e.message || 'Failed', type: 'error' }); }
                    finally { setSubmitting(false); }
                  }}
                  loading={submitting}
                />
              </GlassCard>
            )}

            {showWithdraw && (
              <GlassCard elevation={2} style={{ marginHorizontal: space['2xl'], marginBottom: space.xl }}>
                <Text style={[typography.h4, { color: colors.semantic.negative, marginBottom: space.md, fontFamily: 'SpaceGrotesk-Bold' }]}>
                  Withdraw
                </Text>
                <AppInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                />

                {showOtp ? (
                  <>
                    <Text style={[typography.caption, { color: colors.text.secondary, marginBottom: space.sm, textAlign: 'center' }]}>
                      OTP sent. Enter the verification code:
                    </Text>
                    <AppInput
                      value={otpCode}
                      onChangeText={setOtpCode}
                      placeholder="Enter OTP code"
                      keyboardType="numeric"
                    />
                    <AppButton
                      title={submitting ? 'Verifying...' : 'Verify & Withdraw'}
                      variant="danger"
                      onPress={async () => {
                        if (!otpCode.trim()) { alert.showAlert({ title: 'Error', message: 'Enter OTP code', type: 'error' }); return; }
                        setSubmitting(true);
                        try {
                          await otpApi.verifyOtp(otpId, otpCode.trim());
                          await walletApi.withdraw(pendingAmount);
                          alert.showAlert({ title: 'Success', message: 'Withdrawal request submitted', type: 'success' });
                          setShowWithdraw(false); setShowOtp(false); setAmount('');
                          setOtpCode(''); setOtpId('');
                          loadData();
                        } catch (e: any) { alert.showAlert({ title: 'Error', message: e.message || 'Failed', type: 'error' }); }
                        finally { setSubmitting(false); }
                      }}
                      loading={submitting}
                    />
                  </>
                ) : (
                  <AppButton
                    title={submitting ? 'Sending OTP...' : 'Confirm Withdraw'}
                    variant="danger"
                    onPress={async () => {
                      const val = Number(amount);
                      if (!val || val <= 0) { alert.showAlert({ title: 'Error', message: 'Enter a valid amount', type: 'error' }); return; }
                      setPendingAmount(val);
                      setSubmitting(true);
                      try {
                        if (user?.phone_number) {
                          const otpRes = await otpApi.sendOtp(user.phone_number, 0, 'user');
                          const otpData = otpRes.data ?? {};
                          setOtpId(otpData.id ?? otpData.otp_id ?? '');
                          setShowOtp(true);
                        } else {
                          alert.showAlert({ title: 'Phone Required', message: 'Add a phone number in Edit Profile first', type: 'error' });
                        }
                      } catch (e: any) {
                        alert.showAlert({ title: 'Error', message: e.message || 'Failed to send OTP', type: 'error' });
                      } finally { setSubmitting(false); }
                    }}
                    loading={submitting}
                  />
                )}
              </GlassCard>
            )}

            <View style={styles.section}>
              <Text style={[typography.h4, { color: colors.text.primary, marginBottom: space.md, fontFamily: 'SpaceGrotesk-Bold' }]}>
                Followed Traders
              </Text>
              {followed.length === 0 ? (
                <EmptyState icon={<TrendingUp size={28} color={colors.text.secondary} />} title="Not following anyone yet" />
              ) : (
                <View style={{ gap: space.sm }}>
                  {followed.slice(0, 5).map((t, i) => {
                    const initials = (t.name ?? 'TR').substring(0, 2).toUpperCase();
                    const avColors = [colors.accent.purple, colors.accent.gold, colors.semantic.positive, colors.semantic.negative, '#8855CC'];
                    return (
                      <GlassCard key={t.id} elevation={2}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                          <View style={[styles.followAvatar, { backgroundColor: avColors[i % avColors.length] }]}>
                            <Text style={styles.followAvatarText}>{initials}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[typography.bodyBold, { color: colors.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                              {t.name}
                            </Text>
                            {t.description ? (
                              <Text style={[typography.caption, { color: colors.text.secondary }]} numberOfLines={1}>
                                {t.description}
                              </Text>
                            ) : null}
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                            <TrendingUp size={12} color={colors.semantic.positive} />
                            <Text style={[typography.caption, { color: colors.semantic.positive, fontWeight: '600' }]}>
                              Following
                            </Text>
                          </View>
                        </View>
                      </GlassCard>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={[typography.h4, { color: colors.text.primary, marginBottom: space.md, fontFamily: 'SpaceGrotesk-Bold' }]}>
                Recent Transactions
              </Text>
              {history.length === 0 ? (
                <EmptyState icon={<ArrowUpRight size={28} color={colors.text.secondary} />} title="No transactions yet" />
              ) : (
                <View style={{ gap: space.sm }}>
                  {history.slice(0, 10).map((item) => {
                    const isCredit = item.type === 'credit' || item.type === 'topup' || item.type === 'TopUp';
                    return (
                      <GlassCard key={item.id} elevation={2}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                          <View style={styles.txIcon}>
                            {isCredit
                              ? <ArrowUpRight size={18} color={colors.semantic.positive} />
                              : <ArrowDownRight size={18} color={colors.semantic.negative} />
                            }
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[typography.bodyBold, { color: colors.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                              {item.type?.charAt(0).toUpperCase() + item.type?.slice(1) ?? 'Transaction'}
                            </Text>
                            <Text style={[typography.caption, { color: colors.text.secondary }]}>
                              {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                            </Text>
                          </View>
                          <Text style={[typography.bodyBold, {
                            color: isCredit ? colors.semantic.positive : colors.semantic.negative,
                            fontFamily: 'SpaceGrotesk-Bold',
                          }]}>
                            {isCredit ? '+' : '-'}{formatBalance(Math.abs(item.amount ?? 0))}
                          </Text>
                        </View>
                      </GlassCard>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { paddingBottom: 100 },

  header: { paddingHorizontal: space['2xl'], paddingTop: space.xl, paddingBottom: space.sm },

  walletIdRow: { flexDirection: 'row', marginTop: space.md },

  actionRow: { flexDirection: 'row', gap: space.md, paddingHorizontal: space['2xl'], marginBottom: space.xl },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: space.sm, paddingVertical: space.md, borderRadius: radius.lg, borderWidth: 1,
  },

  section: { paddingHorizontal: space['2xl'], marginBottom: space['2xl'] },

  followAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  followAvatarText: { fontSize: 12, fontWeight: '800', color: '#fff', fontFamily: 'SpaceGrotesk-Bold' },

  txIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.glass.g1,
    alignItems: 'center', justifyContent: 'center',
  },
});
