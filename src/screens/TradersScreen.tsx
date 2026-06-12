import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, ActivityIndicator, Alert
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Search, Shield, Star, TrendingUp } from 'lucide-react-native';
import { followApi, UserTrader } from '../api/follow';
import { getToken } from '../api/client';

const avatarColors = ['#AB4BFF', '#F7C948', '#2FEFC4', '#FF4B6E', '#8855CC'];

export default function TradersScreen() {
  const [traders, setTraders] = useState<UserTrader[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [followedSet, setFollowedSet] = useState<Set<string>>(new Set());

  const loadTraders = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const response = await followApi.getActive(1);
      setTraders(response.data ?? []);
      const followed = new Set<string>();
      (response.data ?? []).forEach(t => {
        if (t.follow_status === '1') followed.add(t.id);
      });
      setFollowedSet(followed);
    } catch (e) {
      console.log('Failed to load traders:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { setLoading(true); loadTraders(); }, [loadTraders])
  );

  const handleFollow = async (traderId: string) => {
    try {
      await followApi.follow(traderId);
      setFollowedSet(prev => { const n = new Set(prev); n.add(traderId); return n; });
      Alert.alert('Success', 'You are now following this trader');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to follow');
    }
  };

  const sorted = traders.filter(t =>
    (t.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (t.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (!getToken()) {
    return (
      <View style={styles.container}>
        <View style={styles.center}><Text style={styles.centerText}>Login to see traders</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Traders</Text>
            <Text style={styles.subtitle}>Discover top performers</Text>
          </View>
        </View>

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

        {loading ? (
          <ActivityIndicator size="large" color="#AB4BFF" style={{ marginTop: 60 }} />
        ) : (
          <View style={styles.cardList}>
            {sorted.map((trader, i) => {
              const isFollowed = followedSet.has(trader.id);
              const initials = (trader.name ?? 'TR').substring(0, 2).toUpperCase();
              const avatarColor = avatarColors[i % avatarColors.length];
              return (
                <View key={trader.id} style={styles.card}>
                  <View style={styles.topRow}>
                    <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Text style={styles.traderName}>{trader.name}</Text>
                        {trader.status === 1 && <Star size={12} color="#AB4BFF" fill="#AB4BFF" />}
                      </View>
                      {trader.description ? (
                        <Text style={styles.bio} numberOfLines={2}>{trader.description}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => !isFollowed && handleFollow(trader.id)}
                      style={[styles.followBtn, isFollowed && styles.followBtnActive]}
                      disabled={isFollowed}
                    >
                      <Text style={[styles.followBtnText, isFollowed && styles.followBtnTextActive]}>
                        {isFollowed ? 'Following' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.statsRow}>
                    {[
                      { label: 'Status', value: trader.status === 1 ? 'Active' : 'Inactive', color: trader.status === 1 ? '#2FEFC4' : '#8899AA' },
                      { label: 'Trades', value: '--', color: '#AB4BFF' },
                      { label: 'Followers', value: '--', color: '#F7C948' },
                    ].map((s) => (
                      <View key={s.label} style={styles.statBox}>
                        <Text style={styles.statLabel}>{s.label}</Text>
                        <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
            {sorted.length === 0 && !loading && (
              <Text style={styles.emptyText}>No traders found</Text>
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
  center: { flex: 1, alignItems: 'center', marginTop: 200 },
  centerText: { color: '#8899AA' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 8,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 13, color: '#8899AA', marginTop: 2 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 48, borderRadius: 16, paddingHorizontal: 16,
    marginHorizontal: 24, marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
  },
  searchInput: { flex: 1, color: '#F0EEFF', fontSize: 14 },

  cardList: { paddingHorizontal: 24, gap: 14 },
  card: {
    borderRadius: 22, padding: 18,
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.15)',
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  avatar: {
    width: 52, height: 52, borderRadius: 26, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 },
  traderName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  bio: { fontSize: 12, color: 'rgba(240,238,255,0.55)', lineHeight: 17, marginTop: 2 },

  followBtn: {
    height: 34, paddingHorizontal: 14, borderRadius: 12,
    backgroundColor: '#AB4BFF', alignItems: 'center', justifyContent: 'center',
  },
  followBtnActive: {
    backgroundColor: 'rgba(171,75,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.35)',
  },
  followBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  followBtnTextActive: { color: '#AB4BFF' },

  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.1)',
  },
  statLabel: { fontSize: 10, color: '#8899AA', fontWeight: '500' },
  statValue: { fontSize: 13, fontWeight: '800', marginTop: 2 },
  emptyText: { color: '#8899AA', textAlign: 'center', marginTop: 40 },
});
