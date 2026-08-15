import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, TextInput, ActivityIndicator, Modal, Image
} from 'react-native';
import { useCallback, useEffect, useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  MessageCircle, Heart, Share2, Plus, Send, User
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { forumApi, ForumPost, ForumComment } from '@/api/forum';
import { getToken, BASE_URL } from '@/api/client';
import { useCustomAlert } from '@/context/AlertContext';
import { useAuth } from '@/context/AuthContext';
import { colors, useColors, space, radius, typography } from '@/theme';
import { GlassCard, AppButton, AppInput, AppHeader, EmptyState, Skeleton } from '@/components';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

const STORAGE_HOST = BASE_URL.replace(/\/api$/, '');

type ForumProps = NativeStackScreenProps<RootStackParamList, 'Forum'>;

interface PostCommentState {
  text: string;
  replyToId: number | null;
}

export default function ForumScreen({ navigation, route }: ForumProps) {
  const alert = useCustomAlert();
  const colors = useColors();
  const { userType } = useAuth();
  const posterType = userType === 'trader' ? 2 : 1;
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, ForumComment[]>>({});
  const [commentStates, setCommentStates] = useState<Record<number, PostCommentState>>({});
  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(new Set());
  const [postFilter, setPostFilter] = useState<'all' | 'announcement' | 'discussion'>('all');
  const [loadingMore, setLoadingMore] = useState(false);

  const pageRef = useRef(1);
  const loadedCountRef = useRef(0);
  const totalCountRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const listRef = useRef<FlatList<ForumPost>>(null);
  const scrollTargetRef = useRef<number | null>(null);

  const loadPosts = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const res = await forumApi.getPosts(1, postFilter);
      let data = res.data ?? [];
      const targetId = scrollTargetRef.current;
      if (targetId != null && !data.some(p => p.id === targetId)) {
        try {
          const single = await forumApi.getPostById(targetId);
          if (single.data) data = [single.data, ...data];
        } catch {}
      }
      setPosts(data);
      pageRef.current = 1;
      loadedCountRef.current = data.length;
      totalCountRef.current = res.data_count ?? 0;
    } catch (e) {
      console.log('Forum load failed:', e);
    } finally {
      setLoading(false);
    }
  }, [postFilter]);

  useFocusEffect(
    useCallback(() => { setLoading(true); loadPosts(); }, [loadPosts])
  );

  useEffect(() => {
    scrollTargetRef.current = route.params?.scrollToPostId ?? null;
  }, [route.params?.scrollToPostId]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current) return;
    if (loadedCountRef.current >= totalCountRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const res = await forumApi.getPosts(nextPage, postFilter);
      const data = res.data ?? [];
      setPosts(prev => [...prev, ...data]);
      pageRef.current = nextPage;
      loadedCountRef.current += data.length;
      totalCountRef.current = res.data_count ?? totalCountRef.current;
    } catch (e) {
      console.log('Forum load more failed:', e);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [postFilter]);

  const loadComments = async (postId: number) => {
    try {
      const res = await forumApi.getComments(postId, 1);
      setComments(prev => ({ ...prev, [postId]: res.data ?? [] }));
    } catch (e) {
      console.log('Comments load failed:', e);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      alert.showAlert({ title: 'Error', message: 'Title and content are required', type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await forumApi.createPost(newTitle.trim(), newContent.trim(), posterType);
      alert.showAlert({ title: 'Posted', message: 'Your post has been published', type: 'success' });
      setShowCreate(false);
      setNewTitle('');
      setNewContent('');
      loadPosts();
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleComment = async (postId: number) => {
    const state = commentStates[postId] ?? { text: '', replyToId: null };
    if (!state.text.trim()) {
      alert.showAlert({ title: 'Error', message: 'Comment cannot be empty', type: 'error' });
      return;
    }
    try {
      await forumApi.createComment(postId, state.text.trim(), posterType);
      setCommentStates(prev => ({ ...prev, [postId]: { text: '', replyToId: null } }));
      loadComments(postId);
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Failed', type: 'error' });
    }
  };

  const handleLike = async (postId: number) => {
    try {
      await forumApi.likePost(postId);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: (p.likes ?? 0) + 1 } : p));
      setLikedPostIds(prev => new Set(prev).add(postId));
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Failed', type: 'error' });
    }
  };

  const handleShare = async (postId: number) => {
    try {
      await forumApi.sharePost(postId);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, shares: (p.shares ?? 0) + 1 } : p));
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Failed', type: 'error' });
    }
  };

  const handleExpand = (postId: number) => {
    if (expandedId === postId) {
      setExpandedId(null);
    } else {
      setExpandedId(postId);
      if (!comments[postId]) loadComments(postId);
    }
  };

  const setPostCommentText = (postId: number, text: string) => {
    setCommentStates(prev => ({
      ...prev,
      [postId]: { ...(prev[postId] ?? { text: '', replyToId: null }), text },
    }));
  };

  // After the list is (re)loaded, expand + scroll to the deep-linked post (announcement notification).
  useEffect(() => {
    const targetId = scrollTargetRef.current;
    if (targetId == null) return;
    const idx = posts.findIndex(p => p.id === targetId);
    if (idx === -1) return;
    setExpandedId(targetId);
    if (!comments[targetId]) loadComments(targetId);
    scrollTargetRef.current = null;
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.1 });
    });
  }, [posts, comments]);

  const renderPost = ({ item }: { item: ForumPost }) => {
    const expanded = expandedId === item.id;
    const postComments = comments[item.id] ?? [];
    const commentState = commentStates[item.id] ?? { text: '', replyToId: null };
    const isLiked = likedPostIds.has(item.id);
    const isAnnouncement = item.poster_type === 3;
    return (
      <GlassCard elevation={2} style={isAnnouncement ? styles.announcementCard : undefined}>
        <TouchableOpacity onPress={() => handleExpand(item.id)} activeOpacity={0.8}>
          <View style={styles.cardHeader}>
            <View style={styles.authorRow}>
              {item.poster_profile_image && !isAnnouncement ? (
                <Image
                  source={{ uri: item.poster_profile_image.startsWith('http') ? item.poster_profile_image : `${STORAGE_HOST}/uploads/profilepic/${item.poster_profile_image.split(/[\\/]/).pop()}` }}
                  style={styles.avatarImg}
                />
              ) : (
                <View style={[styles.avatar, isAnnouncement && styles.announcementAvatar]}>
                  <User size={14} color={isAnnouncement ? '#8B5CF6' : colors.accent.purple} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                {isAnnouncement && (
                  <Text style={styles.announcementBadge}>📢 PENGUMUMAN</Text>
                )}
                <Text style={[typography.captionBold, { color: isAnnouncement ? '#B8860B' : colors.text.primary, fontFamily: 'DMSans-Bold' }]}>
                  {typeof item.poster_name === 'string' ? item.poster_name : 'Admin'}
                </Text>
                <Text style={[typography.label, { color: colors.text.secondary }]}>
                  {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                </Text>
              </View>
            </View>
          </View>
          <Text style={[typography.h4, { color: colors.text.primary, marginBottom: space.sm, fontFamily: 'Manrope-Bold' }]}>
            {item.title}
          </Text>
          <Text
            style={[typography.body, { color: colors.text.muted }]}
            numberOfLines={expanded ? undefined : 3}
          >
            {item.content}
          </Text>
          <View style={styles.cardFooter}>
            <TouchableOpacity onPress={() => handleLike(item.id)} style={styles.footerBtn}>
              <Heart
                size={14}
                color={isLiked ? colors.semantic.negative : colors.text.secondary}
                fill={isLiked ? colors.semantic.negative : 'transparent'}
              />
              <Text style={[typography.label, { color: colors.text.secondary }]}>
                {item.likes ?? 0}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleExpand(item.id)} style={styles.footerBtn}>
              <MessageCircle size={14} color={colors.text.secondary} />
              <Text style={[typography.label, { color: colors.text.secondary }]}>
                {item.comments ?? 0}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleShare(item.id)} style={styles.footerBtn}>
              <Share2 size={14} color={colors.text.secondary} />
              <Text style={[typography.label, { color: colors.text.secondary }]}>
                {item.shares ?? 0}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {expanded && (
          <View style={styles.commentsSection}>
            {postComments.map((c) => (
              <View key={c.id} style={styles.commentItem}>
                <View style={styles.commentAvatar}>
                  {c.commenter_profile_image ? (
                    <Image
                      source={{ uri: c.commenter_profile_image.startsWith('http') ? c.commenter_profile_image : `${STORAGE_HOST}/uploads/profilepic/${c.commenter_profile_image.split(/[\\/]/).pop()}` }}
                      style={styles.commentAvatarImg}
                    />
                  ) : (
                    <User size={10} color={colors.text.secondary} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.caption, { color: colors.accent.purple, fontWeight: '700' }]}>
                    {c.commenter_name ?? 'User'}
                  </Text>
                  <Text style={[typography.caption, { color: colors.text.muted, marginTop: 2 }]}>
                    {c.content}
                  </Text>
                  <Text style={[typography.label, { color: colors.text.muted, marginTop: 4 }]}>
                    {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
                  </Text>
                </View>
              </View>
            ))}
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor={colors.text.secondary}
                value={commentState.text}
                onChangeText={(t) => setPostCommentText(item.id, t)}
              />
              <TouchableOpacity
                onPress={() => handleComment(item.id)}
                style={styles.sendBtn}
              >
                <Send size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </GlassCard>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator style={{ paddingVertical: space.xl }} color={colors.accent.purple} />;
  };

  if (!getToken()) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]} edges={['top']}>
        <AppHeader title="Forum" onBack={() => navigation.goBack()} />
        <EmptyState
          icon={<MessageCircle size={40} color={colors.text.secondary} />}
          title="Login to see forum"
          subtitle="Sign in to join the discussion"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]} edges={['top']}>
      <AppHeader
        title="Forum"
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.addBtn}>
            <Plus size={18} color={colors.accent.purple} />
          </TouchableOpacity>
        }
      />

      {/* ── Filter toggle: Semua / Pengumuman / Discussion ── */}
      <View style={styles.filterRow}>
        {(['all', 'announcement', 'discussion'] as const).map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setPostFilter(t)}
            style={[styles.filterBtn, postFilter === t && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, postFilter === t && styles.filterTextActive]}>
              {t === 'all' ? 'Semua' : t === 'announcement' ? 'Pengumuman' : 'Discussion'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: space['2xl'], gap: space.md }}>
          {[1, 2, 3].map(i => (
            <GlassCard key={i} elevation={2}>
              <Skeleton height={36} width={36} borderRadius={18} style={{ marginBottom: space.md }} />
              <Skeleton height={16} width="80%" style={{ marginBottom: space.sm }} />
              <Skeleton height={14} width="100%" style={{ marginBottom: space.sm }} />
              <Skeleton height={14} width="60%" />
            </GlassCard>
          ))}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList<ForumPost>
            ref={listRef}
            data={posts}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderPost}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            onScrollToIndexFailed={(info) => {
              listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
            }}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <EmptyState
                icon={<MessageCircle size={40} color={colors.text.secondary} />}
                title="No posts yet"
                subtitle="Be the first to start a discussion"
                action={{ label: 'Create Post', onPress: () => setShowCreate(true) }}
              />
            }
          />
        </View>
      )}

      <Modal visible={showCreate} animationType="slide" transparent onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[typography.h3, { color: colors.text.primary, fontFamily: 'Manrope-Bold' }]}>
                New Post
              </Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Text style={[typography.bodyBold, { color: colors.semantic.negative }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
            <AppInput
              label="TITLE"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Post title"
            />
            <TextInput
              style={styles.contentInput}
              placeholder="Write your thoughts..."
              placeholderTextColor={colors.text.secondary}
              value={newContent}
              onChangeText={setNewContent}
              multiline
              numberOfLines={4}
            />
            <AppButton
              title="Publish"
              onPress={handleCreate}
              loading={submitting}
              size="lg"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },

  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },

  listContent: { paddingHorizontal: space['2xl'], paddingBottom: 100, gap: space.md },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(139,92,246,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 36, height: 36, borderRadius: 18 },
  cardFooter: {
    flexDirection: 'row', gap: space.xl, marginTop: space.md, paddingTop: space.md,
    borderTopWidth: 1, borderTopColor: colors.glass.border,
  },
  footerBtn: { flexDirection: 'row', alignItems: 'center', gap: space.xs },

  commentsSection: {
    marginTop: space.md, paddingTop: space.md,
    borderTopWidth: 1, borderTopColor: colors.glass.border,
  },
  commentItem: { flexDirection: 'row', gap: space.sm, marginBottom: space.sm },
  commentAvatar: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.glass.g2,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  commentAvatarImg: { width: 24, height: 24, borderRadius: 12 },
  commentInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm,
  },
  commentInput: {
    flex: 1, height: 40, borderRadius: radius.md, paddingHorizontal: space.md,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
    color: colors.text.primary, fontSize: 13, fontFamily: 'DMSans',
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.accent.purple, alignItems: 'center', justifyContent: 'center',
  },

  modalOverlay: {
    flex: 1, backgroundColor: colors.overlay.modal,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.bg.primary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space['2xl'],
    paddingBottom: space['4xl'] + space['2xl'],
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xl,
  },
  contentInput: {
    height: 120, borderRadius: radius.md, padding: space.lg,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
    color: colors.text.primary, fontSize: 14, textAlignVertical: 'top',
    marginBottom: space.lg, fontFamily: 'DMSans',
  },

  filterRow: {
    flexDirection: 'row', gap: space.sm,
    paddingHorizontal: space['2xl'], marginBottom: space.lg,
  },
  filterBtn: {
    paddingHorizontal: space.lg, paddingVertical: space.sm,
    borderRadius: radius.full, borderWidth: 1,
    borderColor: colors.glass.border,
    backgroundColor: colors.glass.g1,
  },
  filterBtnActive: {
    backgroundColor: colors.accent.purple,
    borderColor: colors.accent.purple,
  },
  filterText: {
    fontSize: 12, fontWeight: '600',
    color: colors.text.secondary, fontFamily: 'DMSans-SemiBold',
  },
  filterTextActive: { color: '#fff' },

  announcementCard: {
    borderColor: colors.accent.gold,
    borderWidth: 1.5,
  },
  announcementAvatar: {
    backgroundColor: 'rgba(212,175,55,0.20)',
  },
  announcementBadge: {
    fontSize: 10, fontWeight: '700',
    color: '#B8860B', letterSpacing: 0.5,
    fontFamily: 'DMSans-Bold', marginBottom: 2,
  },
});
