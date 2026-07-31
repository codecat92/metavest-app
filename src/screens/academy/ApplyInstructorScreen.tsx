import {
  View, Text, ScrollView, StyleSheet, Image,
  TouchableOpacity, TextInput, ActivityIndicator,
} from 'react-native';
import { useCallback, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, Check } from 'lucide-react-native';
import { academyNewApi } from '@/api/academyNew';
import { useColors, space, radius, typography } from '@/theme';
import { GlassCard, AppButton } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { useCustomAlert } from '@/context/AlertContext';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'ApplyInstructor'>;

const SPECIALIZATIONS = [
  { id: 1, name: 'Saham' },
  { id: 2, name: 'Crypto' },
  { id: 5, name: 'Forex' },
  { id: 4, name: 'Manajemen Risiko' },
];

export default function ApplyInstructorScreen({ navigation }: Props) {
  const c = useColors();
  const { user } = useAuth();
  const { showAlert } = useCustomAlert();
  const insets = useSafeAreaInsets();

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const bioLength = bio.trim().length;
  const isBioValid = bioLength >= 50;
  const isFormValid = isBioValid && selectedSpecs.length > 0;

  const toggleSpec = useCallback((id: number) => {
    setSelectedSpecs(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    );
  }, []);

  const handlePickAvatar = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showAlert({ title: 'Permission', message: 'Allow photo access in Settings.' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }, [showAlert]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('bio', bio.trim());
      selectedSpecs.forEach(id => {
        formData.append('specialization_ids[]', String(id));
      });
      if (avatarUri) {
        formData.append('avatar', {
          uri: avatarUri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        } as any);
      }

      await academyNewApi.applyAsInstructor(formData);
      showAlert({
        title: 'Success',
        message: 'Application submitted! Our team will review your application.',
        type: 'success',
      });
      navigation.goBack();
    } catch (e: any) {
      showAlert({ title: 'Error', message: e?.message ?? 'Failed to submit' });
    } finally {
      setSubmitting(false);
    }
  }, [bio, selectedSpecs, avatarUri, navigation, showAlert]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h3, { color: c.text.primary, fontFamily: 'Manrope-Bold', marginLeft: space.md }]}>
            Apply as Instructor
          </Text>
        </View>

        <View style={{ paddingHorizontal: space['2xl'], gap: space.xl }}>

          {/* ── Avatar ── */}
          <GlassCard elevation={2}>
            <Text style={[typography.captionBold, { color: c.text.secondary, marginBottom: space.md, fontFamily: 'DMSans-SemiBold' }]}>
              PROFILE PHOTO (OPTIONAL)
            </Text>
            <TouchableOpacity onPress={handlePickAvatar} style={{ alignItems: 'center' }}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: c.glass.g2, borderColor: c.glass.border }]}>
                  <Camera size={28} color={c.text.muted} />
                  <Text style={[typography.label, { color: c.text.muted, marginTop: space.xs }]}>Tap to add photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </GlassCard>

          {/* ── Bio ── */}
          <GlassCard elevation={2}>
            <Text style={[typography.captionBold, { color: c.text.secondary, marginBottom: space.md, fontFamily: 'DMSans-SemiBold' }]}>
              TELL US ABOUT YOURSELF
            </Text>
            <TextInput
              style={[styles.textArea, {
                color: c.text.primary,
                backgroundColor: c.glass.g1,
                borderColor: isBioValid ? c.glass.border : c.semantic.negative,
              }]}
              placeholder="Share your trading experience, credentials, and teaching style..."
              placeholderTextColor={c.text.muted}
              multiline
              numberOfLines={5}
              value={bio}
              onChangeText={setBio}
              textAlignVertical="top"
            />
            <View style={styles.counterRow}>
              <Text style={[typography.label, { color: isBioValid ? c.text.muted : c.semantic.negative }]}>
                {bioLength}/50 min characters
              </Text>
              {!isBioValid && bioLength > 0 && (
                <Text style={[typography.label, { color: c.semantic.negative }]}>
                  Need {50 - bioLength} more
                </Text>
              )}
            </View>
          </GlassCard>

          {/* ── Specializations ── */}
          <GlassCard elevation={2}>
            <Text style={[typography.captionBold, { color: c.text.secondary, marginBottom: space.md, fontFamily: 'DMSans-SemiBold' }]}>
              YOUR SPECIALIZATIONS
            </Text>
            <View style={styles.chipRow}>
              {SPECIALIZATIONS.map(spec => {
                const selected = selectedSpecs.includes(spec.id);
                return (
                  <TouchableOpacity
                    key={spec.id}
                    onPress={() => toggleSpec(spec.id)}
                    style={[styles.chip, {
                      backgroundColor: selected ? c.accent.purple : c.glass.g1,
                      borderColor: selected ? c.accent.purple : c.glass.border,
                    }]}
                  >
                    {selected && <Check size={12} color="#fff" />}
                    <Text style={[typography.captionBold, {
                      color: selected ? '#fff' : c.text.secondary,
                      fontFamily: 'DMSans-SemiBold',
                    }]}>
                      {spec.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>
        </View>
      </ScrollView>

      {/* ── Sticky Submit ── */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + space.md, borderColor: c.glass.border, backgroundColor: c.bg.primary }]}>
        {submitting ? (
          <View style={[styles.ctaLoading, { backgroundColor: c.accent.purple }]}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        ) : (
          <AppButton
            title={isBioValid ? 'Submit Application' : `Write at least 50 characters (${bioLength}/50)`}
            variant="primary"
            size="lg"
            disabled={!isFormValid}
            onPress={handleSubmit}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: space['2xl'], paddingTop: space.xl, paddingBottom: space.lg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: { borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  textArea: {
    borderRadius: radius.md, borderWidth: 1,
    padding: space.lg, fontSize: 14, lineHeight: 20,
    fontFamily: 'DMSans', minHeight: 120,
  },
  counterRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: space.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: space.md, paddingVertical: space.sm,
    borderRadius: radius.full, borderWidth: 1,
  },
  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: space['2xl'], paddingTop: space.md,
    borderTopWidth: 1,
  },
  ctaLoading: {
    height: 56, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
});
