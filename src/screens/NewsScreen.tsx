import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, Image, TextInput
  } from 'react-native';
  import { useState } from 'react';
  import { ArrowLeft, Search, Clock, User } from 'lucide-react-native';
  
  const categories = ["All", "Macro", "Forex", "Gold", "Commodities"];
  
  const articles = [
    {
      id: 1, tag: "Macro", category: "Macro",
      title: "Fed holds rates steady — dollar weakens as traders price in June cut",
      author: "James Whitfield", date: "Jun 7, 2026", readTime: "3 min",
      image: "https://picsum.photos/seed/fed/400/200",
      excerpt: "The Federal Reserve held interest rates steady at its latest meeting, sending the dollar lower as markets interpreted the decision as a signal that cuts could come as early as June.",
    },
    {
      id: 2, tag: "Forex", category: "Forex",
      title: "EUR/USD breaks key resistance at 1.0850 — bulls target 1.0920 next",
      author: "Sophie Laurent", date: "Jun 7, 2026", readTime: "4 min",
      image: "https://picsum.photos/seed/eurusd/400/200",
      excerpt: "The euro pushed through a critical technical level against the dollar on Friday, opening the door for further gains as momentum traders pile in on the breakout.",
    },
    {
      id: 3, tag: "Gold", category: "Gold",
      title: "Gold surges past $2,340 on safe-haven demand amid geopolitical tensions",
      author: "Marcus Chen", date: "Jun 7, 2026", readTime: "3 min",
      image: "https://picsum.photos/seed/gold/400/200",
      excerpt: "Spot gold climbed sharply as investors sought shelter from rising geopolitical uncertainty, with the metal finding support from both physical buying and ETF inflows.",
    },
    {
      id: 4, tag: "Forex", category: "Forex",
      title: "Bank of England holds rate at 5.25% — GBP/USD spikes 40 pips on release",
      author: "Emily Harwood", date: "Jun 7, 2026", readTime: "2 min",
      image: "https://picsum.photos/seed/boe/400/200",
      excerpt: "Sterling surged immediately after the Bank of England's decision, catching short sellers off guard as the vote split suggested a more hawkish committee than expected.",
    },
    {
      id: 5, tag: "Macro", category: "Macro",
      title: "US Non-Farm Payrolls beat expectations — dollar index climbs to 3-week high",
      author: "James Whitfield", date: "Jun 6, 2026", readTime: "4 min",
      image: "https://picsum.photos/seed/nfp/400/200",
      excerpt: "The US economy added more jobs than forecast last month, pushing the dollar broadly higher and forcing traders to reprice the timeline for Federal Reserve rate cuts.",
    },
    {
      id: 6, tag: "Forex", category: "Forex",
      title: "USD/JPY approaches 158.00 as BOJ maintains ultra-loose policy stance",
      author: "Kenji Tanaka", date: "Jun 6, 2026", readTime: "3 min",
      image: "https://picsum.photos/seed/usdjpy/400/200",
      excerpt: "The yen continued its slide against the dollar as the Bank of Japan reaffirmed its commitment to yield curve control, leaving traders watching for any sign of intervention.",
    },
    {
      id: 7, tag: "Commodities", category: "Commodities",
      title: "Oil prices drop 2.3% on surprise inventory build — CAD weakens against dollar",
      author: "Rachel Stone", date: "Jun 6, 2026", readTime: "3 min",
      image: "https://picsum.photos/seed/oil/400/200",
      excerpt: "Crude oil fell sharply after US inventory data showed a larger than expected build, dragging the Canadian dollar lower given the loonie's strong correlation with energy prices.",
    },
    {
      id: 8, tag: "Forex", category: "Forex",
      title: "ECB signals possible rate cut in September — EUR slides across the board",
      author: "Sophie Laurent", date: "Jun 5, 2026", readTime: "4 min",
      image: "https://picsum.photos/seed/ecb/400/200",
      excerpt: "European Central Bank officials hinted at a potential rate reduction in September, sending the euro lower against all major currencies as rate differentials shifted.",
    },
    {
      id: 9, tag: "Gold", category: "Gold",
      title: "Silver breaks above $29.50 — momentum traders eye $31 target next week",
      author: "Marcus Chen", date: "Jun 5, 2026", readTime: "2 min",
      image: "https://picsum.photos/seed/silver/400/200",
      excerpt: "Silver cleared a key technical barrier, drawing in momentum buyers who are now targeting the next resistance zone near $31 as industrial demand remains robust.",
    },
    {
      id: 10, tag: "Forex", category: "Forex",
      title: "AUD/USD falls to 3-month low as RBA flags growth concerns in minutes",
      author: "Liam Porter", date: "Jun 5, 2026", readTime: "3 min",
      image: "https://picsum.photos/seed/aud/400/200",
      excerpt: "The Australian dollar dropped to its weakest level in three months after Reserve Bank minutes revealed deeper concerns about the domestic growth outlook than markets had anticipated.",
    },
  ];
  
  const tagColors: Record<string, string> = {
    Macro: "#C9A84C", Forex: "#AB4BFF",
    Gold: "#C9A84C", Commodities: "#2FEFC4",
  };
  
  export default function NewsScreen({ navigation }: any) {
    const [activeCategory, setActiveCategory] = useState("All");
    const [search, setSearch] = useState("");
  
    const filtered = articles.filter((a) => {
      const matchCat = activeCategory === "All" || a.category === activeCategory;
      const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  
    const today = new Date().toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
  
    return (
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
  
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ArrowLeft size={18} color="#8899AA" />
            </TouchableOpacity>
            <View>
              <Text style={styles.title}>Today's News</Text>
              <Text style={styles.date}>{today}</Text>
            </View>
          </View>
  
          {/* Search */}
          <View style={styles.searchBox}>
            <Search size={15} color="#8899AA" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search news..."
              placeholderTextColor="#8899AA"
              style={styles.searchInput}
            />
          </View>
  
          {/* Category tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[styles.categoryBtn, activeCategory === cat && styles.categoryBtnActive]}
              >
                <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
  
          {/* Articles */}
          <View style={styles.articleList}>
            {filtered.map((article) => {
              const tagColor = tagColors[article.tag] ?? "#8899AA";
              return (
                <View key={article.id} style={styles.articleCard}>
                  <Image
                    source={{ uri: article.image }}
                    style={styles.articleImage}
                    resizeMode="cover"
                  />
                  <View style={styles.articleContent}>
                    <View style={styles.metaRow}>
                      <View style={[styles.tagBadge, {
                        backgroundColor: `${tagColor}18`,
                        borderColor: `${tagColor}44`,
                      }]}>
                        <Text style={[styles.tagText, { color: tagColor }]}>{article.tag}</Text>
                      </View>
                      <View style={styles.authorRow}>
                        <User size={10} color="#8899AA" />
                        <Text style={styles.authorText}>{article.author}</Text>
                      </View>
                      <Text style={styles.dotText}>·</Text>
                      <Text style={styles.dateText}>{article.date}</Text>
                    </View>
                    <Text style={styles.articleTitle}>{article.title}</Text>
                    <Text style={styles.articleExcerpt} numberOfLines={3}>{article.excerpt}</Text>
                    <View style={styles.readTimeRow}>
                      <Clock size={11} color="#8899AA" />
                      <Text style={styles.readTimeText}>{article.readTime} read</Text>
                    </View>
                  </View>
                </View>
              );
            })}
  
            {filtered.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No articles found.</Text>
              </View>
            )}
          </View>
  
        </ScrollView>
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0E1439' },
    scroll: { paddingBottom: 40 },
  
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 16,
      paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.07)',
      borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
      alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: 24, fontWeight: '800', color: '#fff' },
    date: { fontSize: 12, color: '#8899AA', marginTop: 2 },
  
    searchBox: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      height: 46, borderRadius: 14, paddingHorizontal: 16,
      marginHorizontal: 24, marginBottom: 16,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
    },
    searchInput: { flex: 1, color: '#F0EEFF', fontSize: 14 },
  
    categoryRow: { paddingHorizontal: 24, gap: 8, marginBottom: 20 },
    categoryBtn: {
      paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderWidth: 1, borderColor: 'rgba(171,75,255,0.15)',
    },
    categoryBtnActive: {
      backgroundColor: 'rgba(171,75,255,0.2)',
      borderColor: 'rgba(171,75,255,0.5)',
    },
    categoryText: { fontSize: 12, fontWeight: '700', color: '#8899AA' },
    categoryTextActive: { color: '#AB4BFF' },
  
    articleList: { paddingHorizontal: 24, gap: 16 },
    articleCard: {
      borderRadius: 20, overflow: 'hidden',
      backgroundColor: 'rgba(14,20,57,0.85)',
      borderWidth: 1, borderColor: 'rgba(171,75,255,0.12)',
    },
    articleImage: { width: '100%', height: 160 },
    articleContent: { padding: 16 },
  
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
    tagBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
    tagText: { fontSize: 10, fontWeight: '700' },
    authorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    authorText: { fontSize: 11, color: '#8899AA' },
    dotText: { fontSize: 11, color: '#8899AA' },
    dateText: { fontSize: 11, color: '#8899AA' },
  
    articleTitle: { fontSize: 15, fontWeight: '700', color: '#fff', lineHeight: 22, marginBottom: 8 },
    articleExcerpt: { fontSize: 12, color: '#8899AA', lineHeight: 18, marginBottom: 10 },
    readTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    readTimeText: { fontSize: 11, color: '#8899AA' },
  
    emptyState: { alignItems: 'center', paddingVertical: 64 },
    emptyText: { fontSize: 14, color: '#8899AA' },
  });