import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity
} from 'react-native';
import {
  Shield, Bell, ChevronRight, LogOut,
  Copy, Star, Award, Mail, Phone, Hash
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }: any) {
  const { logout, user } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'UN';

  const rank = user?.user_rank as { rank_name?: string; rank_number?: string } | null;

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        { Icon: Mail, label: 'Email', value: user?.email ?? '-' },
        { Icon: Phone, label: 'Phone', value: user?.phone_number || 'Not set' },
        { Icon: Hash, label: 'Referral', value: user?.referral_code ?? '-' },
      ],
    },
    {
      title: 'Trading',
      items: [
        { Icon: Award, label: 'Membership', value: user?.membership_status === 1 ? 'Active' : 'Free' },
        { Icon: Star, label: 'KTP Verified', value: user?.ktp_verified === 1 ? 'Verified' : 'Not verified' },
        { Icon: Shield, label: 'Account Type', value: user?.account_type_name ?? 'Standard' },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* User Card */}
        <View style={styles.headerPad}>
          <View style={styles.userCard}>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View>
                <Text style={styles.userName}>{user?.name ?? 'Trader'}</Text>
                <Text style={styles.userHandle}>{user?.email ?? '-'}</Text>
                {rank?.rank_name && (
                  <View style={styles.eliteBadge}>
                    <Award size={11} color="#AB4BFF" />
                    <Text style={styles.eliteText}>{rank.rank_name}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              {[
                { label: 'Rank', value: rank?.rank_name ?? '-' },
                { label: 'Leverage', value: user?.account_leverage_name ?? '-' },
                { label: 'Currency', value: user?.base_currency_name ?? 'USD' },
              ].map((s) => (
                <View key={s.label}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Account Details */}
        <View style={styles.section}>
          {settingsGroups.map((group) => (
            <View key={group.title} style={{ marginBottom: 16 }}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <View style={styles.settingsCard}>
                {group.items.map((item, i) => (
                  <View
                    key={item.label}
                    style={[styles.settingsItem, i < group.items.length - 1 && styles.settingsItemBorder]}
                  >
                    <View style={styles.settingsIconWrap}>
                      <item.Icon size={15} color="#AB4BFF" />
                    </View>
                    <Text style={styles.settingsLabel}>{item.label}</Text>
                    <Text style={styles.settingsValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={async () => {
              await logout();
              navigation?.replace('Login');
            }}
          >
            <LogOut size={16} color="#FF4B6E" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1439' },
  scroll: { paddingBottom: 100 },

  headerPad: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 0 },
  userCard: {
    borderRadius: 28, padding: 24,
    backgroundColor: 'rgba(171,75,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.3)',
    marginBottom: 24,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#AB4BFF', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  userName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  userHandle: { fontSize: 13, color: '#8899AA', marginTop: 2 },
  eliteBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 6, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, backgroundColor: 'rgba(171,75,255,0.2)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.4)',
    alignSelf: 'flex-start',
  },
  eliteText: { fontSize: 11, color: '#AB4BFF', fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 24, marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: '#8899AA', marginTop: 2 },

  section: { paddingHorizontal: 24, marginBottom: 24 },

  groupTitle: {
    fontSize: 11, color: '#8899AA', fontWeight: '700',
    letterSpacing: 0.5, textTransform: 'uppercase',
    marginBottom: 8, paddingLeft: 4,
  },
  settingsCard: {
    borderRadius: 20, overflow: 'hidden',
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.12)',
  },
  settingsItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 16,
  },
  settingsItemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(171,75,255,0.08)' },
  settingsIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(171,75,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  settingsLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#fff' },
  settingsValue: { fontSize: 13, fontWeight: '600', color: '#8899AA' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 18,
    backgroundColor: 'rgba(255,75,110,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,75,110,0.2)',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#FF4B6E' },
});
