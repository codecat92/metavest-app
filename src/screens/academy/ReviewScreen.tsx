import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, ActivityIndicator,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star } from 'lucide-react-native';
import { academyNewApi } from '@/api/academyNew';
import { useColors, space, radius, typography } from '@/theme';
import { GlassCard, AppButton, Skeleton } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { useCustomAlert } from '@/context/AlertContext';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Review } from '@/types/academy';

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

export default function ReviewScreen({ route, navigation }: Props) {
  const { courseId } = route.params;
  const c = useColors();
  const { user } = useAuth();
  const { showAlert } = useCustomAlert();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch reviews ──

  const loadReviews = useCallback(async () => {
    setError(null);
    try {
      const res = await academyNewApi.getCourseReviews(courseId);
      setReviews(res.data.items);
      // Pre-fill form if user already reviewed
      const own = res.data.items.find(r => r.reviewer_name === user?.name);
      if (own) {
        setRating(own.rating);
        setComment(own.comment ?? '');
      } else {
        setRating(0);
        setComment('');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load reviews');
      showAlert({ title: 'Error', message: e?.message ?? 'Failed to load reviews' });
    } finally {
      setLoading(false);
    }
  }, [courseId, user?.name, showAlert]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadReviews();
    }, [loadReviews]),
  );

  // ── Existing review check ──

  const ownReview = reviews.find(r => r.reviewer_name === user?.name);
  const isEditing = !!ownReview;

  // ── Submit ──

  const handleSubmit = useCallback(async () => {
    if (rating === 0) {
      showAlert({ title: 'Error', message: 'Please select a rating' });
      return;
    }
    setSubmitting(true);
    try {
      const body = { rating, comment: comment || null };
      if (isEditing && ownReview) {
        await academyNewApi.updateReview(courseId, body);
      } else {
        await academyNewApi.createReview(courseId, body);
      }
      showAlert({ title: 'Success', message: isEditing ? 'Review updated!' : 'Review submitted!' });
      loadReviews();
    } catch (e: any) {
      showAlert({ title: 'Error', message: e?.message ?? 'Failed to submit review' });
    } finally {
      setSubmitting(false);
    }
  }, [rating, comment, isEditing, ownReview, courseId, loadReviews, showAlert]);

  // ── Render star (display only) ──

  const renderStars = (value: number, size = 14) => (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          color={i <= value ? c.accent.gold : c.glass.border}
          fill={i <= value ? c.accent.gold : 'none'}
        />
      ))}
    </View>
  );

  // ── Loading ──

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Skeleton height={24} width="40%" style={{ marginLeft: space.md }} />
        </View>
        <View style={{ paddingHorizontal: space['2xl'], gap: space.sm }}>
          {[1, 2, 3].map(i => (
            <GlassCard key={i} elevation={2}>
              <Skeleton height={14} width="30%" style={{ marginBottom: space.sm }} />
              <Skeleton height={12} width="100%" />
              <Skeleton height={12} width="60%" style={{ marginTop: space.xs }} />
            </GlassCard>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ──

  if (error && reviews.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h4, { color: c.text.primary, fontFamily: 'Manrope-Bold', marginLeft: space.md }]}>
            Reviews
          </Text>
        </View>
        <View style={styles.centerState}>
          <Text style={[typography.body, { color: c.text.secondary, textAlign: 'center' }]}>{error}</Text>
          <TouchableOpacity onPress={loadReviews} style={styles.retryBtn}>
            <Text style={[typography.bodyBold, { color: c.accent.purple }]}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Other reviews (exclude own) ──

  const otherReviews = reviews.filter(r => r.reviewer_name !== user?.name);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h4, { color: c.text.primary, fontFamily: 'Manrope-Bold', marginLeft: space.md }]}>
            Reviews
          </Text>
        </View>

        {/* ── Submit / Edit Form ── */}
        <View style={{ paddingHorizontal: space['2xl'] }}>
          <GlassCard elevation={2}>
            <Text style={[typography.bodyBold, { color: c.text.primary, fontFamily: 'DMSans-SemiBold', marginBottom: space.md }]}>
              {isEditing ? 'Edit your review' : 'Write a review'}
            </Text>

            {/* Star Picker */}
            <View style={[styles.starRow, { marginBottom: space.md }]}>
              {[1, 2, 3, 4, 5].map(i => (
                <TouchableOpacity key={i} onPress={() => setRating(i)}>
                  <Star
                    size={28}
                    color={i <= rating ? c.accent.gold : c.glass.border}
                    fill={i <= rating ? c.accent.gold : 'none'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Comment */}
            <TextInput
              style={[styles.textInput, {
                color: c.text.primary,
                backgroundColor: c.glass.g1,
                borderColor: c.glass.border,
              }]}
              placeholder="Share your experience..."
              placeholderTextColor={c.text.muted}
              multiline
              numberOfLines={3}
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />

            {/* Submit */}
            <View style={{ marginTop: space.md }}>
              {submitting ? (
                <View style={[styles.submitLoading, { backgroundColor: c.accent.purple }]}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              ) : (
                <AppButton
                  title={isEditing ? 'Update Review' : 'Submit Review'}
                  variant="primary"
                  size="md"
                  onPress={handleSubmit}
                  style={{ flex: 1 }}
                />
              )}
            </View>
          </GlassCard>
        </View>

        {/* ── Divider ── */}
        {otherReviews.length > 0 && (
          <View style={[styles.divider, { borderColor: c.glass.border }]} />
        )}

        {/* ── Reviews List ── */}
        <View style={styles.reviewList}>
          {otherReviews.length === 0 && (
            <Text style={[typography.body, { color: c.text.secondary, textAlign: 'center', paddingVertical: space['3xl'] }]}>
              No reviews yet
            </Text>
          )}
          {otherReviews.map(review => (
            <GlassCard key={review.id} elevation={2}>
              <View style={styles.reviewHeader}>
                <View style={[styles.avatar, { backgroundColor: c.accent.purple }]}>
                  <Text style={styles.avatarText}>
                    {review.reviewer_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.captionBold, { color: c.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                    {review.reviewer_name}
                  </Text>
                  <Text style={[typography.label, { color: c.text.muted }]}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </Text>
                </View>
                {renderStars(review.rating)}
              </View>
              {review.comment ? (
                <Text style={[typography.caption, { color: c.text.secondary, marginTop: space.sm, lineHeight: 20 }]}>
                  {review.comment}
                </Text>
              ) : null}
            </GlassCard>
          ))}
        </View>
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

  starRow: {
    flexDirection: 'row',
    gap: 4,
  },

  textInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: space.lg,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'DMSans',
    minHeight: 90,
  },

  submitLoading: {
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  divider: {
    borderTopWidth: 1,
    marginHorizontal: space['2xl'],
    marginVertical: space['2xl'],
  },

  reviewList: {
    paddingHorizontal: space['2xl'],
    gap: space.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'DMSans-Bold',
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
