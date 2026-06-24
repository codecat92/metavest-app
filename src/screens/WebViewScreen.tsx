import {
  View, Text, StyleSheet, TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useColors, space, typography } from '@/theme';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function WebViewScreen() {
  const route = useRoute<any>();
  const colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { url, title } = route.params || {};

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title || 'Article'}
        </Text>
      </View>
      <WebView source={{ uri: url }} style={styles.webview} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingHorizontal: space['2xl'],
    paddingTop: space.lg,
    paddingBottom: space.lg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    ...typography.bodyBold,
    flex: 1,
    color: colors.text.primary,
    fontFamily: 'DMSans-SemiBold',
  },
  webview: { flex: 1 },
});
