import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Calendar, Star, TrendingUp, DollarSign, Globe } from 'lucide-react-native';
import { api, ApiResponse } from '../api/client';

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

export default function EconomicsCalendarScreen({ navigation }: any) {
  const [events, setEvents] = useState<EconEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadEvents = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<EconEvent[]>>('/economics-calendar/all');
      setEvents(res.data ?? []);
    } catch (e) {
      // API key missing — fallback to empty
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
    High: '#FF4B6E', Medium: '#F7C948', Low: '#2FEFC4',
  };

  const impactBg: Record<string, string> = {
    High: 'rgba(255,75,110,0.15)', Medium: 'rgba(247,201,72,0.15)', Low: 'rgba(47,239,196,0.15)',
  };

  // Filter events for selected month
  const monthEvents = events.filter(e => {
    try { return new Date(e.date).getMonth() === selectedMonth && new Date(e.date).getFullYear() === selectedYear; }
    catch { return false; }
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Group by date
  const grouped: Record<string, EconEvent[]> = {};
  monthEvents.forEach(e => {
    const d = e.date?.split('T')[0] ?? '';
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(e);
  });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#8899AA" />
          </TouchableOpacity>
          <Text style={styles.title}>Economic Calendar</Text>
        </View>

        {/* Month Selector */}
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

        <Text style={styles.monthTitle}>{monthNames[selectedMonth]} {selectedYear}</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#AB4BFF" style={{ marginTop: 40 }} />
        ) : Object.keys(grouped).length > 0 ? (
          <View style={styles.list}>
            {Object.entries(grouped).map(([date, items]) => {
              const day = new Date(date).getDate();
              const weekday = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
              return (
                <View key={date} style={styles.dayGroup}>
                  <View style={styles.dayHeader}>
                    <View style={styles.dayBadge}>
                      <Text style={styles.dayNum}>{day}</Text>
                      <Text style={styles.dayWeek}>{weekday}</Text>
                    </View>
                    <View style={styles.dayLine} />
                  </View>
                  {items.map((ev, idx) => (
                    <View key={idx} style={styles.eventCard}>
                      <View style={styles.eventLeft}>
                        <Text style={styles.eventTime}>{ev.time ?? 'All Day'}</Text>
                        <View style={[styles.impactDot, { backgroundColor: impactColor[ev.impact ?? 'Low'] ?? '#8899AA' }]} />
                      </View>
                      <View style={styles.eventContent}>
                        <View style={styles.eventHeader}>
                          <Globe size={11} color="#8899AA" />
                          <Text style={styles.eventCountry}>{ev.country}</Text>
                          {ev.impact && (
                            <View style={[styles.impactBadge, { backgroundColor: impactBg[ev.impact] ?? 'rgba(255,255,255,0.05)' }]}>
                              <Star size={9} color={impactColor[ev.impact] ?? '#8899AA'} />
                              <Text style={[styles.impactText, { color: impactColor[ev.impact] ?? '#8899AA' }]}>
                                {ev.impact}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.eventName}>{ev.event}</Text>
                        {(ev.actual || ev.forecast || ev.previous) && (
                          <View style={styles.eventValues}>
                            {ev.actual && <Text style={styles.eventVal}>Actual: <Text style={{ color: '#fff', fontWeight: '700' }}>{ev.actual}</Text></Text>}
                            {ev.forecast && <Text style={styles.eventVal}>Forecast: <Text style={{ color: '#fff', fontWeight: '700' }}>{ev.forecast}</Text></Text>}
                            {ev.previous && <Text style={styles.eventVal}>Previous: <Text style={{ color: '#fff', fontWeight: '700' }}>{ev.previous}</Text></Text>}
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.empty}>
            <Calendar size={48} color="#8899AA" />
            <Text style={styles.emptyTitle}>No economic events</Text>
            <Text style={styles.emptySub}>
              Add ECONOMICS_CALENDAR_API_KEY to your .env to enable real data from Financial Modeling Prep.
            </Text>
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
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },

  monthsRow: { paddingHorizontal: 24, gap: 8, marginBottom: 12 },
  monthBtn: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.15)',
  },
  monthBtnActive: { backgroundColor: '#AB4BFF', borderColor: '#AB4BFF' },
  monthText: { fontSize: 13, fontWeight: '700', color: '#8899AA' },
  monthTextActive: { color: '#fff' },

  monthTitle: {
    fontSize: 20, fontWeight: '800', color: '#fff',
    paddingHorizontal: 24, marginBottom: 20,
  },

  list: { paddingHorizontal: 24, gap: 8 },
  dayGroup: { marginBottom: 4 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  dayBadge: {
    width: 48, alignItems: 'center', paddingVertical: 6, borderRadius: 12,
    backgroundColor: 'rgba(171,75,255,0.12)',
  },
  dayNum: { fontSize: 18, fontWeight: '800', color: '#fff' },
  dayWeek: { fontSize: 9, color: '#8899AA', fontWeight: '700', marginTop: 1 },
  dayLine: { flex: 1, height: 1, backgroundColor: 'rgba(171,75,255,0.1)' },

  eventCard: {
    flexDirection: 'row', gap: 12, padding: 14, borderRadius: 16, marginBottom: 6,
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.1)',
  },
  eventLeft: { alignItems: 'center', gap: 6, width: 52 },
  eventTime: { fontSize: 10, fontWeight: '700', color: '#8899AA' },
  impactDot: { width: 6, height: 6, borderRadius: 3 },
  eventContent: { flex: 1, gap: 4 },
  eventHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  eventCountry: { fontSize: 10, fontWeight: '700', color: '#8899AA' },
  impactBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  impactText: { fontSize: 9, fontWeight: '700' },
  eventName: { fontSize: 13, fontWeight: '600', color: '#fff', lineHeight: 18 },
  eventValues: { flexDirection: 'row', gap: 12, marginTop: 4 },
  eventVal: { fontSize: 11, color: '#8899AA' },

  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#8899AA', marginTop: 16 },
  emptySub: { fontSize: 13, color: '#8899AA', textAlign: 'center', lineHeight: 20, marginTop: 8 },
});
