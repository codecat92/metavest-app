import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useCallback, useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, GraduationCap, Users, BookOpen, ChevronRight, Bell,
} from 'lucide-react-native';
import { academyNewApi } from '@/api/academyNew';
import { colors, useColors, space, radius, typography } from '@/theme';
import { GlassCard, Skeleton } from '@/components';
import CourseCard from '@/components/academy/CourseCard';
import InstructorCard from '@/components/academy/InstructorCard';
import { useCustomAlert } from '@/context/AlertContext';
import { useAuth } from '@/context/AuthContext';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CourseListItem, InstructorListItem } from '@/types/academy';

type AcademyProps = NativeStackScreenProps<RootStackParamList, 'Academy'>;

const PER_PAGE = 15;

export default function AcademyScreen({ navigation }: AcademyProps) {
  const theme = useColors();
  const { showAlert } = useCustomAlert();
  const { isLoggedIn } = useAuth();

  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [instructors, setInstructors] = useState<InstructorListItem[]>([]);
  const [enrollmentTotal, setEnrollmentTotal] = useState(0);
  const [enrollmentProgress, setEnrollmentProgress] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'courses' | 'instructors'>('courses');

  const coursePage = useRef(1);
  const instructorPage = useRef(1);
  const hasMoreCourses = useRef(false);
  const hasMoreInstructors = useRef(false);
  const loadingMore = useRef(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Data fetching ──

  const fetchCourses = useCallback(async (page: number) => {
    const res = await academyNewApi.getCourses(page);
    const { items, pagination } = res.data;
    hasMoreCourses.current = pagination.current_page < pagination.last_page;
    if (page === 1) {
      setCourses(items);
    } else {
      setCourses(prev => [...prev, ...items]);
    }
  }, []);

  const fetchInstructors = useCallback(async (page: number) => {
    const res = await academyNewApi.getInstructors(page);
    const { items, pagination } = res.data;
    hasMoreInstructors.current = pagination.current_page < pagination.last_page;
    if (page === 1) {
      setInstructors(items);
    } else {
      setInstructors(prev => [...prev, ...items]);
    }
  }, []);

  const loadData = useCallback(async () => {
    setError(null);
    coursePage.current = 1;
    instructorPage.current = 1;
    try {
      if (tab === 'courses') {
        await fetchCourses(1);
      } else {
        await fetchInstructors(1);
      }
      if (isLoggedIn) {
        try {
          const [enrollRes, unreadRes] = await Promise.all([
            academyNewApi.getEnrollments(),
            academyNewApi.getUnreadCount(),
          ]);
          const items = enrollRes.data.items;
          setEnrollmentTotal(enrollRes.data.pagination.total);
          setUnreadCount(unreadRes.data.count);
          const avg = items.length > 0
            ? items.reduce((sum, e) => sum + e.progress_percentage, 0) / items.length
            : 0;
          setEnrollmentProgress(Math.round(avg));
        } catch {
          setEnrollmentTotal(0);
        }
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
      showAlert({ title: 'Error', message: e?.message ?? 'Failed to load data' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, fetchCourses, fetchInstructors, showAlert, isLoggedIn]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData]),
  );

  // ── Tab switch (lazy load if needed) ──

  const handleTabSwitch = useCallback(async (newTab: 'courses' | 'instructors') => {
    setTab(newTab);
    setError(null);
    const needsLoad =
      (newTab === 'courses' && courses.length === 0) ||
      (newTab === 'instructors' && instructors.length === 0);
    if (!needsLoad) return;
    try {
      if (newTab === 'courses') {
        coursePage.current = 1;
        await fetchCourses(1);
      } else {
        instructorPage.current = 1;
        await fetchInstructors(1);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [courses.length, instructors.length, fetchCourses, fetchInstructors]);

  // ── Pagination ──

  const handleLoadMore = useCallback(async () => {
    if (loadingMore.current) return;
    loadingMore.current = true;
    try {
      if (tab === 'courses' && hasMoreCourses.current) {
        coursePage.current += 1;
        await fetchCourses(coursePage.current);
      } else if (tab === 'instructors' && hasMoreInstructors.current) {
        instructorPage.current += 1;
        await fetchInstructors(instructorPage.current);
      }
    } catch (e: any) {
      showAlert({ title: 'Error', message: e?.message ?? 'Failed to load more' });
    } finally {
      loadingMore.current = false;
    }
  }, [tab, fetchCourses, fetchInstructors, showAlert]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    coursePage.current = 1;
    instructorPage.current = 1;
    try {
      if (tab === 'courses') {
        await fetchCourses(1);
      } else {
        await fetchInstructors(1);
      }
    } catch (e: any) {
      showAlert({ title: 'Error', message: e?.message ?? 'Refresh failed' });
    } finally {
      setRefreshing(false);
    }
  }, [tab, fetchCourses, fetchInstructors, showAlert]);

  // ── Render item ──

  const listData = tab === 'courses' ? courses : instructors;
  const isEmpty = !loading && !error && listData.length === 0;

  const handleCoursePress = useCallback((course: CourseListItem) => {
    navigation.navigate('CourseDetail', { courseId: course.id });
  }, [navigation]);

  const handleInstructorPress = useCallback((instructor: InstructorListItem) => {
    navigation.navigate('InstructorDetail', { instructorId: instructor.id });
  }, [navigation]);

  const renderCourseItem = useCallback(({ item }: { item: CourseListItem }) => (
    <CourseCard
      course={item}
      onPress={() => handleCoursePress(item)}
    />
  ), [handleCoursePress]);

  const renderInstructorItem = useCallback(({ item }: { item: InstructorListItem }) => (
    <InstructorCard
      instructor={item}
      onPress={() => handleInstructorPress(item)}
    />
  ), [handleInstructorPress]);

  const renderFooter = useCallback(() => {
    if (tab === 'courses' && hasMoreCourses.current) {
      return <ActivityIndicator style={{ paddingVertical: space.xl }} color={theme.accent.purple} />;
    }
    if (tab === 'instructors' && hasMoreInstructors.current) {
      return <ActivityIndicator style={{ paddingVertical: space.xl }} color={theme.accent.gold} />;
    }
    return null;
  }, [tab, theme]);

  // ── My Learning Banner ──

  const showLearningBanner = isLoggedIn && enrollmentTotal > 0 && tab === 'courses';

  const renderLearningBanner = useCallback(() => {
    if (!showLearningBanner) return null;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('MyEnrollments')}
        style={[styles.learningBanner, {
          backgroundColor: `${theme.accent.purple}14`,
          borderColor: `${theme.accent.purple}40`,
        }]}
      >
        <View style={[styles.learningIcon, { backgroundColor: `${theme.accent.purple}22` }]}>
          <BookOpen size={20} color={theme.accent.purple} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.bodyBold, { color: theme.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
            My Learning
          </Text>
          <Text style={[typography.caption, { color: theme.text.secondary, marginTop: 2 }]}>
            {enrollmentTotal} course{enrollmentTotal > 1 ? 's' : ''} enrolled
          </Text>
          <View style={[styles.learningProgressTrack, { backgroundColor: theme.glass.g2 }]}>
            <View style={[styles.learningProgressFill, { backgroundColor: theme.accent.purple, width: `${enrollmentProgress}%` }]} />
          </View>
        </View>
        <ChevronRight size={18} color={theme.text.muted} />
      </TouchableOpacity>
    );
  }, [showLearningBanner, enrollmentTotal, enrollmentProgress, theme, navigation]);

  // ── Main render ──

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg.primary }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={theme.text.secondary} />
        </TouchableOpacity>
        <Text style={[typography.h2, { color: theme.text.primary, fontFamily: 'Manrope-Bold', flex: 1 }]}>
          Metavest Academy
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AcademyNotifications')}
          style={[styles.bellBtn, { backgroundColor: theme.glass.g1, borderColor: theme.glass.border }]}
        >
          <Bell size={22} color={theme.text.primary} />
          {unreadCount > 0 && (
            <View style={[styles.bellBadge, { backgroundColor: theme.semantic.negative }]} />
          )}
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          onPress={() => handleTabSwitch('courses')}
          style={[styles.tabBtn, tab === 'courses' && styles.tabBtnActive]}
        >
          <GraduationCap size={14} color={tab === 'courses' ? '#fff' : theme.text.secondary} />
          <Text style={[styles.tabText, tab === 'courses' && styles.tabTextActive]}>Courses</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleTabSwitch('instructors')}
          style={[styles.tabBtn, tab === 'instructors' && styles.tabBtnActive]}
        >
          <Users size={14} color={tab === 'instructors' ? '#fff' : theme.text.secondary} />
          <Text style={[styles.tabText, tab === 'instructors' && styles.tabTextActive]}>Instructors</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ paddingHorizontal: space['2xl'], gap: space.sm }}>
          {[1, 2, 3, 4].map(i => (
            <GlassCard key={i} elevation={2}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <Skeleton height={44} width={44} borderRadius={16} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton height={14} width="70%" />
                  <Skeleton height={12} width="40%" />
                </View>
              </View>
            </GlassCard>
          ))}
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={[typography.body, { color: theme.text.secondary, textAlign: 'center' }]}>{error}</Text>
          <TouchableOpacity onPress={loadData} style={styles.retryBtn}>
            <Text style={[typography.bodyBold, { color: theme.accent.purple }]}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {tab === 'courses' && (
            <FlatList<CourseListItem>
              data={courses}
              keyExtractor={item => `${item.id}`}
              renderItem={renderCourseItem}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={renderLearningBanner}
              showsVerticalScrollIndicator={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={
                isEmpty ? (
                  <Text style={[typography.body, { color: theme.text.secondary, textAlign: 'center', paddingVertical: space['3xl'] }]}>
                    No courses yet
                  </Text>
                ) : null
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={theme.accent.purple}
                  colors={[theme.accent.purple]}
                />
              }
            />
          )}
          {tab === 'instructors' && (
            <FlatList<InstructorListItem>
              data={instructors}
              keyExtractor={item => `${item.id}`}
              renderItem={renderInstructorItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={
                isEmpty ? (
                  <Text style={[typography.body, { color: theme.text.secondary, textAlign: 'center', paddingVertical: space['3xl'] }]}>
                    No instructors yet
                  </Text>
                ) : null
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={theme.accent.purple}
                  colors={[theme.accent.purple]}
                />
              }
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
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
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 6, right: 7,
    width: 8, height: 8, borderRadius: 4,
  },

  tabRow: {
    flexDirection: 'row', gap: space.sm,
    paddingHorizontal: space['2xl'], marginBottom: space.lg,
  },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.md,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
  },
  tabBtnActive: { backgroundColor: colors.accent.purple, borderColor: colors.accent.purple },
  tabText: { fontSize: 12, fontWeight: '700', color: colors.text.secondary, fontFamily: 'DMSans-Bold' },
  tabTextActive: { color: '#fff' },

  listContent: { paddingHorizontal: space['2xl'], paddingBottom: 100, gap: space.sm },

  learningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    height: 96,
    paddingHorizontal: space.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  learningIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  learningProgressTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  learningProgressFill: {
    height: '100%',
    borderRadius: 2,
  },

  centerState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: space['3xl'], gap: space.md,
  },
  retryBtn: {
    paddingHorizontal: space.xl, paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.accent.purple,
  },
});
