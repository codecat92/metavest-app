import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera } from 'lucide-react-native';
import { consentApi, ConsentData } from '@/api/consent';
import { getToken, BASE_URL } from '@/api/client';
import { colors, useColors, space, radius, typography } from '@/theme';
import { GlassCard, AppButton, AppInput, Skeleton } from '@/components';
import { useAuth } from '@/context/AuthContext';
import ConsentModal from '@/components/ConsentModal';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'PAMMKyc'>;

export default function PAMMKycScreen({ navigation, route }: Props) {
  const c = useColors();
  const { user } = useAuth();
  const { brokerId } = route.params;

  const [consent, setConsent] = useState<ConsentData | null>(null);
  const [consentLoading, setConsentLoading] = useState(true);
  const [consentAgreed, setConsentAgreed] = useState(false);

  const [idType, setIdType] = useState<'ktp' | 'passport' | null>(null);

  const [nik, setNik] = useState('');
  const [passportId, setPassportId] = useState('');
  const [address, setAddress] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [dateOfBirthText, setDateOfBirthText] = useState('');

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [nikError, setNikError] = useState('');
  const [passportIdError, setPassportIdError] = useState('');
  const [placeError, setPlaceError] = useState('');
  const [dobError, setDobError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [addressError, setAddressError] = useState('');

  const loadConsent = useCallback(async () => {
    setConsentLoading(true);
    try {
      const res = await consentApi.get('pamm_submission');
      setConsent(res.data);
      if (res.data.already_agreed) {
        setConsentAgreed(true);
      }
    } catch (e) {
      console.log('Consent load failed:', e);
    } finally {
      setConsentLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { loadConsent(); }, [loadConsent])
  );

  const showConsentModal = consent && !consentAgreed;

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !showConsentModal });
  }, [showConsentModal, navigation]);

  const handleConsentAgreed = () => {
    setConsentAgreed(true);
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow access to photos in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhotoError('');
    }
  };

  const validate = (): boolean => {
    let valid = true;

    if (idType === 'ktp') {
      if (!nik.trim() || !/^[0-9]+$/.test(nik.trim())) {
        setNikError('NIK harus diisi dengan angka');
        valid = false;
      } else {
        setNikError('');
      }
      if (!address.trim()) {
        setAddressError('Alamat lengkap wajib diisi');
        valid = false;
      } else {
        setAddressError('');
      }
    }
    if (idType === 'passport') {
      if (!passportId.trim() || passportId.trim().length > 12) {
        setPassportIdError('Passport ID harus diisi (max 12 karakter)');
        valid = false;
      } else {
        setPassportIdError('');
      }
    }
    if (!placeOfBirth.trim()) {
      setPlaceError('Tempat lahir wajib diisi');
      valid = false;
    } else {
      setPlaceError('');
    }
    if (!dateOfBirthText.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirthText.trim())) {
      setDobError('Format tanggal lahir: YYYY-MM-DD (contoh: 1962-07-26)');
      valid = false;
    } else {
      const parsed = new Date(dateOfBirthText.trim());
      if (isNaN(parsed.getTime())) {
        setDobError('Tanggal tidak valid');
        valid = false;
      } else {
        setDobError('');
      }
    }
    if (!photoUri) {
      setPhotoError('Foto KTP/Passport wajib diupload');
      valid = false;
    } else {
      setPhotoError('');
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const token = getToken();
    if (!token) {
      Alert.alert('Error', 'Silakan login terlebih dahulu');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();

      if (idType === 'ktp') {
        formData.append('name', user?.name ?? '');
        formData.append('nik', nik.trim());
        formData.append('address', address.trim());
      } else {
        formData.append('name', user?.name ?? '');
        formData.append('passport_id', passportId.trim());
      }
      formData.append('place_of_birth', placeOfBirth.trim());
      formData.append('date_of_birth', dateOfBirthText.trim());

      const uri = photoUri!;
      const filename = uri.split('/').pop() ?? 'ktp.jpg';
      const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
      formData.append('image_file', {
        uri,
        name: filename,
        type: mimeType,
      } as any);

      const endpoint = idType === 'ktp' ? '/user/ktp/verify' : '/user/passport/verify';

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || 'Upload failed');
      }

      Alert.alert('Berhasil', 'Data berhasil dikirim, menunggu verifikasi admin', [
        { text: 'Lanjut', onPress: () => navigation.navigate('KYCFinancial', { brokerId }) },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Gagal mengirim data');
    } finally {
      setSubmitting(false);
    }
  };

  if (consentLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <View style={[styles.header, { paddingBottom: 0 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: space['2xl'], gap: space.lg }}>
          <Skeleton height={200} borderRadius={radius.lg} />
          <Skeleton height={20} borderRadius={radius.sm} />
          <Skeleton height={52} borderRadius={radius.md} />
          <Skeleton height={52} borderRadius={radius.md} />
        </View>
      </SafeAreaView>
    );
  }

  if (consent && !consentAgreed) {
    return (
      <ConsentModal
        visible={true}
        consentData={consent}
        onAgreed={handleConsentAgreed}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h2, { color: c.text.primary, flex: 1, marginLeft: space.lg, fontFamily: 'Manrope-Bold' }]}>
            Identity Verification
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[typography.bodyBold, { color: c.text.primary, marginBottom: space.sm, fontFamily: 'Manrope-SemiBold' }]}>
            Tipe Identitas
          </Text>
          <View style={styles.segmentRow}>
            <TouchableOpacity
              style={[styles.segmentBtn, { borderColor: colors.accent.purple }, idType === 'ktp' && { backgroundColor: colors.accent.purple }]}
              onPress={() => setIdType('ktp')}
              activeOpacity={0.7}
            >
              <Text style={[typography.bodyBold, { color: idType === 'ktp' ? '#fff' : c.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                KTP
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, { borderColor: colors.accent.purple }, idType === 'passport' && { backgroundColor: colors.accent.purple }]}
              onPress={() => setIdType('passport')}
              activeOpacity={0.7}
            >
              <Text style={[typography.bodyBold, { color: idType === 'passport' ? '#fff' : c.text.primary, fontFamily: 'DMSans-SemiBold' }]}>
                Passport
              </Text>
            </TouchableOpacity>
          </View>

          {idType && (
            <>
              <AppInput
                label="Nama Lengkap"
                value={user?.name ?? ''}
                editable={false}
                containerStyle={styles.inputStyle}
              />

              {idType === 'ktp' ? (
                <>
                <AppInput
                  label="NIK"
                  placeholder="3271..."
                  value={nik}
                  onChangeText={setNik}
                  keyboardType="number-pad"
                  error={nikError}
                  containerStyle={styles.inputStyle}
                />
                <AppInput
                  label="Alamat Lengkap"
                  placeholder="Jl. Contoh No. 123, Jakarta"
                  value={address}
                  onChangeText={setAddress}
                  error={addressError}
                  multiline
                  containerStyle={styles.inputStyle}
                />
                </>
              ) : (
                <AppInput
                  label="Passport ID"
                  placeholder="A1234567"
                  value={passportId}
                  onChangeText={setPassportId}
                  maxLength={12}
                  error={passportIdError}
                  containerStyle={styles.inputStyle}
                />
              )}

              <AppInput
                label="Tempat Lahir"
                placeholder="Jakarta"
                value={placeOfBirth}
                onChangeText={setPlaceOfBirth}
                error={placeError}
                containerStyle={styles.inputStyle}
              />
              <AppInput
                label="Tanggal Lahir (Format: YYYY-MM-DD)"
                placeholder="Contoh: 1962-07-26"
                value={dateOfBirthText}
                onChangeText={setDateOfBirthText}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                error={dobError}
                containerStyle={styles.inputStyle}
              />

              <Text style={[typography.bodyBold, { color: c.text.primary, marginBottom: space.sm, marginTop: space.md, fontFamily: 'Manrope-SemiBold' }]}>
                {idType === 'ktp' ? 'Foto KTP' : 'Foto Passport'}
              </Text>

              <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8}>
                <GlassCard elevation={2} style={{ alignItems: 'center', paddingVertical: space['2xl'] }}>
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.placeholderWrap}>
                      <Camera size={32} color={c.text.muted} />
                      <Text style={[typography.caption, { color: c.text.muted, marginTop: space.sm }]}>
                        Pilih Foto
                      </Text>
                    </View>
                  )}
                </GlassCard>
              </TouchableOpacity>
              {photoError ? (
                <Text style={{ color: c.semantic.negative, fontSize: 12, marginTop: 4 }}>{photoError}</Text>
              ) : null}

              <AppButton
                title="Kirim"
                loading={submitting}
                onPress={handleSubmit}
                style={{ marginTop: space['2xl'] }}
              />
            </>
          )}
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
  form: {
    paddingHorizontal: space['2xl'],
  },
  inputStyle: {
    marginBottom: space.sm,
  },
  segmentRow: {
    flexDirection: 'row', gap: space.sm, marginBottom: space.xl,
  },
  segmentBtn: {
    flex: 1, paddingVertical: space.md, borderRadius: radius.md,
    borderWidth: 1, alignItems: 'center',
  },
  previewImage: {
    width: 200, height: 120, borderRadius: radius.md,
  },
  placeholderWrap: {
    alignItems: 'center', paddingVertical: space.xl,
  },
});
