import {
  View, Text, Image, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Star, Users, GraduationCap, BookOpen } from 'lucide-react-native';
import { useColors, space, radius, typography } from '@/theme';
import { GlassCard, Badge } from '@/components';
import { BASE_URL } from '@/api/client';
import type { CourseListItem, CourseLevel } from '@/types/academy';

const STORAGE_HOST = BASE_URL.replace(/\/api$/, '');

type CourseCardProps = {
  course: CourseListItem;
  onPress: () => void;
};

const levelLabel: Record<CourseLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function CourseCard({ course, onPress }: CourseCardProps) {
  const c = useColors();

  const imageSrc = course.thumbnail_url
    ? (course.thumbnail_url.startsWith('http')
      ? course.thumbnail_url
      : `${STORAGE_HOST}${course.thumbnail_url}`)
    : null;



  const avatarSrc = course.instructor.avatar_url
    ? (course.instructor.avatar_url.startsWith('http')
      ? course.instructor.avatar_url
      : `${STORAGE_HOST}${course.instructor.avatar_url}`)
    : null;

  const instructorInitial = (typeof course.instructor.name === 'string' ? course.instructor.name : '?').charAt(0).toUpperCase();

  const ratingColor = course.average_rating >= 4
    ? c.accent.gold
    : course.average_rating >= 3
      ? c.text.secondary
      : c.semantic.negative;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <GlassCard elevation={2} noPadding style={{ overflow: 'hidden' }}>
        {/* ── Thumbnail 16:9 ── */}
        <View style={styles.thumbWrap}>
          {imageSrc ? (
            <Image
              source={{ uri: imageSrc }}
              style={styles.thumb}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.thumbPlaceholder, { backgroundColor: c.glass.g2 }]}>
              <BookOpen size={32} color={c.text.muted} />
            </View>
          )}

          {/* FREE / PAID tag */}
          <View style={[
            styles.priceTag,
            { backgroundColor: course.type === 'paid' ? 'rgba(212,175,55,0.92)' : 'rgba(34,197,94,0.92)' },
          ]}>
            <Text style={styles.priceTagText}>
              {course.type === 'paid' ? `PAID · ${course.price} MP` : 'FREE'}
            </Text>
          </View>
        </View>

        {/* ── Info ── */}
        <View style={{ padding: space.lg, gap: space.sm }}>
          {/* Specialization + Level badges */}
          <View style={styles.badgeRow}>
            <Badge label={course.specialization} variant="info" />
            <Badge label={levelLabel[course.level]} variant="neutral" />
          </View>

          {/* Title */}
          <Text
            style={[typography.h3, { color: c.text.primary, fontFamily: 'Manrope-Bold' }]}
            numberOfLines={2}
          >
            {course.title}
          </Text>

          {/* Instructor */}
          <View style={styles.instructorRow}>
            {avatarSrc ? (
              <Image
                source={{ uri: avatarSrc }}
                style={styles.avatarImg}
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: c.accent.purple }]}>
                <Text style={styles.avatarText}>{instructorInitial}</Text>
              </View>
            )}
            <Text style={[typography.caption, { color: c.text.secondary }]}>
              {course.instructor.name}
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Star size={13} color={ratingColor} fill={ratingColor} />
              <Text style={[typography.label, { color: ratingColor }]}>
                {course.average_rating.toFixed(1)}
              </Text>
            </View>
            <View style={styles.stat}>
              <Users size={13} color={c.text.muted} />
              <Text style={[typography.label, { color: c.text.muted }]}>
                {course.total_students}
              </Text>
            </View>
            <View style={styles.stat}>
              <GraduationCap size={13} color={c.text.muted} />
              <Text style={[typography.label, { color: c.text.muted }]}>
                {course.total_lessons} lessons
              </Text>
            </View>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  thumbWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  priceTag: {
    position: 'absolute',
    top: space.sm,
    left: space.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  priceTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    fontFamily: 'DMSans-Bold',
  },

  badgeRow: {
    flexDirection: 'row',
    gap: space.sm,
    flexWrap: 'wrap',
  },

  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'DMSans-Bold',
  },

  statsRow: {
    flexDirection: 'row',
    gap: space.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
});
