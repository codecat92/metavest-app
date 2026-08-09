import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, TrendingUp, TrendingDown,
  Clock, Copy, Tag, Gem, Pencil, Trash2,
} from 'lucide-react-native';
import { signalsApi, Signal, formatPrice } from '@/api/signals';
import { useColors, space, radius, typography } from '@/theme';
import { GlassCard, Badge, Skeleton, EmptyState } from '@/components';
import { useCustomAlert } from '@/context/AlertContext';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'MySignals'>;

export default function MySignalsScreen({ navigation }: Props) {
  const c = useColors();
  const { showAlert } = useCustomAlert();

  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSignals = useCallback(async () => {
    try {
      const res = await signalsApi.getOwn();
      setSignals(res.data ?? []);
    } catch (e: any) {
      showAlert({ title: 'Error', message: e?.message ?? 'Failed to load signals' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showAlert]);

  useFocusEffect(useCallback(() => { setLoading(true); loadSignals(); }, [loadSignals]));

  const handleDelete = useCallback((signal: Signal) => {
    Alert.alert('Delete Signal', `Delete ${signal.currency_name} ${signal.signal_type_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await signalsApi.delete(signal.id);
            setSignals(prev => prev.filter(s => s.id !== signal.id));
            showAlert({ title: 'Deleted', message: 'Signal deleted.', type: 'success' });
          } catch (e: any) {
            showAlert({ title: 'Error', message: e?.message ?? 'Failed to delete' });
          }
        },
      },
    ]);
  }, [showAlert]);

  const renderItem = useCallback(({ item }: { item: Signal }) => {
    const buy = item.signal_type === 2 || item.signal_type === 4 || item.signal_type === 6;
    return (
      <GlassCard elevation={2} noPadding>
        <View style={{ padding: space.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md }}>
            <Badge label={buy ? 'BUY' : 'SELL'} variant={buy ? 'success' : 'danger'} />
            <Text style={[typography.bodyBold, { color: c.text.primary, fontFamily: 'DMSans-SemiBold', flex: 1 }]}>
              {item.currency_name} — {item.signal_type_name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              {item.price_value > 0 ? (
                <><Gem size={12} color={c.accent.gold} /><Text style={[typography.label, { color: c.accent.gold }]}>PAID</Text></>
              ) : (
                <><Tag size={12} color={c.semantic.positive} /><Text style={[typography.label, { color: c.semantic.positive }]}>FREE</Text></>
              )}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: space.lg }}>
            <View><Text style={[typography.label, { color: c.text.secondary }]}>Entry</Text><Text style={[typography.bodyBold, { color: c.text.primary }]}>{formatPrice(item.open_price, item.currency)}</Text></View>
            <View><Text style={[typography.label, { color: c.text.secondary }]}>TP</Text><Text style={[typography.bodyBold, { color: c.semantic.positive }]}>{formatPrice(item.take_profit, item.currency)}</Text></View>
            <View><Text style={[typography.label, { color: c.text.secondary }]}>SL</Text><Text style={[typography.bodyBold, { color: c.semantic.negative }]}>{formatPrice(item.stop_loss, item.currency)}</Text></View>
          </View>

          <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Clock size={11} color={c.text.muted} />
              <Text style={[typography.label, { color: c.text.muted }]}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Copy size={11} color={c.text.muted} />
              <Text style={[typography.label, { color: c.text.muted }]}>{item.signal_execution || 0} copied</Text>
            </View>
          </View>
        </View>

        <View style={[styles.actionRow, { borderTopColor: c.glass.border }]}>
          <TouchableOpacity onPress={() => navigation.navigate('CreateSignal', { signalId: item.id })} style={[styles.actionBtn, { borderRightColor: c.glass.border }]}>
            <Pencil size={14} color={c.text.secondary} />
            <Text style={[typography.label, { color: c.text.secondary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
            <Trash2 size={14} color={c.semantic.negative} />
            <Text style={[typography.label, { color: c.semantic.negative }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    );
  }, [c, navigation, handleDelete]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: c.glass.g1, borderColor: c.glass.border }]}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: space['2xl'], gap: space.sm }}>
          {[1, 2, 3].map(i => (
            <GlassCard key={i} elevation={2}><Skeleton height={80} /></GlassCard>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: c.glass.g1, borderColor: c.glass.border }]}>
          <ArrowLeft size={20} color={c.text.secondary} />
        </TouchableOpacity>
        <Text style={[typography.h3, { color: c.text.primary, fontFamily: 'Manrope-Bold', marginLeft: space.md }]}>
          My Signals
        </Text>
      </View>

      <FlatList
        data={signals}
        keyExtractor={item => `${item.id}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={<TrendingUp size={48} color={c.text.muted} />}
            title="No signals yet"
            subtitle="You haven't published any trading signals"
            action={{ label: 'Create Your First Signal', onPress: () => navigation.navigate('CreateSignal', {}) }}
          />
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadSignals(); }} tintColor={c.accent.purple} colors={[c.accent.purple]} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space['2xl'], paddingTop: space.xl, paddingBottom: space.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: space['2xl'], paddingBottom: 100, gap: space.sm },
  actionRow: { flexDirection: 'row', borderTopWidth: 1 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: space.md },
});
