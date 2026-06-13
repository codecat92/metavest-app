import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, MessageCircle } from 'lucide-react-native';
import { notificationApi, Notification } from '../api/notifications';
import { getToken } from '../api/client';
import { colors, space, radius, typography } from '../theme';
import { GlassCard, EmptyState, Skeleton } from '../components';
import type { RootStackParamList } from '../types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type NotifProps = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export default function NotificationsScreen({ navigation }: NotifProps) {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const res = await notificationApi.getAll(1);
      setNotifs(res.data ?? []);
    } catch (e) {
      console.log('Notifications failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { setLoading(true); loadData(); }, [loadData])
  );

  if (!getToken()) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <EmptyState icon={<Bell size={40} color={colors.text.secondary} />} title="Login to see notifications" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h2, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
            Notifications
          </Text>
        </View>

        {loading ? (
          <View style={{ paddingHorizontal: space['2xl'], gap: space.sm }}>
            {[1, 2, 3].map(i => (
              <GlassCard key={i} elevation={2}>
                <Skeleton height={40} width={40} borderRadius={16} style={{ marginBottom: space.md }} />
                <Skeleton height={14} width="70%" style={{ marginBottom: space.sm }} />
                <Skeleton height={12} width="90%" />
              </GlassCard>
            ))}
          </View>
        ) : notifs.length === 0 ? (
          <EmptyState
            icon={<Bell size={48} color={colors.text.secondary} />}
            title="No notifications"
            subtitle="You're all caught up!"
          />
        ) : (
          <View style={styles.list}>
            {notifs.map(n => (
              <GlassCard key={n.id} elevation={1}>
                <View style={{ flexDirection: 'row', gap: space.md }}>
                  <View style={styles.cardIcon}>
                    <MessageCircle size={18} color={colors.accent.purple} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyBold, { color: colors.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                      {n.subject}
                    </Text>
                    <Text style={[typography.caption, { color: colors.text.secondary, marginTop: space.xs }]}>
                      {n.message}
                    </Text>
                    <Text style={[typography.label, { color: colors.text.secondary, marginTop: 6 }]}>
                      {n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { paddingBottom: 100 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: space.lg,
    paddingHorizontal: space['2xl'], paddingTop: space.xl, paddingBottom: space.xl,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
  },
  list: { paddingHorizontal: space['2xl'], gap: space.sm },
  cardIcon: {
    width: 40, height: 40, borderRadius: radius.lg,
    backgroundColor: 'rgba(139,92,246,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
});
