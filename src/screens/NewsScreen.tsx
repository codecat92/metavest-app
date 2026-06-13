import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, ActivityIndicator
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Clock } from 'lucide-react-native';
import { newsApi, Article } from '../api/news';
import { colors, space, radius, typography } from '../theme';
import { GlassCard, Skeleton } from '../components';
import type { RootStackParamList } from '../types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

const categories = ['All', 'Market', 'Education'];

type NewsProps = NativeStackScreenProps<RootStackParamList, 'News'>;

export default function NewsScreen({ navigation }: NewsProps) {
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
    Market: colors.accent.purple,
    Education: colors.semantic.positive,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          <View>
            <Text style={[typography.h2, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
              News & Education
            </Text>
            <Text style={[typography.caption, { color: colors.text.secondary }]}>
              Market updates & learning
            </Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Search size={15} color={colors.text.secondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search articles..."
            placeholderTextColor={colors.text.secondary}
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
          <View style={{ paddingHorizontal: space['2xl'], gap: space.md }}>
            {[1, 2, 3].map(i => (
              <GlassCard key={i} elevation={2}>
                <Skeleton height={14} width="30%" style={{ marginBottom: space.sm }} />
                <Skeleton height={16} width="90%" style={{ marginBottom: space.sm }} />
                <Skeleton height={12} width="100%" style={{ marginBottom: space.sm }} />
                <Skeleton height={12} width="60%" />
              </GlassCard>
            ))}
          </View>
        ) : (
          <View style={styles.articleList}>
            {filtered.map((article) => {
              const tagColor = tagColors[article.tag] ?? colors.text.secondary;
              return (
                <TouchableOpacity
                  key={`${article.tag}-${article.id}`}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('ArticleDetail', { article })}
                  style={{ borderRadius: radius.lg, overflow: 'hidden' }}
                >
                  <GlassCard elevation={2}>
                    <View style={styles.metaRow}>
                      <View style={[styles.tagBadge, {
                        backgroundColor: `${tagColor}18`,
                        borderColor: `${tagColor}44`,
                      }]}>
                        <Text style={[typography.label, { color: tagColor }]}>{article.tag}</Text>
                      </View>
                      <Text style={[typography.label, { color: colors.text.secondary }]}>
                        {article.created_at ? new Date(article.created_at).toLocaleDateString() : ''}
                      </Text>
                    </View>
                    <Text style={[typography.bodyBold, { color: colors.text.primary, marginBottom: space.sm, fontFamily: 'DMSans-SemiBold' }]}>
                      {article.title}
                    </Text>
                    <Text style={[typography.caption, { color: colors.text.secondary, marginBottom: space.sm }]} numberOfLines={3}>
                      {article.content}
                    </Text>
                    <View style={styles.readTimeRow}>
                      <Clock size={11} color={colors.text.secondary} />
                      <Text style={[typography.label, { color: colors.text.secondary }]}>
                        {Math.ceil((article.content?.length ?? 0) / 500) || 1} min read
                      </Text>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
            {filtered.length === 0 && !loading && (
              <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center', paddingVertical: space['3xl'] }]}>
                No articles found
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { paddingBottom: space['3xl'] },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: space.lg,
    paddingHorizontal: space['2xl'], paddingTop: space.xl, paddingBottom: space.lg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
  },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    height: 46, borderRadius: radius.md, paddingHorizontal: space.lg,
    marginHorizontal: space['2xl'], marginBottom: space.md,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
  },
  searchInput: { flex: 1, color: colors.text.primary, fontSize: 14, fontFamily: 'DMSans' },

  categoryRow: { paddingHorizontal: space['2xl'], gap: space.sm, marginBottom: space.xl },
  categoryBtn: {
    paddingHorizontal: space.lg, paddingVertical: 6, borderRadius: radius.lg,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
  },
  categoryBtnActive: { backgroundColor: colors.glass.g3, borderColor: colors.glass.borderStrong },
  categoryText: { fontSize: 12, fontWeight: '700', color: colors.text.secondary, fontFamily: 'DMSans-Bold' },
  categoryTextActive: { color: colors.accent.purple },

  articleList: { paddingHorizontal: space['2xl'], gap: space.md },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  tagBadge: { paddingHorizontal: space.sm, paddingVertical: 3, borderRadius: radius.sm, borderWidth: 1 },
  readTimeRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});
