import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { colors, radius, space, typography } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  size?: 'md' | 'lg';
}

const variantBg: Record<ButtonVariant, string> = {
  primary: colors.accent.purple,
  secondary: colors.accent.gold,
  danger: 'rgba(239,68,68,0.15)',
  ghost: 'transparent',
};

const variantBorder: Record<ButtonVariant, string> = {
  primary: 'transparent',
  secondary: 'transparent',
  danger: 'rgba(239,68,68,0.25)',
  ghost: colors.glass.border,
};

const variantText: Record<ButtonVariant, string> = {
  primary: colors.text.primary,
  secondary: colors.bg.primary,
  danger: colors.semantic.negative,
  ghost: colors.text.secondary,
};

export default function AppButton({
  title,
  variant = 'primary',
  loading = false,
  size = 'md',
  style,
  disabled,
  ...rest
}: AppButtonProps) {
  const height = size === 'lg' ? 56 : 48;
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        {
          height,
          borderRadius: radius.md,
          backgroundColor: variantBg[variant],
          borderColor: variantBorder[variant],
          borderWidth: variant === 'ghost' ? 1 : 0,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isDisabled ? 0.6 : 1,
        },
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'secondary' ? colors.bg.primary : '#fff'} />
      ) : (
        <Text
          style={[
            typography.bodyBold,
            {
              color: variantText[variant],
              fontSize: 15,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
