import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, RefreshControl,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, MessageSquare, Users, Check, X } from 'lucide-react-native';
import { chatApi, ChatGroupListItem, ChatInvite } from '@/api/chat';
import { getChatAvatar, CHAT_AVATARS } from '@/constants/chatAvatars';
import { getToken } from '@/api/client';
import { useColors, space, radius, typography } from '@/theme';
import { GlassCard, AppButton, AppInput, EmptyState } from '@/components';
import { useCustomAlert } from '@/context/AlertContext';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatGroups'>;

export default function ChatGroupsScreen({ navigation }: Props) {
  const c = useColors();
  const alert = useCustomAlert();
  const [groups, setGroups] = useState<ChatGroupListItem[]>([]);
  const [invites, setInvites] = useState<ChatInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAvatar, setNewAvatar] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const [groupsRes, invitesRes] = await Promise.all([
        chatApi.listGroups(1),
        chatApi.invites(1),
      ]);
      setGroups(groupsRes.data ?? []);
      setInvites(invitesRes.data ?? []);
      setPage(1);
      setHasMore((groupsRes.data?.length ?? 0) >= 15);
    } catch (e) {
      console.log('Chat groups load failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { setLoading(true); load(); }, [load])
  );

  const loadMore = async () => {
    if (!hasMore || loading) return;
    try {
      const next = page + 1;
      const res = await chatApi.listGroups(next);
      const batch = res.data ?? [];
      setGroups(prev => [...prev, ...batch]);
      setPage(next);
      setHasMore(batch.length >= 15);
    } catch (e) {
      console.log('Chat groups loadMore failed:', e);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) { alert.showAlert({ title: 'Error', message: 'Nama grup wajib diisi', type: 'error' }); return; }
    setCreating(true);
    try {
      await chatApi.createGroup(newName.trim(), newDesc.trim() || undefined, newAvatar || undefined);
      setShowCreate(false); setNewName(''); setNewDesc(''); setNewAvatar(null);
      await load();
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Gagal membuat grup', type: 'error' });
    } finally { setCreating(false); }
  };

  const handleAccept = async (invite: ChatInvite) => {
    try {
      await chatApi.acceptInvite(invite.invite_id);
      setInvites(prev => prev.filter(i => i.invite_id !== invite.invite_id));
      await load();
      navigation.navigate('ChatRoom', { groupId: invite.group.id, groupName: invite.group.name });
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Gagal menerima undangan', type: 'error' });
    }
  };

  const handleReject = async (invite: ChatInvite) => {
    try {
      await chatApi.rejectInvite(invite.invite_id);
      setInvites(prev => prev.filter(i => i.invite_id !== invite.invite_id));
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Gagal menolak undangan', type: 'error' });
    }
  };

  const renderGroup = ({ item }: { item: ChatGroupListItem }) => {
    const av = getChatAvatar(item.avatar);
    const avColor = av?.color ?? c.accent.purple;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ChatRoom', { groupId: item.id, groupName: item.name })}
      >
        <GlassCard elevation={2}>
          <View style={styles.row}>
            <View style={[styles.avatar, { backgroundColor: `${avColor}22` }]}>
              {av ? <av.Icon size={20} color={avColor} /> : <MessageSquare size={20} color={c.accent.purple} />}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.sm }}>
                <Text style={[typography.bodyBold, { color: c.text.primary, flex: 1, fontFamily: 'DMSans-SemiBold' }]} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.unread_count > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unread_count > 99 ? '99+' : item.unread_count}</Text>
                  </View>
                )}
              </View>
              <Text style={[typography.caption, { color: c.text.secondary }]} numberOfLines={1}>
                {item.last_message
                  ? `${item.last_message.sender_name ?? ''}: ${item.last_message.content ?? ''}`
                  : 'Belum ada pesan'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Users size={11} color={c.text.muted} />
                <Text style={[typography.caption, { color: c.text.muted }]}>{item.member_count} anggota</Text>
              </View>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={c.text.secondary} />
        </TouchableOpacity>
        <Text style={[typography.h2, { color: c.text.primary, flex: 1, marginLeft: space.lg, fontFamily: 'Manrope-Bold' }]}>
          Grup Chat
        </Text>
        <TouchableOpacity onPress={() => setShowCreate(true)} style={[styles.newBtn, { backgroundColor: c.accent.purple }]}>
          <Plus size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={c.accent.purple} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          renderItem={renderGroup}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.accent.purple} />}
          ListHeaderComponent={
            invites.length > 0 ? (
              <View style={{ marginBottom: space.lg }}>
                <Text style={[typography.h4, { color: c.text.primary, marginBottom: space.sm, fontFamily: 'Manrope-Bold' }]}>
                  Undangan
                </Text>
                <View style={{ gap: space.sm }}>
                  {invites.map((inv) => (
                    <GlassCard key={inv.invite_id} elevation={2}>
                      <Text style={[typography.bodyBold, { color: c.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                        {inv.group.name}
                      </Text>
                      <Text style={[typography.caption, { color: c.text.secondary, marginTop: 2 }]}>
                        Diundang oleh {inv.invited_by_name ?? 'seseorang'}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
                        <TouchableOpacity
                          onPress={() => handleAccept(inv)}
                          style={[styles.inviteBtn, { backgroundColor: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.3)' }]}
                        >
                          <Check size={14} color={c.semantic.positive} />
                          <Text style={[typography.label, { color: c.semantic.positive }]}>Terima</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleReject(inv)}
                          style={[styles.inviteBtn, { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' }]}
                        >
                          <X size={14} color={c.semantic.negative} />
                          <Text style={[typography.label, { color: c.semantic.negative }]}>Tolak</Text>
                        </TouchableOpacity>
                      </View>
                    </GlassCard>
                  ))}
                </View>
                <Text style={[typography.h4, { color: c.text.primary, marginTop: space.xl, marginBottom: space.sm, fontFamily: 'Manrope-Bold' }]}>
                  Grup Saya
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon={<MessageSquare size={40} color={c.text.secondary} />}
              title="Belum ada grup"
              subtitle="Buat grup baru dan undang teman untuk mengobrol"
            />
          }
        />
      )}

      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: space.xl }}>
          <GlassCard elevation={4}>
            <Text style={[typography.h4, { color: c.text.primary, marginBottom: space.md, fontFamily: 'Manrope-Bold' }]}>
              Buat Grup Chat
            </Text>
            <AppInput label="Nama Grup" value={newName} onChangeText={setNewName} placeholder="Contoh: Diskusi Forex" containerStyle={{ marginBottom: space.sm }} />
            <AppInput label="Deskripsi (opsional)" value={newDesc} onChangeText={setNewDesc} placeholder="Deskripsi singkat" containerStyle={{ marginBottom: space.sm }} />
            <Text style={[typography.label, { color: c.text.secondary, marginBottom: space.sm }]}>Logo (opsional)</Text>
            <View style={styles.avatarGrid}>
              {CHAT_AVATARS.map(a => {
                const selected = newAvatar === a.key;
                return (
                  <TouchableOpacity
                    key={a.key}
                    onPress={() => setNewAvatar(selected ? null : a.key)}
                    activeOpacity={0.8}
                    style={[styles.avatarOption, { backgroundColor: `${a.color}22`, borderColor: selected ? a.color : c.glass.border }]}
                  >
                    <a.Icon size={22} color={a.color} />
                  </TouchableOpacity>
                );
              })}
            </View>
            <AppButton title={creating ? 'Membuat...' : 'Buat Grup'} onPress={handleCreate} loading={creating} style={{ marginBottom: space.sm, marginTop: space.md }} />
            <AppButton title="Batal" variant="ghost" onPress={() => setShowCreate(false)} />
          </GlassCard>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: space['2xl'], paddingTop: space.xl, paddingBottom: space.lg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  newBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  listContent: { paddingHorizontal: space['2xl'], paddingBottom: space['4xl'], gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  avatarOption: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5,
    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700', fontFamily: 'DMSans-Bold' },
  inviteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: space.xs,
    paddingHorizontal: space.lg, paddingVertical: space.sm,
    borderRadius: radius.md, borderWidth: 1,
  },
});
