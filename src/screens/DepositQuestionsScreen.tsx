import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { api } from '@/api/client';
import { colors, useColors, space, radius, typography } from '@/theme';
import { AppButton, AppInput, GlassCard } from '@/components';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'DepositQuestions'>;

export default function DepositQuestionsScreen({ navigation, route }: Props) {
  const c = useColors();
  const { brokerId, employment_status, annual_salary, savings_investments_approx_value } = route.params;

  const [baseCurrency, setBaseCurrency] = useState<number | null>(null);
  const [expectedInvestment, setExpectedInvestment] = useState('');
  const [accountType, setAccountType] = useState<number | null>(null);
  const [accountLeverage, setAccountLeverage] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [investError, setInvestError] = useState('');
  const [currencyError, setCurrencyError] = useState('');
  const [typeError, setTypeError] = useState('');
  const [leverageError, setLeverageError] = useState('');

  const validate = (): boolean => {
    let valid = true;
    if (baseCurrency === null) { setCurrencyError('Pilih mata uang'); valid = false; } else { setCurrencyError(''); }
    if (!expectedInvestment.trim()) { setInvestError('Wajib diisi'); valid = false; } else { setInvestError(''); }
    if (accountType === null) { setTypeError('Pilih tipe akun'); valid = false; } else { setTypeError(''); }
    if (accountLeverage === null) { setLeverageError('Pilih leverage'); valid = false; } else { setLeverageError(''); }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const body = {
        employment_status,
        annual_salary,
        savings_investments_approx_value,
        base_currency: baseCurrency,
        expected_init_investment: expectedInvestment.trim(),
        account_type: accountType,
        account_leverage: accountLeverage,
        trading_funds_src: 'Savings & Investments',
      };

      await api.post('/additional-profile/update', body);

      Alert.alert('Berhasil', 'Pendaftaran PAMM berhasil dikirim, menunggu verifikasi admin', [
        { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] }) },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Gagal mengirim data');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h2, { color: c.text.primary, flex: 1, marginLeft: space.lg, fontFamily: 'Manrope-Bold' }]}>
            Deposit Questions
          </Text>
        </View>

        <View style={styles.form}>
          <GlassCard elevation={2}>
            <Text style={[typography.bodyBold, { color: c.text.primary, marginBottom: space.sm, fontFamily: 'Manrope-SemiBold' }]}>
              Base Currency
            </Text>
            <View style={styles.segmentRow}>
              <TouchableOpacity
                style={[styles.segmentBtn, { borderColor: colors.accent.purple }, baseCurrency === 1 && { backgroundColor: colors.accent.purple }]}
                onPress={() => { setBaseCurrency(1); setCurrencyError(''); }}
                activeOpacity={0.7}
              >
                <Text style={[typography.bodyBold, { color: baseCurrency === 1 ? '#fff' : c.text.primary, fontFamily: 'DMSans-SemiBold' }]}>USD</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, { borderColor: colors.accent.purple }, baseCurrency === 2 && { backgroundColor: colors.accent.purple }]}
                onPress={() => { setBaseCurrency(2); setCurrencyError(''); }}
                activeOpacity={0.7}
              >
                <Text style={[typography.bodyBold, { color: baseCurrency === 2 ? '#fff' : c.text.primary, fontFamily: 'DMSans-SemiBold' }]}>AUD</Text>
              </TouchableOpacity>
            </View>
            {currencyError ? <Text style={{ color: c.semantic.negative, fontSize: 12, marginTop: -space.sm, marginBottom: space.sm }}>{currencyError}</Text> : null}

            <AppInput
              label="Expected Initial Investment (IDR)"
              placeholder="Contoh: 10000000"
              value={expectedInvestment}
              onChangeText={setExpectedInvestment}
              keyboardType="numeric"
              error={investError}
              containerStyle={styles.inputStyle}
            />

            <Text style={[typography.bodyBold, { color: c.text.primary, marginBottom: space.sm, fontFamily: 'Manrope-SemiBold' }]}>
              Account Type
            </Text>
            <View style={styles.segmentRow}>
              <TouchableOpacity
                style={[styles.segmentBtn, { borderColor: colors.accent.purple }, accountType === 1 && { backgroundColor: colors.accent.purple }]}
                onPress={() => { setAccountType(1); setTypeError(''); }}
                activeOpacity={0.7}
              >
                <Text style={[typography.bodyBold, { color: accountType === 1 ? '#fff' : c.text.primary, fontFamily: 'DMSans-SemiBold' }]}>Standard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, { borderColor: colors.accent.purple }, accountType === 2 && { backgroundColor: colors.accent.purple }]}
                onPress={() => { setAccountType(2); setTypeError(''); }}
                activeOpacity={0.7}
              >
                <Text style={[typography.bodyBold, { color: accountType === 2 ? '#fff' : c.text.primary, fontFamily: 'DMSans-SemiBold' }]}>Pro</Text>
              </TouchableOpacity>
            </View>
            {typeError ? <Text style={{ color: c.semantic.negative, fontSize: 12, marginTop: -space.sm, marginBottom: space.sm }}>{typeError}</Text> : null}

            <Text style={[typography.bodyBold, { color: c.text.primary, marginBottom: space.sm, fontFamily: 'Manrope-SemiBold' }]}>
              Account Leverage
            </Text>
            <View style={[styles.pickerWrap, { backgroundColor: c.glass.g1, borderColor: leverageError ? c.semantic.negative : c.glass.borderStrong }]}>
              <Picker
                selectedValue={accountLeverage}
                onValueChange={(val) => { setAccountLeverage(val); setLeverageError(''); }}
                style={{ color: c.text.primary }}
                dropdownIconColor={c.text.secondary}
              >
                <Picker.Item label="Pilih Leverage" value={null} />
                <Picker.Item label="1:100" value={1} />
                <Picker.Item label="1:200" value={2} />
                <Picker.Item label="1:300" value={3} />
                <Picker.Item label="1:400" value={4} />
                <Picker.Item label="1:500" value={5} />
              </Picker>
            </View>
            {leverageError ? <Text style={{ color: c.semantic.negative, fontSize: 12, marginTop: 4 }}>{leverageError}</Text> : null}
          </GlassCard>

          <AppButton
            title="Submit"
            loading={submitting}
            onPress={handleSubmit}
            style={{ marginTop: space['2xl'] }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: space['4xl'] },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: space['2xl'], paddingTop: space.xl, paddingBottom: space.xl,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
  },
  form: { paddingHorizontal: space['2xl'] },
  inputStyle: { marginBottom: space.sm },
  segmentRow: {
    flexDirection: 'row', gap: space.sm, marginBottom: space.md,
  },
  segmentBtn: {
    flex: 1, paddingVertical: space.md, borderRadius: radius.md,
    borderWidth: 1, alignItems: 'center',
  },
  pickerWrap: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
