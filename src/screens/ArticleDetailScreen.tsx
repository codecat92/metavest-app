import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, User, FileText } from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, space, radius, typography } from '../theme';
import type { RootStackParamList } from '../types/navigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const SERVER_HOST = 'https://metavest-backend-production.up.railway.app';

export default function ArticleDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const article = route.params?.article;

  if (!article) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={[typography.body, { color: colors.text.secondary, marginTop: 200, textAlign: 'center' }]}>
          Article not found
        </Text>
      </SafeAreaView>
    );
  }

  const imageSrc = article.image_src
    ? (article.image_src.startsWith('http')
        ? article.image_src.replace('localhost', '192.168.1.24')
        : `${SERVER_HOST}/uploads/${article.image_src}`)
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {imageSrc ? (
          <Image source={{ uri: imageSrc }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={styles.heroPlaceholder}>
            <FileText size={40} color={colors.text.secondary} />
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={12} color={colors.text.secondary} />
              <Text style={[typography.caption, { color: colors.text.secondary }]}>
                {article.created_at ? new Date(article.created_at).toLocaleDateString() : ''}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <User size={12} color={colors.text.secondary} />
              <Text style={[typography.caption, { color: colors.text.secondary }]}>
                {article.writer_name || article.writer_id || 'Admin'}
              </Text>
            </View>
            <Text style={[typography.caption, { color: colors.text.secondary }]}>
              {Math.ceil((article.content?.length ?? 0) / 500) || 1} min read
            </Text>
          </View>

          <Text style={[typography.h2, { color: colors.text.primary, lineHeight: 32, marginBottom: space.lg, fontFamily: 'SpaceGrotesk-Bold' }]}>
            {article.title}
          </Text>
          <Text style={[typography.body, { color: colors.text.muted, lineHeight: 25 }]}>
            {article.content}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { paddingBottom: 60 },

  header: { paddingHorizontal: space['2xl'], paddingTop: space.lg, paddingBottom: space.sm },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.glass.g1,
    borderWidth: 1, borderColor: colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
  },

  heroImage: { width: '100%', height: 240 },
  heroPlaceholder: {
    width: '100%', height: 200, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.08)',
  },

  content: { padding: space['2xl'] },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.lg, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});
