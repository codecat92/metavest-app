import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft, Book, Play, FileText, ChevronRight, GraduationCap
} from 'lucide-react-native';
import { academyApi, Academy, AcademyClass, AcademyArticle, AcademyLivestream } from '../api/academy';

export default function AcademyScreen({ navigation }: any) {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [classes, setClasses] = useState<AcademyClass[]>([]);
  const [articles, setArticles] = useState<AcademyArticle[]>([]);
  const [livestreams, setLivestreams] = useState<AcademyLivestream[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'academies' | 'classes' | 'articles' | 'live'>('academies');

  const loadData = useCallback(async () => {
    try {
      const [a, c, ar, l] = await Promise.all([
        academyApi.getAcademies(),
        academyApi.getClasses(),
        academyApi.getArticles(),
        academyApi.getLivestreams(),
      ]);
      setAcademies(a.data ?? []);
      setClasses(c.data ?? []);
      setArticles(ar.data ?? []);
      setLivestreams(l.data ?? []);
    } catch (e) {
      console.log('Academy load failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { setLoading(true); loadData(); }, [loadData])
  );

  const tabs: { key: typeof tab; label: string; Icon: any }[] = [
    { key: 'academies', label: 'Academies', Icon: GraduationCap },
    { key: 'classes', label: 'Classes', Icon: Book },
    { key: 'articles', label: 'Articles', Icon: FileText },
    { key: 'live', label: 'Live', Icon: Play },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#8899AA" />
          </TouchableOpacity>
          <Text style={styles.title}>Academy</Text>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {tabs.map(t => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            >
              <t.Icon size={14} color={tab === t.key ? '#fff' : '#8899AA'} />
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color="#AB4BFF" style={{ marginTop: 60 }} />
        ) : (
          <View style={styles.list}>
            {tab === 'academies' && academies.map(a => (
              <View key={a.id} style={styles.card}>
                <View style={styles.cardIcon}><GraduationCap size={22} color="#AB4BFF" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{a.name}</Text>
                  {a.description ? <Text style={styles.cardDesc}>{a.description}</Text> : null}
                </View>
                <ChevronRight size={16} color="#8899AA" />
              </View>
            ))}
            {tab === 'classes' && classes.map(c => (
              <View key={c.id} style={styles.card}>
                <View style={styles.cardIcon}><Book size={22} color="#F7C948" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{c.name}</Text>
                  <Text style={styles.cardDesc}>{c.description ?? ''}</Text>
                </View>
                <Text style={styles.cardPrice}>{c.price > 0 ? `$${c.price}` : 'Free'}</Text>
              </View>
            ))}
            {tab === 'articles' && articles.map(a => (
              <View key={a.id} style={styles.card}>
                <View style={styles.cardIcon}><FileText size={22} color="#2FEFC4" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{a.title}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>{a.content}</Text>
                </View>
                <Text style={styles.cardChapter}>Ch.{a.chapter}</Text>
              </View>
            ))}
            {tab === 'live' && livestreams.map(l => (
              <View key={l.id} style={styles.card}>
                <View style={[styles.cardIcon, { backgroundColor: 'rgba(255,75,110,0.12)' }]}>
                  <Play size={22} color="#FF4B6E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{l.title}</Text>
                  <Text style={[styles.cardDesc, { color: '#FF4B6E' }]} numberOfLines={1}>{l.link}</Text>
                </View>
                <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE</Text></View>
              </View>
            ))}

            {(
              (tab === 'academies' && academies.length === 0) ||
              (tab === 'classes' && classes.length === 0) ||
              (tab === 'articles' && articles.length === 0) ||
              (tab === 'live' && livestreams.length === 0)
            ) && (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No {tabs.find(t => t.key === tab)?.label} yet</Text>
              </View>
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
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },

  tabRow: { paddingHorizontal: 24, gap: 8, marginBottom: 20 },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.15)',
  },
  tabBtnActive: { backgroundColor: '#AB4BFF', borderColor: '#AB4BFF' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#8899AA' },
  tabTextActive: { color: '#fff' },

  list: { paddingHorizontal: 24, gap: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
    borderRadius: 18, backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.12)',
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: 16,
    backgroundColor: 'rgba(171,75,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  cardDesc: { fontSize: 12, color: '#8899AA', marginTop: 2 },
  cardPrice: { fontSize: 13, fontWeight: '800', color: '#F7C948' },
  cardChapter: { fontSize: 12, fontWeight: '700', color: '#8899AA' },
  liveBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    backgroundColor: 'rgba(255,75,110,0.15)',
  },
  liveBadgeText: { fontSize: 10, fontWeight: '800', color: '#FF4B6E' },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 14, color: '#8899AA' },
});
