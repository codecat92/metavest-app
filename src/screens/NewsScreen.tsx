import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, ActivityIndicator
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Search, Clock } from 'lucide-react-native';
import { newsApi, Article } from '../api/news';

const categories = ['All', 'Market', 'Education'];

export default function NewsScreen({ navigation }: any) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [academy, setAcademy] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const loadNews = useCallback(async () => {
    try {
      const [articleRes, academyRes] = await Promise.all([
        newsApi.getArticles(),
        newsApi.getAcademy(),
      ]);
      setArticles(articleRes.data ?? []);
      setAcademy(academyRes.data ?? []);
    } catch (e) {
      console.log('News load failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { setLoading(true); loadNews(); }, [loadNews])
  );

  // Merge articles + academy, tag them for category filtering
  const allItems: (Article & { tag: string })[] = [
    ...articles.map(a => ({ ...a, tag: 'Market' })),
    ...academy.map(a => ({ ...a, tag: 'Education' })),
  ];

  const filtered = allItems.filter(item => {
    const matchCat = activeCategory === 'All' || item.tag === activeCategory;
    const matchSearch = item.title?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const tagColors: Record<string, string> = {
    Market: '#AB4BFF',
    Education: '#2FEFC4',
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#8899AA" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>News & Education</Text>
            <Text style={styles.subtitle}>Market updates & learning</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Search size={15} color="#8899AA" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search articles..."
            placeholderTextColor="#8899AA"
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[styles.categoryBtn, activeCategory === cat && styles.categoryBtnActive]}
            >
              <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color="#AB4BFF" style={{ marginTop: 60 }} />
        ) : (
          <View style={styles.articleList}>
            {filtered.map((article, i) => {
              const tagColor = tagColors[article.tag] ?? '#8899AA';
              return (
                <View key={`${article.tag}-${article.id}`} style={styles.articleCard}>
                  <View style={styles.articleContent}>
                    <View style={styles.metaRow}>
                      <View style={[styles.tagBadge, {
                        backgroundColor: `${tagColor}18`,
                        borderColor: `${tagColor}44`,
                      }]}>
                        <Text style={[styles.tagText, { color: tagColor }]}>{article.tag}</Text>
                      </View>
                      <Text style={styles.dateText}>
                        {article.created_at ? new Date(article.created_at).toLocaleDateString() : ''}
                      </Text>
                    </View>
                    <Text style={styles.articleTitle}>{article.title}</Text>
                    <Text style={styles.articleExcerpt} numberOfLines={3}>{article.content}</Text>
                    <View style={styles.readTimeRow}>
                      <Clock size={11} color="#8899AA" />
                      <Text style={styles.readTimeText}>
                        {Math.ceil((article.content?.length ?? 0) / 500) || 1} min read
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
            {filtered.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No articles found</Text>
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
  scroll: { paddingBottom: 40 },

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
  subtitle: { fontSize: 13, color: '#8899AA', marginTop: 2 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 46, borderRadius: 14, paddingHorizontal: 16,
    marginHorizontal: 24, marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
  },
  searchInput: { flex: 1, color: '#F0EEFF', fontSize: 14 },

  categoryRow: { paddingHorizontal: 24, gap: 8, marginBottom: 20 },
  categoryBtn: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.15)',
  },
  categoryBtnActive: {
    backgroundColor: 'rgba(171,75,255,0.2)',
    borderColor: 'rgba(171,75,255,0.5)',
  },
  categoryText: { fontSize: 12, fontWeight: '700', color: '#8899AA' },
  categoryTextActive: { color: '#AB4BFF' },

  articleList: { paddingHorizontal: 24, gap: 14 },
  articleCard: {
    borderRadius: 20, overflow: 'hidden',
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.12)',
  },
  articleContent: { padding: 16 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  tagBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  tagText: { fontSize: 10, fontWeight: '700' },
  dateText: { fontSize: 11, color: '#8899AA' },

  articleTitle: { fontSize: 15, fontWeight: '700', color: '#fff', lineHeight: 22, marginBottom: 8 },
  articleExcerpt: { fontSize: 12, color: '#8899AA', lineHeight: 18, marginBottom: 10 },
  readTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  readTimeText: { fontSize: 11, color: '#8899AA' },

  emptyState: { alignItems: 'center', paddingVertical: 64 },
  emptyText: { fontSize: 14, color: '#8899AA' },
});
