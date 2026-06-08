import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Image, TextInput
} from 'react-native';
import { useState } from 'react';
import { Search, SlidersHorizontal, TrendingUp, Users, Shield, Star } from 'lucide-react-native';

const traders = [
  {
    id: 1, name: "AlphaWave", handle: "@alphawave", avatar: "AW",
    avatar_url: "https://picsum.photos/seed/alphawave/100/100",
    winRate: "78%", followers: "12.4K", roi: "+142%", risk: "Medium",
    monthlyReturn: "+24.3%", totalTrades: 847,
    bio: "Macro + momentum trader. EUR/USD & GBP/USD specialist.",
    verified: true, tier: "Elite",
  },
  {
    id: 2, name: "TradeMind", handle: "@trademind", avatar: "TM",
    avatar_url: "https://picsum.photos/seed/trademind/100/100",
    winRate: "71%", followers: "8.7K", roi: "+89%", risk: "Low",
    monthlyReturn: "+11.2%", totalTrades: 1240,
    bio: "Risk-managed systematic forex. Low drawdown focus.",
    verified: true, tier: "Pro",
  },
  {
    id: 3, name: "FX Sentinel", handle: "@fxsentinel", avatar: "FS",
    avatar_url: "https://picsum.photos/seed/fxsentinel/100/100",
    winRate: "83%", followers: "21.4K", roi: "+231%", risk: "High",
    monthlyReturn: "+38.7%", totalTrades: 523,
    bio: "Aggressive scalping on majors & gold. High risk, high reward.",
    verified: true, tier: "Elite",
  },
  {
    id: 4, name: "PipMaster", handle: "@pipmaster", avatar: "PM",
    avatar_url: "https://picsum.photos/seed/pipmaster/100/100",
    winRate: "65%", followers: "5.3K", roi: "+67%", risk: "Medium",
    monthlyReturn: "+9.4%", totalTrades: 1890,
    bio: "Multi-pair portfolio trader. Specializes in USD crosses.",
    verified: false, tier: "Pro",
  },
  {
    id: 5, name: "ZenTrader", handle: "@zentrader", avatar: "ZT",
    avatar_url: "https://picsum.photos/seed/zentrader/100/100",
    winRate: "69%", followers: "3.1K", roi: "+54%", risk: "Low",
    monthlyReturn: "+7.8%", totalTrades: 678,
    bio: "Swing trading only. Patient setups, clean entries on majors.",
    verified: false, tier: "Starter",
  },
];

const riskColor: Record<string, string> = { Low: "#2FEFC4", Medium: "#F7C948", High: "#FF4B6E" };
const tierColor: Record<string, string> = { Elite: "#AB4BFF", Pro: "#8855CC", Starter: "#5913B8" };

export default function TradersScreen() {
  const [followed, setFollowed] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<"roi" | "winrate" | "followers">("roi");
  const [search, setSearch] = useState("");

  const sorted = [...traders]
    .filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.handle.includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "roi") return parseFloat(b.roi) - parseFloat(a.roi);
      if (sortBy === "winrate") return parseFloat(b.winRate) - parseFloat(a.winRate);
      return parseFloat(b.followers) - parseFloat(a.followers);
    });

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

          {/* Search */}
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

          {/* Sort */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            <View style={styles.sortRow}>
              <TouchableOpacity style={styles.filterBtn}>
                <SlidersHorizontal size={12} color="#8899AA" />
                <Text style={styles.filterBtnText}>Filter</Text>
              </TouchableOpacity>
              {(['roi', 'winrate', 'followers'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSortBy(s)}
                  style={[styles.sortBtn, sortBy === s && styles.sortBtnActive]}
                >
                  <Text style={[styles.sortBtnText, sortBy === s && styles.sortBtnTextActive]}>
                    {s === "winrate" ? "Win Rate" : s === "roi" ? "ROI" : "Followers"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Trader Cards */}
        <View style={styles.cardList}>
          {sorted.map((trader) => {
            const isFollowed = followed.has(trader.id);
            return (
              <View key={trader.id} style={styles.card}>

                {/* Top row */}
                <View style={styles.topRow}>
                  <Image source={{ uri: trader.avatar_url }} style={styles.avatar} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.traderName}>{trader.name}</Text>
                      {trader.verified && <Star size={12} color="#AB4BFF" fill="#AB4BFF" />}
                      <View style={[styles.tierBadge, { backgroundColor: `${tierColor[trader.tier]}22` }]}>
                        <Text style={[styles.tierText, { color: tierColor[trader.tier] }]}>{trader.tier}</Text>
                      </View>
                    </View>
                    <Text style={styles.handle}>{trader.handle}</Text>
                    <Text style={styles.bio}>{trader.bio}</Text>
                  </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                  {[
                    { label: "ROI", value: trader.roi, color: "#2FEFC4" },
                    { label: "Win Rate", value: trader.winRate, color: "#AB4BFF" },
                    { label: "Monthly", value: trader.monthlyReturn, color: "#2FEFC4" },
                  ].map((stat) => (
                    <View key={stat.label} style={styles.statBox}>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                      <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                    </View>
                  ))}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                  <View style={styles.footerLeft}>
                    <View style={styles.metaItem}>
                      <Users size={12} color="#8899AA" />
                      <Text style={styles.metaText}>{trader.followers}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Shield size={12} color={riskColor[trader.risk]} />
                      <Text style={[styles.metaText, { color: riskColor[trader.risk], fontWeight: '600' }]}>
                        {trader.risk}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <TrendingUp size={12} color="#8899AA" />
                      <Text style={styles.metaText}>{trader.totalTrades} trades</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => toggleFollow(trader.id)}
                    style={[styles.followBtn, isFollowed && styles.followBtnActive]}
                  >
                    <Text style={[styles.followBtnText, isFollowed && styles.followBtnTextActive]}>
                      {isFollowed ? "Following" : "Follow"}
                    </Text>
                  </TouchableOpacity>
                </View>

              </View>
            );
          })}
        </View>
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
  avatar: {
    width: 48, height: 48, borderRadius: 24, flexShrink: 0,
    borderWidth: 2, borderColor: 'rgba(171,75,255,0.4)',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  traderName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  tierBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  tierText: { fontSize: 10, fontWeight: '700' },
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