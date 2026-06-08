import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity
} from 'react-native';
import { useState } from 'react';
import {
  Zap, Shield, Bell, ChevronRight, LogOut,
  Copy, Star, Award, Trophy, Target, Flame, Gem, Moon
} from 'lucide-react-native';

const badges = [
  { label: "Elite Trader", unlocked: true,  Icon: Trophy, color: "#AB4BFF" },
  { label: "Signal King", unlocked: true,  Icon: Zap,    color: "#AB4BFF" },
  { label: "Precision Pro", unlocked: true,  Icon: Target, color: "#AB4BFF" },
  { label: "Hot Streak", unlocked: true,  Icon: Flame,  color: "#F7C948" },
  { label: "Diamond Hands", unlocked: false, Icon: Gem,    color: "#2FEFC4" },
  { label: "Night Trader", unlocked: false, Icon: Moon,   color: "#AB4BFF" },
];

const tiers = [
  { name: "Starter", points: 0,     color: "#9B8EC4" },
  { name: "Pro",     points: 2500,  color: "#8855CC" },
  { name: "Elite",   points: 5000,  color: "#AB4BFF" },
  { name: "Legend",  points: 10000, color: "#2FEFC4" },
];

const currentPoints = 4820;
const currentTierIndex = 2;
const nextTierPoints = tiers[3].points;
const progress = ((currentPoints - tiers[2].points) / (nextTierPoints - tiers[2].points)) * 100;

const settingsGroups = [
  {
    title: "Account",
    items: [
      { Icon: Shield, label: "Security & Privacy" },
      { Icon: Bell,   label: "Notifications" },
      { Icon: Copy,   label: "Referral Code" },
    ],
  },
  {
    title: "Trading",
    items: [
      { Icon: Zap,   label: "Auto-Trading Settings" },
      { Icon: Star,  label: "Subscription Plan" },
      { Icon: Award, label: "Achievement History" },
    ],
  },
];

export default function ProfileScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* User Card */}
        <View style={styles.headerPad}>
          <View style={styles.userCard}>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>AM</Text>
              </View>
              <View>
                <Text style={styles.userName}>Alex Mercer</Text>
                <Text style={styles.userHandle}>@alexmercer</Text>
                <View style={styles.eliteBadge}>
                  <Award size={11} color="#AB4BFF" />
                  <Text style={styles.eliteText}>Elite</Text>
                </View>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              {[
                { label: "Following", value: "7" },
                { label: "Followers", value: "284" },
                { label: "Signals",   value: "12" },
              ].map((s) => (
                <View key={s.label}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Metapoint */}
            <View style={styles.mpRow}>
              <View style={styles.mpLeft}>
                <View style={styles.mpIcon}>
                  <Zap size={14} color="#AB4BFF" fill="#AB4BFF" />
                </View>
                <View>
                  <Text style={styles.mpLabel}>Metapoint Balance</Text>
                  <Text style={styles.mpValue}>{currentPoints.toLocaleString()} MP</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.earnBtn}>
                <Text style={styles.earnBtnText}>Earn More</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tier Progress */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.tierHeader}>
              <Text style={styles.cardTitle}>Tier Progress</Text>
              <View style={styles.legendBadge}>
                <Text style={styles.legendText}>{Math.round(progress)}% to Legend</Text>
              </View>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${Math.min(100, (currentTierIndex / (tiers.length - 1)) * 100 + (progress / (tiers.length - 1)))}%` as any }]} />
            </View>
            <View style={styles.tierDots}>
              {tiers.map((tier, i) => (
                <View key={tier.name} style={styles.tierDotItem}>
                  <View style={[styles.tierDot, {
                    backgroundColor: i <= currentTierIndex ? tier.color : 'rgba(255,255,255,0.1)',
                  }]} />
                  <Text style={[styles.tierDotLabel, { color: i <= currentTierIndex ? tier.color : '#8899AA' }]}>
                    {tier.name}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.tierNote}>
              {nextTierPoints - currentPoints} MP needed for{' '}
              <Text style={{ color: '#2FEFC4', fontWeight: '700' }}>Legend</Text>
            </Text>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>View all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.badgesGrid}>
            {badges.map((badge) => (
              <View
                key={badge.label}
                style={[
                  styles.badgeCard,
                  !badge.unlocked && styles.badgeCardLocked,
                ]}
              >
                <View style={[styles.badgeIconWrap, {
                  backgroundColor: badge.unlocked ? `${badge.color}22` : 'transparent',
                }]}>
                  <badge.Icon
                    size={22}
                    color={badge.unlocked ? badge.color : '#8899AA'}
                    strokeWidth={1.5}
                  />
                </View>
                <Text style={[styles.badgeLabel, {
                  color: badge.unlocked ? badge.color : '#8899AA',
                }]}>
                  {badge.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          {settingsGroups.map((group) => (
            <View key={group.title} style={{ marginBottom: 16 }}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <View style={styles.settingsCard}>
                {group.items.map((item, i) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.settingsItem, i < group.items.length - 1 && styles.settingsItemBorder]}
                  >
                    <View style={styles.settingsIconWrap}>
                      <item.Icon size={15} color="#AB4BFF" />
                    </View>
                    <Text style={styles.settingsLabel}>{item.label}</Text>
                    <ChevronRight size={16} color="#8899AA" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => navigation?.navigate('Login')}
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

  statsRow: { flexDirection: 'row', gap: 24, marginBottom: 20 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: '#8899AA', marginTop: 2 },

  mpRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.2)',
  },
  mpLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mpIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(171,75,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  mpLabel: { fontSize: 11, color: '#8899AA' },
  mpValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
  earnBtn: {
    height: 34, paddingHorizontal: 14, borderRadius: 10,
    backgroundColor: '#AB4BFF', alignItems: 'center', justifyContent: 'center',
  },
  earnBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  seeAll: { fontSize: 13, color: '#AB4BFF', fontWeight: '600' },

  card: {
    padding: 20, borderRadius: 24,
    backgroundColor: 'rgba(14,20,57,0.85)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.15)',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  legendBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(47,239,196,0.1)' },
  legendText: { fontSize: 12, color: '#2FEFC4', fontWeight: '700' },
  progressBg: {
    height: 6, borderRadius: 3, marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  progressFill: {
    height: '100%', borderRadius: 3,
    backgroundColor: '#AB4BFF',
  },
  tierDots: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tierDotItem: { alignItems: 'center', width: '25%' },
  tierDot: { width: 12, height: 12, borderRadius: 6 },
  tierDotLabel: { fontSize: 9, fontWeight: '700', marginTop: 4 },
  tierNote: { fontSize: 12, color: '#8899AA' },

  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCard: {
    width: '30%', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8,
    borderRadius: 18, backgroundColor: 'rgba(171,75,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(171,75,255,0.35)',
  },
  badgeCardLocked: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.06)',
    opacity: 0.45,
  },
  badgeIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  badgeLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },

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

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 18,
    backgroundColor: 'rgba(255,75,110,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,75,110,0.2)',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#FF4B6E' },
});