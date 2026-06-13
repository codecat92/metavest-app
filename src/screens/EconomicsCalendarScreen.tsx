import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Star, Globe } from 'lucide-react-native';
import { api, ApiResponse } from '@/api/client';
import { colors, space, radius, typography } from '@/theme';
import { GlassCard, Badge, EmptyState } from '@/components';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

interface EconEvent {
  date: string;
  time?: string;
  country: string;
  event: string;
  impact?: string;
  actual?: string;
  previous?: string;
  forecast?: string;
}

type EconProps = NativeStackScreenProps<RootStackParamList, 'EconomicsCalendar'>;

export default function EconomicsCalendarScreen({ navigation }: EconProps) {
  const [events, setEvents] = useState<EconEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadEvents = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<EconEvent[]>>('/economics-calendar/all');
      setEvents(res.data ?? []);
    } catch (e) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { setLoading(true); loadEvents(); }, [loadEvents])
  );

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const impactColor: Record<string, string> = {
    High: colors.semantic.negative,
    Medium: colors.semantic.warning,
    Low: colors.semantic.positive,
  };

  const monthEvents = events.filter(e => {
    try { return new Date(e.date).getMonth() === selectedMonth && new Date(e.date).getFullYear() === selectedYear; }
    catch { return false; }
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const grouped: Record<string, EconEvent[]> = {};
  monthEvents.forEach(e => {
    const d = e.date?.split('T')[0] ?? '';
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(e);
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h2, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
            Economic Calendar
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthsRow}>
          {months.map((m, i) => (
            <TouchableOpacity
              key={m}
              onPress={() => setSelectedMonth(i)}
              style={[styles.monthBtn, selectedMonth === i && styles.monthBtnActive]}
            >
              <Text style={[styles.monthText, selectedMonth === i && styles.monthTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[typography.h3, { color: colors.text.primary, paddingHorizontal: space['2xl'], marginBottom: space.xl, fontFamily: 'SpaceGrotesk-Bold' }]}>
          {monthNames[selectedMonth]} {selectedYear}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.accent.purple} style={{ marginTop: 40 }} />
        ) : Object.keys(grouped).length > 0 ? (
          <View style={styles.list}>
            {Object.entries(grouped).map(([date, items]) => {
              const day = new Date(date).getDate();
              const weekday = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
              return (
                <View key={date} style={styles.dayGroup}>
                  <View style={styles.dayHeader}>
                    <View style={styles.dayBadge}>
                      <Text style={[typography.h3, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
                        {day}
                      </Text>
                      <Text style={[typography.label, { color: colors.text.secondary }]}>{weekday}</Text>
                    </View>
                    <View style={styles.dayLine} />
                  </View>
                  {items.map((ev, idx) => (
                    <GlassCard key={idx} elevation={2} style={{ marginBottom: 6 }}>
                      <View style={{ flexDirection: 'row', gap: space.md }}>
                        <View style={{ alignItems: 'center', gap: 6, width: 52 }}>
                          <Text style={[typography.label, { color: colors.text.secondary }]}>
                            {ev.time ?? 'All Day'}
                          </Text>
                          <View style={[styles.impactDot, { backgroundColor: impactColor[ev.impact ?? 'Low'] ?? colors.text.secondary }]} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: space.xs }}>
                            <Globe size={11} color={colors.text.secondary} />
                            <Text style={[typography.label, { color: colors.text.secondary }]}>{ev.country}</Text>
                            {ev.impact && (
                              <Badge
                                label={ev.impact}
                                variant={ev.impact === 'High' ? 'danger' : ev.impact === 'Medium' ? 'warning' : 'success'}
                              />
                            )}
                          </View>
                          <Text style={[typography.captionBold, { color: colors.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                            {ev.event}
                          </Text>
                          {(ev.actual || ev.forecast || ev.previous) && (
                            <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.xs }}>
                              {ev.actual && (
                                <Text style={[typography.label, { color: colors.text.secondary }]}>
                                  Actual: <Text style={{ color: colors.text.primary, fontWeight: '700' }}>{ev.actual}</Text>
                                </Text>
                              )}
                              {ev.forecast && (
                                <Text style={[typography.label, { color: colors.text.secondary }]}>
                                  Forecast: <Text style={{ color: colors.text.primary, fontWeight: '700' }}>{ev.forecast}</Text>
                                </Text>
                              )}
                              {ev.previous && (
                                <Text style={[typography.label, { color: colors.text.secondary }]}>
                                  Previous: <Text style={{ color: colors.text.primary, fontWeight: '700' }}>{ev.previous}</Text>
                                </Text>
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                    </GlassCard>
                  ))}
                </View>
              );
            })}
          </View>
        ) : (
          <EmptyState
            icon={<Calendar size={48} color={colors.text.secondary} />}
            title="No economic events"
            subtitle="Add ECONOMICS_CALENDAR_API_KEY to your .env to enable real data."
          />
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
    paddingHorizontal: space['2xl'], paddingTop: space.xl, paddingBottom: space.lg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
  },

  monthsRow: { paddingHorizontal: space['2xl'], gap: space.sm, marginBottom: space.md },
  monthBtn: {
    paddingHorizontal: 18, paddingVertical: space.sm, borderRadius: radius.md,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
  },
  monthBtnActive: { backgroundColor: colors.accent.purple, borderColor: colors.accent.purple },
  monthText: { fontSize: 13, fontWeight: '700', color: colors.text.secondary, fontFamily: 'DMSans-Bold' },
  monthTextActive: { color: '#fff' },

  list: { paddingHorizontal: space['2xl'], gap: space.sm },
  dayGroup: { marginBottom: space.xs },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.sm },
  dayBadge: {
    width: 48, alignItems: 'center', paddingVertical: 6, borderRadius: radius.md,
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
  dayLine: { flex: 1, height: 1, backgroundColor: colors.glass.border },
  impactDot: { width: 6, height: 6, borderRadius: 3 },
});
