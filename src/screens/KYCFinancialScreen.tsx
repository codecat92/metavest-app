import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors, useColors, space, radius, typography } from '@/theme';
import { AppButton, AppInput, GlassCard } from '@/components';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'KYCFinancial'>;

export default function KYCFinancialScreen({ navigation, route }: Props) {
  const c = useColors();
  const { brokerId } = route.params;

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false, headerLeft: () => null });
    const handler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => handler.remove();
  }, [navigation]);

  const formatCurrency = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    return Number(digits).toLocaleString('id-ID');
  };

  const [employmentStatus, setEmploymentStatus] = useState('');
  const [annualSalary, setAnnualSalary] = useState('');
  const [savingsValue, setSavingsValue] = useState('');

  const [empError, setEmpError] = useState('');
  const [salaryError, setSalaryError] = useState('');
  const [savingsError, setSavingsError] = useState('');

  const validate = (): boolean => {
    let valid = true;
    if (!employmentStatus.trim()) { setEmpError('Wajib diisi'); valid = false; } else { setEmpError(''); }
    if (!annualSalary.trim()) { setSalaryError('Wajib diisi'); valid = false; } else { setSalaryError(''); }
    if (!savingsValue.trim()) { setSavingsError('Wajib diisi'); valid = false; } else { setSavingsError(''); }
    return valid;
  };

  const handleNext = () => {
    if (!validate()) return;
    navigation.navigate('DepositQuestions', {
      brokerId,
      employment_status: employmentStatus.trim(),
      annual_salary: annualSalary.trim(),
      savings_investments_approx_value: savingsValue.trim(),
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h2, { color: c.text.primary, flex: 1, marginLeft: space.lg, fontFamily: 'Manrope-Bold' }]}>
            Financial Info
          </Text>
        </View>

        <View style={styles.form}>
          <GlassCard elevation={2}>
            <AppInput
              label="Employment Status"
              placeholder="Contoh: Karyawan Swasta"
              value={employmentStatus}
              onChangeText={setEmploymentStatus}
              error={empError}
              containerStyle={styles.inputStyle}
            />
            <AppInput
              label="Annual Salary (IDR)"
              placeholder="Contoh: 100.000.000"
              value={annualSalary ? formatCurrency(annualSalary) : ''}
              onChangeText={(text) => setAnnualSalary(text.replace(/\D/g, ''))}
              keyboardType="numeric"
              error={salaryError}
              containerStyle={styles.inputStyle}
            />
            <AppInput
              label="Savings & Investments Approx. Value (IDR)"
              placeholder="Contoh: 50.000.000"
              value={savingsValue ? formatCurrency(savingsValue) : ''}
              onChangeText={(text) => setSavingsValue(text.replace(/\D/g, ''))}
              keyboardType="numeric"
              error={savingsError}
              containerStyle={{ marginBottom: 0 }}
            />
          </GlassCard>

          <AppButton
            title="Lanjut"
            onPress={handleNext}
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
});
