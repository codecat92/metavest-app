import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, ActivityIndicator
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft, Server, Key, User, Zap, Activity,
  TrendingUp, Shield, Trash2
} from 'lucide-react-native';
import { copytradeApi, Mt5Account } from '../api/copytrade';
import { getToken } from '../api/client';
import { useCustomAlert } from '../context/AlertContext';

export default function CopyTradeScreen({ navigation }: any) {
  const alert = useCustomAlert();
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
      if (mt5?.data) setMt5Account(mt5.data);
      if (pos?.data) setPositions(pos.data);
    } catch (e) {
      // Not subscribed yet — that's OK
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
      // MT5 middleware might be down — show the error but accept the subscription
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
      <View style={styles.container}>
        <View style={styles.center}><Text style={styles.centerText}>Login to use Copy Trading</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#8899AA" />
          </TouchableOpacity>
          <Text style={styles.title}>Copy Trading</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#AB4BFF" style={{ marginTop: 60 }} />
        ) : subscriber ? (
          <>
            {/* MT5 Account Info */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Shield size={18} color="#2FEFC4" />
                <Text style={styles.cardTitle}>MT5 Account Connected</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <User size={14} color="#8899AA" />
                  <Text style={styles.infoLabel}>Account</Text>
                  <Text style={styles.infoValue}>{subscriber.account}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Server size={14} color="#8899AA" />
                  <Text style={styles.infoLabel}>Server</Text>
                  <Text style={styles.infoValue}>{subscriber.mt5_server}</Text>
                </View>
              </View>
            </View>

            {/* Balance & Equity */}
            {mt5Account && (
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Balance</Text>
                  <Text style={styles.statValue}>
                    ${Number(mt5Account.balance ?? 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Equity</Text>
                  <Text style={styles.statValue}>
                    ${Number(mt5Account.equity ?? 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Free Margin</Text>
                  <Text style={[styles.statValue, { fontSize: 18 }]}>
                    ${Number(mt5Account.free_margin ?? 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            {/* Positions */}
            {positions && positions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Open Positions</Text>
                {positions.slice(0, 10).map((pos: any, i: number) => (
                  <View key={i} style={styles.positionCard}>
                    <View style={styles.posHeader}>
                      <View style={styles.posSymbol}>
                        <Activity size={14} color="#AB4BFF" />
                        <Text style={styles.posSymbolText}>{pos.symbol ?? 'N/A'}</Text>
                      </View>
                      <View style={[styles.posBadge, {
                        backgroundColor: Number(pos.profit ?? 0) >= 0 ? 'rgba(47,239,196,0.12)' : 'rgba(255,75,110,0.12)',
                        borderColor: Number(pos.profit ?? 0) >= 0 ? 'rgba(47,239,196,0.3)' : 'rgba(255,75,110,0.3)',
                      }]}>
                        <TrendingUp size={11} color={Number(pos.profit ?? 0) >= 0 ? '#2FEFC4' : '#FF4B6E'} />
                        <Text style={[styles.posPnl, { color: Number(pos.profit ?? 0) >= 0 ? '#2FEFC4' : '#FF4B6E' }]}>
                          ${Number(pos.profit ?? 0).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.posDetails}>
                      <Text style={styles.posDetail}>Vol: {pos.volume ?? '-'}</Text>
                      <Text style={styles.posDetail}>Open: {pos.open_price ?? '-'}</Text>
                      <Text style={styles.posDetail}>Current: {pos.current_price ?? '-'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Unsubscribe */}
            <TouchableOpacity onPress={handleUnsubscribe} style={styles.unsubscribeBtn}>
              <Trash2 size={16} color="#FF4B6E" />
              <Text style={styles.unsubscribeText}>Disconnect MT5 Account</Text>
            </TouchableOpacity>
          </>
        ) : showForm ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Connect MT5 Account</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>MT5 ACCOUNT</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={account}
                  onChangeText={setAccount}
                  placeholder="12345678"
                  placeholderTextColor="#8899AA"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="MT5 password"
                  placeholderTextColor="#8899AA"
                  secureTextEntry
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>SERVER</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={server}
                  onChangeText={setServer}
                  placeholder="ICMarkets-Demo"
                  placeholderTextColor="#8899AA"
                  autoCapitalize="none"
                />
              </View>
            </View>
            <TouchableOpacity
              onPress={handleSubscribe}
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitText}>Connect</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowForm(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Zap size={48} color="#AB4BFF" />
            <Text style={styles.emptyTitle}>Copy Trading</Text>
            <Text style={styles.emptySub}>
              Automatically copy trades from your followed traders to your MT5 account.
            </Text>
            <TouchableOpacity onPress={() => setShowForm(true)} style={styles.connectBtn}>
              <Text style={styles.connectBtnText}>Connect MT5 Account</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1439' },
  scroll: { paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', marginTop: 200 },
  centerText: { color: '#8899AA' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },

  card: {
    marginHorizontal: 24, padding: 20, borderRadius: 22, marginBottom: 20,
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  infoRow: { flexDirection: 'row', gap: 20 },
  infoItem: { flex: 1, gap: 4 },
  infoLabel: { fontSize: 10, color: '#8899AA', fontWeight: '600' },
  infoValue: { fontSize: 14, fontWeight: '800', color: '#fff' },

  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 24, marginBottom: 20 },
  statCard: {
    flex: 1, padding: 14, borderRadius: 16, alignItems: 'center',
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.12)',
  },
  statLabel: { fontSize: 10, color: '#8899AA', fontWeight: '600' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#fff', marginTop: 4 },

  section: { paddingHorizontal: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },
  positionCard: {
    padding: 14, borderRadius: 16, marginBottom: 8,
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.12)',
  },
  posHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  posSymbol: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  posSymbolText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  posBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  posPnl: { fontSize: 12, fontWeight: '700' },
  posDetails: { flexDirection: 'row', gap: 14 },
  posDetail: { fontSize: 12, color: '#8899AA' },

  unsubscribeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 24, paddingVertical: 14, borderRadius: 16,
    backgroundColor: 'rgba(255,75,110,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,75,110,0.2)',
  },
  unsubscribeText: { fontSize: 14, fontWeight: '700', color: '#FF4B6E' },

  emptyCard: {
    marginHorizontal: 24, padding: 40, borderRadius: 24, alignItems: 'center',
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 16 },
  emptySub: { fontSize: 13, color: '#8899AA', textAlign: 'center', lineHeight: 20, marginTop: 8, marginBottom: 24 },
  connectBtn: {
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#AB4BFF',
  },
  connectBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  formCard: {
    marginHorizontal: 24, padding: 24, borderRadius: 22,
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
  },
  formTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 20 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '600', color: '#8899AA', letterSpacing: 0.5, marginBottom: 6 },
  inputBox: {
    height: 48, borderRadius: 14, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
  },
  input: { flex: 1, color: '#fff', fontSize: 15 },
  submitBtn: {
    height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#AB4BFF', marginTop: 8,
  },
  submitText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  cancelText: { fontSize: 13, fontWeight: '600', color: '#8899AA' },
});
