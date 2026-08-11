import {
  View, Text, Image, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Star, Users, GraduationCap } from 'lucide-react-native';
import { useColors, space, radius, typography } from '@/theme';
import { GlassCard, Badge } from '@/components';
import { BASE_URL } from '@/api/client';
import type { InstructorListItem, Specialization } from '@/types/academy';

const STORAGE_HOST = BASE_URL.replace(/\/api$/, '');

type InstructorCardProps = {
  instructor: InstructorListItem;
  onPress: () => void;
};

export default function InstructorCard({ instructor, onPress }: InstructorCardProps) {
  const c = useColors();

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

  const visibleSpecs = instructor.specializations.slice(0, 3);
  const extraCount = instructor.specializations.length - 3;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <GlassCard elevation={2}>
        {/* ── Avatar + Info ── */}
        <View style={styles.row}>
          {avatarSrc ? (
            <Image source={{ uri: avatarSrc }} style={styles.avatarImg} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: c.accent.purple }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}

          <View style={{ flex: 1, gap: 3 }}>
            <Text
              style={[typography.bodyBold, { color: c.text.primary, fontFamily: 'DMSans-SemiBold' }]}
              numberOfLines={1}
            >
              {instructor.name}
            </Text>
            <Text
              style={[typography.caption, { color: c.text.secondary }]}
              numberOfLines={1}
            >
              {instructor.bio}
            </Text>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Star size={13} color={c.accent.gold} fill={c.accent.gold} />
            <Text style={[typography.label, { color: c.accent.gold }]}>
              {instructor.average_rating.toFixed(1)}
            </Text>
          </View>
          <View style={styles.stat}>
            <GraduationCap size={13} color={c.text.muted} />
            <Text style={[typography.label, { color: c.text.muted }]}>
              {instructor.total_courses} courses
            </Text>
          </View>
          <View style={styles.stat}>
            <Users size={13} color={c.text.muted} />
            <Text style={[typography.label, { color: c.text.muted }]}>
              {instructor.total_students} students
            </Text>
          </View>
        </View>

        {/* ── Specializations ── */}
        {instructor.specializations.length > 0 && (
          <View style={styles.badgeRow}>
            {visibleSpecs
                .filter(s => s.name && s.name.trim())
                .map(s => (
                  <Badge key={s.id} label={s.name} variant="info" />
                ))}
            {extraCount > 0 && (
              <Badge label={`+${extraCount}`} variant="neutral" />
            )}
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'DMSans-Bold',
  },

  statsRow: {
    flexDirection: 'row',
    gap: space.lg,
    marginBottom: space.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  badgeRow: {
    flexDirection: 'row',
    gap: space.sm,
    flexWrap: 'wrap',
  },
});
