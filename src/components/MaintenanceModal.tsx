import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { Wrench, X } from 'lucide-react-native';
import { useColors, useTheme, space, radius, typography } from '@/theme';
import { GlassCard, AppButton } from '@/components';

interface MaintenanceModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function MaintenanceModal({ visible, onClose }: MaintenanceModalProps) {
  const c = useColors();
  const { isDark } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(6,9,16,0.92)' }]}>
        <GlassCard elevation={4}>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            style={[styles.closeBtn, { backgroundColor: c.glass.g1 }]}
          >
            <X size={18} color={c.text.muted} />
          </TouchableOpacity>

          <View style={styles.body}>
            {/* Icon treatment: double ring + wrench */}
            <View style={[styles.iconRing, { borderColor: 'rgba(212,175,55,0.30)' }]}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(212,175,55,0.15)' }]}>
                <Wrench size={28} color={c.accent.gold} strokeWidth={1.6} />
              </View>
            </View>

            {/* MAINTENANCE pill */}
            <View style={[styles.pill, { backgroundColor: c.accent.gold }]}>
              <Text style={[styles.pillText, { color: isDark ? '#0A0A0A' : '#1A1A2E' }]}>
                MAINTENANCE
              </Text>
            </View>

            <Text style={[typography.h4, { color: c.text.primary, textAlign: 'center', fontFamily: 'Manrope-Bold' }]}>
              Fitur Sedang Maintenance
            </Text>

            <Text style={[typography.body, { color: c.text.secondary, textAlign: 'center' }]}>
              Fitur sedang maintenance, silahkan hubungi admin.
            </Text>

            <Text style={[typography.caption, { color: c.text.muted, textAlign: 'center' }]}>
              Kami sedang meningkatkan infrastruktur, fitur ini akan segera tersedia kembali.
            </Text>

            <AppButton
              title="Mengerti"
              variant="primary"
              onPress={onClose}
              style={{ marginTop: space.md, alignSelf: 'stretch' }}
            />
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: space.xl,
  },
  closeBtn: {
    position: 'absolute',
    top: space.sm,
    right: space.sm,
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  body: {
    alignItems: 'center',
    gap: space.md,
  },
  iconRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    alignSelf: 'center',
    borderRadius: radius.full,
    paddingHorizontal: space.lg,
    paddingVertical: space.xs,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: 'DMSans-Bold',
  },
});
