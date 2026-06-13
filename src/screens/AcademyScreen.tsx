import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Book, Play, FileText, ChevronRight, GraduationCap
} from 'lucide-react-native';
import { academyApi, Academy, AcademyClass, AcademyArticle, AcademyLivestream } from '../api/academy';
import { colors, space, radius, typography } from '../theme';
import { GlassCard, Badge, Skeleton } from '../components';
import type { RootStackParamList } from '../types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type AcademyProps = NativeStackScreenProps<RootStackParamList, 'Academy'>;

export default function AcademyScreen({ navigation }: AcademyProps) {
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

  const tabs: { key: typeof tab; label: string; Icon: React.ComponentType<{ size: number; color: string }> }[] = [
    { key: 'academies', label: 'Academies', Icon: GraduationCap },
    { key: 'classes', label: 'Classes', Icon: Book },
    { key: 'articles', label: 'Articles', Icon: FileText },
    { key: 'live', label: 'Live', Icon: Play },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h2, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
            Academy
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {tabs.map(t => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            >
              <t.Icon size={14} color={tab === t.key ? '#fff' : colors.text.secondary} />
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={{ paddingHorizontal: space['2xl'], gap: space.sm }}>
            {[1, 2, 3].map(i => (
              <GlassCard key={i} elevation={2}>
                <Skeleton height={44} width={44} borderRadius={16} style={{ marginBottom: space.md }} />
                <Skeleton height={14} width="60%" style={{ marginBottom: space.sm }} />
                <Skeleton height={12} width="40%" />
              </GlassCard>
            ))}
          </View>
        ) : (
          <View style={styles.list}>
            {tab === 'academies' && academies.map(a => (
              <GlassCard key={a.id} elevation={2}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <View style={styles.cardIcon}><GraduationCap size={22} color={colors.accent.purple} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyBold, { color: colors.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                      {a.name}
                    </Text>
                    {a.description ? <Text style={[typography.caption, { color: colors.text.secondary }]}>{a.description}</Text> : null}
                  </View>
                  <ChevronRight size={16} color={colors.text.secondary} />
                </View>
              </GlassCard>
            ))}
            {tab === 'classes' && classes.map(c => (
              <GlassCard key={c.id} elevation={2}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <View style={styles.cardIcon}><Book size={22} color={colors.accent.gold} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyBold, { color: colors.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                      {c.name}
                    </Text>
                    <Text style={[typography.caption, { color: colors.text.secondary }]}>{c.description ?? ''}</Text>
                  </View>
                  <Text style={[typography.captionBold, { color: colors.accent.gold, fontFamily: 'DMSans-Bold' }]}>
                    {c.price > 0 ? `$${c.price}` : 'Free'}
                  </Text>
                </View>
              </GlassCard>
            ))}
            {tab === 'articles' && articles.map(a => (
              <GlassCard key={a.id} elevation={2}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <View style={styles.cardIcon}><FileText size={22} color={colors.semantic.positive} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyBold, { color: colors.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                      {a.title}
                    </Text>
                    <Text style={[typography.caption, { color: colors.text.secondary }]} numberOfLines={2}>{a.content}</Text>
                  </View>
                  <Text style={[typography.caption, { color: colors.text.secondary, fontWeight: '700' }]}>
                    Ch.{a.chapter}
                  </Text>
                </View>
              </GlassCard>
            ))}
            {tab === 'live' && livestreams.map(l => (
              <GlassCard key={l.id} elevation={2}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <View style={[styles.cardIcon, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                    <Play size={22} color={colors.semantic.negative} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyBold, { color: colors.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                      {l.title}
                    </Text>
                    <Text style={[typography.caption, { color: colors.semantic.negative }]} numberOfLines={1}>{l.link}</Text>
                  </View>
                  <Badge label="LIVE" variant="danger" />
                </View>
              </GlassCard>
            ))}

            {(
              (tab === 'academies' && academies.length === 0) ||
              (tab === 'classes' && classes.length === 0) ||
              (tab === 'articles' && articles.length === 0) ||
              (tab === 'live' && livestreams.length === 0)
            ) && (
              <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center', paddingVertical: space['3xl'] }]}>
                No {tabs.find(t => t.key === tab)?.label} yet
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
  scroll: { paddingBottom: 100 },
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

  tabRow: { paddingHorizontal: space['2xl'], gap: space.sm, marginBottom: space.xl },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.md,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
  },
  tabBtnActive: { backgroundColor: colors.accent.purple, borderColor: colors.accent.purple },
  tabText: { fontSize: 12, fontWeight: '700', color: colors.text.secondary, fontFamily: 'DMSans-Bold' },
  tabTextActive: { color: '#fff' },

  list: { paddingHorizontal: space['2xl'], gap: space.sm },
  cardIcon: {
    width: 44, height: 44, borderRadius: radius.lg,
    backgroundColor: 'rgba(139,92,246,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
});
