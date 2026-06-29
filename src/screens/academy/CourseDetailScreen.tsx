import {
  View, Text, ScrollView, StyleSheet, Image,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft, Star, Users, GraduationCap,
  BookOpen, Clock, ChevronDown, ChevronUp,
} from 'lucide-react-native';
import { academyNewApi } from '@/api/academyNew';
import { useColors, space, radius, typography } from '@/theme';
import { GlassCard, Badge, Skeleton, AppButton } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { useCustomAlert } from '@/context/AlertContext';
import { BASE_URL } from '@/api/client';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CourseDetail, CourseLevel, Review } from '@/types/academy';

const STORAGE_HOST = BASE_URL.replace(/\/api$/, '');

type Props = NativeStackScreenProps<RootStackParamList, 'CourseDetail'>;

const levelLabel: Record<CourseLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function CourseDetailScreen({ route, navigation }: Props) {
  const { courseId } = route.params;
  const c = useColors();
  const { user, isLoggedIn } = useAuth();
  const { showAlert } = useCustomAlert();
  const insets = useSafeAreaInsets();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [enrolled, setEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);

  // ── Fetch course ──

  const loadCourse = useCallback(async () => {
    setError(null);
    try {
      const res = await academyNewApi.getCourse(courseId);
      setCourse(res.data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load course');
      showAlert({ title: 'Error', message: e?.message ?? 'Failed to load course' });
    } finally {
      setLoading(false);
    }
  }, [courseId, showAlert]);

  // ── Enrollment ──

  const checkEnrollment = useCallback(async () => {
    if (!isLoggedIn) {
      setEnrolled(false);
      return;
    }
    setCheckingEnrollment(true);
    try {
      await academyNewApi.getProgress(courseId);
      setEnrolled(true);
    } catch {
      setEnrolled(false);
    } finally {
      setCheckingEnrollment(false);
    }
  }, [courseId, isLoggedIn]);

  // ── Reviews ──

  const fetchReviews = useCallback(async () => {
    try {
      const res = await academyNewApi.getCourseReviews(courseId);
      setReviews(res.data.items.slice(0, 3));
      setReviewTotal(res.data.pagination.total);
    } catch {
      // silently fail — reviews are optional
    }
  }, [courseId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadCourse();
      checkEnrollment();
      fetchReviews();
    }, [loadCourse, checkEnrollment, fetchReviews]),
  );

  // ── Helpers ──

  const toggleChapter = useCallback((chapterId: number) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  }, []);

  const imageSrc = useMemo(() => {
    if (!course?.thumbnail_url) return null;

    return course.thumbnail_url.startsWith('http')
      ? course.thumbnail_url
      : `${STORAGE_HOST}${course.thumbnail_url}`;
  }, [course?.thumbnail_url]);

  const avatarSrc = useMemo(() => {
    if (!course?.instructor.avatar_url) return null;
    return course.instructor.avatar_url.startsWith('http')
      ? course.instructor.avatar_url
      : `${STORAGE_HOST}${course.instructor.avatar_url}`;
  }, [course?.instructor.avatar_url]);

  const instructorInitial = course?.instructor.name.charAt(0).toUpperCase() ?? '?';

  const handleEnroll = useCallback(async () => {
    if (!isLoggedIn) {
      navigation.navigate('Login' as any);
      return;
    }
    if (enrolled) {
      const allLessons = course?.chapters.flatMap(ch =>
        ch.lessons.map(l => ({ lessonId: l.id, chapterId: ch.id }))
      ) ?? [];
      if (allLessons.length > 0) {
        navigation.navigate('Lesson', {
          courseId,
          chapterId: allLessons[0].chapterId,
          lessonId: allLessons[0].lessonId,
          allLessons,
        });
      }
      return;
    }
    setEnrolling(true);
    try {
      await academyNewApi.enroll(courseId);
      setEnrolled(true);
      setCourse(prev => prev ? { ...prev, total_students: prev.total_students + 1 } : prev);
      showAlert({ title: 'Success', message: 'Enrolled successfully!', type: 'success' });
    } catch (e: any) {
      showAlert({ title: 'Error', message: e?.message ?? 'Failed to enroll' });
    } finally {
      setEnrolling(false);
    }
  }, [isLoggedIn, enrolled, courseId, navigation, showAlert]);

  // ── Loading ──

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Skeleton height={24} width="60%" style={{ marginLeft: space.md }} />
        </View>
        <View style={{ paddingHorizontal: space['2xl'], gap: space.lg }}>
          <Skeleton height={200} width="100%" borderRadius={radius.lg} />
          {[1, 2, 3].map(i => (
            <GlassCard key={i} elevation={2}>
              <Skeleton height={14} width="70%" style={{ marginBottom: space.sm }} />
              <Skeleton height={12} width="40%" />
            </GlassCard>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ──

  if (error || !course) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h4, { color: c.text.primary, fontFamily: 'Manrope-Bold', marginLeft: space.md }]}>
            Course Detail
          </Text>
        </View>
        <View style={styles.centerState}>
          <Text style={[typography.body, { color: c.text.secondary, textAlign: 'center' }]}>
            {error ?? 'Course not found'}
          </Text>
          <TouchableOpacity onPress={loadCourse} style={styles.retryBtn}>
            <Text style={[typography.bodyBold, { color: c.accent.purple }]}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Content ──

  const isDescriptionLong = course.description.length > 200;

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
        </View>

        {/* ── Thumbnail ── */}
        <View style={[styles.thumbWrap, { marginHorizontal: space['2xl'] }]}>
          {imageSrc ? (
            <Image source={{ uri: imageSrc }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <View style={[styles.thumbPlaceholder, { backgroundColor: c.glass.g2 }]}>
              <BookOpen size={40} color={c.text.muted} />
            </View>
          )}
        </View>

        {/* ── Info Section ── */}
        <View style={{ paddingHorizontal: space['2xl'], paddingTop: space.xl, gap: space.md }}>
          {/* Title */}
          <Text style={[typography.h2, { color: c.text.primary, fontFamily: 'Manrope-Bold' }]}>
            {course.title}
          </Text>

          {/* Badges */}
          <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
            <Badge label={course.specialization} variant="info" />
            <Badge label={levelLabel[course.level]} variant="neutral" />
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Star size={15} color={c.accent.gold} fill={c.accent.gold} />
              <Text style={[typography.bodyBold, { color: c.accent.gold }]}>
                {course.average_rating.toFixed(1)}
              </Text>
            </View>
            <View style={styles.stat}>
              <Users size={15} color={c.text.muted} />
              <Text style={[typography.caption, { color: c.text.muted }]}>
                {course.total_students} students
              </Text>
            </View>
            <View style={styles.stat}>
              <GraduationCap size={15} color={c.text.muted} />
              <Text style={[typography.caption, { color: c.text.muted }]}>
                {course.total_lessons} lessons
              </Text>
            </View>
          </View>

          {/* Instructor */}
          <TouchableOpacity activeOpacity={0.7} style={styles.instructorRow}>
            {avatarSrc ? (
              <Image source={{ uri: avatarSrc }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: c.accent.purple }]}>
                <Text style={styles.avatarText}>{instructorInitial}</Text>
              </View>
            )}
            <View>
              <Text style={[typography.captionBold, { color: c.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                {course.instructor.name}
              </Text>
              <Text style={[typography.label, { color: c.text.secondary }]}>
                Instructor
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Description ── */}
        <View style={{ paddingHorizontal: space['2xl'], paddingTop: space.xl }}>
          <Text style={[typography.h4, { color: c.text.primary, fontFamily: 'Manrope-Bold', marginBottom: space.sm }]}>
            About this course
          </Text>
          <Text
            style={[typography.body, { color: c.text.secondary, lineHeight: 22 }]}
            numberOfLines={descExpanded ? undefined : 3}
          >
            {course.description}
          </Text>
          {isDescriptionLong && (
            <TouchableOpacity onPress={() => setDescExpanded(prev => !prev)} style={{ marginTop: space.xs }}>
              <Text style={[typography.captionBold, { color: c.accent.purple }]}>
                {descExpanded ? 'Show less' : 'Read more'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Chapters & Lessons ── */}
        <View style={{ paddingHorizontal: space['2xl'], paddingTop: space['3xl'] }}>
          <Text style={[typography.h4, { color: c.text.primary, fontFamily: 'Manrope-Bold', marginBottom: space.md }]}>
            Curriculum ({course.total_lessons} lessons)
          </Text>

          {course.chapters.length === 0 ? (
            <GlassCard elevation={2}>
              <Text style={[typography.body, { color: c.text.secondary, textAlign: 'center', paddingVertical: space.xl }]}>
                No chapters yet
              </Text>
            </GlassCard>
          ) : (
            <View style={{ gap: space.sm }}>
              {course.chapters.map((chapter, chapterIdx) => {
                const isExpanded = expandedChapters.has(chapter.id);
                return (
                  <GlassCard key={chapter.id} elevation={2} noPadding>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => toggleChapter(chapter.id)}
                      style={styles.chapterHeader}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.captionBold, { color: c.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                          {chapterIdx + 1}. {chapter.title}
                        </Text>
                        <Text style={[typography.label, { color: c.text.muted, marginTop: 2 }]}>
                          {chapter.lessons.length} lessons
                        </Text>
                      </View>
                      {isExpanded
                        ? <ChevronUp size={16} color={c.text.muted} />
                        : <ChevronDown size={16} color={c.text.muted} />
                      }
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.lessonList}>
                        {chapter.lessons.map((lesson, lessonIdx) => (
                          <TouchableOpacity
                            key={lesson.id}
                            activeOpacity={0.6}
                            style={styles.lessonItem}
                          >
                            <View style={[styles.lessonIcon, { backgroundColor: c.glass.g2 }]}>
                              <BookOpen size={14} color={c.text.muted} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[typography.caption, { color: c.text.primary }]}
                                numberOfLines={1}
                              >
                                {chapterIdx + 1}.{lessonIdx + 1} {lesson.title}
                              </Text>
                              <View style={styles.lessonMeta}>
                                <Clock size={11} color={c.text.muted} />
                                <Text style={[typography.label, { color: c.text.muted }]}>
                                  {lesson.read_time_minutes} min
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </GlassCard>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Reviews ── */}
        {reviews.length > 0 && (
          <View style={{ paddingHorizontal: space['2xl'], paddingTop: space['3xl'] }}>
            <View style={styles.reviewsHeader}>
              <Text style={[typography.h4, { color: c.text.primary, fontFamily: 'Manrope-Bold' }]}>
                Reviews ({reviewTotal})
              </Text>
              {enrolled && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Review', { courseId })}
                  style={[styles.writeReviewBtn, { borderColor: c.accent.purple }]}
                >
                  <Text style={[typography.captionBold, { color: c.accent.purple }]}>Write a Review</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ gap: space.sm, marginTop: space.md }}>
              {reviews.map(review => (
                <View key={review.id} style={[styles.reviewItem, { borderColor: c.glass.border }]}>
                  <View style={styles.reviewItemHeader}>
                    <View style={[styles.reviewAvatar, { backgroundColor: c.accent.purple }]}>
                      <Text style={styles.reviewAvatarText}>
                        {review.reviewer_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.captionBold, { color: c.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                        {review.reviewer_name}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} size={11} color={i <= review.rating ? c.accent.gold : c.glass.border} fill={i <= review.rating ? c.accent.gold : 'none'} />
                        ))}
                      </View>
                    </View>
                    <Text style={[typography.label, { color: c.text.muted }]}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  {review.comment ? (
                    <Text style={[typography.caption, { color: c.text.secondary, marginTop: space.sm, lineHeight: 19 }]} numberOfLines={2}>
                      {review.comment}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>

            {reviewTotal > 3 && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Review', { courseId })}
                style={{ alignItems: 'center', paddingVertical: space.md }}
              >
                <Text style={[typography.captionBold, { color: c.accent.purple }]}>
                  See All {reviewTotal} Reviews
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Sticky CTA ── */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + space.md, borderColor: c.glass.border, backgroundColor: c.bg.primary }]}>
        {enrolling ? (
          <View style={[styles.ctaLoading, { backgroundColor: c.accent.purple }]}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        ) : (
          <AppButton
            title={!isLoggedIn ? 'Login to Enroll' : enrolled ? 'Continue Learning' : 'Enroll Now — Free'}
            variant="primary"
            size="lg"
            onPress={handleEnroll}
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
    alignItems: 'center',
    paddingHorizontal: space['2xl'],
    paddingTop: space.xl,
    paddingBottom: space.lg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  thumbWrap: {
    width: undefined,
    aspectRatio: 4 / 3,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  thumb: { width: '100%', height: '100%' },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    gap: space.xl,
    flexWrap: 'wrap',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'DMSans-Bold',
  },

  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
  },
  lessonList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
  },
  lessonIcon: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },

  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  writeReviewBtn: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  reviewItem: {
    paddingBottom: space.md,
    borderBottomWidth: 1,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  reviewAvatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  reviewAvatarText: {
    fontSize: 11, fontWeight: '700', color: '#fff', fontFamily: 'DMSans-Bold',
  },

  ctaBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: space['2xl'],
    paddingTop: space.md,
    borderTopWidth: 1,
  },
  ctaLoading: {
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
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
