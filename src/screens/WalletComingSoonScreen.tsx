import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Construction, HardHat, Wrench, TrafficCone } from 'lucide-react-native';
import { useColors, useTheme, space, radius, typography } from '@/theme';
import { GlassCard, AppButton, Badge, BackgroundGlow } from '@/components';

// Halaman sementara untuk tab Wallet selama fitur Metapoint masih dikembangkan.
// Diatur lewat FEATURES.WALLET_UNDER_DEVELOPMENT (src/constants/features.ts).
export default function WalletComingSoonScreen() {
  const c = useColors();
  const { isDark } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg.primary }]} edges={['top']}>
      {isDark && <BackgroundGlow />}

      <View style={styles.header}>
        <Text style={[typography.h2, { color: c.text.primary, fontFamily: 'Manrope-Bold' }]}>
          Wallet
        </Text>
        <Text style={[typography.caption, { color: c.text.secondary }]}>
          Metapoint
        </Text>
      </View>

      <View style={styles.center}>
        <GlassCard elevation={3} style={[styles.card, { overflow: 'hidden' }]}>
          <Construction
            size={230}
            color={isDark ? 'rgba(139,92,246,0.10)' : 'rgba(139,92,246,0.07)'}
            strokeWidth={0.7}
            style={styles.watermark}
          />

          <View style={styles.illustration}>
            <HardHat
              size={30}
              color={c.accent.gold}
              strokeWidth={1.6}
              style={[styles.floatIcon, { top: 0, left: 10, transform: [{ rotate: '-18deg' }] }]}
            />
            <Wrench
              size={26}
              color={c.accent.purple}
              strokeWidth={1.6}
              style={[styles.floatIcon, { top: 12, right: 6, transform: [{ rotate: '24deg' }] }]}
            />
            <TrafficCone
              size={24}
              color={c.text.secondary}
              strokeWidth={1.6}
              style={[styles.floatIcon, { bottom: 0, right: 26, transform: [{ rotate: '8deg' }] }]}
            />

            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isDark ? 'rgba(139,92,246,0.16)' : 'rgba(139,92,246,0.12)',
                  borderColor: 'rgba(212,175,55,0.35)',
                },
              ]}
            >
              <Construction size={42} color={c.accent.purple} strokeWidth={1.5} />
            </View>

            <View style={styles.hazardTape}>
              {Array.from({ length: 12 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.hazardStripe,
                    {
                      backgroundColor: i % 2 === 0 ? c.accent.gold : 'rgba(212,175,55,0.22)',
                      transform: [{ skewX: '-24deg' }],
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          <Badge label="SEGERA HADIR" variant="warning" style={styles.badge} />

          <Text style={[typography.h3, styles.title, { color: c.text.primary, fontFamily: 'Manrope-Bold' }]}>
            Fitur Wallet Sedang Dikembangkan
          </Text>
          <Text style={[typography.body, styles.desc, { color: c.text.secondary }]}>
            Metapoint Wallet masih dalam tahap pengembangan. Kami sedang menyiapkan fitur top up dan transaksi agar lebih mudah untuk kamu. Pantau terus ya!
          </Text>

          <AppButton
            title="Kembali ke Home"
            variant="primary"
            onPress={() => navigation.navigate('Home')}
            style={styles.button}
          />
        </GlassCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: { paddingHorizontal: space['2xl'], paddingTop: space.xl, paddingBottom: space.sm },

  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space['2xl'],
    paddingBottom: space['2xl'],
  },

  card: {
    position: 'relative',
    alignItems: 'center',
    paddingVertical: space['2xl'],
  },

  watermark: {
    position: 'absolute',
    top: -24,
    right: -28,
    opacity: 0.5,
    pointerEvents: 'none',
  },

  illustration: {
    width: 150,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  floatIcon: { position: 'absolute', opacity: 0.9 },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hazardTape: {
    position: 'absolute',
    bottom: 6,
    flexDirection: 'row',
    width: 132,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  hazardStripe: { flex: 1, height: 6 },

  badge: { alignSelf: 'center', marginBottom: space.md },

  title: { textAlign: 'center', marginBottom: space.sm },
  desc: { textAlign: 'center', paddingHorizontal: space.sm },

  button: { alignSelf: 'stretch', marginTop: space.xl },
});
