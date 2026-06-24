import { View, type ViewProps, type ViewStyle } from 'react-native';
import { colors, useColors, radius, space } from '@/theme';

type Elevation = 1 | 2 | 3 | 4;

interface GlassCardProps extends ViewProps {
  elevation?: Elevation;
  noPadding?: boolean;
}

export default function GlassCard({
  elevation = 2,
  noPadding = false,
  style,
  children,
  ...rest
}: GlassCardProps) {
  const c = useColors();

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
  };

  return (
    <View style={[cardStyle, style]} {...rest}>
      {children}
    </View>
  );
}
