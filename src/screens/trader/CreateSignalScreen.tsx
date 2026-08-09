import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, ActivityIndicator, Keyboard,
} from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';
import { signalsApi, Signal, CreateSignalRequest, PIP_DECIMALS, formatPrice } from '@/api/signals';
import { useColors, space, radius, typography } from '@/theme';
import { GlassCard, AppButton } from '@/components';
import { useCustomAlert } from '@/context/AlertContext';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateSignal'>;

const CURRENCIES = [
  { id: 1, name: 'EUR/USD' },
  { id: 2, name: 'XAU/USD' },
  { id: 3, name: 'GBP/USD' },
  { id: 4, name: 'USD/JPY' },
  { id: 5, name: 'AUD/USD' },
  { id: 6, name: 'USD/CAD' },
  { id: 7, name: 'XAG/USD' },
  { id: 8, name: 'GBP/JPY' },
  { id: 9, name: 'NZD/USD' },
  { id: 10, name: 'USD/CHF' },
  { id: 11, name: 'EUR/GBP' },
];

const SIGNAL_TYPES = [
  { id: 1, name: 'SELL LIMIT', isSell: true },
  { id: 2, name: 'BUY LIMIT', isSell: false },
  { id: 3, name: 'SELL ORDER', isSell: true },
  { id: 4, name: 'BUY ORDER', isSell: false },
  { id: 5, name: 'SELL STOP', isSell: true },
  { id: 6, name: 'BUY STOP', isSell: false },
];

