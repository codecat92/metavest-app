import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Linking
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Globe, Shield, ExternalLink } from 'lucide-react-native';
import { brokerApi, Broker } from '@/api/brokers';
import { colors, space, radius, typography } from '@/theme';
import { GlassCard, Badge, Skeleton, EmptyState } from '@/components';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type BrokersProps = NativeStackScreenProps<RootStackParamList, 'Brokers'>;

export default function BrokersScreen({ navigation }: BrokersProps) {
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h2, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
            Brokers
          </Text>
        </View>

        {loading ? (
          <View style={{ paddingHorizontal: space['2xl'], gap: space.md }}>
            {[1, 2, 3].map(i => (
              <GlassCard key={i} elevation={2}>
                <Skeleton height={48} width={48} borderRadius={16} style={{ marginBottom: space.md }} />
                <Skeleton height={16} width="60%" style={{ marginBottom: space.sm }} />
                <Skeleton height={12} width="40%" />
              </GlassCard>
            ))}
          </View>
        ) : (
          <View style={styles.list}>
            {brokers.map(b => (
              <GlassCard key={b.id} elevation={2}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Shield size={24} color={colors.accent.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyBold, { color: colors.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                      {b.name}
                    </Text>
                    <Text style={[typography.caption, { color: colors.text.secondary }]}>
                      {b.information}
                    </Text>
                  </View>
                  <Badge
                    label={b.status === 1 ? 'Active' : 'Inactive'}
                    variant={b.status === 1 ? 'success' : 'danger'}
                  />
                </View>
                <View style={styles.idRow}>
                  <Text style={[typography.label, { color: colors.text.secondary }]}>Broker ID: </Text>
                  <Text style={[typography.caption, { color: colors.accent.gold, fontWeight: '700', fontFamily: 'DMSans-Bold' }]}>
                    {b.id}
                  </Text>
                </View>
                {b.url ? (
                  <TouchableOpacity onPress={() => Linking.openURL(b.url)} style={styles.urlBtn}>
                    <Globe size={12} color={colors.accent.purple} />
                    <Text style={[typography.label, { flex: 1, color: colors.accent.purple }]} numberOfLines={1}>
                      {b.url}
                    </Text>
                    <ExternalLink size={10} color={colors.text.secondary} />
                  </TouchableOpacity>
                ) : null}
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
  list: { paddingHorizontal: space['2xl'], gap: space.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md },
  avatar: {
    width: 48, height: 48, borderRadius: radius.lg,
    backgroundColor: 'rgba(212,175,55,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  idRow: { flexDirection: 'row', alignItems: 'center' },
  urlBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.sm,
    paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.sm,
    backgroundColor: 'rgba(139,92,246,0.08)',
  },
});
