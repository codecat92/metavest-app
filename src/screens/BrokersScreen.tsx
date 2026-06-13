import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Linking
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Globe, Shield, ExternalLink } from 'lucide-react-native';
import { brokerApi, Broker } from '../api/brokers';

export default function BrokersScreen({ navigation }: any) {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await brokerApi.getAll();
      setBrokers(res.data ?? []);
    } catch (e) {
      console.log('Brokers failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { setLoading(true); loadData(); }, [loadData])
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#8899AA" />
          </TouchableOpacity>
          <Text style={styles.title}>Brokers</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#AB4BFF" style={{ marginTop: 60 }} />
        ) : (
          <View style={styles.list}>
            {brokers.map(b => (
              <View key={b.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Shield size={24} color="#C9A84C" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.brokerName}>{b.name}</Text>
                    <Text style={styles.brokerInfo}>{b.information}</Text>
                  </View>
                  <View style={[styles.statusBadge, {
                    backgroundColor: b.status === 1 ? 'rgba(47,239,196,0.12)' : 'rgba(255,75,110,0.12)',
                    borderColor: b.status === 1 ? 'rgba(47,239,196,0.3)' : 'rgba(255,75,110,0.3)',
                  }]}>
                    <Text style={[styles.statusText, { color: b.status === 1 ? '#2FEFC4' : '#FF4B6E' }]}>
                      {b.status === 1 ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                <View style={styles.idRow}>
                  <Text style={styles.idLabel}>Broker ID: </Text>
                  <Text style={styles.idValue}>{b.id}</Text>
                </View>
                {b.url ? (
                  <TouchableOpacity onPress={() => Linking.openURL(b.url)} style={styles.urlBtn}>
                    <Globe size={12} color="#AB4BFF" />
                    <Text style={styles.urlText} numberOfLines={1}>{b.url}</Text>
                    <ExternalLink size={10} color="#8899AA" />
                  </TouchableOpacity>
                ) : null}
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
  list: { paddingHorizontal: 24, gap: 12 },
  card: {
    padding: 18, borderRadius: 20,
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.15)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: 'rgba(201,168,76,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  brokerName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  brokerInfo: { fontSize: 12, color: '#8899AA', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  idRow: { flexDirection: 'row', alignItems: 'center' },
  idLabel: { fontSize: 11, color: '#8899AA' },
  idValue: { fontSize: 12, fontWeight: '700', color: '#C9A84C' },
  urlBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: 'rgba(171,75,255,0.08)',
  },
  urlText: { flex: 1, fontSize: 11, color: '#AB4BFF' },
});
