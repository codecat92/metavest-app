import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors, radius, space, typography } from '@/theme';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export default function AppInput({
  label,
  error,
  secureTextEntry,
  containerStyle,
  style,
  ...rest
}: AppInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[{ marginBottom: space.lg }, containerStyle]}>
      {label && (
        <Text style={typography.label}>{label}</Text>
      )}
      <View style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          height: 52,
          borderRadius: radius.md,
          paddingHorizontal: space.lg,
          backgroundColor: colors.glass.g1,
          borderWidth: 1,
          borderColor: error ? colors.semantic.negative : colors.glass.border,
          marginTop: label ? space.sm : 0,
        },
      ]}>
        <TextInput
          style={[
            {
              flex: 1,
              color: colors.text.primary,
              fontSize: 15,
              fontFamily: 'DMSans',
            },
            style,
          ]}
          placeholderTextColor={colors.text.secondary}
          secureTextEntry={secureTextEntry ? showPassword : false}
          {...rest}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            {showPassword ? (
              <EyeOff size={18} color={colors.text.secondary} />
            ) : (
              <Eye size={18} color={colors.text.secondary} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={{ color: colors.semantic.negative, fontSize: 12, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
}
