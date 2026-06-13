import { View, StyleSheet, type ViewProps, type ViewStyle } from 'react-native';
import { colors, radius, space } from '@/theme';

type Elevation = 1 | 2 | 3 | 4;

interface GlassCardProps extends ViewProps {
  elevation?: Elevation;
  noPadding?: boolean;
}

const glassBg: Record<Elevation, string> = {
  1: colors.glass.g1,
  2: colors.glass.g2,
  3: colors.glass.g3,
  4: colors.glass.g4,
};

const glassBorder: Record<Elevation, string> = {
  1: colors.glass.border,
  2: colors.glass.border,
  3: colors.glass.borderStrong,
  4: colors.glass.borderStrong,
};

export default function GlassCard({
  elevation = 2,
  noPadding = false,
  style,
  children,
  ...rest
}: GlassCardProps) {
  const cardStyle: ViewStyle = {
    backgroundColor: glassBg[elevation],
    borderColor: glassBorder[elevation],
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: noPadding ? 0 : space.xl,
  };

  return (
    <View style={[cardStyle, style]} {...rest}>
      {children}
    </View>
  );
}
