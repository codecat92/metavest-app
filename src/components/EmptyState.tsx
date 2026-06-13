import { View, Text } from 'react-native';
import { colors, space, typography } from '@/theme';
import AppButton from './AppButton';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export default function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: space['4xl'],
        paddingHorizontal: space['2xl'],
      }}
    >
      {icon}
      <Text
        style={[
          typography.h4,
          { color: colors.text.secondary, marginTop: space.md, textAlign: 'center', fontFamily: 'SpaceGrotesk-Bold' },
        ]}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={[
            typography.caption,
            { color: colors.text.muted, marginTop: space.xs, textAlign: 'center' },
          ]}
        >
          {subtitle}
        </Text>
      )}
      {action && (
        <AppButton
          title={action.label}
          onPress={action.onPress}
          variant="ghost"
          size="md"
          style={{ marginTop: space.xl }}
        />
      )}
    </View>
  );
}
