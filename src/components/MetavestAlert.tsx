import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function MetavestAlert({ visible, title, message, type = 'info', onClose }: Props) {
  const accentColor = type === 'success' ? '#2FEFC4' : type === 'error' ? '#FF4B6E' : '#AB4BFF';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={[styles.title, { color: accentColor }]}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity onPress={onClose} style={[styles.button, { backgroundColor: accentColor }]}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(6,9,16,0.85)',
    alignItems: 'center', justifyContent: 'center', padding: 40,
  },
  card: {
    width: '100%', borderRadius: 24, padding: 28,
    backgroundColor: '#0E1439',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.3)',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  message: { fontSize: 14, color: '#8899AA', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  button: {
    paddingHorizontal: 48, paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', minWidth: 140,
  },
  buttonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
