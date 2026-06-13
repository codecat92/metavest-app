import { View, Text, type ViewStyle } from 'react-native';
import { colors, radius, space } from '@/theme';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const variantStyles: Record<BadgeVariant, { bg: string; border: string; text: string }> = {
  success: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.30)', text: colors.semantic.positive },
  danger: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.30)', text: colors.semantic.negative },
  warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.30)', text: colors.semantic.warning },
  info: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.30)', text: colors.accent.purple },
  neutral: { bg: colors.glass.g2, border: colors.glass.border, text: colors.text.secondary },
};

export default function Badge({ label, variant = 'neutral', icon, style }: BadgeProps) {
  const s = variantStyles[variant];

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
