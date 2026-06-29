import {
  View, Text, ScrollView, StyleSheet, Image, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Star, Users, GraduationCap, ShieldCheck,
} from 'lucide-react-native';
import { academyNewApi } from '@/api/academyNew';
import { useColors, space, radius, typography } from '@/theme';
import { GlassCard, Badge, Skeleton } from '@/components';
import CourseCard from '@/components/academy/CourseCard';
import { useCustomAlert } from '@/context/AlertContext';
import { BASE_URL } from '@/api/client';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { InstructorDetail, Specialization } from '@/types/academy';

const STORAGE_HOST = BASE_URL.replace(/\/api$/, '');

type Props = NativeStackScreenProps<RootStackParamList, 'InstructorDetail'>;

export default function InstructorDetailScreen({ route, navigation }: Props) {
  const { instructorId } = route.params;
  const c = useColors();
  const { showAlert } = useCustomAlert();

  const [instructor, setInstructor] = useState<InstructorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch ──

  const loadInstructor = useCallback(async () => {
    setError(null);
    try {
      const res = await academyNewApi.getInstructor(instructorId);
      setInstructor(res.data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load instructor');
      showAlert({ title: 'Error', message: e?.message ?? 'Failed to load instructor' });
    } finally {
      setLoading(false);
    }
  }, [instructorId, showAlert]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadInstructor();
    }, [loadInstructor]),
  );

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
        <View style={{ paddingHorizontal: space['2xl'], gap: space.md }}>
          <View style={{ alignItems: 'center', gap: space.md }}>
            <Skeleton height={80} width={80} borderRadius={40} />
            <Skeleton height={20} width="30%" />
            <Skeleton height={12} width="60%" />
          </View>
          <Skeleton height={14} width="100%" />
          <Skeleton height={14} width="70%" />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ──

  if (error || !instructor) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h4, { color: c.text.primary, fontFamily: 'Manrope-Bold', marginLeft: space.md }]}>
            Instructor Profile
          </Text>
        </View>
        <View style={styles.centerState}>
          <Text style={[typography.body, { color: c.text.secondary, textAlign: 'center' }]}>
            {error ?? 'Instructor not found'}
          </Text>
          <TouchableOpacity onPress={loadInstructor} style={styles.retryBtn}>
            <Text style={[typography.bodyBold, { color: c.accent.purple }]}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Helpers ──

  const avatarSrc = instructor.avatar_url
    ? (instructor.avatar_url.startsWith('http')
        ? instructor.avatar_url
        : `${STORAGE_HOST}${instructor.avatar_url}`)
    : null;

  const initials = instructor.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const isVerified = instructor.status === 'active';

  // ── Render ──

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h4, { color: c.text.primary, fontFamily: 'Manrope-Bold', marginLeft: space.md }]}>
            Instructor Profile
          </Text>
        </View>

        {/* ── Profile Section ── */}
        <View style={{ paddingHorizontal: space['2xl'] }}>
          <GlassCard elevation={2}>
            <View style={{ alignItems: 'center', gap: space.sm }}>
              {/* Avatar */}
              {avatarSrc ? (
                <Image source={{ uri: avatarSrc }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: c.accent.purple }]}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              )}

              {/* Name */}
              <Text style={[typography.h2, { color: c.text.primary, fontFamily: 'Manrope-Bold', textAlign: 'center' }]}>
                {instructor.name}
              </Text>

              {/* Verified badge */}
              {isVerified && (
                <View style={[styles.verifiedBadge, { backgroundColor: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.30)' }]}>
                  <ShieldCheck size={13} color={c.semantic.positive} />
                  <Text style={[typography.label, { color: c.semantic.positive }]}>
                    Verified Instructor
                  </Text>
                </View>
              )}

              {/* Bio */}
              <Text style={[typography.body, { color: c.text.secondary, textAlign: 'center', lineHeight: 22, marginTop: space.xs }]}>
                {instructor.bio}
              </Text>

              {/* Specializations */}
              {instructor.specializations.length > 0 && (
                <View style={styles.specsRow}>
                  {instructor.specializations.map(spec => (
                    <Badge key={spec.id} label={spec.name} variant="info" />
                  ))}
                </View>
              )}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Star size={15} color={c.accent.gold} fill={c.accent.gold} />
                  <Text style={[typography.bodyBold, { color: c.accent.gold }]}>
                    {instructor.average_rating.toFixed(1)}
                  </Text>
                </View>
                <Text style={[typography.label, { color: c.text.muted, marginTop: 2 }]}>Rating</Text>
              </View>
              <View style={styles.stat}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <GraduationCap size={15} color={c.text.primary} />
                  <Text style={[typography.bodyBold, { color: c.text.primary }]}>
                    {instructor.total_courses}
                  </Text>
                </View>
                <Text style={[typography.label, { color: c.text.muted, marginTop: 2 }]}>Courses</Text>
              </View>
              <View style={styles.stat}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Users size={15} color={c.text.primary} />
                  <Text style={[typography.bodyBold, { color: c.text.primary }]}>
                    {instructor.total_students}
                  </Text>
                </View>
                <Text style={[typography.label, { color: c.text.muted, marginTop: 2 }]}>Students</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* ── Divider + Courses ── */}
        <View style={[styles.divider, { borderColor: c.glass.border }]} />
        <View style={{ paddingHorizontal: space['2xl'] }}>
          <Text style={[typography.h4, { color: c.text.primary, fontFamily: 'Manrope-Bold', marginBottom: space.md }]}>
            Courses by {instructor.name}
          </Text>
        </View>

        {instructor.courses.length === 0 ? (
          <Text style={[typography.body, { color: c.text.secondary, textAlign: 'center', paddingVertical: space['3xl'] }]}>
            No courses published yet
          </Text>
        ) : (
          <View style={{ paddingHorizontal: space['2xl'], gap: space.sm, paddingBottom: 60 }}>
            {instructor.courses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>
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

  avatar: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28, fontWeight: '700', color: '#fff', fontFamily: 'Manrope-Bold',
  },

  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: space.xs,
    paddingHorizontal: space.md, paddingVertical: space.xs,
    borderRadius: radius.full, borderWidth: 1,
  },

  specsRow: {
    flexDirection: 'row', gap: space.sm, flexWrap: 'wrap',
    justifyContent: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: space.xl,
    paddingTop: space.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  stat: {
    alignItems: 'center',
  },

  divider: {
    borderTopWidth: 1,
    marginVertical: space['2xl'],
    marginHorizontal: space['2xl'],
  },

  centerState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: space['3xl'], gap: space.md,
  },
  retryBtn: {
    paddingHorizontal: space.xl, paddingVertical: space.sm,
    borderRadius: radius.md, borderWidth: 1,
    borderColor: '#8B5CF6',
  },
});
