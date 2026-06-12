import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { walletApi, Wallet, WalletHistoryItem } from '../api/wallet';
import { followApi, UserTrader } from '../api/follow';
import { getToken } from '../api/client';

export default function PortfolioScreen() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [history, setHistory] = useState<WalletHistoryItem[]>([]);
  const [followed, setFollowed] = useState<UserTrader[]>([]);
  const [loading, setLoading] = useState(true);

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
});
