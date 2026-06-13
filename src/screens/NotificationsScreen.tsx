import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Bell, MessageCircle } from 'lucide-react-native';
import { notificationApi, Notification } from '../api/notifications';
import { getToken } from '../api/client';

export default function NotificationsScreen({ navigation }: any) {
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
      <View style={styles.container}>
        <Text style={{ color: '#8899AA', marginTop: 200, textAlign: 'center' }}>Login to see notifications</Text>
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
          <Text style={styles.title}>Notifications</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#AB4BFF" style={{ marginTop: 60 }} />
        ) : notifs.length === 0 ? (
          <View style={styles.empty}>
            <Bell size={48} color="#8899AA" />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySub}>You're all caught up!</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifs.map(n => (
              <View key={n.id} style={styles.card}>
                <View style={styles.cardIcon}>
                  <MessageCircle size={18} color="#AB4BFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardSubject}>{n.subject}</Text>
                  <Text style={styles.cardMessage}>{n.message}</Text>
                  <Text style={styles.cardTime}>
                    {n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1439' },
  scroll: { paddingBottom: 100 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  list: { paddingHorizontal: 24, gap: 10 },
  card: {
    flexDirection: 'row', gap: 14, padding: 16, borderRadius: 18,
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.12)',
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: 16,
    backgroundColor: 'rgba(171,75,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardSubject: { fontSize: 14, fontWeight: '700', color: '#fff' },
  cardMessage: { fontSize: 12, color: '#8899AA', marginTop: 4, lineHeight: 18 },
  cardTime: { fontSize: 11, color: '#8899AA', marginTop: 6 },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#8899AA', marginTop: 16 },
  emptySub: { fontSize: 13, color: '#8899AA', marginTop: 4 },
});
