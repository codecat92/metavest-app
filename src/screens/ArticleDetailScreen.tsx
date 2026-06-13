import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Image
} from 'react-native';
import { ArrowLeft, Clock, User, FileText } from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

const SERVER_HOST = 'https://metavest-backend-production.up.railway.app';

export default function ArticleDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const article = route.params?.article;

  if (!article) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#8899AA', marginTop: 200, textAlign: 'center' }}>Article not found</Text>
      </View>
    );
  }

  const imageSrc = article.image_src
    ? (article.image_src.startsWith('http')
        ? article.image_src.replace('localhost', '192.168.1.24')
        : `${SERVER_HOST}/uploads/${article.image_src}`)
    : null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#8899AA" />
          </TouchableOpacity>
        </View>

        {/* Image */}
        {imageSrc ? (
          <Image source={{ uri: imageSrc }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={styles.heroPlaceholder}>
            <FileText size={40} color="#8899AA" />
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={12} color="#8899AA" />
              <Text style={styles.metaText}>
                {article.created_at ? new Date(article.created_at).toLocaleDateString() : ''}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <User size={12} color="#8899AA" />
              <Text style={styles.metaText}>{article.writer_name || article.writer_id || 'Admin'}</Text>
            </View>
            <Text style={styles.metaText}>
              {Math.ceil((article.content?.length ?? 0) / 500) || 1} min read
            </Text>
          </View>

          <Text style={styles.title}>{article.title}</Text>
          <Text style={styles.body}>{article.content}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1439' },
  scroll: { paddingBottom: 60 },

  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 8 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  heroImage: { width: '100%', height: 240 },
  heroPlaceholder: {
    width: '100%', height: 200, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(171,75,255,0.08)',
  },

  content: { padding: 24 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#8899AA' },

  title: { fontSize: 24, fontWeight: '800', color: '#fff', lineHeight: 32, marginBottom: 16 },
  body: { fontSize: 15, color: 'rgba(240,238,255,0.75)', lineHeight: 25 },
});
