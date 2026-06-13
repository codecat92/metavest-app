import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, TextInput
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Building2, Shield, CheckCircle, Plus
} from 'lucide-react-native';
import { pammApi, PAMMEntry } from '@/api/pamm';
import { getToken } from '@/api/client';
import { useCustomAlert } from '@/context/AlertContext';
import { useAuth } from '@/context/AuthContext';
import { colors, space, radius, typography } from '@/theme';
import { GlassCard, AppButton, AppInput, EmptyState, Badge, Skeleton } from '@/components';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type PAMMProps = NativeStackScreenProps<RootStackParamList, 'PAMM'>;

export default function PAMMScreen({ navigation }: PAMMProps) {
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
      <SafeAreaView style={styles.container} edges={['top']}>
        <EmptyState icon={<Shield size={40} color={colors.text.secondary} />} title="Login to see PAMM" />
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
          <Text style={[typography.h2, { color: colors.text.primary, flex: 1, marginLeft: space.lg, fontFamily: 'SpaceGrotesk-Bold' }]}>
            PAMM
          </Text>
          <TouchableOpacity onPress={() => setShowAdd(!showAdd)} style={styles.addBtn}>
            <Plus size={18} color={showAdd ? colors.accent.gold : colors.accent.purple} />
          </TouchableOpacity>
        </View>

        {showAdd && (
          <GlassCard elevation={2} style={{ marginHorizontal: space['2xl'], marginBottom: space.xl }}>
            <Text style={[typography.h4, { color: colors.text.primary, marginBottom: space.md, fontFamily: 'SpaceGrotesk-Bold' }]}>
              Register PAMM Broker
            </Text>
            <AppInput
              value={brokerId}
              onChangeText={setBrokerId}
              placeholder="Enter broker ID"
            />
            <TouchableOpacity onPress={() => navigation.navigate('Brokers')} style={{ marginBottom: space.md, marginTop: -space.sm }}>
              <Text style={[typography.caption, { color: colors.accent.purple, fontWeight: '600' }]}>
                View available brokers
              </Text>
            </TouchableOpacity>
            <AppButton title="Register" onPress={handleAdd} loading={submitting} />
          </GlassCard>
        )}

        {loading ? (
          <View style={{ paddingHorizontal: space['2xl'], gap: space.md }}>
            <Skeleton height={80} borderRadius={radius.lg} />
            <Skeleton height={80} borderRadius={radius.lg} />
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <GlassCard elevation={2} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                <Building2 size={20} color={colors.accent.purple} />
                <Text style={[typography.h2, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
                  {entries.length}
                </Text>
                <Text style={[typography.label, { color: colors.text.secondary }]}>Brokers</Text>
              </GlassCard>
              <GlassCard elevation={2} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                <Shield size={20} color={colors.semantic.positive} />
                <Text style={[typography.h2, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
                  {entries.filter(e => e.status == 1).length}
                </Text>
                <Text style={[typography.label, { color: colors.text.secondary }]}>Active</Text>
              </GlassCard>
            </View>

            <View style={styles.section}>
              <Text style={[typography.h4, { color: colors.text.primary, marginBottom: space.md, fontFamily: 'SpaceGrotesk-Bold' }]}>
                Registered Brokers
              </Text>
              {entries.length === 0 ? (
                <EmptyState
                  icon={<Building2 size={40} color={colors.text.secondary} />}
                  title="No PAMM registrations yet"
                />
              ) : (
                <View style={{ gap: space.sm }}>
                  {entries.map((entry) => (
                    <GlassCard key={entry.id} elevation={2}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                        <View style={styles.entryAvatar}>
                          <Building2 size={20} color={colors.accent.purple} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[typography.bodyBold, { color: colors.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                            {entry.broker_name ?? `Broker #${entry.id_broker}`}
                          </Text>
                          <Text style={[typography.caption, { color: colors.text.secondary }]}>
                            by {entry.user_name ?? 'Unknown'}
                          </Text>
                        </View>
                        <Badge
                          label={entry.status == 1 ? 'Active' : 'Pending'}
                          variant={entry.status == 1 ? 'success' : 'warning'}
                          icon={<CheckCircle size={11} color={entry.status == 1 ? colors.semantic.positive : colors.semantic.warning} />}
                        />
                      </View>
                    </GlassCard>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { paddingBottom: 100 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: space['2xl'], paddingTop: space.xl, paddingBottom: space.xl,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },

  statsRow: {
    flexDirection: 'row', gap: space.md, paddingHorizontal: space['2xl'], marginBottom: space['2xl'],
  },

  section: { paddingHorizontal: space['2xl'], marginBottom: space['2xl'] },

  entryAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(139,92,246,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
});
