import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, Linking
  } from 'react-native';
  import {
    ArrowLeft, Bell, MapPin, Calendar,
    Globe, Shield, CheckCircle
  } from 'lucide-react-native';
  
  export default function PAMMScreen({ navigation }: any) {
    const openLink = (url: string) => Linking.openURL(url);
  
    return (
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
  
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backBtn}
              >
                <ArrowLeft size={18} color="#8899AA" />
              </TouchableOpacity>
              <Text style={styles.title}>PAMM</Text>
            </View>
            <TouchableOpacity style={styles.backBtn}>
              <Bell size={18} color="#8899AA" />
            </TouchableOpacity>
          </View>
  
          {/* Broker Identity Card */}
          <View style={styles.section}>
            <View style={styles.brokerCard}>
              <View style={styles.brokerLogo}>
                <Text style={styles.brokerLogoText}>JDR</Text>
              </View>
              <Text style={styles.brokerName}>JDR Securities</Text>
              <Text style={styles.brokerSub}>Authorised Forex Broker</Text>
            </View>
          </View>
  
          {/* Broker Specs */}
          <View style={styles.section}>
            <View style={styles.specsCard}>
              {/* Row 1 */}
              <View style={styles.specsRow}>
                <View style={styles.specItem}>
                  <Calendar size={15} color="#8899AA" />
                  <View>
                    <Text style={styles.specLabel}>ESTABLISHED</Text>
                    <Text style={styles.specValue}>2024</Text>
                  </View>
                </View>
                <View style={styles.specItem}>
                  <Globe size={15} color="#8899AA" />
                  <View>
                    <Text style={styles.specLabel}>PLATFORM</Text>
                    <Text style={styles.specValue}>MT5</Text>
                  </View>
                </View>
              </View>
  
              {/* Row 2 */}
              <View style={[styles.specsRow, { marginBottom: 20 }]}>
                <View>
                  <Text style={styles.specLabel}>MIN. DEPOSIT</Text>
                  <Text style={styles.specValue}>$0</Text>
                </View>
                <View>
                  <Text style={styles.specLabel}>MAX LEVERAGE</Text>
                  <Text style={styles.specValue}>Up to 400:1</Text>
                </View>
                <View>
                  <Text style={styles.specLabel}>SPREAD</Text>
                  <Text style={styles.specValue}>1 pip (Std)</Text>
                </View>
              </View>
  
              {/* Address */}
              <View style={styles.addressRow}>
                <MapPin size={15} color="#8899AA" />
                <Text style={styles.addressText}>
                  Suite 2 Level 15, 60 Margaret St Sydney NSW 2000 Australia
                </Text>
              </View>
            </View>
          </View>
  
          {/* Regulations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Regulations</Text>
            <View style={styles.regRow}>
              {[
                { label: "ASIC", sub: "Regulated" },
                { label: "NZ FSPR", sub: "1005237" },
              ].map((reg) => (
                <View key={reg.label} style={styles.regCard}>
                  <Shield size={18} color="#C9A84C" />
                  <View>
                    <Text style={styles.regLabel}>{reg.label}</Text>
                    <Text style={styles.regSub}>{reg.sub}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
  
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.descCard}>
              {[
                "A range of trading instruments",
                "Demo accounts available",
                "MT5 supported",
                "No minimum deposit requirement",
                "Multi-channel support to contact",
                "ASIC Regulated",
                "FSPR Registered",
              ].map((item) => (
                <View key={item} style={styles.descItem}>
                  <CheckCircle size={15} color="#C9A84C" />
                  <Text style={styles.descText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
  
          {/* CTA Buttons */}
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.ctaPrimary}
              onPress={() => openLink("https://secure.jdrsecurities.vc/login")}
            >
              <Text style={styles.ctaPrimaryText}>Open Broker</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ctaSecondary}
              onPress={() => openLink("https://pamm_investor.jdrsecurities.vc/app/auth/investor")}
            >
              <Text style={styles.ctaSecondaryText}>PAMM Invest</Text>
            </TouchableOpacity>
          </View>
  
        </ScrollView>
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0E1439' },
    scroll: { paddingBottom: 40 },
  
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.07)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: 20, fontWeight: '800', color: '#fff' },
  
    section: { paddingHorizontal: 24, marginBottom: 24 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 12 },
  
    brokerCard: {
      borderRadius: 24, paddingVertical: 32, alignItems: 'center',
      backgroundColor: 'rgba(171,75,255,0.15)',
      borderWidth: 1, borderColor: 'rgba(171,75,255,0.3)',
    },
    brokerLogo: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
      borderWidth: 3, borderColor: 'rgba(201,168,76,0.4)', marginBottom: 16,
    },
    brokerLogoText: { fontSize: 18, fontWeight: '900', color: '#0E1439', letterSpacing: -1 },
    brokerName: { fontSize: 20, fontWeight: '800', color: '#fff' },
    brokerSub: { fontSize: 13, color: '#8899AA', marginTop: 4 },
  
    specsCard: {
      padding: 20, borderRadius: 20,
      backgroundColor: 'rgba(14,20,57,0.85)',
      borderWidth: 1, borderColor: 'rgba(171,75,255,0.15)',
    },
    specsRow: {
      flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20,
    },
    specItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    specLabel: { fontSize: 11, color: '#8899AA', fontWeight: '500' },
    specValue: { fontSize: 14, fontWeight: '700', color: '#fff', marginTop: 2 },
    addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    addressText: { fontSize: 13, color: '#8899AA', flex: 1, lineHeight: 20 },
  
    regRow: { flexDirection: 'row', gap: 12 },
    regCard: {
      flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12,
      padding: 16, borderRadius: 16,
      backgroundColor: 'rgba(201,168,76,0.08)',
      borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)',
    },
    regLabel: { fontSize: 14, fontWeight: '700', color: '#fff' },
    regSub: { fontSize: 11, color: '#8899AA' },
  
    descCard: {
      padding: 20, borderRadius: 20, gap: 12,
      backgroundColor: 'rgba(14,20,57,0.85)',
      borderWidth: 1, borderColor: 'rgba(171,75,255,0.15)',
    },
    descItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    descText: { fontSize: 14, color: '#D0D8E4' },
  
    ctaRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, marginBottom: 24 },
    ctaPrimary: {
      flex: 1, paddingVertical: 16, borderRadius: 16,
      backgroundColor: '#C9A84C', alignItems: 'center', justifyContent: 'center',
    },
    ctaPrimaryText: { fontSize: 15, fontWeight: '700', color: '#0E1439' },
    ctaSecondary: {
      flex: 1, paddingVertical: 16, borderRadius: 16,
      borderWidth: 1.5, borderColor: '#C9A84C',
      alignItems: 'center', justifyContent: 'center',
    },
    ctaSecondaryText: { fontSize: 15, fontWeight: '700', color: '#C9A84C' },
  });