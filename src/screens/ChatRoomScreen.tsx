import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
  Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft, Send, Image as ImageIcon, MoreVertical, UserPlus, UserMinus, X, Crown,
} from 'lucide-react-native';
import { chatApi, ChatMessage, ChatGroupDetail, ChatMember, ChatUserSearch } from '@/api/chat';
import { getToken } from '@/api/client';
import { useColors, useTheme, space, radius, typography } from '@/theme';
import { GlassCard, AppButton, AppInput, EmptyState } from '@/components';
import { useCustomAlert } from '@/context/AlertContext';
import { useAuth } from '@/context/AuthContext';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatRoom'>;

const POLL_MS = 5000;

// Avatar anggota — foto profil bila tersedia, fallback inisial nama.
function MemberAvatar({ uri, name, size = 36 }: { uri?: string | null; name?: string | null; size?: number }) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return <ExpoImage source={{ uri }} style={dimension} contentFit="cover" />;
  }
  return (
    <View style={[dimension, { backgroundColor: 'rgba(139,92,246,0.15)', alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: '#8B5CF6', fontWeight: '700', fontFamily: 'DMSans-Bold', fontSize: Math.round(size * 0.4) }}>
        {(name ?? 'U').charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

export default function ChatRoomScreen({ navigation, route }: Props) {
  const c = useColors();
  const alert = useCustomAlert();
  const { user } = useAuth();
  const { groupId } = route.params;

  const [detail, setDetail] = useState<ChatGroupDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]); // newest-first
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUserSearch[]>([]);
  const [searching, setSearching] = useState(false);

  const newestIdRef = useRef(0);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  const markRead = useCallback((id: number) => {
    if (id > 0) chatApi.markRead(groupId, id).catch(() => {});
  }, [groupId]);

  const loadInitial = useCallback(async () => {
    try {
      const [detailRes, msgRes] = await Promise.all([
        chatApi.groupDetail(groupId),
        chatApi.messages(groupId, undefined, 30),
      ]);
      setDetail(detailRes.data);
      const asc = msgRes.data ?? [];
      const desc = [...asc].reverse();
      setMessages(desc);
      newestIdRef.current = desc[0]?.id ?? 0;
      markRead(newestIdRef.current);
    } catch (e) {
      console.log('Chat room load failed:', e);
    } finally {
      setLoading(false);
    }
  }, [groupId, markRead]);

  const poll = useCallback(async () => {
    try {
      const res = await chatApi.latestMessages(groupId, newestIdRef.current, 50);
      const incoming = res.data ?? [];
      if (incoming.length > 0) {
        const ids = new Set(messagesRef.current.map(m => m.id));
        const fresh = incoming.filter(m => !ids.has(m.id)).reverse(); // newest-first
        if (fresh.length > 0) {
          setMessages(prev => [...fresh, ...prev]);
          newestIdRef.current = Math.max(newestIdRef.current, ...incoming.map(m => m.id));
          markRead(newestIdRef.current);
        }
      }
    } catch {
      // silent
    }
  }, [groupId, markRead]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadInitial();
      const timer = setInterval(poll, POLL_MS);
      return () => clearInterval(timer);
    }, [loadInitial, poll])
  );

  const loadOlder = async () => {
    const oldest = messagesRef.current[messagesRef.current.length - 1];
    if (!oldest) return;
    try {
      const res = await chatApi.messages(groupId, oldest.id, 30);
      const older = res.data ?? []; // ascending
      if (older.length > 0) {
        setMessages(prev => [...prev, ...[...older].reverse()]);
      }
    } catch (e) {
      console.log('Load older failed:', e);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    try {
      const res = await chatApi.sendText(groupId, text);
      const msg = res.data;
      if (msg) {
        setMessages(prev => [msg, ...prev.filter(m => m.id !== msg.id)]);
        newestIdRef.current = Math.max(newestIdRef.current, msg.id);
      }
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Gagal mengirim pesan', type: 'error' });
      setInput(text);
    } finally { setSending(false); }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert.showAlert({ title: 'Izin ditolak', message: 'Izinkan akses galeri untuk mengirim gambar', type: 'error' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      setSending(true);
      const res = await chatApi.sendImage(groupId, result.assets[0].uri);
      const msg = res.data;
      if (msg) {
        setMessages(prev => [msg, ...prev.filter(m => m.id !== msg.id)]);
        newestIdRef.current = Math.max(newestIdRef.current, msg.id);
      }
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Gagal mengirim gambar', type: 'error' });
    } finally { setSending(false); }
  };

  const openManage = async () => {
    setShowManage(true);
    try {
      const res = await chatApi.members(groupId, 1);
      setMembers(res.data ?? []);
    } catch (e) {
      console.log('Load members failed:', e);
    }
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await chatApi.searchUsers(q.trim());
      setSearchResults(res.data ?? []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  const handleInvite = async (u: ChatUserSearch) => {
    try {
      await chatApi.invite(groupId, u.id_user);
      alert.showAlert({ title: 'Terkirim', message: `Undangan dikirim ke ${u.name}`, type: 'success' });
      setShowInvite(false); setSearchQuery(''); setSearchResults([]);
      openManage();
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Gagal mengundang', type: 'error' });
    }
  };

  const handleRemove = async (m: ChatMember) => {
    try {
      await chatApi.removeMember(groupId, m.user_id);
      setMembers(prev => prev.filter(x => x.user_id !== m.user_id));
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Gagal mengeluarkan anggota', type: 'error' });
    }
  };

  const handleLeave = async () => {
    try {
      await chatApi.leave(groupId);
      setShowManage(false);
      navigation.goBack();
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Gagal keluar grup', type: 'error' });
    }
  };

  const handleDisband = async () => {
    try {
      await chatApi.disband(groupId);
      setShowManage(false);
      navigation.goBack();
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Gagal membubarkan grup', type: 'error' });
    }
  };

  const token = getToken();

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const mine = item.sender_id === user?.id_user;
    return (
      <View style={[styles.msgRow, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
        {!mine && (
          <MemberAvatar uri={item.sender_profile_image} name={item.sender_name} size={30} />
        )}
        <View style={{ maxWidth: '74%', marginLeft: mine ? 0 : space.sm }}>
          {!mine && (
            <Text style={[typography.caption, { color: c.text.muted, marginBottom: 2, marginLeft: 4 }]}>
              {item.sender_name ?? 'User'}
            </Text>
          )}
          <View style={[
            styles.bubble,
            mine
              ? { backgroundColor: c.accent.purple, borderTopRightRadius: 4 }
              : { backgroundColor: c.glass.g2, borderColor: c.glass.border, borderWidth: 1, borderTopLeftRadius: 4 },
          ]}>
            {item.type === 2 && item.image_url ? (
              <ExpoImage
                source={{ uri: item.image_url, headers: token ? { Authorization: `Bearer ${token}` } : undefined }}
                style={styles.msgImage}
                contentFit="cover"
              />
            ) : (
              <Text style={{ color: mine ? '#fff' : c.text.primary, fontFamily: 'DMSans' }}>
                {item.content}
              </Text>
            )}
          </View>
          <Text style={[typography.caption, { color: c.text.muted, marginTop: 2, textAlign: mine ? 'right' : 'left', fontSize: 10 }]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const initial = (detail?.name ?? route.params.groupName ?? 'G').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: c.glass.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={c.text.secondary} />
        </TouchableOpacity>
        <View style={[styles.headerAvatar, { backgroundColor: 'rgba(139,92,246,0.15)' }]}>
          <Text style={{ color: c.accent.purple, fontWeight: '800', fontFamily: 'Manrope-Bold' }}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.bodyBold, { color: c.text.primary, fontFamily: 'DMSans-SemiBold' }]} numberOfLines={1}>
            {detail?.name ?? route.params.groupName ?? 'Grup'}
          </Text>
          <Text style={[typography.caption, { color: c.text.muted }]}>
            {detail ? `${detail.member_count} anggota` : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={openManage} style={styles.backBtn}>
          <MoreVertical size={20} color={c.text.secondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {loading ? (
          <ActivityIndicator size="large" color={c.accent.purple} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(m) => String(m.id)}
            renderItem={renderMessage}
            inverted
            contentContainerStyle={{ padding: space.lg, gap: space.sm }}
            onEndReached={loadOlder}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={
              <View style={{ transform: [{ scaleY: -1 }] }}>
                <EmptyState icon={<Send size={32} color={c.text.secondary} />} title="Belum ada pesan" subtitle="Mulai percakapan" />
              </View>
            }
          />
        )}

        <View style={[styles.inputBar, { borderTopColor: c.glass.border, backgroundColor: c.bg.primary }]}>
          <TouchableOpacity onPress={handlePickImage} style={styles.attachBtn} disabled={sending}>
            <ImageIcon size={22} color={c.accent.purple} />
          </TouchableOpacity>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Tulis pesan..."
            placeholderTextColor={c.text.muted}
            style={[styles.input, { color: c.text.primary, backgroundColor: c.glass.g1, borderColor: c.glass.border }]}
            multiline
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={sending || !input.trim()}
            style={[styles.sendBtn, { backgroundColor: input.trim() ? c.accent.purple : 'rgba(139,92,246,0.3)' }]}
          >
            <Send size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Manage group modal */}
      <Modal visible={showManage} transparent animationType="fade" onRequestClose={() => setShowManage(false)}>
        <View style={styles.modalOverlay}>
          <GlassCard elevation={4} style={{ width: '100%', maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md }}>
              <Text style={[typography.h4, { color: c.text.primary, fontFamily: 'Manrope-Bold' }]}>Kelola Grup</Text>
              <TouchableOpacity onPress={() => setShowManage(false)}>
                <X size={20} color={c.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm }}>
                <Text style={[typography.bodyBold, { color: c.text.primary, fontFamily: 'DMSans-SemiBold' }]}>Anggota</Text>
                {detail?.is_leader && (
                  <TouchableOpacity
                    onPress={() => { setShowManage(false); setShowInvite(true); }}
                    style={[styles.inlineBtn, { borderColor: 'rgba(139,92,246,0.4)' }]}
                  >
                    <UserPlus size={14} color={c.accent.purple} />
                    <Text style={[typography.label, { color: c.accent.purple }]}>Undang</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ gap: space.sm }}>
                {members.map((m) => (
                  <View key={m.user_id} style={styles.memberRow}>
                    <MemberAvatar uri={m.profile_image_src} name={m.name} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        {m.role === 1 && <Crown size={12} color={c.accent.gold} />}
                        <Text style={[typography.bodyBold, { color: c.text.primary, fontFamily: 'DMSans-SemiBold' }]} numberOfLines={1}>
                          {m.name ?? m.user_id}
                        </Text>
                      </View>
                      {m.status === 1 && (
                        <Text style={[typography.caption, { color: c.semantic.warning }]}>Menunggu konfirmasi</Text>
                      )}
                    </View>
                    {detail?.is_leader && m.role !== 1 && m.status === 2 && (
                      <TouchableOpacity onPress={() => handleRemove(m)} style={styles.removeBtn}>
                        <UserMinus size={16} color={c.semantic.negative} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              <View style={{ marginTop: space.xl, gap: space.sm }}>
                {detail?.is_leader ? (
                  <AppButton title="Bubarkan Grup" variant="danger" onPress={handleDisband} />
                ) : (
                  <AppButton title="Keluar dari Grup" variant="danger" onPress={handleLeave} />
                )}
              </View>
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>

      {/* Invite modal */}
      <Modal visible={showInvite} transparent animationType="fade" onRequestClose={() => setShowInvite(false)}>
        <View style={styles.modalOverlay}>
          <GlassCard elevation={4} style={{ width: '100%', maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md }}>
              <Text style={[typography.h4, { color: c.text.primary, fontFamily: 'Manrope-Bold' }]}>Undang Anggota</Text>
              <TouchableOpacity onPress={() => setShowInvite(false)}>
                <X size={20} color={c.text.secondary} />
              </TouchableOpacity>
            </View>
            <AppInput
              value={searchQuery}
              onChangeText={handleSearch}
              placeholder="Cari nama pengguna..."
              containerStyle={{ marginBottom: space.md }}
            />
            {searching ? (
              <ActivityIndicator color={c.accent.purple} />
            ) : (
              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {searchResults.length === 0 ? (
                  <Text style={[typography.caption, { color: c.text.muted, textAlign: 'center', paddingVertical: space.lg }]}>
                    {searchQuery.trim().length < 2 ? 'Ketik minimal 2 karakter' : 'Tidak ada hasil'}
                  </Text>
                ) : (
                  searchResults.map((u) => (
                    <TouchableOpacity key={u.id_user} onPress={() => handleInvite(u)} style={styles.memberRow}>
                      <MemberAvatar uri={u.profile_image_src} name={u.name} />
                      <Text style={[typography.bodyBold, { color: c.text.primary, flex: 1, fontFamily: 'DMSans-SemiBold' }]} numberOfLines={1}>
                        {u.name}
                      </Text>
                      <UserPlus size={16} color={c.accent.purple} />
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </GlassCard>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end' },
  bubble: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.lg },
  msgImage: { width: 200, height: 200, borderRadius: radius.md },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: space.sm,
    paddingHorizontal: space.md, paddingVertical: space.sm, borderTopWidth: 1,
  },
  attachBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1, maxHeight: 100, borderWidth: 1, borderRadius: radius.lg,
    paddingHorizontal: space.md, paddingVertical: space.sm, fontFamily: 'DMSans',
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: space.xl },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.xs },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  removeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  inlineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: space.xs,
    paddingHorizontal: space.md, paddingVertical: 4, borderRadius: radius.md, borderWidth: 1,
  },
});
