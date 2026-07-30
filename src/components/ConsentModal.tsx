import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent,
  BackHandler, StyleSheet,
} from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { colors, useColors, space, radius, typography } from '@/theme';
import { AppButton } from '@/components';
import { consentApi, ConsentData } from '@/api/consent';
import { useCustomAlert } from '@/context/AlertContext';

interface ConsentModalProps {
  visible: boolean;
  consentData: ConsentData | null;
  onAgreed: () => void;
}

export default function ConsentModal({ visible, consentData, onAgreed }: ConsentModalProps) {
  const c = useColors();
  const alert = useCustomAlert();
  const [checked, setChecked] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 20) {
      setHasScrolledToBottom(true);
    }
  }, []);

  useEffect(() => {
    if (scrollViewHeight > 0 && contentHeight > 0 && contentHeight <= scrollViewHeight + 20) {
      setHasScrolledToBottom(true);
    }
  }, [scrollViewHeight, contentHeight]);

  useEffect(() => {
    if (visible) {
      setChecked(false);
      setHasScrolledToBottom(false);
      setScrollViewHeight(0);
      setContentHeight(0);
    }
  }, [visible]);

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

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => handler.remove();
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => {}}
    >
      <View style={[styles.container, { backgroundColor: c.bg.deep }]}>
        <View style={[styles.header, { borderBottomColor: c.glass.borderStrong }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <ShieldCheck size={24} color={colors.accent.purple} />
            <Text style={[typography.h4, { color: c.text.primary, fontFamily: 'Manrope-Bold', flex: 1 }]}>
              {consentData?.title ?? 'Loading...'}
            </Text>
          </View>
          {consentData && (
            <View style={[styles.versionBadge, { backgroundColor: c.glass.g2 }]}>
              <Text style={[typography.label, { color: c.text.muted }]}>
                Versi {consentData.version}
              </Text>
            </View>
          )}
        </View>

        {!consentData ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.accent.purple} />
          </View>
        ) : (
          <>
            <View style={[styles.documentCard, { backgroundColor: c.bg.elevated, borderColor: c.glass.border }]}>
              <ScrollView
                style={{ flex: 1 }}
                onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height)}
                onContentSizeChange={(w, h) => setContentHeight(h)}
                onScroll={handleScroll}
                scrollEventThrottle={16}
              >
                <Text style={[typography.body, {
                  color: c.text.primary,
                  fontFamily: 'DMSans',
                  lineHeight: 26,
                  textAlign: 'justify',
                }]}>
                  {consentData.content}
                </Text>
              </ScrollView>
            </View>

            <View style={[styles.footer, { borderTopColor: c.glass.borderStrong }]}>
              {!hasScrolledToBottom ? (
                <View style={styles.scrollHint}>
                  <View style={[styles.progressDots, { backgroundColor: c.glass.g2 }]}>
                    <View style={[styles.progressDot, { backgroundColor: c.text.muted }]} />
                    <View style={[styles.progressDotInactive, { backgroundColor: c.glass.g3 }]} />
                    <View style={[styles.progressDotInactive, { backgroundColor: c.glass.g3 }]} />
                  </View>
                  <Text style={[typography.label, { color: c.text.muted, textAlign: 'center', marginTop: space.sm }]}>
                    Baca hingga selesai untuk melanjutkan
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.checkRow}
                  onPress={() => setChecked(!checked)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.checkbox,
                    checked && styles.checkboxChecked,
                    { borderColor: checked ? colors.accent.purple : c.glass.borderStrong },
                  ]}>
                    {checked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[typography.body, { color: c.text.primary, flex: 1, fontFamily: 'DMSans' }]}>
                    Saya telah membaca dan menyetujui
                  </Text>
                </TouchableOpacity>
              )}

              <AppButton
                title="Setuju & Lanjutkan"
                disabled={!checked}
                loading={submitting}
                size="lg"
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
    paddingHorizontal: space['2xl'],
    paddingTop: space['3xl'],
    paddingBottom: space.lg,
    borderBottomWidth: 1,
  },
  versionBadge: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginTop: space.sm,
  },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  documentCard: {
    flex: 1,
    margin: space['2xl'],
    marginBottom: 0,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.xl,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: space['2xl'],
    paddingTop: space.lg,
    paddingBottom: space['3xl'],
    gap: space.md,
  },
  scrollHint: {
    alignItems: 'center',
    paddingVertical: space.sm,
  },
  progressDots: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: space.md, paddingVertical: 6,
    borderRadius: radius.full,
  },
  progressDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  progressDotInactive: {
    width: 8, height: 8, borderRadius: 4, opacity: 0.4,
  },
  checkRow: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 4,
    borderWidth: 2.5,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.accent.purple,
    borderColor: colors.accent.purple,
  },
  checkmark: {
    color: '#fff', fontSize: 15, fontWeight: '800', lineHeight: 20,
  },
});
