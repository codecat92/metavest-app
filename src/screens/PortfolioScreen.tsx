import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  TrendingUp, ArrowUpRight, ArrowDownRight, Plus, Minus,
  Wallet as WalletIcon, Upload, X, AlertTriangle, FileText,
} from 'lucide-react-native';
import { walletApi, Wallet, WalletTransaction, WalletBalance } from '@/api/wallet';
import { followApi, UserTrader } from '@/api/follow';
import { getToken } from '@/api/client';
import { useCustomAlert } from '@/context/AlertContext';
import { useAuth } from '@/context/AuthContext';
import { otpApi } from '@/api/otp';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { colors, useColors, space, radius, typography } from '@/theme';
import { GlassCard, AppButton, AppInput, EmptyState, Badge } from '@/components';

export default function PortfolioScreen() {
  const alert = useCustomAlert();
  const colors = useColors();
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [otpId, setOtpId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [history, setHistory] = useState<WalletTransaction[]>([]);
  const [followed, setFollowed] = useState<UserTrader[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [proofImageUri, setProofImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null);
  const [showWithdrawLocked, setShowWithdrawLocked] = useState(false);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);

  const loadData = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const [walletRes, transactionsRes, balanceRes, activeRes, followRes] = await Promise.all([
        walletApi.getById(),
        walletApi.getTransactions(),
        walletApi.getBalance(),
        followApi.getActive(1),
        followApi.getFollowed(1),
      ]);
      setWallet(walletRes.data ?? null);
      setHistory(transactionsRes.data ?? []);
      setWalletBalance(balanceRes.data ?? null);
      const followedIds = new Set((followRes.data ?? []).map(f => f.trader_id));
      setFollowed((activeRes.data ?? []).filter(t => followedIds.has(t.id)));
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
    `${amount.toLocaleString('en-US')} MP`;

  const isCredit = (item: WalletTransaction) =>
    item.type === 1 || item.type === 3 || item.type_label === 'Topup' || item.type_label === 'Refund';

  const isApproved = (item: WalletTransaction) =>
    item.status === 2 || item.status_label === 'Approved';
  const isRejected = (item: WalletTransaction) =>
    item.status === 3 || item.status_label === 'Rejected';

  const today = new Date().toDateString();
  const todaysTransactions = history.filter(
    t => t.created_at && new Date(t.created_at).toDateString() === today
  );
  const todayTopup = todaysTransactions
    .filter(t => (t.type === 1 || t.type_label === 'Topup') && (t.status === 2 || t.status_label === 'Approved'))
    .reduce((sum, t) => sum + t.amount, 0);
  const todaySpend = todaysTransactions
    .filter(t => (t.type === 2 || t.type_label === 'Purchase') && (t.status === 2 || t.status_label === 'Approved'))
    .reduce((sum, t) => sum + t.amount, 0);
  const dailyChange = todayTopup - todaySpend;
  const hasDailyActivity = todaysTransactions.length > 0;

  const totalTx = history.length;
  const pendingCount = history.filter(t => t.status === 1 || t.status_label === 'Pending').length;
  const approvedCount = history.filter(t => t.status === 2 || t.status_label === 'Approved').length;

  const handlePickProof = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert.showAlert({ title: 'Permission denied', message: 'Allow access to photos', type: 'error' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProofImageUri(result.assets[0].uri);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const url = walletApi.downloadReportUrl();
      const fileUri = FileSystem.documentDirectory + 'metavest-report.html';
      await FileSystem.downloadAsync(url, fileUri);
      await Sharing.shareAsync(fileUri, { mimeType: 'text/html' });
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Download failed', type: 'error' });
    }
  };

  if (!getToken()) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]} edges={['top']}>
        <EmptyState icon={<WalletIcon size={40} color={colors.text.secondary} />} title="Login to see portfolio" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[typography.h2, { color: colors.text.primary, fontFamily: 'Manrope-Bold' }]}>
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
              <Text style={[typography.h1, { color: colors.text.primary, marginTop: space.xs, fontFamily: 'Manrope-Bold' }]}>
                {formatBalance(balance)}
              </Text>

              {hasDailyActivity ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.sm }}>
                  {dailyChange >= 0
                    ? <ArrowUpRight size={14} color={colors.semantic.positive} />
                    : <ArrowDownRight size={14} color={colors.semantic.negative} />
                  }
                  <Text style={[typography.body, {
                    color: dailyChange >= 0 ? colors.semantic.positive : colors.semantic.negative,
                    fontWeight: '700',
                  }]}>
                    {dailyChange >= 0 ? '+' : ''}{formatBalance(Math.abs(dailyChange))}
                  </Text>
                  <Text style={[typography.caption, { color: colors.text.muted }]}>today</Text>
                </View>
              ) : (
                <Text style={[typography.caption, { color: colors.text.muted, marginTop: space.sm }]}>
                  No activity today
                </Text>
              )}

              <View style={{ borderTopWidth: 1, borderTopColor: colors.glass.border, marginTop: space.md, marginBottom: space.md }} />

              <View style={styles.walletIdRow}>
                <Text style={[typography.label, { color: colors.text.secondary }]}>Wallet ID: </Text>
                <Text style={[typography.label, { color: colors.text.muted }]} numberOfLines={1}>
                  {wallet?.id_wallet?.substring(0, 12) ?? '-'}...
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: space['2xl'], marginTop: space.lg }}>
                <View>
                  <Text style={{ fontSize: 11, color: colors.text.muted, fontWeight: '500', fontFamily: 'DMSans' }}>TOTAL TX</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text.primary, marginTop: 2, fontFamily: 'Manrope-Bold' }}>{totalTx}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 11, color: colors.text.muted, fontWeight: '500', fontFamily: 'DMSans' }}>PENDING</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.semantic.warning, marginTop: 2, fontFamily: 'Manrope-Bold' }}>{pendingCount}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 11, color: colors.text.muted, fontWeight: '500', fontFamily: 'DMSans' }}>APPROVED</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.semantic.positive, marginTop: 2, fontFamily: 'Manrope-Bold' }}>{approvedCount}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleDownloadReport}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: space.sm,
                  paddingVertical: space.md,
                  borderRadius: radius.md,
                  backgroundColor: 'rgba(139,92,246,0.10)',
                  borderWidth: 1,
                  borderColor: 'rgba(139,92,246,0.25)',
                  marginTop: space.lg,
                }}
              >
                <FileText size={16} color={colors.accent.purple} />
                <Text style={[typography.bodyBold, { color: colors.accent.purple }]}>
                  Download Report
                </Text>
              </TouchableOpacity>
            </GlassCard>

            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => { setShowTopUp(true); setShowWithdraw(false); setAmount(''); setProofImageUri(null); }}
                style={[styles.actionBtn, { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.25)' }]}
              >
                <Plus size={16} color={colors.semantic.positive} />
                <Text style={[typography.bodyBold, { color: colors.semantic.positive }]}>Top Up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowWithdrawLocked(true)}
                style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)' }]}
              >
                <Minus size={16} color={colors.semantic.negative} />
                <Text style={[typography.bodyBold, { color: colors.semantic.negative }]}>Withdraw</Text>
              </TouchableOpacity>
            </View>

            {showTopUp && (
              <GlassCard elevation={2} style={{ marginHorizontal: space['2xl'], marginBottom: space.xl }}>
                <Text style={[typography.h4, { color: colors.text.primary, marginBottom: space.md, fontFamily: 'Manrope-Bold' }]}>
                  Top Up Wallet
                </Text>
                <Text style={[typography.caption, { color: colors.text.secondary, marginBottom: space.md }]}>
                  Balance: {formatBalance(balance)}
                </Text>

                <AppInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                />

                {!proofImageUri ? (
                  <TouchableOpacity
                    onPress={handlePickProof}
                    activeOpacity={0.7}
                    style={{
                      borderWidth: 1.5,
                      borderStyle: 'dashed',
                      borderColor: colors.glass.borderStrong,
                      borderRadius: radius.md,
                      paddingVertical: space['2xl'],
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: space.sm,
                      marginTop: space.md,
                      marginBottom: space.md,
                    }}
                  >
                    <Upload size={24} color={colors.text.secondary} />
                    <Text style={[typography.bodyBold, { color: colors.text.secondary }]}>
                      Upload Bukti Transfer
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ marginTop: space.md, marginBottom: space.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
                      <ExpoImage
                        source={{ uri: proofImageUri }}
                        style={{
                          width: 120,
                          height: 120,
                          borderRadius: radius.md,
                          borderWidth: 1,
                          borderColor: colors.glass.border,
                        }}
                        contentFit="cover"
                      />
                      <View style={{ flex: 1, gap: space.sm }}>
                        <TouchableOpacity
                          onPress={handlePickProof}
                          activeOpacity={0.7}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: space.xs,
                            paddingHorizontal: space.md,
                            paddingVertical: space.sm,
                            borderRadius: radius.sm,
                            backgroundColor: colors.glass.g1,
                            borderWidth: 1,
                            borderColor: colors.glass.border,
                            alignSelf: 'flex-start',
                          }}
                        >
                          <Upload size={14} color={colors.text.secondary} />
                          <Text style={[typography.label, { color: colors.text.secondary }]}>
                            Ganti Gambar
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setProofImageUri(null)}
                          activeOpacity={0.7}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: space.xs,
                            paddingHorizontal: space.md,
                            paddingVertical: space.sm,
                            borderRadius: radius.sm,
                            backgroundColor: 'rgba(239,68,68,0.10)',
                            borderWidth: 1,
                            borderColor: 'rgba(239,68,68,0.25)',
                            alignSelf: 'flex-start',
                          }}
                        >
                          <X size={14} color={colors.semantic.negative} />
                          <Text style={[typography.label, { color: colors.semantic.negative }]}>
                            Hapus
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                <AppButton
                  title={submitting ? 'Submitting...' : 'Confirm Top Up'}
                  disabled={!proofImageUri}
                  onPress={async () => {
                    const val = Number(amount);
                    if (!val || val <= 0) { alert.showAlert({ title: 'Error', message: 'Enter a valid amount', type: 'error' }); return; }
                    if (!proofImageUri) { alert.showAlert({ title: 'Error', message: 'Upload proof of transfer', type: 'error' }); return; }
                    setSubmitting(true);
                    try {
                      await walletApi.submitTopup(val, proofImageUri);
                      alert.showAlert({ title: 'Success', message: 'Top up request submitted, menunggu approval admin', type: 'success' });
                      setShowTopUp(false); setAmount(''); setProofImageUri(null); loadData();
                    } catch (e: any) { alert.showAlert({ title: 'Error', message: e.message || 'Failed', type: 'error' }); }
                    finally { setSubmitting(false); }
                  }}
                  loading={submitting}
                />
              </GlassCard>
            )}

            {showWithdraw && (
              <GlassCard elevation={2} style={{ marginHorizontal: space['2xl'], marginBottom: space.xl }}>
                <Text style={[typography.h4, { color: colors.semantic.negative, marginBottom: space.md, fontFamily: 'Manrope-Bold' }]}>
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
              <Text style={[typography.h4, { color: colors.text.primary, marginBottom: space.md, fontFamily: 'Manrope-Bold' }]}>
                Recent Transactions
              </Text>
              {history.length === 0 ? (
                <EmptyState icon={<ArrowUpRight size={28} color={colors.text.secondary} />} title="No transactions yet" />
              ) : (
                <View style={{ gap: space.sm }}>
                  {history.slice(0, 10).map((item) => {
                    const credit = isCredit(item);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        onPress={() => setSelectedTransaction(item)}
                      >
                      <GlassCard key={item.id} elevation={2}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                          <View style={styles.txIcon}>
                            {credit
                              ? <ArrowUpRight size={18} color={colors.semantic.positive} />
                              : <ArrowDownRight size={18} color={colors.semantic.negative} />
                            }
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[typography.bodyBold, { color: colors.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                              {item.type_label ?? item.type}
                            </Text>
                            <Text style={[typography.caption, { color: colors.text.secondary }]}>
                              {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                            </Text>
                            {item.status === 1 && (item.type === 1 || item.type_label === 'Topup') && (
                              <Text style={{ fontSize: 11, color: colors.semantic.warning, marginTop: 2, fontFamily: 'DMSans' }}>
                                Menunggu approval
                              </Text>
                            )}
                            {isRejected(item) && item.rejection_reason && (
                              <View style={{
                                marginTop: space.sm,
                                paddingHorizontal: space.sm,
                                paddingVertical: space.xs,
                                borderRadius: radius.sm,
                                backgroundColor: 'rgba(239,68,68,0.08)',
                                borderWidth: 1,
                                borderColor: 'rgba(239,68,68,0.20)',
                              }}>
                                <Text style={{ fontSize: 10, color: colors.semantic.negative, fontFamily: 'DMSans' }} numberOfLines={1} ellipsizeMode="tail">
                                  Reason: {item.rejection_reason}
                                </Text>
                              </View>
                            )}
                          </View>
                          <View style={{ alignItems: 'flex-end', gap: space.xs }}>
                            <Text style={[typography.bodyBold, {
                              color: credit ? colors.semantic.positive : colors.semantic.negative,
                              fontFamily: 'Manrope-Bold',
                            }]}>
                              {credit ? '+' : '-'}{formatBalance(Math.abs(item.amount))}
                            </Text>
                            <Badge
                              label={item.status_label ?? String(item.status)}
                              variant={
                                isApproved(item) ? 'success' :
                                isRejected(item) ? 'danger' : 'warning'
                              }
                            />
                          </View>
                        </View>
                      </GlassCard>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={[typography.h4, { color: colors.text.primary, marginBottom: space.md, fontFamily: 'Manrope-Bold' }]}>
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
          </>
        )}
      </ScrollView>

      {selectedTransaction && (
        <Modal visible transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: space.xl }}>
            <GlassCard elevation={4}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.lg }}>
                <Text style={[typography.h4, { color: colors.text.primary, fontFamily: 'Manrope-Bold' }]}>
                  {selectedTransaction.type_label ?? 'Transaction'} Details
                </Text>
                <TouchableOpacity onPress={() => setSelectedTransaction(null)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <X size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <View style={{ gap: space.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[typography.caption, { color: colors.text.secondary }]}>Type</Text>
                  <Text style={[typography.bodyBold, { color: colors.text.primary, fontFamily: 'DMSans-SemiBold' }]}>{selectedTransaction.type_label ?? selectedTransaction.type}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[typography.caption, { color: colors.text.secondary }]}>Amount</Text>
                  <Text style={[typography.bodyBold, {
                    color: isCredit(selectedTransaction) ? colors.semantic.positive : colors.semantic.negative,
                    fontFamily: 'Manrope-Bold',
                  }]}>
                    {isCredit(selectedTransaction) ? '+' : '-'}{formatBalance(Math.abs(selectedTransaction.amount))}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[typography.caption, { color: colors.text.secondary }]}>Date</Text>
                  <Text style={[typography.bodyBold, { color: colors.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                    {selectedTransaction.created_at ? new Date(selectedTransaction.created_at).toLocaleString() : '-'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[typography.caption, { color: colors.text.secondary }]}>Status</Text>
                  <Badge
                    label={selectedTransaction.status_label ?? String(selectedTransaction.status)}
                    variant={
                      isApproved(selectedTransaction) ? 'success' :
                      isRejected(selectedTransaction) ? 'danger' : 'warning'
                    }
                  />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[typography.caption, { color: colors.text.secondary }]}>Balance Before</Text>
                  <Text style={[typography.bodyBold, { color: colors.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                    {formatBalance(selectedTransaction.balance_before)}
                  </Text>
                </View>
                {selectedTransaction.balance_after != null && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[typography.caption, { color: colors.text.secondary }]}>Balance After</Text>
                    <Text style={[typography.bodyBold, { color: colors.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                      {formatBalance(selectedTransaction.balance_after)}
                    </Text>
                  </View>
                )}

                {isRejected(selectedTransaction) && selectedTransaction.rejection_reason && (
                  <View style={{
                    backgroundColor: 'rgba(239,68,68,0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(239,68,68,0.20)',
                    borderRadius: radius.sm,
                    padding: space.md,
                  }}>
                    <Text style={{ fontSize: 11, color: colors.semantic.negative, fontFamily: 'DMSans-Bold', marginBottom: 4 }}>
                      Rejection Reason
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.text.secondary, fontFamily: 'DMSans', lineHeight: 19 }}>
                      {selectedTransaction.rejection_reason}
                    </Text>
                  </View>
                )}

                {selectedTransaction.status === 1 && (selectedTransaction.type === 1 || selectedTransaction.type_label === 'Topup') && (
                  <View style={{
                    backgroundColor: 'rgba(245,158,11,0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(245,158,11,0.20)',
                    borderRadius: radius.sm,
                    padding: space.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space.sm,
                  }}>
                    <AlertTriangle size={16} color={colors.semantic.warning} />
                    <Text style={{ fontSize: 13, color: colors.semantic.warning, fontFamily: 'DMSans', flex: 1 }}>
                      Menunggu approval dari admin
                    </Text>
                  </View>
                )}
              </View>
            </GlassCard>
          </View>
        </Modal>
      )}

      {showWithdrawLocked && (
        <Modal visible transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: space.xl }}>
            <GlassCard elevation={4}>
              <View style={{ alignItems: 'center', gap: space.md }}>
                <AlertTriangle size={40} color={colors.semantic.warning} />
                <Text style={[typography.h4, { color: colors.text.primary, textAlign: 'center', fontFamily: 'Manrope-Bold' }]}>
                  Feature Unavailable
                </Text>
                <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center' }]}>
                  Fitur withdraw masih dalam pengembangan
                </Text>
                <AppButton
                  title="OK"
                  variant="primary"
                  onPress={() => setShowWithdrawLocked(false)}
                  style={{ marginTop: space.md, alignSelf: 'stretch' }}
                />
              </View>
            </GlassCard>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { },

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
  followAvatarText: { fontSize: 12, fontWeight: '800', color: '#fff', fontFamily: 'Manrope-Bold' },

  txIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.glass.g1,
    alignItems: 'center', justifyContent: 'center',
  },
});
