import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Image, TextInput, ActivityIndicator
} from 'react-native';
import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, TrendingUp, Users, Shield, Star } from 'lucide-react-native';
import { tradersApi, Trader } from '../api/traders';

const riskLevels = ['Low', 'Medium', 'High'] as const;
const riskColor: Record<string, string> = { Low: '#2FEFC4', Medium: '#F7C948', High: '#FF4B6E' };
const tierColor: Record<string, string> = { Elite: '#AB4BFF', Pro: '#8855CC', Starter: '#5913B8' };

export default function TradersScreen() {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'status'>('name');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTraders();
  }, []);

  const loadTraders = async () => {
    try {
      const response = await tradersApi.getAll(1);
      setTraders(response.data ?? []);
    } catch (e) {
      console.log('Failed to load traders:', e);
    } finally {
      setLoading(false);
    }
  };

  const sorted = traders
    .filter((t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => sortBy === 'name'
      ? (a.name ?? '').localeCompare(b.name ?? '')
      : (b.status ?? 0) - (a.status ?? 0)
    );

  const toggleFollow = (id: number) => {
    const next = new Set(followed);
    next.has(id) ? next.delete(id) : next.add(id);
    setFollowed(next);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Traders</Text>
          <Text style={styles.subtitle}>Discover top performers</Text>

          <View style={styles.searchBox}>
            <Search size={16} color="#8899AA" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search traders..."
              placeholderTextColor="#8899AA"
              style={styles.searchInput}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            <View style={styles.sortRow}>
              <TouchableOpacity style={styles.filterBtn}>
                <SlidersHorizontal size={12} color="#8899AA" />
                <Text style={styles.filterBtnText}>Filter</Text>
              </TouchableOpacity>
              {(['name', 'status'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSortBy(s)}
                  style={[styles.sortBtn, sortBy === s && styles.sortBtnActive]}
                >
                  <Text style={[styles.sortBtnText, sortBy === s && styles.sortBtnTextActive]}>
                    {s === 'name' ? 'Name' : 'Active'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#AB4BFF" style={{ marginTop: 60 }} />
        ) : (
          <View style={styles.cardList}>
            {sorted.map((trader) => {
              const isFollowed = followed.has(trader.id);
              const risk = riskLevels[trader.id % 3];
              return (
                <View key={trader.id} style={styles.card}>
                  <View style={styles.topRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {trader.name?.substring(0, 2).toUpperCase() ?? 'TR'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Text style={styles.traderName}>{trader.name}</Text>
                        {trader.status === 1 && <Star size={12} color="#AB4BFF" fill="#AB4BFF" />}
                      </View>
                      <Text style={styles.handle}>{trader.server}</Text>
                      <Text style={styles.bio} numberOfLines={2}>{trader.description}</Text>
                    </View>
                  </View>

                  <View style={styles.statsRow}>
                    {[
                      { label: 'Broker', value: trader.id_broker ?? '-', color: '#AB4BFF' },
                      { label: 'Status', value: trader.status === 1 ? 'Active' : 'Inactive', color: trader.status === 1 ? '#2FEFC4' : '#8899AA' },
                      { label: 'Risk', value: risk, color: riskColor[risk] },
                    ].map((stat) => (
                      <View key={stat.label} style={styles.statBox}>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                        <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.footer}>
                    <View style={styles.footerLeft}>
                      <View style={styles.metaItem}>
                        <Shield size={12} color={riskColor[risk]} />
                        <Text style={[styles.metaText, { color: riskColor[risk], fontWeight: '600' }]}>
                          {risk}
                        </Text>
                      </View>
                      {trader.url ? (
                        <View style={styles.metaItem}>
                          <TrendingUp size={12} color="#8899AA" />
                          <Text style={styles.metaText} numberOfLines={1}>{trader.url}</Text>
                        </View>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleFollow(trader.id)}
                      style={[styles.followBtn, isFollowed && styles.followBtnActive]}
                    >
                      <Text style={[styles.followBtnText, isFollowed && styles.followBtnTextActive]}>
                        {isFollowed ? 'Following' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            {sorted.length === 0 && !loading && (
              <Text style={{ color: '#8899AA', textAlign: 'center', marginTop: 40 }}>
                No traders found
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1439' },
  scroll: { paddingBottom: 100 },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 13, color: '#8899AA', marginTop: 2, marginBottom: 16 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 48, borderRadius: 16, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
  },
  searchInput: { flex: 1, color: '#F0EEFF', fontSize: 14 },

  sortRow: { flexDirection: 'row', gap: 8, paddingRight: 24 },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
  },
  filterBtnText: { fontSize: 12, fontWeight: '600', color: '#8899AA' },
  sortBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.15)',
  },
  sortBtnActive: {
    backgroundColor: 'rgba(171,75,255,0.2)',
    borderColor: 'rgba(171,75,255,0.5)',
  },
  sortBtnText: { fontSize: 12, fontWeight: '600', color: '#8899AA' },
  sortBtnTextActive: { color: '#AB4BFF' },

  cardList: { paddingHorizontal: 24, gap: 16 },
  card: {
    borderRadius: 24, padding: 18,
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.15)',
  },

  topRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24, flexShrink: 0,
    backgroundColor: '#AB4BFF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(171,75,255,0.4)',
  },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  traderName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  handle: { fontSize: 12, color: '#8899AA', marginTop: 2 },
  bio: { fontSize: 12, color: 'rgba(240,238,255,0.5)', marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statBox: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.1)',
  },
  statLabel: { fontSize: 10, color: '#8899AA', fontWeight: '500' },
  statValue: { fontSize: 14, fontWeight: '800', marginTop: 2 },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerLeft: { flexDirection: 'row', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#8899AA' },

  followBtn: {
    height: 36, paddingHorizontal: 16, borderRadius: 12,
    backgroundColor: '#AB4BFF',
    alignItems: 'center', justifyContent: 'center',
  },
  followBtnActive: {
    backgroundColor: 'rgba(171,75,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.35)',
  },
  followBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  followBtnTextActive: { color: '#AB4BFF' },
});
