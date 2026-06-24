import { View, Text, type ViewStyle } from 'react-native';
import { colors, useColors, useTheme, radius, space } from '@/theme';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export default function Badge({ label, variant = 'neutral', icon, style }: BadgeProps) {
  const c = useColors();
  const { isDark } = useTheme();

  const darkVariants: Record<BadgeVariant, { bg: string; border: string; text: string }> = {
    success: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.30)', text: c.semantic.positive },
    danger: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.30)', text: c.semantic.negative },
    warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.30)', text: c.semantic.warning },
    info: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.30)', text: c.accent.purple },
    neutral: { bg: c.glass.g2, border: c.glass.border, text: c.text.secondary },
  };

  const lightVariants: Record<BadgeVariant, { bg: string; border: string; text: string }> = {
    success: { bg: 'rgba(34,197,94,0.10)', border: 'rgba(21,128,61,0.25)', text: c.semantic.positive },
    danger: { bg: 'rgba(239,68,68,0.10)', border: 'rgba(220,38,38,0.25)', text: c.semantic.negative },
    warning: { bg: 'rgba(245,158,11,0.10)', border: 'rgba(180,83,9,0.25)', text: c.semantic.warning },
    info: { bg: 'rgba(139,92,246,0.10)', border: 'rgba(109,40,217,0.20)', text: c.accent.purple },
    neutral: { bg: 'rgba(14,20,57,0.06)', border: 'rgba(14,20,57,0.12)', text: c.text.secondary },
  };

  const s = isDark ? darkVariants[variant] : lightVariants[variant];

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.xs,
          paddingHorizontal: space.md,
          paddingVertical: space.xs,
          borderRadius: radius.sm,
          backgroundColor: s.bg,
          borderWidth: 1,
          borderColor: s.border,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      {icon}
      <Text style={{ fontSize: 11, fontWeight: '700', color: s.text, fontFamily: 'DMSans-Bold' }}>
        {label}
      </Text>
    </View>
  );
}
