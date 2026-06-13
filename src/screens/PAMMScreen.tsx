import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, TextInput
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft, Building2, Shield, CheckCircle, Plus, ChevronRight
} from 'lucide-react-native';
import { pammApi, PAMMEntry } from '../api/pamm';
import { getToken } from '../api/client';
import { useCustomAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';

export default function PAMMScreen({ navigation }: any) {
  const { user } = useAuth();
  const alert = useCustomAlert();
  const [entries, setEntries] = useState<PAMMEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [brokerId, setBrokerId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const res = await pammApi.getAll();
      setEntries(res.data ?? []);
    } catch (e) {
      console.log('PAMM load failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { setLoading(true); loadData(); }, [loadData])
  );

  const handleAdd = async () => {
    if (!brokerId.trim()) {
      alert.showAlert({ title: 'Error', message: 'Broker ID is required', type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await pammApi.create(brokerId.trim(), user?.name ?? '', 1);
      alert.showAlert({ title: 'Success', message: 'PAMM broker registered', type: 'success' });
      setShowAdd(false);
      setBrokerId('');
      loadData();
    } catch (e: any) {
      alert.showAlert({ title: 'Error', message: e.message || 'Failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!getToken()) {
    return (
      <View style={styles.container}>
        <View style={styles.center}><Text style={styles.centerText}>Login to see PAMM</Text></View>
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
          <Text style={styles.title}>PAMM</Text>
          <TouchableOpacity onPress={() => setShowAdd(!showAdd)} style={styles.addBtn}>
            <Plus size={18} color={showAdd ? '#F7C948' : '#AB4BFF'} />
          </TouchableOpacity>
        </View>

        {/* Add Form */}
        {showAdd && (
          <View style={styles.addCard}>
            <Text style={styles.addTitle}>Register PAMM Broker</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={brokerId}
                onChangeText={setBrokerId}
                placeholder="Enter broker ID"
                placeholderTextColor="#8899AA"
              />
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Brokers')} style={{ marginBottom: 12, marginTop: -4 }}>
              <Text style={{ fontSize: 12, color: '#AB4BFF', fontWeight: '600' }}>View available brokers →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAdd}
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitText}>Register</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#AB4BFF" style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Building2 size={20} color="#AB4BFF" />
                <Text style={styles.statValue}>{entries.length}</Text>
                <Text style={styles.statLabel}>Brokers</Text>
              </View>
              <View style={styles.statCard}>
                <Shield size={20} color="#2FEFC4" />
                <Text style={styles.statValue}>{entries.filter(e => e.status == 1).length}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
            </View>

            {/* PAMM List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Registered Brokers</Text>
              {entries.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No PAMM registrations yet</Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {entries.map((entry) => (
                    <View key={entry.id} style={styles.entryCard}>
                      <View style={styles.entryAvatar}>
                        <Building2 size={20} color="#AB4BFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.entryName}>{entry.broker_name ?? `Broker #${entry.id_broker}`}</Text>
                        <Text style={styles.entryUser}>by {entry.user_name ?? 'Unknown'}</Text>
                      </View>
                      <View style={[styles.statusBadge, {
                        backgroundColor: entry.status == 1 ? 'rgba(47,239,196,0.12)' : 'rgba(255,75,110,0.12)',
                        borderColor: entry.status == 1 ? 'rgba(47,239,196,0.3)' : 'rgba(255,75,110,0.3)',
                      }]}>
                        <CheckCircle size={11} color={entry.status == 1 ? '#2FEFC4' : '#FF4B6E'} />
                        <Text style={[styles.statusText, {
                          color: entry.status == 1 ? '#2FEFC4' : '#FF4B6E',
                        }]}>
                          {entry.status == 1 ? 'Active' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
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

  addCard: {
    marginHorizontal: 24, padding: 20, borderRadius: 20, marginBottom: 20,
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
  },
  addTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 14 },
  inputBox: {
    height: 48, borderRadius: 14, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
    marginBottom: 12,
  },
  input: { flex: 1, color: '#fff', fontSize: 15 },
  submitBtn: {
    height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#AB4BFF',
  },
  submitText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  statsRow: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 24, marginBottom: 24,
  },
  statCard: {
    flex: 1, alignItems: 'center', padding: 16, borderRadius: 18,
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.15)',
    gap: 6,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: '#8899AA', fontWeight: '600' },

  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },

  emptyCard: {
    padding: 32, borderRadius: 20, alignItems: 'center',
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.12)',
  },
  emptyText: { fontSize: 14, color: '#8899AA' },

  list: { gap: 10 },
  entryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    borderRadius: 18, backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.12)',
  },
  entryAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(171,75,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  entryName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  entryUser: { fontSize: 12, color: '#8899AA', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
});
