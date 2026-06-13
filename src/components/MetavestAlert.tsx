import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { colors, radius, space, typography } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function MetavestAlert({ visible, title, message, type = 'info', onClose }: Props) {
  const accentColor = type === 'success' ? colors.semantic.positive : type === 'error' ? colors.semantic.negative : colors.accent.purple;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={[typography.h3, { color: accentColor, textAlign: 'center', fontFamily: 'SpaceGrotesk-Bold' }]}>
            {title}
          </Text>
          <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center', marginBottom: space['2xl'] }]}>
            {message}
          </Text>
          <TouchableOpacity onPress={onClose} style={[styles.button, { backgroundColor: accentColor }]}>
            <Text style={[typography.bodyBold, { color: '#fff' }]}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: colors.overlay.modal,
    alignItems: 'center', justifyContent: 'center', padding: space['3xl'],
  },
  card: {
    width: '100%', borderRadius: radius.xl, padding: 28,
    backgroundColor: colors.bg.primary,
    borderWidth: 1, borderColor: colors.glass.borderStrong,
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 48, paddingVertical: space.md, borderRadius: radius.md,
    alignItems: 'center', minWidth: 140,
  },
});
