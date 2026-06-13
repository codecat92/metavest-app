import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, ActivityIndicator, Modal
} from 'react-native';
import { useCallback, useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  MessageCircle, Heart, Share2, Plus, Send, User
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { forumApi, ForumPost, ForumComment } from '@/api/forum';
import { getToken } from '@/api/client';
import { useCustomAlert } from '@/context/AlertContext';
import { colors, space, radius, typography } from '@/theme';
import { GlassCard, AppButton, AppInput, AppHeader, EmptyState, Skeleton } from '@/components';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type ForumProps = NativeStackScreenProps<RootStackParamList, 'Forum'>;

interface PostCommentState {
  text: string;
  replyToId: number | null;
}

export default function ForumScreen({ navigation }: ForumProps) {
  const alert = useCustomAlert();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, ForumComment[]>>({});
  const [commentStates, setCommentStates] = useState<Record<number, PostCommentState>>({});

  const loadPosts = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const res = await forumApi.getPosts(1);
      setPosts(res.data ?? []);
    } catch (e) {
      console.log('Forum load failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { setLoading(true); loadPosts(); }, [loadPosts])
  );

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
      await forumApi.createPost(newTitle.trim(), newContent.trim());
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
      await forumApi.createComment(postId, state.text.trim());
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

  if (!getToken()) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <AppHeader
          title="Forum"
          onBack={() => navigation.goBack()}
          right={
            <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.addBtn}>
              <Plus size={18} color={colors.accent.purple} />
            </TouchableOpacity>
          }
        />

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
          <View style={styles.list}>
            {posts.length === 0 ? (
              <EmptyState
                icon={<MessageCircle size={40} color={colors.text.secondary} />}
                title="No posts yet"
                subtitle="Be the first to start a discussion"
                action={{ label: 'Create Post', onPress: () => setShowCreate(true) }}
              />
            ) : (
              posts.map((post) => {
                const expanded = expandedId === post.id;
                const postComments = comments[post.id] ?? [];
                const commentState = commentStates[post.id] ?? { text: '', replyToId: null };
                return (
                  <GlassCard key={post.id} elevation={2}>
                    <TouchableOpacity onPress={() => handleExpand(post.id)} activeOpacity={0.8}>
                      <View style={styles.cardHeader}>
                        <View style={styles.authorRow}>
                          <View style={styles.avatar}>
                            <User size={14} color={colors.accent.purple} />
                          </View>
                          <View>
                            <Text style={[typography.captionBold, { color: colors.text.primary, fontFamily: 'DMSans-Bold' }]}>
                              {post.poster_name ?? 'User'}
                            </Text>
                            <Text style={[typography.label, { color: colors.text.secondary }]}>
                              {post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Text style={[typography.h4, { color: colors.text.primary, marginBottom: space.sm, fontFamily: 'SpaceGrotesk-Bold' }]}>
                        {post.title}
                      </Text>
                      <Text
                        style={[typography.body, { color: colors.text.muted }]}
                        numberOfLines={expanded ? undefined : 3}
                      >
                        {post.content}
                      </Text>
                      <View style={styles.cardFooter}>
                        <TouchableOpacity onPress={() => handleLike(post.id)} style={styles.footerBtn}>
                          <Heart size={14} color={colors.text.secondary} />
                          <Text style={[typography.label, { color: colors.text.secondary }]}>
                            {post.likes ?? 0}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleExpand(post.id)} style={styles.footerBtn}>
                          <MessageCircle size={14} color={colors.text.secondary} />
                          <Text style={[typography.label, { color: colors.text.secondary }]}>
                            {postComments.length}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleShare(post.id)} style={styles.footerBtn}>
                          <Share2 size={14} color={colors.text.secondary} />
                          <Text style={[typography.label, { color: colors.text.secondary }]}>
                            {post.shares ?? 0}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>

                    {expanded && (
                      <View style={styles.commentsSection}>
                        {postComments.map((c) => (
                          <View key={c.id} style={styles.commentItem}>
                            <View style={styles.commentAvatar}>
                              <User size={10} color={colors.text.secondary} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[typography.caption, { color: colors.accent.purple, fontWeight: '700' }]}>
                                {c.poster_name ?? 'User'}
                              </Text>
                              <Text style={[typography.caption, { color: colors.text.muted, marginTop: 2 }]}>
                                {c.content}
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
                            onChangeText={(t) => setPostCommentText(post.id, t)}
                          />
                          <TouchableOpacity
                            onPress={() => handleComment(post.id)}
                            style={styles.sendBtn}
                          >
                            <Send size={14} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </GlassCard>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={showCreate} animationType="slide" transparent onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[typography.h3, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
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
  scroll: { paddingBottom: 100 },

  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },

  list: { paddingHorizontal: space['2xl'], gap: space.md },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(139,92,246,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
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
  },
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
});
