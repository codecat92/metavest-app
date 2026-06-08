import { View, Text, StyleSheet } from 'react-native';
export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1439', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontSize: 24, fontWeight: '800' }
});
