import { View, Text, TouchableOpacity, type ViewStyle } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space, typography } from '../theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  style?: ViewStyle;
}

export default function AppHeader({ title, subtitle, onBack, right, style }: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: insets.top + space.lg,
          paddingBottom: space.xl,
          paddingHorizontal: space['2xl'],
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.glass.g1,
              borderWidth: 1,
              borderColor: colors.glass.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
        <View>
          <Text style={[typography.h2, { color: colors.text.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[typography.caption, { color: colors.text.secondary, marginTop: 2 }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {right && <View style={{ flexDirection: 'row', gap: space.sm }}>{right}</View>}
    </View>
  );
}
