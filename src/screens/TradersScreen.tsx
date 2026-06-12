import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, ActivityIndicator, Alert
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Search, SlidersHorizontal, TrendingUp, Shield, Star } from 'lucide-react-native';
import { followApi, UserTrader } from '../api/follow';
import { getToken } from '../api/client';

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
      // Track which traders are already followed
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
      setFollowedSet(prev => {
        const next = new Set(prev);
        next.add(traderId);
        return next;
      });
      Alert.alert('Success', 'You are now following this trader');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to follow');
    }
  };

  const sorted = traders
    .filter(t =>
      (t.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? '').toLowerCase().includes(search.toLowerCase())
    );

  if (!getToken()) {
    return (
      <View style={styles.container}>
        <View style={styles.loading}>
          <Text style={{ color: '#8899AA', marginTop: 200 }}>Login to see traders</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
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
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#AB4BFF" style={{ marginTop: 60 }} />
        ) : (
          <View style={styles.cardList}>
            {sorted.map((trader) => {
              const isFollowed = followedSet.has(trader.id);
              const initials = (trader.name ?? 'TR').substring(0, 2).toUpperCase();
              return (
                <View key={trader.id} style={styles.card}>
                  <View style={styles.topRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Text style={styles.traderName}>{trader.name}</Text>
                        {trader.status === 1 && <Star size={12} color="#AB4BFF" fill="#AB4BFF" />}
                      </View>
                      <Text style={styles.bio} numberOfLines={2}>{trader.description}</Text>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <View style={styles.footerLeft}>
                      <View style={styles.metaItem}>
                        <Shield size={12} color="#AB4BFF" />
                        <Text style={styles.metaText}>
                          {trader.status === 1 ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <TrendingUp size={12} color="#8899AA" />
                        <Text style={styles.metaText}>Trader</Text>
                      </View>
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
  loading: { flex: 1, alignItems: 'center' },
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
  bio: { fontSize: 12, color: 'rgba(240,238,255,0.5)', marginTop: 2 },

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