export default function CreateSignalScreen({ route, navigation }: Props) {
  const editId = route.params?.signalId;
  const c = useColors();
  const { showAlert } = useCustomAlert();
  const insets = useSafeAreaInsets();

  const [currency, setCurrency] = useState<number | null>(null);
  const [signalType, setSignalType] = useState<number | null>(null);
  const [price, setPrice] = useState(1);
  const [priceValue, setPriceValue] = useState('');
  const [openPrice, setOpenPrice] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [riskPerTrade, setRiskPerTrade] = useState('');
  const [potentialProfit, setPotentialProfit] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const currencyName = CURRENCIES.find(x => x.id === currency)?.name;
  const typeName = SIGNAL_TYPES.find(x => x.id === signalType)?.name;
  const isSell = SIGNAL_TYPES.find(x => x.id === signalType)?.isSell ?? false;
  const pairDecimals = currency ? (PIP_DECIMALS[currency] ?? 5) : 5;
  const priceHint = (val: string) => val ? `→ ${formatPrice(val, currency ?? 1)}` : '';

  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {};
    if (!currency) e.currency = 'Please select a trading pair';
    if (!signalType) e.signalType = 'Please select an order type';
    if (price === 2 && !priceValue) e.priceValue = 'Please enter a price';
    if (!openPrice) e.openPrice = 'Entry price is required';
    if (!takeProfit) e.takeProfit = 'Take profit is required';
    if (!stopLoss) e.stopLoss = 'Stop loss is required';
    if (!riskPerTrade) e.riskPerTrade = 'Risk per trade is required';
    if (!potentialProfit) e.potentialProfit = 'Potential profit is required';

    const op = parseFloat(openPrice);
    const tp = parseFloat(takeProfit);
    const sl = parseFloat(stopLoss);

    if (!isNaN(op) && !isNaN(tp)) {
      if (!isSell && tp <= op) e.takeProfit = 'TP must be higher than entry for BUY orders';
      if (isSell && tp >= op) e.takeProfit = 'TP must be lower than entry for SELL orders';
    }
    if (!isNaN(op) && !isNaN(sl)) {
      if (!isSell && sl >= op) e.stopLoss = 'SL must be lower than entry for BUY orders';
      if (isSell && sl <= op) e.stopLoss = 'SL must be higher than entry for SELL orders';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [currency, signalType, price, priceValue, openPrice, takeProfit, stopLoss, riskPerTrade, potentialProfit, isSell]);

  const handleSubmit = useCallback(async () => {
    Keyboard.dismiss();
    if (!validate()) {
      const msgs = Object.values(errors);
      if (msgs.length > 0) showAlert({ title: 'Validation Error', message: msgs[0] });
      return;
    }
    setSubmitting(true);
    try {
      const data: CreateSignalRequest = {
        currency: currency!,
        signal_type: signalType!,
        price,
        price_value: price === 2 ? parseInt(priceValue || '0') : 0,
        open_price: openPrice,
        take_profit: takeProfit,
        stop_loss: stopLoss,
        risk_per_one_trade: riskPerTrade,
        potential_profit: potentialProfit,
        notes: notes || null,
      };

      if (editId) {
        await signalsApi.update({ id: editId, ...data });
        showAlert({ title: 'Updated', message: 'Signal updated successfully!', type: 'success' });
      } else {
        await signalsApi.create(data);
        showAlert({ title: 'Created', message: 'Signal published successfully!', type: 'success' });
      }
      navigation.goBack();
    } catch (e: any) {
      showAlert({ title: 'Error', message: e?.message ?? 'Failed to submit signal' });
    } finally {
      setSubmitting(false);
    }
  }, [validate, errors, currency, signalType, price, priceValue, openPrice, takeProfit, stopLoss, riskPerTrade, potentialProfit, notes, editId, showAlert, navigation]);

  const fieldStyle = useMemo(() => ({
    color: c.text.primary,
    backgroundColor: c.glass.g1,
    borderColor: c.glass.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: space.lg,
    fontSize: 15,
    fontFamily: 'DMSans',
  }), [c]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: c.glass.g1, borderColor: c.glass.border }]}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h3, { color: c.text.primary, fontFamily: 'Manrope-Bold', marginLeft: space.md }]}>
            {editId ? 'Edit Signal' : 'Create Signal'}
          </Text>
        </View>

        <View style={{ paddingHorizontal: space['2xl'], gap: space.xl }}>
          {/* ── Currency ── */}
          <View>
            <Text style={[typography.captionBold, { color: c.text.secondary, marginBottom: space.sm, fontFamily: 'DMSans-SemiBold' }]}>TRADING PAIR</Text>
            <TouchableOpacity onPress={() => { setShowCurrencyPicker(!showCurrencyPicker); setShowTypePicker(false); }} style={[styles.picker, { backgroundColor: c.glass.g1, borderColor: errors.currency ? c.semantic.negative : c.glass.border }]}>
              <Text style={[typography.body, { color: currencyName ? c.text.primary : c.text.muted }]}>{currencyName ?? 'Tap to select'}</Text>
              <ChevronDown size={16} color={c.text.muted} />
            </TouchableOpacity>
            {errors.currency && <Text style={[typography.label, { color: c.semantic.negative, marginTop: 4 }]}>{errors.currency}</Text>}
            {showCurrencyPicker && (
              <View style={[styles.pickerDropdown, { backgroundColor: c.glass.g2, borderColor: c.glass.border }]}>
                {CURRENCIES.map(cur => (
                  <TouchableOpacity key={cur.id} onPress={() => { setCurrency(cur.id); setShowCurrencyPicker(false); }} style={[styles.pickerItem, cur.id === currency && { backgroundColor: `${c.accent.purple}22` }]}>
                    <Text style={[typography.body, { color: cur.id === currency ? c.accent.purple : c.text.primary }]}>{cur.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ── Signal Type ── */}
          <View>
            <Text style={[typography.captionBold, { color: c.text.secondary, marginBottom: space.sm, fontFamily: 'DMSans-SemiBold' }]}>ORDER TYPE</Text>
            <TouchableOpacity onPress={() => { setShowTypePicker(!showTypePicker); setShowCurrencyPicker(false); }} style={[styles.picker, { backgroundColor: c.glass.g1, borderColor: errors.signalType ? c.semantic.negative : c.glass.border }]}>
              <Text style={[typography.body, { color: typeName ? c.text.primary : c.text.muted }]}>{typeName ?? 'Tap to select'}</Text>
              <ChevronDown size={16} color={c.text.muted} />
            </TouchableOpacity>
            {errors.signalType && <Text style={[typography.label, { color: c.semantic.negative, marginTop: 4 }]}>{errors.signalType}</Text>}
            {showTypePicker && (
              <View style={[styles.pickerDropdown, { backgroundColor: c.glass.g2, borderColor: c.glass.border }]}>
                {SIGNAL_TYPES.map(t => (
                  <TouchableOpacity key={t.id} onPress={() => { setSignalType(t.id); setShowTypePicker(false); }} style={[styles.pickerItem, t.id === signalType && { backgroundColor: `${c.accent.purple}22` }]}>
                    <Text style={[typography.body, { color: t.id === signalType ? c.accent.purple : c.text.primary }]}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ── Price Type ── */}
          <View>
            <Text style={[typography.captionBold, { color: c.text.secondary, marginBottom: space.sm, fontFamily: 'DMSans-SemiBold' }]}>SIGNAL PRICE</Text>
            <View style={styles.segmentedRow}>
              <TouchableOpacity onPress={() => setPrice(1)} style={[styles.segBtn, price === 1 && { backgroundColor: c.semantic.positive, borderColor: c.semantic.positive }, price !== 1 && { backgroundColor: c.glass.g1, borderColor: c.glass.border }]}>
                <Text style={[typography.captionBold, { color: price === 1 ? '#fff' : c.text.secondary }]}>FREE</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPrice(2)} style={[styles.segBtn, price === 2 && { backgroundColor: c.accent.gold, borderColor: c.accent.gold }, price !== 2 && { backgroundColor: c.glass.g1, borderColor: c.glass.border }]}>
                <Text style={[typography.captionBold, { color: price === 2 ? '#1A1A2E' : c.text.secondary }]}>PAID</Text>
              </TouchableOpacity>
            </View>
            {price === 2 && (
              <View style={{ marginTop: space.sm }}>
                <TextInput
                  style={[fieldStyle, { borderColor: errors.priceValue ? c.semantic.negative : c.glass.border }]}
                  placeholder="Price value"
                  placeholderTextColor={c.text.muted}
                  keyboardType="numeric"
                  value={priceValue}
                  onChangeText={setPriceValue}
                />
                {errors.priceValue && <Text style={[typography.label, { color: c.semantic.negative, marginTop: 4 }]}>{errors.priceValue}</Text>}
              </View>
            )}
          </View>

          {/* ── Entry Price ── */}
          <View>
            <Text style={[typography.captionBold, { color: c.text.secondary, marginBottom: space.sm, fontFamily: 'DMSans-SemiBold' }]}>ENTRY PRICE</Text>
            <TextInput style={[fieldStyle, { borderColor: errors.openPrice ? c.semantic.negative : c.glass.border }]} placeholder={`Input raw: 115600`} placeholderTextColor={c.text.muted} keyboardType="numeric" value={openPrice} onChangeText={setOpenPrice} />
            {openPrice ? <Text style={[typography.label, { color: c.accent.gold, marginTop: 4 }]}>{priceHint(openPrice)}</Text> : <Text style={[typography.label, { color: c.text.muted, marginTop: 4 }]}>Input tanpa koma, auto-format: 115600 → 1.15600</Text>}
            {errors.openPrice && <Text style={[typography.label, { color: c.semantic.negative, marginTop: 4 }]}>{errors.openPrice}</Text>}
          </View>

          {/* ── TP / SL ── */}
          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.captionBold, { color: c.text.secondary, marginBottom: space.sm, fontFamily: 'DMSans-SemiBold' }]}>TAKE PROFIT</Text>
              <TextInput style={[fieldStyle, { borderColor: errors.takeProfit ? c.semantic.negative : c.glass.border }]} placeholder="Input raw" placeholderTextColor={c.text.muted} keyboardType="numeric" value={takeProfit} onChangeText={setTakeProfit} />
              {takeProfit ? <Text style={[typography.label, { color: c.semantic.positive, marginTop: 4 }]}>{priceHint(takeProfit)}</Text> : null}
              {errors.takeProfit && <Text style={[typography.label, { color: c.semantic.negative, marginTop: 4 }]}>{errors.takeProfit}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.captionBold, { color: c.text.secondary, marginBottom: space.sm, fontFamily: 'DMSans-SemiBold' }]}>STOP LOSS</Text>
              <TextInput style={[fieldStyle, { borderColor: errors.stopLoss ? c.semantic.negative : c.glass.border }]} placeholder="Input raw" placeholderTextColor={c.text.muted} keyboardType="numeric" value={stopLoss} onChangeText={setStopLoss} />
              {stopLoss ? <Text style={[typography.label, { color: c.semantic.negative, marginTop: 4 }]}>{priceHint(stopLoss)}</Text> : null}
              {errors.stopLoss && <Text style={[typography.label, { color: c.semantic.negative, marginTop: 4 }]}>{errors.stopLoss}</Text>}
            </View>
          </View>

          {/* ── Risk / Profit ── */}
          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.captionBold, { color: c.text.secondary, marginBottom: space.sm, fontFamily: 'DMSans-SemiBold' }]}>RISK (PTS)</Text>
              <TextInput style={[fieldStyle, { borderColor: errors.riskPerTrade ? c.semantic.negative : c.glass.border }]} placeholder="0.00" placeholderTextColor={c.text.muted} keyboardType="decimal-pad" value={riskPerTrade} onChangeText={setRiskPerTrade} />
              {errors.riskPerTrade && <Text style={[typography.label, { color: c.semantic.negative, marginTop: 4 }]}>{errors.riskPerTrade}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.captionBold, { color: c.text.secondary, marginBottom: space.sm, fontFamily: 'DMSans-SemiBold' }]}>POT. PROFIT</Text>
              <TextInput style={[fieldStyle, { borderColor: errors.potentialProfit ? c.semantic.negative : c.glass.border }]} placeholder="0.00" placeholderTextColor={c.text.muted} keyboardType="decimal-pad" value={potentialProfit} onChangeText={setPotentialProfit} />
              {errors.potentialProfit && <Text style={[typography.label, { color: c.semantic.negative, marginTop: 4 }]}>{errors.potentialProfit}</Text>}
            </View>
          </View>

          {/* ── Notes ── */}
          <View>
            <Text style={[typography.captionBold, { color: c.text.secondary, marginBottom: space.sm, fontFamily: 'DMSans-SemiBold' }]}>TRADER NOTES</Text>
            <TextInput style={[fieldStyle, { minHeight: 100 }]} placeholder="Analysis and reasoning..." placeholderTextColor={c.text.muted} multiline numberOfLines={4} value={notes} onChangeText={setNotes} textAlignVertical="top" />
            <Text style={[typography.label, { color: notes.length > 500 ? c.semantic.negative : c.text.muted, marginTop: 4, textAlign: 'right' }]}>{notes.length}/500</Text>
          </View>

          {/* ── Submit ── */}
          <View style={{ paddingBottom: space.lg }}>
            {submitting ? (
              <View style={[styles.submitLoading, { backgroundColor: c.accent.purple }]}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <AppButton title={editId ? 'Update Signal' : 'Submit Signal'} variant="primary" size="lg" onPress={handleSubmit} style={{ flex: 1 }} />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space['2xl'], paddingTop: space.xl, paddingBottom: space.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: radius.md, borderWidth: 1, padding: space.lg },
  pickerDropdown: { borderRadius: radius.md, borderWidth: 1, marginTop: space.xs, overflow: 'hidden' },
  pickerItem: { paddingVertical: space.md, paddingHorizontal: space.lg },
  segmentedRow: { flexDirection: 'row', gap: space.sm },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: space.md, borderRadius: radius.md, borderWidth: 1 },
  twoCol: { flexDirection: 'row', gap: space.md },
  submitLoading: { height: 56, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
});
