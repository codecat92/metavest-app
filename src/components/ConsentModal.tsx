import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent,
  StyleSheet,
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors, useColors, space, radius, typography } from '@/theme';
import { AppButton } from '@/components';
import { consentApi, ConsentData } from '@/api/consent';
import { useCustomAlert } from '@/context/AlertContext';

interface ConsentModalProps {
  visible: boolean;
  consentData: ConsentData | null;
  onAgreed: () => void;
  onCancel?: () => void;
}

export default function ConsentModal({ visible, consentData, onAgreed, onCancel }: ConsentModalProps) {
  const c = useColors();
  const alert = useCustomAlert();
  const [checked, setChecked] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 20) {
      setHasScrolledToBottom(true);
    }
  }, []);

  const handleAgree = async () => {
    if (!consentData) return;
    setSubmitting(true);
    try {
      await consentApi.submit(consentData.code);
      onAgreed();
    } catch (err: any) {
      alert.showAlert({ title: 'Error', message: err.message || 'Gagal menyimpan persetujuan', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (onCancel) onCancel();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => { if (onCancel) onCancel(); }}
    >
      <View style={[styles.container, { backgroundColor: c.bg.primary }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <X size={20} color={c.text.secondary} />
          </TouchableOpacity>
          <Text style={[typography.h3, { color: c.text.primary, flex: 1, textAlign: 'center', fontFamily: 'Manrope-Bold' }]}>
            {consentData?.title ?? 'Loading...'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {!consentData ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.accent.purple} />
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={{ paddingBottom: space['4xl'] }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              <Text style={[typography.body, { color: c.text.primary, fontFamily: 'DMSans', lineHeight: 24 }]}>
                {consentData.content}
              </Text>
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: c.glass.border }]}>
              {!hasScrolledToBottom && (
                <View style={styles.scrollHint}>
                  <Text style={[typography.label, { color: c.text.muted, textAlign: 'center' }]}>
                    Scroll ke bawah untuk melanjutkan
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => hasScrolledToBottom && setChecked(!checked)}
                disabled={!hasScrolledToBottom}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  { borderColor: hasScrolledToBottom ? colors.accent.purple : c.glass.borderStrong },
                  checked && { backgroundColor: colors.accent.purple, borderColor: colors.accent.purple },
                ]}>
                  {checked && <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>✓</Text>}
                </View>
                <Text style={[typography.body, {
                  color: hasScrolledToBottom ? c.text.primary : c.text.muted,
                  flex: 1,
                  fontFamily: 'DMSans',
                }]}>
                  Saya telah membaca dan menyetujui
                </Text>
              </TouchableOpacity>

              <AppButton
                title="Setuju & Lanjutkan"
                disabled={!checked}
                loading={submitting}
                onPress={handleAgree}
              />
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: space['2xl'], paddingTop: space['3xl'], paddingBottom: space.lg,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
  },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { flex: 1, paddingHorizontal: space['2xl'] },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: space['2xl'],
    paddingTop: space.lg,
    paddingBottom: space['3xl'],
    gap: space.md,
  },
  scrollHint: {
    paddingVertical: space.xs,
  },
  checkRow: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
});
