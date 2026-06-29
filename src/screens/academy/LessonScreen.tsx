import {
  View, Text, ScrollView, StyleSheet, Image,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft, Clock, CheckCircle2, ChevronLeft, ChevronRight,
} from 'lucide-react-native';
import RenderHtml from 'react-native-render-html';
import WebView from 'react-native-webview';
import { academyNewApi } from '@/api/academyNew';
import { useColors, space, radius, typography } from '@/theme';
import { AppButton, Skeleton } from '@/components';
import { useCustomAlert } from '@/context/AlertContext';
import { BASE_URL } from '@/api/client';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LessonWithProgress } from '@/types/academy';

const STORAGE_HOST = BASE_URL.replace(/\/api$/, '');

type Props = NativeStackScreenProps<RootStackParamList, 'Lesson'>;

export default function LessonScreen({ route, navigation }: Props) {
  const { courseId, chapterId, lessonId, allLessons } = route.params;
  const c = useColors();
  const { showAlert } = useCustomAlert();
  const insets = useSafeAreaInsets();

  const [lesson, setLesson] = useState<LessonWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // ── Fetch ──

  const loadLesson = useCallback(async () => {
    setError(null);
    try {
      const res = await academyNewApi.getLesson(courseId, chapterId, lessonId);
      setLesson(res.data);
      setIsCompleted(res.data.is_completed);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load lesson');
      showAlert({ title: 'Error', message: e?.message ?? 'Failed to load lesson' });
    } finally {
      setLoading(false);
    }
  }, [courseId, chapterId, lessonId, showAlert]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadLesson();
    }, [loadLesson]),
  );

  // ── Actions ──

  const handleComplete = useCallback(async () => {
    setCompleting(true);
    try {
      await academyNewApi.completeLesson(lessonId);
      setIsCompleted(true);
      showAlert({ title: 'Success', message: 'Lesson completed!', type: 'success' });
    } catch (e: any) {
      showAlert({ title: 'Error', message: e?.message ?? 'Failed to complete lesson' });
    } finally {
      setCompleting(false);
    }
  }, [lessonId, showAlert]);

  // ── Navigation ──

  const currentIndex = allLessons.findIndex(
    l => l.lessonId === lessonId && l.chapterId === chapterId,
  );

  const handlePrev = useCallback(() => {
    if (currentIndex <= 0) return;
    const prev = allLessons[currentIndex - 1];
    navigation.replace('Lesson', {
      courseId,
      chapterId: prev.chapterId,
      lessonId: prev.lessonId,
      allLessons,
    });
  }, [currentIndex, allLessons, courseId, navigation]);

  const handleNext = useCallback(() => {
    if (currentIndex >= allLessons.length - 1) return;
    const next = allLessons[currentIndex + 1];
    navigation.replace('Lesson', {
      courseId,
      chapterId: next.chapterId,
      lessonId: next.lessonId,
      allLessons,
    });
  }, [currentIndex, allLessons, courseId, navigation]);

  // ── Helpers ──

  const contentWidth = Dimensions.get('window').width - space['2xl'] * 2;

  const coverSrc = lesson?.cover_image_url
    ? (lesson.cover_image_url.startsWith('http')
        ? lesson.cover_image_url
        : `${STORAGE_HOST}${lesson.cover_image_url}`)
    : null;

  // Parse content: extract iframes, replace with placeholders, split segments
  const contentSegments = useMemo(() => {
    const html = lesson?.content ?? '';
    const videos: string[] = [];
    const cleaned = html.replace(/<iframe[^>]+src="([^"]+)"[^>]*>\s*<\/iframe>/gi, (_, src) => {
      videos.push(src);
      return `{{VIDEO_${videos.length - 1}}}`;
    });

    const parts: (string | { type: 'video'; src: string })[] = [];
    const regex = /\{\{VIDEO_(\d+)\}\}/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(cleaned)) !== null) {
      if (match.index > lastIdx) {
        parts.push(cleaned.slice(lastIdx, match.index));
      }
      const videoIdx = parseInt(match[1], 10);
      parts.push({ type: 'video', src: videos[videoIdx] });
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < cleaned.length) {
      parts.push(cleaned.slice(lastIdx));
    }

    return parts.length > 0 ? parts : [html];
  }, [lesson?.content]);

  const tagsStyles = useMemo(() => ({
    h1: { fontFamily: 'Manrope-Bold', color: c.text.primary, fontSize: 24, marginBottom: space.md },
    h2: { fontFamily: 'Manrope-Bold', color: c.text.primary, fontSize: 20, marginBottom: space.sm },
    h3: { fontFamily: 'Manrope-Bold', color: c.text.primary, fontSize: 18, marginBottom: space.sm },
    p: { marginBottom: space.lg, color: c.text.secondary },
    li: { color: c.text.secondary },
    strong: { color: c.text.primary, fontFamily: 'DMSans-SemiBold' },
    em: { color: c.text.secondary },
    a: { color: c.accent.purple },
    img: { borderRadius: radius.md, marginVertical: space.md },
    pre: { backgroundColor: c.glass.g2, padding: space.lg, borderRadius: radius.md, marginBottom: space.lg },
    code: { fontFamily: 'monospace', color: c.accent.purple },
    table: { borderColor: c.glass.border, borderWidth: 1, marginBottom: space.lg },
    td: { padding: space.sm, borderColor: c.glass.border, borderWidth: 1, color: c.text.secondary },
    th: { padding: space.sm, borderColor: c.glass.border, borderWidth: 1, color: c.text.primary },
  }), [c]);

  // ── Loading ──

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Skeleton height={20} width="50%" style={{ marginLeft: space.md }} />
        </View>
        <View style={{ paddingHorizontal: space['2xl'], gap: space.lg }}>
          <Skeleton height={180} width="100%" borderRadius={radius.lg} />
          <Skeleton height={12} width="30%" />
          <Skeleton height={14} width="100%" />
          <Skeleton height={14} width="100%" />
          <Skeleton height={14} width="70%" />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ──

  if (error || !lesson) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h4, { color: c.text.primary, fontFamily: 'Manrope-Bold', marginLeft: space.md }]}>
            Lesson
          </Text>
        </View>
        <View style={styles.centerState}>
          <Text style={[typography.body, { color: c.text.secondary, textAlign: 'center' }]}>
            {error ?? 'Lesson not found'}
          </Text>
          <TouchableOpacity onPress={loadLesson} style={styles.retryBtn}>
            <Text style={[typography.bodyBold, { color: c.accent.purple }]}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Content ──

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={[typography.h4, { color: c.text.primary, fontFamily: 'Manrope-Bold' }]}
              numberOfLines={1}
            >
              {lesson.title}
            </Text>
            <View style={styles.meta}>
              <Clock size={12} color={c.text.muted} />
              <Text style={[typography.label, { color: c.text.muted }]}>
                {lesson.read_time_minutes} min read
              </Text>
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <CheckCircle2 size={12} color={c.semantic.positive} />
                  <Text style={[typography.label, { color: c.semantic.positive }]}>
                    Completed
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Cover Image ── */}
        {coverSrc && (
          <Image
            source={{ uri: coverSrc }}
            style={[styles.cover, { marginHorizontal: space['2xl'] }]}
            resizeMode="cover"
          />
        )}

        {/* ── Content ── */}
        <View style={{ paddingHorizontal: space['2xl'], paddingTop: space.xl }}>
          {contentSegments.map((seg, idx) => {
            if (typeof seg === 'object' && 'type' in seg && seg.type === 'video') {
              return (
                <View
                  key={`video-${idx}`}
                  style={[styles.videoContainer, { borderRadius: radius.lg }]}
                >
                  <WebView
                    source={{ uri: seg.src }}
                    style={{ borderRadius: radius.lg }}
                    allowsFullscreenVideo
                    javaScriptEnabled
                  />
                </View>
              );
            }

            return (
              <RenderHtml
                key={`html-${idx}`}
                contentWidth={contentWidth}
                source={{ html: seg as string }}
                baseStyle={{
                  color: c.text.primary,
                  fontSize: 15,
                  lineHeight: 24,
                  fontFamily: 'DMSans',
                }}
                tagsStyles={tagsStyles}
              />
            );
          })}
        </View>
      </ScrollView>

      {/* ── Bottom Bar ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + space.md, borderColor: c.glass.border, backgroundColor: c.bg.primary }]}>
        {/* Prev / Next */}
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={handlePrev}
            disabled={currentIndex <= 0}
            style={[styles.navBtn, { backgroundColor: c.glass.g1, borderColor: c.glass.border }, currentIndex <= 0 && { opacity: 0.4 }]}
          >
            <ChevronLeft size={18} color={c.text.secondary} />
            <Text style={[typography.label, { color: c.text.secondary }]}>Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNext}
            disabled={currentIndex >= allLessons.length - 1}
            style={[styles.navBtn, { backgroundColor: c.glass.g1, borderColor: c.glass.border }, currentIndex >= allLessons.length - 1 && { opacity: 0.4 }]}
          >
            <Text style={[typography.label, { color: c.text.secondary }]}>Next</Text>
            <ChevronRight size={18} color={c.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Mark as Complete */}
        {isCompleted ? (
          <View style={[styles.completedBtn, { backgroundColor: c.glass.g2, borderColor: 'rgba(34,197,94,0.30)' }]}>
            <CheckCircle2 size={18} color={c.semantic.positive} />
            <Text style={[typography.bodyBold, { color: c.semantic.positive }]}>Completed</Text>
          </View>
        ) : completing ? (
          <View style={[styles.completingBtn, { backgroundColor: c.accent.purple }]}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        ) : (
          <AppButton
            title="Mark as Complete"
            variant="primary"
            size="lg"
            onPress={handleComplete}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: space['2xl'],
    paddingTop: space.xl,
    paddingBottom: space.lg,
    gap: space.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.xs,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  cover: {
    width: undefined,
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    marginTop: space.sm,
  },

  videoContainer: {
    width: '100%',
    height: 220,
    marginVertical: space.md,
    overflow: 'hidden',
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: space['2xl'],
    paddingTop: space.md,
    borderTopWidth: 1,
    gap: space.sm,
  },
  navRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  completedBtn: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  completingBtn: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },

  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space['3xl'],
    gap: space.md,
  },
  retryBtn: {
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
});
