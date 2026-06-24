import { View, type ViewProps, type ViewStyle } from 'react-native';
import { colors, useColors, useTheme, radius, space } from '@/theme';

type Elevation = 1 | 2 | 3 | 4;

interface GlassCardProps extends ViewProps {
  elevation?: Elevation;
  noPadding?: boolean;
}

const shadowLow: ViewStyle = {
  shadowColor: '#0E1439',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

const shadowHigh: ViewStyle = {
  shadowColor: '#0E1439',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.10,
  shadowRadius: 16,
  elevation: 4,
};

export default function GlassCard({
  elevation = 2,
  noPadding = false,
  style,
  children,
  ...rest
}: GlassCardProps) {
  const c = useColors();
  const { isDark } = useTheme();

  const glassBg: Record<Elevation, string> = {
    1: c.glass.g1,
    2: c.glass.g2,
    3: c.glass.g3,
    4: c.glass.g4,
  };

  const glassBorder: Record<Elevation, string> = {
    1: c.glass.border,
    2: c.glass.border,
    3: c.glass.borderStrong,
    4: c.glass.borderStrong,
  };

  const cardStyle: ViewStyle = {
    backgroundColor: glassBg[elevation],
    borderColor: glassBorder[elevation],
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: noPadding ? 0 : space.xl,
    ...(isDark ? {} : elevation <= 2 ? shadowLow : shadowHigh),
  };

  return (
    <View style={[cardStyle, style]} {...rest}>
      {children}
    </View>
  );
}
