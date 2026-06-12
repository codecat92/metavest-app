import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, ActivityIndicator, Modal
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft, MessageCircle, Heart, Share2, Plus, Send, User
} from 'lucide-react-native';
import { forumApi, ForumPost, ForumComment } from '../api/forum';
import { getToken } from '../api/client';
import { useCustomAlert } from '../context/AlertContext';

export default function ForumScreen({ navigation }: any) {
  const alert = useCustomAlert();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, ForumComment[]>>({});
  const [commentText, setCommentText] = useState('');
  const [replyToId, setReplyToId] = useState<number | null>(null);

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
    if (!commentText.trim()) {
      alert.showAlert({ title: 'Error', message: 'Comment cannot be empty', type: 'error' });
      return;
    }
    try {
      await forumApi.createComment(postId, commentText.trim());
      setCommentText('');
      setReplyToId(null);
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

  const handleExpand = (postId: number) => {
    if (expandedId === postId) {
      setExpandedId(null);
      setReplyToId(null);
      setCommentText('');
    } else {
      setExpandedId(postId);
      setReplyToId(null);
      setCommentText('');
      if (!comments[postId]) loadComments(postId);
    }
  };

  if (!getToken()) {
    return (
      <View style={styles.container}>
        <View style={styles.center}><Text style={styles.centerText}>Login to see forum</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#8899AA" />
          </TouchableOpacity>
          <Text style={styles.title}>Forum</Text>
          <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.addBtn}>
            <Plus size={18} color="#AB4BFF" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#AB4BFF" style={{ marginTop: 60 }} />
        ) : (
          <View style={styles.list}>
            {posts.length === 0 ? (
              <View style={styles.emptyCard}>
                <MessageCircle size={40} color="#8899AA" />
                <Text style={styles.emptyText}>No posts yet</Text>
                <Text style={styles.emptySubText}>Be the first to start a discussion</Text>
              </View>
            ) : (
              posts.map((post) => {
                const expanded = expandedId === post.id;
                const postComments = comments[post.id] ?? [];
                return (
                  <View key={post.id} style={styles.card}>
                    <TouchableOpacity onPress={() => handleExpand(post.id)} activeOpacity={0.8}>
                      <View style={styles.cardHeader}>
                        <View style={styles.authorRow}>
                          <View style={styles.avatar}>
                            <User size={14} color="#AB4BFF" />
                          </View>
                          <View>
                            <Text style={styles.authorName}>{post.poster_name ?? 'User'}</Text>
                            <Text style={styles.postTime}>
                              {post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Text style={styles.postTitle}>{post.title}</Text>
                      <Text style={styles.postContent} numberOfLines={expanded ? undefined : 3}>
                        {post.content}
                      </Text>
                      <View style={styles.cardFooter}>
                        <TouchableOpacity onPress={() => handleLike(post.id)} style={styles.footerBtn}>
                          <Heart size={14} color="#8899AA" />
                          <Text style={styles.footerText}>{post.likes ?? 0}</Text>
                        </TouchableOpacity>
                        <View style={styles.footerBtn}>
                          <MessageCircle size={14} color="#8899AA" />
                          <Text style={styles.footerText}>{postComments.length}</Text>
                        </View>
                        <TouchableOpacity onPress={() => forumApi.sharePost(post.id)} style={styles.footerBtn}>
                          <Share2 size={14} color="#8899AA" />
                          <Text style={styles.footerText}>{post.shares ?? 0}</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>

                    {/* Comments section */}
                    {expanded && (
                      <View style={styles.commentsSection}>
                        {postComments.map((c) => (
                          <View key={c.id} style={styles.commentItem}>
                            <View style={styles.commentAvatar}>
                              <User size={10} color="#8899AA" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.commentAuthor}>{c.poster_name ?? 'User'}</Text>
                              <Text style={styles.commentContent}>{c.content}</Text>
                            </View>
                          </View>
                        ))}
                        <View style={styles.commentInputRow}>
                          <TextInput
                            style={styles.commentInput}
                            placeholder="Write a comment..."
                            placeholderTextColor="#8899AA"
                            value={commentText}
                            onChangeText={setCommentText}
                          />
                          <TouchableOpacity onPress={() => handleComment(post.id)} style={styles.sendBtn}>
                            <Send size={14} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Create Post Modal */}
      <Modal visible={showCreate} animationType="slide" transparent onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Post</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Text style={styles.modalClose}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.titleInput}
              placeholder="Post title"
              placeholderTextColor="#8899AA"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={styles.contentInput}
              placeholder="Write your thoughts..."
              placeholderTextColor="#8899AA"
              value={newContent}
              onChangeText={setNewContent}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity
              onPress={handleCreate}
              style={[styles.postBtn, submitting && { opacity: 0.6 }]}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.postBtnText}>Publish</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1439' },
  scroll: { paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', marginTop: 200 },
  centerText: { color: '#8899AA' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', flex: 1, marginLeft: 16 },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(171,75,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },

  list: { paddingHorizontal: 24, gap: 14 },
  emptyCard: {
    padding: 48, borderRadius: 24, alignItems: 'center',
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.12)',
    marginTop: 20,
  },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#8899AA', marginTop: 12 },
  emptySubText: { fontSize: 13, color: '#8899AA', marginTop: 4 },

  card: {
    borderRadius: 20, padding: 18,
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.12)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(171,75,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  authorName: { fontSize: 13, fontWeight: '700', color: '#fff' },
  postTime: { fontSize: 11, color: '#8899AA', marginTop: 1 },
  postTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 8 },
  postContent: { fontSize: 13, color: 'rgba(240,238,255,0.65)', lineHeight: 20 },
  cardFooter: {
    flexDirection: 'row', gap: 20, marginTop: 14, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(171,75,255,0.08)',
  },
  footerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, color: '#8899AA' },

  commentsSection: {
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(171,75,255,0.12)',
  },
  commentItem: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  commentAvatar: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  commentAuthor: { fontSize: 12, fontWeight: '700', color: '#AB4BFF' },
  commentContent: { fontSize: 12, color: 'rgba(240,238,255,0.6)', marginTop: 2 },
  commentInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8,
  },
  commentInput: {
    flex: 1, height: 40, borderRadius: 12, paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.15)',
    color: '#fff', fontSize: 13,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#AB4BFF', alignItems: 'center', justifyContent: 'center',
  },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(6,9,16,0.9)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0E1439', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 48,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  modalClose: { fontSize: 15, fontWeight: '600', color: '#FF4B6E' },
  titleInput: {
    height: 48, borderRadius: 14, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
    color: '#fff', fontSize: 15, marginBottom: 12,
  },
  contentInput: {
    height: 120, borderRadius: 14, padding: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
    color: '#fff', fontSize: 14, textAlignVertical: 'top',
  },
  postBtn: {
    height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#AB4BFF', marginTop: 16,
  },
  postBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
