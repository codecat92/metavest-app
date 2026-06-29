import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCheck, Bell } from 'lucide-react-native';
import { academyNewApi } from '@/api/academyNew';
import { useColors, space, radius, typography } from '@/theme';
import { GlassCard, AppButton, Skeleton } from '@/components';
import { useCustomAlert } from '@/context/AlertContext';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AcademyNotification } from '@/types/academy';

type Props = NativeStackScreenProps<RootStackParamList, 'AcademyNotifications'>;

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function AcademyNotificationsScreen({ navigation }: Props) {
  const c = useColors();
  const { showAlert } = useCustomAlert();

  const [notifications, setNotifications] = useState<AcademyNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch ──

  const loadNotifications = useCallback(async () => {
    setError(null);
    try {
      const [notifRes, countRes] = await Promise.all([
        academyNewApi.getNotifications(),
        academyNewApi.getUnreadCount(),
      ]);
      setNotifications(notifRes.data.items);
      setUnreadCount(countRes.data.count);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
      showAlert({ title: 'Error', message: e?.message ?? 'Failed to load notifications' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showAlert]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadNotifications();
    }, [loadNotifications]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  // ── Actions ──

  const handleMarkRead = useCallback(async (notif: AcademyNotification) => {
    if (notif.is_read) return;
    try {
      await academyNewApi.markRead(notif.id);
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n),
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e: any) {
      showAlert({ title: 'Error', message: e?.message ?? 'Failed to mark as read' });
    }
  }, [showAlert]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await academyNewApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (e: any) {
      showAlert({ title: 'Error', message: e?.message ?? 'Failed to mark all read' });
    }
  }, [showAlert]);

  // ── Render ──

  const renderItem = ({ item }: { item: AcademyNotification }) => {
    const isUnread = !item.is_read;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleMarkRead(item)}
        style={[
          styles.notifItem,
          {
            backgroundColor: isUnread ? `${c.accent.purple}0D` : 'transparent',
            borderColor: c.glass.border,
          },
        ]}
      >
        <View style={{ flexDirection: 'row', gap: space.md }}>
          {/* Unread dot */}
          {isUnread && (
            <View style={{ paddingTop: 6 }}>
              <View style={[styles.unreadDot, { backgroundColor: c.accent.purple }]} />
            </View>
          )}

          <View style={{ flex: 1 }}>
            <View style={styles.notifHeader}>
              <Text
                style={[isUnread ? typography.captionBold : typography.caption, { color: c.text.primary, fontFamily: isUnread ? 'DMSans-SemiBold' : 'DMSans-SemiBold' }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={[typography.label, { color: c.text.muted }]}>
                {getRelativeTime(item.created_at)}
              </Text>
            </View>
            <Text
              style={[typography.caption, { color: c.text.secondary, marginTop: 3, lineHeight: 18 }]}
              numberOfLines={2}
            >
              {item.body}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const isEmpty = !loading && !error && notifications.length === 0;

  // ── Loading ──

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Skeleton height={20} width="40%" style={{ marginLeft: space.md }} />
        </View>
        <View style={{ paddingHorizontal: space['2xl'], gap: space.sm }}>
          {[1, 2, 3, 4].map(i => (
            <GlassCard key={i} elevation={2}>
              <Skeleton height={14} width="60%" style={{ marginBottom: space.sm }} />
              <Skeleton height={12} width="100%" />
              <Skeleton height={12} width="40%" style={{ marginTop: space.xs }} />
            </GlassCard>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ──

  if (error && notifications.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h4, { color: c.text.primary, fontFamily: 'Manrope-Bold', marginLeft: space.md }]}>
            Notifications
          </Text>
        </View>
        <View style={styles.centerState}>
          <Text style={[typography.body, { color: c.text.secondary, textAlign: 'center' }]}>{error}</Text>
          <TouchableOpacity onPress={loadNotifications} style={styles.retryBtn}>
            <Text style={[typography.bodyBold, { color: c.accent.purple }]}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main ──

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={c.text.secondary} />
        </TouchableOpacity>
        <Text style={[typography.h4, { color: c.text.primary, fontFamily: 'Manrope-Bold', marginLeft: space.md, flex: 1 }]}>
          Notifications
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            style={[styles.markAllBtn, { borderColor: c.glass.border }]}
          >
            <CheckCheck size={14} color={c.text.secondary} />
            <Text style={[typography.label, { color: c.text.secondary }]}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <FlatList
        data={notifications}
        keyExtractor={item => `${item.id}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isEmpty ? (
            <View style={styles.centerState}>
              <Bell size={48} color={c.text.muted} />
              <Text style={[typography.body, { color: c.text.secondary, textAlign: 'center' }]}>
                No notifications yet
              </Text>
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
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: space['2xl'],
    paddingTop: space.xl, paddingBottom: space.lg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  markAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: space.md, paddingVertical: space.xs,
    borderRadius: radius.sm, borderWidth: 1,
  },

  listContent: {
    paddingHorizontal: space['2xl'],
    paddingBottom: 60,
    gap: space.sm,
  },

  notifItem: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.xl,
  },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  notifHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
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
