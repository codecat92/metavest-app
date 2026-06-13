import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, TextInput
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Plus, Minus, Wallet as WalletIcon } from 'lucide-react-native';
import { walletApi, Wallet, WalletHistoryItem } from '../api/wallet';
import { followApi, UserTrader } from '../api/follow';
import { getToken } from '../api/client';
import { useCustomAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import { otpApi } from '../api/otp';

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
      <View style={styles.container}>
        <View style={styles.loading}>
          <Text style={{ color: '#8899AA', marginTop: 200 }}>Login to see portfolio</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Portfolio</Text>
          <Text style={styles.subtitle}>Your wallet & follows</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#AB4BFF" style={{ marginTop: 60 }} />
        ) : (
          <>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Wallet Balance</Text>
              <Text style={styles.balanceValue}>{formatBalance(balance)}</Text>
              <View style={styles.walletIdRow}>
                <Text style={styles.walletIdLabel}>Wallet ID: </Text>
                <Text style={styles.walletIdValue} numberOfLines={1}>
                  {wallet?.id_wallet?.substring(0, 12) ?? '-'}...
                </Text>
              </View>
            </View>

            {/* Wallet Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={() => { setShowTopUp(true); setShowWithdraw(false); setAmount(''); }} style={[styles.actionBtn, { backgroundColor: 'rgba(47,239,196,0.1)', borderColor: 'rgba(47,239,196,0.25)' }]}>
                <Plus size={16} color="#2FEFC4" />
                <Text style={[styles.actionBtnText, { color: '#2FEFC4' }]}>Top Up</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowWithdraw(true); setShowTopUp(false); setAmount(''); }} style={[styles.actionBtn, { backgroundColor: 'rgba(255,75,110,0.1)', borderColor: 'rgba(255,75,110,0.25)' }]}>
                <Minus size={16} color="#FF4B6E" />
                <Text style={[styles.actionBtnText, { color: '#FF4B6E' }]}>Withdraw</Text>
              </TouchableOpacity>
            </View>

            {/* Top Up Form */}
            {showTopUp && (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Top Up Wallet</Text>
                <View style={styles.formInputBox}>
                  <TextInput
                    style={styles.formInput}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="Enter amount"
                    placeholderTextColor="#8899AA"
                    keyboardType="numeric"
                  />
                </View>
                <TouchableOpacity onPress={async () => {
                  const val = Number(amount);
                  if (!val || val <= 0) { alert.showAlert({ title: 'Error', message: 'Enter a valid amount', type: 'error' }); return; }
                  setSubmitting(true);
                  try {
                    await walletApi.validateTopUp(val);
                    alert.showAlert({ title: 'Success', message: 'Top up request submitted', type: 'success' });
                    setShowTopUp(false); setAmount(''); loadData();
                  } catch (e: any) { alert.showAlert({ title: 'Error', message: e.message || 'Failed', type: 'error' }); }
                  finally { setSubmitting(false); }
                }} style={[styles.formBtn, submitting && { opacity: 0.6 }]} disabled={submitting}>
                  <Text style={styles.formBtnText}>{submitting ? 'Processing...' : 'Confirm Top Up'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Withdraw Form */}
            {showWithdraw && (
              <View style={styles.formCard}>
                <Text style={[styles.formTitle, { color: '#FF4B6E' }]}>Withdraw</Text>
                <View style={styles.formInputBox}>
                  <TextInput
                    style={styles.formInput}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="Enter amount"
                    placeholderTextColor="#8899AA"
                    keyboardType="numeric"
                  />
                </View>

                {showOtp ? (
                  <>
                    <Text style={styles.otpLabel}>
                      OTP sent to {user?.phone_number || 'your phone'}. Enter the code:
                    </Text>
                    <View style={styles.formInputBox}>
                      <TextInput
                        style={styles.formInput}
                        value={otpCode}
                        onChangeText={setOtpCode}
                        placeholder="Enter OTP code"
                        placeholderTextColor="#8899AA"
                        keyboardType="numeric"
                        maxLength={6}
                      />
                    </View>
                    <TouchableOpacity onPress={async () => {
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
                    }} style={[styles.formBtn, { backgroundColor: '#FF4B6E' }, submitting && { opacity: 0.6 }]} disabled={submitting}>
                      <Text style={styles.formBtnText}>{submitting ? 'Verifying...' : 'Verify & Withdraw'}</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity onPress={async () => {
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
                  }} style={[styles.formBtn, { backgroundColor: '#FF4B6E' }, submitting && { opacity: 0.6 }]} disabled={submitting}>
                    <Text style={styles.formBtnText}>{submitting ? 'Sending OTP...' : 'Confirm Withdraw'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Followed Traders */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Followed Traders</Text>
              {followed.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>Not following anyone yet</Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {followed.slice(0, 5).map((t, i) => {
                    const initials = (t.name ?? 'TR').substring(0, 2).toUpperCase();
                    const colors = ['#AB4BFF', '#F7C948', '#2FEFC4', '#FF4B6E', '#8855CC'];
                    return (
                      <View key={t.id} style={styles.followCard}>
                        <View style={[styles.followAvatar, { backgroundColor: colors[i % colors.length] }]}>
                          <Text style={styles.followAvatarText}>{initials}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.followName}>{t.name}</Text>
                          {t.description ? (
                            <Text style={styles.followDesc} numberOfLines={1}>{t.description}</Text>
                          ) : null}
                        </View>
                        <View style={styles.followStatus}>
                          <TrendingUp size={12} color="#2FEFC4" />
                          <Text style={styles.followStatusText}>Following</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Transaction History */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              {history.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No transactions yet</Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {history.slice(0, 10).map((item) => {
                    const isCredit = item.type === 'credit' || item.type === 'topup' || item.type === 'TopUp';
                    return (
                      <View key={item.id} style={styles.txCard}>
                        <View style={styles.txIcon}>
                          {isCredit
                            ? <ArrowUpRight size={18} color="#2FEFC4" />
                            : <ArrowDownRight size={18} color="#FF4B6E" />
                          }
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.txType}>
                            {item.type?.charAt(0).toUpperCase() + item.type?.slice(1) ?? 'Transaction'}
                          </Text>
                          <Text style={styles.txDate}>
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                          </Text>
                        </View>
                        <Text style={[styles.txAmount, { color: isCredit ? '#2FEFC4' : '#FF4B6E' }]}>
                          {isCredit ? '+' : '-'}{formatBalance(Math.abs(item.amount ?? 0))}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1439' },
  scroll: { paddingBottom: 100 },
  loading: { flex: 1, alignItems: 'center' },

  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 13, color: '#8899AA', marginTop: 2 },

  balanceCard: {
    marginHorizontal: 24, borderRadius: 24, padding: 24,
    backgroundColor: 'rgba(171,75,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.25)',
    marginBottom: 24,
  },
  balanceLabel: { fontSize: 13, color: 'rgba(240,238,255,0.6)' },
  balanceValue: { fontSize: 40, fontWeight: '800', color: '#fff', letterSpacing: -1, marginTop: 4 },
  walletIdRow: { flexDirection: 'row', marginTop: 12 },
  walletIdLabel: { fontSize: 11, color: '#8899AA' },
  walletIdValue: { fontSize: 11, color: 'rgba(240,238,255,0.5)' },

  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },

  emptyCard: {
    padding: 32, borderRadius: 20, alignItems: 'center',
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.12)',
  },
  emptyText: { fontSize: 14, color: '#8899AA' },

  list: { gap: 10 },
  txCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    borderRadius: 18, backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.12)',
  },
  txIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  txType: { fontSize: 14, fontWeight: '700', color: '#fff' },
  txDate: { fontSize: 12, color: '#8899AA', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '800' },

  followCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    borderRadius: 18, backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.12)',
  },
  followAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  followAvatarText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  followName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  followDesc: { fontSize: 12, color: '#8899AA', marginTop: 2 },
  followStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  followStatusText: { fontSize: 12, fontWeight: '600', color: '#2FEFC4' },

  actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, marginBottom: 20 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700' },

  formCard: {
    marginHorizontal: 24, padding: 20, borderRadius: 20, marginBottom: 20,
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
  },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 14 },
  formInputBox: {
    height: 48, borderRadius: 14, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
    marginBottom: 12,
  },
  formInput: { flex: 1, color: '#fff', fontSize: 15 },
  formBtn: {
    height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2FEFC4',
  },
  formBtnText: { fontSize: 15, fontWeight: '700', color: '#0E1439' },
  otpLabel: { fontSize: 13, color: '#8899AA', marginBottom: 10, textAlign: 'center' },
});
