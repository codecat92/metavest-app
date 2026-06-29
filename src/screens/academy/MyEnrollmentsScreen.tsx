import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, BookOpen, Users, GraduationCap,
} from 'lucide-react-native';
import { academyNewApi } from '@/api/academyNew';
import { useColors, space, radius, typography } from '@/theme';
import { GlassCard, AppButton, Skeleton } from '@/components';
import { useCustomAlert } from '@/context/AlertContext';
import { BASE_URL } from '@/api/client';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Enrollment } from '@/types/academy';

const STORAGE_HOST = BASE_URL.replace(/\/api$/, '');

type Props = NativeStackScreenProps<RootStackParamList, 'MyEnrollments'>;

export default function MyEnrollmentsScreen({ navigation }: Props) {
  const c = useColors();
  const { showAlert } = useCustomAlert();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch ──

  const loadEnrollments = useCallback(async () => {
    setError(null);
    try {
      const res = await academyNewApi.getEnrollments();
      setEnrollments(res.data.items);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load enrollments');
      showAlert({ title: 'Error', message: e?.message ?? 'Failed to load enrollments' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showAlert]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadEnrollments();
    }, [loadEnrollments]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadEnrollments();
  }, [loadEnrollments]);

  // ── Loading ──

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Skeleton height={24} width="50%" style={{ marginLeft: space.md }} />
        </View>
        <View style={{ paddingHorizontal: space['2xl'], gap: space.sm }}>
          {[1, 2, 3].map(i => (
            <GlassCard key={i} elevation={2}>
              <View style={{ flexDirection: 'row', gap: space.md }}>
                <Skeleton height={72} width={128} borderRadius={radius.md} />
                <View style={{ flex: 1, gap: 8 }}>
                  <Skeleton height={14} width="80%" />
                  <Skeleton height={12} width="50%" />
                  <Skeleton height={8} width="100%" />
                </View>
              </View>
            </GlassCard>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ──

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h4, { color: c.text.primary, fontFamily: 'Manrope-Bold', marginLeft: space.md }]}>
            My Courses
          </Text>
        </View>
        <View style={styles.centerState}>
          <Text style={[typography.body, { color: c.text.secondary, textAlign: 'center' }]}>
            {error}
          </Text>
          <TouchableOpacity onPress={loadEnrollments} style={styles.retryBtn}>
            <Text style={[typography.bodyBold, { color: c.accent.purple }]}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render ──

  const renderItem = ({ item }: { item: Enrollment }) => {
    const course = item.course;
    const thumbSrc = course.thumbnail_url
      ? (course.thumbnail_url.startsWith('http')
        ? course.thumbnail_url
        : `${STORAGE_HOST}${course.thumbnail_url}`)
      : null;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
      >
        <GlassCard elevation={2}>
          <View style={{ flexDirection: 'row', gap: space.md }}>
            {/* Thumbnail 16:9 compact */}
            <View style={styles.enrollThumb}>
              {thumbSrc ? (
                <Image source={{ uri: thumbSrc }} style={styles.enrollThumbImg} />
              ) : (
                <View style={[styles.enrollThumbPlaceholder, { backgroundColor: c.glass.g2 }]}>
                  <BookOpen size={22} color={c.text.muted} />
                </View>
              )}
            </View>

            {/* Info */}
            <View style={{ flex: 1, gap: space.xs }}>
              <Text
                style={[typography.bodyBold, { color: c.text.primary, fontFamily: 'DMSans-SemiBold' }]}
                numberOfLines={1}
              >
                {course.title}
              </Text>
              <View style={styles.instructorRow}>
                <Users size={11} color={c.text.muted} />
                <Text
                  style={[typography.label, { color: c.text.secondary }]}
                  numberOfLines={1}
                >
                  {course.instructor.name}
                </Text>
              </View>

              {/* Progress */}
              <View style={{ marginTop: space.xs }}>
                <View style={[styles.progressTrack, { backgroundColor: c.glass.g2 }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: c.accent.purple,
                        width: `${Math.max(2, item.progress_percentage)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[typography.label, { color: c.text.muted, marginTop: 3 }]}>
                  {item.progress_percentage}% Complete
                </Text>
              </View>
            </View>
          </View>

          {/* Continue Button */}
          <View style={{ marginTop: space.md }}>
            <AppButton
              title={item.progress_percentage === 100 ? 'Review Course' : 'Continue Learning'}
              variant={item.progress_percentage === 100 ? 'secondary' : 'primary'}
              size="md"
              onPress={() => {
                navigation.navigate('CourseDetail', {
                  courseId: course.id,
                });
              }}
            />
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const isEmpty = !loading && !error && enrollments.length === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={c.text.secondary} />
        </TouchableOpacity>
        <Text style={[typography.h4, { color: c.text.primary, fontFamily: 'Manrope-Bold', marginLeft: space.md }]}>
          My Courses
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={enrollments}
        keyExtractor={item => `${item.id}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isEmpty ? (
            <View style={styles.centerState}>
              <GraduationCap size={48} color={c.text.muted} />
              <Text style={[typography.body, { color: c.text.secondary, textAlign: 'center' }]}>
                You haven't enrolled in any courses yet
              </Text>
              <AppButton
                title="Browse Courses"
                variant="secondary"
                size="md"
                onPress={() => navigation.goBack()}
                style={{ marginTop: space.md }}
              />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={c.accent.purple}
            colors={[c.accent.purple]}
          />
        }
      />
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

  listContent: {
    paddingHorizontal: space['2xl'],
    paddingBottom: 100,
    gap: space.sm,
  },

  enrollThumb: {
    width: 128,
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  enrollThumbImg: {
    width: '100%',
    height: '100%',
  },
  enrollThumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space['3xl'],
  },
  retryBtn: {
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
});
