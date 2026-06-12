import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';

interface AlertOptions {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType>({ showAlert: () => {} });

export function useCustomAlert() {
  return useContext(AlertContext);
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [alertData, setAlertData] = useState<AlertOptions>({ title: '', message: '', type: 'info' });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertData(options);
    setVisible(true);
  }, []);

  const accentColor = alertData.type === 'success' ? '#2FEFC4'
    : alertData.type === 'error' ? '#FF4B6E'
    : '#AB4BFF';

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={[styles.title, { color: accentColor }]}>{alertData.title}</Text>
            <Text style={styles.message}>{alertData.message}</Text>
            <TouchableOpacity onPress={() => setVisible(false)} style={[styles.button, { backgroundColor: accentColor }]}>
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
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
