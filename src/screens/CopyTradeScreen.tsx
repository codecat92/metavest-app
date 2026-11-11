import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, ActivityIndicator,
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Server, Key, User, Zap, Activity,
  TrendingUp, Shield, Trash2, Building2, DollarSign, BarChart2,
  Play, Pause,
} from 'lucide-react-native';
import { copytradeApi, Mt5AccountData, Mt5Position } from '@/api/copytrade';
import { getToken } from '@/api/client';
import { useCustomAlert } from '@/context/AlertContext';
import { colors, useColors, space, radius, typography } from '@/theme';
import { GlassCard, AppButton } from '@/components';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type CopyTradeProps = NativeStackScreenProps<RootStackParamList, 'CopyTrade'>;

function formatCurrency(val: number): string {
  return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type SlotStatus = 'active' | 'ready' | 'queued' | 'waiting_credentials' | 'releasing' | 'error';

export default function CopyTradeScreen({ navigation }: CopyTradeProps) {
  const alert = useCustomAlert();
  const c = useColors();
  const [loading, setLoading] = useState(true);
  const [slot, setSlot] = useState<any>(null);
  const [account, setAccount] = useState<Mt5AccountData | null>(null);
  const [positions, setPositions] = useState<Mt5Position[]>([]);

  // form connect
  const [showForm, setShowForm] = useState(false);
  const [accountInput, setAccountInput] = useState('');
  const [password, setPassword] = useState('');
  const [server, setServer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // copy toggle
  const [toggling, setToggling] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dataPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isCopying = !!slot && ['active', 'ready'].includes(slot.status);
  const copyEnabled = !!slot?.copy_enabled;

  // read-only (password investor) atau Algo Trading off → blokir copy
  const isReadOnly = slot?.can_trade === false;
  const algoOff = slot?.algo_trading === false;
  const slotError = slot?.error;
  const hasBlockingIssue = slot?.status === 'error' || isReadOnly || algoOff;

  // Petakan kode error → judul + aksi ramah user (dari backend error_code).
  const errorInfo = (() => {
    const code = slot?.error_code as string | undefined;
    switch (code) {
      case 'algo_off':
        return { title: 'Algo Trading Nonaktif', message: 'Aktifkan tombol Algo Trading di terminal MT5, lalu tekan Coba Lagi.' };
      case 'read_only':
        return { title: 'Akun Read-Only', message: 'Akun ini hanya bisa melihat. Gunakan password trading (bukan password investor), lalu Coba Lagi.' };
      case 'disconnected':
        return { title: 'Koneksi Broker Terputus', message: 'Koneksi ke broker terputus. Kami mencoba menyambung ulang — coba lagi beberapa saat.' };
      case 'auth_failed':
        return { title: 'Login MT5 Gagal', message: 'Periksa nomor akun, password, dan server MT5 Anda, lalu Coba Lagi.' };
      case 'provision_failed':
        return { title: 'Terminal Belum Siap', message: 'Terminal sedang disiapkan. Coba lagi beberapa saat atau hubungi admin.' };
      case 'symbol_missing':
        return { title: 'Simbol Tidak Tersedia', message: 'Broker Anda tidak menyediakan simbol yang dibutuhkan. Gunakan akun dari broker yang didukung.' };
      case 'worker_crash':
        return { title: 'Sesi Terhenti', message: 'Sesi copy trading terhenti. Tekan Coba Lagi untuk memulai ulang.' };
      case 'open_positions':
        return { title: 'Posisi Masih Terbuka', message: 'Masih ada posisi copy terbuka. Tutup posisi master dulu, lalu coba lagi.' };
      case 'slots_full':
        return { title: 'Slot Penuh', message: 'Semua slot copy trading sedang terpakai. Coba lagi nanti.' };
      case 'service_busy':
      case 'bridge_unreachable':
        return { title: 'Layanan Sibuk', message: 'Layanan copy trading sedang sibuk. Coba lagi sebentar.' };
      default:
        // Fallback berdasarkan flag/status.
        if (isReadOnly) return { title: 'Akun Read-Only', message: 'Akun ini hanya bisa melihat. Gunakan password trading (bukan investor).' };
        if (algoOff) return { title: 'Algo Trading Nonaktif', message: 'Aktifkan Algo Trading di terminal MT5, lalu Coba Lagi.' };
        return { title: 'Koneksi Gagal', message: slotError || 'Tidak dapat terhubung ke akun MT5. Periksa akun, password, dan server.' };
    }
  })();

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const stopDataPolling = useCallback(() => {
    if (dataPollRef.current) {
      clearInterval(dataPollRef.current);
      dataPollRef.current = null;
    }
  }, []);

  const loadSlot = useCallback(async () => {
    try {
      const res = await copytradeApi.getStatus();
      const data = res.data;
      if (!data || !data.slot_id) {
        setSlot(null);
        setAccount(null);
        setPositions([]);
        setShowForm(false);
        return;
      }
      setSlot(data);
      // Jika masih antre/menunggu, jangan ambil account dulu.
      if (data.status === 'active' || data.status === 'ready') {
        try {
          const [accRes, posRes] = await Promise.all([
            copytradeApi.getAccount(),
            copytradeApi.getPositions(),
          ]);
          setAccount(accRes.data ?? null);
          setPositions(posRes.data?.positions ?? []);
        } catch (e) {
          // account/positions belum tersedia — biarkan kosong
        }
      } else {
        setAccount(null);
        setPositions([]);
      }
    } catch (e) {
      setSlot(null);
      setAccount(null);
      setPositions([]);
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadSlot();
      return () => {
        stopPolling();
        stopDataPolling();
      };
    }, [loadSlot, stopPolling, stopDataPolling])
  );

  // Polling status:
  // - queued/waiting_credentials → tunggu giliran → activate (5s)
  // - active/ready → pantau apakah berubah jadi error (10s)
  useEffect(() => {
    const status = slot?.status;
    if (!status || status === 'error' || status === 'releasing') {
      stopPolling();
      return;
    }

    const isPending = status === 'queued' || status === 'waiting_credentials';
    const intervalMs = isPending ? 5000 : 10000;

    pollRef.current = setInterval(async () => {
      try {
        const res = await copytradeApi.getStatus();
        const data = res.data;
        if (!data || !data.slot_id) {
          stopPolling();
          setSlot(null);
          setAccount(null);
          setPositions([]);
          setShowForm(false);
          return;
        }
        setSlot(data);

        if (data.status === 'waiting_credentials') {
          // terminal sudah dialokasikan, kirim ulang kredensial
          stopPolling();
          try {
            const act = await copytradeApi.activate();
            setSlot({ ...data, status: act.data?.status ?? 'active' });
            await loadSlot();
          } catch (e: any) {
            alert.showAlert({ title: 'Error', message: e.message || 'Gagal mengaktifkan copy trading', type: 'error' });
          }
        } else if (data.status === 'active' || data.status === 'ready') {
          // aktif: hentikan polling cepat, refresh data + pantau error
          if (isPending) {
            stopPolling();
            await loadSlot();
          }
        } else if (data.status === 'error') {
          stopPolling();
        }
      } catch (e) {
        // abaikan transient error saat polling
      }
    }, intervalMs);

    return () => stopPolling();
  }, [slot?.status, stopPolling, loadSlot, alert]);

  // Polling data akun + posisi (angka bergerak mendekati real-time) tiap 2 detik,
  // hanya saat slot aktif. Dihentikan saat keluar layar / status berubah.
  useEffect(() => {
    if (!slot || !['active', 'ready'].includes(slot.status)) {
      stopDataPolling();
      return;
    }
    const fetchData = async () => {
      try {
        const [accRes, posRes] = await Promise.all([
          copytradeApi.getAccount(),
          copytradeApi.getPositions(),
        ]);
        setAccount(accRes.data ?? null);
        setPositions(posRes.data?.positions ?? []);
      } catch (e) {
        // abaikan transient error saat polling data
      }
    };
    dataPollRef.current = setInterval(fetchData, 2000);
    return () => stopDataPolling();
  }, [slot?.status, stopDataPolling]);

  const handleSubscribe = async () => {
    if (!accountInput.trim() || !password.trim() || !server.trim()) {
      alert.showAlert({ title: 'Error', message: 'Semua field wajib diisi', type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await copytradeApi.subscribe(accountInput.trim(), password.trim(), server.trim(), 1.0);
      const status = res.data?.status ?? 'queued';
      setShowForm(false);
      alert.showAlert({
        title: 'Berhasil',
        message: status === 'active' ? 'Copy trading aktif' : 'Menunggu giliran terminal...',
        type: 'success',
      });
      await loadSlot();
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Gagal menghubungkan akun MT5', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleCopy = async () => {
    if (!slot?.slot_id) return;
    setToggling(true);
    try {
      const next = !copyEnabled;
      await copytradeApi.toggleCopy(next);
      setSlot({ ...slot, copy_enabled: next });
      alert.showAlert({
        title: 'Berhasil',
        message: next ? 'Copy trading diaktifkan' : 'Copy trading dinonaktifkan',
        type: 'success',
      });
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Gagal mengubah status copy', type: 'error' });
    } finally {
      setToggling(false);
    }
  };

  const handleUnsubscribe = async (opts?: { quiet?: boolean }) => {
    const quiet = opts?.quiet ?? false;
    try {
      await copytradeApi.unsubscribe();
      if (!quiet) alert.showAlert({ title: 'Selesai', message: 'Copy trading dihentikan', type: 'success' });
    } catch (e: any) {
      // Bila release gagal (mis. slot sudah error/lepas), tetap bersihkan state lokal
      // agar user bisa mencoba lagi — pesan hanya ditampilkan bila bukan mode quiet.
      if (!quiet) alert.showAlert({ title: 'Error', message: e.message || 'Gagal menghentikan copy trading', type: 'error' });
    } finally {
      stopPolling();
      stopDataPolling();
      setSlot(null);
      setAccount(null);
      setPositions([]);
      setShowForm(false);
      setAccountInput('');
      setPassword('');
      setServer('');
    }
  };

  if (!getToken()) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <View style={styles.center}><Text style={{ color: c.text.secondary }}>Login untuk menggunakan Copy Trading</Text></View>
      </SafeAreaView>
    );
  }

  const statusLabel = slot?.status === 'queued' ? 'Menunggu giliran'
    : slot?.status === 'waiting_credentials' ? 'Menyiapkan terminal...'
    : slot?.status === 'releasing' ? 'Melepas...'
    : slot?.status === 'error' ? 'Error'
    : isReadOnly ? 'Read-Only'
    : algoOff ? 'Algo Off'
    : isCopying ? 'Aktif'
    : 'Tidak terhubung';

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
        ) : slot ? (
          <>
            {/* ── Status Card ── */}
            <GlassCard elevation={2} style={styles.accInfoCard}>
              <View style={styles.accInfoHeader}>
                <User size={20} color={c.accent.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.accName, { color: c.text.primary }]}>
                    {slot.slot?.login ? `#${slot.slot.login}` : `Slot ${slot.slot_id}`}
                  </Text>
                  <Text style={[styles.accLogin, { color: c.text.secondary }]}>
                    {slot.slot?.server ?? '-'}
                  </Text>
                </View>
                <View style={[
                  styles.statusPill,
                  { backgroundColor: isCopying ? c.semantic.positive + '20' : c.glass.g1, borderColor: isCopying ? c.semantic.positive + '4D' : c.glass.borderStrong },
                ]}>
                  <Text style={[styles.statusPillText, { color: isCopying ? c.semantic.positive : c.text.secondary }]}>
                    {statusLabel}
                  </Text>
                </View>
              </View>
            </GlassCard>

            {/* ── Error / Peringatan Banner ── */}
            {hasBlockingIssue && (
              <GlassCard elevation={2} style={[styles.errorCard, { borderColor: c.semantic.negative + '55' }]}>
                <View style={styles.errorRow}>
                  <Shield size={20} color={c.semantic.negative} />
                  <Text style={[styles.errorTitle, { color: c.semantic.negative }]}>
                    {errorInfo.title}
                  </Text>
                </View>
                <Text style={[styles.errorMsg, { color: c.text.secondary }]}>
                  {errorInfo.message}
                </Text>
                {/* Baris debug: kode + slot + error mentah (memudahkan pelacakan) */}
                <Text style={{ fontSize: 10, color: c.text.muted, marginTop: 8, fontFamily: 'DMSans' }} numberOfLines={3}>
                  {`Kode: ${slot?.error_code || '-'} · Slot: ${slot?.slot_id || '-'}${slotError ? ` · ${slotError}` : ''}`}
                </Text>
                <AppButton
                  title="Coba Lagi"
                  variant="primary"
                  onPress={async () => { await handleUnsubscribe({ quiet: true }); setShowForm(true); }}
                  style={{ marginTop: 12, alignSelf: 'stretch' }}
                />
              </GlassCard>
            )}

            {/* ── Balance Sheet ── */}
            {isCopying && account && (
              <GlassCard elevation={2} style={styles.balanceCard}>
                <Text style={[styles.bsTitle, { color: c.accent.gold }]}>BALANCE SHEET</Text>
                <View style={styles.bsGrid}>
                  <View style={[styles.bsItem, { borderRightWidth: 1, borderColor: c.glass.border, borderBottomWidth: 1 }]}>
                    <Text style={[styles.bsLabel, { color: c.text.secondary }]}>Balance</Text>
                    <Text style={[styles.bsValue, { color: c.text.primary }]}>{formatCurrency(Number(account.balance ?? 0))}</Text>
                  </View>
                  <View style={[styles.bsItem, { borderBottomWidth: 1, borderColor: c.glass.border }]}>
                    <Text style={[styles.bsLabel, { color: c.text.secondary }]}>Equity</Text>
                    <Text style={[styles.bsValue, { color: c.text.primary }]}>{formatCurrency(Number(account.equity ?? 0))}</Text>
                  </View>
                  <View style={[styles.bsItem, { borderRightWidth: 1, borderColor: c.glass.border, borderBottomWidth: 1 }]}>
                    <Text style={[styles.bsLabel, { color: c.text.secondary }]}>Profit</Text>
                    <Text style={[styles.bsValue, { color: Number(account.profit ?? 0) >= 0 ? c.semantic.positive : c.semantic.negative }]}>
                      {formatCurrency(Number(account.profit ?? 0))}
                    </Text>
                  </View>
                  <View style={[styles.bsItem, { borderBottomWidth: 1, borderColor: c.glass.border }]}>
                    <Text style={[styles.bsLabel, { color: c.text.secondary }]}>Margin</Text>
                    <Text style={[styles.bsValue, { color: c.text.primary }]}>{formatCurrency(Number(account.margin ?? 0))}</Text>
                  </View>
                  <View style={[styles.bsItem, { borderRightWidth: 1, borderColor: c.glass.border }]}>
                    <Text style={[styles.bsLabel, { color: c.text.secondary }]}>Free Margin</Text>
                    <Text style={[styles.bsValue, { color: c.text.primary }]}>{formatCurrency(Number(account.margin_free ?? 0))}</Text>
                  </View>
                  <View style={[styles.bsItem]}>
                    <Text style={[styles.bsLabel, { color: c.text.secondary }]}>Leverage</Text>
                    <Text style={[styles.bsValue, { color: c.text.primary }]}>{account.leverage != null ? `1:${account.leverage}` : '--'}</Text>
                  </View>
                </View>
              </GlassCard>
            )}

            {/* ── Copy Toggle ── */}
            {isCopying && (
              <GlassCard elevation={2} style={styles.balanceCard}>
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.toggleTitle, { color: c.text.primary }]}>Salin Posisi</Text>
                    <Text style={[styles.toggleSub, { color: c.text.secondary }]}>
                      {copyEnabled ? 'Copy ON — menyalin posisi master' : 'Copy OFF — tidak menyalin posisi baru'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleToggleCopy}
                    disabled={toggling}
                    style={[
                      styles.toggleBtn,
                      { backgroundColor: copyEnabled ? c.semantic.positive : c.glass.g1, borderColor: copyEnabled ? c.semantic.positive : c.glass.borderStrong },
                      toggling && { opacity: 0.6 },
                    ]}
                  >
                    {copyEnabled ? <Pause size={16} color="#fff" /> : <Play size={16} color={c.text.primary} />}
                  </TouchableOpacity>
                </View>
              </GlassCard>
            )}

            {/* ── Open Positions ── */}
            {isCopying && (
              <GlassCard elevation={2} style={styles.positionsCard}>
                <Text style={[styles.bsTitle, { color: c.accent.gold }]}>OPEN POSITIONS</Text>
                {positions.length > 0 ? (
                  positions.slice(0, 20).map((pos, i) => {
                    const isPositive = Number(pos.profit ?? 0) >= 0;
                    const isBuy = (pos.side ?? 'BUY') === 'BUY';
                    return (
                      <View key={pos.ticket ?? i} style={[styles.positionCard, { backgroundColor: c.glass.g1, borderColor: c.glass.borderStrong }]}>
                        <View style={styles.posHeader}>
                          <View style={styles.posSymbol}>
                            <Activity size={14} color={c.accent.purple} />
                            <Text style={[styles.posSymbolText, { color: c.text.primary }]}>{pos.symbol ?? 'N/A'}</Text>
                            <View style={[
                              styles.posType,
                              isBuy
                                ? { backgroundColor: c.semantic.positive + '20', borderColor: c.semantic.positive + '4D' }
                                : { backgroundColor: c.semantic.negative + '20', borderColor: c.semantic.negative + '4D' },
                            ]}>
                              <Text style={[styles.posTypeText, { color: isBuy ? c.semantic.positive : c.semantic.negative }]}>{pos.side}</Text>
                            </View>
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
                        <View style={styles.posRow}>
                          <Text style={[styles.posDetail, { color: c.text.secondary }]}>
                            Vol: {pos.volume ?? '-'}
                          </Text>
                          <Text style={[styles.posDetail, { color: c.text.secondary }]}>
                            Open: {pos.price_open != null ? Number(pos.price_open).toFixed(5) : '--'}
                          </Text>
                        </View>
                        {(pos.sl != null || pos.tp != null) ? (
                          <View style={styles.posRow}>
                            <Text style={[styles.posDetail, { color: c.text.secondary }]}>
                              SL: {pos.sl != null ? Number(pos.sl).toFixed(5) : '--'}
                            </Text>
                            <Text style={[styles.posDetail, { color: c.text.secondary }]}>
                              TP: {pos.tp != null ? Number(pos.tp).toFixed(5) : '--'}
                            </Text>
                          </View>
                        ) : null}
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
            )}

            {/* ── Disconnect ── */}
            <TouchableOpacity
              onPress={() => handleUnsubscribe()}
              style={[styles.unsubscribeBtn, { backgroundColor: c.semantic.negative + '14', borderColor: c.semantic.negative + '33' }]}
            >
              <Trash2 size={16} color={c.semantic.negative} />
              <Text style={[styles.unsubscribeText, { color: c.semantic.negative }]}>Putuskan Akun MT5</Text>
            </TouchableOpacity>
          </>
        ) : showForm ? (
          <GlassCard elevation={2} style={styles.formCard}>
            <Text style={[styles.formTitle, { color: c.text.primary }]}>Connect MT5 Account</Text>
            <Text style={[styles.formLabel, { color: c.text.secondary }]}>MT5 ACCOUNT</Text>
            <View style={[styles.inputBox, { backgroundColor: c.glass.g1, borderColor: c.glass.border }]}>
              <TextInput
                style={[styles.input, { color: c.text.primary }]}
                value={accountInput}
                onChangeText={setAccountInput}
                placeholder="12345678"
                placeholderTextColor={c.text.muted}
              />
            </View>
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
            <Text style={[styles.formLabel, { color: c.text.secondary }]}>SERVER</Text>
            <View style={[styles.inputBox, { backgroundColor: c.glass.g1, borderColor: c.glass.border }]}>
              <TextInput
                style={[styles.input, { color: c.text.primary }]}
                value={server}
                onChangeText={setServer}
                placeholder="MetaQuotes-Demo"
                placeholderTextColor={c.text.muted}
                autoCapitalize="none"
              />
            </View>
            <AppButton
              title="Connect"
              loading={submitting}
              onPress={handleSubscribe}
              style={{ marginTop: 8, alignSelf: 'stretch' }}
            />
            <TouchableOpacity onPress={() => setShowForm(false)} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: c.text.secondary }]}>Cancel</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          <GlassCard elevation={2} style={styles.emptyCard}>
            <Zap size={48} color={c.accent.purple} />
            <Text style={[styles.emptyTitle, { color: c.text.primary }]}>Copy Trading</Text>
            <Text style={[styles.emptySub, { color: c.text.secondary }]}>
              Hubungkan akun MT5 Anda untuk otomatis menyalin posisi dari trader.
            </Text>
            <AppButton title="Connect MT5 Account" onPress={() => setShowForm(true)} style={{ alignSelf: 'stretch' }} />
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
  backBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', fontFamily: 'Manrope-Bold' },

  accInfoCard: { marginHorizontal: 24, marginBottom: 16, borderRadius: 20, padding: 20 },
  accInfoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  accName: { fontSize: 18, fontWeight: '700', fontFamily: 'Manrope-Bold' },
  accLogin: { fontSize: 13, fontFamily: 'DMSans', marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusPillText: { fontSize: 11, fontWeight: '700', fontFamily: 'DMSans-Bold' },

  errorCard: { marginHorizontal: 24, marginBottom: 16, borderRadius: 20, padding: 20, borderWidth: 1 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  errorTitle: { fontSize: 16, fontWeight: '700', fontFamily: 'Manrope-Bold' },
  errorMsg: { fontSize: 13, lineHeight: 20, fontFamily: 'DMSans' },

  balanceCard: { marginHorizontal: 24, marginBottom: 16, borderRadius: 20, padding: 20 },
  bsTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 1.5, marginBottom: 14, fontFamily: 'DMSans-Bold', textTransform: 'uppercase' },
  bsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  bsItem: { width: '50%', padding: 12 },
  bsLabel: { fontSize: 10, fontWeight: '600', fontFamily: 'DMSans-Bold', marginBottom: 4 },
  bsValue: { fontSize: 17, fontWeight: '600', fontFamily: 'Manrope-SemiBold' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleTitle: { fontSize: 16, fontWeight: '700', fontFamily: 'Manrope-Bold' },
  toggleSub: { fontSize: 12, fontFamily: 'DMSans', marginTop: 4 },
  toggleBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  positionsCard: { marginHorizontal: 24, marginBottom: 16, borderRadius: 20, padding: 20 },
  positionCard: { padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1 },
  posHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  posSymbol: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  posSymbolText: { fontSize: 14, fontWeight: '700', fontFamily: 'DMSans-Bold' },
  posBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  posPnl: { fontSize: 12, fontWeight: '700', fontFamily: 'DMSans-Bold' },
  posType: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  posTypeText: { fontSize: 10, fontWeight: '700', fontFamily: 'DMSans-Bold', textTransform: 'uppercase' },
  posRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  posDetail: { fontSize: 12, fontFamily: 'DMSans' },
  emptyPositions: { alignItems: 'center', paddingVertical: 24 },
  emptyPosText: { fontSize: 13, fontFamily: 'DMSans', marginTop: 8 },

  unsubscribeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 24, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  unsubscribeText: { fontSize: 14, fontWeight: '700', fontFamily: 'DMSans-Bold' },

  emptyCard: { marginHorizontal: 24, padding: 40, borderRadius: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 22, fontWeight: '800', fontFamily: 'Manrope-Bold', marginTop: 16 },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 8, marginBottom: 24, fontFamily: 'DMSans' },

  formCard: { marginHorizontal: 24, padding: 24, borderRadius: 22 },
  formTitle: { fontSize: 18, fontWeight: '800', fontFamily: 'Manrope-Bold', marginBottom: 20 },
  formLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6, fontFamily: 'DMSans-Bold' },
  inputBox: { height: 48, borderRadius: 14, paddingHorizontal: 16, borderWidth: 1, marginBottom: 14, justifyContent: 'center' },
  input: { flex: 1, fontSize: 15, fontFamily: 'DMSans' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  cancelText: { fontSize: 13, fontWeight: '600', fontFamily: 'DMSans-Bold' },
});
