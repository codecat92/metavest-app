import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { consentApi, ConsentData } from '@/api/consent';
import { useCustomAlert } from '@/context/AlertContext';
import { useColors, typography, space } from '@/theme';
import ConsentModal from '@/components/ConsentModal';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function ConsentDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { consentCode } = route.params;
  const alert = useCustomAlert();
  const c = useColors();
  const [consentData, setConsentData] = useState<ConsentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    consentApi.get(consentCode)
      .then(res => setConsentData(res.data))
      .catch(() => alert.showAlert({ title: 'Error', message: 'Gagal memuat persetujuan', type: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const handleAgreed = () => {
    alert.showAlert({ title: 'Berhasil', message: 'Persetujuan berhasil disimpan', type: 'success' });
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <ActivityIndicator size="large" color={c.accent.purple} style={{ marginTop: 200 }} />
      </SafeAreaView>
    );
  }

  if (!consentData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <View style={styles.center}>
          <Text style={[typography.body, { color: c.text.secondary }]}>Consent tidak ditemukan</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
      <ConsentModal
        visible={true}
        consentData={consentData}
        onAgreed={handleAgreed}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
